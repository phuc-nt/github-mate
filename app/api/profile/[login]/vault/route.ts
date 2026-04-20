import { NextRequest, NextResponse } from "next/server";
import { zipSync, strToU8 } from "fflate";
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

  const files = JSON.parse(row.vault_json) as Record<string, string>;
  const bytes: Record<string, Uint8Array> = {};
  for (const [path, content] of Object.entries(files)) {
    bytes[path] = strToU8(content);
  }
  const zipped = zipSync(bytes);

  return new NextResponse(zipped as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${login}-vault.zip"`,
    },
  });
}
