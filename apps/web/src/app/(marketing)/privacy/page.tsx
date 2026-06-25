import type { Metadata } from "next";
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
      <p className="eyebrow text-coral">Our position</p>
      <h1 className="mt-4 font-serif text-5xl font-medium tracking-tight md:text-6xl">
        Privacy &amp; compliance.
      </h1>
      <p className="mt-6 text-lg leading-relaxed text-ink-soft">
        Z-Tor is built on the belief that privacy and accountability can
        coexist. This page explains what we promise to hide, what stays
        public, and where the boundaries are.
      </p>

      <div className="mt-14 space-y-6">
        {commitments.map((item) => (
          <div key={item.title} className="card p-7 md:p-8">
            <h2 className="font-serif text-2xl font-medium tracking-tight">
              {item.title}
            </h2>
            <p className="mt-3 leading-relaxed text-ink-soft">{item.body}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-20 font-serif text-3xl font-medium tracking-tight md:text-4xl">
        What we will not build.
      </h2>
      <ul className="mt-6 space-y-4">
        {[
          "Covert master decryption for operators or anyone else.",
          "Features designed primarily to evade law enforcement.",
          "A mainnet launch without revisiting this policy first.",
        ].map((item) => (
          <li key={item} className="flex gap-3 leading-relaxed text-ink-soft">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-coral" />
            {item}
          </li>
        ))}
      </ul>

      <h2 className="mt-20 font-serif text-3xl font-medium tracking-tight md:text-4xl">
        Your responsibilities.
      </h2>
      <div className="prose-section">
        <p>
          <strong className="font-medium text-ink">Guard your note.</strong>{" "}
          Store it offline. Z-Tor cannot recover a lost note, and anyone who
          holds it can withdraw your funds.
        </p>
        <p>
          <strong className="font-medium text-ink">Use the right network.</strong>{" "}
          Z-Tor runs on {NETWORK_LABEL} for now. Connect your wallet and follow
          the on-screen prompts if you need to switch networks.
        </p>
        <p>
          <strong className="font-medium text-ink">
            Choose withdrawal addresses thoughtfully.
          </strong>{" "}
          The address you withdraw to is public. If it&apos;s already tied to
          you, the privacy you gained is undone.
        </p>
      </div>

      <div className="mt-12 rounded-2xl border border-line bg-oat p-7">
        <h3 className="font-serif text-xl font-medium tracking-tight">
          Early version
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          Z-Tor on {NETWORK_LABEL} is an early release for development and
          demonstration. Behavior may change without migration guarantees until
          a production roadmap is published.
        </p>
      </div>

      <div className="mt-16">
        <a
          href={docsPath("how-it-works")}
          target="_blank"
          rel="noopener noreferrer"
          className="link-arrow"
        >
          Read how Z-Tor works →
        </a>
      </div>
    </div>
  );
}
