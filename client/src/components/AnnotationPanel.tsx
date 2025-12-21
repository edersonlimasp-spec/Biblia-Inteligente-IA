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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  onClose?: () => void;
}

export function AnnotationPanel({ book, bookName, chapter, selectedVerse, isInitiallyExpanded = false, onClose }: AnnotationPanelProps) {
  const [isExpanded, setIsExpanded] = useState(isInitiallyExpanded);
  const [noteText, setNoteText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
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
      // Fechar painel após salvar
      setIsExpanded(false);
      if (onClose) onClose();
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
        setDeleteConfirmId(editingId);
      }, "excluir anotações");
    }
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      deleteMutation.mutate(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const notesCount = chapterAnnotations.length;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background dark:bg-slate-950 shadow-lg">
      {/* Collapsible Header */}
      <button
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
        onClick={() => {
          const newExpanded = !isExpanded;
          setIsExpanded(newExpanded);
          // Quando fechar, notificar o parent para restaurar AIPanel
          if (!newExpanded && onClose) {
            onClose();
          }
        }}
        data-testid="button-toggle-annotations"
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Minhas Anotações</span>
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
        <div className="px-4 py-4 space-y-4 bg-muted/20">
          {/* Current Verse Context */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium">
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
            className="min-h-[120px] text-base leading-relaxed resize-none bg-background dark:bg-slate-900 text-foreground dark:text-white border border-border placeholder:text-muted-foreground"
            data-testid="input-annotation"
          />

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end pt-2">
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
            <div className="border-t border-border pt-4 mt-4">
              <p className="text-sm font-medium text-foreground mb-3">
                Notas neste capítulo ({chapterAnnotations.length}):
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {chapterAnnotations.map((ann) => (
                  <div
                    key={ann.id}
                    className={`text-sm p-3 rounded-md border transition-colors ${
                      editingId === ann.id 
                        ? "bg-primary/15 border-primary text-foreground" 
                        : "bg-background dark:bg-slate-800 border-border text-foreground hover:bg-muted/50 dark:hover:bg-slate-700"
                    }`}
                    data-testid={`annotation-item-${ann.id}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div 
                        className="flex-1 cursor-pointer"
                        onClick={() => {
                          setNoteText(ann.note);
                          setEditingId(ann.id);
                        }}
                      >
                        <span className="font-semibold text-primary">v.{ann.verse}:</span>{" "}
                        <span className="text-foreground/90 line-clamp-2">{ann.note}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 flex-shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          requireAuth(() => {
                            setDeleteConfirmId(ann.id);
                          }, "excluir anotações");
                        }}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-annotation-${ann.id}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir anotação?</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja excluir esta anotação? Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
