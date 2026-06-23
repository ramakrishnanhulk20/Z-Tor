import { expect } from "chai";
import { ethers } from "hardhat";
import type {
  MockUSDC,
  MockVerifier,
  ZTorPoolFactory,
  ZTorRegistry,
} from "../types";

const DELAY = 600;
const LEVELS = 20;

async function deployFixture() {
  const poseidonFactory = await ethers.getContractFactory("PoseidonT3");
  const poseidonLib = await poseidonFactory.deploy();

  const verifierFactory = await ethers.getContractFactory("MockVerifier");
  const verifier = (await verifierFactory.deploy()) as unknown as MockVerifier;

  const statsFactory = await ethers.getContractFactory("ZTorLiquidityStats");
  const stats = await statsFactory.deploy();

  const registryFactory = await ethers.getContractFactory("ZTorRegistry");
  const registry = (await registryFactory.deploy()) as unknown as ZTorRegistry;

  const tokenFactory = await ethers.getContractFactory("MockUSDC");
  const token = (await tokenFactory.deploy()) as unknown as MockUSDC;

  const factoryFactory = await ethers.getContractFactory("ZTorPoolFactory", {
    libraries: { PoseidonT3: await poseidonLib.getAddress() },
  });
  const tokenAddr = await token.getAddress();
  const factory = (await factoryFactory.deploy(
    await registry.getAddress(),
    await stats.getAddress(),
    await verifier.getAddress(),
    tokenAddr,
    tokenAddr,
    DELAY,
    LEVELS,
  )) as unknown as ZTorPoolFactory;

  await registry.setRegistrar(await factory.getAddress(), true);
  await stats.setRegistrar(await factory.getAddress(), true);

  return { factory, registry, stats, token };
}

describe("ZTorPoolFactory", function () {
  it("creates an ETH pool and registers it", async function () {
    const { factory, registry } = await deployFixture();
    const denomination = 250_000n; // 0.25 WETH in confidential units

    const tx = await factory.createEthPool(denomination);
    await expect(tx).to.emit(factory, "PoolCreated");

    const poolId = "eth-250000";
    expect(await registry.poolExists(poolId)).to.eq(true);
    const poolAddress = await registry.poolFor(poolId);
    expect(poolAddress).to.properAddress;
    expect(await registry.allPoolIds()).to.include(poolId);
  });

  it("creates a USDC pool and registers it", async function () {
    const { factory, registry } = await deployFixture();
    const denomination = 50_000_000n; // 50 USDC

    await factory.createUsdcPool(denomination);
    const poolId = "usdc-50000000";
    expect(await registry.poolFor(poolId)).to.properAddress;
  });

  it("rejects duplicate pools and out-of-range denominations", async function () {
    const { factory } = await deployFixture();
    const denomination = 250_000n;

    await factory.createEthPool(denomination);
    await expect(factory.createEthPool(denomination)).to.be.revertedWithCustomError(
      factory,
      "PoolAlreadyExists",
    );
    await expect(factory.createEthPool(1_000n)).to.be.revertedWithCustomError(
      factory,
      "DenominationOutOfRange",
    );
    await expect(factory.createUsdcPool(100n)).to.be.revertedWithCustomError(
      factory,
      "DenominationOutOfRange",
    );
  });
});
