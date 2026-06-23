"use client";

import { useReadContract } from "wagmi";
import { poolAbi } from "@/config/contracts";

type Props = {
  poolAddress?: `0x${string}`;
  /** e.g. "100 cUSDC" — shown so users know which pool is counted */
  poolLabel?: string;
  compact?: boolean;
};

function privacyLabel(count: number): { headline: string; detail: string } {
  if (count <= 1) {
    return {
      headline: "Very low privacy right now",
      detail:
        "You are effectively alone in this pool. Wait for more deposits before withdrawing, or pick a busier fixed tier.",
    };
  }
  if (count <= 5) {
    return {
      headline: "Low privacy",
      detail:
        "Only a few deposits share this amount. Privacy improves as more people use the same pool.",
    };
  }
  if (count <= 20) {
    return {
      headline: "Moderate privacy",
      detail: "A growing anonymity set. Better, but still not as strong as the main fixed tiers.",
    };
  }
  return {
    headline: "Good privacy",
    detail: "Plenty of deposits in this pool to hide among.",
  };
}

export function AnonymityHint({ poolAddress, poolLabel, compact }: Props) {
  const { data: nextIndex, isLoading } = useReadContract({
    address: poolAddress,
    abi: poolAbi,
    functionName: "nextIndex",
    query: {
      enabled: Boolean(poolAddress),
      refetchInterval: 12_000,
    },
  });

  if (!poolAddress) return null;
  if (isLoading && nextIndex === undefined) {
    return (
      <p className="text-xs text-muted">Loading anonymity set for this pool…</p>
    );
  }
  if (nextIndex === undefined) return null;

  const count = Number(nextIndex);
  const { headline, detail } = privacyLabel(count);
  const scope = poolLabel ? `${poolLabel} pool` : "This pool";

  if (compact) {
    return (
      <p className="text-xs text-muted">
        <span className="font-medium text-ink">{count}</span> deposit
        {count === 1 ? "" : "s"} in {scope.toLowerCase()}. {headline.toLowerCase()}.
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-line bg-ivory p-4 text-sm leading-relaxed text-ink-soft">
      <p className="font-medium text-ink">
        Anonymity set ({scope}): {count} deposit{count === 1 ? "" : "s"}. {headline}
      </p>
      <p className="mt-2 text-xs">{detail}</p>
      <p className="mt-2 text-xs text-muted">
        Only successful deposits to this exact amount count. Other tiers and failed
        transactions are separate.
      </p>
    </div>
  );
}
