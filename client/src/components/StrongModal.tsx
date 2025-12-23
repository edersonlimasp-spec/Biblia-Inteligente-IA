import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, X, Search, Crown, BookOpen, Infinity } from "lucide-react";
import { ApiError } from "@/lib/queryClient";

interface StrongModalProps {
  strongNumber: string;
  onClose: () => void;
  onNavigateToSubscriptions?: () => void;
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

export function StrongModal({ strongNumber, onClose, onNavigateToSubscriptions }: StrongModalProps) {
  const { data: strongData, isLoading, error } = useQuery<StrongEntry>({
    queryKey: ['/api/strong', strongNumber],
    staleTime: 1000 * 60 * 60 * 24, // 24 hours - cache aggressively
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days garbage collection
  });

  const apiError = error as ApiError;
  const requiresSubscription = apiError?.data?.requiresSubscription;

  const isHebrew = strongData?.number?.startsWith('H');

  if (isLoading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="w-[95vw] max-w-3xl h-[85vh] max-h-[85vh] flex flex-col p-0 gap-0 bg-background" data-testid="modal-strong">
          <DialogTitle className="sr-only">Carregando Strong</DialogTitle>
          <div className="flex-1 p-6 space-y-6">
            <Skeleton className="h-20 w-48 mx-auto" />
            <Skeleton className="h-8 w-40 mx-auto" />
            <Skeleton className="h-6 w-32 mx-auto" />
            <Skeleton className="h-40 w-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error && requiresSubscription) {
    const errorMessage = apiError?.data?.error || "Limite de consultas atingido";
    
    const handleSubscribe = () => {
      onClose();
      if (onNavigateToSubscriptions) {
        onNavigateToSubscriptions();
      }
    };
    
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="w-[95vw] max-w-md bg-background" data-testid="modal-strong-upgrade">
          <DialogTitle className="sr-only">Upgrade Strong</DialogTitle>
          <div className="flex flex-col items-center p-4 text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-foreground">Limite Diário Atingido</h3>
              <p className="text-sm text-muted-foreground mt-1">{errorMessage}</p>
            </div>
            
            <div className="w-full space-y-3 mt-2">
              <Card className="p-4 border-2 border-primary bg-primary/5">
                <div className="flex items-center gap-3">
                  <Infinity className="w-6 h-6 text-primary flex-shrink-0" />
                  <div className="text-left flex-1">
                    <div className="font-semibold text-foreground">Strong Vitalício</div>
                    <div className="text-xs text-muted-foreground">Acesso ilimitado para sempre</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary">R$ 49,90</div>
                    <div className="text-xs text-muted-foreground">único</div>
                  </div>
                </div>
                <Button 
                  className="w-full mt-3" 
                  onClick={handleSubscribe}
                  data-testid="button-strong-lifetime"
                >
                  Assinar Vitalício
                </Button>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <Crown className="w-6 h-6 text-amber-500 flex-shrink-0" />
                  <div className="text-left flex-1">
                    <div className="font-semibold text-foreground">Plano Gold ou Premium</div>
                    <div className="text-xs text-muted-foreground">Inclui Strong + IA + Cursos</div>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full mt-3"
                  onClick={handleSubscribe}
                  data-testid="button-view-plans"
                >
                  Ver Planos
                </Button>
              </Card>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onClose} 
              className="text-muted-foreground"
              data-testid="button-close-paywall"
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !strongData) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="w-[95vw] max-w-2xl bg-background" data-testid="modal-strong">
          <DialogTitle className="sr-only">Strong Not Found</DialogTitle>
          <div className="flex flex-col items-center justify-center p-8 text-center gap-4">
            <AlertCircle className="w-12 h-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Entrada não encontrada</h3>
            <p className="text-sm text-muted-foreground">Não foi possível encontrar {strongNumber}</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-3xl h-[88vh] max-h-[88vh] flex flex-col p-0 gap-0 bg-background border-primary/20" data-testid="modal-strong">
        <DialogTitle className="sr-only">Strong Dictionary - {strongData.number}</DialogTitle>
        <DialogClose asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-2 top-2 z-50 h-8 w-8"
            data-testid="button-close-strong"
          >
            <X className="h-5 w-5" />
          </Button>
        </DialogClose>
        
