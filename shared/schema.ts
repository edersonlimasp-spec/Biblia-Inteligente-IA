import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, jsonb, integer, index, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name"),
  email: text("email").unique(),
  password: text("password"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  googleId: varchar("google_id"),
  role: text("role").notNull().default("user"),
  isAdmin: boolean("is_admin").notNull().default(false),
  isBlocked: boolean("is_blocked").notNull().default(false),
  trialStartDate: timestamp("trial_start_date").defaultNow(),
  lastLoginAt: timestamp("last_login_at"),
  lastSeenAt: timestamp("last_seen_at").defaultNow(),
  lastSeenPlatform: text("last_seen_platform").default("web"),
  emailOptOut: boolean("email_opt_out").notNull().default(false),
  preferredLanguage: text("preferred_language").default("pt"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;

export const insertUserSchema = createInsertSchema(users).pick({
  name: true,
  email: true,
  password: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
  googleId: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Subscriptions table
export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  planType: text("plan_type").notNull(), // 'strong_lifetime', 'gold', 'premium'
  status: text("status").notNull().default('active'), // 'active', 'cancelled', 'expired'
  startDate: timestamp("start_date").notNull().defaultNow(),
  endDate: timestamp("end_date"), // null for lifetime
  amount: text("amount").notNull(), // Store as text: "189.90" (Strong Vitalício), "19.90" (Gold), "29.90" (Premium)
  // Native IAP fields (Apple/Google)
  source: text("source").notNull().default('web'), // 'web', 'apple', 'google'
  storeTransactionId: text("store_transaction_id"), // Apple transactionId or Google purchaseToken
  originalTransactionId: text("original_transaction_id"), // For subscription renewals
  storeProductId: text("store_product_id"), // Product ID in App Store/Play Store
  lastVerifiedAt: timestamp("last_verified_at"),
  nextRenewalCheck: timestamp("next_renewal_check"),
  cancellationAt: timestamp("cancellation_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
});

export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;

// Bookmarks table
export const bookmarks = pgTable("bookmarks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  book: text("book").notNull(),
  chapter: integer("chapter").notNull(),
  verse: integer("verse").notNull(),
  color: text("color"), // Optional color for the bookmark
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertBookmarkSchema = createInsertSchema(bookmarks).omit({
  id: true,
  createdAt: true,
});

export type InsertBookmark = z.infer<typeof insertBookmarkSchema>;
export type Bookmark = typeof bookmarks.$inferSelect;

// Annotations table
export const annotations = pgTable("annotations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  book: text("book").notNull(),
  chapter: integer("chapter").notNull(),
  verse: integer("verse").notNull(),
  note: text("note").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertAnnotationSchema = createInsertSchema(annotations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAnnotation = z.infer<typeof insertAnnotationSchema>;
export type Annotation = typeof annotations.$inferSelect;

// AI History table
export const aiHistory = pgTable("ai_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  book: text("book"),
  chapter: integer("chapter"),
  verse: integer("verse"),
  question: text("question").notNull(),
  response: text("response").notNull(),
  aiMode: text("ai_mode").notNull(), // 'essential' or 'premium'
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAIHistorySchema = createInsertSchema(aiHistory).omit({
  id: true,
  createdAt: true,
});

export type InsertAIHistory = z.infer<typeof insertAIHistorySchema>;
export type AIHistory = typeof aiHistory.$inferSelect;

// Chat Sessions table (Cloud Sync for AI conversations)
export const chatSessions = pgTable("chat_sessions", {
  id: varchar("id").primaryKey(), // Client-generated UUID for sync
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  messages: jsonb("messages").notNull().$type<ChatMessage[]>(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  syncedAt: timestamp("synced_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("chat_sessions_user_id_idx").on(table.userId),
  updatedAtIdx: index("chat_sessions_updated_at_idx").on(table.updatedAt),
}));

export interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  timestamp: string;
  verseContext?: {
    book: string;
    chapter: number;
    verse: number;
  };
}

export const insertChatSessionSchema = createInsertSchema(chatSessions).omit({
  syncedAt: true,
});

export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;
export type ChatSession = typeof chatSessions.$inferSelect;

// User Sync Metadata table (tracks last sync timestamp per user)
export const userSyncMeta = pgTable("user_sync_meta", {
  userId: varchar("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  lastSyncedAt: timestamp("last_synced_at").notNull().defaultNow(),
  deviceId: text("device_id"),
});

export type UserSyncMeta = typeof userSyncMeta.$inferSelect;

// Password Reset Tokens table
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

// Strong's Dictionary Entries table
export const strongEntries = pgTable("strong_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  strongNumber: text("strong_number").notNull().unique(), // e.g., "G2316", "H7225"
  language: text("language").notNull(), // 'greek' or 'hebrew'
  lemma: text("lemma").notNull(), // Original Greek/Hebrew word
  translit: text("translit"), // Transliteration (romanized)
  xlit: text("xlit"), // Alternative transliteration (Hebrew only)
  pron: text("pron"), // Pronunciation
  kjvDef: text("kjv_def"), // KJV definition (English)
  portugueseDef: text("portuguese_def"), // Portuguese translation of definition
  strongsDef: text("strongs_def"), // Full Strong's definition
  derivation: text("derivation"), // Etymology/word derivation
  extendedDefinition: text("extended_definition"), // Rich theological explanation in Portuguese (AI-generated)
  aiGenerated: boolean("ai_generated").default(false), // Flag if definition was AI-generated
  morphologicalInfo: text("morphological_info"), // Detailed morphological analysis (AI-generated)
  synonymsRelated: text("synonyms_related"), // Synonyms and related biblical terms (AI-generated)
  verseReferences: text("verse_references"), // Key verse references where term appears (AI-generated)
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  // PRIMARY index for Strong lookups by number (critical for performance)
  strongNumberIdx: index("strong_entries_strong_number_idx").on(table.strongNumber),
  // Indexes for search performance (optimized for LIKE queries)
  lemmaIdx: index("strong_entries_lemma_idx").on(table.lemma),
  translitIdx: index("strong_entries_translit_idx").on(table.translit),
  kjvDefIdx: index("strong_entries_kjv_def_idx").on(table.kjvDef),
  languageIdx: index("strong_entries_language_idx").on(table.language),
}));

export const insertStrongEntrySchema = createInsertSchema(strongEntries).omit({
  id: true,
  createdAt: true,
});

export type InsertStrongEntry = z.infer<typeof insertStrongEntrySchema>;
export type StrongEntry = typeof strongEntries.$inferSelect;

// Bible Words (interlinear data) table
export const bibleWords = pgTable("bible_words", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  book: text("book").notNull(), // e.g., 'gen', 'jhn'
  chapter: integer("chapter").notNull(),
  verse: integer("verse").notNull(),
  wordPosition: integer("word_position").notNull(), // Order of word in verse
  originalWord: text("original_word"), // Greek/Hebrew word
  strongNumber: text("strong_number"), // e.g., "G2316", "H7225" — lema (UGNT/OSHB)
  pdfStrong: text("pdf_strong"), // Strong's Exhaustive (forma flexionada) usado pelo PDF SBB Almeida-Strong; populado apenas para NT quando difere do lema
  morphology: text("morphology"), // Grammatical parsing
  gloss: text("gloss"), // English gloss/translation
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertBibleWordSchema = createInsertSchema(bibleWords).omit({
  id: true,
  createdAt: true,
});

export type InsertBibleWord = z.infer<typeof insertBibleWordSchema>;
export type BibleWord = typeof bibleWords.$inferSelect;

// PDF SBB Almeida-Strong word index
// Para cada livro, mapeia palavra portuguesa normalizada → Strong mais frequente
// no PDF de referência. Usado como fallback no endpoint de Strong-words quando
// bible_words não cobre a palavra. Tabela criada via SQL direto (não via db:push).
export const pdfWordIndex = pgTable("pdf_word_index", {
  bookId: varchar("book_id", { length: 8 }).notNull(),
  wordNorm: varchar("word_norm", { length: 64 }).notNull(),
  strongNumber: varchar("strong_number", { length: 8 }).notNull(),
  occurrences: integer("occurrences").notNull().default(1),
}, (table) => ({
  pk: primaryKey({ columns: [table.bookId, table.wordNorm] }),
}));

export type PdfWordIndex = typeof pdfWordIndex.$inferSelect;

// Admin Actions (Audit Log) table
export const adminActions = pgTable("admin_actions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  action: text("action"),
  adminId: varchar("admin_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  actionType: text("action_type").notNull(), // BONUS_GRANTED, PLAN_CHANGED, ADMIN_CREATED, USER_BLOCKED, etc.
  targetUserId: varchar("target_user_id").references(() => users.id, { onDelete: "cascade" }),
  details: jsonb("details"), // Additional context/data
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  adminIdIdx: index("admin_actions_admin_id_idx").on(table.adminId),
  targetUserIdIdx: index("admin_actions_target_user_id_idx").on(table.targetUserId),
  createdAtIdx: index("admin_actions_created_at_idx").on(table.createdAt),
}));

export const insertAdminActionSchema = createInsertSchema(adminActions).omit({
  id: true,
  createdAt: true,
});

export type InsertAdminAction = z.infer<typeof insertAdminActionSchema>;
export type AdminAction = typeof adminActions.$inferSelect;

// Bonuses/Exemptions table
export const bonuses = pgTable("bonuses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  bonusType: text("bonus_type").notNull(), // TRIAL_EXTEND, GOLD_FREE, PREMIUM_FREE, LIFETIME_GRANT
  isActive: boolean("is_active").notNull().default(true),
  startAt: timestamp("start_at").notNull().defaultNow(),
  endAt: timestamp("end_at"), // null for lifetime/permanent bonuses
  expiresAt: timestamp("expires_at"), // Legacy column - kept for compatibility
  reason: text("reason"),
  grantedByAdminId: varchar("granted_by_admin_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("bonuses_user_id_idx").on(table.userId),
  isActiveIdx: index("bonuses_is_active_idx").on(table.isActive),
  createdAtIdx: index("bonuses_created_at_idx").on(table.createdAt),
}));

export const insertBonusSchema = createInsertSchema(bonuses).omit({
  id: true,
  createdAt: true,
  isActive: true,
});

export type InsertBonus = z.infer<typeof insertBonusSchema>;
export type Bonus = typeof bonuses.$inferSelect;

// AI Usage Limits table (for rate limiting)
export const aiUsageLimits = pgTable("ai_usage_limits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull().defaultNow(), // Date of usage (daily reset)
  questionCount: integer("question_count").notNull().default(0), // Number of AI questions asked today
  strongLookups: integer("strong_lookups").notNull().default(0), // Number of Strong lookups today
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  // Index for efficient lookups by user and date
  userDateIdx: index("ai_usage_limits_user_date_idx").on(table.userId, table.date),
}));

export const insertAIUsageLimitSchema = createInsertSchema(aiUsageLimits).omit({
  id: true,
  createdAt: true,
});

export type InsertAIUsageLimit = z.infer<typeof insertAIUsageLimitSchema>;
export type AIUsageLimit = typeof aiUsageLimits.$inferSelect;

// User Sessions table (for online tracking)
export const userSessions = pgTable("user_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sessionId: text("session_id").notNull().unique(),
  lastActivityAt: timestamp("last_activity_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("user_sessions_user_id_idx").on(table.userId),
  lastActivityAtIdx: index("user_sessions_last_activity_at_idx").on(table.lastActivityAt),
}));

export type UserSession = typeof userSessions.$inferSelect;

// Page Events table (for tracking page views, AI usage, subscription funnel, etc.)
export const pageEvents = pgTable("page_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(), // 'PAGE_VIEW', 'AI_QUESTION', 'SUBSCRIPTION_PAGE_VISIT', 'SUBSCRIPTION_ABANDONED'
  eventData: jsonb("event_data"), // Additional context (page name, AI mode, etc.)
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("page_events_user_id_idx").on(table.userId),
  eventTypeIdx: index("page_events_event_type_idx").on(table.eventType),
  createdAtIdx: index("page_events_created_at_idx").on(table.createdAt),
}));

