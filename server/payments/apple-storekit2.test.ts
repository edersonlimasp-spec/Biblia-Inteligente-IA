import { afterEach, describe, expect, it, vi } from 'vitest';

const verifyAndDecodeTransaction = vi.fn();
const SignedDataVerifier = vi.fn(function () {
  return { verifyAndDecodeTransaction };
});
const dbTransaction = vi.fn();

vi.mock('@apple/app-store-server-library', () => ({
  Environment: { SANDBOX: 'Sandbox', PRODUCTION: 'Production' },
  SignedDataVerifier,
}));

// The payment module normally imports a configured database. These verifier
// tests intentionally exercise no persistence.
vi.mock('../db', () => ({ db: { transaction: dbTransaction } }));

const savedEnvironment = { ...process.env };
afterEach(() => {
  process.env = { ...savedEnvironment };
  vi.clearAllMocks();
});

describe('StoreKit 2 JWS verifier configuration', () => {
  it('allows sandbox verification without an Apple app ID', async () => {
    process.env.APPLE_STOREKIT_ENVIRONMENT = 'sandbox';
    delete process.env.APPLE_APP_ID;
    verifyAndDecodeTransaction.mockResolvedValueOnce({ transactionId: 'tx' });

    const { verifyAppleStoreKit2Transaction } = await import('./apple');
    await expect(verifyAppleStoreKit2Transaction('opaque-jws')).resolves.toEqual({ transactionId: 'tx' });
    expect(SignedDataVerifier).toHaveBeenCalledWith(
      expect.any(Array), true, 'Sandbox', expect.any(String), undefined,
    );
  });

  it('requires the non-secret App Store Connect numeric ID in production', async () => {
    process.env.APPLE_STOREKIT_ENVIRONMENT = 'production';
    delete process.env.APPLE_APP_ID;

    const { verifyAppleStoreKit2Transaction } = await import('./apple');
    await expect(verifyAppleStoreKit2Transaction('opaque-jws'))
      .rejects.toThrow('APPLE_APP_ID must be a positive numeric App Store Connect app ID in production');
  });

  it('tries production then sandbox for TestFlight on a production server', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.APPLE_STOREKIT_ENVIRONMENT;
    process.env.APPLE_APP_ID = '1234567890';
    verifyAndDecodeTransaction
      .mockRejectedValueOnce(new Error('not a production JWS'))
      .mockResolvedValueOnce({ transactionId: 'sandbox-tx', environment: 'Sandbox' });

    const { verifyAppleStoreKit2Transaction } = await import('./apple');
    await expect(verifyAppleStoreKit2Transaction('opaque-jws')).resolves.toEqual({
      transactionId: 'sandbox-tx',
      environment: 'Sandbox',
    });
    expect(SignedDataVerifier).toHaveBeenNthCalledWith(
      1, expect.any(Array), true, 'Production', expect.any(String), 1234567890,
    );
    expect(SignedDataVerifier).toHaveBeenNthCalledWith(
      2, expect.any(Array), true, 'Sandbox', expect.any(String), undefined,
    );
    expect(verifyAndDecodeTransaction).toHaveBeenCalledTimes(2);
  });
});

describe('Apple verified entitlement safety', () => {
  it('recognizes StoreKit 1 cancellation and refund markers', async () => {
    const { isAppleTransactionCancelled } = await import('./apple');
    expect(isAppleTransactionCancelled({ cancellation_date_ms: '1735689600000' })).toBe(true);
    expect(isAppleTransactionCancelled({ cancellation_date: '2025-01-01 00:00:00 Etc/GMT' })).toBe(true);
    expect(isAppleTransactionCancelled({})).toBe(false);
  });

  it('updates the stored tier from the verified forward transaction product', async () => {
    const { appleVerifiedProductPatch } = await import('./apple');
    expect(appleVerifiedProductPatch(
      'com.bibliainteligente.premium.monthly',
      'new-renewal-transaction',
    )).toEqual({
      storeTransactionId: 'new-renewal-transaction',
      storeProductId: 'com.bibliainteligente.premium.monthly',
      planType: 'premium',
      amount: '19.90',
    });
  });

  it('serializes duplicate delivery and rejects a cross-user claim', async () => {
    type StoredRow = Record<string, any>;
    const state: { subscription?: StoredRow; receipt?: StoredRow } = {};
    const execute = vi.fn().mockResolvedValue(undefined);
    const tableName = (table: any) => table?.[Symbol.for('drizzle:Name')];

    const tx = {
      execute,
      select: vi.fn(() => {
        let fromTable: any;
        const chain = {
          from(table: any) {
            fromTable = table;
            return chain;
          },
          where() {
            return chain;
          },
          async limit() {
            switch (tableName(fromTable)) {
              case 'subscriptions': return state.subscription ? [state.subscription] : [];
              case 'payment_receipts': return state.receipt ? [state.receipt] : [];
              case 'users': return [{ email: 'owner@example.com' }];
              default: throw new Error(`Unexpected select table ${tableName(fromTable)}`);
            }
          },
        };
        return chain;
      }),
      insert: vi.fn((table: any) => {
        let values: StoredRow;
        const chain = {
          values(row: StoredRow) {
            values = row;
            return chain;
          },
          async onConflictDoNothing() {
            if (tableName(table) === 'subscriptions' && !state.subscription) {
              state.subscription = { id: 'sub-1', createdAt: new Date(), ...values };
            } else if (tableName(table) === 'payment_receipts' && !state.receipt) {
              state.receipt = { id: 'receipt-1', createdAt: new Date(), ...values };
            }
          },
        };
        return chain;
      }),
      update: vi.fn(() => {
        const chain = {
          set() { return chain; },
          async where() {},
        };
        return chain;
      }),
    };
    dbTransaction.mockImplementation(async (callback: (transaction: typeof tx) => unknown) => callback(tx));

    const { processAppleStoreKit2Purchase } = await import('./apple');
    const request = {
      signedTransaction: 'opaque-jws',
      productId: 'com.bibliainteligente.gold.monthly',
      transactionId: 'transaction-1',
      originalTransactionId: 'original-1',
    };
    const verified = {
      ...request,
      purchaseDate: Date.now() - 1_000,
      expiresDate: Date.now() + 30 * 86_400_000,
      environment: 'Sandbox',
    };

    await expect(processAppleStoreKit2Purchase('owner', request, verified)).resolves.toMatchObject({ success: true });
    await expect(processAppleStoreKit2Purchase('owner', request, verified)).resolves.toMatchObject({ success: true });
    await expect(processAppleStoreKit2Purchase('attacker', request, verified)).resolves.toEqual({
      success: false,
      error: 'Transaction already linked to another account',
    });

    expect(state.subscription?.userId).toBe('owner');
    expect(state.receipt?.userId).toBe('owner');
    expect(tx.insert).toHaveBeenCalledTimes(4); // two idempotent inserts per owner delivery
    expect(execute).toHaveBeenCalledTimes(6); // two advisory locks per attempted delivery
    for (const [query] of execute.mock.calls) {
      expect(JSON.stringify(query)).toContain('pg_advisory_xact_lock');
    }
  });
});