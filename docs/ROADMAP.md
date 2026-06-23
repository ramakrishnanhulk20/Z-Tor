# Z-Tor — Roadmap

## Phase 0 — Foundation ✅

- [x] Product docs (vision, architecture, privacy, roadmap)
- [x] Monorepo scaffold (`packages/contracts`, `apps/web`)
- [x] Hardhat + fhEVM compile/test baseline
- [x] Web shell: dark UI, MetaMask, Sepolia config, pool constants
- [x] Install deps locally (`npm install` at root)

## Phase 1 — Core pool (MVP) ✅

Deployed to Sepolia — addresses in [DEPLOYMENTS.md](./DEPLOYMENTS.md).

**Contracts**

- [x] Merkle tree + commitment scheme for fixed denominations
- [x] `ZTorPool` ETH: 0.1 and 1 ETH tiers
- [x] `ZTorPool` USDC: 100 and 1,000 tiers (official Sepolia USDC)
- [x] Deposit → note generation (client + contract event correlation)
- [x] Withdraw with nullifier + proof (Groth16, circom circuit)
- [x] Anonymity delay (~10 minutes)
- [x] Hardhat tests: deposit, double-spend reject, withdraw happy path
- [x] Deploy scripts + recorded Sepolia addresses

**FHE (incremental)**

- [x] Encrypted pool liquidity counter (fhEVM)
- [x] ACL + no plaintext events leaking encrypted state
- [x] Run [fhevm-lint](https://github.com/0xE1337/fhevm-skill) on all FHE contracts

**Web**

- [x] Deposit wizard (select pool → confirm → show note)
- [x] Withdraw wizard (paste note → recipient → wait for delay)
- [x] Block explorer links, copy-to-clipboard, note download
- [x] Relayer SDK wiring for encrypted inputs where required

## Phase 2 — Compliance & polish ✅

- [x] Voluntary disclosure flow (export proof for auditor) — `/disclose`
- [x] Encrypted aggregate stats demo — `/stats`
- [x] Security review checklist — [SECURITY_CHECKLIST.md](./SECURITY_CHECKLIST.md)
- [x] Optional relayer for gas abstraction (circuit + contracts + `apps/relayer`)
- [x] Custom amount pools (`ZTorPoolFactory` + deposit UI)
- [x] Proving-asset integrity checks + anonymity-set UI indicator

## Phase 3 — Mainnet readiness

- [ ] Legal / jurisdiction review
- [ ] Mainnet deployment plan (separate from testnet)
- [ ] Monitoring, incident response, upgrade policy

## How to run (after Phase 0 install)

```bash
# From repo root
npm install

# Contracts
npm run compile -w @z-tor/contracts
npm test -w @z-tor/contracts

# Web
npm run dev -w @z-tor/web
```

Sepolia deploy (when ready):

```bash
npx hardhat vars setup   # inside packages/contracts
npm run deploy:sepolia -w @z-tor/contracts
```
