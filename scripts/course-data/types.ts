export interface LessonData {
  id: string;
  title: string;
  content: string;
  references: string;
  questions: string;
  application: string;
  summary: string;
  estimatedMinutes: number;
  order: number;
}

export interface TrackData {
  id: string;
  level: "iniciante" | "moderado" | "avancado";
  name: string;
  description: string;
  requiredPlan: string;
  order: number;
  lessons: LessonData[];
}

export interface ModuleData {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  order: number;
  tracks: TrackData[];
}
