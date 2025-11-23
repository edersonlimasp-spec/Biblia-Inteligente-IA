import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, jsonb, integer, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"), // 'user', 'admin', 'super_admin'
  isBlocked: boolean("is_blocked").notNull().default(false),
  trialStartDate: timestamp("trial_start_date").notNull().defaultNow(),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  name: true,
  email: true,
  password: true,
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
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
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
  strongNumber: text("strong_number"), // e.g., "G2316", "H7225"
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

// Admin Actions (Audit Log) table
export const adminActions = pgTable("admin_actions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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
  questionCount: integer("question_count").notNull().default(0), // Number of questions asked today
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
