import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/cloudflare-env";
import { buildAuthorizeUrl, randomState } from "@/lib/api/oauth-github";

export const runtime = "nodejs";

const STATE_TTL = 600;

export async function GET(req: NextRequest) {
  const e = env();
  const state = randomState();
  await e.CACHE.put(`oauth:state:${state}`, "1", { expirationTtl: STATE_TTL });
  const origin = req.nextUrl.origin;
  const url = buildAuthorizeUrl(
    {
      clientId: e.GITHUB_CLIENT_ID,
      clientSecret: e.GITHUB_CLIENT_SECRET,
      redirectUri: `${origin}/api/auth/github/callback`,
    },
    state,
  );
  return NextResponse.redirect(url, 302);
}
