import { db } from './db';
import { users, subscriptions, bookmarks, annotations, aiHistory, aiUsageLimits } from '@shared/schema';
import type {
  User,
  InsertUser,
  Subscription,
  InsertSubscription,
  Bookmark,
  InsertBookmark,
  Annotation,
  InsertAnnotation,
  AIHistory,
  InsertAIHistory,
  AIUsageLimit,
  InsertAIUsageLimit,
} from '@shared/schema';
import { eq, and, desc, gte, sql } from 'drizzle-orm';

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAdminUsers(): Promise<User[]>;
  makeUserAdmin(userId: string): Promise<void>;

  // Subscriptions
  getUserSubscriptions(userId: string): Promise<Subscription[]>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  hasActiveSubscription(userId: string, planType: string): Promise<boolean>;

  // Bookmarks
  getUserBookmarks(userId: string): Promise<Bookmark[]>;
  createBookmark(bookmark: InsertBookmark): Promise<Bookmark>;
  deleteBookmark(id: string, userId: string): Promise<void>;

  // Annotations
  getUserAnnotations(userId: string): Promise<Annotation[]>;
  getVerseAnnotations(userId: string, book: string, chapter: number, verse: number): Promise<Annotation[]>;
  createAnnotation(annotation: InsertAnnotation): Promise<Annotation>;
  updateAnnotation(id: string, userId: string, note: string): Promise<Annotation | undefined>;
  deleteAnnotation(id: string, userId: string): Promise<void>;

  // AI History
  getUserAIHistory(userId: string): Promise<AIHistory[]>;
  createAIHistory(history: InsertAIHistory): Promise<AIHistory>;

  // AI Usage Limits (Rate Limiting)
  getTodayUsageCount(userId: string): Promise<number>;
  incrementUsageCount(userId: string): Promise<void>;
}

class PostgresStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async getAdminUsers(): Promise<User[]> {
    return db.select().from(users).where(eq(users.isAdmin, true));
  }

  async makeUserAdmin(userId: string): Promise<void> {
    await db.update(users).set({ isAdmin: true }).where(eq(users.id, userId));
  }

  // Subscriptions
  async getUserSubscriptions(userId: string): Promise<Subscription[]> {
    return db.select().from(subscriptions).where(eq(subscriptions.userId, userId));
  }

  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const result = await db.insert(subscriptions).values(subscription).returning();
    return result[0];
  }

  async hasActiveSubscription(userId: string, planType: string): Promise<boolean> {
    const result = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.planType, planType),
          eq(subscriptions.status, 'active')
        )
      );
    return result.length > 0;
  }

  // Bookmarks
  async getUserBookmarks(userId: string): Promise<Bookmark[]> {
    return db.select().from(bookmarks).where(eq(bookmarks.userId, userId)).orderBy(desc(bookmarks.createdAt));
  }

  async createBookmark(bookmark: InsertBookmark): Promise<Bookmark> {
    const result = await db.insert(bookmarks).values(bookmark).returning();
    return result[0];
  }

  async deleteBookmark(id: string, userId: string): Promise<void> {
    await db.delete(bookmarks).where(and(eq(bookmarks.id, id), eq(bookmarks.userId, userId)));
  }

  // Annotations
  async getUserAnnotations(userId: string): Promise<Annotation[]> {
    return db.select().from(annotations).where(eq(annotations.userId, userId)).orderBy(desc(annotations.updatedAt));
  }

  async getVerseAnnotations(userId: string, book: string, chapter: number, verse: number): Promise<Annotation[]> {
    return db
      .select()
      .from(annotations)
      .where(
        and(
          eq(annotations.userId, userId),
          eq(annotations.book, book),
          eq(annotations.chapter, chapter),
          eq(annotations.verse, verse)
        )
      );
  }

  async createAnnotation(annotation: InsertAnnotation): Promise<Annotation> {
    const result = await db.insert(annotations).values(annotation).returning();
    return result[0];
  }

  async updateAnnotation(id: string, userId: string, note: string): Promise<Annotation | undefined> {
    const result = await db
      .update(annotations)
      .set({ note, updatedAt: new Date() })
      .where(and(eq(annotations.id, id), eq(annotations.userId, userId)))
      .returning();
    return result[0];
  }

  async deleteAnnotation(id: string, userId: string): Promise<void> {
    await db.delete(annotations).where(and(eq(annotations.id, id), eq(annotations.userId, userId)));
  }

  // AI History
  async getUserAIHistory(userId: string): Promise<AIHistory[]> {
    return db.select().from(aiHistory).where(eq(aiHistory.userId, userId)).orderBy(desc(aiHistory.createdAt));
  }

  async createAIHistory(history: InsertAIHistory): Promise<AIHistory> {
    const result = await db.insert(aiHistory).values(history).returning();
    return result[0];
  }

  // AI Usage Limits (Rate Limiting)
  async getTodayUsageCount(userId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    const result = await db
      .select()
      .from(aiUsageLimits)
      .where(
        and(
          eq(aiUsageLimits.userId, userId),
          gte(aiUsageLimits.date, today)
        )
      );

    return result.reduce((sum, record) => sum + record.questionCount, 0);
  }

  async incrementUsageCount(userId: string): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    // Try to find today's record
    const existing = await db
      .select()
      .from(aiUsageLimits)
      .where(
        and(
          eq(aiUsageLimits.userId, userId),
          gte(aiUsageLimits.date, today)
        )
      );

    if (existing.length > 0) {
      // Increment existing record
      await db
        .update(aiUsageLimits)
        .set({ questionCount: sql`${aiUsageLimits.questionCount} + 1` })
        .where(eq(aiUsageLimits.id, existing[0].id));
    } else {
      // Create new record for today
      await db.insert(aiUsageLimits).values({
        userId,
        date: today,
        questionCount: 1,
      });
    }
  }
}

export const storage = new PostgresStorage();
