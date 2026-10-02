// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import {
  buildMelReminder,
  buildDevotionalReminder,
  claimMelReminderForDay,
  getMelReminderMinute,
  isPushConfigured,
  isInvalidFcmTokenError,
  isMelReminderDue,
  schedulerSecretIsValid,
  shouldSkipCompletedMelReminder,
} from "./push";
import type { MelStatus } from "@shared/mel";
import { db } from "../db";

vi.mock("../db", () => ({ db: {} }));
vi.mock("../storage", () => ({ storage: {} }));
vi.mock("./mel", () => ({ getMelPreferences: vi.fn(), getMelStatus: vi.fn() }));

describe("native push reminder behavior", () => {
  it("opens today's routine with its title and real Bible verse preview", () => {
    const payload = buildDevotionalReminder({
      date: "2026-10-02", routine: "noite", title: "Descansar no cuidado do Pastor",
      verse: { book: "psa", chapter: 4, verse: 8, endVerse: null, reference: "Salmos 4:8",
        versionCode: "ACF", text: "Texto obtido do banco bíblico" },
    });
    expect(payload.title).toBe("Boa Noite com Deus");
    expect(payload.body).toContain("Salmos 4:8");
    expect(payload.body).toContain("Texto obtido do banco bíblico");
    expect(payload.destination).toEqual({ kind: "devotional", devotionalDate: "2026-10-02" });
  });
  it("maps configured reminder periods to Sao Paulo local time", () => {
    const prefs = (reminderPeriod: "morning" | "afternoon" | "evening" | "exact", reminderTime: string | null = null) => ({
      reminderPeriod,
      reminderTime,
    });
    expect(getMelReminderMinute(prefs("morning"))).toBe(420);
    expect(getMelReminderMinute(prefs("afternoon"))).toBe(840);
    expect(getMelReminderMinute(prefs("evening"))).toBe(1140);
    expect(getMelReminderMinute(prefs("exact", "09:35"))).toBe(575);
    expect(getMelReminderMinute(prefs("exact", "25:00"))).toBeNull();
  });

  it("catches a quarter-hour reminder window in the Sao Paulo timezone", () => {
    const morning = { reminderPeriod: "morning" as const, reminderTime: null };
    expect(isMelReminderDue(morning, new Date("2026-06-01T10:00:00.000Z"))).toBe(true);
    expect(isMelReminderDue(morning, new Date("2026-06-01T10:14:00.000Z"))).toBe(true);
    expect(isMelReminderDue(morning, new Date("2026-06-01T10:15:00.000Z"))).toBe(false);
    expect(isMelReminderDue(morning, new Date("2026-06-01T17:00:00.000Z"))).toBe(false);
    expect(isMelReminderDue(
      { reminderPeriod: "exact", reminderTime: "09:07" },
      new Date("2026-06-01T12:14:00.000Z"),
    )).toBe(true);
  });

  it("uses the saved Mel position and keeps the message gentle", () => {
    const status: MelStatus = {
      position: { kind: "bible", book: "jhn", chapter: 3, verse: 16, versionCode: "ACF" },
      streak: 3,
      bestStreak: 3,
      completedToday: false,
      mood: "normal",
      lastActivityDate: "2026-05-31",
      activePlan: null,
      course: null,
      devotionalReadToday: false,
      today: "2026-06-01",
    };
    const message = buildMelReminder(status);
    expect(message.destination).toEqual({
      kind: "bible", book: "jhn", chapter: 3, verse: 16, versionCode: "ACF",
    });
    expect(message.body).toContain("João 3");
    expect(message.body).not.toMatch(/ensino|obrigatóri/i);
  });

  it("targets a safe daily devotional and softly mentions a streak at risk", () => {
    const message = buildMelReminder({
      position: null,
      streak: 2,
      lastActivityDate: "2026-05-30",
      today: "2026-06-01",
    });
    expect(message.destination).toEqual({ kind: "devotional", devotionalDate: "2026-06-01" });
    expect(message.body).toContain("2 dias");
  });

  it("skips users who have already completed today's activity", () => {
    expect(shouldSkipCompletedMelReminder({ completedToday: true })).toBe(true);
    expect(shouldSkipCompletedMelReminder({ completedToday: false })).toBe(false);
  });

  it("uses the durable user/day unique claim to suppress duplicate sends", async () => {
    const rows = [{ userId: "canonical-user" }];
    const insert = vi.fn(() => ({
      values: vi.fn(() => ({
        onConflictDoNothing: vi.fn(() => ({
          returning: vi.fn(async () => rows),
        })),
      })),
    }));
    (db as any).insert = insert;
    expect(await claimMelReminderForDay("canonical-user", "2026-06-01")).toBe(true);
    rows.length = 0;
    expect(await claimMelReminderForDay("canonical-user", "2026-06-01")).toBe(false);
    expect(insert).toHaveBeenCalledTimes(2);
  });

  it("removes only FCM errors that prove a token is invalid or expired", () => {
    expect(isInvalidFcmTokenError({ code: "messaging/registration-token-not-registered" })).toBe(true);
    expect(isInvalidFcmTokenError({ code: "messaging/invalid-registration-token" })).toBe(true);
    expect(isInvalidFcmTokenError({ code: "messaging/invalid-argument" })).toBe(false);
  });

  it("checks the external scheduler secret without accepting missing values", () => {
    expect(schedulerSecretIsValid(undefined, "secret")).toBe(false);
    expect(schedulerSecretIsValid("wrong", "secret")).toBe(false);
    expect(schedulerSecretIsValid("secret", "secret")).toBe(true);
  });

  it("silently disables configured push when the service-account secret is absent", () => {
    const previous = process.env.FIREBASE_SERVICE_ACCOUNT;
    delete process.env.FIREBASE_SERVICE_ACCOUNT;
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(isPushConfigured()).toBe(false);
    expect(isPushConfigured()).toBe(false);
    expect(warning).toHaveBeenCalledTimes(1);
    warning.mockRestore();
    if (previous !== undefined) process.env.FIREBASE_SERVICE_ACCOUNT = previous;
  });
});