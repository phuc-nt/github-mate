import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/cloudflare-env";
import {
  clearSessionCookie,
  deleteSession,
  readSessionCookie,
} from "@/lib/api/session-store";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const sid = readSessionCookie(req.headers.get("cookie"));
  if (sid) await deleteSession(env().DB, sid);
  const res = NextResponse.json({ ok: true });
  res.headers.set("Set-Cookie", clearSessionCookie());
  return res;
}
