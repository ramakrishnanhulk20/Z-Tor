import Link from "next/link";
import { NETWORK_LABEL } from "@/config/display";
import { DOCS_URL } from "@/config/site";

const flows = [
  {
    step: "01",
    title: "Shield",
    description:
      "Mint Zama test tokens and wrap them into confidential cUSDC or cWETH.",
    href: "/app/shield",
    cta: "Start here",
    accent: "border-coral bg-coral-soft",
  },
  {
    step: "02",
    title: "Deposit",
    description:
      "Pick a fixed pool, save your secret note, and send encrypted tokens.",
    href: "/app/deposit",
    cta: "Deposit",
    accent: "border-line bg-ivory",
  },
  {
    step: "03",
    title: "Withdraw",
    description:
      "After the privacy delay, spend your note to any recipient address.",
    href: "/app/withdraw",
    cta: "Withdraw",
    accent: "border-line bg-ivory",
  },
];

const tools = [
  {
    title: "Encrypted stats",
    description: "Live fhEVM demo — encrypted pool counters on-chain.",
    href: "/app/stats",
  },
  {
    title: "Voluntary disclosure",
    description: "Export proof of your own activity for an auditor.",
    href: "/app/disclose",
  },
];

export default function AppHomePage() {
  return (
    <div className="container-site py-12 md:py-16">
      <div className="max-w-2xl">
        <p className="eyebrow text-coral">Z-Tor app</p>
        <h1 className="mt-4 font-serif text-4xl font-medium tracking-tight md:text-5xl">
          Private transfers on {NETWORK_LABEL}.
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-soft">
          Connect your wallet, then follow the flow below. Your secret note is
          the only key to your funds — save it offline before every deposit.
        </p>
      </div>

      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {flows.map((flow) => (
          <Link
            key={flow.href}
            href={flow.href}
            className={`group rounded-2xl border p-6 transition-shadow duration-200 hover:shadow-md ${flow.accent}`}
          >
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
              Step {flow.step}
            </p>
            <h2 className="mt-3 font-serif text-2xl font-medium tracking-tight">
              {flow.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              {flow.description}
            </p>
            <span className="link-arrow mt-5 inline-block">{flow.cta} →</span>
          </Link>
        ))}
      </div>

      <div className="mt-14">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
          More tools
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {tools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="rounded-2xl border border-line bg-paper p-6 transition-colors hover:border-ink/20"
            >
              <h3 className="font-serif text-xl font-medium tracking-tight">
                {tool.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                {tool.description}
              </p>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-14 rounded-2xl border border-coral/30 bg-coral-soft p-6 md:p-8">
        <h2 className="font-serif text-xl font-medium tracking-tight text-coral-dark">
          New here?
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
          Read the{" "}
          <a
            href={DOCS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-coral underline underline-offset-2"
          >
            documentation
          </a>{" "}
          for a plain-language walkthrough, FAQ, and privacy boundaries before
          moving test funds.
        </p>
        <Link href="/" className="btn-secondary mt-4 inline-flex">
          Back to landing
        </Link>
      </div>
    </div>
  );
}
