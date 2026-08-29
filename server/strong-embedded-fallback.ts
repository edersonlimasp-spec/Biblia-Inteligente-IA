import { STRONG_DATA } from "./strong-data-embedded";

type RawStrongEntry = {
  id?: string;
  strongNumber?: string;
  strong_number?: string;
  language?: string;
  lemma?: string;
  translit?: string | null;
  xlit?: string | null;
  pron?: string | null;
  kjvDef?: string | null;
  kjv_def?: string | null;
  portugueseDef?: string | null;
  portuguese_def?: string | null;
  strongsDef?: string | null;
  strongs_def?: string | null;
  derivation?: string | null;
  extendedDefinition?: string | null;
  extended_definition?: string | null;
};

export type EmbeddedStrongEntry = {
  id?: string;
  strongNumber: string;
  language: string;
  lemma: string;
  translit: string | null;
  xlit: string | null;
  pron: string | null;
  kjvDef: string | null;
  portugueseDef: string | null;
  strongsDef: string | null;
  derivation: string | null;
  extendedDefinition: string | null;
};

let embeddedStrongIndex: Map<string, RawStrongEntry> | null = null;

function getEmbeddedEntries(): RawStrongEntry[] {
  const data = STRONG_DATA as unknown;
  if (Array.isArray(data)) return data as RawStrongEntry[];
  if (
    data &&
    typeof data === "object" &&
    Array.isArray((data as { entries?: unknown }).entries)
  ) {
    return (data as { entries: RawStrongEntry[] }).entries;
  }
  return [];
}

function getEmbeddedStrongIndex(): Map<string, RawStrongEntry> {
  if (embeddedStrongIndex) return embeddedStrongIndex;

  embeddedStrongIndex = new Map();
  for (const entry of getEmbeddedEntries()) {
    const number = entry.strongNumber ?? entry.strong_number;
    if (number) embeddedStrongIndex.set(number.toUpperCase(), entry);
  }
  return embeddedStrongIndex;
}

export function findEmbeddedStrongEntry(strongNumber: string): EmbeddedStrongEntry | null {
  const normalizedNumber = strongNumber.trim().toUpperCase();
  const entry = getEmbeddedStrongIndex().get(normalizedNumber);
  if (!entry || !entry.language || !entry.lemma) return null;

  return {
    id: entry.id,
    strongNumber: normalizedNumber,
    language: entry.language,
    lemma: entry.lemma,
    translit: entry.translit ?? null,
    xlit: entry.xlit ?? null,
    pron: entry.pron ?? null,
    kjvDef: entry.kjvDef ?? entry.kjv_def ?? null,
    portugueseDef: entry.portugueseDef ?? entry.portuguese_def ?? null,
    strongsDef: entry.strongsDef ?? entry.strongs_def ?? null,
    derivation: entry.derivation ?? null,
    extendedDefinition: entry.extendedDefinition ?? entry.extended_definition ?? null,
  };
}