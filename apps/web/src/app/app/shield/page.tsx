"use client";

import { useEffect, useState } from "react";
import { formatUnits } from "viem";
import {
  NoCiphertextError,
  useConfidentialBalance,
  useZamaSDK,
} from "@zama-fhe/react-sdk";
import {
  useAccount,
  usePublicClient,
  useReadContract,
  useWalletClient,
} from "wagmi";
import { PageShell } from "@/components/PageShell";
import { InfoBanner } from "@/components/ui/InfoBanner";
import { confidentialWrapperAbi, mintableErc20Abi } from "@/config/contracts";
import { CONFIDENTIAL_SYMBOL } from "@/config/display";
import type { PoolAsset } from "@/config/pools";
import { confidentialWrapper, underlyingToken, ZAMA_SEPOLIA } from "@/config/zama";
import { useTxToast } from "@/hooks/useTxToast";
import { isEncryptedHandle } from "@/lib/decrypt-balance";
import { ensureUnderlyingBalance, wrapToConfidential } from "@/lib/confidential";

const ASSETS: PoolAsset[] = ["USDC", "ETH"];
const MINT_AMOUNT = {
  USDC: 10_000_000_000n,
  ETH: 10_000_000_000_000_000_000n,
} as const;

const ZAMA_DOCS =
  "https://docs.zama.org/protocol/protocol-apps/addresses/testnet/sepolia";

function AssetCard({ asset }: { asset: PoolAsset }) {
  const symbol = CONFIDENTIAL_SYMBOL[asset];
  const plainLabel = asset === "ETH" ? "WETH" : "USDC";
  const underlying = underlyingToken(asset);
  const wrapper = confidentialWrapper(asset);
  const decimals = asset === "ETH" ? 18 : 6;

  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { toast, tracker } = useTxToast();
  const sdk = useZamaSDK();

  const [busy, setBusy] = useState<string>();
  const [error, setError] = useState<string>();
  const [revealBalance, setRevealBalance] = useState(false);
  const [decryptToastId, setDecryptToastId] = useState<string>();

  const {
    data: decrypted,
    isFetching: decrypting,
    error: decryptError,
  } = useConfidentialBalance(
    { tokenAddress: wrapper },
    { enabled: revealBalance && isConnected },
  );

  const { data: plainBalance, refetch: refetchPlain } = useReadContract({
    address: underlying,
    abi: mintableErc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) },
  });

  const { data: encryptedHandle, refetch: refetchConf } = useReadContract({
    address: wrapper,
    abi: confidentialWrapperAbi,
    functionName: "confidentialBalanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) },
  });

  const hasEncrypted = isEncryptedHandle(encryptedHandle as `0x${string}` | undefined);

  useEffect(() => {
    if (!revealBalance || !decryptToastId || decrypting) return;

    if (decryptError) {
      const detail =
        decryptError instanceof NoCiphertextError
          ? `No ${symbol} yet. Shield tokens first.`
          : decryptError.message.includes("User rejected")
            ? "You declined the signature in your wallet."
            : decryptError.message;
      toast.update(decryptToastId, { status: "error", title: "Decrypt failed", detail });
      setError(detail);
      setRevealBalance(false);
      setDecryptToastId(undefined);
      return;
    }

    if (decrypted !== undefined) {
      toast.update(decryptToastId, {
        status: "success",
        title: `${symbol} balance revealed`,
        detail: `${formatUnits(decrypted, 6)} ${symbol} in your wallet.`,
      });
      setDecryptToastId(undefined);
    }
  }, [decryptError, decrypted, decrypting, decryptToastId, revealBalance, symbol, toast]);

  const run = async (label: string, fn: () => Promise<void>) => {
    setError(undefined);
    setBusy(label);
    try {
      await fn();
    } catch (err) {
      setError(
        err instanceof Error && err.message.includes("User rejected")
          ? "Transaction cancelled in your wallet."
          : err instanceof Error
            ? err.message
            : "Something went wrong. Please try again.",
      );
    } finally {
      setBusy(undefined);
    }
  };

  const handleMint = () =>
    run("mint", async () => {
      if (!address || !walletClient || !publicClient) return;
      const tx = tracker();
      await ensureUnderlyingBalance(
        publicClient,
        walletClient,
        asset,
        address,
        MINT_AMOUNT[asset],
        tx,
      );
      await refetchPlain();
    });

  const handleShield = () =>
    run("shield", async () => {
      if (!address || !walletClient || !publicClient || !sdk) return;
      const amount = plainBalance && plainBalance > 0n ? plainBalance : MINT_AMOUNT[asset];
      const tx = tracker();
      await ensureUnderlyingBalance(
        publicClient,
        walletClient,
        asset,
        address,
        amount,
        tx,
      );
      await wrapToConfidential(
        sdk,
        publicClient,
        walletClient,
        asset,
        address,
        amount,
        tx,
      );
      setRevealBalance(false);
      await refetchPlain();
      await refetchConf();
    });

  const handleDecrypt = () => {
    setError(undefined);
    setRevealBalance(true);
    setDecryptToastId(
      toast.push({
        status: "pending",
        title: `Decrypting ${symbol}`,
        detail: "Reading your balance locally. Nothing leaves your browser.",
      }),
    );
  };

  return (
    <div className="gradient-ring glass-card p-6 md:p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-2xl font-semibold tracking-[-0.03em]">{symbol}</p>
          <p className="mt-1 text-xs text-muted">
            ERC-7984 confidential {plainLabel} on Sepolia
          </p>
        </div>
        <span className="rounded-full bg-coral/10 px-3 py-1 text-xs font-medium text-coral">
          {plainLabel}
        </span>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-line bg-ivory/80 p-4">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
            Plain {plainLabel}
          </p>
          <p className="stat-value mt-2 text-2xl">
            {plainBalance !== undefined
              ? formatUnits(plainBalance, decimals)
              : "—"}
          </p>
          <p className="mt-1 text-xs text-muted">Before shielding</p>
        </div>
        <div className="rounded-xl border border-line bg-ivory/80 p-4">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
            {symbol} (encrypted)
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-ink">
            {revealBalance && decrypted !== undefined ? (
              formatUnits(decrypted, 6)
            ) : hasEncrypted ? (
              <span className="text-base text-ink-soft">Encrypted · decrypt to view</span>
            ) : (
              <span className="text-base text-muted">None yet</span>
            )}
          </p>
          <p className="mt-1 text-xs text-muted">On-chain ciphertext handle</p>
        </div>
      </div>

      <ol className="mt-6 space-y-2 text-xs leading-relaxed text-ink-soft">
        <li>
          <span className="font-medium text-ink">1. Mint</span> — free test {plainLabel} from
          Zama&apos;s Sepolia contracts
        </li>
        <li>
          <span className="font-medium text-ink">2. Shield</span> — wrap into {symbol}
        </li>
        <li>
          <span className="font-medium text-ink">3. Decrypt</span> — optional, view balance in
          browser only
        </li>
      </ol>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!isConnected || Boolean(busy)}
          onClick={() => void handleMint()}
          className="btn-secondary text-xs"
        >
          {busy === "mint" ? "Minting…" : `Mint test ${plainLabel}`}
        </button>
        <button
          type="button"
          disabled={!isConnected || Boolean(busy)}
          onClick={() => void handleShield()}
          className="btn-primary text-xs"
        >
          {busy === "shield" ? "Shielding…" : `Shield → ${symbol}`}
        </button>
        <button
          type="button"
          disabled={!isConnected || !hasEncrypted || Boolean(busy) || decrypting}
          onClick={handleDecrypt}
          className="btn-secondary text-xs"
        >
          {decrypting ? "Decrypting…" : "Decrypt balance"}
        </button>
      </div>

      {error && <p className="mt-4 text-xs text-coral-dark">{error}</p>}
    </div>
  );
}