export const insertPageEventSchema = createInsertSchema(pageEvents).omit({
  id: true,
  createdAt: true,
});

export type InsertPageEvent = z.infer<typeof insertPageEventSchema>;
export type PageEvent = typeof pageEvents.$inferSelect;

export const appEvents = pgTable("app_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  deviceId: text("device_id").notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(),
  eventData: jsonb("event_data"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  deviceIdIdx: index("app_events_device_id_idx").on(table.deviceId),
  userIdIdx: index("app_events_user_id_idx").on(table.userId),
  eventTypeIdx: index("app_events_event_type_idx").on(table.eventType),
  createdAtIdx: index("app_events_created_at_idx").on(table.createdAt),
}));

export const insertAppEventSchema = createInsertSchema(appEvents).omit({
  id: true,
  createdAt: true,
});

export type InsertAppEvent = z.infer<typeof insertAppEventSchema>;
export type AppEvent = typeof appEvents.$inferSelect;

// Bible Versions table
export const bibleVersions = pgTable("bible_versions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(), // 'ACF', 'ARC', 'KJV', etc.
  name: text("name").notNull(), // 'Almeida Corrigida Fiel', etc.
  language: text("language").notNull(), // 'pt', 'en'
  license: text("license").notNull(), // 'public_domain', 'free_license'
  sourceUrl: text("source_url"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  codeIdx: index("bible_versions_code_idx").on(table.code),
  languageIdx: index("bible_versions_language_idx").on(table.language),
}));

