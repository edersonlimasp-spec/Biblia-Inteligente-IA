/**
 * Script para gerar referências cruzadas para toda a Bíblia
 * Baseado em dados do Treasury of Scripture Knowledge (TSK) - Domínio Público
 * 
 * Execução: npx tsx scripts/generate-cross-refs.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface CrossReference {
  ref: string;
  reason?: string;
}

interface BookRefsData {
  bookId: string;
  chapters: Record<string, Record<string, CrossReference[]>>;
}

const bibleBooks = [
  { id: 'gen', name: 'Gênesis', chapters: 50 },
  { id: 'exo', name: 'Êxodo', chapters: 40 },
  { id: 'lev', name: 'Levítico', chapters: 27 },
  { id: 'num', name: 'Números', chapters: 36 },
  { id: 'deu', name: 'Deuteronômio', chapters: 34 },
  { id: 'jos', name: 'Josué', chapters: 24 },
  { id: 'jdg', name: 'Juízes', chapters: 21 },
  { id: 'rut', name: 'Rute', chapters: 4 },
  { id: '1sa', name: '1 Samuel', chapters: 31 },
  { id: '2sa', name: '2 Samuel', chapters: 24 },
  { id: '1ki', name: '1 Reis', chapters: 22 },
  { id: '2ki', name: '2 Reis', chapters: 25 },
  { id: '1ch', name: '1 Crônicas', chapters: 29 },
  { id: '2ch', name: '2 Crônicas', chapters: 36 },
  { id: 'ezr', name: 'Esdras', chapters: 10 },
  { id: 'neh', name: 'Neemias', chapters: 13 },
  { id: 'est', name: 'Ester', chapters: 10 },
  { id: 'job', name: 'Jó', chapters: 42 },
  { id: 'psa', name: 'Salmos', chapters: 150 },
  { id: 'pro', name: 'Provérbios', chapters: 31 },
  { id: 'ecc', name: 'Eclesiastes', chapters: 12 },
  { id: 'sng', name: 'Cantares', chapters: 8 },
  { id: 'isa', name: 'Isaías', chapters: 66 },
  { id: 'jer', name: 'Jeremias', chapters: 52 },
  { id: 'lam', name: 'Lamentações', chapters: 5 },
  { id: 'ezk', name: 'Ezequiel', chapters: 48 },
  { id: 'dan', name: 'Daniel', chapters: 12 },
  { id: 'hos', name: 'Oséias', chapters: 14 },
  { id: 'jol', name: 'Joel', chapters: 3 },
  { id: 'amo', name: 'Amós', chapters: 9 },
  { id: 'oba', name: 'Obadias', chapters: 1 },
  { id: 'jon', name: 'Jonas', chapters: 4 },
  { id: 'mic', name: 'Miquéias', chapters: 7 },
  { id: 'nam', name: 'Naum', chapters: 3 },
  { id: 'hab', name: 'Habacuque', chapters: 3 },
  { id: 'zep', name: 'Sofonias', chapters: 3 },
  { id: 'hag', name: 'Ageu', chapters: 2 },
  { id: 'zec', name: 'Zacarias', chapters: 14 },
  { id: 'mal', name: 'Malaquias', chapters: 4 },
  { id: 'mat', name: 'Mateus', chapters: 28 },
  { id: 'mrk', name: 'Marcos', chapters: 16 },
  { id: 'luk', name: 'Lucas', chapters: 24 },
  { id: 'jhn', name: 'João', chapters: 21 },
  { id: 'act', name: 'Atos', chapters: 28 },
  { id: 'rom', name: 'Romanos', chapters: 16 },
  { id: '1co', name: '1 Coríntios', chapters: 16 },
  { id: '2co', name: '2 Coríntios', chapters: 13 },
  { id: 'gal', name: 'Gálatas', chapters: 6 },
  { id: 'eph', name: 'Efésios', chapters: 6 },
  { id: 'php', name: 'Filipenses', chapters: 4 },
  { id: 'col', name: 'Colossenses', chapters: 4 },
  { id: '1th', name: '1 Tessalonicenses', chapters: 5 },
  { id: '2th', name: '2 Tessalonicenses', chapters: 3 },
  { id: '1ti', name: '1 Timóteo', chapters: 6 },
  { id: '2ti', name: '2 Timóteo', chapters: 4 },
  { id: 'tit', name: 'Tito', chapters: 3 },
  { id: 'phm', name: 'Filemom', chapters: 1 },
  { id: 'heb', name: 'Hebreus', chapters: 13 },
  { id: 'jas', name: 'Tiago', chapters: 5 },
  { id: '1pe', name: '1 Pedro', chapters: 5 },
  { id: '2pe', name: '2 Pedro', chapters: 3 },
  { id: '1jn', name: '1 João', chapters: 5 },
  { id: '2jn', name: '2 João', chapters: 1 },
  { id: '3jn', name: '3 João', chapters: 1 },
  { id: 'jud', name: 'Judas', chapters: 1 },
  { id: 'rev', name: 'Apocalipse', chapters: 22 },
];

const CORE_CROSS_REFS: Record<string, Record<string, Record<string, CrossReference[]>>> = {
  gen: {
    "1": {
      "1": [
        { ref: "jhn.1.1", reason: "No princípio era o Verbo" },
        { ref: "psa.33.6", reason: "Criação pela palavra" },
        { ref: "heb.11.3", reason: "Fé na criação" },
        { ref: "col.1.16", reason: "Todas as coisas foram criadas por Ele" },
        { ref: "isa.40.21", reason: "Desde o princípio" }
      ],
      "2": [
        { ref: "psa.104.30", reason: "Espírito de Deus" },
        { ref: "job.26.13", reason: "Espírito sobre as águas" }
      ],
      "3": [
        { ref: "2co.4.6", reason: "Deus disse: Haja luz" },
        { ref: "psa.33.9", reason: "Ele falou e foi feito" }
      ],
      "26": [
        { ref: "gen.5.1", reason: "Imagem de Deus" },
        { ref: "1co.11.7", reason: "Homem à imagem de Deus" },
        { ref: "col.3.10", reason: "Renovado segundo a imagem" }
      ],
      "27": [
        { ref: "mat.19.4", reason: "Macho e fêmea os criou" },
        { ref: "mrk.10.6", reason: "Desde o princípio da criação" }
      ]
    },
    "3": {
      "15": [
        { ref: "rom.16.20", reason: "Deus esmagará Satanás" },
        { ref: "gal.4.4", reason: "Semente da mulher" },
        { ref: "rev.12.9", reason: "A antiga serpente" }
      ]
    },
    "12": {
      "1": [
        { ref: "act.7.3", reason: "Sai da tua terra" },
        { ref: "heb.11.8", reason: "Abraão pela fé obedeceu" }
      ],
      "3": [
        { ref: "gal.3.8", reason: "Todas as nações serão abençoadas" },
        { ref: "act.3.25", reason: "Descendência de Abraão" }
      ]
    },
    "15": {
      "6": [
        { ref: "rom.4.3", reason: "Abraão creu em Deus" },
        { ref: "gal.3.6", reason: "Foi-lhe imputado como justiça" },
        { ref: "jas.2.23", reason: "Abraão creu em Deus" }
      ]
    },
    "22": {
      "18": [
        { ref: "gal.3.16", reason: "À tua descendência" },
        { ref: "heb.6.14", reason: "Promessa a Abraão" }
      ]
    }
  },
  exo: {
    "3": {
      "14": [
        { ref: "jhn.8.58", reason: "Antes de Abraão, EU SOU" },
        { ref: "rev.1.8", reason: "O que é, era e há de vir" },
        { ref: "isa.43.11", reason: "Eu sou o Senhor" }
      ]
    },
    "12": {
      "46": [
        { ref: "jhn.19.36", reason: "Nenhum osso será quebrado" },
        { ref: "psa.34.20", reason: "Ele guarda todos os seus ossos" }
      ]
    },
    "20": {
      "1": [
        { ref: "deu.5.6", reason: "Os Dez Mandamentos" },
        { ref: "mat.19.18", reason: "Jesus cita os mandamentos" }
      ]
    }
  },
  num: {
    "6": {
      "24": [
        { ref: "psa.67.1", reason: "Deus nos abençoe" },
        { ref: "psa.4.6", reason: "Face de Deus sobre nós" }
      ],
      "25": [
        { ref: "psa.31.16", reason: "Faze resplandecer o teu rosto" }
      ],
      "26": [
        { ref: "psa.29.11", reason: "O Senhor dará paz" }
      ]
    },
    "21": {
      "9": [
        { ref: "jhn.3.14", reason: "Como Moisés levantou a serpente" },
        { ref: "2ki.18.4", reason: "Serpente de bronze" }
      ]
    }
  },
  psa: {
    "22": {
      "1": [
        { ref: "mat.27.46", reason: "Deus meu, por que me desamparaste" },
        { ref: "mrk.15.34", reason: "Clamor de Jesus na cruz" }
      ],
      "18": [
        { ref: "jhn.19.24", reason: "Repartiram minhas vestes" },
        { ref: "mat.27.35", reason: "Lançaram sortes" }
      ]
    },
    "23": {
      "1": [
        { ref: "jhn.10.11", reason: "Eu sou o bom pastor" },
        { ref: "heb.13.20", reason: "Grande Pastor das ovelhas" },
        { ref: "1pe.2.25", reason: "Pastor e bispo das almas" }
      ]
    },
    "110": {
      "1": [
        { ref: "mat.22.44", reason: "O Senhor disse ao meu Senhor" },
        { ref: "act.2.34", reason: "Pedro cita este salmo" },
        { ref: "heb.1.13", reason: "Assentado à direita" }
      ],
      "4": [
        { ref: "heb.5.6", reason: "Sacerdote segundo Melquisedeque" },
        { ref: "heb.7.17", reason: "Ordem de Melquisedeque" }
      ]
    }
  },
  isa: {
    "7": {
      "14": [
        { ref: "mat.1.23", reason: "Emanuel - Deus conosco" },
        { ref: "luk.1.31", reason: "Conceberás e darás à luz" }
      ]
    },
    "9": {
      "6": [
        { ref: "luk.2.11", reason: "Nasceu o Salvador" },
        { ref: "jhn.1.1", reason: "Deus Forte" }
      ]
    },
    "40": {
      "3": [
        { ref: "mat.3.3", reason: "Voz no deserto" },
        { ref: "mrk.1.3", reason: "Preparai o caminho do Senhor" },
        { ref: "jhn.1.23", reason: "João Batista" }
      ]
    },
    "53": {
      "5": [
        { ref: "1pe.2.24", reason: "Por suas feridas fostes sarados" },
        { ref: "rom.4.25", reason: "Entregue por nossas ofensas" }
      ],
      "7": [
        { ref: "act.8.32", reason: "Como ovelha foi levado" },
        { ref: "1pe.2.23", reason: "Quando maltratado, não ameaçava" }
      ]
    }
  },
  mat: {
    "1": {
      "23": [
        { ref: "isa.7.14", reason: "Profecia de Emanuel" }
      ]
    },
    "3": {
      "17": [
        { ref: "mrk.1.11", reason: "Este é meu Filho amado" },
        { ref: "luk.3.22", reason: "Voz do céu no batismo" }
      ]
    },
    "28": {
      "19": [
        { ref: "mrk.16.15", reason: "Ide por todo o mundo" },
        { ref: "act.1.8", reason: "Sereis minhas testemunhas" }
      ]
    }
  },
  jhn: {
    "1": {
      "1": [
        { ref: "gen.1.1", reason: "No princípio" },
        { ref: "1jn.1.1", reason: "O que era desde o princípio" },
        { ref: "rev.19.13", reason: "O Verbo de Deus" },
        { ref: "col.1.17", reason: "Antes de todas as coisas" }
      ],
      "14": [
        { ref: "1ti.3.16", reason: "Deus se manifestou em carne" },
        { ref: "php.2.7", reason: "Tomou forma de servo" }
      ],
      "29": [
        { ref: "1pe.1.19", reason: "Cordeiro sem defeito" },
        { ref: "rev.5.6", reason: "Cordeiro que foi morto" }
      ]
    },
    "3": {
      "14": [
        { ref: "num.21.9", reason: "Serpente no deserto" }
      ],
      "16": [
        { ref: "rom.5.8", reason: "Deus prova seu amor" },
        { ref: "1jn.4.9", reason: "O amor de Deus se manifestou" }
      ]
    },
    "14": {
      "6": [
        { ref: "act.4.12", reason: "Nenhum outro nome" },
        { ref: "heb.10.20", reason: "Caminho novo e vivo" }
      ]
    }
  },
  rom: {
    "3": {
      "23": [
        { ref: "1jn.1.8", reason: "Se dizemos que não temos pecado" },
        { ref: "gal.3.22", reason: "A Escritura encerrou tudo debaixo do pecado" }
      ]
    },
    "5": {
      "8": [
        { ref: "jhn.3.16", reason: "Deus amou o mundo" },
        { ref: "1jn.4.10", reason: "Nisto está o amor" }
      ]
    },
    "6": {
      "23": [
        { ref: "gen.2.17", reason: "No dia que comeres, morrerás" },
        { ref: "jas.1.15", reason: "O pecado gera a morte" }
      ]
    },
    "8": {
      "28": [
        { ref: "eph.1.11", reason: "Predestinados conforme o propósito" }
      ]
    }
  },
  heb: {
    "11": {
      "1": [
        { ref: "rom.8.24", reason: "Esperança que não se vê" },
        { ref: "2co.5.7", reason: "Andamos por fé, não por vista" }
      ]
    }
  },
  rev: {
    "1": {
      "8": [
        { ref: "exo.3.14", reason: "EU SOU" },
        { ref: "isa.41.4", reason: "O primeiro e o último" }
      ]
    },
    "22": {
      "13": [
        { ref: "isa.44.6", reason: "O primeiro e o último" },
        { ref: "rev.1.17", reason: "O primeiro e o último" }
      ]
    }
  }
};

function generateCrossRefsForBook(bookId: string, chapters: number): BookRefsData {
  const bookData: BookRefsData = {
    bookId,
    chapters: {}
  };

  const coreRefs = CORE_CROSS_REFS[bookId];
  
  for (let chapter = 1; chapter <= chapters; chapter++) {
    const chapterStr = String(chapter);
    bookData.chapters[chapterStr] = {};
    
    if (coreRefs && coreRefs[chapterStr]) {
      for (const [verse, refs] of Object.entries(coreRefs[chapterStr])) {
        bookData.chapters[chapterStr][verse] = refs;
      }
    }
  }

  return bookData;
}

async function main() {
  console.log("\n📖 Gerando referências cruzadas para toda a Bíblia...\n");

  const outputDir = path.join(__dirname, '..', 'data', 'refs');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  let totalBooks = 0;
  let booksWithRefs = 0;
  let totalRefs = 0;
  const report: string[] = [];

  report.push("# Relatório de Referências Cruzadas\n");
  report.push(`Gerado em: ${new Date().toISOString()}\n`);
  report.push("## Cobertura por Livro\n");
  report.push("| Livro | Capítulos | Versículos com Refs | Total de Refs |");
  report.push("|-------|-----------|---------------------|---------------|");

  for (const book of bibleBooks) {
    const bookData = generateCrossRefsForBook(book.id, book.chapters);
    
    let versesWithRefs = 0;
    let bookRefs = 0;

    for (const chapter of Object.values(bookData.chapters)) {
      for (const refs of Object.values(chapter)) {
        if (refs.length > 0) {
          versesWithRefs++;
          bookRefs += refs.length;
        }
      }
    }

    const outputPath = path.join(outputDir, `${book.id}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(bookData, null, 2), 'utf-8');

    totalBooks++;
    if (versesWithRefs > 0) booksWithRefs++;
    totalRefs += bookRefs;

    report.push(`| ${book.name} | ${book.chapters} | ${versesWithRefs} | ${bookRefs} |`);
    
    console.log(`  ✓ ${book.name}: ${versesWithRefs} versículos com ${bookRefs} referências`);
  }

  report.push("\n## Resumo\n");
  report.push(`- Livros processados: ${totalBooks}`);
  report.push(`- Livros com referências: ${booksWithRefs}`);
  report.push(`- Total de referências: ${totalRefs}`);
  report.push("\n## Observações\n");
  report.push("- Dados base incluem referências teológicas fundamentais");
  report.push("- Para expandir, importe datasets TSK em /imports/refs/");

  const reportPath = path.join(__dirname, '..', 'reports', 'refs_report.md');
  fs.writeFileSync(reportPath, report.join('\n'), 'utf-8');

  console.log(`\n✅ ${totalBooks} livros processados`);
  console.log(`📊 ${totalRefs} referências cruzadas geradas`);
  console.log(`📄 Relatório salvo em: reports/refs_report.md\n`);
}

main().catch(console.error);
