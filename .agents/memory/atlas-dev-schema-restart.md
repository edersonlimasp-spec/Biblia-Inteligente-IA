---
name: Schema Atlas em desenvolvimento
description: Diferença entre a validação local do conteúdo e o schema mantido no processo do servidor.
---

Quando um JSON do Atlas passa pela validação local mas o catálogo o ignora, confira se o servidor de desenvolvimento ainda está executando uma versão anterior do schema compartilhado. Reinicie o workflow antes de modificar conteúdo válido ou afrouxar validação.

**Why:** A validação local aceitava uma camada pontual enquanto o processo antigo do servidor ainda emitia erro de enumeração para aquela mesma camada.

**How to apply:** Depois de alterar schema compartilhado, reinicie o workflow e compare o catálogo servido com a validação de todos os arquivos no disco.