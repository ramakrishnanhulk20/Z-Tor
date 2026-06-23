"use client";

import Link from "next/link";
import { PoolCard } from "@/components/PoolCard";
import { ScrollReveal, ScrollLine } from "@/components/ScrollReveal";
import { POOL_TIERS } from "@/config/pools";

export function PoolsShowcase() {
  return (
    <section id="pools" className="container-site py-20 md:py-28">
      <ScrollReveal variant="scale">
        <div className="max-w-2xl">
          <p className="eyebrow text-coral">Pools</p>
          <h2 className="mt-4 font-serif text-4xl font-medium tracking-tight md:text-5xl">
            Fixed tiers, or your own amount.
          </h2>
          <p className="mt-5 leading-relaxed text-ink-soft">
            Start with the four main pools for the strongest anonymity sets, or
            deposit a custom amount of cWETH or cUSDC and spin up a new pool on
            the fly.
          </p>
        </div>
      </ScrollReveal>

      <ScrollLine className="my-10" />

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {POOL_TIERS.map((pool, i) => (
          <ScrollReveal key={pool.id} delay={i * 0.1} variant={i % 2 ? "fade-right" : "fade-left"}>
            <PoolCard pool={pool} href={`/deposit?pool=${pool.id}`} />
          </ScrollReveal>
        ))}
      </div>

      <ScrollReveal delay={0.15} variant="blur-up">
        <div className="gradient-ring mt-10 rounded-2xl bg-coral-soft p-7 md:p-8">
          <h3 className="font-serif text-2xl font-medium tracking-tight text-coral-dark">
            Your note is the only key.
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
            When you deposit, Z-Tor gives you a secret note. If you lose it, your
            funds cannot be recovered. Not by you, not by us, not by anyone.
            Write it down and keep it offline before you confirm a deposit.
          </p>
          <Link href="/shield" className="link-arrow mt-4">
            Need cUSDC or cWETH? Shield tokens first →
          </Link>
        </div>
      </ScrollReveal>
    </section>
  );
}
