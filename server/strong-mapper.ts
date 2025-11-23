/**
 * OpenAI-based Strong's Dictionary Mapper
 * Corrects Strong's number associations using GPT context awareness
 */

import { OpenAI } from 'openai';
import { db } from './db';
import { strongEntries } from '@shared/schema';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface StrongMapResult {
  word: string;
  strongNumber: string;
  confidence: number;
  definition: string;
  portugueseDefinition: string;
  context: string;
}

/**
 * Use OpenAI to identify the correct Strong's number for a word in biblical context
 */
export async function mapWordToStrong(
  word: string,
  context: string,
  book: string,
  chapter: number,
  verse: number,
  testament: 'old' | 'new'
): Promise<StrongMapResult | null> {
  try {
    // Determine expected language based on testament
    const expectedLanguage = testament === 'old' ? 'Hebrew' : 'Greek';

    const prompt = `You are a biblical scholar. A user is studying ${book} ${chapter}:${verse} and clicked on the word "${word}".

Given the full verse context:
"${context}"

Identify the correct Strong's Dictionary number for this word in ${expectedLanguage}.
The word appears in this context and needs proper theological mapping.

Respond ONLY with a JSON object in this format (no markdown, no extra text):
{
  "strongNumber": "G1234" or "H1234",
  "confidence": 0.95,
  "reasoning": "brief explanation"
}

If you cannot confidently identify the word, respond with:
{
  "strongNumber": null,
  "confidence": 0,
  "reasoning": "explanation"
}`;

    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022', // or gpt-4o-mini
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText =
      response.content[0].type === 'text' ? response.content[0].text : null;
    if (!responseText) return null;

    // Parse JSON from response
    let mappingData;
    try {
      mappingData = JSON.parse(responseText);
    } catch {
      // Try to extract JSON from response
      const jsonMatch = responseText.match(/\{[^}]+\}/);
      if (!jsonMatch) return null;
      mappingData = JSON.parse(jsonMatch[0]);
    }

    if (!mappingData.strongNumber || mappingData.confidence < 0.7) {
      return null;
    }

    // Fetch the Strong's entry from database
    const [strongEntry] = await db
      .select()
      .from(strongEntries)
      .where(({ strongNumber }) => strongNumber === mappingData.strongNumber)
      .limit(1);

    if (!strongEntry) {
      return null;
    }

    return {
      word,
      strongNumber: mappingData.strongNumber,
      confidence: mappingData.confidence,
      definition: strongEntry.kjvDef || strongEntry.strongsDef || '',
      portugueseDefinition: strongEntry.portugueseDef || '',
      context,
    };
  } catch (error) {
    console.error('Error mapping word to Strong:', error);
    return null;
  }
}

/**
 * Search for Strong's entries with context-aware correction
 */
export async function searchStrongWithContext(
  query: string,
  context: string,
  testament: 'old' | 'new'
): Promise<any[]> {
  // First try direct search
  const directResults = await db
    .select()
    .from(strongEntries)
    .where(({ portugueseDef, lemma }) => 
      portugueseDef.like(`%${query}%`) || 
      lemma.like(`%${query}%`)
    )
    .limit(5);

  // Filter by language
  const expectedLanguage = testament === 'old' ? 'hebrew' : 'greek';
  const filtered = directResults.filter(e => e.language === expectedLanguage);

  return filtered.length > 0 ? filtered : directResults;
}
