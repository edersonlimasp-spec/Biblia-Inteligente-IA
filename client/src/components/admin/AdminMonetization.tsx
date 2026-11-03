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
import { AppleNotificationsSection } from "./AppleNotificationsSection";
import { RecurringRevenuePanel } from "./RecurringRevenuePanel";

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

export function AdminMonetization({ isSuperAdmin = false }: { isSuperAdmin?: boolean }) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [planType, setPlanType] = useState<string>("");
  const [durationDays, setDurationDays] = useState("30");

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
      case 'gold':
      case 'gold_anual': return <Shield className="h-4 w-4 text-yellow-500" />;
      case 'premium':
      case 'premium_anual': return <Crown className="h-4 w-4 text-purple-500" />;
      case 'strong_lifetime': return <Key className="h-4 w-4 text-blue-500" />;
      default: return null;
    }
  };

  const PLAN_LABELS: Record<string, string> = {
    gold: 'Gold Mensal (legado)',
    gold_anual: 'Gold Anual (legado)',
    premium: 'Premium Mensal',
    premium_anual: 'Premium Anual',
    strong_lifetime: 'Strong Vitalício',
    lifetime: 'Strong Vitalício',
  };
  const planLabel = (plan: string) => PLAN_LABELS[plan] || plan;

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
      <RecurringRevenuePanel />

      {/* Manual Subscription Activation - Super Admin Only */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            Ativar Assinatura Manualmente
          </CardTitle>
          <CardDescription>
            Use quando o webhook do Mercado Pago não processar o pagamento automaticamente. O Gold foi descontinuado e não é mais concedido.
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
                  <SelectItem value="premium">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-purple-500" />
                      Premium
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
                        {planLabel(sub.planType)} · R$ {sub.amount}
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

      <AppleNotificationsSection isSuperAdmin={isSuperAdmin} />
    </div>
  );
}
