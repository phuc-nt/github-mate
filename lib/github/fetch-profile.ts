import { graphqlRequest } from "./graphql-client";
import { getJson, putJson, type KVLike } from "./kv-cache";
import { LOGIN_PATTERN, PROFILE_QUERY } from "./profile-query";
import {
  InvalidLoginError,
  ProfileNotFoundError,
  type GitHubProfile,
  type ProfileQueryResult,
} from "./types";

const CACHE_TTL_SECONDS = 3600;
const CACHE_KEY_PREFIX = "gh:profile:v1:";

export interface FetchProfileOptions {
  token: string;
  cache: KVLike;
  repoCount?: number;
  starCount?: number;
  skipCache?: boolean;
}

export interface FetchProfileResult {
  profile: GitHubProfile;
  cached: boolean;
}

export async function fetchUserProfile(
  login: string,
  opts: FetchProfileOptions,
): Promise<FetchProfileResult> {
  if (!LOGIN_PATTERN.test(login)) throw new InvalidLoginError(login);

  const cacheKey = `${CACHE_KEY_PREFIX}${login.toLowerCase()}`;

  if (!opts.skipCache) {
    const cached = await getJson<GitHubProfile>(opts.cache, cacheKey);
    if (cached) return { profile: cached, cached: true };
  }

  const data = await graphqlRequest<ProfileQueryResult>(opts.token, PROFILE_QUERY, {
    userName: login,
    repoCount: opts.repoCount ?? 10,
    starCount: opts.starCount ?? 50,
  });

  if (!data.user) throw new ProfileNotFoundError(login);

  await putJson(opts.cache, cacheKey, data.user, CACHE_TTL_SECONDS);
  return { profile: data.user, cached: false };
}
