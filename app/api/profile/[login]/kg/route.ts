import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/cloudflare-env";
import { readCachedProfile } from "@/lib/api/persist-profile";
import { LOGIN_PATTERN } from "@/lib/github/profile-query";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ login: string }> },
) {
  const { login } = await ctx.params;
  if (!LOGIN_PATTERN.test(login)) {
    return NextResponse.json({ error: "invalid_login" }, { status: 400 });
  }
  const row = await readCachedProfile(env().DB, login);
  if (!row) return NextResponse.json({ error: "not_cached" }, { status: 404 });
  return new NextResponse(row.kg_json, {
    status: 200,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
