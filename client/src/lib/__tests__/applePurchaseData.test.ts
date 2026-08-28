import { describe, expect, it } from 'vitest';
import {
  extractAppleAppStoreReceipt,
  extractApplePurchaseData,
} from '../applePurchaseData';

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
});