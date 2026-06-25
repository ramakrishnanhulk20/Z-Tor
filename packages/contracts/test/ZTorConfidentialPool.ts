import { FhevmType } from "@fhevm/hardhat-plugin";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import type {
  MockConfidentialToken,
  MockVerifier,
  ZTorConfidentialPool,
} from "../types";
import { createNoteData, dummyProof, toBytes32, type NoteData } from "./utils/merkle";

const DENOMINATION = 100_000_000n; // 100 cUSDC (6 decimals)
const DELAY = 600;
const LEVELS = 20;

// confidentialTransferAndCall has two overloads; pick the proof-bearing one.
const TRANSFER_AND_CALL = "confidentialTransferAndCall(address,bytes32,bytes,bytes)";

type Fixture = {
  pool: ZTorConfidentialPool;
  token: MockConfidentialToken;
  poolAddress: string;
  tokenAddress: string;
  verifier: MockVerifier;
  alice: HardhatEthersSigner;
  recipient: HardhatEthersSigner;
};

async function deployFixture(): Promise<Fixture> {
  const [, alice, recipient] = await ethers.getSigners();

  const poseidon = await (await ethers.getContractFactory("PoseidonT3")).deploy();
  const verifier = (await (
    await ethers.getContractFactory("MockVerifier")
  ).deploy()) as unknown as MockVerifier;
  const token = (await (
    await ethers.getContractFactory("MockConfidentialToken")
  ).deploy()) as unknown as MockConfidentialToken;

  const poolFactory = await ethers.getContractFactory("ZTorConfidentialPool", {
    libraries: { PoseidonT3: await poseidon.getAddress() },
  });
  const pool = (await poolFactory.deploy(
    await verifier.getAddress(),
    ethers.ZeroAddress, // stats not needed for these tests
    await token.getAddress(),
    DENOMINATION,
    DELAY,
    LEVELS,
  )) as unknown as ZTorConfidentialPool;

  return {
    pool,
    token,
    poolAddress: await pool.getAddress(),
    tokenAddress: await token.getAddress(),
    verifier,
    alice,
    recipient,
  };
}

function commitmentData(note: NoteData): string {
  return ethers.AbiCoder.defaultAbiCoder().encode(["bytes32"], [toBytes32(note.commitment)]);
}

/** Alice deposits `amount` confidential tokens, tagging the note commitment. */
async function depositPending(f: Fixture, note: NoteData, amount: bigint): Promise<void> {
  const enc = await fhevm
    .createEncryptedInput(f.tokenAddress, f.alice.address)
    .add64(amount)
    .encrypt();
  await f.token
    .connect(f.alice)
    [TRANSFER_AND_CALL](f.poolAddress, enc.handles[0], enc.inputProof, commitmentData(note));
}

/** Publicly decrypt the amount-check result and finalize the pending deposit. */
async function finalize(f: Fixture, note: NoteData) {
  const pending = await f.pool.pendingDeposits(toBytes32(note.commitment));
  const res = await fhevm.publicDecrypt([pending.acceptedHandle]);
  return f.pool.finalizeDeposit(
    toBytes32(note.commitment),
    res.abiEncodedClearValues,
    res.decryptionProof,
  );
}

async function decryptBalance(f: Fixture, who: HardhatEthersSigner): Promise<bigint> {
  const handle = await f.token.confidentialBalanceOf(who.address);
  return fhevm.userDecryptEuint(FhevmType.euint64, handle, f.tokenAddress, who);
}

