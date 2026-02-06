import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Bookmark, Search, Settings, ChevronLeft, ChevronRight, X, Shield, MessageSquare, Loader2, Globe, BookOpen, Home, Share2, Copy, Check, CheckSquare } from "lucide-react";
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
import { VerseExtras } from "@/components/VerseExtras";
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
  initialBook?: string;
  initialChapter?: number;
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
  strongMatch?: {
    strongNumber: string;
    translit: string | null;
    lemma: string;
    language: string;
  } | null;
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
  initialBook,
  initialChapter,
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
  
  // Multi-verse selection for sharing
  const [selectedVersesForShare, setSelectedVersesForShare] = useState<Set<number>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [justCopied, setJustCopied] = useState(false);

  // Initialize with last reading position - only runs once on mount
  // BUT always use the version matching the current language
  // Priority: initialBook/initialChapter props > last reading > default (gen 1)
  useEffect(() => {
    // === BOOT DIAGNOSTICS (PASSO 1-C) ===
    let savedVersion: string | null = null;
    let fallbackApplied = false;
    
    try {
      savedVersion = localStorage.getItem("bible_version") || localStorage.getItem("bible-version");
    } catch (e) {
      console.warn('[BIBLE] BOOT localStorage error:', e);
      // Fallback to cookie
      const cookieMatch = document.cookie.match(/bible_version=([^;]+)/);
      savedVersion = cookieMatch ? cookieMatch[1] : null;
    }
    
    const lastReading = getLastReading();
    const defaultVersion = getDefaultBibleVersion();
    
    // Determine version to use
    let versionToUse = savedVersion || defaultVersion;
    if (!savedVersion) {
      fallbackApplied = true;
      versionToUse = defaultVersion;
    }
    
    console.log(`[BIBLE] BOOT_DIAGNOSTICS -> {
      savedVersion: "${savedVersion || 'null'}",
      defaultVersion: "${defaultVersion}",
      versionToUse: "${versionToUse}",
      fallbackApplied: ${fallbackApplied},
      origin: "${window.location.origin}",
      pathname: "${window.location.pathname}",
      isProduction: ${import.meta.env.PROD},
      isDevelopment: ${import.meta.env.DEV},
      mode: "${import.meta.env.MODE}",
      initialBook: "${initialBook || 'null'}",
      initialChapter: ${initialChapter || 'null'},
      timestamp: ${Date.now()}
    }`);
    
    // Priority: props > last reading > default
    if (initialBook && initialChapter) {
      console.log(`[BIBLE] NAVIGATING_FROM_PLAN -> book=${initialBook} chapter=${initialChapter}`);
      setSelectedBook(initialBook);
      setSelectedChapter(initialChapter);
    } else if (lastReading && lastReading.book && lastReading.chapter) {
      setSelectedBook(lastReading.book);
      setSelectedChapter(lastReading.chapter);
    }
    
    // Use saved version or default for current language
    setSelectedVersion(versionToUse);
    
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
  const handleVersionChange = async (newVersion: string) => {
    console.log(`[BIBLE] VERSION_CHANGE_HANDLER -> {
      from: "${selectedVersion}",
      to: "${newVersion}",
      book: "${selectedBook}",
      chapter: ${selectedChapter},
      timestamp: ${Date.now()}
    }`);
    
    // Remove ALL cached chapter queries to force fresh fetch
    console.log(`[BIBLE] CACHE_CLEAR -> removing all chapter queries`);
    queryClient.removeQueries({
      queryKey: ['/api/bible/chapter'],
    });
    
    // Clear query cache completely for this chapter with old version
    queryClient.removeQueries({
      queryKey: ['/api/bible/chapter', selectedBook, selectedChapter, selectedVersion]
    });
    
    // Also clear new version cache in case of stale data
    queryClient.removeQueries({
      queryKey: ['/api/bible/chapter', selectedBook, selectedChapter, newVersion]
    });
    
    // Update version state - React Query will create new query with new key
    console.log(`[BIBLE] STATE_UPDATE -> setSelectedVersion("${newVersion}")`);
    setSelectedVersion(newVersion);
    
    // Force immediate refetch after state update
    setTimeout(() => {
      console.log(`[BIBLE] REFETCH_FORCED -> invalidating all chapter queries for version=${newVersion}`);
      queryClient.invalidateQueries({ 
        queryKey: ['/api/bible/chapter'],
        refetchType: 'all'
      });
    }, 100);
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

  // Save version preference to localStorage AND cookie for robust persistence
  useEffect(() => {
    if (!selectedVersion) return;
    
    console.log(`[BIBLE] PERSIST_VERSION -> version=${selectedVersion} ts=${Date.now()}`);
    
    // Primary: localStorage (both keys for backwards compatibility)
    try {
      localStorage.setItem("bible_version", selectedVersion);
      localStorage.setItem("bible-version", selectedVersion);
      console.log(`[BIBLE] PERSIST_SUCCESS -> localStorage saved: ${selectedVersion}`);
    } catch (e) {
      console.warn('[BIBLE] PERSIST_ERROR -> localStorage failed:', e);
    }
    
    // Fallback: cookie (for TWA/PWA where localStorage might not persist)
    try {
      document.cookie = `bible_version=${selectedVersion}; path=/; max-age=31536000; SameSite=Lax`;
      console.log(`[BIBLE] PERSIST_SUCCESS -> cookie saved: ${selectedVersion}`);
    } catch (e) {
      console.warn('[BIBLE] PERSIST_ERROR -> cookie failed:', e);
    }
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
    refetchOnMount: 'always', // Force refetch on mount
    networkMode: 'always', // Always try network first
    queryFn: async ({ queryKey }) => {
      // === FETCH DIAGNOSTICS (PASSO 1-B) ===
      const [, book, chapter, version] = queryKey as [string, string, number, string];
      const timestamp = Date.now();
      const url = `/api/bible/${book}/${chapter}?version=${encodeURIComponent(version)}&_t=${timestamp}`;
      
      console.log(`[BIBLE] FETCH_START -> {
        url: "${url}",
        book: "${book}",
        chapter: ${chapter},
        version: "${version}",
        origin: "${window.location.origin}",
        isProduction: ${import.meta.env.PROD},
        timestamp: ${timestamp}
      }`);
      
      // Use fetch directly with cache: 'no-store' to bypass browser cache entirely
      const token = localStorage.getItem('authToken');
      const deviceId = getDeviceId();
      const headers: Record<string, string> = { 
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (deviceId) headers['x-device-id'] = deviceId;
      
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers,
          credentials: 'include',
          cache: 'no-store', // CRITICAL: Bypass browser cache completely
        });
        
        console.log(`[BIBLE] FETCH_RESPONSE -> {
          status: ${response.status},
          statusText: "${response.statusText}",
          url: "${response.url}",
          ok: ${response.ok}
        }`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        const verse1Text = data.chapter?.verses?.[0]?.text?.substring(0, 60) || 'N/A';
        const verseCount = data.chapter?.verses?.length || 0;
        
        console.log(`[BIBLE] FETCH_SUCCESS -> {
          returnedVersion: "${data.version}",
          requestedVersion: "${version}",
          versionMatch: ${data.version === version},
          verseCount: ${verseCount},
          verse1: "${verse1Text}..."
        }`);
        
        return data;
      } catch (fetchError: any) {
        console.error(`[BIBLE] FETCH_ERROR -> {
          error: "${fetchError.message}",
          url: "${url}",
          version: "${version}",
          timestamp: ${Date.now()}
        }`);
        throw fetchError;
      }
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
  
  // Handle query errors - close modal and reset state
  useEffect(() => {
    if (wordSearchError) {
      console.error('[Strong Debug] Query error:', wordSearchError);
      // Close the searching modal on error
      setShowSearchingModal(false);
      setSearchingWord(null);
      setSearchingVerseNum(null);
      
      // Show error toast
      const errorMessage = (wordSearchError as any)?.message || 'Erro ao buscar Strong';
      toast({
        title: "Erro na busca",
        description: errorMessage,
        variant: "destructive"
      });
    }
  }, [wordSearchError, toast]);

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

  // Toggle verse selection for multi-share
  const toggleVerseForShare = (verseNum: number) => {
    setSelectedVersesForShare(prev => {
      const newSet = new Set(prev);
      if (newSet.has(verseNum)) {
        newSet.delete(verseNum);
      } else {
        newSet.add(verseNum);
      }
      // Exit selection mode if no verses selected
      if (newSet.size === 0) {
        setIsSelectionMode(false);
      }
      return newSet;
    });
  };

  // Get selected verses text for sharing
  const getSelectedVersesText = useCallback(() => {
    if (!chapterData?.chapter?.verses || selectedVersesForShare.size === 0) return "";
    
    const sortedVerses = Array.from(selectedVersesForShare).sort((a, b) => a - b);
    const versesText = sortedVerses.map(verseNum => {
      const verse = chapterData.chapter.verses.find(v => v.verse === verseNum);
      return verse ? `${verseNum} ${verse.text}` : "";
    }).filter(Boolean).join("\n");
    
    const reference = sortedVerses.length === 1
      ? `${chapterData.book.name} ${selectedChapter}:${sortedVerses[0]}`
      : `${chapterData.book.name} ${selectedChapter}:${sortedVerses[0]}-${sortedVerses[sortedVerses.length - 1]}`;
    
    return `"${versesText}"\n\n${reference}\n\n---\nEnviado por Bíblia Inteligente IA\nConheça a BI: https://bibliainteligente.replit.app`;
  }, [chapterData, selectedChapter, selectedVersesForShare]);

  // Handle share multiple verses
  const handleShareSelected = async () => {
    const shareText = getSelectedVersesText();
    if (!shareText) return;
    
    const sortedVerses = Array.from(selectedVersesForShare).sort((a, b) => a - b);
    const reference = sortedVerses.length === 1
      ? `${chapterData?.book.name} ${selectedChapter}:${sortedVerses[0]}`
      : `${chapterData?.book.name} ${selectedChapter}:${sortedVerses[0]}-${sortedVerses[sortedVerses.length - 1]}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: reference,
          text: shareText,
        });
        // Clear selection after successful share
        setSelectedVersesForShare(new Set());
        setIsSelectionMode(false);
        return;
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
      }
    }
    
    // Fallback: Copy to clipboard
    handleCopySelected();
  };

  // Handle copy multiple verses
  const handleCopySelected = async () => {
    const shareText = getSelectedVersesText();
    if (!shareText) return;
    
    try {
      await navigator.clipboard.writeText(shareText);
      setJustCopied(true);
      toast({
        title: "Copiado!",
        description: `${selectedVersesForShare.size} versículo(s) copiado(s)`,
      });
      setTimeout(() => {
        setJustCopied(false);
        setSelectedVersesForShare(new Set());
        setIsSelectionMode(false);
      }, 1500);
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o texto",
        variant: "destructive",
      });
    }
  };

  // Clear verse selection
  const clearVerseSelection = () => {
    setSelectedVersesForShare(new Set());
    setIsSelectionMode(false);
  };

  // Start selection mode with a verse
  const startSelectionMode = (verseNum: number) => {
    setIsSelectionMode(true);
    setSelectedVersesForShare(new Set([verseNum]));
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

  // Process search results - only when query is complete and matches current search
  useEffect(() => {
    // Don't process if we're still loading or if there's no active search
    if (isWordSearchLoading || !searchingWord) {
      return;
    }
    
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
        const currentWord = searchingWord;
        setWordsWithStrong(prev => {
          const newSet = new Set(prev);
          newSet.add(currentWord);
          return newSet;
        });
        setSearchingWord(null);
        setSearchingVerseNum(null);
      }
    } else if (wordSearchResults?.results?.length === 0 && searchingWord) {
      console.log('[Strong Debug] No results found for:', searchingWord);
      setShowSearchingModal(false);
      setSearchingWord(null);
      setSearchingVerseNum(null);
      toast({
        title: "Palavra não encontrada",
        description: "Esta palavra não possui referência Strong cadastrada.",
        duration: 1500,
      });
    }
  }, [wordSearchResults, currentBook, searchingWord, isWordSearchLoading, toast]);

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

  // Safety timeout ref to prevent infinite loading
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const handleWordClick = (word: string, verseNum: number) => {
    const cleanWord = word.replace(/[.,;:!?"'()]/g, '').trim().toLowerCase();
    
    console.log('[Strong Debug] Word clicked:', { word, cleanWord, verseNum, length: cleanWord.length });
    
    if (cleanWord.length < 3) {
      console.log('[Strong Debug] Word too short, skipping');
      return;
    }
    
    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Open modal IMMEDIATELY with loading state
    setSearchingWordDisplay(word);
    setShowSearchingModal(true);
    
    console.log('[Strong Debug] Setting searchingWord:', cleanWord);
    setSearchingWord(cleanWord);
    setSearchingVerseNum(verseNum);
    
    // Safety timeout - close modal after 10 seconds if no response
    searchTimeoutRef.current = setTimeout(() => {
      console.log('[Strong Debug] Search timeout - closing modal');
      setShowSearchingModal(false);
      setSearchingWord(null);
      setSearchingVerseNum(null);
      toast({
        title: "Tempo esgotado",
        description: "A busca demorou muito. Tente novamente.",
        variant: "destructive"
      });
    }, 10000);
  };
  
  // Clear timeout when search completes
  useEffect(() => {
    if (!showSearchingModal && searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
  }, [showSearchingModal]);

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

            {!isGlobalSearching && globalSearchResults?.strongMatch && (
              <div className="mb-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="default" className="font-mono">
                    {globalSearchResults.strongMatch.strongNumber}
                  </Badge>
                  <span className="text-sm font-semibold">
                    {globalSearchResults.strongMatch.lemma}
                  </span>
                  {globalSearchResults.strongMatch.translit && (
                    <span className="text-sm text-muted-foreground">
                      ({globalSearchResults.strongMatch.translit})
                    </span>
                  )}
                  <Badge variant="outline">
                    {globalSearchResults.strongMatch.language === 'hebrew' ? 'Hebraico' : 'Grego'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Busca por palavra original no léxico Strong
                </p>
              </div>
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
      <main className="flex-1 overflow-y-auto overflow-x-hidden pb-40 sm:pb-36 bible-page bg-background dark:bg-background text-foreground dark:text-foreground">
        <div className="w-full max-w-3xl mx-auto px-6 sm:px-10 lg:px-14 py-4 sm:py-6">
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
              <div className="sticky top-0 z-20 bg-background border-b border-border/50 -mx-6 px-6 sm:-mx-10 sm:px-10 lg:-mx-14 lg:px-14">
                <h2 className="text-lg sm:text-xl font-bold text-foreground text-center py-1.5" data-testid="chapter-title">
                  {chapterData.book.name} {selectedChapter}
                </h2>
              </div>
              {/* Verses with number on left and actions on right */}
              <div className="space-y-3 sm:space-y-4 text-xl sm:text-2xl font-serif leading-relaxed">
                {filteredVerses.map((verse) => {
                  const highlightColor = getVerseHighlight(verse.verse);
                  const highlightBg = highlightColor 
                    ? HIGHLIGHT_COLORS.find(c => c.color === highlightColor)?.bg 
                    : null;
                  const hasBookmark = isVerseBookmarked(verse.verse);
                  const hasNote = verseHasAnnotation(verse.verse);
                  
                  const isSelectedForShare = selectedVersesForShare.has(verse.verse);
                  
                  return (
                    <div
                      key={`${selectedBook}-${selectedChapter}-${verse.verse}`}
                      className={`flex gap-3 group relative ${
                        isSelectedForShare
                          ? "bg-blue-100 dark:bg-blue-900/40 -mx-3 px-3 py-2 rounded-lg ring-2 ring-blue-400/50"
                          : selectedVerse === verse.verse 
                            ? "bg-primary/10 -mx-3 px-3 py-2 rounded-lg" 
                            : highlightBg 
                              ? `${highlightBg} -mx-3 px-3 py-2 rounded-lg`
                              : ""
                      }`}
                      onClick={() => {
                        if (isSelectionMode) {
                          toggleVerseForShare(verse.verse);
                        } else {
                          setSelectedVerse(verse.verse);
                        }
                      }}
                      data-testid={`verse-${verse.verse}`}
                    >
                      {/* Verse Number + Icons on left */}
                      <div className="flex flex-col items-center gap-0.5 min-w-[24px] pt-1">
                        <span className="text-sm font-bold font-sans text-primary select-none">
                          {verse.verse}
                        </span>
                        {hasNote ? (
                          <div className="flex items-center gap-0.5">
                            <Bookmark className="h-3 w-3 fill-blue-500 text-blue-500" />
                            <MessageSquare className="h-3 w-3 text-blue-500" />
                          </div>
                        ) : hasBookmark ? (
                          <Bookmark className="h-3 w-3 fill-green-500 text-green-500" />
                        ) : null}
                      </div>
                      
                      {/* Verse Text */}
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
                      
                      {/* Verse Actions on right */}
                      <VerseActions
                        bookName={chapterData?.book.name || ""}
                        chapter={selectedChapter}
                        verse={verse.verse}
                        text={verse.text}
                        isBookmarked={hasBookmark || false}
                        isHighlighted={!!highlightColor}
                        isSelectedForShare={isSelectedForShare}
                        onBookmark={() => user ? handleBookmarkClick(verse.verse, hasBookmark || false) : toast({ title: "Faça login", description: "Marcadores estão disponíveis apenas para usuários logados", variant: "destructive" })}
                        onHighlight={(color) => handleHighlight(verse.verse, color)}
                        onRemoveHighlight={() => handleRemoveHighlight(verse.verse)}
                        onAnnotate={() => user ? handleAnnotate(verse.verse) : toast({ title: "Faça login", description: "Comentários estão disponíveis apenas para usuários logados", variant: "destructive" })}
                        onSelectForShare={() => {
                          if (!isSelectionMode) {
                            startSelectionMode(verse.verse);
                          } else {
                            toggleVerseForShare(verse.verse);
                          }
                        }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Cross References & Commentary - shown when verse is selected */}
              {selectedVerse && selectedBook && (
                <VerseExtras
                  bookId={selectedBook}
                  chapter={selectedChapter}
                  verse={selectedVerse}
                  onNavigate={(bookId, chapter, verse) => {
                    setSelectedBook(bookId);
                    setSelectedChapter(chapter);
                    setSelectedVerse(verse);
                  }}
                  onClose={() => setSelectedVerse(null)}
                />
              )}
            </>
          ) : null}
        </div>
      </main>

      {/* Fixed Chapter Navigation Arrows - Minimalist watermark style */}
      <div className="fixed left-0 top-1/2 -translate-y-1/2 z-30 pointer-events-none">
        <button
          onClick={handlePreviousChapter}
          disabled={selectedBook === books?.[0]?.id && selectedChapter === 1}
          className="pointer-events-auto p-2 sm:p-3 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-0 disabled:pointer-events-none transition-all duration-300"
          data-testid="button-prev-chapter-fixed"
          aria-label="Capítulo anterior"
        >
          <ChevronLeft className="h-8 w-8 sm:h-10 sm:w-10" strokeWidth={1.5} />
        </button>
      </div>
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-30 pointer-events-none">
        <button
          onClick={handleNextChapter}
          disabled={selectedBook === books?.[books.length - 1]?.id && selectedChapter === currentBook?.chapters}
          className="pointer-events-auto p-2 sm:p-3 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-0 disabled:pointer-events-none transition-all duration-300"
          data-testid="button-next-chapter-fixed"
          aria-label="Próximo capítulo"
        >
          <ChevronRight className="h-8 w-8 sm:h-10 sm:w-10" strokeWidth={1.5} />
        </button>
      </div>

      {/* Floating Share Bar - appears when verses are selected */}
      {selectedVersesForShare.size > 0 && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-200">
          <div className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-3 rounded-full shadow-lg">
            <span className="text-sm font-medium">
              {selectedVersesForShare.size} versículo(s)
            </span>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 px-3 text-primary-foreground hover:bg-primary-foreground/20"
                onClick={handleShareSelected}
                data-testid="button-share-selected"
              >
                <Share2 className="h-4 w-4 mr-1" />
                Compartilhar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 px-3 text-primary-foreground hover:bg-primary-foreground/20"
                onClick={handleCopySelected}
                data-testid="button-copy-selected"
              >
                {justCopied ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Copiar
                  </>
                )}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                onClick={clearVerseSelection}
                data-testid="button-clear-selection"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

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
