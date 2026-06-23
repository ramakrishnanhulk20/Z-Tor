"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { NETWORK_LABEL } from "@/config/display";

export function CtaBanner() {
  return (
    <section className="relative overflow-hidden bg-coral">
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-20 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-white/10 blur-3xl"
        animate={{ x: [0, 40, 0], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-16 bottom-0 h-48 w-48 rounded-full bg-ink/10 blur-2xl"
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="container-site relative py-20 text-center md:py-24">
        <h2 className="mx-auto max-w-2xl font-serif text-4xl font-medium tracking-tight text-white md:text-5xl">
          Try a private transfer on {NETWORK_LABEL}.
        </h2>
        <p className="mx-auto mt-5 max-w-xl leading-relaxed text-white/80">
          Shield into confidential tokens, deposit into a pool, and withdraw
          with no on-chain link. All you need is a wallet and a few minutes.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link
            href="/shield"
            className="inline-flex items-center justify-center rounded-xl bg-ink px-6 py-3 text-sm font-medium text-paper transition-colors duration-200 hover:bg-ink/80"
          >
            Shield tokens
          </Link>
          <Link
            href="/deposit"
            className="inline-flex items-center justify-center rounded-xl border border-white/40 px-6 py-3 text-sm font-medium text-white transition-colors duration-200 hover:border-white hover:bg-white/10"
          >
            Make a deposit
          </Link>
          <Link
            href="/faq"
            className="inline-flex items-center justify-center rounded-xl border border-white/40 px-6 py-3 text-sm font-medium text-white transition-colors duration-200 hover:border-white hover:bg-white/10"
          >
            Read the FAQ
          </Link>
        </div>
      </div>
    </section>
  );
}
