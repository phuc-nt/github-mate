export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

const AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
const TOKEN_URL = "https://github.com/login/oauth/access_token";

export function buildAuthorizeUrl(cfg: OAuthConfig, state: string): string {
  const params = new URLSearchParams({
    client_id: cfg.clientId,
    redirect_uri: cfg.redirectUri,
    scope: "read:user public_repo",
    state,
    allow_signup: "true",
  });
  return `${AUTHORIZE_URL}?${params.toString()}`;
}

export function randomState(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function exchangeCode(
  cfg: OAuthConfig,
  code: string,
  fetchImpl: typeof fetch = fetch,
): Promise<{ accessToken: string; tokenType: string }> {
  const res = await fetchImpl(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "github-mate",
    },
    body: JSON.stringify({
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      code,
      redirect_uri: cfg.redirectUri,
    }),
  });
  if (!res.ok) throw new Error(`OAuth exchange failed: ${res.status}`);
  const json = (await res.json()) as {
    access_token?: string;
    token_type?: string;
    error?: string;
  };
  if (!json.access_token) {
    throw new Error(`OAuth exchange error: ${json.error ?? "no_token"}`);
  }
  return { accessToken: json.access_token, tokenType: json.token_type ?? "bearer" };
}

export async function fetchViewerLogin(
  accessToken: string,
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  const res = await fetchImpl("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": "github-mate",
      Accept: "application/vnd.github+json",
    },
  });
  if (!res.ok) throw new Error(`GitHub user lookup failed: ${res.status}`);
  const json = (await res.json()) as { login: string };
  return json.login;
}
