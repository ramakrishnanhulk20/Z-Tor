export const RELAYER_URL =
  process.env.NEXT_PUBLIC_RELAYER_URL ??
  (typeof window !== "undefined"
    ? `${window.location.origin}/api/relayer`
    : "http://localhost:8787");

export type RelayerInfo = {
  relayer: `0x${string}`;
  chainId: number;
  feeBasisPoints: number;
};

export function relayerFee(confidentialDenomination: bigint, feeBasisPoints: number): bigint {
  return (confidentialDenomination * BigInt(feeBasisPoints)) / 10_000n;
}

export async function fetchRelayerInfo(): Promise<RelayerInfo | null> {
  try {
    const res = await fetch(`${RELAYER_URL}/info`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const info = (await res.json()) as RelayerInfo;
    return info.chainId === 11155111 ? info : null;
  } catch {
    return null;
  }
}

export async function submitToRelayer(payload: {
  pool: `0x${string}`;
  proof: `0x${string}`;
  root: `0x${string}`;
  nullifierHash: `0x${string}`;
  recipient: `0x${string}`;
  fee: string;
}): Promise<{ txHash: `0x${string}` }> {
  const res = await fetch(`${RELAYER_URL}/relay`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = (await res.json()) as { txHash?: `0x${string}`; error?: string };
  if (!res.ok || !body.txHash) {
    throw new RelayerError(body.error ?? "The relayer rejected the withdrawal.");
  }
  return { txHash: body.txHash };
}

/** Carries a user-presentable message from the relayer service. */
export class RelayerError extends Error {}
