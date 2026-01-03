import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, TrendingUp, CreditCard, Zap, Activity, Mail, Clock, Smartphone, UserCheck, Crown, ArrowUpRight, Target, Percent } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, ComposedChart } from "recharts";

interface DashboardStats {
  totalUsers: number;
  newUsersThisMonth: number;
  activeTrials: number;
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
  byUser: Array<{ userId: string; count: number }>;
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
      {/* Principal Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard 
          icon={Users} 
          label="Total de Usuários" 
          value={stats?.totalUsers || 0}
          subtext={`${stats?.newUsersThisMonth || 0} novos`}
        />
        <StatCard 
          icon={Activity} 
          label="Online Agora" 
          value={online?.onlineUsers || 0}
          subtext="Últimos 5 min"
        />
        <StatCard 
          icon={Zap} 
          label="Trials Ativos" 
          value={stats?.activeTrials || 0}
          subtext="30 dias"
        />
        <StatCard 
          icon={CreditCard} 
          label="Gold + Premium" 
          value={(stats?.activeGoldSubscriptions || 0) + (stats?.activePremiumSubscriptions || 0)}
          subtext="Ativas"
        />
        <StatCard 
          icon={TrendingUp} 
          label="Faturamento (mês)" 
          value={`R$ ${stats?.estimatedMonthlyRevenue || '0'}`}
          subtext="Estimado"
        />
      </div>

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
                    <p className="text-sm text-muted-foreground">Trials Ativos</p>
                  </div>
                  <p className="text-2xl font-semibold">{stats?.activeGuestTrials || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Período de teste</p>
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
                        <span className="text-sm text-muted-foreground truncate">ID: {user.userId.slice(0, 8)}...</span>
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
