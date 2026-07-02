"use client";

import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { TARGET_CHAIN_ID } from "@/config/chains";

export function ConnectButton() {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  const wrongNetwork = isConnected && chain?.id !== TARGET_CHAIN_ID;
  const injected = connectors.find((c) => c.id === "injected") ?? connectors[0];

  if (!isConnected) {
    return (
      <button
        type="button"
        onClick={() => injected && connect({ connector: injected })}
        disabled={isPending || !injected}
        className="btn-primary !rounded-full !px-5 !py-2.5 text-xs font-semibold"
      >
        {isPending ? "Connecting…" : "Connect wallet"}
      </button>
    );
  }

  if (wrongNetwork) {
    return (
      <button
        type="button"
        onClick={() => switchChain({ chainId: TARGET_CHAIN_ID })}
        className="btn-coral !rounded-full !px-5 !py-2.5 text-xs font-semibold"
      >
        Switch to Sepolia
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="hidden rounded-full border border-line bg-paper px-3.5 py-2 font-mono text-xs text-ink-soft sm:inline">
        {address?.slice(0, 6)}…{address?.slice(-4)}
      </span>
      <button type="button" onClick={() => disconnect()} className="btn-secondary !rounded-full !px-5 !py-2.5 text-xs font-semibold">
        Disconnect
      </button>
    </div>
  );
}
