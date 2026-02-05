/**
 * VerseExtras Component
 * Displays Cross References and Commentary for a selected verse
 * ISOLATED from the core 7-layer system - only adds UI elements
 */

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, ExternalLink, BookOpen, Link2, Loader2, X, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CrossReference {
  ref: string;
  reason?: string;
}

interface CommentaryBlock {
  source: string;
  type: 'doctrinal' | 'historical' | 'linguistic' | 'devotional' | 'general';
  title?: string;
  text: string;
}

interface VerseExtrasProps {
  bookId: string;
  chapter: number;
  verse: number;
  onNavigate?: (bookId: string, chapter: number, verse: number) => void;
  onClose?: () => void;
}

const BOOK_NAMES: Record<string, string> = {
  gen: "Gênesis", exo: "Êxodo", lev: "Levítico", num: "Números", deu: "Deuteronômio",
  jos: "Josué", jdg: "Juízes", rut: "Rute", "1sa": "1 Samuel", "2sa": "2 Samuel",
  "1ki": "1 Reis", "2ki": "2 Reis", "1ch": "1 Crônicas", "2ch": "2 Crônicas",
  ezr: "Esdras", neh: "Neemias", est: "Ester", job: "Jó", psa: "Salmos",
  pro: "Provérbios", ecc: "Eclesiastes", sng: "Cantares", isa: "Isaías",
  jer: "Jeremias", lam: "Lamentações", ezk: "Ezequiel", dan: "Daniel",
  hos: "Oséias", jol: "Joel", amo: "Amós", oba: "Obadias", jon: "Jonas",
  mic: "Miquéias", nam: "Naum", hab: "Habacuque", zep: "Sofonias", hag: "Ageu",
  zec: "Zacarias", mal: "Malaquias", mat: "Mateus", mrk: "Marcos", luk: "Lucas",
  jhn: "João", act: "Atos", rom: "Romanos", "1co": "1 Coríntios", "2co": "2 Coríntios",
  gal: "Gálatas", eph: "Efésios", php: "Filipenses", col: "Colossenses",
  "1th": "1 Tessalonicenses", "2th": "2 Tessalonicenses", "1ti": "1 Timóteo",
  "2ti": "2 Timóteo", tit: "Tito", phm: "Filemom", heb: "Hebreus", jas: "Tiago",
  "1pe": "1 Pedro", "2pe": "2 Pedro", "1jn": "1 João", "2jn": "2 João",
  "3jn": "3 João", jud: "Judas", rev: "Apocalipse"
};

const CANONICAL_BOOK_ORDER = [
  "gen", "exo", "lev", "num", "deu", "jos", "jdg", "rut", "1sa", "2sa",
  "1ki", "2ki", "1ch", "2ch", "ezr", "neh", "est", "job", "psa", "pro",
  "ecc", "sng", "isa", "jer", "lam", "ezk", "dan", "hos", "jol", "amo",
  "oba", "jon", "mic", "nam", "hab", "zep", "hag", "zec", "mal",
  "mat", "mrk", "luk", "jhn", "act", "rom", "1co", "2co", "gal", "eph",
  "php", "col", "1th", "2th", "1ti", "2ti", "tit", "phm", "heb", "jas",
  "1pe", "2pe", "1jn", "2jn", "3jn", "jud", "rev"
];

const OLD_TESTAMENT_BOOKS = new Set(CANONICAL_BOOK_ORDER.slice(0, 39));

function parseRef(refString: string): { bookId: string; chapter: number; verse: number } | null {
  const parts = refString.split('.');
  if (parts.length !== 3) return null;
  const [bookId, chapterStr, verseStr] = parts;
  const chapter = parseInt(chapterStr, 10);
  const verse = parseInt(verseStr, 10);
  if (isNaN(chapter) || isNaN(verse)) return null;
  return { bookId, chapter, verse };
}

function formatRef(refString: string): string {
  const parsed = parseRef(refString);
  if (!parsed) return refString;
  const bookName = BOOK_NAMES[parsed.bookId] || parsed.bookId;
  return `${bookName} ${parsed.chapter}:${parsed.verse}`;
}

function getTestament(bookId: string): 'AT' | 'NT' {
  return OLD_TESTAMENT_BOOKS.has(bookId) ? 'AT' : 'NT';
}

function getTypeLabel(type: CommentaryBlock['type']): string {
  const labels: Record<string, string> = {
    doctrinal: 'Doutrinário',
    historical: 'Histórico',
    linguistic: 'Linguístico',
    devotional: 'Devocional',
    general: 'Geral'
  };
  return labels[type] || type;
}

function getTypeBadgeVariant(type: CommentaryBlock['type']): "default" | "secondary" | "outline" {
  switch (type) {
    case 'doctrinal': return 'default';
    case 'historical': return 'secondary';
    default: return 'outline';
  }
}

