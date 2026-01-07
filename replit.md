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
- **Guest-First Architecture:** Direct access to the Bible reader without login; a 30-day guest trial for Strong's and essential AI features is tracked via `deviceId`. Login is required for subscription.

**Technical Implementations & Feature Specifications:**
- **Authentication:** JWT with bcrypt for secure password hashing.
- **State Management:** TanStack Query v5 for frontend server state.
- **Bible Data:** Multiple versions (Portuguese: ACF, ARC, NVI; Spanish: RVR1960; English: KJV) with automated import.
- **Strong's Dictionary:** 14,197 entries (Greek/Hebrew) with Brazilian Portuguese translations; word-to-Strong lookup prioritizes Portuguese definitions and filters by testament.
- **Interlinear Bible Data:** 300,852 word-to-Strong mappings from OSHB (Open Scriptures Hebrew Bible) via `morphhb` package.
- **AI Professor:** OpenAI GPT-4o-mini via Replit AI Integrations, offering "Essential" (basic explanations) and "Premium" (deep exegesis) modes. Includes mode validation, rate limiting, and persistent multi-session chat history.
- **User Features:** Subscription management (Gold, Premium), 30-day free trial, bookmarks, annotations, and audio recording with IndexedDB storage and sharing capabilities.
- **Mobile App Distribution:** Configured with Capacitor for iOS and Android app store deployment, including native splash screen, status bar, app lifecycle, keyboard, and haptics plugins.
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