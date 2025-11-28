# Bíblia Hebraico & Grego – Primeiros Textos + IA

## Overview

This is a fullstack Progressive Web App (PWA) developed in TypeScript using React, Express, and PostgreSQL. It offers a comprehensive biblical reading experience with original Hebrew/Greek texts, Strong's Dictionary integration, and an AI Professor powered by OpenAI GPT-5. The application aims to provide accessible theological study tools, personal annotation features, and offline capabilities, all within an installable PWA for iOS and Android. It includes a subscription model with a free trial to monetize advanced AI features and lifetime Strong's access. The project's ambition is to make in-depth biblical study accessible to a wider audience through modern technology.

## User Preferences

I want iterative development.
Ask before making major changes.
I prefer detailed explanations.
Do not make changes to the folder `Z`.
Do not make changes to the file `Y`.

## Recent Changes (Nov 28, 2025)

**Bible Reader Enhanced UI/UX (Completed):**
- **Compact Search Toggle:** Search bar reduced ~50% - now a toggle button that expands on click
- **Verse Highlighting System:** 6 color options (yellow, green, blue, pink, orange, purple) with localStorage persistence (`bible-highlights` key)
- **VerseActions Component:** Dropdown menu on each verse with share, copy, bookmark, highlight, annotate options
- **Share Functionality:** Web Share API with clipboard fallback for sharing verse text + reference
- **Annotation Panel:** Collapsible panel at bottom for creating/editing/deleting notes per verse
- **Visual Indicators:** Bookmark icons (filled) and annotation icons (message) appear next to verse numbers
- **Files Added/Updated:** VerseActions.tsx (NEW), AnnotationPanel.tsx (NEW), BibleReader.tsx (major refactor)
- **Error Handling:** Highlight save/remove operations now show toast notifications on success/failure

## Previous Changes (Nov 27, 2025)

**Premium Tier Differentiation - Full Implementation:**
- **AI Professor Prompts Completely Differentiated:**
  - **Premium:** Exegese profunda, comparação teológica, análise histórico-cultural, modo pregador/professor com terminologia acadêmica e insights eruditos
  - **Essential:** Explicações claras e acessíveis, contexto cultural básico, linguagem simples para iniciantes
- **Frontend Detection:** AIPanel now fetches user subscription status and automatically selects correct mode
- **UI Indicators:** Premium/Gold badges appear in AI chat panel to show active mode
- **Files Updated:** server/openai.ts (enriched prompts), client/src/components/AIPanel.tsx (mode detection + UI)
- **Rates Preserved:** Premium users get 100 questions/day vs Gold/Trial with 30 questions/day

**Monetization Pricing Adjustment (Completed):**
- **Gold Plan:** R$ 19,90/mês → **R$ 9,90/mês** (50% reduction)
- **Premium Plan:** R$ 29,90/mês → **R$ 19,90/mês** (33% reduction)
- **Strong Lifetime:** R$ 189,90 → **"Em breve"** (coming soon, removed from current offerings)
- **Updated in:** SubscriptionPlans.tsx, revenueCat.ts, AdminMonetization.tsx, SubscriptionScreen.tsx, server/routes.ts
- **Backend:** Database storing amounts as 9.90 (Gold) and 19.90 (Premium)

**CRITICAL FIX: Admin Login Production Compatibility:**
- **Problem Identified:** Login with admin credentials worked in development but failed after publishing to production.
- **Root Causes Found:**
  1. Admin users were not being created automatically in production
  2. No mechanism to ensure admin accounts exist on every deployment
- **Fixes Applied:**
  - **server/seed-admins.ts (NEW):** Created idempotent seed script that automatically creates/verifies admin users on EVERY server startup. If users exist, it verifies passwords and updates if needed.
  - **server/init-db.ts:** Now calls `seedAdminUsers()` before any other initialization. This ensures admins exist in both development and production.
  - **server/routes.ts:** Added detailed debug logging for login attempts (shows email, user found status, bcrypt result). Hash prefix is NOT logged in production for security.
