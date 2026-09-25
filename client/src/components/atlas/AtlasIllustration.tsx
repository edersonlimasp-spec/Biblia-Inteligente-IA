import { useEffect, useState } from "react";
import type { AtlasItem, AtlasSummary } from "@shared/atlas";
import { ATLAS_CUBIT_NOTE, cubitsToMeters } from "@shared/atlas";
import { ApiError, getApiUrl, getAuthHeaders } from "@/lib/queryClient";
import { formatAtlasReference } from "./atlasLabels";
import { AtlasZoomStage } from "./AtlasZoomStage";
import { AtlasDimensionRulers } from "./AtlasDimensionRulers";

const priestRoute = [
  ["Porta", "tabernacle-courtyard-gate"], ["Altar", "tabernacle-burnt-offering-altar"],
  ["Pia", "tabernacle-bronze-laver"], ["Lugar Santo", "tabernacle-structure"],
  ["Candelabro", "tabernacle-menorah"], ["Mesa", "tabernacle-showbread-table"],
  ["Incenso", "tabernacle-incense-altar"], ["Véu", "tabernacle-veil-entrance-curtain"],
  ["Santo dos Santos", "tabernacle-ark-mercy-seat"],
] as const;
const garmentRoute = [
  ["Túnica, cinto e calções", "high-priest-tunic-sash-undergarments"],
  ["Manto azul", "high-priest-blue-robe"],
  ["Éfode e cinto", "high-priest-ephod-sash"],
  ["Peitoral", "high-priest-breastpiece"],
  ["Mitra e lâmina", "high-priest-turban-gold-plate"],
  ["Conjunto", "high-priest-garments"],
  ["Sacerdotes comuns", "common-priest-garments"],
] as const;
const templeRoute = [
  ["Pátios", "solomon-temple-courts"],
  ["Altar", "solomon-temple-bronze-altar"],
  ["Mar de fundição", "solomon-temple-bronze-sea"],
  ["Pias e bases", "solomon-temple-wheeled-bases"],
  ["Pórtico", "solomon-temple-porch"],
  ["Jaquim e Boaz", "solomon-temple-jachin-boaz"],
  ["Lugar Santo", "solomon-temple-holy-place"],
  ["Santo dos Santos", "solomon-temple-holy-of-holies"],
] as const;
const templeComparison = [
  ["Lugar Santo", "20 × 10 côvados*", "40 × 20 côvados", "Êx 26:15–30; 1Rs 6:2,17"],
  ["Santo dos Santos", "10 × 10 côvados*", "20 × 20 côvados", "Êx 26:31–33; 1Rs 6:20"],
  ["Água ritual", "1 pia", "Mar + 10 pias", "Êx 30:18; 1Rs 7:23,38"],
  ["Candelabros", "1", "10", "Êx 25:31; 1Rs 7:49"],
  ["Mesas", "1", "10", "Êx 25:23; 2Cr 4:8"],
  ["Altar exterior", "5 × 5 côvados", "20 × 20 côvados", "Êx 27:1; 2Cr 4:1"],
  ["Estrutura", "Desmontável", "Fixa", "Êx 26:15–30; 1Rs 6:7"],
] as const;
const displayNumber = (number: number) => new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 }).format(number);

