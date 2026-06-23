"use client";

import { ScrollReveal, ScrollLine } from "@/components/ScrollReveal";

const principles = [
  {
    title: "Confidential by design",
    body: "Pools hold ERC-7984 tokens: cUSDC and cWETH. Your balance is encrypted on-chain. Z-Tor never sees your decrypted amounts.",
  },
  {
    title: "Fixed amounts",
    body: "Every deposit in a pool is identical, so no amount can give you away. Custom amounts are available but privacy is stronger on the main tiers.",
  },
  {
    title: "You hold the key",
    body: "Funds move only with your secret note. There is no admin override, no custodian, and no account to freeze.",
  },
  {
    title: "Disclosure on your terms",
    body: "When you need to, you can voluntarily prove your own deposit history to a third party. Nobody else can do it for you, and nobody can do it without you.",
  },
];

export function Features() {
  return (
    <section className="bg-slate text-paper">
      <div className="container-site py-20 md:py-28">
        <ScrollReveal variant="fade-left">
          <div className="max-w-2xl">
            <p className="eyebrow text-kraft">Our approach</p>
            <h2 className="mt-4 font-serif text-4xl font-medium tracking-tight md:text-5xl">
              Private by default. Honest by design.
            </h2>
            <p className="mt-5 leading-relaxed text-paper/70">
              Z-Tor combines unlinkable withdrawals with fully homomorphic
              encryption. It hides what should be yours alone, and stays honest
              about what a public blockchain can never hide.
            </p>
          </div>
        </ScrollReveal>

        <ScrollLine className="my-12 opacity-40" />

        <div className="mt-14 grid gap-x-12 gap-y-10 md:grid-cols-2">
          {principles.map((item, i) => (
            <ScrollReveal key={item.title} delay={i * 0.1} variant="fade-right">
              <div className="border-t border-paper/15 pt-6">
                <h3 className="font-serif text-2xl font-medium tracking-tight">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-paper/70">
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
