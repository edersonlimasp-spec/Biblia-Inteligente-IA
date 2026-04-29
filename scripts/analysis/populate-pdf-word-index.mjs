#!/usr/bin/env node
/**
 * Popula a tabela pdf_word_index a partir do JSON gerado por
 * parse-pdf-words-flat.mjs (/tmp/pdf-word-index.json).
 *
 * Faz UPSERT em batches dentro de uma transação.
 */

import fs from 'fs';
import pg from 'pg';

const { Pool } = pg;

const JSON_PATH = '/tmp/pdf-word-index.json';

async function main() {
  const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Limpa antes (idempotente)
    await client.query('DELETE FROM pdf_word_index');
    console.log('Tabela limpa.');

    let total = 0;
    for (const [bookId, words] of Object.entries(data)) {
      const entries = Object.entries(words);
      if (entries.length === 0) continue;

      // Insere em batches de 500
      const BATCH = 500;
      for (let i = 0; i < entries.length; i += BATCH) {
        const slice = entries.slice(i, i + BATCH);
        const values = [];
        const params = [];
        let paramIdx = 1;
        for (const [word, info] of slice) {
          values.push(`($${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++})`);
          params.push(bookId, word.slice(0, 64), info.strong.slice(0, 8), info.count);
        }
        const sql = `
          INSERT INTO pdf_word_index (book_id, word_norm, strong_number, occurrences)
          VALUES ${values.join(',')}
          ON CONFLICT (book_id, word_norm) DO UPDATE
            SET strong_number = EXCLUDED.strong_number,
                occurrences = EXCLUDED.occurrences
        `;
        await client.query(sql, params);
        total += slice.length;
      }
      process.stdout.write(`  ${bookId} → ${entries.length} palavras\n`);
    }

    await client.query('COMMIT');
    console.log(`\nTOTAL inserido: ${total}`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
