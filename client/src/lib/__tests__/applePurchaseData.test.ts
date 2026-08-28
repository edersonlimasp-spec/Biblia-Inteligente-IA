import { describe, expect, it } from 'vitest';
import {
  extractAppleAppStoreReceipt,
  extractApplePurchaseData,
  extractAppleJwsRepresentation,
} from '../applePurchaseData';
import { getAppleReceiptRefreshStrategy } from '../inAppPurchases';

describe('Apple purchase data extraction', () => {
  it('reads the StoreKit 1 receipt from the cordova-plugin-purchase v13 shape', () => {
    const store = {
      localReceipts: [{
        platform: 'ios-appstore',
        nativeData: { appStoreReceipt: 'base64-v13-receipt' },
        transactions: [],
      }],
    };

    expect(extractAppleAppStoreReceipt(store)).toBe('base64-v13-receipt');
  });

  it('normalizes direct v13 transaction identifiers', () => {
    const transaction = {
      products: [{ id: 'com.example.premium.monthly' }],
      transactionId: '2000000123456789',
      originalTransactionId: '2000000123000000',
    };
    const store = {
      localReceipts: [{
        nativeData: { appStoreReceipt: 'base64-receipt' },
      }],
    };

    expect(extractApplePurchaseData(transaction, store)).toEqual({
      productId: 'com.example.premium.monthly',
      transactionId: '2000000123456789',
      originalTransactionId: '2000000123000000',
      receiptData: 'base64-receipt',
      jwsRepresentation: '',
      receiptSource: 'localReceipt',
    });
  });

  it('keeps compatibility with legacy nativePurchase fields', () => {
    const transaction = {
      productId: 'com.example.strong.lifetime',
      nativePurchase: {
        transactionId: 'legacy-transaction',
        originalTransactionIdentifier: 'legacy-original',
        appStoreReceipt: 'legacy-receipt',
      },
    };

    expect(extractApplePurchaseData(transaction, null)).toEqual({
      productId: 'com.example.strong.lifetime',
      transactionId: 'legacy-transaction',
      originalTransactionId: 'legacy-original',
      receiptData: 'legacy-receipt',
      jwsRepresentation: '',
      receiptSource: 'transaction',
    });
  });

  it('falls back to transactionId for a missing original transaction ID', () => {
    const data = extractApplePurchaseData({
      products: [{ id: 'com.example.product' }],
      transactionId: 'transaction-id',
      transactionReceipt: 'transaction-receipt',
    }, null);

    expect(data.originalTransactionId).toBe('transaction-id');
  });

  it('extracts a StoreKit 2 JWS when no base64 application receipt exists', () => {
    const transaction = {
      products: [{ id: 'com.example.product' }],
      transactionId: 'storekit2-transaction',
      nativePurchase: { jwsRepresentation: 'signed.storekit2.transaction' },
    };

    expect(extractAppleJwsRepresentation(null, transaction)).toBe('signed.storekit2.transaction');
    expect(extractApplePurchaseData(transaction, null)).toMatchObject({
      receiptData: '',
      jwsRepresentation: 'signed.storekit2.transaction',
      receiptSource: 'jws',
    });
  });

  it('prefers the base64 receipt over a JWS when both are available', () => {
    const data = extractApplePurchaseData({
      transactionId: 'transaction-id',
      transactionReceipt: 'base64-receipt',
      jwsRepresentation: 'signed.transaction',
    }, null);

    expect(data.receiptData).toBe('base64-receipt');
    expect(data.jwsRepresentation).toBe('');
    expect(data.receiptSource).toBe('transaction');
  });
});

describe('Apple receipt refresh adapter selection', () => {
  it('uses the concrete StoreKit adapter receipt refresh when available', () => {
    expect(getAppleReceiptRefreshStrategy({ refreshReceipt: () => undefined }))
      .toBe('refreshReceipt');
  });

  it('uses forceReceiptReload plus loadReceipts only as an adapter fallback', () => {
    expect(getAppleReceiptRefreshStrategy({
      forceReceiptReload: false,
      loadReceipts: () => undefined,
    })).toBe('forceReloadAndLoad');
    expect(getAppleReceiptRefreshStrategy({ loadReceipts: () => undefined })).toBe('unavailable');
  });
});