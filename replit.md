# Bíblia Hebraico & Grego – Primeiros Textos + IA

## Overview

This is a fullstack Progressive Web App (PWA) developed in TypeScript using React, Express, and PostgreSQL. It offers a comprehensive biblical reading experience with original Hebrew/Greek texts, Strong's Dictionary integration, and an AI Theological Professor powered by OpenAI GPT-5. The application aims to provide accessible theological study tools, personal annotation features, and offline capabilities, all within an installable PWA for iOS and Android. It includes a subscription model with a free trial to monetize advanced AI features and lifetime Strong's access. The project's ambition is to make in-depth biblical study accessible to a wider audience through modern technology.

## User Preferences

I want iterative development.
Ask before making major changes.
I prefer detailed explanations.
Do not make changes to the folder `Z`.
Do not make changes to the file `Y`.

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
- **Strong's Dictionary:** Database-driven architecture storing ~60 key theological terms (30 Greek, 30 Hebrew) in PostgreSQL with optimized indices. The frontend dynamically fetches Strong's entries via API, mapping Portuguese words to Strong's numbers. It intelligently filters searches to ignore short stopwords. The architecture is designed for scalability to ~14k full Strong's entries.
- **AI Theological Professor:** Integrates OpenAI GPT-5 (via Replit AI Integrations) offering two modes: "Essential" for basic explanations (up to 1024 tokens) and "Premium" for deep exegesis and comparative theology (up to 2048 tokens). AI conversations are saved to a history.
- **User Features:**
    - **Subscriptions:** Manages different subscription plans (`Strong Vitalício`, `IA Essencial`, `IA Premium`).
    - **Trial System:** 30-day free trial for new users providing access to Strong's and AI Essential features, with a visual indicator of remaining trial days.
    - **Bookmarks & Annotations:** Users can create and manage personal bookmarks and notes on verses.

**System Design Choices:**

- **Monorepo Structure:** `server/` for backend, `client/src/` for frontend, `shared/` for shared schemas, and `scripts/` for utilities.
- **Database Schema:**
    - `Users`: `id`, `name`, `email`, `password` (hashed), `trialStartDate`, `createdAt`.
    - `Subscriptions`: `id`, `userId`, `planType`, `status`, `startDate`, `endDate`, `amount`.
    - `Bookmarks`: `id`, `userId`, `book`, `chapter`, `verse`, `color`.
    - `Annotations`: `id`, `userId`, `book`, `chapter`, `verse`, `note`, `updatedAt`.
    - `AIHistory`: `id`, `userId`, `book`, `chapter`, `verse`, `question`, `response`, `aiMode`.
    - `strong_entries`: `strongNumber`, `language`, `lemma`, `translit`, `xlit`, `pron`, `kjvDef`, `strongsDef`, `derivation` with optimized indices.
    - `bible_words`: (prepared for future interlinear data).
- **APIs:** Comprehensive RESTful API endpoints for authentication, subscriptions, permissions, AI interactions, bookmarks, annotations, bible content, and Strong's dictionary lookups.

## External Dependencies

- **Database:** PostgreSQL (Neon)
- **ORM:** Drizzle ORM
- **AI:** OpenAI GPT-5 (via Replit AI Integrations)
- **Build Tool:** Vite
- **Packages:**
    - `bcryptjs` for password hashing
    - `jsonwebtoken` for JWT authentication
    - `@neondatabase/serverless` for PostgreSQL connection
    - `openai` for OpenAI API interaction (though Replit AI Integrations abstract direct usage)