- **Admin Credentials (Production & Development):**
  - `admin@meuapp.com` / `Admin@12345` (super_admin)
  - `googleplay@meuapp.com` / `Play@12345` (admin)
  - `admin@biblical.app` / `Admin123456` (super_admin, legacy)
- **How it works:**
  - On every server startup (dev or prod), the seed script runs
  - It checks if each admin user exists in the database
  - If not found, creates the user with hashed password
  - If found, verifies the password matches and updates if needed
  - This is completely idempotent - safe to run multiple times

## Previous Changes (Nov 24, 2025)

**CRITICAL FIX: Strong's Dictionary Production Compatibility:**
- **Problem Identified:** Strong's feature worked in development but broke after publishing to production.
- **Root Causes Found:**
  1. Dynamic import of `word-strong-mapping.ts` with relative path broke after build/bundling
  2. Path resolution for `strong-data.json` (6MB file) failed in production environment
- **Fixes Applied:**
  - **server/routes.ts:** Changed dynamic `await import('./word-strong-mapping')` to static import at top of file. This ensures the module is bundled correctly and available in production.
  - **server/init-db.ts:** Implemented multi-path fallback system to locate `strong-data.json` in both dev and prod environments. Added comprehensive diagnostic logging to identify path resolution issues post-publish.
  - **copy-strong-data.sh:** Created utility script to copy `strong-data.json` to `dist/` if needed for production deploys.
- **Production Notes:** 
  - Once Strong data is imported into production database, it persists and subsequent deploys won't need the JSON file.
  - Enhanced logging will help diagnose path issues if Strong data fails to load in production.
  - See `copy-strong-data.sh` for manual data file deployment if needed.

**Previous Changes (Nov 23, 2025):**
- **Mobile Responsiveness & UI Improvements:** Header font size increased 20%, Bible text `text-lg` → `text-xl`, lateral scroll fix with `overflow-x: hidden`, dark mode fully functional, 2-row header with Book/Chapter selectors, Trial badge, Bookmarks, Theme toggle, Settings, and keyword search.
- **Font Size System:** 3-tier system (small/medium/large) with localStorage persistence. Default is "medium".
- **Safe Area Support:** Added `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)` for iPhone notch and gesture bar compatibility.

## System Architecture

The application is a fullstack PWA with a React frontend and an Express backend, utilizing PostgreSQL for data persistence.

**UI/UX Decisions:**
- **Design System:** Shadcn/UI with Tailwind CSS for a modern, responsive interface.
- **Theme:** Metallic Blue (`#1A5299`) as the primary color, with full dark mode support.
- **Typography:** Serif font for biblical texts, sans-serif for UI elements.
- **PWA Features:** Complete PWA implementation with manifest, service worker for intelligent caching (enabling offline navigation), optimized icons, and meta tags for native-like installation on iOS and Android.
- **Logo:** A professional logo is integrated throughout the application, including the splash screen and PWA icons.

**Technical Implementations & Feature Specifications:**

