import { expect } from "chai";
import { ethers } from "hardhat";
import type { ZTorRegistry } from "../types";

async function deployFixture(): Promise<ZTorRegistry> {
  const factory = await ethers.getContractFactory("ZTorRegistry");
  return (await factory.deploy()) as unknown as ZTorRegistry;
}

describe("ZTorRegistry", function () {
  it("registers and resolves pools", async function () {
    const registry = await deployFixture();
    const [, pool] = await ethers.getSigners();

    await expect(registry.register("eth-0.1", pool.address))
      .to.emit(registry, "PoolRegistered")
      .withArgs("eth-0.1", pool.address);

    expect(await registry.poolFor("eth-0.1")).to.eq(pool.address);
    expect(await registry.allPoolIds()).to.deep.eq(["eth-0.1"]);
  });

  it("rejects duplicates, zero addresses, and unknown lookups", async function () {
    const registry = await deployFixture();
    const [, pool] = await ethers.getSigners();

    await registry.register("eth-0.1", pool.address);
    await expect(registry.register("eth-0.1", pool.address)).to.be.revertedWithCustomError(
      registry,
      "PoolAlreadyRegistered",
    );
    await expect(registry.register("eth-1", ethers.ZeroAddress)).to.be.revertedWithCustomError(
      registry,
      "ZeroPool",
    );
    await expect(registry.poolFor("usdc-100")).to.be.revertedWithCustomError(
      registry,
      "UnknownPool",
    );
  });

  it("only lets the owner or a registrar register", async function () {
    const registry = await deployFixture();
    const [, pool, outsider] = await ethers.getSigners();
    await expect(
      registry.connect(outsider).register("eth-0.1", outsider.address),
    ).to.be.revertedWithCustomError(registry, "UnauthorizedRegistrar");

    await registry.setRegistrar(outsider.address, true);
    await expect(registry.connect(outsider).register("eth-0.1", pool.address))
      .to.emit(registry, "PoolRegistered")
      .withArgs("eth-0.1", pool.address);
  });
});
