import { describe, expect, it } from 'vitest';
import {
  CDV_IAP_ERROR_CODES,
  isAppleIAPProductUnavailable,
  isAppleIAPUserCancellation,
} from '../iapErrors';

describe('iOS IAP error classification', () => {
  it('recognizes the cordova-plugin-purchase v13 cancellation code', () => {
    expect(isAppleIAPUserCancellation(CDV_IAP_ERROR_CODES.PAYMENT_CANCELLED)).toBe(true);
    expect(isAppleIAPUserCancellation('PAYMENT_CANCELLED')).toBe(true);
    expect(isAppleIAPUserCancellation('USER_CANCELLED')).toBe(true);
  });

  it('does not classify product or network errors as cancellation', () => {
    expect(isAppleIAPUserCancellation(CDV_IAP_ERROR_CODES.INVALID_PRODUCT_ID)).toBe(false);
    expect(isAppleIAPUserCancellation(6777014)).toBe(false);
  });

  it('separates invalid or unavailable products from network errors', () => {
    expect(isAppleIAPProductUnavailable(CDV_IAP_ERROR_CODES.INVALID_PRODUCT_ID)).toBe(true);
    expect(isAppleIAPProductUnavailable(CDV_IAP_ERROR_CODES.PRODUCT_NOT_AVAILABLE)).toBe(true);
    expect(isAppleIAPProductUnavailable(6777014)).toBe(false);
  });
});