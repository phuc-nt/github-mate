import { describe, expect, it, vi } from "vitest";
import { parseGithubUrl, InvalidUrlError } from "./parse-github-url";
import { hashPair } from "./hash-pair";
import { buildAuthorizeUrl, randomState } from "./oauth-github";
import {
  encryptToken,
  decryptToken,
  sessionCookie,
  readSessionCookie,
  clearSessionCookie,
} from "./session-store";
import { runMatch } from "./match-orchestrator";
import type { D1Like, D1Statement } from "./d1-types";

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
  const rows = new Map<string, Record<string, unknown>>();
  const prepare = vi.fn((sql: string): D1Statement => {
    let bound: unknown[] = [];
    const stmt: D1Statement = {
      bind(...values) {
        bound = values;
        return stmt;
      },
      async first() {
        if (sql.includes("FROM match_history")) {
          const row = rows.get(`match:${bound[0]}`);
          return (row as never) ?? null;
        }
        if (sql.includes("FROM profiles")) {
          const row = rows.get(`profile:${bound[0]}`);
          return (row as never) ?? null;
        }
        return null;
      },
      async run() {
        if (sql.startsWith("INSERT INTO match_history")) {
          rows.set(`match:${bound[0]}`, {
            cache_key: bound[0],
            score: bound[3],
            breakdown_json: bound[4],
            expires_at: bound[6],
          });
        }
        if (sql.startsWith("INSERT INTO profiles")) {
          rows.set(`profile:${bound[0]}`, {
            login: bound[0],
            kg_json: bound[8],
            vault_json: bound[9],
            expires_at: bound[11],
          });
        }
        return { success: true };
      },
      async all() {
        return { results: [] };
      },
    };
    return stmt;
  });
  return { prepare, rows } as unknown as D1Like & { rows: Map<string, unknown>; prepare: typeof prepare };
}

function mockProfile(login: string) {
  return {
    data: {
      user: {
        login,
        name: login,
        bio: "test",
        company: null,
        location: null,
        followers: { totalCount: 1 },
        following: { totalCount: 1 },
        repositories: {
          totalCount: 1,
          nodes: [
            {
              name: "repo1",
              description: "React app",
              stargazerCount: 1,
              forkCount: 0,
              languages: { nodes: [{ name: "TypeScript" }] },
              repositoryTopics: { nodes: [{ topic: { name: "react" } }] },
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

describe("parseGithubUrl", () => {
  it("extracts login from valid URL", () => {
    expect(parseGithubUrl("https://github.com/alice")).toBe("alice");
    expect(parseGithubUrl("https://github.com/alice/")).toBe("alice");
    expect(parseGithubUrl("http://github.com/alice")).toBe("alice");
  });
  it("rejects invalid URLs", () => {
    expect(() => parseGithubUrl("https://gitlab.com/alice")).toThrow(InvalidUrlError);
    expect(() => parseGithubUrl("https://github.com/")).toThrow(InvalidUrlError);
    expect(() => parseGithubUrl("https://github.com/alice/repo")).toThrow(InvalidUrlError);
    expect(() => parseGithubUrl("not a url")).toThrow(InvalidUrlError);
  });
});

describe("hashPair", () => {
  it("is order-independent and case-insensitive", async () => {
    const a = await hashPair("alice", "bob");
    const b = await hashPair("bob", "alice");
    const c = await hashPair("ALICE", "BOB");
    expect(a).toBe(b);
    expect(a).toBe(c);
  });
  it("produces 64-char hex", async () => {
    const h = await hashPair("a", "b");
    expect(h).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("OAuth helpers", () => {
  it("builds authorize URL with required params", () => {
    const url = buildAuthorizeUrl(
      { clientId: "cid", clientSecret: "sec", redirectUri: "https://x/cb" },
      "state123",
    );
    expect(url).toContain("client_id=cid");
    expect(url).toContain("state=state123");
    expect(url).toContain("redirect_uri=https%3A%2F%2Fx%2Fcb");
    expect(url).toContain("scope=read%3Auser+public_repo");
  });
  it("randomState returns 32-char hex", () => {
    expect(randomState()).toMatch(/^[0-9a-f]{32}$/);
  });
});

describe("session-store", () => {
  it("encrypt → decrypt round-trips", async () => {
    const blob = await encryptToken("gho_sekret", "secret-key");
    const back = await decryptToken(blob, "secret-key");
    expect(back).toBe("gho_sekret");
  });
  it("wrong secret fails to decrypt", async () => {
    const blob = await encryptToken("tok", "right");
    await expect(decryptToken(blob, "wrong")).rejects.toThrow();
  });
  it("cookie header roundtrip", () => {
    const cookie = sessionCookie("abc");
    expect(cookie).toContain("HttpOnly");
    expect(readSessionCookie(`gm_session=abc; other=1`)).toBe("abc");
    expect(readSessionCookie(null)).toBeNull();
    expect(clearSessionCookie()).toContain("Max-Age=0");
  });
});

describe("runMatch (E2E)", () => {
  it("computes match on cache miss and persists", async () => {
    const db = mockD1();
    const kv = mockKV();
    const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
      const u = String(url);
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
    // vitest arguments trick: bind fetch as global for graphql-client
    const origFetch = globalThis.fetch;
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    try {
      const ai = {
        run: vi.fn().mockResolvedValue({ data: [[1, 0, 0], [0, 1, 0]] }),
      };
      const result = await runMatch("alice", "bob", {
        db,
        cache: kv,
        ai: ai as never,
        token: "tok",
      });
      expect(result.cached).toBe(false);
      if (result.cached === false) {
        expect(result.loginA).toBe("alice");
        expect(result.breakdown.complementary).toBeGreaterThanOrEqual(0);
      }
      // Second call: cache hit
      const hit = await runMatch("alice", "bob", {
        db,
        cache: kv,
        ai: ai as never,
        token: "tok",
      });
      expect(hit.cached).toBe(true);
    } finally {
      globalThis.fetch = origFetch;
    }
  });
});
