import { NextResponse } from "next/server";
import { env } from "@/lib/cloudflare-env";

export const runtime = "nodejs";

interface Top20Row {
  login: string;
  rank: number;
  score: number | null;
  community: string | null;
  updated_at: number;
}

export async function GET() {
  const rows = await env()
    .DB.prepare(
      `SELECT login, rank, score, community, updated_at
       FROM top20_authors ORDER BY rank ASC LIMIT 20`,
    )
    .all<Top20Row>();
  return NextResponse.json({ authors: rows.results });
}
