"use client";

import { motion } from "framer-motion";

export function ScrollDownHint() {
  return (
    <motion.a
      href="#how-it-works"
      aria-label="Scroll to see how it works"
      className="group inline-flex flex-col items-center gap-2 text-muted"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2, duration: 0.6 }}
    >
      <span className="text-[10px] font-medium uppercase tracking-[0.2em]">
        Explore
      </span>
      <motion.span
        className="flex h-9 w-5 items-start justify-center rounded-full border border-line pt-1.5"
        animate={{ y: [0, 4, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className="h-1.5 w-0.5 rounded-full bg-coral" />
      </motion.span>
    </motion.a>
  );
}
