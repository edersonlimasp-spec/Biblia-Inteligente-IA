import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { withOfferMetadata } from "./offer-metadata";
import { withDownloadMetadata } from "./download-metadata";

describe("public campaign HTML", () => {
  const template = readFileSync("client/index.html", "utf8");
  it("has its own SEO metadata without reflecting campaign inputs", () => {
    const html = withOfferMetadata(template);
    expect(html).toContain("<title>Bíblia Inteligente IA — Estude a Bíblia com mais profundidade</title>");
    expect(html).toContain('rel="canonical" href="https://bibliainteligente.replit.app/oferta"');
    expect(html).toContain("Bíblia com 66 livros");
  });

  it("retains exactly one global tag and config on every public template", () => {
    for (const html of [template, withOfferMetadata(template), withDownloadMetadata(template)]) {
      expect(html.match(/googletagmanager\.com\/gtag\/js/g)).toHaveLength(1);
      expect(html.match(/gtag\('config', 'AW-18403408626'\)/g)).toHaveLength(1);
    }
  });
});