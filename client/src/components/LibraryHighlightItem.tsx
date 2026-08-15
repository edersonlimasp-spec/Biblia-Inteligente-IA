import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Trash2, Pencil, Check, X, StickyNote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getApiUrl, queryClient, getAuthHeaders } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Highlight colors — same palette used in the book reader
export const HIGHLIGHT_COLOR_BG: Record<string, string> = {
  yellow: "#FACC15",
  green: "#4ADE80",
  blue: "#60A5FA",
  pink: "#F472B6",
  orange: "#FB923C",
  purple: "#C084FC",
};

export interface LibraryHighlightItemData {
  id: string;
  selectedText: string;
  color: string;
  annotation: string | null;
  chapterOrderNum: number;
  chapterTitle: string;
  bookTitle?: string;
  createdAt: string | Date;
}

interface LibraryHighlightItemProps {
  highlight: LibraryHighlightItemData;
  onNavigate?: () => void;
  /** Query keys to invalidate after edit/delete */
  invalidateKeys: (string | (string | number)[])[];
  /** Accent color for the book badge (optional) */
  badgeColor?: string;
  testId?: string;
}

export function LibraryHighlightItem({
  highlight: h,
  onNavigate,
  invalidateKeys,
  badgeColor,
  testId,
}: LibraryHighlightItemProps) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(h.annotation ?? "");

  const invalidateAll = () => {
    invalidateKeys.forEach((key) =>
      queryClient.invalidateQueries({ queryKey: Array.isArray(key) ? key : [key] })
    );
  };

  const updateMutation = useMutation({
    mutationFn: async (annotation: string) => {
      const res = await fetch(getApiUrl(`/api/library/highlights/${h.id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        credentials: "include",
        body: JSON.stringify({ annotation }),
      });
      if (!res.ok) throw new Error("Erro ao salvar anotação");
      return res.json();
    },
    onSuccess: () => {
      setEditing(false);
      invalidateAll();
      toast({ title: "Anotação salva!" });
    },
    onError: () => {
      toast({ title: "Erro ao salvar anotação", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(getApiUrl(`/api/library/highlights/${h.id}`), {
        method: "DELETE",
        credentials: "include",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Erro ao remover destaque");
      return res.json();
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Destaque removido" });
    },
    onError: () => {
      toast({ title: "Erro ao remover destaque", variant: "destructive" });
    },
  });

  const colorHex = HIGHLIGHT_COLOR_BG[h.color] ?? HIGHLIGHT_COLOR_BG.yellow;

  return (
    <Card className="transition-all" data-testid={testId}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Color dot */}
          <div className="mt-1 flex-shrink-0">
            <div
              className="w-3 h-3 rounded-full ring-2 ring-white/30"
              style={{ backgroundColor: colorHex }}
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {h.bookTitle && (
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full border"
                  style={badgeColor ? { borderColor: `${badgeColor}60`, color: badgeColor } : undefined}
                >
                  {h.bookTitle}
                </span>
              )}
              <button
                type="button"
                className="text-xs text-muted-foreground hover:underline"
                onClick={onNavigate}
                data-testid={testId ? `${testId}-chapter-link` : undefined}
              >
                Cap. {h.chapterOrderNum} — {h.chapterTitle}
              </button>
              <span className="text-xs text-muted-foreground ml-auto">
                {new Date(h.createdAt).toLocaleDateString("pt-BR")}
              </span>
            </div>

            <p
              className="text-sm text-foreground italic border-l-2 pl-2 cursor-pointer"
              style={{ borderColor: colorHex }}
              onClick={onNavigate}
            >
              "{h.selectedText}"
            </p>

            {/* Annotation area */}
            {editing ? (
              <div className="mt-2 space-y-2">
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Escreva sua anotação..."
                  className="text-sm min-h-[70px]"
                  autoFocus
                  data-testid={testId ? `${testId}-annotation-input` : undefined}
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setEditing(false); setDraft(h.annotation ?? ""); }}
                  >
                    <X className="w-4 h-4 mr-1" /> Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => updateMutation.mutate(draft.trim())}
                    disabled={updateMutation.isPending}
                    data-testid={testId ? `${testId}-annotation-save` : undefined}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    {updateMutation.isPending ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </div>
            ) : h.annotation ? (
              <button
                type="button"
                className="mt-2 w-full text-left text-xs text-muted-foreground bg-muted/50 rounded-md p-2 flex items-start gap-1.5"
                onClick={() => { setDraft(h.annotation ?? ""); setEditing(true); }}
                data-testid={testId ? `${testId}-annotation` : undefined}
              >
                <StickyNote className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span className="flex-1">{h.annotation}</span>
                <Pencil className="w-3 h-3 flex-shrink-0 mt-0.5 opacity-50" />
              </button>
            ) : (
              <button
                type="button"
                className="mt-2 text-xs text-muted-foreground/70 hover:text-muted-foreground flex items-center gap-1"
                onClick={() => { setDraft(""); setEditing(true); }}
                data-testid={testId ? `${testId}-annotation-add` : undefined}
              >
                <Pencil className="w-3 h-3" /> Adicionar anotação
              </button>
            )}
          </div>

          {/* Delete */}
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            data-testid={testId ? `${testId}-delete` : undefined}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
