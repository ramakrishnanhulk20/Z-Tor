"use client";

import { useAccount } from "wagmi";
import { ConnectButton } from "@/components/ConnectButton";
import { NETWORK_LABEL } from "@/config/display";

export function ConnectWalletBanner() {
  const { isConnected } = useAccount();

  if (isConnected) return null;

  return (
    <div className="rounded-2xl border border-coral/25 bg-coral-soft p-6 md:p-7">
      <p className="headline-card text-coral-dark">Connect your wallet</p>
      <p className="mt-3 text-sm leading-relaxed text-ink-soft md:text-base">
        Z-Tor runs on {NETWORK_LABEL}. Connect a wallet to shield tokens,
        deposit into a pool, or withdraw with your secret note.
      </p>
      <div className="mt-5">
        <ConnectButton />
      </div>
    </div>
  );
}
