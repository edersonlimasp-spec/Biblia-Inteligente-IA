import type { AtlasSummary } from "@shared/atlas";

const aliases: Record<string, string[]> = {
  jerusalem: ["jerusalém", "siao", "sião", "cidade de davi"],
  egypt: ["egito", "egípcios", "nilo"],
  exodus: ["êxodo", "saida do egito", "saída do egito", "moises", "moisés"],
  paul: ["paulo", "viagens missionarias", "viagens missionárias", "apostolo"],
  tabernacle: ["tabernáculo", "tabernaculo", "santuario", "santuário", "arca"],
  galilee: ["galileia", "galiléia", "nazare", "nazaré", "cafarnaum"],
};

export function normalizeAtlasText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

export function searchAtlas(items: AtlasSummary[], query: string): AtlasSummary[] {
  const words = normalizeAtlasText(query).split(/\s+/).filter(Boolean);
  if (!words.length) return items;
  return items
    .map((item) => {
      const haystack = normalizeAtlasText([
        item.title, item.subtitle, item.category, item.period, item.testament,
        ...item.books, ...item.characters, ...item.keywords,
        ...((item as AtlasSummary & { aliases?: string[] }).aliases ?? []),
      ].join(" "));
      const score = words.reduce((total, word) => {
        const expanded = Object.entries(aliases).find(([key, values]) =>
          normalizeAtlasText(key) === word || values.some((value) => normalizeAtlasText(value).includes(word)),
        );
        const candidates = expanded
          ? [normalizeAtlasText(expanded[0]), ...expanded[1].map(normalizeAtlasText)]
          : [word];
        return total + (candidates.some((candidate) => haystack.includes(candidate)) ? 1 : 0);
      }, 0);
      return { item, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title, "pt-BR"))
    .map(({ item }) => item);
}