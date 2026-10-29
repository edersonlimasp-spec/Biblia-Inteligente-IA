import { useState, type MouseEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Newspaper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getApiUrl } from "@/lib/queryClient";

// Aba "Artigos" da Biblioteca: mostra os artigos do blog (importados do Soro
// automaticamente pelo servidor) e abre a leitura dentro do app.
const LEATHER_FROM = "#5C4632";
const LEATHER_TO = "#3F2F21";
const LEATHER_ACC = "#C9A87E";

interface ArticleSummary {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  published_at: string;
  has_cover: boolean;
}
interface ArticleFull extends ArticleSummary {
  html: string;
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return "";
  }
}

function ArticleCover({ article, className }: { article: ArticleSummary; className: string }) {
  if (article.has_cover) {
    return <img src={getApiUrl(`/blog/media/${article.id}`)} alt="" loading="lazy" className={`${className} object-cover`} />;
  }
  return (
    <div className={`${className} flex items-center justify-center`} style={{ background: `linear-gradient(158deg, ${LEATHER_FROM}, ${LEATHER_TO})` }}>
      <Newspaper className="w-8 h-8" style={{ color: LEATHER_ACC, opacity: 0.8 }} />
    </div>
  );
}

function ArticleReader({ slug, onClose }: { slug: string; onClose: () => void }) {
  const { data, isLoading, isError } = useQuery<ArticleFull>({
    queryKey: ["/api/blog-articles", slug],
    queryFn: async () => {
      const res = await fetch(getApiUrl(`/api/blog-articles/${slug}`));
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    staleTime: 5 * 60_000,
  });

  // Links do texto abrem fora do app, sem tirar o leitor da Biblioteca.
  const handleLinks = (event: MouseEvent<HTMLDivElement>) => {
    const link = (event.target as HTMLElement).closest("a");
    const href = link?.getAttribute("href");
    if (!link || !href) return;
    event.preventDefault();
    if (/^https?:\/\//i.test(href)) window.open(href, "_blank", "noopener");
  };

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto overflow-x-hidden" data-testid="library-article-reader">
      <header
        className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border"
        style={{ paddingTop: "var(--safe-area-inset-top,env(safe-area-inset-top,0px))" }}
      >
        <div className="max-w-2xl mx-auto px-3 py-2 flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-article-back">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Biblioteca › Artigos</p>
        </div>
      </header>
      <article
        className="max-w-2xl mx-auto px-4 py-5"
        style={{ paddingBottom: "calc(3rem + var(--safe-area-inset-bottom,env(safe-area-inset-bottom,0px)))" }}
      >
        {isLoading && <p className="text-sm text-muted-foreground py-10 text-center">Carregando artigo…</p>}
        {isError && (
          <p className="text-sm text-muted-foreground py-10 text-center">
            Não foi possível abrir o artigo agora. Verifique sua conexão e tente novamente.
          </p>
        )}
        {data && (
          <>
            {data.has_cover && <ArticleCover article={data} className="w-full aspect-[16/9] rounded-xl mb-4" />}
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] mb-1" style={{ color: LEATHER_ACC }}>
              Artigo · {formatDate(data.published_at)}
            </p>
            <h1 className="font-serif text-2xl font-bold leading-tight text-foreground mb-4">{data.title}</h1>
            <div
              onClick={handleLinks}
              className="prose prose-neutral dark:prose-invert max-w-none prose-headings:font-serif prose-p:leading-7"
              dangerouslySetInnerHTML={{ __html: data.html }}
            />
          </>
        )}
      </article>
    </div>
  );
}

export function LibraryArticles() {
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const { data: articles = [] } = useQuery<ArticleSummary[]>({
    queryKey: ["/api/blog-articles"],
    queryFn: async () => {
      const res = await fetch(getApiUrl("/api/blog-articles"));
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    staleTime: 10 * 60_000,
  });

  if (!articles.length) return null;

  return (
    <div className="mb-7" data-testid="library-articles">
      <div className="flex items-center justify-between mb-3 px-0.5">
        <h2 className="font-serif text-base font-semibold text-foreground">Artigos</h2>
        <span className="text-[10px] font-mono text-muted-foreground">
          {articles.length} artigo{articles.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
        {articles.map((article) => (
          <button
            key={article.id}
            type="button"
            onClick={() => setOpenSlug(article.slug)}
            className="flex-shrink-0 w-56 text-left rounded-xl overflow-hidden border border-border bg-card"
            data-testid={`article-card-${article.slug}`}
          >
            <ArticleCover article={article} className="w-full aspect-[16/9]" />
            <div className="p-2.5">
              <p className="text-[10px] font-mono mb-1" style={{ color: LEATHER_ACC }}>{formatDate(article.published_at)}</p>
              <p className="text-sm font-medium text-foreground leading-snug line-clamp-2">{article.title}</p>
              <p className="text-xs text-muted-foreground leading-snug line-clamp-2 mt-1">{article.excerpt}</p>
            </div>
          </button>
        ))}
      </div>
      {openSlug && <ArticleReader slug={openSlug} onClose={() => setOpenSlug(null)} />}
    </div>
  );
}
