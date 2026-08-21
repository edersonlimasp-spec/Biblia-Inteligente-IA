// Códigos públicos do cordova-plugin-purchase v13.
// Mantidos aqui para que o cancelamento continue sendo reconhecido mesmo
// quando o objeto global CdvPurchase ainda não estiver acessível no catch.
export const CDV_IAP_ERROR_CODES = {
  PAYMENT_CANCELLED: 6777006,
  INVALID_PRODUCT_ID: 6777012,
  PRODUCT_NOT_AVAILABLE: 6777023,
} as const;

export function isAppleIAPUserCancellation(
  code: unknown,
  runtimePaymentCancelledCode?: unknown,
): boolean {
  return code === runtimePaymentCancelledCode ||
    code === CDV_IAP_ERROR_CODES.PAYMENT_CANCELLED ||
    code === 6500 ||
    code === 2 ||
    code === 'USER_CANCELLED' ||
    code === 'PAYMENT_CANCELLED';
}

export function isAppleIAPProductUnavailable(
  code: unknown,
  runtimeInvalidProductCode?: unknown,
  runtimeProductUnavailableCode?: unknown,
): boolean {
  return code === runtimeInvalidProductCode ||
    code === runtimeProductUnavailableCode ||
    code === CDV_IAP_ERROR_CODES.INVALID_PRODUCT_ID ||
    code === CDV_IAP_ERROR_CODES.PRODUCT_NOT_AVAILABLE ||
    code === 'INVALID_PRODUCT_ID' ||
    code === 'PRODUCT_NOT_AVAILABLE';
}