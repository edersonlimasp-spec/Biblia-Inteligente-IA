import type { MelPosition } from "@shared/mel";

export function createMelLessonPosition(
  lessonId: string,
  moduleId: string,
  trackLevel: string,
  videoSeconds?: number,
): Extract<MelPosition, { kind: "lesson" }> {
  return {
    kind: "lesson",
    lessonId,
    moduleId,
    trackLevel,
    ...(videoSeconds !== undefined ? { videoSeconds } : {}),
  };
}

export interface MelVideoElement {
  readyState: number;
  currentTime: number;
}

const HAVE_METADATA = 1;

export function restoreMelVideoOffset(video: MelVideoElement, videoSeconds?: number): boolean {
  if (videoSeconds === undefined) return true;
  if (video.readyState < HAVE_METADATA) return false;
  video.currentTime = videoSeconds;
  return true;
}