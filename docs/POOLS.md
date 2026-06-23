# Z-Tor — Pool Configuration

Fixed denominations keep deposits indistinguishable within a tier. Custom
amounts are available via `ZTorPoolFactory` (permissionless, one pool per
exact denomination).

## Active tiers (v1)

| Pool ID | Asset | Amount | Decimals | Notes |
|---------|-------|--------|----------|-------|
| `eth-0.1` | ETH | 0.1 | 18 | Native Sepolia ETH |
| `eth-1` | ETH | 1 | 18 | |
| `usdc-100` | USDC | 100 | 6 | Official Sepolia USDC only |
| `usdc-1000` | USDC | 1,000 | 6 | |

## Custom amounts

| Asset | Min | Max | Pool id format |
|-------|-----|-----|----------------|
| ETH | 0.01 | 10 | `eth-<wei>` e.g. `eth-250000000000000000` |
| USDC | 1 | 100,000 | `usdc-<units>` e.g. `usdc-50000000` |

First depositor for a new amount pays gas to create the pool via the factory.
Privacy is weaker until more deposits share that exact amount.

## Timing

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| `ANONYMITY_DELAY_SECONDS` | 600 (10 min) | Reduces same-block deposit/withdraw fingerprinting on testnet |

## USDC (Sepolia)

Use Circle’s Sepolia USDC. Confirm the canonical address before mainnet-style testing:

- Faucet: https://faucet.circle.com/
- Update `apps/web/src/config/assets.ts` if Circle rotates test addresses.

## Note format (planned)

Human-readable prefix for v1:

```
ztor-<version>-<poolId>-<payload>-<checksum>
```

Exact encoding is implemented in Phase 1 (`apps/web/src/lib/note.ts`). Phase 0 exports types and validation stubs only.
