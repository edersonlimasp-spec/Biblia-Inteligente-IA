import OpenAI from 'openai';
import { db } from '../server/db';
import { studyModules, studyTracks, studyLessons, studyModuleTranslations, studyTrackTranslations, studyLessonTranslations } from '../shared/schema';
import { eq, and } from 'drizzle-orm';

const openai = new OpenAI();

const LANGUAGES = ['en', 'es'] as const;
type Language = typeof LANGUAGES[number];

const LANGUAGE_NAMES: Record<Language, string> = {
  en: 'English',
  es: 'Spanish'
};

async function translateText(text: string, targetLang: Language, context: string): Promise<string> {
  const langName = LANGUAGE_NAMES[targetLang];
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a professional translator specializing in biblical and theological content. Translate the following Portuguese text to ${langName}. Maintain the theological accuracy and spiritual depth of the content. Keep Bible book names in the standard ${langName} format (e.g., "Gênesis" → "Genesis" in English, "Génesis" in Spanish). Preserve any scripture references in their original format but translate book names.`
      },
      {
        role: 'user',
        content: `Context: ${context}\n\nText to translate:\n${text}`
      }
    ],
    temperature: 0.3,
  });

  return response.choices[0]?.message?.content || text;
}

async function translateModule(moduleId: string, lang: Language) {
  const [existing] = await db.select().from(studyModuleTranslations)
    .where(and(eq(studyModuleTranslations.moduleId, moduleId), eq(studyModuleTranslations.language, lang)));
  
  if (existing) {
    console.log(`  Module ${moduleId} already translated to ${lang}, skipping...`);
    return;
  }

  const [module] = await db.select().from(studyModules).where(eq(studyModules.id, moduleId));
  if (!module) return;

  console.log(`  Translating module: ${module.name} → ${lang}`);
  
  const [translatedName, translatedDesc] = await Promise.all([
    translateText(module.name, lang, 'Biblical study module title'),
    translateText(module.description, lang, 'Biblical study module description')
  ]);

  await db.insert(studyModuleTranslations).values({
    moduleId,
    language: lang,
    name: translatedName,
    description: translatedDesc,
  });
}

async function translateTrack(trackId: string, lang: Language) {
  const [existing] = await db.select().from(studyTrackTranslations)
    .where(and(eq(studyTrackTranslations.trackId, trackId), eq(studyTrackTranslations.language, lang)));
  
  if (existing) {
    console.log(`  Track ${trackId} already translated to ${lang}, skipping...`);
    return;
  }

  const [track] = await db.select().from(studyTracks).where(eq(studyTracks.id, trackId));
  if (!track) return;

  console.log(`  Translating track: ${track.name} → ${lang}`);
  
  const [translatedName, translatedDesc] = await Promise.all([
    translateText(track.name, lang, 'Biblical study track title'),
    translateText(track.description, lang, 'Biblical study track description')
  ]);

  await db.insert(studyTrackTranslations).values({
    trackId,
    language: lang,
    name: translatedName,
    description: translatedDesc,
  });
}

async function translateLesson(lessonId: string, lang: Language) {
  const [existing] = await db.select().from(studyLessonTranslations)
    .where(and(eq(studyLessonTranslations.lessonId, lessonId), eq(studyLessonTranslations.language, lang)));
  
  if (existing) {
    console.log(`    Lesson ${lessonId} already translated to ${lang}, skipping...`);
    return;
  }

  const [lesson] = await db.select().from(studyLessons).where(eq(studyLessons.id, lessonId));
  if (!lesson) return;

  console.log(`    Translating lesson: ${lesson.title} → ${lang}`);
  
  const [
    translatedTitle,
    translatedContent,
    translatedReferences,
    translatedQuestions,
    translatedApplication,
    translatedSummary
  ] = await Promise.all([
    translateText(lesson.title, lang, 'Biblical lesson title'),
    translateText(lesson.content, lang, 'Biblical lesson main content - theological teaching'),
    translateText(lesson.references, lang, 'Bible verse references'),
    translateText(lesson.questions, lang, 'Reflection questions for Bible study'),
    translateText(lesson.application, lang, 'Practical application of biblical teaching'),
    translateText(lesson.summary, lang, 'Lesson summary')
  ]);

  await db.insert(studyLessonTranslations).values({
    lessonId,
    language: lang,
    title: translatedTitle,
    content: translatedContent,
    references: translatedReferences,
    questions: translatedQuestions,
    application: translatedApplication,
    summary: translatedSummary,
  });
}

async function main() {
  console.log('🌍 Starting course translation...\n');
  
  const allModules = await db.select().from(studyModules);
  const allTracks = await db.select().from(studyTracks);
  const allLessons = await db.select().from(studyLessons);
  
  console.log(`Found ${allModules.length} modules, ${allTracks.length} tracks, ${allLessons.length} lessons\n`);
  
  for (const lang of LANGUAGES) {
    console.log(`\n📚 Translating to ${LANGUAGE_NAMES[lang]}...\n`);
    
    console.log('Translating modules...');
    for (const module of allModules) {
      await translateModule(module.id, lang);
    }
    
    console.log('\nTranslating tracks...');
    for (const track of allTracks) {
      await translateTrack(track.id, lang);
    }
    
    console.log('\nTranslating lessons...');
    let lessonCount = 0;
    for (const lesson of allLessons) {
      await translateLesson(lesson.id, lang);
      lessonCount++;
      if (lessonCount % 10 === 0) {
        console.log(`  Progress: ${lessonCount}/${allLessons.length} lessons`);
      }
    }
  }
  
  console.log('\n✅ Translation complete!');
  process.exit(0);
}

main().catch((error) => {
  console.error('Translation error:', error);
  process.exit(1);
});
