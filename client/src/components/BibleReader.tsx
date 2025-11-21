import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bookmark, Search, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { useAuth } from "@/contexts/AuthContext";
import logoSmall from "@assets/logo/logo-small.png";

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

export function BibleReader({ onNavigateToSubscriptions, onNavigateToSettings, onNavigateToHistory }: BibleReaderProps) {
  const { trialActive, trialDaysRemaining } = useAuth();
  const [selectedBook, setSelectedBook] = useState("jhn");
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
  const [selectedStrongNumber, setSelectedStrongNumber] = useState<string | null>(null);
  const [searchingWord, setSearchingWord] = useState<string | null>(null);

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
    queryKey: ['/api/strong/search', searchingWord],
    enabled: !!searchingWord,
    retry: false,
  });

  const currentBook = books?.find(b => b.id === selectedBook);

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
        setSearchingWord(null); // Clear search state
      }
    } else if (wordSearchResults && wordSearchResults.results && wordSearchResults.results.length === 0) {
      // No results found - clear search
      setSearchingWord(null);
    }
  }, [wordSearchResults, currentBook]);

  const handleWordClick = (word: string, verseNum: number) => {
    // Remove pontuação da palavra antes de buscar
    const cleanWord = word.replace(/[.,;:!?"'()]/g, '').trim().toLowerCase();
    
    // Filter: Ignore very short words (< 3 chars) to avoid stopword noise
    if (cleanWord.length < 3) {
      return;
    }
    
    // Search in database via API (will filter by testament/language automatically)
    setSearchingWord(cleanWord);
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card">
        <div className="flex items-center justify-between px-4 h-14 gap-3">
          {/* Logo */}
          <img 
            src={logoSmall} 
            alt="Logo" 
            className="h-8 w-auto hidden sm:block"
            data-testid="img-header-logo"
          />
          
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Select value={selectedBook} onValueChange={setSelectedBook}>
              <SelectTrigger className="w-[140px]" data-testid="select-book">
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
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handlePreviousChapter}
                disabled={selectedBook === books?.[0]?.id && selectedChapter === 1}
                data-testid="button-prev-chapter"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Select value={selectedChapter.toString()} onValueChange={(val) => setSelectedChapter(parseInt(val))}>
                <SelectTrigger className="w-[70px]" data-testid="select-chapter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {trialActive && (
              <Badge 
                variant="secondary" 
                className="hidden sm:flex text-xs"
                data-testid="badge-trial"
              >
                Trial: {trialDaysRemaining} {trialDaysRemaining === 1 ? 'dia' : 'dias'}
              </Badge>
            )}
            <Button variant="ghost" size="icon" data-testid="button-search">
              <Search className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" data-testid="button-bookmarks">
              <Bookmark className="h-5 w-5" />
            </Button>
            <ThemeToggle />
            <Button variant="ghost" size="icon" data-testid="button-settings" onClick={onNavigateToSettings}>
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Bible Text */}
      <main className="flex-1 overflow-y-auto pb-24">
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
              <div className="space-y-4 font-serif text-lg leading-relaxed">
                {chapterData?.chapter.verses.map((verse) => (
                  <div
                    key={verse.verse}
                    className={`flex gap-3 group ${
                      selectedVerse === verse.verse ? "bg-primary/10 -mx-2 px-2 py-1 rounded" : ""
                    }`}
                    onClick={() => setSelectedVerse(verse.verse)}
                    data-testid={`verse-${verse.verse}`}
                  >
                    <span className="text-xs font-sans text-muted-foreground mt-1 select-none">
                      {verse.verse}
                    </span>
                    <p className="flex-1">
                      {verse.text.split(" ").map((word, idx) => {
                        // Remove punctuation to check if word might have strong
                        const cleanWord = word.replace(/[.,;:!?—\-'"()]/g, '');
                        const hasStrong = cleanWord.length > 2;
                        
                        return (
                          <span
                            key={idx}
                            className={`transition-all ${
                              hasStrong
                                ? 'cursor-pointer hover:text-primary underline underline-offset-2 hover:font-medium'
                                : 'cursor-default'
                            }`}
                            onClick={(e) => {
                              if (hasStrong) {
                                e.stopPropagation();
                                handleWordClick(cleanWord, verse.verse);
                              }
                            }}
                            data-testid={`word-${verse.verse}-${idx}`}
                          >
                            {word}{" "}
                          </span>
                        );
                      })}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

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
