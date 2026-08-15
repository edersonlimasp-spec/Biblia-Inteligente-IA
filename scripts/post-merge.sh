#!/bin/bash
set -e

# Post-merge setup script — runs after every task merge
# Must be idempotent and non-interactive

echo "📦 Installing dependencies..."
npm install --prefer-offline --no-audit 2>&1 | tail -5

echo "🗄️  Applying library DB migrations..."
node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function migrate() {
  await pool.query(\`
    CREATE TABLE IF NOT EXISTS library_books (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
      title TEXT NOT NULL,
      subtitle TEXT,
      author TEXT NOT NULL,
      description TEXT,
      cover_url TEXT,
      category TEXT NOT NULL,
      access_type TEXT NOT NULL DEFAULT 'free',
      price TEXT,
      plan_required TEXT,
      estimated_read_time TEXT,
      chapters_count INTEGER NOT NULL DEFAULT 0,
      publish_status TEXT NOT NULL DEFAULT 'draft',
      is_new BOOLEAN NOT NULL DEFAULT false,
      edition_note TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS library_chapters (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
      book_id VARCHAR NOT NULL REFERENCES library_books(id) ON DELETE CASCADE,
      order_num INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      estimated_read_time TEXT,
      is_sample BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE(book_id, order_num)
    );
    CREATE TABLE IF NOT EXISTS library_reading_progress (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id TEXT NOT NULL,
      book_id VARCHAR NOT NULL REFERENCES library_books(id) ON DELETE CASCADE,
      current_chapter INTEGER NOT NULL DEFAULT 1,
      scroll_position INTEGER NOT NULL DEFAULT 0,
      percent_complete INTEGER NOT NULL DEFAULT 0,
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE(user_id, book_id)
    );
    CREATE TABLE IF NOT EXISTS library_highlights (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id TEXT NOT NULL,
      book_id VARCHAR NOT NULL REFERENCES library_books(id) ON DELETE CASCADE,
      chapter_id VARCHAR NOT NULL REFERENCES library_chapters(id) ON DELETE CASCADE,
      selected_text TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT 'yellow',
      annotation TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS library_purchases (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id TEXT NOT NULL,
      book_id VARCHAR NOT NULL REFERENCES library_books(id) ON DELETE CASCADE,
      amount_cents INTEGER NOT NULL DEFAULT 0,
      payment_provider TEXT NOT NULL DEFAULT 'mercadopago',
      payment_id TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE(user_id, book_id)
    );
    ALTER TABLE library_books ADD COLUMN IF NOT EXISTS subtitle TEXT;
    ALTER TABLE library_books ADD COLUMN IF NOT EXISTS access_type TEXT NOT NULL DEFAULT 'free';
    ALTER TABLE library_books ADD COLUMN IF NOT EXISTS price TEXT;
    ALTER TABLE library_books ADD COLUMN IF NOT EXISTS plan_required TEXT;
    ALTER TABLE library_books ADD COLUMN IF NOT EXISTS estimated_read_time TEXT;
    ALTER TABLE library_books ADD COLUMN IF NOT EXISTS chapters_count INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE library_books ADD COLUMN IF NOT EXISTS publish_status TEXT NOT NULL DEFAULT 'draft';
    ALTER TABLE library_books ADD COLUMN IF NOT EXISTS is_new BOOLEAN NOT NULL DEFAULT false;
    ALTER TABLE library_books ADD COLUMN IF NOT EXISTS edition_note TEXT;
    ALTER TABLE library_books ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();
    ALTER TABLE library_chapters ADD COLUMN IF NOT EXISTS estimated_read_time TEXT;
    ALTER TABLE library_chapters ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();
  \`);
  console.log('Library tables ready');
  await pool.end();
}
migrate().catch(e => { console.error('Migration warning (non-fatal):', e.message); pool.end(); });
"

echo "✅ Post-merge setup complete"
