import type { MatchBreakdown } from "@/lib/scoring/types";

const LABELS: Record<keyof MatchBreakdown, string> = {
  tech: "Tech overlap",
  interest: "Interest similarity",
  complementary: "Complementary skills",
};

export default function ScoreCard({
  score,
  breakdown,
}: {
  score: number;
  breakdown: MatchBreakdown;
}) {
  const pct = Math.round(score * 100);
  return (
    <div
      style={{
        background: "#1e293b",
        padding: "1.5rem",
        borderRadius: 12,
        border: "1px solid #334155",
      }}
    >
      <div style={{ fontSize: "0.85rem", color: "#94a3b8" }}>Match score</div>
      <div
        style={{
          fontSize: "3.5rem",
          fontWeight: 700,
          color: pct >= 60 ? "#22c55e" : pct >= 40 ? "#eab308" : "#f87171",
          lineHeight: 1,
          margin: "0.5rem 0 1.5rem",
        }}
      >
        {pct}%
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {(Object.keys(breakdown) as Array<keyof MatchBreakdown>).map((k) => {
          const v = breakdown[k];
          const p = Math.round(v * 100);
          return (
            <div key={k}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  color: "#cbd5e1",
                  fontSize: "0.85rem",
                  marginBottom: 4,
                }}
              >
                <span>{LABELS[k]}</span>
                <span>{p}%</span>
              </div>
              <div
                style={{
                  background: "#0f172a",
                  height: 8,
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    background: "#6366f1",
                    width: `${p}%`,
                    height: "100%",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
