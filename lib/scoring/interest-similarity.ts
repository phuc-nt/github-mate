import type { KnowledgeGraph } from "../kg/types";
import { cosine, normalizeCosine } from "./cosine";
import type { AiRunner } from "./types";

const MAX_DOC = 4000;

export function buildInterestDoc(kg: KnowledgeGraph): string {
  const person = kg.nodes.find((n) => n.file_type === "person");
  const topics = kg.nodes.filter((n) => n.file_type === "topic").map((n) => n.label);
  const repoDescs = kg.nodes
    .filter((n) => n.file_type === "repository" && n.body)
    .slice(0, 5)
    .map((n) => n.body!);
  const parts: string[] = [];
  if (person?.body) parts.push(person.body);
  parts.push(topics.join(" "));
  parts.push(repoDescs.join(" "));
  return parts.join(" ").slice(0, MAX_DOC);
}

export async function interestSimilarity(
  a: KnowledgeGraph,
  b: KnowledgeGraph,
  ai: AiRunner,
): Promise<number> {
  const docA = buildInterestDoc(a);
  const docB = buildInterestDoc(b);
  if (!docA.trim() || !docB.trim()) return 0.5;

  const res = (await ai.run("@cf/baai/bge-base-en-v1.5", {
    text: [docA, docB],
    pooling: "cls",
  })) as { data: number[][] };
  const [vA, vB] = res.data;
  return normalizeCosine(cosine(vA, vB));
}
