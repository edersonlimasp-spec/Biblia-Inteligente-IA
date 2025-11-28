import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Bookmark, Search, Settings, ChevronLeft, ChevronRight, X, Shield, Share2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AIPanel } from "@/components/AIPanel";
import { StrongModal } from "@/components/StrongModal";
import { AlmeidaVersionSelector } from "@/components/AlmeidaVersionSelector";
import { VerseActions, HIGHLIGHT_COLORS } from "@/components/VerseActions";
import { AnnotationPanel } from "@/components/AnnotationPanel";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import logoSmall from "@assets/logo/logo-small.png";
import type { Bookmark as BookmarkType, Annotation } from "@shared/schema";

interface BibleBook {
  id: string;
  name: string;
  testament: 'old' | 'new';
  chapters: number;
}

interface Verse {
  verse: number;
  text: string;
}

interface Chapter {
  chapter: number;
  verses: Verse[];
}

interface BibleChapterData {
  book: BibleBook;
  chapter: Chapter;
}

interface BibleReaderProps {
  onNavigateToSubscriptions?: () => void;
  onNavigateToSettings?: () => void;
  onNavigateToHistory?: () => void;
  onNavigateToAdmin?: () => void;
}

interface StrongSearchResult {
  number: string;
  word: string;
  transliteration: string;
  pronunciation: string;
  definition: string;
  portugueseDefinition?: string | null;
  language: string;
}

interface StrongSearchResponse {
  results: StrongSearchResult[];
  total: number;
}

// Highlight storage key
const getHighlightsKey = () => 'bible-highlights';

// Helper to get highlights from localStorage
function getStoredHighlights(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(getHighlightsKey()) || '{}');
  } catch {
    return {};
  }
}

// Helper to save highlights to localStorage
function saveHighlights(highlights: Record<string, string>) {
  try {
    localStorage.setItem(getHighlightsKey(), JSON.stringify(highlights));
  } catch {}
}

