import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SubscriptionStats {
  activeGold: number;
  activePremium: number;
  lifetimeStrong: number;
  totalRevenue: string;
  monthlyRevenue: string;
}

export function AdminMonetization() {
  const { data: stats, isLoading } = useQuery<SubscriptionStats>({
    queryKey: ['/api/admin/monetization'],
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Monetização e Assinaturas</CardTitle>
          <CardDescription>Dados de receita e planos ativos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Gold Ativo</p>
                <p className="text-3xl font-bold">{stats?.activeGold || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">R$ 19,90/mês</p>
              </div>

              <div className="border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Premium Ativo</p>
                <p className="text-3xl font-bold">{stats?.activePremium || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">R$ 29,90/mês</p>
              </div>

              <div className="border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Lifetime Strong</p>
                <p className="text-3xl font-bold">{stats?.lifetimeStrong || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">R$ 189,90 único</p>
              </div>

              <div className="border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Receita Este Mês</p>
                <p className="text-3xl font-bold">R$ {stats?.monthlyRevenue || '0'}</p>
                <p className="text-xs text-muted-foreground mt-1">Total: R$ {stats?.totalRevenue || '0'}</p>
              </div>
            </div>
          )}

          <Button variant="outline" className="w-full" data-testid="button-export-csv">
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
