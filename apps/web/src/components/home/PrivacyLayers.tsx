"use client";

import { motion } from "framer-motion";
import { ScrollReveal, ScrollLine } from "@/components/ScrollReveal";

const layers = [
  {
    label: "ZK unlink layer",
    detail: "Commitments, nullifiers, and Merkle proofs break the deposit→withdraw link.",
    color: "bg-coral",
  },
  {
    label: "FHE economics",
    detail: "Pool TVL and active-note counts stay encrypted on-chain.",
    color: "bg-kraft",
  },
  {
    label: "ERC-7984 tokens",
    detail: "cUSDC and cWETH balances are ciphertext until you decrypt locally.",
    color: "bg-slate",
  },
];

export function PrivacyLayers() {
  return (
    <section className="border-y border-line bg-oat/50">
      <div className="container-site py-20 md:py-24">
        <ScrollReveal variant="blur-up">
          <div className="max-w-2xl">
            <p className="eyebrow text-coral">Three layers</p>
            <h2 className="mt-4 font-serif text-4xl font-medium tracking-tight md:text-5xl">
              Privacy stacked, not bolted on.
            </h2>
            <p className="mt-5 leading-relaxed text-ink-soft">
              Z-Tor combines zero-knowledge proofs for unlinkability with Zama
              fully homomorphic encryption for confidential pool accounting and
              ERC-7984 token balances.
            </p>
          </div>
        </ScrollReveal>

        <ScrollLine className="my-10" />

        <div className="mt-12 space-y-4">
          {layers.map((layer, i) => (
            <ScrollReveal key={layer.label} delay={i * 0.12} variant="fade-left">
              <motion.div
                className="gradient-ring glass-card flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between"
                whileHover={{ x: 4 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
              >
                <div className="flex items-center gap-4">
                  <span
                    className={`flex h-3 w-3 shrink-0 rounded-full ${layer.color}`}
                  />
                  <span className="font-serif text-xl font-medium tracking-tight">
                    {layer.label}
                  </span>
                </div>
                <p className="max-w-xl text-sm leading-relaxed text-ink-soft md:text-right">
                  {layer.detail}
                </p>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
