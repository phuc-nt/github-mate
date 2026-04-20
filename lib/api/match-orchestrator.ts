import { fetchUserProfile } from "../github/fetch-profile";
import type { KVLike } from "../github/kv-cache";
import { buildKg } from "../kg/build-kg";
import { computeMatch } from "../scoring/compute-match";
import type { AiRunner, MatchResult } from "../scoring/types";
import type { D1Like } from "./d1-types";
import { hashPair } from "./hash-pair";
import { readCachedMatch, writeMatchCache } from "./match-cache";
import { persistProfile } from "./persist-profile";

export interface MatchDeps {
  db: D1Like;
  cache: KVLike;
  ai: AiRunner;
  token: string;
}

export type MatchResponse =
  | ({ cached: true } & Pick<MatchResult, "score" | "breakdown" | "overlap" | "skillTagsA" | "skillTagsB"> & { loginA: string; loginB: string })
  | ({ cached: false } & MatchResult & { loginA: string; loginB: string });

export async function runMatch(
  loginA: string,
  loginB: string,
  deps: MatchDeps,
): Promise<MatchResponse> {
  const cacheKey = await hashPair(loginA, loginB);
  const cached = await readCachedMatch(deps.db, cacheKey);
  if (cached) {
    return { ...cached, loginA, loginB };
  }

  const [resA, resB] = await Promise.all([
    fetchUserProfile(loginA, { token: deps.token, cache: deps.cache }),
    fetchUserProfile(loginB, { token: deps.token, cache: deps.cache }),
  ]);
  const profileA = resA.profile;
  const profileB = resB.profile;

  const kgA = buildKg(profileA);
  const kgB = buildKg(profileB);

  await persistProfile(deps.db, profileA, kgA);
  await persistProfile(deps.db, profileB, kgB);

  const result = await computeMatch(kgA, kgB, deps.ai);
  await writeMatchCache(deps.db, cacheKey, loginA, loginB, result);

  return { ...result, loginA, loginB, cached: false };
}
