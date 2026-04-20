-- 0001_init.sql — initial schema for GitHub Mate (D1-only MVP)
-- D1 (SQLite). No multi-statement transactions; each table atomic.
-- All blob/graph data stored inline in D1 TEXT columns (no R2).

-- Cached GitHub profile snapshots + inline KG + vault files
CREATE TABLE IF NOT EXISTS profiles (
  login           TEXT PRIMARY KEY,
  display_name    TEXT,
  bio             TEXT,
  followers       INTEGER,
  following       INTEGER,
  public_repos    INTEGER,
  languages_json  TEXT,            -- JSON: {lang: bytes}
  topics_json     TEXT,            -- JSON: [topic,...]
  kg_json         TEXT,            -- JSON: {nodes, edges} (Cytoscape-ready)
  vault_json      TEXT,            -- JSON: {filepath: content} (Obsidian md files)
  embedding_blob  BLOB,            -- bge-base-en-v1.5 profile embedding (768 * f32)
  fetched_at      INTEGER NOT NULL,
  expires_at      INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_profiles_expires ON profiles(expires_at);

-- Match result cache, keyed by sha256(sortedUrls)
CREATE TABLE IF NOT EXISTS match_history (
  cache_key       TEXT PRIMARY KEY,
  login_a         TEXT NOT NULL,
  login_b         TEXT NOT NULL,
  score           REAL NOT NULL,
  breakdown_json  TEXT NOT NULL,   -- {tech, interest, complementary, explanation}
  created_at      INTEGER NOT NULL,
  expires_at      INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_match_expires ON match_history(expires_at);

-- Weekly-refreshed trending authors (sync cron build, no queue)
CREATE TABLE IF NOT EXISTS top20_authors (
  login         TEXT PRIMARY KEY,
  rank          INTEGER NOT NULL,
  score         REAL,
  community     TEXT,              -- trending topic tag
  updated_at    INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_top20_rank ON top20_authors(rank);

-- OAuth sessions (Sign in with GitHub)
CREATE TABLE IF NOT EXISTS sessions (
  session_id              TEXT PRIMARY KEY,
  github_login            TEXT NOT NULL,
  access_token_encrypted  BLOB NOT NULL,
  created_at              INTEGER NOT NULL,
  expires_at              INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_login ON sessions(github_login);
