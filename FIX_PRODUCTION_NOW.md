# 🚨 FIX PRODUCTION NOW - AÇÕES EXATAS

Seu app está FORA do ar porque o `.replit` não está configurado corretamente.

## ⏱️ 2 MINUTOS PARA CORRIGIR

### PASSO 1: Abra o arquivo `.replit` (30 segundos)
- Na barra lateral do Replit, clique em **Files**
- Role para baixo até ver `.replit` (é cinza/escuro)
- Clique nele para abrir

### PASSO 2: Mude UMA LINHA (30 segundos)
Procure por (linha ~11):
```
build = ["npm", "run", "build"]
```

**DELETE essa linha e coloque:**
```
build = ["npm", "ci", "&&", "npm", "run", "build"]
```

Seu arquivo ficará assim:
```
[deployment]
deploymentTarget = "autoscale"
build = ["npm", "ci", "&&", "npm", "run", "build"]
run = ["npm", "run", "start"]
```

### PASSO 3: Salve (10 segundos)
Pressione: **Ctrl+S** (ou Cmd+S no Mac)

### PASSO 4: Publique (1 minuto esperando)
1. Clique em **Publish** (botão azul no topo)
2. Se já publicada, clique **Unpublish** primeiro
3. Depois clique **Publish**
4. Aguarde até aparecer: "App is running on https://..."

### PASSO 5: Teste Rápido (30 segundos)
Abra: **https://bibliainteligente.replit.app**

**Testes rápidos:**
1. ✅ Página carrega?
2. ✅ Tem um livro (João)?
3. ✅ Clica em uma palavra → abre modal com Strong?
4. ✅ Modal mostra definição em **português**?

---

## ❌ SE NÃO FUNCIONAR:

1. **Erro: "vite não foi encontrado"**
   - Você esqueceu de adicionar `npm ci &&` 
   - Refaça o Passo 2

2. **Erro: Build timeout**
   - Replit está lento
   - Clique Unpublish → aguarde 2 min → Publish novamente

3. **App abre mas vazio**
   - Database não conectado
   - Verifique: Settings > Secrets > DATABASE_URL existe?

4. **Modal abre mas sem definição português**
   - Dados incompletos no database
   - Rode localmente: `npm run dev` para confirmar que funciona

---

## ✅ APÓS FUNCIONAR:

Seus clientes acessam em: **https://bibliainteligente.replit.app**

E podem:
- ✅ Ler a Bíblia
- ✅ Clicar em palavras
- ✅ Ver Strong's em português
- ✅ Chat com IA
- ✅ Subscriptions

---

## 📋 NÃO DIGA "PRONTO" até confirmar:

- [ ] `.replit` editado com `npm ci &&`
- [ ] Arquivo salvo
- [ ] Publish clicado
- [ ] App abre em https://bibliainteligente.replit.app
- [ ] Strong's funciona (clica palavra → modal com português)
- [ ] Página recarrega sem erros

**FAÇA ISSO AGORA! ⏱️**

