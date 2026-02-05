/**
 * VerseExtras Component
 * Displays Cross References and Commentary for a selected verse
 * ISOLATED from the core 7-layer system - only adds UI elements
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, ExternalLink, BookOpen, Link2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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

export function VerseExtras({ bookId, chapter, verse, onNavigate }: VerseExtrasProps) {
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());

  const { data: refsData, isLoading: loadingRefs } = useQuery<{ refs: CrossReference[] }>({
    queryKey: ['/api/bible/cross-references', bookId, chapter, verse],
    queryFn: async () => {
      const res = await fetch(`/api/bible/cross-references?bookId=${bookId}&chapter=${chapter}&verse=${verse}`);
      if (!res.ok) return { refs: [] };
      return res.json();
    },
    enabled: !!bookId && !!chapter && !!verse,
    staleTime: 60000,
  });

  const { data: commentaryData, isLoading: loadingCommentary } = useQuery<{ commentary_blocks: CommentaryBlock[] }>({
    queryKey: ['/api/bible/commentary', bookId, chapter, verse],
    queryFn: async () => {
      const res = await fetch(`/api/bible/commentary?bookId=${bookId}&chapter=${chapter}&verse=${verse}`);
      if (!res.ok) return { commentary_blocks: [] };
      return res.json();
    },
    enabled: !!bookId && !!chapter && !!verse,
    staleTime: 60000,
  });

  const refs = refsData?.refs || [];
  const commentary = commentaryData?.commentary_blocks || [];

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
      <div className="mt-4 flex items-center justify-center py-4 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        <span className="text-sm">Carregando recursos...</span>
      </div>
    );
  }

  if (!hasContent) {
    return null;
  }

  return (
    <div className="mt-4 space-y-2">
      <Accordion type="multiple" className="w-full">
        {refs.length > 0 && (
          <AccordionItem value="refs" className="border rounded-lg">
            <AccordionTrigger className="px-4 py-3 hover:no-underline" data-testid="accordion-cross-refs">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-primary" />
                <span className="font-medium">Referências Cruzadas</span>
                <Badge variant="secondary" className="ml-2">{refs.length}</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="flex flex-wrap gap-2">
                {refs.map((ref, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    className="h-auto py-1.5 px-3"
                    onClick={() => handleRefClick(ref.ref)}
                    data-testid={`ref-link-${idx}`}
                  >
                    <ExternalLink className="h-3 w-3 mr-1.5" />
                    <span>{formatRef(ref.ref)}</span>
                  </Button>
                ))}
              </div>
              {refs.some(r => r.reason) && (
                <div className="mt-3 space-y-2">
                  {refs.filter(r => r.reason).map((ref, idx) => (
                    <div key={idx} className="text-sm text-muted-foreground">
                      <span className="font-medium">{formatRef(ref.ref)}:</span>{" "}
                      <span>{ref.reason}</span>
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
                <BookOpen className="h-4 w-4 text-primary" />
                <span className="font-medium">Comentários</span>
                <Badge variant="secondary" className="ml-2">{commentary.length}</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-4">
                {commentary.map((block, idx) => (
                  <Card key={idx} className="bg-muted/30">
                    <CardHeader className="py-3 px-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium">
                          {block.title || block.source}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant={getTypeBadgeVariant(block.type)} className="text-xs">
                            {getTypeLabel(block.type)}
                          </Badge>
                          {block.title && (
                            <span className="text-xs text-muted-foreground">
                              {block.source}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="py-2 px-4">
                      <p className={`text-sm leading-relaxed ${
                        !expandedComments.has(idx) && block.text.length > 200 ? 'line-clamp-3' : ''
                      }`}>
                        {block.text}
                      </p>
                      {block.text.length > 200 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 h-auto py-1 px-2 text-xs"
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
                    </CardContent>
                  </Card>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );
}

export default VerseExtras;
