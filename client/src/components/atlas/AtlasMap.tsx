import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { AtlasItem } from "@shared/atlas";

export type AtlasMode = "ancient" | "modern";
export const overlayColor = (index: number) => ["#ef8174", "#efca78", "#81d2d0", "#c7a3ef"][index % 4];
type City = { geometry: { coordinates: [number, number] }; properties: { NAME: string; NAME_EN?: string; POP_MAX?: number } };

export function AtlasMap({ item, mode, selectedPlaceId, visibleOverlays, onPlace }: {
  item: AtlasItem; mode: AtlasMode; selectedPlaceId?: string;
  visibleOverlays: Set<string>; onPlace: (id: string) => void;
}) {
  const node = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [cities, setCities] = useState<City[]>([]);
  const [cityError, setCityError] = useState(false);
  useEffect(() => {
    if (!node.current) return;
    let map: maplibregl.Map | undefined;
    setReady(false);
    setError("");
    try {
      // Vite public assets are bundled in Capacitor's dist/public. Do not use the
      // remote API origin for the cartographic base, tiles, glyphs or labels.
      map = new maplibregl.Map({
        container: node.current, attributionControl: false,
        style: {
          version: 8,
          sources: {
            relief: { type: "image", url: "/atlas/base/relief.jpg", coordinates: [[-180, 85.05112878], [180, 85.05112878], [180, -85.05112878], [-180, -85.05112878]] },
            land: { type: "geojson", data: "/atlas/base/land.geojson" },
            rivers: { type: "geojson", data: "/atlas/base/rivers.geojson" },
            countries: { type: "geojson", data: "/atlas/base/countries.geojson" },
            lakes: { type: "geojson", data: "/atlas/base/lakes.geojson" },
          },
          layers: [
            { id: "relief", type: "raster", source: "relief", paint: { "raster-opacity": .56 } },
            { id: "land", type: "fill", source: "land", paint: { "fill-color": "#35536b", "fill-opacity": .23 } },
            { id: "lakes", type: "fill", source: "lakes", paint: { "fill-color": "#2a5875", "fill-opacity": .48 } },
            { id: "rivers", type: "line", source: "rivers", paint: { "line-color": "#78a9c6", "line-opacity": .52, "line-width": 1 } },
            { id: "borders", type: "line", source: "countries", layout: { visibility: "none" }, paint: { "line-color": "#bfd0dc", "line-opacity": .4, "line-width": .7 } },
          ],
        },
        center: [(item.bounds[0] + item.bounds[2]) / 2, (item.bounds[1] + item.bounds[3]) / 2],
        zoom: 2, maxZoom: 8, minZoom: 1,
      });
      mapRef.current = map;
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
      map.on("load", () => {
        map!.fitBounds([[item.bounds[0], item.bounds[1]], [item.bounds[2], item.bounds[3]]], { padding: 45, duration: 0 });
        setReady(true);
      });
      map.on("error", () => setError("Não foi possível carregar a base cartográfica. Consulte os lugares e as referências abaixo."));
    } catch {
      setError("O mapa interativo não está disponível neste dispositivo. Consulte a lista de lugares e as referências abaixo.");
    }
    return () => { mapRef.current = null; map?.remove(); };
  }, [item.id]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/atlas/base/cities.geojson", { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error("cities"); return response.json(); })
      .then(data => { if (!controller.signal.aborted) setCities(data.features); })
      .catch(() => { if (!controller.signal.aborted) setCityError(true); });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || error) return;
    // Only touch the style after its load event; load itself never uses stale props.
    map.setLayoutProperty("borders", "visibility", mode === "modern" ? "visible" : "none");
    const layerIds: string[] = [];
    item.overlays.forEach((overlay, index) => {
      if (!visibleOverlays.has(overlay.id)) return;
      const id = `atlas-${overlay.id}`;
      map.addSource(id, {
        type: "geojson",
        data: { type: "Feature", properties: {}, geometry: overlay.kind === "area"
          ? { type: "Polygon", coordinates: [overlay.coordinates] }
          : { type: "LineString", coordinates: overlay.coordinates } },
      });
      if (overlay.kind === "area") {
        map.addLayer({ id, type: "fill", source: id, paint: { "fill-color": overlayColor(index), "fill-opacity": .22 } });
      } else {
        map.addLayer({ id, type: "line", source: id, paint: {
          "line-color": overlayColor(index), "line-width": 3,
          "line-dasharray": overlay.certainty === "established" ? [1, 0] : [3, 2],
        } });
      }
      layerIds.push(id);
    });
    const markers = item.places.filter(place => place.coordinates).map(place => {
      const element = document.createElement("button");
      element.className = "atlas-map-marker";
      element.ariaLabel = `${place.name}: selecionar lugar`;
      element.title = place.name;
      element.dataset.selected = String(place.id === selectedPlaceId);
      element.onclick = () => onPlace(place.id);
      return new maplibregl.Marker({ element }).setLngLat(place.coordinates!).addTo(map);
    });
    return () => {
      markers.forEach(marker => marker.remove());
      layerIds.forEach(id => { if (map.getLayer(id)) map.removeLayer(id); if (map.getSource(id)) map.removeSource(id); });
    };
  }, [item, mode, ready, error, selectedPlaceId, visibleOverlays, onPlace]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || error || mode !== "modern") return;
    let labels: maplibregl.Marker[] = [];
    const update = () => {
      labels.forEach(label => label.remove());
      const bounds = map.getBounds();
      const threshold = map.getZoom() < 3 ? 1000000 : map.getZoom() < 5 ? 100000 : 0;
      labels = cities.filter(city => (city.properties.POP_MAX ?? 0) >= threshold && bounds.contains(city.geometry.coordinates))
        .sort((a, b) => (b.properties.POP_MAX ?? 0) - (a.properties.POP_MAX ?? 0)).slice(0, 24)
        .map(city => {
          const element = document.createElement("span");
          element.className = "atlas-city";
          element.textContent = city.properties.NAME_EN || city.properties.NAME;
          return new maplibregl.Marker({ element, anchor: "bottom-left" }).setLngLat(city.geometry.coordinates).addTo(map);
        });
    };
    update();
    map.on("moveend", update);
    return () => { map.off("moveend", update); labels.forEach(label => label.remove()); };
  }, [ready, error, mode, cities]);
  return (
    <div className="atlas-stage">
      <div ref={node} className="atlas-map" aria-label="Mapa histórico interativo" />
      {error ? <div className="atlas-map-error" role="alert">{error}</div> : !ready ? <div className="atlas-map-error" role="status">Carregando mapa…</div> : null}
      <div className="atlas-attribution">Natural Earth · domínio público · base generalizada{mode === "modern" && cityError ? " · Nomes de cidades indisponíveis" : ""}</div>
    </div>
  );
}