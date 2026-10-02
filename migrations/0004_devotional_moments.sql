-- Additive only. No previous devotional activities or library content altered.
CREATE TABLE IF NOT EXISTS daily_devotionals (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  local_date text NOT NULL,
  routine text NOT NULL CHECK (routine IN ('manha', 'noite')),
  status text NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'aprovado')),
  content jsonb NOT NULL,
  updated_at timestamp NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS daily_devotionals_date_routine_idx
  ON daily_devotionals(local_date, routine);
CREATE TABLE IF NOT EXISTS devotional_journal (
  user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  local_date text NOT NULL,
  routine text NOT NULL CHECK (routine IN ('manha', 'noite')),
  entries jsonb NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  updated_at timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, local_date, routine)
);