import { useRef, useState, type PointerEvent } from "react";
import type { AtlasItem } from "@shared/atlas";
import { cubitsToMeters } from "@shared/atlas";

const fmt = (n: number) => new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 }).format(n);
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export function AtlasZoomStage({ item, url, aspect, label, primary, part, onPart }: {
  item: AtlasItem; url?: string; aspect: number; label: string;
  primary: boolean; part: number; onPart: (index: number) => void;
}) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef({ distance: 0, zoom: 1, lastTap: 0, tapX: 0, tapY: 0, pinched: false, ignoreDoubleClickUntil: 0 });
  const pieces = item.illustration?.parts ?? [];
  const active = pieces[Math.min(part, pieces.length - 1)];
  const reset = () => { setZoom(1); setOffset({ x: 0, y: 0 }); };
  const toggle = () => {
    if (zoom > 1) reset();
    else { setZoom(2.5); setOffset({ x: 0, y: 0 }); }
  };
  const pointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse") return;
    if (event.target instanceof Element && event.target.closest("button")) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = Array.from(pointers.current.values());
      gesture.current.distance = Math.hypot(a.x - b.x, a.y - b.y);
      gesture.current.zoom = zoom;
      gesture.current.pinched = true;
    }
  };
  const pointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const previous = pointers.current.get(event.pointerId);
    if (!previous) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = Array.from(pointers.current.values());
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      if (gesture.current.distance > 0) setZoom(clamp(gesture.current.zoom * distance / gesture.current.distance, 1, 4));
    } else if (zoom > 1) {
      const rect = event.currentTarget.getBoundingClientRect();
      const limitX = rect.width * (zoom - 1) / 2;
      const limitY = rect.height * (zoom - 1) / 2;
      setOffset(old => ({
        x: clamp(old.x + event.clientX - previous.x, -limitX, limitX),
        y: clamp(old.y + event.clientY - previous.y, -limitY, limitY),
      }));
    }
  };
  const pointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.delete(event.pointerId);
    if (pointers.current.size === 0) {
      if (!gesture.current.pinched && event.pointerType === "touch") {
        const now = Date.now();
        if (now - gesture.current.lastTap < 320 &&
          Math.hypot(event.clientX - gesture.current.tapX, event.clientY - gesture.current.tapY) < 30) {
          toggle();
          gesture.current.lastTap = 0;
          gesture.current.ignoreDoubleClickUntil = now + 500;
        } else {
          gesture.current.lastTap = now;
          gesture.current.tapX = event.clientX;
          gesture.current.tapY = event.clientY;
        }
      }
      gesture.current.pinched = false;
    }
  };
  return <div className="atlas-stage atlas-illustration-stage" onPointerDown={pointerDown}
    onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp}
    onDoubleClick={() => { if (Date.now() > gesture.current.ignoreDoubleClickUntil) toggle(); }}
    aria-label={`Desenho de ${item.title}; use pinça ou toque duplo para ampliar`}>
    {url ? <div className="atlas-illustration-canvas" style={{
      aspectRatio: Number.isFinite(aspect) && aspect > 0 ? aspect : 800 / 520,
      transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
    }}>
      <img className="atlas-illustration" src={url} alt={`${item.title} — ${label}`} draggable={false} />
      {primary && pieces.map((piece, index) => piece.highlight && <button
        key={piece.id} type="button" className="atlas-illustration-point"
        style={{ left: `${piece.highlight.x}%`, top: `${piece.highlight.y}%` }}
        aria-label={`Ponto ${index + 1}: ${piece.name}`} aria-pressed={part === index}
        onClick={() => onPart(index)}>{index + 1}</button>)}
    </div> : <div className="atlas-empty" role="status">Carregando ilustração…</div>}
    {url && <div className="atlas-illustration-legend" aria-live="polite">
      <strong>{label} · {active?.name ?? item.title}</strong>
      <span>{active?.cubits === undefined ? "Proporção ilustrativa · medida não informada no texto" :
        `${fmt(active.cubits)} côvados ≈ ${fmt(cubitsToMeters(active.cubits))} m`}</span>
    </div>}
    {url && <button type="button" className="atlas-zoom-reset" onClick={zoom > 1 ? reset : toggle}>
      {zoom > 1 ? "Redefinir zoom" : "Ampliar"}
    </button>}
  </div>;
}