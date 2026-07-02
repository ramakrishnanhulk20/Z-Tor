"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatUnits, isAddress, zeroAddress } from "viem";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { AnonymityHint } from "@/components/AnonymityHint";
import { FlowSteps } from "@/components/FlowSteps";
import { PageShell } from "@/components/PageShell";
import { InfoBanner } from "@/components/ui/InfoBanner";
import { poolAbi } from "@/config/contracts";
import { confidentialLabel } from "@/config/display";
import { poolTierFromId } from "@/lib/pools";
import { usePoolAddress } from "@/hooks/usePoolAddress";
import { useTxToast } from "@/hooks/useTxToast";
import { formatCountdown, useCountdown } from "@/hooks/useCountdown";
import { explorerTxUrl } from "@/lib/explorer";
import { parseNote } from "@/lib/note";
import { toBytes32 } from "@/lib/poseidon";
import {
  RelayerError,
  fetchRelayerInfo,
  relayerFee,
  submitToRelayer,
  type RelayerInfo,
} from "@/lib/relayer";
import { prepareWithdraw } from "@/lib/withdraw";
import { generateWithdrawProof } from "@/lib/zk";
import { FHE_GAS_CAP, writeWalletContract } from "@/lib/wallet-write";

type Phase = "idle" | "scanning" | "proving" | "submitting" | "done";

const PROGRESS_STEPS = ["Check note", "Build proof", "Submit"] as const;

function progressIndex(phase: Phase): number {
  switch (phase) {
    case "scanning":
      return 0;
    case "proving":
      return 1;
    case "submitting":
      return 2;
    default:
      return 3;
  }
}

