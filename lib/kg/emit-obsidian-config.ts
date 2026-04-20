import type { KnowledgeGraph } from "./types";

const COMMUNITY_COLORS = [5089703, 10534996, 3313084, 16222022, 8437252, 14901296];

function snake(s: string): string {
  return s.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_|_$/g, "");
}

export function emitObsidianGraphConfig(kg: KnowledgeGraph): object {
  const communities = Array.from(new Set(kg.nodes.map((n) => n.community)));
  return {
    colorGroups: communities.map((c, i) => ({
      query: `tag:#community/${snake(c)}`,
      color: { a: 1, rgb: COMMUNITY_COLORS[i % COMMUNITY_COLORS.length] },
    })),
  };
}
