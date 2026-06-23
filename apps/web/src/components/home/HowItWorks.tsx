"use client";

import Link from "next/link";
import { ScrollReveal, ScrollLine } from "@/components/ScrollReveal";

const steps = [
  {
    number: "1",
    title: "Shield tokens",
    body: "Mint test WETH or USDC, then shield them into confidential cWETH or cUSDC (ERC-7984). Balances stay encrypted on-chain until you choose to decrypt them in your browser.",
  },
  {
    number: "2",
    title: "Deposit",
    body: "Choose a fixed pool (0.1 cWETH, 1 cWETH, 100 cUSDC, or 1,000 cUSDC) and deposit from your wallet. Every deposit in a pool is the same size, so yours blends in.",
  },
  {
    number: "3",
    title: "Keep your note",
    body: "You receive a secret note: one line of text that is the only key to your funds. Save it somewhere safe and offline. Nobody can recover it for you.",
  },
  {
    number: "4",
    title: "Withdraw later",
    body: "After a short waiting period, paste your note and withdraw confidential tokens to any address you choose. On-chain, there is no public link between deposit and withdrawal.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="container-site py-20 md:py-28">
      <ScrollReveal variant="blur-up">
        <div className="max-w-2xl">
          <p className="eyebrow text-coral">How it works</p>
          <h2 className="mt-4 font-serif text-4xl font-medium tracking-tight md:text-5xl">
            Four steps to a private transfer.
          </h2>
        </div>
      </ScrollReveal>

      <ScrollLine className="my-10" />

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, i) => (
          <ScrollReveal
            key={step.number}
            delay={i * 0.12}
            variant={i % 2 === 0 ? "fade-up" : "scale"}
          >
            <div className="gradient-ring glass-card h-full p-7 transition-shadow duration-300 hover:shadow-lift">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-coral font-serif text-lg font-medium text-white">
                {step.number}
              </span>
              <h3 className="mt-5 font-serif text-2xl font-medium tracking-tight">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                {step.body}
              </p>
            </div>
          </ScrollReveal>
        ))}
      </div>

      <ScrollReveal delay={0.2}>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link href="/shield" className="btn-primary">
            Shield tokens first
          </Link>
          <Link href="/how-it-works" className="link-arrow">
            Read the full guide →
          </Link>
        </div>
      </ScrollReveal>
    </section>
  );
}
