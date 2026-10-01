CREATE TABLE IF NOT EXISTS "push_tokens" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "token" text NOT NULL UNIQUE,
  "platform" text NOT NULL CHECK ("platform" IN ('android', 'ios')),
  "created_at" timestamp NOT NULL DEFAULT now(),
  "last_used_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "push_tokens_user_id_idx" ON "push_tokens" ("user_id");
CREATE INDEX IF NOT EXISTS "push_tokens_platform_idx" ON "push_tokens" ("platform");

CREATE TABLE IF NOT EXISTS "push_notification_claims" (
  "user_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "local_date" text NOT NULL,
  "claimed_at" timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY ("user_id", "local_date")
);