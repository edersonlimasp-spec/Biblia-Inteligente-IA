---
name: Clerk no appPreview local
description: Como distinguir o falso erro de proxy do Clerk no capturador local de um defeito real de publicação.
---

O capturador `appPreview` acessa o app por `127.0.0.1`. Nesse contexto, o Clerk pode tentar `/api/__clerk` durante desenvolvimento; como o proxy oficial é intencionalmente production-only, o fallback do Vite devolve HTML e o overlay mostra `Unexpected token '<'`. Isso não prova que a publicação está quebrada.

**Why:** alterar o `ClerkProvider`, ativar o proxy em desenvolvimento ou editar os segredos gerenciados para eliminar esse falso positivo pode quebrar a autenticação real de produção. Também é possível deixar processos antigos ocupando a porta após reinícios sucessivos, confundindo o diagnóstico.

**How to apply:** confirme que existe uma única instância do workflow, mantenha a configuração canônica do Clerk e teste o build isoladamente com `NODE_ENV=production` numa porta temporária. A rota `/api/__clerk/npm/.../clerk.browser.js`, com host/protocolo encaminhados de produção, deve responder `application/javascript`, não HTML. Remova depois qualquer porta temporária adicionada automaticamente à configuração.

O handshake de desenvolvimento também pode acontecer no middleware do servidor antes de carregar uma página pública que não usa Clerk no cliente, inclusive no domínio de preview com um navegador real. Um teste isolado do build estático confirma UI e comportamento do cliente, mas não deve ser apresentado como validação da autenticação ou de uma compra real em produção.