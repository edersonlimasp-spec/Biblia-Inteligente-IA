# 🔍 Por Que App Não Abre - Explicação Simples

## O Problema

```
❌ Produção (Replit):  NÃO ABRE
✅ Local (seu PC):     ABRE NORMALMENTE

Por quê?
```

---

## A Causa

No Replit, quando você clica **"Publish"**, o sistema:

1. ✅ Pega o código
2. ❌ **TENTA fazer npm run build**
3. ❌ **MAS npm não está instalado** (porque não rodou npm install/ci)
4. ❌ Build falha
5. ❌ App não inicia
6. ❌ URL não abre

---

## A Solução

Você precisa dizer ao Replit:

> "Antes de fazer `npm run build`, instale as dependências com `npm ci`"

---

## Como Fazer

Edite o arquivo `.replit`:

```
MUDE ISTO:  build = ["npm", "run", "build"]
PARA ISTO:  build = ["npm", "ci", "&&", "npm", "run", "build"]
```

Tradução:
- `npm ci` = instalar dependências (como npm install)
- `&&` = "depois que isso terminar, faça..."
- `npm run build` = compila a app

---

## Depois

Após você fazer isto:

1. Replit vai rodar: `npm ci && npm run build`
2. ✅ Dependências instaladas
3. ✅ Build vai funcionar
4. ✅ App vai iniciar
5. ✅ URL abre!

---

## Por Isso Funciona Localmente

No seu PC, você já rodou `npm install` uma vez. Por isso localmente funciona. Mas em produção (Replit), cada vez que publica, precisa reinstalar.

---

## Arquivos Para Entender

- `CORRIGIR_AGORA.md` ← Leia isto agora!
- `EDIT_REPLIT_VISUAL.txt` ← Veja o diagrama

---

## 🎯 Ação Rápida

1. Abra `.replit`
2. Mude 1 linha (conforme CORRIGIR_AGORA.md)
3. Salve
4. Publish
5. PRONTO!

**Tempo: 5 minutos**

---

## ✅ Resultado

Depois:
- ✅ App abre em `https://bibliainteligente.replit.app`
- ✅ Tudo funciona
- ✅ Clientes podem usar

