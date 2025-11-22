# Guia Completo de Publicação - Bíblia Hebraico & Grego

## ✅ Checklist Pré-Publicação

Antes de clicar em "Publish", verifique:

### 1. **Banco de Dados em Produção**
- [ ] Você criou um banco PostgreSQL Neon para produção
- [ ] O `DATABASE_URL` de produção está configurado em **Secrets**
- [ ] O banco está rodando e acessível

**Como verificar:**
```bash
# Testar conexão
psql $DATABASE_URL -c "SELECT NOW();"
```

### 2. **Dados do Strong Sincronizados**
- [ ] Os 14.197 dados do Strong foram importados em produção

**Como sincronizar em produção:**
```bash
# No console do Replit (após publicar uma primeira vez):
npm run db:push
tsx scripts/import-full-strongs.ts
```

### 3. **Variáveis de Ambiente em Secrets**
- [ ] DATABASE_URL ✅
- [ ] SESSION_SECRET ✅
- [ ] OPENAI_API_KEY (se usar AI Professor) ✅

**Para verificar:**
Ir em "Secrets" (engrenagem) e confirmar que todas estão lá.

### 4. **Build Local Bem-Sucedido**
```bash
# Testar build
npm run build

# Verificar se dist/public/index.html existe
ls -la dist/public/index.html
```

### 5. **App Roda em Modo Produção Localmente**
```bash
# Testar startup em produção
NODE_ENV=production node dist/index.js
```

---

## 🚀 Processo de Publicação

### Passo 1: Garantir que App Local Funciona
```bash
npm run dev
# Acessar http://localhost:5000
# Testar: Login, Bíblia, Strong, Recuperação de Senha
```

### Passo 2: Fazer Build
```bash
npm run build
```

### Passo 3: Verificar Secrets em Produção
1. Abrir Replit
2. Clique na engrenagem (Settings)
3. Vá para "Secrets"
4. Verifique se `DATABASE_URL` está lá e correto

### Passo 4: Clicar em "Publish"
1. No topo do Replit, clique em "Publish"
2. Siga as instruções
3. Aguarde build completo

### Passo 5: Testar Aplicação Publicada
1. Abra a URL pública (será exibida após publicar)
2. Teste:
   - [ ] Login com email/senha
   - [ ] Página da Bíblia carrega
   - [ ] Strong funciona
   - [ ] Recuperação de senha funciona

---

## ❌ Se Não Abrir Após Publicação

### Erro: "Not Found" ou Página em Branco

**Causa Provável:** Arquivo compilado faltando ou DATABASE_URL não está configurado.

**Solução:**

1. **Verificar Secrets:**
   ```bash
   # Você pode ver em qual DATABASE_URL está sendo usado
   echo $DATABASE_URL
   ```

2. **Reconstruir:**
   ```bash
   npm run build
   npm run start
   ```

3. **Se ainda não funcionar, fazer rollback:**
   - Usar o botão "View Checkpoints" do Replit
   - Restaurar versão anterior que funcionava

### Erro: "Connection refused"

**Causa Provável:** Banco de dados não acessível em produção.

**Solução:**

1. Verificar se DATABASE_URL em produção está correto
2. Verificar se banco Neon está em execução
3. Testar conexão:
   ```bash
   psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"
   ```

---

## 📊 Estrutura de Deployment

O Replit está configurado para:

1. **Build:** `npm run build`
   - Compila frontend (Vite)
   - Compila backend (esbuild)
   - Gera `dist/public/` e `dist/index.js`

2. **Run:** `npm run start`
   - Executa `NODE_ENV=production node dist/index.js`
   - Serve frontend estático de `dist/public/`
   - Roda API routes

3. **Port:** 5000 → 80 (mapeado em produção)

---

## 🔍 Verificação Pós-Deployment

Após publicar com sucesso:

1. **Acessar app** → Deve carregar página
2. **Testar login** → Email: `edersonlima.sp@gmail.com` / Senha: `123456`
3. **Testar Bíblia** → João 1:1 deve mostrar verso
4. **Testar Strong** → Clicar em palavra deve abrir modal
5. **Verificar logs** → No console do Replit, verificar se há erros

---

## 🛠️ Troubleshooting Rápido

| Problema | Solução |
|----------|---------|
| Página em branco | Verificar console (F12) para erros |
| Strong não funciona | Importar dados: `tsx scripts/import-full-strongs.ts` |
| Login falha | Verificar DATABASE_URL em Secrets |
| Recuperação de senha não funciona | Verificar se tabela `password_reset_tokens` existe |
| Erro "Cannot find module" | Fazer `npm run build` novamente |

---

## 📞 Se Nada Funcionar

1. Abrir console do navegador (F12)
2. Ver se há erros em rede ou JavaScript
3. Verificar logs do Replit (no terminal)
4. Fazer rollback para versão anterior
5. Contatar suporte Replit se problema persiste

---

**Status Atual:** ✅ App local 100% funcional e pronto para publicação!
