import { beforeEach, describe, expect, it, vi } from 'vitest';
import { libraryBooks, libraryChapters } from '@shared/schema';

type Book = Record<string, any>;

let sourceBooks: Book[] = [];
let localBooks: Book[] = [];
let bookUpdateValues: Book[] = [];

const sourceEnd = vi.fn(async () => undefined);
const sourceQuery = vi.fn(async (query: string) => ({
  rows: query.includes('library_chapters') ? [] : sourceBooks,
}));

vi.mock('@neondatabase/serverless', () => ({
  Pool: class {
    query = sourceQuery;
    end = sourceEnd;
  },
}));

const db = {
  select: vi.fn(() => ({
    from: async (table: unknown) => table === libraryBooks ? localBooks : [],
  })),
  insert: vi.fn((table: unknown) => ({
    values: (values: Book) => ({
      onConflictDoNothing: async () => {
        if (table === libraryBooks && !localBooks.some((book) => book.id === values.id)) {
          localBooks.push({ ...values });
        }
      },
    }),
  })),
  update: vi.fn((table: unknown) => ({
    set: (values: Book) => ({
      where: async () => {
        if (table !== libraryBooks) return;
        bookUpdateValues.push(values);

        // The seed updates one already-matched book at a time. The first update
        // can be the sourceBookId backfill; subsequent metadata updates target
        // that same source book.
        const target = values.sourceBookId
          ? localBooks.find((book) => book.id === values.sourceBookId || book.sourceBookId == null)
          : localBooks.find((book) => book.sourceBookId === sourceBooks[0]?.id || book.id === sourceBooks[0]?.id);
        if (target) Object.assign(target, values);
      },
    }),
  })),
};

vi.mock('./db', () => ({ db }));

const sourceBook = (overrides: Book = {}): Book => ({
  id: 'source-book-1',
  title: 'Novo título',
  subtitle: 'Subtítulo novo',
  author: 'Autor novo',
  description: 'Descrição nova',
  cover_url: '/nova-capa.jpg',
  category: 'discipulado',
  access_type: 'premium',
  price: null,
  plan_required: 'premium',
  estimated_read_time: 90,
  chapters_count: 12,
  publish_status: 'published',
  is_new: true,
  edition_note: '2ª edição',
  created_at: new Date('2026-01-01'),
  updated_at: new Date('2026-08-01'),
  ...overrides,
});

const localBook = (overrides: Book = {}): Book => ({
  id: 'local-book-1',
  sourceBookId: 'source-book-1',
  title: 'Título antigo',
  subtitle: 'Subtítulo antigo',
  author: 'Autor antigo',
  description: 'Descrição antiga',
  coverUrl: '/capa-antiga.jpg',
  category: 'antiga',
  accessType: 'premium',
  price: null,
  planRequired: 'premium',
  estimatedReadTime: 45,
  chaptersCount: 10,
  publishStatus: 'draft',
  isNew: false,
  editionNote: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-07-01'),
  ...overrides,
});

describe('seedLibraryBooks: casamento estável de livros', () => {
  beforeEach(() => {
    process.env.NEON_DATABASE_URL = 'postgres://content-source';
    sourceBooks = [];
    localBooks = [];
    bookUpdateValues = [];
    vi.clearAllMocks();
  });

  it('atualiza um título renomeado pela source_book_id sem duplicar o livro', async () => {
    sourceBooks = [sourceBook()];
    localBooks = [localBook()];
    const { seedLibraryBooks } = await import('./seed-library');

    const result = await seedLibraryBooks();

    expect(result.ok).toBe(true);
    expect(result.booksInserted).toBe(0);
    expect(result.booksUpdated).toBe(1);
    expect(localBooks).toHaveLength(1);
    expect(localBooks[0].title).toBe('Novo título');
  });

  it('casa livro legado pelo mesmo id, faz backfill e corrige título e metadados', async () => {
    sourceBooks = [sourceBook()];
    localBooks = [localBook({
      id: 'source-book-1',
      sourceBookId: null,
      title: 'Título legado',
    })];
    const { seedLibraryBooks } = await import('./seed-library');

    const result = await seedLibraryBooks();

    expect(result.booksInserted).toBe(0);
    expect(localBooks).toHaveLength(1);
    expect(localBooks[0]).toMatchObject({
      sourceBookId: 'source-book-1',
      title: 'Novo título',
      subtitle: 'Subtítulo novo',
      author: 'Autor novo',
      description: 'Descrição nova',
      coverUrl: '/nova-capa.jpg',
      chaptersCount: 12,
      publishStatus: 'published',
    });
  });

  it('no fallback por título, não sobrescreve o título usado para casar', async () => {
    sourceBooks = [sourceBook({ id: 'different-source-id', title: 'Título em comum' })];
    localBooks = [localBook({
      id: 'different-local-id',
      sourceBookId: null,
      title: 'Título em comum',
    })];
    const { seedLibraryBooks } = await import('./seed-library');

    await seedLibraryBooks();

    expect(localBooks).toHaveLength(1);
    expect(localBooks[0].sourceBookId).toBe('different-source-id');
    expect(localBooks[0].title).toBe('Título em comum');
    expect(bookUpdateValues.some((values) => Object.hasOwn(values, 'title'))).toBe(false);
  });
});