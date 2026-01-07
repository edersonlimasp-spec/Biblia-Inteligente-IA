import type { PlanReading } from "@shared/schema";

interface ReadingPlanTemplate {
  slug: string;
  title: string;
  description: string;
  duration: number;
  icon: string;
  gradientFrom: string;
  gradientTo: string;
  weekdaysOnly: boolean;
  order: number;
  days: { dayNumber: number; readings: PlanReading[]; title?: string }[];
}

const bibleBooks = [
  { id: "gen", name: "Gênesis", chapters: 50, testament: "old" },
  { id: "exo", name: "Êxodo", chapters: 40, testament: "old" },
  { id: "lev", name: "Levítico", chapters: 27, testament: "old" },
  { id: "num", name: "Números", chapters: 36, testament: "old" },
  { id: "deu", name: "Deuteronômio", chapters: 34, testament: "old" },
  { id: "jos", name: "Josué", chapters: 24, testament: "old" },
  { id: "jdg", name: "Juízes", chapters: 21, testament: "old" },
  { id: "rut", name: "Rute", chapters: 4, testament: "old" },
  { id: "1sa", name: "1 Samuel", chapters: 31, testament: "old" },
  { id: "2sa", name: "2 Samuel", chapters: 24, testament: "old" },
  { id: "1ki", name: "1 Reis", chapters: 22, testament: "old" },
  { id: "2ki", name: "2 Reis", chapters: 25, testament: "old" },
  { id: "1ch", name: "1 Crônicas", chapters: 29, testament: "old" },
  { id: "2ch", name: "2 Crônicas", chapters: 36, testament: "old" },
  { id: "ezr", name: "Esdras", chapters: 10, testament: "old" },
  { id: "neh", name: "Neemias", chapters: 13, testament: "old" },
  { id: "est", name: "Ester", chapters: 10, testament: "old" },
  { id: "job", name: "Jó", chapters: 42, testament: "old" },
  { id: "psa", name: "Salmos", chapters: 150, testament: "old" },
  { id: "pro", name: "Provérbios", chapters: 31, testament: "old" },
  { id: "ecc", name: "Eclesiastes", chapters: 12, testament: "old" },
  { id: "sng", name: "Cânticos", chapters: 8, testament: "old" },
  { id: "isa", name: "Isaías", chapters: 66, testament: "old" },
  { id: "jer", name: "Jeremias", chapters: 52, testament: "old" },
  { id: "lam", name: "Lamentações", chapters: 5, testament: "old" },
  { id: "ezk", name: "Ezequiel", chapters: 48, testament: "old" },
  { id: "dan", name: "Daniel", chapters: 12, testament: "old" },
  { id: "hos", name: "Oséias", chapters: 14, testament: "old" },
  { id: "jol", name: "Joel", chapters: 3, testament: "old" },
  { id: "amo", name: "Amós", chapters: 9, testament: "old" },
  { id: "oba", name: "Obadias", chapters: 1, testament: "old" },
  { id: "jon", name: "Jonas", chapters: 4, testament: "old" },
  { id: "mic", name: "Miquéias", chapters: 7, testament: "old" },
  { id: "nam", name: "Naum", chapters: 3, testament: "old" },
  { id: "hab", name: "Habacuque", chapters: 3, testament: "old" },
  { id: "zep", name: "Sofonias", chapters: 3, testament: "old" },
  { id: "hag", name: "Ageu", chapters: 2, testament: "old" },
  { id: "zec", name: "Zacarias", chapters: 14, testament: "old" },
  { id: "mal", name: "Malaquias", chapters: 4, testament: "old" },
  { id: "mat", name: "Mateus", chapters: 28, testament: "new" },
  { id: "mrk", name: "Marcos", chapters: 16, testament: "new" },
  { id: "luk", name: "Lucas", chapters: 24, testament: "new" },
  { id: "jhn", name: "João", chapters: 21, testament: "new" },
  { id: "act", name: "Atos", chapters: 28, testament: "new" },
  { id: "rom", name: "Romanos", chapters: 16, testament: "new" },
  { id: "1co", name: "1 Coríntios", chapters: 16, testament: "new" },
  { id: "2co", name: "2 Coríntios", chapters: 13, testament: "new" },
  { id: "gal", name: "Gálatas", chapters: 6, testament: "new" },
  { id: "eph", name: "Efésios", chapters: 6, testament: "new" },
  { id: "php", name: "Filipenses", chapters: 4, testament: "new" },
  { id: "col", name: "Colossenses", chapters: 4, testament: "new" },
  { id: "1th", name: "1 Tessalonicenses", chapters: 5, testament: "new" },
  { id: "2th", name: "2 Tessalonicenses", chapters: 3, testament: "new" },
  { id: "1ti", name: "1 Timóteo", chapters: 6, testament: "new" },
  { id: "2ti", name: "2 Timóteo", chapters: 4, testament: "new" },
  { id: "tit", name: "Tito", chapters: 3, testament: "new" },
  { id: "phm", name: "Filemom", chapters: 1, testament: "new" },
  { id: "heb", name: "Hebreus", chapters: 13, testament: "new" },
  { id: "jas", name: "Tiago", chapters: 5, testament: "new" },
  { id: "1pe", name: "1 Pedro", chapters: 5, testament: "new" },
  { id: "2pe", name: "2 Pedro", chapters: 3, testament: "new" },
  { id: "1jn", name: "1 João", chapters: 5, testament: "new" },
  { id: "2jn", name: "2 João", chapters: 1, testament: "new" },
  { id: "3jn", name: "3 João", chapters: 1, testament: "new" },
  { id: "jud", name: "Judas", chapters: 1, testament: "new" },
  { id: "rev", name: "Apocalipse", chapters: 22, testament: "new" },
];

