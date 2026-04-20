export interface D1Statement {
  bind(...values: unknown[]): D1Statement;
  first<T = unknown>(): Promise<T | null>;
  run(): Promise<{ success: boolean; meta?: unknown }>;
  all<T = unknown>(): Promise<{ results: T[] }>;
}

export interface D1Like {
  prepare(sql: string): D1Statement;
}
