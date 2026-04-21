import { describe, expect, it } from "vitest";
import { buildKg } from "./build-kg";
import { vaultAsJsonMap } from "./pack-vault-zip";
import type { GitHubProfile } from "../github/types";

const D1_ROW_GUARD_BYTES = 900_000;

function heavyProfile(repoCount: number): GitHubProfile {
  const repos = Array.from({ length: repoCount }, (_, i) => ({
    name: `repo-${i}`,
    description: `Repository number ${i} with a moderately long description about ${i % 7} things`,
    stargazerCount: 100 + i,
    forkCount: i,
    languages: {
      nodes: [
        { name: "TypeScript" },
        { name: i % 2 === 0 ? "Python" : "Rust" },
      ],
    },
    repositoryTopics: {
      nodes: [
        { topic: { name: `topic-${i % 20}` } },
        { topic: { name: "shared-tag" } },
      ],
    },
    isArchived: false,
    pushedAt: "2026-04-01T00:00:00Z",
  }));
  return {
    login: "bigdev",
    name: "Big Dev",
    bio: "Prolific OSS contributor",
    company: "@bigcorp",
    location: "Earth",
    followers: { totalCount: 50_000 },
    following: { totalCount: 100 },
    repositories: { totalCount: repoCount, nodes: repos },
    pinnedItems: { nodes: [] },
    starredRepositories: { nodes: [] },
    contributionsCollection: {
      contributionCalendar: { totalContributions: 5000, weeks: [] },
    },
  };
}

describe("D1 row-size guard", () => {
  it("kg_json + vault_json stay under 900KB for 50-repo profile", () => {
    const kg = buildKg(heavyProfile(50));
    const kgJson = JSON.stringify({ nodes: kg.nodes, links: kg.links });
    const vaultJson = JSON.stringify(vaultAsJsonMap(kg));
    const totalBytes = Buffer.byteLength(kgJson) + Buffer.byteLength(vaultJson);
    expect(totalBytes).toBeLessThan(D1_ROW_GUARD_BYTES);
  });

  it("kg_json + vault_json stay under 900KB for 100-repo profile", () => {
    const kg = buildKg(heavyProfile(100));
    const kgJson = JSON.stringify({ nodes: kg.nodes, links: kg.links });
    const vaultJson = JSON.stringify(vaultAsJsonMap(kg));
    const totalBytes = Buffer.byteLength(kgJson) + Buffer.byteLength(vaultJson);
    expect(totalBytes).toBeLessThan(D1_ROW_GUARD_BYTES);
  });
});
