---
name: Banco de produção real
description: Qual banco o app publicado realmente usa e como popular conteúdo lá
---
O app publicado (bibliainteligente.replit.app) usa o banco PostgreSQL gerenciado da Replit via DATABASE_URL de produção — NÃO o Neon. O Publish migra só o schema, sem dados, então conteúdo (ex.: livros da Biblioteca) fica vazio em produção.

**Why:** Em jul/2026 a Biblioteca apareceu vazia em produção apesar de NEON_DATABASE_URL ter os 2 livros completos; o executeSql(environment: production) confirmou library_books vazio no banco gerenciado.

**How to apply:** Conteúdo novo deve chegar à produção via seed idempotente no startup (`server/seed-library.ts` copia do Neon quando a tabela está vazia) ou mecanismo equivalente; escrever direto no banco de produção não é possível pelas ferramentas (somente leitura). Gravar nos "2 bancos" (dev + Neon) continua necessário: o Neon é a fonte que o seed copia.
