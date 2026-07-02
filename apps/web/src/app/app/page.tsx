"use client";

import Link from "next/link";
import { ConnectWalletBanner } from "@/components/ConnectWalletBanner";
import { ExternalLink } from "@/components/ExternalLink";
import { NETWORK_LABEL } from "@/config/display";
import { DOCS_URL, docsPath } from "@/config/site";

const flows = [
  {
    step: "01",
    title: "Shield",
    description:
      "Mint Zama test tokens and wrap them into confidential cUSDC or cWETH.",
    href: "/app/shield",
    cta: "Start here",
  },
  {
    step: "02",
    title: "Deposit",
    description:
      "Pick a fixed pool, save your secret note, and send encrypted tokens.",
    href: "/app/deposit",
    cta: "Deposit",
  },
  {
    step: "03",
    title: "Withdraw",
    description:
      "After the privacy delay, spend your note to any recipient address.",
    href: "/app/withdraw",
    cta: "Withdraw",
  },
];

const tools = [
  {
    title: "Encrypted stats",
    description: "Live fhEVM demo — encrypted pool counters on-chain.",
    href: "/app/stats",
  },
  {
    title: "Voluntary disclosure",
    description: "Export proof of your own activity for an auditor.",
    href: "/app/disclose",
  },
];

export default function AppHomePage() {
  return (
    <div className="container-site py-16 md:py-24">
      <div className="max-w-3xl border-b border-line/80 pb-10 md:pb-12">
        <p className="eyebrow text-coral">Application</p>
        <h1 className="headline-section mt-5">
          Confidential transfers on {NETWORK_LABEL}.
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-ink-soft">
          Connect your wallet, then follow the flow below. Your secret note is
          the only credential to your funds — record it offline before every
          deposit.
        </p>
      </div>

      <div className="mt-8">
        <ConnectWalletBanner />
      </div>

      <div className="mt-12 divide-y divide-line">
        {flows.map((flow) => (
          <Link
            key={flow.href}
            href={flow.href}
            className="group grid gap-4 py-8 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/40 focus-visible:ring-offset-2 md:grid-cols-[5rem_1fr_auto] md:items-center md:gap-8 md:py-10"
          >
            <p className="text-sm font-semibold tracking-[0.2em] text-coral">
              {flow.step}
            </p>
            <div>
              <h2 className="headline-card">{flow.title}</h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-soft md:text-base">
                {flow.description}
              </p>
            </div>
            <span className="text-sm font-semibold text-coral transition-colors group-hover:text-coral-dark">
              {flow.cta} ↗
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-16">
        <p className="eyebrow">Additional tools</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {tools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="card group p-7 transition-all hover:-translate-y-0.5 hover:border-coral/25 hover:shadow-lift active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/40 focus-visible:ring-offset-2"
            >
              <h3 className="headline-card">{tool.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                {tool.description}
              </p>
              <span className="mt-5 inline-block text-sm font-semibold text-coral group-hover:text-coral-dark">
                Open ↗
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-14 rounded-2xl border border-coral/20 bg-coral-soft p-8 md:p-10">
        <h2 className="headline-card text-coral-dark">Documentation</h2>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-soft md:text-base">
          Review the{" "}
          <ExternalLink
            href={docsPath("how-it-works")}
            className="font-semibold text-coral underline underline-offset-2"
          >
            how-it-works guide
          </ExternalLink>
          ,{" "}
          <ExternalLink
            href={DOCS_URL}
            className="font-semibold text-coral underline underline-offset-2"
          >
            full documentation
          </ExternalLink>
          , and privacy boundaries before moving test funds.
        </p>
        <Link href="/" className="btn-secondary mt-6 inline-flex">
          Back to landing
        </Link>
      </div>
    </div>
  );
}
