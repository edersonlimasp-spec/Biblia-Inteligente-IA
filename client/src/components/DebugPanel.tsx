import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefreshCw, Trash2, Copy, Check } from "lucide-react";

interface SubscriptionStatus {
  hasGold?: boolean;
  hasPremium?: boolean;
  hasLifetime?: boolean;
  trialActive?: boolean;
  userId?: string;
}

interface BuildInfo {
  buildId: string;
  buildEnv: string;
  timestamp: string;
  nodeEnv: string;
  replDeployment: string;
  replDevDomain: string;
  replDomains: string;
  databaseConnected: boolean;
}

interface CacheInfo {
  swRegistered: boolean;
  swVersion: string | null;
  cacheNames: string[];
  swState: string;
}

export function DebugPanel() {
  const { user, isAdmin } = useAuth();
  const { language, t } = useLanguage();
  const [cacheInfo, setCacheInfo] = useState<CacheInfo>({
    swRegistered: false,
    swVersion: null,
    cacheNames: [],
    swState: 'unknown'
  });
  const [copied, setCopied] = useState(false);
  const [clearing, setClearing] = useState(false);

  const { data: buildInfo, refetch: refetchBuild } = useQuery<BuildInfo>({
    queryKey: ['/api/debug/build-info'],
    staleTime: 0,
  });

  const { data: subscriptionData, refetch: refetchSub } = useQuery<SubscriptionStatus>({
    queryKey: ['/api/user/subscription-status'],
    enabled: !!user,
    staleTime: 0,
  });

  const getUserPlan = (): string => {
    if (!user) return 'not_logged_in';
    if (subscriptionData?.hasPremium) return 'premium';
    if (subscriptionData?.hasGold) return 'gold';
    return 'free';
  };

  useEffect(() => {
    async function getSWInfo() {
      if (!('serviceWorker' in navigator)) {
        setCacheInfo({
          swRegistered: false,
          swVersion: null,
          cacheNames: [],
          swState: 'not_supported'
        });
        return;
      }

      try {
        const registration = await navigator.serviceWorker.getRegistration();
        const cacheNames = await caches.keys();
        
        setCacheInfo({
          swRegistered: !!registration,
          swVersion: cacheNames.find(n => n.startsWith('biblia-ia-v')) || null,
          cacheNames,
          swState: registration?.active?.state || 'no_active_worker'
        });
      } catch (e) {
        setCacheInfo({
          swRegistered: false,
          swVersion: null,
          cacheNames: [],
          swState: 'error: ' + String(e)
        });
      }
    }
    getSWInfo();
  }, []);

  const clearAllCaches = async () => {
    setClearing(true);
    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(r => r.unregister()));
      
      localStorage.clear();
      sessionStorage.clear();
      
      alert('Cache limpo! O app será recarregado.');
      window.location.reload();
    } catch (e) {
      alert('Erro ao limpar cache: ' + String(e));
    } finally {
      setClearing(false);
    }
  };

  const copyDebugInfo = () => {
    const debugData = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      environment: {
        origin: window.location.origin,
        hostname: window.location.hostname,
        pathname: window.location.pathname,
        mode: import.meta.env.MODE,
        dev: import.meta.env.DEV,
        prod: import.meta.env.PROD,
      },
      buildInfo,
      user: user ? {
        id: user.id,
        email: user.email,
        role: user.role,
      } : null,
      subscription: subscriptionData,
      calculatedPlan: getUserPlan(),
      language: {
        current: language,
        storageKey: localStorage.getItem('biblia_inteligente_language'),
      },
      serviceWorker: cacheInfo,
    };
    
    navigator.clipboard.writeText(JSON.stringify(debugData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isProduction = buildInfo?.nodeEnv === 'production' || 
                       buildInfo?.replDeployment === '1' ||
                       !import.meta.env.DEV;

  return (
    <div className="fixed inset-0 z-[9999] bg-background/95 backdrop-blur-sm overflow-auto p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-2xl font-bold">🔍 Debug Panel</h1>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => { refetchBuild(); refetchSub(); }}>
              <RefreshCw className="w-4 h-4 mr-1" /> Refresh
            </Button>
            <Button size="sm" variant="outline" onClick={copyDebugInfo}>
              {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
              {copied ? 'Copiado!' : 'Copiar JSON'}
            </Button>
            <Button size="sm" variant="destructive" onClick={clearAllCaches} disabled={clearing}>
              <Trash2 className="w-4 h-4 mr-1" /> Limpar Cache
            </Button>
            <Button size="sm" onClick={() => window.location.href = window.location.pathname}>
              Fechar Debug
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                🏗️ Build Info
                <Badge variant={isProduction ? "destructive" : "secondary"}>
                  {isProduction ? 'PRODUCTION' : 'PREVIEW'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm font-mono space-y-1">
              <div><span className="text-muted-foreground">buildId:</span> {buildInfo?.buildId || 'N/A'}</div>
              <div><span className="text-muted-foreground">buildEnv:</span> {buildInfo?.buildEnv || 'N/A'}</div>
              <div><span className="text-muted-foreground">timestamp:</span> {buildInfo?.timestamp || 'N/A'}</div>
              <div><span className="text-muted-foreground">nodeEnv:</span> {buildInfo?.nodeEnv || 'N/A'}</div>
              <div><span className="text-muted-foreground">replDeployment:</span> {buildInfo?.replDeployment || 'N/A'}</div>
              <div><span className="text-muted-foreground">dbConnected:</span> {String(buildInfo?.databaseConnected)}</div>
              <div className="pt-2 border-t">
                <span className="text-muted-foreground">Client MODE:</span> {import.meta.env.MODE}
              </div>
              <div><span className="text-muted-foreground">Client DEV:</span> {String(import.meta.env.DEV)}</div>
              <div><span className="text-muted-foreground">Client PROD:</span> {String(import.meta.env.PROD)}</div>
              <div><span className="text-muted-foreground">Origin:</span> {window.location.origin}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">👤 User & Subscription</CardTitle>
            </CardHeader>
            <CardContent className="text-sm font-mono space-y-1">
              <div><span className="text-muted-foreground">loggedIn:</span> {user ? 'YES' : 'NO'}</div>
              {user && (
                <>
                  <div><span className="text-muted-foreground">userId:</span> {user.id}</div>
                  <div><span className="text-muted-foreground">email:</span> {user.email}</div>
                  <div><span className="text-muted-foreground">role:</span> {user.role}</div>
                  <div><span className="text-muted-foreground">isAdmin:</span> {String(isAdmin)}</div>
                </>
              )}
              <div className="pt-2 border-t">
                <span className="text-muted-foreground">API Response:</span>
              </div>
              <div><span className="text-muted-foreground">hasGold:</span> <Badge variant={subscriptionData?.hasGold ? "default" : "outline"}>{String(subscriptionData?.hasGold ?? 'N/A')}</Badge></div>
              <div><span className="text-muted-foreground">hasPremium:</span> <Badge variant={subscriptionData?.hasPremium ? "default" : "outline"}>{String(subscriptionData?.hasPremium ?? 'N/A')}</Badge></div>
              <div><span className="text-muted-foreground">hasLifetime:</span> {String(subscriptionData?.hasLifetime ?? 'N/A')}</div>
              <div><span className="text-muted-foreground">trialActive:</span> {String(subscriptionData?.trialActive ?? 'N/A')}</div>
              <div className="pt-2 border-t">
                <span className="text-muted-foreground">Calculated Plan:</span>{' '}
                <Badge variant={getUserPlan() === 'premium' ? 'default' : getUserPlan() === 'gold' ? 'secondary' : 'outline'}>
                  {getUserPlan().toUpperCase()}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">🌐 Language / i18n</CardTitle>
            </CardHeader>
            <CardContent className="text-sm font-mono space-y-1">
              <div><span className="text-muted-foreground">current:</span> <Badge>{language}</Badge></div>
              <div><span className="text-muted-foreground">localStorage:</span> {localStorage.getItem('biblia_inteligente_language') || 'not set'}</div>
              <div><span className="text-muted-foreground">navigator.language:</span> {navigator.language}</div>
              <div className="pt-2 border-t">
                <span className="text-muted-foreground">Sample translations:</span>
              </div>
              <div className="text-xs">
                <div>dashboard.title: "{t('dashboard.title')}"</div>
                <div>courses.beginner: "{t('courses.beginner')}"</div>
                <div>subscription.premium: "{t('subscription.premium')}"</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">⚙️ Service Worker & Cache</CardTitle>
            </CardHeader>
            <CardContent className="text-sm font-mono space-y-1">
              <div><span className="text-muted-foreground">swRegistered:</span> {String(cacheInfo.swRegistered)}</div>
              <div><span className="text-muted-foreground">swState:</span> {cacheInfo.swState}</div>
              <div><span className="text-muted-foreground">swVersion:</span> {cacheInfo.swVersion || 'N/A'}</div>
              <div className="pt-2 border-t">
                <span className="text-muted-foreground">Cache Names ({cacheInfo.cacheNames.length}):</span>
              </div>
              <ScrollArea className="h-20">
                {cacheInfo.cacheNames.length === 0 ? (
                  <div className="text-xs text-muted-foreground">No caches found</div>
                ) : (
                  cacheInfo.cacheNames.map((name, i) => (
                    <div key={i} className="text-xs">{name}</div>
                  ))
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">📋 Raw API Response (subscription-status)</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">
              {JSON.stringify(subscriptionData, null, 2) || 'No data (user not logged in?)'}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">🧪 Access Control Test</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-green-500/10 rounded">
                <div className="font-bold">FREE</div>
                <div className="text-xs">3 aulas iniciais Iniciante</div>
              </div>
              <div className="p-2 bg-amber-500/10 rounded">
                <div className="font-bold">GOLD</div>
                <div className="text-xs">Todo Iniciante + 7 Intermediário</div>
              </div>
              <div className="p-2 bg-purple-500/10 rounded">
                <div className="font-bold">PREMIUM</div>
                <div className="text-xs">Acesso total</div>
              </div>
            </div>
            <div className="mt-2 text-center">
              <Badge variant="outline">Seu plano calculado: {getUserPlan().toUpperCase()}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function useDebugMode() {
  const [isDebug, setIsDebug] = useState(false);
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setIsDebug(params.get('debug') === '1');
  }, []);
  
  return isDebug;
}
