import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen, Check, ChevronRight, FileText, Image as ImageIcon, Loader2,
  Newspaper, RefreshCw, Search, Settings2, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getApiUrl, getAuthHeaders } from "@/lib/queryClient";

type Status = "new" | "queued" | "discarded";
type ArticleStatus = "draft" | "published" | "rejected";
type Section = "keywords" | "drafts" | "published" | "settings";

interface Keyword {
  id: string | number;
  seed: string;
  keyword: string;
  intent: string;
  relevance: number | string;
  status: Status;
  reason: string | null;
  created_at: string;
}

interface Article {
  id: string | number;
  keyword_id: string | number | null;
  title: string;
  slug: string;
  meta_description: string;
  body_markdown: string;
  cover_alt: string;
  has_cover: boolean;
  status: ArticleStatus;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

interface BlogSettings {
  tone: string;
  audience: string;
  editorial_rules: string;
  schedule_enabled: boolean;
  daily_limit: number;
}

const NAV: { id: Section; label: string; icon: typeof Search }[] = [
  { id: "keywords", label: "Palavras-chave", icon: Search },
  { id: "drafts", label: "Fila / Rascunhos", icon: FileText },
  { id: "published", label: "Publicados", icon: Newspaper },
  { id: "settings", label: "Configurações", icon: Settings2 },
];

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(getApiUrl(path), {
    ...options,
    credentials: "include",
    headers: {
      ...(options?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...getAuthHeaders(),
      ...(options?.headers ?? {}),
    },
  });
  if (!res.ok) {
    let message = `Erro ${res.status}`;
    try {
      const data = await res.json();
      message = data.message || data.error || message;
    } catch {
      const text = await res.text().catch(() => "");
      if (text) message = text;
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

function dateLabel(value?: string | null) {
  if (!value) return "Ainda não publicado";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(date);
}

function statusLabel(status: string) {
  const labels: Record<string, string> = { new: "Nova", queued: "Na fila", generating: "Gerando", used: "Usada", discarded: "Descartada", draft: "Rascunho", published: "Publicado", rejected: "Rejeitado" };
  return labels[status] || status;
}

function ErrorState({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
      <p className="font-medium">Não foi possível carregar este conteúdo.</p>
      <p className="text-muted-foreground">{error.message}</p>
      <Button variant="outline" size="sm" onClick={retry}><RefreshCw className="mr-2 h-4 w-4" />Tentar novamente</Button>
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="space-y-3" aria-label="Carregando">
      {[0, 1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-lg bg-muted/70" />)}
    </div>
  );
}

export function AdminBlog() {
  const [section, setSection] = useState<Section>("keywords");
  const [seed, setSeed] = useState("");
  const [keywordFilter, setKeywordFilter] = useState<Status | "all">("all");
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [settingsForm, setSettingsForm] = useState<BlogSettings | null>(null);
  const [draftFilter, setDraftFilter] = useState<ArticleStatus>("draft");
  const qc = useQueryClient();
  const { toast } = useToast();

  const keywordsQuery = useQuery({
    queryKey: ["/api/admin/blog/keywords"],
    queryFn: () => apiFetch<{ keywords: Keyword[] }>("/api/admin/blog/keywords"),
  });
  const draftQuery = useQuery({
    queryKey: ["/api/admin/blog/articles", "draft"],
    queryFn: () => apiFetch<{ articles: Article[] }>("/api/admin/blog/articles?status=draft"),
  });
  const publishedQuery = useQuery({
    queryKey: ["/api/admin/blog/articles", "published"],
    queryFn: () => apiFetch<{ articles: Article[] }>("/api/admin/blog/articles?status=published"),
  });
  const rejectedQuery = useQuery({
    queryKey: ["/api/admin/blog/articles", "rejected"],
    queryFn: () => apiFetch<{ articles: Article[] }>("/api/admin/blog/articles?status=rejected"),
  });
  const settingsQuery = useQuery({
    queryKey: ["/api/admin/blog/settings"],
    queryFn: () => apiFetch<{ settings: BlogSettings }>("/api/admin/blog/settings"),
  });

  useEffect(() => {
    if (settingsQuery.data?.settings) setSettingsForm(settingsQuery.data.settings);
  }, [settingsQuery.data]);

  const refreshArticles = () => {
    qc.invalidateQueries({ queryKey: ["/api/admin/blog/articles"] });
  };
  const refreshKeywords = () => qc.invalidateQueries({ queryKey: ["/api/admin/blog/keywords"] });

  const suggestMutation = useMutation({
    mutationFn: (value: string) => apiFetch<{ keywords: Keyword[] }>("/api/admin/blog/keywords/suggest", {
      method: "POST", body: JSON.stringify({ seed: value }),
    }),
    onSuccess: (data) => {
      setSeed("");
      refreshKeywords();
      toast({ description: `${data.keywords?.length ?? 0} sugestões adicionadas à pesquisa.` });
    },
    onError: (error: Error) => toast({ variant: "destructive", description: `Não foi possível sugerir palavras-chave: ${error.message}` }),
  });

  const keywordStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string | number; status: Status }) =>
      apiFetch(`/api/admin/blog/keywords/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
    onSuccess: () => { refreshKeywords(); toast({ description: "Status da palavra-chave atualizado." }); },
    onError: (error: Error) => toast({ variant: "destructive", description: `Falha ao atualizar: ${error.message}` }),
  });

  const generateMutation = useMutation({
    mutationFn: (id: string | number) => apiFetch<{ article: Article }>(`/api/admin/blog/keywords/${id}/generate`, { method: "POST" }),
    onSuccess: (data) => {
      refreshKeywords();
      refreshArticles();
      setSection("drafts");
      setDraftFilter("draft");
      if (data.article?.id) setEditingId(data.article.id);
      toast({ description: "Rascunho gerado. Revise o conteúdo antes de publicar." });
    },
    onError: (error: Error) => toast({ variant: "destructive", description: `Não foi possível gerar o artigo: ${error.message}` }),
  });

  const articleAction = useMutation({
    mutationFn: ({ id, action, expectedUpdatedAt }: { id: string | number; action: "publish" | "reject" | "unpublish" | "regenerate" | "cover"; expectedUpdatedAt?: string }) =>
      apiFetch<{ article: Article }>(`/api/admin/blog/articles/${id}/${action}`, {
        method: "POST",
        ...(action === "regenerate" ? { body: JSON.stringify({ expected_updated_at: expectedUpdatedAt }) } : {}),
      }),
    onSuccess: (_data, vars) => {
      refreshArticles();
      toast({ description: ({
        publish: "Artigo publicado.",
        reject: "Artigo rejeitado.",
        unpublish: "Artigo retirado do ar.",
        regenerate: "Novo rascunho gerado.",
        cover: "Capa atualizada.",
      } as Record<string, string>)[vars.action] });
    },
    onError: (error: Error) => toast({ variant: "destructive", description: `Ação não concluída: ${error.message}` }),
  });

  const saveArticle = useMutation({
    mutationFn: ({ id, values }: { id: string | number; values: Partial<Article> & { expected_updated_at: string } }) =>
      apiFetch<{ article: Article }>(`/api/admin/blog/articles/${id}`, { method: "PATCH", body: JSON.stringify(values) }),
    onSuccess: () => { refreshArticles(); toast({ description: "Alterações salvas." }); },
    onError: (error: Error) => toast({ variant: "destructive", description: `Não foi possível salvar: ${error.message}` }),
  });

  const saveSettings = useMutation({
    mutationFn: (values: BlogSettings) => apiFetch<{ settings: BlogSettings }>("/api/admin/blog/settings", { method: "PUT", body: JSON.stringify(values) }),
    onSuccess: (data) => {
      setSettingsForm(data.settings);
      qc.setQueryData(["/api/admin/blog/settings"], data);
      toast({ description: "Configurações editoriais salvas." });
    },
    onError: (error: Error) => toast({ variant: "destructive", description: `Não foi possível salvar as configurações: ${error.message}` }),
  });

  const allArticles = useMemo(() => ({
    draft: draftQuery.data?.articles ?? [],
    published: publishedQuery.data?.articles ?? [],
    rejected: rejectedQuery.data?.articles ?? [],
  }), [draftQuery.data, publishedQuery.data, rejectedQuery.data]);
  const visibleArticles = section === "published" ? allArticles.published : allArticles[draftFilter];
  const selectedArticle = [...allArticles.draft, ...allArticles.published, ...allArticles.rejected].find((item) => item.id === editingId);
  const visibleKeywords = (keywordsQuery.data?.keywords ?? []).filter((item) => keywordFilter === "all" || item.status === keywordFilter);

  const confirmAction = (article: Article, action: "publish" | "unpublish" | "regenerate") => {
    const prompts = {
      publish: `Publicar “${article.title || "artigo sem título"}”? Ele ficará disponível em /blog/${article.slug}.`,
      unpublish: `Retirar “${article.title || "este artigo"}” do ar?`,
      regenerate: `Gerar novamente “${article.title || "este artigo"}”? O rascunho atual será substituído.`,
    };
    if (window.confirm(prompts[action])) articleAction.mutate({ id: article.id, action, expectedUpdatedAt: article.updated_at });
  };

  const coverUrl = selectedArticle?.has_cover ? getApiUrl(`/api/admin/blog/articles/${selectedArticle.id}/cover?v=${encodeURIComponent(selectedArticle.updated_at)}`) : null;
  const [coverSrc, setCoverSrc] = useState<string | null>(null);
  const [coverError, setCoverError] = useState(false);
  useEffect(() => {
    if (!coverUrl) {
      setCoverSrc(null);
      setCoverError(false);
      return;
    }
    let objectUrl = "";
    let active = true;
    fetch(coverUrl, { credentials: "include", headers: getAuthHeaders() })
      .then((res) => { if (!res.ok) throw new Error("Capa indisponível"); return res.blob(); })
      .then((blob) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setCoverSrc(objectUrl);
        setCoverError(false);
      })
      .catch(() => { if (active) setCoverError(true); });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [coverUrl]);

  const queryForSection = section === "keywords" ? keywordsQuery
    : section === "drafts" ? (draftFilter === "rejected" ? rejectedQuery : draftQuery)
    : section === "published" ? publishedQuery
    : settingsQuery;

  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden rounded-xl border border-border bg-card px-5 py-6 sm:px-7">
        <div className="absolute -right-8 -top-12 h-44 w-44 rounded-full border-[24px] border-primary/5" aria-hidden="true" />
        <div className="relative flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              <BookOpen className="h-4 w-4" /> Núcleo editorial
            </div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Blog bíblico</h2>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">Pesquise temas, revise cada texto e publique conteúdo fiel, claro e útil.</p>
          </div>
          <div className="flex gap-2 text-xs text-muted-foreground">
            <span className="rounded-md bg-muted px-3 py-2">{allArticles.draft.length} rascunhos</span>
            <span className="rounded-md bg-muted px-3 py-2">{allArticles.published.length} publicados</span>
          </div>
        </div>
      </header>

      <nav className="flex gap-1 overflow-x-auto border-b border-border" aria-label="Seções do blog">
        {NAV.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => { setSection(id); setEditingId(null); }}
            className={`flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors ${section === id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            <Icon className="h-4 w-4" />{label}
          </button>
        ))}
      </nav>

      {queryForSection.isLoading ? <LoadingRows /> : queryForSection.isError ? (
        <ErrorState error={queryForSection.error as Error} retry={() => queryForSection.refetch()} />
      ) : null}

      {!queryForSection.isLoading && !queryForSection.isError && section === "keywords" && (
        <section className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <form className="rounded-xl border border-border bg-card p-5" onSubmit={(event) => {
              event.preventDefault();
              const value = seed.trim();
              if (value) suggestMutation.mutate(value);
            }}>
              <div className="mb-4 flex items-start gap-3">
                <span className="rounded-lg bg-primary/10 p-2 text-primary"><Sparkles className="h-5 w-5" /></span>
                <div><h3 className="font-semibold">Encontrar temas de busca</h3><p className="mt-1 text-sm text-muted-foreground">Use um assunto bíblico como ponto de partida para descobrir perguntas relevantes.</p></div>
              </div>
              <label htmlFor="blog-seed" className="mb-1.5 block text-sm font-medium">Tema inicial</label>
              <div className="flex gap-2">
                <Input id="blog-seed" value={seed} onChange={(event) => setSeed(event.target.value)} placeholder="Ex.: parábolas de Jesus" maxLength={180} />
                <Button type="submit" disabled={!seed.trim() || suggestMutation.isPending}>
                  {suggestMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                  Sugerir
                </Button>
              </div>
              <p className="mt-3 border-l-2 border-primary/30 pl-3 text-xs leading-relaxed text-muted-foreground">As sugestões são sinais editoriais de relevância, não dados exatos de volume de busca. Confira fontes e contexto bíblico antes de aprovar.</p>
            </form>
            <div className="rounded-xl border border-border bg-muted/30 p-5">
              <div className="mb-3 flex items-center gap-2"><span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fluxo de revisão</span><ChevronRight className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-xs text-muted-foreground">pesquisa → fila → revisão</span></div>
              <p className="text-sm leading-relaxed text-muted-foreground">Coloque uma pauta na fila quando fizer sentido para a audiência. A geração cria apenas um rascunho; a decisão editorial e a aprovação final continuam com a equipe.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h3 className="text-lg font-semibold">Banco de pautas</h3><p className="text-sm text-muted-foreground">{visibleKeywords.length} {visibleKeywords.length === 1 ? "tema" : "temas"} nesta visualização</p></div>
            <div className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">
              {(["all", "new", "queued", "discarded"] as const).map((status) => <button key={status} onClick={() => setKeywordFilter(status)} className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${keywordFilter === status ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{status === "all" ? "Todas" : statusLabel(status)}</button>)}
            </div>
          </div>
          {!visibleKeywords.length ? (
            <div className="rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
              <Search className="mx-auto mb-3 h-7 w-7 text-muted-foreground/60" />
              <p className="font-medium">Nenhuma pauta nesta lista</p>
              <p className="mt-1 text-sm text-muted-foreground">Sugira temas ou escolha outro filtro para continuar.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {visibleKeywords.map((item) => (
                <article key={item.id} className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/25">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-semibold">{item.keyword}</h4>
                        <Badge variant={item.status === "queued" ? "default" : "secondary"}>{statusLabel(item.status)}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{item.reason || `Intenção: ${item.intent || "não especificada"}`}</p>
                      <p className="mt-2 text-xs text-muted-foreground">Tema: {item.seed} <span className="mx-1.5">·</span> Relevância: {item.relevance ?? "—"} <span className="mx-1.5">·</span> {dateLabel(item.created_at)}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {item.status !== "queued" && <Button size="sm" variant="outline" disabled={keywordStatusMutation.isPending} onClick={() => keywordStatusMutation.mutate({ id: item.id, status: "queued" })}>Adicionar à fila</Button>}
                      {item.status === "queued" && <Button size="sm" disabled={generateMutation.isPending} onClick={() => generateMutation.mutate(item.id)}><Sparkles className="mr-1.5 h-4 w-4" />Gerar rascunho</Button>}
                      {item.status !== "discarded" && <Button size="sm" variant="ghost" disabled={keywordStatusMutation.isPending} onClick={() => keywordStatusMutation.mutate({ id: item.id, status: "discarded" })}>Descartar</Button>}
                      {item.status === "discarded" && <Button size="sm" variant="ghost" disabled={keywordStatusMutation.isPending} onClick={() => keywordStatusMutation.mutate({ id: item.id, status: "new" })}>Restaurar</Button>}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {!queryForSection.isLoading && !queryForSection.isError && (section === "drafts" || section === "published") && (
        <section className="space-y-4">
          {section === "drafts" && <div className="flex gap-1 rounded-lg bg-muted p-1 w-fit">
            {(["draft", "rejected"] as const).map((status) => <button key={status} onClick={() => { setDraftFilter(status); setEditingId(null); }} className={`rounded-md px-3 py-1.5 text-sm font-medium ${draftFilter === status ? "bg-card shadow-sm" : "text-muted-foreground"}`}>{status === "draft" ? "Rascunhos" : "Rejeitados"}</button>)}
          </div>}
          <div className="grid gap-5 xl:grid-cols-[minmax(280px,0.82fr)_minmax(0,1.5fr)]">
            <div className="space-y-2">
              <div className="mb-3 flex items-center justify-between">
                <div><h3 className="font-semibold">{section === "published" ? "Artigos no ar" : statusLabel(draftFilter)}</h3><p className="text-xs text-muted-foreground">{visibleArticles.length} artigos</p></div>
              </div>
              {!visibleArticles.length ? (
                <div className="rounded-xl border border-dashed border-border bg-card px-5 py-10 text-center"><FileText className="mx-auto mb-3 h-6 w-6 text-muted-foreground/60" /><p className="font-medium">Ainda não há artigos aqui</p><p className="mt-1 text-sm text-muted-foreground">As pautas geradas aparecem nesta lista para revisão.</p></div>
              ) : visibleArticles.map((article) => <button key={article.id} onClick={() => setEditingId(article.id)} className={`w-full rounded-lg border p-4 text-left transition-colors ${editingId === article.id ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"}`}>
                <div className="mb-2 flex items-center justify-between gap-2"><Badge variant={article.status === "published" ? "default" : article.status === "rejected" ? "destructive" : "secondary"}>{statusLabel(article.status)}</Badge><span className="text-xs text-muted-foreground">{dateLabel(article.published_at || article.created_at)}</span></div>
                <p className="line-clamp-2 font-medium">{article.title || "Artigo sem título"}</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">/blog/{article.slug}</p>
              </button>)}
            </div>
            {selectedArticle ? <ArticleEditor
              key={`${selectedArticle.id}-${selectedArticle.updated_at}`}
              article={selectedArticle}
              coverSrc={coverSrc}
              coverError={coverError}
              saving={saveArticle.isPending}
              actionPending={articleAction.isPending}
              onSave={(values) => saveArticle.mutate({ id: selectedArticle.id, values })}
              onAction={(action) => action === "publish" || action === "unpublish" || action === "regenerate"
                ? confirmAction(selectedArticle, action)
                : articleAction.mutate({ id: selectedArticle.id, action })}
            /> : <div className="hidden min-h-72 items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center xl:flex"><div><BookOpen className="mx-auto mb-3 h-7 w-7 text-muted-foreground/50" /><p className="font-medium">Selecione um artigo</p><p className="mt-1 text-sm text-muted-foreground">O espaço de edição mantém a revisão junto ao conteúdo.</p></div></div>}
          </div>
        </section>
      )}

      {!queryForSection.isLoading && !queryForSection.isError && section === "settings" && settingsForm && (
        <section className="max-w-3xl space-y-5">
          <div><h3 className="text-lg font-semibold">Diretrizes editoriais</h3><p className="text-sm text-muted-foreground">Defina os limites e o ritmo de produção. Toda publicação ainda exige revisão humana.</p></div>
          <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <div><label className="mb-1.5 block text-sm font-medium" htmlFor="blog-tone">Tom editorial</label><Input id="blog-tone" value={settingsForm.tone} onChange={(e) => setSettingsForm({ ...settingsForm, tone: e.target.value })} placeholder="Ex.: acolhedor, fundamentado e claro" /></div>
              <div><label className="mb-1.5 block text-sm font-medium" htmlFor="blog-audience">Público principal</label><Input id="blog-audience" value={settingsForm.audience} onChange={(e) => setSettingsForm({ ...settingsForm, audience: e.target.value })} placeholder="Ex.: pessoas que estudam a Bíblia" /></div>
            </div>
            <div className="mt-5"><label className="mb-1.5 block text-sm font-medium" htmlFor="blog-rules">Regras e referências editoriais</label><Textarea id="blog-rules" rows={7} value={settingsForm.editorial_rules} onChange={(e) => setSettingsForm({ ...settingsForm, editorial_rules: e.target.value })} placeholder="Fontes preferidas, critérios de interpretação, temas sensíveis e orientações de citação..." /></div>
            <div className="mt-6 rounded-lg border border-border bg-muted/35 p-4">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div><p className="font-medium">Agendamento automático</p><p className="mt-1 text-sm text-muted-foreground">Desativado por padrão. Quando ativo, respeita o limite diário abaixo.</p></div>
                <button type="button" role="switch" aria-checked={settingsForm.schedule_enabled} onClick={() => setSettingsForm({ ...settingsForm, schedule_enabled: !settingsForm.schedule_enabled })} className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${settingsForm.schedule_enabled ? "bg-primary" : "bg-muted-foreground/30"}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-background transition-transform ${settingsForm.schedule_enabled ? "translate-x-6" : "translate-x-1"}`} /></button>
              </div>
              <div className="mt-4 max-w-xs"><label htmlFor="blog-limit" className="mb-1.5 block text-sm font-medium">Limite de artigos por dia</label><Input id="blog-limit" type="number" min={1} max={5} value={settingsForm.daily_limit} onChange={(e) => setSettingsForm({ ...settingsForm, daily_limit: Math.min(5, Math.max(1, Number(e.target.value) || 1)) })} disabled={!settingsForm.schedule_enabled} /></div>
            </div>
            <div className="mt-5 flex justify-end"><Button onClick={() => saveSettings.mutate(settingsForm)} disabled={saveSettings.isPending}>{saveSettings.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar diretrizes</Button></div>
          </div>
        </section>
      )}
    </div>
  );
}

function fieldsFor(article: Article) {
  return {
    title: article.title || "",
    slug: article.slug || "",
    meta_description: article.meta_description || "",
    body_markdown: article.body_markdown || "",
    cover_alt: article.cover_alt || "",
  };
}

function ArticleEditor({
  article, coverSrc, coverError, saving, actionPending, onSave, onAction,
}: {
  article: Article;
  coverSrc: string | null;
  coverError: boolean;
  saving: boolean;
  actionPending: boolean;
  onSave: (values: Partial<Article> & { expected_updated_at: string }) => void;
  onAction: (action: "publish" | "reject" | "unpublish" | "regenerate" | "cover") => void;
}) {
  const [form, setForm] = useState(() => fieldsFor(article));
  const [baseRevision, setBaseRevision] = useState(article.updated_at);
  const [revisionConflict, setRevisionConflict] = useState(false);
  const lastArticle = useRef(article);
  useEffect(() => {
    if (lastArticle.current.updated_at === article.updated_at) return;
    const before = fieldsFor(lastArticle.current);
    const changedLocally = (Object.keys(before) as Array<keyof typeof before>)
      .some((field) => form[field] !== before[field]);
    if (!changedLocally || (Object.keys(form) as Array<keyof typeof form>)
      .every((field) => form[field] === fieldsFor(article)[field])) {
      setForm(fieldsFor(article));
      setBaseRevision(article.updated_at);
      setRevisionConflict(false);
    } else {
      setRevisionConflict(true);
    }
    lastArticle.current = article;
  }, [article.updated_at]);
  const [previewMode, setPreviewMode] = useState(false);
  const dirty = form.title !== (article.title || "") || form.slug !== (article.slug || "") ||
    form.meta_description !== (article.meta_description || "") || form.body_markdown !== (article.body_markdown || "") ||
    form.cover_alt !== (article.cover_alt || "");

  return (
    <article className="min-w-0 rounded-xl border border-border bg-card">
      <div className="flex items-start justify-between gap-3 border-b border-border p-4 sm:p-5">
        <div className="min-w-0"><div className="mb-1 flex items-center gap-2"><Badge variant={article.status === "published" ? "default" : article.status === "rejected" ? "destructive" : "secondary"}>{statusLabel(article.status)}</Badge><span className="text-xs text-muted-foreground">Atualizado {dateLabel(article.created_at)}</span></div><h3 className="truncate font-semibold">{article.title || "Novo rascunho"}</h3></div>
        {article.status === "published" && <a href={`/blog/${article.slug}`} target="_blank" rel="noreferrer" className="shrink-0 text-xs font-medium text-primary underline-offset-4 hover:underline">Ver publicado</a>}
      </div>
      <div className="space-y-4 p-4 sm:p-5">
        <div><label className="mb-1.5 block text-sm font-medium" htmlFor={`article-title-${article.id}`}>Título</label><Input id={`article-title-${article.id}`} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="mb-1.5 block text-sm font-medium" htmlFor={`article-slug-${article.id}`}>Slug</label><Input id={`article-slug-${article.id}`} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} disabled={article.status === "published"} /><p className="mt-1 text-xs text-muted-foreground">{article.status === "published" ? "Endereço fixo após a publicação para preservar os links existentes." : "Você pode ajustar antes de publicar."}</p></div>
          <div><label className="mb-1.5 block text-sm font-medium" htmlFor={`article-alt-${article.id}`}>Texto alternativo da capa</label><Input id={`article-alt-${article.id}`} value={form.cover_alt} onChange={(e) => setForm({ ...form, cover_alt: e.target.value })} placeholder="Descreva a imagem para leitores de tela" /></div>
        </div>
        <div><label className="mb-1.5 block text-sm font-medium" htmlFor={`article-meta-${article.id}`}>Descrição para buscadores</label><Textarea id={`article-meta-${article.id}`} rows={2} maxLength={155} value={form.meta_description} onChange={(e) => setForm({ ...form, meta_description: e.target.value })} /><p className="mt-1 text-right text-xs text-muted-foreground">{form.meta_description.length}/155</p></div>
        <div>
          <div className="mb-1.5 flex items-center justify-between"><label className="text-sm font-medium" htmlFor={`article-body-${article.id}`}>Conteúdo em Markdown</label><button type="button" onClick={() => setPreviewMode(!previewMode)} className="text-xs font-medium text-primary hover:underline">{previewMode ? "Editar texto" : "Pré-visualizar"}</button></div>
          {previewMode ? <div className="min-h-64 whitespace-pre-wrap rounded-md border border-input bg-muted/20 p-4 text-sm leading-7">{form.body_markdown || "O conteúdo aparecerá aqui."}</div> : <Textarea id={`article-body-${article.id}`} rows={16} value={form.body_markdown} onChange={(e) => setForm({ ...form, body_markdown: e.target.value })} className="font-mono text-sm leading-6" />}
        </div>
        <div className="rounded-lg border border-border bg-muted/20 p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-medium"><ImageIcon className="h-4 w-4 text-muted-foreground" />Capa editorial</div>
            {article.status !== "published" && <Button size="sm" variant="outline" onClick={() => onAction("cover")} disabled={actionPending}><RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${actionPending ? "animate-spin" : ""}`} />Regenerar capa</Button>}
          </div>
          {coverSrc ? <img src={coverSrc} alt={form.cover_alt || "Prévia da capa do artigo"} className="max-h-56 w-full rounded-md object-cover" /> : <div className="flex min-h-24 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">{coverError ? "Não foi possível carregar a capa." : article.has_cover ? "Carregando prévia da capa…" : "Ainda não há capa para este artigo."}</div>}
        </div>
        {revisionConflict && <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">Outra alteração foi salva enquanto você editava. Suas mudanças foram preservadas. <Button size="sm" variant="outline" className="ml-2" onClick={() => { setForm(fieldsFor(article)); setBaseRevision(article.updated_at); setRevisionConflict(false); }}>Descartar minhas mudanças e recarregar</Button></div>}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <div className="flex flex-wrap gap-2">
            {article.status === "published" ? <Button variant="outline" onClick={() => onAction("unpublish")} disabled={actionPending}>Retirar do ar</Button> : <>
              {article.status === "draft" && <Button onClick={() => onAction("publish")} disabled={actionPending || dirty}><Check className="mr-1.5 h-4 w-4" />Publicar</Button>}
              {article.status !== "rejected" && <Button variant="outline" onClick={() => onAction("reject")} disabled={actionPending}>Rejeitar</Button>}
            </>}
            {article.status !== "published" && <Button variant="ghost" onClick={() => onAction("regenerate")} disabled={actionPending}>Gerar novamente</Button>}
          </div>
          <Button variant="outline" onClick={() => onSave({ ...form, expected_updated_at: baseRevision })} disabled={saving || !dirty || revisionConflict}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar alterações</Button>
        </div>
        {dirty && <p className="text-xs text-muted-foreground">Salve as alterações antes de publicar.</p>}
        {article.status === "published" && <p className="text-xs text-muted-foreground">Publicado em {dateLabel(article.published_at)} · /blog/{article.slug}</p>}
      </div>
    </article>
  );
}