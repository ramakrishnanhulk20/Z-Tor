"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle: string;
  children: ReactNode;
  eyebrow?: string;
  wide?: boolean;
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
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial={reduced ? { opacity: 1 } : { opacity: 0, y: 24, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: reduced ? 0 : 0.75, ease: [0.16, 1, 0.3, 1] }}
      className={`container-site py-16 md:py-24 ${wide ? "max-w-5xl" : "max-w-2xl"}`}
    >
      <Link
        href="/app"
        className="nav-link-muted inline-flex items-center gap-1.5 !px-0 !py-0"
      >
        <span aria-hidden>←</span> App home
      </Link>

      <header className="mt-8 border-b border-line/80 pb-8 md:mt-10">
        {eyebrow && <p className="eyebrow text-coral">{eyebrow}</p>}
        <h1 className="headline-section mt-4">{title}</h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink-soft md:text-lg">
          {subtitle}
        </p>
      </header>

      {flush ? (
        <div className="mt-10 md:mt-12">{children}</div>
      ) : (
        <div className="card mt-10 p-6 shadow-card md:mt-12 md:p-8">{children}</div>
      )}
    </motion.div>
  );
}
