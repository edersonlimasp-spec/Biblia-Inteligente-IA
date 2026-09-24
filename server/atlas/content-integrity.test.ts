// @vitest-environment node
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { atlasItemSchema } from "../../shared/atlas";

const root = path.resolve(process.cwd(), "data/atlas");
const manifestPath = path.join(root, "manifest.json");
const canonicalSampleIds = [
  "ancient-near-east", "abraham-journeys", "exodus-hypotheses", "twelve-tribes",
  "divided-kingdom", "jerusalem-jesus", "palestine-jesus", "paul-first-journey",
  "seven-churches", "roman-empire",
];

describe("Atlas shipped content integrity", () => {
  it("matches the manifest and validates every shipped item", () => {
    expect(fs.existsSync(manifestPath), "data/atlas/manifest.json ausente").toBe(true);
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as {
      expectedAvailable: number;
      items: Array<{ id: string; status: string; kind: string; sample: boolean }>;
    };
    const available = manifest.items.filter(item => item.status === "disponivel");
    expect(available).toHaveLength(manifest.expectedAvailable);
    expect(available.map(item => item.id).sort()).toEqual([...canonicalSampleIds].sort());

    const files = [
      ...fs.readdirSync(path.join(root, "maps")).filter(file => file.endsWith(".json")).map(file => path.join(root, "maps", file)),
      ...fs.readdirSync(path.join(root, "illustrations")).filter(file => file.endsWith(".json")).map(file => path.join(root, "illustrations", file)),
    ];
    const parsed = files.map(file => {
      const item = atlasItemSchema.parse(JSON.parse(fs.readFileSync(file, "utf8")));
      expect(item.id).toBe(path.basename(file, ".json"));
      expect(item.keyReferences.length).toBeGreaterThanOrEqual(3);
      expect(item.keyReferences.length).toBeLessThanOrEqual(8);
      expect(item.modernOverview.trim().split(/[.!?]+/).filter(Boolean).length).toBeGreaterThanOrEqual(3);
      expect(item.modernOverview.trim().split(/[.!?]+/).filter(Boolean).length).toBeLessThanOrEqual(6);
      return item;
    });
    const actualIds = new Set(parsed.map(item => item.id));
    expect(actualIds.size).toBe(parsed.length);
    expect([...actualIds].sort()).toEqual([...new Set(available.map(item => item.id))].sort());
    for (const item of available) {
      expect(actualIds, `item do manifesto ausente: ${item.id}`).toContain(item.id);
      const content = parsed.find(candidate => candidate.id === item.id);
      expect(content?.kind).toBe(item.kind);
      expect(content?.sample).toBe(item.sample);
    }
    expect(parsed.filter(item => item.sample)).toHaveLength(manifest.expectedAvailable);
    for (const item of parsed) {
      if (item.kind === "illustration" && item.illustration) {
        expect(fs.existsSync(path.join(root, "svg", item.illustration.svgFile)), `SVG ausente: ${item.illustration.svgFile}`).toBe(true);
      }
    }
  });
});