// Plan 1: 52 Weeks - Reading by genre
function generate52WeeksPlan(): { dayNumber: number; readings: PlanReading[]; title?: string }[] {
  const days: { dayNumber: number; readings: PlanReading[]; title?: string }[] = [];
  const genres = {
    sunday: { name: "Evangelhos", books: ["mat", "mrk", "luk", "jhn"] },
    monday: { name: "Epístolas", books: ["rom", "1co", "2co", "gal", "eph", "php", "col", "1th", "2th", "1ti", "2ti", "tit", "phm", "heb", "jas", "1pe", "2pe", "1jn", "2jn", "3jn", "jud"] },
    tuesday: { name: "Lei", books: ["gen", "exo", "lev", "num", "deu"] },
    wednesday: { name: "História", books: ["jos", "jdg", "rut", "1sa", "2sa", "1ki", "2ki", "1ch", "2ch", "ezr", "neh", "est"] },
    thursday: { name: "Salmos", books: ["psa"] },
    friday: { name: "Poesia", books: ["job", "pro", "ecc", "sng", "lam"] },
    saturday: { name: "Profetas", books: ["isa", "jer", "ezk", "dan", "hos", "jol", "amo", "oba", "jon", "mic", "nam", "hab", "zep", "hag", "zec", "mal"] },
  };
  
  const genreOrder = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const genreProgress: Record<string, { bookIdx: number; chapter: number }> = {};
  
  for (const key of Object.keys(genres)) {
    genreProgress[key] = { bookIdx: 0, chapter: 1 };
  }
  
  for (let day = 1; day <= 364; day++) {
    const genreKey = genreOrder[(day - 1) % 7];
    const genre = genres[genreKey as keyof typeof genres];
    const progress = genreProgress[genreKey];
    
    const readings: PlanReading[] = [];
    let chaptersToRead = genreKey === "thursday" ? 5 : 3;
    
    while (chaptersToRead > 0 && progress.bookIdx < genre.books.length) {
      const bookId = genre.books[progress.bookIdx];
      const bookInfo = bibleBooks.find(b => b.id === bookId);
      if (!bookInfo) break;
      
      readings.push({
        book: bookId,
        chapter: progress.chapter,
      });
      
      progress.chapter++;
      if (progress.chapter > bookInfo.chapters) {
        progress.bookIdx++;
        progress.chapter = 1;
      }
      chaptersToRead--;
    }
    
    if (readings.length > 0) {
      days.push({
        dayNumber: day,
        readings,
        title: genre.name,
      });
    }
  }
  
  return days;
}

