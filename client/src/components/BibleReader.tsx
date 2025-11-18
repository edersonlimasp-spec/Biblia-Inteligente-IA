import { useState } from "react";
import { Bookmark, Search, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AIPanel } from "@/components/AIPanel";
import { StrongModal } from "@/components/StrongModal";

// Mock data for Bible
const books = [
  "Gênesis", "Êxodo", "Levítico", "Números", "Deuteronômio",
  "Josué", "Juízes", "Rute", "1 Samuel", "2 Samuel"
];

const verses = [
  { number: 1, text: "No princípio, criou Deus os céus e a terra.", hasStrong: true },
  { number: 2, text: "E a terra era sem forma e vazia; e havia trevas sobre a face do abismo; e o Espírito de Deus se movia sobre a face das águas.", hasStrong: true },
  { number: 3, text: "E disse Deus: Haja luz. E houve luz.", hasStrong: true },
  { number: 4, text: "E viu Deus que era boa a luz; e fez Deus separação entre a luz e as trevas.", hasStrong: true },
  { number: 5, text: "E Deus chamou à luz Dia; e às trevas chamou Noite. E foi a tarde e a manhã: o dia primeiro.", hasStrong: true },
];

interface BibleReaderProps {
  onNavigateToSubscriptions?: () => void;
  onNavigateToSettings?: () => void;
  onNavigateToHistory?: () => void;
}

export function BibleReader({ onNavigateToSubscriptions, onNavigateToSettings, onNavigateToHistory }: BibleReaderProps) {
  const [selectedBook, setSelectedBook] = useState("Gênesis");
  const [selectedChapter, setSelectedChapter] = useState("1");
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);

  const handleWordClick = (word: string, verseNum: number) => {
    console.log("Word clicked:", word, "in verse", verseNum);
    setSelectedWord(word);
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card">
        <div className="flex items-center justify-between px-4 h-14 gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Select value={selectedBook} onValueChange={setSelectedBook}>
              <SelectTrigger className="w-[140px]" data-testid="select-book">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {books.map((book) => (
                  <SelectItem key={book} value={book}>
                    {book}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" data-testid="button-prev-chapter">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Select value={selectedChapter} onValueChange={setSelectedChapter}>
                <SelectTrigger className="w-[70px]" data-testid="select-chapter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 50 }, (_, i) => i + 1).map((ch) => (
                    <SelectItem key={ch} value={String(ch)}>
                      {ch}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" data-testid="button-next-chapter">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-1">
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
          <h2 className="font-serif text-2xl font-bold mb-6 text-primary">
            {selectedBook} {selectedChapter}
          </h2>
          <div className="space-y-4 font-serif text-lg leading-relaxed">
            {verses.map((verse) => (
              <div
                key={verse.number}
                className={`flex gap-3 group ${
                  selectedVerse === verse.number ? "bg-primary/10 -mx-2 px-2 py-1 rounded" : ""
                }`}
                onClick={() => setSelectedVerse(verse.number)}
                data-testid={`verse-${verse.number}`}
              >
                <span className="text-xs font-sans text-muted-foreground mt-1 select-none">
                  {verse.number}
                </span>
                <p className="flex-1">
                  {verse.text.split(" ").map((word, idx) => (
                    <span
                      key={idx}
                      className={verse.hasStrong ? "cursor-pointer hover:text-primary transition-colors" : ""}
                      onClick={(e) => {
                        if (verse.hasStrong) {
                          e.stopPropagation();
                          handleWordClick(word, verse.number);
                        }
                      }}
                    >
                      {word}{" "}
                    </span>
                  ))}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* AI Panel - Fixed Bottom */}
      <AIPanel />

      {/* Strong Modal */}
      {selectedWord && (
        <StrongModal
          word={selectedWord}
          onClose={() => setSelectedWord(null)}
        />
      )}
    </div>
  );
}
