"use client";

import Link from "next/link";
import { PoolCard } from "@/components/PoolCard";
import { ScrollReveal, ScrollLine } from "@/components/ScrollReveal";
import { POOL_TIERS } from "@/config/pools";

export function PoolsShowcase() {
  return (
    <section id="pools" className="container-site py-24 md:py-32">
      <ScrollReveal variant="scale">
        <div className="max-w-3xl">
          <p className="eyebrow text-coral">Pools</p>
          <h2 className="headline-section mt-5">
            Standardized tiers. Maximum anonymity.
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-ink-soft">
            Every deposit within a tier is identical, so external observers
            cannot distinguish yours by amount. Choose 0.1 or 1 cWETH, or 100
            or 1,000 cUSDC.
          </p>
        </div>
      </ScrollReveal>

      <ScrollLine className="my-12" />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {POOL_TIERS.map((pool, i) => (
          <ScrollReveal
            key={pool.id}
            delay={i * 0.08}
            variant={i % 2 ? "fade-right" : "fade-left"}
          >
            <PoolCard pool={pool} href={`/app/deposit?pool=${pool.id}`} />
          </ScrollReveal>
        ))}
      </div>

      <ScrollReveal delay={0.12} variant="blur-up">
        <div className="mt-12 rounded-2xl border border-coral/20 bg-coral-soft p-8 md:p-10">
          <h3 className="headline-card text-coral-dark">
            The note is the only credential.
          </h3>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-soft">
            Upon deposit, Z-Tor issues a secret note. If it is lost, funds
            cannot be recovered — not by the depositor, not by operators, not
            by anyone. Record it offline before confirming any transaction.
          </p>
          <Link href="/app/shield" className="link-arrow mt-5 inline-flex">
            Need cUSDC or cWETH? Shield tokens first →
          </Link>
        </div>
      </ScrollReveal>
    </section>
  );
}
