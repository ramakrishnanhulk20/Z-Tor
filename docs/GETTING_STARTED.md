# Getting started (developers)

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
| `NEXT_PUBLIC_ZTOR_FACTORY` | Custom pool factory |
| `NEXT_PUBLIC_RELAYER_URL` | Optional — `http://localhost:8787` |

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

# Test (mock FHE — fast, no Sepolia needed)
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

## ZK circuit rebuild

If you change `packages/contracts/circuits/`:

```bash
npm run build:circuit
```

Artifacts land in `apps/web/public/zk/`.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Gas limit rejected by RPC | Web caps FHE txs at 10M — see `apps/web/src/lib/wallet-write.ts` |
| `confidentialBalanceOf` reverts | Wrong token address — must use cUSDC/cWETH wrapper, not plain ERC-20 |
| Withdraw "note not found" | Wrong pool deployment — use note from current registry pools |
| Relayer offline | Start `npm run dev:relayer` or withdraw from wallet |

More: [USER_GUIDE.md](./USER_GUIDE.md), root [README.md](../README.md).
