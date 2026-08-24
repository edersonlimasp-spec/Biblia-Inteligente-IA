import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ChevronLeft, Clock, BookOpen, BookMarked, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { getApiUrl, getAuthHeaders } from "@/lib/queryClient";
import { BookCover } from "@/components/BookCover";

// ── Paleta couro — exclusiva da Biblioteca ──────────────────────────────
const LEATHER_FROM = "#5C4632";
const LEATHER_TO   = "#3F2F21";
const LEATHER_ACC  = "#C9A87E";

const CATEGORIES = [
  "Devocionais",
  "Vida Cristã",
  "Ministério",
  "Estudo Bíblico e Teologia",
  "Família",
  "Clássicos",
] as const;

interface LibraryBook {
  id: string;
  title: string;
  subtitle: string | null;
  author: string;
  coverUrl: string | null;
  category: string;
  accessType: string;
  price: string | null;
  estimatedReadTime: string | null;
  chaptersCount: number;
  publishStatus: string;
  isNew: boolean;
  accessState: "sample" | "owned" | "locked";
}

interface LibraryReadingProgress {
  bookId: string;
  currentChapter: number;
  percentComplete: number;
  lastReadAt: string;
}

interface LibraryScreenProps {
  onBack: () => void;
  onNavigateToBook: (bookId: string, bookTitle: string) => void;
  onNavigateToReader: (bookId: string, chapterNum: number, bookTitle: string) => void;
}

// ── Book card ────────────────────────────────────────────────────────────
function BookCard({ book, onClick }: { book: LibraryBook; onClick: () => void }) {
  // Modelo único: livro completo é Premium. Quem já tem acesso vê "Ler";
  // quem não tem vê a marcação Premium (discreta) antes de entrar.
  const hasAccess = book.accessState === "owned";

  return (
    <button
      type="button"
      className="flex-shrink-0 w-28 text-left cursor-pointer"
      onClick={onClick}
      data-testid={`book-card-${book.id}`}
    >
      {/* Cover */}
      <div className="relative w-28 aspect-[2/3] rounded-lg overflow-hidden bg-muted mb-1.5">
        <BookCover coverUrl={book.coverUrl} title={book.title} category={book.category} size="md" />
        {book.isNew && (
          <span
            className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-wide font-semibold"
            style={{ background: LEATHER_ACC, color: LEATHER_TO }}
          >
            Novo
          </span>
        )}
      </div>

      {/* Access label */}
      {hasAccess ? (
        <p className="text-[10px] font-mono truncate" style={{ color: LEATHER_ACC }}>
          Ler
        </p>
      ) : (
        <p
          className="text-[10px] font-mono truncate flex items-center gap-1"
          style={{ color: LEATHER_ACC }}
          data-testid={`badge-premium-${book.id}`}
        >
          <Lock className="w-2.5 h-2.5 flex-shrink-0" style={{ opacity: 0.7 }} />
          Premium
        </p>
      )}
      <p className="text-xs font-medium text-foreground leading-tight line-clamp-2 mt-0.5">
        {book.title}
      </p>
    </button>
  );
}

// ── Category row ─────────────────────────────────────────────────────────
function CategoryRow({
  category, books, onNavigateToBook,
}: {
  category: string;
  books: LibraryBook[];
  onNavigateToBook: (id: string, title: string) => void;
}) {
  if (!books.length) return null;
  return (
    <div className="mb-7">
      <div className="flex items-center justify-between mb-3 px-0.5">
        <h2 className="font-serif text-base font-semibold text-foreground">{category}</h2>
        <span className="text-[10px] font-mono text-muted-foreground">{books.length} título{books.length !== 1 ? "s" : ""}</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
        {books.map((b) => (
          <BookCard key={b.id} book={b} onClick={() => onNavigateToBook(b.id, b.title)} />
        ))}
      </div>
    </div>
  );
}

