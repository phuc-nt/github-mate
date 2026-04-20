import type { GitHubProfile } from "../github/types";

export function assignCommunity(profile: GitHubProfile): string {
  const topicCounts = new Map<string, number>();

  for (const r of profile.repositories.nodes) {
    for (const t of r.repositoryTopics.nodes) {
      topicCounts.set(t.topic.name, (topicCounts.get(t.topic.name) ?? 0) + 2);
    }
  }
  for (const r of profile.starredRepositories.nodes) {
    for (const t of r.repositoryTopics.nodes) {
      topicCounts.set(t.topic.name, (topicCounts.get(t.topic.name) ?? 0) + 1);
    }
  }

  if (topicCounts.size === 0) return "General";

  let best = "General";
  let max = 0;
  for (const [topic, count] of topicCounts) {
    if (count > max) {
      best = topic;
      max = count;
    }
  }
  return best;
}
