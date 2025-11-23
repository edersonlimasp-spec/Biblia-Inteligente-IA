# Bíblia Hebraico & Grego – Primeiros Textos + IA

## Overview

This is a fullstack Progressive Web App (PWA) developed in TypeScript using React, Express, and PostgreSQL. It offers a comprehensive biblical reading experience with original Hebrew/Greek texts, Strong's Dictionary integration, and an AI Professor powered by OpenAI GPT-5. The application aims to provide accessible theological study tools, personal annotation features, and offline capabilities, all within an installable PWA for iOS and Android. It includes a subscription model with a free trial to monetize advanced AI features and lifetime Strong's access. The project's ambition is to make in-depth biblical study accessible to a wider audience through modern technology.

## User Preferences

I want iterative development.
Ask before making major changes.
I prefer detailed explanations.
Do not make changes to the folder `Z`.
Do not make changes to the file `Y`.

## Recent Changes (Nov 23, 2025)

**Mobile Responsiveness Fixes:**
- **Header Overlap Fix:** Added CSS media query for mobile (`max-width: 768px`) with `padding-top: calc(var(--mobile-header-height) + env(safe-area-inset-top))` on main element to prevent content overlap under sticky header.
- **Dynamic Header Measurement:** Implemented `useEffect` in MainNavigation.tsx to dynamically measure header height (with 100ms delay for DOM readiness) and set CSS variable `--mobile-header-height`, with automatic re-measurement on window resize for orientation changes.
- **Input/Button Sizing:** Mobile input height set to 36px (smaller), button height set to 44px (larger) with `!important` to ensure visibility hierarchy.
- **Placeholder Update:** Changed AI input placeholder from "Pergunte ao Professor..." to "Buscar" with `aria-label` for accessibility.
- **Safe Area Support:** Added `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)` for iPhone notch and gesture bar compatibility.
- **Scroll Padding:** Added `scroll-padding-top` for smooth anchor scrolling on mobile.

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