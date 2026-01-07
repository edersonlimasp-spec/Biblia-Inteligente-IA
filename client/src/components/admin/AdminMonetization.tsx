import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Crown, Shield, Key, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface SubscriptionStats {
  activeGold: number;
  activePremium: number;
  lifetimeStrong: number;
  totalRevenue: string;
  monthlyRevenue: string;
}

interface AdminSubscription {
  id: string;
  planType: string;
  status: string;
  amount: string;
  startDate: string;
  endDate: string | null;
  createdAt: string;
  userId: string;
  userEmail: string | null;
}

export function AdminMonetization() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [planType, setPlanType] = useState<string>("");
  const [durationDays, setDurationDays] = useState("30");

  const { data: stats, isLoading } = useQuery<SubscriptionStats>({
    queryKey: ['/api/admin/monetization'],
  });

  const { data: subscriptionsData, isLoading: subsLoading } = useQuery<{ subscriptions: AdminSubscription[] }>({
    queryKey: ['/api/admin/subscriptions'],
  });

  const activateMutation = useMutation({
    mutationFn: async (data: { email: string; planType: string; durationDays: number }) => {
      const res = await apiRequest('POST', '/api/admin/subscriptions/activate', data);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Assinatura Ativada",
        description: data.message,
      });
      setEmail("");
      setPlanType("");
      queryClient.invalidateQueries({ queryKey: ['/api/admin/subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/monetization'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao ativar assinatura",
        variant: "destructive",
      });
    },
  });

  const handleActivate = () => {
    if (!email || !planType) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o email e selecione o plano",
        variant: "destructive",
      });
      return;
    }
    activateMutation.mutate({ 
      email, 
      planType, 
      durationDays: parseInt(durationDays) 
    });
  };

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'gold': return <Shield className="h-4 w-4 text-yellow-500" />;
      case 'premium': return <Crown className="h-4 w-4 text-purple-500" />;
      case 'strong_lifetime': return <Key className="h-4 w-4 text-blue-500" />;
      default: return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const isActive = ['active', 'Active', 'ACTIVE', 'approved', 'Approved', 'APPROVED', 'authorized', 'Authorized', 'AUTHORIZED'].includes(status);
    return (
      <Badge variant={isActive ? "default" : "secondary"}>
        {isActive ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
        {status}
      </Badge>
    );
  };

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
                <p className="text-xs text-muted-foreground mt-1">R$ 9,90/mês</p>
              </div>

              <div className="border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Premium Ativo</p>
                <p className="text-3xl font-bold">{stats?.activePremium || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">R$ 19,90/mês</p>
              </div>

              <div className="border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Lifetime Strong</p>
                <p className="text-3xl font-bold">{stats?.lifetimeStrong || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Em breve</p>
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

      {/* Manual Subscription Activation - Super Admin Only */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            Ativar Assinatura Manualmente
          </CardTitle>
          <CardDescription>
            Use quando o webhook do Mercado Pago não processar o pagamento automaticamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email do Usuário</Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="input-activate-email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="planType">Plano</Label>
              <Select value={planType} onValueChange={setPlanType}>
                <SelectTrigger data-testid="select-plan-type">
                  <SelectValue placeholder="Selecione o plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gold">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-yellow-500" />
                      Gold - R$ 9,90/mês
                    </div>
                  </SelectItem>
                  <SelectItem value="premium">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-purple-500" />
                      Premium - R$ 19,90/mês
                    </div>
                  </SelectItem>
                  <SelectItem value="strong_lifetime">
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4 text-blue-500" />
                      Strong Vitalício - R$ 49,90
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duração (dias)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                max="365"
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                data-testid="input-duration-days"
              />
            </div>
          </div>

          <Button 
            onClick={handleActivate} 
            disabled={activateMutation.isPending}
            className="w-full"
            data-testid="button-activate-subscription"
          >
            {activateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Ativando...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Ativar Assinatura
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Subscriptions List */}
      <Card>
        <CardHeader>
          <CardTitle>Todas as Assinaturas</CardTitle>
          <CardDescription>Lista completa de assinaturas registradas</CardDescription>
        </CardHeader>
        <CardContent>
          {subsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : subscriptionsData?.subscriptions?.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Nenhuma assinatura encontrada</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {subscriptionsData?.subscriptions?.map((sub) => (
                <div key={sub.id} className="border rounded-lg p-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    {getPlanIcon(sub.planType)}
                    <div>
                      <p className="font-medium">{sub.userEmail || 'Email não encontrado'}</p>
                      <p className="text-xs text-muted-foreground">
                        {sub.planType.toUpperCase()} - R$ {sub.amount}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(sub.status)}
                    <span className="text-xs text-muted-foreground">
                      {sub.endDate 
                        ? `Até ${new Date(sub.endDate).toLocaleDateString('pt-BR')}` 
                        : 'Vitalício'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
