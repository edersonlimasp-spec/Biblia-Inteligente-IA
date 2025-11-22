# 🔧 SOLUÇÃO - Erro de Build no Deployment

## Problema
O Replit não está rodando `npm install` antes do build, causando erro: "vite não foi encontrado"

## Solução - Siga estes passos EXATAMENTE:

### **PASSO 1: No seu Replit, abra o arquivo `.replit`**

1. Clique no arquivo `.replit` na barra lateral esquerda
2. Procure pela seção `[deployment]` (mais ou menos na linha 9-12)
3. Deve estar assim:
```
[deployment]
deploymentTarget = "autoscale"
build = ["npm", "run", "build"]
run = ["npm", "run", "start"]
```

### **PASSO 2: EDITE assim:**

Altere a linha `build =` para:
```
build = ["npm", "ci", "&&", "npm", "run", "build"]
```

Assim ficará:
```
[deployment]
deploymentTarget = "autoscale"
build = ["npm", "ci", "&&", "npm", "run", "build"]
run = ["npm", "run", "start"]
```

### **PASSO 3: Salve o arquivo**

Clique em `Ctrl+S` ou procure o botão "Save"

### **PASSO 4: Faça Publish**

1. Clique em "Publish" no topo do Replit
2. Se já publicada, primeiro clique "Unpublish"
3. Depois clique "Publish" novamente
4. Aguarde 3-5 minutos o build completar

### **PASSO 5: Teste**

Abra: `https://bibliainteligente.replit.app`

Deve carregar sem erros!

---

## 🤔 Se Não Conseguir Editar `.replit`

Se o arquivo `.replit` estiver protegido e não deixar editar, contate o suporte Replit porque isso significa que sua conta tem restrições especiais.

---

## ✅ Confirme Que Fez:

- [ ] Abri o arquivo `.replit`
- [ ] Encontrei a linha `build = ["npm", "run", "build"]`
- [ ] Mudei para `build = ["npm", "ci", "&&", "npm", "run", "build"]`
- [ ] Salvei o arquivo
- [ ] Cliquei em "Publish"
- [ ] Aguardei o build completar

---

**Faça isso e a app vai publicar com sucesso!** 🚀
