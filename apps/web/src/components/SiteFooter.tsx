import Link from "next/link";

import { ExternalLink } from "@/components/ExternalLink";
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
    { href: docsPath("user-guide"), label: "User guide", external: true },
  ];

  const resourcesLinks = [
    { href: "https://docs.zama.org/protocol", label: "Zama Protocol" },
    { href: "https://faucet.circle.com/", label: "Get test tokens" },
  ];

  const legalLinks = [{ href: "/privacy", label: "Privacy", external: false }];

  const columns = [
    { title: "Product", links: productLinks.map((l) => ({ ...l, external: false })) },
    { title: "Learn", links: learnLinks },
    {
      title: "Resources",
      links: resourcesLinks.map((l) => ({ ...l, external: true })),
    },
    { title: "Legal", links: legalLinks },
  ];

  return (
    <footer className="border-t border-line bg-slate text-paper">
      <div className="container-site py-16 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr] lg:gap-16">
          <div>
            <Wordmark tone="light" />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-paper/60">
              Confidential transfer infrastructure on {NETWORK_LABEL}. Fixed
              pools, encrypted balances, and unlinkable withdrawals for
              institutions that require privacy without sacrificing verifiability.
            </p>
          </div>

          <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
            {columns.map((col) => (
              <div key={col.title}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-paper/45">
                  {col.title}
                </p>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      {"external" in link && link.external ? (
                        <ExternalLink
                          href={link.href}
                          showIcon={false}
                          className="text-sm text-paper/70 transition-colors hover:text-paper focus-visible:rounded-sm"
                        >
                          {link.label}
                        </ExternalLink>
                      ) : (
                        <Link
                          href={link.href}
                          className="text-sm text-paper/70 transition-colors hover:text-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kraft/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-paper/10">
        <div className="container-site flex flex-col gap-2 py-6 text-xs text-paper/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Z-Tor</p>
          <p>Confidential transfers on {NETWORK_LABEL}</p>
        </div>
      </div>
    </footer>
  );
}
