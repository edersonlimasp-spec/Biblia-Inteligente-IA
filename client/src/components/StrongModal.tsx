import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, BookOpen, Library, Lightbulb, X } from "lucide-react";
import { ApiError } from "@/lib/queryClient";

interface StrongModalProps {
  strongNumber: string;
  onClose: () => void;
}

interface StrongEntry {
  number: string;
  word: string;
  transliteration: string;
  pronunciation: string;
  definition: string;
  portugueseDefinition?: string | null; // NEW: Portuguese translation
  kjvUsage: string;
}

export function StrongModal({ strongNumber, onClose }: StrongModalProps) {
  const { data: strongData, isLoading, error } = useQuery<StrongEntry>({
    queryKey: ['/api/strong', strongNumber],
    // Disable caching for Strong lookups to ensure fresh access checks
    staleTime: 0,
    gcTime: 0,
  });

  // Check if error is due to access restriction using ApiError
  const apiError = error as ApiError;
  const requiresSubscription = apiError?.data?.requiresSubscription;
  const subscriptionMessage = apiError?.data?.message;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="w-[50vw] h-[50vw] max-w-2xl max-h-[500px] flex flex-col" data-testid="modal-strong">
        <DialogClose asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-2 top-2 z-50"
            data-testid="button-close-strong"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogClose>
        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <>
              <DialogHeader>
                <DialogTitle>Carregando...</DialogTitle>
                <DialogDescription>Buscando informações do dicionário Strong</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            </>
          )}

          {/* Show paywall if access is denied */}
          {error && requiresSubscription && (
            <>
              <DialogHeader>
                <DialogTitle>Recurso Premium</DialogTitle>
                <DialogDescription>{subscriptionMessage}</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <AlertCircle className="w-12 h-12 text-primary mb-4" />
                <Button onClick={onClose} data-testid="button-close-paywall">
                  Entendi
                </Button>
              </div>
            </>
          )}

          {/* Show error if entry not found or other errors */}
          {error && !requiresSubscription && (
            <>
              <DialogHeader>
                <DialogTitle>Entrada não encontrada</DialogTitle>
                <DialogDescription>
                  Não foi possível encontrar informações para {strongNumber}
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
              </div>
            </>
          )}

          {/* Only show Strong data if no error */}
          {!error && strongData && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="font-mono text-xs">
                    {strongData.number}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {strongData.number.startsWith('G') ? 'Grego' : 'Hebraico'}
                  </Badge>
                </div>
                <DialogTitle className="text-3xl font-serif text-primary mb-1">
                  {strongData.word}
                </DialogTitle>
                {(strongData.transliteration || strongData.pronunciation) && (
                  <DialogDescription className="text-base">
                    {strongData.transliteration}
                    {strongData.pronunciation && (
                      <span className="italic text-muted-foreground"> ({strongData.pronunciation})</span>
                    )}
                  </DialogDescription>
                )}
              </DialogHeader>

              <div className="space-y-4">

                {(strongData.portugueseDefinition || strongData.definition) && (
                  <div className="bg-card border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="h-4 w-4 text-primary" />
                      <p className="text-sm font-semibold text-primary">
                        {strongData.portugueseDefinition ? "Definição em Português" : "Definição"}
                      </p>
                    </div>
                    <p className="leading-relaxed">
                      {strongData.portugueseDefinition || strongData.definition}
                    </p>
                    {strongData.portugueseDefinition && strongData.definition && (
                      <p className="text-sm text-muted-foreground mt-3 pt-3 border-t">
                        <span className="font-medium">Inglês:</span> {strongData.definition}
                      </p>
                    )}
                  </div>
                )}

                {strongData.kjvUsage && (
                  <div className="bg-card border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Library className="h-4 w-4 text-primary" />
                      <p className="text-sm font-semibold text-primary">Uso na Bíblia</p>
                    </div>
                    <p className="leading-relaxed text-muted-foreground">{strongData.kjvUsage}</p>
                  </div>
                )}

                <div className="bg-primary/10 p-3 rounded-md border border-primary/20">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-primary font-medium">
                      Esta palavra original ajuda a compreender o significado mais profundo do texto bíblico
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
