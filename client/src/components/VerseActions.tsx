/**
 * Verse Actions Component
 * Provides share, bookmark, highlight, and annotation actions for verses
 */

import { useState } from "react";
import { Share2, Copy, Bookmark, Highlighter, Check, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface VerseActionsProps {
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
  isBookmarked?: boolean;
  isHighlighted?: boolean;
  onBookmark?: () => void;
  onHighlight?: (color: string) => void;
  onRemoveHighlight?: () => void;
  onAnnotate?: () => void;
}

const HIGHLIGHT_COLORS = [
  { name: "Amarelo", color: "yellow", bg: "bg-yellow-200 dark:bg-yellow-900/50" },
  { name: "Verde", color: "green", bg: "bg-green-200 dark:bg-green-900/50" },
  { name: "Azul", color: "blue", bg: "bg-blue-200 dark:bg-blue-900/50" },
  { name: "Rosa", color: "pink", bg: "bg-pink-200 dark:bg-pink-900/50" },
  { name: "Laranja", color: "orange", bg: "bg-orange-200 dark:bg-orange-900/50" },
];

export function VerseActions({
  bookName,
  chapter,
  verse,
  text,
  isBookmarked = false,
  isHighlighted = false,
  onBookmark,
  onHighlight,
  onRemoveHighlight,
  onAnnotate,
}: VerseActionsProps) {
  const { toast } = useToast();
  const [justCopied, setJustCopied] = useState(false);

  const reference = `${bookName} ${chapter}:${verse}`;
  const shareText = `"${text}" - ${reference}`;

  const handleShare = async () => {
    // Try Web Share API first (mobile-friendly)
    if (navigator.share) {
      try {
        await navigator.share({
          title: reference,
          text: shareText,
        });
        return;
      } catch (err) {
        // User cancelled or share failed, fall through to clipboard
        if ((err as Error).name === 'AbortError') return;
      }
    }
    
    // Fallback: Copy to clipboard
    handleCopy();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setJustCopied(true);
      toast({
        title: "Copiado!",
        description: "Versículo copiado para a área de transferência",
      });
      setTimeout(() => setJustCopied(false), 2000);
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o texto",
        variant: "destructive",
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          data-testid={`button-verse-actions-${verse}`}
        >
          <Share2 className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {/* Share */}
        <DropdownMenuItem onClick={handleShare} data-testid={`action-share-${verse}`}>
          <Share2 className="h-4 w-4 mr-2" />
          Compartilhar
        </DropdownMenuItem>
        
        {/* Copy */}
        <DropdownMenuItem onClick={handleCopy} data-testid={`action-copy-${verse}`}>
          {justCopied ? (
            <>
              <Check className="h-4 w-4 mr-2 text-green-500" />
              Copiado!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-2" />
              Copiar texto
            </>
          )}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Bookmark */}
        <DropdownMenuItem onClick={onBookmark} data-testid={`action-bookmark-${verse}`}>
          <Bookmark className={`h-4 w-4 mr-2 ${isBookmarked ? "fill-primary text-primary" : ""}`} />
          {isBookmarked ? "Remover marcador" : "Marcar versículo"}
        </DropdownMenuItem>

        {/* Highlight */}
        {isHighlighted ? (
          <DropdownMenuItem onClick={onRemoveHighlight} data-testid={`action-remove-highlight-${verse}`}>
            <Highlighter className="h-4 w-4 mr-2" />
            Remover realce
          </DropdownMenuItem>
        ) : (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
              Realçar com cor
            </div>
            <div className="flex gap-1 px-2 pb-2">
              {HIGHLIGHT_COLORS.map((c) => (
                <button
                  key={c.color}
                  className={`w-6 h-6 rounded-full ${c.bg} border border-border hover:ring-2 hover:ring-primary/50`}
                  onClick={() => onHighlight?.(c.color)}
                  title={c.name}
                  data-testid={`action-highlight-${c.color}-${verse}`}
                />
              ))}
            </div>
          </>
        )}

        <DropdownMenuSeparator />

        {/* Annotate */}
        <DropdownMenuItem onClick={onAnnotate} data-testid={`action-annotate-${verse}`}>
          <MessageSquare className="h-4 w-4 mr-2" />
          Adicionar nota
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { HIGHLIGHT_COLORS };
