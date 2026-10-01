import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MelMascot, type MelScene } from "./MelMascot";

const scenes: MelScene[] = [
  "idle", "welcome", "morning", "continue", "reading", "complete",
  "milestone", "saudade", "sleeping", "praying", "peeking",
];

describe("Mel's SVG scenes", () => {
  it.each(scenes)("renders the %s scene as an accessible inline illustration", (scene) => {
    const markup = renderToStaticMarkup(createElement(MelMascot, { scene }));
    expect(markup).toContain(`data-scene="${scene}"`);
    expect(markup).toContain('role="img"');
    expect(markup).toContain("sua companheira de estudo bíblico");
    expect(markup).toContain("prefers-reduced-motion");
  });

  it("keeps the Bible absent in saudade and present in the other scenes", () => {
    const sadMarkup = renderToStaticMarkup(createElement(MelMascot, { scene: "saudade" }));
    const readingMarkup = renderToStaticMarkup(createElement(MelMascot, { scene: "reading" }));
    expect(sadMarkup).not.toContain('class="mel-bible');
    expect(readingMarkup).toContain('class="mel-bible mel-bible--open"');
  });

  it("preserves celebration hooks and accepts stage-specific props", () => {
    const markup = renderToStaticMarkup(createElement(MelMascot, {
      scene: "milestone", milestone: 30, interaction: true, celebrate: true, reference: "Salmo 23",
    }));
    expect(markup).toContain("mel-mascot--celebrate");
    expect(markup).toContain("mel-mascot--interaction");
    expect(markup).toContain("--mel-motion-state:running");
    expect(markup).toContain(">30</text>");
  });
});