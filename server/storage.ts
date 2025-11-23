import { db } from './db';
import { users, subscriptions, bookmarks, annotations, aiHistory, aiUsageLimits, passwordResetTokens, adminActions, bonuses } from '@shared/schema';
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
  AdminAction,
  InsertAdminAction,
  Bonus,
  InsertBonus,
} from '@shared/schema';
import { eq, and, desc, gte, sql, like, limit, offset } from 'drizzle-orm';

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAdminUsers(): Promise<User[]>;
  makeUserAdmin(userId: string): Promise<void>;
  updateUserPassword(userId: string, hashedPassword: string): Promise<void>;
  createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<void>;
  getPasswordResetToken(token: string): Promise<{userId: string; expiresAt: Date; used: boolean} | undefined>;
  markResetTokenAsUsed(token: string): Promise<void>;

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

  // Admin Operations
  getAllUsers(searchEmail?: string, limit?: number, offset?: number): Promise<{ users: User[], total: number }>;
  updateUserRole(userId: string, role: string): Promise<void>;
  blockUser(userId: string): Promise<void>;
  unblockUser(userId: string): Promise<void>;
  updateUserLastLogin(userId: string): Promise<void>;

  // Bonuses
  createBonus(bonus: InsertBonus): Promise<Bonus>;
  getUserBonuses(userId: string): Promise<Bonus[]>;
  revokeBonus(bonusId: string): Promise<void>;
  getActiveBonuses(): Promise<Bonus[]>;

  // Audit Log
  logAdminAction(action: InsertAdminAction): Promise<AdminAction>;
  getAdminActions(limit?: number): Promise<AdminAction[]>;
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
    await db.update(users).set({ role: 'admin' }).where(eq(users.id, userId));
  }

  async getAllUsers(searchEmail?: string, take?: number, skip?: number): Promise<{ users: User[], total: number }> {
    let query = db.select().from(users).$dynamic();
    
    if (searchEmail) {
      query = query.where(like(users.email, `%${searchEmail}%`));
    }

    const totalResult = await db.select({ count: sql<number>`count(*)` }).from(users);
    const total = totalResult[0]?.count || 0;

    let finalQuery = query.orderBy(desc(users.createdAt));
    if (take) finalQuery = finalQuery.limit(take);
    if (skip) finalQuery = finalQuery.offset(skip);

    const usersList = await finalQuery;
    return { users: usersList, total };
  }

  async updateUserRole(userId: string, role: string): Promise<void> {
    await db.update(users).set({ role }).where(eq(users.id, userId));
  }

  async blockUser(userId: string): Promise<void> {
    await db.update(users).set({ isBlocked: true }).where(eq(users.id, userId));
  }

  async unblockUser(userId: string): Promise<void> {
    await db.update(users).set({ isBlocked: false }).where(eq(users.id, userId));
  }

  async updateUserLastLogin(userId: string): Promise<void> {
    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, userId));
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
    await db.update(users).set({ password: hashedPassword }).where(eq(users.id, userId));
  }

  async createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    await db.insert(passwordResetTokens).values({ userId, token, expiresAt });
  }

  async getPasswordResetToken(token: string): Promise<{userId: string; expiresAt: Date; used: boolean} | undefined> {
    const result = await db.select({
      userId: passwordResetTokens.userId,
      expiresAt: passwordResetTokens.expiresAt,
      used: passwordResetTokens.used,
    }).from(passwordResetTokens).where(eq(passwordResetTokens.token, token));
    return result[0];
  }

  async markResetTokenAsUsed(token: string): Promise<void> {
    await db.update(passwordResetTokens).set({ used: true }).where(eq(passwordResetTokens.token, token));
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

  // Bonuses
  async createBonus(bonus: InsertBonus): Promise<Bonus> {
    const result = await db.insert(bonuses).values(bonus).returning();
    return result[0];
  }

  async getUserBonuses(userId: string): Promise<Bonus[]> {
    return db.select().from(bonuses).where(eq(bonuses.userId, userId)).orderBy(desc(bonuses.createdAt));
  }

  async revokeBonus(bonusId: string): Promise<void> {
    await db.update(bonuses).set({ isActive: false }).where(eq(bonuses.id, bonusId));
  }

  async getActiveBonuses(): Promise<Bonus[]> {
    return db.select().from(bonuses).where(eq(bonuses.isActive, true)).orderBy(desc(bonuses.createdAt));
  }

  // Audit Log
  async logAdminAction(action: InsertAdminAction): Promise<AdminAction> {
    const result = await db.insert(adminActions).values(action).returning();
    return result[0];
  }

  async getAdminActions(take?: number): Promise<AdminAction[]> {
    let query = db.select().from(adminActions).orderBy(desc(adminActions.createdAt));
    if (take) query = query.limit(take);
    return query;
  }
}

export const storage = new PostgresStorage();
