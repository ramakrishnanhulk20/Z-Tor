# @z-tor/web

Next.js frontend for Z-Tor: wallet connection, Shield, deposit, withdraw, stats, disclosure.

**Live:** [https://z-tor-web.vercel.app](https://z-tor-web.vercel.app)

## Layout

```
src/app/           Pages (App Router)
src/components/    Shared UI
src/config/        ABIs, pool tiers, Zama Sepolia addresses
src/lib/           Notes, ZK proofs, confidential deposit flow
public/zk/         Groth16 wasm + zkey for browser proving
```

## Commands

From repo root:

```bash
npm run dev:web          # http://localhost:3000
npm run build -w @z-tor/web
```

Env: copy `.env.example` → `.env.local` (see [../../docs/GETTING_STARTED.md](../../docs/GETTING_STARTED.md)).

## Stack

Next.js 15 · wagmi · viem · `@zama-fhe/react-sdk` · Framer Motion · Tailwind CSS
