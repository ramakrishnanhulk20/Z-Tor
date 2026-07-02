import { encodeAbiParameters, decodeAbiParameters } from "viem";
import type { PublicClient } from "viem";
import { groth16VerifierAbi } from "@/config/contracts";
import type { MerklePath } from "@/lib/poseidon";

const WASM_PATH = "/zk/withdraw.wasm";
const ZKEY_PATH = "/zk/withdraw_final.zkey";
const MANIFEST_PATH = "/zk/manifest.json";

/** Only the files the browser prover loads — skip verification_key.json (ops/diagnostic). */
const PROVING_FILES = ["withdraw.wasm", "withdraw_final.zkey"] as const;

type ZkManifest = {
  files: Record<string, string>;
};

async function sha256Hex(data: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

async function verifyProvingAssets(): Promise<boolean> {
  try {
    const manifestRes = await fetch(MANIFEST_PATH);
    if (!manifestRes.ok) return false;
    const manifest = (await manifestRes.json()) as ZkManifest;

    for (const file of PROVING_FILES) {
      const expected = manifest.files[file];
      if (!expected) return false;
      const res = await fetch(`/zk/${file}`);
      if (!res.ok) return false;
      const actual = await sha256Hex(await res.arrayBuffer());
      if (actual !== expected) {
        console.error(`zk asset integrity check failed for ${file}`);
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

export type WithdrawProofInput = {
  root: bigint;
  nullifierHash: bigint;
  recipient: `0x${string}`;
  /** Zero address + zero fee for self-submitted withdrawals. */
  relayer: `0x${string}`;
  fee: bigint;
  nullifier: bigint;
  secret: bigint;
  path: MerklePath;
};

const PROOF_ABI = [
  { type: "uint256[2]" },
  { type: "uint256[2][2]" },
  { type: "uint256[2]" },
] as const;

async function assetsAvailable(): Promise<boolean> {
  try {
    const [wasm, zkey] = await Promise.all([
      fetch(WASM_PATH, { method: "HEAD" }),
      fetch(ZKEY_PATH, { method: "HEAD" }),
    ]);
    if (!wasm.ok || !zkey.ok) return false;
    return verifyProvingAssets();
  } catch {
    return false;
  }
}

/**
 * Generates the Groth16 withdraw proof in the browser.
 * Requires proving assets in /public/zk (run build:circuit in contracts).
 */
export async function generateWithdrawProof(
  input: WithdrawProofInput,
): Promise<`0x${string}`> {
  if (!(await assetsAvailable())) {
    throw new Error(
      "Withdrawal proofs are not available. The site is missing ZK proving files. Contact the operator or rebuild with npm run build:circuit.",
    );
  }

  const snarkjs = await import("snarkjs");
  const { proof } = await snarkjs.groth16.fullProve(
    {
      root: input.root.toString(),
      nullifierHash: input.nullifierHash.toString(),
      recipient: BigInt(input.recipient).toString(),
      relayer: BigInt(input.relayer).toString(),
      fee: input.fee.toString(),
      nullifier: input.nullifier.toString(),
      secret: input.secret.toString(),
      pathElements: input.path.pathElements.map((e) => e.toString()),
      pathIndices: input.path.pathIndices,
    },
    WASM_PATH,
    ZKEY_PATH,
  );

  // snarkjs emits pi_b limbs in [c0, c1] order; the Solidity verifier expects [c1, c0].
  return encodeAbiParameters(PROOF_ABI, [
    [BigInt(proof.pi_a[0]), BigInt(proof.pi_a[1])],
    [
      [BigInt(proof.pi_b[0][1]), BigInt(proof.pi_b[0][0])],
      [BigInt(proof.pi_b[1][1]), BigInt(proof.pi_b[1][0])],
    ],
    [BigInt(proof.pi_c[0]), BigInt(proof.pi_c[1])],
  ]);
}

/** Local sanity check against the on-chain Groth16 verifier before hitting the relayer. */
export async function verifyWithdrawProofOnChain(
  client: PublicClient,
  verifierAddress: `0x${string}`,
  proof: `0x${string}`,
  root: bigint,
  nullifierHash: bigint,
  recipient: `0x${string}`,
  relayer: `0x${string}`,
  fee: bigint,
): Promise<boolean> {
  const [a, b, c] = decodeAbiParameters(
    [{ type: "uint256[2]" }, { type: "uint256[2][2]" }, { type: "uint256[2]" }],
    proof,
  );

  return client.readContract({
    address: verifierAddress,
    abi: groth16VerifierAbi,
    functionName: "verifyProof",
    args: [
      a as [bigint, bigint],
      b as [[bigint, bigint], [bigint, bigint]],
      c as [bigint, bigint],
      [root, nullifierHash, BigInt(recipient), BigInt(relayer), fee],
    ],
  });
}
