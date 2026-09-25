import fs from "node:fs/promises";
import path from "node:path";
import { atlasItemSchema, atlasContextSchema, ATLAS_CUBIT_NOTE, cubitsToMeters, type AtlasItem, type AtlasSummary } from "../../shared/atlas";
import { atlasBookLabel, formatAtlasReference } from "../../shared/atlasBooks";

const roots = [
  path.resolve(process.cwd(), "data/atlas"),
  path.resolve(process.cwd(), "dist/data/atlas"),
];
export class AtlasError extends Error {
  constructor(public status: number, message: string, public code: string) { super(message); }
}

async function atlasFiles(folder: string): Promise<{ root: string; files: string[] }> {
  for (const candidate of roots) {
    try {
      const files = (await fs.readdir(path.join(candidate, folder)))
        .filter(file => file.endsWith(".json")).sort();
      if (files.length > 0) return { root: candidate, files };
    } catch (error: any) {
      if (error?.code !== "ENOENT") console.error(`[Atlas] Não foi possível ler ${candidate}/${folder}:`, error);
    }
  }
  return { root: roots[0], files: [] };
}

export async function loadAtlasCatalog(): Promise<AtlasItem[]> {
  const groups = await Promise.all(["maps", "illustrations"].map(async (folder) => {
    const location = await atlasFiles(folder);
    const { root, files } = location;
    const items: AtlasItem[] = [];
    for (const file of files) {
      try {
        const item = atlasItemSchema.parse(JSON.parse(await fs.readFile(path.join(root, folder, file), "utf8")));
        if (item.version !== "1" || (item.kind === "illustration" && !item.illustration)) {
          throw new Error(`versão ou ilustração inválida: ${item.id}`);
        }
        items.push(item);
      } catch (error) {
        console.error(`[Atlas] Arquivo inválido ignorado: data/atlas/${folder}/${file}`, error);
      }
    }
    return items;
  }));
  const items = groups.flat();
  if (new Set(items.map(item => item.id)).size !== items.length) {
    console.error("[Atlas] IDs duplicados encontrados; mantendo a primeira ocorrência.");
    return items.filter((item, index, all) => all.findIndex(candidate => candidate.id === item.id) === index);
  }
  return items;
}

export function atlasSummary(item: AtlasItem, fullAccess: boolean): AtlasSummary {
  const { id, version, kind, category, testament, books, characters, period, title, subtitle, certainty, sample, keywords, section, subsection, order, era, modernOverview, keyReferences, aliases } = item;
  return { id, version, kind, category, testament, books, characters, period, title, subtitle, certainty, sample, keywords, section, subsection, order, era, modernOverview, keyReferences, aliases, locked: !fullAccess && !sample };
}

export async function getAtlasItem(id: string, fullAccess: boolean): Promise<AtlasItem> {
  const item = (await loadAtlasCatalog()).find(item => item.id === id);
  if (!item) throw new AtlasError(404, "Item do Atlas não encontrado.", "ATLAS_NOT_FOUND");
  if (!fullAccess && !item.sample) throw new AtlasError(403, "Este item requer Gold, Premium ou degustação ativa.", "ATLAS_LOCKED");
  return item;
}

export async function readAtlasSvg(id: string, fullAccess: boolean, view?: string): Promise<string> {
  const item = await getAtlasItem(id, fullAccess);
  if (!item.illustration) throw new AtlasError(404, "Ilustração não encontrada.", "ATLAS_NOT_FOUND");
  const svgFile = view === undefined ? item.illustration.svgFile : item.illustration.views?.find(candidate => candidate.label === view)?.svgFile;
  if (!svgFile) throw new AtlasError(404, "Vista não encontrada.", "ATLAS_NOT_FOUND");
  for (const candidate of roots) {
    try {
      return await fs.readFile(path.join(candidate, "svg", svgFile), "utf8");
    } catch (error: any) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
  throw new AtlasError(404, "SVG da ilustração não encontrado.", "ATLAS_NOT_FOUND");
}

export async function buildAtlasContext(input: unknown, fullAccess: boolean): Promise<string> {
  const parsed = atlasContextSchema.safeParse(input);
  if (!parsed.success) throw new AtlasError(400, "Contexto do Atlas inválido.", "ATLAS_INVALID_CONTEXT");
  const request = parsed.data;
  const item = await getAtlasItem(request.itemId, fullAccess);
  if (request.version !== item.version) throw new AtlasError(409, "Versão do Atlas desatualizada. Reabra o item.", "ATLAS_STALE_VERSION");
  const selected = request.selectedPlaceId === undefined ? undefined : item.places.find(place => place.id === request.selectedPlaceId);
  if (request.selectedPlaceId !== undefined && !selected) throw new AtlasError(400, "Local selecionado não pertence ao item.", "ATLAS_INVALID_PLACE");
  const context = JSON.stringify({
    id: item.id, version: item.version, title: item.title, mode: request.mode,
    summary: item.summary, purpose: item.purpose, modernSummary: item.modernSummary, period: item.period,
    section: item.section, subsection: item.subsection, order: item.order, era: item.era,
    modernOverview: item.modernOverview, keyReferences: item.keyReferences, aliases: item.aliases,
    certainty: item.certainty, references: item.references, sources: item.sources,
    places: selected ? [selected] : item.places, overlays: item.overlays,
    review: item.review,
    storySteps: selected ? item.storySteps?.filter(step => step.placeId === selected.id) : item.storySteps,
    curiosities: item.curiosities,
    illustration: item.illustration && {
      notes: item.illustration.notes, cubitNote: ATLAS_CUBIT_NOTE,
      parts: item.illustration.parts,
      dimensions: item.illustration.dimensions.map(dimension => ({
        ...dimension, approximateMeters: dimension.cubits === undefined ? undefined : cubitsToMeters(dimension.cubits),
      })),
    },
  }, (_key, value) => {
    if (value && typeof value === "object" && typeof value.book === "string" &&
        typeof value.chapter === "number" && typeof value.verseStart === "number") {
      return { ...value, book: atlasBookLabel(value.book), label: formatAtlasReference(value) };
    }
    return value;
  });
  // Never silently truncate references or uncertainty; fail explicitly instead.
  if (context.length > 40000) throw new AtlasError(413, "Contexto do Atlas muito extenso; selecione um local.", "ATLAS_CONTEXT_TOO_LARGE");
  return context;
}