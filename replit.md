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
  - **Android:** publicado no Google Play (`applicationId: app.replit.bibliainteligente.twa`). Versão atual no projeto: `versionCode 38 / versionName 1.0.38` — fix definitivo da faixa branca "Bíblia Inteligente IA" que reaparecia em algumas situações (recreação de Activity, retomada vinda da Play Store): o `AppTheme` raiz em `android/app/src/main/res/values/styles.xml` agora estende `Theme.AppCompat.DayNight.NoActionBar` com `windowActionBar=false` e `windowNoTitle=true`, garantindo que NUNCA mais a ActionBar nativa apareça acima do conteúdo do app. Versão 35 corrigia (a) header via `postSplashScreenTheme=AppTheme.NoActionBar` (insuficiente — caía no AppTheme raiz com ActionBar em alguns fluxos); (b) compras nativas via `cordova-plugin-purchase` v13 + permissão `com.android.vending.BILLING`; (c) Product IDs alinhados. NÃO alterar `applicationId`.
  - **Google Play Billing:** integração via `cordova-plugin-purchase` (CdvPurchase v13) em `client/src/lib/inAppPurchases.ts`. Product IDs cadastrados no Google Play Console (DEVEM bater exatamente — Play Console não permite renomear): `biblia_gold_mensal`, `biblia_gold_anual`, `biblia_premium_mensal`, `premium_anual` (PAID_SUBSCRIPTION) e `biblia_strong_vitalicio` (NON_CONSUMABLE). Mapeamento Product ID → planType interno em `server/payments/google.ts` (`GOOGLE_PRODUCT_MAP`) e `client/src/lib/inAppPurchases.ts` (`PRODUCT_IDS.android`). Verificação server-side em `POST /api/iap/verify/google` exige o secret `GOOGLE_PLAY_SERVICE_ACCOUNT_KEY` em produção (já configurado, project_id `biblia-iap`, service account `play-billing-verify@biblia-iap.iam.gserviceaccount.com`).
  - **iOS:** preparado para TestFlight/App Store (`bundleId: com.bibliainteligente.ios`). Build automatizado via GitHub Actions (`.github/workflows/build-ios.yml`): faz `npm ci` → `npm run build` → `npx cap sync ios` → `pod install --repo-update` → `xcodebuild archive` → exporta IPA → upload via `altool`. Secrets já configurados: `IOS_DISTRIBUTION_P12_BASE64`, `IOS_P12_PASSWORD`, `IOS_PROVISIONING_PROFILE_BASE64`, `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`. Team `SQVM7RVJN9`, profile `BiblaInteligente AppStore`. Pendente de execução manual no Xcode: 1) habilitar capability "Sign in with Apple" no Apple Developer Portal e em Signing & Capabilities; 2) `pod install` em `ios/App`; 3) configurar Team/Provisioning Profile.
  - **Apple StoreKit IAP (iOS):** integração ativada via `cordova-plugin-purchase` v13 (CdvPurchase) — mesmo plugin do Android, agora multi-plataforma. `_initCdvStore()` em `client/src/lib/inAppPurchases.ts` detecta `isIOS`/`isAndroid` e registra produtos com `Platform.APPLE_APPSTORE` ou `Platform.GOOGLE_PLAY`. Listener `.approved()` global roteia receipt: Apple → `verifyApplePurchase()` → `POST /api/iap/verify/apple` (envia `productId`, `transactionId`, `originalTransactionId`, `receiptData` base64). Restore Apple chama `store.restorePurchases()` + envia `appStoreReceipt` unificado para `POST /api/iap/restore/apple`. Backend (`server/payments/apple.ts`) valida receipts contra `https://buy.itunes.apple.com/verifyReceipt` com retry sandbox automático (status 21007). Product IDs alinhados com App Store Connect: `com.bibliainteligente.gold_monthly/gold_annual/premium_monthly/premium_annual` (PAID_SUBSCRIPTION) e `com.bibliainteligente.strong_lifetime` (NON_CONSUMABLE). Requer secret `APPLE_SHARED_SECRET` em produção (App-Specific Shared Secret do App Store Connect → Apps → Bíblia Inteligente → App Information → App-Specific Shared Secret). Capability "In-App Purchase" deve estar habilitada no App ID em developer.apple.com (não exige entitlements file) — após habilitar, regerar provisioning profile e atualizar secret `IOS_PROVISIONING_PROFILE_BASE64` no GitHub.
  - **Roteamento de pagamento por plataforma (SubscriptionScreen.tsx `handlePlanSelect`):** condicional `if (isIOS || isAndroid)` rotea para `purchaseProduct()` (CdvPurchase nativo). Mercado Pago só roda na web (fora das lojas). Política exigida pela App Store (3.1.1) e Google Play. ANTES havia bug onde Android caía no fluxo Mercado Pago — corrigido.
  - **iOS Hardening contra pagamento externo (App Store 3.1.1 / 2.1a — rejeição de Nov/2026):** defesa em profundidade em 4 camadas para garantir que NENHUM caminho de código no iOS toque Mercado Pago/PIX/checkout web: (1) `client/src/lib/inAppPurchases.ts` `purchaseProduct()` força `purchaseWithApple()` quando `isIOS`, ignorando o método solicitado; (2) `purchaseWithMercadoPago()` tem guard de saída imediata se `isIOS`; (3) `client/src/components/PixPaymentModal.tsx` retorna `null` se `isIOS` (após todos os hooks — Rules of Hooks); (4) `client/src/pages/SubscriptionPlans.tsx` envolve o `<PixPaymentModal>` em `!isIOS &&` para nem montar o componente. Logs padronizados `[IAP]` / `[IAP][Apple]` cobrem todos os eventos exigidos pela Apple: Purchase started, Store inicializada, Produto encontrado, Aguardando aprovação, Compra aprovada/verificada, Compra falhou, Cancelado pelo usuário, Erro inesperado. Mensagens de erro reescritas para serem amigáveis (sem termos técnicos como "build" / "plugin"). Cupom/desconto já estava oculto em `isNative` (cobre iOS). Android e Web permanecem intactos.
  - **Logo transparente:** `attached_assets/logo/{logo,logo-small,app-icon}.png` e `client/public/splash-screen.png` têm fundo transparente (sem quadrado branco). O `SplashScreen.tsx` React mostra o livro centralizado em `bg-background` (acompanha tema claro/escuro). NÃO reintroduzir fundo branco — o ícone iOS oficial (`ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png`) é o ÚNICO que precisa ter fundo opaco (exigência Apple para AppIcon).
  - **Compliance Apple:** Mercado Pago/PIX e Google Sign-In ocultos no iOS; Apple Sign-In disponível apenas no iOS via `@capacitor-community/apple-sign-in`. Pagamentos no iOS usam exclusivamente IAP (Apple StoreKit). Botão "Restaurar compras" visível em iOS e Android no `SubscriptionScreen.tsx` (obrigatório App Store guideline 3.1.1) — chama `restorePurchases()` do `inAppPurchases.ts`. Botão de "Apagar conta" obrigatório disponível em Configurações (DELETE `/api/user/me` com cascade). Páginas públicas `/privacidade` e `/termos` acessíveis sem login.
  - **Apple Sign-In Hardening:** `POST /api/auth/apple` valida JWT via JWKS Apple com `algorithms: ['RS256']` fixo (não confia no header), valida `issuer`, `audience` (bundleId) e `nonce` (SHA256 do nonce gerado no cliente). O `sub` Apple é guardado em `users.googleId` com prefixo `apple:`.
  - **Pendências manuais iOS (fora deste repo):** (a) habilitar capability "Sign in with Apple" no App ID em developer.apple.com; (b) Xcode → Signing & Capabilities → adicionar "Sign in with Apple" (gera `App.entitlements`); (c) `pod install` em `ios/App` (CocoaPods não disponível no ambiente Replit); (d) configurar Team/Provisioning Profile; (e) confirmar produtos IAP no App Store Connect alinhados com `inAppPurchases.ts`.
