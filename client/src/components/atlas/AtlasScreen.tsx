import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { AtlasItem, AtlasSummary } from "@shared/atlas";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest, ApiError } from "@/lib/queryClient";
import { AtlasDetail } from "./AtlasDetail";
import { searchAtlas } from "./atlasSearch";
import { atlasBookLabel } from "./atlasLabels";
import "./atlas-home.css";

interface AtlasScreenProps {
  onBack: () => void; onSubscribe: () => void; onLogin: () => void;
  navigateToVerse?: (book: string, chapter: number, verse?: number) => void;
}
type Entry = AtlasSummary & { section?: string; era?: string; aliases?: string[] };

const sectionLabels: Record<string, string> = {
  "old-testament": "Antigo Testamento", intertestamental: "Entre os Testamentos",
  "new-testament": "Novo Testamento", jerusalem: "Jerusalém",
  tabernacle: "Tabernáculo", "solomon-temple": "Templo de Salomão",
  "physical-geography": "Terra e lugares",
};
const collections = [
  ["old-testament", "Antigo Testamento", "Da criação ao exílio"],
  ["intertestamental", "Entre os Testamentos", "Impérios antes de Jesus"],
  ["jesus", "Vida de Jesus", "O mundo em que Jesus caminhou"],
  ["church", "Igreja primitiva e viagens de Paulo", "De Jerusalém até Roma"],
  ["epistles", "Epístolas e Apocalipse", "Cartas e igrejas no mapa"],
  ["jerusalem", "Jerusalém através do tempo", "A cidade onde a história se encontra"],
  ["tabernacle", "Tabernáculo", "Um espaço de encontro e adoração"],
  ["solomon-temple", "Templo de Salomão", "Medidas, partes e propósito"],
  ["physical-geography", "Geografia da Terra Santa", "Montes, rios e regiões"],
] as const;
const eras = ["Origens e patriarcas", "Êxodo e deserto", "Conquista e juízes", "Reino unido", "Reino dividido", "Impérios e exílio", "Retorno", "Vida de Jesus", "Igreja primitiva", "Viagens de Paulo", "Epístolas e Apocalipse"];
const timelineTargets = [
  ["Abraão", ["Origens e patriarcas"]],
  ["Êxodo", ["Êxodo e deserto"]],
  ["Reinos", ["Reino unido", "Reino dividido"]],
  ["Exílio", ["Impérios e exílio", "Retorno"]],
  ["Jesus", ["Vida de Jesus"]],
  ["João", ["Igreja primitiva", "Epístolas e Apocalipse"]],
] as const;
const rotatingSearches = ["Jerusalém", "Abraão", "Paulo", "o deserto", "João"];
const chronology = ["Origens e patriarcas", "Êxodo e deserto", "Conquista e juízes", "Reino unido", "Reino dividido", "Impérios e exílio", "Retorno"];
const datePattern = /(?:[IVX]+|[0-9]+)(?:º|o)?\s*(?:milênio|século|séc\.)\s*(?:a\.?\s*C\.?|d\.?\s*C\.?)?|(?:[0-9]{2,4})\s*a\.?\s*C\.?|(?:[0-9]{2,4})\s*d\.?\s*C\.?/i;
const shortDate = (value: string) => {
  const match = value.match(datePattern);
  return match?.[0]?.replace(/\s+/g, " ").trim() ?? "Data em debate";
};
const periodLabel = (era: string, period: string) => era.length <= 28 && datePattern.test(era) ? era : shortDate(period);
const stableCrop = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return `${18 + (hash % 68)}% ${18 + ((hash >>> 8) % 68)}%`;
};

