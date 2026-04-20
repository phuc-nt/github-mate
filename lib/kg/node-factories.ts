import type { GitHubProfile, GitHubRepo, GitHubStarredRepo } from "../github/types";
import type { KgNode } from "./types";

export function makePersonNode(profile: GitHubProfile, community: string): KgNode {
  const parts: string[] = [];
  if (profile.bio) parts.push(profile.bio);
  parts.push(
    `${profile.followers.totalCount} followers · ${profile.repositories.totalCount} public repos.`,
  );

  return {
    id: `person/${profile.login}`,
    label: profile.name || profile.login,
    file_type: "person",
    source_file: `GitHub/users/${profile.login}`,
    source_location: `https://github.com/${profile.login}`,
    community,
    body: parts.join(" "),
  };
}

export function makeRepoNode(
  repo: GitHubRepo | GitHubStarredRepo,
  owner: string,
  community: string,
): KgNode {
  const desc = "description" in repo ? repo.description : null;
  return {
    id: `repo/${owner}/${repo.name}`,
    label: `${owner}/${repo.name}`,
    file_type: "repository",
    source_file: `GitHub/repos/${owner}/${repo.name}`,
    source_location: `https://github.com/${owner}/${repo.name}`,
    community,
    body: desc ?? undefined,
  };
}

export function makeLanguageNode(name: string): KgNode {
  return {
    id: `lang/${name}`,
    label: name,
    file_type: "language",
    source_file: `GitHub/languages/${name}`,
    community: "General",
  };
}

export function makeTopicNode(name: string): KgNode {
  return {
    id: `topic/${name}`,
    label: name,
    file_type: "topic",
    source_file: `GitHub/topics/${name}`,
    community: "General",
  };
}

export function makeFrameworkNode(name: string): KgNode {
  return {
    id: `framework/${name}`,
    label: name,
    file_type: "framework",
    source_file: `GitHub/frameworks/${name}`,
    community: "General",
  };
}

export function makeOrgNode(name: string): KgNode {
  return {
    id: `org/${name}`,
    label: name,
    file_type: "organization",
    source_file: `GitHub/orgs/${name}`,
    community: "General",
  };
}