export function VerseExtras({ bookId, chapter, verse, onNavigate, onClose }: VerseExtrasProps) {
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());
  const [testamentFilter, setTestamentFilter] = useState<'all' | 'AT' | 'NT'>('all');

  const { data: refsData, isLoading: loadingRefs } = useQuery<{ refs: CrossReference[] }>({
    queryKey: [`/api/bible/cross-references?bookId=${bookId}&chapter=${chapter}&verse=${verse}`],
    enabled: !!bookId && !!chapter && !!verse,
    staleTime: 60000,
  });

  const { data: commentaryData, isLoading: loadingCommentary } = useQuery<{ commentary_blocks: CommentaryBlock[] }>({
    queryKey: [`/api/bible/commentary?bookId=${bookId}&chapter=${chapter}&verse=${verse}`],
    enabled: !!bookId && !!chapter && !!verse,
    staleTime: 60000,
  });

  const refs = refsData?.refs || [];
  const commentary = commentaryData?.commentary_blocks || [];

  const filteredRefs = useMemo(() => {
    if (testamentFilter === 'all') return refs;
    return refs.filter(ref => {
      const parsed = parseRef(ref.ref);
      if (!parsed) return false;
      return getTestament(parsed.bookId) === testamentFilter;
    });
  }, [refs, testamentFilter]);

  const groupedRefs = useMemo(() => {
    const groups: Record<string, { bookId: string; refs: CrossReference[] }> = {};
    filteredRefs.forEach(ref => {
      const parsed = parseRef(ref.ref);
      if (parsed) {
        const bookName = BOOK_NAMES[parsed.bookId] || parsed.bookId;
        if (!groups[bookName]) groups[bookName] = { bookId: parsed.bookId, refs: [] };
        groups[bookName].refs.push(ref);
      }
    });
    
    const sortedEntries = Object.entries(groups).sort((a, b) => {
      const orderA = CANONICAL_BOOK_ORDER.indexOf(a[1].bookId);
      const orderB = CANONICAL_BOOK_ORDER.indexOf(b[1].bookId);
      return (orderA === -1 ? 999 : orderA) - (orderB === -1 ? 999 : orderB);
    });
    
    return sortedEntries;
  }, [filteredRefs]);

  const handleRefClick = (refString: string) => {
    const parsed = parseRef(refString);
    if (parsed && onNavigate) {
      onNavigate(parsed.bookId, parsed.chapter, parsed.verse);
    }
  };

  const toggleComment = (index: number) => {
    const newSet = new Set(expandedComments);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setExpandedComments(newSet);
  };

  const hasContent = refs.length > 0 || commentary.length > 0;
  const isLoading = loadingRefs || loadingCommentary;

  if (isLoading) {
    return (
      <Card className="mt-4">
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin mr-2 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Carregando recursos...</span>
        </CardContent>
      </Card>
    );
  }

  if (!hasContent) {
    return null;
  }

  const currentBookName = BOOK_NAMES[bookId] || bookId;

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base font-semibold">
            Recursos para {currentBookName} {chapter}:{verse}
          </CardTitle>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              data-testid="button-close-extras"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Accordion type="multiple" className="w-full space-y-2">
          {refs.length > 0 && (
            <AccordionItem value="refs" className="border rounded-lg">
              <AccordionTrigger className="px-4 py-3 hover:no-underline" data-testid="accordion-cross-refs">
                <div className="flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  <span className="font-medium">Referências Cruzadas</span>
                  <Badge variant="secondary">{filteredRefs.length}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Filtrar:</span>
                  <Select value={testamentFilter} onValueChange={(v) => setTestamentFilter(v as 'all' | 'AT' | 'NT')}>
                    <SelectTrigger className="w-[180px]" data-testid="select-testament-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os livros</SelectItem>
                      <SelectItem value="AT">Antigo Testamento</SelectItem>
                      <SelectItem value="NT">Novo Testamento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {groupedRefs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma referência encontrada com este filtro.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {groupedRefs.map(([bookName, { bookId, refs: bookRefs }]) => (
                      <div key={bookName}>
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-sm font-medium">
                            {bookName}
                          </h4>
                          <Badge variant="outline">
                            {getTestament(bookId)}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          {bookRefs.map((ref, idx) => {
                            const parsed = parseRef(ref.ref);
                            return (
                              <div
                                key={idx}
                                className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 hover-elevate cursor-pointer"
                                onClick={() => handleRefClick(ref.ref)}
                                data-testid={`ref-item-${bookName}-${idx}`}
                              >
                                <div className="flex-1">
                                  <span className="font-medium text-sm">
                                    Capítulo {parsed?.chapter}, versículo {parsed?.verse}
                                  </span>
                                  {ref.reason && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                      "{ref.reason}"
                                    </p>
                                  )}
                                </div>
                                <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          )}

          {commentary.length > 0 && (
            <AccordionItem value="commentary" className="border rounded-lg">
              <AccordionTrigger className="px-4 py-3 hover:no-underline" data-testid="accordion-commentary">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span className="font-medium">Comentários Bíblicos</span>
                  <Badge variant="secondary">{commentary.length}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-4">
                  {commentary.map((block, idx) => (
                    <div key={idx} className="p-4 rounded-lg bg-muted/40">
                      <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                        <h4 className="font-medium text-sm">
                          {block.title || block.source}
                        </h4>
                        <div className="flex items-center gap-2">
                          <Badge variant={getTypeBadgeVariant(block.type)}>
                            {getTypeLabel(block.type)}
                          </Badge>
                          {block.title && (
                            <span className="text-xs text-muted-foreground">
                              {block.source}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className={`text-sm leading-relaxed ${
                        !expandedComments.has(idx) && block.text.length > 200 ? 'line-clamp-3' : ''
                      }`}>
                        {block.text}
                      </p>
                      {block.text.length > 200 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2"
                          onClick={() => toggleComment(idx)}
                          data-testid={`toggle-comment-${idx}`}
                        >
                          {expandedComments.has(idx) ? (
                            <>
                              <ChevronUp className="h-3 w-3 mr-1" />
                              Ver menos
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-3 w-3 mr-1" />
                              Ver mais
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      </CardContent>
    </Card>
  );
}

export default VerseExtras;
