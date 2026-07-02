import type { PublicClient } from "viem";
import { DEPLOY_BLOCK, TREE_LEVELS, poolAbi } from "@/config/contracts";
import { LEGACY_POOL_ADDRESSES } from "@/config/legacy-pools";
import { computeCommitment, computeNullifierHash, type ParsedNote } from "@/lib/note";
import { MerkleTree, getPoseidon, toBytes32, type MerklePath } from "@/lib/poseidon";

/** Most free Sepolia RPCs reject wide eth_getLogs ranges — keep chunks small. */
const LOG_CHUNK_BLOCKS = 2_000n;
const LOG_CHUNK_RETRIES = 3;
const LOG_FETCH_CONCURRENCY = 8;
const DEPOSIT_LOG_CACHE_TTL_MS = 60_000;

const depositEvent = poolAbi.find(
  (item) => item.type === "event" && item.name === "Deposit",
);

type DepositLog = Awaited<ReturnType<PublicClient["getLogs"]>>[number];

const depositLogCache = new Map<string, { at: number; logs: DepositLog[] }>();

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchLogChunk(
  client: PublicClient,
  poolAddress: `0x${string}`,
  fromBlock: bigint,
  toBlock: bigint,
): Promise<DepositLog[]> {
  if (!depositEvent) throw new Error("Deposit event missing from pool ABI");

  let lastErr: unknown;
  for (let attempt = 0; attempt < LOG_CHUNK_RETRIES; attempt++) {
    try {
      return await client.getLogs({
        address: poolAddress,
        event: depositEvent as never,
        fromBlock,
        toBlock,
      });
    } catch (err) {
      lastErr = err;
      if (attempt + 1 < LOG_CHUNK_RETRIES) {
        await sleep(400 * (attempt + 1));
      }
    }
  }
  throw lastErr;
}

/** Paginate eth_getLogs with small windows, parallel fetches, and retries. */
export async function fetchDepositLogs(
  client: PublicClient,
  poolAddress: `0x${string}`,
  fromBlock: bigint = DEPLOY_BLOCK,
) {
  const cacheKey = `${poolAddress.toLowerCase()}:${fromBlock.toString()}`;
  const cached = depositLogCache.get(cacheKey);
  if (cached && Date.now() - cached.at < DEPOSIT_LOG_CACHE_TTL_MS) {
    return cached.logs;
  }

  const latest = await client.getBlockNumber();
  const start = fromBlock > latest ? latest : fromBlock;
  const ranges: { from: bigint; to: bigint }[] = [];

  for (let from = start; from <= latest; from += LOG_CHUNK_BLOCKS) {
    const to = from + LOG_CHUNK_BLOCKS - 1n > latest ? latest : from + LOG_CHUNK_BLOCKS - 1n;
    ranges.push({ from, to });
  }

  const logs: DepositLog[] = [];
  for (let i = 0; i < ranges.length; i += LOG_FETCH_CONCURRENCY) {
    const batch = ranges.slice(i, i + LOG_FETCH_CONCURRENCY);
    const chunks = await Promise.all(
      batch.map(({ from, to }) => fetchLogChunk(client, poolAddress, from, to)),
    );
    for (const chunk of chunks) logs.push(...chunk);
  }

  const deduped = dedupeDepositLogs(logs);
  depositLogCache.set(cacheKey, { at: Date.now(), logs: deduped });
  return deduped;
}

