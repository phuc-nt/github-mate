import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/cloudflare-env";
import { refreshTop20 } from "@/lib/top20/refresh-top20";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const e = env();
  const expected = e.ADMIN_TOKEN;
  if (!expected) {
    return NextResponse.json({ error: "admin_disabled" }, { status: 503 });
  }
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const result = await refreshTop20({
    db: e.DB,
    cache: e.CACHE,
    token: e.GITHUB_TOKEN,
    delayMs: 500,
  });
  return NextResponse.json(result);
}
