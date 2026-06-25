#!/usr/bin/env node
/**
 * Verify on Etherscan API v2 using deploy-time standard JSON from hardhat-deploy metadata.
 * Usage: ETHERSCAN_API_KEY=... node scripts/verify-via-api.mjs
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { AbiCoder, getAddress } from "ethers";

const __dirname = dirname(fileURLToPath(import.meta.url));
const deployDir = join(__dirname, "../deployments/sepolia");
const apiKey = process.env.ETHERSCAN_API_KEY;
if (!apiKey) {
  console.error("Set ETHERSCAN_API_KEY");
  process.exit(1);
}

const TARGETS = [
  "ZTorRegistry",
  "Groth16Verifier",
  "PoseidonT3",
  "ZTorLiquidityStats",
  "ZTorPoolFactory",
  "ZTorPool_eth-0.1",
  "ZTorPool_eth-1",
  "ZTorPool_usdc-100",
  "ZTorPool_usdc-1000",
];

function load(name) {
  return JSON.parse(readFileSync(join(deployDir, `${name}.json`), "utf8"));
}

function standardInput(dep) {
  const hash = dep.solcInputHash;
  if (!hash) throw new Error(`Missing solcInputHash for ${dep.address}`);
  const input = JSON.parse(
    readFileSync(join(deployDir, "solcInputs", `${hash}.json`), "utf8"),
  );
  if (dep.libraries?.PoseidonT3) {
    input.settings.libraries = {
      "poseidon-solidity/PoseidonT3.sol": {
        PoseidonT3: dep.libraries.PoseidonT3,
      },
    };
  }
  return input;
}

function contractFqn(dep) {
  const meta = JSON.parse(dep.metadata);
  const [file, name] = Object.entries(meta.settings.compilationTarget)[0];
  return `${file}:${name}`;
}

function encodeConstructorArgs(args) {
  if (!args?.length) return "";
  const types = args.map((a) => {
    if (typeof a === "string" && a.startsWith("0x") && a.length === 42) return "address";
    if (typeof a === "number" && a <= 2 ** 32 - 1) return "uint32";
    return "uint256";
  });
  const values = args.map((a, i) => {
    if (types[i] === "address") return getAddress(a);
    if (types[i] === "uint32") return Number(a);
    return typeof a === "bigint" ? a : BigInt(a);
  });
  return AbiCoder.defaultAbiCoder().encode(types, values).slice(2);
}

async function poll(guid, name) {
  for (let i = 0; i < 24; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const q = new URLSearchParams({
      chainid: "11155111",
      module: "contract",
      action: "checkverifystatus",
      apikey: apiKey,
      guid,
    });
    const res = await fetch(`https://api.etherscan.io/v2/api?${q.toString()}`);
    const json = await res.json();
    const msg = json.result ?? json.message;
    console.log(`  [${name}] ${msg}`);
    if (typeof msg === "string" && (msg.includes("Pass") || msg.includes("Already Verified"))) return true;
    if (typeof msg === "string" && msg.includes("Fail")) return false;
  }
  return false;
}

function compilerParams(dep) {
  const meta = JSON.parse(dep.metadata);
  const version = meta.compiler?.version ?? "0.8.27+commit.40a35a09";
  const compilerversion = version.startsWith("v") ? version : `v${version}`;
  const opt = meta.settings.optimizer ?? { enabled: true, runs: 800 };
  return {
    compilerversion,
    optimizationUsed: opt.enabled ? "1" : "0",
    runs: String(opt.runs ?? 200),
  };
}

async function verify(name) {
  const dep = load(name);
  const params = new URLSearchParams({
    module: "contract",
    action: "verifysourcecode",
    apikey: apiKey,
    contractaddress: dep.address,
    codeformat: "solidity-standard-json-input",
    contractname: contractFqn(dep),
    sourceCode: JSON.stringify(standardInput(dep)),
    ...compilerParams(dep),
  });
  const ctor = encodeConstructorArgs(dep.args);
  if (ctor) params.set("constructorArguements", ctor);

  const res = await fetch(`https://api.etherscan.io/v2/api?chainid=11155111`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  const json = await res.json();
  console.log(`\n${name} (${dep.address})`);
  console.log(json.status, json.message, json.result ?? "");
  if (json.status === "1" && typeof json.result === "string") {
    return poll(json.result, name);
  }
  return false;
}

for (const name of TARGETS) {
  await verify(name);
  await new Promise((r) => setTimeout(r, 2000));
}
