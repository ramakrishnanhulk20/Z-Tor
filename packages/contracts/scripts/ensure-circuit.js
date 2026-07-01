/* eslint-disable no-console */
// Ensures Groth16 proving assets exist before Hardhat tests.
// Fresh clones copy committed files from circuits/proving/ (no circom build needed).
// Falls back to build-circuit.js only when proving/ is missing and rebuild is required.

const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const BUILD = path.join(ROOT, "circuits", "build");
const WASM = path.join(BUILD, "withdraw_js", "withdraw.wasm");
const ZKEY = path.join(BUILD, "withdraw_final.zkey");
const PROVING = path.join(ROOT, "circuits", "proving");
const PROVING_WASM = path.join(PROVING, "withdraw_js", "withdraw.wasm");
const PROVING_ZKEY = path.join(PROVING, "withdraw_final.zkey");

if (process.env.ZTOR_SKIP_CIRCUIT_BUILD === "1") {
  process.exit(0);
}

function provingAssetsReady() {
  return fs.existsSync(WASM) && fs.existsSync(ZKEY);
}

function copyCommittedProvingAssets() {
  if (!fs.existsSync(PROVING_WASM) || !fs.existsSync(PROVING_ZKEY)) {
    return false;
  }

  fs.mkdirSync(path.dirname(WASM), { recursive: true });
  fs.copyFileSync(PROVING_WASM, WASM);
  fs.copyFileSync(PROVING_ZKEY, ZKEY);
  console.log("Using committed Groth16 proving assets (no circuit build needed).");
  return true;
}

if (provingAssetsReady()) {
  process.exit(0);
}

if (copyCommittedProvingAssets()) {
  process.exit(0);
}

console.log("ZK circuit assets missing — building (first run only, ~1–2 min)…");
execFileSync("node", [path.join(__dirname, "build-circuit.js")], {
  stdio: "inherit",
  cwd: ROOT,
});
