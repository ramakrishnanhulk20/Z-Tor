"use client";

import { useEffect, useState } from "react";
import { useZamaSDK } from "@zama-fhe/react-sdk";
import { usePublicClient, useReadContract } from "wagmi";
import { PageShell } from "@/components/PageShell";
import { InfoBanner } from "@/components/ui/InfoBanner";
import { confidentialWrapperAbi, DEPLOY_BLOCK, poolAbi, statsAbi } from "@/config/contracts";
import { POOL_TIERS, type PoolTier } from "@/config/pools";
import { usePoolAddress } from "@/hooks/usePoolAddress";

const ZERO_HANDLE = `0x${"0".repeat(64)}`;

function EncryptedOnChain({ handle }: { handle: string }) {
  return (
    <div className="mt-2">
      <p className="text-sm font-medium text-ink">Encrypted on-chain</p>
      <details className="mt-2 group">
        <summary className="cursor-pointer list-none text-xs font-medium text-coral marker:content-none [&::-webkit-details-marker]:hidden">
          Show ciphertext handle
        </summary>
        <code className="mt-2 block break-all rounded-lg bg-paper px-2 py-1.5 font-mono text-[11px] text-ink-soft">
          {handle}
        </code>
      </details>
    </div>
  );
}

function PoolStatsCard({ tier }: { tier: PoolTier }) {
  const publicClient = usePublicClient();
  const sdk = useZamaSDK();
  const { poolAddress } = usePoolAddress(tier.id);
  const [depositCount, setDepositCount] = useState<number>();
  const [revealedNotes, setRevealedNotes] = useState<number>();
  const [revealing, setRevealing] = useState(false);
  const [revealError, setRevealError] = useState<string>();

  const { data: statsAddress } = useReadContract({
    address: poolAddress,
    abi: poolAbi,
    functionName: "stats",
    query: { enabled: Boolean(poolAddress) },
  });

  const { data: handle } = useReadContract({
    address: statsAddress,
    abi: statsAbi,
    functionName: "activeNotes",
    args: poolAddress ? [poolAddress] : undefined,
    query: { enabled: Boolean(statsAddress && poolAddress) },
  });

  const { data: tokenAddress } = useReadContract({
    address: poolAddress,
    abi: poolAbi,
    functionName: "token",
    query: { enabled: Boolean(poolAddress) },
  });

  const { data: poolBalanceHandle } = useReadContract({
    address: tokenAddress,
    abi: confidentialWrapperAbi,
    functionName: "confidentialBalanceOf",
    args: poolAddress ? [poolAddress] : undefined,
    query: { enabled: Boolean(tokenAddress && poolAddress) },
  });

  useEffect(() => {
    if (!publicClient || !poolAddress) return;
    let cancelled = false;
    const depositEvent = poolAbi.find(
      (item) => item.type === "event" && item.name === "Deposit",
    );
    publicClient
      .getLogs({
        address: poolAddress,
        event: depositEvent as never,
        fromBlock: DEPLOY_BLOCK,
        toBlock: "latest",
      })
      .then((logs) => {
        if (!cancelled) setDepositCount(logs.length);
      })
      .catch(() => {
        if (!cancelled) setDepositCount(undefined);
      });
    return () => {
      cancelled = true;
    };
  }, [publicClient, poolAddress]);

  const hasHandle = handle && handle !== ZERO_HANDLE;
  const hasPoolBalance = poolBalanceHandle && poolBalanceHandle !== ZERO_HANDLE;

  const revealNotes = async () => {
    if (!hasHandle) return;
    setRevealing(true);
    setRevealError(undefined);
    try {
      const result = await sdk.relayer.publicDecrypt([handle as `0x${string}`]);
      setRevealedNotes(Number(result.clearValues[handle as `0x${string}`]));
    } catch {
      setRevealError("Couldn't reveal right now. Try again.");
    } finally {
      setRevealing(false);
    }
  };

  return (
    <div className="gradient-ring glass-card p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xl font-semibold tracking-[-0.02em]">{tier.label}</p>
          <p className="mt-1 text-xs text-muted">{tier.asset} fixed pool</p>
        </div>
        <span className="rounded-full bg-ink/5 px-2.5 py-1 font-mono text-xs text-muted">
          {tier.id}
        </span>
      </div>

      <div className="mt-6 grid gap-4">
        <div className="rounded-xl border border-line bg-ivory/70 p-4">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
            Deposits (public count)
          </p>
          <p className="stat-value mt-2">
            {depositCount === undefined ? "…" : depositCount}
          </p>
        </div>
        <div className="rounded-xl border border-line bg-ivory/70 p-4">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
            Pool TVL (encrypted)
          </p>
          {hasPoolBalance ? (
            <EncryptedOnChain handle={poolBalanceHandle} />
          ) : (
            <p className="mt-2 text-sm text-muted">No balance yet</p>
          )}
        </div>
        <div className="rounded-xl border border-line bg-ivory/70 p-4">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
            Active notes (encrypted)
          </p>
          {hasHandle ? (
            <>
              <EncryptedOnChain handle={handle} />
              {revealedNotes === undefined ? (
                <button
                  type="button"
                  onClick={revealNotes}
                  disabled={revealing}
                  className="btn-secondary mt-3 !px-3 !py-1.5 text-xs"
                >
                  {revealing ? "Decrypting via Zama…" : "Reveal with FHE"}
                </button>
              ) : (
                <p className="stat-value mt-3">{revealedNotes} active</p>
              )}
              {revealError && (
                <p className="mt-2 text-xs text-coral-dark">{revealError}</p>
              )}
            </>
          ) : (
            <p className="mt-2 text-sm text-muted">No counter yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function StatsPage() {
  return (
    <PageShell
      wide
      flush
      title="Encrypted pool statistics"
      subtitle="Live fhEVM demo on Sepolia: deposit counts are public, but pool liquidity and active-note counters stay encrypted on-chain."
      eyebrow="FHE layer"
    >
      <InfoBanner tone="info" title="What you are seeing" className="mb-8">
        The hex strings are <strong className="font-medium text-ink">ciphertext handles</strong> read
        directly from Sepolia — not decrypted numbers. The contract updates them with homomorphic
        add/subtract without revealing values to observers.
      </InfoBanner>

      <div className="grid gap-5 sm:grid-cols-2">
        {POOL_TIERS.map((tier) => (
          <PoolStatsCard key={tier.id} tier={tier} />
        ))}
      </div>

      <div className="glass-card mt-10 grid gap-6 rounded-2xl border border-line/80 p-6 md:grid-cols-3 md:p-8">
        <div>
          <p className="font-medium text-ink">Public vs private</p>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            Anyone can count deposit events. Nobody can read encrypted TVL or active-note counters
            without authorized decryption keys.
          </p>
        </div>
        <div>
          <p className="font-medium text-ink">Why it matters</p>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            Timing attacks that guess pool liquidity become harder when balances stay encrypted
            on-chain.
          </p>
        </div>
        <div>
          <p className="font-medium text-ink">Scope</p>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            Decryption rights apply to aggregate stats only — never individual notes or deposits.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
