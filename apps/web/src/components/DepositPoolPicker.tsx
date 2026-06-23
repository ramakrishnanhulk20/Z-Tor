"use client";

import { useMemo, useState } from "react";
import { usePublicClient, useWriteContract } from "wagmi";
import { AnonymityHint } from "@/components/AnonymityHint";
import {
  FACTORY_ADDRESS,
  factoryAbi,
} from "@/config/contracts";
import { confidentialLabel } from "@/config/display";
import {
  POOL_LIMITS,
  POOL_TIERS,
  type PoolAsset,
  type PoolTier,
} from "@/config/pools";
import { usePoolAddress } from "@/hooks/usePoolAddress";
import { useTxToast } from "@/hooks/useTxToast";
import { toConfidentialUnits } from "@/config/zama";
import {
  parseCustomAmount,
  tierFromCustom,
} from "@/lib/pools";

type Mode = "fixed" | "custom";

type Props = {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  pool: PoolTier;
  onPoolChange: (pool: PoolTier) => void;
  customAsset: PoolAsset;
  onCustomAssetChange: (asset: PoolAsset) => void;
  customAmount: string;
  onCustomAmountChange: (value: string) => void;
  disabled?: boolean;
  onPoolCreated?: () => void;
};

export function DepositPoolPicker({
  mode,
  onModeChange,
  pool,
  onPoolChange,
  customAsset,
  onCustomAssetChange,
  customAmount,
  onCustomAmountChange,
  disabled,
  onPoolCreated,
}: Props) {
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const { tracker } = useTxToast();
  const customWei = useMemo(
    () => (mode === "custom" ? parseCustomAmount(customAsset, customAmount) : null),
    [mode, customAsset, customAmount],
  );
  const customTier = customWei ? tierFromCustom(customAsset, customWei) : null;
  const activePool = mode === "fixed" ? pool : customTier ?? pool;
  const [createError, setCreateError] = useState<string>();

  const { poolAddress, notDeployed, networkError, isLoading, refetch } =
    usePoolAddress(activePool.id);

  const customAmountInvalid =
    mode === "custom" && customAmount.trim().length > 0 && customWei === null;

  const handleCreatePool = async () => {
    if (!customWei || !FACTORY_ADDRESS) return;
    setCreateError(undefined);
    try {
      const fn = customAsset === "ETH" ? "createEthPool" : "createUsdcPool";
      const tier = customTier ?? activePool;
      const tx = tracker();
      await tx.run(
        {
          pendingTitle: `Creating ${tier.label} pool`,
          pendingDetail: "One-time setup for this denomination.",
          successTitle: "Pool created",
          successDetail: "Anyone can deposit this amount now.",
          errorTitle: "Pool creation failed",
        },
        () =>
          writeContractAsync({
            address: FACTORY_ADDRESS!,
            abi: factoryAbi,
            functionName: fn,
            args: [toConfidentialUnits(customAsset, customWei)],
          }),
      );
      await refetch();
      onPoolCreated?.();
    } catch (err) {
      setCreateError(
        err instanceof Error && err.message.includes("User rejected")
          ? "Transaction was cancelled in your wallet."
          : "Could not create the pool. Please try again.",
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {(["fixed", "custom"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => onModeChange(m)}
            disabled={disabled}
            className={`rounded-xl border px-4 py-2 text-sm font-medium transition-colors duration-200 disabled:opacity-60 ${
              mode === m
                ? "border-coral bg-coral-soft text-ink"
                : "border-line bg-ivory text-muted hover:border-ink/30"
            }`}
          >
            {m === "fixed" ? "Fixed tiers" : "Custom amount"}
          </button>
        ))}
      </div>

      {mode === "fixed" ? (
        <div className="grid grid-cols-2 gap-3">
          {POOL_TIERS.map((tier) => {
            const selected = tier.id === pool.id;
            return (
              <button
                key={tier.id}
                type="button"
                onClick={() => onPoolChange(tier)}
                disabled={disabled}
                className={`rounded-xl border px-4 py-3 text-left transition-colors duration-200 disabled:opacity-60 ${
                  selected
                    ? "border-coral bg-coral-soft"
                    : "border-line bg-ivory hover:border-ink/30"
                }`}
              >
                <span className="block font-serif text-lg font-medium tracking-tight">
                  {tier.label}
                </span>
                <span className="mt-0.5 block text-xs text-muted">
                  {confidentialLabel(tier.asset)} pool
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs leading-relaxed text-muted">
            Choose any amount within the limits below. You&apos;ll create a new
            pool on first use. Privacy is weaker until others deposit the same
            amount.
          </p>
          <div className="flex gap-2">
            {(["ETH", "USDC"] as const).map((asset) => (
              <button
                key={asset}
                type="button"
                onClick={() => onCustomAssetChange(asset)}
                disabled={disabled}
                className={`rounded-xl border px-4 py-2 text-sm font-medium transition-colors duration-200 disabled:opacity-60 ${
                  customAsset === asset
                    ? "border-coral bg-coral-soft"
                    : "border-line bg-ivory text-muted"
                }`}
              >
                {confidentialLabel(asset)}
              </button>
            ))}
          </div>
          <label className="block space-y-2">
            <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
              Amount ({POOL_LIMITS[customAsset].minLabel}–{POOL_LIMITS[customAsset].maxLabel}{" "}
              {confidentialLabel(customAsset)})
            </span>
            <input
              value={customAmount}
              onChange={(e) => onCustomAmountChange(e.target.value)}
              placeholder={customAsset === "ETH" ? "0.25" : "50"}
              disabled={disabled}
              className="input-field"
            />
            {customAmountInvalid && (
              <p className="text-xs text-coral-dark">
                Enter a valid amount within the allowed range.
              </p>
            )}
          </label>
          {customTier && notDeployed && !isLoading && FACTORY_ADDRESS && (
            <div className="rounded-xl border border-coral/30 bg-coral-soft p-4 text-sm leading-relaxed text-ink-soft">
              <p>
                No pool exists for {customTier.label} yet. Create it once (small
                gas fee), then anyone can deposit that amount.
              </p>
              <button
                type="button"
                onClick={() => void handleCreatePool()}
                disabled={disabled}
                className="btn-primary mt-4"
              >
                Create {customTier.label} pool
              </button>
            </div>
          )}
          {customTier && notDeployed && !FACTORY_ADDRESS && (
            <p className="text-xs text-coral-dark">
              Custom pools are not available on this network yet.
            </p>
          )}
          {networkError && (
            <p className="text-xs text-coral-dark">
              Can&apos;t reach Ethereum right now. Check your connection and try again.
            </p>
          )}
          {createError && (
            <p className="text-xs text-coral-dark">{createError}</p>
          )}
        </div>
      )}

      {poolAddress && !notDeployed && (
        <AnonymityHint poolAddress={poolAddress} poolLabel={activePool.label} />
      )}
    </div>
  );
}

export function useActivePoolFromPicker(
  mode: "fixed" | "custom",
  pool: PoolTier,
  customAsset: PoolAsset,
  customAmount: string,
): PoolTier | null {
  return useMemo(() => {
    if (mode === "fixed") return pool;
    const wei = parseCustomAmount(customAsset, customAmount);
    return wei ? tierFromCustom(customAsset, wei) : null;
  }, [mode, pool, customAsset, customAmount]);
}
