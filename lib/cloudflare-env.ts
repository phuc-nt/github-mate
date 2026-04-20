import { getCloudflareContext } from "@opennextjs/cloudflare";

export interface Env {
  AI: Ai;
  DB: D1Database;
  CACHE: KVNamespace;
  ASSETS: Fetcher;
  GITHUB_TOKEN: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  SESSION_SECRET: string;
}

export function env(): Env {
  return getCloudflareContext().env as unknown as Env;
}