export type BibleVersion = typeof bibleVersions.$inferSelect;

// Bible Verses table (stores text for each version)
export const bibleVerses = pgTable("bible_verses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  versionCode: text("version_code").notNull().references(() => bibleVersions.code, { onDelete: "cascade" }),
  book: text("book").notNull(),
  chapter: integer("chapter").notNull(),
  verse: integer("verse").notNull(),
  text: text("text").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  versionBookChapterVerseIdx: index("bible_verses_vbcv_idx").on(table.versionCode, table.book, table.chapter, table.verse),
  bookChapterVerseIdx: index("bible_verses_bcv_idx").on(table.book, table.chapter, table.verse),
}));

export type BibleVerse = typeof bibleVerses.$inferSelect;

// User Bible Preferences
export const userBiblePreferences = pgTable("user_bible_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  defaultVersionCode: text("default_version_code").notNull().default("ACF"),
  lastViewedVersionCode: text("last_viewed_version_code").notNull().default("ACF"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Highlights table (cloud-synced verse highlights)
export const highlights = pgTable("highlights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  book: text("book").notNull(),
  chapter: integer("chapter").notNull(),
  verse: integer("verse").notNull(),
  color: text("color").notNull(), // 'yellow', 'green', 'blue', 'pink', 'orange', 'purple'
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("highlights_user_id_idx").on(table.userId),
  userBookChapterIdx: index("highlights_user_bcv_idx").on(table.userId, table.book, table.chapter),
}));

export const insertHighlightSchema = createInsertSchema(highlights).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertHighlight = z.infer<typeof insertHighlightSchema>;
export type Highlight = typeof highlights.$inferSelect;

// Sync State table (tracks last sync per device)
export const syncState = pgTable("sync_state", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  deviceId: text("device_id").notNull(), // Unique device identifier
  lastSyncAt: timestamp("last_sync_at").notNull().defaultNow(),
  syncVersion: integer("sync_version").notNull().default(1), // Increment on each sync
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  userDeviceIdx: index("sync_state_user_device_idx").on(table.userId, table.deviceId),
}));

export type SyncState = typeof syncState.$inferSelect;

// Reading History table (tracks what user has read)
export const readingHistory = pgTable("reading_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  book: text("book").notNull(),
  chapter: integer("chapter").notNull(),
  versionCode: text("version_code").notNull().default("ACF"),
  readAt: timestamp("read_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("reading_history_user_id_idx").on(table.userId),
  readAtIdx: index("reading_history_read_at_idx").on(table.readAt),
}));

export const insertReadingHistorySchema = createInsertSchema(readingHistory).omit({
  id: true,
  createdAt: true,
});

export type InsertReadingHistory = z.infer<typeof insertReadingHistorySchema>;
export type ReadingHistory = typeof readingHistory.$inferSelect;

// Guests table (anonymous visitors tracked by deviceId)
export const guests = pgTable("guests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  deviceId: text("device_id").notNull().unique(), // UUID generated on first visit
  platform: text("platform").notNull().default("web"), // 'web', 'android', 'ios'
  locale: text("locale"), // e.g., 'pt-BR', 'en-US'
  firstSeenAt: timestamp("first_seen_at").notNull().defaultNow(),
  lastSeenAt: timestamp("last_seen_at").notNull().defaultNow(),
  totalSessions: integer("total_sessions").notNull().default(1),
  trialStartAt: timestamp("trial_start_at").notNull().defaultNow(),
  trialEndAt: timestamp("trial_end_at").notNull(), // firstSeenAt + 30 days
  linkedUserId: varchar("linked_user_id").references(() => users.id, { onDelete: "set null" }), // When guest creates account
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  deviceIdIdx: index("guests_device_id_idx").on(table.deviceId),
  linkedUserIdIdx: index("guests_linked_user_id_idx").on(table.linkedUserId),
  trialEndAtIdx: index("guests_trial_end_at_idx").on(table.trialEndAt),
}));

