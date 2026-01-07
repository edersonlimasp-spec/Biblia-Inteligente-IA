import { db } from "./db";
import { 
  readingPlanTemplates, 
  readingPlanEntries, 
  userReadingPlans, 
  userDailyReadings,
  type ReadingPlanTemplate,
  type ReadingPlanEntry,
  type UserReadingPlan,
  type UserDailyReading,
  type DailyReading,
  type InsertUserReadingPlan,
  type InsertUserDailyReading
} from "@shared/schema";
import { eq, and, gte, lte, desc, asc } from "drizzle-orm";

const BIBLE_BOOKS = [
  { abbr: "gen", name: "Gênesis", chapters: 50, testament: "OT", genre: "law" },
  { abbr: "exo", name: "Êxodo", chapters: 40, testament: "OT", genre: "law" },
  { abbr: "lev", name: "Levítico", chapters: 27, testament: "OT", genre: "law" },
  { abbr: "num", name: "Números", chapters: 36, testament: "OT", genre: "law" },
  { abbr: "deu", name: "Deuteronômio", chapters: 34, testament: "OT", genre: "law" },
  { abbr: "jos", name: "Josué", chapters: 24, testament: "OT", genre: "history" },
  { abbr: "jdg", name: "Juízes", chapters: 21, testament: "OT", genre: "history" },
  { abbr: "rut", name: "Rute", chapters: 4, testament: "OT", genre: "history" },
  { abbr: "1sa", name: "1 Samuel", chapters: 31, testament: "OT", genre: "history" },
  { abbr: "2sa", name: "2 Samuel", chapters: 24, testament: "OT", genre: "history" },
  { abbr: "1ki", name: "1 Reis", chapters: 22, testament: "OT", genre: "history" },
  { abbr: "2ki", name: "2 Reis", chapters: 25, testament: "OT", genre: "history" },
  { abbr: "1ch", name: "1 Crônicas", chapters: 29, testament: "OT", genre: "history" },
  { abbr: "2ch", name: "2 Crônicas", chapters: 36, testament: "OT", genre: "history" },
  { abbr: "ezr", name: "Esdras", chapters: 10, testament: "OT", genre: "history" },
  { abbr: "neh", name: "Neemias", chapters: 13, testament: "OT", genre: "history" },
  { abbr: "est", name: "Ester", chapters: 10, testament: "OT", genre: "history" },
  { abbr: "job", name: "Jó", chapters: 42, testament: "OT", genre: "poetry" },
  { abbr: "psa", name: "Salmos", chapters: 150, testament: "OT", genre: "psalms" },
  { abbr: "pro", name: "Provérbios", chapters: 31, testament: "OT", genre: "poetry" },
  { abbr: "ecc", name: "Eclesiastes", chapters: 12, testament: "OT", genre: "poetry" },
  { abbr: "sng", name: "Cantares", chapters: 8, testament: "OT", genre: "poetry" },
  { abbr: "isa", name: "Isaías", chapters: 66, testament: "OT", genre: "prophets" },
  { abbr: "jer", name: "Jeremias", chapters: 52, testament: "OT", genre: "prophets" },
  { abbr: "lam", name: "Lamentações", chapters: 5, testament: "OT", genre: "prophets" },
  { abbr: "ezk", name: "Ezequiel", chapters: 48, testament: "OT", genre: "prophets" },
  { abbr: "dan", name: "Daniel", chapters: 12, testament: "OT", genre: "prophets" },
  { abbr: "hos", name: "Oséias", chapters: 14, testament: "OT", genre: "prophets" },
  { abbr: "joe", name: "Joel", chapters: 3, testament: "OT", genre: "prophets" },
  { abbr: "amo", name: "Amós", chapters: 9, testament: "OT", genre: "prophets" },
  { abbr: "oba", name: "Obadias", chapters: 1, testament: "OT", genre: "prophets" },
  { abbr: "jon", name: "Jonas", chapters: 4, testament: "OT", genre: "prophets" },
  { abbr: "mic", name: "Miquéias", chapters: 7, testament: "OT", genre: "prophets" },
  { abbr: "nam", name: "Naum", chapters: 3, testament: "OT", genre: "prophets" },
  { abbr: "hab", name: "Habacuque", chapters: 3, testament: "OT", genre: "prophets" },
  { abbr: "zep", name: "Sofonias", chapters: 3, testament: "OT", genre: "prophets" },
  { abbr: "hag", name: "Ageu", chapters: 2, testament: "OT", genre: "prophets" },
  { abbr: "zec", name: "Zacarias", chapters: 14, testament: "OT", genre: "prophets" },
  { abbr: "mal", name: "Malaquias", chapters: 4, testament: "OT", genre: "prophets" },
  { abbr: "mat", name: "Mateus", chapters: 28, testament: "NT", genre: "gospels" },
  { abbr: "mrk", name: "Marcos", chapters: 16, testament: "NT", genre: "gospels" },
  { abbr: "luk", name: "Lucas", chapters: 24, testament: "NT", genre: "gospels" },
  { abbr: "jhn", name: "João", chapters: 21, testament: "NT", genre: "gospels" },
  { abbr: "act", name: "Atos", chapters: 28, testament: "NT", genre: "history" },
  { abbr: "rom", name: "Romanos", chapters: 16, testament: "NT", genre: "epistles" },
  { abbr: "1co", name: "1 Coríntios", chapters: 16, testament: "NT", genre: "epistles" },
  { abbr: "2co", name: "2 Coríntios", chapters: 13, testament: "NT", genre: "epistles" },
  { abbr: "gal", name: "Gálatas", chapters: 6, testament: "NT", genre: "epistles" },
  { abbr: "eph", name: "Efésios", chapters: 6, testament: "NT", genre: "epistles" },
  { abbr: "php", name: "Filipenses", chapters: 4, testament: "NT", genre: "epistles" },
  { abbr: "col", name: "Colossenses", chapters: 4, testament: "NT", genre: "epistles" },
  { abbr: "1th", name: "1 Tessalonicenses", chapters: 5, testament: "NT", genre: "epistles" },
  { abbr: "2th", name: "2 Tessalonicenses", chapters: 3, testament: "NT", genre: "epistles" },
  { abbr: "1ti", name: "1 Timóteo", chapters: 6, testament: "NT", genre: "epistles" },
  { abbr: "2ti", name: "2 Timóteo", chapters: 4, testament: "NT", genre: "epistles" },
  { abbr: "tit", name: "Tito", chapters: 3, testament: "NT", genre: "epistles" },
  { abbr: "phm", name: "Filemom", chapters: 1, testament: "NT", genre: "epistles" },
  { abbr: "heb", name: "Hebreus", chapters: 13, testament: "NT", genre: "epistles" },
  { abbr: "jas", name: "Tiago", chapters: 5, testament: "NT", genre: "epistles" },
  { abbr: "1pe", name: "1 Pedro", chapters: 5, testament: "NT", genre: "epistles" },
  { abbr: "2pe", name: "2 Pedro", chapters: 3, testament: "NT", genre: "epistles" },
  { abbr: "1jn", name: "1 João", chapters: 5, testament: "NT", genre: "epistles" },
  { abbr: "2jn", name: "2 João", chapters: 1, testament: "NT", genre: "epistles" },
  { abbr: "3jn", name: "3 João", chapters: 1, testament: "NT", genre: "epistles" },
  { abbr: "jud", name: "Judas", chapters: 1, testament: "NT", genre: "epistles" },
  { abbr: "rev", name: "Apocalipse", chapters: 22, testament: "NT", genre: "prophets" },
];

