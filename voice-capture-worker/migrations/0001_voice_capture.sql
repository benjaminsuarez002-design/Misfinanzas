CREATE TABLE IF NOT EXISTS voice_devices (
  id TEXT PRIMARY KEY,
  user_uid TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT 'Siri',
  token_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  last_used_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_voice_devices_user
  ON voice_devices(user_uid);

CREATE TABLE IF NOT EXISTS voice_captures (
  id TEXT PRIMARY KEY,
  user_uid TEXT NOT NULL,
  device_id TEXT NOT NULL,
  raw_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processed', 'discarded')),
  source TEXT NOT NULL DEFAULT 'siri',
  created_at TEXT NOT NULL,
  resolved_at TEXT,
  FOREIGN KEY (device_id) REFERENCES voice_devices(id)
);

CREATE INDEX IF NOT EXISTS idx_voice_captures_pending
  ON voice_captures(user_uid, status, created_at);
