import { Suspense } from "react";
import MatchClient from "./match-client";

export default function MatchPage() {
  return (
    <Suspense fallback={<p style={{ color: "#94a3b8" }}>Loading…</p>}>
      <MatchClient />
    </Suspense>
  );
}
