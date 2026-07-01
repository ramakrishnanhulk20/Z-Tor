/* eslint-disable no-console */
// Builds ZK circuit assets when missing (fresh clone / Codespaces).
// Wired as npm pretest so `npm test` runs all 41 tests without a manual step.

const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const WASM = path.join(ROOT, "circuits", "build", "withdraw_js", "withdraw.wasm");
const ZKEY = path.join(ROOT, "circuits", "build", "withdraw_final.zkey");

if (process.env.ZTOR_SKIP_CIRCUIT_BUILD === "1") {
  process.exit(0);
}

if (fs.existsSync(WASM) && fs.existsSync(ZKEY)) {
  process.exit(0);
}

console.log("ZK circuit assets missing — building (first run only, ~1–2 min)…");
execFileSync("node", [path.join(__dirname, "build-circuit.js")], {
  stdio: "inherit",
  cwd: ROOT,
});