export function BibleReader({ onNavigateToSubscriptions, onNavigateToSettings, onNavigateToHistory, onNavigateToAdmin }: BibleReaderProps) {
  const { trialActive, trialDaysRemaining, isAdmin, user } = useAuth();
  const { toast } = useToast();
  const [selectedBook, setSelectedBook] = useState("jhn");
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
  const [selectedStrongNumber, setSelectedStrongNumber] = useState<string | null>(null);
  const [searchingWord, setSearchingWord] = useState<string | null>(null);
  const [searchingVerseNum, setSearchingVerseNum] = useState<number | null>(null);
  const [wordsWithStrong, setWordsWithStrong] = useState<Set<string>>(new Set());
  const [textSearchQuery, setTextSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [highlights, setHighlights] = useState<Record<string, string>>(getStoredHighlights);
  const [selectedVersion, setSelectedVersion] = useState(() => {
    try {
      return localStorage.getItem("bible-version") || "ACF";
    } catch {
      return "ACF";
    }
  });
  const [fontSize, setFontSize] = useState(() => {
    try {
      return localStorage.getItem("bible-font-size") || "medium";
    } catch {
      return "medium";
    }
  });

  // Save version preference to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("bible-version", selectedVersion);
    } catch {}
  }, [selectedVersion]);

  // Core data queries - must be defined first
  const { data: books } = useQuery<BibleBook[]>({
    queryKey: ['/api/bible/books'],
  });

  const { data: chapterData, isLoading, error } = useQuery<BibleChapterData>({
    queryKey: ['/api/bible', selectedBook, selectedChapter],
    enabled: !!selectedBook && !!selectedChapter,
    retry: false,
  });

  // Query to search for Strong's number when clicking a word
  const { data: wordSearchResults } = useQuery<StrongSearchResponse>({
    queryKey: ['/api/strong/search', searchingWord, selectedBook, selectedChapter, searchingVerseNum],
    enabled: !!searchingWord && searchingVerseNum !== null,
    retry: false,
    queryFn: async () => {
      const searchParams = new URLSearchParams({
        book: selectedBook,
        chapter: selectedChapter.toString(),
        verse: searchingVerseNum!.toString(),
      });
      const response = await fetch(`/api/strong/search/${encodeURIComponent(searchingWord!)}?${searchParams}`);
      if (!response.ok) throw new Error('Strong search failed');
      return response.json();
    },
  });

  // Derived state - currentBook must be defined before handlers that use it
  const currentBook = books?.find(b => b.id === selectedBook);

  // Fetch bookmarks (user-scoped via API)
  const { data: bookmarks } = useQuery<BookmarkType[]>({
    queryKey: ['/api/bookmarks'],
    enabled: !!user,
  });

  // Fetch annotations (user-scoped via API)
  const { data: annotations } = useQuery<Annotation[]>({
    queryKey: ['/api/annotations'],
    enabled: !!user,
  });

  // Check if verse is bookmarked
  const isVerseBookmarked = (verse: number) => {
    return bookmarks?.some(b => b.book === selectedBook && b.chapter === selectedChapter && b.verse === verse);
  };

  // Get highlight color for verse
  const getVerseHighlight = (verse: number) => {
    const key = `${selectedBook}-${selectedChapter}-${verse}`;
    return highlights[key] || null;
  };

  // Check if verse has annotation (already user-scoped by API)
  const verseHasAnnotation = (verse: number) => {
    return annotations?.some(a => a.book === selectedBook && a.chapter === selectedChapter && a.verse === verse);
  };

  // Toggle bookmark mutation
  const bookmarkMutation = useMutation({
    mutationFn: async ({ verse, isBookmarked }: { verse: number; isBookmarked: boolean }) => {
      if (isBookmarked) {
        const bookmark = bookmarks?.find(b => b.book === selectedBook && b.chapter === selectedChapter && b.verse === verse);
        if (bookmark) {
          return apiRequest('DELETE', `/api/bookmarks/${bookmark.id}`);
        }
      } else {
        return apiRequest('POST', '/api/bookmarks', {
          book: selectedBook,
          chapter: selectedChapter,
          verse,
          color: 'default',
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookmarks'] });
    },
  });

  // Handle highlight with better error handling
  const handleHighlight = (verse: number, color: string) => {
    const key = `${selectedBook}-${selectedChapter}-${verse}`;
    const newHighlights = { ...highlights, [key]: color };
    setHighlights(newHighlights);
    try {
      saveHighlights(newHighlights);
      toast({
        title: "Versículo realçado",
        description: `${currentBook?.name || selectedBook} ${selectedChapter}:${verse}`,
      });
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível salvar o realce",
        variant: "destructive",
      });
    }
  };

  // Remove highlight with toast feedback
  const handleRemoveHighlight = (verse: number) => {
    const key = `${selectedBook}-${selectedChapter}-${verse}`;
    const newHighlights = { ...highlights };
    delete newHighlights[key];
    setHighlights(newHighlights);
    try {
      saveHighlights(newHighlights);
      toast({
        title: "Realce removido",
        description: `${currentBook?.name || selectedBook} ${selectedChapter}:${verse}`,
      });
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível remover o realce",
        variant: "destructive",
      });
    }
  };

  // Handle annotate - select verse and scroll to annotation panel
  const handleAnnotate = (verse: number) => {
    setSelectedVerse(verse);
  };

  const handlePreviousChapter = () => {
    if (selectedChapter > 1) {
      setSelectedChapter(selectedChapter - 1);
    } else if (books && currentBook) {
      const currentIndex = books.findIndex(b => b.id === selectedBook);
      if (currentIndex > 0) {
        const previousBook = books[currentIndex - 1];
        setSelectedBook(previousBook.id);
        setSelectedChapter(previousBook.chapters);
      }
    }
  };

  const handleNextChapter = () => {
    if (currentBook && selectedChapter < currentBook.chapters) {
      setSelectedChapter(selectedChapter + 1);
    } else if (books && currentBook) {
      const currentIndex = books.findIndex(b => b.id === selectedBook);
      if (currentIndex < books.length - 1) {
        const nextBook = books[currentIndex + 1];
        setSelectedBook(nextBook.id);
        setSelectedChapter(1);
      }
    }
  };

  // Process search results when available, filtering by testament
  useEffect(() => {
    if (wordSearchResults && wordSearchResults.results && wordSearchResults.results.length > 0) {
      // Filter results by testament/language
      const testament = currentBook?.testament;
      const expectedLanguage = testament === 'old' ? 'hebrew' : 'greek';
      
      // First try to find a result matching the current testament
      let matchingResult = wordSearchResults.results.find(r => r.language === expectedLanguage);
      
      // Fallback to first result if no match found (edge case for cross-testament words)
      if (!matchingResult) {
        matchingResult = wordSearchResults.results[0];
      }
      
      if (matchingResult && matchingResult.number) {
        setSelectedStrongNumber(matchingResult.number);
        // Add to wordsWithStrong set
        if (searchingWord) {
          setWordsWithStrong(prev => {
            const newSet = new Set(prev);
            newSet.add(searchingWord);
            return newSet;
          });
        }
        setSearchingWord(null); // Clear search state
        setSearchingVerseNum(null); // Clear verse state
      }
    } else if (wordSearchResults && wordSearchResults.results && wordSearchResults.results.length === 0) {
      // No results found - clear search
      setSearchingWord(null);
      setSearchingVerseNum(null);
    }
  }, [wordSearchResults, currentBook, searchingWord]);

  // Reset words tracking when chapter changes
  useEffect(() => {
    setWordsWithStrong(new Set());
  }, [selectedBook, selectedChapter]);

  const handleWordClick = (word: string, verseNum: number) => {
    // Remove pontuação da palavra antes de buscar
    const cleanWord = word.replace(/[.,;:!?"'()]/g, '').trim().toLowerCase();
    
    // Filter: Ignore very short words (< 3 chars) to avoid stopword noise
    if (cleanWord.length < 3) {
      return;
    }
    
    // Search in database via API (will filter by testament/language automatically)
    setSearchingWord(cleanWord);
    setSearchingVerseNum(verseNum);
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground dark:bg-background dark:text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card dark:bg-card">
        {/* Top Row: Logo and Navigation */}
        <div className="flex items-center justify-start px-1.5 h-12 gap-0.5 overflow-x-auto scrollbar-hide">
          {/* Logo */}
          <img 
            src={logoSmall} 
            alt="Logo" 
            className="h-7 w-auto hidden sm:block flex-shrink-0"
            data-testid="img-header-logo"
          />
          
          {/* Version Selector - Almeida Versions */}
          <AlmeidaVersionSelector 
            selectedVersion={selectedVersion} 
            onVersionChange={setSelectedVersion}
          />

          {/* Book Selection */}
          <Select value={selectedBook} onValueChange={setSelectedBook}>
            <SelectTrigger className="w-20 text-sm h-9 flex-shrink-0" data-testid="select-book">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {books?.map((book) => (
                <SelectItem key={book.id} value={book.id}>
                  {book.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Chapter Navigation */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handlePreviousChapter}
            disabled={selectedBook === books?.[0]?.id && selectedChapter === 1}
            data-testid="button-prev-chapter"
            className="h-8 w-8 flex-shrink-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Select value={selectedChapter.toString()} onValueChange={(val) => setSelectedChapter(parseInt(val))}>
            <SelectTrigger className="w-12 text-sm h-9 relative z-40 flex-shrink-0" data-testid="select-chapter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-50">
              {currentBook && Array.from({ length: currentBook.chapters }, (_, i) => i + 1).map((ch) => (
                <SelectItem key={ch} value={String(ch)}>
                  {ch}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleNextChapter}
            disabled={
              selectedBook === books?.[books.length - 1]?.id && 
              selectedChapter === currentBook?.chapters
            }
            data-testid="button-next-chapter"
            className="h-8 w-8 flex-shrink-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Trial Badge */}
          {trialActive && (
            <Badge 
              variant="secondary" 
              className="hidden sm:inline-flex text-xs flex-shrink-0"
              data-testid="badge-trial"
            >
              Trial: {trialDaysRemaining}d
            </Badge>
          )}

          {/* Settings Icons - Spacer */}
          <div className="flex-1"></div>

          {/* Settings Icons */}
          <Button variant="ghost" size="icon" data-testid="button-bookmarks" className="h-8 w-8 flex-shrink-0">
            <Bookmark className="h-4 w-4" />
          </Button>
          <ThemeToggle />
          {isAdmin && (
            <Button variant="ghost" size="icon" data-testid="button-admin" onClick={onNavigateToAdmin} className="h-8 w-8 flex-shrink-0" title="Painel Admin">
              <Shield className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" data-testid="button-settings" onClick={onNavigateToSettings} className="h-8 w-8 flex-shrink-0">
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        {/* Bottom Row: Compact Search */}
        <div className="px-2 py-1 border-t bg-card/50 flex gap-1 items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSearch(!showSearch)}
            className="h-7 px-2 text-xs gap-1"
            data-testid="button-toggle-search"
          >
            <Search className="h-3 w-3" />
            {showSearch ? "Fechar" : "Buscar"}
          </Button>
          
          {showSearch && (
            <>
              <Input
                placeholder="Palavra-chave..."
                value={textSearchQuery}
                onChange={(e) => setTextSearchQuery(e.target.value)}
                className="flex-1 h-7 text-xs"
                data-testid="input-text-search"
              />
              {textSearchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTextSearchQuery("")}
                  className="h-7 w-7"
                  data-testid="button-clear-search"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </>
          )}
        </div>
      </header>

      {/* Bible Text */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden pb-24 bible-page bg-background dark:bg-background text-foreground dark:text-foreground">
        <div className="max-w-3xl mx-auto px-4 py-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : error ? (
            <div className="bg-muted/50 border border-border rounded-lg p-6 text-center">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Conteúdo ainda não disponível
              </h3>
              <p className="text-muted-foreground mb-4">
                Este conteúdo será adicionado em breve. Por enquanto, apenas o Evangelho de João (capítulos 1, 2 e 3) está disponível na versão demo.
              </p>
              <Button 
                onClick={() => {
                  setSelectedBook('jhn');
                  setSelectedChapter(1);
                }}
                data-testid="button-go-to-john"
              >
                Ir para João 1
              </Button>
            </div>
          ) : (
            <>
              <h2 className="font-serif text-2xl font-bold mb-6 text-primary">
                {chapterData?.book.name} {chapterData?.chapter.chapter}
              </h2>
              <div 
                className={`space-y-4 font-serif leading-relaxed ${
                  fontSize === "small" ? "text-base" : 
                  fontSize === "medium" ? "text-xl" : 
                  "text-2xl"
                }`}
              >
                {chapterData?.chapter.verses.map((verse) => {
                  const highlightColor = getVerseHighlight(verse.verse);
                  const highlightBg = highlightColor 
                    ? HIGHLIGHT_COLORS.find(c => c.color === highlightColor)?.bg 
                    : null;
                  const hasBookmark = isVerseBookmarked(verse.verse);
                  const hasNote = verseHasAnnotation(verse.verse);
                  
                  return (
                    <div
                      key={verse.verse}
                      className={`flex gap-2 group relative ${
                        selectedVerse === verse.verse 
                          ? "bg-primary/10 -mx-2 px-2 py-1 rounded" 
                          : highlightBg 
                            ? `${highlightBg} -mx-2 px-2 py-1 rounded`
                            : ""
                      }`}
                      onClick={() => setSelectedVerse(verse.verse)}
                      data-testid={`verse-${verse.verse}`}
                    >
                      {/* Verse Number + Icons */}
                      <div className="flex flex-col items-center gap-0.5 min-w-[20px]">
                        <span className="text-xs font-sans text-muted-foreground select-none">
                          {verse.verse}
                        </span>
                        {hasBookmark && (
                          <Bookmark className="h-3 w-3 fill-primary text-primary" />
                        )}
                        {hasNote && (
                          <MessageSquare className="h-3 w-3 text-primary" />
                        )}
                      </div>
                      
                      {/* Verse Text */}
                      <p className="flex-1">
                        {verse.text.split(" ").map((word, idx) => {
                          const cleanWord = word.replace(/[.,;:!?—\-'"()]/g, '').toLowerCase();
                          const isClickable = cleanWord.length > 2;
                          const hasStrongInCache = wordsWithStrong.has(cleanWord);
                          
                          return (
                            <span
                              key={idx}
                              className={isClickable ? 'cursor-pointer transition-colors' : 'cursor-default'}
                              style={hasStrongInCache ? { textDecoration: 'underline dotted', textDecorationThickness: '1px', textUnderlineOffset: '2px', fontWeight: '500' } : {}}
                              onClick={(e) => {
                                if (isClickable) {
                                  e.stopPropagation();
                                  handleWordClick(cleanWord, verse.verse);
                                }
                              }}
                              onMouseEnter={(e) => {
                                if (isClickable && (e.currentTarget as HTMLElement)) {
                                  (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(26, 82, 153, 0.1)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (isClickable && (e.currentTarget as HTMLElement)) {
                                  (e.currentTarget as HTMLElement).style.backgroundColor = '';
                                }
                              }}
                              data-testid={`word-${verse.verse}-${idx}`}
                            >
                              {word}{" "}
                            </span>
                          );
                        })}
                      </p>
                      
                      {/* Verse Actions */}
                      <VerseActions
                        bookName={chapterData?.book.name || ""}
                        chapter={selectedChapter}
                        verse={verse.verse}
                        text={verse.text}
                        isBookmarked={hasBookmark}
                        isHighlighted={!!highlightColor}
                        onBookmark={() => bookmarkMutation.mutate({ verse: verse.verse, isBookmarked: hasBookmark || false })}
                        onHighlight={(color) => handleHighlight(verse.verse, color)}
                        onRemoveHighlight={() => handleRemoveHighlight(verse.verse)}
                        onAnnotate={() => handleAnnotate(verse.verse)}
                      />
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Annotation Panel - Collapsible */}
      {user && currentBook && (
        <AnnotationPanel
          book={selectedBook}
          bookName={currentBook.name}
          chapter={selectedChapter}
          selectedVerse={selectedVerse}
        />
      )}

      {/* AI Panel - Fixed Bottom */}
      <AIPanel />

      {/* Strong Modal */}
      {selectedStrongNumber && (
        <StrongModal
          strongNumber={selectedStrongNumber}
          onClose={() => setSelectedStrongNumber(null)}
        />
      )}
    </div>
  );
}
