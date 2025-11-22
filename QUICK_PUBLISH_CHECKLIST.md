# ✅ Checklist Rápido de Publicação

## Se não abre após publicar, faça isto na ordem:

### 1️⃣ Verificar Secrets (5 segundos)
- [ ] Abra Replit → Engrenagem (Settings) → Secrets
- [ ] Confirme que **DATABASE_URL** existe e está preenchido
- [ ] Se não existir ou estiver vazio, copie do seu banco Neon

### 2️⃣ Forçar Rebuild Local (2 minutos)
```bash
npm run build
# Aguarde terminar - deve dizer "✓ built in Xs"
```

### 3️⃣ Testar Localmente (1 minuto)
```bash
npm run dev
# Abra http://localhost:5000
# Confirme que carrega normalmente
```

### 4️⃣ Fazer Unpublish + Republish (3 minutos)
1. No Replit, clique em "Publish"
2. Se já publicado, clique em "Unpublish" primeiro
3. Depois clique em "Publish" novamente

### 5️⃣ Testar App Publicada
- [ ] Abra a URL pública (XX.replit.app)
- [ ] Aguarde 10-15 segundos para carregar (primeira vez é lenta)
- [ ] Se carregar, teste um login

---

## Se AINDA não funcionar:

### ⚠️ Verificar Console do Navegador
1. Abra a URL publicada
2. Aperte F12 (Developer Tools)
3. Vá para a aba "Console"
4. Procure por mensagens em vermelho (erros)
5. Screenshot do erro e envie

### ⚠️ Verificar Logs do Replit
1. Volte ao Replit
2. Abra o terminal
3. Vá para "Logs" → "Deployment Logs"
4. Procure por mensagens de erro vermelhas

### ⚠️ Fazer Rollback (Restaurar Versão Anterior)
1. No Replit, clique em "View Checkpoints"
2. Selecione a última versão que funcionava
3. Clique em "Restore"

---

## ✅ Se Funcionar
Parabéns! Sua app está publicada e acessível! 🎉

**Próximos passos:**
- [ ] Configurar domínio personalizado (opcional)
- [ ] Importar dados do Strong (se não feito)
- [ ] Testar todas as funcionalidades

---

**Suporte:** Se ficar preso, contate o suporte Replit com print dos logs de erro.
