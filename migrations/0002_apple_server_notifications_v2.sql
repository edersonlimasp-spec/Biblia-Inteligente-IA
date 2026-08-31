ALTER TABLE "subscriptions"
  ADD COLUMN IF NOT EXISTS "store_currency" text,
  ADD COLUMN IF NOT EXISTS "store_environment" text,
  ADD COLUMN IF NOT EXISTS "store_state_signed_at" timestamp,
  ADD COLUMN IF NOT EXISTS "auto_renew_status" text,
  ADD COLUMN IF NOT EXISTS "auto_renew_product_id" text,
  ADD COLUMN IF NOT EXISTS "billing_retry_active" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "grace_period_expires_at" timestamp,
  ADD COLUMN IF NOT EXISTS "expiration_reason" text,
  ADD COLUMN IF NOT EXISTS "churn_risk" boolean NOT NULL DEFAULT false;

ALTER TABLE "payment_receipts"
  ADD COLUMN IF NOT EXISTS "fee_rate_bps" integer,
  ADD COLUMN IF NOT EXISTS "net_amount_estimated" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "is_renewal" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "is_test" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "financially_excluded" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "financial_exclusion_reason" text,
  ADD COLUMN IF NOT EXISTS "original_external_payment_id" text;

-- Existing Apple rows predate trusted environment/currency metadata. Exclude
-- only those legacy rows until the verified Server API backfill enriches them.
-- The predicates keep this migration idempotent: verified/backfilled rows have
-- fee_rate_bps and net_amount_estimated populated and remain countable.
UPDATE "payment_receipts"
SET
  "financially_excluded" = true,
  "financial_exclusion_reason" = 'unverified_legacy'
WHERE
  "payment_provider" = 'apple'
  AND "fee_rate_bps" IS NULL
  AND "net_amount_estimated" = false
  AND "financial_exclusion_reason" IS NULL;

CREATE TABLE IF NOT EXISTS "apple_notification_events" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "notification_uuid" text NOT NULL UNIQUE,
  "notification_type" text NOT NULL,
  "subtype" text,
  "environment" text NOT NULL,
  "is_test" boolean NOT NULL DEFAULT false,
  "original_transaction_id" text,
  "transaction_id" text,
  "product_id" text,
  "purchase_date" timestamp,
  "expires_date" timestamp,
  "decoded_payload" jsonb NOT NULL,
  "processing_status" text NOT NULL DEFAULT 'pending',
  "processing_error" text,
  "attempt_count" integer NOT NULL DEFAULT 0,
  "next_attempt_at" timestamp NOT NULL DEFAULT now(),
  "processing_started_at" timestamp,
  "subscription_id" varchar REFERENCES "subscriptions"("id") ON DELETE SET NULL,
  "user_id" varchar REFERENCES "users"("id") ON DELETE SET NULL,
  "duplicate_count" integer NOT NULL DEFAULT 0,
  "received_at" timestamp NOT NULL DEFAULT now(),
  "last_received_at" timestamp NOT NULL DEFAULT now(),
  "processed_at" timestamp
);

ALTER TABLE "apple_notification_events"
  ADD COLUMN IF NOT EXISTS "attempt_count" integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "next_attempt_at" timestamp NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS "processing_started_at" timestamp;

CREATE INDEX IF NOT EXISTS "apple_notification_events_received_at_idx"
  ON "apple_notification_events" ("received_at");
CREATE INDEX IF NOT EXISTS "apple_notification_events_environment_idx"
  ON "apple_notification_events" ("environment");
CREATE INDEX IF NOT EXISTS "apple_notification_events_original_transaction_idx"
  ON "apple_notification_events" ("original_transaction_id");
CREATE INDEX IF NOT EXISTS "apple_notification_events_processing_status_idx"
  ON "apple_notification_events" ("processing_status");
CREATE INDEX IF NOT EXISTS "apple_notification_events_next_attempt_idx"
  ON "apple_notification_events" ("next_attempt_at");