import type { PaymentReceipt } from "@shared/schema";

type SubscriptionHealth = {
  activeByPlan: { gold: number; premium: number; lifetime: number };
  mrr: number;
  arpu: number;
  renewalRate: number;
  churnRate: number;
  expiringNext30Days: number;
};

export function buildRecurringRevenueMetrics(args: {
  health: SubscriptionHealth;
  receipts: PaymentReceipt[];
  days: number;
  since: Date;
  now: Date;
}) {
  const { health, receipts, days, since, now } = args;
  const approvedStatuses = new Set(["approved", "Approved", "APPROVED"]);
  const countableStatuses = new Set([
    "approved", "Approved", "APPROVED",
    "refunded", "refund_reversed",
  ]);
  const recurringReceipts = receipts.filter((receipt) =>
    countableStatuses.has(receipt.status) &&
    !receipt.isLifetime &&
    Boolean(receipt.subscriptionDays && receipt.subscriptionDays > 0) &&
    !receipt.isTest &&
    !receipt.financiallyExcluded &&
    receipt.currency.toUpperCase() === "BRL"
  );
  const isApprovedCharge = (receipt: PaymentReceipt) =>
    approvedStatuses.has(receipt.status) && receipt.grossAmount > 0;
  const isIdentifiedRenewal = (receipt: PaymentReceipt) =>
    receipt.paymentProvider === "apple" &&
    receipt.isRenewal &&
    (receipt.providerRawData as any)?.transactionReason === "RENEWAL";

  const totals = recurringReceipts.reduce((summary, receipt) => {
    summary.gross += receipt.grossAmount;
    summary.net += receipt.netAmount;
    summary.fees += receipt.feeAmount || 0;
    if (isIdentifiedRenewal(receipt)) {
      summary.renewalGross += receipt.grossAmount;
      summary.renewalNet += receipt.netAmount;
      if (isApprovedCharge(receipt)) summary.renewalTransactions += 1;
    } else {
      summary.otherGross += receipt.grossAmount;
      summary.otherNet += receipt.netAmount;
      if (isApprovedCharge(receipt)) summary.otherTransactions += 1;
    }
    return summary;
  }, {
    gross: 0,
    net: 0,
    fees: 0,
    renewalGross: 0,
    renewalNet: 0,
    otherGross: 0,
    otherNet: 0,
    renewalTransactions: 0,
    otherTransactions: 0,
  });

  const trendByDate = new Map<string, {
    date: string;
    otherRevenue: number;
    renewalRevenue: number;
    netRevenue: number;
    transactions: number;
  }>();
  for (let offset = 0; offset < days; offset += 1) {
    const date = new Date(since.getTime() + offset * 24 * 60 * 60 * 1000)
      .toISOString().slice(0, 10);
    trendByDate.set(date, { date, otherRevenue: 0, renewalRevenue: 0, netRevenue: 0, transactions: 0 });
  }

  const providers = new Map<string, { provider: string; gross: number; net: number; transactions: number }>();
  for (const receipt of recurringReceipts) {
    const date = new Date(receipt.paymentDate).toISOString().slice(0, 10);
    const trend = trendByDate.get(date);
    if (trend) {
      if (isIdentifiedRenewal(receipt)) trend.renewalRevenue += receipt.netAmount;
      else trend.otherRevenue += receipt.netAmount;
      trend.netRevenue += receipt.netAmount;
      if (isApprovedCharge(receipt)) trend.transactions += 1;
    }

    const providerName = receipt.paymentProvider || "outro";
    const provider = providers.get(providerName) || {
      provider: providerName,
      gross: 0,
      net: 0,
      transactions: 0,
    };
    provider.gross += receipt.grossAmount;
    provider.net += receipt.netAmount;
    if (isApprovedCharge(receipt)) provider.transactions += 1;
    providers.set(providerName, provider);
  }

  return {
    period: { days, from: since.toISOString(), to: now.toISOString() },
    activeRecurring: health.activeByPlan.gold + health.activeByPlan.premium,
    activeByPlan: health.activeByPlan,
    mrr: Math.round(health.mrr * 100),
    arpu: Math.round(health.arpu * 100),
    renewalRate: health.renewalRate,
    churnRate: health.churnRate,
    expiringNext30Days: health.expiringNext30Days,
    totals,
    dailyTrend: Array.from(trendByDate.values()),
    providers: Array.from(providers.values()).sort((a, b) => b.net - a.net),
  };
}