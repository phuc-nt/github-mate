import type { D1Like } from "../api/d1-types";

export async function upsertTop20Author(
  db: D1Like,
  login: string,
  rank: number,
  score: number | null,
  community: string | null,
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  await db
    .prepare(
      `INSERT INTO top20_authors (login, rank, score, community, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(login) DO UPDATE SET
         rank=excluded.rank,
         score=excluded.score,
         community=excluded.community,
         updated_at=excluded.updated_at`,
    )
    .bind(login, rank, score, community, now)
    .run();
}

export async function clearStaleTop20(
  db: D1Like,
  activeLogins: string[],
): Promise<void> {
  if (activeLogins.length === 0) return;
  const placeholders = activeLogins.map(() => "?").join(",");
  await db
    .prepare(`DELETE FROM top20_authors WHERE login NOT IN (${placeholders})`)
    .bind(...activeLogins)
    .run();
}
