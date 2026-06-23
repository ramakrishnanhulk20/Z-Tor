import { time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { ethers } from "hardhat";
import type { ZTorETHPool } from "../types";
import { MerkleTree, createNoteData, getPoseidon, toBytes32 } from "./utils/merkle";

const DENOMINATION = ethers.parseEther("0.1");
const DELAY = 600;
const LEVELS = 20;

const WASM = join(__dirname, "..", "circuits", "build", "withdraw_js", "withdraw.wasm");
const ZKEY = join(__dirname, "..", "circuits", "build", "withdraw_final.zkey");

async function deployFixture(): Promise<ZTorETHPool> {
  const poseidonFactory = await ethers.getContractFactory("PoseidonT3");
  const poseidonLib = await poseidonFactory.deploy();

  const verifierFactory = await ethers.getContractFactory("Groth16Verifier");
  const verifier = await verifierFactory.deploy();

  const poolFactory = await ethers.getContractFactory("ZTorETHPool", {
    libraries: { PoseidonT3: await poseidonLib.getAddress() },
  });
  return (await poolFactory.deploy(
    await verifier.getAddress(),
    ethers.ZeroAddress,
    DENOMINATION,
    DELAY,
    LEVELS,
  )) as unknown as ZTorETHPool;
}

type ProofArgs = {
  proof: string;
  root: bigint;
  nullifierHash: bigint;
};

async function proveWithdraw(
  tree: MerkleTree,
  leafIndex: number,
  note: { nullifier: bigint; secret: bigint; nullifierHash: bigint },
  recipient: string,
  relayer = ethers.ZeroAddress,
  fee = 0n,
): Promise<ProofArgs> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const snarkjs = require("snarkjs");
  const { pathElements, pathIndices } = tree.path(leafIndex);

  const { proof } = await snarkjs.groth16.fullProve(
    {
      root: tree.root().toString(),
      nullifierHash: note.nullifierHash.toString(),
      recipient: BigInt(recipient).toString(),
      relayer: BigInt(relayer).toString(),
      fee: fee.toString(),
      nullifier: note.nullifier.toString(),
      secret: note.secret.toString(),
      pathElements: pathElements.map((e) => e.toString()),
      pathIndices,
    },
    WASM,
    ZKEY,
  );

  const coder = ethers.AbiCoder.defaultAbiCoder();
  const encoded = coder.encode(
    ["uint256[2]", "uint256[2][2]", "uint256[2]"],
    [
      [BigInt(proof.pi_a[0]), BigInt(proof.pi_a[1])],
      [
        [BigInt(proof.pi_b[0][1]), BigInt(proof.pi_b[0][0])],
        [BigInt(proof.pi_b[1][1]), BigInt(proof.pi_b[1][0])],
      ],
      [BigInt(proof.pi_c[0]), BigInt(proof.pi_c[1])],
    ],
  );

  return { proof: encoded, root: tree.root(), nullifierHash: note.nullifierHash };
}

describe("Withdraw with real Groth16 proof", function () {
  before(function () {
    if (!existsSync(WASM) || !existsSync(ZKEY)) {
      console.warn("circuit assets missing — run: node scripts/build-circuit.js");
      this.skip();
    }
  });

  it("withdraws with a valid proof and rejects a tampered recipient", async function () {
    this.timeout(120_000);

    const pool = await deployFixture();
    const [, , recipient, attacker] = await ethers.getSigners();
    const poseidon = await getPoseidon();
    const tree = new MerkleTree(LEVELS, poseidon);

    // Two deposits so the spent note hides among others.
    const note = await createNoteData();
    const decoy = await createNoteData();
    await pool.deposit(toBytes32(note.commitment), { value: DENOMINATION });
    tree.insert(note.commitment);
    await pool.deposit(toBytes32(decoy.commitment), { value: DENOMINATION });
    tree.insert(decoy.commitment);

    expect(await pool.isKnownRoot(toBytes32(tree.root()))).to.eq(true);
    await time.increase(DELAY + 1);

    const args = await proveWithdraw(tree, 0, note, recipient.address);

    // A valid proof bound to `recipient` must not pay `attacker`.
    await expect(
      pool.withdraw(
        args.proof,
        toBytes32(args.root),
        toBytes32(args.nullifierHash),
        attacker.address,
        ethers.ZeroAddress,
        0n,
      ),
    ).to.be.revertedWithCustomError(pool, "InvalidProof");

    const before = await ethers.provider.getBalance(recipient.address);
    await pool.withdraw(
      args.proof,
      toBytes32(args.root),
      toBytes32(args.nullifierHash),
      recipient.address,
      ethers.ZeroAddress,
      0n,
    );
    const after = await ethers.provider.getBalance(recipient.address);
    expect(after - before).to.eq(DENOMINATION);
  });

  it("pays a relayer fee and rejects a relayer raising its own fee", async function () {
    this.timeout(120_000);

    const pool = await deployFixture();
    const [, relayer, recipient] = await ethers.getSigners();
    const poseidon = await getPoseidon();
    const tree = new MerkleTree(LEVELS, poseidon);
    const fee = DENOMINATION / 100n;

    const note = await createNoteData();
    await pool.deposit(toBytes32(note.commitment), { value: DENOMINATION });
    tree.insert(note.commitment);
    await time.increase(DELAY + 1);

    const args = await proveWithdraw(tree, 0, note, recipient.address, relayer.address, fee);

    // The proof binds the fee — a greedy relayer cannot double it.
    await expect(
      pool
        .connect(relayer)
        .withdraw(
          args.proof,
          toBytes32(args.root),
          toBytes32(args.nullifierHash),
          recipient.address,
          relayer.address,
          fee * 2n,
        ),
    ).to.be.revertedWithCustomError(pool, "InvalidProof");

    // Nor can it pocket the payout by swapping itself in as recipient.
    await expect(
      pool
        .connect(relayer)
        .withdraw(
          args.proof,
          toBytes32(args.root),
          toBytes32(args.nullifierHash),
          relayer.address,
          relayer.address,
          fee,
        ),
    ).to.be.revertedWithCustomError(pool, "InvalidProof");

    const before = await ethers.provider.getBalance(recipient.address);
    await pool
      .connect(relayer)
      .withdraw(
        args.proof,
        toBytes32(args.root),
        toBytes32(args.nullifierHash),
        recipient.address,
        relayer.address,
        fee,
      );
    expect((await ethers.provider.getBalance(recipient.address)) - before).to.eq(
      DENOMINATION - fee,
    );
  });

  it("rejects a proof for a commitment that is not in the tree", async function () {
    this.timeout(120_000);

    const pool = await deployFixture();
    const [, , recipient] = await ethers.getSigners();
    const poseidon = await getPoseidon();

    const deposited = await createNoteData();
    await pool.deposit(toBytes32(deposited.commitment), { value: DENOMINATION });
    await time.increase(DELAY + 1);

    // Forge a tree that contains a commitment the pool never saw.
    const forged = await createNoteData();
    const forgedTree = new MerkleTree(LEVELS, poseidon);
    forgedTree.insert(forged.commitment);

    const args = await proveWithdraw(forgedTree, 0, forged, recipient.address);
    await expect(
      pool.withdraw(
        args.proof,
        toBytes32(args.root),
        toBytes32(args.nullifierHash),
        recipient.address,
        ethers.ZeroAddress,
        0n,
      ),
    ).to.be.revertedWithCustomError(pool, "UnknownRoot");
  });
});
