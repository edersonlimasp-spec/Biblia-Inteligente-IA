---
name: Dados Strong em produção
description: Como bible_words e pdf_word_index chegam à produção e como foi feita a cobertura de Mateus
---

- Produção (banco gerenciado Replit) recebia schema no Publish mas ZERO dados de `bible_words` e `pdf_word_index` — o recurso Strong em produção rodava só com os mapas curados do código, cobertura bem menor que no dev.
- **Regra:** dados Strong chegam à produção via `server/seed-strong-words.ts` (chamado em background no `init-db`), que copia do Neon (`NEON_DATABASE_URL`). O Neon é a fonte da verdade e precisa ser mantido em espelho do dev (dump/restore) quando se altera essas tabelas no dev.
- **Why:** o Publish migra schema, não dados; o padrão do projeto é seed idempotente a partir do Neon (mesmo modelo da Biblioteca).
- **How to apply:** ao adicionar linhas a `bible_words`/`pdf_word_index` no dev, replicar no Neon (pg_dump -Fc dessas tabelas + pg_restore) e republicar; o seed copia só livros vazios (bible_words) ou com menos linhas (pdf_word_index) — nunca toca livros divergentes (evita duplicatas, pois bible_words não tem chave lógica única).
- Cobertura Strong de Mateus levada de 88,2% → 99,8% (ago 2026): resolução determinística (variantes/clíticos/stemming contra índice global do PDF ARA) + alinhamento LLM constrangido aos Strongs reais de cada versículo (nunca inventa números); 13 palavras ficaram honestamente sem mapa. Método reutilizável para outros livros; scripts-modelo em /tmp daquela sessão (resolve*.py, align.mjs — recriar se preciso).
- Drizzle `db.execute(sql\`...\`)` NÃO binda arrays JS como arrays SQL (vira record); para bulk insert parametrizado usar `jsonb_to_recordset(${JSON.stringify(rows)}::jsonb) AS u(col tipo, ...)`.
