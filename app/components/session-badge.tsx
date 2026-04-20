"use client";
import { useEffect, useState } from "react";

interface SessionState {
  authenticated: boolean;
  login?: string;
}

export default function SessionBadge() {
  const [state, setState] = useState<SessionState | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json() as Promise<SessionState>)
      .then(setState)
      .catch(() => setState({ authenticated: false }));
  }, []);

  if (!state) return null;
  if (!state.authenticated) {
    return (
      <a
        href="/api/auth/github/login"
        style={{
          padding: "0.4rem 0.8rem",
          background: "#22c55e",
          color: "#022c1a",
          borderRadius: 6,
          textDecoration: "none",
          fontWeight: 600,
          fontSize: "0.85rem",
        }}
      >
        Sign in with GitHub
      </a>
    );
  }
  return (
    <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <span style={{ color: "#e2e8f0", fontSize: "0.85rem" }}>
        {state.login}
      </span>
      <button
        onClick={async () => {
          await fetch("/api/auth/logout", { method: "POST" });
          setState({ authenticated: false });
        }}
        style={{
          padding: "0.3rem 0.6rem",
          background: "transparent",
          border: "1px solid #334155",
          color: "#94a3b8",
          borderRadius: 6,
          cursor: "pointer",
          fontSize: "0.8rem",
        }}
      >
        Sign out
      </button>
    </span>
  );
}
