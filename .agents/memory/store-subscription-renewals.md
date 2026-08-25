---
name: Store subscription renewals (Google + Apple)
description: How renewal sync works for both stores after the ago-2026 fix — sweep, RTDN webhook, ownership rules, and expiry gating.
---

Both stores had the same flaw: the server stored only the first period's expiry and never re-checked, so the 6h expirer revoked renewed subscribers. Fixed for both.

Renewal credentials persisted in `subscriptions.storePurchaseToken`:
- Google: the purchaseToken (orderId changes per cycle and is useless for re-verification).
- Apple: the raw base64 receiptData (the only thing `/verifyReceipt` accepts; not previously persisted anywhere).

Sweep (every 6h, before mark-expired): re-verify subs with a stored credential, endDate < now+24h, status active OR expired. Expiry gating: if any verification failed transiently, `markExpiredSubscriptions` is skipped that whole cycle (global gate — could be evolved to per-row). Permanent invalidity is distinguished from transient failure: Google 400/404/410 = token gone → row expired; Apple only status 21005/network = transient.

RTDN webhook `POST /api/iap/rtdn/google?token=<GOOGLE_RTDN_TOKEN>` (Pub/Sub push): payload is never trusted — only points at a purchaseToken which is re-verified with Google. Guard middleware in server/index.ts runs BEFORE the global 50mb express.json (token, 120/min rate limit, 64KB max body) — keep it there or unauthenticated callers can exhaust memory. Transient failures return 503 so Pub/Sub retries. Needs Play Console → Monetização → RTDN configured with the full URL incl. token.

Ownership rule: a purchase row found by originalTransactionId/orderId that belongs to another userId is rejected, never silently re-bound (shared devices).

Client auto-sync once per session ~4s after store init: Android does a silent restore (queryPurchases is silent); iOS must NOT call native restorePurchases at launch (may prompt for Apple password) — it only POSTs the local appStoreReceipt if present. Apple restore no longer skips existing rows, so it now propagates renewals too.

**Why:** subscribers on both platforms lost access after period 1 despite being charged; legacy rows without a stored credential only heal via the client auto-sync/restore path.
