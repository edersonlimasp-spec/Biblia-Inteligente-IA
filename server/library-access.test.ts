import { describe, expect, it } from "vitest";
import { resolveLibraryAccess } from "./library-access";

const base = {
  userId: "user-1",
  userPlan: null,
  hasPurchased: false,
};

describe("Library access rules", () => {
  it("keeps the first two chapters public", () => {
    expect(resolveLibraryAccess({ ...base, userId: null, chapterOrder: 1 })).toBe("sample");
    expect(resolveLibraryAccess({ ...base, userId: null, chapterOrder: 2 })).toBe("sample");
  });

  it("keeps explicitly marked sample chapters public", () => {
    expect(resolveLibraryAccess({
      ...base,
      userId: null,
      chapterOrder: 7,
      chapterIsSample: true,
    })).toBe("sample");
  });

  it("unlocks Premium annual and lifetime plans but not Gold", () => {
    expect(resolveLibraryAccess({ ...base, userPlan: "premium_anual", chapterOrder: 3 })).toBe("owned");
    expect(resolveLibraryAccess({ ...base, userPlan: "premium_annual", chapterOrder: 3 })).toBe("owned");
    expect(resolveLibraryAccess({ ...base, userPlan: "strong_lifetime", chapterOrder: 3 })).toBe("owned");
    expect(resolveLibraryAccess({ ...base, userPlan: "gold", chapterOrder: 3 })).toBe("locked");
  });

  it("preserves access for old purchases and administrators", () => {
    expect(resolveLibraryAccess({ ...base, hasPurchased: true, chapterOrder: 3 })).toBe("owned");
    expect(resolveLibraryAccess({ ...base, userRole: "admin", chapterOrder: 3 })).toBe("owned");
  });
});