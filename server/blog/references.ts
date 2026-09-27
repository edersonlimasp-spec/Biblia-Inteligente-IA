import { bibleBookNames } from "../../client/src/lib/bible-book-names";
import { blogPool } from "./db";

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

const names = new Map(Object.entries(bibleBookNames).map(([code, names]) => [normalize(names.pt), code]));
names.set("salmo", "psa");
names.set("salmos", "psa");
names.set("cantico dos canticos", "sng");
names.set("oseias", "hos");
names.set("miqueias", "mic");
const choices = Array.from(names.keys()).sort((a, b) => b.length - a.length);
const bookPattern = choices.map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
const references = new RegExp(`(^|[^a-z0-9])(${bookPattern})\\s+(\\d{1,3}):(\\d{1,3})(?:[-–](\\d{1,3}))?(?=$|[^\\d])`, "gi");

// Check chapter/verse existence against the app's Bible data, not model memory.
// This cannot verify theological interpretation or a quotation's exact wording;
// the admin must still review both before publication.
export async function validateBiblicalReferences(body: string): Promise<void> {
  const normalized = normalize(body);
  const found = Array.from(normalized.matchAll(references));
  // Full book names in Portuguese are required, not ambiguous abbreviations.
  const generic = normalized.match(/\b(?:[1-3]\s*)?[a-z]+\s+\d{1,3}:\d{1,3}(?:[-–]\d{1,3})?/g) ?? [];
  if (found.length < 2 || generic.length > found.length) {
    throw new Error("Referências bíblicas ausentes ou com nomes não reconhecidos; revise a geração.");
  }
  for (const match of found) {
    const code = names.get(match[2]);
    const chapter = Number(match[3]);
    const first = Number(match[4]);
    const last = match[5] ? Number(match[5]) : first;
    if (!code || chapter < 1 || first < 1 || last < first || last - first > 20) {
      throw new Error(`Referência bíblica inválida: ${match[0].trim()}`);
    }
    const checked = await blogPool.query(
      `SELECT count(DISTINCT verse)::int AS verses FROM bible_verses
        WHERE book=$1 AND chapter=$2 AND verse BETWEEN $3 AND $4`,
      [code, chapter, first, last],
    );
    if (checked.rows[0]?.verses !== last - first + 1) {
      throw new Error(`Versículos não encontrados na Bíblia do app: ${match[0].trim()}`);
    }
  }
}