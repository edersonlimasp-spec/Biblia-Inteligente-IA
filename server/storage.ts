import { db } from './db';
import { users, subscriptions, bookmarks, annotations, aiHistory, aiUsageLimits, passwordResetTokens, adminActions, bonuses, userSessions, pageEvents, highlights, syncState, readingHistory, guests, appEvents, guestAiUsageLimits, readingProgress, achievements, studyModules, studyTracks, studyLessons, userStudyProgress, freeAiQuota, freeStrongQuota, guestStrongQuota, campaignLogs, paymentReceipts } from '@shared/schema';
import type { FreeStrongQuota, GuestStrongQuota, PaymentReceipt, InsertPaymentReceipt } from '@shared/schema';
import { getBookById } from './bible-data/books';
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
  StudyModule,
  InsertStudyModule,
  StudyTrack,
  InsertStudyTrack,
  StudyLesson,
  InsertStudyLesson,
  UserStudyProgress,
  InsertUserStudyProgress,
  FreeAiQuota,
  CampaignLog,
  InsertCampaignLog,
} from '@shared/schema';
import { eq, and, desc, gte, sql, like, or } from 'drizzle-orm';

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAdminUsers(): Promise<User[]>;
  makeUserAdmin(userId: string): Promise<void>;
  updateUserPassword(userId: string, hashedPassword: string): Promise<void>;
  updateUser(userId: string, data: Partial<{ profileImageUrl: string | null; firstName: string | null; lastName: string | null; googleId: string | null }>): Promise<void>;
  updateUserLanguage(userId: string, language: string): Promise<void>;
  createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<void>;
  getPasswordResetToken(token: string): Promise<{userId: string; expiresAt: Date; used: boolean} | undefined>;
  markResetTokenAsUsed(token: string): Promise<void>;

  // Subscriptions
  getUserSubscriptions(userId: string): Promise<Subscription[]>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  upsertSubscription(subscription: InsertSubscription): Promise<Subscription>;
  hasActiveSubscription(userId: string, planType: string): Promise<boolean>;
  getActiveSubscription(userId: string): Promise<Subscription | null>;

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
  getTodayStrongLookups(userId: string): Promise<number>;
  incrementStrongLookups(userId: string): Promise<void>;

  // Admin Operations
  getAllUsers(searchEmail?: string, limit?: number, offset?: number): Promise<{ users: User[], total: number }>;
  updateUserRole(userId: string, role: string): Promise<void>;
  blockUser(userId: string): Promise<void>;
  unblockUser(userId: string): Promise<void>;
  updateUserLastLogin(userId: string): Promise<void>;

  // Bonuses
  createBonus(bonus: InsertBonus): Promise<Bonus>;
  getUserBonuses(userId: string): Promise<Bonus[]>;
  hasActiveBonus(userId: string, bonusType?: string): Promise<boolean>;
  revokeBonus(bonusId: string): Promise<void>;
  deleteBonus(bonusId: string): Promise<void>;
  getActiveBonuses(): Promise<Bonus[]>;
  getBonusesWithEmail(searchEmail?: string, includeExpired?: boolean): Promise<Array<Bonus & { userEmail: string; userName: string | null; daysRemaining: number | null }>>;
  renewBonus(bonusId: string, extraDays: number): Promise<Bonus>;

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
  getConversionMetrics(): Promise<{
    today: { redirects: number; conversions: number; rate: number };
    thisMonth: { redirects: number; conversions: number; rate: number };
    lastMonth: { redirects: number; conversions: number; rate: number };
    dailyTrend: Array<{ date: string; redirects: number; conversions: number }>;
  }>;

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
  getGuestTodayStrongLookups(deviceId: string): Promise<number>;
  incrementGuestStrongLookups(deviceId: string): Promise<void>;

  // App Events (analytics)
  trackAppEvent(deviceId: string, eventType: string, eventData?: any, userId?: string): Promise<void>;
  
  // Admin Stats (guests)
  getGuestStats(): Promise<{
    totalGuests: number;
    guestsInTrial: number;
    trialExpired: number;
    linkedToUsers: number;
    newGuestsToday: number;
    activeGuestsToday: number;
  }>;
  getEventStats(days?: number): Promise<{
    totalEvents: number;
    byType: Record<string, number>;
    uniqueDevices: number;
  }>;

  // Study Modules (Professor Premium)
  getStudyModules(): Promise<StudyModule[]>;
  getStudyModuleById(id: string): Promise<StudyModule | undefined>;
  getModuleTracks(moduleId: string): Promise<StudyTrack[]>;
  getTrackLessons(trackId: string): Promise<StudyLesson[]>;
  getLessonById(id: string): Promise<StudyLesson | undefined>;
  getLessonWithContext(id: string): Promise<{ lesson: StudyLesson; track: StudyTrack; module: StudyModule; lessonIndex: number; moduleIndex: number } | undefined>;
  getUserStudyProgress(userId: string | null, deviceId: string | null): Promise<UserStudyProgress[]>;
  updateStudyProgress(userId: string | null, deviceId: string | null, lessonId: string, completed: boolean): Promise<UserStudyProgress>;
  getModuleProgress(moduleId: string, userId: string | null, deviceId: string | null): Promise<{ total: number; completed: number; percentage: number }>;
  createStudyModule(module: InsertStudyModule): Promise<StudyModule>;
  createStudyTrack(track: InsertStudyTrack): Promise<StudyTrack>;
  createStudyLesson(lesson: InsertStudyLesson): Promise<StudyLesson>;

  // Free AI Questions Quota (permanent, not daily reset)
  getFreeAiQuota(userId: string): Promise<{ questionsUsed: number; guestQuestionsImported: number } | undefined>;
  incrementFreeAiQuota(userId: string): Promise<number>;
  migrateGuestQuotaToUser(userId: string, guestQuestionsUsed: number): Promise<void>;
  
  // Strong Dictionary Quota (permanent, not daily reset)
  // Guest: 2 total, Free User: 4 total (incl. migrated), Gold: 20/day, Premium: unlimited
  getFreeStrongQuota(userId: string): Promise<{ lookupsUsed: number; guestLookupsImported: number } | undefined>;
  incrementFreeStrongQuota(userId: string): Promise<number>;
  migrateGuestStrongQuotaToUser(userId: string, guestLookupsUsed: number): Promise<void>;
  getGuestStrongQuota(deviceId: string): Promise<number>;
  incrementGuestStrongQuota(deviceId: string): Promise<number>;

  // User Activity & Re-engagement Campaigns
  updateUserLastSeen(userId: string, platform?: string): Promise<void>;
  setUserEmailOptOut(userId: string, optOut: boolean): Promise<void>;
  getInactiveUsers(daysInactive: number): Promise<Array<{ id: string; email: string; name: string | null; lastSeenAt: Date | null }>>;
  hasReceivedCampaign(userId: string, campaignName: string, withinDays: number): Promise<boolean>;
  logCampaign(log: InsertCampaignLog): Promise<CampaignLog>;
  getCampaignLogs(campaignName?: string, limit?: number): Promise<CampaignLog[]>;
  getCampaignStats(campaignName: string): Promise<{ total: number; sent: number; failed: number }>;

  // Payment Receipts (validation and logging)
  createPaymentReceipt(receipt: InsertPaymentReceipt): Promise<PaymentReceipt>;
  getPaymentReceiptByExternalId(externalPaymentId: string): Promise<PaymentReceipt | undefined>;
  getPaymentReceiptById(id: string): Promise<PaymentReceipt | undefined>;
  updatePaymentReceipt(id: string, data: Partial<InsertPaymentReceipt>): Promise<PaymentReceipt | undefined>;
  getPaymentReceipts(options?: { 
    userId?: string; 
    status?: string; 
    planType?: string;
    limit?: number; 
    offset?: number;
  }): Promise<{ receipts: PaymentReceipt[]; total: number }>;
  getPaymentReceiptStats(): Promise<{
    totalReceipts: number;
    totalGrossAmount: number;
    totalNetAmount: number;
    totalFees: number;
    byPlan: Record<string, { count: number; grossAmount: number; netAmount: number }>;
    byStatus: Record<string, number>;
    last30Days: { count: number; grossAmount: number; netAmount: number };
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

    const usersList = (await query) as User[];
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

  async updateUser(userId: string, data: Partial<{ profileImageUrl: string | null; firstName: string | null; lastName: string | null; googleId: string | null }>): Promise<void> {
    await db.update(users).set({ ...data, updatedAt: new Date() }).where(eq(users.id, userId));
  }

  async updateUserLanguage(userId: string, language: string): Promise<void> {
    await db.update(users).set({ preferredLanguage: language, updatedAt: new Date() }).where(eq(users.id, userId));
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

  async upsertSubscription(subscription: InsertSubscription): Promise<Subscription> {
    // Check if user already has a subscription for this plan type
    const existing = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, subscription.userId),
          eq(subscriptions.planType, subscription.planType)
        )
      )
      .limit(1);
    
    if (existing.length > 0) {
      // Update existing subscription
      const updated = await db
        .update(subscriptions)
        .set({
          status: subscription.status || 'active',
          startDate: subscription.startDate || new Date(),
          endDate: subscription.endDate,
          amount: subscription.amount,
        })
        .where(eq(subscriptions.id, existing[0].id))
        .returning();
      console.log(`[Storage] Updated existing subscription: ${updated[0].id}`);
      return updated[0];
    }
    
    // Create new subscription
    const result = await db.insert(subscriptions).values(subscription).returning();
    console.log(`[Storage] Created new subscription: ${result[0].id}`);
    return result[0];
  }

  async hasActiveSubscription(userId: string, planType: string): Promise<boolean> {
    const now = new Date();
    
    // Check regular subscriptions - accept all valid active statuses from Mercado Pago
    // Status can be: active, approved, authorized, ACTIVE, APPROVED, AUTHORIZED
    const subResult = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.planType, planType),
          or(
            eq(subscriptions.status, 'active'),
            eq(subscriptions.status, 'Active'),
            eq(subscriptions.status, 'ACTIVE'),
            eq(subscriptions.status, 'approved'),
            eq(subscriptions.status, 'Approved'),
            eq(subscriptions.status, 'APPROVED'),
            eq(subscriptions.status, 'authorized'),
            eq(subscriptions.status, 'Authorized'),
            eq(subscriptions.status, 'AUTHORIZED')
          )
        )
      );
    
    // Only return true if subscription hasn't expired
    for (const sub of subResult) {
      // If no endDate (lifetime), always active
      if (!sub.endDate) return true;
      // If endDate exists and is in the future, it's active
      if (new Date(sub.endDate) > now) return true;
    }

    // Check active bonuses
    const bonusType = planType === 'gold' ? 'gold_free' : planType === 'premium' ? 'premium_free' : null;
    if (bonusType) {
      const bonusResult = await db
        .select()
        .from(bonuses)
        .where(
          and(
            eq(bonuses.userId, userId),
            eq(bonuses.bonusType, bonusType),
            eq(bonuses.isActive, true)
          )
        );
      // Check if bonus is still valid (not expired)
      for (const bonus of bonusResult) {
        if (!bonus.endAt || new Date(bonus.endAt) > now) {
          return true;
        }
      }
    }

    return false;
  }

  async getActiveSubscription(userId: string): Promise<Subscription | null> {
    const now = new Date();
    
    // Get all subscriptions for user, ordered by most recent
    const userSubs = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          or(
            eq(subscriptions.status, 'active'),
            eq(subscriptions.status, 'Active'),
            eq(subscriptions.status, 'ACTIVE'),
            eq(subscriptions.status, 'approved'),
            eq(subscriptions.status, 'Approved'),
            eq(subscriptions.status, 'APPROVED'),
            eq(subscriptions.status, 'authorized'),
            eq(subscriptions.status, 'Authorized'),
            eq(subscriptions.status, 'AUTHORIZED')
          )
        )
      )
      .orderBy(desc(subscriptions.createdAt));
    
    // Find the first active (non-expired) subscription
    for (const sub of userSubs) {
      // If no endDate (lifetime), it's active
      if (!sub.endDate) return sub;
      // If endDate is in the future, it's active
      if (new Date(sub.endDate) > now) return sub;
    }
    
    return null;
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

  async getTodayStrongLookups(userId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await db
      .select()
      .from(aiUsageLimits)
      .where(
        and(
          eq(aiUsageLimits.userId, userId),
          gte(aiUsageLimits.date, today)
        )
      );

    return result[0]?.strongLookups || 0;
  }

  async incrementStrongLookups(userId: string): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

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
      await db
        .update(aiUsageLimits)
        .set({ strongLookups: sql`${aiUsageLimits.strongLookups} + 1` })
        .where(eq(aiUsageLimits.id, existing[0].id));
    } else {
      await db.insert(aiUsageLimits).values({
        userId,
        date: today,
        questionCount: 0,
        strongLookups: 1,
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

  async hasActiveBonus(userId: string, bonusType?: string): Promise<boolean> {
    const now = new Date();
    
    // Query for active bonuses that have started and haven't expired
    const conditions = [
      eq(bonuses.userId, userId),
      eq(bonuses.isActive, true),
      sql`${bonuses.startAt} <= ${now}`,
      sql`(${bonuses.endAt} IS NULL OR ${bonuses.endAt} > ${now})`
    ];
    
    if (bonusType) {
      conditions.push(eq(bonuses.bonusType, bonusType));
    }
    
    const result = await db.select().from(bonuses)
      .where(and(...conditions))
      .limit(1);
    
    return result.length > 0;
  }

  async revokeBonus(bonusId: string): Promise<void> {
    await db.update(bonuses).set({ isActive: false }).where(eq(bonuses.id, bonusId));
  }

  async deleteBonus(bonusId: string): Promise<void> {
    await db.delete(bonuses).where(eq(bonuses.id, bonusId));
  }

  async getActiveBonuses(): Promise<Bonus[]> {
    return db.select().from(bonuses).where(eq(bonuses.isActive, true)).orderBy(desc(bonuses.createdAt));
  }

  async getBonusesWithEmail(searchEmail?: string, includeExpired?: boolean): Promise<Array<Bonus & { userEmail: string; userName: string | null; daysRemaining: number | null }>> {
    const now = new Date();
    
    // Build query with join to users table
    let conditions: any[] = [];
    
    if (!includeExpired) {
      conditions.push(eq(bonuses.isActive, true));
    }
    
    if (searchEmail && searchEmail.trim()) {
      conditions.push(sql`LOWER(${users.email}) LIKE LOWER(${'%' + searchEmail.trim() + '%'})`);
    }
    
    // Build the query
    const baseQuery = db
      .select({
        id: bonuses.id,
        userId: bonuses.userId,
        bonusType: bonuses.bonusType,
        reason: bonuses.reason,
        isActive: bonuses.isActive,
        startAt: bonuses.startAt,
        endAt: bonuses.endAt,
        grantedByAdminId: bonuses.grantedByAdminId,
        createdAt: bonuses.createdAt,
        userEmail: users.email,
        userName: users.name,
      })
      .from(bonuses)
      .innerJoin(users, eq(bonuses.userId, users.id));
    
    // Apply conditions only if there are any
    const results = conditions.length > 0
      ? await baseQuery.where(and(...conditions)).orderBy(desc(bonuses.createdAt))
      : await baseQuery.orderBy(desc(bonuses.createdAt));
    
    // Calculate days remaining for each bonus
    return results.map(bonus => {
      let daysRemaining: number | null = null;
      if (bonus.endAt) {
        const diffMs = new Date(bonus.endAt).getTime() - now.getTime();
        daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      }
      return {
        ...bonus,
        daysRemaining,
      };
    });
  }

  async renewBonus(bonusId: string, extraDays: number): Promise<Bonus> {
    // Get the current bonus
    const [currentBonus] = await db.select().from(bonuses).where(eq(bonuses.id, bonusId));
    
    if (!currentBonus) {
      throw new Error('Bônus não encontrado');
    }
    
    // For lifetime bonuses, don't modify endAt
    if (currentBonus.endAt === null) {
      throw new Error('Bônus vitalício não pode ser renovado');
    }
    
    // Calculate new end date: use max(existing endAt, now) as base
    // This ensures expired bonuses start from now, not from past date
    const now = new Date();
    const existingEndAt = new Date(currentBonus.endAt);
    const baseDate = existingEndAt > now ? existingEndAt : now;
    const newEndAt = new Date(baseDate.getTime() + extraDays * 24 * 60 * 60 * 1000);
    
    // Update the bonus
    const [updated] = await db
      .update(bonuses)
      .set({ 
        endAt: newEndAt,
        isActive: true, // Reactivate if it was deactivated
      })
      .where(eq(bonuses.id, bonusId))
      .returning();
    
    return updated;
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
    
    // Count registered users with active sessions
    const registeredUserResult = await db.select({ count: sql<number>`count(distinct ${userSessions.userId})` })
      .from(userSessions)
      .where(gte(userSessions.lastActivityAt, cutoffTime));
    
    // Count active guests in the last N minutes
    const guestResult = await db.select({ count: sql<number>`count(distinct ${guests.deviceId})` })
      .from(guests)
      .where(gte(guests.lastSeenAt, cutoffTime));
    
    const registeredCount = registeredUserResult[0]?.count || 0;
    const guestCount = guestResult[0]?.count || 0;
    
    return registeredCount + guestCount;
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
    
    // Get AI events from logged-in users (pageEvents table)
    const userAIEvents = await db.select().from(pageEvents)
      .where(and(
        eq(pageEvents.eventType, 'AI_QUESTION'),
        gte(pageEvents.createdAt, cutoffDate)
      ));

    // Get AI events from guests (appEvents table) - they use 'ia_question' event type
    const guestAIEvents = await db.select().from(appEvents)
      .where(and(
        eq(appEvents.eventType, 'ia_question'),
        gte(appEvents.createdAt, cutoffDate)
      ));

    // Combine both sources
    const total = userAIEvents.length + guestAIEvents.length;
    
    const byMode = {
      essential: userAIEvents.filter(e => (e.eventData as any)?.mode === 'essential').length + 
                 guestAIEvents.filter(e => (e.eventData as any)?.mode === 'essential').length,
      premium: userAIEvents.filter(e => {
        const mode = (e.eventData as any)?.mode;
        return mode === 'premium' || mode === 'pregador' || mode === 'exegese' || mode === 'teologica';
      }).length,
    };

    // Count by user (only logged-in users)
    const userMap = new Map<string, number>();
    userAIEvents.forEach(e => {
      if (e.userId) {
        userMap.set(e.userId, (userMap.get(e.userId) || 0) + 1);
      }
    });

    const byUser = Array.from(userMap.entries())
      .map(([userId, count]) => ({ userId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

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

  async getConversionMetrics(): Promise<{
    today: { redirects: number; conversions: number; rate: number };
    thisMonth: { redirects: number; conversions: number; rate: number };
    lastMonth: { redirects: number; conversions: number; rate: number };
    dailyTrend: Array<{ date: string; redirects: number; conversions: number }>;
  }> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const redirectEvents = ['SUBSCRIPTION_PAGE_VISIT', 'subscribe_cta_click', 'subscription_redirect'];
    const conversionEvents = ['subscription_activated', 'SUBSCRIPTION_ACTIVATED', 'payment_success'];

    const allPageEvents = await db.select().from(pageEvents)
      .where(gte(pageEvents.createdAt, lastMonthStart));
    
    const allAppEvents = await db.select().from(appEvents)
      .where(gte(appEvents.createdAt, lastMonthStart));

    const countEvents = (events: any[], types: string[], start: Date, end: Date) => {
      return events.filter(e => 
        types.includes(e.eventType) && 
        new Date(e.createdAt) >= start && 
        new Date(e.createdAt) <= end
      ).length;
    };

    const countUniqueRedirects = (pageEvts: any[], appEvts: any[], start: Date, end: Date) => {
      const pageCount = countEvents(pageEvts, redirectEvents, start, end);
      const appCount = countEvents(appEvts, redirectEvents, start, end);
      return pageCount + appCount;
    };

    const countConversions = (pageEvts: any[], appEvts: any[], start: Date, end: Date) => {
      const pageCount = countEvents(pageEvts, conversionEvents, start, end);
      const appCount = countEvents(appEvts, conversionEvents, start, end);
      return pageCount + appCount;
    };

    const calcRate = (redirects: number, conversions: number) => {
      return redirects > 0 ? Math.round((conversions / redirects) * 10000) / 100 : 0;
    };

    const todayRedirects = countUniqueRedirects(allPageEvents, allAppEvents, todayStart, now);
    const todayConversions = countConversions(allPageEvents, allAppEvents, todayStart, now);

    const monthRedirects = countUniqueRedirects(allPageEvents, allAppEvents, monthStart, now);
    const monthConversions = countConversions(allPageEvents, allAppEvents, monthStart, now);

    const lastMonthRedirects = countUniqueRedirects(allPageEvents, allAppEvents, lastMonthStart, lastMonthEnd);
    const lastMonthConversions = countConversions(allPageEvents, allAppEvents, lastMonthStart, lastMonthEnd);

    const dailyTrend: Array<{ date: string; redirects: number; conversions: number }> = [];
    for (let i = 29; i >= 0; i--) {
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
      const redirects = countUniqueRedirects(allPageEvents, allAppEvents, dayStart, dayEnd);
      const conversions = countConversions(allPageEvents, allAppEvents, dayStart, dayEnd);
      dailyTrend.push({
        date: dayStart.toISOString().split('T')[0],
        redirects,
        conversions,
      });
    }

    return {
      today: { redirects: todayRedirects, conversions: todayConversions, rate: calcRate(todayRedirects, todayConversions) },
      thisMonth: { redirects: monthRedirects, conversions: monthConversions, rate: calcRate(monthRedirects, monthConversions) },
      lastMonth: { redirects: lastMonthRedirects, conversions: lastMonthConversions, rate: calcRate(lastMonthRedirects, lastMonthConversions) },
      dailyTrend,
    };
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

  async getGuestTodayStrongLookups(deviceId: string): Promise<number> {
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
    
    return result[0]?.strongLookups || 0;
  }

  async incrementGuestStrongLookups(deviceId: string): Promise<void> {
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
        .set({ strongLookups: sql`${guestAiUsageLimits.strongLookups} + 1` })
        .where(eq(guestAiUsageLimits.id, existing[0].id));
    } else {
      await db.insert(guestAiUsageLimits).values({
        deviceId,
        date: today,
        questionCount: 0,
        strongLookups: 1,
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

  async getDashboardStats() {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newUsers,
      activeGold,
      activePremium,
      lifetimeStrong,
      cancelled,
      guestStats,
      inactiveUsers
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(users),
      db.select({ count: sql<number>`count(*)` }).from(users).where(gte(users.trialStartDate, firstDayOfMonth)),
      db.select({ count: sql<number>`count(*)` }).from(subscriptions).where(and(eq(subscriptions.planType, 'gold'), eq(subscriptions.status, 'active'), gte(subscriptions.endDate, now))),
      db.select({ count: sql<number>`count(*)` }).from(subscriptions).where(and(eq(subscriptions.planType, 'premium'), eq(subscriptions.status, 'active'), gte(subscriptions.endDate, now))),
      db.select({ count: sql<number>`count(*)` }).from(subscriptions).where(and(eq(subscriptions.planType, 'strong_lifetime'), eq(subscriptions.status, 'active'))),
      db.select({ count: sql<number>`count(*)` }).from(subscriptions).where(and(eq(subscriptions.status, 'cancelled'), gte(subscriptions.createdAt, firstDayOfMonth))),
      this.getGuestStats(),
      db.select({ count: sql<number>`count(*)` }).from(users).where(sql`${users.lastLoginAt} < ${thirtyDaysAgo} OR ${users.lastLoginAt} IS NULL`),
    ]);

    // Calcular faturamento estimado
    // Gold: R$ 9.90, Premium: R$ 19.90, Lifetime: R$ 49.90
    const goldCount = Number(activeGold[0]?.count || 0);
    const premiumCount = Number(activePremium[0]?.count || 0);
    const lifetimeCount = Number(lifetimeStrong[0]?.count || 0);
    
    const revenue = (goldCount * 9.90) + (premiumCount * 19.90) + (lifetimeCount * 49.90);

    return {
      totalUsers: Number(totalUsers[0]?.count || 0),
      newUsersThisMonth: Number(newUsers[0]?.count || 0),
      activeTrials: Number(totalUsers[0]?.count || 0), // Simplificado: todos os usuários novos/ativos estão em trial se não assinaram
      activeGoldSubscriptions: goldCount,
      activePremiumSubscriptions: premiumCount,
      lifetimeStrong: lifetimeCount,
      estimatedMonthlyRevenue: revenue.toFixed(2),
      cancelledThisMonth: Number(cancelled[0]?.count || 0),
      totalGuests: guestStats.totalGuests,
      activeGuestTrials: guestStats.guestsInTrial,
      convertedGuests: guestStats.linkedToUsers,
      inactiveUsers: Number(inactiveUsers[0]?.count || 0)
    };
  }

  async getGuestStats(): Promise<{
    totalGuests: number;
    guestsInTrial: number;
    trialExpired: number;
    linkedToUsers: number;
    newGuestsToday: number;
    activeGuestsToday: number;
  }> {
    const now = new Date();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const [total, inTrial, expired, linked, newToday, activeToday] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(guests),
      db.select({ count: sql<number>`count(*)` }).from(guests).where(gte(guests.trialEndAt, now)),
      db.select({ count: sql<number>`count(*)` }).from(guests).where(sql`${guests.trialEndAt} < ${now}`),
      db.select({ count: sql<number>`count(*)` }).from(guests).where(sql`${guests.linkedUserId} IS NOT NULL`),
      db.select({ count: sql<number>`count(*)` }).from(guests).where(gte(guests.firstSeenAt, todayStart)),
      db.select({ count: sql<number>`count(*)` }).from(guests).where(gte(guests.lastSeenAt, todayStart)),
    ]);
    
    return {
      totalGuests: Number(total[0]?.count || 0),
      guestsInTrial: Number(inTrial[0]?.count || 0),
      trialExpired: Number(expired[0]?.count || 0),
      linkedToUsers: Number(linked[0]?.count || 0),
      newGuestsToday: Number(newToday[0]?.count || 0),
      activeGuestsToday: Number(activeToday[0]?.count || 0),
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

  async getReadingProgress(userId?: string, deviceId?: string) {
    if (!userId && !deviceId) return [];
    
    const conditions = [];
    if (userId) conditions.push(eq(readingProgress.userId, userId));
    else if (deviceId) conditions.push(eq(readingProgress.deviceId, deviceId));
    
    const rows = await db.select().from(readingProgress).where(conditions[0]);
    
    return rows.map(row => ({
      book: row.book,
      chaptersRead: (row.chaptersRead as number[]) || [],
      totalChapters: row.totalChapters,
      completedAt: row.completedAt,
    }));
  }

  async trackChapterRead(userId: string | undefined, deviceId: string | undefined, book: string, chapter: number) {
    if (!userId && !deviceId) return;
    
    // Get actual chapter count for this book
    const bookData = getBookById(book);
    const totalChapters = bookData?.chapters || 50; // Fallback to 50 if book not found
    
    const conditions = [eq(readingProgress.book, book)];
    if (userId) conditions.push(eq(readingProgress.userId, userId));
    else if (deviceId) conditions.push(eq(readingProgress.deviceId, deviceId!));
    
    const existing = await db.select().from(readingProgress).where(and(...conditions)).limit(1);
    
    if (existing.length === 0) {
      await db.insert(readingProgress).values({
        userId: userId || null,
        deviceId: deviceId || null,
        book,
        chaptersRead: [chapter],
        totalChapters,
        updatedAt: new Date(),
      });
    } else {
      const currentChapters = (existing[0].chaptersRead as number[]) || [];
      const needsChapterUpdate = !currentChapters.includes(chapter);
      const needsTotalFix = existing[0].totalChapters !== totalChapters;
      
      if (needsChapterUpdate || needsTotalFix) {
        const updatedChapters = needsChapterUpdate 
          ? [...currentChapters, chapter].sort((a, b) => a - b) 
          : currentChapters;
        await db.update(readingProgress)
          .set({ 
            chaptersRead: updatedChapters,
            totalChapters, // Fix incorrect totalChapters in existing records
            updatedAt: new Date(),
            completedAt: updatedChapters.length >= totalChapters ? new Date() : null,
          })
          .where(eq(readingProgress.id, existing[0].id));
      }
    }
  }

  async getAchievements(userId?: string, deviceId?: string) {
    if (!userId && !deviceId) return [];
    
    const conditions = [];
    if (userId) conditions.push(eq(achievements.userId, userId));
    else if (deviceId) conditions.push(eq(achievements.deviceId, deviceId));
    
    return db.select().from(achievements).where(conditions[0]).orderBy(desc(achievements.unlockedAt));
  }

  // Study Modules (Professor Premium)
  async getStudyModules(): Promise<StudyModule[]> {
    return db.select().from(studyModules).where(eq(studyModules.isActive, true)).orderBy(studyModules.order);
  }

  async getStudyModuleById(id: string): Promise<StudyModule | undefined> {
    const result = await db.select().from(studyModules).where(eq(studyModules.id, id));
    return result[0];
  }

  async getModuleTracks(moduleId: string): Promise<StudyTrack[]> {
    return db.select().from(studyTracks).where(eq(studyTracks.moduleId, moduleId)).orderBy(studyTracks.order);
  }

  async getTrackLessons(trackId: string): Promise<StudyLesson[]> {
    return db.select().from(studyLessons).where(eq(studyLessons.trackId, trackId)).orderBy(studyLessons.order);
  }

  async getLessonById(id: string): Promise<StudyLesson | undefined> {
    const result = await db.select().from(studyLessons).where(eq(studyLessons.id, id));
    return result[0];
  }

  async getLessonWithContext(id: string): Promise<{ lesson: StudyLesson; track: StudyTrack; module: StudyModule; lessonIndex: number; moduleIndex: number } | undefined> {
    const lesson = await this.getLessonById(id);
    if (!lesson) return undefined;
    
    const trackResult = await db.select().from(studyTracks).where(eq(studyTracks.id, lesson.trackId));
    const track = trackResult[0];
    if (!track) return undefined;
    
    const moduleResult = await db.select().from(studyModules).where(eq(studyModules.id, track.moduleId));
    const module = moduleResult[0];
    if (!module) return undefined;
    
    const allLessons = await this.getTrackLessons(track.id);
    const lessonIndex = allLessons.findIndex(l => l.id === id) + 1;
    
    const allModulesInLevel = await db.select()
      .from(studyModules)
      .where(eq(studyModules.level, module.level))
      .orderBy(studyModules.order);
    const moduleIndex = allModulesInLevel.findIndex(m => m.id === module.id) + 1;
    
    return { lesson, track, module, lessonIndex, moduleIndex };
  }

  async getUserStudyProgress(userId: string | null, deviceId: string | null): Promise<UserStudyProgress[]> {
    if (!userId && !deviceId) return [];
    
    const conditions = [];
    if (userId) conditions.push(eq(userStudyProgress.userId, userId));
    else if (deviceId) conditions.push(eq(userStudyProgress.deviceId, deviceId));
    
    return db.select().from(userStudyProgress).where(conditions[0]);
  }

  async updateStudyProgress(userId: string | null, deviceId: string | null, lessonId: string, completed: boolean): Promise<UserStudyProgress> {
    const conditions = [eq(userStudyProgress.lessonId, lessonId)];
    if (userId) conditions.push(eq(userStudyProgress.userId, userId));
    else if (deviceId) conditions.push(eq(userStudyProgress.deviceId, deviceId!));
    
    const existing = await db.select().from(userStudyProgress).where(and(...conditions)).limit(1);
    
    if (existing.length > 0) {
      const [updated] = await db.update(userStudyProgress)
        .set({ 
          completed, 
          completedAt: completed ? new Date() : null,
          lastAccessAt: new Date() 
        })
        .where(eq(userStudyProgress.id, existing[0].id))
        .returning();
      return updated as UserStudyProgress;
    } else {
      const [created] = await db.insert(userStudyProgress).values({
        userId: userId || null,
        deviceId: deviceId || null,
        lessonId,
        completed,
        completedAt: completed ? new Date() : null,
        lastAccessAt: new Date(),
      }).returning();
      return created as UserStudyProgress;
    }
  }

  async getModuleProgress(moduleId: string, userId: string | null, deviceId: string | null): Promise<{ total: number; completed: number; percentage: number }> {
    const tracks = await this.getModuleTracks(moduleId);
    const trackIds = tracks.map(t => t.id);
    
    if (trackIds.length === 0) return { total: 0, completed: 0, percentage: 0 };
    
    const lessons = await db.select().from(studyLessons).where(sql`${studyLessons.trackId} IN (${sql.join(trackIds.map(id => sql`${id}`), sql`, `)})`);
    const total = lessons.length;
    
    if (total === 0) return { total: 0, completed: 0, percentage: 0 };
    
    // Se não há usuário/dispositivo, retorna apenas o total (sem progresso)
    if (!userId && !deviceId) {
      return { total, completed: 0, percentage: 0 };
    }
    
    const lessonIds = lessons.map(l => l.id);
    const conditions = [sql`${userStudyProgress.lessonId} IN (${sql.join(lessonIds.map(id => sql`${id}`), sql`, `)})`];
    if (userId) conditions.push(eq(userStudyProgress.userId, userId));
    else if (deviceId) conditions.push(eq(userStudyProgress.deviceId, deviceId));
    
    const progress = await db.select().from(userStudyProgress).where(and(...conditions));
    const completed = progress.filter(p => p.completed).length;
    
    return { 
      total, 
      completed, 
      percentage: Math.round((completed / total) * 100) 
    };
  }

  async createStudyModule(module: InsertStudyModule): Promise<StudyModule> {
    const [created] = await db.insert(studyModules).values(module).returning();
    return created;
  }

  async createStudyTrack(track: InsertStudyTrack): Promise<StudyTrack> {
    const [created] = await db.insert(studyTracks).values(track).returning();
    return created;
  }

  async createStudyLesson(lesson: InsertStudyLesson): Promise<StudyLesson> {
    const [created] = await db.insert(studyLessons).values(lesson).returning();
    return created;
  }

  // Free AI Questions Quota (permanent count, not daily reset)
  async getFreeAiQuota(userId: string): Promise<{ questionsUsed: number; guestQuestionsImported: number } | undefined> {
    const result = await db.select().from(freeAiQuota).where(eq(freeAiQuota.userId, userId));
    if (result.length === 0) return undefined;
    return {
      questionsUsed: result[0].questionsUsed,
      guestQuestionsImported: result[0].guestQuestionsImported,
    };
  }

  async incrementFreeAiQuota(userId: string): Promise<number> {
    const existing = await db.select().from(freeAiQuota).where(eq(freeAiQuota.userId, userId));
    
    if (existing.length === 0) {
      const [created] = await db.insert(freeAiQuota).values({
        userId,
        questionsUsed: 1,
        guestQuestionsImported: 0,
      }).returning();
      return created.questionsUsed;
    }
    
    const [updated] = await db.update(freeAiQuota)
      .set({ 
        questionsUsed: existing[0].questionsUsed + 1,
        updatedAt: new Date(),
      })
      .where(eq(freeAiQuota.userId, userId))
      .returning();
    return updated.questionsUsed;
  }

  async migrateGuestQuotaToUser(userId: string, guestQuestionsUsed: number): Promise<void> {
    const existing = await db.select().from(freeAiQuota).where(eq(freeAiQuota.userId, userId));
    
    if (existing.length === 0) {
      await db.insert(freeAiQuota).values({
        userId,
        questionsUsed: guestQuestionsUsed,
        guestQuestionsImported: guestQuestionsUsed,
      });
    } else if (existing[0].guestQuestionsImported === 0) {
      await db.update(freeAiQuota)
        .set({ 
          questionsUsed: existing[0].questionsUsed + guestQuestionsUsed,
          guestQuestionsImported: guestQuestionsUsed,
          updatedAt: new Date(),
        })
        .where(eq(freeAiQuota.userId, userId));
    }
  }

  // Strong Dictionary Quota (permanent count, not daily reset)
  async getFreeStrongQuota(userId: string): Promise<{ lookupsUsed: number; guestLookupsImported: number } | undefined> {
    const result = await db.select().from(freeStrongQuota).where(eq(freeStrongQuota.userId, userId));
    if (result.length === 0) return undefined;
    return {
      lookupsUsed: result[0].lookupsUsed,
      guestLookupsImported: result[0].guestLookupsImported,
    };
  }

  async incrementFreeStrongQuota(userId: string): Promise<number> {
    const existing = await db.select().from(freeStrongQuota).where(eq(freeStrongQuota.userId, userId));
    
    if (existing.length === 0) {
      const [created] = await db.insert(freeStrongQuota).values({
        userId,
        lookupsUsed: 1,
        guestLookupsImported: 0,
      }).returning();
      return created.lookupsUsed;
    }
    
    const [updated] = await db.update(freeStrongQuota)
      .set({ 
        lookupsUsed: existing[0].lookupsUsed + 1,
        updatedAt: new Date(),
      })
      .where(eq(freeStrongQuota.userId, userId))
      .returning();
    return updated.lookupsUsed;
  }

  async migrateGuestStrongQuotaToUser(userId: string, guestLookupsUsed: number): Promise<void> {
    const existing = await db.select().from(freeStrongQuota).where(eq(freeStrongQuota.userId, userId));
    
    if (existing.length === 0) {
      await db.insert(freeStrongQuota).values({
        userId,
        lookupsUsed: guestLookupsUsed,
        guestLookupsImported: guestLookupsUsed,
      });
    } else if (existing[0].guestLookupsImported === 0) {
      await db.update(freeStrongQuota)
        .set({ 
          lookupsUsed: existing[0].lookupsUsed + guestLookupsUsed,
          guestLookupsImported: guestLookupsUsed,
          updatedAt: new Date(),
        })
        .where(eq(freeStrongQuota.userId, userId));
    }
  }

  async getGuestStrongQuota(deviceId: string): Promise<number> {
    const result = await db.select().from(guestStrongQuota).where(eq(guestStrongQuota.deviceId, deviceId));
    return result.length > 0 ? result[0].lookupsUsed : 0;
  }

  async incrementGuestStrongQuota(deviceId: string): Promise<number> {
    const existing = await db.select().from(guestStrongQuota).where(eq(guestStrongQuota.deviceId, deviceId));
    
    if (existing.length === 0) {
      const [created] = await db.insert(guestStrongQuota).values({
        deviceId,
        lookupsUsed: 1,
      }).returning();
      return created.lookupsUsed;
    }
    
    const [updated] = await db.update(guestStrongQuota)
      .set({ 
        lookupsUsed: existing[0].lookupsUsed + 1,
        updatedAt: new Date(),
      })
      .where(eq(guestStrongQuota.deviceId, deviceId))
      .returning();
    return updated.lookupsUsed;
  }

  // User Activity & Re-engagement Campaigns
  async updateUserLastSeen(userId: string, platform: string = 'web'): Promise<void> {
    await db.update(users)
      .set({ 
        lastSeenAt: new Date(),
        lastSeenPlatform: platform,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async setUserEmailOptOut(userId: string, optOut: boolean): Promise<void> {
    await db.update(users)
      .set({ 
        emailOptOut: optOut,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async getInactiveUsers(daysInactive: number): Promise<Array<{ id: string; email: string; name: string | null; lastSeenAt: Date | null }>> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysInactive);

    const result = await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      lastSeenAt: users.lastSeenAt,
    })
    .from(users)
    .where(
      and(
        or(
          sql`${users.lastSeenAt} <= ${cutoffDate}`,
          sql`${users.lastSeenAt} IS NULL`
        ),
        sql`${users.email} IS NOT NULL`,
        eq(users.isBlocked, false),
        eq(users.emailOptOut, false)
      )
    );

    return result.filter(u => u.email !== null) as Array<{ id: string; email: string; name: string | null; lastSeenAt: Date | null }>;
  }

  async hasReceivedCampaign(userId: string, campaignName: string, withinDays: number): Promise<boolean> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - withinDays);

    const result = await db.select()
      .from(campaignLogs)
      .where(
        and(
          eq(campaignLogs.userId, userId),
          eq(campaignLogs.campaignName, campaignName),
          gte(campaignLogs.sentAt, cutoffDate)
        )
      )
      .limit(1);

    return result.length > 0;
  }

  async logCampaign(log: InsertCampaignLog): Promise<CampaignLog> {
    const [result] = await db.insert(campaignLogs).values(log).returning();
    return result;
  }

  async getCampaignLogs(campaignName?: string, limit: number = 100): Promise<CampaignLog[]> {
    let query = db.select().from(campaignLogs);
    
    if (campaignName) {
      query = query.where(eq(campaignLogs.campaignName, campaignName)) as any;
    }
    
    return query.orderBy(desc(campaignLogs.sentAt)).limit(limit);
  }

  async getCampaignStats(campaignName: string): Promise<{ total: number; sent: number; failed: number }> {
    const logs = await db.select()
      .from(campaignLogs)
      .where(eq(campaignLogs.campaignName, campaignName));

    return {
      total: logs.length,
      sent: logs.filter(l => l.status === 'sent').length,
      failed: logs.filter(l => l.status === 'failed').length,
    };
  }

  // Payment Receipts (validation and logging)
  async createPaymentReceipt(receipt: InsertPaymentReceipt): Promise<PaymentReceipt> {
    const [result] = await db.insert(paymentReceipts).values(receipt).returning();
    return result;
  }

  async getPaymentReceiptByExternalId(externalPaymentId: string): Promise<PaymentReceipt | undefined> {
    const result = await db.select()
      .from(paymentReceipts)
      .where(eq(paymentReceipts.externalPaymentId, externalPaymentId))
      .limit(1);
    return result[0];
  }

  async getPaymentReceiptById(id: string): Promise<PaymentReceipt | undefined> {
    const result = await db.select()
      .from(paymentReceipts)
      .where(eq(paymentReceipts.id, id))
      .limit(1);
    return result[0];
  }

  async updatePaymentReceipt(id: string, data: Partial<InsertPaymentReceipt>): Promise<PaymentReceipt | undefined> {
    const [result] = await db.update(paymentReceipts)
      .set(data)
      .where(eq(paymentReceipts.id, id))
      .returning();
    return result;
  }

  async getPaymentReceipts(options?: { 
    userId?: string; 
    status?: string; 
    planType?: string;
    limit?: number; 
    offset?: number;
  }): Promise<{ receipts: PaymentReceipt[]; total: number }> {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    let conditions: any[] = [];
    if (options?.userId) {
      conditions.push(eq(paymentReceipts.userId, options.userId));
    }
    if (options?.status) {
      conditions.push(eq(paymentReceipts.status, options.status));
    }
    if (options?.planType) {
      conditions.push(eq(paymentReceipts.planType, options.planType));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [receipts, countResult] = await Promise.all([
      whereClause
        ? db.select().from(paymentReceipts).where(whereClause).orderBy(desc(paymentReceipts.paymentDate)).limit(limit).offset(offset)
        : db.select().from(paymentReceipts).orderBy(desc(paymentReceipts.paymentDate)).limit(limit).offset(offset),
      whereClause
        ? db.select({ count: sql<number>`count(*)::int` }).from(paymentReceipts).where(whereClause)
        : db.select({ count: sql<number>`count(*)::int` }).from(paymentReceipts),
    ]);

    return {
      receipts,
      total: countResult[0]?.count || 0,
    };
  }

  async getPaymentReceiptStats(): Promise<{
    totalReceipts: number;
    totalGrossAmount: number;
    totalNetAmount: number;
    totalFees: number;
    byPlan: Record<string, { count: number; grossAmount: number; netAmount: number }>;
    byStatus: Record<string, number>;
    last30Days: { count: number; grossAmount: number; netAmount: number };
  }> {
    const allReceipts = await db.select().from(paymentReceipts);
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const byPlan: Record<string, { count: number; grossAmount: number; netAmount: number }> = {};
    const byStatus: Record<string, number> = {};
    let totalGrossAmount = 0;
    let totalNetAmount = 0;
    let totalFees = 0;
    let last30Count = 0;
    let last30Gross = 0;
    let last30Net = 0;

    for (const receipt of allReceipts) {
      totalGrossAmount += receipt.grossAmount;
      totalNetAmount += receipt.netAmount;
      totalFees += (receipt.feeAmount || 0) + (receipt.taxAmount || 0);

      // By plan
      if (!byPlan[receipt.planType]) {
        byPlan[receipt.planType] = { count: 0, grossAmount: 0, netAmount: 0 };
      }
      byPlan[receipt.planType].count++;
      byPlan[receipt.planType].grossAmount += receipt.grossAmount;
      byPlan[receipt.planType].netAmount += receipt.netAmount;

      // By status
      byStatus[receipt.status] = (byStatus[receipt.status] || 0) + 1;

      // Last 30 days
      if (receipt.paymentDate >= thirtyDaysAgo) {
        last30Count++;
        last30Gross += receipt.grossAmount;
        last30Net += receipt.netAmount;
      }
    }

    return {
      totalReceipts: allReceipts.length,
      totalGrossAmount,
      totalNetAmount,
      totalFees,
      byPlan,
      byStatus,
      last30Days: {
        count: last30Count,
        grossAmount: last30Gross,
        netAmount: last30Net,
      },
    };
  }
}

export const storage = new PostgresStorage();
