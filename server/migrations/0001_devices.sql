CREATE TABLE devices (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  revoked_at INTEGER DEFAULT NULL
);

CREATE INDEX idx_devices_token_hash
ON devices(token_hash);
