import { and, desc, eq, gte, inArray, lt, sql } from "drizzle-orm";
import type { MelPosition, MelPreferences, MelStatus } from "@shared/mel";
import {
  bibleVersions,
  bibleVerses,
  melProfiles,
  readingProgress,
  readingHistory,
  studyCompletions,
  studyLessons,
  studyModules,
  studyTracks,
  userDailyReadings,
  userReadingPlans,
  userStudyProgress,
  readingPlanTemplates,
  userBiblePreferences,
} from "@shared/schema";
import { canOpenLesson, type UserPlan } from "@shared/courseAccess";
import { getBookById } from "../bible-data/books";
import { db } from "../db";
import { storage } from "../storage";
import { melDate, calculateMelStreaks, addCalendarDays, melStartOfDayUtc } from "./mel-calendar";

export const DEFAULT_MEL_PREFERENCES: MelPreferences = {
  reminderPeriod: "morning",
  reminderTime: null,
  dailyGoalMinutes: 10,
};

const COMPLETION_TYPES = ["mel_bible_chapter", "mel_devotional", "mel_lesson"] as const;
const dayStart = (day: string) => melStartOfDayUtc(day);
const nextDayStart = (day: string) => melStartOfDayUtc(addCalendarDays(day, 1)).getTime();

export function devotionalPsalmForDate(day: string): number {
  const dayNumber = Math.floor(Date.parse(`${day}T00:00:00.000Z`) / 86_400_000);
  return ((dayNumber % 150) + 150) % 150 + 1;
}

export async function isCanonicalMelDevotionalDate(day: string, todayOnly = false): Promise<boolean> {
  const today = melDate(new Date());
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) ||
    !Number.isFinite(Date.parse(`${day}T00:00:00.000Z`)) ||
    new Date(`${day}T00:00:00.000Z`).toISOString().slice(0, 10) !== day ||
    day > today || (todayOnly && day !== today)) return false;
  const chapter = devotionalPsalmForDate(day);
  const [canonicalPassage] = await db.select({ verse: bibleVerses.verse }).from(bibleVerses).where(and(
    eq(bibleVerses.book, "psa"),
    eq(bibleVerses.chapter, chapter),
    eq(bibleVerses.versionCode, "ACF"),
  )).limit(1);
  return !!canonicalPassage;
}

function isMelPosition(value: unknown): value is MelPosition {
  if (!value || typeof value !== "object") return false;
  const position = value as Record<string, unknown>;
  if (position.kind === "bible") {
    return typeof position.book === "string" && Number.isInteger(position.chapter) &&
      Number.isInteger(position.verse) && typeof position.versionCode === "string";
  }
  if (position.kind === "lesson") {
    return typeof position.lessonId === "string" && typeof position.moduleId === "string" &&
      typeof position.trackLevel === "string" &&
      (position.videoSeconds === undefined || typeof position.videoSeconds === "number");
  }
  return position.kind === "devotional" && typeof position.devotionalDate === "string";
}

async function getAuthorizedLesson(userId: string, lessonId: string) {
  const context = await storage.getLessonWithContext(lessonId);
  if (!context) return null;
  const [progress] = await db.select().from(userStudyProgress).where(and(
    eq(userStudyProgress.userId, userId),
    eq(userStudyProgress.lessonId, lessonId),
  )).limit(1);
  if (!progress) return null;

  const user = await storage.getUser(userId);
  if (!user) return null;
  const [premium, gold, lifetime] = await Promise.all([
    storage.hasActiveSubscription(userId, "premium"),
    storage.hasActiveSubscription(userId, "gold"),
    storage.hasActiveSubscription(userId, "strong_lifetime"),
  ]);
  const plan: UserPlan = premium ? "premium" : (gold || lifetime) ? "gold" : "free";
  const access = canOpenLesson({
    isLoggedIn: true,
    plan,
    courseLevel: context.track.level as "iniciante" | "moderado" | "avancado",
    moduleIndex: context.moduleIndex,
    lessonIndex: context.lessonIndex,
    isAdmin: user.role === "admin" || user.role === "super_admin",
  });
  if (!access.allowed) return null;
  return {
    progress,
    title: context.lesson.title,
    lessonId: context.lesson.id,
    moduleId: context.module.id,
    trackLevel: context.track.level,
  };
}

