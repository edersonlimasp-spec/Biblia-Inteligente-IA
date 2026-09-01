import { describe, expect, it } from "vitest";
import type { PaymentReceipt } from "@shared/schema";
import { buildRecurringRevenueMetrics } from "./recurring-revenue";

const now = new Date("2026-09-01T12:00:00.000Z");
const since = new Date("2026-08-31T00:00:00.000Z");
const health = {
  activeByPlan: { gold: 2, premium: 1, lifetime: 10 },
  mrr: 29.7,
  arpu: 9.9,
  renewalRate: 75,
  churnRate: 25,
  expiringNext30Days: 2,
};

function receipt(overrides: Partial<PaymentReceipt>): PaymentReceipt {
  return {
    id: "receipt",
    externalPaymentId: "tx",
    paymentProvider: "apple",
    paymentType: "subscription",
    userId: "user",
    userEmail: null,
    planType: "premium",
    subscriptionDays: 30,
    isLifetime: false,
    grossAmount: 1990,
    feeAmount: 300,
    taxAmount: 0,
    netAmount: 1690,
    currency: "BRL",
    feeRateBps: 1500,
    netAmountEstimated: true,
    isRenewal: true,
    isTest: false,
    financiallyExcluded: false,
    financialExclusionReason: null,
    originalExternalPaymentId: null,
    status: "approved",
    origin: "webhook",
    providerRawData: { transactionReason: "RENEWAL" },
    isValidated: true,
    validationError: null,
    subscriptionId: null,
    activatedAt: now,
    paymentDate: new Date("2026-08-31T12:00:00.000Z"),
    receivedAt: now,
    processedAt: now,
    validatedAt: now,
    ...overrides,
  };
}

describe("recurring revenue metrics", () => {
  it("uses centavos, nets refunds, and classifies only explicit Apple renewals", () => {
    const metrics = buildRecurringRevenueMetrics({
      health,
      days: 2,
      since,
      now,
      receipts: [
        receipt({ id: "renewal" }),
        receipt({
          id: "refund",
          externalPaymentId: "refund:tx",
          grossAmount: -1990,
          feeAmount: -300,
          netAmount: -1690,
          status: "refunded",
          originalExternalPaymentId: "tx",
        }),
        receipt({
          id: "google",
          paymentProvider: "google",
          externalPaymentId: "google-1",
          grossAmount: 990,
          feeAmount: 0,
          netAmount: 990,
          providerRawData: null,
        }),
      ],
    });

    expect(metrics.mrr).toBe(2970);
    expect(metrics.arpu).toBe(990);
    expect(metrics.totals.net).toBe(990);
    expect(metrics.totals.renewalNet).toBe(0);
    expect(metrics.totals.renewalTransactions).toBe(1);
    expect(metrics.totals.otherNet).toBe(990);
    expect(metrics.totals.otherTransactions).toBe(1);
  });

  it("excludes sandbox, financially excluded, foreign currency, and lifetime receipts", () => {
    const metrics = buildRecurringRevenueMetrics({
      health,
      days: 2,
      since,
      now,
      receipts: [
        receipt({ id: "sandbox", isTest: true }),
        receipt({ id: "excluded", financiallyExcluded: true }),
        receipt({ id: "usd", currency: "USD" }),
        receipt({ id: "lifetime", isLifetime: true, subscriptionDays: null }),
      ],
    });

    expect(metrics.totals.net).toBe(0);
    expect(metrics.providers).toEqual([]);
  });
});