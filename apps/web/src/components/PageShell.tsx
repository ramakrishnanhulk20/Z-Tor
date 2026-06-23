"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle: string;
  children: ReactNode;
  eyebrow?: string;
  /** Wider layout for stats / shield grids */
  wide?: boolean;
  /** Render children outside the card wrapper */
  flush?: boolean;
};

export function PageShell({
  title,
  subtitle,
  children,
  eyebrow,
  wide = false,
  flush = false,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className={`container-site py-14 md:py-20 ${wide ? "max-w-5xl" : "max-w-2xl"}`}
    >
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink"
      >
        <span aria-hidden>←</span> Back to home
      </Link>

      <header className="mt-10 border-b border-line pb-8">
        {eyebrow && <p className="eyebrow mb-3 text-coral">{eyebrow}</p>}
        <h1 className="font-serif text-4xl font-medium tracking-tight md:text-5xl">{title}</h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-ink-soft">{subtitle}</p>
      </header>

      {flush ? (
        <div className="mt-10">{children}</div>
      ) : (
        <div className="card mt-10 p-6 shadow-card md:p-8">{children}</div>
      )}
    </motion.div>
  );
}
