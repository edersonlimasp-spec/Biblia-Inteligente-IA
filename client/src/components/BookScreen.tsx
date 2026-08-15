import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ChevronLeft, BookOpen, Clock, Lock, CheckCircle2,
  Sparkles, ShieldCheck, Highlighter, Download, Loader2, Trash2,
} from "lucide-react";
import { saveChapterToCache, isChapterCached, clearBookChapterCache, getBookCacheSize, formatBytes } from "@/lib/chapterCache";
import { LibraryHighlightItem, type LibraryHighlightItemData } from "@/components/LibraryHighlightItem";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { getApiUrl, queryClient, getAuthHeaders } from "@/lib/queryClient";
import { BookCover } from "@/components/BookCover";

// ── Leather palette — exclusive to Biblioteca ──────────────────────────
const LEATHER_FROM = "#5C4632";
const LEATHER_TO   = "#3F2F21";
const LEATHER_ACC  = "#C9A87E";

interface BookDetail {
  id: string;
  title: string;
  subtitle: string | null;
  author: string;
  description: string | null;
  coverUrl: string | null;
  category: string;
  accessType: string;
  price: string | null;
  planRequired: string | null;
  estimatedReadTime: string | null;
  chaptersCount: number;
  publishStatus: string;
  isNew: boolean;
  editionNote: string | null;
  accessState: "sample" | "owned" | "locked";
  progress: {
    currentChapter: number;
    percentComplete: number;
  } | null;
}

interface ChapterItem {
  id: string;
  orderNum: number;
  title: string;
  estimatedReadTime: string | null;
  isSample: boolean;
  accessState: "sample" | "owned" | "locked";
}

interface BookScreenProps {
  bookId: string;
  onBack: () => void;
  onNavigateToReader: (bookId: string, chapterNum: number, bookTitle: string) => void;
  onNavigateToSubscriptions: () => void;
}

interface HighlightRow {
  id: string;
  chapterId: string;
  selectedText: string;
  color: string;
  annotation: string | null;
  createdAt: string;
}