export function dedupeDepositLogs(logs: DepositLog[]): DepositLog[] {
  const seen = new Set<string>();
  return logs.filter((log) => {
    const key = `${log.transactionHash}:${log.logIndex}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Insert leaves by on-chain leafIndex order (not sparse-array iteration). */
export function buildMerkleTreeFromDeposits(
  logs: DepositLog[],
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

export type PoolWitnessPayload = {
  root: `0x${string}`;
  pathElements: `0x${string}`[];
  pathIndices: number[];
  leafIndex: number;
};

export type PoolWitnessResult =
  | { status: "ok"; root: bigint; path: MerklePath; leafIndex: number }
  | { status: "not-found" }
  | { status: "out-of-sync" };

/** Rebuild the pool tree and locate a commitment (used by the server witness API). */
export async function resolvePoolWitness(
  client: PublicClient,
  poolAddress: `0x${string}`,
  commitment: bigint,
): Promise<PoolWitnessResult> {
  let logs: DepositLog[];
  try {
    logs = await fetchDepositLogs(client, poolAddress);
  } catch {
    return { status: "out-of-sync" };
  }

  const poseidon = await getPoseidon();
  let tree: MerkleTree;
  try {
    tree = buildMerkleTreeFromDeposits(logs, poseidon);
  } catch {
    return { status: "out-of-sync" };
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
    return { status: "out-of-sync" };
  }

  const leafIndex = tree.indexOf(commitment);
  if (leafIndex === -1) return { status: "not-found" };

  return {
    status: "ok",
    root: tree.root(),
    path: tree.path(leafIndex),
    leafIndex,
  };
}

export type ServerWitnessResult =
  | { ok: true; witness: PoolWitnessPayload }
  | { ok: false; error: string; retryable: boolean };

/** Browser helper — uses the server route (archive RPC) for the Merkle witness. */
export async function fetchServerWitness(
  poolAddress: `0x${string}`,
  commitment: bigint,
): Promise<ServerWitnessResult> {
  if (typeof window === "undefined") {
    return { ok: false, error: "Witness fetch is browser-only.", retryable: false };
  }

  try {
    const res = await fetch("/api/pool/witness", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        pool: poolAddress,
        commitment: toBytes32(commitment),
      }),
      signal: AbortSignal.timeout(55_000),
    });

    const body = (await res.json().catch(() => ({}))) as {
      error?: string;
      root?: `0x${string}`;
      pathElements?: `0x${string}`[];
      pathIndices?: number[];
      leafIndex?: number;
    };

    if (!res.ok) {
      return {
        ok: false,
        error: body.error ?? `Witness request failed (${res.status}).`,
        retryable: res.status === 503 || res.status === 504,
      };
    }

    if (!body.root || !body.pathElements || !body.pathIndices) {
      return { ok: false, error: "Witness response was incomplete.", retryable: true };
    }

    return {
      ok: true,
      witness: {
        root: body.root,
        pathElements: body.pathElements,
        pathIndices: body.pathIndices,
        leafIndex: body.leafIndex ?? 0,
      },
    };
  } catch (err) {
    const timedOut =
      err instanceof Error &&
      (err.name === "TimeoutError" || err.message.toLowerCase().includes("timeout"));
    return {
      ok: false,
      error: timedOut
        ? "Loading pool history timed out. Try again in a few seconds."
        : "Could not reach the witness service.",
      retryable: true,
    };
  }
}

export type WithdrawPreparation =
  | { kind: "not-found" }
  | { kind: "legacy-pool" }
  | { kind: "spent" }
  | { kind: "out-of-sync"; detail?: string }
  | { kind: "waiting"; readyAt: number }
  | {
      kind: "ready";
      root: bigint;
      nullifierHash: bigint;
      path: MerklePath;
    };

async function finalizeWithdrawPrep(
  client: PublicClient,
  poolAddress: `0x${string}`,
  root: bigint,
  nullifierHash: bigint,
  path: MerklePath,
): Promise<WithdrawPreparation> {
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

  return { kind: "ready", root, nullifierHash, path };
}

function witnessToPath(witness: PoolWitnessPayload): MerklePath {
  return {
    pathElements: witness.pathElements.map((x) => BigInt(x)),
    pathIndices: witness.pathIndices,
  };
}

/**
 * Rebuilds the pool's Merkle tree from Deposit events and checks whether the
 * note can be withdrawn yet. Secrets stay in the browser; only the commitment
 * hash is sent to the server witness route when needed.
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

  const server = await fetchServerWitness(poolAddress, commitment);
  if (server.ok) {
    return finalizeWithdrawPrep(
      client,
      poolAddress,
      BigInt(server.witness.root),
      nullifierHash,
      witnessToPath(server.witness),
    );
  }

  if (!server.retryable) {
    if (server.error.toLowerCase().includes("not found")) {
      const legacy = await noteOnLegacyPool(client, note.poolId, commitment);
      return legacy ? { kind: "legacy-pool" } : { kind: "not-found" };
    }
  }

  const resolved = await resolvePoolWitness(client, poolAddress, commitment);
  if (resolved.status === "ok") {
    return finalizeWithdrawPrep(
      client,
      poolAddress,
      resolved.root,
      nullifierHash,
      resolved.path,
    );
  }

  if (resolved.status === "not-found") {
    const legacy = await noteOnLegacyPool(client, note.poolId, commitment);
    return legacy ? { kind: "legacy-pool" } : { kind: "not-found" };
  }

  return {
    kind: "out-of-sync",
    detail: server.retryable ? server.error : undefined,
  };
}

/** User-facing detail when prepareWithdraw returns out-of-sync. */
export function outOfSyncWithdrawMessage(serverError?: string): string {
  const base =
    "Could not rebuild the pool Merkle tree from deposit events. Withdrawals need a complete deposit history.";
  if (serverError) {
    return `${base} Server: ${serverError} Ensure RPC_URL on Vercel is an archive-capable Sepolia endpoint (Alchemy/Infura), then refresh and retry.`;
  }
  return `${base} Set NEXT_PUBLIC_SEPOLIA_RPC_URL to an archive-capable Sepolia endpoint (Alchemy, Infura, etc.), refresh, and try again.`;
}

async function noteOnLegacyPool(
  client: PublicClient,
  poolId: string,
  commitment: bigint,
): Promise<boolean> {
  const legacy = LEGACY_POOL_ADDRESSES[poolId];
  if (!legacy?.length) return false;

  for (const address of legacy) {
    let logs: DepositLog[];
    try {
      logs = await fetchDepositLogs(client, address, 0n);
    } catch {
      continue;
    }
    for (const log of logs) {
      const args = (log as unknown as { args: { commitment: `0x${string}` } }).args;
      if (BigInt(args.commitment) === commitment) return true;
    }
  }
  return false;
}
