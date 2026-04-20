import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/cloudflare-env";
import { readSession, readSessionCookie } from "@/lib/api/session-store";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const sid = readSessionCookie(req.headers.get("cookie"));
  if (!sid) return NextResponse.json({ authenticated: false });
  const row = await readSession(env().DB, sid);
  if (!row) return NextResponse.json({ authenticated: false });
  return NextResponse.json({ authenticated: true, login: row.github_login });
}