export const insertGuestSchema = createInsertSchema(guests).omit({
  id: true,
  createdAt: true,
  totalSessions: true,
});

export type InsertGuest = z.infer<typeof insertGuestSchema>;
export type Guest = typeof guests.$inferSelect;

// Guest AI Usage Limits table (rate limiting for guests)
export const guestAiUsageLimits = pgTable("guest_ai_usage_limits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  deviceId: text("device_id").notNull(),
  date: timestamp("date").notNull().defaultNow(),
  questionCount: integer("question_count").notNull().default(0), // Number of AI questions asked today
  strongLookups: integer("strong_lookups").notNull().default(0), // Number of Strong lookups today
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  deviceDateIdx: index("guest_ai_usage_limits_device_date_idx").on(table.deviceId, table.date),
}));

export type GuestAIUsageLimit = typeof guestAiUsageLimits.$inferSelect;

// Reading Progress table (track chapters read per book)
export const readingProgress = pgTable("reading_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  deviceId: text("device_id"), // For guests
  book: text("book").notNull(),
  chaptersRead: jsonb("chapters_read").notNull().default('[]'), // Array of chapter numbers
  totalChapters: integer("total_chapters").notNull(),
  completedAt: timestamp("completed_at"), // When book was fully read
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("reading_progress_user_id_idx").on(table.userId),
  deviceIdIdx: index("reading_progress_device_id_idx").on(table.deviceId),
  bookIdx: index("reading_progress_book_idx").on(table.book),
}));

export const insertReadingProgressSchema = createInsertSchema(readingProgress).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertReadingProgress = z.infer<typeof insertReadingProgressSchema>;
export type ReadingProgress = typeof readingProgress.$inferSelect;

// Achievements table
export const achievements = pgTable("achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  deviceId: text("device_id"), // For guests
  achievementType: text("achievement_type").notNull(), // 'first_chapter', 'first_book', 'strong_explorer', 'ai_student', 'zen_master', etc.
  achievementName: text("achievement_name").notNull(),
  description: text("description"),
  icon: text("icon"), // Emoji or icon name
  unlockedAt: timestamp("unlocked_at").notNull().defaultNow(),
  metadata: jsonb("metadata"), // Extra data like { book: "Genesis", chapters: 50 }
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("achievements_user_id_idx").on(table.userId),
  deviceIdIdx: index("achievements_device_id_idx").on(table.deviceId),
  typeIdx: index("achievements_type_idx").on(table.achievementType),
}));

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  createdAt: true,
});

export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type Achievement = typeof achievements.$inferSelect;

// Zen Sessions table
export const zenSessions = pgTable("zen_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  deviceId: text("device_id"),
  durationMinutes: integer("duration_minutes").notNull(),
  ambientSound: text("ambient_sound"), // 'rain', 'forest', 'ocean', 'fireplace', 'silence'
  completedAt: timestamp("completed_at"),
  book: text("book"),
  chapter: integer("chapter"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("zen_sessions_user_id_idx").on(table.userId),
  deviceIdIdx: index("zen_sessions_device_id_idx").on(table.deviceId),
}));

export const insertZenSessionSchema = createInsertSchema(zenSessions).omit({
  id: true,
  createdAt: true,
});

export type InsertZenSession = z.infer<typeof insertZenSessionSchema>;
export type ZenSession = typeof zenSessions.$inferSelect;

// Study Modules table (Professor Premium)
export const studyModules = pgTable("study_modules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  color: text("color").notNull().default("#1A5299"),
  level: text("level").notNull().default("iniciante"), // 'iniciante', 'moderado', 'avancado'
  requiredPlan: text("required_plan").notNull().default("gold"), // 'gold' = iniciante, 'premium' = moderado/avancado
  order: integer("order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  orderIdx: index("study_modules_order_idx").on(table.order),
  levelIdx: index("study_modules_level_idx").on(table.level),
}));

export const insertStudyModuleSchema = createInsertSchema(studyModules).omit({
  id: true,
  createdAt: true,
});

export type InsertStudyModule = z.infer<typeof insertStudyModuleSchema>;
export type StudyModule = typeof studyModules.$inferSelect;

// Study Tracks table (Iniciante, Moderado, Avançado)
export const studyTracks = pgTable("study_tracks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  moduleId: varchar("module_id").notNull().references(() => studyModules.id, { onDelete: "cascade" }),
  level: text("level").notNull(), // 'iniciante', 'moderado', 'avancado'
  name: text("name").notNull(),
  description: text("description").notNull(),
  requiredPlan: text("required_plan").notNull().default("gold"), // 'gold' or 'premium'
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  moduleIdIdx: index("study_tracks_module_id_idx").on(table.moduleId),
  levelIdx: index("study_tracks_level_idx").on(table.level),
}));

export const insertStudyTrackSchema = createInsertSchema(studyTracks).omit({
  id: true,
  createdAt: true,
});

export type InsertStudyTrack = z.infer<typeof insertStudyTrackSchema>;
export type StudyTrack = typeof studyTracks.$inferSelect;

// Study Lessons table
export const studyLessons = pgTable("study_lessons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  trackId: varchar("track_id").notNull().references(() => studyTracks.id, { onDelete: "cascade" }),
  order: integer("order").notNull().default(0),
  title: text("title").notNull(),
  content: text("content").notNull(),
  references: text("references").notNull(), // Bible references (e.g., "Gênesis 1:1, João 3:16")
  questions: text("questions").notNull(), // Reflection questions
  application: text("application").notNull(), // Practical application
  summary: text("summary").notNull(),
  estimatedMinutes: integer("estimated_minutes").notNull().default(10),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  trackIdIdx: index("study_lessons_track_id_idx").on(table.trackId),
  orderIdx: index("study_lessons_order_idx").on(table.order),
}));

