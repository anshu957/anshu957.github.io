CREATE TABLE IF NOT EXISTS comments (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  slug       TEXT    NOT NULL,
  name       TEXT    NOT NULL,
  body       TEXT    NOT NULL,
  ip_hash    TEXT    NOT NULL,          -- salted hash, for rate limiting only
  created_at INTEGER NOT NULL,          -- unix ms
  deleted    INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS comments_by_slug ON comments (slug, deleted, created_at);
CREATE INDEX IF NOT EXISTS comments_by_ip   ON comments (ip_hash, created_at);
