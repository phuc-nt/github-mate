import { RateLimitError } from "./types";
import { withBackoff } from "./rate-limit";

const GITHUB_GRAPHQL_URL = "https://api.github.com/graphql";

export interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string; type?: string }>;
}

export async function graphqlRequest<T>(
  token: string,
  query: string,
  variables: Record<string, unknown>,
): Promise<T> {
  return withBackoff(
    async () => {
      const res = await fetch(GITHUB_GRAPHQL_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "User-Agent": "github-mate",
          Accept: "application/vnd.github+json",
        },
        body: JSON.stringify({ query, variables }),
      });

      if (res.status === 401) throw new Error("GitHub auth failed (401)");
      if (res.status === 403 || res.status === 429) {
        const remaining = Number(res.headers.get("x-ratelimit-remaining") ?? 0);
        const resetAt = res.headers.get("x-ratelimit-reset") ?? undefined;
        throw new RateLimitError(remaining, resetAt);
      }
      if (!res.ok) throw new Error(`GitHub GraphQL ${res.status}`);

      const body = (await res.json()) as GraphQLResponse<T>;
      if (body.errors?.length) {
        const msg = body.errors.map((e) => e.message).join("; ");
        throw new Error(`GraphQL error: ${msg}`);
      }
      if (!body.data) throw new Error("GraphQL: empty data");
      return body.data;
    },
    { isRetryable: (e) => !(e instanceof RateLimitError) },
  );
}
