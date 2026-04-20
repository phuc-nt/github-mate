import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import SessionBadge from "./components/session-badge";

export const metadata: Metadata = {
  title: "GitHub Mate",
  description: "Match GitHub profiles by knowledge graph similarity.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, -apple-system, sans-serif",
          margin: 0,
          background: "#0f172a",
          color: "#e2e8f0",
          minHeight: "100vh",
        }}
      >
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1rem 2rem",
            borderBottom: "1px solid #1e293b",
            background: "#020617",
          }}
        >
          <Link
            href="/"
            style={{ color: "#f1f5f9", textDecoration: "none", fontWeight: 700 }}
          >
            GitHub Mate
          </Link>
          <nav style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
            <Link href="/" style={{ color: "#94a3b8", textDecoration: "none" }}>
              Home
            </Link>
            <Link href="/top20" style={{ color: "#94a3b8", textDecoration: "none" }}>
              Top 20
            </Link>
            <a
              href="https://github.com/phuc-nt/github-mate"
              style={{ color: "#94a3b8", textDecoration: "none" }}
            >
              GitHub
            </a>
            <SessionBadge />
          </nav>
        </header>
        <main style={{ maxWidth: 960, margin: "0 auto", padding: "2rem 1rem" }}>
          {children}
        </main>
      </body>
    </html>
  );
}