export const insertStudyLessonSchema = createInsertSchema(studyLessons).omit({
  id: true,
  createdAt: true,
});

export type InsertStudyLesson = z.infer<typeof insertStudyLessonSchema>;
export type StudyLesson = typeof studyLessons.$inferSelect;

// Study Module Translations table (EN/ES translations)
export const studyModuleTranslations = pgTable("study_module_translations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  moduleId: varchar("module_id").notNull().references(() => studyModules.id, { onDelete: "cascade" }),
  language: text("language").notNull(), // 'en' or 'es'
  name: text("name").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  moduleLanguageIdx: index("study_module_translations_module_lang_idx").on(table.moduleId, table.language),
}));

export type StudyModuleTranslation = typeof studyModuleTranslations.$inferSelect;

// Study Track Translations table (EN/ES translations)
export const studyTrackTranslations = pgTable("study_track_translations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  trackId: varchar("track_id").notNull().references(() => studyTracks.id, { onDelete: "cascade" }),
  language: text("language").notNull(), // 'en' or 'es'
  name: text("name").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  trackLanguageIdx: index("study_track_translations_track_lang_idx").on(table.trackId, table.language),
}));

export type StudyTrackTranslation = typeof studyTrackTranslations.$inferSelect;

// Study Lesson Translations table (EN/ES translations)
export const studyLessonTranslations = pgTable("study_lesson_translations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lessonId: varchar("lesson_id").notNull().references(() => studyLessons.id, { onDelete: "cascade" }),
  language: text("language").notNull(), // 'en' or 'es'
  title: text("title").notNull(),
  content: text("content").notNull(),
  references: text("references").notNull(),
  questions: text("questions").notNull(),
  application: text("application").notNull(),
  summary: text("summary").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  lessonLanguageIdx: index("study_lesson_translations_lesson_lang_idx").on(table.lessonId, table.language),
}));

export type StudyLessonTranslation = typeof studyLessonTranslations.$inferSelect;

// User Study Progress table
export const userStudyProgress = pgTable("user_study_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  deviceId: text("device_id"),
  lessonId: varchar("lesson_id").notNull().references(() => studyLessons.id, { onDelete: "cascade" }),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  lastAccessAt: timestamp("last_access_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("user_study_progress_user_id_idx").on(table.userId),
  deviceIdIdx: index("user_study_progress_device_id_idx").on(table.deviceId),
  lessonIdIdx: index("user_study_progress_lesson_id_idx").on(table.lessonId),
}));

export const insertUserStudyProgressSchema = createInsertSchema(userStudyProgress).omit({
  id: true,
  createdAt: true,
});

export type InsertUserStudyProgress = z.infer<typeof insertUserStudyProgressSchema>;
export type UserStudyProgress = typeof userStudyProgress.$inferSelect;

// Free AI Questions Quota table (permanent count - NOT daily reset)
// Tracks the cumulative number of free AI questions used by users
export const freeAiQuota = pgTable("free_ai_quota", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  questionsUsed: integer("questions_used").notNull().default(0),
  guestQuestionsImported: integer("guest_questions_imported").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("free_ai_quota_user_id_idx").on(table.userId),
}));

export type FreeAiQuota = typeof freeAiQuota.$inferSelect;

// Strong Dictionary Quota for registered users (permanent count - NOT daily reset)
// Tracks cumulative Strong lookups: Guest=2 total, Free User=4 total (incl. migrated), Gold=20/day, Premium=unlimited
export const freeStrongQuota = pgTable("free_strong_quota", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  lookupsUsed: integer("lookups_used").notNull().default(0),
  guestLookupsImported: integer("guest_lookups_imported").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("free_strong_quota_user_id_idx").on(table.userId),
}));

export type FreeStrongQuota = typeof freeStrongQuota.$inferSelect;

// Strong Dictionary Quota for guest users (by deviceId - permanent count)
export const guestStrongQuota = pgTable("guest_strong_quota", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  deviceId: text("device_id").notNull().unique(),
  lookupsUsed: integer("lookups_used").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  deviceIdIdx: index("guest_strong_quota_device_id_idx").on(table.deviceId),
}));

export type GuestStrongQuota = typeof guestStrongQuota.$inferSelect;

// Campaign Logs table (for tracking re-engagement campaigns)
export const campaignLogs = pgTable("campaign_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  campaignName: text("campaign_name").notNull(), // 'inactive_30_days', 'trial_expiring', etc.
  sentAt: timestamp("sent_at").notNull().defaultNow(),
  status: text("status").notNull().default('sent'), // 'sent', 'failed', 'delivered', 'opened'
  providerMessageId: text("provider_message_id"), // ID from email provider (Resend)
  errorMessage: text("error_message"), // Error details if failed
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("campaign_logs_user_id_idx").on(table.userId),
  campaignNameIdx: index("campaign_logs_campaign_name_idx").on(table.campaignName),
  sentAtIdx: index("campaign_logs_sent_at_idx").on(table.sentAt),
}));

