# GitHub Mate

Paste two GitHub profile URLs → get a match score with a Knowledge Graph view and an Obsidian-compatible vault.

Stack (D1-only MVP): Next.js 16 (App Router) on Cloudflare Workers via OpenNext · Workers AI (llama-3.3, bge) · D1 · KV · Cron. **No R2, no Queues** — fits Cloudflare free plan.

## Prerequisites
- Node.js 20+
- Cloudflare account (free plan OK)
- Wrangler v4+ (installed via `npm install`, use `npx wrangler ...`)
- GitHub PAT (scopes: `public_repo`, `read:user`) for shared/system fallback
- GitHub OAuth App (scopes: `read:user`, `public_repo`) — register at https://github.com/settings/developers

## Local Setup

1. **Install deps**
   ```bash
   npm install
   ```

2. **Authenticate wrangler**
   ```bash
   wrangler login
   ```

3. **Provision resources** (one-time — already done for this project)
   ```bash
   npx wrangler d1 create github_mate          # → paste id into wrangler.toml
   npx wrangler kv namespace create CACHE      # → paste id into wrangler.toml
   ```

4. **Apply migrations**
   ```bash
   npm run db:migrate:local   # local
   npm run db:migrate         # production
   ```

5. **Set secrets**
   ```bash
   # Local dev: copy and edit
   cp .dev.vars.example .dev.vars

   # Production
   wrangler secret put GITHUB_TOKEN
   wrangler secret put GITHUB_CLIENT_ID
   wrangler secret put GITHUB_CLIENT_SECRET
   wrangler secret put SESSION_SECRET   # generate: openssl rand -hex 32
   ```

6. **Generate Cloudflare env types**
   ```bash
   npm run cf-typegen
   ```

7. **Run**
   ```bash
   npm run dev        # Next.js dev server
   npm run preview    # Workerd preview with real bindings
   npm run deploy     # Production deploy
   ```

## Project Layout
```
app/              Next.js App Router pages + API routes
lib/              Shared TS modules (fetcher, kg, scoring)
migrations/       D1 SQL migrations
workers/          Cron/queue handlers (phase-07)
wrangler.toml     Cloudflare bindings
open-next.config.ts
```

## Plan
See [plans/260419-2225-github-mate-mvp/plan.md](plans/260419-2225-github-mate-mvp/plan.md).