- **Subscription & Payment System:** Integrates Mercado Pago Checkout Pro for web and native In-App Purchases (Apple StoreKit, Google Play Billing) for mobile, with server-side verification and a detailed receipt system.
- **User Re-Engagement System:** Automated email campaigns for inactive users, managed via a cron-triggered endpoint and admin dashboard.
- **Admin Dashboard:** Provides insights into Google Play installs and subscription offers via dedicated cards, leveraging Google Play Developer Reporting API and Android Publisher API.
- **Production Boot Hardening (server/index.ts):** O servidor abre a porta 5000 ANTES de chamar `initializeDatabase()` (seed admin, versões da Bíblia, Strong, study modules, etc) — a inicialização roda em background via `.then/.catch`. Isso evita que erros transitórios do Neon (`Control plane request failed`) demorem a inicialização e estourem o health check de deploy do Replit (`a port configuration was specified but the required port was never opened, expected port 5000`), o que antes deixava o site `.replit.app` em tela branca e, por consequência, derrubava também os apps Android (TWA) e iPhone (WebView Capacitor) que carregam dele. Handlers globais `unhandledRejection` e `uncaughtException` apenas logam (não derrubam o processo) — protegem contra falhas em jobs assíncronos de fundo (webhooks, cron, IAP verify) matarem o servidor inteiro.

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