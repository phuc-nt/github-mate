import type { KnowledgeGraph } from "../kg/types";
import type { SkillTag } from "./types";

const FRONTEND_LANGS = new Set(["TypeScript", "JavaScript", "CSS", "HTML"]);
const FRONTEND_TOPICS = new Set([
  "react", "vue", "svelte", "nextjs", "frontend", "web", "ui",
]);
const AIML_LANGS = new Set(["Python"]);
const AIML_TOPICS = new Set([
  "ml", "ai", "pytorch", "tensorflow", "llm", "deep-learning", "nlp",
]);
const INFRA_LANGS = new Set(["Go", "Rust"]);
const INFRA_TOPICS = new Set([
  "kubernetes", "docker", "infrastructure", "devops", "terraform", "k8s",
]);
const DATA_TOPICS = new Set([
  "data-engineering", "etl", "spark", "airflow", "kafka", "analytics",
]);

function labelsByType(kg: KnowledgeGraph, type: string): Set<string> {
  const out = new Set<string>();
  for (const n of kg.nodes) if (n.file_type === type) out.add(n.label);
  return out;
}

export function classifySkills(kg: KnowledgeGraph): SkillTag[] {
  const langs = labelsByType(kg, "language");
  const topics = labelsByType(kg, "topic");
  const tags = new Set<SkillTag>();

  const hasAny = <T>(s: Set<T>, ref: Set<T>) => {
    for (const v of s) if (ref.has(v)) return true;
    return false;
  };

  if (hasAny(langs, FRONTEND_LANGS) || hasAny(topics, FRONTEND_TOPICS)) tags.add("frontend");
  if (hasAny(langs, AIML_LANGS) && hasAny(topics, AIML_TOPICS)) tags.add("ai-ml");
  if (hasAny(langs, INFRA_LANGS) || hasAny(topics, INFRA_TOPICS)) tags.add("infra");
  if (hasAny(topics, DATA_TOPICS)) tags.add("data-eng");
  if (tags.size === 0) tags.add("backend");

  return Array.from(tags);
}
