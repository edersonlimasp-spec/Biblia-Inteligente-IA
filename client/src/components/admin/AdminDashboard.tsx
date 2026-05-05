import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, CreditCard, Zap, Activity, Mail, Clock, Smartphone, UserCheck, Crown, ArrowUpRight, Target, Percent, Infinity, ShoppingCart, DollarSign, Gem, Gift, Download, AlertCircle, Tag } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, ComposedChart } from "recharts";
import adminOverviewImage from "@assets/image_1777999020618.png";
import appEngagementImage from "@assets/image_1777999005340.png";
import growthImage from "@assets/image_1777999084686.png";

interface DashboardStats {
  totalUsers: number;
  newUsersThisMonth: number;
  activeTrials: number;
  freeUsers: number;
  activeGoldSubscriptions: number;
  activePremiumSubscriptions: number;
  lifetimeStrong: number;
  estimatedMonthlyRevenue: string;
  cancelledThisMonth: number;
  totalGuests: number;
  activeGuestTrials: number;
  convertedGuests: number;
  newGuestsToday: number;
  activeGuestsToday: number;
  inactiveUsers: number;
}

interface OnlineMetrics {
  onlineUsers: number;
}

interface AIUsageStats {
  total: number;
  byMode: { essential: number; premium: number };
  byUser: Array<{ userId: string; email: string; count: number }>;
}

interface HeatmapData {
  heatmap: Array<{ hour: number; count: number }>;
}

interface AbandonedSubscription {
  userId: string;
  email: string;
  lastSeenAt: string;
}

interface ConversionMetrics {
  today: { redirects: number; conversions: number; rate: number };
  thisMonth: { redirects: number; conversions: number; rate: number };
  lastMonth: { redirects: number; conversions: number; rate: number };
  dailyTrend: Array<{ date: string; redirects: number; conversions: number }>;
}

interface PurchaseItem {
  id: string;
  userId: string;
  planType: string;
  status: string;
  amount: string;
  createdAt: string;
  startDate: string;
  endDate: string | null;
  user?: { id: string; email: string; name: string | null };
}

interface PurchaseMetrics {
  summary: {
    gold: { count: number; total: string };
    premium: { count: number; total: string };
    lifetime: { count: number; total: string };
  };
  recentPurchases: {
    gold: PurchaseItem[];
    premium: PurchaseItem[];
    lifetime: PurchaseItem[];
  };
  dailyTrend: Array<{ date: string; gold: number; premium: number; lifetime: number }>;
}

interface InstallsMetrics {
  available: boolean;
  reason?: string;
  message?: string;
  status?: number;
  packageName?: string;
  windowDays?: number;
  currentInstalls?: number;
  startInstalls?: number;
  netChange?: number;
  series?: Array<{ date: string; activeDeviceInstalls: number }>;
}

interface OfferPhase {
  duration?: string;
  priceMicros?: string;
  currency?: string;
  isFree?: boolean;
}

interface SubscriptionOffer {
  offerId: string;
  state: string;
  eligibility: string[];
  phases: OfferPhase[];
}

interface BasePlan {
  basePlanId: string;
  state: string;
  autoRenewing: boolean;
  billingPeriodDuration?: string;
  gracePeriodDuration?: string;
  regions: Array<{ region: string; priceMicros: string | null; currency: string }>;
  offers: SubscriptionOffer[];
}

interface PlayConsoleOffers {
  available: boolean;
  reason?: string;
  message?: string;
  status?: number;
  packageName?: string;
  count?: number;
  subscriptions?: Array<{
    productId: string;
    name: string;
    basePlans: BasePlan[];
  }>;
}

interface AppEngagementMetrics {
  totalAppEvents: number;
  uniqueDevices: number;
  newAccounts: number;
  activeUsersToday: number;
  eventTypes: Record<string, number>;
  dailyTrend: Array<{ date: string; appEvents: number; uniqueDevices: number }>;
}

interface UserGrowthMetrics {
  year: number;
  months: Array<{
    month: string;
    monthLabel: string;
    users: number;
    guests: number;
    usersTotal: number;
    guestsTotal: number;
  }>;
  totals: {
    usersThisYear: number;
    guestsThisYear: number;
    usersAllTime: number;
    guestsAllTime: number;
  };
}

