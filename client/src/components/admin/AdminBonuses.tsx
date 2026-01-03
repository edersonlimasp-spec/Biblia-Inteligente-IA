import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { Gift, X, Search, RefreshCw, AlertTriangle, Clock, CheckCircle, Users, UserPlus, AlertCircle } from "lucide-react";
import type { Bonus } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

interface AdminBonusesProps {
  isSuperAdmin: boolean;
}

interface BonusWithEmail extends Bonus {
  userEmail: string;
  userName: string | null;
  daysRemaining: number | null;
}

interface UserBasic {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
}

export function AdminBonuses({ isSuperAdmin }: AdminBonusesProps) {
  const [userEmail, setUserEmail] = useState("");
  const [bonusType, setBonusType] = useState("trial_extend");
  const [duration, setDuration] = useState("30");
  const [reason, setReason] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [includeExpired, setIncludeExpired] = useState(false);
  const [renewDays, setRenewDays] = useState<{ [key: string]: string }>({});
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const { toast } = useToast();

  const { data: bonuses, isLoading, error: bonusError, refetch } = useQuery<BonusWithEmail[]>({
    queryKey: ['/api/admin/bonuses/search', searchEmail, includeExpired],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchEmail) params.append('email', searchEmail);
      if (includeExpired) params.append('includeExpired', 'true');
      const res = await fetch(`/api/admin/bonuses/search?${params}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Erro ao buscar bônus');
      return res.json();
    },
  });

  const { data: usersData, isLoading: loadingUsers, error: usersError } = useQuery<{ users: UserBasic[], total: number }>({
    queryKey: ['/api/admin/users'],
  });

  const allUsers = usersData?.users || [];

  useEffect(() => {
    console.log('[AdminBonuses] Mounted, bonuses:', bonuses?.length, 'users:', allUsers?.length);
    if (bonusError) console.error('[AdminBonuses] Bonus error:', bonusError);
    if (usersError) console.error('[AdminBonuses] Users error:', usersError);
  }, [bonuses, allUsers, bonusError, usersError]);

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
      queryClient.invalidateQueries({ queryKey: ['/api/admin/bonuses/search'] });
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
      queryClient.invalidateQueries({ queryKey: ['/api/admin/bonuses/search'] });
    },
  });

  const renewBonusMutation = useMutation({
    mutationFn: async ({ bonusId, extraDays }: { bonusId: string; extraDays: number }) => {
      const res = await apiRequest('PATCH', `/api/admin/bonuses/${bonusId}/renew`, { extraDays });
      if (!res.ok) throw new Error('Erro ao renovar bônus');
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Bônus renovado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/bonuses/search'] });
    },
    onError: (error) => {
      toast({ title: "Erro ao renovar bônus", description: (error as Error).message, variant: "destructive" });
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

  const handleRenewBonus = (bonusId: string) => {
    const days = parseInt(renewDays[bonusId] || "30");
    if (days <= 0) {
      toast({ title: "Dias inválidos", variant: "destructive" });
      return;
    }
    renewBonusMutation.mutate({ bonusId, extraDays: days });
  };

  const handleSelectUser = (email: string) => {
    setUserEmail(email);
  };

  const bonusTypeLabels: Record<string, string> = {
    trial_extend: "Estender Trial",
    gold_free: "Gold Gratuito",
    premium_free: "Premium Gratuito",
    lifetime_grant: "Lifetime Grant",
  };

  const getExpiryBadge = (daysRemaining: number | null, isActive: boolean) => {
    if (!isActive) {
      return <Badge variant="secondary" className="bg-gray-500/20 text-gray-400">Revogado</Badge>;
    }
    if (daysRemaining === null) {
      return <Badge variant="secondary" className="bg-purple-500/20 text-purple-400">Vitalício</Badge>;
    }
    if (daysRemaining <= 0) {
      return <Badge variant="destructive">Expirado</Badge>;
    }
    if (daysRemaining <= 5) {
      return (
        <Badge variant="secondary" className="bg-orange-500/20 text-orange-400 animate-pulse">
          <AlertTriangle className="h-3 w-3 mr-1" />
          {daysRemaining} dia(s)
        </Badge>
      );
    }
    if (daysRemaining <= 30) {
      return (
        <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400">
          <Clock className="h-3 w-3 mr-1" />
          {daysRemaining} dias
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="bg-green-500/20 text-green-400">
        <CheckCircle className="h-3 w-3 mr-1" />
        {daysRemaining} dias
      </Badge>
    );
  };

  const expiringBonuses = bonuses?.filter(b => b.isActive && b.daysRemaining !== null && b.daysRemaining <= 5 && b.daysRemaining > 0) || [];

  const filteredUsers = allUsers.filter(user => 
    !userSearchTerm || 
    user.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    (user.name && user.name.toLowerCase().includes(userSearchTerm.toLowerCase()))
  );

  const usersWithBonusIds = new Set(bonuses?.map(b => b.userEmail) || []);

  return (
    <div className="space-y-4">
      {expiringBonuses.length > 0 && (
        <Card className="border-orange-500/50 bg-orange-500/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-orange-400 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Bônus Próximos do Vencimento
            </CardTitle>
            <CardDescription>Estes bônus expiram em 5 dias ou menos. Revalide ou deixe expirar.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expiringBonuses.map(bonus => (
                <div 
                  key={`expiring-${bonus.id}`}
                  className="border border-orange-500/30 rounded-lg p-3 flex flex-col md:flex-row md:items-center gap-3 bg-background/50"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{bonus.userEmail}</p>
                    <p className="text-xs text-muted-foreground">
                      {bonusTypeLabels[bonus.bonusType] || bonus.bonusType} - {bonus.reason}
                    </p>
                    <p className="text-xs text-orange-400 font-medium">
                      Expira em {bonus.daysRemaining} dia(s) ({bonus.endAt ? new Date(bonus.endAt).toLocaleDateString('pt-BR') : ''})
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Dias"
                      className="w-20"
                      value={renewDays[bonus.id] || "30"}
                      onChange={(e) => setRenewDays(prev => ({ ...prev, [bonus.id]: e.target.value }))}
                      data-testid={`input-renew-days-${bonus.id}`}
                    />
                    <Button
                      size="sm"
                      onClick={() => handleRenewBonus(bonus.id)}
                      disabled={renewBonusMutation.isPending}
                      data-testid={`button-renew-bonus-${bonus.id}`}
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Revalidar
                    </Button>
                    {isSuperAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => revokeBonusMutation.mutate(bonus.id)}
                        disabled={revokeBonusMutation.isPending}
                        className="text-red-500 hover:text-red-600"
                        data-testid={`button-expire-bonus-${bonus.id}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Usuários Cadastrados ({allUsers.length})
            </CardTitle>
            <CardDescription>Clique em um usuário para conceder bônus</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Buscar usuário por email ou nome..."
              value={userSearchTerm}
              onChange={(e) => setUserSearchTerm(e.target.value)}
              data-testid="input-search-user"
            />
            <div className="h-[300px] border rounded-md overflow-y-auto">
              {loadingUsers ? (
                <div className="p-3 space-y-2">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : filteredUsers.length > 0 ? (
                <div className="divide-y">
                  {filteredUsers.map(user => (
                    <div
                      key={user.id}
                      className={`p-3 cursor-pointer flex items-center justify-between ${
                        userEmail === user.email ? 'bg-primary/10 border-l-2 border-primary' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => handleSelectUser(user.email)}
                      data-testid={`user-row-${user.id}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.email}</p>
                        {user.name && (
                          <p className="text-xs text-muted-foreground truncate">{user.name}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {usersWithBonusIds.has(user.email) && (
                          <Badge variant="secondary" className="text-xs">
                            <Gift className="h-3 w-3 mr-1" />
                            Bônus
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectUser(user.email);
                          }}
                          data-testid={`button-select-user-${user.id}`}
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  Nenhum usuário encontrado
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Criar Novo Bônus
            </CardTitle>
            <CardDescription>Conceda bônus especiais a usuários</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Email do usuário</label>
              <Input
                placeholder="Digite ou selecione da lista"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                data-testid="input-bonus-email"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Tipo de bônus</label>
              <select
                value={bonusType}
                onChange={(e) => setBonusType(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm bg-background text-foreground"
                data-testid="select-bonus-type"
              >
                <option value="trial_extend">Estender Trial (dias)</option>
                <option value="gold_free">Gold Gratuito (período)</option>
                <option value="premium_free">Premium Gratuito (período)</option>
                <option value="lifetime_grant">Lifetime Strong (Vitalício)</option>
              </select>
            </div>

            {bonusType !== "lifetime_grant" && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Duração (dias)</label>
                <Input
                  type="number"
                  placeholder="30"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  data-testid="input-bonus-duration"
                />
              </div>
            )}

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Motivo</label>
              <Input
                placeholder="Ex: Compensação de bug, Feedback especial"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                data-testid="input-bonus-reason"
              />
            </div>

            <Button 
              onClick={handleCreateBonus}
              disabled={createBonusMutation.isPending || !userEmail}
              className="w-full"
              data-testid="button-create-bonus"
            >
              <Gift className="h-4 w-4 mr-2" />
              {createBonusMutation.isPending ? "Criando..." : "Criar Bônus"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Pesquisar Bônus
          </CardTitle>
          <CardDescription>Busque bônus por email do usuário</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Pesquisar por email..."
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                data-testid="input-search-bonus-email"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="includeExpired"
                checked={includeExpired}
                onCheckedChange={(checked) => setIncludeExpired(checked === true)}
                data-testid="checkbox-include-expired"
              />
              <label htmlFor="includeExpired" className="text-sm cursor-pointer">
                Incluir expirados/revogados
              </label>
            </div>
            <Button variant="outline" onClick={() => refetch()} data-testid="button-search-bonuses">
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Bônus Ativos ({bonuses?.length || 0})</CardTitle>
          <CardDescription>Todos os bônus cadastrados no sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : bonuses && bonuses.length > 0 ? (
            <div className="space-y-2">
              {bonuses.map(bonus => (
                <div 
                  key={bonus.id} 
                  className={`border rounded-lg p-3 ${
                    bonus.daysRemaining !== null && bonus.daysRemaining <= 5 && bonus.daysRemaining > 0 && bonus.isActive
                      ? 'border-orange-500/50 bg-orange-500/5' 
                      : !bonus.isActive 
                        ? 'opacity-60' 
                        : ''
                  }`}
                  data-testid={`card-bonus-${bonus.id}`}
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{bonus.userEmail}</p>
                        {getExpiryBadge(bonus.daysRemaining, bonus.isActive)}
                      </div>
                      {bonus.userName && (
                        <p className="text-xs text-muted-foreground">{bonus.userName}</p>
                      )}
                      <p className="text-xs text-primary font-medium mt-1">
                        {bonusTypeLabels[bonus.bonusType] || bonus.bonusType}
                      </p>
                      <p className="text-xs text-muted-foreground">{bonus.reason}</p>
                      {bonus.endAt && (
                        <p className="text-xs text-muted-foreground">
                          Válido até: {new Date(bonus.endAt).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {bonus.isActive && bonus.daysRemaining !== null && (
                        <>
                          <Input
                            type="number"
                            placeholder="Dias"
                            className="w-20"
                            value={renewDays[bonus.id] || "30"}
                            onChange={(e) => setRenewDays(prev => ({ ...prev, [bonus.id]: e.target.value }))}
                            data-testid={`input-renew-days-list-${bonus.id}`}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRenewBonus(bonus.id)}
                            disabled={renewBonusMutation.isPending}
                            data-testid={`button-renew-bonus-list-${bonus.id}`}
                          >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Renovar
                          </Button>
                        </>
                      )}
                      {isSuperAdmin && bonus.isActive && (
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
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum bônus encontrado
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
