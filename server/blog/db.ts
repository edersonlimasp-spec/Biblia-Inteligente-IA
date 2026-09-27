import { neonConfig, Pool } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

// Blog data is intentionally isolated from the existing application tables.
export const blogPool = new Pool({ connectionString: process.env.DATABASE_URL });

let schemaPromise: Promise<void> | undefined;

export function ensureBlogTables(): Promise<void> {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      const client = await blogPool.connect();
      try {
        await client.query("BEGIN");
        await client.query(`
          CREATE TABLE IF NOT EXISTS blog_keywords (
            id uuid PRIMARY KEY,
            seed text NOT NULL,
            keyword text NOT NULL,
            keyword_key text NOT NULL UNIQUE,
            intent text NOT NULL DEFAULT 'informacional',
            relevance integer NOT NULL DEFAULT 3 CHECK (relevance BETWEEN 1 AND 5),
            reason text NOT NULL DEFAULT '',
            status text NOT NULL DEFAULT 'new'
              CHECK (status IN ('new','queued','generating','used','discarded')),
            claim_id uuid,
            created_at timestamptz NOT NULL DEFAULT now(),
            updated_at timestamptz NOT NULL DEFAULT now()
          )
        `);
        await client.query("ALTER TABLE blog_keywords ADD COLUMN IF NOT EXISTS claim_id uuid");
        await client.query(`
          CREATE TABLE IF NOT EXISTS blog_articles (
            id uuid PRIMARY KEY,
            keyword_id uuid REFERENCES blog_keywords(id) ON DELETE SET NULL,
            title text NOT NULL,
            slug text NOT NULL UNIQUE,
            meta_description text NOT NULL,
            body_markdown text NOT NULL,
            cover_image bytea,
            cover_mime text,
            cover_alt text NOT NULL DEFAULT '',
            status text NOT NULL DEFAULT 'draft'
              CHECK (status IN ('draft','published','rejected')),
            generation_source text NOT NULL DEFAULT 'manual'
              CHECK (generation_source IN ('manual','scheduled')),
            created_at timestamptz NOT NULL DEFAULT now(),
            updated_at timestamptz NOT NULL DEFAULT now(),
            published_at timestamptz
          )
        `);
        await client.query("CREATE INDEX IF NOT EXISTS blog_articles_status_published_idx ON blog_articles (status, published_at DESC)");
        await client.query("CREATE INDEX IF NOT EXISTS blog_articles_keyword_idx ON blog_articles (keyword_id)");
        await client.query(`
          CREATE TABLE IF NOT EXISTS blog_settings (
            id integer PRIMARY KEY CHECK (id = 1),
            tone text NOT NULL DEFAULT 'Respeitoso e evangélico, claro e acolhedor.',
            audience text NOT NULL DEFAULT 'Pessoas que desejam aprofundar o conhecimento bíblico.',
            editorial_rules text NOT NULL DEFAULT 'Sem polêmicas denominacionais. Não inventar citações bíblicas nem fatos históricos.',
            schedule_enabled boolean NOT NULL DEFAULT false,
            daily_limit integer NOT NULL DEFAULT 1 CHECK (daily_limit BETWEEN 1 AND 5),
            updated_at timestamptz NOT NULL DEFAULT now()
          )
        `);
        await client.query("INSERT INTO blog_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING");
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    })().catch((error) => {
      schemaPromise = undefined;
      throw error;
    });
  }
  return schemaPromise;
}

export function publicArticle(row: Record<string, unknown>) {
  const { cover_image: _coverImage, ...article } = row;
  return { ...article, has_cover: Boolean(_coverImage) };
}