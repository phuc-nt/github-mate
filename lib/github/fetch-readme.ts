const README_CAP_BYTES = 10_000;

export async function fetchReadme(
  token: string,
  owner: string,
  repo: string,
): Promise<string | null> {
  const url = `https://api.github.com/repos/${owner}/${repo}/readme`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": "github-mate",
      Accept: "application/vnd.github.raw+json",
    },
  });

  if (res.status === 404) return null;
  if (!res.ok) return null;

  const text = await res.text();
  return text.slice(0, README_CAP_BYTES);
}