export const insertCampaignLogSchema = createInsertSchema(campaignLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertCampaignLog = z.infer<typeof insertCampaignLogSchema>;
export type CampaignLog = typeof campaignLogs.$inferSelect;

// Payment Receipts table - Detailed validation and logging of payment transactions
export const paymentReceipts = pgTable("payment_receipts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Payment identification
  externalPaymentId: text("external_payment_id").notNull(), // MP payment_id or preapproval_id
  paymentProvider: text("payment_provider").notNull().default("mercadopago"), // mercadopago, stripe, etc.
  paymentType: text("payment_type").notNull(), // 'payment', 'preapproval', 'subscription'
  
  // User association
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  userEmail: text("user_email"), // Backup in case user is deleted
  
  // Plan information
  planType: text("plan_type").notNull(), // 'gold', 'premium', 'strong_lifetime'
  subscriptionDays: integer("subscription_days"), // null for lifetime
  isLifetime: boolean("is_lifetime").notNull().default(false),
  
  // Financial details (in BRL cents for precision)
  grossAmount: integer("gross_amount").notNull(), // Valor bruto (e.g., 1990 = R$ 19,90)
  feeAmount: integer("fee_amount").default(0), // Taxas do provedor
  taxAmount: integer("tax_amount").default(0), // Impostos
  netAmount: integer("net_amount").notNull(), // Valor líquido recebido
  currency: text("currency").notNull().default("BRL"),
  
  // Payment status
  status: text("status").notNull(), // 'approved', 'pending', 'rejected', 'refunded', 'cancelled'
  statusDetail: text("status_detail"), // Detailed status from provider
  
  // Origin and context
  origin: text("origin").notNull(), // 'checkout', 'webhook', 'api', 'manual'
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  deviceId: text("device_id"),
  
  // Provider raw data (for debugging)
  providerRawData: jsonb("provider_raw_data"),
  
  // Validation
  isValidated: boolean("is_validated").notNull().default(false),
  validationErrors: text("validation_errors").array(),
  validatedAt: timestamp("validated_at"),
  
  // Subscription activation
  subscriptionId: varchar("subscription_id").references(() => subscriptions.id, { onDelete: "set null" }),
  activatedAt: timestamp("activated_at"),
  
  // Timestamps
  paymentDate: timestamp("payment_date").notNull(), // When payment was made
  receivedAt: timestamp("received_at").notNull().defaultNow(), // When we received notification
  processedAt: timestamp("processed_at"), // When we finished processing
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  externalPaymentIdx: index("payment_receipts_external_payment_idx").on(table.externalPaymentId),
  userIdIdx: index("payment_receipts_user_id_idx").on(table.userId),
  statusIdx: index("payment_receipts_status_idx").on(table.status),
  paymentDateIdx: index("payment_receipts_payment_date_idx").on(table.paymentDate),
  planTypeIdx: index("payment_receipts_plan_type_idx").on(table.planType),
}));

export const insertPaymentReceiptSchema = createInsertSchema(paymentReceipts).omit({
  id: true,
  createdAt: true,
});

export type InsertPaymentReceipt = z.infer<typeof insertPaymentReceiptSchema>;
export type PaymentReceipt = typeof paymentReceipts.$inferSelect;

// ==========================================
// READING PLANS MODULE
// ==========================================

// Reading Plan Templates - predefined plans (52-Week, Five-Day, Chronological, etc.)
export const readingPlanTemplates = pgTable("reading_plan_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: text("slug").notNull().unique(), // e.g., "52-week-genre", "five-day-bible"
  titlePt: text("title_pt").notNull(),
  titleEn: text("title_en").notNull(),
  titleEs: text("title_es").notNull(),
  descriptionPt: text("description_pt").notNull(),
  descriptionEn: text("description_en").notNull(),
  descriptionEs: text("description_es").notNull(),
  category: text("category").notNull(), // 'full-bible', 'new-testament', 'old-testament', 'topical', 'custom'
  durationDays: integer("duration_days").notNull(), // Total days (e.g., 365, 90, 730)
  defaultPace: integer("default_pace").notNull().default(3), // Chapters per day
  scheduleMode: text("schedule_mode").notNull().default('canonical'), // 'canonical', 'chronological', 'genre', 'alternating'
  weekdaysOnly: boolean("weekdays_only").notNull().default(false), // Skip weekends (Five-Day plans)
  icon: text("icon").notNull().default('BookOpen'), // Lucide icon name
  colorGradient: text("color_gradient").notNull().default('from-blue-500 to-blue-700'),
  tags: text("tags").array(), // ['popular', 'new', 'recommended']
  isActive: boolean("is_active").notNull().default(true),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  slugIdx: index("reading_plan_templates_slug_idx").on(table.slug),
  categoryIdx: index("reading_plan_templates_category_idx").on(table.category),
}));

export const insertReadingPlanTemplateSchema = createInsertSchema(readingPlanTemplates).omit({
  id: true,
  createdAt: true,
});

export type InsertReadingPlanTemplate = z.infer<typeof insertReadingPlanTemplateSchema>;
export type ReadingPlanTemplate = typeof readingPlanTemplates.$inferSelect;

// Reading Plan Entries - daily readings for each template
export interface DailyReading {
  book: string; // e.g., "gen", "mat"
  startChapter: number;
  endChapter?: number; // Optional for multi-chapter readings
  startVerse?: number; // Optional for verse-specific readings
  endVerse?: number;
}

export const readingPlanEntries = pgTable("reading_plan_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: varchar("template_id").notNull().references(() => readingPlanTemplates.id, { onDelete: "cascade" }),
  dayIndex: integer("day_index").notNull(), // 1-based day number
  readings: jsonb("readings").notNull().$type<DailyReading[]>(), // Array of readings for this day
  weekSummaryPt: text("week_summary_pt"), // Optional weekly context summary
  weekSummaryEn: text("week_summary_en"),
  weekSummaryEs: text("week_summary_es"),
  genre: text("genre"), // For genre-based plans: 'epistles', 'law', 'history', 'psalms', 'poetry', 'prophets', 'gospels'
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  templateDayIdx: index("reading_plan_entries_template_day_idx").on(table.templateId, table.dayIndex),
}));

export const insertReadingPlanEntrySchema = createInsertSchema(readingPlanEntries).omit({
  id: true,
  createdAt: true,
});

export type InsertReadingPlanEntry = z.infer<typeof insertReadingPlanEntrySchema>;
export type ReadingPlanEntry = typeof readingPlanEntries.$inferSelect;