        <ScrollArea className="flex-1 w-full">
          <div className="p-4 sm:p-6 space-y-4">
            
            {/* Header: Original Word - LARGE AND PROMINENT */}
            <div className="text-center pb-2 border-b-2 border-primary/30">
              <div className="mb-3">
                <h1 
                  className="text-6xl sm:text-7xl font-serif font-bold text-primary mb-2" 
                  style={{ direction: isHebrew ? 'rtl' : 'ltr' }}
                  data-testid="text-strong-word"
                >
                  {strongData.word}
                </h1>
              </div>
              
              {/* Transliteration - Medium size */}
              <p className="text-xl text-muted-foreground font-semibold mb-1">
                {strongData.transliteration}
              </p>
              
              {/* Pronunciation */}
              {strongData.pronunciation && (
                <p className="text-sm text-muted-foreground italic">
                  Pronúncia: {strongData.pronunciation}
                </p>
              )}
            </div>

            {/* STRONG'S NUMBER - Orange/Primary highlight */}
            <div className="bg-primary/10 border-l-4 border-primary px-4 py-3 my-3">
              <p className="text-sm font-semibold text-muted-foreground">STRONG'S NUMBER</p>
              <p className="text-2xl font-mono font-bold text-primary" data-testid="text-strong-number">
                {strongData.number}
              </p>
            </div>

            {/* Dictionary Definition Section */}
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-foreground">Dictionary Definition</h2>
              
              {/* Main Definition (Portuguese if available, else English) */}
              {strongData.portugueseDefinition && (
                <div className="bg-card border border-border rounded p-4 space-y-2">
                  <p className="text-sm font-semibold text-muted-foreground">Definição Portuguesa</p>
                  <p className="text-base leading-relaxed whitespace-pre-wrap text-foreground">
                    {strongData.word} {strongData.transliteration && `(${strongData.transliteration})`} — {strongData.portugueseDefinition}
                  </p>
                </div>
              )}

              {/* Extended Theological Definition - Main content */}
              {strongData.extendedDefinition && (
                <div className="bg-primary/5 border border-primary/20 rounded p-4 space-y-3">
                  <p className="text-sm font-semibold text-foreground">Explicação Teológica Completa</p>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground space-y-2">
                    {strongData.extendedDefinition}
                  </div>
                </div>
              )}

              {/* Strong's Definition */}
              {strongData.strongsDefinition && (
                <div className="bg-card border border-border rounded p-4">
                  <p className="text-sm font-semibold text-muted-foreground mb-2">Definição do Dicionário Strong</p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                    {strongData.strongsDefinition}
                  </p>
                </div>
              )}

              {/* KJV Definition */}
              {strongData.kjvDefinition && strongData.kjvDefinition !== strongData.strongsDefinition && (
                <div className="bg-card border border-border rounded p-4">
                  <p className="text-sm font-semibold text-muted-foreground mb-2">King James Definition</p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                    {strongData.kjvDefinition}
                  </p>
                </div>
              )}

              {/* Derivation / Etymology */}
              {strongData.derivation && (
                <div className="bg-card border border-border rounded p-4">
                  <p className="text-sm font-semibold text-muted-foreground mb-2">Derivação</p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                    {strongData.derivation}
                  </p>
                </div>
              )}
            </div>

            {/* Search/Action Section */}
            <div className="bg-muted/50 border border-border rounded p-4 mt-4">
              <p className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <Search className="w-4 h-4" />
                SEARCH FOR
              </p>
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full text-sm"
                  onClick={() => {
                    // Placeholder for search functionality
                    console.log('Search for:', strongData.number);
                  }}
                  data-testid="button-search-strong"
                >
                  Pesquisar por {strongData.number}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full text-sm"
                  onClick={() => {
                    // Placeholder for search original word
                    console.log('Search for word:', strongData.word);
                  }}
                  data-testid="button-search-word"
                >
                  Procurar "{strongData.transliteration}"
                </Button>
              </div>
            </div>

            {/* Info Footer */}
            <div className="text-xs text-muted-foreground text-center italic pt-2 border-t border-border">
              Esta palavra original ajuda a compreender o significado profundo do texto bíblico.
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
