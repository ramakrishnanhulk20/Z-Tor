"use client";

import { motion } from "framer-motion";

const ease = [0.16, 1, 0.3, 1] as const;

export function ScrollDownHint() {
  return (
    <motion.a
      href="#how-it-works"
      aria-label="Scroll to see how it works"
      className="group inline-flex flex-col items-center gap-2.5 text-muted"
      initial={{ opacity: 0.6 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease }}
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.22em]">
        Scroll
      </span>
      <motion.span
        className="flex h-10 w-[1.375rem] items-start justify-center rounded-full border border-line/80 pt-2"
        animate={{ y: [0, 5, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className="h-1.5 w-0.5 rounded-full bg-coral" />
      </motion.span>
    </motion.a>
  );
}
