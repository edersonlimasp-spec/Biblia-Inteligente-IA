---
name: Routes split boundary detection
description: Ao dividir um arquivo routes.ts gigante em módulos de domínio, como detectar corretamente as fronteiras de cada seção para não cortar handlers no meio.
---

## Regra

Ao extrair seções de `server/routes.ts` para arquivos de domínio usando ranges de linhas, **a fronteira de corte deve ser na linha onde o último handler fecha (`  });`)**, não em uma linha de conteúdo do corpo do handler.

## Por que

Handlers Express com `async (req, res) => { ... }` abrem múltiplos níveis de chaves e parênteses. Se a extração termina no meio de um bloco `try/catch` (ex: na linha do `console.error`), o arquivo destino fica com parênteses abertos não fechados → esbuild/tsc reporta "Expected ')' but found end of file".

## Como aplicar

Antes de definir os ranges:
1. Grep por `^  app\.(get|post|...) ` para listar todos os starts de handlers.
2. Para cada fronteira de domínio, verificar que a linha anterior ao start do próximo domínio é `  });` (fechamento de handler), não corpo de handler.
3. Se uma fronteira cai no meio de um handler, mover o range para incluir o fechamento completo do handler (`  });`).
4. Código que "sobrou" num arquivo errado (ex: `res.status(500).json(...)`) deve ser movido para o arquivo correto ou removido se duplicado.

## Sintoma observado

- `admin.ts`: handler `/api/admin/logs` cortado no meio → `"Expected ')' but found end of file"` na última linha.
- `study.ts`: primeiras 3 linhas do corpo tinham o fechamento do handler do admin (`res.status(500).json; }; });`).
- Fix: inserir as 3 linhas de fechamento no local certo em `admin.ts` e removê-las de `study.ts`.

## Atenção extra

Ao incluir seções não-contíguas em um arquivo (ex: admin.ts tem 5 seções), verificar que CADA junção está em uma fronteira limpa. A última seção extraída não deve incluir o código de criação do servidor (`const httpServer = createServer(app); return httpServer; }`) que pertence ao orquestrador.
