/** Zama official Sepolia addresses — docs.zama.org/protocol/protocol-apps/addresses/testnet/sepolia */

export const ZAMA_SEPOLIA = {
  cUsdc: "0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639" as const,
  underlyingUsdc: "0x9b5Cd13b8eFbB58Dc25A05CF411D8056058aDFfF" as const,
  cWeth: "0x46208622DA27d91db4f0393733C8BA082ed83158" as const,
  underlyingWeth: "0xff54739b16576FA5402F211D0b938469Ab9A5f3F" as const,
  wrappersRegistry: "0x2f0750Bbb0A246059d80e94c454586a7F27a128e" as const,
} as const;

/** WETH wrapper maps 18-decimal underlying to 6-decimal confidential units. */
export const WETH_CONFIDENTIAL_RATE = 1_000_000_000_000n;

export function confidentialWrapper(asset: "ETH" | "USDC"): `0x${string}` {
  return asset === "ETH" ? ZAMA_SEPOLIA.cWeth : ZAMA_SEPOLIA.cUsdc;
}

export function underlyingToken(asset: "ETH" | "USDC"): `0x${string}` {
  return asset === "ETH" ? ZAMA_SEPOLIA.underlyingWeth : ZAMA_SEPOLIA.underlyingUsdc;
}

export function toConfidentialUnits(asset: "ETH" | "USDC", underlyingAmount: bigint): bigint {
  return asset === "USDC" ? underlyingAmount : underlyingAmount / WETH_CONFIDENTIAL_RATE;
}
