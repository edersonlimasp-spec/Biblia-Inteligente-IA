import { afterEach, describe, expect, it, vi } from "vitest";
import { closeDevotionalInvitation, isDevotionalInvitationClosed } from "./useDevotionalInvitation";

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("devotional invitation dismissal", () => {
  it("persists a guest dismissal without requiring an account", () => {
    closeDevotionalInvitation(undefined, "2026-10-02", "manha");
    expect(isDevotionalInvitationClosed(undefined, "2026-10-02", "manha")).toBe(true);
    expect(localStorage.getItem("devotional-invitation:guest")).toBe("2026-10-02:manha");
  });

  it("does not hide the evening invitation or a new day's invitation", () => {
    closeDevotionalInvitation("user-1", "2026-10-02", "manha");
    expect(isDevotionalInvitationClosed("user-1", "2026-10-02", "noite")).toBe(false);
    expect(isDevotionalInvitationClosed("user-1", "2026-10-03", "manha")).toBe(false);
  });

  it("isolates guest and account dismissals", () => {
    closeDevotionalInvitation("user-1", "2026-10-02", "manha");
    expect(isDevotionalInvitationClosed("user-2", "2026-10-02", "manha")).toBe(false);
    expect(isDevotionalInvitationClosed(undefined, "2026-10-02", "manha")).toBe(false);
  });

  it("still closes visually when device storage is unavailable", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Storage blocked"); });
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("Storage blocked"); });
    closeDevotionalInvitation("blocked-storage", "2026-10-02", "manha");
    expect(isDevotionalInvitationClosed("blocked-storage", "2026-10-02", "manha")).toBe(true);
  });
});