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
  - **Android:** publicado no Google Play (`applicationId: app.replit.bibliainteligente.twa`). Versão atual no projeto: `versionCode 22 / versionName 1.0.22` (inclui correção do scroll indicator que aparecia na faixa da notch). NÃO alterar `applicationId`.
  - **iOS:** preparado para TestFlight/App Store (`bundleId: com.bibliainteligente.app`). Pendente de execução manual no Xcode: 1) habilitar capability "Sign in with Apple" no Apple Developer Portal e em Signing & Capabilities; 2) `pod install` em `ios/App`; 3) configurar Team/Provisioning Profile.
  - **Compliance Apple:** Mercado Pago/PIX e Google Sign-In ocultos no iOS; Apple Sign-In disponível apenas no iOS via `@capacitor-community/apple-sign-in`. Pagamentos no iOS usam exclusivamente IAP (Apple StoreKit). Botão de "Apagar conta" obrigatório disponível em Configurações (DELETE `/api/user/me` com cascade). Páginas públicas `/privacidade` e `/termos` acessíveis sem login.
  - **Apple Sign-In Hardening:** `POST /api/auth/apple` valida JWT via JWKS Apple com `algorithms: ['RS256']` fixo (não confia no header), valida `issuer`, `audience` (bundleId) e `nonce` (SHA256 do nonce gerado no cliente). O `sub` Apple é guardado em `users.googleId` com prefixo `apple:`.
  - **Pendências manuais iOS (fora deste repo):** (a) habilitar capability "Sign in with Apple" no App ID em developer.apple.com; (b) Xcode → Signing & Capabilities → adicionar "Sign in with Apple" (gera `App.entitlements`); (c) `pod install` em `ios/App` (CocoaPods não disponível no ambiente Replit); (d) configurar Team/Provisioning Profile; (e) confirmar produtos IAP no App Store Connect alinhados com `inAppPurchases.ts`.
- **Subscription & Payment System:** Integrates Mercado Pago Checkout Pro for web and native In-App Purchases (Apple StoreKit, Google Play Billing) for mobile, with server-side verification and a detailed receipt system.
- **User Re-Engagement System:** Automated email campaigns for inactive users, managed via a cron-triggered endpoint and admin dashboard.
- **Admin Dashboard:** Provides insights into Google Play installs and subscription offers via dedicated cards, leveraging Google Play Developer Reporting API and Android Publisher API.

**System Design Choices:**
- **Monorepo Structure:** Organized into `server/`, `client/src/`, `shared/`, `scripts/`.
- **Database Schema:** Comprehensive schema covering `Users`, `Subscriptions`, `AIUsageLimits`, `Bookmarks`, `Annotations`, `AIHistory`, `strong_entries`, and other essential application data.
- **APIs:** Comprehensive RESTful API supporting all core functionalities.
- **Bible Version Selector:** Displays all available Bible versions with clear indicators for their availability status.

## External Dependencies

- **Database:** PostgreSQL (Neon)
- **ORM:** Drizzle ORM
- **AI:** OpenAI GPT-4o-mini (via Replit AI Integrations)
- **Payments:** Mercado Pago Checkout Pro, Apple StoreKit, Google Play Billing
- **Email:** Resend
- **Build Tool:** Vite
- **Mobile Wrapper:** Capacitor 6
- **Packages:** `bcryptjs`, `jsonwebtoken`, `@neondatabase/serverless`, `openai`, `resend`.