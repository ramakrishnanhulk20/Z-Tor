"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
  useAccount,
  usePublicClient,
  useReadContract,
  useWalletClient,
} from "wagmi";
import { useZamaSDK } from "@zama-fhe/react-sdk";
import { DepositPoolPicker } from "@/components/DepositPoolPicker";
import { FlowSteps } from "@/components/FlowSteps";
import { NotePanel } from "@/components/NotePanel";
import { PageShell } from "@/components/PageShell";
import { InfoBanner } from "@/components/ui/InfoBanner";
import { mintableErc20Abi, confidentialWrapperAbi } from "@/config/contracts";
import { confidentialLabel } from "@/config/display";
import { confidentialWrapper, underlyingToken } from "@/config/zama";
import {
  depositConfidential,
  ensureConfidentialBalance,
  type BalancePrepStep,
} from "@/lib/confidential";
import { isEncryptedHandle } from "@/lib/decrypt-balance";
import {
  ANONYMITY_DELAY_SECONDS,
  POOL_TIERS,
  type PoolTier,
} from "@/config/pools";
import { usePoolAddress } from "@/hooks/usePoolAddress";
import { formatCountdown, useCountdown } from "@/hooks/useCountdown";
import { useTxToast } from "@/hooks/useTxToast";
import { computeCommitment, generateNote, type GeneratedNote } from "@/lib/note";
import { explorerTxUrl } from "@/lib/explorer";
import { fetchRelayerInfo } from "@/lib/relayer";

type Phase =
  | "select"
  | "note"
  | "checking"
  | "minting"
  | "shielding"
  | "encrypting"
  | "depositing"
  | "done";

const FLOW_STEPS = ["Choose pool", "Save note", "Deposit"] as const;

