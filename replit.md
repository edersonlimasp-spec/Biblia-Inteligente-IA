# Bíblia Inteligente – Primeiros Textos + IA

## Overview

This fullstack Progressive Web App (PWA) provides an in-depth biblical reading experience by integrating original Hebrew/Greek texts, Strong's Dictionary, and an AI Professor powered by OpenAI GPT-4o-mini. Developed with TypeScript, React, Express, and PostgreSQL, the application aims to democratize theological study through modern technology. Key features include personal annotations, audio recording for sermons, offline capabilities, and a seamless PWA experience across iOS and Android. The project utilizes a subscription model with a free trial to monetize advanced AI features and lifetime Strong's access, targeting a broad audience interested in biblical scholarship.

## User Preferences

I want iterative development.
Ask before making major changes.
I prefer detailed explanations.
Do not make changes to the folder `Z`.
Do not make changes to the file `Y`.

## System Architecture

The application is a fullstack PWA consisting of a React frontend and an Express backend, utilizing PostgreSQL for data persistence.

**UI/UX Decisions:**
- **Design System:** Shadcn/UI with Tailwind CSS for a modern, responsive interface.
- **Theme:** Metallic Blue (`#1A5299`) as the primary color, with comprehensive dark mode support.
- **Typography:** Serif fonts for biblical texts, sans-serif for UI elements.
- **PWA Features:** Full PWA implementation including manifest, service worker for intelligent caching and offline support, optimized icons, and meta tags for native-like installation.
- **Access Rules (Updated Jan 2026):** 
  - **Bible:** Accessible to everyone without login
  - **Strong's Dictionary:** Requires login. Free users (without subscription) get 2 words total. Gold: 20/day. Premium/Lifetime: unlimited.
  - **AI Professor:** Requires login. Free users: 5 questions total. Gold: 30/day. Premium: 100/day.

