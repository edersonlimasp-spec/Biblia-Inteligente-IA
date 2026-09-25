import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { AtlasItem } from "@shared/atlas";

export type AtlasMode = "ancient" | "modern";
export type AtlasMapSync = { maps: Array<maplibregl.Map | null>; syncing: boolean };
export const overlayColor = (index: number) => ["#e4a45e", "#82c8b8", "#d98c7f", "#c7b276"][index % 4];
type GeoFeature = { geometry: { type: string; coordinates: any }; properties: Record<string, any> };
function center(item: AtlasItem): [number, number] { return [(item.bounds[0] + item.bounds[2]) / 2, (item.bounds[1] + item.bounds[3]) / 2]; }

export function AtlasMap({ item, mode, selectedPlaceId, visibleOverlays, visiblePlaceIds, onPlace, sync }: {
  item: AtlasItem; mode: AtlasMode; selectedPlaceId?: string; visibleOverlays: Set<string>; visiblePlaceIds?: Set<string>; onPlace: (id: string) => void;
  sync?: AtlasMapSync;
}) {
  const node = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [cities, setCities] = useState<GeoFeature[]>([]);
  useEffect(() => {
    if (!node.current) return;
    setReady(false); setError("");
    let map: maplibregl.Map;
    try {
      map = new maplibregl.Map({
        container: node.current, attributionControl: false,
        style: { version: 8, sources: {
          relief: { type: "image", url: "/atlas/base/relief.jpg", coordinates: [[-180,85.05],[180,85.05],[180,-85.05],[-180,-85.05]] },
          land: { type: "geojson", data: "/atlas/base/land.geojson" }, rivers: { type: "geojson", data: "/atlas/base/rivers.geojson" },
          countries: { type: "geojson", data: "/atlas/base/countries.geojson" }, lakes: { type: "geojson", data: "/atlas/base/lakes.geojson" },
        }, layers: [
          { id: "relief", type: "raster", source: "relief", paint: { "raster-opacity": .56 } },
          { id: "land", type: "fill", source: "land", paint: { "fill-color": "#355d58", "fill-opacity": .25 } },
          { id: "lakes", type: "fill", source: "lakes", paint: { "fill-color": "#286071", "fill-opacity": .5 } },
          { id: "rivers", type: "line", source: "rivers", paint: { "line-color": "#8ac4c3", "line-opacity": .55, "line-width": 1 } },
          { id: "borders", type: "line", source: "countries", layout: { visibility: "none" }, paint: { "line-color": "#d5ded2", "line-opacity": .4, "line-width": .7 } },
        ] },
        center: center(item), zoom: 2, minZoom: 1, maxZoom: 8,
      });
      mapRef.current = map;
      if (sync) sync.maps.push(map);
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
      map.on("load", () => { map.fitBounds([[item.bounds[0], item.bounds[1]], [item.bounds[2], item.bounds[3]]], { padding: 45, duration: 0 }); setReady(true); });
      map.on("error", () => setError("Não foi possível carregar a base cartográfica."));
    } catch { setError("O mapa interativo não está disponível neste dispositivo."); }
    return () => { if (sync) { const index = sync.maps.indexOf(map); if (index >= 0) sync.maps[index] = null; } mapRef.current = null; map?.remove(); };
  }, [item.id, sync]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !sync) return;
    const move = () => {
      if (sync.syncing) return;
      sync.syncing = true;
      const center = map.getCenter();
      sync.maps.forEach(other => { if (other && other !== map) other.jumpTo({ center, zoom: map.getZoom(), bearing: map.getBearing(), pitch: map.getPitch() }); });
      requestAnimationFrame(() => { sync.syncing = false; });
    };
    map.on("move", move);
    return () => { map.off("move", move); };
  }, [ready, sync]);
  useEffect(() => {
    const abort = new AbortController();
    fetch("/atlas/base/cities.geojson", { signal: abort.signal }).then(r => r.json()).then(d => setCities(d.features ?? [])).catch(() => {});
    return () => abort.abort();
  }, []);
  useEffect(() => {
    const map = mapRef.current; if (!map || !ready || error) return;
    map.setLayoutProperty("borders", "visibility", mode === "modern" ? "visible" : "none");
    const layers: string[] = [];
    item.overlays.forEach((overlay, index) => {
      if (mode !== "ancient" || overlay.certainty === "unknown" || !visibleOverlays.has(overlay.id)) return;
      const id = `atlas-${overlay.id}`; layers.push(id);
      map.addSource(id, { type: "geojson", data: { type: "Feature", properties: {}, geometry: overlay.kind === "point" ? { type: "Point", coordinates: overlay.coordinates[0] } : overlay.kind === "area" ? { type: "Polygon", coordinates: [overlay.coordinates] } : { type: "LineString", coordinates: overlay.coordinates } } });
      map.addLayer(overlay.kind === "point" ? { id, type: "circle", source: id, paint: { "circle-color": overlayColor(index), "circle-radius": 22, "circle-opacity": .2, "circle-stroke-color": overlayColor(index), "circle-stroke-width": 2 } } : overlay.kind === "area" ? { id, type: "fill", source: id, paint: { "fill-color": overlayColor(index), "fill-opacity": .2 } } : { id, type: "line", source: id, paint: { "line-color": overlayColor(index), "line-width": 3, ...(overlay.certainty === "established" ? {} : { "line-dasharray": overlay.certainty === "probable" ? [4, 3] : [1, 3] }) } });
      if (overlay.kind === "route") overlay.coordinates.slice(0, -1).forEach((point, i) => {
        const next = overlay.coordinates[i + 1]; const arrow = document.createElement("span"); arrow.className = "atlas-map-route-arrow"; arrow.textContent = "›"; arrow.setAttribute("aria-hidden", "true");
        const marker = new maplibregl.Marker({ element: arrow, anchor: "center" }).setLngLat([(point[0] + next[0]) / 2, (point[1] + next[1]) / 2]).addTo(map); (map as any).__atlasArrows ??= []; (map as any).__atlasArrows.push(marker);
      });
    });
    const markers = item.places.map((place, originalIndex) => ({ place, originalIndex })).filter(({ place }) => place.coordinates && place.certainty !== "unknown" && (!visiblePlaceIds || visiblePlaceIds.has(place.id))).map(({ place, originalIndex }) => {
      const el = document.createElement("button"); el.className = "atlas-map-marker"; el.textContent = String(originalIndex + 1);
      el.dataset.certainty = place.certainty; el.dataset.selected = String(place.id === selectedPlaceId); el.ariaLabel = `${originalIndex + 1}. ${place.name}: selecionar lugar`;
      el.title = `${place.name} · ${place.modernName}`; el.onclick = () => onPlace(place.id);
      return new maplibregl.Marker({ element: el }).setLngLat(place.coordinates!).addTo(map);
    });
    return () => { markers.forEach(m => m.remove()); layers.forEach(id => { if (map.getLayer(id)) map.removeLayer(id); if (map.getSource(id)) map.removeSource(id); }); const arrows = (map as any).__atlasArrows ?? []; arrows.forEach((a: maplibregl.Marker) => a.remove()); (map as any).__atlasArrows = []; };
  }, [item, mode, ready, error, selectedPlaceId, visibleOverlays, visiblePlaceIds, onPlace]);
  useEffect(() => {
    const map = mapRef.current; const place = item.places.find(p => p.id === selectedPlaceId);
    if (map && ready && place?.coordinates) map.flyTo({ center: place.coordinates, zoom: Math.max(map.getZoom(), 4.6), duration: 650 });
  }, [selectedPlaceId, ready, item.places]);
  useEffect(() => {
    const map = mapRef.current; if (!map || !ready || mode !== "modern") return;
    let labels: maplibregl.Marker[] = [];
    const updateLabels = () => {
      labels.forEach(label => label.remove());
      const bounds = map.getBounds();
      labels = cities.filter(city => bounds.contains(city.geometry.coordinates))
        .sort((a, b) => Number(b.properties.POP_MAX ?? 0) - Number(a.properties.POP_MAX ?? 0))
        .slice(0, 24).map(city => {
          const el = document.createElement("span");
          el.className = "atlas-city";
          el.textContent = city.properties.NAME_EN || city.properties.NAME;
          return new maplibregl.Marker({ element: el, anchor: "bottom-left" }).setLngLat(city.geometry.coordinates).addTo(map);
        });
    };
    updateLabels();
    map.on("moveend", updateLabels);
    return () => { map.off("moveend", updateLabels); labels.forEach(label => label.remove()); };
  }, [cities, ready, mode]);
  return <div className="atlas-stage"><div ref={node} className="atlas-map" aria-label="Mapa histórico interativo" />{error ? <div className="atlas-map-error" role="alert">{error}<br /><span>Tente novamente recarregando a ficha.</span></div> : !ready ? <div className="atlas-map-error" role="status">Carregando mapa…</div> : null}<div className="atlas-attribution">Natural Earth · domínio público · OpenBible CC BY 4.0 · Pleiades CC BY 3.0</div></div>;
}