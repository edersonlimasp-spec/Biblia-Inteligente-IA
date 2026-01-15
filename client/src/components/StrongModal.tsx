import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, X, Search, Crown, BookOpen, Infinity, LogIn, Info, ChevronDown, Sparkles, MapPin, Database, History, BookMarked, ScrollText, Layers, Globe, Share2, Copy, Check } from "lucide-react";
import { ApiError } from "@/lib/queryClient";
import { AuthModal } from "./AuthModal";
import { getDeviceId } from "@/hooks/use-device-id";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage, type AppLanguage } from "@/contexts/LanguageContext";
import { getCachedStrongEntry, cacheStrongEntry, getCachedOccurrences, cacheOccurrences } from "@/lib/strong-cache";
import { useToast } from "@/hooks/use-toast";

// Helper to get auth token
function getAuthToken(): string | null {
  return localStorage.getItem('authToken');
}

// Fetch Strong entry with proper auth headers
async function fetchStrongEntry(strongNumber: string, deviceId: string): Promise<any> {
  const token = getAuthToken();
  const headers: HeadersInit = {};
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Always include deviceId for guests - backend checks both query and header
  if (deviceId) {
    headers['x-device-id'] = deviceId;
  }
  
  const res = await fetch(`/api/strong/${encodeURIComponent(strongNumber)}`, {
    credentials: 'include',
    headers,
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const error = new Error(errorData.error || 'Request failed') as ApiError;
    error.status = res.status;
    error.data = errorData;
    throw error;
  }
  
  return res.json();
}

interface StrongModalProps {
  strongNumber: string;
  onClose: () => void;
  onNavigateToSubscriptions?: () => void;
  onSearch?: (query: string, type: 'strong' | 'word') => void;
  onNavigateToVerse?: (book: string, chapter: number, verse: number) => void;
  onAIAnalysis?: (strongNumber: string, word: string, definition: string) => void;
}

interface OccurrenceVerse {
  book: string;
  chapter: number;
  verse: number;
  words: string[];
}

interface OccurrencesData {
  strongNumber: string;
  totalOccurrences: number;
  verses: OccurrenceVerse[];
}

// Book name mappings for display
const BOOK_NAMES: Record<string, string> = {
  gen: 'Gênesis', exo: 'Êxodo', lev: 'Levítico', num: 'Números', deu: 'Deuteronômio',
  jos: 'Josué', jdg: 'Juízes', rut: 'Rute', '1sa': '1 Samuel', '2sa': '2 Samuel',
  '1ki': '1 Reis', '2ki': '2 Reis', '1ch': '1 Crônicas', '2ch': '2 Crônicas',
  ezr: 'Esdras', neh: 'Neemias', est: 'Ester', job: 'Jó', psa: 'Salmos',
  pro: 'Provérbios', ecc: 'Eclesiastes', sng: 'Cânticos', isa: 'Isaías', jer: 'Jeremias',
  lam: 'Lamentações', ezk: 'Ezequiel', dan: 'Daniel', hos: 'Oséias', joe: 'Joel',
  amo: 'Amós', oba: 'Obadias', jon: 'Jonas', mic: 'Miquéias', nam: 'Naum',
  hab: 'Habacuque', zep: 'Sofonias', hag: 'Ageu', zec: 'Zacarias', mal: 'Malaquias',
  mat: 'Mateus', mrk: 'Marcos', luk: 'Lucas', jhn: 'João', act: 'Atos',
  rom: 'Romanos', '1co': '1 Coríntios', '2co': '2 Coríntios', gal: 'Gálatas',
  eph: 'Efésios', php: 'Filipenses', col: 'Colossenses', '1th': '1 Tessalonicenses',
  '2th': '2 Tessalonicenses', '1ti': '1 Timóteo', '2ti': '2 Timóteo', tit: 'Tito',
  phm: 'Filemom', heb: 'Hebreus', jas: 'Tiago', '1pe': '1 Pedro', '2pe': '2 Pedro',
  '1jn': '1 João', '2jn': '2 João', '3jn': '3 João', jud: 'Judas', rev: 'Apocalipse',
};

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
  morphologicalInfo?: string | null;
  synonymsRelated?: string | null;
  verseReferences?: string | null;
  language: string;
  aiGenerated?: boolean;
  etymology?: string | null;
  historicalContext?: string | null;
  theologicalSignificance?: string | null;
  semanticRange?: string | null;
  culturalBackground?: string | null;
}

