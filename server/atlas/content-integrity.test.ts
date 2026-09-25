// @vitest-environment node
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { XMLValidator } from "fast-xml-parser";
import { atlasItemSchema } from "../../shared/atlas";
import { cubitsToMeters } from "../../shared/atlas";
import { ATLAS_BOOK_NAMES, ATLAS_HISTORICAL_BOOK_NAMES, formatAtlasReference } from "../../shared/atlasBooks";
import { atlasSummary, getAtlasItem, loadAtlasCatalog, buildAtlasContext } from "./catalog";

const root = path.resolve(process.cwd(), "data/atlas");
const manifestPath = path.join(root, "manifest.json");
const canonicalSampleIds = [
  "abraham-journeys", "exodus-hypotheses",
  "palestine-jesus", "paul-first-journey",
  "seven-churches", "roman-empire", "jerusalem-jesus",
  "tabernacle-overview", "tabernacle-ark-mercy-seat",
  "solomon-temple-overview", "tabernacle-temple-comparison",
  "alexander-greek-world", "ptolemies-seleucids-maccabees",
  "jesus-birth-childhood", "pentecost-nations",
];
const baseLockedIds = ["ancient-near-east", "divided-kingdom", "twelve-tribes"];
const newIds = ["nations-gen-10", "isaac-jacob", "joseph-egypt", "wilderness-kadesh", "tribes-camp", "conquest-canaan"];
const secondOldTestamentBatchIds = [
  "ruth-map", "refuge-levitical-cities", "judges-period", "samuel-saul",
  "david-fugitive-to-throne", "david-battles", "solomon-trade",
  "elijah-elisha", "josiah-megiddo",
];
const thirdBatchIds = [
  "assyrian-empire-samaria", "jonah", "babylonian-empire-exile",
  "daniel-esther-map", "persian-empire-return", "prophets-map",
  "noah-ark-ararat", "babel-ziggurats", "alexander-greek-world",
  "ptolemies-seleucids-maccabees",
];
const newTestamentBatchIds = [
  "herod-and-sons", "jesus-birth-childhood", "galilee-ministry",
  "decapolis-tyre-sidon-perea", "last-week-resurrection",
  "pentecost-nations", "church-acts-1-12", "paul-conversion",
];
const secondBatchRequiredPlaces: Record<string, string[]> = {
  "ruth-map": ["Belém de Judá", "Região de Moabe", "Campo de Boaz"],
  "refuge-levitical-cities": ["Quedes (Kedesh)", "Siquém", "Hebrom", "Bezer", "Ramote-Gileade", "Golã"],
  "judges-period": ["Monte Tabor", "Rio Quisom", "Hazor", "Fonte de Harode", "Mizpá de Gileade", "Vale de Soreque", "Laís (Dã)", "Siló"],
  "samuel-saul": ["Siló", "Micmás", "Jabes-Gileade", "Monte Gilboa", "Bete-Seã", "Ebenézer", "Asdode", "Gate", "Ecrom", "Bete-Semes", "Quiriate-Jearim"],
  "david-fugitive-to-throne": ["Vale do Elá", "Nobe", "Caverna de Adulão", "Maom", "Carmelo (Judá)", "Hebrom", "Jerusalém"],
  "david-battles": ["Baal-Perazim", "Vale de Refaim", "Rabbá dos amonitas", "Moabe", "Edom", "Aram-Zobá"],
  "solomon-trade": ["Jerusalém", "Gezer", "Hazor", "Megido", "Eziom-Geber", "Tiro", "Sabá (região)", "Ofir", "Társis"],
  "elijah-elisha": ["Tisbe", "Ribeiro de Querite", "Sarepta", "Monte Carmelo", "Horebe", "Abel-Meolá", "Jericó", "Suném", "Dotã", "Damasco"],
  "josiah-megiddo": ["Jerusalém", "Betel", "Megido", "Carquemis"],
};
const secondBatchWithoutPrecisePins: Record<string, string[]> = {
  "ruth-map": ["Região de Moabe", "Campo de Boaz"],
  "refuge-levitical-cities": ["Bezer", "Ramote-Gileade", "Golã"],
  "judges-period": ["Boquim", "Gileade", "Mizpá de Gileade"],
  "samuel-saul": ["Ebenézer", "Afeque", "Gilgal"],
  "david-fugitive-to-throne": ["Caverna de Adulão", "Deserto de Zife", "Ziclague"],
  "david-battles": ["Baal-Perazim", "Vale de Refaim", "Moabe", "Edom", "Aram-Zobá"],
  "solomon-trade": ["Sabá (região)", "Ofir", "Társis"],
  "elijah-elisha": ["Tisbe", "Ribeiro de Querite", "Horebe", "Gilgal"],
};
const tabernacleIds = [
  "tabernacle-overview", "tabernacle-courtyard", "tabernacle-courtyard-gate",
  "tabernacle-burnt-offering-altar", "tabernacle-bronze-laver", "tabernacle-structure",
  "tabernacle-coverings", "tabernacle-veil-entrance-curtain", "tabernacle-menorah",
  "tabernacle-showbread-table", "tabernacle-incense-altar", "tabernacle-ark-mercy-seat",
  "high-priest-garments", "high-priest-ephod-sash", "high-priest-breastpiece",
  "high-priest-blue-robe", "high-priest-turban-gold-plate",
  "high-priest-tunic-sash-undergarments", "common-priest-garments",
];
const garmentIds = tabernacleIds.slice(12);
const templeIds = [
  "solomon-temple-overview", "solomon-temple-plan", "solomon-temple-porch",
  "solomon-temple-holy-place", "solomon-temple-holy-of-holies",
  "solomon-temple-side-chambers", "solomon-temple-jachin-boaz",
  "solomon-temple-bronze-sea", "solomon-temple-wheeled-bases",
  "solomon-temple-lavers", "solomon-temple-bronze-altar",
  "solomon-temple-courts", "tabernacle-temple-comparison",
];
const chapterLimits: Record<string, number> = { Gen: 50, Exod: 40, Num: 36, Deut: 34, Josh: 24 };
const sourceCoordinates = new Set(fs.readFileSync(path.resolve(process.cwd(), "docs/atlas/evidence/openbible-merged.txt"), "utf8")
  .split(/\r?\n/).filter(line => line && !line.startsWith("#"))
  .map(line => line.split("\t"))
  .filter(columns => !/[~<>?]/.test(columns[2] + columns[3]))
  .map(columns => `${Number(columns[3])},${Number(columns[2])}`));