// User Reading Plans - user's active/completed plans
export const userReadingPlans = pgTable("user_reading_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }), // Nullable for guests
  deviceId: text("device_id"), // For guest tracking
  templateId: varchar("template_id").references(() => readingPlanTemplates.id, { onDelete: "set null" }), // Null for custom plans
  customTitle: text("custom_title"), // For custom plans
  startDate: timestamp("start_date").notNull(),
  targetEndDate: timestamp("target_end_date").notNull(),
  actualEndDate: timestamp("actual_end_date"), // When completed
  status: text("status").notNull().default('active'), // 'active', 'paused', 'completed', 'abandoned'
  paceOverride: integer("pace_override"), // User can adjust pace
  scheduleModeOverride: text("schedule_mode_override"), // User can change order
  allowAutoCatchup: boolean("allow_auto_catchup").notNull().default(true),
  notificationsEnabled: boolean("notifications_enabled").notNull().default(true),
  notificationTime: text("notification_time").default('08:00'), // HH:MM format
  currentDay: integer("current_day").notNull().default(1), // Current day in the plan
  completedDays: integer("completed_days").notNull().default(0),
  lastReadDate: timestamp("last_read_date"),
  streakDays: integer("streak_days").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("user_reading_plans_user_id_idx").on(table.userId),
  deviceIdIdx: index("user_reading_plans_device_id_idx").on(table.deviceId),
  statusIdx: index("user_reading_plans_status_idx").on(table.status),
}));

export const insertUserReadingPlanSchema = createInsertSchema(userReadingPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUserReadingPlan = z.infer<typeof insertUserReadingPlanSchema>;
export type UserReadingPlan = typeof userReadingPlans.$inferSelect;

// User Daily Readings - tracks completion of each day's readings
export interface CompletedReading {
  book: string;
  chapter: number;
  completedAt: string; // ISO timestamp
}

export const userDailyReadings = pgTable("user_daily_readings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userPlanId: varchar("user_plan_id").notNull().references(() => userReadingPlans.id, { onDelete: "cascade" }),
  dayIndex: integer("day_index").notNull(), // Day in the plan
  scheduledDate: timestamp("scheduled_date").notNull(), // Original scheduled date
  actualDate: timestamp("actual_date"), // When actually completed (for catch-up tracking)
  readings: jsonb("readings").notNull().$type<DailyReading[]>(), // Readings for this day
  completedReadings: jsonb("completed_readings").$type<CompletedReading[]>(), // Which ones are done
  completionPercent: integer("completion_percent").notNull().default(0), // 0-100
  isCompleted: boolean("is_completed").notNull().default(false),
  isSkipped: boolean("is_skipped").notNull().default(false),
  wasAutoShifted: boolean("was_auto_shifted").notNull().default(false), // If rescheduled due to missed days
  shiftedFromDay: integer("shifted_from_day"), // Original day if shifted
  soapNotes: jsonb("soap_notes"), // S.O.A.P. method notes
  aiSummary: text("ai_summary"), // AI-generated summary
  userNotes: text("user_notes"), // Personal reflection
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  userPlanDayIdx: index("user_daily_readings_plan_day_idx").on(table.userPlanId, table.dayIndex),
  scheduledDateIdx: index("user_daily_readings_scheduled_date_idx").on(table.scheduledDate),
}));

export const insertUserDailyReadingSchema = createInsertSchema(userDailyReadings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUserDailyReading = z.infer<typeof insertUserDailyReadingSchema>;
export type UserDailyReading = typeof userDailyReadings.$inferSelect;

// SOAP Notes structure
export interface SOAPNotes {
  scripture: string; // Key verse selected
  observation: string; // What does it say?
  application: string; // How does it apply to me?
  prayer: string; // Prayer response
}

// Prayer Lists - User's prayer categories/lists
export const prayerLists = pgTable("prayer_lists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  deviceId: text("device_id"),
  title: text("title").notNull(),
  icon: text("icon").notNull().default("heart"), // lucide icon name
  color: text("color").notNull().default("#3B82F6"), // hex color
  shareId: varchar("share_id").unique(), // For public sharing
  isPublic: boolean("is_public").notNull().default(false),
  displayOrder: integer("display_order").notNull().default(0),
  listType: text("list_type").notNull().default("personal"), // personal, church, preset
  categoryKey: text("category_key"), // family, spiritual, professional, dreams (for preset categories)
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("prayer_lists_user_id_idx").on(table.userId),
  deviceIdIdx: index("prayer_lists_device_id_idx").on(table.deviceId),
  shareIdIdx: index("prayer_lists_share_id_idx").on(table.shareId),
}));

export const insertPrayerListSchema = createInsertSchema(prayerLists).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPrayerList = z.infer<typeof insertPrayerListSchema>;
export type PrayerList = typeof prayerLists.$inferSelect;

// Prayer Requests - Individual prayer items within lists
export const prayerRequests = pgTable("prayer_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  listId: varchar("list_id").notNull().references(() => prayerLists.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  deviceId: text("device_id"),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull().default("general"), // general, urgent, thanksgiving
  status: text("status").notNull().default("praying"), // praying, answered, other
  answeredAt: timestamp("answered_at"),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  listIdIdx: index("prayer_requests_list_id_idx").on(table.listId),
  userIdIdx: index("prayer_requests_user_id_idx").on(table.userId),
  statusIdx: index("prayer_requests_status_idx").on(table.status),
}));

