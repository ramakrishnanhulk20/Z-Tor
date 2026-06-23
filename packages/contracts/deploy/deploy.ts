import type { DeployFunction } from "hardhat-deploy/types";
import type { HardhatRuntimeEnvironment } from "hardhat/types";

const TREE_LEVELS = 20;
const ANONYMITY_DELAY_SECONDS = 600;

/// Circle Sepolia USDC — see docs/POOLS.md.
const SEPOLIA_USDC = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

type PoolPlan = {
  id: string;
  asset: "ETH" | "USDC";
  denomination: bigint;
};

const POOLS: PoolPlan[] = [
  { id: "eth-0.1", asset: "ETH", denomination: 100_000_000_000_000_000n },
  { id: "eth-1", asset: "ETH", denomination: 1_000_000_000_000_000_000n },
  { id: "usdc-100", asset: "USDC", denomination: 100_000_000n },
  { id: "usdc-1000", asset: "USDC", denomination: 1_000_000_000n },
];

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy, execute, read } = hre.deployments;

  const poseidon = await deploy("PoseidonT3", { from: deployer, log: true });

  // Real Groth16 verifier once the circuit is built; mock until then.
  let verifierAddress: string;
  try {
    await hre.deployments.getArtifact("Groth16Verifier");
    const verifier = await deploy("Groth16Verifier", { from: deployer, log: true });
    verifierAddress = verifier.address;
  } catch {
    console.warn("Groth16Verifier artifact missing — deploying MockVerifier (NOT private, dev only)");
    const verifier = await deploy("MockVerifier", { from: deployer, log: true });
    verifierAddress = verifier.address;
  }

  const stats = await deploy("ZTorLiquidityStats", { from: deployer, log: true });
  const registry = await deploy("ZTorRegistry", { from: deployer, log: true });

  let usdcAddress: string;
  if (hre.network.name === "sepolia") {
    usdcAddress = process.env.SEPOLIA_USDC ?? SEPOLIA_USDC;
  } else {
    const mock = await deploy("MockUSDC", { from: deployer, log: true });
    usdcAddress = mock.address;
  }

  const registeredIds: string[] = await read("ZTorRegistry", "allPoolIds");

  for (const pool of POOLS) {
    const deploymentName = `ZTorPool_${pool.id}`;
    const isEth = pool.asset === "ETH";

    const deployed = await deploy(deploymentName, {
      contract: isEth ? "ZTorETHPool" : "ZTorERC20Pool",
      from: deployer,
      log: true,
      libraries: { PoseidonT3: poseidon.address },
      args: isEth
        ? [verifierAddress, stats.address, pool.denomination, ANONYMITY_DELAY_SECONDS, TREE_LEVELS]
        : [
            verifierAddress,
            stats.address,
            usdcAddress,
            pool.denomination,
            ANONYMITY_DELAY_SECONDS,
            TREE_LEVELS,
          ],
    });

    if (!registeredIds.includes(pool.id)) {
      await execute(
        "ZTorRegistry",
        { from: deployer, log: true },
        "register",
        pool.id,
        deployed.address,
      );
    }

    const isPoolRegistered: boolean = await read(
      "ZTorLiquidityStats",
      "registeredPools",
      deployed.address,
    );
    if (!isPoolRegistered) {
      await execute(
        "ZTorLiquidityStats",
        { from: deployer, log: true },
        "registerPool",
        deployed.address,
      );
    }

    console.log(`${pool.id}: ${deployed.address}`);
  }

  console.log("ZTorRegistry:", registry.address);
  console.log("ZTorLiquidityStats:", stats.address);
  console.log("Verifier:", verifierAddress);
};

export default func;
// Phase 2: relayer-aware withdraw (new circuit, verifier, pools, registry).
func.id = "deploy_ztor_phase2";
func.tags = ["Phase2"];
