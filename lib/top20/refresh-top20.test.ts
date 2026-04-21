import { describe, expect, it, vi } from "vitest";
import { refreshTop20 } from "./refresh-top20";
import type { D1Like, D1Statement } from "../api/d1-types";

function mockKV() {
  const store = new Map<string, string>();
  return {
    get: vi.fn(async (k: string) => store.get(k) ?? null),
    put: vi.fn(async (k: string, v: string) => {
      store.set(k, v);
    }),
    delete: vi.fn(async (k: string) => {
      store.delete(k);
    }),
  };
}

function mockD1() {
  const state = {
    profileInserts: [] as unknown[][],
    top20Inserts: [] as unknown[][],
    top20Deletes: 0,
  };
  const prepare = vi.fn((sql: string): D1Statement => {
    let bound: unknown[] = [];
    const stmt: D1Statement = {
      bind(...values) {
        bound = values;
        return stmt;
      },
      async first() {
        return null;
      },
      async run() {
        if (sql.startsWith("INSERT INTO profiles")) {
          state.profileInserts.push(bound);
        } else if (sql.startsWith("INSERT INTO top20_authors")) {
          state.top20Inserts.push(bound);
        } else if (sql.startsWith("DELETE FROM top20_authors")) {
          state.top20Deletes += 1;
        }
        return { success: true };
      },
      async all() {
        return { results: [] };
      },
    };
    return stmt;
  });
  return { db: { prepare } as D1Like, state };
}

function mockProfile(login: string) {
  return {
    data: {
      user: {
        login,
        name: login,
        bio: null,
        company: null,
        location: null,
        followers: { totalCount: 100 },
        following: { totalCount: 10 },
        repositories: {
          totalCount: 1,
          nodes: [
            {
              name: "repo",
              description: null,
              stargazerCount: 1,
              forkCount: 0,
              languages: { nodes: [{ name: "Python" }] },
              repositoryTopics: { nodes: [] },
              isArchived: false,
              pushedAt: "2026-04-01T00:00:00Z",
            },
          ],
        },
        pinnedItems: { nodes: [] },
        starredRepositories: { nodes: [] },
        contributionsCollection: {
          contributionCalendar: { totalContributions: 10, weeks: [] },
        },
      },
    },
  };
}

describe("refreshTop20", () => {
  it("fetches trending, builds KGs, upserts D1 rows, clears stale", async () => {
    const { db, state } = mockD1();
    const kv = mockKV();
    const orig = globalThis.fetch;
    const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
      const u = String(url);
      if (u.includes("api.github.com/search/repositories")) {
        return new Response(
          JSON.stringify({
            items: [
              { name: "r1", language: "Python", owner: { login: "alice", type: "User" } },
              { name: "r2", language: "Go", owner: { login: "bob", type: "User" } },
              { name: "r3", language: "Python", owner: { login: "alice", type: "User" } },
              { name: "r4", language: "Rust", owner: { login: "someorg", type: "Organization" } },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      if (u.includes("api.github.com/graphql")) {
        const body = JSON.parse(String(init?.body ?? "{}")) as {
          variables: { userName: string };
        };
        return new Response(JSON.stringify(mockProfile(body.variables.userName)), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      throw new Error(`unexpected fetch: ${u}`);
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    try {
      const result = await refreshTop20({
        db,
        cache: kv,
        token: "tok",
        maxAuthors: 2,
        delayMs: 0,
      });
      expect(result.processed).toEqual(["alice", "bob"]);
      expect(result.failed).toHaveLength(0);
      expect(state.profileInserts).toHaveLength(2);
      expect(state.top20Inserts).toHaveLength(2);
      expect(state.top20Deletes).toBe(1);
      // rank 1 = alice (higher repoCount), rank 2 = bob
      expect(state.top20Inserts[0][0]).toBe("alice");
      expect(state.top20Inserts[0][1]).toBe(1);
      expect(state.top20Inserts[1][0]).toBe("bob");
      expect(state.top20Inserts[1][1]).toBe(2);
    } finally {
      globalThis.fetch = orig;
    }
  });
});