const retainedPleiadesPoints = new Set(["599612", "678437", "687928"].map(id => {
  const place = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), `docs/atlas/evidence/pleiades-${id}.json`), "utf8"));
  return place.reprPoint.join(",");
}));

describe("Atlas shipped content integrity", () => {
  it("matches the manifest, validates every shipped item and loads every file into the actual catalog", async () => {
    expect(fs.existsSync(manifestPath), "data/atlas/manifest.json ausente").toBe(true);
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as {
      expectedAvailable: number;
      items: Array<{ id: string; status: string; kind: string; sample: boolean }>;
    };
    const available = manifest.items.filter(item => item.status === "disponivel");
    expect(available).toHaveLength(manifest.expectedAvailable);
    expect(available.map(item => item.id).sort()).toEqual([...canonicalSampleIds, ...baseLockedIds, ...newIds, ...secondOldTestamentBatchIds,
      ...thirdBatchIds.filter(id => !canonicalSampleIds.includes(id)),
      ...newTestamentBatchIds.filter(id => !canonicalSampleIds.includes(id)),
      ...tabernacleIds.filter(id => !canonicalSampleIds.includes(id)),
      ...templeIds.filter(id => !canonicalSampleIds.includes(id))].sort());

    const files = [
      ...fs.readdirSync(path.join(root, "maps")).filter(file => file.endsWith(".json")).map(file => path.join(root, "maps", file)),
      ...fs.readdirSync(path.join(root, "illustrations")).filter(file => file.endsWith(".json")).map(file => path.join(root, "illustrations", file)),
    ];
    const parsed = files.map(file => {
      const item = atlasItemSchema.parse(JSON.parse(fs.readFileSync(file, "utf8")));
      expect(item.id).toBe(path.basename(file, ".json"));
      expect(item.keyReferences.length).toBeGreaterThanOrEqual(item.section === "solomon-temple" ? 2 : 3);
      expect(item.keyReferences.length).toBeLessThanOrEqual(8);
      if (item.kind === "map") {
         const sentences = item.modernOverview.trim()
           .replace(/\bc\.\s*(?=\d)/g, "c ").replace(/a\.C\./g, "aC")
           .split(/[.!?]+/).filter(Boolean);
         expect(sentences.length, item.id).toBeGreaterThanOrEqual(3);
         expect(sentences.length, item.id).toBeLessThanOrEqual(6);
      }
      return item;
    });
    const actualIds = new Set(parsed.map(item => item.id));
    const loadedIds = (await loadAtlasCatalog()).map(item => item.id).sort();
    expect(loadedIds, "Algum JSON existe no Atlas mas foi ignorado pelo carregador").toEqual([...actualIds].sort());
    expect(actualIds.size).toBe(parsed.length);
    expect([...actualIds].sort()).toEqual([...new Set(available.map(item => item.id))].sort());
    for (const item of available) {
      expect(actualIds, `item do manifesto ausente: ${item.id}`).toContain(item.id);
      const content = parsed.find(candidate => candidate.id === item.id);
      expect(content?.kind).toBe(item.kind);
      expect(content?.sample).toBe(item.sample);
    }
    expect(parsed.filter(item => item.sample).map(item => item.id).sort()).toEqual([...canonicalSampleIds].sort());
    for (const item of parsed) {
       expect(item.curiosities?.length, `${item.id}: faltam curiosidades`).toBeGreaterThanOrEqual(3);
       expect(item.curiosities?.length, `${item.id}: curiosidades em excesso`).toBeLessThanOrEqual(5);
       for (const curiosity of item.curiosities ?? []) {
         expect(curiosity.sourceIds.length).toBeGreaterThan(0);
         curiosity.sourceIds.forEach(id => expect(item.sources.map(source => source.id), item.id).toContain(id));
       }
       if (item.kind === "map") {
         expect(item.storySteps?.length, `${item.id}: falta história`).toBeGreaterThan(0);
         for (const step of item.storySteps ?? []) {
           expect(item.places.some(place => place.id === step.placeId), item.id).toBe(true);
         }
       }
       if (item.illustration) {
        expect(fs.existsSync(path.join(root, "svg", item.illustration.svgFile)), `SVG ausente: ${item.illustration.svgFile}`).toBe(true);
      }
    }
  });

  it("uses Portuguese book names for every code present in Atlas content", () => {
    expect(Object.keys(ATLAS_BOOK_NAMES)).toHaveLength(66);
    const codes = new Set<string>();
    const visit = (value: unknown) => {
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === "object") {
        const object = value as Record<string, unknown>;
        if (typeof object.book === "string") codes.add(object.book);
        if (Array.isArray(object.books)) object.books.forEach(book => codes.add(String(book)));
        Object.values(object).forEach(visit);
      }
    };
    for (const folder of ["maps", "illustrations"]) {
      for (const file of fs.readdirSync(path.join(root, folder)).filter(file => file.endsWith(".json")))
        visit(JSON.parse(fs.readFileSync(path.join(root, folder, file), "utf8")));
    }
    for (const code of codes) expect(ATLAS_BOOK_NAMES[code] ?? ATLAS_HISTORICAL_BOOK_NAMES[code], `Livro sem tradução: ${code}`).toBeTruthy();
    expect(ATLAS_HISTORICAL_BOOK_NAMES["1Macc"]).toBe("1 Macabeus");
    expect(ATLAS_BOOK_NAMES["1Macc"]).toBeUndefined(); // The local Bible has 66 books; this stays an external historical citation.
    expect(formatAtlasReference({ book: "Acts", chapter: 13, verseStart: 1, verseEnd: 14, label: "Acts 13:1–14" })).toBe("Atos 13:1-14");
    expect(ATLAS_BOOK_NAMES["1Kgs"]).toBe("1 Reis");
    expect(ATLAS_BOOK_NAMES.Exod).toBe("Êxodo");
    expect(ATLAS_BOOK_NAMES.Rev).toBe("Apocalipse");
  });

  it("gates real items consistently for visitors/free accounts and full-access plans/trials", async () => {
    const items = await loadAtlasCatalog();
    for (const item of items) {
      expect(atlasSummary(item, false).locked).toBe(!canonicalSampleIds.includes(item.id));
      expect(atlasSummary(item, true).locked).toBe(false);
      if (canonicalSampleIds.includes(item.id)) {
        expect((await getAtlasItem(item.id, false)).id).toBe(item.id);
      } else {
        await expect(getAtlasItem(item.id, false)).rejects.toMatchObject({ status: 403 });
        await expect(buildAtlasContext({ itemId: item.id, version: item.version, mode: "ancient" }, false)).rejects.toMatchObject({ status: 403 });
      }
      expect((await getAtlasItem(item.id, true)).id).toBe(item.id);
    }
  }, 15_000);

  it("keeps the new batch sourced, bounded, cited and honestly uncertain", () => {
    for (const id of newIds) {
      const folder = id === "tribes-camp" ? "illustrations" : "maps";
      const item = atlasItemSchema.parse(JSON.parse(fs.readFileSync(path.join(root, folder, `${id}.json`), "utf8")));
      const [west, south, east, north] = item.bounds;
       expect(item.sample, id).toBe(false);
      expect(item.section, id).toBe("old-testament");
      expect(item.subsection?.length, id).toBeGreaterThan(0);
      expect(item.order, id).toBeGreaterThan(0);
      expect(item.era.length, id).toBeGreaterThan(0);
      expect(item.aliases.length, id).toBeGreaterThan(1);
      expect(item.keyReferences.length, id).toBeGreaterThanOrEqual(3);
      expect(item.keyReferences.length, id).toBeLessThanOrEqual(8);
      expect(item.narrative?.length, id).toBeGreaterThan(0);
      expect(item.certainty, id).not.toBe("established");
       const allReferences = [...item.references, ...item.keyReferences, ...item.places.flatMap(place => place.references),
         ...(item.narrative ?? []).map(step => step.reference), ...(item.storySteps ?? []).map(step => step.reference),
         ...(item.curiosities ?? []).map(curiosity => curiosity.reference)];
      for (const reference of allReferences) {
        expect(reference.chapter, reference.label).toBeLessThanOrEqual(chapterLimits[reference.book]);
        expect(reference.verseStart, reference.label).toBeLessThanOrEqual(176);
        if (reference.verseEnd) expect(reference.verseEnd, reference.label).toBeGreaterThanOrEqual(reference.verseStart);
        expect(reference.label).toBe(`${reference.book} ${reference.chapter}:${reference.verseStart}${reference.verseEnd ? `–${reference.verseEnd}` : ""}`);
      }
      for (const place of item.places) {
        expect(place.name.trim(), id).not.toBe("");
        expect(place.modernName.trim(), place.name).not.toBe("");
        expect(place.references.length, place.name).toBeGreaterThan(0);
        expect(place.explanation.length, place.name).toBeGreaterThan(15);
        if (place.certainty === "unknown") expect(place.coordinates, place.name).toBeNull();
        if (place.coordinates) {
          expect(item.kind, place.name).toBe("map");
          expect(sourceCoordinates, `${id}/${place.name}: não consta da fonte retida`).toContain(`${place.coordinates[0]},${place.coordinates[1]}`);
          expect(place.sourceIds, place.name).toContain("openbible");
          const [x, y] = place.coordinates;
          expect(x, place.name).toBeGreaterThanOrEqual(west);
          expect(x, place.name).toBeLessThanOrEqual(east);
          expect(y, place.name).toBeGreaterThanOrEqual(south);
          expect(y, place.name).toBeLessThanOrEqual(north);
        }
      }
      for (const overlay of item.overlays) {
        expect(overlay.certainty, overlay.label).not.toBe("established");
        expect(overlay.explanation, overlay.label).toMatch(/esquemátic|editorial|não é estrada/i);
        for (const [x,y] of overlay.coordinates) {
          expect(sourceCoordinates, overlay.label).toContain(`${x},${y}`);
          expect(x, overlay.label).toBeGreaterThanOrEqual(west);
          expect(x, overlay.label).toBeLessThanOrEqual(east);
          expect(y, overlay.label).toBeGreaterThanOrEqual(south);
          expect(y, overlay.label).toBeLessThanOrEqual(north);
        }
      }
      for (const step of item.narrative ?? []) {
        expect(item.places.some(place => place.id === step.placeId), step.placeId).toBe(true);
        expect(step.explanation.length).toBeGreaterThan(15);
      }
      if (item.kind === "illustration") {
        expect(item.bounds).toEqual([0,0,0,0]); // diagram sentinel, never geographic
        expect(item.places.every(place => place.coordinates === null)).toBe(true);
      }
    }
  });

  it("keeps all nine second-batch maps complete and grounded in retained geography", () => {
    const evidenceCoordinates = new Set([...sourceCoordinates, ...retainedPleiadesPoints]);
    for (const id of secondOldTestamentBatchIds) {
      const item = atlasItemSchema.parse(JSON.parse(fs.readFileSync(path.join(root, "maps", `${id}.json`), "utf8")));
      expect(item.kind, id).toBe("map");
      expect(item.section, id).toBe("old-testament");
      expect(item.sample, id).toBe(false);
      expect(item.subsection?.length, id).toBeGreaterThan(0);
      expect(item.order, id).toBeGreaterThan(0);
      expect(item.era.length, id).toBeGreaterThan(0);
      expect(item.summary.length, id).toBeGreaterThan(80);
      expect(item.modernOverview.length, id).toBeGreaterThan(100);
      expect(item.keyReferences.length, id).toBeGreaterThanOrEqual(3);
      expect(item.aliases.length, id).toBeGreaterThanOrEqual(3);
      expect(item.curiosities?.length, id).toBeGreaterThanOrEqual(3);
      expect(item.curiosities?.length, id).toBeLessThanOrEqual(5);
      for (const name of secondBatchRequiredPlaces[id])
        expect(item.places.some(place => place.name === name), `${id}: falta ${name}`).toBe(true);
      for (const name of secondBatchWithoutPrecisePins[id] ?? [])
        expect(item.places.find(place => place.name === name)?.coordinates, `${id}/${name}: pino de lugar incerto`).toBeNull();
      if (id === "judges-period") expect(item.overlays.length, "camadas por juiz ausentes").toBeGreaterThanOrEqual(5);
      if (id === "solomon-trade") expect(item.summary, "lista dos doze distritos ausente").toContain("doze distritos");
      const placeIds = new Set(item.places.map(place => place.id));
      const visited = new Set(item.storySteps?.map(step => step.placeId));
      expect(item.storySteps?.length, id).toBeGreaterThanOrEqual(item.places.length);
      for (const place of item.places) {
        expect(place.modernName.trim(), `${id}/${place.id}`).not.toBe("");
        expect(place.references.length, `${id}/${place.id}`).toBeGreaterThan(0);
        expect(visited.has(place.id), `${id}/${place.name}: lugar sem parada narrativa`).toBe(true);
        if (!place.coordinates) {
          expect(["unknown", "debated"], `${id}/${place.name}: sítio sem pino deve ser incerto`).toContain(place.certainty);
          continue;
        }
        const key = place.coordinates.join(",");
        expect(evidenceCoordinates, `${id}/${place.name}: pino não consta das fontes retidas`).toContain(key);
        expect(place.sourceIds.some(source => source === "openbible" || source === "pleiades"), `${id}/${place.name}: fonte geográfica ausente`).toBe(true);
      }
      for (const overlay of item.overlays) {
        expect(overlay.certainty, `${id}/${overlay.id}`).not.toBe("established");
        expect(overlay.explanation, `${id}/${overlay.id}`).toMatch(/esquemátic|envelope|aproximad|não é estrada/i);
        for (const vertex of overlay.coordinates)
          expect(evidenceCoordinates, `${id}/${overlay.id}: vértice não consta das fontes retidas`).toContain(vertex.join(","));
      }
      for (const step of item.storySteps ?? []) {
        expect(placeIds.has(step.placeId), `${id}: parada sem lugar`).toBe(true);
        expect(step.reference.verseStart, `${id}/${step.placeId}: referência sem versículo`).toBeGreaterThan(0);
      }
      for (const curiosity of item.curiosities ?? []) {
        expect(curiosity.reference.verseStart, id).toBeGreaterThan(0);
        expect(curiosity.sourceIds.every(source => item.sources.some(s => s.id === source)), id).toBe(true);
      }
    }
  });

  it("keeps the ten imperial, exile, return and intertestamental maps sourced and complete", () => {
    const evidenceCoordinates = new Set([...sourceCoordinates, ...retainedPleiadesPoints]);
    const publicIds = new Set(["alexander-greek-world", "ptolemies-seleucids-maccabees"]);
    for (const id of thirdBatchIds) {
      const item = atlasItemSchema.parse(JSON.parse(fs.readFileSync(path.join(root, "maps", `${id}.json`), "utf8")));
      expect(item.kind, id).toBe("map");
      expect(item.sample, id).toBe(publicIds.has(id));
      expect(item.section, id).toBe(publicIds.has(id) ? "intertestamental" : "old-testament");
      expect(item.subsection?.length, id).toBeGreaterThan(0);
      expect(item.modernOverview.length, id).toBeGreaterThan(100);
      expect(item.aliases.length, id).toBeGreaterThanOrEqual(3);
      expect(item.keyReferences.length, id).toBeGreaterThanOrEqual(3);
      expect(item.curiosities?.length, id).toBeGreaterThanOrEqual(3);
      expect(item.curiosities?.length, id).toBeLessThanOrEqual(5);
      expect(item.review.status, id).toBe("needs-specialist");
      const [west, south, east, north] = item.bounds;
      const visited = new Set(item.storySteps?.map(step => step.placeId));
      expect(item.storySteps?.length, id).toBeGreaterThanOrEqual(item.places.length);
      for (const place of item.places) {
        expect(place.modernName.trim(), `${id}/${place.id}`).not.toBe("");
        expect(place.references.length, `${id}/${place.id}`).toBeGreaterThan(0);
        expect(visited.has(place.id), `${id}/${place.name}: sem passo narrativo`).toBe(true);
        if (place.certainty === "unknown") expect(place.coordinates, `${id}/${place.name}`).toBeNull();
        if (!place.coordinates) continue;
        expect(evidenceCoordinates, `${id}/${place.name}: pino não consta das fontes retidas`).toContain(place.coordinates.join(","));
        expect(place.sourceIds.some(source => ["openbible", "pleiades"].includes(source)), `${id}/${place.name}`).toBe(true);
        expect(place.coordinates[0], `${id}/${place.name}`).toBeGreaterThanOrEqual(west);
        expect(place.coordinates[0], `${id}/${place.name}`).toBeLessThanOrEqual(east);
        expect(place.coordinates[1], `${id}/${place.name}`).toBeGreaterThanOrEqual(south);
        expect(place.coordinates[1], `${id}/${place.name}`).toBeLessThanOrEqual(north);
      }
      for (const overlay of item.overlays) {
        expect(overlay.certainty, `${id}/${overlay.id}`).not.toBe("established");
        expect(overlay.explanation, `${id}/${overlay.id}`).toMatch(/esquemátic|aproximad|envelope/i);
        if (overlay.kind === "area") {
          expect(overlay.explanation, `${id}/${overlay.id}`).toMatch(/não é fronteira exata/i);
          expect(overlay.explanation, `${id}/${overlay.id}`).toMatch(/c\.\s*\d+/i);
        }
        for (const vertex of overlay.coordinates) {
          expect(evidenceCoordinates, `${id}/${overlay.id}: vértice não consta das fontes retidas`).toContain(vertex.join(","));
          expect(vertex[0], `${id}/${overlay.id}`).toBeGreaterThanOrEqual(west);
          expect(vertex[0], `${id}/${overlay.id}`).toBeLessThanOrEqual(east);
          expect(vertex[1], `${id}/${overlay.id}`).toBeGreaterThanOrEqual(south);
          expect(vertex[1], `${id}/${overlay.id}`).toBeLessThanOrEqual(north);
        }
      }
      for (const step of item.storySteps ?? []) {
        expect(item.places.some(place => place.id === step.placeId), `${id}: passo sem lugar`).toBe(true);
        expect(step.reference.verseStart, `${id}: passo sem versículo`).toBeGreaterThan(0);
      }
      for (const curiosity of item.curiosities ?? []) {
        expect(curiosity.reference.verseStart, id).toBeGreaterThan(0);
        expect(curiosity.sourceIds.every(source => item.sources.some(s => s.id === source)), id).toBe(true);
      }
      if (id === "prophets-map") {
        for (const place of item.places) {
          expect(place.centuries?.length, `${place.name}: filtro por século ausente`).toBeGreaterThan(0);
          expect(place.kingdoms?.length, `${place.name}: filtro por reino ausente`).toBeGreaterThan(0);
        }
      }
      const mustStayUnpinned: Record<string, RegExp[]> = {
        "assyrian-empire-samaria": [/^Assur$/, /^Hala$/, /cidades dos medos/i],
        jonah: [/Társis/i],
        "babylonian-empire-exile": [/Quebar/i, /^Migdol$/],
        "daniel-esther-map": [/Ulai/i],
        "persian-empire-return": [/Persépolis/i, /Ahava/i],
        "prophets-map": [/Naum/i, /Oseias/i, /Quebar/i],
        "noah-ark-ararat": [/Ararate/i],
        "babel-ziggurats": [/Shinar/i],
        "alexander-greek-world": [/Macedônia/i, /Grande Mar/i],
        "ptolemies-seleucids-maccabees": [/Modein/i, /Emmaus/i],
      };
      for (const matcher of mustStayUnpinned[id] ?? []) {
        const place = item.places.find(place => matcher.test(place.name));
        expect(place, `${id}: lugar incerto ${matcher} ausente`).toBeDefined();
        expect(place?.coordinates, `${id}/${place?.name}: pino indevido`).toBeNull();
      }
      if (id === "babylonian-empire-exile") {
        for (const year of [605, 597, 586])
          expect(item.overlays.some(overlay => overlay.kind === "route" && overlay.label.includes(`c. ${year}`)),
            `Camada de deportação c. ${year} ausente`).toBe(true);
      }
      if (id === "ptolemies-seleucids-maccabees") {
        expect(item.books).toContain("1Macc");
        expect(item.sources.some(source => source.id === "first-maccabees"), "fonte histórica ausente").toBe(true);
      }
      if (id === "noah-ark-ararat") {
        expect(item.illustration?.svgFile).toBe("noah-ark-proportions.svg");
        const svg = fs.readFileSync(path.join(root, "svg", "noah-ark-proportions.svg"), "utf8");
        expect(XMLValidator.validate(svg)).toBe(true);
        expect(svg).toMatch(/300/); expect(svg).toMatch(/50/); expect(svg).toMatch(/30/);
        expect(svg).toMatch(/futebol/i);
      }
    }
  });

  it("keeps the eight New Testament maps sourced, complete and honest about uncertain sites", () => {
    const evidenceCoordinates = new Set([...sourceCoordinates, ...retainedPleiadesPoints]);
    const freeIds = new Set(["jesus-birth-childhood", "pentecost-nations"]);
    const mustStayUnpinned: Record<string, RegExp[]> = {
      "herod-and-sons": [/Masada/i, /Heródio/i, /Cesareia Marítima/i],
      "jesus-birth-childhood": [/Egito/i, /Templo de Jerusalém/i],
      "galilee-ministry": [/multiplicação dos pães/i, /Magdala/i],
      "decapolis-tyre-sidon-perea": [/Decápolis/i, /gadarenos.*gerasenos/i, /Pereia/i, /Betânia além do Jordão/i, /Poço de Jacó/i],
      "last-week-resurrection": [/Getsêmani/i, /Gólgota/i, /Emaús/i],
      "pentecost-nations": [/Partos/i, /Medos/i, /Elamitas/i, /Mesopotâmia/i, /Judeia/i, /Capadócia/i, /Ponto/i, /^Ásia$/, /Frígia/i, /Panfília/i, /^Egito$/, /Líbia/i, /Roma/i, /Cretenses/i, /Árabes/i],
      "church-acts-1-12": [/Região da Samaria/i, /Estrada.*Gaza/i],
      "paul-conversion": [/Arábia/i, /Caminho para Damasco/i],
    };
    for (const id of newTestamentBatchIds) {
      const item = atlasItemSchema.parse(JSON.parse(fs.readFileSync(path.join(root, "maps", `${id}.json`), "utf8")));
      expect(item.kind, id).toBe("map");
      expect(item.testament, id).toBe("NT");
      expect(item.section, id).toBe("new-testament");
      expect(item.sample, id).toBe(freeIds.has(id));
      expect(item.subsection, id).toBe(["pentecost-nations", "church-acts-1-12", "paul-conversion"].includes(id) ? "Igreja primitiva" : "Vida de Jesus");
      expect(item.modernOverview.length, id).toBeGreaterThan(100);
      expect(item.keyReferences.length, id).toBeGreaterThanOrEqual(3);
      expect(item.keyReferences.length, id).toBeLessThanOrEqual(8);
      expect(item.curiosities?.length, id).toBeGreaterThanOrEqual(3);
      expect(item.curiosities?.length, id).toBeLessThanOrEqual(5);
      expect(item.review.status, id).toBe("needs-specialist");
      const [west, south, east, north] = item.bounds;
      const visited = new Set(item.storySteps?.map(step => step.placeId));
      for (const place of item.places) {
        expect(place.modernName.trim(), `${id}/${place.id}`).not.toBe("");
        expect(place.references.length, `${id}/${place.id}`).toBeGreaterThan(0);
        expect(visited.has(place.id), `${id}/${place.name}: sem passo narrativo`).toBe(true);
        if (place.certainty === "unknown") expect(place.coordinates, `${id}/${place.name}`).toBeNull();
        if (!place.coordinates) continue;
        expect(evidenceCoordinates, `${id}/${place.name}: pino não consta das fontes retidas`).toContain(place.coordinates.join(","));
        expect(place.sourceIds.some(source => ["openbible", "pleiades"].includes(source)), `${id}/${place.name}`).toBe(true);
        expect(place.coordinates[0], `${id}/${place.name}`).toBeGreaterThanOrEqual(west);
        expect(place.coordinates[0], `${id}/${place.name}`).toBeLessThanOrEqual(east);
        expect(place.coordinates[1], `${id}/${place.name}`).toBeGreaterThanOrEqual(south);
        expect(place.coordinates[1], `${id}/${place.name}`).toBeLessThanOrEqual(north);
      }
      for (const overlay of item.overlays) {
        expect(overlay.certainty, `${id}/${overlay.id}`).not.toBe("established");
        expect(overlay.explanation, `${id}/${overlay.id}`).toMatch(/esquemátic|aproximad|envelope/i);
        if (overlay.kind === "area") {
          expect(overlay.explanation, `${id}/${overlay.id}`).toMatch(/não é fronteira exata/i);
          expect(overlay.explanation, `${id}/${overlay.id}`).toMatch(/c\.|século/i);
        }
        for (const vertex of overlay.coordinates) {
          expect(evidenceCoordinates, `${id}/${overlay.id}: vértice sem fonte`).toContain(vertex.join(","));
          expect(vertex[0], `${id}/${overlay.id}`).toBeGreaterThanOrEqual(west);
          expect(vertex[0], `${id}/${overlay.id}`).toBeLessThanOrEqual(east);
          expect(vertex[1], `${id}/${overlay.id}`).toBeGreaterThanOrEqual(south);
          expect(vertex[1], `${id}/${overlay.id}`).toBeLessThanOrEqual(north);
        }
      }
      for (const matcher of mustStayUnpinned[id] ?? []) {
        const place = item.places.find(candidate => matcher.test(candidate.name));
        expect(place, `${id}: lugar ou região ${matcher} ausente`).toBeDefined();
        expect(place?.coordinates, `${id}/${place?.name}: pino indevido`).toBeNull();
      }
      for (const curiosity of item.curiosities ?? []) {
        expect(curiosity.reference.verseStart, id).toBeGreaterThan(0);
        expect(curiosity.sourceIds.every(source => item.sources.some(s => s.id === source)), id).toBe(true);
      }
    }
    const herod = JSON.parse(fs.readFileSync(path.join(root, "maps/herod-and-sons.json"), "utf8"));
    expect(herod.overlays.filter((o: { kind: string }) => o.kind === "area")).toHaveLength(3);
    expect(herod.review.uncertainties.join(" ")).toMatch(/Filipe/i); // Retained evidence has only one safe anchor, not enough for an honest area.
    expect(herod.sources.some((s: { title: string }) => /Josefo|Josephus/i.test(s.title))).toBe(true);
    const birth = JSON.parse(fs.readFileSync(path.join(root, "maps/jesus-birth-childhood.json"), "utf8"));
    expect(birth.summary + birth.modernOverview).toMatch(/Mateus/i);
    expect(birth.summary + birth.modernOverview).toMatch(/Lucas/i);
    const pentecost = JSON.parse(fs.readFileSync(path.join(root, "maps/pentecost-nations.json"), "utf8"));
    expect(pentecost.places).toHaveLength(16); // Jerusalem plus the fifteen origins in Acts 2:9–11.
    const church = JSON.parse(fs.readFileSync(path.join(root, "maps/church-acts-1-12.json"), "utf8"));
    expect(church.places.some((place: { name: string }) => /Damasco/i.test(place.name))).toBe(true);
  });

  it("validates the original Tabernacle plates, citations, dimensions, views and corresponding part markers", () => {
    expect(cubitsToMeters(1)).toBe(0.45);
    expect(cubitsToMeters(2.5)).toBe(1.125);
    for (const id of tabernacleIds) {
      const item = atlasItemSchema.parse(JSON.parse(fs.readFileSync(path.join(root, "illustrations", `${id}.json`), "utf8")));
      expect(item.section).toBe("tabernacle");
      expect(item.purpose?.length).toBeGreaterThan(20);
      expect(item.storySteps?.length).toBeGreaterThan(0);
      expect(item.curiosities?.length).toBeGreaterThanOrEqual(3);
      expect(item.keyReferences.length).toBeGreaterThan(0);
      expect(item.review.uncertainties.length).toBeGreaterThan(0);
      const illustration = item.illustration!;
      expect(illustration.views?.length).toBeGreaterThanOrEqual(2);
      expect(illustration.views?.[0].svgFile).toBe(illustration.svgFile);
       if (!garmentIds.includes(id)) expect(illustration.views?.some(view => view.label === "Vista 3/4")).toBe(true);
      expect(illustration.parts.length).toBeGreaterThan(0);
      for (const dimension of illustration.dimensions) {
        expect(dimension.reference.book).toBeTruthy();
        expect(dimension.reference.chapter).toBeGreaterThan(0);
        expect(dimension.reference.verseStart).toBeGreaterThan(0);
        expect(dimension.cubits === undefined || dimension.cubits > 0).toBe(true);
        if (dimension.cubits !== undefined) expect(cubitsToMeters(dimension.cubits)).toBeCloseTo(dimension.cubits * 0.45, 2);
      }
      const primary = fs.readFileSync(path.join(root, "svg", illustration.svgFile), "utf8");
      for (const part of illustration.parts) {
        expect(part.references.length, `${id}/${part.id}`).toBeGreaterThan(0);
        expect(part.highlight, `${id}/${part.id}`).toBeDefined();
        expect(primary, `${id}/${part.id}: marcador ausente`).toContain(`id="part-${part.id}"`);
        expect(part.highlight?.x ?? -1).toBeGreaterThanOrEqual(0);
        expect((part.highlight?.x ?? 101) + (part.highlight?.width ?? 0)).toBeLessThanOrEqual(100);
        expect(part.highlight?.y ?? -1).toBeGreaterThanOrEqual(0);
        expect((part.highlight?.y ?? 101) + (part.highlight?.height ?? 0)).toBeLessThanOrEqual(100);
      }
      for (const step of item.storySteps ?? []) {
        expect(illustration.parts.some(part => part.id === step.placeId), `${id}/${step.placeId}`).toBe(true);
      }
      for (const view of illustration.views ?? []) {
        const svg = fs.readFileSync(path.join(root, "svg", view.svgFile), "utf8");
        expect(XMLValidator.validate(svg), `${id}/${view.label}: SVG inválido`).toBe(true);
        expect(svg).toMatch(/<svg\b[^>]*viewBox=/);
        expect(svg).not.toMatch(/<\s*(script|foreignObject|image|iframe)\b|(?:javascript:|data:|(?:xlink:)?href\s*=\s*["'](?:https?:|\/\/))/i);
         if (illustration.dimensions.every(dimension => dimension.cubits === undefined))
           expect(svg).not.toMatch(/\d+(?:[.,]\d+)?\s*(?:côvados?|metros?)/i);
      }
      if (id === "tabernacle-bronze-laver" || id === "tabernacle-menorah")
        expect(illustration.dimensions.every(dimension => dimension.cubits === undefined), id).toBe(true);
      if (id === "tabernacle-ark-mercy-seat")
        expect(illustration.dimensions.filter(dimension => /querub/i.test(dimension.label)).every(dimension => dimension.cubits === undefined)).toBe(true);
    }
  });

  it("preserves the seven garments as premium-only, cites the ordered dressing and labels stone identification as debated", () => {
    const garments = garmentIds.map(id => atlasItemSchema.parse(JSON.parse(fs.readFileSync(path.join(root, "illustrations", `${id}.json`), "utf8"))));
    expect(garments.map(item => item.order)).toEqual([13, 14, 15, 16, 17, 18, 19]);
    for (const item of garments) {
      expect(item.sample, item.id).toBe(false);
      expect(item.purpose?.length, item.id).toBeGreaterThan(20);
      expect(item.storySteps?.length, item.id).toBeGreaterThan(0);
      expect(item.curiosities?.length, item.id).toBeGreaterThanOrEqual(3);
      expect(item.illustration?.views?.some(view => view.label === "Vista 3/4"), item.id).toBe(true);
      expect(item.illustration?.parts.every(part => part.highlight !== undefined), item.id).toBe(true);
      if (item.id !== "high-priest-breastpiece")
        expect(item.illustration?.dimensions.every(dimension => dimension.cubits === undefined), item.id).toBe(true);
    }
    const ensemble = garments[0];
    expect(ensemble.storySteps?.map(step => step.placeId)).toEqual([
      "linen-tunic", "belt", "robe", "ephod", "sash", "breastpiece", "mitre", "forehead-plate",
    ]);
    expect(ensemble.storySteps?.every(step => step.reference.book === "Lev" && step.reference.chapter === 8)).toBe(true);
    const breastpiece = garments[2];
    expect(breastpiece.illustration?.dimensions.filter(dimension => dimension.cubits !== undefined).map(dimension => dimension.cubits)).toEqual([0.5, 0.5]);
    expect(breastpiece.illustration?.stoneRows?.flatMap(row => row.stones)).toEqual([
      "Sárdio", "Topázio", "Carbúnculo", "Esmeralda", "Safira", "Diamante",
      "Jacinto", "Ágata", "Ametista", "Berilo", "Ônix", "Jaspe",
    ]);
    expect(breastpiece.illustration?.stoneRows?.map(row => row.reference.verseStart)).toEqual([17, 18, 19, 20]);
    const stoneNotes = [
      breastpiece.summary, ...breastpiece.review.uncertainties,
      ...(breastpiece.illustration?.notes ?? []),
    ].join(" ");
    expect(stoneNotes).toMatch(/(?:minera|pedra).*(?:debatid|incert|varia)/i);
    expect(stoneNotes).toMatch(/(?:tribo|ordem).*(?:não|incert)/i);
    expect(JSON.stringify(breastpiece)).not.toMatch(/(?:pedra|gema)\s+(?:de|da)\s+(?:r[uú]ben|sime[aã]o|jud[aá])/i);
  });

  it("ships thirteen sourced Temple plates with four safe views, matching markers and only two free samples", () => {
    const entries = templeIds.map(id => atlasItemSchema.parse(JSON.parse(fs.readFileSync(path.join(root, "illustrations", `${id}.json`), "utf8"))));
    expect(entries.map(entry => entry.order)).toEqual(Array.from({ length: 13 }, (_, index) => index + 1));
    expect(entries.filter(entry => entry.sample).map(entry => entry.id)).toEqual(["solomon-temple-overview", "tabernacle-temple-comparison"]);
    for (const item of entries) {
      expect(item.section, item.id).toBe("solomon-temple");
      expect(item.purpose?.length, item.id).toBeGreaterThan(20);
      expect(item.keyReferences.length, item.id).toBeGreaterThanOrEqual(2);
      expect(item.storySteps?.length, item.id).toBeGreaterThan(0);
      expect(item.curiosities?.length, item.id).toBeGreaterThanOrEqual(3);
      expect(item.review.uncertainties.length, item.id).toBeGreaterThan(0);
      const art = item.illustration!;
      expect(art.views?.map(view => view.label).sort(), item.id).toEqual([
        "Corte", "Frente", "Planta", "Vista 3/4",
        ...(item.id === "solomon-temple-wheeled-bases" ? ["Vista explodida"] : []),
      ].sort());
      const primary = fs.readFileSync(path.join(root, "svg", art.svgFile), "utf8");
      expect(XMLValidator.validate(primary), `${item.id}: SVG primário inválido`).toBe(true);
      expect(primary, `${item.id}: SVG primário com recurso proibido`)
        .not.toMatch(/<\s*(script|foreignObject|image|iframe)\b|(?:javascript:|data:|(?:xlink:)?href\s*=\s*["'](?:https?:|\/\/))/i);
      for (const part of art.parts) {
        expect(part.references.length, `${item.id}/${part.id}`).toBeGreaterThan(0);
        expect(primary, `${item.id}/${part.id}: parte sem marca no desenho`).toContain(`id="part-${part.id}"`);
        expect(part.highlight, `${item.id}/${part.id}: ponto ausente`).toBeDefined();
        expect(part.highlight!.x, part.id).toBeGreaterThanOrEqual(0);
        expect(part.highlight!.y, part.id).toBeGreaterThanOrEqual(0);
        expect(part.highlight!.x + part.highlight!.width, part.id).toBeLessThanOrEqual(100);
        expect(part.highlight!.y + part.highlight!.height, part.id).toBeLessThanOrEqual(100);
      }
      for (const step of item.storySteps ?? [])
        expect(art.parts.some(part => part.id === step.placeId), `${item.id}/${step.placeId}`).toBe(true);
      for (const dimension of art.dimensions) {
        expect(dimension.reference.book, item.id).toBeTruthy();
        expect(dimension.reference.verseStart, item.id).toBeGreaterThan(0);
        if (dimension.cubits !== undefined)
          expect(cubitsToMeters(dimension.cubits)).toBeCloseTo(dimension.cubits * 0.45, 2);
      }
      for (const view of art.views ?? []) {
        const svg = fs.readFileSync(path.join(root, "svg", view.svgFile), "utf8");
        expect(XMLValidator.validate(svg), `${item.id}/${view.label}: SVG inválido`).toBe(true);
        expect(svg, `${item.id}/${view.label}: viewBox ausente`).toMatch(/<svg\b[^>]*viewBox=/);
        expect(svg, `${item.id}/${view.label}: recurso externo ou ativo proibido`)
          .not.toMatch(/<\s*(script|foreignObject|image|iframe)\b|(?:javascript:|data:|(?:xlink:)?href\s*=\s*["'](?:https?:|\/\/))/i);
        if (art.dimensions.every(dimension => dimension.cubits === undefined))
          expect(svg, item.id).not.toMatch(/\d+(?:[.,]\d+)?\s*(?:côvados?|metros?)/i);
      }
    }
    const base = entries[8].illustration!;
    expect(base.views?.some(view => /explodid/i.test(view.label)), "vista explodida da base").toBe(true);
  });

  it("keeps exact Temple measurements, arithmetic and textual divergences visible with both references", () => {
    const read = (id: string) => atlasItemSchema.parse(JSON.parse(fs.readFileSync(path.join(root, "illustrations", `${id}.json`), "utf8")));
    const plan = read("solomon-temple-plan");
    const comparison = read("tabernacle-temple-comparison");
    const width = plan.illustration!.dimensions.find(d => d.label === "Pórtico — largura");
    const depth = plan.illustration!.dimensions.find(d => d.label === "Pórtico — profundidade");
    const holyPlace = plan.illustration!.dimensions.find(d => d.label === "Lugar Santo — comprimento");
    const debir = plan.illustration!.dimensions.find(d => d.label === "Santo dos Santos — comprimento, largura e altura");
    expect([width?.cubits, depth?.cubits]).toEqual([20, 10]);
    expect([width?.reference, depth?.reference].every(ref => ref?.book === "1Kgs" && ref.chapter === 6 && ref.verseStart === 3)).toBe(true);
    expect(holyPlace?.cubits).toBe(40);
    expect(holyPlace?.reference).toMatchObject({ book: "1Kgs", chapter: 6, verseStart: 17 });
    expect(debir?.cubits).toBe(20);
    expect(debir?.reference).toMatchObject({ book: "1Kgs", chapter: 6, verseStart: 20 });
    expect(plan.illustration?.dimensions.find(d => /Câmaras — larguras/.test(d.label))?.reportedValue).toBe("5 / 6 / 7 côvados");
    const overview = read("solomon-temple-overview");
    expect(overview.illustration?.dimensions.filter(d => d.reference.book === "1Kgs" && d.reference.chapter === 6 && d.reference.verseStart === 2).map(d => d.cubits))
      .toEqual(expect.arrayContaining([60, 20, 30]));
    expect(holyPlace!.cubits! + debir!.cubits!).toBe(60); // só hekal + debir = comprimento da casa (1Rs 6:2).
    expect(depth!.cubits! + holyPlace!.cubits! + debir!.cubits!).toBe(70); // sequência axial esquemática, sem paredes.
    expect(plan.illustration!.notes.join(" ")).toMatch(/10 \+ .*40 \+ .*20 = 70.*antes de considerar espessuras de parede/);
    expect(comparison.summary).toMatch(/40 \+ 20 = 60/);
    expect(comparison.illustration!.notes.join(" ")).toMatch(/pórtico.*20×10.*fora dessa soma/i);
    expect(`${plan.summary} ${plan.modernSummary} ${comparison.summary} ${comparison.illustration!.notes.join(" ")}`)
      .not.toMatch(/20\s*\+\s*40\s*\+\s*20\s*=\s*60/);
    const porch = read("solomon-temple-porch");
    expect(porch.illustration?.dimensions.some(d => d.cubits === 120 && d.reference.book === "2Chr" && d.reference.chapter === 3 && d.reference.verseStart === 4)).toBe(true);
    expect(porch.illustration?.dimensions.some(d => d.cubits === undefined && d.reference.book === "1Kgs" && d.reference.chapter === 6 && d.reference.verseStart === 3)).toBe(true);
    const pillars = read("solomon-temple-jachin-boaz");
    const values = pillars.illustration!.dimensions.map(d => `${d.cubits}:${d.reference.book}:${d.reference.chapter}:${d.reference.verseStart}`);
    expect(values).toEqual(expect.arrayContaining(["18:1Kgs:7:15", "35:2Chr:3:15", "5:1Kgs:7:16", "3:2Kgs:25:17"]));
    const columnText = JSON.stringify(pillars);
    for (const excerpt of ["200", "100", "96", "1Rs 7:20", "2Cr 3:16", "Jr 52:23", "divergência textual"])
      expect(columnText, excerpt).toContain(excerpt);
    const sea = read("solomon-temple-bronze-sea");
    const seaText = JSON.stringify(sea);
    for (const excerpt of ["2.000", "3.000", "1Rs 7:26", "2Cr 4:5", "divergência textual"])
      expect(seaText, excerpt).toContain(excerpt);
    expect(sea.illustration?.dimensions.filter(d => /Capacidade/.test(d.label)).map(d => [d.reportedValue, d.reference.book]))
      .toEqual([["2.000 batos", "1Kgs"], ["3.000 batos", "2Chr"]]);
    expect(read("solomon-temple-lavers").illustration?.dimensions.find(d => /Capacidade/.test(d.label))?.reportedValue).toBe("40 batos");
    expect(read("solomon-temple-courts").illustration!.dimensions.every(d => d.cubits === undefined)).toBe(true);
    expect(read("solomon-temple-bronze-altar").illustration!.dimensions.map(d => d.cubits)).toEqual([20, 20, 10]);
  });
});