// Plan 2: 5 Days per week - Bible in 1 year
function generate5DaysPlan(): { dayNumber: number; readings: PlanReading[]; title?: string }[] {
  const days: { dayNumber: number; readings: PlanReading[]; title?: string }[] = [];
  let dayNumber = 1;
  
  for (const book of bibleBooks) {
    let chapter = 1;
    while (chapter <= book.chapters) {
      const readings: PlanReading[] = [];
      const chaptersToRead = Math.min(4, book.chapters - chapter + 1);
      
      for (let i = 0; i < chaptersToRead; i++) {
        readings.push({ book: book.id, chapter: chapter + i });
      }
      
      days.push({ dayNumber, readings, title: book.name });
      chapter += chaptersToRead;
      dayNumber++;
    }
  }
  
  return days;
}

// Plan 3: Chronological Order
function generateChronologicalPlan(): { dayNumber: number; readings: PlanReading[]; title?: string }[] {
  const chronologicalOrder = [
    { book: "gen", chapters: [1, 2, 3], title: "Criação" },
    { book: "gen", chapters: [4, 5], title: "Caim e Abel" },
    { book: "gen", chapters: [6, 7, 8, 9], title: "Noé e o Dilúvio" },
    { book: "gen", chapters: [10, 11], title: "Torre de Babel" },
    { book: "gen", chapters: [12, 13, 14], title: "Chamado de Abraão" },
    { book: "gen", chapters: [15, 16, 17], title: "Aliança com Abraão" },
    { book: "gen", chapters: [18, 19], title: "Sodoma e Gomorra" },
    { book: "gen", chapters: [20, 21, 22], title: "Nascimento de Isaque" },
    { book: "gen", chapters: [23, 24, 25], title: "Morte de Sara" },
    { book: "gen", chapters: [26, 27, 28], title: "Jacó e Esaú" },
    { book: "gen", chapters: [29, 30, 31], title: "Jacó em Harã" },
    { book: "gen", chapters: [32, 33, 34, 35], title: "Jacó volta a Canaã" },
    { book: "gen", chapters: [36, 37], title: "José vendido" },
    { book: "gen", chapters: [38, 39, 40], title: "José no Egito" },
    { book: "gen", chapters: [41, 42], title: "José interpreta sonhos" },
    { book: "gen", chapters: [43, 44, 45], title: "José e seus irmãos" },
    { book: "gen", chapters: [46, 47, 48, 49, 50], title: "Israel no Egito" },
    { book: "exo", chapters: [1, 2, 3], title: "Nascimento de Moisés" },
    { book: "exo", chapters: [4, 5, 6, 7], title: "Pragas do Egito" },
    { book: "exo", chapters: [8, 9, 10, 11], title: "Mais pragas" },
    { book: "exo", chapters: [12, 13, 14], title: "Páscoa e Êxodo" },
    { book: "exo", chapters: [15, 16, 17, 18], title: "Jornada no deserto" },
    { book: "exo", chapters: [19, 20, 21], title: "Os Dez Mandamentos" },
    { book: "exo", chapters: [22, 23, 24], title: "Código da Aliança" },
    { book: "exo", chapters: [25, 26, 27], title: "Tabernáculo" },
    { book: "exo", chapters: [28, 29, 30], title: "Sacerdócio" },
    { book: "exo", chapters: [31, 32, 33, 34], title: "Bezerro de ouro" },
    { book: "exo", chapters: [35, 36, 37, 38, 39, 40], title: "Construção do tabernáculo" },
    { book: "mat", chapters: [1, 2], title: "Nascimento de Jesus" },
    { book: "luk", chapters: [1, 2], title: "Infância de Jesus" },
    { book: "mat", chapters: [3, 4], title: "Batismo e Tentação" },
    { book: "jhn", chapters: [1, 2, 3], title: "Início do ministério" },
    { book: "jhn", chapters: [4, 5], title: "Ministério na Galileia" },
    { book: "mat", chapters: [5, 6, 7], title: "Sermão do Monte" },
    { book: "mat", chapters: [8, 9, 10], title: "Milagres e missão" },
    { book: "mat", chapters: [11, 12, 13], title: "Parábolas" },
    { book: "mat", chapters: [14, 15, 16], title: "Multiplicação e Pedro" },
    { book: "mat", chapters: [17, 18, 19], title: "Transfiguração" },
    { book: "mat", chapters: [20, 21, 22], title: "Entrada em Jerusalém" },
    { book: "mat", chapters: [23, 24, 25], title: "Discurso escatológico" },
    { book: "mat", chapters: [26, 27, 28], title: "Paixão e Ressurreição" },
    { book: "act", chapters: [1, 2, 3], title: "Pentecostes" },
    { book: "act", chapters: [4, 5, 6, 7], title: "Igreja primitiva" },
    { book: "act", chapters: [8, 9, 10], title: "Conversão de Paulo" },
    { book: "act", chapters: [11, 12, 13], title: "Missões" },
    { book: "act", chapters: [14, 15, 16], title: "Primeira viagem" },
    { book: "act", chapters: [17, 18, 19], title: "Segunda viagem" },
    { book: "act", chapters: [20, 21, 22], title: "Terceira viagem" },
    { book: "act", chapters: [23, 24, 25, 26, 27, 28], title: "Paulo em Roma" },
    { book: "rom", chapters: [1, 2, 3, 4], title: "Justificação pela fé" },
    { book: "rom", chapters: [5, 6, 7, 8], title: "Vida no Espírito" },
    { book: "rom", chapters: [9, 10, 11], title: "Israel e os gentios" },
    { book: "rom", chapters: [12, 13, 14, 15, 16], title: "Vida cristã" },
    { book: "rev", chapters: [1, 2, 3], title: "Cartas às igrejas" },
    { book: "rev", chapters: [4, 5, 6, 7], title: "O trono e os selos" },
    { book: "rev", chapters: [8, 9, 10, 11], title: "As trombetas" },
    { book: "rev", chapters: [12, 13, 14], title: "O dragão e a besta" },
    { book: "rev", chapters: [15, 16, 17, 18], title: "As taças" },
    { book: "rev", chapters: [19, 20, 21, 22], title: "Nova Jerusalém" },
  ];
  
  return chronologicalOrder.map((item, index) => ({
    dayNumber: index + 1,
    readings: item.chapters.map(ch => ({ book: item.book, chapter: ch })),
    title: item.title,
  }));
}

