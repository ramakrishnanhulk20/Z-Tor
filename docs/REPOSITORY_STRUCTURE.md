# Repository structure

Z-Tor is an **npm workspaces monorepo**. Contracts and frontend live in separate packages but share one root `package-lock.json`.

```
Z-Tor/
├── apps/
│   ├── web/                      # Frontend dApp
│   │   ├── public/zk/            # Groth16 wasm + zkey (withdraw proofs)
│   │   └── src/
│   │       ├── app/              # Next.js App Router pages
│   │       ├── components/       # UI components
│   │       ├── config/           # ABIs, pool tiers, Zama addresses
│   │       ├── hooks/            # wagmi helpers
│   │       └── lib/              # Notes, ZK, FHE deposit, withdraw
│   └── relayer/                  # HTTP relay for gasless withdraw
│       └── src/server.mjs
├── packages/
│   └── contracts/                # Smart contracts + tests
│       ├── contracts/            # Solidity sources
│       ├── test/                 # Hardhat tests
│       ├── deploy/               # Deployment scripts
│       ├── circuits/             # Circom withdraw circuit
│       └── deployments/sepolia/  # Recorded deploy artifacts
├── docs/                         # All project documentation
├── scripts/                      # Root-level automation
├── .tools/fhevm-skill/           # fhEVM lint (git submodule or vendored)
├── AGENTS.md                     # Development guide (fhEVM conventions)
├── README.md                     # Project overview + test results
└── package.json                  # Workspace root scripts
```

## Where to find things

| I want to… | Look in… |
|------------|----------|
| Change deposit UI | `apps/web/src/app/deposit/` |
| Fix confidential token flow | `apps/web/src/lib/confidential.ts` |
| Edit pool Solidity | `packages/contracts/contracts/ZTorConfidentialPool.sol` |
| Run / add contract tests | `packages/contracts/test/` |
| Update Sepolia addresses | `docs/DEPLOYMENTS.md` + `apps/web/.env.local` |
| Change withdraw proof | `packages/contracts/circuits/` + `apps/web/src/lib/zk.ts` |
| Relayer config | `apps/relayer/.env` |

## Scripts (from repo root)

| Command | Purpose |
|---------|---------|
| `npm test -w @z-tor/contracts` | Hardhat tests (mock FHE) |
| `npm run compile -w @z-tor/contracts` | Compile Solidity |
| `npm run dev:web` | Next.js dev server (:3000) |
| `npm run dev:relayer` | Relayer (:8787) |
| `npm run build:circuit` | Rebuild ZK artifacts for web |

## Why monorepo?

- **Contracts** and **frontend** share pool IDs, denominations, and ABIs
- One `npm install` for new contributors and reviewers
- Deploy artifacts in `packages/contracts/deployments/` stay next to source

We do **not** flatten contracts into the web folder — that would duplicate sources and break Hardhat. The layout keeps a clear separation of **contracts**, **frontend**, and **tests**.
