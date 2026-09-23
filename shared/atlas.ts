import { z } from "zod";

export const atlasReferenceSchema = z.object({
  book: z.string().min(2), chapter: z.number().int().positive(),
  verseStart: z.number().int().positive(), verseEnd: z.number().int().positive().optional(),
  label: z.string().min(3),
});
export const atlasSourceSchema = z.object({
  id: z.string().min(1), title: z.string().min(3), url: z.string().url(),
  license: z.string().min(1), note: z.string().min(1),
});
export const atlasCertaintySchema = z.enum(["established", "probable", "debated", "unknown"]);
export const atlasPlaceSchema = z.object({
  id: z.string(), name: z.string(), modernName: z.string().min(1),
  coordinates: z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]).nullable(),
  certainty: atlasCertaintySchema, explanation: z.string().min(10),
  references: z.array(atlasReferenceSchema).min(1), sourceIds: z.array(z.string()).min(1),
});
export const atlasDimensionSchema = z.object({
  label: z.string(), cubits: z.number().positive().optional(),
  note: z.string().min(1), reference: atlasReferenceSchema,
});
export const atlasOverlaySchema = z.object({
  id: z.string(), label: z.string(), kind: z.enum(["route", "area"]),
  certainty: atlasCertaintySchema,
  coordinates: z.array(z.tuple([z.number(), z.number()])).min(2),
  explanation: z.string().min(10), sourceIds: z.array(z.string()).min(1),
});
export const atlasItemSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/), version: z.string().min(1),
  kind: z.enum(["map", "illustration"]), category: z.string(),
  testament: z.enum(["AT", "NT"]), books: z.array(z.string()).min(1),
  characters: z.array(z.string()), period: z.string().min(1),
  title: z.string().min(3), subtitle: z.string(), summary: z.string().min(20),
  modernSummary: z.string().min(10), certainty: atlasCertaintySchema,
  sample: z.boolean(), keywords: z.array(z.string()),
  references: z.array(atlasReferenceSchema).min(1),
  sources: z.array(atlasSourceSchema).min(1),
  places: z.array(atlasPlaceSchema), overlays: z.array(atlasOverlaySchema),
  bounds: z.tuple([z.number(), z.number(), z.number(), z.number()]),
  illustration: z.object({
    svgFile: z.string().regex(/^[a-z0-9-]+\.svg$/),
    dimensions: z.array(atlasDimensionSchema), notes: z.array(z.string()).min(1),
    relatedIds: z.array(z.string()),
  }).optional(),
  review: z.object({
    date: z.string(), status: z.enum(["documented", "needs-specialist"]),
    verified: z.array(z.string()).min(1), uncertainties: z.array(z.string()),
    methodology: z.string().min(10),
  }),
});
export type AtlasItem = z.infer<typeof atlasItemSchema>;
export type AtlasPlace = z.infer<typeof atlasPlaceSchema>;
export type AtlasReference = z.infer<typeof atlasReferenceSchema>;
export type AtlasSummary = Pick<AtlasItem, "id" | "version" | "kind" | "category" | "testament" | "books" | "characters" | "period" | "title" | "subtitle" | "certainty" | "sample" | "keywords"> & { locked: boolean };
export const atlasContextSchema = z.object({
  itemId: z.string().regex(/^[a-z0-9-]+$/), version: z.string().max(40),
  selectedPlaceId: z.string().max(80).optional(),
  mode: z.enum(["ancient", "modern"]),
}).strict();
export type AtlasContextRequest = z.infer<typeof atlasContextSchema>;
export const cubitsToMeters = (cubits: number) => Math.round(cubits * 0.45 * 1000) / 1000;
export const ATLAS_CUBIT_NOTE = "Conversão aproximada: côvado comum ≈ 0,45 m. O côvado real/longo é frequentemente estimado em ≈ 0,52 m (Ez 40:5); 2Cr 3:3 menciona a medida antiga, sem definir uma equivalência métrica exata.";
export const ATLAS_CERTAINTY_LABELS = {
  established: "Identificação bem estabelecida", probable: "Localização provável",
  debated: "Localização debatida", unknown: "Localização desconhecida",
} as const;