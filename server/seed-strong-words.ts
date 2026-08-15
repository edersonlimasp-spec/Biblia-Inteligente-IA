import { db } from './db';
import { sql } from 'drizzle-orm';

/**
 * Seed dos dados Strong (interlinear + índice do PDF SBB) — copia do banco de
 * conteúdo (NEON_DATABASE_URL) para o banco atual.
 *
 * Motivo: em produção o app usa o banco gerenciado da Replit, cujo schema é
 * migrado no Publish mas sem dados. Os dados Strong por ocorrência vivem em
 * `bible_words` (tokens gregos/hebraicos por versículo) e `pdf_word_index`
 * (palavra portuguesa → Strong por livro, extraído do PDF SBB Almeida-Strong).
 * Sem eles, o endpoint /api/bible/:book/:chapter/strong-words só conta com os
 * mapas curados embutidos no código, com cobertura muito menor.
 *
 * Comportamento (idempotente, nunca gera dados — apenas copia):
 * - Advisory lock impede execuções concorrentes (múltiplas instâncias).
 * - bible_words: copia um livro APENAS quando o local está vazio para aquele
 *   livro (sem chave lógica única, cópia parcial poderia duplicar tokens).
 *   Livros com contagem divergente são reportados, nunca tocados.
 * - pdf_word_index: upsert por (book_id, word_norm) — chave primária real —
 *   somente em livros com menos linhas que a fonte.
 * - Todos os valores da fonte entram como parâmetros bound (sem interpolação).
 * - Nunca apaga dados locais.
 */
export async function seedStrongWords(): Promise<void> {
  const sourceUrl = process.env.NEON_DATABASE_URL;
  if (!sourceUrl) {
    console.log('📖 NEON_DATABASE_URL não definido — seed Strong ignorado');
    return;
  }

  const { Pool } = await import('@neondatabase/serverless');
  const source = new Pool({ connectionString: sourceUrl });

  // Lock exclusivo entre instâncias; se outra instância estiver semeando, sai.
  const LOCK_KEY = 771231001;
  const lockRes = await db.execute(sql`SELECT pg_try_advisory_lock(${LOCK_KEY}) AS got`);
  const got = (lockRes as any).rows?.[0]?.got;
  if (!got) {
    console.log('📖 Strong seed: outra instância está semeando — ignorado');
    await source.end().catch(() => {});
    return;
  }

  try {
    // Garante a tabela em produção antiga (está no schema Drizzle, então o
    // Publish também a cria; isto é apenas rede de segurança idempotente).
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS pdf_word_index (
        book_id varchar(8) NOT NULL,
        word_norm varchar(64) NOT NULL,
        strong_number varchar(8) NOT NULL,
        occurrences integer NOT NULL DEFAULT 1,
        PRIMARY KEY (book_id, word_norm)
      )
    `);

    const perBook = async (table: 'bible_words' | 'pdf_word_index', col: 'book' | 'book_id') => {
      const srcRes = await source.query(`SELECT ${col} AS b, count(*)::int AS c FROM ${table} GROUP BY 1`);
      const locRes = await db.execute(sql.raw(`SELECT ${col} AS b, count(*)::int AS c FROM ${table} GROUP BY 1`));
      const map = new Map<string, { src: number; loc: number }>();
      for (const r of srcRes.rows) map.set(r.b, { src: Number(r.c), loc: 0 });
      for (const r of (locRes as any).rows as any[]) {
        const e = map.get(r.b);
        if (e) e.loc = Number(r.c);
        else map.set(r.b, { src: 0, loc: Number(r.c) });
      }
      return map;
    };

    // ── bible_words: só copia livros totalmente vazios no destino ─────────
    let bwCopied = 0;
    const divergent: string[] = [];
    for (const [book, { src, loc }] of Array.from(await perBook('bible_words', 'book'))) {
      if (src === 0 || loc >= src) continue;
      if (loc > 0) { divergent.push(`${book} (${loc}/${src})`); continue; }
      const rowsRes = await source.query(
        `SELECT id, chapter, verse, word_position, original_word, strong_number, pdf_strong, morphology, gloss
         FROM bible_words WHERE book = $1 ORDER BY chapter, verse, word_position`, [book]);
      const rows = rowsRes.rows;
      const BATCH = 2000;
      for (let i = 0; i < rows.length; i += BATCH) {
        const b = rows.slice(i, i + BATCH);
        await db.execute(sql`
          INSERT INTO bible_words (id, book, chapter, verse, word_position, original_word, strong_number, pdf_strong, morphology, gloss)
          SELECT u.id, ${book}, u.chapter, u.verse, u.word_position, u.original_word, u.strong_number, u.pdf_strong, u.morphology, u.gloss
          FROM jsonb_to_recordset(${JSON.stringify(b)}::jsonb)
            AS u(id varchar, chapter int, verse int, word_position int, original_word text, strong_number text, pdf_strong text, morphology text, gloss text)
          ON CONFLICT (id) DO NOTHING
        `);
      }
      bwCopied += rows.length;
    }
    if (divergent.length) {
      console.warn(`📖 Strong seed: livros com contagem divergente NÃO tocados (evita duplicatas): ${divergent.join(', ')}`);
    }

    // ── pdf_word_index: upsert por chave primária real ────────────────────
    let pwCopied = 0;
    for (const [book, { src, loc }] of Array.from(await perBook('pdf_word_index', 'book_id'))) {
      if (src === 0 || loc >= src) continue;
      const rowsRes = await source.query(
        `SELECT word_norm, strong_number, occurrences FROM pdf_word_index WHERE book_id = $1`, [book]);
      const rows = rowsRes.rows;
      const BATCH = 5000;
      for (let i = 0; i < rows.length; i += BATCH) {
        const b = rows.slice(i, i + BATCH);
        await db.execute(sql`
          INSERT INTO pdf_word_index (book_id, word_norm, strong_number, occurrences)
          SELECT ${book}, u.word_norm, u.strong_number, u.occurrences
          FROM jsonb_to_recordset(${JSON.stringify(b)}::jsonb)
            AS u(word_norm varchar, strong_number varchar, occurrences int)
          ON CONFLICT (book_id, word_norm) DO NOTHING
        `);
      }
      pwCopied += rows.length - loc;
    }

    if (bwCopied > 0 || pwCopied > 0) {
      console.log(`📖 Strong seed: ${bwCopied} linhas bible_words e ~${pwCopied} linhas pdf_word_index copiadas da fonte`);
    } else {
      console.log('📖 Strong seed: dados já sincronizados com a fonte');
    }
  } catch (e) {
    console.error('📖 Strong seed falhou (app continua com mapas embutidos; nova tentativa no próximo boot):', e);
  } finally {
    await db.execute(sql`SELECT pg_advisory_unlock(${LOCK_KEY})`).catch(() => {});
    await source.end().catch(() => {});
  }
}