- **Authentication:** JWT with bcrypt for secure password hashing.
- **State Management:** TanStack Query v5 for server state management in the frontend.
- **Routing:** Local state-based navigation in the frontend.
- **Bible Data:** Full ACF (Almeida Corrigida Fiel) Bible (31,106 verses, 66 books) is integrated, with an automated import script.
- **Strong's Dictionary:** Complete database of 14,197 entries (5,523 Greek + 8,674 Hebrew) imported from OpenScriptures XML/JS sources into PostgreSQL with optimized indices. **ALL 14,197 entries now have complete Portuguese (Brazilian) translations** in the `portugueseDef` field, achieved through hybrid approach: 2,690 entries extracted from authoritative Portuguese Strong's PDF + 11,507 entries translated via OpenAI GPT-4o-mini. **Word-to-Strong Lookup:** Frontend clicks trigger `/api/strong/search/:query` with database-only search (no hardcoded mappings). Backend searches `portugueseDef`, `lemma`, `translit`, and `kjvDef` fields with **relevance-based ordering**: (1) Portuguese definitions starting with search term, (2) exact lemma matches. Frontend filters results by testament (Old→Hebrew, New→Greek) with graceful fallback to opposite testament if no matches found. The system intelligently filters short words (< 3 chars) to reduce noise. StrongModal component prioritizes Portuguese definitions with English as supplementary reference.
- **AI Professor:** Integrates OpenAI GPT-4o-mini (via Replit AI Integrations) using Chat Completions API offering two modes: "Essential" for basic explanations (up to 1024 tokens) and "Premium" for deep exegesis and comparative theology (up to 2048 tokens). **Security:** Mode validation enforced before OpenAI call; rate limits checked before API invocation; usage counter increments only on successful responses. **Privacy:** Server does not log user prompts or AI responses. **Rate limiting:** Trial/Gold users get 30 questions/day, Premium users get 100 questions/day.
  - **Multi-Session Chat System:** Complete conversational interface with persistent multi-session support. Users can maintain multiple independent chat conversations with the AI Professor, each preserved in localStorage. **Architecture:** Frontend manages `ChatMessage` (role, text, createdAt) and `ChatSession` (id, title, messages[], createdAt, updatedAt) types. **Features:** (1) Append-only messaging (never deletes conversation history), (2) "Nova Conversa" button archives current session and starts fresh conversation, (3) History drawer displays all previous sessions with auto-generated titles (first user question truncated to 40 chars), (4) Session switching loads complete conversation history, (5) localStorage persistence for seamless recovery across page reloads. **Race Condition Fix:** Mutation workflow captures originating `sessionId` at request time, ensuring AI responses route to correct session even if user switches conversations mid-request; defensive logic recreates missing sessions to prevent dropped responses. **Test IDs:** User messages use `message-user-{idx}`, assistant messages use `message-bot-{idx}`. **UX Optimizations:** Splash screen shows only on first visit (sessionStorage flag), message counter badge, timestamp display (pt-BR locale), expandable panel UI.
- **User Features:**
    - **Subscriptions:** Manages three subscription plans: `Strong Vitalício` (R$ 189,90 one-time), `Gold` (R$ 19,90/month, AI Essential + Strong), `Premium` (R$ 29,90/month, AI Premium + Strong).
    - **Trial System:** 30-day free trial for new users providing access to Strong's and AI Essential (30 questions/day), with a visual indicator of remaining trial days.
    - **Bookmarks & Annotations:** Users can create and manage personal bookmarks and notes on verses.

**System Design Choices:**

- **Monorepo Structure:** `server/` for backend, `client/src/` for frontend, `shared/` for shared schemas, and `scripts/` for utilities.
- **Database Schema:**
    - `Users`: `id`, `name`, `email`, `password` (hashed), `trialStartDate`, `createdAt`.
    - `Subscriptions`: `id`, `userId`, `planType` ('strong_lifetime' | 'gold' | 'premium'), `status`, `startDate`, `endDate`, `amount`.
    - `AIUsageLimits`: `userId`, `count`, `date` (for daily rate limiting).
    - `Bookmarks`: `id`, `userId`, `book`, `chapter`, `verse`, `color`.
    - `Annotations`: `id`, `userId`, `book`, `chapter`, `verse`, `note`, `updatedAt`.
    - `AIHistory`: `id`, `userId`, `book`, `chapter`, `verse`, `question`, `response`, `aiMode`.
    - `strong_entries`: `strongNumber`, `language`, `lemma`, `translit`, `xlit`, `pron`, `kjvDef`, `strongsDef`, `portugueseDef` (100% populated with Brazilian Portuguese translations), `derivation` with optimized indices. Contains 14,197 entries total, all fully translated.
    - `bible_words`: (prepared for future interlinear data).
- **APIs:** Comprehensive RESTful API endpoints for authentication, subscriptions, permissions, AI interactions, bookmarks, annotations, bible content, and Strong's dictionary lookups.

## External Dependencies

- **Database:** PostgreSQL (Neon)
- **ORM:** Drizzle ORM
- **AI:** OpenAI GPT-4o-mini (via Replit AI Integrations)
- **Build Tool:** Vite
- **Packages:**
    - `bcryptjs` for password hashing
    - `jsonwebtoken` for JWT authentication
    - `@neondatabase/serverless` for PostgreSQL connection
    - `openai` for OpenAI API interaction (though Replit AI Integrations abstract direct usage)