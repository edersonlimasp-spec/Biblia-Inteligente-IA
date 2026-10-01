---
name: Isolamento do transformador de testes
description: Vitest pode usar um Vite diferente do servidor do app; configurar JSX no transformador realmente carregado.
---

Trate o transformador de JSX dos testes separadamente do build do aplicativo. Verifique a versão de Vite carregada pelo Vitest antes de escolher opções; nesta instalação ele usa Oxc, e opções de JSX do esbuild podem ser ignoradas.

**Why:** testes que importam componentes TSX falharam na análise de imports embora o build do app estivesse correto. Tentar configurar esbuild não resolveu porque o runner carregava outro transformador.

**How to apply:** ajuste a configuração do runner, não o tsconfig ou o Vite do aplicativo, quando somente os testes de componentes rejeitarem JSX. Não troque dependências do app para resolver esse problema de testes.