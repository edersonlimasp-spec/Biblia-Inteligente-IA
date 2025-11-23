/**
 * PATCH to add to routes.ts: Enhanced Strong's endpoint with OpenAI correction
 * 
 * Add this NEW endpoint after the existing /api/strong/search/:query endpoint
 */

// Enhanced Strong's search with AI context mapping
app.post("/api/strong/map-word", ensureAuthenticated, async (req: AuthRequest, res) => {
  try {
    const { word, context, book, chapter, verse, testament } = req.body;

    if (!word || !context || !testament) {
      return res.status(400).json({ error: "Campos obrigatórios: word, context, testament" });
    }

    // Import the mapper function
    const { mapWordToStrong } = await import('./strong-mapper');

    const result = await mapWordToStrong(word, context, book || 'unknown', chapter || 0, verse || 0, testament);

    if (!result) {
      // Fallback to direct search
      const fallbackResults = await db
        .select()
        .from(strongEntries)
        .where(
          or(
            sql`LOWER(COALESCE(${strongEntries.portugueseDef}, '')) LIKE ${'%' + word.toLowerCase() + '%'}`,
            sql`LOWER(COALESCE(${strongEntries.lemma}, '')) LIKE ${'%' + word.toLowerCase() + '%'}`
          )
        )
        .limit(3);

      return res.json({ results: fallbackResults, aiCorrected: false });
    }

    return res.json({
      result,
      aiCorrected: true,
      confidence: result.confidence,
    });
  } catch (error) {
    console.error("Strong mapping error:", error);
    res.status(500).json({ error: "Erro ao mapear Strong's Dictionary" });
  }
});
