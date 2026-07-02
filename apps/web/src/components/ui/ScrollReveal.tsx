"use client";

import { useReducedMotion } from "framer-motion";
import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

const ease = [0.16, 1, 0.3, 1] as const;

export type RevealVariant =
  | "fade-up"
  | "fade-down"
  | "fade-left"
  | "fade-right"
  | "scale"
  | "blur-up"
  | "parallax-up";

const variants: Record<RevealVariant, Variants> = {
  "fade-up": {
    hidden: { opacity: 0, y: 64, filter: "blur(8px)" },
    visible: { opacity: 1, y: 0, filter: "blur(0px)" },
  },
  "fade-down": {
    hidden: { opacity: 0, y: -40, filter: "blur(4px)" },
    visible: { opacity: 1, y: 0, filter: "blur(0px)" },
  },
  "fade-left": {
    hidden: { opacity: 0, x: 72, filter: "blur(6px)" },
    visible: { opacity: 1, x: 0, filter: "blur(0px)" },
  },
  "fade-right": {
    hidden: { opacity: 0, x: -72, filter: "blur(6px)" },
    visible: { opacity: 1, x: 0, filter: "blur(0px)" },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.9, filter: "blur(10px)" },
    visible: { opacity: 1, scale: 1, filter: "blur(0px)" },
  },
  "blur-up": {
    hidden: { opacity: 0, y: 80, filter: "blur(16px)" },
    visible: { opacity: 1, y: 0, filter: "blur(0px)" },
  },
  "parallax-up": {
    hidden: { opacity: 0, y: 48 },
    visible: { opacity: 1, y: 0 },
  },
};

const reducedVariants: Record<RevealVariant, Variants> = {
  "fade-up": { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } },
  "fade-down": { hidden: { opacity: 0, y: -8 }, visible: { opacity: 1, y: 0 } },
  "fade-left": { hidden: { opacity: 0, x: 12 }, visible: { opacity: 1, x: 0 } },
  "fade-right": { hidden: { opacity: 0, x: -12 }, visible: { opacity: 1, x: 0 } },
  scale: { hidden: { opacity: 0 }, visible: { opacity: 1 } },
  "blur-up": { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } },
  "parallax-up": { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } },
};

type Props = {
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: RevealVariant;
  duration?: number;
};

export function ScrollReveal({
  children,
  className = "",
  delay = 0,
  variant = "fade-up",
  duration = 1,
}: Props) {
  const reduced = useReducedMotion();
  const set = reduced ? reducedVariants : variants;

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0, margin: "0px 0px 150px 0px" }}
      variants={set[variant]}
      transition={{ duration: reduced ? 0.25 : duration, ease, delay: reduced ? 0 : delay }}
    >
      {children}
    </motion.div>
  );
}

export function ScrollLine({ className = "" }: { className?: string }) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className={`h-px bg-gradient-to-r from-transparent via-coral/50 to-transparent ${className}`}
      initial={reduced ? { opacity: 1, scaleX: 1 } : { scaleX: 0, opacity: 0 }}
      whileInView={{ scaleX: 1, opacity: 1 }}
      viewport={{ once: true, amount: 0, margin: "0px 0px 80px 0px" }}
      transition={{ duration: reduced ? 0 : 1.4, ease }}
      style={{ originX: 0.5 }}
    />
  );
}
