# Z-Tor — Architecture

## High-level system

```mermaid
flowchart TB
  subgraph client [Web App - apps/web]
    UI[Dark UI + MetaMask]
    Note[Note encode/decode]
    Enc[Relayer SDK]
  end

  subgraph chain [Sepolia]
    Pool[ZTorPool contracts]
    Tree[Merkle commitment tree]
    FHE[fhEVM encrypted state]
  end

  subgraph offchain [Off-chain - Zama]
    Coproc[FHE coprocessor]
    KMS[Threshold KMS - async decrypt]
  end

  UI --> Note
  UI --> Pool
  Enc --> Pool
  Pool --> Tree
  Pool --> FHE
  FHE --> Coproc
  FHE --> KMS
```

## Two privacy layers

Z-Tor deliberately separates concerns that are often conflated:

| Layer | Mechanism | Protects |
|-------|-----------|----------|
| **Unlink** | Commitments, nullifiers, Merkle membership (Groth16 ZK proof) | Which deposit funded which withdrawal |
| **Amount / pool accounting** | fhEVM (`euint*`, ACL, public decryption) | Plaintext balances and aggregates on-chain |

Fully Homomorphic Encryption does **not** replace a nullifier-style spend proof by itself. The **unlink layer** uses proven mixer patterns (commitments + nullifiers + Merkle proofs), while **FHE** secures the value layer: confidential ERC-7984 balances, an encrypted deposit-amount check that keeps every pool exactly solvent, encrypted pool stats, and selective disclosure.

## Monorepo layout

```
z-tor/
├── apps/web/              # Next.js, wagmi, English UI
├── packages/contracts/    # Hardhat, fhEVM, Solidity
├── docs/                  # Product + engineering docs
└── package.json           # npm workspaces root
```

## Smart contracts

| Contract / module | Responsibility |
|-------------------|----------------|
| `ZTorConfidentialPool` (per asset + denomination) | Confidential ERC-7984 deposits with an encrypted amount check; two-step `transferAndCall` → `finalizeDeposit` so a note only goes live once the amount is verified; pays withdrawals in confidential tokens |
| `ZTorPool` (base) | Commitment tree, nullifier spend, Groth16-gated `withdraw`, anonymity delay on root age |
| `MerkleTreeWithHistory` | Fixed-depth Poseidon tree with a 100-root history |
| `Groth16Verifier` | Validates the withdraw membership proof |
| `ZTorLiquidityStats` | Encrypted per-pool active-note counter (publicly revealable for the stats demo) |
| `ZTorRegistry` | Maps pool id → pool address |
| `ZTorPoolFactory` | Permissionless custom-denomination pools |

## Fixed pools (v1)

| Tier | ETH | USDC (Sepolia official) |
|------|-----|-------------------------|
| Small | 0.1 | 100 |
| Large | 1 | 1,000 |

USDC on Sepolia: [Circle faucet](https://faucet.circle.com/) — contract address wired in `apps/web/src/config/assets.ts` after deploy research.

## Withdrawal policy (v1 defaults)

- Withdraw to **any address** (UI warns if same as depositor).
- **~10 minute** minimum delay after deposit (configurable per pool).
- **Optional gasless relayer** (built into the web app as `/api/relayer`); the proof binds recipient and fee so the relayer cannot redirect funds or raise its fee.
- **Note-based** credential; losing the note means losing funds (UI stresses backup).

## Frontend stack

- **Next.js** (App Router), TypeScript, Tailwind
- **wagmi + viem** for Sepolia
- **@zama-fhe/react-sdk** for encrypted inputs and public decryption
- Contract addresses from `deployments/` or env (`NEXT_PUBLIC_*`)

## Networks

| Network | Chain ID | Use |
|---------|----------|-----|
| Hardhat + fhEVM mock | 31337 | Local tests (`npm test` in contracts) |
| Sepolia | 11155111 | Deploy + manual QA |

## References

- [Zama Protocol docs](https://docs.zama.org/protocol)
- [fhEVM Hardhat template](https://github.com/zama-ai/fhevm-hardhat-template)
- [fhEVM agent skill](https://github.com/0xE1337/fhevm-skill) — recommended for all FHE contract work
