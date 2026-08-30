import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle, BellRing, CheckCircle2, Loader2, RefreshCw, TestTube2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

type AppleNotification = {
  id: string;
  notificationUuid: string;
  notificationType: string;
  subtype: string | null;
  environment: string;
  isTest: boolean;
  productId: string | null;
  processingStatus: string;
  processingError: string | null;
  attemptCount: number;
  nextAttemptAt: string;
  duplicateCount: number;
  receivedAt: string;
  processedAt: string | null;
};

type AppleNotificationsResponse = {
  success: boolean;
  notifications: AppleNotification[];
};

interface AppleNotificationsSectionProps {
  isSuperAdmin?: boolean;
}

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "processed") return "default";
  if (status === "failed" || status === "unmatched" || status === "dead_letter") return "destructive";
  if (status === "pending") return "secondary";
  return "outline";
}

function useAppleOperation(path: string, successTitle: string, queryKey: string[]) {
  const { toast } = useToast();
  return useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", path);
      return response.json();
    },
    onSuccess: (result) => {
      const summary = result.summary || {};
      toast({
        title: successTitle,
        description: Object.entries(summary)
          .map(([key, value]) => `${key}: ${value}`)
          .join(" • ") || "Operação concluída.",
      });
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/receipts/stats"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Operação Apple não concluída",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function AppleNotificationsSection({ isSuperAdmin = false }: AppleNotificationsSectionProps) {
  const queryKey = ["/api/admin/apple/notifications?limit=30"];
  const { data, isLoading, isFetching, refetch } = useQuery<AppleNotificationsResponse>({
    queryKey,
    refetchInterval: 60_000,
  });

  const backfill = useAppleOperation("/api/admin/apple/backfill", "Backfill Apple concluído", queryKey);
  const reconcile = useAppleOperation("/api/admin/apple/reconcile", "Reconciliação Apple concluída", queryKey);
  const notifications = data?.notifications || [];

  return (
    <Card data-testid="section-apple-notifications">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BellRing className="h-5 w-5 text-primary" />
              Notificações Apple
            </CardTitle>
            <CardDescription>
              Últimos eventos Server-to-Server V2 verificados. Sandbox é marcado como teste e não entra na receita.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refetch()}
              disabled={isFetching}
              data-testid="button-refresh-apple-notifications"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isFetching ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
            {isSuperAdmin && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => reconcile.mutate()}
                  disabled={reconcile.isPending}
                  data-testid="button-reconcile-apple"
                >
                  {reconcile.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                  Reconciliar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => backfill.mutate()}
                  disabled={backfill.isPending}
                  data-testid="button-backfill-apple"
                >
                  {backfill.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                  Executar backfill
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(item => <Skeleton key={item} className="h-16 w-full" />)}
          </div>
        ) : notifications.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Nenhuma notificação Apple recebida ainda.
          </p>
        ) : (
          <div className="space-y-2 max-h-[28rem] overflow-y-auto">
            {notifications.map(notification => (
              <div
                key={notification.id}
                className="border rounded-lg p-3 space-y-2"
                data-testid={`apple-notification-${notification.id}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {notification.processingStatus === "processed" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : notification.isTest ? (
                      <TestTube2 className="h-4 w-4 text-blue-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                    )}
                    <span className="font-medium">{notification.notificationType}</span>
                    {notification.subtype && <Badge variant="outline">{notification.subtype}</Badge>}
                    <Badge variant={notification.isTest ? "secondary" : "outline"}>
                      {notification.isTest ? "Sandbox/Teste" : "Produção"}
                    </Badge>
                    <Badge variant={statusVariant(notification.processingStatus)}>
                      {notification.processingStatus}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(notification.receivedAt).toLocaleString("pt-BR")}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                  {notification.productId && <span>Produto: {notification.productId}</span>}
                  <span>ID: {notification.notificationUuid}</span>
                  {notification.duplicateCount > 0 && (
                    <span>Reenvios ignorados: {notification.duplicateCount}</span>
                  )}
                  {notification.attemptCount > 1 && <span>Tentativas: {notification.attemptCount}</span>}
                </div>
                {notification.processingError && (
                  <p className="text-xs text-destructive">{notification.processingError}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}