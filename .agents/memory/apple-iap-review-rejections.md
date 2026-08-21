---
name: Apple IAP App Review rejections (2.1)
description: Why the iOS app keeps getting rejected for "error when attempting to purchase" and what is vs isn't fixable in code
---

# Apple IAP review rejections (guideline 2.1 / 2.1b)

When Apple rejects with a screenshot showing a purchase/store error, check these in order:

1. **Is the screenshot from a STALE compiled bundle?** Apple runs the archived IPA, not your current source. A rejection phrase may exist only in `dist/public/assets/index-*.js` or `ios/App/App/public/assets/index-*.js` and NOT in current `client/src`. Grep the BUILT bundle, not just source. Always `npm run build && npx cap sync ios` before archiving, then grep the synced iOS bundle to confirm legacy strings are gone.

2. **Manual App Store Connect steps (NOT code):**
   - The 5 IAP products must be attached to the version submission (App Store Connect → version page → "In-App Purchases" section) so the reviewer's sandbox can load them. If products aren't submitted with the binary, StoreKit returns "product not found" and the app shows an error → rejection.
   - **Paid Applications Agreement** must be active/signed (Business section). If unsigned, NO products load even in review.
   - IAP capability enabled on the App ID; provisioning profile regenerated after.

3. **Code-fixable failure modes worth keeping handled:**
   - `store.error()` (CdvPurchase) must RESOLVE the pending purchase promise, not just log — otherwise an async StoreKit error leaves the purchase hanging until the 120s timeout, which a reviewer experiences as a frozen/broken purchase.
   - In `cordova-plugin-purchase` v13, user cancellation is `PAYMENT_CANCELLED` (`6777006`); checking only legacy `6500`/`2` misclassifies a normal cancel as a store failure.
   - Apple’s exact invalid-product array is only surfaced in the plugin’s `bridge.loaded` diagnostic log. Capture that logger output when device-console access is unavailable.
   - User-facing error messages must NOT imply the binary is outdated/broken (e.g. avoid "update the app / new version in App Store") — that wording itself invites rejection.

**Why:** Repeated 2.1 rejections on this project were caused by (a) stale archived bundles and (b) missing manual App Store Connect config — the current TS source was already clean. Don't burn time rewriting code that's already correct; verify the build and the App Store Connect submission.
