# How Z-Tor works

On a public blockchain, anyone can follow your money. Every payment you make is permanently linked to your address. Z-Tor breaks that link — not by hiding the blockchain, but by making your deposit look exactly like everyone else's, while keeping pool economics encrypted with fully homomorphic encryption.

---

## 1. Shield into confidential tokens

Z-Tor pools accept only cUSDC and cWETH (ERC-7984 tokens where balances are encrypted on-chain). In the app, mint test WETH or USDC, wrap them into confidential form, and decrypt your balance locally whenever you want to see it.

## 2. Deposit into a pool

Choose one of four fixed pools (0.1 cWETH, 1 cWETH, 100 cUSDC, or 1,000 cUSDC) and deposit exactly that amount. Because every deposit in a pool is the same size, yours is indistinguishable from all the others.

Your deposit amount is encrypted, so the pool can't simply read it. Instead it runs a homomorphic check — *“does this encrypted amount equal the pool size?”* — and Zama's network signs the yes/no answer. A quick second confirmation submits that signed answer, and only then does your note become spendable. If the amount is ever wrong, the tokens are refunded automatically and no note is created. This keeps every pool exactly solvent without revealing a single amount.

## 3. Keep your secret note

Z-Tor gives you a secret note: a single line of text starting with `ztor-`. It is the only proof that one of the deposits in the pool is yours. Write it down, store it offline, and never share it. Anyone holding the note can withdraw the funds, and nobody can recover a lost one.

## 4. Wait a little

Withdrawals unlock 10 minutes after the deposit. This short delay matters: withdrawing in the same breath as depositing would make the two easy to match.

## 5. Withdraw anywhere

Paste your note and choose any address to receive confidential cUSDC or cWETH, ideally a fresh one. The contract verifies your note cryptographically without revealing which deposit it came from, so on-chain there is no link between where the money entered and where it left.

---

## What stays private, and what doesn't

We'd rather be honest than impressive. Strong cryptography hides the link between deposit and withdrawal, but a public blockchain still shows some things to everyone.

| Item | Status |
|------|--------|
| Which deposit funded your withdrawal | **Hidden** |
| Your confidential token balance (until you decrypt) | **Encrypted** |
| Your secret note | **Never leaves your hands** |
| Your identity | **Never required** |
| That some address interacted with Z-Tor | Public |
| Transaction timestamps and gas payer | Public |
| The withdrawal address you choose | Public |

---

## The fine print

**Confidential tokens only.** Pools hold cUSDC and cWETH, not plain USDC or ETH. Shield first in the app, or let the deposit flow mint and wrap for you automatically.

**Encrypted balances.** Your cUSDC or cWETH balance is stored as ciphertext on-chain. Use Decrypt on the Shield page to view it locally. Z-Tor never receives your decrypted amount.

**Your withdrawal address matters.** If you withdraw to an address already tied to you, you re-create the link Z-Tor just broke. Use a fresh address when privacy matters.

**Network.** Z-Tor currently runs on Ethereum Sepolia. Connect your wallet and follow the on-screen prompts if you need to switch networks.

---

**Launch the app:** [z-tor-web.vercel.app/app](https://z-tor-web.vercel.app/app)

See also: [User guide](USER_GUIDE.md) · [Privacy & compliance](PRIVACY_AND_COMPLIANCE.md)
