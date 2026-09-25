import { useEffect, useState } from "react";
import type { AtlasItem } from "@shared/atlas";
import { ATLAS_CUBIT_NOTE, cubitsToMeters } from "@shared/atlas";
import { getApiUrl, getAuthHeaders } from "@/lib/queryClient";
import { formatAtlasReference } from "./atlasLabels";

/** A source-labelled, non-geographic diagram attached to a map. */
export function AtlasMapDiagram({ item }: { item: AtlasItem }) {
  const [url, setUrl] = useState<string>();
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let objectUrl: string | undefined;
    setUrl(undefined);
    setError(false);
    fetch(getApiUrl(`/api/atlas/items/${item.id}/svg`), {
      headers: getAuthHeaders(), credentials: "include", cache: "no-store", signal: controller.signal,
    }).then(async response => {
      if (!response.ok) throw new Error(`SVG HTTP ${response.status}`);
      objectUrl = URL.createObjectURL(await response.blob());
      if (!controller.signal.aborted) setUrl(objectUrl);
    }).catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => { controller.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [item.id, item.version, attempt]);

  if (!item.illustration) return null;
  return <section className="atlas-panel atlas-section atlas-map-diagram">
    <h2>Proporções da arca · desenho didático</h2>
    {error ? <div role="alert">Não foi possível carregar o desenho. <button type="button" onClick={() => setAttempt(value => value + 1)}>Tentar novamente</button></div>
      : url ? <img src={url} alt="Silhueta proporcional da arca de Noé, suas três medidas bíblicas e comparação ilustrativa com um campo de futebol" style={{ display: "block", width: "100%", height: "auto" }} />
        : <p role="status">Carregando desenho…</p>}
    {item.illustration.dimensions.map(dimension => <p key={dimension.label}>
      <strong>{dimension.label}:</strong> {dimension.cubits === undefined
        ? dimension.reportedValue ?? "medida não informada"
        : `${dimension.cubits} côvados (aproximadamente ${cubitsToMeters(dimension.cubits)} m)`} · {formatAtlasReference(dimension.reference)}. {dimension.note}
    </p>)}
    {item.illustration.notes.map(note => <p className="atlas-muted" key={note}>{note}</p>)}
    <p className="atlas-muted">{ATLAS_CUBIT_NOTE} O desenho compara medidas e não representa um modelo arqueológico nem a localização da arca.</p>
  </section>;
}