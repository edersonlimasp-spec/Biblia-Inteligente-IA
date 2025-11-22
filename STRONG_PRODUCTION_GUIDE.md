# Guia de Diagnóstico e Correção - Strong's Dictionary em Produção

## ❌ Problema Relatado
"A Bíblia Strong após a publicação deixou de funcionar"

## ✅ Status Local
- Testado: Funciona 100% localmente
- Dados: 14.197 entradas presentes
- APIs: Todas respondendo corretamente

## 🔍 Possíveis Causas em Produção

### 1. **Banco de Dados em Produção Vazio**
Se você publicou a aplicação e criou um novo Replit project com um novo banco de dados Neon, o banco de produção não terá os dados do Strong.

**Solução:** Executar o script de importação em produção

```bash
# 1. Conectar ao Replit (ou usar o console do Replit)
# 2. Executar:
npm run db:push  # Sincronizar schema
tsx scripts/import-full-strongs.ts  # Importar dados do Strong
```

### 2. **DATABASE_URL Incorreto em Produção**
O `DATABASE_URL` em produção pode estar apontando para um banco diferente.

**Solução:** Verificar Secrets em Produção
1. Ir para Secrets (engrenagem)
2. Verificar se `DATABASE_URL` está correto
3. Comparar com o banco local
4. Se diferente, copiar o `DATABASE_URL` local para produção

### 3. **Erro na Query do Strong**
Pode haver um problema com a query SQL do Strong em produção.

**Solução:** Testar a API diretamente
```bash
# Testar login
curl -X POST https://seu-app.replit.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"seu@email.com","password":"sua-senha"}'

# Testar Strong (substitua TOKEN pelo token recebido acima)
curl https://seu-app.replit.app/api/strong/G3004 \
  -H "Authorization: Bearer TOKEN"
```

## 📋 Checklist de Diagnóstico

- [ ] **1. Verificar se o banco tem dados**
  ```sql
  SELECT COUNT(*) FROM strong_entries;
  ```
  Se retornar 0: Dados não foram importados

- [ ] **2. Verificar estrutura da tabela**
  ```sql
  \d strong_entries
  ```

- [ ] **3. Verificar se há erros nas logs**
  Abrir console do servidor em produção e procurar por erros

- [ ] **4. Testar API diretamente**
  Usar curl para testar `/api/strong/search/:query`

## 🔧 Passos para Corrigir

### Se o Banco Está Vazio:

```bash
# No Replit (após publicar):
npm run db:push
tsx scripts/import-full-strongs.ts
```

Aguarde ~5 minutos para importar 14.197 entradas.

### Se o DATABASE_URL Está Errado:

1. Ir em "Secrets" (engrenagem no Replit)
2. Verificar/atualizar `DATABASE_URL`
3. Reiniciar o servidor

## 📊 Verificar Dados Após Correção

```bash
# Contar entradas
psql $DATABASE_URL -c "SELECT COUNT(*) FROM strong_entries;"

# Verificar se português está preenchido
psql $DATABASE_URL -c "SELECT * FROM strong_entries WHERE portuguese_def IS NOT NULL LIMIT 5;"
```

## 🎯 Resultado Esperado

Após correção:
- ✅ `/api/strong/search/:query` retorna resultados
- ✅ Cliques em palavras Strong abrem o modal
- ✅ Definições em português aparecem
- ✅ Sistema de acesso (trial/subscription) funciona

---

**Dúvidas?** Verificar:
1. Logs do servidor em produção
2. Status do banco de dados Neon
3. Se DATABASE_URL está correto em Secrets
