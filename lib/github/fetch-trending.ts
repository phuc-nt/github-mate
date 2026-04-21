import type { TrendingAuthor } from "./types";

interface SearchRepo {
  name: string;
  language: string | null;
  owner: { login: string; type: string };
}

interface SearchResponse {
  items: SearchRepo[];
}

function windowStart(daysAgo: number): string {
  const d = new Date(Date.now() - daysAgo * 86_400_000);
  return d.toISOString().slice(0, 10);
}

export async function fetchTrendingAuthors(token?: string): Promise<TrendingAuthor[]> {
  const since = windowStart(30);
  const query = `pushed:>${since} stars:>5000`;
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=100`;

  const headers: Record<string, string> = {
    "User-Agent": "github-mate",
    Accept: "application/vnd.github+json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, { headers });
  if (!res.ok) return [];

  const data = (await res.json()) as SearchResponse;
  const repos = data.items ?? [];

  const byAuthor = new Map<string, TrendingAuthor>();
  for (const r of repos) {
    if (!r.owner?.login || r.owner.type !== "User") continue;
    const login = r.owner.login;
    const existing = byAuthor.get(login);
    if (existing) {
      existing.repoCount += 1;
    } else {
      byAuthor.set(login, {
        login,
        repoCount: 1,
        topRepo: r.name,
        language: r.language ?? null,
      });
    }
  }

  return Array.from(byAuthor.values()).sort((a, b) => b.repoCount - a.repoCount);
}
