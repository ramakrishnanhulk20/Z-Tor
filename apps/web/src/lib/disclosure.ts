import type { PublicClient } from "viem";
import { DEPLOY_BLOCK, poolAbi } from "@/config/contracts";
import type { PoolTier } from "@/config/pools";
import { computeCommitment, computeNullifierHash, type ParsedNote } from "@/lib/note";
import { toBytes32 } from "@/lib/poseidon";

export type DisclosureReport = {
  version: "ztor-disclosure-v1";
  generatedAt: string;
  network: { name: "sepolia"; chainId: 11155111 };
  pool: { id: string; label: string; address: `0x${string}` };
  commitment: `0x${string}`;
  nullifierHash: `0x${string}`;
  deposit: {
    txHash: `0x${string}`;
    blockNumber: number;
    timestamp: string;
    leafIndex: number;
    explorer: string;
  };
  withdrawal: {
    txHash: `0x${string}`;
    blockNumber: number;
    recipient: `0x${string}`;
    explorer: string;
  } | null;
  /**
   * Only present once the note is spent: revealing the preimage of a spent
   * note cannot move funds, but lets anyone recompute commitment and
   * nullifier hash and verify the deposit↔withdrawal link independently.
   */
  ownershipProof: {
    nullifier: `0x${string}`;
    secret: `0x${string}`;
    howToVerify: string;
  } | null;
  notice: string;
};

export type DisclosureResult =
  | { kind: "not-found" }
  | { kind: "ok"; report: DisclosureReport; spent: boolean };

const txUrl = (hash: string) => `https://sepolia.etherscan.io/tx/${hash}`;

/**
 * Builds a voluntary disclosure report for a note, entirely in the browser.
 * The full preimage is included only for spent notes (safe: the nullifier
 * is burned on-chain, so the report cannot be used to withdraw).
 */
export async function buildDisclosure(
  client: PublicClient,
  poolAddress: `0x${string}`,
  tier: PoolTier,
  note: ParsedNote,
): Promise<DisclosureResult> {
  const [commitment, nullifierHash] = await Promise.all([
    computeCommitment(note.nullifier, note.secret),
    computeNullifierHash(note.nullifier),
  ]);
  const commitmentHex = toBytes32(commitment);
  const nullifierHashHex = toBytes32(nullifierHash);

  const depositEvent = poolAbi.find(
    (item) => item.type === "event" && item.name === "Deposit",
  );
  const depositLogs = await client.getLogs({
    address: poolAddress,
    event: depositEvent as never,
    args: { commitment: commitmentHex } as never,
    fromBlock: DEPLOY_BLOCK,
    toBlock: "latest",
  });
  if (depositLogs.length === 0) return { kind: "not-found" };

  const dep = depositLogs[0] as unknown as {
    transactionHash: `0x${string}`;
    blockNumber: bigint;
    args: { leafIndex: number; timestamp: bigint };
  };

  const spent = await client.readContract({
    address: poolAddress,
    abi: poolAbi,
    functionName: "nullifierHashes",
    args: [nullifierHashHex],
  });

  let withdrawal: DisclosureReport["withdrawal"] = null;
  if (spent) {
    const withdrawalEvent = poolAbi.find(
      (item) => item.type === "event" && item.name === "Withdrawal",
    );
    const logs = await client.getLogs({
      address: poolAddress,
      event: withdrawalEvent as never,
      fromBlock: DEPLOY_BLOCK,
      toBlock: "latest",
    });
    const match = (
      logs as unknown as Array<{
        transactionHash: `0x${string}`;
        blockNumber: bigint;
        args: { recipient: `0x${string}`; nullifierHash: `0x${string}` };
      }>
    ).find((log) => log.args.nullifierHash.toLowerCase() === nullifierHashHex.toLowerCase());
    if (match) {
      withdrawal = {
        txHash: match.transactionHash,
        blockNumber: Number(match.blockNumber),
        recipient: match.args.recipient,
        explorer: txUrl(match.transactionHash),
      };
    }
  }

  const report: DisclosureReport = {
    version: "ztor-disclosure-v1",
    generatedAt: new Date().toISOString(),
    network: { name: "sepolia", chainId: 11155111 },
    pool: { id: tier.id, label: tier.label, address: poolAddress },
    commitment: commitmentHex,
    nullifierHash: nullifierHashHex,
    deposit: {
      txHash: dep.transactionHash,
      blockNumber: Number(dep.blockNumber),
      timestamp: new Date(Number(dep.args.timestamp) * 1000).toISOString(),
      leafIndex: dep.args.leafIndex,
      explorer: txUrl(dep.transactionHash),
    },
    withdrawal,
    ownershipProof: spent
      ? {
          nullifier: toBytes32(note.nullifier),
          secret: toBytes32(note.secret),
          howToVerify:
            "Check that Poseidon(nullifier, secret) equals `commitment` (present in the deposit transaction) and Poseidon(nullifier) equals `nullifierHash` (present in the withdrawal transaction).",
        }
      : null,
    notice: spent
      ? "This report links a specific deposit and withdrawal. It was generated voluntarily by the note holder and gives up the privacy of this one note only."
      : "This note has not been withdrawn yet, so the report documents the deposit only. The cryptographic ownership proof can be exported after withdrawal without risking the funds.",
  };

  return { kind: "ok", report, spent };
}
