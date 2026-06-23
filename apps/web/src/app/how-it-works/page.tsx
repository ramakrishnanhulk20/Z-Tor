import type { Metadata } from "next";
import Link from "next/link";
import { NETWORK_LABEL } from "@/config/display";

export const metadata: Metadata = {
  title: "How it works | Z-Tor",
  description:
    "A plain-language guide to private transfers with Z-Tor: shield confidential tokens, deposit, keep your note, and withdraw with no public link back to you.",
};

const steps = [
  {
    title: "Shield into confidential tokens",
    body: "Z-Tor pools accept only cUSDC and cWETH (ERC-7984 tokens where balances are encrypted on-chain). On the Shield page, mint test WETH or USDC, wrap them into confidential form, and decrypt your balance locally whenever you want to see it.",
  },
  {
    title: "Deposit into a pool",
    body: "Choose one of four fixed pools (0.1 cWETH, 1 cWETH, 100 cUSDC, or 1,000 cUSDC) and deposit exactly that amount. Because every deposit in a pool is the same size, yours is indistinguishable from all the others.",
  },
  {
    title: "Keep your secret note",
    body: "Z-Tor gives you a secret note: a single line of text starting with \u201cztor-\u201d. It is the only proof that one of the deposits in the pool is yours. Write it down, store it offline, and never share it. Anyone holding the note can withdraw the funds, and nobody can recover a lost one.",
  },
  {
    title: "Wait a little",
    body: "Withdrawals unlock 10 minutes after the deposit. This short delay matters: withdrawing in the same breath as depositing would make the two easy to match.",
  },
  {
    title: "Withdraw anywhere",
    body: "Paste your note and choose any address to receive confidential cUSDC or cWETH, ideally a fresh one. The contract verifies your note cryptographically without revealing which deposit it came from, so on-chain there is no link between where the money entered and where it left.",
  },
];

const visibility = [
  { item: "Which deposit funded your withdrawal", status: "Hidden", hidden: true },
  { item: "Your confidential token balance (until you decrypt)", status: "Encrypted", hidden: true },
  { item: "Your secret note", status: "Never leaves your hands", hidden: true },
  { item: "Your identity", status: "Never required", hidden: true },
  { item: "That some address interacted with Z-Tor", status: "Public", hidden: false },
  { item: "Transaction timestamps and gas payer", status: "Public", hidden: false },
  { item: "The withdrawal address you choose", status: "Public", hidden: false },
];

export default function HowItWorksPage() {
  return (
    <div className="container-site max-w-3xl py-16 md:py-24">
      <p className="eyebrow text-coral">Guide</p>
      <h1 className="mt-4 font-serif text-5xl font-medium tracking-tight md:text-6xl">
        How Z-Tor works.
      </h1>
      <p className="mt-6 text-lg leading-relaxed text-ink-soft">
        On a public blockchain, anyone can follow your money. Every payment you
        make is permanently linked to your address. Z-Tor breaks that link by
        not by hiding the blockchain, but by making your deposit look exactly
        like everyone else&apos;s, while keeping pool economics encrypted with
        fully homomorphic encryption.
      </p>

      <div className="mt-16 space-y-10">
        {steps.map((step, i) => (
          <div key={step.title} className="flex gap-6">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-coral font-serif text-lg font-medium text-white">
              {i + 1}
            </span>
            <div>
              <h2 className="font-serif text-2xl font-medium tracking-tight md:text-3xl">
                {step.title}
              </h2>
              <p className="mt-3 leading-relaxed text-ink-soft">{step.body}</p>
            </div>
          </div>
        ))}
      </div>

      <h2 className="mt-20 font-serif text-3xl font-medium tracking-tight md:text-4xl">
        What stays private, and what doesn&apos;t.
      </h2>
      <p className="mt-4 leading-relaxed text-ink-soft">
        We&apos;d rather be honest than impressive. Strong cryptography hides
        the link between deposit and withdrawal, but a public blockchain still
        shows some things to everyone.
      </p>

      <div className="card mt-8 divide-y divide-line overflow-hidden">
        {visibility.map((row) => (
          <div
            key={row.item}
            className="flex items-center justify-between gap-4 px-6 py-4"
          >
            <span className="text-sm text-ink-soft">{row.item}</span>
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                row.hidden
                  ? "bg-coral-soft text-coral-dark"
                  : "bg-oat text-muted"
              }`}
            >
              {row.status}
            </span>
          </div>
        ))}
      </div>

      <h2 className="mt-20 font-serif text-3xl font-medium tracking-tight md:text-4xl">
        The fine print.
      </h2>
      <div className="prose-section">
        <p>
          <strong className="font-medium text-ink">Confidential tokens only.</strong>{" "}
          Pools hold cUSDC and cWETH, not plain USDC or ETH. Shield first on the
          Shield page, or let the deposit flow mint and wrap for you automatically.
        </p>
        <p>
          <strong className="font-medium text-ink">Encrypted balances.</strong>{" "}
          Your cUSDC or cWETH balance is stored as ciphertext on-chain. Use
          Decrypt on the Shield page to view it locally. Z-Tor never receives
          your decrypted amount.
        </p>
        <p>
          <strong className="font-medium text-ink">
            Your withdrawal address matters.
          </strong>{" "}
          If you withdraw to an address already tied to you, you re-create the
          link Z-Tor just broke. Use a fresh address when privacy matters.
        </p>
        <p>
          <strong className="font-medium text-ink">Network.</strong> Z-Tor
          currently runs on {NETWORK_LABEL}. Connect your wallet and follow the
          on-screen prompts if you need to switch networks.
        </p>
      </div>

      <div className="mt-16 flex flex-wrap gap-3">
        <Link href="/shield" className="btn-primary">
          Shield tokens
        </Link>
        <Link href="/deposit" className="btn-secondary">
          Make a deposit
        </Link>
        <Link href="/privacy" className="btn-secondary">
          Privacy &amp; compliance
        </Link>
      </div>
    </div>
  );
}
