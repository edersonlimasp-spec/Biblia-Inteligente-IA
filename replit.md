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

The application uses Mercado Pago Checkout Pro for subscription payments.

**Endpoints:**
- `POST /api/mp/create-checkout` - Creates a Mercado Pago checkout preference (requires authentication)
- `POST /api/mp/webhook` - Webhook to receive payment confirmations from Mercado Pago

**Plans and Prices (Fixed - BRL):**
- **Gold:** R$ 9,90/mês (30 days)
- **Premium:** R$ 19,90/mês (30 days)
- **Vitalício (Strong Lifetime):** R$ 49,90 único (lifetime access)

**Environment Variables Required:**
- `MP_ACCESS_TOKEN` - Mercado Pago Access Token (Secret)
- `APP_URL` - Optional, auto-detected from REPLIT_DOMAINS if not set

**Return Pages:**
- `/pagamento/sucesso` - Payment successful
- `/pagamento/erro` - Payment failed
- `/pagamento/pendente` - Payment pending

**Webhook Configuration:**
Configure the webhook URL in Mercado Pago Dashboard:
`https://<your-domain>/api/mp/webhook`

## External Dependencies

- **Database:** PostgreSQL (Neon)
- **ORM:** Drizzle ORM
- **AI:** OpenAI GPT-4o-mini (via Replit AI Integrations)
- **Payments:** Mercado Pago Checkout Pro
- **Build Tool:** Vite
- **Mobile Wrapper:** Capacitor 6
- **Packages:** `bcryptjs`, `jsonwebtoken`, `@neondatabase/serverless`, `openai`.