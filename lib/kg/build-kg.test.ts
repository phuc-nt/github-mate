import { describe, expect, it } from "vitest";
import { unzipSync, strFromU8 } from "fflate";
import { buildKg } from "./build-kg";
import { emitGraphJson } from "./emit-graph-json";
import { packVaultZip } from "./pack-vault-zip";
import type { GitHubProfile } from "../github/types";

function fixtureProfile(): GitHubProfile {
  return {
    login: "alice",
    name: "Alice Dev",
    bio: "Full-stack engineer. Loves TypeScript + React.",
    company: "@acme-corp",
    location: "Hanoi",
    followers: { totalCount: 1200 },
    following: { totalCount: 50 },
    repositories: {
      totalCount: 2,
      nodes: [
        {
          name: "cool-webapp",
          description: "A React + NextJS starter",
          stargazerCount: 500,
          forkCount: 20,
          languages: { nodes: [{ name: "TypeScript" }, { name: "CSS" }] },
          repositoryTopics: {
            nodes: [{ topic: { name: "react" } }, { topic: { name: "web" } }],
          },
          isArchived: false,
          pushedAt: "2026-04-01T00:00:00Z",
        },
        {
          name: "ml-toolkit",
          description: "PyTorch helpers",
          stargazerCount: 80,
          forkCount: 5,
          languages: { nodes: [{ name: "Python" }] },
          repositoryTopics: {
            nodes: [{ topic: { name: "ml" } }, { topic: { name: "pytorch" } }],
          },
          isArchived: false,
          pushedAt: "2026-03-15T00:00:00Z",
        },
      ],
    },
    pinnedItems: { nodes: [] },
    starredRepositories: {
      nodes: [
        {
          name: "awesome-llm",
          owner: { login: "openai" },
          stargazerCount: 99000,
          languages: { nodes: [{ name: "Python" }] },
          repositoryTopics: { nodes: [{ topic: { name: "llm" } }] },
        },
      ],
    },
    contributionsCollection: {
      contributionCalendar: { totalContributions: 2000, weeks: [] },
    },
  };
}

describe("buildKg (E2E)", () => {
  it("produces nodes + links + markdown files from fixture profile", () => {
    const kg = buildKg(fixtureProfile());

    expect(kg.nodes.length).toBeGreaterThanOrEqual(8);
    expect(kg.links.length).toBeGreaterThanOrEqual(8);
    expect(kg.markdownFiles.size).toBe(kg.nodes.length);

    const personNode = kg.nodes.find((n) => n.id === "person/alice");
    expect(personNode).toBeDefined();
    expect(personNode?.file_type).toBe("person");

    const owns = kg.links.filter((l) => l.relation === "owns");
    expect(owns.length).toBe(2);

    const uses = kg.links.filter((l) => l.relation === "uses");
    expect(uses.some((l) => l.target === "lang/TypeScript")).toBe(true);

    const frameworks = kg.nodes.filter((n) => n.file_type === "framework");
    expect(frameworks.some((n) => n.label === "React")).toBe(true);
    expect(frameworks.some((n) => n.label === "PyTorch")).toBe(true);

    expect(kg.links.some((l) => l.relation === "stars")).toBe(true);
    expect(kg.links.some((l) => l.relation === "member_of")).toBe(true);
  });

  it("emits valid frontmatter + wikilinks in markdown", () => {
    const kg = buildKg(fixtureProfile());
    const personMd = Array.from(kg.markdownFiles.entries()).find(([p]) =>
      p.startsWith("person/"),
    )?.[1];

    expect(personMd).toBeDefined();
    expect(personMd).toContain("---\nsource_file:");
    expect(personMd).toContain('type: "person"');
    expect(personMd).toContain("## Connections");
    expect(personMd).toMatch(/\[\[.+?\]\] - `\w+` \[(EXTRACTED|INFERRED|AMBIGUOUS)\]/);
    expect(personMd).toContain("#wiki/person");
  });

  it("deduplicates nodes by id", () => {
    const kg = buildKg(fixtureProfile());
    const ids = kg.nodes.map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("emits graph.json in networkx node-link shape", () => {
    const kg = buildKg(fixtureProfile());
    const gj = emitGraphJson(kg);
    expect(gj.directed).toBe(false);
    expect(gj.multigraph).toBe(false);
    expect(Array.isArray(gj.nodes)).toBe(true);
    expect(Array.isArray(gj.links)).toBe(true);
    expect(gj.links[0]).toHaveProperty("_src");
    expect(gj.links[0]).toHaveProperty("_tgt");
  });

  it("packs vault into a valid zip", () => {
    const kg = buildKg(fixtureProfile());
    const zipped = packVaultZip(kg);
    expect(zipped.byteLength).toBeGreaterThan(100);
    expect(zipped.byteLength).toBeLessThan(500_000);

    const unzipped = unzipSync(zipped);
    expect(Object.keys(unzipped)).toContain("graph.json");
    expect(Object.keys(unzipped)).toContain(".obsidian/graph.json");
    const graphContent = JSON.parse(strFromU8(unzipped["graph.json"]));
    expect(graphContent.nodes.length).toBe(kg.nodes.length);
  });
});
