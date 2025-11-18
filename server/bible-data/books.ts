export interface BibleBook {
  id: string;
  name: string;
  testament: 'old' | 'new';
  chapters: number;
}

export const bibleBooks: BibleBook[] = [
  // Antigo Testamento
  { id: 'gen', name: 'Gênesis', testament: 'old', chapters: 50 },
  { id: 'exo', name: 'Êxodo', testament: 'old', chapters: 40 },
  { id: 'lev', name: 'Levítico', testament: 'old', chapters: 27 },
  { id: 'num', name: 'Números', testament: 'old', chapters: 36 },
  { id: 'deu', name: 'Deuteronômio', testament: 'old', chapters: 34 },
  { id: 'jos', name: 'Josué', testament: 'old', chapters: 24 },
  { id: 'jdg', name: 'Juízes', testament: 'old', chapters: 21 },
  { id: 'rut', name: 'Rute', testament: 'old', chapters: 4 },
  { id: '1sa', name: '1 Samuel', testament: 'old', chapters: 31 },
  { id: '2sa', name: '2 Samuel', testament: 'old', chapters: 24 },
  { id: '1ki', name: '1 Reis', testament: 'old', chapters: 22 },
  { id: '2ki', name: '2 Reis', testament: 'old', chapters: 25 },
  { id: '1ch', name: '1 Crônicas', testament: 'old', chapters: 29 },
  { id: '2ch', name: '2 Crônicas', testament: 'old', chapters: 36 },
  { id: 'ezr', name: 'Esdras', testament: 'old', chapters: 10 },
  { id: 'neh', name: 'Neemias', testament: 'old', chapters: 13 },
  { id: 'est', name: 'Ester', testament: 'old', chapters: 10 },
  { id: 'job', name: 'Jó', testament: 'old', chapters: 42 },
  { id: 'psa', name: 'Salmos', testament: 'old', chapters: 150 },
  { id: 'pro', name: 'Provérbios', testament: 'old', chapters: 31 },
  { id: 'ecc', name: 'Eclesiastes', testament: 'old', chapters: 12 },
  { id: 'sng', name: 'Cantares', testament: 'old', chapters: 8 },
  { id: 'isa', name: 'Isaías', testament: 'old', chapters: 66 },
  { id: 'jer', name: 'Jeremias', testament: 'old', chapters: 52 },
  { id: 'lam', name: 'Lamentações', testament: 'old', chapters: 5 },
  { id: 'ezk', name: 'Ezequiel', testament: 'old', chapters: 48 },
  { id: 'dan', name: 'Daniel', testament: 'old', chapters: 12 },
  { id: 'hos', name: 'Oséias', testament: 'old', chapters: 14 },
  { id: 'jol', name: 'Joel', testament: 'old', chapters: 3 },
  { id: 'amo', name: 'Amós', testament: 'old', chapters: 9 },
  { id: 'oba', name: 'Obadias', testament: 'old', chapters: 1 },
  { id: 'jon', name: 'Jonas', testament: 'old', chapters: 4 },
  { id: 'mic', name: 'Miquéias', testament: 'old', chapters: 7 },
  { id: 'nam', name: 'Naum', testament: 'old', chapters: 3 },
  { id: 'hab', name: 'Habacuque', testament: 'old', chapters: 3 },
  { id: 'zep', name: 'Sofonias', testament: 'old', chapters: 3 },
  { id: 'hag', name: 'Ageu', testament: 'old', chapters: 2 },
  { id: 'zec', name: 'Zacarias', testament: 'old', chapters: 14 },
  { id: 'mal', name: 'Malaquias', testament: 'old', chapters: 4 },
  
  // Novo Testamento
  { id: 'mat', name: 'Mateus', testament: 'new', chapters: 28 },
  { id: 'mrk', name: 'Marcos', testament: 'new', chapters: 16 },
  { id: 'luk', name: 'Lucas', testament: 'new', chapters: 24 },
  { id: 'jhn', name: 'João', testament: 'new', chapters: 3 },
  { id: 'act', name: 'Atos', testament: 'new', chapters: 28 },
  { id: 'rom', name: 'Romanos', testament: 'new', chapters: 16 },
  { id: '1co', name: '1 Coríntios', testament: 'new', chapters: 16 },
  { id: '2co', name: '2 Coríntios', testament: 'new', chapters: 13 },
  { id: 'gal', name: 'Gálatas', testament: 'new', chapters: 6 },
  { id: 'eph', name: 'Efésios', testament: 'new', chapters: 6 },
  { id: 'php', name: 'Filipenses', testament: 'new', chapters: 4 },
  { id: 'col', name: 'Colossenses', testament: 'new', chapters: 4 },
  { id: '1th', name: '1 Tessalonicenses', testament: 'new', chapters: 5 },
  { id: '2th', name: '2 Tessalonicenses', testament: 'new', chapters: 3 },
  { id: '1ti', name: '1 Timóteo', testament: 'new', chapters: 6 },
  { id: '2ti', name: '2 Timóteo', testament: 'new', chapters: 4 },
  { id: 'tit', name: 'Tito', testament: 'new', chapters: 3 },
  { id: 'phm', name: 'Filemom', testament: 'new', chapters: 1 },
  { id: 'heb', name: 'Hebreus', testament: 'new', chapters: 13 },
  { id: 'jas', name: 'Tiago', testament: 'new', chapters: 5 },
  { id: '1pe', name: '1 Pedro', testament: 'new', chapters: 5 },
  { id: '2pe', name: '2 Pedro', testament: 'new', chapters: 3 },
  { id: '1jn', name: '1 João', testament: 'new', chapters: 5 },
  { id: '2jn', name: '2 João', testament: 'new', chapters: 1 },
  { id: '3jn', name: '3 João', testament: 'new', chapters: 1 },
  { id: 'jud', name: 'Judas', testament: 'new', chapters: 1 },
  { id: 'rev', name: 'Apocalipse', testament: 'new', chapters: 22 },
];

export function getBookById(id: string): BibleBook | undefined {
  return bibleBooks.find(book => book.id === id);
}

export function getBooksByTestament(testament: 'old' | 'new'): BibleBook[] {
  return bibleBooks.filter(book => book.testament === testament);
}
