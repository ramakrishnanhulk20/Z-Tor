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
    <header className="sticky top-0 z-50 border-b border-line bg-ivory/90 backdrop-blur-md">
      <div className="container-site flex items-center justify-between gap-4 py-4">
        <Link href="/app" className="shrink-0">
          <Wordmark />
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {nav.map((item) => {
            const active =
              pathname === item.href ||
              (item.href === "/app/shield" && pathname === "/app");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm transition-colors duration-200 ${
                  active
                    ? "font-medium text-ink underline decoration-coral decoration-2 underline-offset-8"
                    : "text-muted hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <ConnectButton />
          <button
            type="button"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-paper text-ink lg:hidden"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">Menu</span>
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
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
            className="fixed inset-0 top-[73px] z-40 bg-ink/20 lg:hidden"
            onClick={() => setOpen(false)}
          />
          <nav className="absolute left-0 right-0 top-full z-50 border-b border-line bg-ivory px-4 py-4 shadow-lg lg:hidden">
            <ul className="space-y-1">
              <li>
                <Link
                  href="/app"
                  className={`block rounded-xl px-4 py-3 text-sm ${
                    pathname === "/app"
                      ? "bg-coral-soft font-medium text-ink"
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
                      className={`block rounded-xl px-4 py-3 text-sm ${
                        active
                          ? "bg-coral-soft font-medium text-ink"
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
