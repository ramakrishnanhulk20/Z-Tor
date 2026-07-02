"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { useRef, type CSSProperties } from "react";
import { HeroAmbientGlow } from "@/components/home/HeroAmbientGlow";
import { HeroIllustration } from "@/components/home/HeroIllustration";
import { ScrollDownHint } from "@/components/home/ScrollDownHint";
import { NETWORK_LABEL } from "@/config/display";
import { docsPath } from "@/config/site";

const facts = [
  "4 fixed pools",
  "cWETH & cUSDC",
  "~10 min privacy delay",
  NETWORK_LABEL,
];

const ease = [0.16, 1, 0.3, 1] as const;

/** Matches MarketingHeader height */
const HEADER_H = "4.25rem";

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const glowY = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : 80]);
  const glowOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0]);
  const illustrationY = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : 40]);

  return (
    <section ref={ref} className="relative border-b border-line">
      {/* Fixed first screen — scroll hint pinned to bottom */}
      <div
        className="relative isolate overflow-hidden md:min-h-[calc(100svh-var(--header-h))]"
        style={
          {
            "--header-h": HEADER_H,
            height: `calc(100dvh - ${HEADER_H})`,
          } as CSSProperties
        }
      >
        <motion.div
          aria-hidden
          style={{ y: glowY, opacity: glowOpacity }}
          className="pointer-events-none absolute inset-0 z-0"
        >
          <HeroAmbientGlow />
        </motion.div>

        {/* Main content — scrolls internally if needed, padded for pinned hint */}
        <div className="container-site relative z-10 h-full overflow-y-auto overflow-x-hidden pb-[4.5rem] pt-5 md:overflow-visible md:pb-24 md:pt-16 lg:pt-20">
          <div className="grid items-center gap-3 sm:gap-4 md:min-h-[calc(100svh-var(--header-h)-8rem)] md:grid-cols-[1.05fr_0.95fr] md:gap-12">
            <motion.div
              initial={reduced ? { opacity: 1 } : { opacity: 0, y: 32, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: reduced ? 0 : 0.8, ease }}
            >
              <p className="eyebrow text-coral">Confidential privacy pools</p>
              <h1 className="headline-hero mt-2 md:mt-6">
                Move value onchain without exposing the trail.
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-soft sm:mt-4 sm:text-base md:mt-8 md:text-xl">
                Confidential transfers on {NETWORK_LABEL}. Shield, deposit into
                fixed pools, and withdraw with no public link.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 sm:mt-6 md:mt-10 md:gap-4">
                <Link href="/app" className="btn-primary !px-5 !py-2.5 text-[13px] sm:!py-3 sm:text-sm">
                  Launch app
                  <span aria-hidden className="text-base leading-none">
                    ↗
                  </span>
                </Link>
                <a
                  href={docsPath("how-it-works")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary !px-5 !py-2.5 text-[13px] sm:!py-3 sm:text-sm"
                >
                  How it works
                </a>
              </div>

              {/* Key facts inline on mobile — visible without scrolling past hero */}
              <ul className="mt-4 flex flex-wrap gap-x-3 gap-y-1 md:hidden">
                {facts.map((fact) => (
                  <li key={fact} className="text-[10px] font-medium text-muted">
                    {fact}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              style={{ y: illustrationY }}
              className="flex justify-center md:justify-end"
            >
              <HeroIllustration compact />
            </motion.div>
          </div>
        </div>

        {/* Scroll hint — always pinned to bottom of first screen */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-ivory from-50% via-ivory/80 to-transparent pt-8 md:pt-12">
          <div className="pointer-events-auto flex justify-center pb-3 md:pb-6">
            <ScrollDownHint />
          </div>
        </div>
      </div>

      {/* Desktop facts strip — below first screen */}
      <div className="relative z-10 hidden border-t border-line/80 bg-paper/80 backdrop-blur-sm md:block">
        <div className="container-site flex flex-wrap items-center justify-center gap-x-10 gap-y-2 py-4 md:py-5">
          {facts.map((fact) => (
            <span key={fact} className="text-sm font-medium text-muted">
              {fact}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
