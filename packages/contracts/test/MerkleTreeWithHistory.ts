import { expect } from "chai";
import { ethers } from "hardhat";
import type { MerkleTreeMock } from "../types";
import {
  MerkleTree,
  ZERO_VALUE,
  createNoteData,
  getPoseidon,
  toBytes32,
} from "./utils/merkle";

const LEVELS = 6;

async function deployTree(levels: number): Promise<MerkleTreeMock> {
  const poseidonFactory = await ethers.getContractFactory("PoseidonT3");
  const poseidonLib = await poseidonFactory.deploy();
  const factory = await ethers.getContractFactory("MerkleTreeMock", {
    libraries: { PoseidonT3: await poseidonLib.getAddress() },
  });
  return (await factory.deploy(levels)) as unknown as MerkleTreeMock;
}

describe("MerkleTreeWithHistory", function () {
  it("computes the same initial root as the reference tree", async function () {
    const contract = await deployTree(LEVELS);
    const reference = new MerkleTree(LEVELS, await getPoseidon());
    expect(await contract.getLastRoot()).to.eq(toBytes32(reference.root()));
    expect(await contract.zeros(0)).to.eq(toBytes32(ZERO_VALUE));
  });

  it("matches the reference tree across several inserts", async function () {
    const contract = await deployTree(LEVELS);
    const reference = new MerkleTree(LEVELS, await getPoseidon());

    for (let i = 0; i < 5; i++) {
      const note = await createNoteData();
      await contract.insert(toBytes32(note.commitment));
      reference.insert(note.commitment);
      expect(await contract.getLastRoot()).to.eq(toBytes32(reference.root()));
    }
  });

  it("remembers recent roots and rejects unknown ones", async function () {
    const contract = await deployTree(LEVELS);
    const firstRoot = await contract.getLastRoot();

    const note = await createNoteData();
    await contract.insert(toBytes32(note.commitment));

    expect(await contract.isKnownRoot(firstRoot)).to.eq(true);
    expect(await contract.isKnownRoot(await contract.getLastRoot())).to.eq(true);
    expect(await contract.isKnownRoot(ethers.ZeroHash)).to.eq(false);
    expect(await contract.isKnownRoot(toBytes32(123456789n))).to.eq(false);
  });

  it("rejects inserts once the tree is full", async function () {
    const contract = await deployTree(1);
    const a = await createNoteData();
    const b = await createNoteData();
    const c = await createNoteData();
    await contract.insert(toBytes32(a.commitment));
    await contract.insert(toBytes32(b.commitment));
    await expect(contract.insert(toBytes32(c.commitment))).to.be.revertedWithCustomError(
      contract,
      "MerkleTreeFull",
    );
  });
});
