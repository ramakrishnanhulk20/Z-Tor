import { FhevmType } from "@fhevm/hardhat-plugin";
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import type { ZTorLiquidityStats } from "../types";

type Fixture = {
  stats: ZTorLiquidityStats;
  address: string;
  owner: HardhatEthersSigner;
  pool: HardhatEthersSigner;
  outsider: HardhatEthersSigner;
};

async function deployFixture(): Promise<Fixture> {
  const [owner, pool, outsider] = await ethers.getSigners();
  const factory = await ethers.getContractFactory("ZTorLiquidityStats");
  const stats = (await factory.deploy()) as unknown as ZTorLiquidityStats;
  return { stats, address: await stats.getAddress(), owner, pool, outsider };
}

describe("ZTorLiquidityStats", function () {
  beforeEach(function () {
    if (!fhevm.isMock) {
      console.warn("ZTorLiquidityStats tests require the fhEVM mock");
      this.skip();
    }
  });

  it("rejects unregistered callers", async function () {
    const { stats, outsider } = await deployFixture();
    await expect(stats.connect(outsider).recordDeposit()).to.be.revertedWithCustomError(
      stats,
      "NotRegisteredPool",
    );
  });

  it("rejects duplicate pool registration and non-owner registration", async function () {
    const { stats, pool, outsider } = await deployFixture();
    await stats.registerPool(pool.address);
    await expect(stats.registerPool(pool.address)).to.be.revertedWithCustomError(
      stats,
      "AlreadyRegistered",
    );
    await expect(
      stats.connect(outsider).registerPool(outsider.address),
    ).to.be.revertedWithCustomError(stats, "UnauthorizedRegistrar");
  });

  it("lets a registrar register pools", async function () {
    const { stats, pool, outsider } = await deployFixture();
    await stats.setRegistrar(outsider.address, true);
    await expect(stats.connect(outsider).registerPool(pool.address)).to.emit(
      stats,
      "PoolRegistered",
    );
  });

  it("counts deposits and withdrawals encrypted, decryptable by owner", async function () {
    const { stats, address, owner, pool } = await deployFixture();
    await stats.registerPool(pool.address);

    await stats.connect(pool).recordDeposit();
    await stats.connect(pool).recordDeposit();

    let handle = await stats.activeNotes(pool.address);
    let clear = await fhevm.userDecryptEuint(FhevmType.euint32, handle, address, owner);
    expect(clear).to.eq(2);

    await stats.connect(pool).recordWithdraw();

    handle = await stats.activeNotes(pool.address);
    clear = await fhevm.userDecryptEuint(FhevmType.euint32, handle, address, owner);
    expect(clear).to.eq(1);
  });
});
