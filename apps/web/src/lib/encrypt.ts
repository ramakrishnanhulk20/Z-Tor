import type { ZamaSDK } from "@zama-fhe/react-sdk";

export function bytesToHex(bytes: Uint8Array): `0x${string}` {
  return `0x${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
}

type EncryptedArgs = { handle: `0x${string}`; inputProof: `0x${string}` };

async function encryptAmount(
  sdk: ZamaSDK,
  tokenAddress: `0x${string}`,
  userAddress: `0x${string}`,
  confidentialAmount: bigint,
): Promise<EncryptedArgs> {
  const encrypted = await sdk.relayer.encrypt({
    values: [{ value: confidentialAmount, type: "euint64" }],
    contractAddress: tokenAddress,
    userAddress,
  });

  const rawHandle = encrypted.handles[0];
  const rawProof = encrypted.inputProof;
  if (!rawHandle || !rawProof) {
    throw new Error("FHE encryption failed. No handle returned.");
  }

  return {
    handle: bytesToHex(rawHandle),
    inputProof: bytesToHex(rawProof),
  };
}

/**
 * Encrypt for `confidentialTransferAndCall` — user calls the token directly,
 * so the proof must bind to the depositor wallet (same as Zama SDK transfers).
 */
export async function buildEncryptedTransferArgs(
  sdk: ZamaSDK,
  tokenAddress: `0x${string}`,
  userAddress: `0x${string}`,
  confidentialAmount: bigint,
): Promise<EncryptedArgs> {
  return encryptAmount(sdk, tokenAddress, userAddress, confidentialAmount);
}

/**
 * Encrypt for legacy pool-pull deposits where the pool contract calls
 * `confidentialTransferFrom` on the token (msg.sender = pool at verify time).
 */
export async function buildEncryptedDepositArgs(
  sdk: ZamaSDK,
  tokenAddress: `0x${string}`,
  poolAddress: `0x${string}`,
  confidentialAmount: bigint,
): Promise<EncryptedArgs> {
  return encryptAmount(sdk, tokenAddress, poolAddress, confidentialAmount);
}
