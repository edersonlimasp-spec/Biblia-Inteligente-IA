import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchInput } from "@/components/ui/search-input";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { Lock, Unlock, Edit2, Crown, Clock, UserX, Star } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AdminUsersProps {
  isSuperAdmin: boolean;
}

interface EnrichedUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isBlocked: boolean;
  createdAt: string;
  trialStartDate: string | null;
  subscriptionStatus: 'active' | 'trial' | 'free';
  subscriptionPlan: string | null;
  subscriptionEndDate: string | null;
  trialActive: boolean;
  trialDaysRemaining: number;
}

interface UsersResponse {
  users: EnrichedUser[];
  total: number;
}

const planLabels: Record<string, string> = {
  premium: 'Premium',
  premium_anual: 'Premium Anual',
  gold: 'Gold',
  gold_anual: 'Gold Anual',
  strong_lifetime: 'Strong Vitalício',
};

function SubscriptionBadge({ user }: { user: EnrichedUser }) {
  if (user.subscriptionStatus === 'active' && user.subscriptionPlan) {
    return (
      <div className="flex flex-col gap-0.5">
        <Badge variant="default" className="text-xs w-fit bg-green-600 hover:bg-green-700">
          <Crown className="h-3 w-3 mr-1" />
          {planLabels[user.subscriptionPlan] || user.subscriptionPlan}
        </Badge>
        {user.subscriptionEndDate && (
          <span className="text-xs text-muted-foreground">até {user.subscriptionEndDate}</span>
        )}
      </div>
    );
  }
  if (user.subscriptionStatus === 'trial') {
    return (
      <div className="flex flex-col gap-0.5">
        <Badge variant="secondary" className="text-xs w-fit text-amber-600 border-amber-500/50">
          <Clock className="h-3 w-3 mr-1" />
          Degustação
        </Badge>
        <span className="text-xs text-muted-foreground">{user.trialDaysRemaining}d restantes</span>
      </div>
    );
  }
  return (
    <Badge variant="outline" className="text-xs text-muted-foreground">
      <UserX className="h-3 w-3 mr-1" />
      Gratuito
    </Badge>
  );
}

export function AdminUsers({ isSuperAdmin }: AdminUsersProps) {
  const [searchEmail, setSearchEmail] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const { toast } = useToast();

  const { data, isLoading, refetch } = useQuery<UsersResponse>({
    queryKey: ['/api/admin/users', searchEmail, page],
  });

  const blockMutation = useMutation({
    mutationFn: async ({ userId, block }: { userId: string; block: boolean }) => {
      const res = await apiRequest('POST', `/api/admin/users/${userId}/${block ? 'block' : 'unblock'}`);
      if (!res.ok) throw new Error('Erro ao alterar bloqueio');
      return res.json();
    },
    onSuccess: (_, { block }) => {
      toast({ title: block ? 'Usuário bloqueado' : 'Usuário desbloqueado' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
    onError: () => toast({ title: 'Erro ao alterar bloqueio', variant: 'destructive' }),
  });

  const users = data?.users || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  const activeSubs = users.filter(u => u.subscriptionStatus === 'active').length;
  const trialUsers = users.filter(u => u.subscriptionStatus === 'trial').length;
  const freeUsers = users.filter(u => u.subscriptionStatus === 'free').length;

  return (
    <div className="space-y-4">
      {!searchEmail && (
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Assinantes</p>
                  <p className="text-xl font-bold text-green-600">{activeSubs}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Degustação</p>
                  <p className="text-xl font-bold text-amber-600">{trialUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <UserX className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Gratuitos</p>
                  <p className="text-xl font-bold">{freeUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Gestão de Usuários</CardTitle>
          <CardDescription>
            {total} usuário{total !== 1 ? 's' : ''} cadastrado{total !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SearchInput
            placeholder="Buscar por email..."
            value={searchEmail}
            onChange={(e) => {
              setSearchEmail(e.target.value);
              setPage(1);
            }}
            showIcon={true}
            iconPosition="left"
            singleLine={true}
            minHeight="44px"
            maxHeight="44px"
            data-testid="input-search-users"
          />

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : users.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-2 px-3">Email / Nome</th>
                    <th className="text-left py-2 px-3">Função</th>
                    <th className="text-left py-2 px-3">Assinatura</th>
                    <th className="text-left py-2 px-3">Conta</th>
                    <th className="text-left py-2 px-3">Cadastro</th>
                    <th className="text-left py-2 px-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} className="border-b hover:bg-muted/50" data-testid={`row-user-${user.id}`}>
                      <td className="py-2 px-3">
                        <p className="font-medium truncate max-w-[200px]">{user.email}</p>
                        {user.name && (
                          <p className="text-xs text-muted-foreground">{user.name}</p>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                          {user.role === 'super_admin' ? '👑 Super' : user.role === 'admin' ? '🔑 Admin' : 'Usuário'}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <SubscriptionBadge user={user} />
                      </td>
                      <td className="py-2 px-3">
                        <span className={`text-xs font-medium ${user.isBlocked ? 'text-red-500' : 'text-green-600'}`}>
                          {user.isBlocked ? '🚫 Bloqueado' : '✅ Ativo'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-xs text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex gap-1">
                          {!user.isBlocked ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => blockMutation.mutate({ userId: user.id, block: true })}
                              disabled={blockMutation.isPending}
                              data-testid={`button-block-user-${user.id}`}
                              title="Bloquear usuário"
                            >
                              <Lock className="h-4 w-4 text-red-500" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => blockMutation.mutate({ userId: user.id, block: false })}
                              disabled={blockMutation.isPending}
                              data-testid={`button-unblock-user-${user.id}`}
                              title="Desbloquear usuário"
                            >
                              <Unlock className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum usuário encontrado
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Página {page} de {totalPages} ({total} usuários)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  data-testid="button-prev-page"
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  data-testid="button-next-page"
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
