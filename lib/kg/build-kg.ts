import type { GitHubProfile } from "../github/types";
import { assignCommunity } from "./community-assigner";
import { detectFrameworks } from "./framework-detector";
import { makeLink } from "./edge-factories";
import {
  makeFrameworkNode,
  makeLanguageNode,
  makeOrgNode,
  makePersonNode,
  makeRepoNode,
  makeTopicNode,
} from "./node-factories";
import { emitMarkdown } from "./emit-markdown";
import type { KgLink, KgNode, KnowledgeGraph } from "./types";

export function buildKg(profile: GitHubProfile): KnowledgeGraph {
  const community = assignCommunity(profile);
  const nodeMap = new Map<string, KgNode>();
  const links: KgLink[] = [];

  const addNode = (n: KgNode) => {
    if (!nodeMap.has(n.id)) nodeMap.set(n.id, n);
  };

  const person = makePersonNode(profile, community);
  addNode(person);

  if (profile.company) {
    const orgName = profile.company.replace(/^@/, "").trim();
    if (orgName) {
      const org = makeOrgNode(orgName);
      addNode(org);
      links.push(makeLink(person.id, org.id, "member_of"));
    }
  }

  for (const repo of profile.repositories.nodes) {
    if (repo.isArchived) continue;
    const repoNode = makeRepoNode(repo, profile.login, community);
    addNode(repoNode);
    links.push(makeLink(person.id, repoNode.id, "owns"));

    for (const lang of repo.languages.nodes) {
      const langNode = makeLanguageNode(lang.name);
      addNode(langNode);
      links.push(makeLink(repoNode.id, langNode.id, "uses"));
      links.push(makeLink(person.id, langNode.id, "active_in", "INFERRED"));
    }
    for (const t of repo.repositoryTopics.nodes) {
      const topicNode = makeTopicNode(t.topic.name);
      addNode(topicNode);
      links.push(makeLink(repoNode.id, topicNode.id, "tags"));
    }

    const fwText = `${repo.description ?? ""} ${repo.repositoryTopics.nodes
      .map((t) => t.topic.name)
      .join(" ")}`;
    for (const fw of detectFrameworks(fwText)) {
      const fwNode = makeFrameworkNode(fw);
      addNode(fwNode);
      links.push(makeLink(repoNode.id, fwNode.id, "uses", "INFERRED"));
    }
  }

  for (const starred of profile.starredRepositories.nodes) {
    const repoNode = makeRepoNode(starred, starred.owner.login, community);
    addNode(repoNode);
    links.push(makeLink(person.id, repoNode.id, "stars"));
    for (const t of starred.repositoryTopics.nodes) {
      const topicNode = makeTopicNode(t.topic.name);
      addNode(topicNode);
      links.push(makeLink(repoNode.id, topicNode.id, "tags"));
    }
  }

  const nodes = Array.from(nodeMap.values());
  const outEdgesByNode = new Map<string, KgLink[]>();
  for (const l of links) {
    const arr = outEdgesByNode.get(l.source) ?? [];
    arr.push(l);
    outEdgesByNode.set(l.source, arr);
  }

  const markdownFiles = new Map<string, string>();
  for (const n of nodes) {
    const targetLabels = (outEdgesByNode.get(n.id) ?? []).map((l) => ({
      link: l,
      targetLabel: nodeMap.get(l.target)?.label ?? l.target,
    }));
    markdownFiles.set(nodePath(n), emitMarkdown(n, targetLabels));
  }

  return { nodes, links, markdownFiles, community };
}

function nodePath(n: KgNode): string {
  const safe = n.label.replace(/[\/\\:*?"<>|]/g, "_");
  return `${n.file_type}/${safe}.md`;
}
