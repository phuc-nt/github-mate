"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function UrlInputForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [urlA, setUrlA] = useState("");
  const [urlB, setUrlB] = useState("");

  useEffect(() => {
    const b = params.get("urlB");
    if (b) setUrlB(b);
  }, [params]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const a = encodeURIComponent(urlA.trim());
    const b = encodeURIComponent(urlB.trim());
    router.push(`/match?a=${a}&b=${b}`);
  }

  const input: React.CSSProperties = {
    padding: "0.75rem 1rem",
    background: "#1e293b",
    color: "#f1f5f9",
    border: "1px solid #334155",
    borderRadius: 6,
    fontSize: "1rem",
    width: "100%",
  };

  return (
    <form
      onSubmit={submit}
      style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
    >
      <input
        type="url"
        placeholder="https://github.com/alice"
        required
        value={urlA}
        onChange={(e) => setUrlA(e.target.value)}
        style={input}
      />
      <input
        type="url"
        placeholder="https://github.com/bob"
        required
        value={urlB}
        onChange={(e) => setUrlB(e.target.value)}
        style={input}
      />
      <button
        type="submit"
        style={{
          padding: "0.85rem",
          background: "#6366f1",
          color: "white",
          border: "none",
          borderRadius: 6,
          fontSize: "1rem",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Compute Match
      </button>
    </form>
  );
}
