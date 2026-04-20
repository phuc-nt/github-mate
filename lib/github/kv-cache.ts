export interface KVLike {
  get(key: string, type: "text"): Promise<string | null>;
  put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

export async function getJson<T>(kv: KVLike, key: string): Promise<T | null> {
  const raw = await kv.get(key, "text");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function putJson<T>(
  kv: KVLike,
  key: string,
  value: T,
  ttlSeconds: number,
): Promise<void> {
  await kv.put(key, JSON.stringify(value), { expirationTtl: ttlSeconds });
}
