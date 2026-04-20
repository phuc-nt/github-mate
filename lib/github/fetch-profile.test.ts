import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchUserProfile } from "./fetch-profile";
import { InvalidLoginError, ProfileNotFoundError, RateLimitError } from "./types";
import type { KVLike } from "./kv-cache";

function makeKv(): KVLike & { store: Map<string, string> } {
  const store = new Map<string, string>();
  return {
    store,
    async get(key: string) {
      return store.get(key) ?? null;
    },
    async put(key: string, value: string) {
      store.set(key, value);
    },
    async delete(key: string) {
      store.delete(key);
    },
  };
}

function mockGraphqlResponse(login: string) {
  return {
    data: {
      rateLimit: { limit: 5000, cost: 1, remaining: 4999 },
      user: {
        login,
        name: "Linus Torvalds",
        bio: null,
        company: null,
        location: null,
        followers: { totalCount: 200000 },
        following: { totalCount: 0 },
        repositories: { totalCount: 10, nodes: [] },
        pinnedItems: { nodes: [] },
        starredRepositories: { nodes: [] },
        contributionsCollection: {
          contributionCalendar: { totalContributions: 0, weeks: [] },
        },
      },
    },
  };
}

describe("fetchUserProfile (E2E)", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetches on cache miss, stores in KV, and returns profile", async () => {
    const kv = makeKv();
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(mockGraphqlResponse("torvalds")), { status: 200 }),
    );

    const result = await fetchUserProfile("torvalds", { token: "fake", cache: kv });

    expect(result.cached).toBe(false);
    expect(result.profile.login).toBe("torvalds");
    expect(kv.store.size).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toContain("/graphql");
  });

  it("returns cached profile on second call without fetching", async () => {
    const kv = makeKv();
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(mockGraphqlResponse("torvalds")), { status: 200 }),
    );

    const first = await fetchUserProfile("torvalds", { token: "fake", cache: kv });
    expect(first.cached).toBe(false);

    const second = await fetchUserProfile("torvalds", { token: "fake", cache: kv });
    expect(second.cached).toBe(true);
    expect(second.profile.login).toBe("torvalds");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("rejects invalid login without calling fetch", async () => {
    const kv = makeKv();
    await expect(
      fetchUserProfile("bad login!", { token: "fake", cache: kv }),
    ).rejects.toBeInstanceOf(InvalidLoginError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws ProfileNotFoundError when GraphQL returns null user", async () => {
    const kv = makeKv();
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: { rateLimit: { limit: 5000, cost: 1, remaining: 4999 }, user: null },
        }),
        { status: 200 },
      ),
    );

    await expect(
      fetchUserProfile("ghostuser123", { token: "fake", cache: kv }),
    ).rejects.toBeInstanceOf(ProfileNotFoundError);
  });

  it("throws RateLimitError on 403 without retrying forever", async () => {
    const kv = makeKv();
    fetchMock.mockImplementation(
      () =>
        new Response("rate limited", {
          status: 403,
          headers: { "x-ratelimit-remaining": "0" },
        }),
    );

    await expect(
      fetchUserProfile("torvalds", { token: "fake", cache: kv }),
    ).rejects.toBeInstanceOf(RateLimitError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("skipCache bypasses KV even on hit", async () => {
    const kv = makeKv();
    fetchMock.mockImplementation(
      () =>
        new Response(JSON.stringify(mockGraphqlResponse("torvalds")), { status: 200 }),
    );

    await fetchUserProfile("torvalds", { token: "fake", cache: kv });
    const result = await fetchUserProfile("torvalds", {
      token: "fake",
      cache: kv,
      skipCache: true,
    });
    expect(result.cached).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
