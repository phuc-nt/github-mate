import { describe, expect, it, vi } from "vitest";
import { buildKg } from "../kg/build-kg";
import type { GitHubProfile } from "../github/types";
import { computeMatch, MATCH_WEIGHTS } from "./compute-match";
import { jaccard, techOverlap } from "./tech-overlap";
import { classifySkills } from "./skill-heuristic";
import { complementaryScore } from "./complementary-skills";
import { cosine, normalizeCosine } from "./cosine";

function frontendProfile(): GitHubProfile {
  return {
    login: "fe-dev",
    name: "FE Dev",
    bio: "React enthusiast shipping TypeScript UIs.",
    company: null,
    location: null,
    followers: { totalCount: 10 },
    following: { totalCount: 5 },
    repositories: {
      totalCount: 1,
      nodes: [
        {
          name: "ui-kit",
          description: "React component library",
          stargazerCount: 20,
          forkCount: 1,
          languages: { nodes: [{ name: "TypeScript" }] },
          repositoryTopics: {
            nodes: [{ topic: { name: "react" } }, { topic: { name: "frontend" } }],
          },
          isArchived: false,
          pushedAt: "2026-04-01T00:00:00Z",
        },
      ],
    },
    pinnedItems: { nodes: [] },
    starredRepositories: { nodes: [] },
    contributionsCollection: {
      contributionCalendar: { totalContributions: 100, weeks: [] },
    },
  };
}

function infraProfile(): GitHubProfile {
  return {
    login: "infra-dev",
    name: "Infra Dev",
    bio: "Kubernetes and Go systems engineer.",
    company: null,
    location: null,
    followers: { totalCount: 10 },
    following: { totalCount: 5 },
    repositories: {
      totalCount: 1,
      nodes: [
        {
          name: "k8s-ops",
          description: "Kubernetes operator helpers in Go",
          stargazerCount: 40,
          forkCount: 3,
          languages: { nodes: [{ name: "Go" }] },
          repositoryTopics: {
            nodes: [
              { topic: { name: "kubernetes" } },
              { topic: { name: "infrastructure" } },
            ],
          },
          isArchived: false,
          pushedAt: "2026-04-01T00:00:00Z",
        },
      ],
    },
    pinnedItems: { nodes: [] },
    starredRepositories: { nodes: [] },
    contributionsCollection: {
      contributionCalendar: { totalContributions: 100, weeks: [] },
    },
  };
}

function mockAi(vectorA: number[], vectorB: number[]) {
  return {
    run: vi
      .fn()
      .mockResolvedValueOnce({ data: [vectorA, vectorB] }),
  };
}

describe("cosine", () => {
  it("identical unit vectors → 1", () => {
    expect(cosine([1, 0, 0], [1, 0, 0])).toBeCloseTo(1, 5);
  });
  it("orthogonal → 0", () => {
    expect(cosine([1, 0], [0, 1])).toBeCloseTo(0, 5);
  });
  it("zero vector → 0 (guarded)", () => {
    expect(cosine([0, 0], [1, 1])).toBe(0);
  });
  it("normalizeCosine maps [-1,1] → [0,1]", () => {
    expect(normalizeCosine(1)).toBe(1);
    expect(normalizeCosine(-1)).toBe(0);
    expect(normalizeCosine(0)).toBe(0.5);
  });
});

describe("tech-overlap (Jaccard)", () => {
  it("identical sets → 1", () => {
    expect(jaccard(new Set(["a", "b"]), new Set(["a", "b"]))).toBe(1);
  });
  it("disjoint sets → 0", () => {
    expect(jaccard(new Set(["a"]), new Set(["b"]))).toBe(0);
  });
  it("both empty → 0", () => {
    expect(jaccard(new Set(), new Set())).toBe(0);
  });
  it("extracts langs+frameworks from KG and computes overlap", () => {
    const kgA = buildKg(frontendProfile());
    const kgB = buildKg(frontendProfile());
    expect(techOverlap(kgA, kgB)).toBe(1);
    const kgC = buildKg(infraProfile());
    expect(techOverlap(kgA, kgC)).toBe(0);
  });
});

describe("skill-heuristic", () => {
  it("React+TS → frontend", () => {
    const kg = buildKg(frontendProfile());
    const tags = classifySkills(kg);
    expect(tags).toContain("frontend");
  });
  it("Go+k8s → infra", () => {
    const kg = buildKg(infraProfile());
    const tags = classifySkills(kg);
    expect(tags).toContain("infra");
  });
});

describe("complementary-skills", () => {
  it("disjoint tags → 1", () => {
    expect(complementaryScore(["frontend"], ["infra"])).toBe(1);
  });
  it("1 shared → 0.5", () => {
    expect(complementaryScore(["frontend", "backend"], ["backend"])).toBe(0.5);
  });
  it("identical → 0", () => {
    expect(complementaryScore(["frontend"], ["frontend"])).toBe(0);
  });
});

describe("computeMatch (E2E)", () => {
  it("identical profiles → high tech+interest, zero complementary", async () => {
    const kgA = buildKg(frontendProfile());
    const kgB = buildKg(frontendProfile());
    const ai = mockAi(
      [1, 0, 0, 0, 0, 0, 0, 0],
      [1, 0, 0, 0, 0, 0, 0, 0],
    );
    const result = await computeMatch(kgA, kgB, ai as never);
    expect(result.breakdown.tech).toBe(1);
    expect(result.breakdown.interest).toBeCloseTo(1, 5);
    expect(result.breakdown.complementary).toBe(0);
    // 0.3*1 + 0.4*1 + 0.3*0 = 0.7
    expect(result.score).toBeCloseTo(0.7, 5);
  });

  it("frontend vs infra → low tech, complementary=1", async () => {
    const kgA = buildKg(frontendProfile());
    const kgB = buildKg(infraProfile());
    const ai = mockAi([1, 0, 0], [0, 1, 0]);
    const result = await computeMatch(kgA, kgB, ai as never);
    expect(result.breakdown.tech).toBeLessThan(0.2);
    expect(result.breakdown.complementary).toBe(1);
    expect(result.skillTagsA).toContain("frontend");
    expect(result.skillTagsB).toContain("infra");
  });

  it("weights sum matches score within tolerance", async () => {
    const kgA = buildKg(frontendProfile());
    const kgB = buildKg(infraProfile());
    const ai = mockAi([1, 0], [0, 1]);
    const r = await computeMatch(kgA, kgB, ai as never);
    const expected =
      MATCH_WEIGHTS.tech * r.breakdown.tech +
      MATCH_WEIGHTS.interest * r.breakdown.interest +
      MATCH_WEIGHTS.complementary * r.breakdown.complementary;
    expect(Math.abs(r.score - expected)).toBeLessThan(0.001);
  });

  it("overlap subgraph finds shared language node for identical profiles", async () => {
    const kgA = buildKg(frontendProfile());
    const kgB = buildKg(frontendProfile());
    const ai = mockAi([1, 0], [1, 0]);
    const r = await computeMatch(kgA, kgB, ai as never);
    expect(r.overlap.commonNodes.some((n) => n.id === "lang/TypeScript")).toBe(true);
  });
});
