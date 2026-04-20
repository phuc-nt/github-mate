import { LOGIN_PATTERN } from "../github/profile-query";

const URL_PATTERN = /^https?:\/\/github\.com\/([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?)\/?$/;

export class InvalidUrlError extends Error {
  constructor(url: string) {
    super(`Invalid GitHub URL: ${url}`);
    this.name = "InvalidUrlError";
  }
}

export function parseGithubUrl(raw: string): string {
  const trimmed = raw.trim();
  const match = trimmed.match(URL_PATTERN);
  if (!match) throw new InvalidUrlError(raw);
  const login = match[1];
  if (!LOGIN_PATTERN.test(login)) throw new InvalidUrlError(raw);
  return login;
}
