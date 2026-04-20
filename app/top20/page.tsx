import Link from "next/link";
import { env } from "@/lib/cloudflare-env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Top20Row {
  login: string;
  rank: number;
  score: number | null;
  community: string | null;
  updated_at: number;
}

export default async function Top20Page() {
  let rows: Top20Row[] = [];
  try {
    const res = await env()
      .DB.prepare(
        `SELECT login, rank, score, community, updated_at
         FROM top20_authors ORDER BY rank ASC LIMIT 20`,
      )
      .all<Top20Row>();
    rows = res.results;
  } catch {
    rows = [];
  }

  return (
    <section>
      <h1 style={{ color: "#f8fafc" }}>Top 20 trending authors</h1>
      <p style={{ color: "#94a3b8" }}>
        Weekly refresh via Cloudflare Cron Triggers.
      </p>
      {rows.length === 0 ? (
        <p style={{ color: "#64748b" }}>
          No data yet. The weekly cron populates this table.
        </p>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: "1rem",
          }}
        >
          <thead>
            <tr style={{ textAlign: "left", color: "#94a3b8" }}>
              <th style={th}>#</th>
              <th style={th}>Login</th>
              <th style={th}>Community</th>
              <th style={th}>Score</th>
              <th style={th}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.login} style={{ borderTop: "1px solid #1e293b" }}>
                <td style={td}>{r.rank}</td>
                <td style={td}>
                  <a
                    href={`https://github.com/${r.login}`}
                    style={{ color: "#e2e8f0" }}
                  >
                    @{r.login}
                  </a>
                </td>
                <td style={{ ...td, color: "#94a3b8" }}>{r.community ?? "—"}</td>
                <td style={{ ...td, color: "#94a3b8" }}>
                  {r.score != null ? r.score.toFixed(2) : "—"}
                </td>
                <td style={td}>
                  <Link
                    href={`/?urlB=https://github.com/${r.login}`}
                    style={{ color: "#6366f1" }}
                  >
                    Match me →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

const th: React.CSSProperties = { padding: "0.5rem", fontWeight: 500 };
const td: React.CSSProperties = { padding: "0.75rem 0.5rem", color: "#e2e8f0" };
