import type { AtlasReference } from "./atlas";

/** OSIS identifiers are kept for Bible navigation; every visible label is Portuguese. */
export const ATLAS_BOOK_NAMES: Record<string, string> = {
  Gen: "Gênesis", Exod: "Êxodo", Lev: "Levítico", Num: "Números", Deut: "Deuteronômio",
  Josh: "Josué", Judg: "Juízes", Ruth: "Rute", "1Sam": "1 Samuel", "2Sam": "2 Samuel",
  "1Kgs": "1 Reis", "2Kgs": "2 Reis", "1Chr": "1 Crônicas", "2Chr": "2 Crônicas",
  Ezra: "Esdras", Neh: "Neemias", Esth: "Ester", Job: "Jó", Ps: "Salmos",
  Prov: "Provérbios", Eccl: "Eclesiastes", Song: "Cântico dos Cânticos", Isa: "Isaías",
  Jer: "Jeremias", Lam: "Lamentações", Ezek: "Ezequiel", Dan: "Daniel", Hos: "Oseias",
  Joel: "Joel", Amos: "Amós", Obad: "Obadias", Jonah: "Jonas", Mic: "Miqueias",
  Nah: "Naum", Hab: "Habacuque", Zeph: "Sofonias", Hag: "Ageu", Zech: "Zacarias",
  Mal: "Malaquias", Matt: "Mateus", Mark: "Marcos", Luke: "Lucas", John: "João",
  Acts: "Atos", Rom: "Romanos", "1Cor": "1 Coríntios", "2Cor": "2 Coríntios",
  Gal: "Gálatas", Eph: "Efésios", Phil: "Filipenses", Col: "Colossenses",
  "1Thess": "1 Tessalonicenses", "2Thess": "2 Tessalonicenses", "1Tim": "1 Timóteo",
  "2Tim": "2 Timóteo", Titus: "Tito", Phlm: "Filemom", Heb: "Hebreus",
  Jas: "Tiago", "1Pet": "1 Pedro", "2Pet": "2 Pedro", "1John": "1 João",
  "2John": "2 João", "3John": "3 João", Jude: "Judas", Rev: "Apocalipse",
};

/** Historical source, deliberately not included among the 66 navigable Bible books. */
export const ATLAS_HISTORICAL_BOOK_NAMES: Record<string, string> = { "1Macc": "1 Macabeus" };
export const atlasBookLabel = (code: string) => ATLAS_BOOK_NAMES[code] ?? ATLAS_HISTORICAL_BOOK_NAMES[code] ?? code;
export const formatAtlasReference = (ref: AtlasReference) =>
  `${atlasBookLabel(ref.book)} ${ref.chapter}:${ref.verseStart}${ref.verseEnd && ref.verseEnd !== ref.verseStart ? `-${ref.verseEnd}` : ""}`;