function DepositContent() {
  const params = useSearchParams();
  const fromQuery = POOL_TIERS.find((p) => p.id === params.get("pool"));
  const [pool, setPool] = useState<PoolTier>(fromQuery ?? POOL_TIERS[0]);
  const [phase, setPhase] = useState<Phase>("select");
  const [generated, setGenerated] = useState<GeneratedNote | null>(null);
  const [savedConfirmed, setSavedConfirmed] = useState(false);
  const [txHash, setTxHash] = useState<string>();
  const [errorMessage, setErrorMessage] = useState<string>();
  const [readyAtMs, setReadyAtMs] = useState<number>();

  const { isConnected, address, chain } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const sdk = useZamaSDK();
  const { tracker } = useTxToast();
  const [relayerAddress, setRelayerAddress] = useState<`0x${string}`>();
  const { poolAddress, notDeployed, networkError } = usePoolAddress(pool.id);

  useEffect(() => {
    void fetchRelayerInfo().then((info) => {
      if (info) setRelayerAddress(info.relayer);
    });
  }, []);

  const usingRelayerWallet = Boolean(
    address &&
      relayerAddress &&
      address.toLowerCase() === relayerAddress.toLowerCase(),
  );

  const underlying = underlyingToken(pool.asset);
  const wrapper = confidentialWrapper(pool.asset);

  const { data: underlyingBalance } = useReadContract({
    address: underlying,
    abi: mintableErc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: isConnected },
  });

  const { data: confidentialHandle } = useReadContract({
    address: wrapper,
    abi: confidentialWrapperAbi,
    functionName: "confidentialBalanceOf",
    args: address ? [address] : undefined,
    query: { enabled: isConnected },
  });

  const hasConfidentialTokens = isEncryptedHandle(
    confidentialHandle as `0x${string}` | undefined,
  );

  const needsMintOrWrap = Boolean(
    isConnected &&
      !hasConfidentialTokens &&
      underlyingBalance !== undefined &&
      underlyingBalance < pool.amountWei,
  );

  const countdown = useCountdown(readyAtMs);
  const busy =
    phase === "checking" ||
    phase === "minting" ||
    phase === "shielding" ||
    phase === "encrypting" ||
    phase === "depositing";

  const depositButtonLabel = (): string => {
    switch (phase) {
      case "checking":
        return "Checking confidential balance…";
      case "minting":
        return "Minting test tokens… confirm in wallet";
      case "shielding":
        return "Shielding to confidential form… confirm in wallet";
      case "encrypting":
        return "Encrypting deposit with Zama FHE…";
      case "depositing":
        return "Confirm deposit in wallet";
      default:
        return `Deposit ${pool.label}`;
    }
  };

  const mapPrepStep = (step: BalancePrepStep) => {
    if (step === "checking") setPhase("checking");
    else if (step === "minting") setPhase("minting");
    else if (step === "shielding") setPhase("shielding");
    else if (step === "ready") setPhase("encrypting");
  };
  const stepIndex =
    phase === "select" ? 0 : phase === "note" ? 1 : phase === "done" ? 3 : 2;

  const resetFlow = () => {
    setGenerated(null);
    setSavedConfirmed(false);
    setTxHash(undefined);
    setReadyAtMs(undefined);
    setErrorMessage(undefined);
    setPhase("select");
  };

  const handleGenerate = () => {
    setGenerated(generateNote(pool.id));
    setSavedConfirmed(false);
    setPhase("note");
  };

  const handleDeposit = async () => {
    if (!generated || !poolAddress || !publicClient || !walletClient || !address) {
      return;
    }
    setErrorMessage(undefined);
    const tx = tracker();
    try {
      const commitment = await computeCommitment(generated.nullifier, generated.secret);

      setPhase("checking");
      await ensureConfidentialBalance(
        sdk,
        publicClient,
        walletClient,
        pool.asset,
        address,
        pool.amountWei,
        pool.confidentialAmount,
        tx,
        mapPrepStep,
      );

      setPhase("depositing");
      const hash = await depositConfidential(
        sdk,
        publicClient,
        walletClient,
        pool.asset,
        address,
        poolAddress,
        commitment,
        pool.confidentialAmount,
        tx,
      );
      setTxHash(hash);

      setReadyAtMs(Date.now() + ANONYMITY_DELAY_SECONDS * 1000);
      setPhase("done");
    } catch (err) {
      setPhase("note");
      setErrorMessage(
        err instanceof Error && err.message.includes("User rejected")
          ? "Transaction was cancelled in your wallet."
          : err instanceof Error
            ? err.message
            : "The deposit failed. You can try again.",
      );
    }
  };

  const explorer = txHash ? explorerTxUrl(txHash, chain?.id) : undefined;

  return (
    <PageShell
      title="Deposit"
      subtitle="Pick one of four fixed pools, save your secret note, then deposit confidential cWETH or cUSDC. MetaMask may show Zama's cWETH or cUSDC contract — that token forwards your deposit into the Z-Tor pool."
      eyebrow="Step one"
    >
      <div className="mb-8">
        <FlowSteps steps={FLOW_STEPS} current={stepIndex} />
      </div>

      <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
        Choose a pool
      </p>
      <div className="mt-3">
        <DepositPoolPicker
          pool={pool}
          onPoolChange={(tier) => {
            setPool(tier);
            resetFlow();
          }}
          disabled={busy || phase === "done"}
        />
      </div>

      {phase === "select" && (
        <>
          {usingRelayerWallet && (
            <div className="mt-6 rounded-xl border border-coral/30 bg-coral-soft p-4 text-sm leading-relaxed text-ink-soft">
              You are connected with the <strong className="font-medium">relayer</strong> wallet.
              Deposits work only if you shielded cWETH on this same account.
            </div>
          )}
          {hasConfidentialTokens && !usingRelayerWallet && (
            <InfoBanner tone="success" title="Confidential balance detected" className="mt-6">
              This wallet already holds {confidentialLabel(pool.asset)}. Deposit will
              verify your balance first — no minting unless you are short.
            </InfoBanner>
          )}
          {needsMintOrWrap && (
            <InfoBanner tone="warning" title="Need confidential tokens first" className="mt-6">
              No {confidentialLabel(pool.asset)} detected yet.{" "}
              <Link href="/app/shield" className="font-medium text-coral underline underline-offset-2">
                Shield on the Shield page
              </Link>{" "}
              for full control, or continue here and we will mint and shield only what is missing.
              You still need a little Sepolia ETH for gas.
            </InfoBanner>
          )}
          <div className="flow-panel mt-6">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
              What happens when you deposit
            </p>
            <ol className="mt-3 space-y-2 text-sm leading-relaxed text-ink-soft">
              <li>
                <span className="font-medium text-ink">1. Pool lookup</span> — Z-Tor reads your
                chosen pool address from the on-chain registry
              </li>
              <li>
                <span className="font-medium text-ink">2. Balance check</span> — read your
                encrypted cUSDC/cWETH (may ask for a wallet signature to decrypt locally)
              </li>
              <li>
                <span className="font-medium text-ink">3. Top up only if needed</span> — mint
                and shield test tokens only when you are short
              </li>
              <li>
                <span className="font-medium text-ink">4. Encrypted transfer</span> — call Zama&apos;s
                cWETH/cUSDC wrapper; it forwards tokens into the Z-Tor pool in one confirmation
              </li>
            </ol>
          </div>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!isConnected || notDeployed}
            className="btn-primary mt-8 w-full"
          >
            {!isConnected
              ? "Connect wallet to continue"
              : notDeployed
                ? networkError
                  ? "Can't reach Ethereum. Check your connection"
                  : "Pool not available on this network"
                : "Generate my secret note"}
          </button>
          <p className="mt-4 text-xs leading-relaxed text-muted">
            Nothing is sent yet. The next step shows your note so you can save
            it before depositing.
          </p>
        </>
      )}

      {(phase === "note" || busy) && generated && (
        <div className="mt-8 space-y-5">
          <NotePanel note={generated.note} poolId={pool.id} />

          <label className="flex items-start gap-3 text-sm leading-relaxed text-ink-soft">
            <input
              type="checkbox"
              checked={savedConfirmed}
              onChange={(e) => setSavedConfirmed(e.target.checked)}
              disabled={busy}
              className="mt-1 h-4 w-4 accent-coral"
            />
            I saved my note somewhere safe. I understand it cannot be recovered.
          </label>

          <button
            type="button"
            onClick={handleDeposit}
            disabled={!savedConfirmed || busy}
            className="btn-primary w-full"
          >
            {busy ? depositButtonLabel() : `Deposit ${pool.label}`}
          </button>
        </div>
      )}

      {phase === "done" && generated && (
        <div className="mt-8 space-y-5">
          <div className="rounded-xl border border-line bg-ivory p-5">
            <p className="font-serif text-xl font-medium tracking-tight">
              Deposit confirmed.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              Your {pool.label} is in the pool.{" "}
              {countdown !== null && countdown > 0
                ? `The privacy delay is running. Withdrawals unlock in about ${formatCountdown(countdown)}.`
                : "The privacy delay has passed. You can withdraw now."}
            </p>
            {countdown !== null && countdown > 0 && (
              <p className="mt-2 text-xs leading-relaxed text-muted">
                The wait is what keeps your deposit privacy: withdrawing
                instantly would make it easy to link the two.
              </p>
            )}
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
          <NotePanel note={generated.note} poolId={pool.id} />
          <div className="flex flex-wrap gap-3">
            <Link href="/app/withdraw" className="btn-primary">
              Go to withdraw
            </Link>
            <button type="button" onClick={resetFlow} className="btn-secondary">
              Make another deposit
            </button>
          </div>
        </div>
      )}

      {errorMessage && (
        <p className="mt-5 rounded-xl border border-coral/30 bg-coral-soft p-4 text-sm text-ink-soft">
          {errorMessage}
        </p>
      )}
    </PageShell>
  );
}

export default function DepositPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted">
          Loading…
        </div>
      }
    >
      <DepositContent />
    </Suspense>
  );
}
