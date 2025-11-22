# 📋 COMANDOS FINAIS - COPIAR E COLAR

## Para o Publish UI → Advanced Settings

### 🔴 Build Command (EXATAMENTE ISTO)

Selecione tudo no campo "Build command" e **copie e cole:**

```
npm ci && npm run build && mkdir -p server/public && cp -r dist/public/* server/public/
```

### 🟢 Run Command (EXATAMENTE ISTO)

Selecione tudo no campo "Run command" e **copie e cole:**

```
npm run start
```

---

## ✅ Checklist

- [ ] Build command tem: `npm ci && npm run build && mkdir -p server/public && cp -r dist/public/* server/public/`
- [ ] Run command tem: `npm run start`
- [ ] Clicou Deploy (azul)
- [ ] Aguardou 5-10 minutos
- [ ] URL abriu! ✅

---

## 🎯 Resultado Esperado

```
https://bibliainteligente.replit.app

✅ Abre sem erros
✅ Home carrega
✅ Todos recursos carregam
✅ PWA funciona
✅ Pronto para clientes!
```

---

## 💪 Você consegue!

