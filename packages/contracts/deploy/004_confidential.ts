import type { DeployFunction } from "hardhat-deploy/types";
import type { HardhatRuntimeEnvironment } from "hardhat/types";

const TREE_LEVELS = 20;
const ANONYMITY_DELAY_SECONDS = 600;

/** Zama official Sepolia confidential wrappers — docs.zama.org/protocol/protocol-apps/addresses/testnet/sepolia */
const SEPOLIA_C_USDC = "0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639";
const SEPOLIA_C_WETH = "0x46208622DA27d91db4f0393733C8BA082ed83158";

type PoolPlan = {
  id: string;
  asset: "WETH" | "USDC";
  /** Denomination in confidential-token units (6 decimals). */
  denomination: bigint;
};

const POOLS: PoolPlan[] = [
  { id: "eth-0.1", asset: "WETH", denomination: 100_000n },
  { id: "eth-1", asset: "WETH", denomination: 1_000_000n },
  { id: "usdc-100", asset: "USDC", denomination: 100_000_000n },
  { id: "usdc-1000", asset: "USDC", denomination: 1_000_000_000n },
];

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy, execute, read } = hre.deployments;

  const poseidon = await deploy("PoseidonT3", { from: deployer, log: true });

  const verifier = await deploy("Groth16Verifier", { from: deployer, log: true });
  const stats = await deploy("ZTorLiquidityStats", { from: deployer, log: true });
  const registry = await deploy("ZTorRegistry", { from: deployer, log: true });

  let cUsdc = SEPOLIA_C_USDC;
  let cWeth = SEPOLIA_C_WETH;
  if (hre.network.name !== "sepolia") {
    console.warn("Confidential Phase3 deploy expects Sepolia Zama wrappers");
  }

  const registeredIds: string[] = await read("ZTorRegistry", "allPoolIds");

  for (const pool of POOLS) {
    const deploymentName = `ZTorPool_${pool.id}`;
    const token = pool.asset === "WETH" ? cWeth : cUsdc;

    const deployed = await deploy(deploymentName, {
      contract: "ZTorConfidentialPool",
      from: deployer,
      log: true,
      reset: true,
      libraries: { PoseidonT3: poseidon.address },
      args: [
        verifier.address,
        stats.address,
        token,
        pool.denomination,
        ANONYMITY_DELAY_SECONDS,
        TREE_LEVELS,
      ],
    });

    if (registeredIds.includes(pool.id)) {
      await execute(
        "ZTorRegistry",
        { from: deployer, log: true },
        "setPool",
        pool.id,
        deployed.address,
      );
    } else {
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

  const factory = await deploy("ZTorPoolFactory", {
    from: deployer,
    log: true,
    reset: true,
    libraries: { PoseidonT3: poseidon.address },
    args: [
      registry.address,
      stats.address,
      verifier.address,
      cWeth,
      cUsdc,
      ANONYMITY_DELAY_SECONDS,
      TREE_LEVELS,
    ],
  });

  for (const registrarTarget of ["ZTorRegistry", "ZTorLiquidityStats"] as const) {
    const field = registrarTarget === "ZTorRegistry" ? "registrars" : "registrars";
    const isRegistrar: boolean = await read(registrarTarget, field, factory.address);
    if (!isRegistrar) {
      await execute(
        registrarTarget,
        { from: deployer, log: true },
        "setRegistrar",
        factory.address,
        true,
      );
    }
  }

  console.log("ZTorRegistry:", registry.address);
  console.log("ZTorLiquidityStats:", stats.address);
  console.log("ZTorPoolFactory:", factory.address);
  console.log("Verifier:", verifier.address);
};

export default func;
func.id = "deploy_ztor_phase3_confidential";
func.tags = ["Phase3"];
