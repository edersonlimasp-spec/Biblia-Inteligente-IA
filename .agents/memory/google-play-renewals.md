---
name: Google Play subscription renewals
description: Why Google Play "recorrência" broke and the constraints on fixing renewal sync in this project.
---

Renewals never reach the DB by themselves: the server stores only the first period's expiry at purchase time. Google auto-renews on its side, but nothing updates `endDate`, so the 6h expirer revokes access at the end of period 1.

Key constraints learned:
- The Google **purchaseToken** (not the orderId) is what the Play Developer API needs to re-verify a subscription. Historically only the orderId was persisted, so legacy rows cannot be re-verified server-side; they only regain a token when the user triggers a purchase/restore from the device.
- Renewal orderIds differ per cycle (`GPA...-0`, `-1`, ...), so dedupe-by-orderId treats each renewal as a new purchase — matching by orderId alone never "updates" the original row.
- Fix pattern: persist the purchaseToken, and run a renewal sweep (re-verify subs expiring within 24h, including recently `expired` ones) BEFORE the generic mark-expired job. If the Google recheck fails, skip expiration that cycle — expiring unverified would revoke legitimately renewed subscribers.
- During Google grace period, `paymentState=0` with an extended expiry is normal and access should continue (Google's recommendation), so a future `expiryTimeMillis` is the right activity signal.
- There is no RTDN (Pub/Sub) webhook in this project; the sweep is the only server-side renewal channel unless RTDN is added.

**Why:** users complained that "a recorrência não está ocorrendo" — all Android subscribers lost access after the first billing period despite Google charging them.
