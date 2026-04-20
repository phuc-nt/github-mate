import type { KnowledgeGraph } from "../kg/types";

export function jaccard<T>(a: Set<T>, b: Set<T>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let inter = 0;
  for (const v of a) if (b.has(v)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

export function extractTechSet(kg: KnowledgeGraph): Set<string> {
  const out = new Set<string>();
  for (const n of kg.nodes) {
    if (n.file_type === "language" || n.file_type === "framework") {
      out.add(`${n.file_type}/${n.label}`);
    }
  }
  return out;
}

export function techOverlap(a: KnowledgeGraph, b: KnowledgeGraph): number {
  return jaccard(extractTechSet(a), extractTechSet(b));
}
