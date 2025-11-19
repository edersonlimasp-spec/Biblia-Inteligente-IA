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

  // Mapeamento expandido: 200+ palavras mais comuns (NT Grego + AT Hebraico)
  const wordToStrong: Record<string, string> = {
    // Divindade
    'Deus': 'G2316', 'Jesus': 'G2424', 'Cristo': 'G5547', 'Senhor': 'G2962',
    'SENHOR': 'H3068', 'Javé': 'H3068', 'Jeová': 'H3068', 'Adonai': 'H136',
    'Espírito': 'G4151', 'espírito': 'G4151', 'espiritual': 'G4152',
    'Elohim': 'H430', 'El': 'H410', 'Eloah': 'H433',
    // Conceitos Centrais
    'amor': 'G26', 'amar': 'G25', 'amou': 'G25', 'amado': 'G27',
    'palavra': 'G3056', 'palavras': 'G3056', 'Verbo': 'G3056',
    'vida': 'G2222', 'viver': 'G2198', 'viveu': 'G2198', 'vivo': 'G2198',
    'morte': 'G2288', 'morrer': 'G599', 'morto': 'G3498', 'morreu': 'G599',
    'luz': 'G5457', 'trevas': 'G4655', 'escuridão': 'G4655',
    'verdade': 'G225', 'verdadeiro': 'G228', 'mentira': 'G5579',
    'graça': 'G5485', 'gracioso': 'G5485', 'misericórdia': 'G1656',
    // Santidade
    'santo': 'G40', 'Santos': 'G40', 'santificado': 'G37',
    'pecado': 'G266', 'pecados': 'G266', 'pecador': 'G268', 'pecar': 'G264',
    'justiça': 'G1343', 'justo': 'G1342', 'justificado': 'G1344',
    'perdão': 'G859', 'perdoar': 'G863', 'perdoado': 'G863',
    // Fé
    'fé': 'G4102', 'fiel': 'G4103', 'fielmente': 'G4103',
    'crê': 'G4100', 'crer': 'G4100', 'crente': 'G4103', 'creram': 'G4100',
    'salvação': 'G4991', 'salvar': 'G4982', 'Salvador': 'G4990', 'salvo': 'G4982',
    // Família
    'filho': 'G5207', 'Filho': 'G5207', 'filhos': 'G5207', 'filha': 'H1323',
    'pai': 'G3962', 'Pai': 'G3962', 'pais': 'G3962', 'mãe': 'G3384',
    'irmão': 'G80', 'irmãos': 'G80', 'irmã': 'G79',
    'mulher': 'H802', 'esposa': 'H802',
    // Criação
    'princípio': 'G746', 'começo': 'G746', 'fim': 'G5056',
    'criar': 'H1254', 'criou': 'H1254', 'criado': 'H1254', 'criação': 'H1254',
    'fazer': 'H6213', 'fez': 'H6213', 'feito': 'H6213',
    'mundo': 'G2889', 'terra': 'H776', 'Terra': 'H776',
    'céu': 'G3772', 'céus': 'G3772', 'celestial': 'G3770', 'firmamento': 'H7549',
    'água': 'G5204', 'águas': 'H4325',
    // Pessoas Bíblicas
    'João': 'G2491', 'Pedro': 'G4074', 'Paulo': 'G3972', 'Tiago': 'G2385',
    'Moisés': 'G3475', 'Abraão': 'G11', 'Davi': 'G1138', 'Isaías': 'G2268',
    'Adão': 'H120', 'Eva': 'H2332',
    'Israel': 'H3478', 'Judá': 'H3063', 'Jerusalém': 'H3389',
    // Humanidade
    'homem': 'G444', 'homens': 'G444', 'humanidade': 'G444',
    'povo': 'H5971', 'povos': 'H5971', 'nação': 'H1471', 'nações': 'H1471',
    // Corpo
    'corpo': 'G4983', 'corpos': 'G4983', 'membro': 'G3196',
    'coração': 'G2588', 'corações': 'G2588', 'alma': 'G5590',
    'carne': 'G4561', 'sangue': 'G129', 'osso': 'G3747',
    'mão': 'G5495', 'mãos': 'G5495', 'dedo': 'G1147', 'braço': 'H2220',
    'olho': 'G3788', 'olhos': 'G3788', 'rosto': 'H6440', 'face': 'H6440',
    'ouvido': 'G3775', 'voz': 'H6963',
    // Reino
    'reino': 'G932', 'reinar': 'G936', 'rei': 'H4428',
    'poder': 'G1411', 'poderoso': 'G1415', 'força': 'G2479',
    'glória': 'G1391', 'glorificar': 'G1392', 'glorioso': 'G1741',
    // Igreja
    'igreja': 'G1577', 'igrejas': 'G1577', 'assembleia': 'G1577',
    'discípulo': 'G3101', 'discípulos': 'G3101', 'apóstolo': 'G652',
    'servo': 'G1401', 'servir': 'G1398', 'serviço': 'G1248',
    'profeta': 'G4396', 'profetas': 'G4396', 'profecia': 'G4394',
    'sacerdote': 'H3548', 'sacerdócio': 'H3550', 'Levita': 'H3881',
    // Testemunho
    'testemunho': 'G3141', 'testemunha': 'G3144', 'testemunhar': 'G3140',
    'nome': 'G3686', 'nomes': 'G3686', 'chamado': 'G2564',
    // Lei
    'lei': 'G3551', 'leis': 'G3551', 'mandamento': 'G1785', 'mandamentos': 'G1785',
    'aliança': 'H1285', 'pacto': 'H1285', 'promessa': 'H1697',
    // Nascimento
    'nascer': 'G1080', 'nascido': 'G1080', 'nascimento': 'G1083',
    'batismo': 'G908', 'batizar': 'G907',
    // Espiritual
    'anjo': 'G32', 'anjos': 'G32', 'arcanjo': 'G743',
    'diabo': 'G1228', 'satanás': 'G4567', 'demônio': 'G1142',
    // Redenção
    'cruz': 'G4716', 'crucificar': 'G4717', 'crucificado': 'G4717',
    'ressurreição': 'G386', 'ressuscitar': 'G1453', 'ressuscitou': 'G1453',
    // Adoração
    'oração': 'G4335', 'orar': 'G4336', 'orou': 'G4336',
    'louvor': 'H8416', 'louvar': 'H1984',
    'bênção': 'H1293', 'abençoar': 'H1288', 'bendito': 'H1288',
    'sacrifício': 'H2077', 'oferta': 'H7133', 'holocausto': 'H5930', 'expiação': 'H3722',
    // Virtudes
    'paz': 'G1515', 'pacífico': 'G1516', 'reconciliação': 'G2643',
    'alegria': 'G5479', 'alegrar': 'G5463', 'feliz': 'G3107',
    'esperança': 'G1680', 'esperar': 'G1679', 'esperou': 'G1679',
    'sabedoria': 'G4678', 'sábio': 'G4680', 'conhecimento': 'G1108',
    'bondade': 'G19', 'bom': 'G18', 'bem': 'G2095',
    // Mal
    'mal': 'G2556', 'maldade': 'G2549', 'maligno': 'G4190',
    'maldição': 'H7045', 'amaldiçoar': 'H779', 'maldito': 'H779',
    // Tempo
    'eternidade': 'G165', 'eterno': 'G166', 'sempre': 'G3842',
    'dia': 'H3117', 'dias': 'H3117', 'noite': 'H3915',
    'ano': 'H8141', 'anos': 'H8141', 'tempo': 'H6256',
    // Ações
    'obra': 'G2041', 'obras': 'G2041', 'trabalho': 'G2038',
    'ver': 'G991', 'viu': 'G1492', 'visão': 'H2377',
    'ouvir': 'G191', 'ouviu': 'G191',
    'falar': 'G2980', 'falou': 'G2036', 'dizer': 'G3004', 'disse': 'G2036',
    'vir': 'G2064', 'veio': 'G2064', 'vindo': 'G2064', 'vinda': 'G3952',
    'ir': 'G5217', 'foi': 'G565', 'ido': 'G4198',
    'dar': 'G1325', 'deu': 'G1325', 'dado': 'G1325', 'dom': 'G1431',
    'receber': 'G2983', 'recebeu': 'G2983', 'recebido': 'G2983',
    'enviar': 'G649', 'enviou': 'G649', 'enviado': 'G652',
    'buscar': 'G2212', 'buscou': 'G2212', 'procurar': 'G2212',
    'encontrar': 'G2147', 'encontrou': 'G2147', 'achado': 'G2147',
    'seguir': 'G190', 'seguiu': 'G190', 'seguidor': 'G190',
    'saber': 'H3045',
    // Lugares
    'templo': 'G2411', 'sinagoga': 'G4864', 'altar': 'G2379',
    'casa': 'H1004', 'casas': 'H1004', 'habitação': 'H4908',
    'cidade': 'H5892', 'cidades': 'H5892', 'lugar': 'H4725',
    'monte': 'H2022', 'montanha': 'H2022', 'vale': 'H1516',
    'rio': 'H5104', 'mar': 'H3220',
    'porta': 'G2374', 'caminho': 'G3598', 'estrada': 'G3598',
    // Elementos
    'fogo': 'H784', 'chama': 'H3852',
    'pão': 'G740', 'vinho': 'G3631', 'ceia': 'G1173',
    // Outros
    'guerra': 'H4421', 'batalha': 'H4421', 'retidão': 'H6666',
  };

  const handleWordClick = (word: string, verseNum: number) => {
    // Remove pontuação da palavra antes de buscar
    const cleanWord = word.replace(/[.,;:!?"'()]/g, '').trim();
    console.log("Word clicked:", cleanWord, "in verse", verseNum);
    
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
                      {verse.text.split(" ").map((word, idx) => {
                        const cleanWord = word.replace(/[.,;:!?"'()]/g, '').trim();
                        const hasStrong = !!wordToStrong[cleanWord];
                        
                        return (
                          <span
                            key={idx}
                            className={`cursor-pointer transition-colors ${
                              hasStrong 
                                ? 'text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700 dark:hover:text-blue-300 underline decoration-dotted' 
                                : 'hover:text-primary'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleWordClick(word, verse.verse);
                            }}
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
