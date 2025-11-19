import { useState } from "react";
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

export function BibleReader({ onNavigateToSubscriptions, onNavigateToSettings, onNavigateToHistory }: BibleReaderProps) {
  const { trialActive, trialDaysRemaining } = useAuth();
  const [selectedBook, setSelectedBook] = useState("jhn");
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
  const [selectedStrongNumber, setSelectedStrongNumber] = useState<string | null>(null);

  const { data: books } = useQuery<BibleBook[]>({
    queryKey: ['/api/bible/books'],
  });

  const { data: chapterData, isLoading, error } = useQuery<BibleChapterData>({
    queryKey: ['/api/bible', selectedBook, selectedChapter],
    enabled: !!selectedBook && !!selectedChapter,
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

  const handleWordClick = (word: string, verseNum: number) => {
    // Remove pontuação da palavra antes de buscar
    const cleanWord = word.replace(/[.,;:!?"'()]/g, '').trim();
    console.log("Word clicked:", cleanWord, "in verse", verseNum);
    
    // MVP Demo: Map common words to Strong numbers for demonstration
    // In production, this would come from the verse data with actual Strong references
    const wordToStrong: Record<string, string> = {
      // Novo Testamento - Grego
      'Deus': 'G2316',
      'Jesus': 'G2424',
      'Cristo': 'G5547',
      'amor': 'G26',
      'palavra': 'G3056',
      'luz': 'G5457',
      'santo': 'G40',
      'espírito': 'G4151',
      'Espírito': 'G4151',
      'princípio': 'G746',
      'Verbo': 'G3056',
      'vida': 'G2222',
      'trevas': 'G4655',
      'homem': 'G444',
      'homens': 'G444',
      'mundo': 'G2889',
      'água': 'G5204',
      'batismo': 'G908',
      'João': 'G2491',
      'testemunho': 'G3141',
      'crê': 'G4100',
      'crer': 'G4100',
      'fé': 'G4102',
      'filho': 'G5207',
      'Filho': 'G5207',
      'pai': 'G3962',
      'Pai': 'G3962',
      'nome': 'G3686',
      'graça': 'G5485',
      'verdade': 'G225',
      'lei': 'G3551',
      'Moisés': 'G3475',
      'profeta': 'G4396',
      'nascer': 'G1080',
      'nascido': 'G1080',
      'carne': 'G4561',
      'sangue': 'G129',
      'igreja': 'G1577',
      'corpo': 'G4983',
      'coração': 'G2588',
      'reino': 'G932',
      'céu': 'G3772',
      'céus': 'G3772',
      // Antigo Testamento - Hebraico
      'SENHOR': 'H3068',
      'Senhor': 'H3068',
      'Jeová': 'H3068',
      'Javé': 'H3068',
      'Elohim': 'H430',
      'terra': 'H776',
      'Terra': 'H776',
      'criar': 'H1254',
      'criou': 'H1254',
      'criado': 'H1254',
      'amar': 'H157',
      'amou': 'H157',
      'Adão': 'H120',
      'mulher': 'H802',
      'rei': 'H4428',
      'povo': 'H5971',
      'cidade': 'H5892',
      'casa': 'H1004',
      'dia': 'H3117',
      'dias': 'H3117',
      'noite': 'H3915',
      'águas': 'H4325',
      'fogo': 'H784',
      'rosto': 'H6440',
      'face': 'H6440',
      'fazer': 'H6213',
      'fez': 'H6213',
      'feito': 'H6213',
      'misericórdia': 'H2617',
    };
    
    const strongNumber = wordToStrong[cleanWord];
    
    // Only open modal if we have a valid mapping for this word
    if (strongNumber) {
      setSelectedStrongNumber(strongNumber);
    } else {
      console.log(`No Strong mapping available for word: "${cleanWord}"`);
    }
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
                          className="cursor-pointer hover:text-primary transition-colors"
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
