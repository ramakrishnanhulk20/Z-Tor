"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Wordmark } from "@/components/Wordmark";
import { DOCS_URL, docsPath } from "@/config/site";

const mobileLinks = [
  { href: DOCS_URL, label: "Docs", external: true },
  { href: docsPath("how-it-works"), label: "How it works", external: true },
  { href: "/privacy", label: "Privacy", external: false },
];

export function MarketingHeader() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-line/50 bg-ivory/75 backdrop-blur-xl">
      <div className="container-site flex h-[4.25rem] items-center justify-between gap-4">
        <Link href="/" className="shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/50 focus-visible:ring-offset-2">
          <Wordmark size={32} />
        </Link>

        <div className="flex items-center gap-2 md:gap-5">
          <nav className="hidden items-center gap-1 md:flex">
            <a href={DOCS_URL} target="_blank" rel="noopener noreferrer" className="nav-link-muted">
              Docs
            </a>
            <Link href="/privacy" className="nav-link-muted">
              Privacy
            </Link>
          </nav>

          <Link href="/app" className="btn-primary text-[13px] md:px-8">
            Launch app
            <span aria-hidden className="text-base leading-none">
              ↗
            </span>
          </Link>

          <button
            type="button"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line/80 bg-paper text-ink md:hidden"
            onClick={() => setOpen((v) => !v)}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              {open ? (
                <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
              ) : (
                <>
                  <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close menu overlay"
            className="fixed inset-0 top-[4.25rem] z-40 bg-ink/20 md:hidden"
            onClick={() => setOpen(false)}
          />
          <nav className="absolute left-0 right-0 top-full z-50 border-b border-line bg-ivory px-4 py-4 shadow-lg md:hidden">
            <ul className="space-y-1">
              {mobileLinks.map((link) => (
                <li key={link.href}>
                  {link.external ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-2xl px-4 py-3 text-sm font-medium text-ink-soft hover:bg-oat"
                      onClick={() => setOpen(false)}
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className="block rounded-2xl px-4 py-3 text-sm font-medium text-ink-soft hover:bg-oat"
                      onClick={() => setOpen(false)}
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </>
      )}
    </header>
  );
}
