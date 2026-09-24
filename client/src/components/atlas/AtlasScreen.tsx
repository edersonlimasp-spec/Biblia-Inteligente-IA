import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { AtlasItem, AtlasSummary } from "@shared/atlas";
import { ATLAS_CERTAINTY_LABELS } from "@shared/atlas";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest, ApiError } from "@/lib/queryClient";
import { AtlasDetail } from "./AtlasDetail";
import { searchAtlas } from "./atlasSearch";
import "./atlas.css";

interface AtlasScreenProps {
  onBack: () => void;
  onSubscribe: () => void;
  onLogin: () => void;
  navigateToVerse?: (book: string, chapter: number, verse?: number) => void;
}

const filters = {
  books: "Livro", period: "Período", characters: "Personagem", category: "Categoria", kind: "Tipo",
} as const;
const displayValue = (value: string) =>
  ({ AT: "Antigo Testamento", NT: "Novo Testamento", map: "Mapa", illustration: "Ilustração",
    "old-testament":"Antigo Testamento", "intertestamental":"Intertestamental", "new-testament":"Novo Testamento",
    jerusalem:"Jerusalém", tabernacle:"Tabernáculo", "solomon-temple":"Templo de Salomão", "physical-geography":"Geografia física" }[value] ?? value);
const sectionOrder = ["old-testament", "intertestamental", "new-testament", "jerusalem", "tabernacle", "solomon-temple", "physical-geography"];
const subsectionOrder = [
  "Origens e patriarcas", "Êxodo e deserto", "Conquista e juízes", "Reino unido",
  "Reino dividido", "Impérios e exílio", "Retorno", "Vida de Jesus", "Igreja primitiva",
  "Viagens de Paulo", "Epístolas e Apocalipse",
];
type AtlasCatalogEntry = AtlasSummary & { section?: string; era?: string; aliases?: string[] };

