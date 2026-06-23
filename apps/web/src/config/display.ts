import type { PoolAsset } from "@/config/pools";

/** User-facing confidential token names (ERC-7984). */
export const CONFIDENTIAL_SYMBOL: Record<PoolAsset, string> = {
  ETH: "cWETH",
  USDC: "cUSDC",
};

export const NETWORK_LABEL = "Ethereum";

export function confidentialLabel(asset: PoolAsset): string {
  return CONFIDENTIAL_SYMBOL[asset];
}
