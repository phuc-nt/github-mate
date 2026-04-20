import type { KnowledgeGraph } from "../kg/types";
import { techOverlap } from "./tech-overlap";
import { interestSimilarity } from "./interest-similarity";
import { classifySkills } from "./skill-heuristic";
import { complementaryScore } from "./complementary-skills";
import { kgOverlap } from "./kg-overlap";
import type { AiRunner, MatchResult } from "./types";

export const MATCH_WEIGHTS = {
  tech: 0.3,
  interest: 0.4,
  complementary: 0.3,
} as const;

export async function computeMatch(
  a: KnowledgeGraph,
  b: KnowledgeGraph,
  ai: AiRunner,
): Promise<MatchResult> {
  const tech = techOverlap(a, b);
  const interest = await interestSimilarity(a, b, ai);
  const tagsA = classifySkills(a);
  const tagsB = classifySkills(b);
  const comp = complementaryScore(tagsA, tagsB);
  const overlap = kgOverlap(a, b);

  const score =
    MATCH_WEIGHTS.tech * tech +
    MATCH_WEIGHTS.interest * interest +
    MATCH_WEIGHTS.complementary * comp;

  return {
    score,
    breakdown: { tech, interest, complementary: comp },
    overlap,
    skillTagsA: tagsA,
    skillTagsB: tagsB,
  };
}