export default function WithdrawPage() {
  const [noteInput, setNoteInput] = useState("");
  const [recipient, setRecipient] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [statusMessage, setStatusMessage] = useState<string>();
  const [errorMessage, setErrorMessage] = useState<string>();
  const [txHash, setTxHash] = useState<string>();
  const [waitReadyAtMs, setWaitReadyAtMs] = useState<number>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isConnected, address, chain } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { toast, tracker, relay } = useTxToast();
  const waitCountdown = useCountdown(waitReadyAtMs);

  const [relayerInfo, setRelayerInfo] = useState<RelayerInfo | null>(null);
  const [useRelayer, setUseRelayer] = useState(true);
  useEffect(() => {
    void fetchRelayerInfo().then(setRelayerInfo);
  }, []);
  const relaying = useRelayer && relayerInfo !== null;

  const parsed = useMemo(() => parseNote(noteInput), [noteInput]);
  const pool = parsed ? poolTierFromId(parsed.poolId) ?? undefined : undefined;
  const { poolAddress, notDeployed, networkError } = usePoolAddress(parsed?.poolId ?? "");

  const noteLooksWrong = noteInput.trim().length > 0 && !parsed;
  const recipientOk = isAddress(recipient);
  const busy = phase === "scanning" || phase === "proving" || phase === "submitting";

  const handleNoteFile = async (file: File | undefined) => {
    if (!file) return;
    const text = await file.text();
    setNoteInput(text.trim());
    setWaitReadyAtMs(undefined);
    setErrorMessage(undefined);
  };

  const handleWithdraw = async () => {
    if (!parsed || !poolAddress || !publicClient || !recipientOk) return;
    setErrorMessage(undefined);
    setStatusMessage(undefined);
    setWaitReadyAtMs(undefined);

    try {
      setPhase("scanning");
      setStatusMessage("Checking your note against the pool…");
      const prep = await prepareWithdraw(publicClient, poolAddress, parsed);

      if (prep.kind === "legacy-pool") {
        setPhase("idle");
        toast.push({
          status: "error",
          title: "Note from an older version",
          detail: "This deposit is on a superseded pool contract.",
        });
        setErrorMessage(
          "This note is from an older Z-Tor deployment that cannot pay out on Sepolia. " +
            "Your deposit is still in that old pool contract, but withdrawal is not possible with the current pools. " +
            "Make a new deposit to get a fresh note on the current pools, then wait the privacy delay before withdrawing.",
        );
        return;
      }
      if (prep.kind === "not-found") {
        setPhase("idle");
        toast.push({
          status: "error",
          title: "Note not found",
          detail: "No deposit matches this note in the pool.",
        });
        setErrorMessage("No deposit was found for this note in the pool.");
        return;
      }
      if (prep.kind === "spent") {
        setPhase("idle");
        toast.push({
          status: "error",
          title: "Note already spent",
          detail: "This withdrawal key was used already.",
        });
        setErrorMessage("This note has already been withdrawn.");
        return;
      }
      if (prep.kind === "out-of-sync") {
        setPhase("idle");
        toast.push({
          status: "error",
          title: "Pool history incomplete",
          detail: "Your RPC may not have returned all deposit events.",
        });
        setErrorMessage(
          "Could not rebuild the pool Merkle tree from deposit events. This usually means your " +
            "Sepolia RPC returned incomplete history — set NEXT_PUBLIC_SEPOLIA_RPC_URL to an archive-capable " +
            "endpoint (Alchemy, Infura, etc.), refresh, and try again.",
        );
        return;
      }
      if (prep.kind === "waiting") {
        setPhase("idle");
        setStatusMessage(undefined);
        setWaitReadyAtMs(prep.readyAt * 1000);
        toast.push({
          status: "pending",
          title: "Privacy delay active",
          detail: `Withdraw unlocks in ${formatCountdown(Math.max(0, prep.readyAt - Math.floor(Date.now() / 1000)))}.`,
        });
        return;
      }

      const relayerAddress = relaying ? relayerInfo.relayer : zeroAddress;
      const denomination = await publicClient.readContract({
        address: poolAddress,
        abi: poolAbi,
        functionName: "denomination",
      });
      const fee =
        relaying && relayerInfo
          ? relayerFee(denomination, relayerInfo.feeBasisPoints)
          : 0n;

      setPhase("proving");
      const proofId = toast.push({
        status: "pending",
        title: "Building privacy proof",
        detail: "Happens in your browser. Your secret never leaves it.",
      });
      let proof: `0x${string}`;
      try {
        proof = await generateWithdrawProof({
          root: prep.root,
          nullifierHash: prep.nullifierHash,
          recipient: recipient as `0x${string}`,
          relayer: relayerAddress,
          fee,
          nullifier: parsed.nullifier,
          secret: parsed.secret,
          path: prep.path,
        });
        toast.update(proofId, {
          status: "success",
          title: "Proof ready",
          detail: "Submitting withdrawal next.",
        });
      } catch (err) {
        toast.update(proofId, {
          status: "error",
          title: "Proof failed",
          detail: err instanceof Error ? err.message : "Could not build proof.",
        });
        throw err;
      }

      setPhase("submitting");
      let hash: `0x${string}`;
      if (relaying) {
        setStatusMessage("Handing the withdrawal to the relayer. No wallet needed.");
        hash = await relay({
          pendingTitle: "Private withdrawal",
          successTitle: "Withdrawal complete",
          successDetail: `${confidentialLabel(pool?.asset ?? "USDC")} sent to recipient.`,
          run: async () => {
            const result = await submitToRelayer({
              pool: poolAddress,
              proof,
              root: toBytes32(prep.root) as `0x${string}`,
              nullifierHash: toBytes32(prep.nullifierHash) as `0x${string}`,
              recipient: recipient as `0x${string}`,
              fee: fee.toString(),
            });
            return result.txHash;
          },
        });
      } else {
        setStatusMessage("Submitting the withdrawal. Confirm in your wallet.");
        if (!walletClient || !address) throw new Error("Wallet not ready.");
        const tx = tracker();
        hash = await tx.run(
          {
            pendingTitle: "Private withdrawal",
            pendingDetail: "Confirm in your wallet.",
            successTitle: "Withdrawal complete",
            successDetail: `${confidentialLabel(pool?.asset ?? "USDC")} sent to recipient.`,
            errorTitle: "Withdrawal failed",
          },
          () =>
            writeWalletContract({
              walletClient,
              publicClient: publicClient!,
              account: address,
              address: poolAddress,
              abi: poolAbi,
              functionName: "withdraw",
              args: [
                proof,
                toBytes32(prep.root),
                toBytes32(prep.nullifierHash),
                recipient as `0x${string}`,
                zeroAddress,
                0n,
              ],
              gasCap: FHE_GAS_CAP,
            }),
        );
      }
      setTxHash(hash);
      setStatusMessage(undefined);
      setPhase("done");
    } catch (err) {
      setPhase("idle");
      setStatusMessage(undefined);
      setErrorMessage(
        err instanceof RelayerError
          ? err.message
          : err instanceof Error && err.message.includes("User rejected")
            ? "Transaction was cancelled in your wallet."
            : "The withdrawal failed. Your note is still valid. You can try again.",
      );
    }
  };

  const explorer = txHash ? explorerTxUrl(txHash, chain?.id) : undefined;

  return (
    <PageShell
      title="Withdraw"
      subtitle="Paste your secret note and choose where funds should land. For stronger privacy, pick a fresh recipient address and use the relayer so the receiver needs no gas."
      eyebrow="Step 03 · Withdraw"
    >
      {phase !== "done" && (
        <div className="mb-8">
          <FlowSteps steps={PROGRESS_STEPS} current={progressIndex(phase)} />
        </div>
      )}

      {phase === "done" ? (
        <div className="gradient-ring glass-card p-6 md:p-8">
          <p className="headline-card">Withdrawal complete.</p>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            {confidentialLabel(pool?.asset ?? "USDC")} ({pool?.label}) has been
            sent to the recipient as an encrypted confidential token. The note is
            now spent and cannot be used again. The recipient can decrypt or
            unwrap to plain tokens later if they choose.
          </p>
          {explorer && (
            <a
              href={explorer}
              target="_blank"
              rel="noopener noreferrer"
              className="link-arrow mt-3"
            >
              View transaction on Etherscan →
            </a>
          )}
        </div>
      ) : (
        <>
          <InfoBanner tone="info" title="Your note never leaves this browser">
            The withdrawal proof is built locally. Z-Tor servers and the relayer only
            receive the zero-knowledge proof — not your secret.
          </InfoBanner>

          <label className="mt-8 block space-y-2">
            <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
              Secret note
            </span>
            <textarea
              value={noteInput}
              onChange={(e) => {
                setNoteInput(e.target.value);
                setWaitReadyAtMs(undefined);
              }}
              rows={4}
              placeholder="ztor-v1-…"
              disabled={busy}
              className="input-field font-mono"
            />
            {noteLooksWrong && (
              <p className="text-xs text-coral-dark">
                This doesn&apos;t look like a valid Z-Tor note. Check for missing
                characters.
              </p>
            )}
            {parsed && pool && !notDeployed && (
              <p className="text-xs text-muted">
                Recognized: {pool.label} pool note.
              </p>
            )}
            {parsed && notDeployed && !networkError && (
              <p className="text-xs text-coral-dark">
                This note&apos;s pool is not on the current deployment.
                Notes from older Z-Tor versions will not work. Make a fresh deposit.
              </p>
            )}
            {networkError && (
              <p className="text-xs text-coral-dark">
                Can&apos;t reach Sepolia right now. Check your connection and try again.
              </p>
            )}
            {poolAddress && !notDeployed && (
              <AnonymityHint
                poolAddress={poolAddress}
                poolLabel={pool?.label}
                compact
              />
            )}
          </label>

          <div className="mt-3 flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,text/plain"
              className="hidden"
              onChange={(e) => {
                void handleNoteFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={busy}
              className="btn-secondary !px-4 !py-2"
            >
              Load note file
            </button>
            <span className="text-xs text-muted">
              …if you saved the note as a file during deposit.
            </span>
          </div>

          <label className="mt-6 block space-y-2">
            <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
              Recipient address
            </span>
            <input
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="0x…"
              disabled={busy}
              className="input-field font-mono"
            />
            {recipientOk && address && recipient.toLowerCase() === address.toLowerCase() && (
              <p className="text-xs text-coral-dark">
                This is your connected wallet. Withdrawing to it links the funds
                back to you. Use a fresh address for privacy.
              </p>
            )}
          </label>

          <div className="mt-6">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
              How to submit
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setUseRelayer(true)}
                disabled={busy || relayerInfo === null}
                className={`gradient-ring rounded-2xl px-4 py-4 text-left transition-all duration-200 disabled:opacity-60 ${
                  relaying ? "bg-coral-soft" : "glass-card hover:shadow-lift"
                }`}
              >
                <span className="block text-sm font-medium">
                  Through a relayer{relayerInfo === null ? " (offline)" : ""}
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                  {relayerInfo === null
                    ? "No relayer is reachable right now."
                    : `Best privacy: the receiving address needs no gas, and no wallet pops up. Fee: ${relayerInfo.feeBasisPoints / 100}% of the amount.`}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setUseRelayer(false)}
                disabled={busy}
                className={`gradient-ring rounded-2xl px-4 py-4 text-left transition-all duration-200 disabled:opacity-60 ${
                  !relaying ? "bg-coral-soft" : "glass-card hover:shadow-lift"
                }`}
              >
                <span className="block text-sm font-medium">From my wallet</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                  No fee, but your connected wallet pays gas and appears as the
                  transaction sender.
                </span>
              </button>
            </div>
            {relaying && pool && relayerInfo && (
              <p className="mt-3 text-xs text-muted">
                You receive{" "}
                <span className="font-medium text-ink">
                  {formatUnits(
                    pool.confidentialAmount -
                      relayerFee(pool.confidentialAmount, relayerInfo.feeBasisPoints),
                    6,
                  )}{" "}
                  {confidentialLabel(pool.asset)}
                </span>{" "}
                after the relayer fee.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleWithdraw}
            disabled={
              !parsed || !recipientOk || busy || notDeployed || (!relaying && !isConnected)
            }
            className="btn-primary mt-8 w-full"
          >
            {!relaying && !isConnected
              ? "Connect wallet (or use the relayer)"
              : busy
                ? "Working…"
                : "Withdraw"}
          </button>

          {busy && statusMessage && (
            <div className="flow-panel mt-5">
              <p className="text-sm leading-relaxed text-ink-soft">{statusMessage}</p>
            </div>
          )}
          {waitCountdown !== null && !busy && (
            <InfoBanner tone="warning" className="mt-5" title="Privacy delay active">
              {waitCountdown > 0 ? (
                <>
                  Your deposit is in the pool. Withdraw unlocks in{" "}
                  <span className="font-mono font-medium text-ink">
                    {formatCountdown(waitCountdown)}
                  </span>
                  . The wait keeps deposit and withdrawal unlinkable on-chain.
                </>
              ) : (
                "The privacy delay has passed. Press Withdraw to continue."
              )}
            </InfoBanner>
          )}
          {errorMessage && (
            <p className="mt-5 rounded-xl border border-coral/30 bg-coral-soft p-4 text-sm text-ink-soft">
              {errorMessage}
            </p>
          )}
        </>
      )}
    </PageShell>
  );
}
