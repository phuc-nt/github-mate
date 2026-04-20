import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/cloudflare-env";
import { exchangeCode, fetchViewerLogin } from "@/lib/api/oauth-github";
import {
  createSession,
  newSessionId,
  sessionCookie,
} from "@/lib/api/session-store";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const e = env();
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  if (!code || !state) {
    return NextResponse.json({ error: "missing_params" }, { status: 400 });
  }
  const storedState = await e.CACHE.get(`oauth:state:${state}`);
  if (!storedState) {
    return NextResponse.json({ error: "invalid_state" }, { status: 400 });
  }
  await e.CACHE.delete(`oauth:state:${state}`);

  try {
    const { accessToken } = await exchangeCode(
      {
        clientId: e.GITHUB_CLIENT_ID,
        clientSecret: e.GITHUB_CLIENT_SECRET,
        redirectUri: `${req.nextUrl.origin}/api/auth/github/callback`,
      },
      code,
    );
    const login = await fetchViewerLogin(accessToken);
    const sessionId = newSessionId();
    await createSession(e.DB, sessionId, login, accessToken, e.SESSION_SECRET);
    const response = NextResponse.redirect(`${req.nextUrl.origin}/`, 302);
    response.headers.set("Set-Cookie", sessionCookie(sessionId));
    return response;
  } catch (err) {
    console.error("oauth callback error", err);
    return NextResponse.json({ error: "oauth_failed" }, { status: 500 });
  }
}
