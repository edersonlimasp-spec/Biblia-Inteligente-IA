interface AppleStoreLike {
  localReceipts?: unknown[];
}

export interface ApplePurchaseData {
  productId: string;
  transactionId: string;
  originalTransactionId: string;
  receiptData: string;
  jwsRepresentation: string;
  receiptSource: 'transaction' | 'localReceipt' | 'jws' | 'none';
}

function nonEmptyString(value: unknown): string {
  return typeof value === 'string' && value.length > 0 ? value : '';
}

function receiptFromLocalReceipt(receipt: any): string {
  const direct =
    nonEmptyString(receipt?.nativeData?.appStoreReceipt) ||
    nonEmptyString(receipt?.nativePurchase?.appStoreReceipt);
  if (direct) return direct;

  for (const transaction of receipt?.transactions || []) {
    const candidate =
      nonEmptyString(transaction?.nativePurchase?.appStoreReceipt) ||
      nonEmptyString(transaction?.transactionReceipt);
    if (candidate) return candidate;
  }

  return '';
}

function jwsFrom(value: any): string {
  return (
    nonEmptyString(value?.jwsRepresentation) ||
    nonEmptyString(value?.nativePurchase?.jwsRepresentation) ||
    nonEmptyString(value?.nativeData?.jwsRepresentation)
  );
}

/**
 * StoreKit 2 sends a signed transaction (JWS), rather than an application
 * receipt, on newer plugin/native combinations. It is intentionally returned
 * separately: callers must never log or persist its contents client-side.
 */
export function extractAppleJwsRepresentation(
  store: AppleStoreLike | null | undefined,
  transaction?: any,
): string {
  const direct = jwsFrom(transaction);
  if (direct) return direct;
  for (const receipt of store?.localReceipts || []) {
    const receiptJws = jwsFrom(receipt);
    if (receiptJws) return receiptJws;
    for (const localTransaction of (receipt as any)?.transactions || []) {
      const transactionJws = jwsFrom(localTransaction);
      if (transactionJws) return transactionJws;
    }
  }
  return '';
}

/**
 * cordova-plugin-purchase v13 stores the StoreKit 1 application receipt on
 * Receipt.nativeData. Older app builds exposed variants on nativePurchase or
 * transactionReceipt, so those remain supported for backward compatibility.
 */
export function extractAppleAppStoreReceipt(
  store: AppleStoreLike | null | undefined,
  transaction?: any,
): string {
  const transactionReceipt =
    nonEmptyString(transaction?.nativePurchase?.appStoreReceipt) ||
    nonEmptyString(transaction?.transactionReceipt);
  if (transactionReceipt) return transactionReceipt;

  for (const receipt of store?.localReceipts || []) {
    const candidate = receiptFromLocalReceipt(receipt);
    if (candidate) return candidate;
  }

  return '';
}

export function extractApplePurchaseData(
  transaction: any,
  store: AppleStoreLike | null | undefined,
  fallbackProductId = '',
): ApplePurchaseData {
  const productId =
    nonEmptyString(transaction?.products?.[0]?.id) ||
    nonEmptyString(transaction?.productId) ||
    fallbackProductId;
  const transactionId =
    nonEmptyString(transaction?.transactionId) ||
    nonEmptyString(transaction?.nativePurchase?.transactionId);
  const originalTransactionId =
    nonEmptyString(transaction?.originalTransactionId) ||
    nonEmptyString(transaction?.nativePurchase?.originalTransactionIdentifier) ||
    nonEmptyString(transaction?.nativePurchase?.originalTransactionId) ||
    transactionId;

  const receiptData = extractAppleAppStoreReceipt(store, transaction);
  const jwsRepresentation = receiptData ? '' : extractAppleJwsRepresentation(store, transaction);
  const transactionReceipt =
    nonEmptyString(transaction?.nativePurchase?.appStoreReceipt) ||
    nonEmptyString(transaction?.transactionReceipt);
  return {
    productId,
    transactionId,
    originalTransactionId,
    receiptData,
    jwsRepresentation,
    receiptSource: receiptData
      ? transactionReceipt ? 'transaction' : 'localReceipt'
      : jwsRepresentation ? 'jws' : 'none',
  };
}