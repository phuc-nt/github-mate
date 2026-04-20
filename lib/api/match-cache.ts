import type { MatchResult } from "../scoring/types";
import type { D1Like } from "./d1-types";

const MATCH_TTL_SECONDS = 30 * 24 * 60 * 60;

export interface CachedMatch {
  score: number;
  breakdown: MatchResult["breakdown"];
  overlap: MatchResult["overlap"];
  skillTagsA: MatchResult["skillTagsA"];
  skillTagsB: MatchResult["skillTagsB"];
  cached: true;
}

export async function readCachedMatch(
  db: D1Like,
  cacheKey: string,
): Promise<CachedMatch | null> {
  const now = Math.floor(Date.now() / 1000);
  const row = await db
    .prepare(
      `SELECT score, breakdown_json, expires_at FROM match_history WHERE cache_key = ?`,
    )
    .bind(cacheKey)
    .first<{ score: number; breakdown_json: string; expires_at: number }>();
  if (!row || row.expires_at < now) return null;
  const parsed = JSON.parse(row.breakdown_json) as Omit<CachedMatch, "cached" | "score">;
  return { ...parsed, score: row.score, cached: true };
}

export async function writeMatchCache(
  db: D1Like,
  cacheKey: string,
  loginA: string,
  loginB: string,
  result: MatchResult,
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const breakdownJson = JSON.stringify({
    breakdown: result.breakdown,
    overlap: result.overlap,
    skillTagsA: result.skillTagsA,
    skillTagsB: result.skillTagsB,
  });
  await db
    .prepare(
      `INSERT INTO match_history (cache_key, login_a, login_b, score, breakdown_json, created_at, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(cache_key) DO UPDATE SET
         score=excluded.score,
         breakdown_json=excluded.breakdown_json,
         created_at=excluded.created_at,
         expires_at=excluded.expires_at`,
    )
    .bind(
      cacheKey,
      loginA,
      loginB,
      result.score,
      breakdownJson,
      now,
      now + MATCH_TTL_SECONDS,
    )
    .run();
}
