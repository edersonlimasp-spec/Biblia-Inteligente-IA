import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Bookmark, Search, Settings, ChevronLeft, ChevronRight, X, Shield, MessageSquare, Loader2, Globe, BookOpen, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AIPanel } from "@/components/AIPanel";
import { UserButton } from "@/components/UserButton";
import { StrongModal } from "@/components/StrongModal";
import { StrongWord } from "@/components/StrongWord";
import { AlmeidaVersionSelector } from "@/components/AlmeidaVersionSelector";
import { LanguageSelector } from "@/components/LanguageSelector";
import { VerseActions, HIGHLIGHT_COLORS } from "@/components/VerseActions";
import { AnnotationPanel } from "@/components/AnnotationPanel";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigation } from "@/contexts/NavigationContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useSyncManager, useReadingHistory } from "@/hooks/use-sync";
import { apiRequest, queryClient, getApiUrl } from "@/lib/queryClient";
import { getDeviceId } from "@/hooks/use-device-id";
import { tokenizeVerse, normalizeWordForLookup } from "@/lib/verse-utils";
import { getBookName } from "@/lib/bible-book-names";
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
  const { targetVerse, clearTargetVerse, shouldResetAI, clearResetAI } = useNavigation();
  const { language, getDefaultBibleVersion, t } = useLanguage();
  
  const {
    isSyncing,
    highlights,
    addHighlight,
    removeHighlight,
    getHighlightColor,
    isAuthenticated,
  } = useSyncManager();
  
  const { trackReading, getLastReading } = useReadingHistory();
  
  const verseRef = useRef<HTMLDivElement>(null);
  
  // Flag to prevent tracking on initial load (before restoring last reading)
  const hasRestoredReadingRef = useRef(false);

  // State management
  const [selectedBook, setSelectedBook] = useState("gen");
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [selectedVersion, setSelectedVersion] = useState("ACF");
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
  const [textSearchQuery, setTextSearchQuery] = useState("");
  const [isGlobalSearch, setIsGlobalSearch] = useState(false);
  const [globalSearchTerm, setGlobalSearchTerm] = useState("");
  const [showGlobalResults, setShowGlobalResults] = useState(false);
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [showAnnotationPanel, setShowAnnotationPanel] = useState(false);
  
  // Strong's search state
  const [searchingWord, setSearchingWord] = useState<string | null>(null);
  const [searchingVerseNum, setSearchingVerseNum] = useState<number | null>(null);
  const [selectedStrongNumber, setSelectedStrongNumber] = useState<string | null>(null);
  const [wordsWithStrong, setWordsWithStrong] = useState<Set<string>>(new Set());
  
  // AI prompt from Strong's dictionary
  const [aiPromptFromStrong, setAiPromptFromStrong] = useState<string | null>(null);

  // Trial status
  const [trialActive, setTrialActive] = useState(false);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState(0);

  // Initialize with last reading position - only runs once on mount
  // BUT always use the version matching the current language
  useEffect(() => {
    const lastReading = getLastReading();
    const defaultVersion = getDefaultBibleVersion();
    
    if (lastReading && lastReading.book && lastReading.chapter) {
      setSelectedBook(lastReading.book);
      setSelectedChapter(lastReading.chapter);
    }
    
    // Always use version matching current language on mount
    console.log(`[BIBLE] INIT -> language=${language} defaultVersion=${defaultVersion}`);
    setSelectedVersion(defaultVersion);
    
    // Mark as restored so tracking can begin
    hasRestoredReadingRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track previous language to detect changes AFTER initial mount
  const prevLanguageRef = useRef(language);

  // Effect to change Bible version when language changes (after mount)
  useEffect(() => {
    // Skip the first render (mount), only react to actual changes
    if (prevLanguageRef.current !== language) {
      const defaultVersion = getDefaultBibleVersion();
      console.log(`[BIBLE] LANGUAGE_CHANGE -> from=${prevLanguageRef.current} to=${language} version=${defaultVersion}`);
      handleVersionChange(defaultVersion);
      prevLanguageRef.current = language;
    }
  }, [language, getDefaultBibleVersion]);

  // Handler para mudança de versão com invalidação de cache
  const handleVersionChange = (newVersion: string) => {
    console.log(`[BIBLE] VERSION_CHANGE -> from=${selectedVersion} to=${newVersion} book=${selectedBook} chapter=${selectedChapter} ts=${Date.now()}`);
    
    // Invalida TODOS os caches de capítulos para garantir refetch limpo
    queryClient.invalidateQueries({ 
      queryKey: ['/api/bible/chapter'],
      refetchType: 'all'
    });
    
    // Remove cache antigo explicitamente
    queryClient.removeQueries({
      queryKey: ['/api/bible/chapter', selectedBook, selectedChapter, selectedVersion]
    });
    
    // Muda a versão - isso vai criar novo queryKey e forçar novo fetch
    setSelectedVersion(newVersion);
  };

  // Navigate to target verse from annotations/bookmarks page
  useEffect(() => {
    if (targetVerse) {
      console.log('[BibleReader] TARGET_VERSE_RECEIVED - book:', targetVerse.book, 'chapter:', targetVerse.chapter, 'verse:', targetVerse.verse, 'source:', targetVerse.source, 'shouldResetAI:', shouldResetAI);
      setSelectedBook(targetVerse.book);
      setSelectedChapter(targetVerse.chapter);
      setSelectedVerse(targetVerse.verse);
      
      // Se veio de uma anotação, abrir o painel de anotações automaticamente
      // Isso garante que o usuário veja a anotação e não o chat da IA
      if (targetVerse.source === 'annotation' && user) {
        console.log('[BibleReader] Opening AnnotationPanel because source is annotation');
        setShowAnnotationPanel(true);
      }
      
      clearTargetVerse();
      
      // Scroll to verse after data loads
      setTimeout(() => {
        const verseElement = document.querySelector(`[data-verse="${targetVerse.verse}"]`);
        if (verseElement) {
          verseElement.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 500);
    }
  }, [targetVerse, clearTargetVerse, user]);

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
    queryKey: ['/api/bible/chapter', selectedBook, selectedChapter, selectedVersion],
    enabled: !!selectedBook && !!selectedChapter,
    retry: false,
    staleTime: 0, // Always refetch when version changes
    gcTime: 0, // Disable garbage collection to prevent stale cache
    queryFn: async ({ queryKey }) => {
      // Extract version from queryKey to ensure we fetch the correct version
      const [, book, chapter, version] = queryKey as [string, string, number, string];
      const url = `/api/bible/${book}/${chapter}?version=${encodeURIComponent(version)}&_t=${Date.now()}`;
      console.log(`[BIBLE] FETCHING -> url=${url} queryKey=[${queryKey.join(', ')}] ts=${Date.now()}`);
      const response = await apiRequest('GET', url);
      const data = await response.json();
      console.log(`[BIBLE] RESPONSE -> version=${data.version} requestedVersion=${data.requestedVersion} verse1="${data.chapter?.verses?.[0]?.text?.substring(0, 40)}..."`);
      return data;
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
  // Inclui selectedVersion para forçar recálculo quando a versão muda
  const filteredVerses = useMemo(() => {
    if (!chapterData?.chapter?.verses) return [];
    if (!textSearchQuery) return chapterData.chapter.verses;
    const query = textSearchQuery.toLowerCase();
    return chapterData.chapter.verses.filter(verse => 
      verse.text.toLowerCase().includes(query)
    );
  }, [chapterData?.chapter?.verses, textSearchQuery, selectedVersion]);

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
        // Close searching modal and open real modal
        setShowSearchingModal(false);
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
      setShowSearchingModal(false);
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

  // Track reading history when chapter/version changes (cloud sync for logged users, localStorage for guests)
  // Use a ref to debounce and avoid excessive calls
  // Only track AFTER the initial reading position has been restored
  const lastTrackedRef = useRef<string>("");
  useEffect(() => {
    // Don't track until initial reading position is restored
    if (!hasRestoredReadingRef.current) {
      return;
    }
    const key = `${selectedBook}-${selectedChapter}-${selectedVersion}`;
    if (selectedBook && selectedChapter && key !== lastTrackedRef.current) {
      lastTrackedRef.current = key;
      trackReading(selectedBook, selectedChapter, selectedVersion);
    }
  }, [selectedBook, selectedChapter, selectedVersion, trackReading]);

  // State for showing loading modal while searching
  const [showSearchingModal, setShowSearchingModal] = useState(false);
  const [searchingWordDisplay, setSearchingWordDisplay] = useState<string>("");

  const handleWordClick = (word: string, verseNum: number) => {
    const cleanWord = word.replace(/[.,;:!?"'()]/g, '').trim().toLowerCase();
    
    console.log('[Strong Debug] Word clicked:', { word, cleanWord, verseNum, length: cleanWord.length });
    
    if (cleanWord.length < 3) {
      console.log('[Strong Debug] Word too short, skipping');
      return;
    }
    
    // Open modal IMMEDIATELY with loading state
    setSearchingWordDisplay(word);
    setShowSearchingModal(true);
    
    console.log('[Strong Debug] Setting searchingWord:', cleanWord);
    setSearchingWord(cleanWord);
    setSearchingVerseNum(verseNum);
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground dark:bg-background dark:text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card dark:bg-card">
        {/* Top Row: Bible Navigation */}
        <div className="flex items-center px-3 h-12 gap-2">
          <AlmeidaVersionSelector 
            selectedVersion={selectedVersion} 
            onVersionChange={handleVersionChange}
          />

          <Select value={selectedBook} onValueChange={setSelectedBook}>
            <SelectTrigger className="w-28 text-sm h-9" data-testid="select-book">
              <span className="truncate">{getBookName(selectedBook, language)}</span>
            </SelectTrigger>
            <SelectContent>
              {books?.map((book) => (
                <SelectItem key={book.id} value={book.id}>
                  {getBookName(book.id, language)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-0.5">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handlePreviousChapter}
              disabled={selectedBook === books?.[0]?.id && selectedChapter === 1}
              data-testid="button-prev-chapter"
              className="h-9 w-9"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Select value={selectedChapter.toString()} onValueChange={(val) => setSelectedChapter(parseInt(val))}>
              <SelectTrigger className="w-14 text-sm h-9" data-testid="select-chapter">
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
              className="h-9 w-9"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1"></div>

          {trialActive && (
            <Badge 
              variant="secondary" 
              className="hidden sm:inline-flex text-xs"
              data-testid="badge-trial"
            >
              Trial: {trialDaysRemaining}d
            </Badge>
          )}

          <UserButton 
            onNavigateToLogin={onNavigateToLogin}
            onNavigateToSettings={onNavigateToSettings}
            onNavigateToSubscriptions={onNavigateToSubscriptions}
            showSettingsOption
            showSubscriptionOption
          />
        </div>

        {/* Bottom Row: Tools + Search + Languages */}
        <div className="px-3 py-2 border-t border-border/50 flex items-center gap-3">
          {/* Left: Tool icons */}
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              data-testid="button-bookmarks" 
              className="h-8 w-8 relative"
              onClick={onNavigateToHistory}
              title="Minhas Marcações"
            >
              <Bookmark className="h-4 w-4" />
              {annotations && annotations.length > 0 ? (
                <span className="absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full bg-blue-500" />
              ) : bookmarks && bookmarks.length > 0 ? (
                <span className="absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full bg-green-500" />
              ) : null}
            </Button>
            <ThemeToggle />
            {onNavigateToDashboard && (
              <Button variant="ghost" size="icon" data-testid="button-home" onClick={onNavigateToDashboard} className="h-8 w-8" title="Início">
                <Home className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" data-testid="button-settings" onClick={onNavigateToSettings} className="h-8 w-8">
              <Settings className="h-4 w-4" />
            </Button>
            {isAdmin && (
              <Button variant="ghost" size="icon" data-testid="button-admin" onClick={onNavigateToAdmin} className="h-8 w-8" title="Painel Admin">
                <Shield className="h-4 w-4" />
              </Button>
            )}
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
              className="h-8 w-8"
              data-testid="button-toggle-global-search"
              title={isGlobalSearch ? "Buscar só neste capítulo" : "Buscar na Bíblia toda"}
            >
              {isGlobalSearch ? <Globe className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
            </Button>
          </div>

          {/* Center: Expandable Search */}
          <div className="flex-1"></div>
          
          {showSearchInput ? (
            <div className="flex items-center gap-1 animate-in slide-in-from-right-2 duration-200">
              <div className="flex items-center bg-muted/50 rounded-full border border-border/50 px-3 h-8 w-40">
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={isGlobalSearch ? globalSearchTerm : textSearchQuery}
                  onChange={(e) => {
                    if (isGlobalSearch) {
                      setGlobalSearchTerm(e.target.value);
                    } else {
                      setTextSearchQuery(e.target.value);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const currentQuery = isGlobalSearch ? globalSearchTerm : textSearchQuery;
                      if (currentQuery.length >= 2) {
                        if (!isGlobalSearch) {
                          setGlobalSearchTerm(currentQuery);
                          setTextSearchQuery("");
                          setIsGlobalSearch(true);
                        }
                        setShowGlobalResults(true);
                      }
                    } else if (e.key === 'Escape') {
                      setShowSearchInput(false);
                    }
                  }}
                  onBlur={() => {
                    const currentQuery = isGlobalSearch ? globalSearchTerm : textSearchQuery;
                    if (!currentQuery) {
                      setShowSearchInput(false);
                    }
                  }}
                  autoFocus
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  data-testid="input-text-search"
                />
              </div>
              <Button
                variant="default"
                size="icon"
                onClick={() => {
                  const currentQuery = isGlobalSearch ? globalSearchTerm : textSearchQuery;
                  if (currentQuery.length >= 2) {
                    if (!isGlobalSearch) {
                      setGlobalSearchTerm(currentQuery);
                      setTextSearchQuery("");
                      setIsGlobalSearch(true);
                    }
                    setShowGlobalResults(true);
                  }
                }}
                disabled={(isGlobalSearch ? globalSearchTerm : textSearchQuery).length < 2}
                className="h-8 w-8 rounded-full"
                data-testid="button-execute-search"
                title="Buscar"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSearchInput(true)}
              className="h-8 w-8"
              data-testid="button-open-search"
              title="Buscar"
            >
              <Search className="h-4 w-4" />
            </Button>
          )}

          {/* Right: Language flags */}
          <LanguageSelector />
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

      {/* AI Panel - completamente desmontado quando AnnotationPanel está aberto para garantir isolamento de estado */}
      {!showAnnotationPanel && (
        <AIPanel 
          shouldResetAI={shouldResetAI} 
          onResetComplete={clearResetAI} 
          initialPrompt={aiPromptFromStrong}
          onPromptConsumed={() => setAiPromptFromStrong(null)}
        />
      )}

      {/* Annotation Panel - completamente isolado do AIPanel */}
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

      {/* Searching Modal - Opens instantly while loading */}
      {showSearchingModal && !selectedStrongNumber && (
        <Dialog open={true} onOpenChange={() => {
          setShowSearchingModal(false);
          setSearchingWord(null);
          setSearchingVerseNum(null);
        }}>
          <DialogContent className="max-w-sm">
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Buscando... <span className="font-semibold text-foreground">{searchingWordDisplay}</span>
              </p>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Strong Modal */}
      {selectedStrongNumber && (
        <StrongModal
          strongNumber={selectedStrongNumber}
          onClose={() => setSelectedStrongNumber(null)}
          onNavigateToSubscriptions={onNavigateToSubscriptions}
          onSearch={(query, type) => {
            // Trigger global search with the query
            setSelectedStrongNumber(null);
            setGlobalSearchTerm(query);
            setIsGlobalSearch(true);
            setShowGlobalResults(true);
          }}
          onNavigateToVerse={(book, chapter, verse) => {
            setSelectedBook(book);
            setSelectedChapter(chapter);
            setSelectedVerse(verse);
          }}
          onAIAnalysis={(strongNum, word, definition) => {
            const prompt = language === "pt" 
              ? `Explique o significado teológico e etimológico da palavra "${word}" (Strong ${strongNum}). Definição: ${definition.substring(0, 200)}...`
              : `Explain the theological and etymological meaning of the word "${word}" (Strong ${strongNum}). Definition: ${definition.substring(0, 200)}...`;
            setAiPromptFromStrong(prompt);
          }}
        />
      )}
    </div>
  );
}
