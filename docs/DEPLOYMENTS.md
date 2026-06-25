# Z-Tor — Deployments

## Live app (Sepolia testnet)

| Service | URL |
|---------|-----|
| Web app | [https://z-tor-web.vercel.app/app](https://z-tor-web.vercel.app/app) |
| Relayer (built-in) | [https://z-tor-web.vercel.app/api/relayer/info](https://z-tor-web.vercel.app/api/relayer/info) |

Hosted on Vercel (Next.js + relayer API routes). Connect MetaMask to **Sepolia**.

---

## Sepolia (chain id 11155111)

### Confidential amount verification (current)

Deposits verify the encrypted amount equals the pool denomination via an
`FHE.eq` check + public decryption (`finalizeDeposit`) before a note goes live;
wrong amounts are auto-refunded. Withdrawals stay one-step.

Deploy block: **11136756** (first pool in this rollout).

| Contract | Address | Etherscan |
|----------|---------|-----------|
| ZTorRegistry | `0x21E4D83C5C4329Cad8f59bc7408C49d24A3D39d2` | [verified](https://sepolia.etherscan.io/address/0x21E4D83C5C4329Cad8f59bc7408C49d24A3D39d2#code) |
| ZTorLiquidityStats | `0xD6B6AB5f7e3A612ccaC70e72B2c196cE6Ea37994` | [verified](https://sepolia.etherscan.io/address/0xD6B6AB5f7e3A612ccaC70e72B2c196cE6Ea37994#code) |
| Groth16Verifier | `0x04F2ADA900BeCDe03E5306d652049344a6fAdfb5` | [verified](https://sepolia.etherscan.io/address/0x04F2ADA900BeCDe03E5306d652049344a6fAdfb5#code) |
| ZTorPoolFactory | `0x6560245C5dD790B8205FEecD2B6D8fF706CfFf31` | [verified](https://sepolia.etherscan.io/address/0x6560245C5dD790B8205FEecD2B6D8fF706CfFf31#code) |
| PoseidonT3 (library) | `0x6FC2e4E931dFca927c9320F44FB255a64Cb3539e` | [verified](https://sepolia.etherscan.io/address/0x6FC2e4E931dFca927c9320F44FB255a64Cb3539e#code) |

#### Zama confidential tokens (Sepolia)

| Token | Address |
|-------|---------|
| cUSDCMock | `0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639` |
| cWETHMock | `0x46208622DA27d91db4f0393733C8BA082ed83158` |

Source: [Zama Sepolia addresses](https://docs.zama.org/protocol/protocol-apps/addresses/testnet/sepolia)

#### Fixed pools (`ZTorConfidentialPool`)

| Pool id | Asset | Amount | Address | Etherscan |
|---------|-------|--------|---------|-----------|
| `eth-0.1` | WETH (confidential) | 0.1 | `0x7CEF360d9d3EEcdd7ACccbBEBff98aEFd22af910` | [verified](https://sepolia.etherscan.io/address/0x7CEF360d9d3EEcdd7ACccbBEBff98aEFd22af910#code) |
| `eth-1` | WETH (confidential) | 1 | `0xBaE772CfaC2C22F1291B05327A16306328023040` | [verified](https://sepolia.etherscan.io/address/0xBaE772CfaC2C22F1291B05327A16306328023040#code) |
| `usdc-100` | USDC (confidential) | 100 | `0x82A906320495537C57a8123a8BFFC1722D023C66` | [verified](https://sepolia.etherscan.io/address/0x82A906320495537C57a8123a8BFFC1722D023C66#code) |
| `usdc-1000` | USDC (confidential) | 1,000 | `0xf9A04663Ce829F0E1F5D510005896D56cA14ba46` | [verified](https://sepolia.etherscan.io/address/0xf9A04663Ce829F0E1F5D510005896D56cA14ba46#code) |

Custom-denomination pools via `ZTorPoolFactory` are deployed on Sepolia but
**not in the web UI yet** (see [ROADMAP.md](./ROADMAP.md)).

All Phase 3c contracts above are source-verified on Sepolia Etherscan. To
re-verify after a redeploy, set `ETHERSCAN_API_KEY` and run
`npm run verify:sepolia -w @z-tor/contracts` (uses deploy-time `solcInputs`
from `deployments/sepolia/`).

Env for `apps/web/.env.local`:

- `NEXT_PUBLIC_ZTOR_REGISTRY=0x21E4D83C5C4329Cad8f59bc7408C49d24A3D39d2`
- `NEXT_PUBLIC_DEPLOY_BLOCK=11136756`
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

