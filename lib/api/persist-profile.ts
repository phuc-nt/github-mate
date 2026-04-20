import type { GitHubProfile } from "../github/types";
import type { KnowledgeGraph } from "../kg/types";
import { vaultAsJsonMap } from "../kg/pack-vault-zip";
import type { D1Like } from "./d1-types";

const PROFILE_TTL_SECONDS = 30 * 24 * 60 * 60;

export async function persistProfile(
  db: D1Like,
  profile: GitHubProfile,
  kg: KnowledgeGraph,
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const languages: Record<string, number> = {};
  const topicsSet = new Set<string>();
  for (const repo of profile.repositories.nodes) {
    for (const l of repo.languages?.nodes ?? []) {
      languages[l.name] = (languages[l.name] ?? 0) + 1;
    }
    for (const t of repo.repositoryTopics?.nodes ?? []) {
      topicsSet.add(t.topic.name);
    }
  }

  const kgJson = JSON.stringify({ nodes: kg.nodes, links: kg.links });
  const vaultJson = JSON.stringify(vaultAsJsonMap(kg));

  await db
    .prepare(
      `INSERT INTO profiles
       (login, display_name, bio, followers, following, public_repos,
        languages_json, topics_json, kg_json, vault_json, fetched_at, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(login) DO UPDATE SET
         display_name=excluded.display_name,
         bio=excluded.bio,
         followers=excluded.followers,
         following=excluded.following,
         public_repos=excluded.public_repos,
         languages_json=excluded.languages_json,
         topics_json=excluded.topics_json,
         kg_json=excluded.kg_json,
         vault_json=excluded.vault_json,
         fetched_at=excluded.fetched_at,
         expires_at=excluded.expires_at`,
    )
    .bind(
      profile.login,
      profile.name ?? null,
      profile.bio ?? null,
      profile.followers.totalCount,
      profile.following.totalCount,
      profile.repositories.totalCount,
      JSON.stringify(languages),
      JSON.stringify(Array.from(topicsSet)),
      kgJson,
      vaultJson,
      now,
      now + PROFILE_TTL_SECONDS,
    )
    .run();
}

export interface CachedProfileRow {
  login: string;
  kg_json: string;
  vault_json: string;
  expires_at: number;
}

export async function readCachedProfile(
  db: D1Like,
  login: string,
): Promise<CachedProfileRow | null> {
  const row = await db
    .prepare(
      `SELECT login, kg_json, vault_json, expires_at FROM profiles WHERE login = ?`,
    )
    .bind(login)
    .first<CachedProfileRow>();
  if (!row) return null;
  if (row.expires_at < Math.floor(Date.now() / 1000)) return null;
  return row;
}
