"use client";

import { useReadContract } from "wagmi";
import { REGISTRY_ADDRESS, registryAbi } from "@/config/contracts";

function isUnknownPoolError(error: unknown): boolean {
  const msg =
    error && typeof error === "object" && "shortMessage" in error
      ? String((error as { shortMessage?: string }).shortMessage)
      : String(error);
  return msg.includes("UnknownPool") || msg.includes("Unknown pool");
}

export function usePoolAddress(poolId: string) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: REGISTRY_ADDRESS,
    abi: registryAbi,
    functionName: "poolFor",
    args: [poolId],
    query: { enabled: Boolean(REGISTRY_ADDRESS && poolId) },
  });

  const unknownPool = Boolean(error && isUnknownPoolError(error));
  const networkError = Boolean(error && !unknownPool);

  return {
    poolAddress: data as `0x${string}` | undefined,
    isLoading,
    notDeployed: !REGISTRY_ADDRESS || unknownPool,
    networkError,
    refetch,
  };
}
