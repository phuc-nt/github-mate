import type { KgNode, KgLink } from "../kg/types";

export type SkillTag = "frontend" | "backend" | "ai-ml" | "infra" | "data-eng";

export const SKILL_TAGS: readonly SkillTag[] = [
  "frontend",
  "backend",
  "ai-ml",
  "infra",
  "data-eng",
] as const;

export interface MatchBreakdown {
  tech: number;
  interest: number;
  complementary: number;
}

export interface MatchOverlap {
  commonNodes: KgNode[];
  commonEdges: KgLink[];
}

export interface MatchResult {
  score: number;
  breakdown: MatchBreakdown;
  overlap: MatchOverlap;
  skillTagsA: SkillTag[];
  skillTagsB: SkillTag[];
}

export interface AiRunner {
  run(model: string, input: unknown): Promise<unknown>;
}
