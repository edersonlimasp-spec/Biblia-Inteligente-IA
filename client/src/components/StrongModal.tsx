import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
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
      <DialogContent className="max-w-lg" data-testid="modal-strong">
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
              <DialogTitle className="text-2xl font-serif text-primary">
                {strongData.word}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Transliteração</p>
                <p className="font-medium">{strongData.transliteration}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Pronúncia</p>
                <p className="font-medium italic">{strongData.pronunciation}</p>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono">
                  {strongData.number}
                </Badge>
                <Badge variant="secondary">
                  {strongData.number.startsWith('G') ? 'Grego' : 'Hebraico'}
                </Badge>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-semibold mb-2 text-primary">Definição</p>
                <p className="leading-relaxed">{strongData.definition}</p>
              </div>

              <div>
                <p className="text-sm font-semibold mb-2 text-primary">Uso na KJV</p>
                <p className="leading-relaxed text-muted-foreground">{strongData.kjvUsage}</p>
              </div>

              <div className="bg-muted/50 p-3 rounded-md">
                <p className="text-xs text-muted-foreground">
                  💡 Dica: Use o dicionário Strong para entender melhor as palavras originais da Bíblia em {strongData.number.startsWith('G') ? 'Grego' : 'Hebraico'}.
                </p>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
