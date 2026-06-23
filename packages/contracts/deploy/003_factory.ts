import type { DeployFunction } from "hardhat-deploy/types";
import type { HardhatRuntimeEnvironment } from "hardhat/types";

const SEPOLIA_C_USDC = "0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639";
const SEPOLIA_C_WETH = "0x46208622DA27d91db4f0393733C8BA082ed83158";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy, execute, read, get } = hre.deployments;

  const registry = await get("ZTorRegistry");
  const stats = await get("ZTorLiquidityStats");
  const verifier = await get("Groth16Verifier");

  let cWeth = SEPOLIA_C_WETH;
  let cUsdc = SEPOLIA_C_USDC;
  if (hre.network.name !== "sepolia") {
    console.warn("Factory deploy expects Sepolia Zama confidential wrappers");
  }

  const poseidon = await get("PoseidonT3");

  const factory = await deploy("ZTorPoolFactory", {
    from: deployer,
    log: true,
    libraries: { PoseidonT3: poseidon.address },
    args: [
      registry.address,
      stats.address,
      verifier.address,
      cWeth,
      cUsdc,
      600,
      20,
    ],
  });

  const isRegistryRegistrar: boolean = await read(
    "ZTorRegistry",
    "registrars",
    factory.address,
  );
  if (!isRegistryRegistrar) {
    await execute(
      "ZTorRegistry",
      { from: deployer, log: true },
      "setRegistrar",
      factory.address,
      true,
    );
  }

  const isStatsRegistrar: boolean = await read(
    "ZTorLiquidityStats",
    "registrars",
    factory.address,
  );
  if (!isStatsRegistrar) {
    await execute(
      "ZTorLiquidityStats",
      { from: deployer, log: true },
      "setRegistrar",
      factory.address,
      true,
    );
  }

  console.log("ZTorPoolFactory:", factory.address);
};

export default func;
func.id = "deploy_ztor_factory";
func.tags = ["Factory"];
func.dependencies = ["Phase2"];
