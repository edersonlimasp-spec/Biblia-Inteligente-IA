# 🚀 Guia de Deployment em Produção - Bíblia Inteligente

## ⚠️ CRÍTICO: Problema Atual

O Replit não instala dependências automaticamente durante o build. Você precisa configurar manualmente.

---

## ✅ Solução - 3 Passos Simples

### **PASSO 1: Abra o arquivo `.replit`**
1. No Replit, clique em **Files** na barra lateral
2. Procure por `.replit` (é um arquivo oculto - role para ver)
3. Clique para abrir

### **PASSO 2: Altere 2 linhas**

**Procure por** (linha ~11-12):
```
[deployment]
deploymentTarget = "autoscale"
build = ["npm", "run", "build"]
run = ["npm", "run", "start"]
```

**MUDE para:**
```
[deployment]
deploymentTarget = "autoscale"
build = ["npm", "ci", "&&", "npm", "run", "build"]
run = ["npm", "run", "start"]
```

**Explicação:**
- `npm ci` = Instala dependências exatamente conforme package-lock.json (seguro para produção)
- `&&` = Roda o próximo comando APÓS npm ci ser bem-sucedido
- `npm run build` = Compila o app

### **PASSO 3: Salve e Publique**
1. Pressione `Ctrl+S` (ou Cmd+S no Mac) para salvar
2. Clique em **Publish** (botão azul no topo)
3. Se já publicada, clique **Unpublish** primeiro, depois **Publish**
4. Aguarde **3-5 minutos** o build completar

---

## 🧪 Testes de Validação

Após publicar, abra: **https://bibliainteligente.replit.app**

### ✅ Teste 1: App Abre
- [ ] Página carrega sem erros
- [ ] Vê a Bíblia com o livro padrão (João)

### ✅ Teste 2: Strong's Funciona - Hebraico (AT)
1. Clique em **Select book**
2. Escolha um livro do **Antigo Testamento** (ex: Gênesis)
3. Procure por capítulo disponível
4. **Clique em uma palavra** com destaque (underline pontilhado)
5. **Deve abrir modal** com:
   - Número Strong (H + números)
   - Texto original hebraico
   - Transliteração
   - **Definição em Português** ← CRÍTICO

### ✅ Teste 3: Strong's Funciona - Grego (NT)
1. Volte para **João** (já está disponível)
2. **Clique em várias palavras** com destaque
3. **Deve abrir modal** com:
   - Número Strong (G + números)
   - Texto grego original
   - Transliteração
   - **Definição em Português**

### ✅ Teste 4: Palavras SEM Strong
- Clique em palavras **sem destaque** (sem underline)
- **Não deve abrir nada** (comportamento correto)

### ✅ Teste 5: Múltiplos Acessos
1. Faça login
2. Recarregue página (`Ctrl+F5` ou `Cmd+Shift+R`)
3. Navegue entre capítulos
4. **Tudo deve funcionar sem erros**

---

## 📊 Checklist Final - SÓ DECLARE PRONTO QUANDO TUDO MARCAR ✅

- [ ] `.replit` modificado com `npm ci &&` no build command
- [ ] Arquivo salvo (Ctrl+S)
- [ ] App publicado (Publish clicado)
- [ ] https://bibliainteligente.replit.app abre **SEM ERROS**
- [ ] Clicou em palavras Strong em **AT (Hebraico)** ✅ modal abriu
- [ ] Clicou em palavras Strong em **NT (Grego)** ✅ modal abriu
- [ ] Modal mostra **DEFINIÇÃO EM PORTUGUÊS** ✅ (não vazio)
- [ ] Clicou em palavra **SEM destaque** ✅ não fez nada
- [ ] **Underline pontilhado aparece** apenas em palavras com Strong
- [ ] Recarregou página múltiplas vezes ✅ sem erros

---

## 🐛 Troubleshooting

### ❌ Erro: "vite não foi encontrado"
**Solução:** Você não fez o Passo 2 corretamente. Verifique que o `.replit` está com:
```
build = ["npm", "ci", "&&", "npm", "run", "build"]
```

### ❌ Erro: "Build timeout"
**Solução:** Replit pode estar sobrecarregado. Tente novamente:
1. Clique **Unpublish**
2. Aguarde 1 minuto
3. Clique **Publish** novamente

### ❌ App abre mas não tem conteúdo
**Solução:** Database não está conectada. Verifique se:
1. `DATABASE_URL` está configurado em **Settings > Environment variables**
2. PostgreSQL está ativo

### ❌ Strong abre mas NÃO mostra definição em português
**Solução:** A tradução não rodou. Verifique:
1. Database tem dados: rode em seu computador (dev mode) para confirmar
2. Se vazio, rode `npm run db:push` localmente

---

## 📞 Suporte

Se nada funcionar após seguir TODOS os passos:
1. Print do erro exato
2. Envie o arquivo `.replit` editado
3. Confirme que DATABASE_URL está em environment variables

---

## ✨ Pronto!

Sua app está em produção! Clientes podem acessar em **https://bibliainteligente.replit.app**

