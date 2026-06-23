import { time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import type { MockUSDC, ZTorERC20Pool } from "../types";
import { createNoteData, dummyProof, toBytes32 } from "./utils/merkle";

const DENOMINATION = 100_000_000n; // 100 USDC, 6 decimals
const DELAY = 600;
const LEVELS = 20;

type Fixture = {
  pool: ZTorERC20Pool;
  token: MockUSDC;
};

async function deployFixture(): Promise<Fixture> {
  const poseidonFactory = await ethers.getContractFactory("PoseidonT3");
  const poseidonLib = await poseidonFactory.deploy();

  const verifierFactory = await ethers.getContractFactory("MockVerifier");
  const verifier = await verifierFactory.deploy();

  const tokenFactory = await ethers.getContractFactory("MockUSDC");
  const token = (await tokenFactory.deploy()) as unknown as MockUSDC;

  const poolFactory = await ethers.getContractFactory("ZTorERC20Pool", {
    libraries: { PoseidonT3: await poseidonLib.getAddress() },
  });
  const pool = (await poolFactory.deploy(
    await verifier.getAddress(),
    ethers.ZeroAddress,
    await token.getAddress(),
    DENOMINATION,
    DELAY,
    LEVELS,
  )) as unknown as ZTorERC20Pool;

  return { pool, token };
}

describe("ZTorERC20Pool", function () {
  it("pulls the exact token denomination on deposit", async function () {
    const { pool, token } = await deployFixture();
    const [depositor] = await ethers.getSigners();
    const note = await createNoteData();

    await token.mint(depositor.address, DENOMINATION);
    await token.approve(await pool.getAddress(), DENOMINATION);

    await expect(pool.deposit(toBytes32(note.commitment))).to.emit(pool, "Deposit");
    expect(await token.balanceOf(await pool.getAddress())).to.eq(DENOMINATION);
    expect(await token.balanceOf(depositor.address)).to.eq(0n);
  });

  it("rejects deposits that send ETH along", async function () {
    const { pool, token } = await deployFixture();
    const [depositor] = await ethers.getSigners();
    const note = await createNoteData();

    await token.mint(depositor.address, DENOMINATION);
    await token.approve(await pool.getAddress(), DENOMINATION);

    await expect(
      pool.deposit(toBytes32(note.commitment), { value: 1n }),
    ).to.be.revertedWithCustomError(pool, "EthNotAccepted");
  });

  it("rejects deposits without allowance", async function () {
    const { pool } = await deployFixture();
    const note = await createNoteData();
    await expect(pool.deposit(toBytes32(note.commitment))).to.be.reverted;
  });

  it("transfers tokens to the recipient on withdraw", async function () {
    const { pool, token } = await deployFixture();
    const [depositor, , recipient] = await ethers.getSigners();
    const note = await createNoteData();

    await token.mint(depositor.address, DENOMINATION);
    await token.approve(await pool.getAddress(), DENOMINATION);
    await pool.deposit(toBytes32(note.commitment));

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
    expect(await token.balanceOf(recipient.address)).to.eq(DENOMINATION);
    expect(await token.balanceOf(await pool.getAddress())).to.eq(0n);
  });

  it("pays the relayer fee in tokens", async function () {
    const { pool, token } = await deployFixture();
    const [depositor, , recipient, relayer] = await ethers.getSigners();
    const note = await createNoteData();
    const fee = DENOMINATION / 100n;

    await token.mint(depositor.address, DENOMINATION);
    await token.approve(await pool.getAddress(), DENOMINATION);
    await pool.deposit(toBytes32(note.commitment));

    const root = await pool.getLastRoot();
    await time.increase(DELAY + 1);

    await pool
      .connect(relayer)
      .withdraw(
        dummyProof(),
        root,
        toBytes32(note.nullifierHash),
        recipient.address,
        relayer.address,
        fee,
      );

    expect(await token.balanceOf(recipient.address)).to.eq(DENOMINATION - fee);
    expect(await token.balanceOf(relayer.address)).to.eq(fee);
    expect(await token.balanceOf(await pool.getAddress())).to.eq(0n);
  });
});
