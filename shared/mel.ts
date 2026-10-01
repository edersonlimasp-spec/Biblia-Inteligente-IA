export type MelPosition =
  | {
      kind: "bible";
      book: string;
      chapter: number;
      verse: number;
      versionCode: string;
    }
  | {
      kind: "lesson";
      lessonId: string;
      moduleId: string;
      trackLevel: string;
      videoSeconds?: number;
    }
  | {
      kind: "devotional";
      devotionalDate: string;
    };

export type MelPreferences = {
  reminderPeriod: "morning" | "afternoon" | "evening" | "exact";
  reminderTime: string | null;
  dailyGoalMinutes: 5 | 10 | 15;
};

export type MelStatus = {
  position: MelPosition | null;
  streak: number;
  bestStreak: number;
  completedToday: boolean;
  mood: "normal" | "feliz" | "saudade";
  lastActivityDate: string | null;
  activePlan: { title: string; percentage: number } | null;
  course: { title: string; lessonId: string; moduleId: string; trackLevel: string } | null;
  devotionalReadToday: boolean;
  today: string;
};