// Plan 4: Book by Book
function generateBookByBookPlan(): { dayNumber: number; readings: PlanReading[]; title?: string }[] {
  const days: { dayNumber: number; readings: PlanReading[]; title?: string }[] = [];
  let dayNumber = 1;
  
  for (const book of bibleBooks) {
    let chapter = 1;
    while (chapter <= book.chapters) {
      const readings: PlanReading[] = [];
      const chaptersToRead = Math.min(2, book.chapters - chapter + 1);
      
      for (let i = 0; i < chaptersToRead; i++) {
        readings.push({ book: book.id, chapter: chapter + i });
      }
      
      days.push({ dayNumber, readings, title: book.name });
      chapter += chaptersToRead;
      dayNumber++;
    }
  }
  
  return days;
}

// Plan 5: New Testament in 90 Days
function generateNewTestament90Days(): { dayNumber: number; readings: PlanReading[]; title?: string }[] {
  const ntBooks = bibleBooks.filter(b => b.testament === "new");
  const totalNTChapters = ntBooks.reduce((sum, b) => sum + b.chapters, 0); // 260 chapters
  const chaptersPerDay = Math.ceil(totalNTChapters / 90); // ~3 chapters per day
  
  const days: { dayNumber: number; readings: PlanReading[]; title?: string }[] = [];
  let dayNumber = 1;
  let currentBookIdx = 0;
  let currentChapter = 1;
  
  while (currentBookIdx < ntBooks.length && dayNumber <= 90) {
    const readings: PlanReading[] = [];
    let chaptersRead = 0;
    
    while (chaptersRead < chaptersPerDay && currentBookIdx < ntBooks.length) {
      const book = ntBooks[currentBookIdx];
      readings.push({ book: book.id, chapter: currentChapter });
      currentChapter++;
      chaptersRead++;
      
      if (currentChapter > book.chapters) {
        currentBookIdx++;
        currentChapter = 1;
      }
    }
    
    if (readings.length > 0) {
      const firstBook = ntBooks.find(b => b.id === readings[0].book);
      days.push({ dayNumber, readings, title: firstBook?.name });
      dayNumber++;
    }
  }
  
  return days;
}

