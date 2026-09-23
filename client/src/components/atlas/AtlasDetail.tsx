import { useEffect, useState } from "react";
import type { AtlasItem, AtlasReference, AtlasSummary } from "@shared/atlas";
import { ATLAS_CERTAINTY_LABELS, ATLAS_CUBIT_NOTE, cubitsToMeters } from "@shared/atlas";
import { ApiError, getApiUrl, getAuthHeaders } from "@/lib/queryClient";
import { AtlasAssistant } from "./AtlasAssistant";
import { AtlasMap, overlayColor, type AtlasMode } from "./AtlasMap";

const reference = (ref: AtlasReference) =>
  `${ref.label} · ${ref.book} ${ref.chapter}:${ref.verseStart}${ref.verseEnd ? `–${ref.verseEnd}` : ""}`;
const certainty = (value: AtlasItem["certainty"]) =>
  <span className={`atlas-badge ${value}`}>{ATLAS_CERTAINTY_LABELS[value]}</span>;

function Illustration({ item, onLogin, onSubscribe }: {
  item: AtlasItem; onLogin: () => void; onSubscribe: () => void;
}) {
  const [url, setUrl] = useState<string>();
  const [error, setError] = useState<number | string>();
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let objectUrl: string | undefined;
    setUrl(undefined);
    setError(undefined);
    // Protected SVGs are API assets, unlike the bundled Natural Earth base.
    fetch(getApiUrl(`/api/atlas/items/${item.id}/svg`), {
      headers: getAuthHeaders(), credentials: "include", cache: "no-store", signal: controller.signal,
    }).then(async response => {
      if (!response.ok) throw new ApiError(response.status, {});
      const blob = await response.blob();
      if (controller.signal.aborted) return;
      objectUrl = URL.createObjectURL(new Blob([blob], { type: "image/svg+xml" }));
      setUrl(objectUrl);
    }).catch(reason => {
      if (!controller.signal.aborted) setError(reason instanceof ApiError ? reason.status : "load");
    });
    return () => { controller.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [item.id, item.version, attempt]);
  if (error) return (
    <div className="atlas-empty atlas-panel" role="alert">
      <p>{error === 401 ? "Entre novamente para ver a ilustração." : error === 403 ? "Esta ilustração exige uma assinatura ativa." : "Não foi possível carregar a ilustração."}</p>
      <button className="atlas-button" onClick={() => error === 401 ? onLogin() : error === 403 ? onSubscribe() : setAttempt(value => value + 1)}>
        {error === 401 ? "Entrar" : error === 403 ? "Ver planos" : "Tentar novamente"}
      </button>
    </div>
  );
  return url ? <img className="atlas-illustration" alt={item.title} src={url} onError={() => setError("decode")} /> : <div className="atlas-empty atlas-panel" role="status">Carregando ilustração…</div>;
}

