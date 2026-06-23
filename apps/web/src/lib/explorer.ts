export function explorerTxUrl(
  hash: string,
  chainId?: number,
): string | undefined {
  if (chainId === 11155111) {
    return `https://sepolia.etherscan.io/tx/${hash}`;
  }
  return undefined;
}
