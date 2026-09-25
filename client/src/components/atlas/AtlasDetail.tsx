import { useMemo, useRef, useState, type CSSProperties } from "react";
import type { AtlasItem, AtlasReference, AtlasSummary } from "@shared/atlas";
import { ATLAS_CERTAINTY_LABELS } from "@shared/atlas";
import { AtlasAssistant } from "./AtlasAssistant";
import { AtlasMap, overlayColor, type AtlasMapSync, type AtlasMode } from "./AtlasMap";
import { AtlasIllustration } from "./AtlasIllustration";
import { AtlasMapDiagram } from "./AtlasMapDiagram";
import { formatAtlasReference } from "./atlasLabels";
import "./atlas-detail.css";

const certainty = (value: AtlasItem["certainty"]) => <span className="atlas-badge"><i className={`atlas-certainty-line ${value}`} aria-hidden="true" />{ATLAS_CERTAINTY_LABELS[value]}</span>;
const splitExplanation = (text: string) => text.split(/(?<=[.!?])\s+/).filter(Boolean).slice(0, 2).join(" ");

export function AtlasDetail({ item, items, onSelect, onBack, onLogin, onSubscribe, navigateToVerse }: {
  item: AtlasItem; items: AtlasSummary[]; onSelect: (id: string) => void; onBack: () => void; onLogin: () => void; onSubscribe: () => void; navigateToVerse?: (book: string, chapter: number, verse?: number) => void;
}) {
  const [mode, setMode] = useState<AtlasMode | "compare">("ancient"); const [divider, setDivider] = useState(50);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string>(); const [visibleOverlays, setVisibleOverlays] = useState(() => new Set(item.overlays.map(o => o.id)));
  const [tab, setTab] = useState("Resumo"); const [sheetHeight, setSheetHeight] = useState<"closed" | "half" | "full">("closed"); const touch = useRef<number | null>(null);
  const [century, setCentury] = useState(""); const [kingdom, setKingdom] = useState("");
  const mapSync = useRef<AtlasMapSync>({ maps: [], syncing: false });
  const hasProphetFilters = item.id === "prophets-map";
  const centuries = useMemo(() => Array.from(new Set(item.places.flatMap(place => place.centuries ?? []))), [item.places]);
  const kingdoms = useMemo(() => Array.from(new Set(item.places.flatMap(place => place.kingdoms ?? []))), [item.places]);
  const shownPlaces = useMemo(() => hasProphetFilters ? item.places.filter(place =>
    (!century || place.centuries?.includes(century)) && (!kingdom || place.kingdoms?.includes(kingdom))) : item.places,
  [hasProphetFilters, item.places, century, kingdom]);
  const visiblePlaceIds = useMemo(() => hasProphetFilters ? new Set(shownPlaces.map(place => place.id)) : undefined, [hasProphetFilters, shownPlaces]);
  const steps = useMemo(() => (item.storySteps?.map(step => ({ ...step, explanation: step.text })) ??
    item.places.map(place => ({ placeId: place.id, title: place.name, explanation: place.explanation, reference: place.references[0] })))
    .filter(step => !visiblePlaceIds || visiblePlaceIds.has(step.placeId)), [item.storySteps, item.places, visiblePlaceIds]);
  const [stepIndex, setStepIndex] = useState<number | null>(null);
  const selected = item.places.find(place => place.id === selectedPlaceId); const modernOverview = item.modernOverview ?? item.modernSummary;
  const suggestions = [`O que esta ficha mostra sobre ${item.title}?`, ...(item.places[0] ? [`O que a ficha registra sobre ${item.places[0].name}?`] : []), ...(item.references[0] ? [`Como ler ${formatAtlasReference(item.references[0])} nesta ficha?`] : [])].slice(0, 3);
  const refs = (references: AtlasReference[]) => references.map(ref => {
    const label = formatAtlasReference(ref);
    if (ref.book === "1Macc") {
      const sourceUrl = item.sources.find(source => source.id === "first-maccabees")?.url;
      return sourceUrl
        ? <a className="atlas-reference-button" key={label} href={sourceUrl} target="_blank" rel="noreferrer">{label} · fonte histórica</a>
        : <span key={label}>{label} · fonte histórica</span>;
    }
    return <button className="atlas-reference-button" key={label} onClick={() => navigateToVerse?.(ref.book, ref.chapter, ref.verseStart)}>{label}</button>;
  });
  const goPlace = (index: number) => { const step = steps[index]; if (step) { setStepIndex(index); setSelectedPlaceId(step.placeId); } };
  const selectedIndex = stepIndex ?? 0;
  const activeStep = stepIndex === null ? undefined : steps[stepIndex];
  const activePlace = activeStep && item.places.find(place => place.id === activeStep.placeId);
  const summarySentences = item.summary.split(/(?<=[.!?])\s+/).filter(Boolean).slice(0, 5);
  const changeFilter = (kind: "century" | "kingdom", value: string) => {
    if (kind === "century") setCentury(value); else setKingdom(value);
    setSelectedPlaceId(undefined); setStepIndex(null);
  };
  return <div className="atlas-detail">
    <main className="atlas-detail-main">
      <header className="atlas-topbar"><button className="atlas-backbutton" onClick={onBack} aria-label="Voltar">‹</button><div className="atlas-topbar-copy"><span className="atlas-kicker">Atlas bíblico · {item.kind === "map" ? "Mapa" : "Ilustração"}</span><h1>{item.title}</h1></div></header>
      {item.kind === "map" && <div className="atlas-mode" role="group" aria-label="Perspectiva do mapa"><button aria-pressed={mode === "ancient"} onClick={() => setMode("ancient")}>Como era</button><button aria-pressed={mode === "modern"} onClick={() => setMode("modern")}>Hoje</button><button aria-pressed={mode === "compare"} onClick={() => setMode("compare")}>Comparar</button></div>}
       {hasProphetFilters && <div className="atlas-panel atlas-section atlas-prophet-filters" role="group" aria-label="Filtros dos profetas" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
         <label>Século <select value={century} onChange={event => changeFilter("century", event.target.value)}><option value="">Todos</option>{centuries.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
         <label>Reino / contexto <select value={kingdom} onChange={event => changeFilter("kingdom", event.target.value)}><option value="">Todos</option>{kingdoms.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
         <span className="atlas-muted" role="status">{shownPlaces.length} locais nesta seleção</span>
       </div>}
       {item.kind === "map" ? mode === "compare" ? <div className="atlas-compare" style={{ "--atlas-divider": `${divider}%` } as CSSProperties}><AtlasMap item={item} mode="ancient" sync={mapSync.current} selectedPlaceId={selectedPlaceId} visibleOverlays={visibleOverlays} visiblePlaceIds={visiblePlaceIds} onPlace={setSelectedPlaceId} /><AtlasMap item={item} mode="modern" sync={mapSync.current} selectedPlaceId={selectedPlaceId} visibleOverlays={visibleOverlays} visiblePlaceIds={visiblePlaceIds} onPlace={setSelectedPlaceId} /><label className="atlas-compare-divider" htmlFor="atlas-divider"><span>Arraste</span><input id="atlas-divider" type="range" min="15" max="85" value={divider} onChange={e => setDivider(Number(e.target.value))} aria-label="Divisor entre mapas" /></label></div> : <AtlasMap item={item} mode={mode} selectedPlaceId={selectedPlaceId} visibleOverlays={visibleOverlays} visiblePlaceIds={visiblePlaceIds} onPlace={setSelectedPlaceId} /> : <AtlasIllustration item={item} items={items} onSelect={onSelect} onLogin={onLogin} onSubscribe={onSubscribe} />}
       {item.kind === "map" && item.illustration && <AtlasMapDiagram item={item} />}
       <section className="atlas-copy"><span>{item.section === "intertestamental" ? "Entre os Testamentos" : item.testament === "AT" ? "Antigo Testamento" : "Novo Testamento"} · {item.period}</span><p>{mode === "modern" ? modernOverview : item.summary}</p>{certainty(item.certainty)}</section>
        {item.kind === "map" && steps.length > 0 && <section className="atlas-panel atlas-section"><div className="atlas-sheet-controls"><button className="atlas-button" onClick={() => goPlace(stepIndex === null ? 0 : Math.min(steps.length - 1, selectedIndex + 1))}>Seguir a história</button><button onClick={() => goPlace(Math.max(0, selectedIndex - 1))} disabled={stepIndex === null || selectedIndex === 0}>Anterior</button><button onClick={() => goPlace(Math.min(steps.length - 1, selectedIndex + 1))} disabled={selectedIndex === steps.length - 1}>Próximo</button><span className="atlas-muted">Passo {selectedIndex + 1} de {steps.length}</span></div>{activeStep && activePlace && <><h2>{activeStep.title} <span className="atlas-muted">· {activePlace.modernName}</span></h2><p>{splitExplanation(activeStep.explanation)} {!activePlace.coordinates && "Local sem pino: identificação geográfica não estabelecida."}</p>{refs([activeStep.reference])}</>}</section>}
      <section className="atlas-panel atlas-section"><div className="atlas-tabs" role="tablist">{["Resumo", "Lugares", "Onde fica hoje", "Versículos", "Fontes"].map(value => <button key={value} role="tab" aria-selected={tab === value} onClick={() => setTab(value)}>{value}</button>)}</div>
         {tab === "Resumo" && <>{summarySentences.map(sentence => <p key={sentence}>{sentence}</p>)}<p className="atlas-muted">Certeza editorial: {ATLAS_CERTAINTY_LABELS[item.certainty]}. Isso indica o grau de segurança da identificação, não uma prova absoluta.</p>{!!item.curiosities?.length && <div className="atlas-curiosities"><h3>Você sabia?</h3><div className="atlas-curiosity-track">{item.curiosities.map((curiosity, index) => <article className="atlas-curiosity-card" key={index}><p>{curiosity.text}</p>{refs([curiosity.reference])}{curiosity.sourceIds.map(id => <small key={id}>{item.sources.find(source => source.id === id)?.title ?? id}</small>)}</article>)}</div></div>}</>}
         {tab === "Lugares" && shownPlaces.map((place, index) => <button className="atlas-place" key={place.id} onClick={() => setSelectedPlaceId(place.id)} aria-pressed={selectedPlaceId === place.id}><strong>{index + 1}. {place.name}</strong><br /><small>{place.modernName} · {ATLAS_CERTAINTY_LABELS[place.certainty]}</small></button>)}
        {tab === "Onde fica hoje" && <p>{modernOverview}</p>}
        {tab === "Versículos" && <div>{refs(item.references)}</div>}
        {tab === "Fontes" && item.sources.map(source => <div className="atlas-row" key={source.id}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a><p>{source.note}</p><small>{source.license}</small></div>)}
      </section>
    </main>
    <aside className="atlas-sidebar" data-height={sheetHeight}>
       <button
         className="atlas-sheet-handle"
         onClick={e => {
           if (e.currentTarget.dataset.swiped === "true") {
             delete e.currentTarget.dataset.swiped;
             e.preventDefault();
             return;
           }
           setSheetHeight(h => h === "closed" ? "half" : h === "half" ? "full" : "closed");
         }}
         onTouchStart={e => { touch.current = e.touches[0].clientY; }}
         onTouchEnd={e => {
           if (touch.current === null) return;
           const delta = e.changedTouches[0].clientY - touch.current;
           touch.current = null;
           if (Math.abs(delta) <= 25) return;
           e.currentTarget.dataset.swiped = "true";
           setSheetHeight(h => delta < 0
             ? (h === "closed" ? "half" : "full")
             : (h === "full" ? "half" : "closed"));
         }}
       >Detalhes · {sheetHeight === "closed" ? "abrir" : sheetHeight === "half" ? "expandir" : "recolher"}</button>
      {item.kind === "map" && <section className="atlas-panel atlas-section"><h3>Legenda</h3><p>Linhas contínuas: identificação bem estabelecida. Tracejadas: provável. Pontilhadas: debatida. Lugares desconhecidos não recebem pino.</p>{item.overlays.map((overlay, index) => <label className="atlas-toggle" key={overlay.id}><input type="checkbox" checked={visibleOverlays.has(overlay.id)} onChange={() => setVisibleOverlays(prev => { const next = new Set(prev); next.has(overlay.id) ? next.delete(overlay.id) : next.add(overlay.id); return next; })} /><span style={{ color: overlayColor(index) }}>{overlay.label}<br />{ATLAS_CERTAINTY_LABELS[overlay.certainty]}</span></label>)}</section>}
      {selected && <section className="atlas-panel atlas-section"><h3>Lugar selecionado</h3><strong>{selected.name}</strong><p>{selected.modernName}</p><p>{selected.explanation}</p><small>Fontes: {selected.sourceIds.map(id => item.sources.find(s => s.id === id)?.title ?? id).join("; ")}</small></section>}
      <section className="atlas-panel atlas-section"><h3>Revisão e incerteza</h3><p>{item.review.methodology}</p>{item.review.uncertainties.map(text => <p key={text}>{text}</p>)}</section>
      <AtlasAssistant suggestions={suggestions} context={{ itemId: item.id, version: item.version, selectedPlaceId, mode: mode === "compare" ? "ancient" : mode }} onLogin={onLogin} onSubscribe={onSubscribe} />
    </aside>
  </div>;
}