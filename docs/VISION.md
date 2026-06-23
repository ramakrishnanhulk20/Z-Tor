# Z-Tor — Vision

Z-Tor is a confidential transfer pool on Ethereum, inspired by fixed-denomination privacy pools, rebuilt for a world where **privacy and accountability can coexist**.

## Problem

Classic mixer designs proved that users want to **break the on-chain link** between deposit and withdrawal. They also showed the limits of **plaintext pool accounting** and **no voluntary disclosure path** when products face real-world scrutiny.

## What Z-Tor does

1. **Mix / unlink (primary)** — Users deposit into fixed-size pools (ETH and USDC on Sepolia), receive a **secret note**, and later withdraw to an address they choose without revealing which deposit funded the withdrawal.
2. **Encrypted economics (Zama FHE)** — Pool-level and balance logic that should stay private uses fhEVM on **Sepolia**, aligned with [Zama Protocol](https://docs.zama.org/protocol).
3. **Compliance-ready design (not surveillance-by-default)** — Users can **opt in** to prove specific activity to an auditor; the protocol does not KYC everyone by default in v1.

## What we are not building

- A tool positioned for sanctions evasion, laundering, or illicit use.
- Mainnet deployment in Phase 0–1 (Sepolia testnet only until explicitly planned).

## Target user

Privacy-conscious individuals and teams who may later use mainnet in regulated markets, with UX clear enough that a non-developer can deposit and withdraw with MetaMask.

## Brand

- **Name:** Z-Tor
- **UI language (v1):** English only
- **Visual tone:** Dark, minimal, privacy-tool aesthetic (Tornado-inspired, not a clone)

## Success criteria (v1)

- Technically sound monorepo: contracts (Hardhat + fhEVM), web app, tests, documented architecture.
- Outstanding UX: note safety, network warnings, step-by-step flows.
- Code reads like a focused human team wrote it — small modules, consistent naming, no agent slop.
