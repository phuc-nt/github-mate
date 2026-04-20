import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/cloudflare-env";
import { parseGithubUrl, InvalidUrlError } from "@/lib/api/parse-github-url";
import { runMatch } from "@/lib/api/match-orchestrator";
import { readSession, readSessionCookie, decryptToken } from "@/lib/api/session-store";
import {
  InvalidLoginError,
  ProfileNotFoundError,
  RateLimitError,
} from "@/lib/github/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const e = env();
  let body: { urlA?: string; urlB?: string };
  try {
    body = (await req.json()) as { urlA?: string; urlB?: string };
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!body.urlA || !body.urlB) {
    return NextResponse.json({ error: "missing_urls" }, { status: 400 });
  }

  let loginA: string;
  let loginB: string;
  try {
    loginA = parseGithubUrl(body.urlA);
    loginB = parseGithubUrl(body.urlB);
  } catch (err) {
    if (err instanceof InvalidUrlError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
  if (loginA.toLowerCase() === loginB.toLowerCase()) {
    return NextResponse.json({ error: "same_user" }, { status: 400 });
  }

  // Prefer OAuth session token if present
  let token = e.GITHUB_TOKEN;
  const sid = readSessionCookie(req.headers.get("cookie"));
  if (sid) {
    const s = await readSession(e.DB, sid);
    if (s) {
      try {
        token = await decryptToken(s.access_token_encrypted, e.SESSION_SECRET);
      } catch {
        // fall back to app token
      }
    }
  }

  try {
    const result = await runMatch(loginA, loginB, {
      db: e.DB,
      cache: e.CACHE,
      ai: e.AI as never,
      token,
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof InvalidLoginError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    if (err instanceof ProfileNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    if (err instanceof RateLimitError) {
      return NextResponse.json({ error: "github_rate_limited" }, { status: 429 });
    }
    console.error("match error", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
