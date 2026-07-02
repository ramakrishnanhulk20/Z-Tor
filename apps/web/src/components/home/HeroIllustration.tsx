"use client";

import { motion, useReducedMotion } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

type Props = {
  compact?: boolean;
};

export function HeroIllustration({ compact = false }: Props) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial={reduced ? { opacity: 1 } : { opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: reduced ? 0 : 0.9, delay: reduced ? 0 : 0.25, ease }}
      className="relative flex justify-center md:justify-end"
    >
      <svg
        viewBox="0 0 480 420"
        fill="none"
        aria-hidden
        className={
          compact
            ? "h-auto w-full max-h-[9.5rem] max-w-[10.5rem] sm:max-h-[12rem] sm:max-w-[13rem] md:max-h-none md:max-w-[22rem] lg:max-w-md"
            : "h-auto w-full max-w-[11rem] sm:max-w-[15rem] md:max-w-[22rem] lg:max-w-md"
        }
      >
        <motion.circle
          cx="120"
          cy="280"
          r="110"
          fill="#C96442"
          initial={reduced ? false : { scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: reduced ? 0 : 0.9, ease }}
        />
        <motion.circle
          cx="120"
          cy="280"
          r="64"
          fill="#F0EEE6"
          initial={reduced ? false : { scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: reduced ? 0 : 0.7, delay: reduced ? 0 : 0.2, ease }}
        />
        <circle cx="120" cy="280" r="10" fill="#181818" />

        <motion.circle
          cx="370"
          cy="120"
          r="78"
          fill="#D4A27F"
          initial={reduced ? false : { scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: reduced ? 0 : 0.9, delay: reduced ? 0 : 0.15, ease }}
        />
        <circle cx="370" cy="120" r="10" fill="#181818" />

        <motion.path
          d="M 140 262 C 200 210 280 190 352 136"
          stroke="#181818"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="6 12"
          initial={{ pathLength: 1, opacity: 1 }}
          animate={
            reduced
              ? { pathLength: 1, opacity: 1 }
              : { pathLength: [1, 1, 0.35], opacity: [1, 1, 0.25] }
          }
          transition={{
            duration: reduced ? 0 : 3,
            repeat: reduced ? 0 : Infinity,
            repeatDelay: 1.5,
            ease: "easeInOut",
          }}
        />

        <motion.circle
          cx="246"
          cy="199"
          r="26"
          fill="#FAF9F5"
          stroke="#DEDAD0"
          animate={reduced ? undefined : { scale: [1, 1.06, 1] }}
          transition={{ duration: 2.4, repeat: reduced ? 0 : Infinity, ease: "easeInOut" }}
        />
        <motion.path
          d="M 238 199 h 16 M 246 191 v 16"
          stroke="#C96442"
          strokeWidth="2"
          strokeLinecap="round"
          transform="rotate(45 246 199)"
          animate={reduced ? undefined : { opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2.4, repeat: reduced ? 0 : Infinity, ease: "easeInOut" }}
        />

        <motion.circle
          cx="430"
          cy="330"
          r="6"
          fill="#C96442"
          animate={reduced ? undefined : { y: [0, -6, 0], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 3, repeat: reduced ? 0 : Infinity, delay: 0.3 }}
        />
        <motion.circle
          cx="60"
          cy="80"
          r="6"
          fill="#D4A27F"
          animate={reduced ? undefined : { y: [0, -8, 0], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 3.5, repeat: reduced ? 0 : Infinity }}
        />

        <motion.path
          d="M 30 140 q 20 -24 40 0"
          stroke="#181818"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          initial={reduced ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: reduced ? 0 : 1.2, delay: reduced ? 0 : 0.5, ease }}
        />
      </svg>
    </motion.div>
  );
}
