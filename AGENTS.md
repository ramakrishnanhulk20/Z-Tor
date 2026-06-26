# Development guide — Z-Tor

## Project context

Z-Tor is a Sepolia testnet dApp: fixed pools (ETH + official Sepolia USDC), note-based withdraw, dark English UI. See `docs/` before changing behavior.

## Monorepo

- `packages/contracts` — Hardhat, `@fhevm/solidity`, tests run in **mock FHE** locally
- `apps/web` — Next.js, wagmi, no secrets in client code

## fhEVM rules (mandatory for FHE contracts)

Follow [fhevm-skill](https://github.com/0xE1337/fhevm-skill):

- Never `FHE.decrypt()` on-chain (does not exist)
- Never branch on `ebool` / encrypted values — use `FHE.select`
- Re-grant ACL after every `FHE.add` / `sub` / `mul` / `select`
- Validate external inputs with `FHE.fromExternal` + proof
- Inherit `ZamaEthereumConfig` on fhEVM contracts
- Do not emit encrypted values in events

Run linter when touching Solidity:

```bash
node path/to/fhevm-skill/scripts/fhevm-lint.js packages/contracts/contracts/
```

## Mixer / unlink layer

Unlink uses commitments + nullifiers + Merkle proofs (not FHE alone). Keep unlink and FHE layers separate per `docs/ARCHITECTURE.md`.

## Style

- Small files, plain names, comments only for non-obvious invariants
- Keep changes scoped to the task at hand
- UI copy should be clear for non-technical users and warn about lost notes

## Networks

- Default development: Hardhat mock (`npm test -w @z-tor/contracts`)
- Manual QA: Sepolia only until roadmap says otherwise

## Do not

- Add mainnet deploy scripts without explicit user request
- Position the product as evading law enforcement
- Commit `.env` or mnemonics