async function resolvePosition(userId: string, position: unknown): Promise<MelPosition | null> {
  if (!isMelPosition(position)) return null;
  if (position.kind === "lesson") {
    const lesson = await getAuthorizedLesson(userId, position.lessonId);
    if (!lesson || lesson.moduleId !== position.moduleId || lesson.trackLevel !== position.trackLevel) return null;
    return {
      kind: "lesson",
      lessonId: lesson.lessonId,
      moduleId: lesson.moduleId,
      trackLevel: lesson.trackLevel,
      ...(typeof position.videoSeconds === "number" ? { videoSeconds: position.videoSeconds } : {}),
    };
  }
  if (position.kind === "bible") {
    const book = getBookById(position.book);
    if (!book || position.chapter < 1 || position.chapter > book.chapters) return null;
    const [version] = await db.select({ code: bibleVersions.code }).from(bibleVersions)
      .where(and(eq(bibleVersions.code, position.versionCode), eq(bibleVersions.isActive, true))).limit(1);
    if (!version || position.chapter < 1 || position.verse < 1) return null;
    const [verse] = await db.select({ verse: bibleVerses.verse }).from(bibleVerses).where(and(
      eq(bibleVerses.book, position.book),
      eq(bibleVerses.chapter, position.chapter),
      eq(bibleVerses.verse, position.verse),
      eq(bibleVerses.versionCode, position.versionCode),
    )).limit(1);
    if (!verse) return null;
  }
  if (position.kind === "devotional" &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(position.devotionalDate) ||
      !(await isCanonicalMelDevotionalDate(position.devotionalDate)))) return null;
  return position;
}

async function getStoredPosition(userId: string): Promise<MelPosition | null> {
  const [profile] = await db.select().from(melProfiles).where(eq(melProfiles.userId, userId)).limit(1);
  const stored = await resolvePosition(userId, profile?.position);
  if (stored) return stored;

  // Legacy data has no per-chapter access timestamps, so prefer reading history.
  const [recentRead] = await db.select().from(readingHistory)
    .where(eq(readingHistory.userId, userId))
    .orderBy(desc(readingHistory.readAt)).limit(1);
  const [recentReadingProgress] = await db.select().from(readingProgress)
    .where(eq(readingProgress.userId, userId))
    .orderBy(desc(readingProgress.updatedAt)).limit(1);
  const recentCourses = await db.select().from(userStudyProgress)
    .where(eq(userStudyProgress.userId, userId))
    .orderBy(desc(userStudyProgress.lastAccessAt)).limit(50);
  const [recentDevotional] = await db.select().from(studyCompletions)
    .where(and(eq(studyCompletions.userId, userId), eq(studyCompletions.type, "mel_devotional")))
    .orderBy(desc(studyCompletions.completedAt)).limit(1);

  const candidates: { time: number; position: MelPosition }[] = [];
  if (recentRead) {
    const position: MelPosition = {
      kind: "bible", book: recentRead.book, chapter: recentRead.chapter,
      verse: 1, versionCode: recentRead.versionCode,
    };
    if (await resolvePosition(userId, position)) candidates.push({ time: recentRead.readAt.getTime(), position });
  }
  if (recentReadingProgress) {
    const chapters = Array.isArray(recentReadingProgress.chaptersRead)
      ? (recentReadingProgress.chaptersRead as number[]).filter(Number.isInteger)
      : [];
    const latestChapter = Math.max(...chapters);
    if (latestChapter >= 1) {
      const position: MelPosition = {
        kind: "bible",
        book: recentReadingProgress.book,
        chapter: latestChapter,
        verse: 1,
        versionCode: await getUserBibleVersion(userId),
      };
      if (await resolvePosition(userId, position)) candidates.push({
        time: recentReadingProgress.updatedAt.getTime(),
        position,
      });
    }
  }
  for (const recentCourse of recentCourses) {
    const lesson = await getAuthorizedLesson(userId, recentCourse.lessonId);
    if (lesson) candidates.push({
      time: recentCourse.lastAccessAt.getTime(),
      position: { kind: "lesson", lessonId: lesson.lessonId, moduleId: lesson.moduleId, trackLevel: lesson.trackLevel },
    });
    if (lesson) break;
  }
  if (recentDevotional) candidates.push({
    time: recentDevotional.completedAt.getTime(),
    position: { kind: "devotional", devotionalDate: melDate(recentDevotional.completedAt) },
  });
  candidates.sort((a, b) => b.time - a.time);
  return candidates[0]?.position ?? null;
}