export function AtlasDetail({ item, items, onSelect, onBack, onLogin, onSubscribe }: {
  item: AtlasItem; items: AtlasSummary[]; onSelect: (id: string) => void;
  onBack: () => void; onLogin: () => void; onSubscribe: () => void;
}) {
  const [mode, setMode] = useState<AtlasMode>("ancient");
  const [selectedPlaceId, setSelectedPlaceId] = useState<string>();
  const [visibleOverlays, setVisibleOverlays] = useState(() => new Set(item.overlays.map(overlay => overlay.id)));
  const place = item.places.find(entry => entry.id === selectedPlaceId);
  const sourceNames = (ids: string[]) => ids.map(id => item.sources.find(source => source.id === id)?.title ?? id).join("; ");
  return (
    <div className="atlas-detail">
      <section>
        <div className="atlas-panel atlas-copy">
          <button className="atlas-chip" onClick={onBack}>Catálogo</button>
          <h2>{item.title}</h2>{certainty(item.certainty)}
          <p>{mode === "ancient" ? item.summary : item.modernSummary}</p>
        </div>
        <div className="atlas-mode" role="group" aria-label="Comparação histórica">
          <button aria-pressed={mode === "ancient"} onClick={() => setMode("ancient")}>Como era</button>
          <button aria-pressed={mode === "modern"} onClick={() => setMode("modern")}>Como é hoje</button>
        </div>
        {item.kind === "map" ? <AtlasMap item={item} mode={mode} selectedPlaceId={selectedPlaceId} visibleOverlays={visibleOverlays} onPlace={setSelectedPlaceId} /> : <Illustration key={item.id} item={item} onLogin={onLogin} onSubscribe={onSubscribe} />}
        {item.kind === "map" && <section className="atlas-panel atlas-section">
          <h3>Legenda</h3>
          <p>● Lugares históricos · linhas tracejadas: percurso provável ou debatido, não uma rota exata · áreas sombreadas: extensão aproximada.</p>
          {item.overlays.map((overlay, index) => <div className="atlas-row" key={overlay.id}><span style={{ color: overlayColor(index) }}>━ </span>{overlay.label} · {visibleOverlays.has(overlay.id) ? "Visível" : "Oculta"} · {ATLAS_CERTAINTY_LABELS[overlay.certainty]}</div>)}
          {mode === "modern" && <p>Fronteiras e cidades atuais são referências generalizadas; não comprovam a identificação antiga.</p>}
        </section>}
        {item.illustration && <section className="atlas-panel atlas-section">
          <h3>Notas da ilustração</h3>
          {item.illustration.notes.map(note => <p key={note}>{note}</p>)}
          {item.illustration.relatedIds.length > 0 && <><h3>Peças relacionadas</h3>{item.illustration.relatedIds.map(id => <button className="atlas-chip" key={id} onClick={() => onSelect(id)}>{items.find(entry => entry.id === id)?.title ?? id}</button>)}</>}
        </section>}
      </section>
      <aside className="atlas-sidebar">
        {item.places.length > 0 && <section className="atlas-panel atlas-section">
          <h3>Lugares</h3>
          {item.places.map(entry => <button className="atlas-place" key={entry.id} aria-pressed={selectedPlaceId === entry.id} onClick={() => setSelectedPlaceId(entry.id)}>
            <strong>{entry.name}</strong><br /><span>{entry.modernName}</span><br />
            <small>{entry.coordinates ? `Latitude ${entry.coordinates[1]}° · longitude ${entry.coordinates[0]}°` : "Coordenadas desconhecidas"}</small><br />{certainty(entry.certainty)}
          </button>)}
          {place && <div className="atlas-row"><p>{place.explanation}</p>{place.references.map(ref => <p key={reference(ref)}>{reference(ref)}</p>)}<small>Fontes: {sourceNames(place.sourceIds)}</small></div>}
        </section>}
        {item.overlays.length > 0 && <section className="atlas-panel atlas-section">
          <h3>Hipóteses e rotas</h3>
          {item.overlays.map(overlay => <div key={overlay.id} className="atlas-row">
            <label className="atlas-toggle"><input type="checkbox" checked={visibleOverlays.has(overlay.id)} onChange={() => setVisibleOverlays(previous => {
              const next = new Set(previous);
              next.has(overlay.id) ? next.delete(overlay.id) : next.add(overlay.id);
              return next;
            })} /><span>{overlay.label}<br />{certainty(overlay.certainty)}</span></label>
            <p>{overlay.explanation}</p><small>Fontes: {sourceNames(overlay.sourceIds)}</small>
          </div>)}
        </section>}
        {!!item.illustration?.dimensions.length && <section className="atlas-panel atlas-section">
          <h3>Medidas</h3>
          {item.illustration.dimensions.map(dimension => <div className="atlas-row" key={dimension.label}>
            <strong>{dimension.label}</strong><br />{dimension.cubits ? `${dimension.cubits} côvados ≈ ${cubitsToMeters(dimension.cubits)} m` : "Medida não especificada"}
            <p>{dimension.note}</p><small>{reference(dimension.reference)}</small>
          </div>)}
          <p>{ATLAS_CUBIT_NOTE}</p>
        </section>}
        <section className="atlas-panel atlas-section">
          <h3>Referências e fontes</h3>
          {item.references.map(ref => <div className="atlas-row" key={reference(ref)}>{reference(ref)}</div>)}
          {item.sources.map(source => <div className="atlas-row" key={source.id}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a><p>{source.note}</p><small>Licença: {source.license}</small></div>)}
        </section>
        <section className="atlas-panel atlas-section">
          <h3>Revisão histórica</h3>
          <p>{item.review.status === "documented" ? "Documentada" : "Requer revisão de especialista"} · {item.review.date}</p>
          <p>{item.review.methodology}</p>
          <h3>Verificado</h3>{item.review.verified.map(text => <p key={text}>{text}</p>)}
          <h3>Incertezas</h3>{item.review.uncertainties.length ? item.review.uncertainties.map(text => <p key={text}>{text}</p>) : <p>Nenhuma incerteza adicional registrada.</p>}
        </section>
      </aside>
      <AtlasAssistant context={{ itemId: item.id, version: item.version, selectedPlaceId, mode }} onLogin={onLogin} onSubscribe={onSubscribe} />
    </div>
  );
}