// Plan 6: Psalms in 30 Days
function generatePsalms30Days(): { dayNumber: number; readings: PlanReading[]; title?: string }[] {
  const days: { dayNumber: number; readings: PlanReading[]; title?: string }[] = [];
  const totalPsalms = 150;
  const psalmsPerDay = Math.ceil(totalPsalms / 30); // 5 psalms per day
  
  for (let day = 1; day <= 30; day++) {
    const startPsalm = (day - 1) * psalmsPerDay + 1;
    const endPsalm = Math.min(day * psalmsPerDay, totalPsalms);
    const readings: PlanReading[] = [];
    
    for (let psalm = startPsalm; psalm <= endPsalm; psalm++) {
      readings.push({ book: "psa", chapter: psalm });
    }
    
    days.push({ dayNumber: day, readings, title: `Salmos ${startPsalm}-${endPsalm}` });
  }
  
  return days;
}

// Plan 7: Proverbs in 31 Days (1 chapter per day)
function generateProverbs31Days(): { dayNumber: number; readings: PlanReading[]; title?: string }[] {
  const days: { dayNumber: number; readings: PlanReading[]; title?: string }[] = [];
  
  for (let day = 1; day <= 31; day++) {
    days.push({
      dayNumber: day,
      readings: [{ book: "pro", chapter: day }],
      title: `Provérbios ${day}`,
    });
  }
  
  return days;
}

// Plan 8: Gospels in 40 Days
function generateGospels40Days(): { dayNumber: number; readings: PlanReading[]; title?: string }[] {
  const gospelBooks = [
    { id: "mat", name: "Mateus", chapters: 28 },
    { id: "mrk", name: "Marcos", chapters: 16 },
    { id: "luk", name: "Lucas", chapters: 24 },
    { id: "jhn", name: "João", chapters: 21 },
  ];
  
  const totalChapters = gospelBooks.reduce((sum, b) => sum + b.chapters, 0); // 89 chapters
  const chaptersPerDay = Math.ceil(totalChapters / 40); // ~2-3 chapters per day
  
  const days: { dayNumber: number; readings: PlanReading[]; title?: string }[] = [];
  let dayNumber = 1;
  let currentBookIdx = 0;
  let currentChapter = 1;
  
  while (currentBookIdx < gospelBooks.length && dayNumber <= 40) {
    const readings: PlanReading[] = [];
    let chaptersRead = 0;
    
    while (chaptersRead < chaptersPerDay && currentBookIdx < gospelBooks.length) {
      const book = gospelBooks[currentBookIdx];
      readings.push({ book: book.id, chapter: currentChapter });
      currentChapter++;
      chaptersRead++;
      
      if (currentChapter > book.chapters) {
        currentBookIdx++;
        currentChapter = 1;
      }
    }
    
    if (readings.length > 0) {
      const firstBook = gospelBooks.find(b => b.id === readings[0].book);
      days.push({ dayNumber, readings, title: firstBook?.name });
      dayNumber++;
    }
  }
  
  return days;
}

