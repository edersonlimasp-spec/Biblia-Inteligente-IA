import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DownloadPage, detectStore } from "./DownloadPage";

describe("DownloadPage", () => {
  it("detects iPhone and iPad while defaulting Android and desktop to Google Play", () => {
    expect(detectStore("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)")).toBe("ios");
    expect(detectStore("Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X)")).toBe("ios");
    expect(detectStore("Mozilla/5.0 (Linux; Android 15; Pixel 9)")).toBe("android");
    expect(detectStore("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")).toBe("android");
  });

  it("renders only the two requested store links", () => {
    const html = renderToStaticMarkup(<DownloadPage />);
    const links = html.match(/<a /g) || [];

    expect(links).toHaveLength(2);
    expect(html).toContain("https://play.google.com/store/apps/details?id=app.replit.bibliainteligente.twa");
    expect(html).toContain("https://apps.apple.com/br/app/b%C3%ADblia-inteligente-ia/id6766988872");
    expect(html).not.toContain("Versão web");
    expect(html).not.toContain("Entrar");
  });
});