// ── Continue reading card ────────────────────────────────────────────────
function ContinueReadingCard({
  book, progress, onPress,
}: {
  book: LibraryBook;
  progress: LibraryReadingProgress;
  onPress: () => void;
}) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      onClick={onPress}
      className="w-full text-left rounded-xl p-4 mb-6 overflow-hidden relative"
      style={{
        background: `linear-gradient(158deg, ${LEATHER_FROM}, ${LEATHER_TO})`,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.13), inset 0 0 0 1px rgba(255,255,255,0.06)",
      }}
      data-testid="continue-reading-card"
    >
      {/* Watermark */}
      <BookOpen
        className="absolute pointer-events-none"
        style={{ right: 12, top: 12, width: 48, height: 48, opacity: 0.07, color: "#fff" }}
        strokeWidth={1.2}
      />

      <div className="flex gap-3 items-start">
        {/* Thumbnail */}
        <div className="flex-shrink-0 w-14 aspect-[2/3] rounded-md overflow-hidden bg-black/20">
          <BookCover coverUrl={book.coverUrl} title={book.title} category={book.category} size="sm" />
        </div>

        <div className="flex-1 min-w-0">
          <span
            className="block font-mono text-[9px] uppercase tracking-[0.12em] mb-1"
            style={{ color: "rgba(255,255,255,0.55)" }}
          >
            Continuar lendo
          </span>
          <p className="font-serif text-white text-sm font-medium leading-snug line-clamp-2 mb-2">
            {book.title}
          </p>

          {/* Progress bar */}
          <div className="w-full h-1 rounded-full mb-1.5" style={{ background: "rgba(255,255,255,0.15)" }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${progress.percentComplete}%`, backgroundColor: LEATHER_ACC }}
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.55)" }}>
              Cap. {progress.currentChapter}
              {book.chaptersCount > 0 ? ` / ${book.chaptersCount}` : ""}
            </span>
            {book.estimatedReadTime && (
              <span className="text-[10px] flex items-center gap-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>
                <Clock className="w-2.5 h-2.5" /> {book.estimatedReadTime} restante
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.button>
  );
}

// ── Main screen ──────────────────────────────────────────────────────────
export function LibraryScreen({ onBack, onNavigateToBook, onNavigateToReader }: LibraryScreenProps) {
  const { user } = useAuth();

  const { data: books = [], isLoading } = useQuery<LibraryBook[]>({
    queryKey: ["/api/library/books"],
    queryFn: async () => {
      const res = await fetch(getApiUrl("/api/library/books"), { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    staleTime: 30_000,
  });

  // Last reading progress — from localStorage (same pattern as Bible)
  const lastProgress = useMemo<{ book: LibraryBook; progress: LibraryReadingProgress } | null>(() => {
    try {
      const raw = localStorage.getItem("library_last_progress");
      if (!raw) return null;
      const p: LibraryReadingProgress = JSON.parse(raw);
      const b = books.find(bk => bk.id === p.bookId);
      if (!b) return null;
      return { book: b, progress: p };
    } catch { return null; }
  }, [books]);

  const booksByCategory = useMemo(() => {
    const map: Record<string, LibraryBook[]> = {};
    for (const cat of CATEGORIES) map[cat] = [];
    for (const b of books) {
      if (map[b.category]) map[b.category].push(b);
      else map[b.category] = [b];
    }
    return map;
  }, [books]);

  const totalTitles = books.length;
  const shelvesWithContent = CATEGORIES.filter(c => booksByCategory[c]?.length > 0).length;

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header */}
      <header
        className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="max-w-2xl mx-auto px-3 py-2 flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-library-back">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Início › Biblioteca
            </p>
            <h1 className="font-serif text-lg font-bold text-foreground leading-tight">Biblioteca</h1>
          </div>
        </div>
      </header>

      <div
        className="max-w-2xl mx-auto px-3 py-4 overflow-x-hidden"
        style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom, 0px))" }}
      >
        {/* Sub-title counts */}
        <p className="text-[11px] font-mono text-muted-foreground mb-5">
          {shelvesWithContent} estante{shelvesWithContent !== 1 ? "s" : ""} · {totalTitles} título{totalTitles !== 1 ? "s" : ""}
          {user ? " · no seu plano" : ""}
        </p>

        {/* Continue reading */}
        {lastProgress && (
          <ContinueReadingCard
            book={lastProgress.book}
            progress={lastProgress.progress}
            onPress={() => onNavigateToReader(lastProgress.book.id, lastProgress.progress.currentChapter, lastProgress.book.title)}
          />
        )}

        {/* Category rows */}
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i}>
                <Skeleton className="h-4 w-32 mb-3" />
                <div className="flex gap-3">
                  {[1, 2, 3].map(j => <Skeleton key={j} className="w-28 h-44 rounded-lg flex-shrink-0" />)}
                </div>
              </div>
            ))}
          </div>
        ) : totalTitles === 0 ? (
          <div className="text-center py-16">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: `linear-gradient(158deg, ${LEATHER_FROM}, ${LEATHER_TO})` }}
            >
              <BookMarked className="w-8 h-8" style={{ color: LEATHER_ACC }} />
            </div>
            <p className="font-serif text-lg font-semibold text-foreground mb-1">Catálogo em preparação</p>
            <p className="text-sm text-muted-foreground">Os primeiros livros serão adicionados em breve.</p>
          </div>
        ) : (
          CATEGORIES.map(cat => (
            <CategoryRow
              key={cat}
              category={cat}
              books={booksByCategory[cat] ?? []}
              onNavigateToBook={onNavigateToBook}
            />
          ))
        )}
      </div>
    </div>
  );
}
