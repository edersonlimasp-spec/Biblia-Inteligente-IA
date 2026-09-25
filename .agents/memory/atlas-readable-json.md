---
name: Fichas Atlas legíveis
description: Por que manter mapas do Atlas em JSON multiline durante a redação e revisão editorial.
---

Criar e manter fichas de mapas do Atlas em JSON formatado, com campos e
objetos em linhas separadas, antes da auditoria de lugares e referências.

**Why:** Um lote gerado como uma única linha por arquivo impediu correções
pontuais com o mecanismo de patches. A revisão encontrou paradas narrativas
faltando e um último dígito divergente numa coordenada; corrigir esses pontos
exigiu reescrever arquivos inteiros em vez de pequenas alterações verificáveis.

**How to apply:** Em lotes futuros de mapas, formatar os JSONs ao criá-los,
antes de delegar revisão independente; validar correspondência exata com a
fonte retida e a cobertura de passos antes de marcar o manifesto como
disponível.