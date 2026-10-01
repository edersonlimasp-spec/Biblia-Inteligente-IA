import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: null }) }));
vi.mock("@/hooks/useMel", () => ({ useMel: () => ({}) }));

import { MelCard, MelCompletionNotice } from "./MelCard";
import { MelMascot } from "./MelMascot";

describe("Mel celebration", () => {
  it("preserves home progress and actions without a permanent mascot", () => {
    const html = renderToStaticMarkup(createElement(MelCard, {
      onContinue: vi.fn(),
      onOpenDevotional: vi.fn(),
    }));
    expect(html).not.toContain("mel-mascot");
    expect(html).not.toContain("Conversar com a Mel");
    expect(html).toContain("button-mel-continue");
    expect(html).toContain("button-mel-devotional");
    expect(html).toContain("min-w-0 flex-1");
  });

  it("keeps the completion message without a duplicate permanent mascot", () => {
    const html = renderToStaticMarkup(createElement(MelCompletionNotice, {
      message: "Que alegria! Você esteve na Palavra hoje.",
      streak: 1,
    }));
    expect(html).toContain("Que alegria! Você esteve na Palavra hoje.");
    expect(html).not.toContain("mel-mascot");
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