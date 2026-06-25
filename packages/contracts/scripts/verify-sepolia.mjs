#!/usr/bin/env node
/**
 * Verify Phase 3c Sepolia deployments via hardhat verify (Etherscan API v2).
 * Usage: ETHERSCAN_API_KEY=... node scripts/verify-sepolia.mjs
 */
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const libFile = join(__dirname, "verify-libraries.js");

function run(label, cmd) {
  console.log(`\n=== ${label} ===`);
  try {
    execSync(cmd, { stdio: "inherit", cwd: root, shell: true });
    console.log(`OK: ${label}`);
    return true;
  } catch {
    console.error(`FAILED: ${label}`);
    return false;
  }
}

const simple = [
  ["ZTorLiquidityStats", "contracts/ZTorLiquidityStats.sol:ZTorLiquidityStats", "0x11CD2af54025B3209F04b928BD7cA8c64D411e55"],
];

for (const [label, contract, address] of simple) {
  run(label, `npx hardhat verify --network sepolia --contract ${contract} ${address}`);
}

run(
  "ZTorPoolFactory",
  `npx hardhat verify --network sepolia --libraries ${libFile} --constructor-args ${join(__dirname, "verify-args-factory.js")} --contract contracts/ZTorPoolFactory.sol:ZTorPoolFactory 0x24c4E6dBe47AE08a87C4B7A53a29107CffD96E95`,
);

const pools = [
  ["ZTorPool_eth-0.1", "verify-args-eth-0.1.js", "0x3FE0Cdb67035ABF0953fbfA1f4032b0F43DB9636"],
  ["ZTorPool_eth-1", "verify-args-eth-1.js", "0x9144E1e56D4C592c3CF70b765AAbEb252E8C8417"],
  ["ZTorPool_usdc-100", "verify-args-usdc-100.js", "0x1993D693C6e1D59323be3935ABA5efc686343FCc"],
  ["ZTorPool_usdc-1000", "verify-args-usdc-1000.js", "0xEA8ef61Bc5B4989fd4c4205B73844d982a0b811b"],
];

for (const [label, argsFile, address] of pools) {
  run(
    label,
    `npx hardhat verify --network sepolia --libraries ${libFile} --constructor-args ${join(__dirname, argsFile)} --contract contracts/ZTorConfidentialPool.sol:ZTorConfidentialPool ${address}`,
  );
}

console.log("\nAlready verified: ZTorRegistry, Groth16Verifier, PoseidonT3");
