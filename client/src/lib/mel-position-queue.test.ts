import { describe, expect, it, vi } from "vitest";
import { createMelPositionSaveQueue } from "./mel-position-queue";

describe("Mel position save queue", () => {
  it("serializes writes for one account and lets the later location win", async () => {
    let currentUser = "user-a";
    let generation = 1;
    const started: string[] = [];
    let releaseFirst!: () => void;
    const firstGate = new Promise<void>((resolve) => { releaseFirst = resolve; });
    const send = vi.fn(async ({ position }: { position: string }) => {
      started.push(position);
      if (position === "reader") await firstGate;
      return position;
    });
    const queue = createMelPositionSaveQueue<string, string>(
      (userId, sessionGeneration) => currentUser === userId && generation === sessionGeneration,
      send,
    );

    const reader = queue.reserve("user-a", 1, "reader")!;
    const readerSave = queue.save(reader);
    await vi.waitFor(() => expect(started).toEqual(["reader"]));
    const lesson = queue.reserve("user-a", 1, "lesson")!;
    const lessonSave = queue.save(lesson);
    expect(started).toEqual(["reader"]);

    releaseFirst();
    await Promise.all([readerSave, lessonSave]);
    expect(started).toEqual(["reader", "lesson"]);
  });

  it("does not flush a stale cleanup ticket after a newer navigation was reserved", async () => {
    const send = vi.fn(async ({ position }: { position: string }) => position);
    const queue = createMelPositionSaveQueue<string, string>(() => true, send);
    const staleReader = queue.reserve("user-a", 1, "old-reader")!;
    const newScreen = queue.reserve("user-a", 1, "new-screen")!;

    await queue.save(staleReader);
    await queue.save(newScreen);

    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith(newScreen);
  });

  it("drops a position ticket when its account session generation changes", async () => {
    let generation = 1;
    const send = vi.fn(async ({ position }: { position: string }) => position);
    const queue = createMelPositionSaveQueue<string, string>(
      (_userId, ticketGeneration) => ticketGeneration === generation,
      send,
    );
    const ticket = queue.reserve("user-a", generation, "old-session")!;
    generation = 2;

    await queue.save(ticket);

    expect(send).not.toHaveBeenCalled();
  });
});