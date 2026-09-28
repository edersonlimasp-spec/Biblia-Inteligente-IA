import { neonConfig, Pool } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

// Blog data is intentionally isolated from the existing application tables.
export const blogPool = new Pool({ connectionString: process.env.DATABASE_URL });
export const DEFAULT_BLOG_ORIGIN = "https://www.bibliainteligente.com.br";

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
            monthly_volume_estimate integer,
            difficulty text,
            source text NOT NULL DEFAULT 'manual',
            schedule_date date,
            status text NOT NULL DEFAULT 'new'
              CHECK (status IN ('new','queued','generating','used','discarded')),
            claim_id uuid,
            created_at timestamptz NOT NULL DEFAULT now(),
            updated_at timestamptz NOT NULL DEFAULT now()
          )
        `);
        await client.query("ALTER TABLE blog_keywords ADD COLUMN IF NOT EXISTS claim_id uuid");
        await client.query("ALTER TABLE blog_keywords ADD COLUMN IF NOT EXISTS monthly_volume_estimate integer");
        await client.query("ALTER TABLE blog_keywords ADD COLUMN IF NOT EXISTS difficulty text");
        await client.query("ALTER TABLE blog_keywords ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual'");
        await client.query("ALTER TABLE blog_keywords ADD COLUMN IF NOT EXISTS schedule_date date");
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
            cover_file_key text,
            category text NOT NULL DEFAULT 'Estudo bíblico',
            scheduled_for timestamptz,
            status text NOT NULL DEFAULT 'draft'
              CHECK (status IN ('draft','published','rejected')),
            generation_source text NOT NULL DEFAULT 'manual'
              CHECK (generation_source IN ('manual','scheduled')),
            created_at timestamptz NOT NULL DEFAULT now(),
            updated_at timestamptz NOT NULL DEFAULT now(),
            published_at timestamptz
          )
        `);
        await client.query("ALTER TABLE blog_articles ADD COLUMN IF NOT EXISTS cover_file_key text");
        await client.query("ALTER TABLE blog_articles ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'Estudo bíblico'");
        await client.query("ALTER TABLE blog_articles ADD COLUMN IF NOT EXISTS scheduled_for timestamptz");
        await client.query("CREATE INDEX IF NOT EXISTS blog_articles_status_published_idx ON blog_articles (status, published_at DESC)");
        await client.query("CREATE INDEX IF NOT EXISTS blog_articles_keyword_idx ON blog_articles (keyword_id)");
        await client.query(`
          CREATE TABLE IF NOT EXISTS blog_settings (
            id integer PRIMARY KEY CHECK (id = 1),
            tone text NOT NULL DEFAULT 'Respeitoso e evangélico, claro e acolhedor.',
            audience text NOT NULL DEFAULT 'Pessoas que desejam aprofundar o conhecimento bíblico.',
            editorial_rules text NOT NULL DEFAULT 'Sem polêmicas denominacionais. Não inventar citações bíblicas nem fatos históricos.',
            business_type text NOT NULL DEFAULT 'Aplicativo de estudo bíblico',
            language text NOT NULL DEFAULT 'Português do Brasil',
            primary_topics text NOT NULL DEFAULT 'Estudo bíblico, contexto histórico e cultural, mapas, planos de leitura, concordância Strong, sermões',
            avoid_topics text NOT NULL DEFAULT 'Polêmicas denominacionais, afirmações sem fontes e promessas espirituais',
            product_description text NOT NULL DEFAULT 'Bíblia Inteligente ajuda pessoas a aprofundar o estudo bíblico. A IA é apoio para pesquisa e contexto, nunca autoridade espiritual.',
            image_style text NOT NULL DEFAULT 'Ilustração editorial sóbria, tons azul-petróleo e vermelho profundo',
            canonical_origin text NOT NULL DEFAULT 'https://www.bibliainteligente.com.br',
            schedule_enabled boolean NOT NULL DEFAULT false,
            daily_limit integer NOT NULL DEFAULT 1 CHECK (daily_limit BETWEEN 1 AND 5),
            auto_publish boolean NOT NULL DEFAULT false,
            gsc_verification text NOT NULL DEFAULT '',
            gsc_html_file text NOT NULL DEFAULT '',
            updated_at timestamptz NOT NULL DEFAULT now()
          )
        `);
        await client.query("ALTER TABLE blog_settings ADD COLUMN IF NOT EXISTS business_type text NOT NULL DEFAULT 'Aplicativo de estudo bíblico'");
        await client.query("ALTER TABLE blog_settings ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'Português do Brasil'");
        await client.query("ALTER TABLE blog_settings ADD COLUMN IF NOT EXISTS primary_topics text NOT NULL DEFAULT 'Estudo bíblico, contexto histórico e cultural, mapas, planos de leitura, concordância Strong, sermões'");
        await client.query("ALTER TABLE blog_settings ADD COLUMN IF NOT EXISTS avoid_topics text NOT NULL DEFAULT 'Polêmicas denominacionais, afirmações sem fontes e promessas espirituais'");
        await client.query("ALTER TABLE blog_settings ADD COLUMN IF NOT EXISTS product_description text NOT NULL DEFAULT 'Bíblia Inteligente ajuda pessoas a aprofundar o estudo bíblico. A IA é apoio para pesquisa e contexto, nunca autoridade espiritual.'");
        await client.query("ALTER TABLE blog_settings ADD COLUMN IF NOT EXISTS image_style text NOT NULL DEFAULT 'Ilustração editorial sóbria, tons azul-petróleo e vermelho profundo'");
        await client.query("ALTER TABLE blog_settings ADD COLUMN IF NOT EXISTS canonical_origin text NOT NULL DEFAULT 'https://www.bibliainteligente.com.br'");
        await client.query("ALTER TABLE blog_settings ADD COLUMN IF NOT EXISTS auto_publish boolean NOT NULL DEFAULT false");
        await client.query("ALTER TABLE blog_settings ADD COLUMN IF NOT EXISTS gsc_verification text NOT NULL DEFAULT ''");
        await client.query("ALTER TABLE blog_settings ADD COLUMN IF NOT EXISTS gsc_html_file text NOT NULL DEFAULT ''");
        await client.query("INSERT INTO blog_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING");
        await client.query(`
          CREATE TABLE IF NOT EXISTS blog_job_runs (
            id uuid PRIMARY KEY,
            keyword_id uuid REFERENCES blog_keywords(id) ON DELETE SET NULL,
            article_id uuid REFERENCES blog_articles(id) ON DELETE SET NULL,
            status text NOT NULL CHECK (status IN ('running','succeeded','failed','skipped')),
            message text NOT NULL DEFAULT '',
            started_at timestamptz NOT NULL DEFAULT now(),
            finished_at timestamptz
          )
        `);
        await client.query("CREATE INDEX IF NOT EXISTS blog_job_runs_started_idx ON blog_job_runs (started_at DESC)");
        await client.query(`
          CREATE TABLE IF NOT EXISTS blog_article_views (
            article_id uuid NOT NULL REFERENCES blog_articles(id) ON DELETE CASCADE,
            day date NOT NULL,
            views integer NOT NULL DEFAULT 0,
            PRIMARY KEY (article_id, day)
          )
        `);
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
  const { cover_image: coverImage, cover_file_key: coverFileKey, ...article } = row;
  return { ...article, has_cover: Boolean(coverImage || coverFileKey) };
}