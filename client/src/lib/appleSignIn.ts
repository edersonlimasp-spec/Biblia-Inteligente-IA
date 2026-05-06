/**
 * Sign in with Apple — wrapper para @capacitor-community/apple-sign-in
 *
 * REQUER (passos manuais fora deste repositório):
 *   1. Apple Developer Console:
 *      - Habilitar a capability "Sign in with Apple" no App ID
 *        com.bibliainteligente.app
 *   2. Xcode (App.xcworkspace):
 *      - Signing & Capabilities → + Capability → Sign in with Apple
 *      - Isso adiciona o entitlement App.entitlements automaticamente.
 *      - O Codemagic detecta entitlements no project após o cap sync.
 *
 * No Android e na Web este módulo retorna { available: false } e o
 * fluxo de Google Login segue ativo normalmente.
 */

import { isIOS, isNative } from "./capacitor";

export interface AppleSignInResult {
  identityToken: string;
  authorizationCode?: string;
  user?: string;
  email?: string | null;
  fullName?: { givenName?: string | null; familyName?: string | null } | null;
  /** Nonce em texto puro enviado à Apple. O backend valida SHA256(nonce) === payload.nonce */
  nonce: string;
}

export function isAppleSignInAvailable(): boolean {
  return isNative && isIOS;
}

export async function signInWithApple(): Promise<AppleSignInResult> {
  if (!isAppleSignInAvailable()) {
    throw new Error("Sign in with Apple só está disponível no iOS nativo.");
  }

  // Import dinâmico para não pesar no bundle web/Android
  const { SignInWithApple } = await import("@capacitor-community/apple-sign-in");

  const nonce = cryptoRandomNonce();
  const options = {
    clientId: "com.bibliainteligente.app",
    redirectURI: "https://bibliainteligente.app/auth/apple/callback",
    scopes: "email name",
    state: "biblia-inteligente-ios",
    nonce,
  };

  const response = await SignInWithApple.authorize(options);
  const r = response.response;

  if (!r?.identityToken) {
    throw new Error("Apple não retornou identityToken.");
  }

  return {
    identityToken: r.identityToken,
    authorizationCode: r.authorizationCode,
    user: r.user,
    email: r.email ?? null,
    fullName: r.givenName || r.familyName
      ? { givenName: r.givenName ?? null, familyName: r.familyName ?? null }
      : null,
    nonce,
  };
}

function cryptoRandomNonce(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, "0")).join("");
}
