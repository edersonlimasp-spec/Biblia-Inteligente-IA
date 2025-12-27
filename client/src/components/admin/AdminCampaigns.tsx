import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Mail, 
  Users, 
  Play, 
  Eye, 
  History, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Send
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface CampaignStats {
  totalInactive: number;
  eligible: number;
  alreadyReceived: number;
  campaignStats: {
    totalSent: number;
    totalFailed: number;
    lastSentAt: string | null;
  };
}

interface DryRunUser {
  id: string;
  email: string;
  name: string | null;
  lastSeenAt: string | null;
  daysSinceLastSeen: number | null;
}

interface DryRunResult {
  dryRun: boolean;
  totalInactive: number;
  showingFirst: number;
  users: DryRunUser[];
}

interface CampaignLog {
  id: number;
  userId: string;
  campaignName: string;
  sentAt: string;
  status: string;
  providerMessageId: string | null;
  errorMessage: string | null;
}

interface CampaignHistory {
  logs: CampaignLog[];
}

interface ExecuteResult {
  success: boolean;
  results: {
    total: number;
    eligible: number;
    sent: number;
    failed: number;
    skipped: number;
  };
}

export function AdminCampaigns() {
  const { toast } = useToast();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery<CampaignStats>({
    queryKey: ['/api/admin/campaigns/stats'],
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const { data: dryRunData, isLoading: dryRunLoading, refetch: refetchDryRun } = useQuery<DryRunResult>({
    queryKey: ['/api/admin/campaigns/dry-run'],
    enabled: false,
  });

  const { data: history, isLoading: historyLoading, refetch: refetchHistory } = useQuery<CampaignHistory>({
    queryKey: ['/api/admin/campaigns/history'],
    enabled: false,
  });

  const executeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/admin/campaigns/execute', { confirm: true });
      return response.json() as Promise<ExecuteResult>;
    },
    onSuccess: (data) => {
      toast({
        title: "Campanha executada",
        description: `Enviados: ${data.results.sent}, Falhas: ${data.results.failed}, Ignorados: ${data.results.skipped}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/campaigns/stats'] });
      refetchHistory();
      setShowConfirmDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao executar campanha",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
      setShowConfirmDialog(false);
    },
  });

  const handleDryRun = () => {
    refetchDryRun();
  };

  const handleViewHistory = () => {
    refetchHistory();
  };

  const handleExecute = () => {
    setShowConfirmDialog(true);
  };

  const confirmExecute = () => {
    executeMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Campanhas de Email</h2>
        <p className="text-muted-foreground">
          Sistema de reengajamento automático para usuários inativos
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Inativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.totalInactive || 0}</div>
                <p className="text-xs text-muted-foreground">30+ dias sem acessar</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Elegíveis</CardTitle>
            <Mail className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold text-green-600">{stats?.eligible || 0}</div>
                <p className="text-xs text-muted-foreground">Prontos para receber email</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Cooldown</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold text-orange-600">{stats?.alreadyReceived || 0}</div>
                <p className="text-xs text-muted-foreground">Receberam nos últimos 30 dias</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enviados</CardTitle>
            <Send className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.campaignStats?.totalSent || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.campaignStats?.totalFailed || 0} falhas
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button 
          variant="outline" 
          onClick={handleDryRun}
          disabled={dryRunLoading}
          data-testid="button-dry-run"
        >
          {dryRunLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Eye className="mr-2 h-4 w-4" />
          )}
          Dry Run (Preview)
        </Button>

        <Button 
          variant="outline"
          onClick={handleViewHistory}
          disabled={historyLoading}
          data-testid="button-view-history"
        >
          {historyLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <History className="mr-2 h-4 w-4" />
          )}
          Ver Histórico
        </Button>

        <Button
          onClick={handleExecute}
          disabled={executeMutation.isPending || !stats?.eligible}
          data-testid="button-execute-campaign"
        >
          {executeMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Play className="mr-2 h-4 w-4" />
          )}
          Executar Campanha
        </Button>
      </div>

      {dryRunData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Preview - Usuários Elegíveis
            </CardTitle>
            <CardDescription>
              Mostrando {dryRunData.showingFirst} de {dryRunData.totalInactive} usuários inativos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dryRunData.users.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Nenhum usuário elegível no momento
              </p>
            ) : (
              <div className="space-y-2">
                {dryRunData.users.map((user) => (
                  <div 
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div>
                      <p className="font-medium">{user.name || 'Sem nome'}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <Badge variant="secondary">
                      {user.daysSinceLastSeen ? `${user.daysSinceLastSeen} dias` : 'Nunca acessou'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {history && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico de Envios
            </CardTitle>
            <CardDescription>
              Últimos {history.logs.length} registros
            </CardDescription>
          </CardHeader>
          <CardContent>
            {history.logs.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Nenhum email enviado ainda
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {history.logs.map((log) => (
                  <div 
                    key={log.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      {log.status === 'sent' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{log.userId}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.sentAt).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <Badge variant={log.status === 'sent' ? 'default' : 'destructive'}>
                      {log.status === 'sent' ? 'Enviado' : 'Falhou'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar execução da campanha</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a enviar emails de reengajamento para {stats?.eligible || 0} usuários inativos.
              Esta ação não pode ser desfeita. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmExecute} disabled={executeMutation.isPending}>
              {executeMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Confirmar e Enviar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
