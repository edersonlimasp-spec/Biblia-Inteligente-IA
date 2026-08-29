---
name: Cache de autenticação nativa
description: Regra para evitar perda indevida da sessão JWT no aplicativo Capacitor.
---

`/api/auth/me` deve sempre responder com corpo JSON e sem cache/ETag; chamadas autenticadas do cliente nativo também devem usar `cache: "no-store"`. Respostas 401 devem indicar explicitamente que é necessário entrar.

**Why:** um 304 sem corpo foi interpretado como falha ao analisar JSON durante a inicialização, fazendo o app apagar um JWT ainda válido. A consulta Strong seguinte chegou sem autenticação e a interface apresentou incorretamente “termo não encontrado”.

**How to apply:** em qualquer refatoração de autenticação ou cache HTTP, preserve respostas 200 sem cache para o bootstrap de sessão e diferencie falha de login de ausência de dados na interface.