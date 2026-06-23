"use client";

import { useCallback } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { useToast } from "@/components/toast/ToastProvider";
import { createTxTracker, trackRelayerWithdraw } from "@/lib/track-tx";

export function useTxToast() {
  const toast = useToast();
  const publicClient = usePublicClient();
  const { chain } = useAccount();

  const tracker = useCallback(() => {
    if (!publicClient) {
      throw new Error("Network client not ready.");
    }
    return createTxTracker(toast, publicClient, chain?.id);
  }, [toast, publicClient, chain?.id]);

  const relay = useCallback(
    async (opts: Parameters<typeof trackRelayerWithdraw>[3]) => {
      if (!publicClient) throw new Error("Network client not ready.");
      return trackRelayerWithdraw(toast, publicClient, chain?.id, opts);
    },
    [toast, publicClient, chain?.id],
  );

  return { toast, tracker, relay };
}
