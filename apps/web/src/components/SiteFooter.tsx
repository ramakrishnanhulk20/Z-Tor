import Link from "next/link";

import { Wordmark } from "@/components/Wordmark";

import { NETWORK_LABEL } from "@/config/display";
import { DOCS_URL, docsPath } from "@/config/site";

type FooterProps = {
  variant?: "marketing" | "app";
};

export function SiteFooter({ variant = "marketing" }: FooterProps) {
  const productLinks =
    variant === "app"
      ? [
          { href: "/app/shield", label: "Shield" },
          { href: "/app/deposit", label: "Deposit" },
          { href: "/app/withdraw", label: "Withdraw" },
          { href: "/app/stats", label: "Stats" },
          { href: "/app/disclose", label: "Disclosure" },
        ]
      : [
          { href: "/app", label: "Launch app" },
          { href: "/app/shield", label: "Shield tokens" },
          { href: "/app/deposit", label: "Deposit" },
          { href: "/app/withdraw", label: "Withdraw" },
        ];

  const learnLinks = [
    { href: DOCS_URL, label: "Documentation", external: true },
    { href: docsPath("how-it-works"), label: "How it works", external: true },
    { href: docsPath("faq"), label: "FAQ", external: true },
    { href: "/privacy", label: "Privacy", external: false },
  ];

  const external = [
    { href: "https://docs.zama.org/protocol", label: "Zama Protocol" },
    { href: "https://faucet.circle.com/", label: "Get test tokens" },
  ];

  return (
    <footer className="bg-slate text-paper">
      <div className="container-site grid gap-12 py-16 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <Wordmark tone="light" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-paper/60">
            Private transfers on {NETWORK_LABEL}. Confidential cUSDC and cWETH
            pools with unlinkable withdrawals.
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-paper/40">
            Product
          </p>
          {productLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block text-sm text-paper/70 transition-colors hover:text-paper"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-paper/40">
            Learn
          </p>
          {learnLinks.map((link) =>
            link.external ? (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-paper/70 transition-colors hover:text-paper"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className="block text-sm text-paper/70 transition-colors hover:text-paper"
              >
                {link.label}
              </Link>
            ),
          )}
        </div>

        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-paper/40">
            Resources
          </p>
          {external.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm text-paper/70 transition-colors hover:text-paper"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>

      <div className="border-t border-paper/10 py-5">
        <p className="container-site text-xs text-paper/40">
          © 2026 Z-Tor · Private transfers on {NETWORK_LABEL}
        </p>
      </div>
    </footer>
  );
}