// Plan 9: Bible in 1 Year (3-4 chapters per day)
function generateBible1Year(): { dayNumber: number; readings: PlanReading[]; title?: string }[] {
  const totalChapters = bibleBooks.reduce((sum, b) => sum + b.chapters, 0); // 1189 chapters
  const chaptersPerDay = Math.ceil(totalChapters / 365); // ~3-4 chapters per day
  
  const days: { dayNumber: number; readings: PlanReading[]; title?: string }[] = [];
  let dayNumber = 1;
  let currentBookIdx = 0;
  let currentChapter = 1;
  
  while (currentBookIdx < bibleBooks.length && dayNumber <= 365) {
    const readings: PlanReading[] = [];
    let chaptersRead = 0;
    
    while (chaptersRead < chaptersPerDay && currentBookIdx < bibleBooks.length) {
      const book = bibleBooks[currentBookIdx];
      readings.push({ book: book.id, chapter: currentChapter });
      currentChapter++;
      chaptersRead++;
      
      if (currentChapter > book.chapters) {
        currentBookIdx++;
        currentChapter = 1;
      }
    }
    
    if (readings.length > 0) {
      const firstBook = bibleBooks.find(b => b.id === readings[0].book);
      days.push({ dayNumber, readings, title: firstBook?.name });
      dayNumber++;
    }
  }
  
  return days;
}

// Plan 10: Epistles of Paul in 30 Days
function generatePaulEpistles30Days(): { dayNumber: number; readings: PlanReading[]; title?: string }[] {
  const paulBooks = [
    { id: "rom", name: "Romanos", chapters: 16 },
    { id: "1co", name: "1 Coríntios", chapters: 16 },
    { id: "2co", name: "2 Coríntios", chapters: 13 },
    { id: "gal", name: "Gálatas", chapters: 6 },
    { id: "eph", name: "Efésios", chapters: 6 },
    { id: "php", name: "Filipenses", chapters: 4 },
    { id: "col", name: "Colossenses", chapters: 4 },
    { id: "1th", name: "1 Tessalonicenses", chapters: 5 },
    { id: "2th", name: "2 Tessalonicenses", chapters: 3 },
    { id: "1ti", name: "1 Timóteo", chapters: 6 },
    { id: "2ti", name: "2 Timóteo", chapters: 4 },
    { id: "tit", name: "Tito", chapters: 3 },
    { id: "phm", name: "Filemom", chapters: 1 },
  ];
  
  const totalChapters = paulBooks.reduce((sum, b) => sum + b.chapters, 0); // 87 chapters
  const chaptersPerDay = Math.ceil(totalChapters / 30); // ~3 chapters per day
  
  const days: { dayNumber: number; readings: PlanReading[]; title?: string }[] = [];
  let dayNumber = 1;
  let currentBookIdx = 0;
  let currentChapter = 1;
  
  while (currentBookIdx < paulBooks.length && dayNumber <= 30) {
    const readings: PlanReading[] = [];
    let chaptersRead = 0;
    
    while (chaptersRead < chaptersPerDay && currentBookIdx < paulBooks.length) {
      const book = paulBooks[currentBookIdx];
      readings.push({ book: book.id, chapter: currentChapter });
      currentChapter++;
      chaptersRead++;
      
      if (currentChapter > book.chapters) {
        currentBookIdx++;
        currentChapter = 1;
      }
    }
    
    if (readings.length > 0) {
      const firstBook = paulBooks.find(b => b.id === readings[0].book);
      days.push({ dayNumber, readings, title: firstBook?.name });
      dayNumber++;
    }
  }
  
  return days;
}

