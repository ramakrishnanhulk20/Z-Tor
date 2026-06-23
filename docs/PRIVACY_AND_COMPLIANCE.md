# Z-Tor — Privacy & Compliance Boundary

This document defines what Z-Tor promises to hide, what stays public, and how voluntary disclosure works. It guides implementation and public messaging.

## Privacy goals

| Data | Default on-chain visibility | Z-Tor target |
|------|----------------------------|--------------|
| Deposit ↔ withdraw link | Hidden (via nullifier + proof) | Hidden |
| Deposit amount (within tier) | Same for all in pool | Hidden tier membership where FHE applies |
| Pool total liquidity | Often public | Encrypted aggregate where feasible (Phase 1+) |
| User identity | Never on-chain | Never required in v1 |

## Public by necessity (Ethereum)

Even with strong cryptography, some metadata remains:

- Transaction timestamps and gas payer
- That *someone* interacted with Z-Tor contracts
- Withdrawal recipient address (chosen by user)

The UI must explain these limits plainly.

## Compliance model (v1 design)

Inspired by “what if Tornado had been built with disclosure in mind” — **without** default surveillance:

### Principles

1. **Privacy by default** — No mandatory KYC on testnet v1.
2. **User-initiated disclosure** — Only the note holder (or someone they delegate) can trigger proofs relevant to a third party.
3. **No global backdoor** — No admin key that decrypts all users silently; auditor access is scoped and documented.
4. **Honest marketing** — “Confidential transfers with optional auditability,” not “untraceable illegal flows.”

### Planned mechanisms (phased)

| Phase | Feature |
|-------|---------|
| 1 | Note-derived viewing key: user exports proof package for a single deposit/withdraw |
| 1+ | fhEVM `FHE.allow` + async decrypt for encrypted pool fields user authorizes |
| 2 | Optional allowlisted auditor contract role (aggregate stats only) |
| 2+ | Mainnet legal review before any mandatory compliance hooks |

### What we will not implement

- Covert master decryption for operators
- Features documented primarily to evade law enforcement
- Mainnet launch without revisiting this document

## User responsibilities

- Store the **secret note** offline; Z-Tor cannot recover it.
- Use **Sepolia** for v1; do not send mainnet assets.
- Understand withdrawal address choice affects real-world traceability to the recipient wallet.

## Testnet disclaimer

Sepolia Z-Tor is for **development and demonstration**. Tokens have no real value. Behavior may change without migration guarantees until a mainnet roadmap is published.
