import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Apple revenue migration", () => {
  it("fails closed for legacy Apple receipts without touching verified rows", () => {
    const migration = readFileSync("migrations/0002_apple_server_notifications_v2.sql", "utf8");

    expect(migration).toContain(`"payment_provider" = 'apple'`);
    expect(migration).toContain(`"financial_exclusion_reason" = 'unverified_legacy'`);
    expect(migration).toContain(`"fee_rate_bps" IS NULL`);
    expect(migration).toContain(`"net_amount_estimated" = false`);
  });
});