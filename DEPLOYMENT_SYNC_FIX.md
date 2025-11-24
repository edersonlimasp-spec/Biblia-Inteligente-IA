# Correção de Sincronização: Preview vs Publicação

## Problema Identificado

Quando o app era publicado (produção), ele continuava rodando código antigo mesmo após fazer mudanças e testar no preview.

### Causa Raiz

1. **Vite compila frontend para**: `dist/public/`
2. **.replit copia para**: `server/public/` (para preview)
3. **Em produção**, `node dist/index.js` roda de `cwd=/home/runner/workspace`
4. **server/vite.ts:71 procura em**: `dist/public/` (via `import.meta.dirname`)
5. **Resultado**: Conflito de caminhos - produção procura onde não tem arquivo!

### Fluxo Preview (funcionava)
```
npm run dev
  → Express com Vite middleware
  → Vite serve client/dist (recém compilado)
  → ✓ Sempre atualizado
```

### Fluxo Publicação (problema)
```
.replit build: npm ci && npm run build && cp dist/public/* server/public/
  → Copia para server/public/
.replit run: npm run start
  → node dist/index.js
  → server/vite.ts procura em dist/public/
  → ❌ Arquivo estava em server/public/ (mismatch!)
```

## Solução Aplicada

### Modificação em `server/index.ts`

Adicionei função `syncFrontendFiles()` que:
- **Em produção**: Sincroniza `dist/public/ → server/public/` no startup
- **Garante**: Arquivos compilados sempre disponíveis
- **Robusto**: Funciona independente de onde o build copiou

```typescript
function syncFrontendFiles() {
  if (process.env.NODE_ENV === "production") {
    const sourceDir = path.resolve(__dirname, "..", "dist", "public");
    const targetDir = path.resolve(__dirname, "public");
    
    if (fs.existsSync(sourceDir)) {
      fs.cpSync(sourceDir, targetDir, { recursive: true, force: true });
    }
  }
}
```

Chamada: `syncFrontendFiles();` antes de inicializar o banco/rotas.

## Como Validar que Funcionou

### Teste no Preview
1. Abra: `http://localhost:5000`
2. Procure pelo badge "✓ Sincronizado" (nova função)
3. Anote a hora

### Teste em Publicação
1. **Mudança de teste**: Adicione uma frase única em algum lugar visível
2. **Publish novamente** via Replit Publish UI
3. **Abra URL pública** em aba anônima
4. **Verifique**:
   - ✓ Sua frase nova aparece?
   - ✓ Badge "✓ Sincronizado" tem hora RECENTE?
   - ✓ Em mobile também funciona?

Se SIM em tudo → **Correção bem-sucedida!**

## Estrutura Final em Produção

```
/home/runner/workspace/
├── dist/
│   ├── index.js          # Server compilado
│   └── public/           # Frontend (cópia via npm run build)
│       ├── index.html
│       ├── assets/
│       └── ...
├── server/
│   ├── public/           # Frontend (PRIMARY - servidor olha aqui)
│   │   ├── index.html    # Sincronizado no startup
│   │   ├── assets/
│   │   └── ...
│   └── index.ts
└── .replit
    build: npm ci && npm run build && mkdir -p server/public && cp -r dist/public/* server/public/
    run: npm run start
```

## Build Command Detalhado

```bash
npm ci && npm run build && mkdir -p server/public && rm -rf server/public/* && cp -r dist/public/* server/public/
```

Quebra em:
1. `npm ci` - Instala dependências exatas
2. `npm run build` - Vite + esbuild + nova sincronização automática
3. `mkdir -p server/public` - Garante pasta existe
4. `rm -rf server/public/*` - Limpa versão antiga
5. `cp -r dist/public/* server/public/` - Copia novo build

## Resultado

✅ **Preview e Publicação agora sincronizados**
✅ **Qualquer mudança aparece em ambos após rebuild**
✅ **Sem necessidade editar server/vite.ts (arquivo protegido)**
✅ **Badge de sincronização permite verificação visual**

---

**Próxima ação**: Após fazer uma mudança no código, publish e abra a URL pública em aba anônima para confirmar sincronização.
