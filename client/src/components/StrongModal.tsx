import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { useState, useEffect, useCallback } from "react";
import { AlertCircle, X, Search, Crown, BookOpen, Infinity } from "lucide-react";
import { apiRequest, ApiError } from "@/lib/queryClient";
import { 
  getCachedSummary, 
  getCachedDetail, 
  cacheSummary, 
  cacheDetail,
  createPerfTracker,
  logPerfMetrics,
  type StrongPerfMetrics 
} from "@/lib/strongCache";

interface StrongModalProps {
  strongNumber: string;
  onClose: () => void;
  onNavigateToSubscriptions?: () => void;
}

interface StrongSummary {
  number: string;
  word: string;
  transliteration: string;
  language: string;
  shortDefinition: string;
}

interface StrongDetail {
  number: string;
  word: string;
  transliteration: string;
  pronunciation: string;
  definition: string;
  portugueseDefinition: string | null;
  strongsDefinition: string | null;
  kjvDefinition: string | null;
  derivation: string | null;
  extendedDefinition: string | null;
  language: string;
}

type LoadingState = 'loading' | 'summary' | 'detail' | 'error' | 'subscription';

export function StrongModal({ strongNumber, onClose, onNavigateToSubscriptions }: StrongModalProps) {
  const [loadingState, setLoadingState] = useState<LoadingState>('loading');
  const [summary, setSummary] = useState<StrongSummary | null>(null);
  const [detail, setDetail] = useState<StrongDetail | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [perf, setPerf] = useState<StrongPerfMetrics | null>(null);

  const loadStrongData = useCallback(async () => {
    const metrics = createPerfTracker();
    setPerf(metrics);
    
    try {
      // STEP 1: Check IndexedDB cache first (instant)
      const cachedDetail = await getCachedDetail(strongNumber);
      if (cachedDetail) {
        metrics.cacheHit = true;
        metrics.t1_modalOpen = performance.now();
        setDetail(cachedDetail as StrongDetail);
        setSummary({
          number: cachedDetail.number,
          word: cachedDetail.word,
          transliteration: cachedDetail.transliteration,
          language: cachedDetail.language,
          shortDefinition: cachedDetail.portugueseDefinition?.substring(0, 200) || cachedDetail.definition?.substring(0, 200) || '',
        });
        setLoadingState('detail');
        metrics.t5_renderComplete = performance.now();
        logPerfMetrics(metrics);
        return;
      }

      // Check summary cache
      const cachedSummary = await getCachedSummary(strongNumber);
      if (cachedSummary) {
        metrics.cacheHit = true;
        metrics.t1_modalOpen = performance.now();
        setSummary(cachedSummary as StrongSummary);
        setLoadingState('summary');
      }

      // STEP 2: Fetch summary from server (fast, < 2KB)
      metrics.t2_requestStart = performance.now();
      
      try {
        const summaryRes = await apiRequest('GET', `/api/strong/summary/${encodeURIComponent(strongNumber)}`);
        metrics.t3_firstByte = performance.now();
        const summaryData = await summaryRes.json() as StrongSummary;
        metrics.t4_jsonParse = performance.now();
        
        setSummary(summaryData);
        setLoadingState('summary');
        metrics.t1_modalOpen = performance.now();
        
        // Cache summary
        cacheSummary(summaryData);
        
        // STEP 3: Fetch detail in background
        try {
          const detailRes = await apiRequest('GET', `/api/strong/detail/${encodeURIComponent(strongNumber)}`);
          const detailData = await detailRes.json() as StrongDetail;
          
          setDetail(detailData);
          setLoadingState('detail');
          
          // Cache detail
          cacheDetail(detailData);
          
          metrics.t5_renderComplete = performance.now();
          logPerfMetrics(metrics);
        } catch (detailError) {
          // Detail fetch failed, but we have summary - that's OK
          console.warn('[Strong] Detail fetch failed, showing summary only');
          metrics.t5_renderComplete = performance.now();
          logPerfMetrics(metrics);
        }
      } catch (fetchError: any) {
        // Check if it's a subscription error
        if (fetchError instanceof ApiError && fetchError.data?.requiresSubscription) {
          setErrorMessage(fetchError.data.error || 'Limite de consultas atingido');
          setLoadingState('subscription');
          return;
        }
        
        // If we had cached summary, show it
        if (cachedSummary) {
          setLoadingState('summary');
          metrics.t5_renderComplete = performance.now();
          logPerfMetrics(metrics);
          return;
        }
        
        throw fetchError;
      }
    } catch (error: any) {
      console.error('[Strong] Load error:', error);
      setErrorMessage(error.message || 'Erro ao carregar entrada');
      setLoadingState('error');
    }
  }, [strongNumber]);

  useEffect(() => {
    loadStrongData();
  }, [loadStrongData]);

  const handleSubscribe = () => {
    onClose();
    if (onNavigateToSubscriptions) {
      onNavigateToSubscriptions();
    }
  };

  const displayData = detail || summary;
  const isHebrew = displayData?.number?.startsWith('H');

  // LOADING STATE - Shows skeleton immediately
  if (loadingState === 'loading') {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="w-[95vw] max-w-3xl h-[85vh] max-h-[85vh] flex flex-col p-0 gap-0 bg-background" data-testid="modal-strong">
          <DialogTitle className="sr-only">Carregando Strong</DialogTitle>
          <DialogClose asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-2 top-2 z-50 h-8 w-8"
            >
              <X className="h-5 w-5" />
            </Button>
          </DialogClose>
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

  // SUBSCRIPTION REQUIRED STATE
  if (loadingState === 'subscription') {
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
                    <div className="text-lg font-bold text-primary">R$ 59,90</div>
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

  // ERROR STATE
  if (loadingState === 'error' || !displayData) {
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

  // CONTENT STATE - Shows summary immediately, then detail
  const hasFullDetail = loadingState === 'detail' && detail;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-3xl h-[88vh] max-h-[88vh] flex flex-col p-0 gap-0 bg-background border-primary/20" data-testid="modal-strong">
        <DialogTitle className="sr-only">Strong Dictionary - {displayData.number}</DialogTitle>
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
                  {displayData.word}
                </h1>
              </div>
              
              {/* Transliteration - Medium size */}
              <p className="text-xl text-muted-foreground font-semibold mb-1">
                {displayData.transliteration}
              </p>
              
              {/* Pronunciation - only in detail */}
              {hasFullDetail && detail.pronunciation && (
                <p className="text-sm text-muted-foreground italic">
                  Pronúncia: {detail.pronunciation}
                </p>
              )}
            </div>

            {/* STRONG'S NUMBER - Orange/Primary highlight */}
            <div className="bg-primary/10 border-l-4 border-primary px-4 py-3 my-3">
              <p className="text-sm font-semibold text-muted-foreground">STRONG'S NUMBER</p>
              <p className="text-2xl font-mono font-bold text-primary" data-testid="text-strong-number">
                {displayData.number}
              </p>
            </div>

            {/* Quick Definition (from summary) */}
            {!hasFullDetail && summary?.shortDefinition && (
              <div className="bg-card border border-border rounded p-4 space-y-2">
                <p className="text-sm font-semibold text-muted-foreground">Definição Rápida</p>
                <p className="text-base leading-relaxed text-foreground">
                  {summary.shortDefinition}
                </p>
                <div className="pt-2">
                  <Skeleton className="h-24 w-full" />
                  <p className="text-xs text-muted-foreground text-center mt-2">Carregando detalhes completos...</p>
                </div>
              </div>
            )}

            {/* Full Definition Section (from detail) */}
            {hasFullDetail && (
              <div className="space-y-3">
                <h2 className="text-lg font-bold text-foreground">Dictionary Definition</h2>
                
                {/* Main Definition (Portuguese if available, else English) */}
                {detail.portugueseDefinition && (
                  <div className="bg-card border border-border rounded p-4 space-y-2">
                    <p className="text-sm font-semibold text-muted-foreground">Definição Portuguesa</p>
                    <p className="text-base leading-relaxed whitespace-pre-wrap text-foreground">
                      {detail.word} {detail.transliteration && `(${detail.transliteration})`} — {detail.portugueseDefinition}
                    </p>
                  </div>
                )}

                {/* Extended Theological Definition - Main content */}
                {detail.extendedDefinition && (
                  <div className="bg-primary/5 border border-primary/20 rounded p-4 space-y-3">
                    <p className="text-sm font-semibold text-foreground">Explicação Teológica Completa</p>
                    <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground space-y-2">
                      {detail.extendedDefinition}
                    </div>
                  </div>
                )}

                {/* Strong's Definition */}
                {detail.strongsDefinition && (
                  <div className="bg-card border border-border rounded p-4">
                    <p className="text-sm font-semibold text-muted-foreground mb-2">Definição do Dicionário Strong</p>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                      {detail.strongsDefinition}
                    </p>
                  </div>
                )}

                {/* KJV Definition */}
                {detail.kjvDefinition && detail.kjvDefinition !== detail.strongsDefinition && (
                  <div className="bg-card border border-border rounded p-4">
                    <p className="text-sm font-semibold text-muted-foreground mb-2">King James Definition</p>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                      {detail.kjvDefinition}
                    </p>
                  </div>
                )}

                {/* Derivation / Etymology */}
                {detail.derivation && (
                  <div className="bg-card border border-border rounded p-4">
                    <p className="text-sm font-semibold text-muted-foreground mb-2">Derivação</p>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                      {detail.derivation}
                    </p>
                  </div>
                )}
              </div>
            )}

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
                  onClick={() => console.log('Search for:', displayData.number)}
                  data-testid="button-search-strong"
                >
                  Pesquisar por {displayData.number}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full text-sm"
                  onClick={() => console.log('Search for word:', displayData.word)}
                  data-testid="button-search-word"
                >
                  Procurar "{displayData.transliteration}"
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
