import type { D1Like } from "./d1-types";

const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

async function deriveKey(secret: string): Promise<CryptoKey> {
  const raw = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(secret),
  );
  return crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function encryptToken(token: string, secret: string): Promise<ArrayBuffer> {
  const key = await deriveKey(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(token),
  );
  const out = new Uint8Array(iv.byteLength + ciphertext.byteLength);
  out.set(iv, 0);
  out.set(new Uint8Array(ciphertext), iv.byteLength);
  return out.buffer;
}

export async function decryptToken(
  blob: ArrayBuffer | Uint8Array,
  secret: string,
): Promise<string> {
  const data = blob instanceof Uint8Array ? blob : new Uint8Array(blob);
  const iv = data.slice(0, 12);
  const ct = data.slice(12);
  const key = await deriveKey(secret);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  return new TextDecoder().decode(plain);
}

export function newSessionId(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function createSession(
  db: D1Like,
  sessionId: string,
  login: string,
  accessToken: string,
  secret: string,
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const encrypted = await encryptToken(accessToken, secret);
  await db
    .prepare(
      `INSERT INTO sessions (session_id, github_login, access_token_encrypted, created_at, expires_at)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .bind(sessionId, login, encrypted, now, now + SESSION_TTL_SECONDS)
    .run();
}

export interface SessionRow {
  session_id: string;
  github_login: string;
  access_token_encrypted: ArrayBuffer;
  expires_at: number;
}

export async function readSession(
  db: D1Like,
  sessionId: string,
): Promise<SessionRow | null> {
  const row = await db
    .prepare(
      `SELECT session_id, github_login, access_token_encrypted, expires_at
       FROM sessions WHERE session_id = ?`,
    )
    .bind(sessionId)
    .first<SessionRow>();
  if (!row) return null;
  if (row.expires_at < Math.floor(Date.now() / 1000)) return null;
  return row;
}

export async function deleteSession(db: D1Like, sessionId: string): Promise<void> {
  await db.prepare(`DELETE FROM sessions WHERE session_id = ?`).bind(sessionId).run();
}

export function sessionCookie(sessionId: string, maxAge = SESSION_TTL_SECONDS): string {
  return `gm_session=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export function clearSessionCookie(): string {
  return `gm_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export function readSessionCookie(header: string | null): string | null {
  if (!header) return null;
  const match = header.match(/(?:^|;\s*)gm_session=([^;]+)/);
  return match ? match[1] : null;
}
