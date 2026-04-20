export interface GitHubLanguage {
  name: string;
}

export interface GitHubTopic {
  topic: { name: string };
}

export interface GitHubRepo {
  name: string;
  description: string | null;
  stargazerCount: number;
  forkCount: number;
  languages: { nodes: GitHubLanguage[] };
  repositoryTopics: { nodes: GitHubTopic[] };
  isArchived: boolean;
  pushedAt: string;
}

export interface GitHubPinnedRepo {
  name: string;
  description: string | null;
  stargazerCount: number;
  languages: { nodes: GitHubLanguage[] };
}

export interface GitHubStarredRepo {
  name: string;
  owner: { login: string };
  stargazerCount: number;
  languages: { nodes: GitHubLanguage[] };
  repositoryTopics: { nodes: GitHubTopic[] };
}

export interface GitHubContribDay {
  date: string;
  contributionCount: number;
}

export interface GitHubProfile {
  login: string;
  name: string | null;
  bio: string | null;
  company: string | null;
  location: string | null;
  followers: { totalCount: number };
  following: { totalCount: number };
  repositories: { totalCount: number; nodes: GitHubRepo[] };
  pinnedItems: { nodes: GitHubPinnedRepo[] };
  starredRepositories: { nodes: GitHubStarredRepo[] };
  contributionsCollection: {
    contributionCalendar: {
      totalContributions: number;
      weeks: { contributionDays: GitHubContribDay[] }[];
    };
  };
}

export interface RateLimit {
  limit: number;
  cost: number;
  remaining: number;
}

export interface ProfileQueryResult {
  rateLimit: RateLimit;
  user: GitHubProfile | null;
}

export class RateLimitError extends Error {
  constructor(public remaining: number, public resetAt?: string) {
    super(`GitHub rate limit exceeded (remaining=${remaining})`);
    this.name = "RateLimitError";
  }
}

export class InvalidLoginError extends Error {
  constructor(login: string) {
    super(`Invalid GitHub login: ${login}`);
    this.name = "InvalidLoginError";
  }
}

export class ProfileNotFoundError extends Error {
  constructor(login: string) {
    super(`GitHub profile not found: ${login}`);
    this.name = "ProfileNotFoundError";
  }
}

export interface TrendingAuthor {
  login: string;
  repoCount: number;
  topRepo: string;
  language: string | null;
}
