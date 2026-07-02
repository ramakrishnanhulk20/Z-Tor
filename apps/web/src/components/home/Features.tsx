"use client";

import { ScrollReveal, ScrollLine } from "@/components/ScrollReveal";

const useCases = [
  {
    title: "Confidential treasury movement",
    body: "Move operational funds between wallets and counterparties without broadcasting amounts or flow patterns to the entire network.",
  },
  {
    title: "Fixed anonymity sets",
    body: "Four standardized pool tiers ensure every deposit is indistinguishable by size — the strongest practical anonymity set for fixed pools.",
  },
  {
    title: "Non-custodial by design",
    body: "Funds move only with the holder's secret note. No admin keys, no custodian, and no account that can be frozen or seized.",
  },
  {
    title: "Voluntary disclosure",
    body: "When compliance requires it, depositors can prove their own history to a third party. No one else can initiate disclosure on their behalf.",
  },
];

export function Features() {
  return (
    <section className="bg-slate text-paper">
      <div className="container-site py-24 md:py-32">
        <ScrollReveal variant="fade-left">
          <div className="max-w-3xl">
            <p className="eyebrow text-kraft">Built for operators</p>
            <h2 className="headline-section mt-5 text-paper">
              Where confidentiality is an operating requirement.
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-paper/65">
              Z-Tor combines unlinkable withdrawals with fully homomorphic
              encryption. It protects what institutions need private, and
              remains transparent about what a public blockchain can never
              hide.
            </p>
          </div>
        </ScrollReveal>

        <ScrollLine className="my-14 opacity-30" />

        <div className="grid gap-px overflow-hidden rounded-2xl border border-paper/10 bg-paper/10 md:grid-cols-2">
          {useCases.map((item, i) => (
            <ScrollReveal
              key={item.title}
              delay={i * 0.08}
              variant={i % 2 === 0 ? "fade-up" : "scale"}
            >
              <div className="h-full bg-slate p-8 md:p-10">
                <h3 className="headline-card text-paper">{item.title}</h3>
                <p className="mt-4 text-sm leading-relaxed text-paper/60 md:text-base">
                  {item.body}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