export const readingPlanService = {
  async getAllTemplates(filters?: { category?: string; duration?: string }) {
    let query = db.select().from(readingPlanTemplates).where(eq(readingPlanTemplates.isActive, true));
    
    const templates = await db.select()
      .from(readingPlanTemplates)
      .where(eq(readingPlanTemplates.isActive, true))
      .orderBy(asc(readingPlanTemplates.displayOrder));
    
    let result = templates;
    
    if (filters?.category && filters.category !== 'all') {
      result = result.filter(t => t.category === filters.category);
    }
    
    if (filters?.duration) {
      if (filters.duration === 'short') {
        result = result.filter(t => t.durationDays <= 90);
      } else if (filters.duration === 'medium') {
        result = result.filter(t => t.durationDays > 90 && t.durationDays <= 365);
      } else if (filters.duration === 'long') {
        result = result.filter(t => t.durationDays > 365);
      }
    }
    
    return result;
  },

  async getTemplateBySlug(slug: string) {
    const [template] = await db.select()
      .from(readingPlanTemplates)
      .where(eq(readingPlanTemplates.slug, slug))
      .limit(1);
    return template;
  },

  async getTemplateById(id: string) {
    const [template] = await db.select()
      .from(readingPlanTemplates)
      .where(eq(readingPlanTemplates.id, id))
      .limit(1);
    return template;
  },

  generateCanonicalReadings(durationDays: number, pace: number, weekdaysOnly: boolean, testament?: 'OT' | 'NT' | 'both'): DailyReading[][] {
    const books = testament === 'OT' 
      ? BIBLE_BOOKS.filter(b => b.testament === 'OT')
      : testament === 'NT' 
        ? BIBLE_BOOKS.filter(b => b.testament === 'NT')
        : BIBLE_BOOKS;
    
    const allChapters: { book: string; chapter: number }[] = [];
    for (const book of books) {
      for (let ch = 1; ch <= book.chapters; ch++) {
        allChapters.push({ book: book.abbr, chapter: ch });
      }
    }
    
    const totalChapters = allChapters.length;
    const effectiveDays = weekdaysOnly ? Math.floor(durationDays * 5 / 7) : durationDays;
    const adjustedPace = Math.ceil(totalChapters / effectiveDays);
    const actualPace = Math.max(pace, adjustedPace);
    
    const dailyReadings: DailyReading[][] = [];
    let chapterIndex = 0;
    
    for (let day = 0; day < durationDays && chapterIndex < totalChapters; day++) {
      const dayReadings: DailyReading[] = [];
      
      for (let i = 0; i < actualPace && chapterIndex < totalChapters; i++) {
        const ch = allChapters[chapterIndex];
        const lastReading = dayReadings[dayReadings.length - 1];
        
        if (lastReading && lastReading.book === ch.book && 
            lastReading.endChapter === ch.chapter - 1) {
          lastReading.endChapter = ch.chapter;
        } else if (lastReading && lastReading.book === ch.book && 
                   lastReading.startChapter === ch.chapter - 1 && !lastReading.endChapter) {
          lastReading.endChapter = ch.chapter;
        } else {
          dayReadings.push({
            book: ch.book,
            startChapter: ch.chapter,
          });
        }
        
        chapterIndex++;
      }
      
      if (dayReadings.length > 0) {
        dailyReadings.push(dayReadings);
      }
    }
    
    return dailyReadings;
  },

  async createUserPlan(
    userId: string | null,
    deviceId: string | null,
    templateId: string,
    startDate?: Date
  ): Promise<UserReadingPlan> {
    const template = await this.getTemplateById(templateId);
    if (!template) {
      throw new Error('Template not found');
    }
    
    const start = startDate || new Date();
    const targetEnd = new Date(start);
    targetEnd.setDate(targetEnd.getDate() + template.durationDays);
    
    const [userPlan] = await db.insert(userReadingPlans).values({
      userId,
      deviceId,
      templateId,
      startDate: start,
      targetEndDate: targetEnd,
      status: 'active',
      currentDay: 1,
      completedDays: 0,
      streakDays: 0,
      longestStreak: 0,
      allowAutoCatchup: true,
      notificationsEnabled: true,
      notificationTime: '08:00',
    }).returning();
    
    const testament = template.category === 'new-testament' ? 'NT' 
      : template.category === 'old-testament' ? 'OT' 
      : 'both';
    
    const dailyReadings = this.generateCanonicalReadings(
      template.durationDays,
      template.defaultPace,
      template.weekdaysOnly,
      testament as 'OT' | 'NT' | 'both'
    );
    
    const dailyReadingsToInsert: InsertUserDailyReading[] = dailyReadings.map((readings, index) => {
      const scheduledDate = new Date(start);
      scheduledDate.setDate(scheduledDate.getDate() + index);
      
      return {
        userPlanId: userPlan.id,
        dayIndex: index + 1,
        scheduledDate,
        readings,
        completionPercent: 0,
        isCompleted: false,
        isSkipped: false,
        wasAutoShifted: false,
      };
    });
    
    if (dailyReadingsToInsert.length > 0) {
      for (let i = 0; i < dailyReadingsToInsert.length; i += 100) {
        const batch = dailyReadingsToInsert.slice(i, i + 100);
        await db.insert(userDailyReadings).values(batch);
      }
    }
    
    return userPlan;
  },

  async getUserPlans(userId: string | null, deviceId: string | null, status?: string) {
    const conditions = [];
    
    if (userId) {
      conditions.push(eq(userReadingPlans.userId, userId));
    } else if (deviceId) {
      conditions.push(eq(userReadingPlans.deviceId, deviceId));
    } else {
      return [];
    }
    
    if (status) {
      conditions.push(eq(userReadingPlans.status, status));
    }
    
    const plans = await db.select()
      .from(userReadingPlans)
      .where(and(...conditions))
      .orderBy(desc(userReadingPlans.createdAt));
    
    const plansWithTemplates = await Promise.all(
      plans.map(async (plan) => {
        let template = null;
        if (plan.templateId) {
          template = await this.getTemplateById(plan.templateId);
        }
        return { ...plan, template };
      })
    );
    
    return plansWithTemplates;
  },

  async getUserPlanById(planId: string) {
    const [plan] = await db.select()
      .from(userReadingPlans)
      .where(eq(userReadingPlans.id, planId))
      .limit(1);
    
    if (!plan) return null;
    
    let template = null;
    if (plan.templateId) {
      template = await this.getTemplateById(plan.templateId);
    }
    
    return { ...plan, template };
  },

  async getTodaysReading(planId: string) {
    const plan = await this.getUserPlanById(planId);
    if (!plan) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [todayReading] = await db.select()
      .from(userDailyReadings)
      .where(
        and(
          eq(userDailyReadings.userPlanId, planId),
          eq(userDailyReadings.dayIndex, plan.currentDay)
        )
      )
      .limit(1);
    
    return todayReading;
  },

  async getUpcomingReadings(planId: string, days: number = 7) {
    const plan = await this.getUserPlanById(planId);
    if (!plan) return [];
    
    const readings = await db.select()
      .from(userDailyReadings)
      .where(
        and(
          eq(userDailyReadings.userPlanId, planId),
          gte(userDailyReadings.dayIndex, plan.currentDay),
          lte(userDailyReadings.dayIndex, plan.currentDay + days)
        )
      )
      .orderBy(asc(userDailyReadings.dayIndex));
    
    return readings;
  },

  async getOverdueReadings(planId: string) {
    const plan = await this.getUserPlanById(planId);
    if (!plan) return [];
    
    const readings = await db.select()
      .from(userDailyReadings)
      .where(
        and(
          eq(userDailyReadings.userPlanId, planId),
          eq(userDailyReadings.isCompleted, false),
          lte(userDailyReadings.dayIndex, plan.currentDay - 1)
        )
      )
      .orderBy(asc(userDailyReadings.dayIndex));
    
    return readings;
  },

  async markReadingComplete(
    planId: string,
    dayIndex: number,
    completedReadings?: { book: string; chapter: number }[]
  ) {
    const plan = await this.getUserPlanById(planId);
    if (!plan) throw new Error('Plan not found');
    
    const [reading] = await db.select()
      .from(userDailyReadings)
      .where(
        and(
          eq(userDailyReadings.userPlanId, planId),
          eq(userDailyReadings.dayIndex, dayIndex)
        )
      )
      .limit(1);
    
    if (!reading) throw new Error('Reading not found');
    
    const now = new Date();
    const completed = completedReadings?.map(r => ({
      ...r,
      completedAt: now.toISOString()
    })) || [];
    
    const totalReadings = reading.readings.reduce((sum, r) => {
      const chapters = r.endChapter ? (r.endChapter - r.startChapter + 1) : 1;
      return sum + chapters;
    }, 0);
    
    const completionPercent = Math.round((completed.length / totalReadings) * 100);
    const isCompleted = completionPercent >= 100;
    
    await db.update(userDailyReadings)
      .set({
        completedReadings: completed,
        completionPercent,
        isCompleted,
        actualDate: isCompleted ? now : null,
        updatedAt: now,
      })
      .where(eq(userDailyReadings.id, reading.id));
    
    if (isCompleted) {
      const newCompletedDays = plan.completedDays + 1;
      const newCurrentDay = Math.max(plan.currentDay, dayIndex + 1);
      
      let newStreakDays = plan.streakDays;
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (plan.lastReadDate) {
        const lastRead = new Date(plan.lastReadDate);
        lastRead.setHours(0, 0, 0, 0);
        yesterday.setHours(0, 0, 0, 0);
        
        if (lastRead.getTime() === yesterday.getTime()) {
          newStreakDays++;
        } else if (lastRead.getTime() !== now.setHours(0, 0, 0, 0)) {
          newStreakDays = 1;
        }
      } else {
        newStreakDays = 1;
      }
      
      const newLongestStreak = Math.max(plan.longestStreak, newStreakDays);
      
      await db.update(userReadingPlans)
        .set({
          completedDays: newCompletedDays,
          currentDay: newCurrentDay,
          lastReadDate: now,
          streakDays: newStreakDays,
          longestStreak: newLongestStreak,
          updatedAt: now,
        })
        .where(eq(userReadingPlans.id, planId));
    }
    
    return { isCompleted, completionPercent };
  },

  async updatePlanStatus(planId: string, status: 'active' | 'paused' | 'completed' | 'abandoned') {
    const now = new Date();
    
    await db.update(userReadingPlans)
      .set({
        status,
        actualEndDate: status === 'completed' ? now : null,
        updatedAt: now,
      })
      .where(eq(userReadingPlans.id, planId));
  },

  async updateNotificationSettings(
    planId: string,
    enabled: boolean,
    time?: string
  ) {
    const updates: Partial<UserReadingPlan> = {
      notificationsEnabled: enabled,
      updatedAt: new Date(),
    };
    
    if (time) {
      updates.notificationTime = time;
    }
    
    await db.update(userReadingPlans)
      .set(updates)
      .where(eq(userReadingPlans.id, planId));
  },

  async deletePlan(planId: string) {
    await db.delete(userReadingPlans).where(eq(userReadingPlans.id, planId));
  },

  getBookInfo(abbr: string) {
    return BIBLE_BOOKS.find(b => b.abbr === abbr);
  },

  getAllBooks() {
    return BIBLE_BOOKS;
  }
};