export function AtlasIllustration({ item, items, onSelect, onLogin, onSubscribe }: {
  item: AtlasItem; items: AtlasSummary[]; onSelect: (id: string) => void;
  onLogin: () => void; onSubscribe: () => void;
}) {
  const illustration = item.illustration;
  const listedViews = illustration?.views?.length ? illustration.views : [];
  const primaryView = listedViews.find(candidate => candidate.svgFile === illustration?.svgFile);
  const views = illustration ? [
    primaryView ?? { label: "Vista principal", svgFile: illustration.svgFile },
    ...listedViews.filter(candidate => candidate.svgFile !== illustration.svgFile),
  ] : [{ label: "Ilustração", svgFile: "" }];
  const [view, setView] = useState(views[0].label);
  const selectedView = views.find(candidate => candidate.label === view) ?? views[0];
  const [url, setUrl] = useState<string>();
  const [error, setError] = useState<number | string>();
  const [part, setPart] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [aspect, setAspect] = useState(800 / 520);
  const [guideStep, setGuideStep] = useState(0);

  useEffect(() => { setView(views[0].label); setPart(0); setGuideStep(0); }, [item.id]);
  useEffect(() => {
    const controller = new AbortController();
    let objectUrl: string | undefined;
    setUrl(undefined); setError(undefined);
    const query = selectedView.svgFile === illustration?.svgFile ? "" : `?view=${encodeURIComponent(selectedView.label)}`;
    fetch(getApiUrl(`/api/atlas/items/${item.id}/svg${query}`), {
      headers: getAuthHeaders(), credentials: "include", cache: "no-store", signal: controller.signal,
    }).then(async response => {
      if (!response.ok) throw new ApiError(response.status, {});
      const blob = await response.blob();
       const text = await blob.text();
       const box = text.match(/\bviewBox\s*=\s*["']\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)\s*["']/i);
       const ratio = box ? Number(box[3]) / Number(box[4]) : 800 / 520;
      objectUrl = URL.createObjectURL(new Blob([blob], { type: "image/svg+xml" }));
       if (!controller.signal.aborted) { setAspect(ratio); setUrl(objectUrl); }
    }).catch(reason => {
      if (!controller.signal.aborted) setError(reason instanceof ApiError ? reason.status : "load");
    });
    return () => { controller.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [item.id, item.version, selectedView.label, attempt]);

  const pieces = illustration?.parts ?? [];
  const active = pieces[Math.min(part, pieces.length - 1)];
  const showingPrimary = selectedView.svgFile === illustration?.svgFile;
  const measuredHeight = illustration?.dimensions.find(dimension => /altura/i.test(dimension.label) && dimension.cubits !== undefined);
  const isGarment = garmentRoute.some(([, id]) => id === item.id);
  const dressing = item.id === "high-priest-garments" ? item.storySteps ?? [] : [];
  const selectGuideStep = (index: number) => {
    setGuideStep(index);
    const i = pieces.findIndex(piece => piece.id === dressing[index]?.placeId);
    if (i >= 0) setPart(i);
  };
  if (error) return <div className="atlas-panel atlas-empty" role="alert">
    <p>{error === 401 ? "Entre novamente para ver a ilustração." : error === 403 ? "Esta ilustração exige uma assinatura ativa." : "Não foi possível carregar a ilustração."}</p>
    <button className="atlas-button" onClick={() => error === 401 ? onLogin() : error === 403 ? onSubscribe() : setAttempt(value => value + 1)}>{error === 401 ? "Entrar" : error === 403 ? "Ver planos" : "Tentar novamente"}</button>
  </div>;

  return <div className="atlas-illustration-frame">
    {views.length > 1 && <div className="atlas-view-controls" role="group" aria-label="Vistas da ilustração">
      {views.map(candidate => <button key={candidate.label} type="button" aria-pressed={candidate.label === selectedView.label} onClick={() => setView(candidate.label)}>{candidate.label}</button>)}
    </div>}
    <AtlasZoomStage key={`${item.id}:${selectedView.label}`} item={item} url={url} aspect={aspect}
      label={selectedView.label} primary={showingPrimary} part={part} onPart={setPart} />
    {pieces.length > 0 && <section className="atlas-panel atlas-section atlas-numbered-key">
      <h3>Legenda numerada</h3>
      <ol>{pieces.map((piece, index) => <li key={piece.id}><button type="button" aria-pressed={part === index}
        onClick={() => setPart(index)}><b>{index + 1}</b><span>{piece.name}</span></button></li>)}</ol>
    </section>}
    <AtlasDimensionRulers item={item} />
    {illustration?.stoneRows && <section className="atlas-panel atlas-section atlas-stone-rows">
      <h3>Quatro fileiras de pedras · nomes na ACF</h3>
      <p>Estes são nomes da tradução consultada, <strong>não identificações mineralógicas certas</strong>. As traduções variam; a correspondência entre cada pedra e uma tribo não é definida no texto. As cores do desenho não identificam minerais.</p>
      <ol>{illustration.stoneRows.map((row, index) => <li key={index}>
        <strong>{index + 1}ª fileira</strong><span>{row.stones.join(" · ")}</span><small>{formatAtlasReference(row.reference)}</small>
      </li>)}</ol>
    </section>}
    <section className="atlas-panel atlas-section atlas-scale-reference">
      <h3>Leitura do desenho e escala humana</h3>
      <div className="atlas-scale-row"><div className="atlas-human-silhouette" aria-hidden="true"><i /><b /></div>
        {measuredHeight?.cubits && <div className="atlas-height-bar" aria-hidden="true" style={{ height: `${Math.round(cubitsToMeters(measuredHeight.cubits) / 1.7 * 112)}px` }} />}
        <p>Silhueta de referência: 1,70 m (≈ {displayNumber(Math.round(1.7 / 0.45 * 100) / 100)} côvados comuns).
          {measuredHeight?.cubits ? ` A barra compara a altura textual de ${measuredHeight.label.toLowerCase()} (${displayNumber(measuredHeight.cubits)} côvados) com a pessoa; a figura é esquemática.` : " Sem altura documentada para escala da peça; a figura é esquemática."}</p></div>
      <p>{ATLAS_CUBIT_NOTE}</p>
      {illustration?.dimensions.map((dimension, index) => <p key={`${dimension.label}-${index}`}><strong>{dimension.label}:</strong> {dimension.cubits !== undefined ? `${displayNumber(dimension.cubits)} côvados ≈ ${displayNumber(cubitsToMeters(dimension.cubits))} m` : dimension.reportedValue ?? "medida não informada no texto"} · {dimension.note} · {formatAtlasReference(dimension.reference)}</p>)}
      {illustration?.notes.map((note, index) => <p key={index} className="atlas-muted">{note}</p>)}
    </section>
    {item.purpose && <section className="atlas-panel atlas-section"><h3>Para que servia</h3><p>{item.purpose}</p></section>}
    {item.id === "tabernacle-temple-comparison" && <section className="atlas-panel atlas-section atlas-temple-comparison">
      <h3>Comparar Tabernáculo e Templo</h3>
      <p>As plantas na vista “Planta” usam a mesma escala para as partes cotadas. Os contornos sem cota são esquemáticos.</p>
      <p>No templo, 40 do Lugar Santo + 20 do Santo dos Santos = 60 côvados da casa (1Rs 6:2, 17–20). O pórtico tem 20 côvados de largura e 10 de profundidade (1Rs 6:3); fica à frente e fora desses 60.</p>
      <table><thead><tr><th scope="col">Elemento</th><th scope="col">Tabernáculo</th><th scope="col">Templo</th></tr></thead>
        <tbody>{templeComparison.map(([name, before, after, reference]) => <tr key={name}>
          <th scope="row">{name}<small>{reference}</small></th><td>{before}</td><td>{after}</td>
        </tr>)}</tbody></table>
      <p>* O 20 × 10 e o 10 × 10 do Tabernáculo são cálculos tradicionais a partir da armação e do véu, não medidas internas expressas nesses versículos. “Dobrar” refere-se apenas a essa comparação de planta, não a todos os objetos.</p>
    </section>}
    {pieces.length > 0 && active && <section className="atlas-panel atlas-section">
      <p className="atlas-kicker">{item.id === "tribes-camp" ? "Organização textual em Números 2–3" : "Pontos numerados · selecione uma peça"}</p>
      <div className="atlas-sheet-controls"><button onClick={() => setPart(Math.max(0, part - 1))} disabled={part === 0}>Anterior</button><span className="atlas-muted">Peça {part + 1} de {pieces.length}</span><button onClick={() => setPart(Math.min(pieces.length - 1, part + 1))} disabled={part === pieces.length - 1}>Próxima</button></div>
      <h3>{active.name}</h3><p>{active.description}</p>{active.material && <p><strong>Material:</strong> {active.material}</p>}
      <p><strong>Medida:</strong> {active.cubits === undefined ? "medida não informada no texto; proporção ilustrativa" : `${displayNumber(active.cubits)} côvados ≈ ${displayNumber(cubitsToMeters(active.cubits))} m`}</p>
      <p>{active.references.map(ref => formatAtlasReference(ref)).join(" · ")}</p>
    </section>}
    {item.storySteps?.length ? <section className="atlas-panel atlas-section"><h3>Passo a passo</h3>
      {item.storySteps.map((step, index) => <button key={index} className="atlas-illustration-step" type="button" onClick={() => {
        const i = pieces.findIndex(piece => piece.id === step.placeId);
        if (i >= 0) setPart(i);
      }}><strong>{index + 1}. {step.title}</strong><span>{step.text} · {formatAtlasReference(step.reference)}</span></button>)}
    </section> : null}
    {dressing.length > 0 && <section className="atlas-panel atlas-section atlas-dressing-guide">
      <h3>Vestir o sumo sacerdote</h3>
      <p>Camada por camada, na ordem narrada em Levítico 8:7–9. A figura ilustra o conjunto; as proporções sem medida são esquemáticas.</p>
      <div className="atlas-sheet-controls"><button type="button" onClick={() => selectGuideStep(Math.max(0, guideStep - 1))} disabled={guideStep === 0}>Anterior</button>
        <span className="atlas-muted">Camada {guideStep + 1} de {dressing.length}</span>
        <button type="button" onClick={() => selectGuideStep(Math.min(dressing.length - 1, guideStep + 1))} disabled={guideStep === dressing.length - 1}>Próxima camada</button></div>
      <strong>{dressing[guideStep]?.title}</strong><p>{dressing[guideStep]?.text} · {dressing[guideStep] && formatAtlasReference(dressing[guideStep].reference)}</p>
    </section>}
    {isGarment && <section className="atlas-panel atlas-section"><h3>Peça por peça · vestes sacerdotais</h3>
      <div className="atlas-priest-route">{garmentRoute.map(([label, id], index) => {
        const entry = items.find(candidate => candidate.id === id);
        return entry && <button type="button" key={id} aria-current={id === item.id ? "step" : undefined}
          onClick={() => entry.locked ? onSubscribe() : onSelect(id)}>{index + 1}. {label}{entry.locked ? " · bloqueado" : ""}</button>;
      })}</div>
    </section>}
    {item.section === "tabernacle" && !isGarment && <section className="atlas-panel atlas-section"><h3>Percorrer como o sacerdote</h3><p>Porta → altar → pia → Lugar Santo → véu → Santo dos Santos. Sequência didática; não é uma reconstituição exata do deslocamento.</p>
      <div className="atlas-priest-route">{priestRoute.map(([label, id], index) => {
        const entry = items.find(candidate => candidate.id === id);
        return entry && <button type="button" key={id} aria-current={id === item.id ? "step" : undefined}
          onClick={() => entry.locked ? onSubscribe() : onSelect(id)}>{index + 1}. {label}{entry.locked ? " · bloqueado" : ""}</button>;
      })}</div>
    </section>}
    {item.section === "solomon-temple" && <section className="atlas-panel atlas-section"><h3>Percorrer como o sacerdote · Templo de Salomão</h3>
      <p>Pátio → altar → mar e pias → pórtico com Jaquim e Boaz → Lugar Santo → debir. Sequência didática, não um trajeto arqueologicamente reconstituído.</p>
      <div className="atlas-priest-route">{templeRoute.map(([label, id], index) => {
        const entry = items.find(candidate => candidate.id === id);
        return entry && <button type="button" key={id} aria-current={id === item.id ? "step" : undefined}
          onClick={() => entry.locked ? onSubscribe() : onSelect(id)}>{index + 1}. {label}{entry.locked ? " · bloqueado" : ""}</button>;
      })}</div>
    </section>}
  </div>;
}