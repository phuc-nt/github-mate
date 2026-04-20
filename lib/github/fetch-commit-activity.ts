import { sleep } from "./rate-limit";

export interface WeeklyCommitActivity {
  week: number;
  total: number;
  days: number[];
}

export async function fetchCommitActivity(
  token: string,
  owner: string,
  repo: string,
): Promise<WeeklyCommitActivity[]> {
  const url = `https://api.github.com/repos/${owner}/${repo}/stats/commit_activity`;
  const headers = {
    Authorization: `Bearer ${token}`,
    "User-Agent": "github-mate",
    Accept: "application/vnd.github+json",
  };

  let res = await fetch(url, { headers });
  if (res.status === 202) {
    await sleep(2000);
    res = await fetch(url, { headers });
  }
  if (res.status === 202 || res.status === 204) return [];
  if (!res.ok) return [];

  return (await res.json()) as WeeklyCommitActivity[];
}
