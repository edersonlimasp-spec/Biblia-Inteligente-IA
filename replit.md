# Bíblia Inteligente – Primeiros Textos + IA

## Overview

This fullstack Progressive Web App (PWA), developed in TypeScript with React, Express, and PostgreSQL, offers a comprehensive biblical reading experience. It integrates original Hebrew/Greek texts, Strong's Dictionary, and an AI Professor powered by OpenAI GPT-4o-mini. The application aims to make in-depth theological study accessible through modern technology, providing features like personal annotations, audio recordings for sermons, offline capabilities, and a seamless PWA experience for iOS and Android. A subscription model with a free trial monetizes advanced AI features and lifetime Strong's access, targeting a broad audience interested in biblical study.

## User Preferences

I want iterative development.
Ask before making major changes.
I prefer detailed explanations.
Do not make changes to the folder `Z`.
Do not make changes to the file `Y`.

## System Architecture

The application is a fullstack PWA comprising a React frontend and an Express backend, using PostgreSQL for data persistence.

**UI/UX Decisions:**
- **Design System:** Utilizes Shadcn/UI with Tailwind CSS for a modern, responsive interface.
- **Theme:** Metallic Blue (`#1A5299`) as the primary color, with comprehensive dark mode support.
- **Typography:** Serif fonts for biblical texts and sans-serif for UI elements.
- **PWA Features:** Full PWA implementation including manifest, service worker for intelligent caching and offline support, optimized icons, and meta tags for native-like installation on iOS and Android.
- **Guest-First Architecture:** Users can access the Bible reader directly without login, with a 30-day guest trial for Strong's and essential AI features, tracked by a `deviceId`. Login is required only for subscription.

**Technical Implementations & Feature Specifications:**
- **Authentication:** JWT with bcrypt for secure password hashing.
- **State Management:** TanStack Query v5 for server state management in the frontend.
- **Bible Data:** Multiple Bible versions available with automated import scripts:
  - **Portuguese:** ACF (31,106 verses), ARC (29,779 verses), NVI (29,779 verses)
  - **Spanish:** RVR1960 Reina Valera (30,819 verses)
  - **English:** KJV King James (31,102 verses)
- **Strong's Dictionary:** Contains 14,197 entries (5,523 Greek + 8,674 Hebrew) with complete Brazilian Portuguese translations (`portugueseDef` field). The word-to-Strong lookup uses a database-only search with relevance-based ordering, prioritizing Portuguese definitions and filtering by testament.
- **AI Professor:** Integrates OpenAI GPT-4o-mini via Replit AI Integrations, offering "Essential" (basic explanations, 1024 tokens) and "Premium" (deep exegesis, 2048 tokens) modes. Features include mode validation, rate limiting (30 questions/day for trial/Gold, 100 for Premium), and a multi-session chat system with persistent, append-only conversation history stored in localStorage.
- **User Features:**
    - **Subscriptions:** Manages Gold and Premium plans.
    - **Trial System:** 30-day free trial providing access to Strong's and AI Essential.
    - **Bookmarks & Annotations:** Users can create and manage personal bookmarks and notes on verses.
    - **Audio Recordings:** Record sermons/messages with IndexedDB local storage, playback controls, and sharing via WhatsApp, Email, and Web Share API.

**System Design Choices:**
- **Monorepo Structure:** Divided into `server/` (backend), `client/src/` (frontend), `shared/` (shared schemas), and `scripts/` (utilities).
- **Database Schema:** Includes tables for `Users`, `Subscriptions`, `AIUsageLimits`, `Bookmarks`, `Annotations`, `AIHistory`, `strong_entries` (with `portugueseDef` fully populated), `guests`, `guest_ai_usage_limits`, and `app_events`.
- **APIs:** Comprehensive RESTful API endpoints for authentication, subscriptions, AI interactions, content, and dictionary lookups.
- **Bible Version Selector:** All 16 versions visible in dropdown. Commercial versions show lock icon and trigger license modal on selection attempt. Backend handles fallback to language default if version has no data.

