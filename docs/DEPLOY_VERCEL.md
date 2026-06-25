# Deploy Z-Tor on Vercel

One Vercel project hosts **both** the Next.js app and the **relayer** (as API routes at `/api/relayer/*`). You do not need a second server for gasless withdraw on production.

**Current production:** [https://z-tor-web.vercel.app](https://z-tor-web.vercel.app) · relayer: [https://z-tor-web.vercel.app/api/relayer/info](https://z-tor-web.vercel.app/api/relayer/info)

Local dev can still use a separate relayer: `npm run dev:relayer` on port 8787.

---

## 1. Connect GitHub

1. Open [vercel.com](https://vercel.com) and sign in with GitHub.
2. **Add New Project** → import [ramakrishnanhulk20/Z-Tor](https://github.com/ramakrishnanhulk20/Z-Tor).
3. Configure the project:

| Setting | Value |
|---------|--------|
| **Framework Preset** | Next.js |
| **Root Directory** | `apps/web` |
| **Install Command** | `cd ../.. && npm install` |
| **Build Command** | `cd ../.. && npm run build -w @z-tor/web` |
| **Output Directory** | *(leave default — Next.js)* |

Vercel detects the monorepo when install runs from the repo root.

---

## 2. Environment variables

In **Project → Settings → Environment Variables**, add:

### Public (browser)

| Name | Example | Required |
|------|---------|----------|
| `NEXT_PUBLIC_CHAIN_ID` | `11155111` | Yes |
| `NEXT_PUBLIC_SEPOLIA_RPC_URL` | `https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY` | Yes |
| `NEXT_PUBLIC_ZTOR_REGISTRY` | `0x21E4D83C5C4329Cad8f59bc7408C49d24A3D39d2` | Yes |
| `NEXT_PUBLIC_DEPLOY_BLOCK` | `11114155` | Yes |
| `NEXT_PUBLIC_RELAYER_URL` | Optional — omit on Vercel (uses `/api/relayer` on same domain); `http://localhost:8787` locally |

If `NEXT_PUBLIC_RELAYER_URL` is empty, the app uses **`https://z-tor-web.vercel.app/api/relayer`** (or your deployment’s origin + `/api/relayer`).

### Server-only (relayer — never expose to the client)

| Name | Notes |
|------|--------|
| `RELAYER_PRIVATE_KEY` | Sepolia wallet that pays gas for relayed withdraws. Fund with test ETH. |
| `ZTOR_REGISTRY` | Same as `NEXT_PUBLIC_ZTOR_REGISTRY` |
| `RPC_URL` | Same Sepolia RPC as above (server-side) |
| `FEE_BASIS_POINTS` | `100` (= 1% fee) |

Mark `RELAYER_PRIVATE_KEY` as **Sensitive**. Do not prefix it with `NEXT_PUBLIC_`.

---

## 3. Deploy

Click **Deploy**. After the build:

- App: `https://z-tor-web.vercel.app` (example — yours may differ)
- Relayer info: `https://z-tor-web.vercel.app/api/relayer/info`
- Relayer relay: `POST https://z-tor-web.vercel.app/api/relayer/relay`

On the **Withdraw** page, “Through a relayer” should show as online if `/api/relayer/info` returns Sepolia chain id `11155111`.

---

## 4. Fund the relayer wallet

The address in `/api/relayer/info` must hold **Sepolia ETH** to pay gas for relayed withdrawals. Send test ETH from a [faucet](https://sepoliafaucet.com/).

---

## 5. Limits & notes

- **Function duration:** Relay routes set `maxDuration = 60` seconds. FHE withdraw txs may need a Vercel **Pro** plan if Hobby’s 10s limit is too short.
- **Secrets:** Only set relayer keys in Vercel env vars, never in the repo.
- **Local dev:** Keep using `npm run dev:relayer` + `NEXT_PUBLIC_RELAYER_URL=http://localhost:8787` in `apps/web/.env.local` if you prefer a separate local relayer.

---

## Optional: separate relayer project

You can still run `apps/relayer` on Render, Railway, or a VPS and set `NEXT_PUBLIC_RELAYER_URL` to that URL. Vercel’s built-in `/api/relayer` is the simpler default.

See [DEPLOYMENTS.md](./DEPLOYMENTS.md) for current Sepolia contract addresses.
