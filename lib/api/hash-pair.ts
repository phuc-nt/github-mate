export async function hashPair(loginA: string, loginB: string): Promise<string> {
  const sorted = [loginA.toLowerCase(), loginB.toLowerCase()].sort();
  const bytes = new TextEncoder().encode(sorted.join("|"));
  const buf = await crypto.subtle.digest("SHA-256", bytes);
  return bufferToHex(buf);
}

function bufferToHex(buf: ArrayBuffer): string {
  const arr = new Uint8Array(buf);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}
