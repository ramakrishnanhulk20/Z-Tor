"use client";

import { useReducedMotion } from "framer-motion";
import { motion } from "framer-motion";
import { NETWORK_LABEL } from "@/config/display";

const ease = [0.16, 1, 0.3, 1] as const;

export function Manifesto() {
  const reduced = useReducedMotion();

  return (
    <section className="border-b border-line bg-paper">
      <div className="container-site py-24 md:py-32">
        <motion.div
          initial={reduced ? { opacity: 1 } : { opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0 : 0.85, ease, delay: reduced ? 0 : 0.15 }}
        >
          <p className="eyebrow">The missing layer</p>
          <h2 className="manifesto mt-6 max-w-4xl text-ink">
            Confidentiality is the requirement public blockchains have never
            met for institutional value transfer.
          </h2>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-ink-soft">
            Every transparent ledger exposes amounts, balances, and flow
            patterns to anyone watching. For regulated institutions and
            privacy-conscious operators on {NETWORK_LABEL}, that exposure
            makes confidential settlement a non-starter. Z-Tor closes the gap
            with encrypted pool accounting, fixed anonymity sets, and
            unlinkable withdrawals — full verifiability without public trails.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
