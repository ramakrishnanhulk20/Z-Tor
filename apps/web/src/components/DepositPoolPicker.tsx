"use client";

import { AnonymityHint } from "@/components/AnonymityHint";
import { confidentialLabel } from "@/config/display";
import { POOL_TIERS, type PoolTier } from "@/config/pools";
import { usePoolAddress } from "@/hooks/usePoolAddress";

type Props = {
  pool: PoolTier;
  onPoolChange: (pool: PoolTier) => void;
  disabled?: boolean;
};

export function DepositPoolPicker({ pool, onPoolChange, disabled }: Props) {
  const { poolAddress, networkError, isLoading } = usePoolAddress(pool.id);

  return (
    <div className="space-y-6">
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

      {networkError && (
        <p className="text-xs text-coral-dark">
          Can&apos;t reach Ethereum right now. Check your connection and try again.
        </p>
      )}

      {poolAddress && !isLoading && (
        <AnonymityHint poolAddress={poolAddress} poolLabel={pool.label} />
      )}
    </div>
  );
}
