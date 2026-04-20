"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import ScoreCard from "../components/score-card";
import GraphViewer, { type KgPayload } from "../components/graph-viewer";
import type { MatchBreakdown, MatchOverlap } from "@/lib/scoring/types";

interface MatchApiResponse {
  cached: boolean;
  loginA: string;
  loginB: string;
  score: number;
  breakdown: MatchBreakdown;
  overlap: MatchOverlap;
  skillTagsA: string[];
  skillTagsB: string[];
  error?: string;
}

const STAGES = [
  "Fetching profiles…",
  "Building knowledge graphs…",
  "Scoring match…",
];

export default function MatchClient() {
  const params = useSearchParams();
  const urlA = params.get("a") ?? "";
  const urlB = params.get("b") ?? "";
  const [stage, setStage] = useState(0);
  const [result, setResult] = useState<MatchApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [kgA, setKgA] = useState<KgPayload | null>(null);
  const [kgB, setKgB] = useState<KgPayload | null>(null);

  useEffect(() => {
    if (!urlA || !urlB) return;
    let cancelled = false;
    const stageTimer = setInterval(
      () => setStage((s) => (s + 1) % STAGES.length),
      1500,
    );
    (async () => {
      try {
        const res = await fetch("/api/match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ urlA, urlB }),
        });
        const json = (await res.json()) as MatchApiResponse;
        if (cancelled) return;
        if (!res.ok) {
          setError(json.error ?? `HTTP ${res.status}`);
          return;
        }
        setResult(json);
        const [a, b] = await Promise.all([
          fetch(`/api/profile/${json.loginA}/kg`).then((r) =>
            r.ok ? (r.json() as Promise<KgPayload>) : null,
          ),
          fetch(`/api/profile/${json.loginB}/kg`).then((r) =>
            r.ok ? (r.json() as Promise<KgPayload>) : null,
          ),
        ]);
        if (cancelled) return;
        setKgA(a);
        setKgB(b);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        clearInterval(stageTimer);
      }
    })();
    return () => {
      cancelled = true;
      clearInterval(stageTimer);
    };
  }, [urlA, urlB]);

  if (!urlA || !urlB) {
    return <p style={{ color: "#f87171" }}>Missing URLs. Back to home.</p>;
  }
  if (error) {
    return (
      <div>
        <p style={{ color: "#f87171" }}>Error: {error}</p>
        <a href="/" style={{ color: "#6366f1" }}>
          ← back
        </a>
      </div>
    );
  }
  if (!result) {
    return (
      <div style={{ color: "#cbd5e1", textAlign: "center", marginTop: "4rem" }}>
        <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>⚙️</div>
        <div>{STAGES[stage]}</div>
      </div>
    );
  }

  const overlapIds = result.overlap.commonNodes.map((n) => n.id);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <ProfileTag login={result.loginA} tags={result.skillTagsA} />
        <span style={{ fontSize: "1.5rem", alignSelf: "center" }}>↔</span>
        <ProfileTag login={result.loginB} tags={result.skillTagsB} />
      </div>

      <ScoreCard score={result.score} breakdown={result.breakdown} />

      {kgA && kgB && (
        <GraphViewer kgA={kgA} kgB={kgB} overlapNodeIds={overlapIds} />
      )}

      <div style={{ display: "flex", gap: "0.75rem" }}>
        <a
          href={`/api/profile/${result.loginA}/vault`}
          style={downloadStyle}
        >
          ⬇ {result.loginA} vault
        </a>
        <a
          href={`/api/profile/${result.loginB}/vault`}
          style={downloadStyle}
        >
          ⬇ {result.loginB} vault
        </a>
      </div>

      <p style={{ color: "#64748b", fontSize: "0.8rem" }}>
        {result.cached ? "From cache" : "Freshly computed"} · Overlap:{" "}
        {result.overlap.commonNodes.length} nodes,{" "}
        {result.overlap.commonEdges.length} edges
      </p>
    </div>
  );
}

function ProfileTag({ login, tags }: { login: string; tags: string[] }) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 200,
        background: "#1e293b",
        padding: "1rem",
        borderRadius: 8,
        border: "1px solid #334155",
      }}
    >
      <a
        href={`https://github.com/${login}`}
        style={{ color: "#f1f5f9", fontWeight: 600, textDecoration: "none" }}
      >
        @{login}
      </a>
      <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
        {tags.map((t) => (
          <span
            key={t}
            style={{
              fontSize: "0.7rem",
              padding: "2px 8px",
              background: "#334155",
              color: "#cbd5e1",
              borderRadius: 10,
            }}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

const downloadStyle: React.CSSProperties = {
  padding: "0.6rem 1rem",
  background: "#334155",
  color: "#e2e8f0",
  borderRadius: 6,
  textDecoration: "none",
  fontSize: "0.9rem",
};
