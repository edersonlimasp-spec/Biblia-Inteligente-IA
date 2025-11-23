import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, TrendingUp, CreditCard, Zap } from "lucide-react";

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

export function AdminDashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/admin/stats'],
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
        {isLoading ? (
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          icon={Users} 
          label="Total de Usuários" 
          value={stats?.totalUsers || 0}
          subtext={`${stats?.newUsersThisMonth || 0} novos este mês`}
        />
        <StatCard 
          icon={Zap} 
          label="Trials Ativos" 
          value={stats?.activeTrials || 0}
          subtext="Período de 30 dias"
        />
        <StatCard 
          icon={CreditCard} 
          label="Gold + Premium" 
          value={(stats?.activeGoldSubscriptions || 0) + (stats?.activePremiumSubscriptions || 0)}
          subtext="Assinaturas ativas"
        />
        <StatCard 
          icon={TrendingUp} 
          label="Faturamento (mês)" 
          value={`R$ ${stats?.estimatedMonthlyRevenue || '0'}`}
          subtext={`${stats?.cancelledThisMonth || 0} cancelamentos`}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumo Rápido</CardTitle>
          <CardDescription>Métricas principais do aplicativo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
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
