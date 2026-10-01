import { afterEach, describe, expect, it } from "vitest";
import {
  publishMelPushAction,
  publishMelPushMessage,
  subscribeToMelPushDestination,
  subscribeToMelPushMessage,
  type MelPushMessage,
} from "@/lib/mel-push";

const bibleDestination = {
  kind: "bible" as const,
  book: "jhn",
  chapter: 3,
  verse: 16,
  versionCode: "ACF",
};

const unsubscribers: Array<() => void> = [];

afterEach(() => {
  while (unsubscribers.length) unsubscribers.pop()?.();
});

describe("Mel push navigation", () => {
  it("opens the valid destination only for the user named in the payload", () => {
    const destinations: unknown[] = [];
    unsubscribers.push(
      subscribeToMelPushDestination("user-a", (destination) => destinations.push(destination)),
    );

    publishMelPushAction("user-a", {
      userId: "user-a",
      destination: JSON.stringify(bibleDestination),
    });
    publishMelPushAction("user-a", {
      userId: "user-b",
      destination: bibleDestination,
    });

    expect(destinations).toEqual([bibleDestination]);
  });

  it("rejects malformed and external navigation targets", () => {
    const destinations: unknown[] = [];
    unsubscribers.push(
      subscribeToMelPushDestination("user-a", (destination) => destinations.push(destination)),
    );

    publishMelPushAction("user-a", { userId: "user-a", destination: "https://example.com" });
    publishMelPushAction("user-a", {
      userId: "user-a",
      destination: { kind: "bible", book: "João", chapter: 0, verse: 16 },
    });
    publishMelPushAction("user-a", {
      userId: "user-a",
      destination: { kind: "devotional", devotionalDate: "2025-02-30" },
    });

    expect(destinations).toEqual([]);
  });

  it("keeps a cold-start destination queued only for its original signed-in account", () => {
    publishMelPushAction("user-a", { userId: "user-a", destination: bibleDestination });

    const otherUserDestinations: unknown[] = [];
    unsubscribers.push(
      subscribeToMelPushDestination("user-b", (destination) => otherUserDestinations.push(destination)),
    );
    expect(otherUserDestinations).toEqual([]);

    const originalUserDestinations: unknown[] = [];
    unsubscribers.push(
      subscribeToMelPushDestination("user-a", (destination) => originalUserDestinations.push(destination)),
    );
    expect(originalUserDestinations).toEqual([bibleDestination]);
  });
});

describe("Mel push messages", () => {
  it("only publishes a foreground notice to the matching authenticated user", () => {
    const messages: MelPushMessage[] = [];
    unsubscribers.push(
      subscribeToMelPushMessage("user-a", (message) => messages.push(message)),
    );

    publishMelPushMessage("user-a", {
      title: "Um recado da Mel",
      body: "A Mel separou João 3:16 para você.",
      data: { userId: "user-a", destination: JSON.stringify(bibleDestination) },
    });
    publishMelPushMessage("user-a", {
      title: "Recado incorreto",
      body: "Este recado pertence a outra conta.",
      data: { userId: "user-b", destination: JSON.stringify(bibleDestination) },
    });

    expect(messages).toHaveLength(1);
    expect(messages[0].destination).toEqual(bibleDestination);
  });
});