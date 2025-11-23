import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, TrendingUp, CreditCard, Zap, Activity, Mail, Clock } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface DashboardStats {
  totalUsers: number;
  newUsersThisMonth: number;
  activeTrials: number;
  activeGoldSubscriptions: number;
  activePremiumSubscriptions: number;
  lifetimeStrong: number;
  estimatedMonthlyRevenue: string;
  cancelledThisMonth: number;
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

export function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/admin/stats'],
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

      {/* Top Usuários IA */}
      <Card>
        <CardHeader>
          <CardTitle>Usuários Mais Ativos em IA</CardTitle>
          <CardDescription>Top 10 por número de perguntas</CardDescription>
        </CardHeader>
        <CardContent>
          {aiLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : aiUsage?.byUser && aiUsage.byUser.length > 0 ? (
            <div className="space-y-2">
              {aiUsage.byUser.slice(0, 10).map((user, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Usuário {idx + 1}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-primary rounded h-2" style={{width: `${(user.count / (aiUsage.byUser[0]?.count || 1)) * 100}px`}} />
                    <span className="text-sm font-semibold">{user.count} perguntas</span>
                  </div>
                </div>
              ))}
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
    </div>
  );
}
