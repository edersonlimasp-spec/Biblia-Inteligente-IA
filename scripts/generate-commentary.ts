/**
 * Script para gerar comentários bíblicos para toda a Bíblia
 * Estrutura preparada para importar comentários de domínio público
 * 
 * Execução: npx tsx scripts/generate-commentary.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface CommentaryBlock {
  source: string;
  type: 'doctrinal' | 'historical' | 'linguistic' | 'devotional' | 'general';
  title?: string;
  text: string;
}

interface BookCommentaryData {
  bookId: string;
  chapters: Record<string, Record<string, CommentaryBlock[]>>;
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

const CORE_COMMENTARY: Record<string, Record<string, Record<string, CommentaryBlock[]>>> = {
  gen: {
    "1": {
      "1": [
        {
          source: "Nota Explicativa",
          type: "doctrinal",
          title: "No princípio",
          text: "A expressão hebraica 'bereshit' indica o início absoluto de toda a criação. Este versículo estabelece três verdades fundamentais: (1) Deus existia antes de tudo; (2) Deus é o Criador de todas as coisas; (3) A criação teve um começo definido no tempo."
        },
        {
          source: "Contexto Histórico",
          type: "historical",
          title: "Cosmogonia Bíblica",
          text: "Diferente das cosmogonias pagãs do Antigo Oriente Próximo, que apresentavam a criação como resultado de conflitos entre deuses, a narrativa bíblica apresenta um único Deus todo-poderoso que cria por sua palavra soberana."
        }
      ],
      "26": [
        {
          source: "Nota Explicativa",
          type: "doctrinal",
          title: "Façamos o homem",
          text: "O plural 'façamos' tem sido interpretado como: (1) plural de majestade; (2) Deus falando com os anjos; ou (3) indicação da pluralidade na Trindade. A expressão 'imagem e semelhança' indica que o ser humano foi criado com capacidades racionais, morais e espirituais que refletem atributos de Deus."
        }
      ]
    },
    "3": {
      "15": [
        {
          source: "Nota Explicativa",
          type: "doctrinal",
          title: "Proto-Evangelho",
          text: "Este versículo é conhecido como o 'proto-evangelho' - a primeira promessa de redenção na Bíblia. A 'semente da mulher' é interpretada tradicionalmente como uma referência messiânica a Cristo, que viria para esmagar a cabeça da serpente (Satanás)."
        }
      ]
    }
  },
  exo: {
    "3": {
      "14": [
        {
          source: "Nota Explicativa",
          type: "linguistic",
          title: "EU SOU O QUE SOU",
          text: "O tetragrama YHWH (יהוה) deriva do verbo hebraico 'hayah' (ser/existir). A expressão 'Ehyeh asher ehyeh' pode ser traduzida como 'Eu sou o que sou', 'Eu serei o que serei' ou 'Eu sou aquele que existe'. Este nome revela Deus como o Ser eterno, autoexistente e imutável."
        },
        {
          source: "Contexto Histórico",
          type: "historical",
          title: "Revelação do Nome Divino",
          text: "Esta é a revelação formal do nome pessoal de Deus a Moisés. No judaísmo, este nome é considerado tão sagrado que não é pronunciado, sendo substituído por 'Adonai' (Senhor) na leitura."
        }
      ]
    }
  },
  num: {
    "6": {
      "24": [
        {
          source: "Nota Explicativa",
          type: "devotional",
          title: "A Bênção Sacerdotal",
          text: "Esta é a famosa bênção aarônica, usada até hoje em liturgias judaicas e cristãs. A tríplice repetição do nome de Deus prefigura a revelação trinitária do Novo Testamento."
        }
      ]
    }
  },
  psa: {
    "23": {
      "1": [
        {
          source: "Nota Explicativa",
          type: "devotional",
          title: "O Bom Pastor",
          text: "Davi usa a metáfora do pastor para descrever seu relacionamento com Deus. Na cultura do Antigo Oriente, o pastor era responsável por guiar, alimentar e proteger suas ovelhas. Jesus aplicou esta imagem a si mesmo em João 10."
        }
      ]
    }
  },
  isa: {
    "53": {
      "5": [
        {
          source: "Nota Explicativa",
          type: "doctrinal",
          title: "O Servo Sofredor",
          text: "Este capítulo é uma das mais claras profecias messiânicas do Antigo Testamento. O verso descreve a natureza substitutiva do sofrimento do Messias: Ele foi ferido por nossos pecados, e por suas feridas somos curados. O Novo Testamento aplica repetidamente este texto a Cristo."
        }
      ]
    }
  },
  jhn: {
    "1": {
      "1": [
        {
          source: "Nota Explicativa",
          type: "doctrinal",
          title: "O Logos Divino",
          text: "João usa o termo grego 'Logos' (Palavra/Verbo) para identificar Jesus. Este termo era significativo tanto para judeus (a Palavra criadora de Deus em Gênesis) quanto para gregos (o princípio racional do universo). João afirma três verdades: (1) o Logos é eterno; (2) o Logos tem comunhão com Deus; (3) o Logos é Deus."
        },
        {
          source: "Contexto Histórico",
          type: "historical",
          title: "Prólogo Joanino",
          text: "O prólogo de João (1:1-18) é considerado um dos textos cristológicos mais elevados do Novo Testamento. Alguns estudiosos sugerem que pode ter sido um hino cristão primitivo incorporado ao Evangelho."
        }
      ],
      "14": [
        {
          source: "Nota Explicativa",
          type: "doctrinal",
          title: "A Encarnação",
          text: "A expressão 'o Verbo se fez carne' é a afirmação central da doutrina da Encarnação. O Deus eterno assumiu natureza humana. 'Habitou entre nós' literalmente significa 'tabernaculou' - uma referência à presença de Deus no tabernáculo do Antigo Testamento."
        }
      ]
    },
    "3": {
      "16": [
        {
          source: "Nota Explicativa",
          type: "devotional",
          title: "O Evangelho em um Versículo",
          text: "Este versículo é frequentemente chamado de 'o Evangelho em miniatura' porque resume a mensagem central do Cristianismo: o amor de Deus, o sacrifício de Cristo, a necessidade de fé, e a promessa de vida eterna."
        }
      ]
    },
    "14": {
      "6": [
        {
          source: "Nota Explicativa",
          type: "doctrinal",
          title: "A Exclusividade de Cristo",
          text: "Jesus faz uma das suas declarações 'Eu sou' mais significativas. Ele não diz que conhece o caminho, mas que Ele É o caminho. A tríade 'caminho, verdade e vida' indica que Jesus é o único meio de acesso ao Pai."
        }
      ]
    }
  },
  rom: {
    "3": {
      "23": [
        {
          source: "Nota Explicativa",
          type: "doctrinal",
          title: "Universalidade do Pecado",
          text: "Paulo estabelece a doutrina do pecado universal. 'Todos pecaram' não é hipérbole, mas uma afirmação teológica fundamental. A expressão 'destituídos da glória de Deus' indica que o pecado nos separou do propósito original para o qual fomos criados."
        }
      ]
    },
    "8": {
      "28": [
        {
          source: "Nota Explicativa",
          type: "devotional",
          title: "A Providência Divina",
          text: "Este versículo oferece grande conforto aos crentes. Paulo não diz que todas as coisas são boas, mas que Deus trabalha através de todas as circunstâncias para cumprir seus propósitos redentores na vida daqueles que o amam."
        }
      ]
    }
  }
};

function generateCommentaryForBook(bookId: string, chapters: number): BookCommentaryData {
  const bookData: BookCommentaryData = {
    bookId,
    chapters: {}
  };

  const coreCommentary = CORE_COMMENTARY[bookId];
  
  for (let chapter = 1; chapter <= chapters; chapter++) {
    const chapterStr = String(chapter);
    bookData.chapters[chapterStr] = {};
    
    if (coreCommentary && coreCommentary[chapterStr]) {
      for (const [verse, commentary] of Object.entries(coreCommentary[chapterStr])) {
        bookData.chapters[chapterStr][verse] = commentary;
      }
    }
  }

  return bookData;
}

async function main() {
  console.log("\n📖 Gerando comentários bíblicos para toda a Bíblia...\n");

  const outputDir = path.join(__dirname, '..', 'data', 'commentary');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  let totalBooks = 0;
  let booksWithCommentary = 0;
  let totalComments = 0;
  const report: string[] = [];

  report.push("# Relatório de Comentários Bíblicos\n");
  report.push(`Gerado em: ${new Date().toISOString()}\n`);
  report.push("## Cobertura por Livro\n");
  report.push("| Livro | Capítulos | Versículos com Comentários | Total de Blocos |");
  report.push("|-------|-----------|---------------------------|-----------------|");

  for (const book of bibleBooks) {
    const bookData = generateCommentaryForBook(book.id, book.chapters);
    
    let versesWithCommentary = 0;
    let bookComments = 0;

    for (const chapter of Object.values(bookData.chapters)) {
      for (const comments of Object.values(chapter)) {
        if (comments.length > 0) {
          versesWithCommentary++;
          bookComments += comments.length;
        }
      }
    }

    const outputPath = path.join(outputDir, `${book.id}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(bookData, null, 2), 'utf-8');

    totalBooks++;
    if (versesWithCommentary > 0) booksWithCommentary++;
    totalComments += bookComments;

    report.push(`| ${book.name} | ${book.chapters} | ${versesWithCommentary} | ${bookComments} |`);
    
    console.log(`  ✓ ${book.name}: ${versesWithCommentary} versículos com ${bookComments} comentários`);
  }

  report.push("\n## Resumo\n");
  report.push(`- Livros processados: ${totalBooks}`);
  report.push(`- Livros com comentários: ${booksWithCommentary}`);
  report.push(`- Total de blocos de comentário: ${totalComments}`);
  report.push("\n## Fontes\n");
  report.push("- Notas Explicativas (originais)");
  report.push("- Contexto Histórico (originais)");
  report.push("\n## Observações\n");
  report.push("- Estrutura preparada para importar comentários de domínio público");
  report.push("- Para expandir, importe datasets em /imports/commentary/");

  const reportPath = path.join(__dirname, '..', 'reports', 'commentary_report.md');
  fs.writeFileSync(reportPath, report.join('\n'), 'utf-8');

  console.log(`\n✅ ${totalBooks} livros processados`);
  console.log(`📊 ${totalComments} blocos de comentário gerados`);
  console.log(`📄 Relatório salvo em: reports/commentary_report.md\n`);
}

main().catch(console.error);
