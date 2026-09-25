import type { AtlasItem } from "@shared/atlas";
import { cubitsToMeters } from "@shared/atlas";
import { formatAtlasReference } from "./atlasLabels";

const fmt = (n: number) => new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 }).format(n);

export function AtlasDimensionRulers({ item }: { item: AtlasItem }) {
  const dimensions = item.illustration?.dimensions ?? [];
  if (!dimensions.length) return null;
  return <section className="atlas-panel atlas-section atlas-rulers">
    <h3>Cotas textuais</h3>
    <p className="atlas-muted">Linhas de cota esquemáticas; traços interrompidos indicam medida não informada no texto. Valores em outras unidades são mostrados sem conversão inventada. Côvado comum ≈ 0,45 m.</p>
    <div className="atlas-rulers-grid">{dimensions.map((dimension, index) => {
      const id = `atlas-arrow-${item.id}-${index}`;
      return <div className="atlas-ruler" key={`${dimension.label}-${index}`}>
         <svg viewBox="0 0 360 82" role="img" aria-label={dimension.cubits === undefined ? `${dimension.label}: ${dimension.reportedValue ?? "medida não informada no texto"}` : `${dimension.label}: ${fmt(dimension.cubits)} côvados, aproximadamente ${fmt(cubitsToMeters(dimension.cubits))} metros`}>
           {dimension.cubits !== undefined && <defs><marker id={id} viewBox="0 0 8 8" refX="1" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M8 0L0 4 8 8Z" fill="#c9a227" /></marker></defs>}
           <text x="180" y="19" textAnchor="middle">{dimension.label}: {dimension.cubits === undefined ? (dimension.reportedValue ? "valor textual" : "sem cota") : `${fmt(dimension.cubits)} côvados`}</text>
          <path d="M20 32v30 M340 32v30" fill="none" stroke="#c9a227" />
           <path d="M28 47H332" fill="none" stroke="#c9a227" strokeWidth="1.5"
             strokeDasharray={dimension.cubits === undefined && !dimension.reportedValue ? "7 5" : undefined}
             markerStart={dimension.cubits === undefined ? undefined : `url(#${id})`}
             markerEnd={dimension.cubits === undefined ? undefined : `url(#${id})`} />
           <rect x={dimension.cubits === undefined ? 73 : 137} y="34" width={dimension.cubits === undefined ? 214 : 86} height="27" rx="6" fill="#142923" />
           <text x="180" y="53" textAnchor="middle">{dimension.cubits === undefined ? dimension.reportedValue ?? "medida não informada no texto" : `≈ ${fmt(cubitsToMeters(dimension.cubits))} m`}</text>
        </svg>
        <small>{formatAtlasReference(dimension.reference)} · {dimension.note}</small>
      </div>;
    })}</div>
  </section>;
}