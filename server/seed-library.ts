import { db } from './db';
import { libraryBooks, libraryChapters } from '@shared/schema';
import { sql, eq, and } from 'drizzle-orm';

/**
 * Seed da Biblioteca — copia livros e capítulos do banco de conteúdo (Neon)
 * para o banco atual.
 *
 * Motivo: em produção o app usa o banco gerenciado da Replit, cujo schema é
 * migrado no Publish mas sem dados. O conteúdo autoral dos livros vive no
 * banco Neon (NEON_DATABASE_URL).
 *
 * Comportamento (idempotente, nunca gera conteúdo — apenas copia):
 * - Insere livros/capítulos que ainda não existem (onConflictDoNothing).
 * - Atualiza capítulos cujo conteúdo local está vazio quando a fonte tem texto.
 * - Atualiza capítulos revisados na fonte: quando o updated_at da fonte é mais
 *   recente que o local E a fonte tem texto não-vazio, o texto revisado é
 *   copiado por cima (o updated_at local passa a espelhar o da fonte, para que
 *   revisões futuras continuem detectáveis).
 * - Sincroniza chapters_count/publish_status dos livros com a fonte.
 * - Atualiza metadados de livros revisados na fonte (title, subtitle,
 *   description, cover_url, author, edition_note etc.) via comparação de
 *   updated_at. O título só é atualizado quando o livro está casado pela
 *   chave estável source_book_id (nunca no fallback por título).
 * - Nunca substitui texto local existente por texto vazio da fonte.
 *
 * Retorna um resumo com contagens de livros/capítulos inseridos e atualizados
 * (usado pelo endpoint admin de sincronização sob demanda).
 */
export interface LibrarySeedResult {
  ok: boolean;
  skipped?: string;
  error?: string;
  sourceBooks: number;
  sourceChapters: number;
  booksInserted: number;
  booksUpdated: number;
  chaptersInserted: number;
  chaptersUpdated: number;
}

