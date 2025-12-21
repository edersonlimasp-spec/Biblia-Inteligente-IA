import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Bookmark, Search, Settings, ChevronLeft, ChevronRight, X, Shield, MessageSquare, Loader2, Globe, BookOpen, Home } from "lucide-react";
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
import { UserButton } from "@/components/UserButton";
import { StrongModal } from "@/components/StrongModal";
import { StrongWord } from "@/components/StrongWord";
import { AlmeidaVersionSelector } from "@/components/AlmeidaVersionSelector";
import { VerseActions, HIGHLIGHT_COLORS } from "@/components/VerseActions";
import { AnnotationPanel } from "@/components/AnnotationPanel";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useSyncManager, useReadingHistory } from "@/hooks/use-sync";
import { apiRequest, queryClient, getApiUrl } from "@/lib/queryClient";
import { getDeviceId } from "@/hooks/use-device-id";
import { tokenizeVerse, normalizeWordForLookup } from "@/lib/verse-utils";
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
  onNavigateToLogin?: () => void;
  onNavigateToDashboard?: () => void;
}

interface GlobalSearchResult {
  book: string;
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
  reference: string;
}

interface GlobalSearchResponse {
  query: string;
  version: string;
  total: number;
  results: GlobalSearchResult[];
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

export function BibleReader({
  onNavigateToSubscriptions,
  onNavigateToSettings,
  onNavigateToHistory,
  onNavigateToAdmin,
  onNavigateToLogin,
  onNavigateToDashboard,
}: BibleReaderProps) {
  const { user, isAdmin, logout } = useAuth();
  const { toast } = useToast();
  
  const {
    isSyncing,
    highlights,
    addHighlight,
    removeHighlight,
    getHighlightColor,
    isAuthenticated,
  } = useSyncManager();
  
  const { trackReading, getLastReading } = useReadingHistory();

  // State management
  const [selectedBook, setSelectedBook] = useState("gen");
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [selectedVersion, setSelectedVersion] = useState("ACF");
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
  const [textSearchQuery, setTextSearchQuery] = useState("");
  const [isGlobalSearch, setIsGlobalSearch] = useState(false);
  const [globalSearchTerm, setGlobalSearchTerm] = useState("");
  const [showGlobalResults, setShowGlobalResults] = useState(false);
  const [showAnnotationPanel, setShowAnnotationPanel] = useState(false);
  
  // Strong's search state
  const [searchingWord, setSearchingWord] = useState<string | null>(null);
  const [searchingVerseNum, setSearchingVerseNum] = useState<number | null>(null);
  const [selectedStrongNumber, setSelectedStrongNumber] = useState<string | null>(null);
  const [wordsWithStrong, setWordsWithStrong] = useState<Set<string>>(new Set());

  // Trial status
  const [trialActive, setTrialActive] = useState(false);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState(0);

  // Initialize with last reading position
  useEffect(() => {
    const lastReading = getLastReading();
    if (lastReading) {
      setSelectedBook(lastReading.book);
      setSelectedChapter(lastReading.chapter);
      setSelectedVersion(lastReading.versionCode || "ACF");
    }
  }, [getLastReading]);

  // Save version preference to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("bible-version", selectedVersion);
    } catch {}
  }, [selectedVersion]);

  // Core data queries
  const { data: books } = useQuery<BibleBook[]>({
    queryKey: ['/api/bible/books'],
    staleTime: 1000 * 60 * 60 * 24, // 24 hours - these never change
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days garbage collection
  });

  const { data: chapterData, isLoading, error } = useQuery<BibleChapterData>({
    queryKey: ['/api/bible', selectedBook, selectedChapter, selectedVersion],
    enabled: !!selectedBook && !!selectedChapter,
    retry: false,
    staleTime: 1000 * 60 * 60, // 1 hour - cache aggressively
    gcTime: 1000 * 60 * 60 * 24, // 24 hour garbage collection
    queryFn: async () => {
      return apiRequest('GET', `/api/bible/${selectedBook}/${selectedChapter}?version=${selectedVersion}`)
        .then(res => res.json());
    },
  });

  // Track reading progress non-blocking (fire and forget)
  useEffect(() => {
    if (chapterData && selectedBook && selectedChapter) {
      const deviceId = getDeviceId();
      // Fire and forget - don't block rendering
      setTimeout(() => {
        apiRequest('POST', '/api/reading-progress', {
          book: selectedBook,
          chapter: selectedChapter,
          deviceId,
          userId: user?.id,
        }).catch(() => {});
      }, 100);
    }
  }, [chapterData, selectedBook, selectedChapter, user?.id]);

  // Query to search for Strong's number when clicking a word
  const { data: wordSearchResults, error: wordSearchError, isLoading: isWordSearchLoading } = useQuery<StrongSearchResponse>({
    queryKey: ['/api/strong/search', searchingWord, selectedBook, selectedChapter, searchingVerseNum],
    enabled: !!searchingWord && searchingVerseNum !== null,
    retry: false,
    queryFn: async () => {
      console.log('[Strong Debug] Query running for:', searchingWord, 'verse:', searchingVerseNum);
      const deviceId = getDeviceId();
      const searchParams = new URLSearchParams({
        book: selectedBook,
        chapter: selectedChapter.toString(),
        verse: searchingVerseNum!.toString(),
      });
      if (deviceId) {
        searchParams.set('deviceId', deviceId);
      }
      const response = await apiRequest('GET', `/api/strong/search/${encodeURIComponent(searchingWord!)}?${searchParams}`);
      const data = await response.json();
      console.log('[Strong Debug] Query response:', data);
      return data;
    },
  });
  
  // Log query errors
  useEffect(() => {
    if (wordSearchError) {
      console.error('[Strong Debug] Query error:', wordSearchError);
    }
  }, [wordSearchError]);

  // Global Bible search query
  const { data: globalSearchResults, isLoading: isGlobalSearching } = useQuery<GlobalSearchResponse>({
    queryKey: ['/api/bible/search-all', globalSearchTerm, selectedVersion],
    enabled: isGlobalSearch && globalSearchTerm.length >= 2,
    retry: false,
    staleTime: 60000,
    queryFn: async () => {
      return apiRequest('GET', `/api/bible/search-all?q=${encodeURIComponent(globalSearchTerm)}&version=${selectedVersion}`)
        .then(res => res.json());
    },
  });

  // Pre-fetch Strong words for current chapter (for highlighting before click)
  interface StrongWordsResponse {
    book: string;
    chapter: number;
    strongWords: Record<number, string[]>;
    totalWords: number;
  }
  
  const { data: chapterStrongWords, error: chapterStrongError } = useQuery<StrongWordsResponse>({
    queryKey: ['/api/bible', selectedBook, selectedChapter, 'strong-words'],
    enabled: !!selectedBook && !!selectedChapter,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days
    queryFn: async () => {
      console.log('[Strong Words] Fetching for:', selectedBook, selectedChapter);
      const response = await apiRequest('GET', `/api/bible/${selectedBook}/${selectedChapter}/strong-words`);
      const data = await response.json();
      console.log('[Strong Words] Response:', data);
      return data;
    },
  });
  
  // Log chapterStrongWords errors
  useEffect(() => {
    if (chapterStrongError) {
      console.error('[Strong Words] Error:', chapterStrongError);
    }
  }, [chapterStrongError]);

  // Navigate to a search result
  const navigateToSearchResult = (result: GlobalSearchResult) => {
    setSelectedBook(result.book);
    setSelectedChapter(result.chapter);
    setShowGlobalResults(false);
    setIsGlobalSearch(false);
    setGlobalSearchTerm("");
    // Invalidate and refetch the chapter data immediately
    queryClient.invalidateQueries({ queryKey: ['/api/bible', result.book, result.chapter] });
  };

  const currentBook = books?.find(b => b.id === selectedBook);

  // Lazy load bookmarks and annotations only when needed
  const [loadBookmarksAnnotations, setLoadBookmarksAnnotations] = useState(false);
  
  // Fetch bookmarks - lazy loaded
  const { data: bookmarks } = useQuery<BookmarkType[]>({
    queryKey: ['/api/bookmarks'],
    enabled: !!user && loadBookmarksAnnotations,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minute garbage collection
  });

  // Fetch annotations - lazy loaded
  const { data: annotations } = useQuery<Annotation[]>({
    queryKey: ['/api/annotations'],
    enabled: !!user && loadBookmarksAnnotations,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minute garbage collection
  });

  // Load bookmarks/annotations on first user action or after a delay
  useEffect(() => {
    if (!loadBookmarksAnnotations && user) {
      const timer = setTimeout(() => setLoadBookmarksAnnotations(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [user, loadBookmarksAnnotations]);

  // Check if verse is bookmarked - memoizado para performance
  const isVerseBookmarked = useCallback((verse: number) => {
    return bookmarks?.some(b => b.book === selectedBook && b.chapter === selectedChapter && b.verse === verse);
  }, [bookmarks, selectedBook, selectedChapter]);

  // Get highlight color for verse - memoizado para performance
  const getVerseHighlight = useCallback((verse: number) => {
    return getHighlightColor(selectedBook, selectedChapter, verse);
  }, [getHighlightColor, selectedBook, selectedChapter]);

  // Check if verse has annotation - memoizado para performance
  const verseHasAnnotation = useCallback((verse: number) => {
    return annotations?.some(a => a.book === selectedBook && a.chapter === selectedChapter && a.verse === verse);
  }, [annotations, selectedBook, selectedChapter]);

  // Memoizar lista de versículos filtrados para performance em iOS
  const filteredVerses = useMemo(() => {
    if (!chapterData?.chapter?.verses) return [];
    if (!textSearchQuery) return chapterData.chapter.verses;
    const query = textSearchQuery.toLowerCase();
    return chapterData.chapter.verses.filter(verse => 
      verse.text.toLowerCase().includes(query)
    );
  }, [chapterData?.chapter?.verses, textSearchQuery]);

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

  // Handle highlight - now syncs to cloud
  const handleHighlight = async (verse: number, color: string) => {
    await addHighlight(selectedBook, selectedChapter, verse, color);
    toast({
      title: "Versículo realçado",
      description: `${currentBook?.name || selectedBook} ${selectedChapter}:${verse}${isAuthenticated ? ' (sincronizado)' : ''}`,
    });
  };

  // Remove highlight - now syncs to cloud
  const handleRemoveHighlight = async (verse: number) => {
    await removeHighlight(selectedBook, selectedChapter, verse);
    toast({
      title: "Realce removido",
      description: `${currentBook?.name || selectedBook} ${selectedChapter}:${verse}${isAuthenticated ? ' (sincronizado)' : ''}`,
    });
  };

  // Handle annotate
  const handleAnnotate = (verse: number) => {
    setSelectedVerse(verse);
    setShowAnnotationPanel(true);
  };

  // Handle bookmark click - opens annotations for that verse
  const handleBookmarkClick = (verse: number, isBookmarked: boolean) => {
    // First toggle the bookmark
    bookmarkMutation.mutate({ verse, isBookmarked });
    // Then open annotations panel to show notes for this verse
    setSelectedVerse(verse);
    setShowAnnotationPanel(true);
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

  // Process search results
  useEffect(() => {
    console.log('[Strong Debug] wordSearchResults changed:', wordSearchResults);
    
    if (wordSearchResults?.results && wordSearchResults.results.length > 0) {
      const testament = currentBook?.testament;
      const expectedLanguage = testament === 'old' ? 'hebrew' : 'greek';
      
      console.log('[Strong Debug] Processing results, testament:', testament, 'expected:', expectedLanguage);
      
      let matchingResult = wordSearchResults.results.find(r => r.language === expectedLanguage);
      
      if (!matchingResult) {
        matchingResult = wordSearchResults.results[0];
      }
      
      if (matchingResult?.number) {
        console.log('[Strong Debug] Setting selectedStrongNumber:', matchingResult.number);
        setSelectedStrongNumber(matchingResult.number);
        if (searchingWord) {
          setWordsWithStrong(prev => {
            const newSet = new Set(prev);
            newSet.add(searchingWord);
            return newSet;
          });
        }
        setSearchingWord(null);
        setSearchingVerseNum(null);
      }
    } else if (wordSearchResults?.results?.length === 0) {
      console.log('[Strong Debug] No results found');
      setSearchingWord(null);
      setSearchingVerseNum(null);
    }
  }, [wordSearchResults, currentBook, searchingWord]);

  // Populate wordsWithStrong from pre-fetched data when chapter changes
  useEffect(() => {
    console.log('[Strong Words] useEffect triggered, chapterStrongWords:', chapterStrongWords);
    if (chapterStrongWords?.strongWords) {
      // Collect all words from all verses that have Strong numbers
      const allStrongWords = new Set<string>();
      for (const verseWords of Object.values(chapterStrongWords.strongWords)) {
        for (const word of verseWords) {
          allStrongWords.add(word.toLowerCase());
        }
      }
      console.log('[Strong Words] Setting wordsWithStrong, count:', allStrongWords.size, 'sample:', Array.from(allStrongWords).slice(0, 5));
      setWordsWithStrong(allStrongWords);
    } else {
      console.log('[Strong Words] No strongWords data, clearing set');
      setWordsWithStrong(new Set());
    }
  }, [chapterStrongWords, selectedBook, selectedChapter]);

  // Track reading history when chapter changes (cloud sync)
  useEffect(() => {
    if (selectedBook && selectedChapter && isAuthenticated) {
      trackReading(selectedBook, selectedChapter, selectedVersion);
    }
  }, [selectedBook, selectedChapter, selectedVersion, isAuthenticated, trackReading]);

  const handleWordClick = (word: string, verseNum: number) => {
    const cleanWord = word.replace(/[.,;:!?"'()]/g, '').trim().toLowerCase();
    
    console.log('[Strong Debug] Word clicked:', { word, cleanWord, verseNum, length: cleanWord.length });
    
    if (cleanWord.length < 3) {
      console.log('[Strong Debug] Word too short, skipping');
      return;
    }
    
    console.log('[Strong Debug] Setting searchingWord:', cleanWord);
    setSearchingWord(cleanWord);
    setSearchingVerseNum(verseNum);
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground dark:bg-background dark:text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card dark:bg-card">
        {/* Top Row: Logo and Navigation */}
        <div className="flex items-center justify-start px-1.5 h-12 gap-0.5 overflow-x-auto scrollbar-hide">
          <img 
            src={logoSmall} 
            alt="Logo" 
            className="h-7 w-auto hidden sm:block flex-shrink-0"
            data-testid="img-header-logo"
          />
          
          <AlmeidaVersionSelector 
            selectedVersion={selectedVersion} 
            onVersionChange={setSelectedVersion}
          />

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

          {trialActive && (
            <Badge 
              variant="secondary" 
              className="hidden sm:inline-flex text-xs flex-shrink-0"
              data-testid="badge-trial"
            >
              Trial: {trialDaysRemaining}d
            </Badge>
          )}

          {/* Sync status indicator - removido do header por solicitação do usuário */}

          <div className="flex-1"></div>

          {/* Bookmarks/Annotations Button - opens all marks page */}
          <Button 
            variant="ghost" 
            size="icon" 
            data-testid="button-bookmarks" 
            className="h-8 w-8 flex-shrink-0 relative"
            onClick={onNavigateToHistory}
            title="Minhas Marcações"
          >
            <Bookmark className="h-4 w-4" />
            {/* Indicadores DENTRO do ícone: azul=anotação, verde=só bookmark */}
            {annotations && annotations.length > 0 ? (
              <span className="absolute bottom-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-blue-500" />
            ) : bookmarks && bookmarks.length > 0 ? (
              <span className="absolute bottom-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-green-500" />
            ) : null}
          </Button>
          <ThemeToggle />
          {isAdmin && (
            <Button variant="ghost" size="icon" data-testid="button-admin" onClick={onNavigateToAdmin} className="h-8 w-8 flex-shrink-0" title="Painel Admin">
              <Shield className="h-4 w-4" />
            </Button>
          )}
          {onNavigateToDashboard && (
            <Button variant="ghost" size="icon" data-testid="button-home" onClick={onNavigateToDashboard} className="h-8 w-8 flex-shrink-0" title="Início">
              <Home className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" data-testid="button-settings" onClick={onNavigateToSettings} className="h-8 w-8 flex-shrink-0">
            <Settings className="h-4 w-4" />
          </Button>
          <UserButton 
            onNavigateToLogin={onNavigateToLogin}
            onNavigateToSettings={onNavigateToSettings}
            onNavigateToSubscriptions={onNavigateToSubscriptions}
            showSettingsOption
            showSubscriptionOption
          />
        </div>

        {/* Bottom Row: Text Search - FULL WIDTH */}
        <div className="px-4 py-2 border-t bg-card/50 flex gap-2 items-center">
          <Button
            variant={isGlobalSearch ? "default" : "ghost"}
            size="icon"
            onClick={() => {
              setIsGlobalSearch(!isGlobalSearch);
              if (!isGlobalSearch) {
                setTextSearchQuery("");
              } else {
                setGlobalSearchTerm("");
                setShowGlobalResults(false);
              }
            }}
            className="h-8 w-8 flex-shrink-0"
            data-testid="button-toggle-global-search"
            title={isGlobalSearch ? "Buscar só neste capítulo" : "Buscar na Bíblia toda"}
          >
            {isGlobalSearch ? <Globe className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
          </Button>
          <Input
            placeholder={isGlobalSearch ? "Buscar na Bíblia toda..." : "Buscar neste capítulo..."}
            value={isGlobalSearch ? globalSearchTerm : textSearchQuery}
            onChange={(e) => {
              if (isGlobalSearch) {
                setGlobalSearchTerm(e.target.value);
                setShowGlobalResults(e.target.value.length >= 2);
              } else {
                setTextSearchQuery(e.target.value);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && isGlobalSearch && globalSearchTerm.length >= 2) {
                setShowGlobalResults(true);
              }
            }}
            className="flex-1 h-8 text-sm"
            data-testid="input-text-search"
          />
          {isGlobalSearch && globalSearchTerm.length >= 2 && (
            <Button
              variant="default"
              size="sm"
              onClick={() => setShowGlobalResults(true)}
              className="h-8 flex-shrink-0"
              data-testid="button-execute-global-search"
            >
              <Search className="h-4 w-4 mr-1" />
              Buscar
            </Button>
          )}
        </div>
      </header>

      {/* Global Search Results */}
      {showGlobalResults && isGlobalSearch && (
        <div className="border-b bg-card/80 max-h-[50vh] overflow-y-auto">
          <div className="w-full px-4 sm:px-8 lg:px-12 py-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-foreground">
                {isGlobalSearching ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Buscando...
                  </span>
                ) : (
                  <>
                    Resultados para "{globalSearchTerm}"
                    <Badge variant="secondary" className="ml-2">
                      {globalSearchResults?.total || 0} encontrados
                    </Badge>
                  </>
                )}
              </h3>
            </div>
            
            {!isGlobalSearching && globalSearchResults?.results?.length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                Nenhum resultado encontrado para "{globalSearchTerm}"
              </p>
            )}
            
            {!isGlobalSearching && globalSearchResults?.results && globalSearchResults.results.length > 0 && (
              <div className="space-y-2">
                {globalSearchResults.results.map((result, idx) => (
                  <div
                    key={`${result.book}-${result.chapter}-${result.verse}-${idx}`}
                    className="p-3 rounded-lg bg-background hover-elevate cursor-pointer border"
                    onClick={() => navigateToSearchResult(result)}
                    data-testid={`button-search-result-${result.book}-${result.chapter}-${result.verse}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="font-semibold" data-testid={`badge-reference-${result.book}-${result.chapter}-${result.verse}`}>
                        {result.reference}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`text-verse-preview-${result.book}-${result.chapter}-${result.verse}`}>
                      {result.text}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bible Text */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden pb-24 sm:pb-32 bible-page bg-background dark:bg-background text-foreground dark:text-foreground">
        <div className="w-full px-4 sm:px-8 lg:px-12 py-3 sm:py-5">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="error-message">
              Erro ao carregar capítulo
            </div>
          ) : chapterData ? (
            <>
              <h2 className="text-2xl sm:text-4xl font-bold mb-2 sm:mb-3 text-foreground" data-testid="chapter-title">
                {chapterData.book.name} {selectedChapter}
              </h2>
              <div className="space-y-2 sm:space-y-3 text-xl sm:text-2xl font-serif leading-relaxed">
                {filteredVerses.map((verse) => {
                  const highlightColor = getVerseHighlight(verse.verse);
                  const highlightBg = highlightColor 
                    ? HIGHLIGHT_COLORS.find(c => c.color === highlightColor)?.bg 
                    : null;
                  const hasBookmark = isVerseBookmarked(verse.verse);
                  const hasNote = verseHasAnnotation(verse.verse);
                  
                  return (
                    <div
                      key={`${selectedBook}-${selectedChapter}-${verse.verse}`}
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
                      {/* Verse Number + Icons with colored markers */}
                      <div className="flex flex-col items-center gap-0.5 min-w-[20px]">
                        <span className="text-xs font-sans text-muted-foreground select-none">
                          {verse.verse}
                        </span>
                        {/* AZUL para anotação (com ou sem bookmark), VERDE para só bookmark */}
                        {hasNote ? (
                          <div className="flex items-center gap-0.5">
                            <Bookmark className="h-3 w-3 fill-blue-500 text-blue-500" />
                            <MessageSquare className="h-3 w-3 text-blue-500" />
                          </div>
                        ) : hasBookmark ? (
                          <Bookmark className="h-3 w-3 fill-green-500 text-green-500" />
                        ) : null}
                      </div>
                      
                      {/* Verse Text - Using unified tokenization */}
                      <p className="flex-1">
                        {tokenizeVerse(verse.text, wordsWithStrong).map((token, idx) => (
                          <span key={idx}>
                            <StrongWord
                              text={token.text}
                              hasStrong={token.hasStrong}
                              onWordClick={(word) => {
                                const cleanWord = normalizeWordForLookup(word);
                                handleWordClick(cleanWord, verse.verse);
                              }}
                            />
                            {" "}
                          </span>
                        ))}
                      </p>
                      
                      {/* Verse Actions - Only allow annotations for logged-in users */}
                      <VerseActions
                        bookName={chapterData?.book.name || ""}
                        chapter={selectedChapter}
                        verse={verse.verse}
                        text={verse.text}
                        isBookmarked={hasBookmark || false}
                        isHighlighted={!!highlightColor}
                        onBookmark={() => user ? handleBookmarkClick(verse.verse, hasBookmark || false) : toast({ title: "Faça login", description: "Marcadores estão disponíveis apenas para usuários logados", variant: "destructive" })}
                        onHighlight={(color) => handleHighlight(verse.verse, color)}
                        onRemoveHighlight={() => handleRemoveHighlight(verse.verse)}
                        onAnnotate={() => user ? handleAnnotate(verse.verse) : toast({ title: "Faça login", description: "Comentários estão disponíveis apenas para usuários logados", variant: "destructive" })}
                      />
                    </div>
                  );
                })}
              </div>
            </>
          ) : null}
        </div>
      </main>

      {/* AI Panel - oculto quando AnnotationPanel está aberto */}
      <AIPanel hidden={showAnnotationPanel} />

      {/* Annotation Panel - só renderizado quando aberto */}
      {user && currentBook && showAnnotationPanel && (
        <AnnotationPanel
          book={selectedBook}
          bookName={currentBook.name}
          chapter={selectedChapter}
          selectedVerse={selectedVerse}
          isInitiallyExpanded={true}
          onClose={() => setShowAnnotationPanel(false)}
        />
      )}

      {/* Strong Modal */}
      {selectedStrongNumber && (
        <StrongModal
          strongNumber={selectedStrongNumber}
          onClose={() => setSelectedStrongNumber(null)}
          onNavigateToSubscriptions={onNavigateToSubscriptions}
        />
      )}
    </div>
  );
}
