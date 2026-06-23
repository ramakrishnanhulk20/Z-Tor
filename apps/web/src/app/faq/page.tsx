import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { NETWORK_LABEL } from "@/config/display";

export const metadata: Metadata = {
  title: "FAQ | Z-Tor",
  description:
    "Common questions about Z-Tor: confidential tokens, notes, pools, the privacy delay, wallets, and what happens if something goes wrong.",
};

const faqs = [
  {
    q: "What is Z-Tor, in one sentence?",
    a: `Z-Tor is a privacy tool on ${NETWORK_LABEL} that lets you deposit confidential cUSDC or cWETH into a shared pool and withdraw them later to a different address, with no public link between the two.`,
  },
  {
    q: "What tokens does Z-Tor use?",
    a: "Z-Tor pools only accept Zama confidential tokens: cUSDC and cWETH (ERC-7984). Plain USDC or WETH cannot be deposited directly. Use the Shield page to mint official Zama test tokens, wrap them into confidential form, and decrypt your balance when you want to see it.",
  },
  {
    q: "Where do test tokens come from?",
    a: "We use the official Zama Sepolia contract addresses from their documentation — not custom tokens. The Shield page lists the exact mint and wrapper addresses. They are free test assets with no real-world value.",
  },
  {
    q: "What are cUSDC and cWETH?",
    a: "They are ERC-7984 confidential tokens built on Zama's fhEVM. Your balance is stored encrypted on-chain. Observers see a ciphertext handle, not a number. Only you can decrypt your own balance in your browser, with a wallet signature.",
  },
  {
    q: "How do I get cUSDC or cWETH?",
    a: "Go to Shield in the header: mint test WETH or USDC, then shield (wrap) them into cWETH or cUSDC. The deposit page can also top up automatically if you are short — but Shield gives you full control and clearer steps.",
  },
  {
    q: "Why does Deposit say 'checking balance' instead of minting?",
    a: "Deposit first verifies whether you already hold enough confidential tokens. Minting and shielding only run if you are short. If you shielded on the Shield page first, you should see a balance check and then go straight to the deposit transaction.",
  },
  {
    q: "What exactly is a note?",
    a: "A note is a single line of text, starting with ztor-, that you receive when you deposit. It is the only proof that one of the deposits in the pool is yours, and the only key that can withdraw the funds. Treat it like cash.",
  },
  {
    q: "What happens if I lose my note?",
    a: "Your funds are gone permanently. There is no recovery, no support ticket, and no admin who can help. Save your note offline before confirming a deposit.",
  },
  {
    q: "Why can I only deposit fixed amounts?",
    a: "Fixed pools (0.1 cWETH, 1 cWETH, 100 cUSDC, 1,000 cUSDC) give the strongest privacy because every deposit looks identical. You can also create a custom-amount pool, but privacy is weaker until more people use that exact amount.",
  },
  {
    q: "Why do I have to wait 10 minutes to withdraw?",
    a: "A withdrawal that follows a deposit within seconds is easy to match to it. The short delay blends your withdrawal in with other activity.",
  },
  {
    q: "Which wallet do I need?",
    a: `Any browser wallet that supports ${NETWORK_LABEL}, such as MetaMask. Click Connect wallet in the header. If you are on the wrong network, Z-Tor will offer to switch you.`,
  },
  {
    q: "Can anyone see my confidential balance?",
    a: "On-chain, your cUSDC or cWETH balance appears as an encrypted handle, not a readable number. Only you can decrypt it locally. Pool stats like active-note counts are also encrypted at the contract level.",
  },
  {
    q: "Can anyone see what I am doing?",
    a: "The blockchain shows that some address interacted with Z-Tor, when, and which address received a withdrawal. What stays hidden is the link between a specific deposit and a specific withdrawal. For best results, withdraw to a fresh address.",
  },
  {
    q: "What is the relayer?",
    a: "An optional service that submits your withdrawal transaction so the recipient address does not need Sepolia ETH for gas. It charges a small fee (1% by default). Your proof binds the recipient and fee — the relayer cannot redirect funds.",
  },
  {
    q: "Is this legal? What about compliance?",
    a: "Z-Tor is designed around privacy by default with voluntary disclosure: only you can prove your own activity to a third party when you choose to. There is no surveillance backdoor. See our Privacy & compliance page for the full picture.",
  },
  {
    q: "I have an old note. Will it still work?",
    a: "Only if it was created on the current pool deployment listed in our docs. Notes from superseded Sepolia pools cannot withdraw — make a fresh deposit and save the new note.",
  },
];

export default function FaqPage() {
  return (
    <PageShell
      wide
      flush
      eyebrow="Support"
      title="Questions, answered"
      subtitle="Plain-language answers before you try Z-Tor. For a full walkthrough, see the user guide or how-it-works page."
    >
      <div className="glass-card divide-y divide-line">
        {faqs.map((faq) => (
          <details key={faq.q} className="group px-6 py-5 md:px-8">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-serif text-lg font-medium tracking-tight md:text-xl [&::-webkit-details-marker]:hidden">
              {faq.q}
              <span className="shrink-0 text-coral transition-transform duration-200 group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink-soft">{faq.a}</p>
          </details>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/shield" className="btn-primary">
          Shield tokens
        </Link>
        <Link href="/deposit" className="btn-secondary">
          Make a deposit
        </Link>
        <Link href="/how-it-works" className="btn-secondary">
          Full guide
        </Link>
        <Link href="/privacy" className="btn-secondary">
          Privacy &amp; compliance
        </Link>
      </div>
    </PageShell>
  );
}
