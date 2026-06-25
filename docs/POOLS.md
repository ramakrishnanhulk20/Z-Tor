# Z-Tor — Pool Configuration

Fixed denominations keep deposits indistinguishable within a tier. Every
deposit in a tier looks identical on-chain, which is what gives you privacy.

## Active tiers (v1)

| Pool ID | Asset | Amount | Decimals | Notes |
|---------|-------|--------|----------|-------|
| `eth-0.1` | cWETH | 0.1 | 18 underlying / 6 confidential | Zama ERC-7984 wrapper |
| `eth-1` | cWETH | 1 | 18 / 6 | |
| `usdc-100` | cUSDC | 100 | 6 | Zama test USDC |
| `usdc-1000` | cUSDC | 1,000 | 6 | |

## How deposits reach Z-Tor

Deposits do **not** send plain WETH or USDC to a pool. The flow is:

1. **Registry lookup** — the app reads `ZTorRegistry.poolFor(poolId)` to get the
   `ZTorConfidentialPool` address for your tier.
2. **Confidential balance** — you hold cWETH or cUSDC (Zama ERC-7984 tokens).
3. **Transfer + callback** — you call `confidentialTransferAndCall` on the
   cWETH/cUSDC wrapper. MetaMask shows the **wrapper** address because that is
   the contract you sign against. The wrapper forwards tokens to the pool and
   calls `onConfidentialTransferReceived`, which registers your commitment in
   the Merkle tree.

Official Zama Sepolia token addresses are in `apps/web/src/config/zama.ts`.

## Custom amounts (upcoming)

Permissionless custom-denomination pools via `ZTorPoolFactory` are deployed on
Sepolia but **not exposed in the web UI yet**. See [ROADMAP.md](./ROADMAP.md).

## Timing

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| `ANONYMITY_DELAY_SECONDS` | 600 (10 min) | Reduces same-block deposit/withdraw fingerprinting on testnet |

## Note format

Human-readable prefix for v1:

```
ztor-<version>-<poolId>-<payload>-<checksum>
```

Exact encoding is in `apps/web/src/lib/note.ts`.
