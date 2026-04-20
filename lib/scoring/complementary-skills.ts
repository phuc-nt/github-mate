import type { KnowledgeGraph } from "../kg/types";
import { classifySkills } from "./skill-heuristic";
import type { AiRunner, SkillTag } from "./types";
import { SKILL_TAGS } from "./types";

export function complementaryScore(a: SkillTag[], b: SkillTag[]): number {
  const setA = new Set(a);
  const setB = new Set(b);
  let shared = 0;
  for (const v of setA) if (setB.has(v)) shared++;
  if (shared === 0) return 1;
  const union = setA.size + setB.size - shared;
  if (shared === union) return 0;
  return 0.5;
}

const KNOWN: ReadonlySet<SkillTag> = new Set(SKILL_TAGS);

export async function classifySkillsAI(
  kg: KnowledgeGraph,
  ai: AiRunner | null,
): Promise<SkillTag[]> {
  const heuristic = classifySkills(kg);
  if (!ai) return heuristic;

  const person = kg.nodes.find((n) => n.file_type === "person");
  const repoDescs = kg.nodes
    .filter((n) => n.file_type === "repository" && n.body)
    .slice(0, 10)
    .map((n) => n.body)
    .join(" | ")
    .slice(0, 6000);
  const prompt = `Classify the developer's primary skills. Output STRICT JSON array of up to 2 tags from: ${SKILL_TAGS.join(", ")}. No prose.\n\nBio: ${person?.body ?? ""}\nRepos: ${repoDescs}`;

  try {
    const res = (await ai.run("@cf/meta/llama-3.3-70b-instruct", {
      messages: [{ role: "user", content: prompt }],
    })) as { response?: string };
    const raw = res?.response ?? "";
    const match = raw.match(/\[[^\]]*\]/);
    if (!match) return heuristic;
    const parsed = JSON.parse(match[0]);
    if (!Array.isArray(parsed)) return heuristic;
    const tags = parsed.filter((t): t is SkillTag => typeof t === "string" && KNOWN.has(t as SkillTag));
    return tags.length > 0 ? tags.slice(0, 2) : heuristic;
  } catch {
    return heuristic;
  }
}
