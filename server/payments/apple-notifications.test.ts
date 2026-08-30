import { afterEach, describe, expect, it, vi } from 'vitest';

const verifyAndDecodeNotification = vi.fn();
const verifyAndDecodeTransaction = vi.fn();
const verifyAndDecodeRenewalInfo = vi.fn();
const SignedDataVerifier = vi.fn(function () {
  return { verifyAndDecodeNotification, verifyAndDecodeTransaction, verifyAndDecodeRenewalInfo };
});
const createAppleFinancialReceipt = vi.fn();
const db = {
  insert: vi.fn(),
  update: vi.fn(),
  select: vi.fn(),
  transaction: vi.fn(),
};

vi.mock('@apple/app-store-server-library', () => ({
  AppStoreServerAPIClient: vi.fn(),
  Environment: { SANDBOX: 'Sandbox', PRODUCTION: 'Production' },
  GetTransactionHistoryVersion: { V2: 'V2' },
  SignedDataVerifier,
}));
vi.mock('../db', () => ({ db }));
vi.mock('./apple-finance', () => ({
  createAppleFinancialReceipt,
  isAppleSandbox: (environment?: string) => environment !== 'Production',
}));

const savedEnvironment = { ...process.env };
afterEach(() => {
  process.env = { ...savedEnvironment };
  vi.clearAllMocks();
});

function chainWith(rows: unknown[]) {
  const chain = {
    from() { return chain; },
    where: vi.fn(() => chain),
    orderBy() { return chain; },
    limit: vi.fn().mockResolvedValue(rows),
  };
  return chain;
}

function updateChain() {
  const chain = {
    set: vi.fn(() => chain),
    where: vi.fn(() => chain),
    returning: vi.fn().mockResolvedValue([{ id: 'event-1' }]),
  };
  return chain;
}

describe('Apple server notification verification', () => {
  it('accepts a production JWS and a sandbox JWS, but rejects an invalid JWS', async () => {
    const { verifyAppleServerNotification } = await import('./apple-notifications');
    process.env.APPLE_APP_ID = '123456';
    verifyAndDecodeNotification.mockResolvedValueOnce({
      notificationUUID: 'production-event',
      data: { environment: 'Production' },
    });
    await expect(verifyAppleServerNotification('production-jws')).resolves.toMatchObject({
      environment: 'Production', notificationUuid: 'production-event',
    });

    verifyAndDecodeNotification
      .mockRejectedValueOnce(new Error('not production'))
      .mockResolvedValueOnce({ notificationUUID: 'sandbox-event', data: { environment: 'Sandbox' } });
    await expect(verifyAppleServerNotification('sandbox-jws')).resolves.toMatchObject({
      environment: 'Sandbox', notificationUuid: 'sandbox-event',
    });

    verifyAndDecodeNotification.mockRejectedValue(new Error('invalid signature'));
    await expect(verifyAppleServerNotification('invalid-jws')).rejects.toThrow('invalid signature');
  });

  it('records duplicate notification deliveries idempotently', async () => {
    const { persistVerifiedAppleNotification } = await import('./apple-notifications');
    const insertChain = {
      values: vi.fn(),
      onConflictDoNothing: vi.fn(),
      returning: vi.fn()
        .mockResolvedValueOnce([{ id: 'event-1' }])
        .mockResolvedValueOnce([]),
    };
    insertChain.values.mockReturnValue(insertChain);
    insertChain.onConflictDoNothing.mockReturnValue(insertChain);
    db.insert.mockReturnValue(insertChain);
    db.update.mockReturnValue(updateChain());
    const verified: any = {
      notificationUuid: 'same-event',
      environment: 'Production',
      notification: { notificationType: 'DID_RENEW' },
      transaction: null,
      renewal: null,
      decodedPayload: {},
    };

    await expect(persistVerifiedAppleNotification(verified)).resolves.toEqual({ id: 'event-1', duplicate: false });
    await expect(persistVerifiedAppleNotification(verified)).resolves.toEqual({ id: 'event-1', duplicate: true });
    expect(db.update).toHaveBeenCalledTimes(1);
  });
});