export const insertPrayerRequestSchema = createInsertSchema(prayerRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPrayerRequest = z.infer<typeof insertPrayerRequestSchema>;
export type PrayerRequest = typeof prayerRequests.$inferSelect;

// Prayer Alarms - Scheduled prayer reminders
export const prayerAlarms = pgTable("prayer_alarms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  deviceId: text("device_id"),
  time: text("time").notNull(), // HH:MM format
  label: text("label").notNull(),
  isEnabled: boolean("is_enabled").notNull().default(true),
  daysOfWeek: jsonb("days_of_week").$type<number[]>().default([0, 1, 2, 3, 4, 5, 6]), // 0=Sun, 6=Sat
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("prayer_alarms_user_id_idx").on(table.userId),
  deviceIdIdx: index("prayer_alarms_device_id_idx").on(table.deviceId),
}));

export const insertPrayerAlarmSchema = createInsertSchema(prayerAlarms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPrayerAlarm = z.infer<typeof insertPrayerAlarmSchema>;
export type PrayerAlarm = typeof prayerAlarms.$inferSelect;

// Prayer Sessions - History of prayer time
export const prayerSessions = pgTable("prayer_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  deviceId: text("device_id"),
  durationMinutes: integer("duration_minutes").notNull(),
  completedAt: timestamp("completed_at").notNull().defaultNow(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("prayer_sessions_user_id_idx").on(table.userId),
  deviceIdIdx: index("prayer_sessions_device_id_idx").on(table.deviceId),
  completedAtIdx: index("prayer_sessions_completed_at_idx").on(table.completedAt),
}));

export const insertPrayerSessionSchema = createInsertSchema(prayerSessions).omit({
  id: true,
  createdAt: true,
});

export type InsertPrayerSession = z.infer<typeof insertPrayerSessionSchema>;
export type PrayerSession = typeof prayerSessions.$inferSelect;

// Sermon Recordings - Audio recordings with transcription and AI summary
export const sermonRecordings = pgTable("sermon_recordings", {
  id: varchar("id").primaryKey(), // Client-generated ID to match IndexedDB
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  duration: integer("duration").notNull(), // Duration in seconds
  category: text("category").notNull().default("culto"), // culto, reuniao, estudo
  speaker: text("speaker"),
  tags: text("tags").array(), // Array of tags
  
  // Transcription fields
  transcriptText: text("transcript_text"),
  transcriptStatus: text("transcript_status").notNull().default("none"), // none, processing, done, error
  
  // AI Summary fields
  summaryJson: jsonb("summary_json"), // Structured JSON from AI
  summaryText: text("summary_text"), // Formatted text version
  
  // User notes
  notesText: text("notes_text"),
  
  // Sharing
  shareToken: text("share_token"),
  shareEnabled: boolean("share_enabled").notNull().default(false),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("sermon_recordings_user_id_idx").on(table.userId),
  createdAtIdx: index("sermon_recordings_created_at_idx").on(table.createdAt),
  categoryIdx: index("sermon_recordings_category_idx").on(table.category),
  shareTokenIdx: index("sermon_recordings_share_token_idx").on(table.shareToken),
}));

export interface SermonSummary {
  titulo_tema?: string;
  versiculo_base?: string;
  contexto?: string;
  pontos_principais?: string[];
  ilustracoes_exemplos?: string[];
  aplicacoes_praticas?: string[];
  decisoes_e_desafios?: string[];
  citacoes_marcantes?: string[];
  oracao_sugerida?: string;
}

export const insertSermonRecordingSchema = createInsertSchema(sermonRecordings).omit({
  createdAt: true,
  updatedAt: true,
});

export type InsertSermonRecording = z.infer<typeof insertSermonRecordingSchema>;
export type SermonRecording = typeof sermonRecordings.$inferSelect;

// Coupons table for discount codes
export const coupons = pgTable("coupons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code", { length: 50 }).notNull().unique(),
  type: text("type").notNull(), // 'PERCENT' or 'FIXED'
  value: integer("value").notNull(), // Percentage (0-100) or fixed amount in cents
  active: boolean("active").notNull().default(true),
  startsAt: timestamp("starts_at"),
  endsAt: timestamp("ends_at"),
  maxRedemptions: integer("max_redemptions"), // Total limit (null = unlimited)
  maxRedemptionsPerUser: integer("max_redemptions_per_user").default(1), // Per user limit
  minAmount: integer("min_amount"), // Minimum plan amount in cents (null = no minimum)
  applicablePlans: text("applicable_plans").array(), // List of plan IDs (null = all plans)
  firstPurchaseOnly: boolean("first_purchase_only").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  codeIdx: index("coupons_code_idx").on(table.code),
  activeIdx: index("coupons_active_idx").on(table.active),
}));

export const insertCouponSchema = createInsertSchema(coupons).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCoupon = z.infer<typeof insertCouponSchema>;
export type Coupon = typeof coupons.$inferSelect;

// Coupon Redemptions table for tracking usage
export const couponRedemptions = pgTable("coupon_redemptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  couponId: varchar("coupon_id").notNull().references(() => coupons.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  planId: text("plan_id").notNull(), // gold, premium, gold_anual, etc.
  subscriptionId: varchar("subscription_id").references(() => subscriptions.id, { onDelete: "set null" }),
  amountBefore: integer("amount_before").notNull(), // Original amount in cents
  discountAmount: integer("discount_amount").notNull(), // Discount applied in cents
  amountAfter: integer("amount_after").notNull(), // Final amount in cents
  redeemedAt: timestamp("redeemed_at").notNull().defaultNow(),
}, (table) => ({
  couponIdIdx: index("coupon_redemptions_coupon_id_idx").on(table.couponId),
  userIdIdx: index("coupon_redemptions_user_id_idx").on(table.userId),
  redeemedAtIdx: index("coupon_redemptions_redeemed_at_idx").on(table.redeemedAt),
}));

export const insertCouponRedemptionSchema = createInsertSchema(couponRedemptions).omit({
  id: true,
  redeemedAt: true,
});

export type InsertCouponRedemption = z.infer<typeof insertCouponRedemptionSchema>;
export type CouponRedemption = typeof couponRedemptions.$inferSelect;
