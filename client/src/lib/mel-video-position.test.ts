import { describe, expect, it } from "vitest";
import { createMelLessonPosition, restoreMelVideoOffset } from "./mel-video-position";

describe("Mel lesson video resume", () => {
  it("preserves the saved offset in the initial lesson position", () => {
    expect(createMelLessonPosition("lesson-1", "module-2", "moderado", 47)).toEqual({
      kind: "lesson",
      lessonId: "lesson-1",
      moduleId: "module-2",
      trackLevel: "moderado",
      videoSeconds: 47,
    });
  });

  it("waits for metadata before restoring the saved offset", () => {
    const video = { readyState: 0, currentTime: 0 };
    expect(restoreMelVideoOffset(video, 47)).toBe(false);
    expect(video.currentTime).toBe(0);

    video.readyState = 1;
    expect(restoreMelVideoOffset(video, 47)).toBe(true);
    expect(video.currentTime).toBe(47);
  });
});