export async function saveMelPosition(userId: string, position: MelPosition): Promise<MelPosition> {
  const resolved = await resolvePosition(userId, position);
  if (!resolved) throw new Error("Invalid or inaccessible Mel position");
  const now = new Date();
  await db.insert(melProfiles).values({
    userId,
    position: resolved,
    preferences: DEFAULT_MEL_PREFERENCES,
    updatedAt: now,
  }).onConflictDoUpdate({
    target: melProfiles.userId,
    set: { position: resolved, updatedAt: now },
  });
  return resolved;
}

export async function saveMelLessonPosition(
  userId: string,
  lessonId: string,
  videoSeconds?: number,
): Promise<MelPosition> {
  const lesson = await getAuthorizedLesson(userId, lessonId);
  if (!lesson) throw new Error("Invalid or inaccessible Mel lesson");
  return saveMelPosition(userId, {
    kind: "lesson",
    lessonId: lesson.lessonId,
    moduleId: lesson.moduleId,
    trackLevel: lesson.trackLevel,
    ...(videoSeconds === undefined ? {} : { videoSeconds }),
  });
}

export async function getMelPreferences(userId: string): Promise<MelPreferences> {
  const [profile] = await db.select().from(melProfiles).where(eq(melProfiles.userId, userId)).limit(1);
  const prefs = profile?.preferences as Partial<MelPreferences> | null;
  if (!prefs) return DEFAULT_MEL_PREFERENCES;
  return {
    reminderPeriod: prefs.reminderPeriod ?? DEFAULT_MEL_PREFERENCES.reminderPeriod,
    reminderTime: prefs.reminderTime ?? null,
    dailyGoalMinutes: prefs.dailyGoalMinutes ?? DEFAULT_MEL_PREFERENCES.dailyGoalMinutes,
  };
}

async function getUserBibleVersion(userId: string): Promise<string> {
  const [preferences] = await db.select({ version: userBiblePreferences.lastViewedVersionCode })
    .from(userBiblePreferences).where(eq(userBiblePreferences.userId, userId)).limit(1);
  return preferences?.version ?? "ACF";
}

export async function saveMelPreferences(userId: string, preferences: MelPreferences): Promise<MelPreferences> {
  const now = new Date();
  await db.insert(melProfiles).values({
    userId,
    position: null,
    preferences,
    updatedAt: now,
  }).onConflictDoUpdate({
    target: melProfiles.userId,
    set: { preferences, updatedAt: now },
  });
  return preferences;
}