export function AtlasScreen({ onBack, onSubscribe, onLogin, navigateToVerse }: AtlasScreenProps) {
  const { user, isLoading } = useAuth();
  const cache = useQueryClient();
  const identity = user?.id ?? "guest";
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<Record<string, string>>({});
  const [onlyAccessible, setOnlyAccessible] = useState(false);
  const [selectedId, setSelectedId] = useState<string>();
  useEffect(() => {
    setSelectedId(undefined);
    // Cancel and discard the previous identity's private data, including pending requests.
    return () => {
      void cache.cancelQueries({ queryKey: ["atlas", identity] });
      cache.removeQueries({ queryKey: ["atlas", identity] });
    };
  }, [identity, cache]);
  const catalog = useQuery({
    queryKey: ["atlas", identity, "catalog"], enabled: !isLoading,
    queryFn: async () => (await apiRequest("GET", "/api/atlas/catalog")).json() as Promise<{ items: AtlasSummary[]; fullAccess: boolean }>,
    staleTime: 0, gcTime: 0,
  });
  const detail = useQuery({
    queryKey: ["atlas", identity, "item", selectedId],
    queryFn: async () => (await apiRequest("GET", `/api/atlas/items/${selectedId}`)).json() as Promise<AtlasItem>,
    enabled: !!selectedId && !isLoading, retry: false, staleTime: 0, gcTime: 0,
  });
  const items = (catalog.data?.items ?? []) as AtlasCatalogEntry[];
  const filtered = useMemo(() => searchAtlas(items, query).filter(item =>
    (!onlyAccessible || !item.locked || !!catalog.data?.fullAccess) &&
    Object.entries(active).every(([key, value]) => {
      const field = (item as AtlasSummary & Record<string, unknown>)[key];
      return !value || (Array.isArray(field) ? field.includes(value) : field === value);
    }),
  ), [items, query, active, onlyAccessible, catalog.data?.fullAccess]);
  const open = (id: string) => {
    const item = items.find(entry => entry.id === id);
    if (item?.locked && !catalog.data?.fullAccess) {
      user ? onSubscribe() : onLogin();
    } else setSelectedId(id);
  };
  const grouped = useMemo(() => {
    const groups = new Map<string, Map<string, AtlasCatalogEntry[]>>();
    filtered.forEach(item => {
      const section = item.section ?? (item.testament === "AT" ? "old-testament" : "new-testament");
      const era = item.subsection ?? item.era ?? (item.testament === "AT" ? "Antigo Testamento" : "Novo Testamento");
      if (!groups.has(section)) groups.set(section, new Map());
      const eras = groups.get(section)!;
      if (!eras.has(era)) eras.set(era, []);
      eras.get(era)!.push(item);
    });
    return sectionOrder.filter(section => groups.has(section)).map(section => ({ section, eras: groups.get(section)! }));
  }, [filtered]);
  const upcomingSections = useMemo(() => import.meta.env.DEV && !query && !Object.values(active).some(Boolean)
    ? sectionOrder.filter(section => !grouped.some(group => group.section === section))
    : [], [grouped, query, active]);
  const status = detail.error instanceof ApiError ? detail.error.status : undefined;
  return (
    <main className="atlas-root">
      <div className="atlas-shell">
        <header className="atlas-header">
          <button className="atlas-back" onClick={() => selectedId ? setSelectedId(undefined) : onBack()} aria-label={selectedId ? "Voltar ao catálogo" : "Voltar"}>‹</button>
          <div><div className="atlas-kicker">Estudo visual</div><h1>Atlas bíblico</h1></div>
          {!selectedId && <div className="atlas-header-controls">
            <input className="atlas-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Busque: êxodo, Jerusalém, Paulo…" aria-label="Buscar no atlas" />
            <div className="atlas-chips" aria-label="Seções do Atlas">
              {sectionOrder.filter(section => import.meta.env.DEV || items.some(item => item.section === section)).map(section =>
                <button key={section} className="atlas-chip" aria-pressed={active.section === section} onClick={() => setActive(previous => ({ ...previous, section: previous.section === section ? "" : section }))}>{displayValue(section)}</button>)}
            </div>
            <div className="atlas-header-filters">
              <span>Testamento:</span>
              {(["AT", "NT"] as const).map(value => <button key={value} className="atlas-chip" aria-pressed={active.testament === value} onClick={() => setActive(previous => ({ ...previous, testament: previous.testament === value ? "" : value }))}>{value}</button>)}
              <label>Época <select value={active.era ?? ""} onChange={event => setActive(previous => ({ ...previous, era: event.target.value }))}>
                <option value="">Todas</option>
                {Array.from(new Set(items.map(item => item.era))).sort().map(era => <option key={era} value={era}>{era}</option>)}
              </select></label>
              <button className="atlas-chip" aria-pressed={onlyAccessible} onClick={() => setOnlyAccessible(value => !value)}>Só disponíveis para mim</button>
            </div>
          </div>}
        </header>
        {isLoading || catalog.isLoading ? <div className="atlas-loading">Carregando o catálogo de mapas…</div>
          : catalog.isError ? <div className="atlas-error" role="alert">Não foi possível carregar o atlas. <button className="atlas-button" onClick={() => catalog.refetch()}>Tentar novamente</button></div>
          : !selectedId ? (
             <div className="atlas-catalogue">
              <aside className="atlas-panel atlas-controls">
                 {Object.entries(filters).map(([key, label]) => (
                  <fieldset className="atlas-filter" key={key}>
                    <legend className="atlas-filter-title">{label}</legend>
                    <div className="atlas-chips">
                      {Array.from(new Set(items.flatMap(item => {
                        const field = item[key as keyof typeof filters];
                      return Array.isArray(field) ? field : [field];
                      }))).filter((value): value is string => typeof value === "string" && value.length > 0).sort().map(value => (
                        <button key={value} className="atlas-chip" aria-pressed={active[key] === value} onClick={() => setActive(previous => ({ ...previous, [key]: previous[key] === value ? "" : value }))}>{displayValue(value)}</button>
                      ))}
                    </div>
                  </fieldset>
                ))}
              </aside>
               <section aria-live="polite">
                 <div className="atlas-catalogue-heading"><div><div className="atlas-kicker">Catálogo histórico</div><h2>Evidência antes de certeza</h2></div><span className="atlas-count">{filtered.length} estudo{filtered.length === 1 ? "" : "s"}</span></div>
                 <div className="atlas-panel atlas-results">
                 {filtered.length ? grouped.map(group => (
                   <section className="atlas-section-group" key={group.section}>
                     <div className="atlas-group-heading"><span className="atlas-kicker">{displayValue(group.section)}</span><span className="atlas-group-rule" /></div>
                     {Array.from(group.eras.entries()).sort(([a], [b]) => (subsectionOrder.indexOf(a) < 0 ? 999 : subsectionOrder.indexOf(a)) - (subsectionOrder.indexOf(b) < 0 ? 999 : subsectionOrder.indexOf(b))).map(([era, eraItems]) => <div key={era}>
                       <h3 className="atlas-era-heading">{displayValue(era)}</h3>
                       {[...eraItems].sort((a, b) => a.order - b.order).map(item => (
                  <button className="atlas-card" key={item.id} onClick={() => open(item.id)}>
                    <span className="atlas-kind">{displayValue(item.kind)}</span>
                    <span><span className="atlas-card-title">{item.title}</span><span className="atlas-card-sub">{item.subtitle} · {item.period}</span></span>
                    {item.locked && !catalog.data?.fullAccess ? <span className="atlas-lock">Assinatura</span> : <span className={`atlas-badge ${item.sample ? "sample" : item.certainty}`}>{item.sample ? "Amostra grátis" : ATLAS_CERTAINTY_LABELS[item.certainty]}</span>}
                  </button>
                       ))}
                     </div>)}
                   </section>
                 )) : <div className="atlas-empty">Nenhum resultado. Tente um lugar, personagem ou livro.</div>}
                 {upcomingSections.map(section => <section className="atlas-section-group atlas-upcoming" key={section}>
                   <div className="atlas-group-heading"><span className="atlas-kicker">{displayValue(section)}</span><span className="atlas-group-rule" /></div>
                   <div className="atlas-empty">Em breve · conteúdo em revisão editorial.</div>
                 </section>)}
                 </div>
              </section>
            </div>
          ) : detail.isLoading ? <div className="atlas-loading">Abrindo a ficha histórica…</div>
            : detail.isError ? (
              <div className="atlas-error" role="alert">
                <p>{status === 401 ? "Entre na sua conta para continuar." : status === 403 ? "Este conteúdo exige uma assinatura ativa." : status === 404 ? "Esta ficha não foi encontrada." : "Não foi possível carregar esta ficha."}</p>
                {status === 401 ? <button className="atlas-button" onClick={onLogin}>Entrar</button> : status === 403 ? <button className="atlas-button" onClick={onSubscribe}>Ver planos</button> : <button className="atlas-button" onClick={() => detail.refetch()}>Tentar novamente</button>}
                <button className="atlas-chip" onClick={() => setSelectedId(undefined)}>Voltar ao catálogo</button>
              </div>
             ) : detail.data ? <AtlasDetail key={`${identity}:${detail.data.id}`} item={detail.data} items={items} onSelect={open} onBack={() => setSelectedId(undefined)} onLogin={onLogin} onSubscribe={onSubscribe} navigateToVerse={navigateToVerse} /> : null}
      </div>
    </main>
  );
}