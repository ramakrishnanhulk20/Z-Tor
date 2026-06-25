"use client";

import Link from "next/link";
import { ConnectButton } from "@/components/ConnectButton";
import { Wordmark } from "@/components/Wordmark";
import { DOCS_URL } from "@/config/site";

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-ivory/90 backdrop-blur-md">
      <div className="container-site flex items-center justify-between gap-4 py-4">
        <Link href="/" className="shrink-0">
          <Wordmark />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <a
            href={DOCS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted transition-colors duration-200 hover:text-ink"
          >
            Docs
          </a>
          <Link
            href="/privacy"
            className="text-sm text-muted transition-colors duration-200 hover:text-ink"
          >
            Privacy
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <ConnectButton />
          <Link href="/app" className="btn-primary hidden sm:inline-flex">
            Launch app
          </Link>
          <Link href="/app" className="btn-primary sm:hidden">
            Launch
          </Link>
        </div>
      </div>
    </header>
  );
}