export default function ShieldPage() {
  return (
    <PageShell
      wide
      flush
      title="Shield confidential tokens"
      subtitle="Turn plain test WETH or USDC into Zama confidential tokens (cWETH / cUSDC). Z-Tor pools only accept these encrypted balances — shield here before you deposit."
      eyebrow="Step 01 · Shield"
    >
      <InfoBanner tone="info" title="Sepolia testnet only" className="mb-8">
        <p>
          We mint and wrap using the <strong className="font-medium text-ink">official Zama Sepolia
          contract addresses</strong> from their documentation — not custom tokens. These are free
          test assets with no real-world value.
        </p>
        <p className="mt-3">
          <a
            href={ZAMA_DOCS}
            target="_blank"
            rel="noopener noreferrer"
            className="link-arrow"
          >
            Zama Sepolia addresses →
          </a>
        </p>
      </InfoBanner>

      <div className="grid gap-6 md:grid-cols-2">
        {ASSETS.map((asset) => (
          <AssetCard key={asset} asset={asset} />
        ))}
      </div>

      <div className="glass-card mt-8 p-6 text-xs leading-relaxed text-muted">
        <p className="font-medium uppercase tracking-[0.14em] text-ink">Contract addresses (Sepolia)</p>
        <dl className="mt-4 space-y-3 font-mono">
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-muted">Test USDC (mint)</dt>
            <dd className="text-ink-soft">{ZAMA_SEPOLIA.underlyingUsdc}</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-muted">Test WETH (mint)</dt>
            <dd className="text-ink-soft">{ZAMA_SEPOLIA.underlyingWeth}</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-muted">cUSDC wrapper</dt>
            <dd className="text-ink-soft">{ZAMA_SEPOLIA.cUsdc}</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-muted">cWETH wrapper</dt>
            <dd className="text-ink-soft">{ZAMA_SEPOLIA.cWeth}</dd>
          </div>
        </dl>
        <p className="mt-4 text-ink-soft">
          Balances stay encrypted on-chain. Decryption happens only in your browser when you
          explicitly request it — nothing is sent to Z-Tor servers.
        </p>
      </div>
    </PageShell>
  );
}
