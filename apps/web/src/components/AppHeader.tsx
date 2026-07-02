"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ConnectButton } from "@/components/ConnectButton";
import { Wordmark } from "@/components/Wordmark";

const nav = [
  { href: "/app/shield", label: "Shield" },
  { href: "/app/deposit", label: "Deposit" },
  { href: "/app/withdraw", label: "Withdraw" },
  { href: "/app/stats", label: "Stats" },
  { href: "/app/disclose", label: "Disclosure" },
];

export function AppHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

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
        <Link
          href="/app"
          className="shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/50 focus-visible:ring-offset-2"
        >
          <Wordmark size={32} />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${
                  active ? "bg-ink text-paper" : "text-muted hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 md:gap-3">
          <ConnectButton />
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
              <li>
                <Link
                  href="/app"
                  className={`block rounded-2xl px-4 py-3 text-sm font-medium ${
                    pathname === "/app"
                      ? "bg-ink text-paper"
                      : "text-ink-soft hover:bg-oat"
                  }`}
                >
                  App home
                </Link>
              </li>
              {nav.map((item) => {
                const active = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`block rounded-2xl px-4 py-3 text-sm font-medium ${
                        active
                          ? "bg-ink text-paper"
                          : "text-ink-soft hover:bg-oat"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </>
      )}
    </header>
  );
}
