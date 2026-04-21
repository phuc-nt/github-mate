# Codebase Summary

Top-level module map. All library files kept under 200 LOC, kebab-case.

## `lib/github/` — GraphQL fetcher

| File | Purpose |
|------|---------|
| `types.ts` | GitHubProfile, Repo, RateLimitError |
| `profile-query.ts` | GraphQL query string (~425pts/profile) |
| `graphql-client.ts` | POST https://api.github.com/graphql with rate-limit parse |
| `rate-limit.ts` | throws RateLimitError on 403/429 |
| `kv-cache.ts` | KV get/put with TTL (GitHub API responses) |
| `fetch-profile.ts` | Orchestrator: kv cache → graphql → typed profile |
| `fetch-commit-activity.ts` | REST: weekly commit counts |
| `fetch-readme.ts` | REST: user profile README |
| `fetch-trending.ts` | github-trending-api.vercel.app/repositories (Top 20 source) |

## `lib/kg/` — Knowledge graph builder

| File | Purpose |
|------|---------|
| `types.ts` | KgNode (id, file_type, label), KgLink (source, target, relation, confidence), KnowledgeGraph |
| `community-assigner.ts` | Assigns a community label per profile (trending topic / org / fallback) |
| `framework-detector.ts` | Regex-based: React, NextJS, PyTorch, Django, Rails, … |
| `node-factories.ts` | makePersonNode / makeRepoNode / makeLanguageNode / makeTopicNode / makeFrameworkNode / makeOrgNode |
| `edge-factories.ts` | makeLink(source, target, relation, confidence?) |
| `build-kg.ts` | Main orchestrator: profile → nodes + links + markdown files |
| `emit-markdown.ts` | YAML frontmatter + `[[target]] - `relation` [CONF]` wikilinks |
| `emit-graph-json.ts` | networkx node-link JSON (includes `_src`/`_tgt` for convenience) |
| `emit-obsidian-config.ts` | `.obsidian/graph.json` with colorGroups per node type |
| `pack-vault-zip.ts` | fflate zipSync: markdown tree + graph.json + .obsidian/ |

## `lib/scoring/` — Match scoring

| File | Purpose |
|------|---------|
| `types.ts` | MatchBreakdown, MatchResult |
| `cosine.ts` | normalizeCosine (maps [-1,1]→[0,1]) |
| `tech-overlap.ts` | Jaccard on language+framework node sets |
| `skill-heuristic.ts` | Table-based classifier (FRONTEND/AIML/INFRA/DATA_TOPICS) |
| `complementary-skills.ts` | disjoint=1, partial=0.5, full overlap=0 |
| `interest-similarity.ts` | bge doc builder + cosine (Workers AI embed) |
| `kg-overlap.ts` | Node + edge intersection for overlap viz |
| `compute-match.ts` | Weights `{tech:0.3, interest:0.4, complementary:0.3}` |

## `lib/api/` — Route helpers

| File | Purpose |
|------|---------|
| `parse-github-url.ts` | strict regex → login; throws InvalidUrlError |
| `hash-pair.ts` | sha256 of sorted-lowercase login pair (cache key) |
| `d1-types.ts` | D1Statement / D1Like interfaces (mockable) |
| `persist-profile.ts` | Upsert profile with inline kg_json + vault_json (D1-only MVP) |
| `match-cache.ts` | 30d TTL read/write on match_history |
| `oauth-github.ts` | authorize URL + state + code exchange + viewer login |
| `session-store.ts` | AES-GCM token encryption via SESSION_SECRET; cookie helpers |
| `match-orchestrator.ts` | hashPair → cache → parallel fetch×2 → buildKg×2 → persist×2 → computeMatch → cache |

## `lib/top20/` — Leaderboard pipeline

| File | Purpose |
|------|---------|
| `persist-top20-author.ts` | upsert + clearStale (NOT IN (?,?,…)) |
| `refresh-top20.ts` | Sync loop: trending → fetchProfile → buildKg → persist → upsert; 500ms throttle; rate-limit breaks loop |

## `app/` — Next.js App Router

```
app/
├── layout.tsx                  # dark theme, header nav, SessionBadge
├── page.tsx                    # landing + UrlInputForm
├── match/
│   ├── page.tsx
│   └── match-client.tsx        # POSTs /api/match, fetches KGs, renders ScoreCard + GraphViewer
├── top20/page.tsx              # server-rendered D1 SELECT
├── components/
│   ├── session-badge.tsx       # Sign in / Sign out via /api/auth/*
│   ├── url-input-form.tsx      # 2-URL form with ?urlB= prefill
│   ├── score-card.tsx          # big % + breakdown bars
│   └── graph-viewer.tsx        # cytoscape dynamic import, overlap highlighted pink
└── api/
    ├── match/route.ts
    ├── profile/[login]/
    │   ├── kg/route.ts
    │   └── vault/route.ts      # fflate zipSync in-worker
    ├── top20/route.ts
    ├── auth/
    │   ├── github/login/route.ts
    │   ├── github/callback/route.ts
    │   ├── session/route.ts
    │   └── logout/route.ts
    └── admin/refresh-top20/route.ts   # Bearer ADMIN_TOKEN; maxDuration 300
```

## Storage

### D1 (`github_mate`)

| Table | Purpose |
|-------|---------|
| `profiles` | login PK, display fields, languages_json, topics_json, **kg_json**, **vault_json**, fetched_at, expires_at (30d) |
| `match_history` | hash PK, score, breakdown_json, login_a, login_b, created_at, expires_at (30d) |
| `top20_authors` | login PK, rank, score, community, followers, updated_at |
| `sessions` | session_id PK, user_login, access_token_encrypted (AES-GCM), created_at, expires_at |

### KV (`CACHE`)

- GitHub API responses (TTL varies by endpoint)
- OAuth state (10min TTL)

## Tests

41 vitest tests across: `lib/github/fetch-profile`, `lib/kg/build-kg`, `lib/kg/row-size-guard`, `lib/scoring/compute-match`, `lib/api/*` (hashPair, runMatch, session-store, parse-github-url, oauth-github), `lib/top20/refresh-top20`. Playwright smoke spec at `e2e/landing-smoke.spec.ts`.

## Environment bindings

Declared in `wrangler.toml` + `cloudflare-env.d.ts`:

- `DB` (D1), `CACHE` (KV), `AI` (Workers AI)
- Secrets: `GITHUB_TOKEN`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `SESSION_SECRET`, `ADMIN_TOKEN` (optional)

## Deferred (post-MVP)

- OpenNext `scheduled()` handler wiring for weekly cron (currently: manual admin POST)
- Mobile responsive polish
- Structured logging helper
- Graph clustering algorithm (currently: community label from trending topic)
