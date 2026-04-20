import type { Confidence, KgLink, Relation } from "./types";

export function makeLink(
  source: string,
  target: string,
  relation: Relation,
  confidence: Confidence = "EXTRACTED",
): KgLink {
  const score =
    confidence === "EXTRACTED" ? 1.0 : confidence === "INFERRED" ? 0.6 : 0.3;
  return { source, target, relation, confidence, confidence_score: score };
}
