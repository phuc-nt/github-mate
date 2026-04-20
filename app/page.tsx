import { Suspense } from "react";
import UrlInputForm from "./components/url-input-form";

export default function HomePage() {
  return (
    <section style={{ maxWidth: 560, margin: "3rem auto" }}>
      <h1 style={{ fontSize: "2.25rem", margin: 0, color: "#f8fafc" }}>
        Match two GitHub devs
      </h1>
      <p style={{ color: "#94a3b8", margin: "0.75rem 0 2rem" }}>
        Paste two profile URLs. We build a knowledge graph for each and score
        their tech overlap, interest similarity, and complementary skills.
      </p>
      <Suspense fallback={null}>
        <UrlInputForm />
      </Suspense>
      <p style={{ color: "#64748b", fontSize: "0.85rem", marginTop: "1.5rem" }}>
        Sign in with GitHub to use your own rate limit (optional).
      </p>
    </section>
  );
}
