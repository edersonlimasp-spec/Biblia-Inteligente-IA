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
}

const filters = {
  testament: "Testamento", books: "Livro", period: "Período",
  characters: "Personagem", category: "Categoria", kind: "Tipo",
} as const;
const displayValue = (value: string) =>
  ({ AT: "Antigo Testamento", NT: "Novo Testamento", map: "Mapa", illustration: "Ilustração" }[value] ?? value);

export function AtlasScreen({ onBack, onSubscribe, onLogin }: AtlasScreenProps) {
  const { user, isLoading } = useAuth();
  const cache = useQueryClient();
  const identity = user?.id ?? "guest";
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<Record<string, string>>({});
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
  const items = catalog.data?.items ?? [];
  const filtered = useMemo(() => searchAtlas(items, query).filter(item =>
    Object.entries(active).every(([key, value]) => {
      const field = item[key as keyof AtlasSummary];
      return !value || (Array.isArray(field) ? field.includes(value) : field === value);
    }),
  ), [items, query, active]);
  const open = (id: string) => {
    const item = items.find(entry => entry.id === id);
    if (item?.locked && !catalog.data?.fullAccess) {
      user ? onSubscribe() : onLogin();
    } else setSelectedId(id);
  };
  const status = detail.error instanceof ApiError ? detail.error.status : undefined;
  return (
    <main className="atlas-root">
      <div className="atlas-shell">
        <header className="atlas-header">
          <button className="atlas-back" onClick={() => selectedId ? setSelectedId(undefined) : onBack()} aria-label={selectedId ? "Voltar ao catálogo" : "Voltar"}>‹</button>
          <div><div className="atlas-kicker">Estudo visual</div><h1>Atlas bíblico</h1></div>
        </header>
        {isLoading || catalog.isLoading ? <div className="atlas-loading">Carregando o catálogo de mapas…</div>
          : catalog.isError ? <div className="atlas-error" role="alert">Não foi possível carregar o atlas. <button className="atlas-button" onClick={() => catalog.refetch()}>Tentar novamente</button></div>
          : !selectedId ? (
            <div className="atlas-catalogue">
              <aside className="atlas-panel atlas-controls">
                <input className="atlas-search" type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Busque: êxodo, Jerusalém, Paulo…" aria-label="Buscar no atlas" />
                {Object.entries(filters).map(([key, label]) => (
                  <fieldset className="atlas-filter" key={key}>
                    <legend className="atlas-filter-title">{label}</legend>
                    <div className="atlas-chips">
                      {Array.from(new Set(items.flatMap(item => {
                        const field = item[key as keyof typeof filters];
                        return Array.isArray(field) ? field : [field];
                      }))).sort().map(value => (
                        <button key={value} className="atlas-chip" aria-pressed={active[key] === value} onClick={() => setActive(previous => ({ ...previous, [key]: previous[key] === value ? "" : value }))}>{displayValue(value)}</button>
                      ))}
                    </div>
                  </fieldset>
                ))}
              </aside>
              <section className="atlas-panel atlas-results" aria-live="polite">
                {filtered.length ? filtered.map(item => (
                  <button className="atlas-card" key={item.id} onClick={() => open(item.id)}>
                    <span className="atlas-kind">{displayValue(item.kind)}</span>
                    <span><span className="atlas-card-title">{item.title}</span><span className="atlas-card-sub">{item.subtitle} · {item.period}</span></span>
                    {item.locked && !catalog.data?.fullAccess ? <span className="atlas-lock">Assinatura</span> : <span className={`atlas-badge ${item.certainty}`}>{ATLAS_CERTAINTY_LABELS[item.certainty]}</span>}
                  </button>
                )) : <div className="atlas-empty">Nenhum resultado. Tente um lugar, personagem ou livro.</div>}
              </section>
            </div>
          ) : detail.isLoading ? <div className="atlas-loading">Abrindo a ficha histórica…</div>
            : detail.isError ? (
              <div className="atlas-error" role="alert">
                <p>{status === 401 ? "Entre na sua conta para continuar." : status === 403 ? "Este conteúdo exige uma assinatura ativa." : status === 404 ? "Esta ficha não foi encontrada." : "Não foi possível carregar esta ficha."}</p>
                {status === 401 ? <button className="atlas-button" onClick={onLogin}>Entrar</button> : status === 403 ? <button className="atlas-button" onClick={onSubscribe}>Ver planos</button> : <button className="atlas-button" onClick={() => detail.refetch()}>Tentar novamente</button>}
                <button className="atlas-chip" onClick={() => setSelectedId(undefined)}>Voltar ao catálogo</button>
              </div>
            ) : detail.data ? <AtlasDetail key={`${identity}:${detail.data.id}`} item={detail.data} items={items} onSelect={open} onBack={() => setSelectedId(undefined)} onLogin={onLogin} onSubscribe={onSubscribe} /> : null}
      </div>
    </main>
  );
}