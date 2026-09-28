import { Badge } from "@/components/ui/badge";

export interface BlogStatsResponse {
  stats: { keywords: number; queued: number; drafts: number; published: number; failures: number; page_views: number };
  jobs: Array<{ id: string; status: string; message: string; started_at: string; finished_at: string | null }>;
  top_articles: Array<{ title: string; slug: string; views: number }>;
  storage_ready: boolean;
}

export function BlogMetrics({ data }: { data: BlogStatsResponse }) {
  const cards = [
    ["Palavras-chave", data.stats.keywords],
    ["Na fila", data.stats.queued],
    ["Rascunhos", data.stats.drafts],
    ["Publicados", data.stats.published],
    ["Visualizações", data.stats.page_views],
    ["Falhas agendadas", data.stats.failures],
  ] as const;
  return (
    <section className="space-y-5">
      <div><h3 className="text-lg font-semibold">Visão geral do blog</h3>
        <p className="text-sm text-muted-foreground">Visualizações são requisições aos artigos; podem incluir robôs. Não são dados do Google Search Console.</p></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(([label, value]) => <div key={label} className="rounded-xl border border-border bg-card p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-3xl font-semibold">{value ?? 0}</p></div>)}
      </div>
      {!data.storage_ready && <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
        Capas e publicação automática indisponíveis: adicione um bucket do App Storage ao projeto. Rascunhos de texto e publicação manual continuam funcionando.
      </div>}
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h4 className="mb-3 font-semibold">Artigos mais acessados</h4>
          {!data.top_articles.length && <p className="text-sm text-muted-foreground">Sem artigos publicados.</p>}
          <div className="space-y-2">{data.top_articles.map((item) => <div key={item.slug} className="flex justify-between gap-3 border-t border-border pt-2 text-sm"><a href={`/blog/${item.slug}`} target="_blank" rel="noreferrer" className="text-primary hover:underline">{item.title}</a><span className="shrink-0">{item.views} acessos</span></div>)}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h4 className="mb-3 font-semibold">Execuções recentes do agendador</h4>
          {!data.jobs.length && <p className="text-sm text-muted-foreground">Ainda não houve execuções.</p>}
          <div className="max-h-96 space-y-3 overflow-y-auto">{data.jobs.map((job) => <div key={job.id} className="border-t border-border pt-2 text-sm">
            <div className="flex items-center justify-between gap-2">
              <Badge variant={job.status === "failed" ? "destructive" : "secondary"}>{job.status === "succeeded" ? "Concluído" : job.status === "failed" ? "Falhou" : "Em andamento"}</Badge>
              <span className="text-xs text-muted-foreground">{new Date(job.started_at).toLocaleString("pt-BR")}</span>
            </div>
            <p className="mt-1 text-muted-foreground">{job.message || "Processando..."}</p>
          </div>)}</div>
        </div>
      </div>
    </section>
  );
}