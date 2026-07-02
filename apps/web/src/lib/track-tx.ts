import type { Hash, PublicClient } from "viem";
import type { ToastApi } from "@/components/toast/ToastProvider";
import { explorerTxUrl } from "@/lib/explorer";

export type TrackTxOptions = {
  pendingTitle: string;
  pendingDetail?: string;
  confirmTitle?: string;
  confirmDetail?: string;
  successTitle: string;
  successDetail?: string;
  errorTitle?: string;
};

export type TxTracker = {
  run: (opts: TrackTxOptions, execute: () => Promise<Hash>) => Promise<Hash>;
};

function isUserRejected(err: unknown): boolean {
  return err instanceof Error && err.message.includes("User rejected");
}

export function errorDetail(err: unknown): string {
  if (isUserRejected(err)) return "You declined the request in your wallet.";
  if (err instanceof Error) {
    if (err.message.includes("gas limit too high")) {
      return "Network rejected the gas limit. Try again, or switch RPC in settings.";
    }
    const revert = err.message.match(/reverted with the following reason:\s*([^\n]+)/i);
    if (revert?.[1]) return revert[1].trim();
    if (err.message.length > 180) return `${err.message.slice(0, 180)}…`;
    return err.message;
  }
  return "Something went wrong. Please try again.";
}

export function createTxTracker(
  toast: ToastApi,
  publicClient: PublicClient,
  chainId?: number,
): TxTracker {
  return {
    run: async (opts, execute) => {
      const id = toast.push({
        status: "pending",
        title: opts.pendingTitle,
        detail: opts.pendingDetail ?? "Confirm in your wallet.",
      });

      try {
        const hash = await execute();

        toast.update(id, {
          status: "pending",
          title: opts.confirmTitle ?? "Waiting for confirmation",
          detail: opts.confirmDetail ?? "Settling on-chain.",
        });

        await publicClient.waitForTransactionReceipt({ hash });

        toast.update(id, {
          status: "success",
          title: opts.successTitle,
          detail: opts.successDetail,
          href: explorerTxUrl(hash, chainId),
        });

        return hash;
      } catch (err) {
        toast.update(id, {
          status: "error",
          title: opts.errorTitle ?? (isUserRejected(err) ? "Transaction cancelled" : "Transaction failed"),
          detail: errorDetail(err),
        });
        throw err;
      }
    },
  };
}

export async function trackRelayerWithdraw(
  toast: ToastApi,
  publicClient: PublicClient,
  chainId: number | undefined,
  opts: {
    pendingTitle: string;
    successTitle: string;
    successDetail?: string;
    run: () => Promise<Hash>;
  },
): Promise<Hash> {
  const id = toast.push({
    status: "pending",
    title: opts.pendingTitle,
    detail: "Relaying through Z-Tor. No wallet gas needed.",
  });

  try {
    const hash = await opts.run();

    toast.update(id, {
      status: "pending",
      title: "Withdrawal settling",
      detail: "Waiting for on-chain confirmation.",
    });

    await publicClient.waitForTransactionReceipt({ hash });

    toast.update(id, {
      status: "success",
      title: opts.successTitle,
      detail: opts.successDetail,
      href: explorerTxUrl(hash, chainId),
    });

    return hash;
  } catch (err) {
    toast.update(id, {
      status: "error",
      title: "Withdrawal failed",
      detail: errorDetail(err),
    });
    throw err;
  }
}
