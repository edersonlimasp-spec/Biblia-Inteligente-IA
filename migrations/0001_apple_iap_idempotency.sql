-- Defense in depth for managed schema deployments. Runtime correctness also
-- uses transaction-scoped advisory locks and does not depend on these indexes.
CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_apple_original_transaction_unique"
  ON "subscriptions" ("source", "original_transaction_id")
  WHERE "source" = 'apple' AND "original_transaction_id" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "payment_receipts_apple_external_payment_unique"
  ON "payment_receipts" ("payment_provider", "external_payment_id")
  WHERE "payment_provider" = 'apple';