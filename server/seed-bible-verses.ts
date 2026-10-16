import { db } from './db';
import { sql } from 'drizzle-orm';

type BibleVersionColumn =
  | 'id'
  | 'code'
  | 'name'
  | 'language'
  | 'license'
  | 'source_url'
  | 'is_active'
  | 'created_at';

const BIBLE_VERSIONS_COLUMN_TYPES: Record<BibleVersionColumn, string> = {
  id: 'varchar',
  code: 'text',
  name: 'text',
  language: 'text',
  license: 'text',
  source_url: 'text',
  is_active: 'boolean',
  created_at: 'timestamp',
};

const BIBLE_VERSIONS_COMMON_COLUMN_CANDIDATES: BibleVersionColumn[] = [
  'id',
  'code',
  'name',
  'language',
  'license',
  'source_url',
  'is_active',
  'created_at',
];

/**
 * Copia os textos bíblicos do banco de conteúdo (NEON_DATABASE_URL) para o
 * banco atual somente para versões que ainda não tenham nenhuma linha local.
 * Versões com dados parciais são preservadas e apenas sinalizadas.
 */
export async function seedBibleVerses(): Promise<void> {
  const sourceUrl = process.env.NEON_DATABASE_URL;
  if (!sourceUrl) {
    console.log('📖 NEON_DATABASE_URL não definido — seed de versículos ignorado');
    return;
  }

  let source: InstanceType<(typeof import('@neondatabase/serverless'))['Pool']> | undefined;
  let lockAcquired = false;
  const LOCK_KEY = 771231002;

  try {
    const { Pool } = await import('@neondatabase/serverless');
    source = new Pool({ connectionString: sourceUrl });

    const lockResult = await db.execute(sql`SELECT pg_try_advisory_lock(${LOCK_KEY}) AS got`);
    lockAcquired = Boolean((lockResult as any).rows?.[0]?.got);
    if (!lockAcquired) {
      console.log('📖 Bible verses seed: outra instância está semeando — ignorado');
      return;
    }

    const sourceCountsResult = await source.query(
      `SELECT version_code, COUNT(*)::bigint AS row_count
       FROM bible_verses
       GROUP BY version_code
       ORDER BY version_code`
    );
    const destinationCountsResult = await db.execute(sql`
      SELECT version_code, COUNT(*)::bigint AS row_count
      FROM bible_verses
      GROUP BY version_code
    `);

    const destinationCounts = new Map<string, number>();
    for (const row of ((destinationCountsResult as any).rows || []) as Array<{ version_code: string; row_count: string | number }>) {
      destinationCounts.set(row.version_code, Number(row.row_count));
    }

    const sourceVersionColumnsResult = await source.query(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = $1`,
      ['bible_versions']
    );
    const destinationVersionColumnsResult = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'bible_versions'
    `);
    const sourceVersionColumns = new Set<string>(
      sourceVersionColumnsResult.rows.map((row: { column_name: string }) => row.column_name)
    );
    const destinationVersionColumns = new Set<string>(
      (((destinationVersionColumnsResult as any).rows || []) as Array<{ column_name: string }>)
        .map((row) => row.column_name)
    );
    const sharedVersionColumns = BIBLE_VERSIONS_COMMON_COLUMN_CANDIDATES.filter(
      (column) => sourceVersionColumns.has(column) && destinationVersionColumns.has(column)
    );

    if (!sharedVersionColumns.includes('code')) {
      console.warn('📖 Bible verses seed: coluna code comum não encontrada em bible_versions — seed ignorado');
      return;
    }

    const BATCH_SIZE = 2000;
    let totalCopied = 0;

    for (const version of sourceCountsResult.rows as Array<{ version_code: string; row_count: string | number }>) {
      const versionCode = version.version_code;
      const sourceCount = Number(version.row_count);
      const destinationCount = destinationCounts.get(versionCode) || 0;

      if (destinationCount === sourceCount) {
        console.log(`📖 Bible verses seed: ${versionCode} já sincronizada (${destinationCount} linhas)`);
        continue;
      }
      if (destinationCount > 0) {
        console.warn(
          `📖 Bible verses seed: ${versionCode} com contagem divergente (${destinationCount}/${sourceCount}); NÃO tocada`
        );
        continue;
      }
      if (sourceCount === 0) continue;

      try {
        const sourceVersionResult = await source.query(
          `SELECT ${sharedVersionColumns.join(', ')}
           FROM bible_versions
           WHERE code = $1
           LIMIT 1`,
          [versionCode]
        );
        const sourceVersion = sourceVersionResult.rows[0];
        if (!sourceVersion) {
          console.warn(`📖 Bible verses seed: versão ${versionCode} sem linha em bible_versions na fonte; ignorada`);
          continue;
        }

        const insertVersionColumns = sql.raw(sharedVersionColumns.join(', '));
        const selectVersionColumns = sql.raw(sharedVersionColumns.map((column) => `u.${column}`).join(', '));
        const versionRecordDefinition = sql.raw(
          sharedVersionColumns
            .map((column) => `${column} ${BIBLE_VERSIONS_COLUMN_TYPES[column]}`)
            .join(', ')
        );
        await db.execute(sql`
          INSERT INTO bible_versions (${insertVersionColumns})
          SELECT ${selectVersionColumns}
          FROM jsonb_to_recordset(${JSON.stringify([sourceVersion])}::jsonb)
            AS u(${versionRecordDefinition})
          ON CONFLICT (code) DO NOTHING
        `);

        for (let offset = 0; offset < sourceCount; offset += BATCH_SIZE) {
          const sourceRowsResult = await source.query(
            `SELECT id, version_code, book, chapter, verse, text
             FROM bible_verses
             WHERE version_code = $1
             ORDER BY id
             LIMIT $2 OFFSET $3`,
            [versionCode, BATCH_SIZE, offset]
          );
          const rows = sourceRowsResult.rows;
          if (rows.length === 0) break;

          await db.execute(sql`
            INSERT INTO bible_verses (id, version_code, book, chapter, verse, text)
            SELECT u.id, u.version_code, u.book, u.chapter, u.verse, u.text
            FROM jsonb_to_recordset(${JSON.stringify(rows)}::jsonb)
              AS u(id varchar, version_code text, book text, chapter integer, verse integer, text text)
            ON CONFLICT (id) DO NOTHING
          `);
        }

        const copiedResult = await db.execute(sql`
          SELECT COUNT(*)::bigint AS row_count
          FROM bible_verses
          WHERE version_code = ${versionCode}
        `);
        const copiedCount = Number((copiedResult as any).rows?.[0]?.row_count || 0);
        const copied = Math.max(0, copiedCount - destinationCount);
        totalCopied += copied;
        console.log(`📖 Bible verses seed: ${versionCode}: ${copied} linhas copiadas`);
      } catch (error) {
        console.error(`📖 Bible verses seed falhou para ${versionCode} (dados preservados):`, error);
      }
    }

    if (totalCopied === 0) {
      console.log('📖 Bible verses seed: nenhuma versão vazia precisou de cópia');
    }
  } catch (error) {
    console.error('📖 Bible verses seed falhou (app continua com fallback):', error);
  } finally {
    if (lockAcquired) {
      await db.execute(sql`SELECT pg_advisory_unlock(${LOCK_KEY})`).catch((error) => {
        console.error('📖 Bible verses seed: falha ao liberar advisory lock:', error);
      });
    }
    await source?.end().catch((error) => {
      console.error('📖 Bible verses seed: falha ao fechar conexão da fonte:', error);
    });
  }
}
