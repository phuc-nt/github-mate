# Deployment Guide

GitHub Mate is a Next.js 16 app deployed to Cloudflare Workers via [OpenNext](https://opennext.js.org/cloudflare). The MVP runs on the **free plan** — no R2, no Queues. All state lives in D1 (SQLite) + KV (GitHub API cache).

## Prerequisites

- Node.js ≥ 20
- `wrangler` logged in: `npx wrangler login`
- GitHub Personal Access Token (scopes: `public_repo`, `read:user`)
- GitHub OAuth App (client id + secret)

## One-time setup

### 1. Clone & install

```bash
git clone git@github.com:phuc-nt/github-mate.git
cd github-mate
npm ci
```

### 2. Create Cloudflare resources

```bash
# D1 database
npx wrangler d1 create github_mate
# → copy database_id into wrangler.toml

# KV namespace (GitHub API cache)
npx wrangler kv:namespace create CACHE
# → copy id into wrangler.toml
```

### 3. Apply migrations

```bash
# local (for dev)
npm run db:migrate:local
# remote (for prod)
npm run db:migrate
```

### 4. Set secrets

```bash
# one-time per secret
npx wrangler secret put GITHUB_TOKEN          # PAT
npx wrangler secret put GITHUB_CLIENT_ID      # OAuth app
npx wrangler secret put GITHUB_CLIENT_SECRET  # OAuth app
npx wrangler secret put SESSION_SECRET        # random 32+ char string
npx wrangler secret put ADMIN_TOKEN           # random; protects /api/admin/refresh-top20
```

Or bulk from `.dev.vars`:

```bash
npx wrangler secret bulk .dev.vars
```

## Local development

```bash
npm run dev            # next dev (fast iteration, no workerd)
npm run preview        # opennextjs-cloudflare build + preview in workerd (pre-deploy smoke)
```

## Deploy

### Manual

```bash
npm run deploy         # opennextjs-cloudflare build + deploy
```

### CI (GitHub Actions)

Every push to `main` triggers [.github/workflows/deploy.yml](../.github/workflows/deploy.yml):

1. `npm run typecheck`
2. `npm test` (39 vitest tests)
3. `wrangler d1 migrations apply DB --remote`
4. `wrangler deploy` via OpenNext

Required repo secrets:

| Secret | Source |
|--------|--------|
| `CLOUDFLARE_API_TOKEN` | CF dashboard → My Profile → API Tokens → Edit Cloudflare Workers |
| `CLOUDFLARE_ACCOUNT_ID` | CF dashboard → Workers → right sidebar |

## Post-deploy tasks

### Seed Top 20 leaderboard

Cron wiring is deferred for MVP. Trigger manually (weekly recommended):

```bash
curl -X POST https://<your-worker>.workers.dev/api/admin/refresh-top20 \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

Takes up to 5 minutes (20 profiles × GraphQL + KG build, 500ms throttle).

### Custom domain

CF dashboard → Workers & Pages → your worker → Custom Domains → Add. SSL propagates in ~5 min.

### Smoke check

```bash
curl -I https://<your-domain>/                       # 200
curl https://<your-domain>/api/top20 | jq length     # 20 after seeding
```

## Rollback

```bash
npx wrangler rollback                                  # interactive
npx wrangler deployments list
npx wrangler rollback --version-id <id>
```

D1 migrations are **not auto-reversible** — author a down migration per schema change if needed.

## Observability

```bash
npx wrangler tail                                      # live logs
```

## Run Playwright e2e (optional)

```bash
npm run test:e2e:install    # first time only
npm run test:e2e            # spins up dev server, runs smoke spec
```

Against a deployed URL:

```bash
E2E_BASE_URL=https://<your-domain> npm run test:e2e
```