describe('Apple notification processing', () => {
  it('selects failed and unmatched events for retry, but not processed events', async () => {
    const { processPendingAppleNotifications } = await import('./apple-notifications');
    const select = chainWith([]);
    db.select.mockReturnValue(select);

    await expect(processPendingAppleNotifications()).resolves.toBe(0);

    const seen = new WeakSet<object>();
    const retryFilter = JSON.stringify(select.where.mock.calls[0][0], (_key, value) => {
      if (typeof value !== 'object' || value === null) return value;
      if (seen.has(value)) return undefined;
      seen.add(value);
      return value;
    });
    expect(retryFilter).toContain('pending');
    expect(retryFilter).toContain('failed');
    expect(retryFilter).toContain('unmatched');
    expect(retryFilter).not.toContain('\"processed\"');
  });

  it.each(['pending', 'failed', 'unmatched'])(
    'claims and retries a %s sandbox event',
    async (processingStatus) => {
    const { processAppleNotificationEvent } = await import('./apple-notifications');
    db.select.mockReturnValue(chainWith([{
      id: 'event-1', notificationUuid: 'sandbox-event', notificationType: 'DID_RENEW',
      processingStatus, attemptCount: 1, isTest: true, decodedPayload: {},
    }]));
    const update = updateChain();
    db.update.mockReturnValue(update);

    await processAppleNotificationEvent('event-1');

    expect(update.set).toHaveBeenCalledWith(expect.objectContaining({ processingStatus: 'test_ignored' }));
    expect(db.transaction).not.toHaveBeenCalled();
    expect(createAppleFinancialReceipt).not.toHaveBeenCalled();
    },
  );

  it('does not reprocess an already processed event, making delivery retries safe', async () => {
    const { processAppleNotificationEvent } = await import('./apple-notifications');
    db.select.mockReturnValue(chainWith([{
      id: 'event-1', processingStatus: 'processed', notificationType: 'DID_RENEW',
    }]));

    await processAppleNotificationEvent('event-1');

    expect(db.transaction).not.toHaveBeenCalled();
    expect(db.update).not.toHaveBeenCalled();
    expect(createAppleFinancialReceipt).not.toHaveBeenCalled();
  });

  it('uses one cumulative full-refund identity across webhook/history-style replay', async () => {
    const { processAppleNotificationEvent } = await import('./apple-notifications');
    const expiresDate = new Date('2025-02-01T00:00:00Z').getTime();
    const transaction = {
      transactionId: 'transaction-1',
      originalTransactionId: 'original-1',
      productId: 'com.bibliainteligente.premium.monthly',
      purchaseDate: new Date('2025-01-01T00:00:00Z').getTime(),
      expiresDate,
      revocationDate: new Date('2025-01-20T00:00:00Z').getTime(),
      revocationPercentage: 100_000,
      currency: 'BRL',
    };
    const events = [
      { id: 'event-webhook', notificationUuid: 'webhook-uuid' },
      { id: 'event-history', notificationUuid: 'history-transaction-1' },
    ];
    let eventIndex = 0;
    db.select.mockImplementation(() => chainWith([{
      ...events[eventIndex++],
      notificationType: 'REFUND',
      processingStatus: 'pending',
      attemptCount: 0,
      environment: 'Production',
      isTest: false,
      decodedPayload: { notification: {}, transaction, renewal: null },
    }]));
    db.update.mockImplementation(() => updateChain());
    const subscription = {
      id: 'sub-1', userId: 'user-1', storeTransactionId: 'transaction-1',
      endDate: new Date(expiresDate), storeStateSignedAt: null,
    };
    let delivery = 0;
    const subscriptionPatches: Record<string, unknown>[] = [];
    db.transaction.mockImplementation(async (callback: (tx: any) => unknown) => {
      const existingReversal = delivery++ === 0
        ? []
        : [{ id: 'refund-receipt', grossAmount: -1990, feeRateBps: 3000 }];
      const selected = [[subscription], [{ grossAmount: 1990, feeRateBps: 3000 }], existingReversal];
      const tx = {
        execute: vi.fn(),
        select: vi.fn(() => chainWith(selected.shift() || [])),
        update: vi.fn((table: any) => {
          const chain = updateChain();
          const set = chain.set;
          chain.set = vi.fn((patch: Record<string, unknown>) => {
            if (table?.[Symbol.for('drizzle:Name')] === 'subscriptions') subscriptionPatches.push(patch);
            return chain;
          });
          void set;
          return chain;
        }),
      };
      return callback(tx);
    });
    createAppleFinancialReceipt.mockResolvedValue({ created: true });

    await processAppleNotificationEvent('event-webhook');
    await processAppleNotificationEvent('event-history');

    expect(createAppleFinancialReceipt).toHaveBeenCalledTimes(1);
    expect(createAppleFinancialReceipt).toHaveBeenCalledWith(expect.objectContaining({
      externalPaymentId: 'refund:transaction-1',
      originalExternalPaymentId: 'transaction-1',
      grossAmountOverride: -1990,
      status: 'refunded',
    }));
    expect(subscriptionPatches[0]).toMatchObject({ status: 'refunded' });
  });

  it('records an older refund adjustment without revoking the newer entitlement', async () => {
    const { processAppleNotificationEvent } = await import('./apple-notifications');
    const oldExpiry = new Date('2025-02-01T00:00:00Z').getTime();
    db.select.mockReturnValue(chainWith([{
      id: 'old-refund', notificationUuid: 'old-refund', notificationType: 'REFUND',
      processingStatus: 'unmatched', attemptCount: 2, environment: 'Production', isTest: false,
      decodedPayload: {
        notification: { signedDate: new Date('2025-01-20T00:00:00Z').getTime() },
        renewal: null,
        transaction: {
          transactionId: 'old-transaction',
          originalTransactionId: 'original-1',
          productId: 'com.bibliainteligente.premium.monthly',
          purchaseDate: new Date('2025-01-01T00:00:00Z').getTime(),
          expiresDate: oldExpiry,
          revocationDate: new Date('2025-01-20T00:00:00Z').getTime(),
          revocationPercentage: 100_000,
          currency: 'BRL',
        },
      },
    }]));
    db.update.mockImplementation(() => updateChain());
    const patches: Record<string, unknown>[] = [];
    const selected = [[{
      id: 'sub-1',
      userId: 'user-1',
      status: 'active',
      storeTransactionId: 'newer-transaction',
      endDate: new Date('2025-03-01T00:00:00Z'),
      storeStateSignedAt: null,
    }], [{ grossAmount: 1990, feeRateBps: 3000 }], []];
    const tx = {
      execute: vi.fn(),
      select: vi.fn(() => chainWith(selected.shift() || [])),
      update: vi.fn((table: any) => {
        const chain = updateChain();
        chain.set = vi.fn((patch: Record<string, unknown>) => {
          if (table?.[Symbol.for('drizzle:Name')] === 'subscriptions') patches.push(patch);
          return chain;
        });
        return chain;
      }),
    };
    db.transaction.mockImplementation(async (callback: (transaction: typeof tx) => unknown) => callback(tx));
    createAppleFinancialReceipt.mockResolvedValue({ created: true });

    await processAppleNotificationEvent('old-refund');

    expect(createAppleFinancialReceipt).toHaveBeenCalledWith(expect.objectContaining({
      externalPaymentId: 'refund:old-transaction',
      grossAmountOverride: -1990,
    }));
    expect(patches).toHaveLength(1);
    expect(patches[0]).not.toHaveProperty('status');
    expect(patches[0]).not.toHaveProperty('endDate');
    expect(patches[0]).not.toHaveProperty('storeTransactionId');
  });

  it('zeros the deterministic refund row when Apple reverses a refund', async () => {
    const { processAppleNotificationEvent } = await import('./apple-notifications');
    const signedDate = new Date('2025-01-25T00:00:00Z').getTime();
    const transaction = {
      transactionId: 'transaction-reversed',
      originalTransactionId: 'original-reversed',
      productId: 'com.bibliainteligente.premium.monthly',
      purchaseDate: new Date('2025-01-01T00:00:00Z').getTime(),
      expiresDate: new Date('2025-02-01T00:00:00Z').getTime(),
      currency: 'BRL',
    };
    db.select.mockReturnValue(chainWith([{
      id: 'refund-reversed-event',
      notificationUuid: 'refund-reversed-uuid',
      notificationType: 'REFUND_REVERSED',
      processingStatus: 'pending',
      attemptCount: 0,
      environment: 'Production',
      isTest: false,
      decodedPayload: {
        notification: { signedDate },
        transaction,
        renewal: null,
      },
    }]));
    db.update.mockImplementation(() => updateChain());
    const selected = [
      [{
        id: 'sub-1',
        userId: 'user-1',
        status: 'refunded',
        storeTransactionId: 'transaction-reversed',
        endDate: new Date(transaction.expiresDate),
        storeStateSignedAt: null,
      }],
      [{
        grossAmount: -1990,
        providerRawData: {
          refundState: 'refunded',
          refundStateSignedAt: new Date('2025-01-20T00:00:00Z').toISOString(),
        },
      }],
    ];
    const tx = {
      execute: vi.fn(),
      select: vi.fn(() => chainWith(selected.shift() || [])),
      update: vi.fn(() => updateChain()),
    };
    db.transaction.mockImplementation(async (callback: (transaction: typeof tx) => unknown) => callback(tx));
    createAppleFinancialReceipt.mockResolvedValue({ created: false });

    await processAppleNotificationEvent('refund-reversed-event');

    expect(createAppleFinancialReceipt).toHaveBeenCalledWith(expect.objectContaining({
      externalPaymentId: 'refund:transaction-reversed',
      originalExternalPaymentId: 'transaction-reversed',
      grossAmountOverride: 0,
      status: 'refund_reversed',
    }));
  });
});