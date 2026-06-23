export type PoolAsset = "ETH" | "USDC";

export type PoolTier = {
  id: string;
  asset: PoolAsset;
  label: string;
  amount: string;
  /** Underlying ERC-20 amount used for wrap (18-dec WETH or 6-dec USDC). */
  amountWei: bigint;
  /** Fixed confidential-token units the pool expects (6 decimals). */
  confidentialAmount: bigint;
  decimals: number;
  /** True when created via the permissionless factory (custom denomination). */
  custom?: boolean;
};

import { toConfidentialUnits } from "@/config/zama";

const eth = (id: string, label: string, whole: string, wei: bigint): PoolTier => ({
  id,
  asset: "ETH",
  label,
  amount: whole,
  amountWei: wei,
  confidentialAmount: toConfidentialUnits("ETH", wei),
  decimals: 18,
});

const usdc = (id: string, label: string, whole: string, units: bigint): PoolTier => ({
  id,
  asset: "USDC",
  label,
  amount: whole,
  amountWei: units,
  confidentialAmount: toConfidentialUnits("USDC", units),
  decimals: 6,
});

export const POOL_TIERS: PoolTier[] = [
  eth("eth-0.1", "0.1 cWETH", "0.1", 100_000_000_000_000_000n),
  eth("eth-1", "1 cWETH", "1", 1_000_000_000_000_000_000n),
  usdc("usdc-100", "100 cUSDC", "100", 100_000_000n),
  usdc("usdc-1000", "1,000 cUSDC", "1000", 1_000_000_000n),
];

export const POOL_LIMITS = {
  ETH: {
    minWei: 10_000_000_000_000_000n, // 0.01 WETH underlying
    maxWei: 10_000_000_000_000_000_000n, // 10 WETH
    minConfidential: 10_000n,
    maxConfidential: 10_000_000n,
    minLabel: "0.01",
    maxLabel: "10",
  },
  USDC: {
    minWei: 1_000_000n,
    maxWei: 100_000_000_000n,
    minConfidential: 1_000_000n,
    maxConfidential: 100_000_000_000n,
    minLabel: "1",
    maxLabel: "100,000",
  },
} as const;

export const ANONYMITY_DELAY_SECONDS = 600;
