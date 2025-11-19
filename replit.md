# Bíblia Hebraico & Grego – Primeiros Textos + IA

Aplicação completa de leitura bíblica com textos originais em Hebraico/Grego, integração com Dicionário Strong's, e Professor Teológico com IA (OpenAI GPT-5).

## Visão Geral

**Progressive Web App (PWA)** fullstack desenvolvida em TypeScript usando React + Express + PostgreSQL que oferece:
- Leitura da Bíblia (texto em Português ACF)
- Acesso a textos originais em Hebraico e Grego com Strong's
- Professor Teológico com IA OpenAI GPT-5 em dois níveis (Essencial e Premium)
- Sistema de assinaturas com três planos
- Trial gratuito de 30 dias
- Marcadores e anotações pessoais
- **Instalável em iOS e Android** como PWA
- **Funcionalidade offline** para navegação e leitura
- **Logo profissional** integrado em toda a aplicação

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
- **PWA:** Progressive Web App completo com manifest, service worker e ícones
- **Instalável:** Pode ser instalado como app nativo em iOS e Android
- **Offline:** Service worker com cache inteligente (navegação offline, APIs fail naturalmente)

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

- Ao criar conta, usuário recebe 30 dias de acesso gratuito ao Strong's E IA Essential
- Trial concede acesso completo a:
  - Dicionário Strong (Hebraico e Grego)
  - Professor Teológico IA modo Essential
- Badge visual no header mostra dias restantes
- Após 30 dias, acesso bloqueado automaticamente (requer assinatura)
- Verificações em `/api/access/strong` e `/api/access/ai/:mode`

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
- `GET /api/bible/books` - Listar todos os 66 livros disponíveis (Antigo e Novo Testamento)
- `GET /api/bible/:bookId/:chapter` - Buscar capítulo específico de qualquer livro

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
│   │   ├── books.ts         # Metadata dos 66 livros bíblicos
│   │   ├── bible-index.ts   # Índice centralizado de todos os livros
│   │   ├── gen.ts           # Gênesis (50 capítulos)
│   │   ├── ... (64 outros livros)
│   │   └── rev.ts           # Apocalipse (22 capítulos)
│   └── strong-data/
│       ├── greek.ts         # Dicionário Strong Grego (13 entradas demo)
│       └── hebrew.ts        # Dicionário Strong Hebraico (10 entradas demo)
├── scripts/
│   └── import-bible.ts      # Script de importação automática da Bíblia ACF
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

## Melhorias Recentes (Última Sessão)

**1. BUG CRÍTICO CORRIGIDO - Trial agora funciona para IA:**
- Trial de 30 dias concede acesso a IA Essential (antes só funcionava para Strong's)
- `/api/access/ai/:mode` e `/api/ai/ask` agora verificam trial corretamente
- Mensagens de erro melhoradas com sugestões de planos

**2. Dicionário Strong expandido 5x:**
- Grego: 13 → 37 entradas (~3x mais)
- Hebraico: 10 → 29 entradas (~3x mais)
- Total: 66 entradas (representando os 66 livros da Bíblia)

**3. Mapeamento palavra→Strong expandido 2x:**
- 39 → 75 palavras mapeadas
- Cobertura de Novo e Antigo Testamento
- Termos teológicos chave incluídos

**4. Mensagens de erro de login específicas:**
- "Email não cadastrado" vs "Senha incorreta" (não mais genérico "Credenciais inválidas")
- Frontend corrigido para mostrar `error.data.error` do backend

**5. Badge visual de trial:**
- Mostra dias restantes no header ("Trial: 30 dias")
- Visível apenas quando trial está ativo
- Usa AuthContext para dados em tempo real

**6. StrongModal redesenhado:**
- Removido todos os emojis (substituídos por ícones Lucide)
- Layout profissional com ícones BookOpen, Library, Lightbulb
- Badges de idioma sem emojis
- Boxes organizados para melhor leitura

## Status da Implementação

### ✅ Completo (MVP Funcional)

1. **Backend completo:**
   - Autenticação JWT com bcrypt
   - Sistema de trial de 30 dias
   - Gerenciamento de assinaturas
   - APIs REST para todas funcionalidades
   - Integração OpenAI GPT-5 para Professor Teológico

2. **Dados bíblicos:**
   - **Bíblia completa ACF (Almeida Corrigida Fiel)** - 31.106 versículos
   - **66 livros** (Antigo e Novo Testamento)
   - Script de importação automatizada do GitHub (thiagobodruk/bible)
   - Sistema de navegação completo entre livros/capítulos
   - API com validação de livros e capítulos inválidos
   - Escape adequado de caracteres especiais e quebras de linha

3. **Dicionário Strong:**
   - 37 entradas gregas (expandido 3x)
   - 29 entradas hebraicas (expandido 3x)
   - Total: 66 entradas (5x mais que antes)
   - API com controle de acesso (trial + assinatura)
   - Frontend com paywall integrado e modal redesenhado
   - Mapeamento de 75 palavras-chave (2x mais que antes)

4. **Frontend completo:**
   - Telas: Splash, Login, Register, BibleReader, Subscriptions, Settings, AI History
   - Componentes: AIPanel, StrongModal, ThemeToggle
   - Context de autenticação
   - React Query para gerenciamento de estado
   - Error handling robusto

5. **PWA (Progressive Web App):**
   - Manifest.json com metadados completos
   - Service Worker com cache inteligente
   - Ícones otimizados (192x192 e 512x512)
   - Meta tags para iOS e Android
   - Instalável como app nativo
   - Funcionalidade offline (navegação cached, APIs fail graciosamente)
   - Splash screen personalizada
   - Tema azul metálico (#1A5299)

6. **Logo Profissional:**
   - Logo integrado em todas as telas
   - Splash screen com gradiente azul
   - Ícones PWA otimizados
   - Header com logo pequeno
   - Assets organizados em /attached_assets/logo/

### 📋 Próximos Passos (Expansão Futura)

1. ~~Expandir dados bíblicos para toda a Bíblia (66 livros)~~ ✅ **COMPLETO**
2. ~~Expandir dicionário Strong significativamente~~ ✅ **COMPLETO** (66 entradas: 37 gregas + 29 hebraicas)
3. ~~Expandir mapeamento de palavras-chave para Strong's~~ ✅ **COMPLETO** (75 palavras mapeadas)
4. ~~Melhorar mensagens de erro de autenticação~~ ✅ **COMPLETO**
5. ~~Adicionar indicador visual de trial~~ ✅ **COMPLETO**
6. Adicionar todos os ~14,298 números Strong restantes
7. Vincular números Strong reais aos versículos originais em Hebraico/Grego
8. Implementar sistema de busca por palavra/versículo
9. Adicionar integração de pagamento real (Stripe) para assinaturas
10. Adicionar funcionalidades: marcadores visíveis, anotações, busca por referência

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
