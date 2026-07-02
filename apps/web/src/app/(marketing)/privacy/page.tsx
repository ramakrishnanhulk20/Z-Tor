import type { Metadata } from "next";
import Link from "next/link";
import { NETWORK_LABEL } from "@/config/display";
import { docsPath } from "@/config/site";

export const metadata: Metadata = {
  title: "Privacy & compliance | Z-Tor",
  description:
    "What Z-Tor hides, what stays public, and how voluntary disclosure works. Privacy by default, accountability on your terms.",
};

const commitments = [
  {
    title: "Privacy by default",
    body: "You don\u2019t hand over your identity to use Z-Tor. No sign-up, no KYC. The protocol hides the link between your deposit and your withdrawal as a baseline, not as a premium feature. Confidential token balances stay encrypted on-chain until you decrypt them yourself.",
  },
  {
    title: "Disclosure only you can trigger",
    body: "Sometimes you need to prove your own history to an accountant, an employer, or a regulator. Z-Tor is designed so the note holder can voluntarily export proof of a specific deposit and withdrawal. Only you can start that process, and it reveals only what you choose.",
  },
  {
    title: "No global backdoor",
    body: "There is no admin key that silently decrypts everyone's activity. Any future auditor access will be scoped, documented, and visible in the open-source contracts. It will never be covert.",
  },
  {
    title: "Honest marketing",
    body: "Z-Tor is confidential transfers with optional auditability. It is not built or positioned as a tool for hiding illegal activity, and we won\u2019t pretend a public blockchain hides more than it does.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="container-site max-w-3xl py-16 md:py-24">
      <header className="border-b border-line/80 pb-10 md:pb-12">
        <p className="eyebrow text-coral">Policy</p>
        <h1 className="headline-hero mt-5">Privacy &amp; compliance.</h1>
        <p className="mt-6 text-lg leading-relaxed text-ink-soft">
          Z-Tor is built on the belief that privacy and accountability can
          coexist. This page defines what we promise to hide, what remains
          public, and where the boundaries are.
        </p>
      </header>

      <div className="mt-14 space-y-4">
        {commitments.map((item) => (
          <article
            key={item.title}
            className="rounded-2xl border border-line/80 bg-paper p-7 md:p-8"
          >
            <h2 className="headline-card">{item.title}</h2>
            <p className="mt-4 leading-relaxed text-ink-soft">{item.body}</p>
          </article>
        ))}
      </div>

      <section className="mt-20 border-t border-line/80 pt-14">
        <h2 className="headline-section">What we will not build.</h2>
        <ul className="mt-8 space-y-4">
          {[
            "Covert master decryption for operators or anyone else.",
            "Features designed primarily to evade law enforcement.",
            "A mainnet launch without revisiting this policy first.",
          ].map((item) => (
            <li key={item} className="flex gap-3 leading-relaxed text-ink-soft">
              <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-coral" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-20 border-t border-line/80 pt-14">
        <h2 className="headline-section">Your responsibilities.</h2>
        <div className="prose-section mt-8">
          <p>
            <strong className="font-semibold text-ink">Guard your note.</strong>{" "}
            Store it offline. Z-Tor cannot recover a lost note, and anyone who
            holds it can withdraw your funds.
          </p>
          <p>
            <strong className="font-semibold text-ink">Use the right network.</strong>{" "}
            Z-Tor runs on {NETWORK_LABEL} for now. Connect your wallet and follow
            the on-screen prompts if you need to switch networks.
          </p>
          <p>
            <strong className="font-semibold text-ink">
              Choose withdrawal addresses thoughtfully.
            </strong>{" "}
            The address you withdraw to is public. If it&apos;s already tied to
            you, the privacy you gained is undone.
          </p>
        </div>
      </section>

      <div className="mt-12 rounded-2xl border border-line bg-oat/60 p-7 md:p-8">
        <h3 className="headline-card">Early version</h3>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft md:text-base">
          Z-Tor on {NETWORK_LABEL} is an early release for development and
          demonstration. Behavior may change without migration guarantees until
          a production roadmap is published.
        </p>
      </div>

      <div className="mt-14 flex flex-wrap gap-4">
        <a
          href={docsPath("how-it-works")}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary"
        >
          How Z-Tor works
          <span aria-hidden className="text-base leading-none">
            ↗
          </span>
          <span className="sr-only"> (opens in new tab)</span>
        </a>
        <Link href="/" className="btn-secondary">
          Back to landing
        </Link>
      </div>
    </div>
  );
}
