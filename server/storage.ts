import { db } from './db';
import { users, subscriptions, bookmarks, annotations, aiHistory, aiUsageLimits, passwordResetTokens, adminActions, bonuses, userSessions, pageEvents, highlights, syncState, readingHistory, guests, appEvents, guestAiUsageLimits } from '@shared/schema';
import type {
  User,
  InsertUser,
  UpsertUser,
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
  UserSession,
  Highlight,
  InsertHighlight,
  SyncState,
  ReadingHistory,
  InsertReadingHistory,
  Guest,
  InsertGuest,
  AppEvent,
  InsertAppEvent,
  GuestAIUsageLimit,
} from '@shared/schema';
import { eq, and, desc, gte, sql, like } from 'drizzle-orm';

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
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

  // Sessions & Events (for metrics)
  createOrUpdateSession(userId: string, sessionId: string): Promise<UserSession>;
  getOnlineUsers(minutesAgo?: number): Promise<number>;
  trackPageEvent(userId: string, eventType: string, eventData?: any): Promise<void>;
  getAIUsageStats(days?: number): Promise<{total: number; byMode: {essential: number; premium: number}; byUser: Array<{userId: string; count: number}>}>;
  getUsageHeatmap(days?: number): Promise<Array<{hour: number; count: number}>>;
  getAbandonedSubscriptions(): Promise<Array<{userId: string; email: string; lastSeenAt: string}>>;

  // Highlights (Cloud Sync)
  getUserHighlights(userId: string): Promise<Highlight[]>;
  getChapterHighlights(userId: string, book: string, chapter: number): Promise<Highlight[]>;
  createHighlight(highlight: InsertHighlight): Promise<Highlight>;
  updateHighlight(id: string, userId: string, color: string): Promise<Highlight | undefined>;
  deleteHighlight(id: string, userId: string): Promise<void>;
  deleteVerseHighlight(userId: string, book: string, chapter: number, verse: number): Promise<void>;

  // Reading History (Cloud Sync)
  getUserReadingHistory(userId: string, limit?: number): Promise<ReadingHistory[]>;
  addReadingHistory(history: InsertReadingHistory): Promise<ReadingHistory>;

  // Sync State
  getSyncState(userId: string, deviceId: string): Promise<SyncState | undefined>;
  updateSyncState(userId: string, deviceId: string): Promise<SyncState>;
  getAllUserData(userId: string): Promise<{
    bookmarks: Bookmark[];
    annotations: Annotation[];
    highlights: Highlight[];
    readingHistory: ReadingHistory[];
    lastSyncAt: Date | null;
  }>;

  // Guests (anonymous visitors)
  getGuestByDeviceId(deviceId: string): Promise<Guest | undefined>;
  createOrUpdateGuest(deviceId: string, platform: string, locale?: string): Promise<Guest>;
  updateGuestLastSeen(deviceId: string): Promise<void>;
  linkGuestToUser(deviceId: string, userId: string): Promise<void>;
  isGuestTrialActive(deviceId: string): Promise<boolean>;
  getGuestTrialInfo(deviceId: string): Promise<{ active: boolean; daysRemaining: number } | null>;
  
  // Guest AI Usage Limits
  getGuestTodayUsageCount(deviceId: string): Promise<number>;
  incrementGuestUsageCount(deviceId: string): Promise<void>;

  // App Events (analytics)
  trackAppEvent(deviceId: string, eventType: string, eventData?: any, userId?: string): Promise<void>;
  
  // Admin Stats (guests)
  getGuestStats(): Promise<{
    totalGuests: number;
    guestsInTrial: number;
    trialExpired: number;
    linkedToUsers: number;
  }>;
  getEventStats(days?: number): Promise<{
    totalEvents: number;
    byType: Record<string, number>;
    uniqueDevices: number;
  }>;
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

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getAdminUsers(): Promise<User[]> {
    return db.select().from(users).where(eq(users.role, 'admin'));
  }

  async makeUserAdmin(userId: string): Promise<void> {
    await db.update(users).set({ role: 'admin' }).where(eq(users.id, userId));
  }

  async getAllUsers(searchEmail?: string, take?: number, skip?: number): Promise<{ users: User[], total: number }> {
    let whereCondition = undefined;
    
    if (searchEmail) {
      whereCondition = like(users.email, `%${searchEmail}%`);
    }

    const totalResult = await db.select({ count: sql<number>`count(*)` }).from(users)
      .where(whereCondition || undefined);
    const total = totalResult[0]?.count || 0;

    let query = db.select().from(users);
    if (whereCondition) {
      query = query.where(whereCondition);
    }
    query = query.orderBy(desc(users.trialStartDate));
    if (take) query = query.limit(take);
    if (skip) query = query.offset(skip);

    const usersList = await query;
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
    let query = db.select().from(adminActions).orderBy(desc(adminActions.createdAt)) as any;
    if (take) query = query.limit(take);
    return query;
  }

  // Sessions & Events
  async createOrUpdateSession(userId: string, sessionId: string): Promise<UserSession> {
    const existing = await db.select().from(userSessions).where(eq(userSessions.sessionId, sessionId));
    
    if (existing.length > 0) {
      await db.update(userSessions)
        .set({ lastActivityAt: new Date() })
        .where(eq(userSessions.sessionId, sessionId));
      return existing[0];
    }

    const result = await db.insert(userSessions).values({
      userId,
      sessionId,
      lastActivityAt: new Date(),
    }).returning();
    return result[0];
  }

  async getOnlineUsers(minutesAgo: number = 5): Promise<number> {
    const cutoffTime = new Date(Date.now() - minutesAgo * 60000);
    const result = await db.select({ count: sql<number>`count(distinct ${userSessions.userId})` })
      .from(userSessions)
      .where(gte(userSessions.lastActivityAt, cutoffTime));
    return result[0]?.count || 0;
  }

  async trackPageEvent(userId: string, eventType: string, eventData?: any): Promise<void> {
    await db.insert(pageEvents).values({
      userId,
      eventType,
      eventData,
    });
  }

  async getAIUsageStats(days: number = 30): Promise<{total: number; byMode: {essential: number; premium: number}; byUser: Array<{userId: string; count: number}>}> {
    const cutoffDate = new Date(Date.now() - days * 86400000);
    
    const allAIEvents = await db.select().from(pageEvents)
      .where(and(
        eq(pageEvents.eventType, 'AI_QUESTION'),
        gte(pageEvents.createdAt, cutoffDate)
      ));

    const total = allAIEvents.length;
    const byMode = {
      essential: allAIEvents.filter(e => e.eventData?.mode === 'essential').length,
      premium: allAIEvents.filter(e => e.eventData?.mode === 'premium').length,
    };

    const userMap = new Map<string, number>();
    allAIEvents.forEach(e => {
      userMap.set(e.userId, (userMap.get(e.userId) || 0) + 1);
    });

    const byUser = Array.from(userMap.entries())
      .map(([userId, count]) => ({ userId, count }))
      .sort((a, b) => b.count - a.count);

    return { total, byMode, byUser };
  }

  async getUsageHeatmap(days: number = 7): Promise<Array<{hour: number; count: number}>> {
    const cutoffDate = new Date(Date.now() - days * 86400000);
    
    const events = await db.select().from(pageEvents)
      .where(gte(pageEvents.createdAt, cutoffDate));

    const heatmap = new Map<number, number>();
    events.forEach(e => {
      const hour = new Date(e.createdAt).getHours();
      heatmap.set(hour, (heatmap.get(hour) || 0) + 1);
    });

    return Array.from({length: 24}, (_, i) => ({
      hour: i,
      count: heatmap.get(i) || 0,
    }));
  }

  async getAbandonedSubscriptions(): Promise<Array<{userId: string; email: string; lastSeenAt: string}>> {
    const abandonment = new Map<string, {lastSeenAt: Date; email: string}>();
    
    const events = await db.select()
      .from(pageEvents)
      .where(eq(pageEvents.eventType, 'SUBSCRIPTION_PAGE_VISIT'));

    for (const event of events) {
      const user = await this.getUser(event.userId);
      if (user) {
        const existing = abandonment.get(event.userId);
        if (!existing || new Date(event.createdAt) > existing.lastSeenAt) {
          abandonment.set(event.userId, {
            lastSeenAt: new Date(event.createdAt),
            email: user.email,
          });
        }
      }
    }

    return Array.from(abandonment.entries())
      .map(([userId, data]) => ({
        userId,
        email: data.email,
        lastSeenAt: data.lastSeenAt.toISOString(),
      }))
      .sort((a, b) => new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime());
  }

  // Highlights (Cloud Sync)
  async getUserHighlights(userId: string): Promise<Highlight[]> {
    return db.select().from(highlights).where(eq(highlights.userId, userId)).orderBy(desc(highlights.createdAt));
  }

  async getChapterHighlights(userId: string, book: string, chapter: number): Promise<Highlight[]> {
    return db.select().from(highlights).where(
      and(
        eq(highlights.userId, userId),
        eq(highlights.book, book),
        eq(highlights.chapter, chapter)
      )
    );
  }

  async createHighlight(highlight: InsertHighlight): Promise<Highlight> {
    const existing = await db.select().from(highlights).where(
      and(
        eq(highlights.userId, highlight.userId),
        eq(highlights.book, highlight.book),
        eq(highlights.chapter, highlight.chapter),
        eq(highlights.verse, highlight.verse)
      )
    );
    
    if (existing.length > 0) {
      const result = await db.update(highlights)
        .set({ color: highlight.color, updatedAt: new Date() })
        .where(eq(highlights.id, existing[0].id))
        .returning();
      return result[0];
    }
    
    const result = await db.insert(highlights).values(highlight).returning();
    return result[0];
  }

  async updateHighlight(id: string, userId: string, color: string): Promise<Highlight | undefined> {
    const result = await db.update(highlights)
      .set({ color, updatedAt: new Date() })
      .where(and(eq(highlights.id, id), eq(highlights.userId, userId)))
      .returning();
    return result[0];
  }

  async deleteHighlight(id: string, userId: string): Promise<void> {
    await db.delete(highlights).where(and(eq(highlights.id, id), eq(highlights.userId, userId)));
  }

  async deleteVerseHighlight(userId: string, book: string, chapter: number, verse: number): Promise<void> {
    await db.delete(highlights).where(
      and(
        eq(highlights.userId, userId),
        eq(highlights.book, book),
        eq(highlights.chapter, chapter),
        eq(highlights.verse, verse)
      )
    );
  }

  // Reading History (Cloud Sync)
  async getUserReadingHistory(userId: string, limit: number = 50): Promise<ReadingHistory[]> {
    return db.select().from(readingHistory)
      .where(eq(readingHistory.userId, userId))
      .orderBy(desc(readingHistory.readAt))
      .limit(limit);
  }

  async addReadingHistory(history: InsertReadingHistory): Promise<ReadingHistory> {
    const result = await db.insert(readingHistory).values(history).returning();
    return result[0];
  }

  // Sync State
  async getSyncState(userId: string, deviceId: string): Promise<SyncState | undefined> {
    const result = await db.select().from(syncState).where(
      and(
        eq(syncState.userId, userId),
        eq(syncState.deviceId, deviceId)
      )
    );
    return result[0];
  }

  async updateSyncState(userId: string, deviceId: string): Promise<SyncState> {
    const existing = await this.getSyncState(userId, deviceId);
    
    if (existing) {
      const result = await db.update(syncState)
        .set({ 
          lastSyncAt: new Date(),
          syncVersion: sql`${syncState.syncVersion} + 1`
        })
        .where(eq(syncState.id, existing.id))
        .returning();
      return result[0];
    }
    
    const result = await db.insert(syncState).values({
      userId,
      deviceId,
      lastSyncAt: new Date(),
      syncVersion: 1,
    }).returning();
    return result[0];
  }

  async getAllUserData(userId: string): Promise<{
    bookmarks: Bookmark[];
    annotations: Annotation[];
    highlights: Highlight[];
    readingHistory: ReadingHistory[];
    lastSyncAt: Date | null;
  }> {
    const [userBookmarks, userAnnotations, userHighlights, userHistory] = await Promise.all([
      this.getUserBookmarks(userId),
      this.getUserAnnotations(userId),
      this.getUserHighlights(userId),
      this.getUserReadingHistory(userId, 100),
    ]);

    return {
      bookmarks: userBookmarks,
      annotations: userAnnotations,
      highlights: userHighlights,
      readingHistory: userHistory,
      lastSyncAt: new Date(),
    };
  }

  // Guests (anonymous visitors)
  async getGuestByDeviceId(deviceId: string): Promise<Guest | undefined> {
    const result = await db.select().from(guests).where(eq(guests.deviceId, deviceId));
    return result[0];
  }

  async createOrUpdateGuest(deviceId: string, platform: string, locale?: string): Promise<Guest> {
    const existing = await this.getGuestByDeviceId(deviceId);
    
    if (existing) {
      const result = await db.update(guests)
        .set({ 
          lastSeenAt: new Date(),
          totalSessions: sql`${guests.totalSessions} + 1`,
          platform,
          locale: locale || existing.locale,
        })
        .where(eq(guests.deviceId, deviceId))
        .returning();
      return result[0];
    }
    
    const now = new Date();
    const trialEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const result = await db.insert(guests).values({
      deviceId,
      platform,
      locale,
      firstSeenAt: now,
      lastSeenAt: now,
      totalSessions: 1,
      trialStartAt: now,
      trialEndAt: trialEnd,
    }).returning();
    return result[0];
  }

  async updateGuestLastSeen(deviceId: string): Promise<void> {
    await db.update(guests)
      .set({ lastSeenAt: new Date() })
      .where(eq(guests.deviceId, deviceId));
  }

  async linkGuestToUser(deviceId: string, userId: string): Promise<void> {
    await db.update(guests)
      .set({ linkedUserId: userId })
      .where(eq(guests.deviceId, deviceId));
  }

  async isGuestTrialActive(deviceId: string): Promise<boolean> {
    const guest = await this.getGuestByDeviceId(deviceId);
    if (!guest) return true;
    return new Date() < guest.trialEndAt;
  }

  async getGuestTrialInfo(deviceId: string): Promise<{ active: boolean; daysRemaining: number } | null> {
    const guest = await this.getGuestByDeviceId(deviceId);
    if (!guest) return null;
    
    const now = new Date();
    const active = now < guest.trialEndAt;
    const daysRemaining = Math.max(0, Math.ceil((guest.trialEndAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    
    return { active, daysRemaining };
  }

  // Guest AI Usage Limits
  async getGuestTodayUsageCount(deviceId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const result = await db.select()
      .from(guestAiUsageLimits)
      .where(
        and(
          eq(guestAiUsageLimits.deviceId, deviceId),
          gte(guestAiUsageLimits.date, today)
        )
      );
    
    return result[0]?.questionCount || 0;
  }

  async incrementGuestUsageCount(deviceId: string): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existing = await db.select()
      .from(guestAiUsageLimits)
      .where(
        and(
          eq(guestAiUsageLimits.deviceId, deviceId),
          gte(guestAiUsageLimits.date, today)
        )
      );
    
    if (existing[0]) {
      await db.update(guestAiUsageLimits)
        .set({ questionCount: sql`${guestAiUsageLimits.questionCount} + 1` })
        .where(eq(guestAiUsageLimits.id, existing[0].id));
    } else {
      await db.insert(guestAiUsageLimits).values({
        deviceId,
        date: today,
        questionCount: 1,
      });
    }
  }

  // App Events (analytics)
  async trackAppEvent(deviceId: string, eventType: string, eventData?: any, userId?: string): Promise<void> {
    await db.insert(appEvents).values({
      deviceId,
      eventType,
      eventData: eventData || null,
      userId: userId || null,
    });
  }

  // Admin Stats (guests)
  async getGuestStats(): Promise<{
    totalGuests: number;
    guestsInTrial: number;
    trialExpired: number;
    linkedToUsers: number;
  }> {
    const now = new Date();
    
    const [total, inTrial, expired, linked] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(guests),
      db.select({ count: sql<number>`count(*)` }).from(guests).where(gte(guests.trialEndAt, now)),
      db.select({ count: sql<number>`count(*)` }).from(guests).where(sql`${guests.trialEndAt} < ${now}`),
      db.select({ count: sql<number>`count(*)` }).from(guests).where(sql`${guests.linkedUserId} IS NOT NULL`),
    ]);
    
    return {
      totalGuests: Number(total[0]?.count || 0),
      guestsInTrial: Number(inTrial[0]?.count || 0),
      trialExpired: Number(expired[0]?.count || 0),
      linkedToUsers: Number(linked[0]?.count || 0),
    };
  }

  async getEventStats(days: number = 30): Promise<{
    totalEvents: number;
    byType: Record<string, number>;
    uniqueDevices: number;
  }> {
    const since = new Date();
    since.setDate(since.getDate() - days);
    
    const [total, byType, unique] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(appEvents).where(gte(appEvents.createdAt, since)),
      db.select({ 
        eventType: appEvents.eventType, 
        count: sql<number>`count(*)` 
      }).from(appEvents)
        .where(gte(appEvents.createdAt, since))
        .groupBy(appEvents.eventType),
      db.select({ count: sql<number>`count(DISTINCT ${appEvents.deviceId})` }).from(appEvents).where(gte(appEvents.createdAt, since)),
    ]);
    
    const byTypeMap: Record<string, number> = {};
    byType.forEach(row => {
      byTypeMap[row.eventType] = Number(row.count);
    });
    
    return {
      totalEvents: Number(total[0]?.count || 0),
      byType: byTypeMap,
      uniqueDevices: Number(unique[0]?.count || 0),
    };
  }
}

export const storage = new PostgresStorage();