export async function seedLibraryBooks(): Promise<LibrarySeedResult> {
  const result: LibrarySeedResult = {
    ok: false,
    sourceBooks: 0,
    sourceChapters: 0,
    booksInserted: 0,
    booksUpdated: 0,
    chaptersInserted: 0,
    chaptersUpdated: 0,
  };
  try {
    const sourceUrl = process.env.NEON_DATABASE_URL;
    if (!sourceUrl) {
      console.log('📚 NEON_DATABASE_URL não está definido — seed da Biblioteca ignorado');
      result.skipped = 'NEON_DATABASE_URL não está definido';
      return result;
    }

    console.log('📚 Sincronizando Biblioteca com o banco de conteúdo...');

    const { Pool } = await import('@neondatabase/serverless');
    const source = new Pool({ connectionString: sourceUrl });

    try {
      const booksRes = await source.query('SELECT * FROM library_books');
      const chaptersRes = await source.query('SELECT * FROM library_chapters');

      result.sourceBooks = booksRes.rows.length;
      result.sourceChapters = chaptersRes.rows.length;

      if (booksRes.rows.length === 0) {
        console.log('📚 Banco de conteúdo sem livros — nada a copiar');
        result.ok = true;
        result.skipped = 'Banco de conteúdo sem livros';
        return result;
      }

      // Livros locais existentes, casados por chave estável (source_book_id,
      // o id do livro na fonte) com fallback para o TÍTULO. O fallback cobre
      // livros antigos ainda sem source_book_id preenchido; após o primeiro
      // sync o casamento passa a ser pela chave estável, o que permite
      // propagar até correções de título sem duplicar livros.
      const localBooks = await db.select().from(libraryBooks);
      const localBySourceId = new Map(
        localBooks.filter((lb) => lb.sourceBookId).map((lb) => [lb.sourceBookId as string, lb]),
      );
      const localById = new Map(localBooks.map((lb) => [lb.id, lb]));
      const localByTitle = new Map(localBooks.map((lb) => [lb.title, lb]));
      // id do livro na fonte → id do livro local correspondente
      const bookIdMap = new Map<string, string>();

      for (const b of booksRes.rows) {
        // Ordem de casamento: chave estável source_book_id → mesmo id
        // (livro legado copiado com o id da fonte, antes da coluna existir)
        // → título (fallback final para cópias locais com id próprio).
        const existing =
          localBySourceId.get(b.id) ?? localById.get(b.id) ?? localByTitle.get(b.title);
        if (existing) {
          bookIdMap.set(b.id, existing.id);
          // Backfill da chave estável em livros casados pelo título
          if (existing.sourceBookId !== b.id) {
            await db
              .update(libraryBooks)
              .set({ sourceBookId: b.id })
              .where(eq(libraryBooks.id, existing.id));
            existing.sourceBookId = b.id;
          }
          continue;
        }
        bookIdMap.set(b.id, b.id);
        await db.insert(libraryBooks).values({
          id: b.id,
          sourceBookId: b.id,
          title: b.title,
          subtitle: b.subtitle,
          author: b.author,
          description: b.description,
          coverUrl: b.cover_url,
          category: b.category,
          accessType: b.access_type,
          price: b.price,
          planRequired: b.plan_required,
          estimatedReadTime: b.estimated_read_time,
          chaptersCount: b.chapters_count,
          publishStatus: b.publish_status,
          isNew: b.is_new,
          editionNote: b.edition_note,
          createdAt: b.created_at,
          updatedAt: b.updated_at,
        }).onConflictDoNothing();
        result.booksInserted++;
      }

      // Capítulos locais por (id do livro local, order_num) — evita duplicar
      // capítulos quando os ids diferem entre fonte e banco local.
      const localChapters = await db.select({
        id: libraryChapters.id,
        bookId: libraryChapters.bookId,
        orderNum: libraryChapters.orderNum,
        contentLen: sql<number>`length(${libraryChapters.content})`,
        updatedAt: libraryChapters.updatedAt,
      }).from(libraryChapters);
      const localChapByKey = new Map(localChapters.map((lc) => [`${lc.bookId}:${lc.orderNum}`, lc]));

      for (const c of chaptersRes.rows) {
        const targetBookId = bookIdMap.get(c.book_id);
        if (!targetBookId) continue; // livro da fonte não mapeado
        const existing = localChapByKey.get(`${targetBookId}:${c.order_num}`);

        if (!existing) {
          await db.insert(libraryChapters).values({
            id: c.id,
            bookId: targetBookId,
            orderNum: c.order_num,
            title: c.title,
            content: c.content,
            estimatedReadTime: c.estimated_read_time,
            isSample: c.is_sample,
            createdAt: c.created_at,
            updatedAt: c.updated_at,
          }).onConflictDoNothing();
          result.chaptersInserted++;
          // Atualiza o mapa em memória para não inserir duas vezes na mesma execução
          localChapByKey.set(`${targetBookId}:${c.order_num}`, {
            id: c.id, bookId: targetBookId, orderNum: c.order_num,
            contentLen: c.content?.length ?? 0,
            updatedAt: c.updated_at ? new Date(c.updated_at) : new Date(),
          });
          continue;
        }

        const sourceHasContent = typeof c.content === 'string' && c.content.length > 0;

        // Preenche conteúdo de capítulos que existem localmente mas estão
        // vazios, quando a fonte já tem o texto. Nunca sobrescreve conteúdo
        // local não-vazio com este caminho.
        if (sourceHasContent && existing.contentLen === 0) {
          await db
            .update(libraryChapters)
            .set({
              content: c.content,
              title: c.title,
              // Espelha o updated_at da fonte para que revisões futuras
              // continuem sendo detectadas pela comparação de datas.
              updatedAt: c.updated_at ? new Date(c.updated_at) : new Date(),
            })
            .where(and(eq(libraryChapters.id, existing.id), eq(libraryChapters.content, '')));
          result.chaptersUpdated++;
          continue;
        }

        // Capítulo revisado na fonte: copia o texto revisado quando o
        // updated_at da fonte é estritamente mais recente que o local.
        // Nunca gera conteúdo e nunca substitui texto local por texto vazio
        // (sourceHasContent garante fonte não-vazia).
        const sourceUpdatedAt = c.updated_at ? new Date(c.updated_at) : null;
        const localUpdatedAt = existing.updatedAt ? new Date(existing.updatedAt) : null;
        const sourceIsNewer =
          sourceUpdatedAt !== null &&
          !isNaN(sourceUpdatedAt.getTime()) &&
          (localUpdatedAt === null || sourceUpdatedAt.getTime() > localUpdatedAt.getTime());

        if (sourceHasContent && sourceIsNewer) {
          await db
            .update(libraryChapters)
            .set({
              content: c.content,
              title: c.title,
              estimatedReadTime: c.estimated_read_time,
              isSample: c.is_sample,
              // Espelha o updated_at da fonte (em vez de "agora") para que a
              // próxima revisão na fonte volte a ser mais recente que o local.
              updatedAt: sourceUpdatedAt,
            })
            .where(eq(libraryChapters.id, existing.id));
          result.chaptersUpdated++;
          console.log(`📚 Capítulo revisado atualizado: livro ${targetBookId}, capítulo ${c.order_num}`);
        }
      }

      // Sincroniza metadados dos livros existentes.
      // - Livro revisado na fonte (updated_at da fonte mais recente que o
      //   local): copia title, subtitle, description, cover_url, author etc.
      //   e espelha o updated_at da fonte (nunca "agora"), como nos capítulos.
      // - O título só é atualizado com casamento pela chave estável
      //   source_book_id; no fallback por título ele não é sobrescrito.
      // - chapters_count/publish_status sempre acompanham a fonte, mas sem
      //   tocar no updated_at local (senão o local ficaria sempre "mais novo"
      //   e revisões futuras deixariam de ser detectadas).
      for (const b of booksRes.rows) {
        const targetBookId = bookIdMap.get(b.id);
        if (!targetBookId) continue;
        const local = localById.get(targetBookId);
        if (!local) continue; // livro recém-inserido nesta execução — já veio completo da fonte

        const sourceUpdatedAt = b.updated_at ? new Date(b.updated_at) : null;
        const localUpdatedAt = local.updatedAt ? new Date(local.updatedAt) : null;
        const sourceIsNewer =
          sourceUpdatedAt !== null &&
          !isNaN(sourceUpdatedAt.getTime()) &&
          (localUpdatedAt === null || sourceUpdatedAt.getTime() > localUpdatedAt.getTime());

        if (sourceIsNewer) {
          // Correção de título só é segura quando o livro está casado pela
          // chave estável (source_book_id); no fallback por título, o título
          // é a própria chave de casamento e não deve ser sobrescrito.
          const canUpdateTitle = local.sourceBookId === b.id;
          await db
            .update(libraryBooks)
            .set({
              ...(canUpdateTitle ? { title: b.title } : {}),
              subtitle: b.subtitle,
              author: b.author,
              description: b.description,
              coverUrl: b.cover_url,
              category: b.category,
              accessType: b.access_type,
              price: b.price,
              planRequired: b.plan_required,
              estimatedReadTime: b.estimated_read_time,
              chaptersCount: b.chapters_count,
              publishStatus: b.publish_status,
              isNew: b.is_new,
              editionNote: b.edition_note,
              // Espelha o updated_at da fonte para que a próxima revisão
              // volte a ser detectada pela comparação de datas.
              updatedAt: sourceUpdatedAt,
            })
            .where(eq(libraryBooks.id, targetBookId));
          result.booksUpdated++;
          console.log(`📚 Metadados revisados atualizados: livro "${b.title}"`);
        } else if (
          local.chaptersCount !== b.chapters_count ||
          local.publishStatus !== b.publish_status
        ) {
          await db
            .update(libraryBooks)
            .set({
              chaptersCount: b.chapters_count,
              publishStatus: b.publish_status,
            })
            .where(eq(libraryBooks.id, targetBookId));
          result.booksUpdated++;
        }
      }

      console.log(`✅ Biblioteca sincronizada: ${booksRes.rows.length} livros, ${chaptersRes.rows.length} capítulos da fonte`);
      result.ok = true;
      return result;
    } finally {
      await source.end().catch(() => {});
    }
  } catch (e) {
    console.error('❌ Erro no seed da Biblioteca (não fatal):', e);
    result.error = e instanceof Error ? e.message : String(e);
    return result;
  }
}
