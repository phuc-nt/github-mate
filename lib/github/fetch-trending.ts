import type { TrendingAuthor } from "./types";

const TRENDING_URL =
  "https://github-trending-api.vercel.app/repositories?since=weekly";

interface TrendingRepo {
  author: string;
  name: string;
  language: string | null;
}

export async function fetchTrendingAuthors(): Promise<TrendingAuthor[]> {
  const res = await fetch(TRENDING_URL, {
    headers: { "User-Agent": "github-mate" },
  });
  if (!res.ok) return [];

  const repos = (await res.json()) as TrendingRepo[];

  const byAuthor = new Map<string, TrendingAuthor>();
  for (const r of repos) {
    if (!r.author) continue;
    const existing = byAuthor.get(r.author);
    if (existing) {
      existing.repoCount += 1;
    } else {
      byAuthor.set(r.author, {
        login: r.author,
        repoCount: 1,
        topRepo: r.name,
        language: r.language ?? null,
      });
    }
  }

  return Array.from(byAuthor.values()).sort((a, b) => b.repoCount - a.repoCount);
}
