"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { useRef } from "react";
import { NETWORK_LABEL } from "@/config/display";
import { docsPath } from "@/config/site";

export function CtaBanner() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : -40]);

  return (
    <section
      ref={ref}
      className="relative overflow-hidden border-t border-coral-dark/20 bg-coral"
    >
      <motion.div
        aria-hidden
        style={{ y }}
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute -left-24 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -right-16 bottom-0 h-56 w-56 rounded-full bg-ink/10 blur-2xl" />
      </motion.div>

      <div className="container-site relative py-24 text-center md:py-32">
        <motion.div
          initial={reduced ? { opacity: 1 } : { opacity: 0, y: 48 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0, margin: "0px 0px 120px 0px" }}
          transition={{ duration: reduced ? 0 : 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="headline-section mx-auto max-w-3xl text-white">
            Deploy confidential transfers on {NETWORK_LABEL}.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/80">
            Shield into encrypted tokens, deposit into a fixed pool, and
            withdraw with no on-chain link. A wallet and a few minutes — that
            is all it takes to begin.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/app"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-8 py-3.5 text-sm font-semibold text-paper transition-all hover:bg-ink/85 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-coral"
            >
              Launch app
              <span aria-hidden className="text-base leading-none">
                ↗
              </span>
            </Link>
            <Link
              href="/app/deposit"
              className="inline-flex items-center justify-center rounded-full border border-white/35 px-8 py-3.5 text-sm font-semibold text-white transition-all hover:border-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-coral"
            >
              Make a deposit
            </Link>
            <a
              href={docsPath("faq")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-full border border-white/35 px-8 py-3.5 text-sm font-semibold text-white transition-all hover:border-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-coral"
            >
              Read the FAQ
              <span className="sr-only"> (opens in new tab)</span>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
