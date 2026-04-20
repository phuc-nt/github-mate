import { fetchTrendingAuthors } from "../github/fetch-trending";
import { fetchUserProfile } from "../github/fetch-profile";
import type { KVLike } from "../github/kv-cache";
import { InvalidLoginError, ProfileNotFoundError, RateLimitError } from "../github/types";
import { buildKg } from "../kg/build-kg";
import type { D1Like } from "../api/d1-types";
import { persistProfile } from "../api/persist-profile";
import { clearStaleTop20, upsertTop20Author } from "./persist-top20-author";

export interface RefreshDeps {
  db: D1Like;
  cache: KVLike;
  token: string;
  maxAuthors?: number;
  delayMs?: number;
}

export interface RefreshResult {
  processed: string[];
  failed: Array<{ login: string; reason: string }>;
  totalTrending: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function refreshTop20(deps: RefreshDeps): Promise<RefreshResult> {
  const max = deps.maxAuthors ?? 20;
  const trending = await fetchTrendingAuthors();
  const top = trending.slice(0, max);

  const processed: string[] = [];
  const failed: RefreshResult["failed"] = [];

  for (let i = 0; i < top.length; i++) {
    const author = top[i];
    try {
      const { profile } = await fetchUserProfile(author.login, {
        token: deps.token,
        cache: deps.cache,
      });
      const kg = buildKg(profile);
      await persistProfile(deps.db, profile, kg);
      await upsertTop20Author(
        deps.db,
        author.login,
        i + 1,
        author.repoCount,
        author.language,
      );
      processed.push(author.login);
    } catch (err) {
      const reason =
        err instanceof InvalidLoginError
          ? "invalid_login"
          : err instanceof ProfileNotFoundError
            ? "not_found"
            : err instanceof RateLimitError
              ? "rate_limited"
              : (err as Error).message;
      failed.push({ login: author.login, reason });
      if (err instanceof RateLimitError) break;
    }
    if (deps.delayMs && i < top.length - 1) await sleep(deps.delayMs);
  }

  if (processed.length > 0) {
    await clearStaleTop20(deps.db, processed);
  }

  return { processed, failed, totalTrending: trending.length };
}
