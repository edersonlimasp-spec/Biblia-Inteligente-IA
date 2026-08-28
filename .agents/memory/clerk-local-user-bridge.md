---
name: Clerk e UUID local
description: Regra de identidade para preservar dados locais ao autenticar com Clerk.
---

As sessões web do Clerk devem resolver a conta de dados existente pelo e-mail verificado das claims e continuar usando o UUID da linha local em todas as relações. Nunca usar `auth.userId` como ID do banco local.

**Why:** O aplicativo já criava UUIDs próprios para usuários e todas as assinaturas, marcações e progressos dependem deles; os IDs nativos do Clerk não correspondem a essas relações.

**How to apply:** Em novos endpoints autenticados, usar somente o usuário local anexado pelo middleware central. Como hardening futuro, criar um vínculo persistente e imutável entre o subject Clerk e o UUID local para suportar troca de e-mail sem separar os dados.