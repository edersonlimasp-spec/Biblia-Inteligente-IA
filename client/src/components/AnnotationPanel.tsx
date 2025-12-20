/**
 * Annotation Panel Component
 * Compact annotation area for quick notes on current chapter
 */

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, MessageSquare, Save, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useRequireAuth } from "@/contexts/AuthGateContext";
import type { Annotation } from "@shared/schema";

interface AnnotationPanelProps {
  book: string;
  bookName: string;
  chapter: number;
  selectedVerse?: number | null;
  isInitiallyExpanded?: boolean;
}

export function AnnotationPanel({ book, bookName, chapter, selectedVerse, isInitiallyExpanded = false }: AnnotationPanelProps) {
  const [isExpanded, setIsExpanded] = useState(isInitiallyExpanded);
  const [noteText, setNoteText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();
  const { requireAuth } = useRequireAuth();

  // Fetch annotations for current chapter
  const { data: annotations, isLoading } = useQuery<Annotation[]>({
    queryKey: ['/api/annotations'],
  });

  // Filter annotations for current book/chapter
  const chapterAnnotations = annotations?.filter(
    a => a.book === book && a.chapter === chapter
  ) || [];

  // Get annotation for selected verse (if any)
  const verseAnnotation = selectedVerse 
    ? chapterAnnotations.find(a => a.verse === selectedVerse)
    : null;

  // Update noteText when verse changes
  useEffect(() => {
    if (verseAnnotation) {
      setNoteText(verseAnnotation.note);
      setEditingId(verseAnnotation.id);
    } else {
      setNoteText("");
      setEditingId(null);
    }
  }, [selectedVerse, verseAnnotation]);

  // Expand panel when initially expanded flag is true
  useEffect(() => {
    if (isInitiallyExpanded && !isExpanded) {
      setIsExpanded(true);
    }
  }, [isInitiallyExpanded]);

  // Save annotation
  const saveMutation = useMutation({
    mutationFn: async (data: { note: string; verse: number }) => {
      if (editingId) {
        return apiRequest('PATCH', `/api/annotations/${editingId}`, { note: data.note });
      } else {
        return apiRequest('POST', '/api/annotations', {
          book,
          chapter,
          verse: data.verse,
          note: data.note,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/annotations'] });
      toast({
        title: "Nota salva",
        description: `Anotação para ${bookName} ${chapter}:${selectedVerse || 1} salva com sucesso`,
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível salvar a nota",
        variant: "destructive",
      });
    },
  });

  // Delete annotation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/annotations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/annotations'] });
      setNoteText("");
      setEditingId(null);
      toast({
        title: "Nota removida",
        description: "Anotação removida com sucesso",
      });
    },
  });

  const handleSave = () => {
    if (!noteText.trim()) return;
    requireAuth(() => {
      saveMutation.mutate({ 
        note: noteText.trim(), 
        verse: selectedVerse || 1 
      });
    }, "salvar anotações");
  };

  const handleDelete = () => {
    if (editingId) {
      requireAuth(() => {
        deleteMutation.mutate(editingId);
      }, "excluir anotações");
    }
  };

  const notesCount = chapterAnnotations.length;

  return (
    <div className="border-t bg-card/50">
      {/* Collapsible Header */}
      <button
        className="w-full flex items-center justify-between px-4 py-2 hover:bg-muted/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
        data-testid="button-toggle-annotations"
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Minhas Anotações</span>
          {notesCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {notesCount}
            </Badge>
          )}
        </div>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Current Verse Context */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>
              {selectedVerse 
                ? `Nota para ${bookName} ${chapter}:${selectedVerse}`
                : `Nota geral para ${bookName} ${chapter}`
              }
            </span>
          </div>

          {/* Text Input */}
          <Textarea
            placeholder="Escreva sua anotação aqui..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            className="min-h-[80px] text-sm resize-none"
            data-testid="input-annotation"
          />

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end">
            {editingId && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                data-testid="button-delete-annotation"
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!noteText.trim() || saveMutation.isPending}
              data-testid="button-save-annotation"
            >
              {saveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Save className="h-4 w-4 mr-1" />
              )}
              Salvar
            </Button>
          </div>

          {/* List of existing notes for this chapter */}
          {chapterAnnotations.length > 0 && (
            <div className="border-t pt-3 mt-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Notas neste capítulo:
              </p>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {chapterAnnotations.map((ann) => (
                  <div
                    key={ann.id}
                    className={`text-xs p-2 rounded border cursor-pointer hover:bg-muted/50 ${
                      editingId === ann.id ? "bg-primary/10 border-primary" : ""
                    }`}
                    onClick={() => {
                      setNoteText(ann.note);
                      setEditingId(ann.id);
                    }}
                    data-testid={`annotation-item-${ann.id}`}
                  >
                    <span className="font-medium text-primary">v.{ann.verse}:</span>{" "}
                    <span className="text-muted-foreground line-clamp-2">{ann.note}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
