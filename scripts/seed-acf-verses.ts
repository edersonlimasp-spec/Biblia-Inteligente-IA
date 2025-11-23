import { db } from '../server/db';
import { bibleVerses } from '@shared/schema';
import { getBookChapter } from '../server/bible-data/bible-index';
import { bibleBooks } from '../server/bible-data/books';

async function seedACFVerses() {
  console.log('📖 Iniciando população de versículos ACF...');
  
  let totalInserted = 0;
  
  try {
    for (const book of bibleBooks) {
      console.log(`  Processando ${book.name}...`);
      
      for (let chapter = 1; chapter <= book.chapters; chapter++) {
        const chapterData = getBookChapter(book.id, chapter);
        
        if (!chapterData || !chapterData.verses) continue;
        
        for (let verseIdx = 0; verseIdx < chapterData.verses.length; verseIdx++) {
          const text = chapterData.verses[verseIdx];
          const verseNum = verseIdx + 1;
          
          try {
            await db.insert(bibleVerses).values({
              versionCode: 'ACF',
              book: book.id,
              chapter,
              verse: verseNum,
              text,
            }).onConflictDoNothing();
            
            totalInserted++;
          } catch (e) {
            // Silently continue on duplicate
          }
        }
      }
    }
    
    console.log(`✅ Importação concluída: ${totalInserted} versículos adicionados à versão ACF`);
  } catch (error) {
    console.error('❌ Erro durante importação:', error);
    process.exit(1);
  }
}

seedACFVerses();
