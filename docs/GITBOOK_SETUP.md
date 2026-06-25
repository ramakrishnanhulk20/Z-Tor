# GitBook setup (free tier)

Z-Tor docs live in this `docs/` folder and sync to [GitBook](https://www.gitbook.com/) on the free plan.

## 1. Create a GitBook space

1. Sign in at [gitbook.com](https://www.gitbook.com/) (free tier).
2. **New space** → name it **Z-Tor**.
3. Choose **Sync with Git** → connect GitHub → select `ramakrishnanhulk20/Z-Tor`.
4. Set the content root to **`docs/`** (GitBook reads `.gitbook.yaml` at repo root).

## 2. Publish

GitBook builds from `SUMMARY.md` (table of contents) and the markdown files in `docs/`.

After the first sync, your public URL is **https://rams-4.gitbook.io/rams-docs**.

## 3. Wire the web app

In Vercel (and local `apps/web/.env.local`):

```bash
NEXT_PUBLIC_DOCS_URL=https://rams-4.gitbook.io/rams-docs
```

The marketing site header **Docs** link and old `/faq` / `/how-it-works` redirects use this URL.

## 4. Optional custom domain

GitBook free tier supports a `*.gitbook.io` subdomain. Custom domains are on paid plans.

## Editing docs

- **In GitBook:** use the visual editor (syncs back to GitHub if two-way sync is enabled).
- **In the repo:** edit markdown under `docs/` and push; GitBook pulls on sync.

Keep slugs stable for FAQ and How it works so app redirects keep working:

| File | Suggested GitBook path |
|------|------------------------|
| `FAQ.md` | `/faq` |
| `HOW_IT_WORKS.md` | `/how-it-works` |