const LANGUAGE_LABELS: Record<AppLanguage, { definition: string; fallback: string }> = {
  pt: { definition: "Definição em Português", fallback: "Definição disponível apenas em inglês" },
  en: { definition: "English Definition", fallback: "Definition available in English only" },
  es: { definition: "Definición en Español", fallback: "Definición disponible solo en inglés" },
};

export function StrongModal({ strongNumber, onClose, onNavigateToSubscriptions, onSearch, onNavigateToVerse, onAIAnalysis }: StrongModalProps) {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const { toast } = useToast();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showOccurrences, setShowOccurrences] = useState(false);
  const [isCached, setIsCached] = useState(false);
  const [justCopied, setJustCopied] = useState(false);
  const deviceId = getDeviceId();
  
  // Build share text for Strong entry
  const buildStrongShareText = (data: StrongEntry): string => {
    const { text: definition } = getDefinition(data);
    const languageLabel = data.language === 'hebrew' 
      ? (language === "pt" ? "Hebraico" : language === "es" ? "Hebreo" : "Hebrew")
      : (language === "pt" ? "Grego" : language === "es" ? "Griego" : "Greek");
    
    let shareText = `${data.word} (${data.transliteration})\n`;
    shareText += `Strong ${data.number} - ${languageLabel}\n\n`;
    
    if (data.pronunciation) {
      shareText += `${language === "pt" ? "Pronúncia" : language === "es" ? "Pronunciación" : "Pronunciation"}: ${data.pronunciation}\n\n`;
    }
    
    shareText += `${language === "pt" ? "Definição" : language === "es" ? "Definición" : "Definition"}:\n${definition}`;
    
    if (data.extendedDefinition) {
      const shortened = data.extendedDefinition.length > 300 
        ? data.extendedDefinition.substring(0, 300) + "..." 
        : data.extendedDefinition;
      shareText += `\n\n${language === "pt" ? "Explicação Teológica" : language === "es" ? "Explicación Teológica" : "Theological Explanation"}:\n${shortened}`;
    }
    
    shareText += `\n\n---\nEnviado por Bíblia Inteligente IA\nConheça a BI: https://bibliainteligente.replit.app`;
    
    return shareText;
  };
  
  // Handle share Strong entry
  const handleShareStrong = async (data: StrongEntry) => {
    const shareText = buildStrongShareText(data);
    const title = `Strong ${data.number} - ${data.word}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: shareText,
        });
        return;
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
      }
    }
    
    // Fallback: Copy to clipboard
    handleCopyStrong(data);
  };
  
  // Handle copy Strong entry
  const handleCopyStrong = async (data: StrongEntry) => {
    const shareText = buildStrongShareText(data);
    
    try {
      await navigator.clipboard.writeText(shareText);
      setJustCopied(true);
      toast({
        title: language === "pt" ? "Copiado!" : language === "es" ? "¡Copiado!" : "Copied!",
        description: `Strong ${data.number} - ${data.word}`,
      });
      setTimeout(() => setJustCopied(false), 2000);
    } catch {
      toast({
        title: language === "pt" ? "Erro" : "Error",
        description: language === "pt" ? "Não foi possível copiar" : "Could not copy",
        variant: "destructive",
      });
    }
  };
  
  const getDefinition = (data: StrongEntry): { text: string; isFallback: boolean } => {
    if (language === "pt" && data.portugueseDefinition) {
      return { text: data.portugueseDefinition, isFallback: false };
    }
    if (data.definition) {
      return { text: data.definition, isFallback: language !== "en" };
    }
    if (data.kjvDefinition) {
      return { text: data.kjvDefinition, isFallback: language !== "en" };
    }
    return { text: "Definition not available", isFallback: true };
  };
  
  // Query with auth token + deviceId - network first, cache as fallback only when offline
  const { data: strongData, isLoading, error, refetch } = useQuery<StrongEntry>({
    queryKey: ['/api/strong', strongNumber, deviceId],
    queryFn: async () => {
      try {
        // Always try network first to respect auth/subscription status
        const data = await fetchStrongEntry(strongNumber, deviceId);
        
        // Cache successful response for offline use (only if no error)
        if (data && !data.error && !data.requiresSubscription && !data.requiresLogin) {
          await cacheStrongEntry(strongNumber, data);
          setIsCached(false);
        }
        
        return data;
      } catch (networkError) {
        // Only use cache if truly offline (network error, not auth error)
        const isOffline = !navigator.onLine || (networkError instanceof TypeError);
        
        if (isOffline) {
          const cached = await getCachedStrongEntry(strongNumber);
          if (cached) {
            setIsCached(true);
            return cached as StrongEntry;
          }
        }
        
        // Re-throw the error if not offline or no cache available
        throw networkError;
      }
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days
  });

  // Occurrences query - network first, cache as offline fallback
  const { data: occurrencesData, isLoading: occurrencesLoading } = useQuery<OccurrencesData>({
    queryKey: ['/api/strong', strongNumber, 'occurrences'],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/strong/${strongNumber}/occurrences`);
        if (!res.ok) {
          throw new Error(`Failed to fetch occurrences: ${res.status}`);
        }
        const data = await res.json();
        
        // Cache for offline use
        if (data && data.verses) {
          await cacheOccurrences(strongNumber, data);
        }
        
        return data;
      } catch (networkError) {
        // Only use cache if offline
        if (!navigator.onLine || (networkError instanceof TypeError)) {
          const cached = await getCachedOccurrences(strongNumber);
          if (cached) {
            return cached as OccurrencesData;
          }
        }
        throw networkError;
      }
    },
    enabled: showOccurrences,
    staleTime: 1000 * 60 * 60 * 24,
  });

  const apiError = error as ApiError;
  const requiresSubscription = apiError?.data?.requiresSubscription;
  const requiresLogin = apiError?.data?.requiresLogin;

  const isHebrew = strongData?.number?.startsWith('H');
  
  // Handle successful login - refetch the data
  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    refetch();
  };

  if (isLoading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="w-[95vw] max-w-3xl h-[85vh] max-h-[85vh] flex flex-col p-0 gap-0 bg-background" data-testid="modal-strong">
          <DialogTitle className="sr-only">Carregando Strong</DialogTitle>
          <DialogDescription className="sr-only">Carregando entrada do dicionário Strong</DialogDescription>
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

  // NOVA REGRA: Strong requer login
  if (error && requiresLogin) {
    const errorMessage = apiError?.data?.error || "Faça login para acessar o Dicionário Strong";
    
    return (
      <>
        <Dialog open={true} onOpenChange={onClose}>
          <DialogContent className="w-[95vw] max-w-md bg-background" data-testid="modal-strong-login">
            <DialogTitle className="sr-only">Login Necessário</DialogTitle>
            <DialogDescription className="sr-only">Faça login para acessar o dicionário Strong</DialogDescription>
            <div className="flex flex-col items-center p-4 text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <LogIn className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-foreground">Login Necessário</h3>
                <p className="text-sm text-muted-foreground mt-1">{errorMessage}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Crie uma conta gratuita e ganhe 2 palavras Strong para experimentar
                </p>
              </div>
              
              <div className="w-full space-y-3 mt-2">
                <Card className="p-4 border-2 border-primary bg-primary/5">
                  <div className="flex items-center gap-3">
                    <LogIn className="w-6 h-6 text-primary flex-shrink-0" />
                    <div className="text-left flex-1">
                      <div className="font-semibold text-foreground">Faça Login</div>
                      <div className="text-xs text-muted-foreground">2 palavras gratuitas para experimentar</div>
                    </div>
                  </div>
                  <Button 
                    className="w-full mt-3" 
                    onClick={() => setShowAuthModal(true)}
                    data-testid="button-login-strong"
                  >
                    Entrar / Criar Conta
                  </Button>
                </Card>
                
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <Crown className="w-6 h-6 text-amber-500 flex-shrink-0" />
                    <div className="text-left flex-1">
                      <div className="font-semibold text-foreground">Ou Assine um Plano</div>
                      <div className="text-xs text-muted-foreground">Gold: 20 palavras/dia, Premium: ilimitado</div>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full mt-3"
                    onClick={() => {
                      onClose();
                      if (onNavigateToSubscriptions) {
                        onNavigateToSubscriptions();
                      }
                    }}
                    data-testid="button-view-plans-login"
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
                data-testid="button-close-login-paywall"
              >
                Fechar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        
        <AuthModal
          open={showAuthModal}
          onOpenChange={setShowAuthModal}
          onAuthSuccess={handleAuthSuccess}
          title="Acessar Dicionário Strong"
          description="Faça login para desbloquear 2 palavras gratuitas do Dicionário Strong."
        />
      </>
    );
  }
  
  // User needs subscription
  if (error && requiresSubscription) {
    const errorMessage = apiError?.data?.error || "Limite de consultas atingido";
    const used = apiError?.data?.used || 0;
    const limit = apiError?.data?.limit || 4;
    
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
          <DialogDescription className="sr-only">Assine um plano para ter acesso ilimitado ao dicionário Strong</DialogDescription>
          <div className="flex flex-col items-center p-4 text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-foreground">Limite Atingido</h3>
              <p className="text-sm text-muted-foreground mt-1">{errorMessage}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Você usou {used}/{limit} palavras gratuitas
              </p>
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
                    <div className="text-xs text-muted-foreground">Gold: 20/dia, Premium: ilimitado</div>
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
          <DialogDescription className="sr-only">Termo não encontrado no léxico</DialogDescription>
          <div className="flex flex-col items-center justify-center p-8 text-center gap-4">
            <AlertCircle className="w-12 h-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Termo não encontrado no léxico</h3>
            <p className="text-sm text-muted-foreground">Não foi possível encontrar a entrada {strongNumber} no dicionário Strong</p>
            <Button variant="outline" onClick={onClose} data-testid="button-close-not-found">
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-3xl h-[88vh] max-h-[88vh] flex flex-col p-0 gap-0 bg-background border-2 border-primary/30 shadow-lg" data-testid="modal-strong">
        <DialogTitle className="sr-only">Strong Dictionary - {strongData.number}</DialogTitle>
        <DialogDescription className="sr-only">
          Definição completa da palavra {strongData.word} ({strongData.number}) do Dicionário Strong
        </DialogDescription>
        <DialogClose asChild>
          <Button 
            variant="outline" 
            size="icon" 
            className="absolute right-3 top-3 z-50"
            data-testid="button-close-strong"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogClose>
        
        <ScrollArea className="flex-1 w-full overflow-x-hidden">
          <div className="p-4 sm:p-6 space-y-4 overflow-x-hidden pr-6" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
            
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
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">STRONG'S NUMBER</p>
                  <p className="text-2xl font-mono font-bold text-primary" data-testid="text-strong-number">
                    {strongData.number}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {strongData.aiGenerated === true && (
                    <Badge variant="default" className="text-xs flex items-center gap-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0">
                      <Sparkles className="w-3 h-3" />
                      {language === "pt" ? "Gerado por IA" : "AI Generated"}
                    </Badge>
                  )}
                  {isCached && (
                    <Badge variant="secondary" className="text-xs flex items-center gap-1">
                      <Database className="w-3 h-3" />
                      {language === "pt" ? "Offline" : "Cached"}
                    </Badge>
                  )}
                </div>
              </div>
              
              {/* Share Actions */}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-primary/20">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleShareStrong(strongData)}
                  data-testid="button-share-strong"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  {language === "pt" ? "Compartilhar" : language === "es" ? "Compartir" : "Share"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopyStrong(strongData)}
                  data-testid="button-copy-strong"
                >
                  {justCopied ? (
                    <>
                      <Check className="h-4 w-4 mr-1 text-green-500" />
                      {language === "pt" ? "Copiado!" : "Copied!"}
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      {language === "pt" ? "Copiar" : "Copy"}
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Dictionary Definition Section */}
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-foreground">
                {language === "pt" ? "Definição do Dicionário" : language === "es" ? "Definición del Diccionario" : "Dictionary Definition"}
              </h2>
              
              {/* Main Definition based on selected language */}
              {(() => {
                const { text, isFallback } = getDefinition(strongData);
                return (
                  <div className="bg-card border border-border rounded p-4 space-y-2 overflow-hidden">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <p className="text-sm font-semibold text-muted-foreground">
                        {LANGUAGE_LABELS[language].definition}
                      </p>
                      {isFallback && (
                        <Badge variant="secondary" className="text-xs flex items-center gap-1">
                          <Info className="w-3 h-3" />
                          {LANGUAGE_LABELS[language].fallback}
                        </Badge>
                      )}
                    </div>
                    <p className="text-base leading-relaxed whitespace-pre-wrap text-foreground" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                      {strongData.word} {strongData.transliteration && `(${strongData.transliteration})`} — {text}
                    </p>
                  </div>
                );
              })()}

              {/* Extended Theological Definition - Main content */}
              {strongData.extendedDefinition && (
                <div className="bg-primary/5 border border-primary/20 rounded p-4 space-y-3 overflow-hidden">
                  <p className="text-sm font-semibold text-foreground">
                    {language === "pt" ? "Explicação Teológica Completa" : language === "es" ? "Explicación Teológica Completa" : "Complete Theological Explanation"}
                  </p>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground space-y-2" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                    {strongData.extendedDefinition}
                  </div>
                </div>
              )}

              {/* Strong's Definition */}
              {strongData.strongsDefinition && (
                <div className="bg-card border border-border rounded p-4 overflow-hidden">
                  <p className="text-sm font-semibold text-muted-foreground mb-2">
                    {language === "pt" ? "Definição do Dicionário Strong" : language === "es" ? "Definición del Diccionario Strong" : "Strong's Dictionary Definition"}
                  </p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                    {strongData.strongsDefinition}
                  </p>
                </div>
              )}

              {/* KJV Definition - only show if different from Strong's */}
              {strongData.kjvDefinition && strongData.kjvDefinition !== strongData.strongsDefinition && (
                <div className="bg-card border border-border rounded p-4 overflow-hidden">
                  <p className="text-sm font-semibold text-muted-foreground mb-2">King James Definition</p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                    {strongData.kjvDefinition}
                  </p>
                </div>
              )}

              {/* Derivation / Etymology */}
              {strongData.derivation && (
                <div className="bg-card border border-border rounded p-4 overflow-hidden">
                  <p className="text-sm font-semibold text-muted-foreground mb-2">
                    {language === "pt" ? "Derivação" : language === "es" ? "Derivación" : "Derivation"}
                  </p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                    {strongData.derivation}
                  </p>
                </div>
              )}

              {/* Morphological Information (AI-generated) */}
              {strongData.morphologicalInfo && (
                <div className="bg-card border border-border rounded p-4 overflow-hidden">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <p className="text-sm font-semibold text-muted-foreground">
                      {language === "pt" ? "Análise Morfológica" : language === "es" ? "Análisis Morfológico" : "Morphological Analysis"}
                    </p>
                    {strongData.aiGenerated && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0">
                        <Sparkles className="w-2 h-2 mr-0.5" />IA
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                    {strongData.morphologicalInfo}
                  </p>
                </div>
              )}

              {/* Synonyms and Related Terms (AI-generated) */}
              {strongData.synonymsRelated && (
                <div className="bg-card border border-border rounded p-4 overflow-hidden">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <p className="text-sm font-semibold text-muted-foreground">
                      {language === "pt" ? "Sinônimos e Termos Relacionados" : language === "es" ? "Sinónimos y Términos Relacionados" : "Synonyms & Related Terms"}
                    </p>
                    {strongData.aiGenerated && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0">
                        <Sparkles className="w-2 h-2 mr-0.5" />IA
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                    {strongData.synonymsRelated}
                  </p>
                </div>
              )}

              {/* Key Verse References (AI-generated) */}
              {strongData.verseReferences && (
                <div className="bg-card border border-border rounded p-4 overflow-hidden">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <p className="text-sm font-semibold text-muted-foreground">
                      {language === "pt" ? "Versículos Principais" : language === "es" ? "Versículos Principales" : "Key Verses"}
                    </p>
                    {strongData.aiGenerated && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0">
                        <Sparkles className="w-2 h-2 mr-0.5" />IA
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                    {strongData.verseReferences}
                  </p>
                </div>
              )}

              {/* Etymology Section (AI-generated) */}
              {strongData.etymology && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800/50 rounded p-4 overflow-hidden">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <ScrollText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                      {language === "pt" ? "Etimologia" : language === "es" ? "Etimología" : "Etymology"}
                    </p>
                    {strongData.aiGenerated && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0 border-amber-400 text-amber-700">
                        <Sparkles className="w-2 h-2 mr-0.5" />IA
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                    {strongData.etymology}
                  </p>
                </div>
              )}

              {/* Historical Context Section (AI-generated) */}
              {strongData.historicalContext && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800/50 rounded p-4 overflow-hidden">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <History className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                      {language === "pt" ? "Contexto Histórico-Cultural" : language === "es" ? "Contexto Histórico-Cultural" : "Historical-Cultural Context"}
                    </p>
                    {strongData.aiGenerated && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0 border-blue-400 text-blue-700">
                        <Sparkles className="w-2 h-2 mr-0.5" />IA
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                    {strongData.historicalContext}
                  </p>
                </div>
              )}

              {/* Theological Significance Section (AI-generated) */}
              {strongData.theologicalSignificance && (
                <div className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 border border-purple-200 dark:border-purple-800/50 rounded p-4 overflow-hidden">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <BookMarked className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <p className="text-sm font-semibold text-purple-800 dark:text-purple-300">
                      {language === "pt" ? "Significado Teológico" : language === "es" ? "Significado Teológico" : "Theological Significance"}
                    </p>
                    {strongData.aiGenerated && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0 border-purple-400 text-purple-700">
                        <Sparkles className="w-2 h-2 mr-0.5" />IA
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                    {strongData.theologicalSignificance}
                  </p>
                </div>
              )}

              {/* Semantic Range Section (AI-generated) */}
              {strongData.semanticRange && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800/50 rounded p-4 overflow-hidden">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Layers className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                      {language === "pt" ? "Amplitude Semântica" : language === "es" ? "Rango Semántico" : "Semantic Range"}
                    </p>
                    {strongData.aiGenerated && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0 border-green-400 text-green-700">
                        <Sparkles className="w-2 h-2 mr-0.5" />IA
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                    {strongData.semanticRange}
                  </p>
                </div>
              )}

              {/* Cultural Background Section (AI-generated) */}
              {strongData.culturalBackground && (
                <div className="bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30 border border-rose-200 dark:border-rose-800/50 rounded p-4 overflow-hidden">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Globe className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    <p className="text-sm font-semibold text-rose-800 dark:text-rose-300">
                      {language === "pt" ? "Contexto Cultural" : language === "es" ? "Contexto Cultural" : "Cultural Background"}
                    </p>
                    {strongData.aiGenerated && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0 border-rose-400 text-rose-700">
                        <Sparkles className="w-2 h-2 mr-0.5" />IA
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                    {strongData.culturalBackground}
                  </p>
                </div>
              )}
            </div>

            {/* AI Analysis Button */}
            {onAIAnalysis && (
              <div className="mt-4">
                <Button 
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                  onClick={() => {
                    const def = strongData.portugueseDefinition || strongData.definition || strongData.kjvDefinition || '';
                    onAIAnalysis(strongData.number, strongData.word, def);
                    onClose();
                  }}
                  data-testid="button-ai-analysis"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {language === "pt" ? "Ver Análise da IA" : language === "es" ? "Ver Análisis de IA" : "View AI Analysis"}
                </Button>
              </div>
            )}

            {/* Occurrences Section - Collapsible */}
            <Collapsible open={showOccurrences} onOpenChange={setShowOccurrences} className="mt-4">
              <CollapsibleTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full justify-between"
                  data-testid="button-toggle-occurrences"
                >
                  <span className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {language === "pt" ? "Ocorrências na Bíblia" : language === "es" ? "Ocurrencias en la Biblia" : "Occurrences in Bible"}
                    {occurrencesData && (
                      <Badge variant="secondary" className="ml-1">
                        {occurrencesData.totalOccurrences}
                      </Badge>
                    )}
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showOccurrences ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="bg-card border border-border rounded p-3 max-h-48 overflow-y-auto">
                  {occurrencesLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-5/6" />
                    </div>
                  ) : occurrencesData && occurrencesData.verses.length > 0 ? (
                    <div className="space-y-1">
                      {occurrencesData.verses.map((occ, idx) => (
                        <button
                          key={`${occ.book}-${occ.chapter}-${occ.verse}-${idx}`}
                          className="block w-full text-left text-sm py-1 px-2 rounded hover:bg-muted/50 transition-colors"
                          onClick={() => {
                            if (onNavigateToVerse) {
                              onNavigateToVerse(occ.book, occ.chapter, occ.verse);
                              onClose();
                            }
                          }}
                          data-testid={`link-occurrence-${idx}`}
                        >
                          <span className="font-medium text-primary">
                            {BOOK_NAMES[occ.book] || occ.book} {occ.chapter}:{occ.verse}
                          </span>
                        </button>
                      ))}
                      {occurrencesData.totalOccurrences > occurrencesData.verses.length && (
                        <p className="text-xs text-muted-foreground italic pt-2">
                          {language === "pt" 
                            ? `Mostrando ${occurrencesData.verses.length} de ${occurrencesData.totalOccurrences} ocorrências`
                            : `Showing ${occurrencesData.verses.length} of ${occurrencesData.totalOccurrences} occurrences`}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      {language === "pt" ? "Nenhuma ocorrência encontrada" : "No occurrences found"}
                    </p>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>

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
                    if (onSearch) {
                      onSearch(strongData.number, 'strong');
                      onClose();
                    }
                  }}
                  data-testid="button-search-strong"
                >
                  Pesquisar por {strongData.number}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full text-sm"
                  onClick={() => {
                    if (onSearch) {
                      onSearch(strongData.transliteration || strongData.word, 'word');
                      onClose();
                    }
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
