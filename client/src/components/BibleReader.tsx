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
  language: string;
}

interface StrongSearchResponse {
  results: StrongSearchResult[];
  total: number;
}

// Portuguese word to Strong's number mapping for the 60 MVP terms in database
const portugueseToStrong: Record<string, string> = {
  // Deus / God
  "deus": "G2316",
  "deuses": "G2316",
  "divino": "G2316",
  "divina": "G2316",
  "senhor": "G2962",
  "todo-poderoso": "H7706",
  "altíssimo": "H5945",
  
  // Jesus / Christ
  "jesus": "G2424",
  "cristo": "G5547",
  "messias": "G5547",
  
  // Espírito / Spirit
  "espírito": "G4151",
  "espiritual": "G4151",
  
  // Amor / Love
  "amor": "G26",
  "amar": "G25",
  "amado": "G27",
  "amados": "G27",
  
  // Fé / Faith
  "fé": "G4102",
  "crer": "G4100",
  "crê": "G4100",
  "crente": "G4100",
  "acreditar": "G4100",
  
  // Graça / Grace
  "graça": "G5485",
  "graças": "G5485",
  "favor": "G5485",
  
  // Salvação / Salvation
  "salvação": "G4991",
  "salvar": "G4982",
  "salvador": "G4990",
  
  // Paz / Peace
  "paz": "G1515",
  "pacífico": "G1515",
  
  // Justiça / Righteousness
  "justiça": "G1343",
  "justo": "G1342",
  "justificação": "G1347",
  
  // Palavra / Word
  "palavra": "G3056",
  "verbo": "G3056",
  
  // Santo / Holy
  "santo": "G40",
  "santa": "G40",
  "santos": "G40",
  "santas": "G40",
  
  // Vida / Life
  "vida": "G2222",
  "viver": "G2198",
  "vivo": "G2198",
  
  // Luz / Light
  "luz": "G5457",
  "iluminar": "G5461",
  
  // Verdade / Truth
  "verdade": "G225",
  "verdadeiro": "G228",
  
  // Esperança / Hope
  "esperança": "G1680",
  "esperar": "G1679",
  
  // Oração / Prayer
  "oração": "G4335",
  "orar": "G4336",
  "prece": "G4335",
  
  // Aleluia / Hallelujah
  "aleluia": "G239",
  "aleluias": "G239",
  
  // Misericórdia / Mercy
  "misericórdia": "G1656",
  "misericordioso": "G1655",
  
  // Rei / King
  "rei": "G935",
  "reino": "G932",
  
  // Terra / Earth (Hebrew)
  "terra": "H776",
  "terras": "H776",
  
  // Céus / Heaven (Hebrew)
  "céus": "H8064",
  "céu": "H8064",
  "celestial": "H8064",
  
  // Homem / Man (Hebrew)
  "homem": "H120",
  "humano": "H120",
  
  // Anjo / Angel
  "anjo": "H4397",
  "anjos": "H4397",
  
  // Servo / Servant
  "servo": "H5650",
  "servir": "H5647",
  
  // Casa / House
  "casa": "H1004",
  "casas": "H1004",
};

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

  // Process search results when available
  useEffect(() => {
    if (wordSearchResults && wordSearchResults.results && wordSearchResults.results.length > 0) {
      // Take the first result (most relevant)
      const firstResult = wordSearchResults.results[0];
      if (firstResult.number) {
        setSelectedStrongNumber(firstResult.number);
        setSearchingWord(null); // Clear search state
      }
    } else if (wordSearchResults && wordSearchResults.results && wordSearchResults.results.length === 0) {
      // No results found - clear search
      setSearchingWord(null);
      console.log("No Strong's entry found in database for this word");
    }
  }, [wordSearchResults]);

  const handleWordClick = (word: string, verseNum: number) => {
    console.log("🔥 handleWordClick CALLED! Word:", word, "Verse:", verseNum);
    
    // Remove pontuação da palavra antes de buscar
    const cleanWord = word.replace(/[.,;:!?"'()]/g, '').trim().toLowerCase();
    console.log("🔥 Clean word:", cleanWord, "Length:", cleanWord.length);
    
    // Filter: Ignore very short words (< 4 chars) to avoid stopword noise
    if (cleanWord.length < 4) {
      console.log("⚠️ Skipping short word:", cleanWord);
      return;
    }
    
    console.log("✅ Word clicked:", cleanWord, "in verse", verseNum);
    
    // Check if word has a direct mapping to Strong's number
    const strongNumber = portugueseToStrong[cleanWord];
    console.log("🔍 Mapping lookup:", cleanWord, "→", strongNumber);
    
    if (strongNumber) {
      console.log("✅ Found direct mapping:", cleanWord, "→", strongNumber);
      console.log("🎯 Setting selectedStrongNumber to:", strongNumber);
      setSelectedStrongNumber(strongNumber);
      return;
    }
    
    // If no direct mapping, search in database via API
    console.log("🔍 No direct mapping, searching in database:", cleanWord);
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
                      {verse.text.split(" ").map((word, idx) => (
                        <span
                          key={idx}
                          className="cursor-pointer transition-colors hover:text-primary hover:font-medium"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleWordClick(word, verse.verse);
                          }}
                        >
                          {word}{" "}
                        </span>
                      ))}
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
