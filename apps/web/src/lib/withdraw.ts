import type { PublicClient } from "viem";
import { DEPLOY_BLOCK, TREE_LEVELS, poolAbi } from "@/config/contracts";
import { LEGACY_POOL_ADDRESSES } from "@/config/legacy-pools";
import { computeCommitment, computeNullifierHash, type ParsedNote } from "@/lib/note";
import { MerkleTree, getPoseidon, toBytes32, type MerklePath } from "@/lib/poseidon";

const LOG_CHUNK_BLOCKS = 49_000n;

const depositEvent = poolAbi.find(
  (item) => item.type === "event" && item.name === "Deposit",
);

/** Paginate eth_getLogs — many public RPCs reject wide archive ranges. */
export async function fetchDepositLogs(
  client: PublicClient,
  poolAddress: `0x${string}`,
  fromBlock: bigint = DEPLOY_BLOCK,
) {
  if (!depositEvent) throw new Error("Deposit event missing from pool ABI");

  const latest = await client.getBlockNumber();
  const start = fromBlock > latest ? latest : fromBlock;
  const logs: Awaited<ReturnType<PublicClient["getLogs"]>> = [];

  for (let from = start; from <= latest; from += LOG_CHUNK_BLOCKS) {
    const to = from + LOG_CHUNK_BLOCKS - 1n > latest ? latest : from + LOG_CHUNK_BLOCKS - 1n;
    const chunk = await client.getLogs({
      address: poolAddress,
      event: depositEvent as never,
      fromBlock: from,
      toBlock: to,
    });
    logs.push(...chunk);
  }

  return logs;
}

/** Insert leaves by on-chain leafIndex order (not sparse-array iteration). */
export function buildMerkleTreeFromDeposits(
  logs: Awaited<ReturnType<typeof fetchDepositLogs>>,
  poseidon: Awaited<ReturnType<typeof getPoseidon>>,
): MerkleTree {
  const byIndex = new Map<number, bigint>();
  let maxIndex = -1;

  for (const log of logs) {
    const args = (log as unknown as { args: { commitment: `0x${string}`; leafIndex: number } })
      .args;
    const idx = Number(args.leafIndex);
    byIndex.set(idx, BigInt(args.commitment));
    maxIndex = Math.max(maxIndex, idx);
  }

  const tree = new MerkleTree(TREE_LEVELS, poseidon);
  for (let i = 0; i <= maxIndex; i++) {
    const leaf = byIndex.get(i);
    if (leaf === undefined) {
      throw new Error(`Missing Deposit event for leaf index ${i}`);
    }
    tree.insert(leaf);
  }
  return tree;
}

export type WithdrawPreparation =
  | { kind: "not-found" }
  | { kind: "legacy-pool" }
  | { kind: "spent" }
  | { kind: "out-of-sync" }
  | { kind: "waiting"; readyAt: number }
  | {
      kind: "ready";
      root: bigint;
      nullifierHash: bigint;
      path: MerklePath;
    };

/**
 * Rebuilds the pool's Merkle tree from Deposit events and checks whether the
 * note can be withdrawn yet. Everything secret stays in the browser.
 */
export async function prepareWithdraw(
  client: PublicClient,
  poolAddress: `0x${string}`,
  note: ParsedNote,
): Promise<WithdrawPreparation> {
  const [commitment, nullifierHash] = await Promise.all([
    computeCommitment(note.nullifier, note.secret),
    computeNullifierHash(note.nullifier),
  ]);

  const spent = await client.readContract({
    address: poolAddress,
    abi: poolAbi,
    functionName: "nullifierHashes",
    args: [toBytes32(nullifierHash)],
  });
  if (spent) return { kind: "spent" };

  let logs;
  try {
    logs = await fetchDepositLogs(client, poolAddress);
  } catch {
    return { kind: "out-of-sync" };
  }

  const poseidon = await getPoseidon();
  let tree: MerkleTree;
  try {
    tree = buildMerkleTreeFromDeposits(logs, poseidon);
  } catch {
    return { kind: "out-of-sync" };
  }

  const [nextIndex, onChainRoot] = await Promise.all([
    client.readContract({
      address: poolAddress,
      abi: poolAbi,
      functionName: "nextIndex",
    }),
    client.readContract({
      address: poolAddress,
      abi: poolAbi,
      functionName: "getLastRoot",
    }),
  ]);

  const computedRoot = toBytes32(tree.root());
  if (Number(nextIndex) !== logs.length || onChainRoot !== computedRoot) {
    return { kind: "out-of-sync" };
  }

  const index = tree.indexOf(commitment);
  if (index === -1) {
    const legacy = await noteOnLegacyPool(client, note.poolId, commitment);
    return legacy ? { kind: "legacy-pool" } : { kind: "not-found" };
  }

  const root = tree.root();
  const rootKnown = await client.readContract({
    address: poolAddress,
    abi: poolAbi,
    functionName: "isKnownRoot",
    args: [toBytes32(root)],
  });
  if (!rootKnown) return { kind: "out-of-sync" };

  const [rootTimestamp, delay, latestBlock] = await Promise.all([
    client.readContract({
      address: poolAddress,
      abi: poolAbi,
      functionName: "rootTimestamps",
      args: [toBytes32(root)],
    }),
    client.readContract({
      address: poolAddress,
      abi: poolAbi,
      functionName: "anonymityDelay",
    }),
    client.getBlock(),
  ]);

  const readyAt = Number(rootTimestamp + delay);
  if (Number(latestBlock.timestamp) < readyAt) {
    return { kind: "waiting", readyAt };
  }

  return { kind: "ready", root, nullifierHash, path: tree.path(index) };
}

async function noteOnLegacyPool(
  client: PublicClient,
  poolId: string,
  commitment: bigint,
): Promise<boolean> {
  const legacy = LEGACY_POOL_ADDRESSES[poolId];
  if (!legacy?.length) return false;

  const depositEvent = poolAbi.find(
    (item) => item.type === "event" && item.name === "Deposit",
  );

  for (const address of legacy) {
    const logs = await client.getLogs({
      address,
      event: depositEvent as never,
      fromBlock: 0n,
      toBlock: "latest",
    });
    for (const log of logs) {
      const args = (log as unknown as { args: { commitment: `0x${string}` } }).args;
      if (BigInt(args.commitment) === commitment) return true;
    }
  }
  return false;
}