export function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/admin/stats'],
    staleTime: 0, // Always refetch
    gcTime: 0, // Don't cache
    refetchOnMount: 'always',
  });

  const { data: online, isLoading: onlineLoading } = useQuery<OnlineMetrics>({
    queryKey: ['/api/admin/metrics/online-users'],
    refetchInterval: 10000, // Atualizar a cada 10 segundos
  });

  const { data: aiUsage, isLoading: aiLoading } = useQuery<AIUsageStats>({
    queryKey: ['/api/admin/metrics/ai-usage'],
  });

  const { data: heatmap, isLoading: heatmapLoading } = useQuery<HeatmapData>({
    queryKey: ['/api/admin/metrics/usage-heatmap'],
  });

  const { data: abandonedData, isLoading: abandonedLoading } = useQuery<{abandoned: AbandonedSubscription[]}> ({
    queryKey: ['/api/admin/metrics/abandoned-subscriptions'],
  });

  const { data: conversionMetrics, isLoading: conversionLoading } = useQuery<ConversionMetrics>({
    queryKey: ['/api/admin/metrics/conversion'],
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const { data: purchaseMetrics, isLoading: purchasesLoading } = useQuery<PurchaseMetrics>({
    queryKey: ['/api/admin/metrics/purchases'],
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const { data: appEngagement, isLoading: engagementLoading } = useQuery<AppEngagementMetrics>({
    queryKey: ['/api/admin/metrics/app-engagement'],
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const { data: userGrowth, isLoading: growthLoading } = useQuery<UserGrowthMetrics>({
    queryKey: ['/api/admin/metrics/user-growth'],
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const { data: installs, isLoading: installsLoading } = useQuery<InstallsMetrics>({
    queryKey: ['/api/admin/metrics/google-play-installs'],
    staleTime: 5 * 60 * 1000,
  });

  const { data: playOffers, isLoading: offersLoading } = useQuery<PlayConsoleOffers>({
    queryKey: ['/api/admin/play-console/offers'],
    staleTime: 5 * 60 * 1000,
  });

  const totalSubscriptions = (stats?.activeGoldSubscriptions || 0) + (stats?.activePremiumSubscriptions || 0) + (stats?.lifetimeStrong || 0);
  const activeAccessUsers = (stats?.totalUsers || 0) + (stats?.totalGuests || 0);
  const conversionRate = stats?.totalGuests ? ((stats.convertedGuests / stats.totalGuests) * 100).toFixed(1) : "0.0";
  const monthlyChurn = stats?.activeGoldSubscriptions || stats?.activePremiumSubscriptions || stats?.lifetimeStrong
    ? ((stats.inactiveUsers / Math.max(1, stats.totalUsers)) * 100).toFixed(1)
    : "0.0";

  const StatCard = ({ 
    icon: Icon, 
    label, 
    value, 
    subtext 
  }: { 
    icon: any; 
    label: string; 
    value: string | number; 
    subtext?: string 
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <Icon className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        {statsLoading && !value ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-0">
          <div className="grid gap-0 md:grid-cols-3">
            <div className="p-4">
              <p className="text-xs text-muted-foreground">Pessoas com acesso ao app</p>
              <p className="text-3xl font-bold" data-testid="text-access-users">{activeAccessUsers}</p>
              <p className="text-xs text-muted-foreground">Usuários + visitantes únicos</p>
            </div>
            <div className="p-4 border-t md:border-t-0 md:border-l">
              <p className="text-xs text-muted-foreground">Dispositivos ativos / acesso</p>
              <p className="text-3xl font-bold" data-testid="text-active-devices">{appEngagement?.uniqueDevices || stats?.totalGuests || 0}</p>
              <p className="text-xs text-muted-foreground">Baseado em eventos do app</p>
            </div>
            <div className="p-4 border-t md:border-t-0 md:border-l">
              <p className="text-xs text-muted-foreground">Assinaturas ativas</p>
              <p className="text-3xl font-bold" data-testid="text-active-subscriptions">{totalSubscriptions}</p>
              <p className="text-xs text-muted-foreground">{stats?.inactiveUsers || 0} sem uso recente</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard 
          icon={Gift} 
          label="Degustação Premium" 
          value={stats?.activeTrials || 0}
          subtext="7 dias gratuitos (não são assinaturas)"
        />
        <StatCard 
          icon={Zap} 
          label="Plano Gratuito" 
          value={stats?.freeUsers || 0}
          subtext="Sem assinatura ativa"
        />
        <StatCard 
          icon={CreditCard} 
          label="Gold + Premium" 
          value={(stats?.activeGoldSubscriptions || 0) + (stats?.activePremiumSubscriptions || 0)}
          subtext="Assinaturas ativas"
        />
        <StatCard 
          icon={Crown} 
          label="Strong's Vitalício" 
          value={stats?.lifetimeStrong || 0}
          subtext="Acesso permanente"
        />
      </div>

      <Card data-testid="card-app-engagement">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Uso real do app
          </CardTitle>
          <CardDescription>
            Métricas coletadas no app: abertura, leitura, busca Strong e entrada em assinaturas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {engagementLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <div className="space-y-4">
              <div className="grid md:grid-cols-4 gap-4">
                <div className="p-4 bg-accent/30 rounded-md">
                  <p className="text-xs text-muted-foreground">Eventos no app</p>
                  <p className="text-3xl font-bold" data-testid="text-app-events-total">{appEngagement?.totalAppEvents || 0}</p>
                </div>
                <div className="p-4 bg-accent/30 rounded-md">
                  <p className="text-xs text-muted-foreground">Dispositivos únicos</p>
                  <p className="text-3xl font-bold" data-testid="text-app-devices-unique">{appEngagement?.uniqueDevices || 0}</p>
                </div>
                <div className="p-4 bg-accent/30 rounded-md">
                  <p className="text-xs text-muted-foreground">Novas contas hoje</p>
                  <p className="text-3xl font-bold" data-testid="text-app-new-accounts">{appEngagement?.newAccounts || 0}</p>
                </div>
                <div className="p-4 bg-accent/30 rounded-md">
                  <p className="text-xs text-muted-foreground">Ativos hoje</p>
                  <p className="text-3xl font-bold" data-testid="text-app-active-users">{appEngagement?.activeUsersToday || 0}</p>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="p-3 rounded-md bg-background/40">
                  <p className="text-xs text-muted-foreground">Conversão guest → conta</p>
                  <p className="text-2xl font-bold">{conversionRate}%</p>
                </div>
                <div className="p-3 rounded-md bg-background/40">
                  <p className="text-xs text-muted-foreground">Churn estimado</p>
                  <p className="text-2xl font-bold">{monthlyChurn}%</p>
                </div>
              </div>
              {appEngagement?.dailyTrend?.length ? (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={appEngagement.dailyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="appEvents" stroke="#1A5299" fill="#1A5299" fillOpacity={0.25} name="Eventos do app" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Crescimento e retenção
          </CardTitle>
          <CardDescription>
            O que entrou, o que converteu e o que ainda precisa de atenção.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 rounded-md bg-accent/20">
              <p className="text-xs text-muted-foreground">Novos usuários no mês</p>
              <p className="text-2xl font-bold">{stats?.newUsersThisMonth || 0}</p>
              <p className="text-xs text-muted-foreground">Cadastros concluídos</p>
            </div>
            <div className="p-4 rounded-md bg-accent/20">
              <p className="text-xs text-muted-foreground">Conversões de guest</p>
              <p className="text-2xl font-bold">{stats?.convertedGuests || 0}</p>
              <p className="text-xs text-muted-foreground">Visitantes que criaram conta</p>
            </div>
            <div className="p-4 rounded-md bg-accent/20">
              <p className="text-xs text-muted-foreground">Usuários sem atividade recente</p>
              <p className="text-2xl font-bold">{stats?.inactiveUsers || 0}</p>
              <p className="text-xs text-muted-foreground">Sem login há 30 dias</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Leitura dos números
          </CardTitle>
          <CardDescription>
            Resumo simples para gestão: acesso, uso e monetização.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div>
            <img src={adminOverviewImage} alt="Visão geral do painel administrativo" className="w-full rounded-md border" />
          </div>
          <div>
            <img src={appEngagementImage} alt="Métricas de uso do app" className="w-full rounded-md border" />
          </div>
          <div>
            <img src={growthImage} alt="Crescimento mensal de usuários e visitantes" className="w-full rounded-md border" />
          </div>
        </CardContent>
      </Card>

      {/* Google Play: Instalações / Desinstalações */}
      <Card data-testid="card-google-play-installs">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Google Play — Instalações Ativas
          </CardTitle>
          <CardDescription>
            Dispositivos que têm o app instalado no momento (últimos 28 dias).
            Dados oficiais da Play Developer Reporting API.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {installsLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : !installs?.available ? (
            <div className="flex items-start gap-3 p-4 rounded-md border border-border bg-muted/40" data-testid="status-installs-unavailable">
              <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Dados ainda não disponíveis</p>
                <p className="text-xs text-muted-foreground">
                  {installs?.message || 'Não foi possível buscar instalações no Google Play.'}
                </p>
                {installs?.reason === 'permission_missing' && (
                  <p className="text-xs text-muted-foreground">
                    Reason code: <span className="font-mono">{installs.reason}</span> (HTTP {installs.status})
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-accent/30 rounded-md">
                  <p className="text-xs text-muted-foreground">Instalações ativas hoje</p>
                  <p className="text-3xl font-bold" data-testid="text-installs-current">
                    {installs.currentInstalls?.toLocaleString('pt-BR') || 0}
                  </p>
                </div>
                <div className="p-4 bg-accent/30 rounded-md">
                  <p className="text-xs text-muted-foreground">28 dias atrás</p>
                  <p className="text-3xl font-bold" data-testid="text-installs-start">
                    {installs.startInstalls?.toLocaleString('pt-BR') || 0}
                  </p>
                </div>
                <div className="p-4 bg-accent/30 rounded-md">
                  <p className="text-xs text-muted-foreground">Variação líquida</p>
                  <p
                    className={`text-3xl font-bold ${
                      (installs.netChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                    data-testid="text-installs-net-change"
                  >
                    {(installs.netChange || 0) >= 0 ? '+' : ''}
                    {installs.netChange?.toLocaleString('pt-BR') || 0}
                  </p>
                </div>
              </div>
              {installs.series && installs.series.length > 0 && (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={installs.series}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="activeDeviceInstalls"
                      stroke="#1A5299"
                      fill="#1A5299"
                      fillOpacity={0.25}
                      name="Instalações ativas"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
              <p className="text-xs text-muted-foreground">
                Pacote: <span className="font-mono">{installs.packageName}</span> · Janela: {installs.windowDays} dias
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Google Play: Ofertas / Degustações configuradas */}
      <Card data-testid="card-play-offers">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" />
            Google Play — Ofertas e Degustações Configuradas
          </CardTitle>
          <CardDescription>
            Lista das assinaturas, planos base e ofertas (degustação grátis,
            promoções) ativas no Play Console. Apenas leitura.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {offersLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : !playOffers?.available ? (
            <div className="flex items-start gap-3 p-4 rounded-md border border-border bg-muted/40" data-testid="status-offers-unavailable">
              <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Dados ainda não disponíveis</p>
                <p className="text-xs text-muted-foreground">
                  {playOffers?.message || 'Não foi possível buscar ofertas do Play Console.'}
                </p>
                {playOffers?.status && (
                  <p className="text-xs text-muted-foreground">
                    HTTP {playOffers.status} ({playOffers.reason})
                  </p>
                )}
              </div>
            </div>
          ) : !playOffers.subscriptions || playOffers.subscriptions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma assinatura cadastrada no Play Console ainda.
            </p>
          ) : (
            <div className="space-y-4">
              {playOffers.subscriptions.map((sub) => (
                <div
                  key={sub.productId}
                  className="p-4 rounded-md border border-border space-y-3"
                  data-testid={`row-subscription-${sub.productId}`}
                >
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <p className="font-semibold text-sm">{sub.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{sub.productId}</p>
                    </div>
                    <Badge variant="secondary">
                      {sub.basePlans.length} {sub.basePlans.length === 1 ? 'plano base' : 'planos base'}
                    </Badge>
                  </div>
                  {sub.basePlans.map((bp) => (
                    <div
                      key={bp.basePlanId}
                      className="pl-3 border-l-2 border-primary/40 space-y-2"
                      data-testid={`row-baseplan-${bp.basePlanId}`}
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{bp.basePlanId}</span>
                        <Badge variant={bp.state === 'ACTIVE' ? 'default' : 'outline'}>
                          {bp.state}
                        </Badge>
                        {bp.billingPeriodDuration && (
                          <Badge variant="outline">{bp.billingPeriodDuration}</Badge>
                        )}
                        {bp.regions.slice(0, 1).map((r) => (
                          <Badge key={r.region} variant="outline">
                            {r.priceMicros && r.currency
                              ? `${r.currency} ${r.priceMicros}`
                              : r.region}
                          </Badge>
                        ))}
                      </div>
                      {bp.offers.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Sem ofertas/degustação cadastradas</p>
                      ) : (
                        <div className="space-y-2">
                          {bp.offers.map((o) => (
                            <div
                              key={o.offerId}
                              className="p-2 bg-accent/20 rounded-md text-xs space-y-1"
                              data-testid={`row-offer-${o.offerId}`}
                            >
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono">{o.offerId}</span>
                                <Badge variant={o.state === 'ACTIVE' ? 'default' : 'outline'}>
                                  {o.state}
                                </Badge>
                                {o.eligibility.map((tag) => (
                                  <Badge key={tag} variant="secondary">{tag}</Badge>
                                ))}
                              </div>
                              {o.phases.map((ph, i) => (
                                <div key={i} className="text-muted-foreground">
                                  Fase {i + 1}: {ph.duration || '—'}{' '}
                                  {ph.isFree
                                    ? '· GRÁTIS (degustação)'
                                    : ph.priceMicros && ph.currency
                                      ? `· ${ph.currency} ${ph.priceMicros}`
                                      : ''}
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
              <p className="text-xs text-muted-foreground">
                Pacote: <span className="font-mono">{playOffers.packageName}</span> · {playOffers.count} produtos
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Guest Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            Estatísticas de Guests (Visitantes Anônimos)
          </CardTitle>
          <CardDescription>Usuários usando o app sem login, rastreados por deviceId</CardDescription>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="flex gap-4">
              <Skeleton className="h-12 w-32" />
              <Skeleton className="h-12 w-32" />
              <Skeleton className="h-12 w-32" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-green-600" />
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">Novos Visitantes Hoje</p>
                  </div>
                  <p className="text-3xl font-bold text-green-600">{stats?.newGuestsToday || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Primeira vez no app</p>
                </div>
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-600" />
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-400">Visitantes Ativos Hoje</p>
                  </div>
                  <p className="text-3xl font-bold text-blue-600">{stats?.activeGuestsToday || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Uso diário de anônimos</p>
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-accent/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Total de Guests</p>
                  </div>
                  <p className="text-2xl font-semibold">{stats?.totalGuests || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Dispositivos únicos</p>
                </div>
                <div className="p-4 bg-accent/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Plano Gratuito</p>
                  </div>
                  <p className="text-2xl font-semibold">{stats?.activeGuestTrials || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Visitantes ativos</p>
                </div>
                <div className="p-4 bg-accent/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Convertidos</p>
                  </div>
                  <p className="text-2xl font-semibold">{stats?.convertedGuests || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Criaram conta</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Métricas de Conversão */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Métricas de Conversão para Assinatura
          </CardTitle>
          <CardDescription>Redirecionamentos para página de assinatura e taxa de conversão</CardDescription>
        </CardHeader>
        <CardContent>
          {conversionLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-accent/30 rounded-lg border-l-4 border-primary">
                  <div className="flex items-center gap-2 mb-2">
                    <ArrowUpRight className="h-4 w-4 text-primary" />
                    <p className="text-sm font-medium">Hoje</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Redirect</p>
                      <p className="text-xl font-bold">{conversionMetrics?.today.redirects || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Conversão</p>
                      <p className="text-xl font-bold text-green-600">{conversionMetrics?.today.conversions || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Taxa</p>
                      <p className="text-xl font-bold text-primary">{conversionMetrics?.today.rate || 0}%</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-accent/30 rounded-lg border-l-4 border-blue-500">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    <p className="text-sm font-medium">Este Mês</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Redirect</p>
                      <p className="text-xl font-bold">{conversionMetrics?.thisMonth.redirects || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Conversão</p>
                      <p className="text-xl font-bold text-green-600">{conversionMetrics?.thisMonth.conversions || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Taxa</p>
                      <p className="text-xl font-bold text-blue-500">{conversionMetrics?.thisMonth.rate || 0}%</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-accent/30 rounded-lg border-l-4 border-muted-foreground">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">Mês Anterior</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Redirect</p>
                      <p className="text-xl font-bold">{conversionMetrics?.lastMonth.redirects || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Conversão</p>
                      <p className="text-xl font-bold text-green-600">{conversionMetrics?.lastMonth.conversions || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Taxa</p>
                      <p className="text-xl font-bold">{conversionMetrics?.lastMonth.rate || 0}%</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-3">Tendência dos Últimos 30 Dias</p>
                <ResponsiveContainer width="100%" height={250}>
                  <ComposedChart data={conversionMetrics?.dailyTrend || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getDate()}/${date.getMonth() + 1}`;
                      }}
                      fontSize={12}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => {
                        const date = new Date(value as string);
                        return date.toLocaleDateString('pt-BR');
                      }}
                    />
                    <Legend />
                    <Bar dataKey="redirects" fill="#3b82f6" name="Redirecionamentos" />
                    <Line type="monotone" dataKey="conversions" stroke="#22c55e" strokeWidth={2} name="Conversões" dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Uso de IA (últimos 30 dias)</CardTitle>
          <CardDescription>Perguntas feitas ao Professor de IA</CardDescription>
        </CardHeader>
        <CardContent>
          {aiLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total de Perguntas</p>
                <p className="text-2xl font-semibold">{aiUsage?.total || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Modo Essential</p>
                <p className="text-2xl font-semibold">{aiUsage?.byMode.essential || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Modo Premium</p>
                <p className="text-2xl font-semibold">{aiUsage?.byMode.premium || 0}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Heatmap de Horários */}
      <Card>
        <CardHeader>
          <CardTitle>Horários de Pico (últimos 7 dias)</CardTitle>
          <CardDescription>Padrão de utilização por hora do dia</CardDescription>
        </CardHeader>
        <CardContent>
          {heatmapLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={heatmap?.heatmap || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" label={{ value: 'Hora do dia', position: 'insideBottomRight', offset: -5 }} />
                <YAxis label={{ value: 'Eventos', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" name="Eventos" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Assinaturas Abandonadas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Assinaturas Abandonadas
          </CardTitle>
          <CardDescription>Usuários que visitaram tela de assinatura mas não completaram</CardDescription>
        </CardHeader>
        <CardContent>
          {abandonedLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : abandonedData?.abandoned && abandonedData.abandoned.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {abandonedData.abandoned.slice(0, 20).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm break-all">{item.email}</span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                    {new Date(item.lastSeenAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma assinatura abandonada registrada</p>
          )}
        </CardContent>
      </Card>

      {/* Top 10 Usuários Mais Ativos */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Usuários Mais Ativos</CardTitle>
          <CardDescription>Ranking dos usuários com maior engajamento em IA</CardDescription>
        </CardHeader>
        <CardContent>
          {aiLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : aiUsage?.byUser && aiUsage.byUser.length > 0 ? (
            <div className="space-y-3">
              {aiUsage.byUser.slice(0, 10).map((user, idx) => {
                const maxCount = aiUsage.byUser[0]?.count || 1;
                const percentage = (user.count / maxCount) * 100;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold w-6">#{idx + 1}</span>
                        <span className="text-sm text-muted-foreground truncate max-w-[200px]" title={user.email}>{user.email}</span>
                      </div>
                      <span className="text-sm font-bold text-primary">{user.count} perguntas</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-primary h-full rounded-full transition-all" 
                        style={{width: `${percentage}%`}}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma pergunta registrada</p>
          )}
        </CardContent>
      </Card>

      {/* Acompanhamento de Compras por Tipo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Acompanhamento de Compras (30 dias)
          </CardTitle>
          <CardDescription>Histórico detalhado de compras Gold, Premium e Lifetime</CardDescription>
        </CardHeader>
        <CardContent>
          {purchasesLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Resumo de Compras */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-amber-500/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="h-5 w-5 text-amber-500" />
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Gold</p>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-amber-600">{purchaseMetrics?.summary.gold.count || 0}</p>
                    <p className="text-sm text-muted-foreground">compras</p>
                  </div>
                  <p className="text-sm text-amber-600 mt-1 flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    R$ {purchaseMetrics?.summary.gold.total || '0.00'}
                  </p>
                </div>

                <div className="p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Gem className="h-5 w-5 text-purple-500" />
                    <p className="text-sm font-medium text-purple-700 dark:text-purple-400">Premium</p>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-purple-600">{purchaseMetrics?.summary.premium.count || 0}</p>
                    <p className="text-sm text-muted-foreground">compras</p>
                  </div>
                  <p className="text-sm text-purple-600 mt-1 flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    R$ {purchaseMetrics?.summary.premium.total || '0.00'}
                  </p>
                </div>

                <div className="p-4 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Infinity className="h-5 w-5 text-emerald-500" />
                    <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Lifetime</p>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-emerald-600">{purchaseMetrics?.summary.lifetime.count || 0}</p>
                    <p className="text-sm text-muted-foreground">compras</p>
                  </div>
                  <p className="text-sm text-emerald-600 mt-1 flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    R$ {purchaseMetrics?.summary.lifetime.total || '0.00'}
                  </p>
                </div>
              </div>

              {/* Gráfico de Tendência */}
              <div>
                <p className="text-sm font-medium mb-3">Tendência de Vendas por Tipo</p>
                <ResponsiveContainer width="100%" height={250}>
                  <ComposedChart data={purchaseMetrics?.dailyTrend || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getDate()}/${date.getMonth() + 1}`;
                      }}
                      fontSize={12}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => {
                        const date = new Date(value as string);
                        return date.toLocaleDateString('pt-BR');
                      }}
                    />
                    <Legend />
                    <Bar dataKey="gold" fill="#f59e0b" name="Gold" />
                    <Bar dataKey="premium" fill="#a855f7" name="Premium" />
                    <Bar dataKey="lifetime" fill="#10b981" name="Lifetime" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Compras Recentes por Tipo */}
              <div>
                <p className="text-sm font-medium mb-3">Compras Recentes por Tipo</p>
                <Tabs defaultValue="gold" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="gold" className="gap-1">
                      <Crown className="h-3 w-3" />
                      Gold ({purchaseMetrics?.recentPurchases.gold.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="premium" className="gap-1">
                      <Gem className="h-3 w-3" />
                      Premium ({purchaseMetrics?.recentPurchases.premium.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="lifetime" className="gap-1">
                      <Infinity className="h-3 w-3" />
                      Lifetime ({purchaseMetrics?.recentPurchases.lifetime.length || 0})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="gold" className="mt-4">
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {purchaseMetrics?.recentPurchases.gold && purchaseMetrics.recentPurchases.gold.length > 0 ? (
                        purchaseMetrics.recentPurchases.gold.map((purchase, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-amber-500/5 border border-amber-500/10 rounded">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="border-amber-500/30 text-amber-600">Gold</Badge>
                              <span className="text-sm break-all">{purchase.user?.email || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">R$ {purchase.amount}</span>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {new Date(purchase.createdAt).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">Nenhuma compra Gold registrada</p>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="premium" className="mt-4">
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {purchaseMetrics?.recentPurchases.premium && purchaseMetrics.recentPurchases.premium.length > 0 ? (
                        purchaseMetrics.recentPurchases.premium.map((purchase, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-purple-500/5 border border-purple-500/10 rounded">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="border-purple-500/30 text-purple-600">Premium</Badge>
                              <span className="text-sm break-all">{purchase.user?.email || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">R$ {purchase.amount}</span>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {new Date(purchase.createdAt).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">Nenhuma compra Premium registrada</p>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="lifetime" className="mt-4">
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {purchaseMetrics?.recentPurchases.lifetime && purchaseMetrics.recentPurchases.lifetime.length > 0 ? (
                        purchaseMetrics.recentPurchases.lifetime.map((purchase, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-emerald-500/5 border border-emerald-500/10 rounded">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="border-emerald-500/30 text-emerald-600">Lifetime</Badge>
                              <span className="text-sm break-all">{purchase.user?.email || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">R$ {purchase.amount}</span>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {new Date(purchase.createdAt).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">Nenhuma compra Lifetime registrada</p>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Crescimento Mensal de Usuários */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Crescimento Mensal {userGrowth?.year || new Date().getFullYear()}
          </CardTitle>
          <CardDescription>Evolução de usuários registrados vs visitantes (guests) ao longo do ano</CardDescription>
        </CardHeader>
        <CardContent>
          {growthLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Resumo de Crescimento */}
              <div className="grid md:grid-cols-4 gap-4">
                <div className="p-4 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-400">Usuários (Ano)</p>
                  </div>
                  <p className="text-3xl font-bold text-blue-600">{userGrowth?.totals.usersThisYear || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total histórico: {userGrowth?.totals.usersAllTime || 0}</p>
                </div>

                <div className="p-4 bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Smartphone className="h-5 w-5 text-orange-500" />
                    <p className="text-sm font-medium text-orange-700 dark:text-orange-400">Guests (Ano)</p>
                  </div>
                  <p className="text-3xl font-bold text-orange-600">{userGrowth?.totals.guestsThisYear || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total histórico: {userGrowth?.totals.guestsAllTime || 0}</p>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Taxa de Conversão</p>
                  <p className="text-2xl font-bold">
                    {userGrowth?.totals.guestsThisYear && userGrowth.totals.guestsThisYear > 0
                      ? `${((userGrowth.totals.usersThisYear / (userGrowth.totals.usersThisYear + userGrowth.totals.guestsThisYear)) * 100).toFixed(1)}%`
                      : '0%'}
                  </p>
                  <p className="text-xs text-muted-foreground">Guest → Usuário</p>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Média Mensal</p>
                  <p className="text-2xl font-bold">
                    {Math.round((userGrowth?.totals.usersThisYear || 0) / Math.max(1, new Date().getMonth() + 1))}
                  </p>
                  <p className="text-xs text-muted-foreground">novos usuários/mês</p>
                </div>
              </div>

              {/* Gráfico de Evolução Cumulativa */}
              <div>
                <p className="text-sm font-medium mb-3">Evolução Cumulativa (Total Acumulado)</p>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={userGrowth?.months || []}>
                    <defs>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorGuests" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="monthLabel" fontSize={12} />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        value,
                        name === 'usersTotal' ? 'Usuários (Total)' : 'Guests (Total)'
                      ]}
                      labelFormatter={(label) => `Mês: ${label}`}
                    />
                    <Legend 
                      formatter={(value) => value === 'usersTotal' ? 'Usuários Registrados' : 'Visitantes (Guests)'}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="usersTotal" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorUsers)"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="guestsTotal" 
                      stroke="#f97316" 
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorGuests)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Gráfico de Novos por Mês */}
              <div>
                <p className="text-sm font-medium mb-3">Novos Cadastros por Mês</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={userGrowth?.months || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="monthLabel" fontSize={12} />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        value,
                        name === 'users' ? 'Novos Usuários' : 'Novos Guests'
                      ]}
                    />
                    <Legend 
                      formatter={(value) => value === 'users' ? 'Novos Usuários' : 'Novos Guests'}
                    />
                    <Bar dataKey="users" fill="#3b82f6" name="users" />
                    <Bar dataKey="guests" fill="#f97316" name="guests" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumo Rápido */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo Rápido</CardTitle>
          <CardDescription>Métricas principais</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {statsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Vitalício Strong (Lifetime)</p>
                <p className="text-lg font-semibold">{stats?.lifetimeStrong || 0} usuários</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Premium (Acesso Completo IA)</p>
                <p className="text-lg font-semibold">{stats?.activePremiumSubscriptions || 0} ativos</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Acessos e Performance */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Canceladas (mês)</CardTitle>
            <Activity className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.cancelledThisMonth || 0}</div>
                <p className="text-xs text-muted-foreground">Churn rate</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gold Ativos</CardTitle>
            <CreditCard className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.activeGoldSubscriptions || 0}</div>
                <p className="text-xs text-muted-foreground">Plano Gold</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Premium Ativos</CardTitle>
            <Crown className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.activePremiumSubscriptions || 0}</div>
                <p className="text-xs text-muted-foreground">Plano Premium</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Métricas Profissionais Avançadas */}
      <Card>
        <CardHeader>
          <CardTitle>Métricas Profissionais Avançadas</CardTitle>
          <CardDescription>Análise detalhada de engajamento e retenção</CardDescription>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Taxa de Conversão Guest→User</p>
                <p className="text-lg font-semibold">
                  {stats?.totalGuests && stats.totalGuests > 0 
                    ? `${((stats.convertedGuests / stats.totalGuests) * 100).toFixed(1)}%`
                    : '0%'}
                </p>
              </div>

              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Usuários Novos (mês)</p>
                <p className="text-lg font-semibold">{stats?.newUsersThisMonth || 0}</p>
              </div>

              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Adesão Gold/Premium</p>
                <p className="text-lg font-semibold">
                  {stats?.totalUsers && stats.totalUsers > 0
                    ? `${(((stats.activeGoldSubscriptions + stats.activePremiumSubscriptions) / stats.totalUsers) * 100).toFixed(1)}%`
                    : '0%'}
                </p>
              </div>

              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Usuários Inativos (30 dias)</p>
                <p className="text-lg font-semibold">
                  {stats?.inactiveUsers ?? '—'}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
