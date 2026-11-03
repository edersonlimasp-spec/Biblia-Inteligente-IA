import { describe, expect, it, vi } from "vitest";
vi.mock("../db", () => ({ db: {} }));
import { computeStoreTrialStats, isStoreTrialSubscription, willAutoRenew } from "./store-trial";

const DAY = 86_400_000;
const now = new Date("2026-11-10T12:00:00Z");
const base = { planType: "premium_anual", source: "apple", status: "active" };

describe("store trial", () => {
  it("reconhece o teste de 7 dias e ignora o anual pago", () => {
    expect(isStoreTrialSubscription({ ...base, startDate: new Date(now.getTime() - DAY), endDate: new Date(now.getTime() + 6 * DAY) })).toBe(true);
    expect(isStoreTrialSubscription({ ...base, startDate: new Date(now.getTime() - DAY), endDate: new Date(now.getTime() + 364 * DAY) })).toBe(false);
    expect(isStoreTrialSubscription({ ...base, source: "web", startDate: now, endDate: new Date(now.getTime() + 7 * DAY) })).toBe(false);
    expect(isStoreTrialSubscription({ ...base, planType: "premium", startDate: now, endDate: new Date(now.getTime() + 7 * DAY) })).toBe(false);
  });

  it("renovação desligada quando a loja avisou", () => {
    expect(willAutoRenew({ ...base, startDate: now, endDate: now, autoRenewStatus: "disabled" })).toBe(false);
    expect(willAutoRenew({ ...base, startDate: now, endDate: now, autoRenewStatus: "enabled" })).toBe(true);
  });

  it("calcula testes ativos, cancelando e conversão", () => {
    const subs = [
      { id: "a", ...base, startDate: new Date(now.getTime() - 2 * DAY), endDate: new Date(now.getTime() + 5 * DAY) },
      { id: "b", ...base, startDate: new Date(now.getTime() - 2 * DAY), endDate: new Date(now.getTime() + 5 * DAY), autoRenewStatus: "disabled" },
      { id: "c", ...base, startDate: new Date(now.getTime() - 20 * DAY), endDate: new Date(now.getTime() + 352 * DAY) },
      { id: "d", ...base, status: "expired", startDate: new Date(now.getTime() - 30 * DAY), endDate: new Date(now.getTime() - 23 * DAY) },
    ];
    const r = (subscriptionId: string, grossAmount: number) => ({ subscriptionId, grossAmount, paymentProvider: "apple", planType: "premium_anual", status: "approved" });
    const stats = computeStoreTrialStats(subs, [r("a", 0), r("b", 0), r("c", 0), r("c", 12990), r("d", 0)], now);
    expect(stats).toEqual({ active: 2, canceling: 1, started: 4, converted: 1, conversionRate: 50 });
  });
});
