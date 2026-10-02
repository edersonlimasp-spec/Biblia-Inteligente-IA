---
name: Retorno dos hooks do Vitest
description: Retornar acidentalmente uma função mock de um hook registra uma limpeza executável no Vitest.
---

Não use retorno implícito de operações que devolvem uma função mock em `beforeEach`/`afterEach`, a menos que queira registrar uma limpeza.

**Why:** no Vitest 4, devolver uma função de um hook faz essa função ser executada na limpeza. Uma expressão como `() => mock.mockReset()` devolve o próprio mock; uma implementação que lança pode fazer o teste falhar depois de todas as expectativas passarem.

**How to apply:** envolva operações de preparação em chaves sem retorno. Ao investigar uma falha que aparece depois de uma expectativa bem-sucedida, verifique se um hook devolveu acidentalmente uma função.