**Technical Implementations & Feature Specifications:**
- **Authentication:** JWT with bcrypt for secure password hashing.
- **State Management:** TanStack Query v5 for frontend server state.
- **Bible Data:** Multiple versions (Portuguese: ACF, ARC, NVI; Spanish: RVR1960; English: KJV) with automated import.
- **Strong's Dictionary:** 14,197 entries (Greek/Hebrew) with Brazilian Portuguese translations; word-to-Strong lookup prioritizes Portuguese definitions and filters by testament.
- **Genesis Strong Mappings (Jan 2026):** 3,465 unique Portuguese words from Genesis mapped to Hebrew Strong numbers, extracted from Almeida Revista e Atualizada with Strong's.
- **Interlinear Bible Data:** 438,754 word-to-Strong mappings — OT (300,764 Hebrew words across 39 books, from OSHB via `morphhb`) + NT (137,990 Greek words across all 27 books, from unfoldingWord UGNT, CC BY-SA 4.0). 99.3% of NT words have a Portuguese single-word gloss.
- **Strong words endpoint (Apr 2026):** `/api/bible/:bookId/:chapter/strong-words` returns both legacy `strongWords` (per-verse word lists) AND `strongMap` (per-verse word→Strong number map). The map enables a fast-path click that opens the Strong modal directly without an extra `/api/strong/search` round-trip. Server expands Portuguese inflection variants of each gloss (céu→céus, homem→homens, ração→rações, etc) so flexed words in the verse text also match. Client memoizes verse tokenization to avoid re-tokenizing on highlights/selections. NT import script: `scripts/import-greek-nt-ugnt.ts`.
- **PDF SBB Strong cobertura (Apr 2026 — endpoint Strategy 3):** Tabela `pdf_word_index(book_id, word_norm, strong_number, occurrences)` populada a partir do PDF de referência "Almeida Revista e Atualizada com números de Strong" (SBB 1993). Total: **109.842 entradas** = palavra portuguesa normalizada → Strong mais frequente naquele livro, extraídas de **339.347 pares** (palavra→Strong) cobrindo **todos os 66 livros**. Pipeline: `scripts/analysis/parse-pdf-words-flat.mjs` lê `/tmp/biblia.txt` (PDF extraído via `pdftotext -layout`) e gera `/tmp/pdf-word-index.json`; `scripts/analysis/populate-pdf-word-index.mjs` faz UPSERT transacional na tabela. O endpoint Strong-words consulta esse índice como **Strategy 3** (após bible_words e curated mappings) — Strategies 1 e 2 ganham no conflito; PDF index só preenche lacunas. **Cobertura medida** após Strategy 3 (palavras com 4+ chars no texto que retornam Strong): **VT 91.94%, NT 87.26%, geral 90.26%** (3 capítulos por livro como amostra). Antes do índice, livros como Filemom (phm), Lamentações (lam), 2/3João, Obadias e Judas tinham praticamente zero palavras clicáveis.
- **AI Professor:** OpenAI GPT-4o-mini via Replit AI Integrations, offering "Essential" (basic explanations) and "Premium" (deep exegesis) modes. Includes mode validation, rate limiting, and persistent multi-session chat history.
- **User Features:** Subscription management (Gold, Premium), 30-day free trial, bookmarks, annotations, and audio recording with IndexedDB storage and sharing capabilities.
- **Mobile App Distribution:** Configured with Capacitor for iOS and Android app store deployment, including native splash screen, status bar, app lifecycle, keyboard, and haptics plugins.
  - **Android v1.0.19 (Apr 2026):** Native app routes API calls to `https://bibliainteligente.replit.app` (via `Capacitor.getPlatform()` detection in `client/src/lib/queryClient.ts`) so reviewer credentials work from the installed APK. AAB at `public/bibliainteligente-v1.0.19.aab` (versionCode 19). Bootstrap endpoint `POST /api/internal/ensure-reviewer-premium` (header `x-bootstrap-token: <SESSION_SECRET>`) idempotently provisions reviewer `reviewer@bibliainteligente.com` / `GooglePlay@2025!` with Premium until 2099-12-31.
  - **Native API URL fix (Apr 2026, shipped in v1.0.19):** All raw `fetch('/api/...')` calls in client code (BibleReader chapter loading, AuthModal, ForgotPassword, SubscriptionScreen, AIPanel, MainNavigation, SermonDetailModal, StrongModal, ModuleDetailScreen, LessonScreen, StudyModulesScreen, LoginPromptModal, inAppPurchases, tracking, main.tsx) now wrapped with `getApiUrl()` from `@/lib/queryClient`. Without this, native WebView (origin `https://localhost`) tried to fetch from `https://localhost/api/...` and failed with "Erro ao carregar capítulo" — the issue Google Play reviewer reported. The default `getQueryFn` already prefixes queryKey-based queries; only custom `queryFn` and direct `fetch` calls needed manual fix.
  - **Android SDK location:** Build AABs locally with `cd android && ./gradlew bundleRelease` after `npm run build && npx cap sync android`. The Replit env doesn't ship the Android SDK — install once via `commandlinetools-linux` from `https://dl.google.com/android/repository/`, then `sdkmanager "platform-tools" "platforms;android-35" "build-tools;35.0.0"`. `local.properties` references `/home/runner/workspace/.android-sdk` (kept inside workspace so it persists across restarts). compileSdk/targetSdk = 35, minSdk = 23.
  - **iOS prep:** `ios/App/App/Info.plist` has pt-BR region, microphone/camera/photos/speech privacy strings, NSAppTransportSecurity, ITSAppUsesNonExemptEncryption=false. `PrivacyInfo.xcprivacy` present.
- **Subscription & Payment System:** Supports Mercado Pago Checkout Pro for web payments, and native In-App Purchases (Apple StoreKit, Google Play Billing) for mobile. Includes server-side verification, unified subscription activation, and a detailed payment receipt system.
- **User Re-Engagement System:** Automatic re-engagement for users inactive for 30+ days via email campaigns (using Resend), managed by a cron-triggered endpoint and admin dashboard.

**System Design Choices:**
- **Monorepo Structure:** `server/`, `client/src/`, `shared/`, `scripts/`.
- **Database Schema:** Tables for `Users`, `Subscriptions`, `AIUsageLimits`, `Bookmarks`, `Annotations`, `AIHistory`, `strong_entries`, `guests`, `guest_ai_usage_limits`, `app_events`, `payment_receipts`, `campaign_logs`.
- **APIs:** Comprehensive RESTful API for core functionalities.
- **Bible Version Selector:** Displays all 16 versions with indicators for availability (commercial, fallback).

## External Dependencies

- **Database:** PostgreSQL (Neon)
- **ORM:** Drizzle ORM
- **AI:** OpenAI GPT-4o-mini (via Replit AI Integrations)
- **Payments:** Mercado Pago Checkout Pro, Apple StoreKit, Google Play Billing
- **Email:** Resend
- **Build Tool:** Vite
- **Mobile Wrapper:** Capacitor 6
- **Packages:** `bcryptjs`, `jsonwebtoken`, `@neondatabase/serverless`, `openai`, `resend`.