# Bíblia Inteligente – Primeiros Textos + IA

## Overview

This fullstack Progressive Web App (PWA) provides an in-depth biblical reading experience by integrating original Hebrew/Greek texts, Strong's Dictionary, and an AI Professor. The application aims to democratize theological study through modern technology, offering features like personal annotations, audio recording, and offline capabilities. It targets a broad audience interested in biblical scholarship with a subscription model that includes a free trial for advanced AI features and lifetime Strong's access. The project's vision is to leverage technology to make theological study accessible and engaging, reaching a global market of biblical students and scholars.

## User Preferences

I want iterative development.
Ask before making major changes.
I prefer detailed explanations.
Do not make changes to the folder `Z`.
Do not make changes to the file `Y`.

## System Architecture

The application is a fullstack PWA with a React frontend, an Express backend, and PostgreSQL for data persistence.

**UI/UX Decisions:**
- **Design System:** Shadcn/UI with Tailwind CSS for a modern, responsive interface.
- **Theme:** Metallic Blue (`#1A5299`) as the primary color, with comprehensive dark mode support.
- **Typography:** Serif fonts for biblical texts, sans-serif for UI elements.
- **PWA Features:** Full PWA implementation including manifest, service worker for intelligent caching and offline support, optimized icons, and meta tags for native-like installation.
- **Access Rules:** Bible accessible to everyone without login. Strong's Dictionary and AI Professor require login, with tiered access based on subscription level.

**Technical Implementations & Feature Specifications:**
- **Authentication:** JWT with bcrypt for secure password hashing.
- **State Management:** TanStack Query v5 for frontend server state.
- **Bible Data:** Supports multiple versions (Portuguese, Spanish, English) with automated import and interlinear word-to-Strong mappings for Hebrew and Greek texts.
- **Strong's Dictionary:** Over 14,000 entries with Brazilian Portuguese translations, including a significant mapping of Portuguese words from Genesis to Hebrew Strong numbers. An advanced endpoint strategy prioritizes curated mappings and leverages a PDF-derived index for comprehensive word coverage across all 66 books.
- **AI Professor:** Utilizes OpenAI GPT-4o-mini for biblical explanations and exegesis, with mode validation, rate limiting, and persistent chat history.
- **User Features:** Subscription management, 30-day free trial, bookmarks, annotations, and audio recording with sharing capabilities.
- **Mobile App Distribution:** Configured with Capacitor for iOS and Android app store deployment, including native plugins and optimized icons for a native-like experience. This involves careful management of app icons, splash screens, and API routing for native environments to ensure seamless functionality and compliance with store review guidelines.
- **Subscription & Payment System:** Integrates Mercado Pago Checkout Pro for web and native In-App Purchases (Apple StoreKit, Google Play Billing) for mobile, with server-side verification and a detailed receipt system. Server-driven lifecycle events are ingested via store webhooks (see *Native Store Webhooks* below) so renewals/cancellations are captured even when the app is closed.
- **User Re-Engagement System:** Automated email campaigns for inactive users, managed via a cron-triggered endpoint and admin dashboard.
- **Admin Dashboard:** Provides insights into Google Play installs and subscription offers via dedicated cards, leveraging Google Play Developer Reporting API and Android Publisher API.

**System Design Choices:**
- **Monorepo Structure:** Organized into `server/`, `client/src/`, `shared/`, `scripts/`.
- **Database Schema:** Comprehensive schema covering `Users`, `Subscriptions`, `AIUsageLimits`, `Bookmarks`, `Annotations`, `AIHistory`, `strong_entries`, and other essential application data.
- **APIs:** Comprehensive RESTful API supporting all core functionalities.
- **Bible Version Selector:** Displays all available Bible versions with clear indicators for their availability status.

**Native Store Webhooks (server-driven renewal ingestion):**

Two unauthenticated POST endpoints receive lifecycle events from the stores. Both verify the request cryptographically and update `subscriptions` + append idempotent `payment_receipts` rows so the analytics in *Saúde das Assinaturas* reflect renewals/cancellations without depending on the app reopening.

- `POST /api/webhooks/apple/notifications` — App Store Server Notifications V2. Body is `{ signedPayload: <JWS> }`. Verification: parses the `x5c` certificate chain, checks each cert's validity window and chain integrity, pins the root to **Apple Root CA - G3** (SHA-256 fingerprint `B0:B1:73:0E:CB:C7:FF:45:05:14:2C:49:F1:29:5E:6E:DA:6B:CA:ED:7E:2C:68:C5:BE:91:B5:A1:10:01:F0:24`), then verifies the JWS with the leaf cert public key. Inner `signedTransactionInfo` is verified the same way. Configure the URL in App Store Connect → App Information → App Store Server Notifications (V2). Optional env: `APPLE_BUNDLE_ID` to reject notifications for the wrong bundle.
- `POST /api/webhooks/google/rtdn` — Google Play Real-time Developer Notifications. Body is the standard Pub/Sub push envelope `{ message: { data: <base64 JSON>, ... }, subscription }`. Configuration in Google Cloud + Play Console: create a Pub/Sub topic, grant `roles/pubsub.publisher` to `google-play-developer-notifications@system.gserviceaccount.com`, register the topic name in Play Console → Monetization setup → RTDN, then create an HTTPS push subscription pointing at this URL. For OIDC verification, set the push subscription's auth service account and `audience`, and set `GOOGLE_PUBSUB_AUDIENCE` on the server (when set, requests without a valid Google-signed OIDC token in `Authorization: Bearer …` are rejected). For each subscription event the handler calls `verifyGoogleSubscription` (existing service-account-based call) to fetch the authoritative state, then updates the row.

Both handlers respond `200 OK` immediately and process asynchronously to avoid retries. Subscriptions that the device hasn't yet bound to a `userId` (no row in `subscriptions` for that `originalTransactionId` / `orderId`) are skipped — they are reconciled on the next `/api/iap/verify` call.

Receipt idempotency is enforced at the database level by a unique index on `payment_receipts (payment_provider, external_payment_id)`, combined with `INSERT ... ON CONFLICT DO NOTHING`, so concurrent deliveries can't create duplicates. The Google handler **fails closed in production** when `GOOGLE_PUBSUB_AUDIENCE` is not configured — set it (and the corresponding `audience` on the Pub/Sub push subscription) before going live.

## External Dependencies

- **Database:** PostgreSQL (Neon)
- **ORM:** Drizzle ORM
- **AI:** OpenAI GPT-4o-mini (via Replit AI Integrations)
- **Payments:** Mercado Pago Checkout Pro, Apple StoreKit, Google Play Billing
- **Email:** Resend
- **Build Tool:** Vite
- **Mobile Wrapper:** Capacitor 6
- **Packages:** `bcryptjs`, `jsonwebtoken`, `jose` (JWS verification for Apple/Google webhooks), `@neondatabase/serverless`, `openai`, `resend`.