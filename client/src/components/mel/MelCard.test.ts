import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: null }) }));
vi.mock("@/hooks/useMel", () => ({ useMel: () => ({}) }));

import { MelCompletionNotice } from "./MelCard";
import { MelMascot } from "./MelMascot";

describe("Mel celebration", () => {
  it("animates ordinary daily completion, not only milestones", () => {
    const html = renderToStaticMarkup(createElement(MelCompletionNotice, {
      message: "Que alegria! Você esteve na Palavra hoje.",
      streak: 1,
    }));
    expect(html).toContain("mel-mascot--celebrate");
    expect(html).toContain("--mel-motion-state:running");
    expect(html).not.toContain("Que marco especial!");
  });

  it.each([7, 30, 100, 365])("commemorates the %i-day milestone", (streak) => {
    const html = renderToStaticMarkup(createElement(MelCompletionNotice, {
      message: "Vamos celebrar este tempo na Palavra.",
      streak,
    }));
    expect(html).toContain("Que marco especial!");
    expect(html).toContain(`${streak} dias seguidos na Palavra`);
  });

  it.each(["normal", "feliz", "saudade"] as const)("labels the %s expression accessibly", (mood) => {
    const html = renderToStaticMarkup(createElement(MelMascot, { mood }));
    expect(html).toContain('role="img"');
    expect(html).toContain("sua companheira de estudo bíblico");
    expect(html).toContain("prefers-reduced-motion");
  });
});