// Generate all plan days
const weeks52Days = generate52WeeksPlan();
const fiveDaysDays = generate5DaysPlan();
const chronologicalDays = generateChronologicalPlan();
const bookByBookDays = generateBookByBookPlan();
const nt90Days = generateNewTestament90Days();
const psalms30Days = generatePsalms30Days();
const proverbs31Days = generateProverbs31Days();
const gospels40Days = generateGospels40Days();
const bible1YearDays = generateBible1Year();
const paulEpistles30Days = generatePaulEpistles30Days();

export const readingPlanTemplates: ReadingPlanTemplate[] = [
  {
    slug: "bible-1-year",
    title: "Bíblia em 1 Ano",
    description: "Leitura completa em 365 dias",
    duration: bible1YearDays.length,
    icon: "BookOpen",
    gradientFrom: "#1E40AF",
    gradientTo: "#3B82F6",
    weekdaysOnly: false,
    order: 1,
    days: bible1YearDays,
  },
  {
    slug: "52-weeks",
    title: "Plano 52 Semanas",
    description: "Leitura em 1 ano por gênero",
    duration: weeks52Days.length,
    icon: "Calendar",
    gradientFrom: "#1E3A5F",
    gradientTo: "#60A5FA",
    weekdaysOnly: false,
    order: 2,
    days: weeks52Days,
  },
  {
    slug: "5-days",
    title: "Plano 5 Dias",
    description: "Leitura em 1 ano, 5 dias/semana",
    duration: fiveDaysDays.length,
    icon: "Clock",
    gradientFrom: "#065F46",
    gradientTo: "#34D399",
    weekdaysOnly: true,
    order: 3,
    days: fiveDaysDays,
  },
  {
    slug: "chronological",
    title: "Plano Cronológico",
    description: "Sequência histórica",
    duration: chronologicalDays.length,
    icon: "History",
    gradientFrom: "#5B21B6",
    gradientTo: "#A78BFA",
    weekdaysOnly: false,
    order: 4,
    days: chronologicalDays,
  },
  {
    slug: "book-by-book",
    title: "Livro por Livro",
    description: "Um livro de cada vez, 2 trechos/dia",
    duration: bookByBookDays.length,
    icon: "Library",
    gradientFrom: "#C2410C",
    gradientTo: "#FB923C",
    weekdaysOnly: false,
    order: 5,
    days: bookByBookDays,
  },
  {
    slug: "new-testament-90",
    title: "Novo Testamento",
    description: "Leitura em 90 dias",
    duration: nt90Days.length,
    icon: "ScrollText",
    gradientFrom: "#0891B2",
    gradientTo: "#22D3EE",
    weekdaysOnly: false,
    order: 6,
    days: nt90Days,
  },
  {
    slug: "gospels-40",
    title: "Evangelhos",
    description: "Os 4 Evangelhos em 40 dias",
    duration: gospels40Days.length,
    icon: "Heart",
    gradientFrom: "#BE185D",
    gradientTo: "#F472B6",
    weekdaysOnly: false,
    order: 7,
    days: gospels40Days,
  },
  {
    slug: "psalms-30",
    title: "Salmos em 30 Dias",
    description: "5 salmos por dia",
    duration: psalms30Days.length,
    icon: "Music",
    gradientFrom: "#7C3AED",
    gradientTo: "#C4B5FD",
    weekdaysOnly: false,
    order: 8,
    days: psalms30Days,
  },
  {
    slug: "proverbs-31",
    title: "Provérbios em 31 Dias",
    description: "1 capítulo por dia",
    duration: proverbs31Days.length,
    icon: "Lightbulb",
    gradientFrom: "#CA8A04",
    gradientTo: "#FDE047",
    weekdaysOnly: false,
    order: 9,
    days: proverbs31Days,
  },
  {
    slug: "paul-epistles-30",
    title: "Cartas de Paulo",
    description: "13 epístolas em 30 dias",
    duration: paulEpistles30Days.length,
    icon: "Mail",
    gradientFrom: "#059669",
    gradientTo: "#6EE7B7",
    weekdaysOnly: false,
    order: 10,
    days: paulEpistles30Days,
  },
];

export { bibleBooks };