export function AtlasScreen({ onBack, onSubscribe, onLogin, navigateToVerse }: AtlasScreenProps) {
  const { user, isLoading } = useAuth();
  const cache = useQueryClient();
  const identity = user?.id ?? "guest";
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string>();
  const [selectedCollection, setSelectedCollection] = useState<string>();
  const [testament, setTestament] = useState("");
  const [era, setEra] = useState("");
  const [book, setBook] = useState("");
  const [available, setAvailable] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [tutorial, setTutorial] = useState(() => {
    try { return localStorage.getItem("atlas-tutorial-seen") !== "true"; } catch { return true; }
  });
  const [tutorialPage, setTutorialPage] = useState(0);
  const [placeholder, setPlaceholder] = useState(rotatingSearches[0]);
  const selectedIdRef = useRef<string>();
  const selectedCollectionRef = useRef<string>();
  const folderTitleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setPlaceholder(value => rotatingSearches[(rotatingSearches.indexOf(value) + 1) % rotatingSearches.length]), 2600);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    setSelectedId(undefined); setSelectedCollection(undefined);
    return () => { void cache.cancelQueries({ queryKey: ["atlas", identity] }); cache.removeQueries({ queryKey: ["atlas", identity] }); };
  }, [identity, cache]);
  useEffect(() => {
    selectedIdRef.current = selectedId;
    selectedCollectionRef.current = selectedCollection;
  }, [selectedId, selectedCollection]);
  useEffect(() => {
    if (!selectedCollection) return;
    window.scrollTo({ top: 0, behavior: "auto" });
    window.setTimeout(() => folderTitleRef.current?.focus(), 0);
  }, [selectedCollection]);
  useEffect(() => {
    const onPop = () => {
      // So trata voltas das entradas que o proprio Atlas empilhou.
      if (!((window as any).__atlasHistoryDepth > 0)) return;
      (window as any).__atlasHistoryDepth -= 1;
      if (selectedIdRef.current) { selectedIdRef.current = undefined; setSelectedId(undefined); }
      else if (selectedCollectionRef.current) { selectedCollectionRef.current = undefined; setSelectedCollection(undefined); }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [onBack]);

  useEffect(() => () => { (window as any).__atlasHistoryDepth = 0; }, []);
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
  const items = (catalog.data?.items ?? []) as Entry[];
  const filtered = useMemo(() => searchAtlas(items, query).filter(item =>
    (!testament || item.testament === testament) && (!era || item.era === era || item.subsection === era) &&
    (!book || item.books.includes(book)) && (!available || !item.locked || !!catalog.data?.fullAccess)
  ), [items, query, testament, era, book, available, catalog.data?.fullAccess]);
  const samples = useMemo(() => items.filter(item => item.sample), [items]);
  const books = useMemo(() => Array.from(new Set(items.flatMap(item => item.books))).sort((a, b) => atlasBookLabel(a).localeCompare(atlasBookLabel(b), "pt-BR")), [items]);
  const countFor = (section: string) => {
    if (section === "jesus") return items.filter(i => i.section === "new-testament" && i.subsection === "Vida de Jesus").length;
    if (section === "church") return items.filter(i => i.section === "new-testament" && (i.subsection === "Igreja primitiva" || i.subsection === "Viagens de Paulo")).length;
    if (section === "epistles") return items.filter(i => i.section === "new-testament" && i.subsection === "Epístolas e Apocalipse").length;
    return items.filter(i => i.section === section).length;
  };
  const collectionItems = useMemo(() => {
    if (!selectedCollection) return [];
    if (selectedCollection === "samples") return filtered.filter(item => item.sample);
    return filtered.filter(item => {
      if (selectedCollection === "jesus") return item.section === "new-testament" && item.subsection === "Vida de Jesus";
      if (selectedCollection === "church") return item.section === "new-testament" && (item.subsection === "Igreja primitiva" || item.subsection === "Viagens de Paulo");
      if (selectedCollection === "epistles") return item.section === "new-testament" && item.subsection === "Epístolas e Apocalipse";
      return item.section === selectedCollection;
    });
  }, [filtered, selectedCollection]);
  const folderGroups = useMemo(() => {
    const groups = new Map<string, Entry[]>();
    collectionItems.forEach(item => {
      const label = item.section === "tabernacle" ? (item.order >= 13 ? "Vestes sacerdotais" : "Estrutura e móveis") :
        item.subsection ?? (item.section === "old-testament" ? "Outros estudos" : item.era ?? "Outros estudos");
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label)!.push(item);
    });
    return Array.from(groups.entries())
      .sort(([a], [b]) => {
        const ai = chronology.indexOf(a); const bi = chronology.indexOf(b);
        return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi) || a.localeCompare(b, "pt-BR");
      })
      .map(([label, entries]) => [label, [...entries].sort((a, b) => a.order - b.order)] as const);
  }, [collectionItems]);
  const openCollection = (key: string) => {
    setQuery(""); clearFilters();
    setSelectedCollection(key); setSelectedId(undefined);
    (window as any).__atlasHistoryDepth = ((window as any).__atlasHistoryDepth || 0) + 1; window.history.pushState({ atlas: "collection", key }, "");
  };
  const open = (id: string) => {
    const item = items.find(entry => entry.id === id);
    if (item?.locked && !catalog.data?.fullAccess) { onSubscribe(); } else {
      setSelectedId(id); (window as any).__atlasHistoryDepth = ((window as any).__atlasHistoryDepth || 0) + 1; window.history.pushState({ atlas: "item", id }, "");
    }
  };
  const backOneLevel = () => window.history.back();
  const clearFilters = () => { setTestament(""); setEra(""); setBook(""); setAvailable(false); };
  const closeTutorial = () => { setTutorial(false); try { localStorage.setItem("atlas-tutorial-seen", "true"); } catch { /* storage unavailable */ } };
  const status = detail.error instanceof ApiError ? detail.error.status : undefined;
  const showLibrary = !!selectedCollection || !!query || !!testament || !!era || !!book || available;

  if (selectedId) return (
    <main className="atlas-home"><div className="atlas-home-shell">
      <div className="atlas-breadcrumbs"><button className="atlas-home-back" onClick={backOneLevel}>← <span>Atlas</span></button><span>/</span><span>{detail.data?.title ?? "Estudo"}</span></div>
      {detail.isLoading ? <div className="atlas-home-state"><div className="atlas-skeleton" /><p>Abrindo esta história…</p></div> :
        detail.isError ? <div className="atlas-home-state"><h2>{status === 401 ? "Entre para continuar" : status === 403 ? "Conteúdo para assinantes" : "Não foi possível abrir"}</h2><button className="atlas-primary" onClick={status === 401 ? onLogin : status === 403 ? onSubscribe : () => detail.refetch()}>{status === 401 ? "Entrar" : status === 403 ? "Ver planos" : "Tentar novamente"}</button></div> :
          detail.data && <AtlasDetail key={`${identity}:${detail.data.id}`} item={detail.data} items={items} onSelect={open} onBack={backOneLevel} onLogin={onLogin} onSubscribe={onSubscribe} navigateToVerse={navigateToVerse} />}
    </div></main>
  );

  return (
    <main className="atlas-home">
      <div className="atlas-home-shell">
        {!showLibrary && <header className="atlas-home-header">
          <button className="atlas-home-back" onClick={() => { (window as any).__atlasHistoryDepth = 0; onBack(); }} aria-label="Voltar">← <span>Início</span></button>
          <div className="atlas-home-brand"><span className="atlas-home-mark">A</span><div><p>Estudo visual</p><h1>Mapas e Imagens Bíblicas</h1></div></div>
          <button className="atlas-filter-trigger" onClick={() => setFilterOpen(true)}>Filtrar <span>{[testament, era, book, available ? "sim" : ""].filter(Boolean).length || ""}</span></button>
        </header>}

        {!showLibrary && <section className="atlas-welcome">
          <p className="atlas-eyebrow">Leia a paisagem da Bíblia</p>
          <h2>Mapas e Imagens Bíblicas</h2>
          <p>Veja onde a história aconteceu e como é o lugar hoje</p>
          <label className="atlas-search-wrap"><span>⌕</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder={`Busque por ${placeholder}`} aria-label="Buscar no atlas" /></label>
        </section>}

        {isLoading || catalog.isLoading ? <div className="atlas-loading-grid"><div /><div /><div /></div> : catalog.isError ? <div className="atlas-home-state"><h2>O atlas não abriu</h2><p>Confira sua conexão e tente novamente.</p><button className="atlas-primary" onClick={() => catalog.refetch()}>Tentar novamente</button></div> : <>
          {!showLibrary && <><section className="atlas-start"><div><p className="atlas-eyebrow">Comece por aqui</p><h2>Três maneiras de começar</h2></div><div className="atlas-start-cards">
            <button onClick={() => { setTutorialPage(0); setTutorial(true); }}><strong>Como usar</strong><small>Um guia rápido em 3 telas</small><span>→</span></button>
            <button onClick={() => document.querySelector(".atlas-timeline")?.scrollIntoView({ behavior: "smooth" })}><strong>Linha do tempo</strong><small>De Abraão a João</small><span>→</span></button>
             <button onClick={() => openCollection("samples")}><strong>Amostras grátis</strong><small>{samples.length} {samples.length === 1 ? "item disponível" : "itens disponíveis"} · 2 grátis por pasta, conforme forem criados</small><span>→</span></button>
          </div></section>
          <section className="atlas-timeline" aria-label="Linha do tempo bíblica">
            {timelineTargets.map(([label, targets], index) => <button key={label} onClick={() => setEra(targets[0])} className={(targets as readonly string[]).includes(era) ? "active" : ""}><i>{index + 1}</i><span>{label}</span></button>)}
          </section>
          <section className="atlas-section-block"><div className="atlas-section-title"><div><p className="atlas-eyebrow">Escolha um caminho</p><h2>Pastas do atlas</h2></div><span>{items.length} estudos</span></div>
              <div className="atlas-collections">{collections.map(([key, title, subtitle]) => { const count = countFor(key); const free = items.filter(i => i.sample && (key === "jesus" ? i.section === "new-testament" && i.subsection === "Vida de Jesus" : key === "church" ? i.section === "new-testament" && ["Igreja primitiva","Viagens de Paulo"].includes(i.subsection ?? "") : key === "epistles" ? i.section === "new-testament" && i.subsection === "Epístolas e Apocalipse" : i.section === key)).length; if (!count && !import.meta.env.DEV) return null; return <button key={key} className={`atlas-folder ${!count ? "is-empty" : ""}`} onClick={() => openCollection(key)}><span className="atlas-folder-tab" /><span className="atlas-folder-icon">{key === "jesus" ? "N" : key === "old-testament" ? "A" : "＋"}</span><strong>{title}</strong><small>{subtitle}</small><em>{count ? `${count} ${count === 1 ? "item" : "itens"} · ${free} grátis` : "Em breve · 2 grátis planejados"}</em></button>; })}</div>
           </section></>}
           {showLibrary && <section className="atlas-section-block atlas-library"><div className="atlas-breadcrumbs atlas-library-crumb"><button className="atlas-home-back" onClick={backOneLevel} aria-label="Voltar">← <span>Mapas</span></button><span>›</span><strong>{selectedCollection === "samples" ? "Amostras grátis" : selectedCollection ? collections.find(([key]) => key === selectedCollection)?.[1] ?? "Pasta" : "Resultados"}</strong></div><div className="atlas-section-title"><div><p className="atlas-eyebrow">{selectedCollection === "samples" ? "Amostra do acervo" : selectedCollection ? "Pasta do atlas" : "Busca no atlas"}</p><h2 ref={folderTitleRef} tabIndex={-1}>{selectedCollection === "samples" ? "Amostras grátis" : selectedCollection ? collections.find(([key]) => key === selectedCollection)?.[1] ?? "Pasta" : "Todos os estudos encontrados"}</h2></div><span>{selectedCollection ? collectionItems.length : filtered.length} estudos</span></div>
              <div className="atlas-folder-groups">{(selectedCollection ? folderGroups : [["Resultados", (query || testament || era || book || available ? filtered : samples)] as const]).map(([group, groupItems]) => <section className="atlas-folder-group" key={group}><h3>{group}</h3><div className="atlas-item-list">{groupItems.map(item => <button className="atlas-item" key={item.id} onClick={() => open(item.id)}><span className="atlas-thumb" aria-hidden="true" style={{ backgroundImage: "url('/atlas/base/relief.jpg')", backgroundPosition: stableCrop(item.id) }}><i /><b /><small /></span><span className="atlas-item-copy"><strong>{item.title}</strong><small>{item.subtitle || "Estudo visual do lugar e do contexto bíblico."}</small><em>{periodLabel(item.era, item.period)} · {item.books.slice(0, 2).map(atlasBookLabel).join(" · ")}</em></span><span className="atlas-item-status">{item.sample ? "Grátis" : item.locked ? "Cadeado" : "Incluso no plano"}<b>→</b></span></button>)}</div></section>)}</div>
           </section>}
           {((selectedCollection ? collectionItems : filtered).length === 0) && <div className="atlas-home-state"><h2>Nenhum caminho encontrado</h2><p>Tente buscar outro lugar ou ajuste os filtros.</p><button className="atlas-secondary" onClick={() => { setQuery(""); clearFilters(); }}>Limpar busca</button></div>}
        </>}
        <p className="atlas-footnote">Mapas para ler a Bíblia com mais contexto, sem substituir o texto.</p>
      </div>
      {tutorial && <div className="atlas-tutorial-backdrop"><section className="atlas-tutorial" role="dialog" aria-modal="true"><div className="atlas-tutorial-art"><span>{["A", "→", "J"][tutorialPage]}</span></div><p className="atlas-eyebrow">Primeira visita · {tutorialPage + 1} de 3</p><h2>{["Comece pelo lugar", "Siga o fio da história", "Abra o mapa quando quiser"][tutorialPage]}</h2><p>{["Cada pasta organiza uma parte da história bíblica, sem deixar você perdido entre datas.", "A linha do tempo ajuda a ver o que veio antes e depois — de Abraão a João.", "Escolha um estudo para ler, observar e então voltar ao texto bíblico."][tutorialPage]}</p><div className="atlas-tutorial-dots">{[0, 1, 2].map(i => <i key={i} className={i === tutorialPage ? "active" : ""} />)}</div><button className="atlas-primary" onClick={() => tutorialPage === 2 ? closeTutorial() : setTutorialPage(page => page + 1)}>{tutorialPage === 2 ? "Entrar no atlas" : "Continuar"}</button><button className="atlas-tutorial-skip" onClick={closeTutorial}>Pular por agora</button></section></div>}
      {filterOpen && <div className="atlas-sheet-backdrop" onClick={() => setFilterOpen(false)}><section className="atlas-filter-sheet" onClick={e => e.stopPropagation()}><div className="atlas-sheet-grip" /><header><div><p className="atlas-eyebrow">Refine sua busca</p><h2>Filtrar</h2></div><button onClick={() => setFilterOpen(false)} aria-label="Fechar">×</button></header><label>Testamento<select value={testament} onChange={e => setTestament(e.target.value)}><option value="">Todos</option><option value="AT">Antigo Testamento</option><option value="NT">Novo Testamento</option></select></label><label>Época<select value={era} onChange={e => setEra(e.target.value)}><option value="">Todas</option>{eras.map(value => <option key={value}>{value}</option>)}</select></label><label>Livro<select value={book} onChange={e => setBook(e.target.value)}><option value="">Todos</option>{books.map(value => <option key={value} value={value}>{atlasBookLabel(value)}</option>)}</select></label><label className="atlas-check"><input type="checkbox" checked={available} onChange={e => setAvailable(e.target.checked)} /> Disponíveis para mim</label><button className="atlas-primary" onClick={() => setFilterOpen(false)}>Ver resultados</button><button className="atlas-clear" onClick={clearFilters}>Limpar filtros</button></section></div>}
    </main>
  );
}