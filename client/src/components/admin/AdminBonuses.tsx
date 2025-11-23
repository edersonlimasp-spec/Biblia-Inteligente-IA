import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { Gift, X } from "lucide-react";
import type { Bonus } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AdminBonusesProps {
  isSuperAdmin: boolean;
}

export function AdminBonuses({ isSuperAdmin }: AdminBonusesProps) {
  const [userEmail, setUserEmail] = useState("");
  const [bonusType, setBonusType] = useState("trial_extend");
  const [duration, setDuration] = useState("30");
  const [reason, setReason] = useState("");
  const { toast } = useToast();

  const { data: bonuses, isLoading } = useQuery<Bonus[]>({
    queryKey: ['/api/admin/bonuses'],
  });

  const createBonusMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/admin/bonuses', data);
      if (!res.ok) throw new Error('Erro ao criar bônus');
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Bônus criado com sucesso!" });
      setUserEmail("");
      setBonusType("trial_extend");
      setDuration("30");
      setReason("");
    },
    onError: (error) => {
      toast({ title: "Erro ao criar bônus", description: (error as Error).message, variant: "destructive" });
    },
  });

  const revokeBonusMutation = useMutation({
    mutationFn: async (bonusId: string) => {
      const res = await apiRequest('DELETE', `/api/admin/bonuses/${bonusId}`);
      if (!res.ok) throw new Error('Erro ao revogar bônus');
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Bônus revogado com sucesso!" });
    },
  });

  const handleCreateBonus = () => {
    if (!userEmail) {
      toast({ title: "Email é obrigatório", variant: "destructive" });
      return;
    }
    createBonusMutation.mutate({
      userEmail,
      bonusType,
      duration: bonusType === "lifetime_grant" ? null : parseInt(duration),
      reason,
    });
  };

  const bonusTypeLabels = {
    trial_extend: "Estender Trial",
    gold_free: "Gold Gratuito",
    premium_free: "Premium Gratuito",
    lifetime_grant: "Lifetime Grant",
  };

  return (
    <div className="space-y-4">
      {/* Create Bonus Form */}
      <Card>
        <CardHeader>
          <CardTitle>Criar Novo Bônus</CardTitle>
          <CardDescription>Conceda bônus especiais a usuários</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Email do usuário"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            data-testid="input-bonus-email"
          />

          <select
            value={bonusType}
            onChange={(e) => setBonusType(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm"
            data-testid="select-bonus-type"
          >
            <option value="trial_extend">Estender Trial (dias)</option>
            <option value="gold_free">Gold Gratuito (período)</option>
            <option value="premium_free">Premium Gratuito (período)</option>
            <option value="lifetime_grant">Lifetime Strong (Vitalício)</option>
          </select>

          {bonusType !== "lifetime_grant" && (
            <Input
              type="number"
              placeholder="Duração em dias"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              data-testid="input-bonus-duration"
            />
          )}

          <Input
            placeholder="Motivo (ex: Compensação de bug, Feedback especial)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            data-testid="input-bonus-reason"
          />

          <Button 
            onClick={handleCreateBonus}
            disabled={createBonusMutation.isPending}
            className="w-full"
            data-testid="button-create-bonus"
          >
            <Gift className="h-4 w-4 mr-2" />
            {createBonusMutation.isPending ? "Criando..." : "Criar Bônus"}
          </Button>
        </CardContent>
      </Card>

      {/* Active Bonuses */}
      <Card>
        <CardHeader>
          <CardTitle>Bônus Ativos</CardTitle>
          <CardDescription>Lista de bônus concedidos aos usuários</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : bonuses && bonuses.length > 0 ? (
            <div className="space-y-2">
              {bonuses.map(bonus => (
                <div 
                  key={bonus.id} 
                  className="border rounded-lg p-3 flex items-center justify-between"
                  data-testid={`card-bonus-${bonus.id}`}
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{bonusTypeLabels[bonus.bonusType as keyof typeof bonusTypeLabels]}</p>
                    <p className="text-xs text-muted-foreground">{bonus.reason}</p>
                    {bonus.endAt && (
                      <p className="text-xs text-muted-foreground">
                        Até: {new Date(bonus.endAt).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                  {isSuperAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => revokeBonusMutation.mutate(bonus.id)}
                      disabled={revokeBonusMutation.isPending}
                      data-testid={`button-revoke-bonus-${bonus.id}`}
                    >
                      <X className="h-4 w-4 text-red-600" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum bônus ativo
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
