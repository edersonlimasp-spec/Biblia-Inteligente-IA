import fs from "node:fs/promises";
import path from "node:path";
import { atlasItemSchema, atlasContextSchema, ATLAS_CUBIT_NOTE, cubitsToMeters, type AtlasItem, type AtlasSummary } from "../../shared/atlas";

const root = path.resolve(process.cwd(), "data/atlas");
export class AtlasError extends Error {
  constructor(public status: number, message: string, public code: string) { super(message); }
}

export async function loadAtlasCatalog(): Promise<AtlasItem[]> {
  const groups = await Promise.all(["maps", "illustrations"].map(async (folder) => {
    const files = (await fs.readdir(path.join(root, folder))).filter(file => file.endsWith(".json")).sort();
    return Promise.all(files.map(async file => {
      const item = atlasItemSchema.parse(JSON.parse(await fs.readFile(path.join(root, folder, file), "utf8")));
      if (item.version !== "1" || (item.kind === "illustration" && !item.illustration)) {
        throw new Error(`Invalid shipped atlas item: ${item.id}`);
      }
      return item;
    }));
  }));
  const items = groups.flat();
  if (new Set(items.map(item => item.id)).size !== items.length) throw new Error("Duplicate atlas IDs");
  return items;
}

export function atlasSummary(item: AtlasItem, fullAccess: boolean): AtlasSummary {
  const { id, version, kind, category, testament, books, characters, period, title, subtitle, certainty, sample, keywords } = item;
  return { id, version, kind, category, testament, books, characters, period, title, subtitle, certainty, sample, keywords, locked: !fullAccess && !sample };
}

export async function getAtlasItem(id: string, fullAccess: boolean): Promise<AtlasItem> {
  const item = (await loadAtlasCatalog()).find(item => item.id === id);
  if (!item) throw new AtlasError(404, "Item do Atlas não encontrado.", "ATLAS_NOT_FOUND");
  if (!fullAccess && !item.sample) throw new AtlasError(403, "Este item requer Gold, Premium ou degustação ativa.", "ATLAS_LOCKED");
  return item;
}

export async function readAtlasSvg(id: string, fullAccess: boolean): Promise<string> {
  const item = await getAtlasItem(id, fullAccess);
  if (item.kind !== "illustration" || !item.illustration) throw new AtlasError(404, "Ilustração não encontrada.", "ATLAS_NOT_FOUND");
  return fs.readFile(path.join(root, "svg", item.illustration.svgFile), "utf8");
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
    summary: item.summary, modernSummary: item.modernSummary, period: item.period,
    certainty: item.certainty, references: item.references, sources: item.sources,
    places: selected ? [selected] : item.places, overlays: item.overlays,
    review: item.review,
    illustration: item.illustration && {
      notes: item.illustration.notes, cubitNote: ATLAS_CUBIT_NOTE,
      dimensions: item.illustration.dimensions.map(dimension => ({
        ...dimension, approximateMeters: dimension.cubits === undefined ? undefined : cubitsToMeters(dimension.cubits),
      })),
    },
  });
  // Never silently truncate references or uncertainty; fail explicitly instead.
  if (context.length > 40000) throw new AtlasError(413, "Contexto do Atlas muito extenso; selecione um local.", "ATLAS_CONTEXT_TOO_LARGE");
  return context;
}