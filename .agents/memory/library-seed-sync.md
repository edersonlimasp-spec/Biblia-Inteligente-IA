---
name: Sincronização da Biblioteca (seed)
description: Regras duráveis do seed que copia livros do Neon — chaves de casamento e detecção de revisões por updated_at
---
- Casamento de livros entre bancos: chave estável `source_book_id` → mesmo id → título (fallback). Capítulos casam por (book_id, order_num); índice único protege contra duplicatas. **Why:** ids podem diferir entre bancos e casar só por id ou só por título já causou duplicação.
- Revisões (texto de capítulos e metadados de livros, inclusive título) propagam quando o updated_at da fonte é mais recente; o seed espelha o updated_at da fonte (nunca "agora"), senão o local fica sempre "mais novo" e bloqueia revisões futuras. Fonte vazia nunca apaga texto local.
- Título só é sobrescrito quando o casamento foi por chave estável — no fallback por título, o título é a própria chave. A origem do casamento deve ser preservada antes do backfill; o backfill não pode transformar o fallback em autorização para renomear na mesma execução.
- **How to apply:** renomear livro na fonte é seguro depois que um sync fez o backfill de source_book_id no banco de destino.
