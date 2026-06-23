import type {
  Abi,
  Address,
  Hash,
  PublicClient,
  WalletClient,
} from "viem";

/** Max gas Alchemy accepts on Sepolia for eth_sendRawTransaction (~10M). */
export const FHE_GAS_CAP = 10_000_000n;
export const FHE_GAS_DEFAULT = 8_000_000n;
export const STANDARD_GAS_CAP = 2_000_000n;

type WriteParams = {
  walletClient: WalletClient;
  publicClient: PublicClient;
  account: Address;
  address: Address;
  abi: Abi;
  functionName: string;
  args: readonly unknown[];
  gasCap?: bigint;
};

function capGas(estimate: bigint, gasCap: bigint): bigint {
  const buffered = (estimate * 130n) / 100n + 100_000n;
  if (buffered > gasCap) return gasCap;
  if (buffered < 120_000n) {
    return gasCap >= FHE_GAS_CAP ? FHE_GAS_DEFAULT : 300_000n;
  }
  return buffered;
}

async function resolveGas(
  publicClient: PublicClient,
  account: Address,
  address: Address,
  abi: Abi,
  functionName: string,
  args: readonly unknown[],
  gasCap: bigint,
): Promise<bigint> {
  try {
    const estimate = await publicClient.estimateContractGas({
      account,
      address,
      abi,
      functionName,
      args,
    });
    return capGas(estimate, gasCap);
  } catch {
    return gasCap >= FHE_GAS_CAP ? FHE_GAS_DEFAULT : 300_000n;
  }
}

/**
 * Submit a contract write with an explicit gas limit so MetaMask / RPC never
 * fall back to block-gas-limit estimation (common for FHE txs).
 */
export async function writeWalletContract({
  walletClient,
  publicClient,
  account,
  address,
  abi,
  functionName,
  args,
  gasCap = STANDARD_GAS_CAP,
}: WriteParams): Promise<Hash> {
  const gas = await resolveGas(
    publicClient,
    account,
    address,
    abi,
    functionName,
    args,
    gasCap,
  );

  return walletClient.writeContract({
    account,
    chain: walletClient.chain,
    address,
    abi,
    functionName,
    args,
    gas,
  } as never);
}
