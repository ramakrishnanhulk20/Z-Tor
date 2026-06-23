# @z-tor/contracts

Hardhat project: Z-Tor smart contracts with **Zama fhEVM** and Groth16 withdraw proofs.

## Layout

```
contracts/     Solidity sources (pools, registry, factory, stats)
test/          Hardhat tests — mock FHE locally
deploy/        Sepolia deployment scripts
circuits/      Circom withdraw circuit
deployments/   Recorded deploy ABIs + addresses
```

## Commands

From repo root:

```bash
npm run compile -w @z-tor/contracts
npm test -w @z-tor/contracts
```

fhEVM lint:

```bash
node .tools/fhevm-skill/scripts/fhevm-lint.js packages/contracts/contracts/
```

## Key contracts

- **ZTorConfidentialPool** — ERC-7984 deposits + ZK withdraw + FHE payout
- **ZTorRegistry** — pool ID → address map
- **ZTorPoolFactory** — permissionless custom pools
- **ZTorLiquidityStats** — encrypted active-note counter

See [../../docs/DEPLOYMENTS.md](../../docs/DEPLOYMENTS.md) for Sepolia addresses.