**Recent Changes (Dec 24, 2025):**
- Added comprehensive logging to Bible API (`[Bible API]` prefixed logs)
- Implemented `handleVersionChange` in BibleReader with React Query cache invalidation
- Enhanced AlmeidaVersionSelector with Dialog modal for unavailable versions
- Added debug endpoints: `/api/debug/bible`, `/api/debug/build-info`, `/api/admin/debug/subscriptions`
- Version selector shows all 16 versions with proper indicators (Check=available, Lock=commercial, AlertCircle=fallback pending)
- **Centralized AI Quota System:** Permanent quota for AI questions (Guest: 2 questions, User: 5 total including migrated guest count). Counter displayed as "X/Y" format next to Send button.
- **Admin Conversion Metrics Dashboard:** New section showing subscription redirects and conversions per day/month with conversion rate (%) and 30-day trend chart. Endpoint: `/api/admin/metrics/conversion`
- **Event Tracking:** SubscriptionScreen now tracks page visits for conversion analytics
- **Recording/Agenda Usage Limits:** Tiered limits based on subscription (Free: 3, Gold: 30, Premium: 100). Counter shown as "X/Y" format. Limit modal prompts upgrade when capacity reached.

## Mobile App Distribution (Capacitor)

The project is configured with **Capacitor** to wrap the existing React web app for publication on iOS App Store and Google Play Store.

**Configuration:**
- `capacitor.config.ts` - Main Capacitor configuration
- `client/src/lib/capacitor.ts` - Platform detection utilities
- `CAPACITOR_SETUP.md` - Complete build and publication guide

**Installed Plugins:**
- `@capacitor/splash-screen` - Native splash screen
- `@capacitor/status-bar` - Status bar styling
- `@capacitor/app` - App lifecycle events, deep linking
- `@capacitor/keyboard` - Keyboard visibility handling
- `@capacitor/haptics` - Haptic feedback

**Build Commands:**
```bash
npm run build        # Build web assets
npx cap sync         # Sync to native projects
npx cap open android # Open in Android Studio
npx cap open ios     # Open in Xcode
```

## Mercado Pago Integration (Checkout Pro)

The application uses Mercado Pago Checkout Pro for subscription payments with automatic activation via webhooks.

**Endpoints:**
- `POST /api/mp/create-checkout` - Creates checkout preference (requires auth). Sends `external_reference` and `metadata` with userId/plan
- `POST /api/mp/webhook` - Receives payment/subscription notifications. Responds 200 immediately, processes async
- `GET /api/mp/webhook` - Verifies webhook endpoint is online
- `GET /api/mp/health` - Health check: returns `{ok: true, webhookUrl, hasToken}`
- `GET /api/mp/last-webhook` - Returns last webhook received (stored 15 min) for debugging
- `GET /api/subscription/status` - Returns user subscription status (requires auth)

**Plans and Prices (Fixed - BRL):**
- **Gold:** R$ 9,90/mês (30 days)
- **Premium:** R$ 19,90/mês (30 days)
- **Vitalício (Strong Lifetime):** R$ 49,90 único (lifetime access)

**Environment Variables Required:**
- `MP_ACCESS_TOKEN` - Mercado Pago Access Token (PRODUCTION token for production)

**Return Pages:**
- `/mp/return?status=success` -> Redirects to `/pagamento/sucesso`
- `/mp/return?status=failure` -> Redirects to `/pagamento/erro`
- `/mp/return?status=pending` -> Redirects to `/pagamento/pendente`

**Webhook Configuration (Mercado Pago Dashboard):**
1. URL: `https://bibliainteligente.replit.app/api/mp/webhook`
2. Events to enable: "Pagamentos" (payments) AND "Planos e assinaturas" (subscriptions)
3. Mode: PRODUCTION (not test mode)

**User Identification in Webhook (Priority Order):**
1. `external_reference` (JSON with userId, plan)
2. `metadata.userId` or `metadata.user_id`
3. `payer.email` (last resort - matches user by email)

**How Activation Works:**
1. Checkout sends `external_reference` + `metadata` with userId/plan
2. Mercado Pago sends POST to /api/mp/webhook
3. Webhook responds 200 immediately, processes async
4. Fetches payment/preapproval details from MP API
5. If status is approved/authorized/active, activates subscription via `storage.upsertSubscription()`
6. Logs prefixed with `[MP Webhook]` show entire flow

**Testing Guide:**
1. Check health: `curl https://bibliainteligente.replit.app/api/mp/health`
2. Make a test payment (use real Mercado Pago account)
3. Check logs for `[MP Webhook]` entries
4. Check last webhook: `curl https://bibliainteligente.replit.app/api/mp/last-webhook`
5. Verify subscription: `/api/subscription/status` or admin panel

## External Dependencies

- **Database:** PostgreSQL (Neon)
- **ORM:** Drizzle ORM
- **AI:** OpenAI GPT-4o-mini (via Replit AI Integrations)
- **Payments:** Mercado Pago Checkout Pro
- **Build Tool:** Vite
- **Mobile Wrapper:** Capacitor 6
- **Packages:** `bcryptjs`, `jsonwebtoken`, `@neondatabase/serverless`, `openai`.
