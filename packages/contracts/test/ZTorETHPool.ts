import { time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import type { MockVerifier, ZTorETHPool } from "../types";
import { FIELD_SIZE, createNoteData, dummyProof, toBytes32 } from "./utils/merkle";

const DENOMINATION = ethers.parseEther("0.1");
const DELAY = 600;
const LEVELS = 20;

type Fixture = {
  pool: ZTorETHPool;
  verifier: MockVerifier;
};

async function deployFixture(): Promise<Fixture> {
  const poseidonFactory = await ethers.getContractFactory("PoseidonT3");
  const poseidonLib = await poseidonFactory.deploy();

  const verifierFactory = await ethers.getContractFactory("MockVerifier");
  const verifier = (await verifierFactory.deploy()) as unknown as MockVerifier;

  const poolFactory = await ethers.getContractFactory("ZTorETHPool", {
    libraries: { PoseidonT3: await poseidonLib.getAddress() },
  });
  const pool = (await poolFactory.deploy(
    await verifier.getAddress(),
    ethers.ZeroAddress,
    DENOMINATION,
    DELAY,
    LEVELS,
  )) as unknown as ZTorETHPool;

  return { pool, verifier };
}

describe("ZTorETHPool", function () {
  describe("deposit", function () {
    it("accepts the exact denomination and emits Deposit", async function () {
      const { pool } = await deployFixture();
      const note = await createNoteData();

      const tx = pool.deposit(toBytes32(note.commitment), { value: DENOMINATION });
      await expect(tx).to.emit(pool, "Deposit");
      expect(await ethers.provider.getBalance(await pool.getAddress())).to.eq(DENOMINATION);
      expect(await pool.commitments(toBytes32(note.commitment))).to.eq(true);
      expect(await pool.nextIndex()).to.eq(1);
    });

    it("rejects a wrong deposit amount", async function () {
      const { pool } = await deployFixture();
      const note = await createNoteData();
      await expect(
        pool.deposit(toBytes32(note.commitment), { value: DENOMINATION * 2n }),
      ).to.be.revertedWithCustomError(pool, "WrongDepositValue");
    });

    it("rejects a duplicate commitment", async function () {
      const { pool } = await deployFixture();
      const note = await createNoteData();
      await pool.deposit(toBytes32(note.commitment), { value: DENOMINATION });
      await expect(
        pool.deposit(toBytes32(note.commitment), { value: DENOMINATION }),
      ).to.be.revertedWithCustomError(pool, "CommitmentAlreadyUsed");
    });

    it("rejects commitments outside the field", async function () {
      const { pool } = await deployFixture();
      await expect(
        pool.deposit(toBytes32(FIELD_SIZE), { value: DENOMINATION }),
      ).to.be.revertedWithCustomError(pool, "CommitmentNotInField");
    });
  });

  describe("withdraw", function () {
    it("pays the recipient after the delay", async function () {
      const { pool } = await deployFixture();
      const [, , recipient] = await ethers.getSigners();
      const note = await createNoteData();

      await pool.deposit(toBytes32(note.commitment), { value: DENOMINATION });
      const root = await pool.getLastRoot();
      await time.increase(DELAY + 1);

      const before = await ethers.provider.getBalance(recipient.address);
      await expect(
        pool.withdraw(
          dummyProof(),
          root,
          toBytes32(note.nullifierHash),
          recipient.address,
          ethers.ZeroAddress,
          0n,
        ),
      )
        .to.emit(pool, "Withdrawal")
        .withArgs(recipient.address, toBytes32(note.nullifierHash), ethers.ZeroAddress, 0n);

      const after = await ethers.provider.getBalance(recipient.address);
      expect(after - before).to.eq(DENOMINATION);
      expect(await pool.nullifierHashes(toBytes32(note.nullifierHash))).to.eq(true);
    });

    it("pays the relayer fee and the recipient the remainder", async function () {
      const { pool } = await deployFixture();
      const [, , recipient, relayer] = await ethers.getSigners();
      const note = await createNoteData();
      const fee = DENOMINATION / 100n;

      await pool.deposit(toBytes32(note.commitment), { value: DENOMINATION });
      const root = await pool.getLastRoot();
      await time.increase(DELAY + 1);

      const recipientBefore = await ethers.provider.getBalance(recipient.address);
      const relayerBefore = await ethers.provider.getBalance(relayer.address);

      // Relayer submits; gas comes out of the relayer's own balance, so
      // assert its fee income via the pool payout to a third signer instead.
      const [, payer] = await ethers.getSigners();
      await pool
        .connect(payer)
        .withdraw(
          dummyProof(),
          root,
          toBytes32(note.nullifierHash),
          recipient.address,
          relayer.address,
          fee,
        );

      expect((await ethers.provider.getBalance(recipient.address)) - recipientBefore).to.eq(
        DENOMINATION - fee,
      );
      expect((await ethers.provider.getBalance(relayer.address)) - relayerBefore).to.eq(fee);
    });

    it("rejects a fee larger than the denomination", async function () {
      const { pool } = await deployFixture();
      const [, , recipient, relayer] = await ethers.getSigners();
      const note = await createNoteData();

      await pool.deposit(toBytes32(note.commitment), { value: DENOMINATION });
      const root = await pool.getLastRoot();
      await time.increase(DELAY + 1);

      await expect(
        pool.withdraw(
          dummyProof(),
          root,
          toBytes32(note.nullifierHash),
          recipient.address,
          relayer.address,
          DENOMINATION + 1n,
        ),
      ).to.be.revertedWithCustomError(pool, "FeeExceedsDenomination");
    });

    it("rejects a fee without a relayer", async function () {
      const { pool } = await deployFixture();
      const [, , recipient] = await ethers.getSigners();
      const note = await createNoteData();

      await pool.deposit(toBytes32(note.commitment), { value: DENOMINATION });
      const root = await pool.getLastRoot();
      await time.increase(DELAY + 1);

      await expect(
        pool.withdraw(
          dummyProof(),
          root,
          toBytes32(note.nullifierHash),
          recipient.address,
          ethers.ZeroAddress,
          1n,
        ),
      ).to.be.revertedWithCustomError(pool, "FeeWithoutRelayer");
    });

    it("rejects a withdrawal before the delay has passed", async function () {
      const { pool } = await deployFixture();
      const [, , recipient] = await ethers.getSigners();
      const note = await createNoteData();

      await pool.deposit(toBytes32(note.commitment), { value: DENOMINATION });
      const root = await pool.getLastRoot();

      await expect(
        pool.withdraw(
          dummyProof(),
          root,
          toBytes32(note.nullifierHash),
          recipient.address,
          ethers.ZeroAddress,
          0n,
        ),
      ).to.be.revertedWithCustomError(pool, "RootTooRecent");
    });

    it("rejects double-spends of the same nullifier", async function () {
      const { pool } = await deployFixture();
      const [, , recipient] = await ethers.getSigners();
      const note = await createNoteData();
      const second = await createNoteData();

      await pool.deposit(toBytes32(note.commitment), { value: DENOMINATION });
      await pool.deposit(toBytes32(second.commitment), { value: DENOMINATION });
      const root = await pool.getLastRoot();
      await time.increase(DELAY + 1);

      await pool.withdraw(
        dummyProof(),
        root,
        toBytes32(note.nullifierHash),
        recipient.address,
        ethers.ZeroAddress,
        0n,
      );
      await expect(
        pool.withdraw(
          dummyProof(),
          root,
          toBytes32(note.nullifierHash),
          recipient.address,
          ethers.ZeroAddress,
          0n,
        ),
      ).to.be.revertedWithCustomError(pool, "NoteAlreadySpent");
    });

    it("rejects an unknown root", async function () {
      const { pool } = await deployFixture();
      const [, , recipient] = await ethers.getSigners();
      const note = await createNoteData();

      await pool.deposit(toBytes32(note.commitment), { value: DENOMINATION });
      await time.increase(DELAY + 1);

      await expect(
        pool.withdraw(
          dummyProof(),
          toBytes32(42n),
          toBytes32(note.nullifierHash),
          recipient.address,
          ethers.ZeroAddress,
          0n,
        ),
      ).to.be.revertedWithCustomError(pool, "UnknownRoot");
    });

    it("rejects when the verifier says the proof is invalid", async function () {
      const { pool, verifier } = await deployFixture();
      const [, , recipient] = await ethers.getSigners();
      const note = await createNoteData();

      await pool.deposit(toBytes32(note.commitment), { value: DENOMINATION });
      const root = await pool.getLastRoot();
      await time.increase(DELAY + 1);
      await verifier.setResult(false);

      await expect(
        pool.withdraw(
          dummyProof(),
          root,
          toBytes32(note.nullifierHash),
          recipient.address,
          ethers.ZeroAddress,
          0n,
        ),
      ).to.be.revertedWithCustomError(pool, "InvalidProof");
    });
  });
});
