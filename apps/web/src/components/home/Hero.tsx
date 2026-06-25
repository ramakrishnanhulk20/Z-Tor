"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { NETWORK_LABEL } from "@/config/display";
import { docsPath } from "@/config/site";
import { ScrollDownHint } from "@/components/home/ScrollDownHint";

const facts = [
  "4 fixed pools",
  "cWETH & cUSDC",
  "~10 minute privacy delay",
  NETWORK_LABEL,
];

const ease = [0.22, 1, 0.36, 1] as const;

function HeroIllustration() {
  return (
    <svg
      viewBox="0 0 480 420"
      fill="none"
      aria-hidden
      className="h-auto w-full max-w-md"
    >
      <motion.circle
        cx="120"
        cy="280"
        r="110"
        fill="#C96442"
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.9, ease }}
      />
      <motion.circle
        cx="120"
        cy="280"
        r="64"
        fill="#F0EEE6"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.7, delay: 0.2, ease }}
      />
      <circle cx="120" cy="280" r="10" fill="#181818" />

      <motion.circle
        cx="370"
        cy="120"
        r="78"
        fill="#D4A27F"
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.9, delay: 0.15, ease }}
      />
      <circle cx="370" cy="120" r="10" fill="#181818" />

      <motion.path
        d="M 140 262 C 200 210 280 190 352 136"
        stroke="#181818"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="6 12"
        initial={{ pathLength: 1, opacity: 1 }}
        animate={{ pathLength: [1, 1, 0.35], opacity: [1, 1, 0.25] }}
        transition={{ duration: 3, repeat: Infinity, repeatDelay: 1.5, ease: "easeInOut" }}
      />

      <motion.circle
        cx="246"
        cy="199"
        r="26"
        fill="#FAF9F5"
        stroke="#DEDAD0"
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.path
        d="M 238 199 h 16 M 246 191 v 16"
        stroke="#C96442"
        strokeWidth="2"
        strokeLinecap="round"
        transform="rotate(45 246 199)"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.circle
        cx="430"
        cy="330"
        r="6"
        fill="#C96442"
        animate={{ y: [0, -6, 0], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 3, repeat: Infinity, delay: 0.3 }}
      />
      <motion.circle
        cx="60"
        cy="80"
        r="6"
        fill="#D4A27F"
        animate={{ y: [0, -8, 0], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 3.5, repeat: Infinity }}
      />

      <motion.path
        d="M 30 140 q 20 -24 40 0"
        stroke="#181818"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, delay: 0.5, ease }}
      />
    </svg>
  );
}

export function Hero() {
  return (
    <section className="border-b border-line">
      <div className="container-site grid items-center gap-12 py-20 md:grid-cols-[1.1fr_0.9fr] md:py-28">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease }}
        >
          <p className="eyebrow text-coral">Confidential privacy pools</p>
          <h1 className="mt-5 font-serif text-5xl font-medium leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
            Move funds without leaving a trail.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
            Z-Tor is a privacy tool on {NETWORK_LABEL}. Shield into confidential
            cUSDC or cWETH, deposit into a shared pool, keep your secret note
            safe, and withdraw to any address later with no public link back to
            you.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/app" className="btn-primary">
              Launch app
            </Link>
            <Link href="/app/deposit" className="btn-secondary">
              Make a deposit
            </Link>
            <a
              href={docsPath("how-it-works")}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
            >
              How it works
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease }}
          className="hidden justify-center md:flex"
        >
          <HeroIllustration />
        </motion.div>
      </div>

      <div className="flex justify-center pb-8 pt-2 md:pb-10">
        <ScrollDownHint />
      </div>

      <div className="border-t border-line bg-paper">
        <div className="container-site flex flex-wrap items-center justify-center gap-x-10 gap-y-2 py-4">
          {facts.map((fact, i) => (
            <motion.span
              key={fact}
              className="text-sm text-muted"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + i * 0.1, duration: 0.5, ease }}
            >
              {fact}
            </motion.span>
          ))}
        </div>
      </div>
    </section>
  );
}
