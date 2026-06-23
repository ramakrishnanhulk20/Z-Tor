import type { PublicClient } from "viem";
import { formatUnits, parseUnits } from "viem";
import { poolAbi } from "@/config/contracts";
import { toConfidentialUnits } from "@/config/zama";
import {
  POOL_LIMITS,
  POOL_TIERS,
  type PoolAsset,
  type PoolTier,
} from "@/config/pools";

export { POOL_LIMITS, POOL_TIERS, type PoolAsset, type PoolTier };

/** Pool ids for custom amounts: `eth-<confidential>` or `usdc-<confidential>`. */
export function customPoolId(asset: PoolAsset, confidentialAmount: bigint): string {
  const prefix = asset === "ETH" ? "eth" : "usdc";
  return `${prefix}-${confidentialAmount}`;
}

export function isFixedPoolId(poolId: string): boolean {
  return POOL_TIERS.some((t) => t.id === poolId);
}

export function isValidPoolId(poolId: string): boolean {
  if (isFixedPoolId(poolId)) return true;
  return /^(eth|usdc)-[0-9]+$/.test(poolId);
}

export function parseCustomAmount(asset: PoolAsset, input: string): bigint | null {
  const trimmed = input.trim();
  if (!trimmed || !/^\d+(\.\d+)?$/.test(trimmed)) return null;
  try {
    const decimals = asset === "ETH" ? 18 : 6;
    const wei = parseUnits(trimmed, decimals);
    const limits = POOL_LIMITS[asset];
    if (wei < limits.minWei || wei > limits.maxWei) return null;
    return wei;
  } catch {
    return null;
  }
}

/** Resolve tier metadata from a pool id without an on-chain read. */
export function poolTierFromId(poolId: string): PoolTier | null {
  const fixed = POOL_TIERS.find((t) => t.id === poolId);
  if (fixed) return fixed;
  if (!/^(eth|usdc)-[0-9]+$/.test(poolId)) return null;
  const asset: PoolAsset = poolId.startsWith("eth-") ? "ETH" : "USDC";
  const confidentialAmount = BigInt(poolId.split("-")[1]!);
  const amountWei =
    asset === "USDC"
      ? confidentialAmount
      : confidentialAmount * 1_000_000_000_000n;
  return tierFromCustom(asset, amountWei);
}

export function tierFromCustom(asset: PoolAsset, amountWei: bigint): PoolTier {
  const decimals = asset === "ETH" ? 18 : 6;
  const confidentialAmount = toConfidentialUnits(asset, amountWei);
  return {
    id: customPoolId(asset, confidentialAmount),
    asset,
    label: `${formatUnits(amountWei, decimals)} ${asset}`,
    amount: formatUnits(amountWei, decimals),
    amountWei,
    confidentialAmount,
    decimals,
    custom: true,
  };
}

export async function resolvePoolTier(
  client: PublicClient,
  poolId: string,
  poolAddress?: `0x${string}`,
): Promise<PoolTier | null> {
  const fixed = POOL_TIERS.find((t) => t.id === poolId);
  if (fixed) return fixed;
  if (!isValidPoolId(poolId)) return null;

  const asset: PoolAsset = poolId.startsWith("eth-") ? "ETH" : "USDC";
  const confidentialAmount = BigInt(poolId.split("-")[1]!);
  const amountWei =
    asset === "USDC"
      ? confidentialAmount
      : confidentialAmount * 1_000_000_000_000n;
  const tier = tierFromCustom(asset, amountWei);

  if (poolAddress) {
    const onChain = await client.readContract({
      address: poolAddress,
      abi: poolAbi,
      functionName: "denomination",
    });
    if (onChain !== confidentialAmount) return null;
  }

  return tier;
}