describe("ZTorConfidentialPool", function () {
  beforeEach(function () {
    if (!fhevm.isMock) {
      console.warn("ZTorConfidentialPool tests require the fhEVM mock");
      this.skip();
    }
  });

  it("disables the bare deposit(bytes32) entrypoint", async function () {
    const f = await deployFixture();
    const note = await createNoteData();
    await expect(f.pool.deposit(toBytes32(note.commitment))).to.be.revertedWithCustomError(
      f.pool,
      "UseConfidentialDeposit",
    );
  });

  it("rejects the receiver hook from a non-token caller", async function () {
    const f = await deployFixture();
    const note = await createNoteData();
    await expect(
      f.pool.onConfidentialTransferReceived(
        f.alice.address,
        f.alice.address,
        ethers.ZeroHash,
        commitmentData(note),
      ),
    ).to.be.revertedWithCustomError(f.pool, "ZeroToken");
  });

  it("confirms an exact deposit, then withdraws the full amount to a fresh recipient", async function () {
    const f = await deployFixture();
    const note = await createNoteData();
    await f.token.mint(f.alice.address, DENOMINATION);

    await depositPending(f, note, DENOMINATION);

    // Pending, but not yet a live note.
    expect((await f.pool.pendingDeposits(toBytes32(note.commitment))).exists).to.eq(true);
    expect(await f.pool.commitments(toBytes32(note.commitment))).to.eq(false);

    await expect(finalize(f, note)).to.emit(f.pool, "Deposit");
    expect(await f.pool.commitments(toBytes32(note.commitment))).to.eq(true);
    expect((await f.pool.pendingDeposits(toBytes32(note.commitment))).exists).to.eq(false);

    const root = await f.pool.getLastRoot();
    await time.increase(DELAY + 1);
    await f.pool.withdraw(
      dummyProof(),
      root,
      toBytes32(note.nullifierHash),
      f.recipient.address,
      ethers.ZeroAddress,
      0n,
    );

    expect(await decryptBalance(f, f.recipient)).to.eq(DENOMINATION);
  });

  it("auto-refunds a wrong-amount deposit and rejects the finalize", async function () {
    const f = await deployFixture();
    const note = await createNoteData();
    await f.token.mint(f.alice.address, DENOMINATION * 2n);

    // Deposit half the denomination — should be refunded by the token.
    await depositPending(f, note, DENOMINATION / 2n);
    expect(await decryptBalance(f, f.alice)).to.eq(DENOMINATION * 2n);

    await expect(finalize(f, note)).to.emit(f.pool, "DepositRejected");
    expect(await f.pool.commitments(toBytes32(note.commitment))).to.eq(false);
  });

  it("reverts finalize for a commitment that was never deposited", async function () {
    const f = await deployFixture();
    const note = await createNoteData();
    await expect(
      f.pool.finalizeDeposit(toBytes32(note.commitment), "0x", "0x"),
    ).to.be.revertedWithCustomError(f.pool, "NoPendingDeposit");
  });

  it("rejects a second pending deposit for the same commitment", async function () {
    const f = await deployFixture();
    const note = await createNoteData();
    await f.token.mint(f.alice.address, DENOMINATION * 2n);

    await depositPending(f, note, DENOMINATION);
    await expect(depositPending(f, note, DENOMINATION)).to.be.revertedWithCustomError(
      f.pool,
      "CommitmentAlreadyPending",
    );
  });

  it("increments the encrypted active-note counter on finalize (with stats wired)", async function () {
    const [, alice, recipient] = await ethers.getSigners();
    const poseidon = await (await ethers.getContractFactory("PoseidonT3")).deploy();
    const verifier = (await (
      await ethers.getContractFactory("MockVerifier")
    ).deploy()) as unknown as MockVerifier;
    const token = (await (
      await ethers.getContractFactory("MockConfidentialToken")
    ).deploy()) as unknown as MockConfidentialToken;
    const stats = await (await ethers.getContractFactory("ZTorLiquidityStats")).deploy();

    const poolFactory = await ethers.getContractFactory("ZTorConfidentialPool", {
      libraries: { PoseidonT3: await poseidon.getAddress() },
    });
    const pool = (await poolFactory.deploy(
      await verifier.getAddress(),
      await stats.getAddress(),
      await token.getAddress(),
      DENOMINATION,
      DELAY,
      LEVELS,
    )) as unknown as ZTorConfidentialPool;
    const poolAddress = await pool.getAddress();
    await stats.registerPool(poolAddress);

    const f: Fixture = {
      pool,
      token,
      poolAddress,
      tokenAddress: await token.getAddress(),
      verifier,
      alice,
      recipient,
    };
    const note = await createNoteData();
    await token.mint(alice.address, DENOMINATION);

    await depositPending(f, note, DENOMINATION);
    await finalize(f, note);

    const handle = await stats.activeNotes(poolAddress);
    const count = await fhevm.publicDecryptEuint(FhevmType.euint32, handle);
    expect(count).to.eq(1n);
  });
});
