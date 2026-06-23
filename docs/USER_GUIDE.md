# Z-Tor user guide

This guide explains Z-Tor in plain language — no Solidity required.

---

## What is Z-Tor?

Z-Tor lets you move **confidential test tokens** (cUSDC or cWETH on Sepolia) through a shared pool so that:

- Your **deposit** and **withdrawal** are not publicly linked on-chain
- Pool **balances and stats** can stay encrypted using Zama's fhEVM
- **You** hold the only key to your funds — a secret **note**

Think of it like dropping identical envelopes into a box and picking one up later with a ticket only you have.

---

## Before you start

1. Install [MetaMask](https://metamask.io/) and add **Sepolia** testnet
2. Get free Sepolia ETH from a [faucet](https://sepoliafaucet.com/)
3. Open [Z-Tor](https://z-tor-web.vercel.app) and click **Connect wallet**

Everything runs on **Sepolia testnet**. Tokens have **no real value**.

---

## Step 1 — Shield (get confidential tokens)

Z-Tor pools only accept **cUSDC** and **cWETH** — not plain USDC or WETH.

Go to **Shield** in the menu:

1. **Mint test tokens** — free USDC/WETH from Zama's official Sepolia contracts (addresses listed on the Shield page)
2. **Shield** — wrap plain tokens into confidential form
3. **Decrypt balance** (optional) — view your cUSDC/cWETH amount in the browser only

Your encrypted balance lives on Ethereum. Observers see a ciphertext handle, not a number.

---

## Step 2 — Deposit

Go to **Deposit**:

1. Choose a **fixed pool** (0.1 cWETH, 1 cWETH, 100 cUSDC, 1,000 cUSDC) or a **custom amount**
2. Click **Generate my secret note**
3. **Save the note** — copy it, download the file, write it offline. **If you lose it, funds are gone forever.**
4. Check the box confirming you saved it
5. Click **Deposit**

### What happens when you click Deposit?

| Step | What you see | What actually happens |
|------|--------------|------------------------|
| Balance check | "Checking confidential balance…" | App reads your encrypted token balance (may ask for a wallet signature to decrypt locally) |
| Top up (only if needed) | "Minting…" or "Shielding…" | If you are short, mints test tokens and shields them — **skipped if you already have enough from the Shield page** |
| Deposit | "Confirm deposit in wallet" | One transaction sends encrypted tokens to the pool via Zama FHE |

**Tip:** Shield first on the Shield page if you want full control. Deposit only tops up what is missing.

---

## Step 3 — Wait (~10 minutes)

After deposit, a **privacy delay** runs. Withdrawing instantly would make it easy to link deposit and withdrawal.

The app shows a countdown. You can close the tab — your note and the on-chain deposit remain valid.

---

## Step 4 — Withdraw

Go to **Withdraw**:

1. Paste your **secret note** (or load the file you saved)
2. Enter a **recipient address** — use a **fresh address** for best privacy, not your deposit wallet
3. Choose **relayer** (recipient needs no gas, small fee) or **your wallet** (no fee, you pay gas)
4. Click **Withdraw**

The app:

1. Checks your note against the pool
2. Builds a **zero-knowledge proof** in your browser (your secret never leaves the device)
3. Submits the withdrawal

After success, the note is **spent** — it cannot be used again.

---

## Optional features

### Stats (`/stats`)

See public deposit counts and **encrypted** pool TVL / active-note handles — a live fhEVM demo.

### Disclosure (`/disclose`)

Generate a JSON report proving what **one note** did — for an auditor or tax helper. Only you can create it. Sharing reveals that note's history only.

### FAQ (`/faq`)

Common questions about notes, delays, wallets, and old deployments.

---

## Important warnings

- **Save your note** before depositing
- **Sepolia only** — testnet, not mainnet
- **Old notes** from superseded pool deployments cannot withdraw — make a fresh deposit on current pools
- **Privacy is not perfect** — network timing, IP addresses, and wallet habits can still leak information. Use fresh addresses and the relayer when possible

---

## Need help?

- Live app: [z-tor-web.vercel.app](https://z-tor-web.vercel.app)
- In-app: [FAQ](/faq) and [How it works](/how-it-works)
- Technical: [ARCHITECTURE.md](./ARCHITECTURE.md)
- Contract addresses: [DEPLOYMENTS.md](./DEPLOYMENTS.md)
