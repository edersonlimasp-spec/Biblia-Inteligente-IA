import { afterEach, describe, expect, it } from 'vitest';
import {
  applePriceToCents,
  createAppleFinancialReceipt,
  getAppleCommissionRateBps,
  isAppleSandbox,
  isFinanciallyCountableSubscription,
} from './apple-finance';

const savedEnvironment = { ...process.env };

afterEach(() => {
  process.env = { ...savedEnvironment };
});

function receiptExecutor() {
  const inserted: Record<string, unknown>[] = [];
  let selectCount = 0;
  const executor = {
    select() {
      const chain = {
        from() { return chain; },
        where() { return chain; },
        async limit() {
          selectCount++;
          // First read is the idempotency lookup; second is the user email.
          return selectCount % 2 === 1 ? [] : [{ email: 'member@example.com' }];
        },
      };
      return chain;
    },
    insert() {
      const chain = {
        values(row: Record<string, unknown>) {
          inserted.push(row);
          return chain;
        },
        onConflictDoNothing() { return chain; },
        async returning() { return [{ id: `receipt-${inserted.length}` }]; },
      };
      return chain;
    },
  };
  return { executor, inserted };
}

describe('Apple financial receipts', () => {
  it('uses configurable 30/15 percent commission and converts Apple milliunits', () => {
    process.env.APPLE_COMMISSION_FIRST_YEAR_PERCENT = '30';
    process.env.APPLE_COMMISSION_AFTER_YEAR_PERCENT = '15';
    const purchase = new Date('2025-01-02T00:00:00Z');

    expect(getAppleCommissionRateBps(purchase, new Date('2024-06-01T00:00:00Z'))).toBe(3000);
    expect(getAppleCommissionRateBps(purchase, new Date('2023-01-01T00:00:00Z'))).toBe(1500);
    expect(applePriceToCents('com.bibliainteligente.gold.monthly', 19_905))
      .toEqual({ cents: 1991, source: 'apple' });
  });

  it('classifies only Production as non-test revenue', () => {
    expect(isAppleSandbox('Production')).toBe(false);
    expect(isAppleSandbox('Sandbox')).toBe(true);
    expect(isAppleSandbox(undefined)).toBe(true);
  });

  it('counts Apple subscriptions only with confirmed Production and BRL metadata', () => {
    expect(isFinanciallyCountableSubscription({ source: 'web' })).toBe(true);
    expect(isFinanciallyCountableSubscription({
      source: 'apple', storeEnvironment: 'Production', storeCurrency: 'BRL',
    })).toBe(true);
    expect(isFinanciallyCountableSubscription({
      source: 'apple', storeEnvironment: 'Sandbox', storeCurrency: 'BRL',
    })).toBe(false);
    expect(isFinanciallyCountableSubscription({
      source: 'apple', storeEnvironment: 'Production', storeCurrency: null,
    })).toBe(false);
    expect(isFinanciallyCountableSubscription({
      source: 'apple', storeEnvironment: null, storeCurrency: 'BRL',
    })).toBe(false);
  });

  it('writes positive charge and negative refund ledger entries with matching fees', async () => {
    const { executor, inserted } = receiptExecutor();
    const transaction = {
      transactionId: 'transaction-1',
      originalTransactionId: 'original-1',
      productId: 'com.bibliainteligente.premium.monthly',
      purchaseDate: new Date('2025-01-01T00:00:00Z'),
      priceMilliunits: 19_900,
      environment: 'Production',
    };

    await createAppleFinancialReceipt({
      executor,
      userId: 'user-1',
      subscriptionId: 'sub-1',
      transaction,
      origin: 'webhook',
    });
    await createAppleFinancialReceipt({
      executor,
      userId: 'user-1',
      subscriptionId: 'sub-1',
      transaction,
      externalPaymentId: 'refund:transaction-1',
      originalExternalPaymentId: 'transaction-1',
      grossAmountOverride: -1990,
      status: 'refunded',
      origin: 'webhook',
    });

    expect(inserted).toHaveLength(2);
    expect(inserted[0]).toMatchObject({
      grossAmount: 1990, feeAmount: 597, netAmount: 1393, status: 'approved', isTest: false,
    });
    expect(inserted[1]).toMatchObject({
      grossAmount: -1990, feeAmount: -597, netAmount: -1393, status: 'refunded',
      originalExternalPaymentId: 'transaction-1',
    });
  });

  it('financially excludes foreign-currency production receipts', async () => {
    const { executor, inserted } = receiptExecutor();
    await createAppleFinancialReceipt({
      executor,
      userId: 'user-1',
      subscriptionId: 'sub-1',
      transaction: {
        transactionId: 'usd-transaction',
        originalTransactionId: 'usd-original',
        productId: 'com.bibliainteligente.premium.monthly',
        purchaseDate: new Date('2025-01-01T00:00:00Z'),
        priceMilliunits: 9_990,
        currency: 'usd',
        environment: 'Production',
      },
      origin: 'webhook',
    });

    expect(inserted[0]).toMatchObject({
      currency: 'USD',
      isTest: false,
      financiallyExcluded: true,
      financialExclusionReason: 'unsupported_currency_USD',
    });
  });
});