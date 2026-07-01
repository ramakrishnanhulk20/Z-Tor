# Getting started (developers)

**Try the live app:** [https://z-tor-web.vercel.app/app](https://z-tor-web.vercel.app/app) (Sepolia testnet, no local setup needed).

## Prerequisites

- **Node.js 20+**
- **MetaMask** on Sepolia
- Sepolia ETH ([faucet](https://sepoliafaucet.com/))
- Optional: Alchemy/Infura RPC key for reliable Sepolia access

## Install

```bash
git clone <repo-url>
cd Z-Tor
npm install
```

## Environment

### Web app

Copy and edit:

```bash
cp apps/web/.env.example apps/web/.env.local
```

Required variables:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SEPOLIA_RPC_URL` | Sepolia JSON-RPC |
| `NEXT_PUBLIC_ZTOR_REGISTRY` | Pool registry address |
| `NEXT_PUBLIC_DEPLOY_BLOCK` | First block to scan for deposits |
| `NEXT_PUBLIC_RELAYER_URL` | Optional — `http://localhost:8787` |
| `NEXT_PUBLIC_DOCS_URL` | GitBook docs URL — see [GITBOOK_SETUP.md](./GITBOOK_SETUP.md) |

See [DEPLOYMENTS.md](./DEPLOYMENTS.md) for current Sepolia values.

### Relayer (optional)

```bash
cp apps/relayer/.env.example apps/relayer/.env
```

Set `RELAYER_PRIVATE_KEY`, `ZTOR_REGISTRY`, `RPC_URL`.

## Run locally

```bash
# Terminal 1 — web
npm run dev:web

# Terminal 2 — relayer (optional)
npm run dev:relayer
```

Open [http://localhost:3000](http://localhost:3000).

## Contracts

```bash
# Compile
npm run compile -w @z-tor/contracts

# Test (mock FHE — first run auto-builds the ZK circuit, ~1–2 min)
npm test -w @z-tor/contracts

# fhEVM lint (required before contract PRs)
node .tools/fhevm-skill/scripts/fhevm-lint.js packages/contracts/contracts/
```

### Deploy to Sepolia

```bash
cd packages/contracts
npx hardhat vars setup   # mnemonic + RPC
npm run deploy:sepolia -w @z-tor/contracts
```

Update `docs/DEPLOYMENTS.md` and web `.env.local` after deploy.

## ZK circuit

Fresh clones do not include generated proving files (`circuits/build/` is gitignored).  
`npm test` runs a **pretest** step that builds them automatically when missing.

To rebuild after editing `packages/contracts/circuits/withdraw.circom`:

```bash
npm run build:circuit -w @z-tor/contracts
```

Artifacts land in `packages/contracts/circuits/build/` and `apps/web/public/zk/`.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Gas limit rejected by RPC | Web caps FHE txs at 10M — see `apps/web/src/lib/wallet-write.ts` |
| `confidentialBalanceOf` reverts | Wrong token address — must use cUSDC/cWETH wrapper, not plain ERC-20 |
| Withdraw "note not found" | Wrong pool deployment — use note from current registry pools |
| Relayer offline | Start `npm run dev:relayer` or withdraw from wallet |
| Tests show `3 pending` | Run `npm run build:circuit -w @z-tor/contracts`, or set `ZTOR_SKIP_CIRCUIT_BUILD=1` only if assets already exist |

More: [USER_GUIDE.md](./USER_GUIDE.md), root [README.md](../README.md).
