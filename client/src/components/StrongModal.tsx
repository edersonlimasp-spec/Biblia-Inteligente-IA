import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, BookOpen, Languages, GitBranch, Library, Hash } from "lucide-react";
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
  portugueseDefinition?: string | null;
  strongsDefinition?: string | null;
  kjvDefinition?: string | null;
  derivation?: string | null;
  extendedDefinition?: string | null;
  language: string;
}

export function StrongModal({ strongNumber, onClose }: StrongModalProps) {
  const { data: strongData, isLoading, error } = useQuery<StrongEntry>({
    queryKey: ['/api/strong', strongNumber],
    staleTime: 0,
    gcTime: 0,
  });

  const apiError = error as ApiError;
  const requiresSubscription = apiError?.data?.requiresSubscription;
  const subscriptionMessage = apiError?.data?.message;

  const isHebrew = strongData?.number?.startsWith('H');
  const languageLabel = isHebrew ? 'Hebraico' : 'Grego';
  const languageColor = isHebrew ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-2xl h-[90vh] max-h-[90vh] flex flex-col p-0 gap-0" data-testid="modal-strong">
        <DialogClose asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-2 top-2 z-50"
            data-testid="button-close-strong"
          >
            <span className="sr-only">Fechar</span>
            ×
          </Button>
        </DialogClose>
        
        <ScrollArea className="flex-1">
          <div className="p-4 sm:p-6">
            {isLoading && (
              <>
                <DialogHeader>
                  <DialogTitle>Carregando...</DialogTitle>
                  <DialogDescription>Buscando informações do dicionário Strong</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <Skeleton className="h-12 w-40" />
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              </>
            )}

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

            {!error && strongData && (
              <div className="space-y-4">
                {/* Header with original word */}
                <div className="text-center pb-2">
                  {/* Original Word - Large and prominent */}
                  <h2 className={`text-4xl sm:text-5xl font-serif mb-2 ${isHebrew ? 'font-hebrew' : 'font-greek'}`} style={{ direction: isHebrew ? 'rtl' : 'ltr' }}>
                    {strongData.word}
                  </h2>
                  
                  {/* Transliteration and Pronunciation */}
                  {(strongData.transliteration || strongData.pronunciation) && (
                    <p className="text-lg text-muted-foreground italic">
                      {strongData.transliteration}
                      {strongData.pronunciation && ` (${strongData.pronunciation})`}
                    </p>
                  )}
                  
                  {/* Badges */}
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <Badge variant="outline" className="font-mono text-sm px-3 py-1">
                      <Hash className="w-3 h-3 mr-1" />
                      {strongData.number}
                    </Badge>
                    <Badge className={`text-sm px-3 py-1 ${languageColor}`}>
                      <Languages className="w-3 h-3 mr-1" />
                      {languageLabel}
                    </Badge>
                  </div>
                </div>

                <Separator />

                {/* Extended Definition - Rich theological explanation (AI-generated) */}
                {strongData.extendedDefinition && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <BookOpen className="h-5 w-5 text-primary" />
                      <h3 className="text-base font-semibold text-primary">Explicação Teológica</h3>
                    </div>
                    <div className="text-base leading-relaxed whitespace-pre-wrap">
                      {strongData.extendedDefinition}
                    </div>
                  </div>
                )}

                {/* Portuguese Definition - Simpler version */}
                {strongData.portugueseDefinition && !strongData.extendedDefinition && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <BookOpen className="h-5 w-5 text-primary" />
                      <h3 className="text-base font-semibold text-primary">Definição em Português</h3>
                    </div>
                    <p className="text-base leading-relaxed whitespace-pre-wrap">
                      {strongData.portugueseDefinition}
                    </p>
                  </div>
                )}

                {/* Strong's Definition - Detailed */}
                {strongData.strongsDefinition && (
                  <div className="bg-card border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Library className="h-5 w-5 text-muted-foreground" />
                      <h3 className="text-base font-semibold text-foreground">Definição do Strong</h3>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                      {strongData.strongsDefinition}
                    </p>
                  </div>
                )}

                {/* KJV Definition / Usage */}
                {strongData.kjvDefinition && strongData.kjvDefinition !== strongData.strongsDefinition && (
                  <div className="bg-card border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <BookOpen className="h-5 w-5 text-muted-foreground" />
                      <h3 className="text-base font-semibold text-foreground">Uso na King James (KJV)</h3>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                      {strongData.kjvDefinition}
                    </p>
                  </div>
                )}

                {/* Derivation / Etymology */}
                {strongData.derivation && (
                  <div className="bg-card border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <GitBranch className="h-5 w-5 text-muted-foreground" />
                      <h3 className="text-base font-semibold text-foreground">Derivação / Etimologia</h3>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                      {strongData.derivation}
                    </p>
                  </div>
                )}

                {/* English Definition Fallback (if no Portuguese) */}
                {!strongData.portugueseDefinition && strongData.definition && (
                  <div className="bg-card border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <BookOpen className="h-5 w-5 text-muted-foreground" />
                      <h3 className="text-base font-semibold text-foreground">Definição (Inglês)</h3>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                      {strongData.definition}
                    </p>
                  </div>
                )}

                {/* Info tip */}
                <div className="bg-muted/50 p-3 rounded-md border text-center">
                  <p className="text-xs text-muted-foreground">
                    Esta palavra original ajuda a compreender o significado mais profundo do texto bíblico.
                  </p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
