# Z-Tor — Deployments

## Live app (Sepolia testnet)

| Service | URL |
|---------|-----|
| Web app | [https://z-tor-web.vercel.app](https://z-tor-web.vercel.app) |
| Relayer (built-in) | [https://z-tor-web.vercel.app/api/relayer/info](https://z-tor-web.vercel.app/api/relayer/info) |

Hosted on Vercel (Next.js + relayer API routes). Connect MetaMask to **Sepolia**.

---

## Sepolia (chain id 11155111)

### Phase 3c — deposit callback + withdraw payout fixes (current)

Fixed `onConfidentialTransferReceived` ACL and `_processWithdraw`
`FHE.allowTransient` before confidential token payout.

Deploy block: **11114155** (first pool in this rollout).

| Contract | Address |
|----------|---------|
| ZTorRegistry | `0x21E4D83C5C4329Cad8f59bc7408C49d24A3D39d2` |
| ZTorLiquidityStats | `0x11CD2af54025B3209F04b928BD7cA8c64D411e55` |
| Groth16Verifier | `0x04F2ADA900BeCDe03E5306d652049344a6fAdfb5` |
| ZTorPoolFactory | `0x24c4E6dBe47AE08a87C4B7A53a29107CffD96E95` |
| PoseidonT3 (library) | `0x6FC2e4E931dFca927c9320F44FB255a64Cb3539e` |

#### Zama confidential tokens (Sepolia)

| Token | Address |
|-------|---------|
| cUSDCMock | `0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639` |
| cWETHMock | `0x46208622DA27d91db4f0393733C8BA082ed83158` |

Source: [Zama Sepolia addresses](https://docs.zama.org/protocol/protocol-apps/addresses/testnet/sepolia)

#### Fixed pools (`ZTorConfidentialPool`)

| Pool id | Asset | Amount | Address |
|---------|-------|--------|---------|
| `eth-0.1` | WETH (confidential) | 0.1 | `0x3FE0Cdb67035ABF0953fbfA1f4032b0F43DB9636` |
| `eth-1` | WETH (confidential) | 1 | `0x9144E1e56D4C592c3CF70b765AAbEb252E8C8417` |
| `usdc-100` | USDC (confidential) | 100 | `0x1993D693C6e1D59323be3935ABA5efc686343FCc` |
| `usdc-1000` | USDC (confidential) | 1,000 | `0xEA8ef61Bc5B4989fd4c4205B73844d982a0b811b` |

Custom pools use ids `eth-<confidential-units>` or `usdc-<confidential-units>`
and are created permissionlessly via `ZTorPoolFactory`.

Env for `apps/web/.env.local`:

- `NEXT_PUBLIC_ZTOR_REGISTRY=0x21E4D83C5C4329Cad8f59bc7408C49d24A3D39d2`
- `NEXT_PUBLIC_DEPLOY_BLOCK=11114155`
- `NEXT_PUBLIC_ZTOR_FACTORY=0x24c4E6dBe47AE08a87C4B7A53a29107CffD96E95`
- `NEXT_PUBLIC_RELAYER_URL` (optional — see below)

Relayer (`apps/relayer/.env`): `ZTOR_REGISTRY` + `RELAYER_PRIVATE_KEY` + `RPC_URL`.

#### Running locally (full Sepolia flow)

```bash
npm install
npm run dev:web        # http://localhost:3000
npm run dev:relayer    # http://localhost:8787 — optional, for gasless withdraw
```

Direct withdraw (user pays gas) works without the relayer. For gasless withdraw,
set `NEXT_PUBLIC_RELAYER_URL` to wherever the relayer is hosted.

ZK proving files live in `apps/web/public/zk/`. Rebuild with `npm run build:circuit`.

### Superseded deployments

**Phase 3b** — broken withdraw payout; notes from these pools cannot withdraw
(funds remain in the old pool contracts):

| Pool id | Address |
|---------|---------|
| `eth-0.1` | `0xfe8AB6A72A45B34a39a33f0a438Bbd34CEB65df6` |
| `eth-1` | `0x209860Ceb7646788029048bbe9eD909D564880d5` |
| `usdc-100` | `0x2d9c2b574632Dcb8E295246b93845dA3fC63b36f` |
| `usdc-1000` | `0x76aC8B5597Fc15E84932c7eA574030963422C543` |

Phase 3b factory: `0x09Ae6302b30E47e7eCDE56dD69b8B41A1a0b114d`

**Phase 3a** (operator-pull deposit, no callback receiver):

| Pool id | Address |
|---------|---------|
| `eth-0.1` | `0xcaCCB90e6A8AeD0db71373597392F8Ad8C63dad5` |
| `eth-1` | `0xAb6780B209D12D7a05c742499f3B127e2c37FDA5` |
| `usdc-100` | `0x29Af53608C3E4a93F25093675d4D490b023358Fe` |
| `usdc-1000` | `0xF5070aEf9723b4da15355004D85a0FBd00C0A1f6` |

Phase 3a factory: `0x1f48CdD87c93e0553378279811Ee4915ed1d9d85`

Phase 2b registry `0xa850088E835C94167D30D5D3439617dc5FB20020` and its pools
remain on-chain. Notes from those pools cannot be used with Phase 3.
