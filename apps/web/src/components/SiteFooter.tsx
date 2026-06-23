import Link from "next/link";

import { Wordmark } from "@/components/Wordmark";

import { NETWORK_LABEL } from "@/config/display";



const columns = [

  {

    title: "Product",

    links: [

      { href: "/shield", label: "Shield tokens" },

      { href: "/deposit", label: "Deposit" },

      { href: "/withdraw", label: "Withdraw" },

      { href: "/stats", label: "Encrypted stats" },

      { href: "/disclose", label: "Voluntary disclosure" },

    ],

  },

  {

    title: "Learn",

    links: [

      { href: "/how-it-works", label: "How it works" },

      { href: "/privacy", label: "Privacy & compliance" },

      { href: "/faq", label: "FAQ" },

    ],

  },

];



const external = [

  { href: "https://docs.zama.org/homepage", label: "Zama docs" },

  { href: "https://docs.zama.org/protocol", label: "Zama Protocol" },

  { href: "https://faucet.circle.com/", label: "Get test tokens" },

];



export function SiteFooter() {

  return (

    <footer className="bg-slate text-paper">

      <div className="container-site grid gap-12 py-16 md:grid-cols-[1.5fr_1fr_1fr_1fr]">

        <div>

          <Wordmark tone="light" />

          <p className="mt-4 max-w-xs text-sm leading-relaxed text-paper/60">

            Private transfers on {NETWORK_LABEL}. Confidential cUSDC and cWETH

            pools with unlinkable withdrawals. Privacy by default, disclosure on

            your terms.

          </p>

        </div>

        {columns.map((col) => (

          <div key={col.title} className="space-y-3">

            <p className="text-xs font-medium uppercase tracking-[0.14em] text-paper/40">

              {col.title}

            </p>

            {col.links.map((link) => (

              <Link

                key={link.href}

                href={link.href}

                className="block text-sm text-paper/70 transition-colors hover:text-paper"

              >

                {link.label}

              </Link>

            ))}

          </div>

        ))}

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

