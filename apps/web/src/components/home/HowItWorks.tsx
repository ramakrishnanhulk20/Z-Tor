"use client";

import Link from "next/link";
import { docsPath } from "@/config/site";
import { ScrollReveal, ScrollLine } from "@/components/ScrollReveal";

const steps = [
  {
    number: "01",
    title: "Shield tokens",
    body: "Convert test WETH or USDC into confidential cWETH or cUSDC (ERC-7984). Balances remain encrypted on-chain until decrypted locally in the browser.",
  },
  {
    number: "02",
    title: "Deposit",
    body: "Select a fixed pool tier — 0.1 or 1 cWETH, 100 or 1,000 cUSDC. Identical deposit sizes maximize anonymity set strength across every participant.",
  },
  {
    number: "03",
    title: "Secure the note",
    body: "Receive a secret note: the sole credential to your funds. Store it offline. No custodian, admin, or recovery path exists if it is lost.",
  },
  {
    number: "04",
    title: "Withdraw privately",
    body: "After a short delay, submit your note and withdraw to any address. On-chain observers cannot link the withdrawal back to the original deposit.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="container-site py-24 md:py-32">
      <ScrollReveal variant="blur-up">
        <div className="max-w-3xl">
          <p className="eyebrow text-coral">How it works</p>
          <h2 className="headline-section mt-5">
            Four steps to confidential settlement.
          </h2>
        </div>
      </ScrollReveal>

      <ScrollLine className="my-12" />

      <div className="divide-y divide-line">
        {steps.map((step, i) => (
          <ScrollReveal
            key={step.number}
            delay={i * 0.08}
            variant={i % 2 === 0 ? "fade-left" : "fade-right"}
          >
            <article className="grid gap-6 py-10 md:grid-cols-[7rem_1fr] md:items-start md:gap-12 md:py-12">
              <p className="text-sm font-semibold tracking-[0.2em] text-coral">
                {step.number}
              </p>
              <div>
                <h3 className="headline-card">{step.title}</h3>
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-soft">
                  {step.body}
                </p>
              </div>
            </article>
          </ScrollReveal>
        ))}
      </div>

      <ScrollReveal delay={0.15}>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <Link href="/app/shield" className="btn-primary">
            Shield tokens first
            <span aria-hidden className="text-base leading-none">
              ↗
            </span>
          </Link>
          <a
            href={docsPath("how-it-works")}
            target="_blank"
            rel="noopener noreferrer"
            className="link-arrow"
          >
            Read the full guide →
            <span className="sr-only"> (opens in new tab)</span>
          </a>
        </div>
      </ScrollReveal>
    </section>
  );
}
