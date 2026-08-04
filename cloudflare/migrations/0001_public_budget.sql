CREATE TABLE IF NOT EXISTS public_ai_reservations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_hash TEXT NOT NULL,
  reserved_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_public_ai_reservations_client
  ON public_ai_reservations (client_hash);
