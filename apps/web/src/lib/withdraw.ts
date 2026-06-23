import type { PublicClient } from "viem";
import { DEPLOY_BLOCK, TREE_LEVELS, poolAbi } from "@/config/contracts";
import { LEGACY_POOL_ADDRESSES } from "@/config/legacy-pools";
import { computeCommitment, computeNullifierHash, type ParsedNote } from "@/lib/note";
import { MerkleTree, getPoseidon, toBytes32, type MerklePath } from "@/lib/poseidon";

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

  const depositEvent = poolAbi.find(
    (item) => item.type === "event" && item.name === "Deposit",
  );
  const logs = await client.getLogs({
    address: poolAddress,
    event: depositEvent as never,
    fromBlock: DEPLOY_BLOCK,
    toBlock: "latest",
  });

  const leaves: bigint[] = [];
  for (const log of logs) {
    const args = (log as unknown as { args: { commitment: `0x${string}`; leafIndex: number } })
      .args;
    leaves[Number(args.leafIndex)] = BigInt(args.commitment);
  }

  const poseidon = await getPoseidon();
  const tree = new MerkleTree(TREE_LEVELS, poseidon);
  for (const leaf of leaves) tree.insert(leaf);

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
