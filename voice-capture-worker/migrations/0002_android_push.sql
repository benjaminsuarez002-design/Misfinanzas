CREATE TABLE IF NOT EXISTS android_push_devices (
  id TEXT PRIMARY KEY,
  user_uid TEXT NOT NULL,
  token TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_test_at INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS android_push_user ON android_push_devices(user_uid);
CREATE TABLE IF NOT EXISTS android_push_receipts (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL
);