/** Append at most one qualifying Mel event of a kind per account-local day. */
export async function recordMelActivity(userId: string, type: typeof COMPLETION_TYPES[number]): Promise<void> {
  const now = new Date();
  const today = melDate(now);
  const start = dayStart(today);
  const end = new Date(nextDayStart(today));
  await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${userId}), hashtext(${type}))`);
    const [existing] = await tx.select({ id: studyCompletions.id }).from(studyCompletions).where(and(
      eq(studyCompletions.userId, userId),
      eq(studyCompletions.type, type),
      gte(studyCompletions.completedAt, start),
      lt(studyCompletions.completedAt, end),
    )).limit(1);
    if (!existing) await tx.insert(studyCompletions).values({ userId, type, completedAt: now });
  });
}

async function getActivePlan(userId: string): Promise<MelStatus["activePlan"]> {
  const [plan] = await db.select().from(userReadingPlans).where(and(
    eq(userReadingPlans.userId, userId),
    eq(userReadingPlans.status, "active"),
  )).orderBy(desc(userReadingPlans.updatedAt)).limit(1);
  if (!plan) return null;
  let title = plan.customTitle || "Plano de leitura";
  if (plan.templateId) {
    const [template] = await db.select({ titlePt: readingPlanTemplates.titlePt })
      .from(readingPlanTemplates).where(eq(readingPlanTemplates.id, plan.templateId)).limit(1);
    if (template) title = template.titlePt;
  }
  const readings = await db.select({ isCompleted: userDailyReadings.isCompleted })
    .from(userDailyReadings).where(eq(userDailyReadings.userPlanId, plan.id));
  const percentage = readings.length
    ? Math.round((readings.filter((reading) => reading.isCompleted).length / readings.length) * 100)
    : 0;
  return { title, percentage };
}

export async function getMelStatus(userId: string, now = new Date()): Promise<MelStatus> {
  const today = melDate(now);
  const [events, progress, planReadings, latestCourse, position, activePlan] = await Promise.all([
    db.select({ type: studyCompletions.type, completedAt: studyCompletions.completedAt })
      .from(studyCompletions).where(and(
        eq(studyCompletions.userId, userId),
        inArray(studyCompletions.type, [...COMPLETION_TYPES]),
      )),
    db.select({ completedAt: userStudyProgress.completedAt })
      .from(userStudyProgress).where(and(eq(userStudyProgress.userId, userId), eq(userStudyProgress.completed, true))),
    db.select({ actualDate: userDailyReadings.actualDate })
      .from(userDailyReadings)
      .innerJoin(userReadingPlans, eq(userDailyReadings.userPlanId, userReadingPlans.id))
      .where(and(
        eq(userReadingPlans.userId, userId),
        eq(userDailyReadings.isCompleted, true),
      )),
    db.select({ progress: userStudyProgress, lesson: studyLessons, track: studyTracks, module: studyModules })
      .from(userStudyProgress)
      .innerJoin(studyLessons, eq(userStudyProgress.lessonId, studyLessons.id))
      .innerJoin(studyTracks, eq(studyLessons.trackId, studyTracks.id))
      .innerJoin(studyModules, eq(studyTracks.moduleId, studyModules.id))
      .where(and(
        eq(userStudyProgress.userId, userId),
      ))
      .orderBy(desc(userStudyProgress.lastAccessAt)).limit(50),
    getStoredPosition(userId),
    getActivePlan(userId),
  ]);
  const dates: string[] = [];
  for (const event of events) dates.push(melDate(event.completedAt));
  for (const row of progress) if (row.completedAt) dates.push(melDate(row.completedAt));
  for (const row of planReadings) if (row.actualDate) dates.push(melDate(row.actualDate));
  const streaks = calculateMelStreaks(dates, today);
  let course: MelStatus["course"] = null;
  for (const courseRow of latestCourse) {
    const authorized = await getAuthorizedLesson(userId, courseRow.lesson.id);
    if (authorized) {
      course = {
        title: authorized.title,
        lessonId: authorized.lessonId,
        moduleId: authorized.moduleId,
        trackLevel: authorized.trackLevel,
      };
      break;
    }
  }
  const devotionalReadToday = events.some((event) =>
    event.type === "mel_devotional" && melDate(event.completedAt) === today,
  );
  const completedToday = dates.includes(today);
  const idleDays = streaks.lastActivityDate
    ? Math.floor((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${streaks.lastActivityDate}T00:00:00Z`)) / 86_400_000)
    : Infinity;

  return {
    position,
    streak: streaks.streak,
    bestStreak: streaks.bestStreak,
    completedToday,
    mood: idleDays >= 2 ? "saudade" : completedToday ? "feliz" : "normal",
    lastActivityDate: streaks.lastActivityDate,
    activePlan,
    course,
    devotionalReadToday,
    today,
  };
}

export function getMelDayRange(day: string): { start: Date; end: Date } {
  return { start: dayStart(day), end: new Date(nextDayStart(day)) };
}