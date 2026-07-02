"use client";

import { motion } from "framer-motion";
import { ScrollReveal, ScrollLine } from "@/components/ScrollReveal";

const layers = [
  {
    label: "ZK unlink layer",
    detail:
      "Commitments, nullifiers, and Merkle proofs sever the deposit-to-withdraw link at the protocol level.",
    accent: "bg-coral",
  },
  {
    label: "FHE economics",
    detail:
      "Pool TVL and active-note counts remain encrypted on-chain via Zama fully homomorphic encryption.",
    accent: "bg-kraft",
  },
  {
    label: "ERC-7984 tokens",
    detail:
      "cUSDC and cWETH balances stay ciphertext until the holder decrypts locally in their browser.",
    accent: "bg-slate",
  },
];

export function PrivacyLayers() {
  return (
    <section className="border-y border-line bg-oat/40">
      <div className="container-site py-24 md:py-32">
        <ScrollReveal variant="blur-up">
          <div className="max-w-3xl">
            <p className="eyebrow text-coral">Architecture</p>
            <h2 className="headline-section mt-5">
              Privacy engineered in three layers.
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-ink-soft">
              Z-Tor combines zero-knowledge proofs for unlinkability with Zama
              FHE for confidential pool accounting and ERC-7984 token balances.
              Each layer addresses a distinct leakage surface.
            </p>
          </div>
        </ScrollReveal>

        <ScrollLine className="my-12" />

        <div className="mt-4 space-y-4">
          {layers.map((layer, i) => (
            <ScrollReveal key={layer.label} delay={i * 0.1} variant="fade-up">
              <motion.div
                className="group rounded-2xl border border-line/70 bg-paper p-7 transition-all duration-300 hover:border-coral/25 hover:shadow-lift md:p-8"
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
              >
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-4">
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${layer.accent}`}
                    />
                    <h3 className="headline-card">{layer.label}</h3>
                  </div>
                  <p className="max-w-xl text-sm leading-relaxed text-ink-soft md:text-right md:text-base">
                    {layer.detail}
                  </p>
                </div>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
