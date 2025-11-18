# Bíblia Hebraico & Grego – Primeiros Textos + IA

Aplicação completa de leitura bíblica com textos originais em Hebraico/Grego, integração com Dicionário Strong's, e Professor Teológico com IA (OpenAI GPT-5).

## Visão Geral

Aplicação web fullstack desenvolvida em TypeScript usando React + Express + PostgreSQL que oferece:
- Leitura da Bíblia (texto em Português ACF)
- Acesso a textos originais em Hebraico e Grego com Strong's
- Professor Teológico com IA em dois níveis (Essencial e Premium)
- Sistema de assinaturas com três planos
- Trial gratuito de 30 dias
- Marcadores e anotações pessoais

## Arquitetura

### Backend (Express + TypeScript)
- **Autenticação:** JWT com bcrypt para hash de senhas
- **Database:** PostgreSQL (Neon) com Drizzle ORM
- **IA:** OpenAI GPT-5 via Replit AI Integrations (sem necessidade de API key própria)
- **APIs REST:** Endpoints completos para auth, subscriptions, bookmarks, annotations, e AI

### Frontend (React + TypeScript)
- **State Management:** TanStack Query v5 para gerenciamento de estado servidor
- **Routing:** Navegação por estado local (sem wouter para simplificar)
- **UI:** Shadcn/UI com Tailwind CSS
- **Tema:** Metallic Blue (#1A5299) com suporte a dark mode

### Database Schema

#### Users
- `id` (UUID)
- `name`, `email`, `password` (bcrypt hash)
- `trialStartDate` (para controle de trial de 30 dias)
- `createdAt`

#### Subscriptions
- `id`, `userId` (FK para users)
- `planType`: 'strong_lifetime' | 'ai_essential' | 'ai_premium'
- `status`: 'active' | 'cancelled' | 'expired'
- `startDate`, `endDate` (null para lifetime)
- `amount` (valores: "189.90", "19.90", "49.90")

#### Bookmarks
- `id`, `userId`, `book`, `chapter`, `verse`
- `color` (opcional)

#### Annotations
- `id`, `userId`, `book`, `chapter`, `verse`
- `note`, `updatedAt`

#### AI History
- `id`, `userId`, `book`, `chapter`, `verse`
- `question`, `response`
- `aiMode`: 'essential' | 'premium'

## Planos de Assinatura

1. **Strong Vitalício** (R$ 189,90 - pagamento único)
   - Dicionário Strong completo
   - Acesso vitalício a Hebraico e Grego
   - Morfologia detalhada

2. **IA Essencial** (R$ 19,90/mês)
   - Explicações básicas com IA
   - Contexto cultural simples
   - Perguntas ilimitadas

3. **IA Premium** (R$ 49,90/mês)
   - Tudo do Essencial +
   - Exegese profunda
   - Comparação teológica
   - Modo pregador e professor

## Sistema de Trial (30 dias)

- Ao criar conta, usuário recebe 30 dias de acesso gratuito ao Strong's
- Após 30 dias, acesso a Hebraico/Grego/Strong bloqueado automaticamente
- Verificação em `/api/access/strong` retorna `hasAccess: false` se trial expirado e sem assinatura lifetime

## APIs Principais

### Autenticação
- `POST /api/auth/register` - Criar conta (retorna token JWT)
- `POST /api/auth/login` - Login (retorna token JWT)
- `GET /api/auth/me` - Informações do usuário + status trial

### Assinaturas
- `GET /api/subscriptions` - Listar assinaturas do usuário
- `POST /api/subscriptions` - Criar nova assinatura

### Permissões
- `GET /api/access/strong` - Verifica acesso a Strong's (trial ou assinatura)
- `GET /api/access/ai/:mode` - Verifica acesso a IA (essential ou premium)

### IA Professor Teológico
- `POST /api/ai/ask` - Fazer pergunta à IA (requer assinatura ativa)
- `GET /api/ai/history` - Histórico de conversas

### Bookmarks
- `GET /api/bookmarks` - Listar marcadores
- `POST /api/bookmarks` - Criar marcador
- `DELETE /api/bookmarks/:id` - Deletar marcador

### Annotations
- `GET /api/annotations` - Listar todas anotações
- `GET /api/annotations/:book/:chapter/:verse` - Anotações de versículo específico
- `POST /api/annotations` - Criar anotação
- `PATCH /api/annotations/:id` - Atualizar anotação
- `DELETE /api/annotations/:id` - Deletar anotação

### Bíblia
- `GET /api/bible/books` - Listar livros disponíveis (atualmente apenas João)
- `GET /api/bible/:bookId/:chapter` - Buscar capítulo específico

### Dicionário Strong
- `GET /api/strong/:number` - Buscar entrada Strong (ex: G2316 ou H430) - Requer autenticação e acesso Strong (trial ou assinatura)
- `GET /api/strong/search/:query` - Buscar no dicionário por palavra/transliteração/definição

## Estrutura de Arquivos

```
├── server/
│   ├── auth.ts              # Sistema de autenticação JWT
│   ├── db.ts                # Configuração Drizzle + Neon
│   ├── openai.ts            # Integração OpenAI GPT-5
│   ├── storage.ts           # Interface de storage PostgreSQL
│   ├── routes.ts            # Todas as rotas da API
│   ├── bible-data/
│   │   ├── books.ts         # Metadata dos livros bíblicos
│   │   └── john.ts          # Dados de João capítulos 1, 2 e 3 (ACF)
│   └── strong-data/
│       ├── greek.ts         # Dicionário Strong Grego (13 entradas demo)
│       └── hebrew.ts        # Dicionário Strong Hebraico (10 entradas demo)
├── shared/
│   └── schema.ts            # Schemas Drizzle + Zod
├── client/src/
│   ├── contexts/
│   │   └── AuthContext.tsx    # Context de autenticação
│   ├── components/
│   │   ├── SplashScreen.tsx
│   │   ├── LoginScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   ├── BibleReader.tsx
│   │   ├── AIPanel.tsx
│   │   ├── StrongModal.tsx
│   │   ├── SubscriptionScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   └── AIHistoryScreen.tsx
│   └── lib/
│       └── queryClient.ts    # TanStack Query + JWT handling
```

## Autenticação Flow

1. Usuário cria conta em `/api/auth/register`
2. Backend gera token JWT válido por 7 dias
3. Token armazenado em localStorage
4. Todas requisições incluem `Authorization: Bearer <token>` header
5. Middleware `ensureAuthenticated` valida token em rotas protegidas

## IA Professor Teológico

- Usa GPT-5 via Replit AI Integrations
- Modo Essencial: Respostas até 1024 tokens, linguagem simples
- Modo Premium: Respostas até 2048 tokens, análise acadêmica profunda
- Histórico salvo automaticamente em `ai_history` table

## Status da Implementação

### ✅ Completo (MVP Funcional)

1. **Backend completo:**
   - Autenticação JWT com bcrypt
   - Sistema de trial de 30 dias
   - Gerenciamento de assinaturas
   - APIs REST para todas funcionalidades
   - Integração OpenAI GPT-5 para Professor Teológico

2. **Dados bíblicos:**
   - Evangelho de João capítulos 1, 2 e 3 (ACF) - 112 versículos
   - Sistema de navegação entre livros/capítulos
   - API retorna 404 com mensagens claras para conteúdo não implementado

3. **Dicionário Strong:**
   - 13 entradas gregas (G1-G5547)
   - 10 entradas hebraicas (H1-H8064)
   - API com controle de acesso (trial + assinatura)
   - Frontend com paywall integrado
   - Mapeamento de 14 palavras-chave para demonstração

4. **Frontend completo:**
   - Telas: Splash, Login, Register, BibleReader, Subscriptions, Settings, AI History
   - Componentes: AIPanel, StrongModal, ThemeToggle
   - Context de autenticação
   - React Query para gerenciamento de estado
   - Error handling robusto

### 📋 Próximos Passos (Expansão Futura)

1. Expandir dados bíblicos para toda a Bíblia (66 livros)
2. Adicionar todos os ~14,298 números Strong (5,624 gregos + 8,674 hebraicos)
3. Vincular números Strong reais aos versículos originais
4. Implementar sistema de busca por palavra/versículo
5. Adicionar integração de pagamento real (Stripe) para assinaturas

## Tecnologias

- **Frontend:** React 18, TypeScript, Tailwind CSS, Shadcn/UI, TanStack Query v5
- **Backend:** Express, TypeScript, Drizzle ORM
- **Database:** PostgreSQL (Neon)
- **Auth:** JWT + bcrypt
- **IA:** OpenAI GPT-5 (via Replit AI Integrations)
- **Build:** Vite
- **Packages:** bcryptjs, jsonwebtoken, @neondatabase/serverless, openai

## Design

- **Cor principal:** #1A5299 (Metallic Blue) - HSL: 210 85% 32%
- **Tipografia:** Fonte serif para textos bíblicos, sans-serif para UI
- **Modo Escuro:** Totalmente suportado
- **Responsivo:** Layout adaptável mobile/desktop

## Deployment

App configurado para deploy no Replit com:
- Binding em `0.0.0.0:5000`
- Environment variables automáticas (DATABASE_URL, AI_INTEGRATIONS_*)
- Hot reload em desenvolvimento