export function BookScreen({ bookId, onBack, onNavigateToReader, onNavigateToSubscriptions }: BookScreenProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"chapters" | "highlights">("chapters");

  // ── Download do livro para leitura offline ────────────────────────────
  const cacheUserId = user?.id ?? "guest";
  const [downloadState, setDownloadState] = useState<"idle" | "downloading" | "done" | "error">("idle");
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0 });
  const cancelDownloadRef = useRef(false);
  useEffect(() => () => { cancelDownloadRef.current = true; }, []);
  const [allCached, setAllCached] = useState(false);
  const [cacheSize, setCacheSize] = useState<{ chapters: number; bytes: number } | null>(null);
  const [removingDownload, setRemovingDownload] = useState(false);

  const { data: book, isLoading: bookLoading, isError: bookError } = useQuery<BookDetail>({
    queryKey: ["/api/library/books", bookId],
    queryFn: async () => {
      const res = await fetch(getApiUrl(`/api/library/books/${bookId}`), { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Livro não encontrado");
      return res.json();
    },
  });

  const { data: chapters = [], isLoading: chaptersLoading } = useQuery<ChapterItem[]>({
    queryKey: ["/api/library/books", bookId, "chapters"],
    queryFn: async () => {
      const res = await fetch(getApiUrl(`/api/library/books/${bookId}/chapters`), { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Erro ao buscar capítulos");
      return res.json();
    },
    enabled: !!bookId,
  });

  // Guarda contra respostas assíncronas atrasadas após troca de livro/desmontagem.
  const allCachedCheckId = useRef(0);
  useEffect(() => {
    const id = ++allCachedCheckId.current;
    (async () => {
      const accessible = chapters.filter(c => c.accessState !== "locked");
      if (accessible.length === 0) {
        if (allCachedCheckId.current === id) setAllCached(false);
        return;
      }
      const results = await Promise.all(
        accessible.map(c => isChapterCached(cacheUserId, bookId, c.orderNum))
      );
      if (allCachedCheckId.current === id) setAllCached(results.every(Boolean));
    })();
  }, [chapters, cacheUserId, bookId]);

  // Tamanho aproximado do cache do livro (para o botão "Remover download").
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const size = await getBookCacheSize(cacheUserId, bookId);
      if (!cancelled) setCacheSize(size);
    })();
    return () => { cancelled = true; };
  }, [cacheUserId, bookId, allCached, downloadState]);

  const handleRemoveDownload = async () => {
    if (removingDownload) return;
    setRemovingDownload(true);
    try {
      await clearBookChapterCache(cacheUserId, bookId);
      setAllCached(false);
      setDownloadState("idle");
      setCacheSize({ chapters: 0, bytes: 0 });
    } finally {
      setRemovingDownload(false);
    }
  };

  const { data: highlights = [], isLoading: highlightsLoading } = useQuery<HighlightRow[]>({
    queryKey: ["/api/library/highlights", bookId],
    queryFn: async () => {
      const res = await fetch(getApiUrl(`/api/library/highlights/${bookId}`), { credentials: "include", headers: getAuthHeaders() });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!bookId && !!user,
  });

  if (bookLoading) {
    return (
      <div className="min-h-screen bg-background overflow-x-hidden">
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border px-3 py-2 flex items-center gap-2"
          style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
          <Button variant="ghost" size="icon" onClick={onBack}><ChevronLeft className="w-5 h-5" /></Button>
        </div>
        <div className="max-w-lg mx-auto px-3 py-6 space-y-4">
          <Skeleton className="h-56 w-36 mx-auto rounded-xl" />
          <Skeleton className="h-6 w-3/4 mx-auto" />
          <Skeleton className="h-4 w-1/2 mx-auto" />
        </div>
      </div>
    );
  }

  if (bookError || !book) {
    return (
      <div className="min-h-screen bg-background overflow-x-hidden">
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border px-3 py-2 flex items-center gap-2"
          style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
          <Button variant="ghost" size="icon" onClick={onBack}><ChevronLeft className="w-5 h-5" /></Button>
        </div>
        <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-3">
          <p className="font-serif text-lg font-semibold">Livro não disponível</p>
          <p className="text-sm text-muted-foreground">
            Este livro não foi encontrado ou não está mais disponível na Biblioteca.
          </p>
          <Button variant="outline" onClick={onBack}>Voltar à Biblioteca</Button>
        </div>
      </div>
    );
  }

  const canRead = book.accessState === "owned" || book.accessState === "sample";
  const firstChapterNum = chapters[0]?.orderNum ?? 1;
  const resumeChapter = book.progress?.currentChapter ?? firstChapterNum;

  // Capítulos acessíveis (não bloqueados) — os que podem ser baixados
  const downloadableChapters = chapters.filter(c => c.accessState !== "locked");
  const showDownloadButton = book.accessState === "owned" && downloadableChapters.length > 0;

  const handleDownloadBook = async () => {
    if (downloadState === "downloading") return;
    cancelDownloadRef.current = false;
    setDownloadState("downloading");
    setDownloadProgress({ current: 0, total: downloadableChapters.length });
    let failed = false;
    let done = 0;
    for (const ch of downloadableChapters) {
      if (cancelDownloadRef.current) return;
      try {
        // Sempre (re)salva como fixado: capítulos baixados pelo botão
        // "Baixar" não expiram (diferente do cache de leitura, de 7 dias).
        const res = await fetch(
          getApiUrl(`/api/library/books/${bookId}/chapters/${ch.orderNum}`),
          { credentials: "include", headers: getAuthHeaders() }
        );
        if (!res.ok) { failed = true; continue; }
        const data = await res.json();
        await saveChapterToCache(cacheUserId, bookId, ch.orderNum, data, { pinned: true });
      } catch {
        failed = true;
      }
      done++;
      if (!cancelDownloadRef.current) setDownloadProgress({ current: done, total: downloadableChapters.length });
    }
    if (cancelDownloadRef.current) return;
    setDownloadState(failed ? "error" : "done");
    if (!failed) setAllCached(true);
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header */}
      <header
        className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="max-w-lg mx-auto px-3 py-2 flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-book-back">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Biblioteca › {book.category}
          </p>
        </div>
      </header>

      <div
        className="max-w-lg mx-auto px-4 py-6 overflow-x-hidden"
        style={{ paddingBottom: "calc(4rem + env(safe-area-inset-bottom, 0px))" }}
      >
        {/* Cover */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
          className="flex justify-center mb-6"
        >
          <div
            className="w-36 aspect-[2/3] rounded-xl overflow-hidden"
            style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.25)" }}
          >
            <BookCover coverUrl={book.coverUrl} title={book.title} category={book.category} size="lg" />
          </div>
        </motion.div>

        {/* Title */}
        <div className="text-center mb-4">
          <h1 className="font-serif text-xl font-bold text-foreground leading-tight mb-1">{book.title}</h1>
          {book.subtitle && <p className="text-sm text-muted-foreground mb-1">{book.subtitle}</p>}
          <p className="text-sm font-medium text-foreground/70">{book.author}</p>
        </div>

        {/* Meta pills */}
        <div className="flex items-center justify-center gap-2 flex-wrap mb-5">
          {book.chaptersCount > 0 && (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-muted text-muted-foreground">
              {book.chaptersCount} capítulos
            </span>
          )}
          {book.estimatedReadTime && (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-muted text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" /> {book.estimatedReadTime}
            </span>
          )}
          <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-muted text-muted-foreground">
            Livro digital
          </span>
        </div>

        {/* Description */}
        {book.description && (
          <p className="text-sm text-foreground/80 leading-relaxed mb-3">{book.description}</p>
        )}

        {/* Edition note */}
        {book.editionNote && (
          <div
            className="mb-5 pl-3 py-1 border-l-2"
            style={{ borderColor: `${LEATHER_ACC}70` }}
          >
            <p className="text-[11px] text-muted-foreground leading-relaxed italic">{book.editionNote}</p>
          </div>
        )}

        {/* Acesso completo liberado */}
        {book.accessState === "owned" && (
          <div className="flex items-center gap-2 rounded-lg p-3 mb-5 bg-emerald-500/10 border border-emerald-500/20">
            <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <p className="text-xs text-emerald-600 dark:text-emerald-400">
              Você tem acesso completo a este livro
            </p>
          </div>
        )}

        {/* Livro Premium — conteúdo completo para assinantes */}
        {book.accessState !== "owned" && (
          <button
            type="button"
            onClick={onNavigateToSubscriptions}
            className="w-full flex items-center gap-2 rounded-lg p-3 mb-5 text-left"
            style={{ background: `${LEATHER_FROM}18`, border: `1px solid ${LEATHER_FROM}40` }}
            data-testid="banner-premium-book"
          >
            <Sparkles className="w-4 h-4 flex-shrink-0" style={{ color: LEATHER_ACC }} />
            <p className="text-xs" style={{ color: LEATHER_ACC }}>
              Conteúdo completo para assinantes Premium — a amostra é gratuita.
              Conheça o plano ›
            </p>
          </button>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 mb-7">
          {/* Primary */}
          {canRead ? (
            <Button
              className="flex-1 font-semibold"
              style={{ background: `linear-gradient(158deg, ${LEATHER_FROM}, ${LEATHER_TO})`, color: "#fff", border: "none" }}
              onClick={() => onNavigateToReader(book.id, resumeChapter, book.title)}
              data-testid="button-read-now"
            >
              {book.progress ? "Continuar lendo" : "Ler agora"}
            </Button>
          ) : (
            <Button
              className="flex-1 font-semibold"
              variant="outline"
              onClick={onNavigateToSubscriptions}
              data-testid="button-see-plan"
            >
              Ver planos
            </Button>
          )}

          {/* Secondary: download para offline */}
          {showDownloadButton && (
            <Button
              variant="outline"
              className="flex-shrink-0"
              onClick={handleDownloadBook}
              disabled={downloadState === "downloading" || (allCached && downloadState !== "error")}
              data-testid="button-download-book"
              title={
                allCached || downloadState === "done"
                  ? "Livro baixado para leitura offline"
                  : "Baixar livro para ler offline"
              }
            >
              {downloadState === "downloading" ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-xs font-mono">
                    {downloadProgress.current}/{downloadProgress.total}
                  </span>
                </span>
              ) : allCached || downloadState === "done" ? (
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-xs">Baixado</span>
                </span>
              ) : downloadState === "error" ? (
                <span className="flex items-center gap-1.5">
                  <Download className="w-4 h-4" />
                  <span className="text-xs">Tentar de novo</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Download className="w-4 h-4" />
                  <span className="text-xs">Baixar</span>
                </span>
              )}
            </Button>
          )}

          {/* Secondary: sample */}
          {!canRead && chapters.some(c => c.isSample) && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onNavigateToReader(book.id, firstChapterNum, book.title)}
              data-testid="button-read-sample"
            >
              Ler amostra
            </Button>
          )}
        </div>

        {/* Download salvo: espaço ocupado + remover */}
        {showDownloadButton && (allCached || downloadState === "done") && cacheSize && cacheSize.chapters > 0 && (
          <div className="flex items-center justify-between gap-2 -mt-4 mb-7 px-1">
            <p className="text-xs text-muted-foreground" data-testid="text-download-size">
              Baixado no aparelho · {formatBytes(cacheSize.bytes)}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-destructive"
              onClick={handleRemoveDownload}
              disabled={removingDownload}
              data-testid="button-remove-download"
            >
              {removingDownload ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <span className="flex items-center gap-1">
                  <Trash2 className="w-3.5 h-3.5" />
                  Remover download
                </span>
              )}
            </Button>
          </div>
        )}

        {/* Tabs: Capítulos / Destaques */}
        <div className="flex gap-1 mb-4 p-1 rounded-lg bg-muted/60">
          <button
            type="button"
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "chapters" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
            }`}
            onClick={() => setActiveTab("chapters")}
            data-testid="tab-chapters"
          >
            <BookOpen className="w-4 h-4" /> Capítulos
          </button>
          <button
            type="button"
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "highlights" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
            }`}
            onClick={() => setActiveTab("highlights")}
            data-testid="tab-highlights"
          >
            <Highlighter className="w-4 h-4" /> Destaques
            {highlights.length > 0 && (
              <span
                className="text-[10px] font-mono px-1.5 py-0.5 rounded-full"
                style={{ background: `${LEATHER_ACC}25`, color: LEATHER_ACC }}
              >
                {highlights.length}
              </span>
            )}
          </button>
        </div>

        {/* Highlights tab */}
        {activeTab === "highlights" ? (
          highlightsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
            </div>
          ) : highlights.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Highlighter className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">Nenhum destaque neste livro</p>
              <p className="text-xs mt-1">Selecione um trecho durante a leitura para grifá-lo</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {highlights.map((h, idx) => {
                const chapter = chapters.find(c => c.id === h.chapterId);
                const item: LibraryHighlightItemData = {
                  id: h.id,
                  selectedText: h.selectedText,
                  color: h.color,
                  annotation: h.annotation,
                  chapterOrderNum: chapter?.orderNum ?? 0,
                  chapterTitle: chapter?.title ?? "",
                  createdAt: h.createdAt,
                };
                return (
                  <LibraryHighlightItem
                    key={h.id}
                    highlight={item}
                    onNavigate={
                      chapter && chapter.accessState !== "locked"
                        ? () => onNavigateToReader(book.id, chapter.orderNum, book.title)
                        : undefined
                    }
                    invalidateKeys={[["/api/library/highlights", bookId], ["/api/library/highlights"]]}
                    testId={`book-highlight-${idx}`}
                  />
                );
              })}
            </div>
          )
        ) : /* Chapter list */ chaptersLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
          </div>
        ) : chapters.length > 0 ? (
          <div>
            <div className="space-y-1.5">
              {chapters.map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  className="w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors hover:bg-muted/50 border border-border/50"
                  onClick={() =>
                    ch.accessState !== "locked"
                      ? onNavigateToReader(book.id, ch.orderNum, book.title)
                      : undefined
                  }
                  disabled={ch.accessState === "locked"}
                  data-testid={`chapter-item-${ch.orderNum}`}
                >
                  <span className="text-xs font-mono text-muted-foreground w-5 text-right flex-shrink-0">
                    {ch.orderNum}
                  </span>
                  <span className="flex-1 text-sm text-foreground line-clamp-1">{ch.title}</span>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {ch.isSample && (
                      <span
                        className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-full"
                        style={{ background: `${LEATHER_ACC}25`, color: LEATHER_ACC }}
                      >
                        Amostra
                      </span>
                    )}
                    {ch.estimatedReadTime && (
                      <span className="text-[10px] text-muted-foreground">{ch.estimatedReadTime}</span>
                    )}
                    {ch.accessState === "locked" ? (
                      <span className="flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5 text-muted-foreground/50" />
                        <span className="text-[9px] font-mono uppercase text-muted-foreground/60">
                          Premium
                        </span>
                      </span>
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" style={{ color: `${LEATHER_ACC}80` }} />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
