import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, RefreshCw, AlertTriangle, CheckCircle, XCircle, Database, BookOpen, Languages, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface DataHealth {
  status: 'OK' | 'INCOMPLETE' | 'BROKEN' | 'ERROR';
  environment: string;
  database: {
    host: string;
    name: string;
  };
  counts: {
    modules: number;
    tracks: number;
    lessons: number;
    strong: number;
    orphanedLessons: number;
  };
  expected: {
    modules: number;
    tracks: number;
    lessons: number;
    strong: number;
  };
  warnings: string[];
  timestamp: string;
  error?: string;
}

interface ReseedResult {
  success: boolean;
  message: string;
  counts?: {
    modules?: number;
    tracks?: number;
    lessons?: number;
  };
  count?: number;
  details?: string;
  error?: string;
}

export function AdminSystemHealth() {
  const { toast } = useToast();
  const [lastReseedResult, setLastReseedResult] = useState<ReseedResult | null>(null);

  const { data: health, isLoading, refetch, isRefetching } = useQuery<DataHealth>({
    queryKey: ['/api/admin/diagnostics/data-health'],
    refetchInterval: false,
    retry: 1,
  });

  const reseedStudyMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/admin/diagnostics/reseed-study');
      return response.json();
    },
    onSuccess: (data: ReseedResult) => {
      setLastReseedResult(data);
      toast({
        title: data.success ? "Cursos atualizados!" : "Erro no reseed",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/diagnostics/data-health'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const reseedStrongMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/admin/diagnostics/reseed-strong');
      return response.json();
    },
    onSuccess: (data: ReseedResult) => {
      setLastReseedResult(data);
      toast({
        title: data.success ? "Strong atualizado!" : "Erro no reseed",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/diagnostics/data-health'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OK':
        return <Badge className="bg-green-500/20 text-green-700 border-green-500/30"><CheckCircle className="h-3 w-3 mr-1" /> OK</Badge>;
      case 'INCOMPLETE':
        return <Badge className="bg-yellow-500/20 text-yellow-700 border-yellow-500/30"><AlertTriangle className="h-3 w-3 mr-1" /> Incompleto</Badge>;
      case 'BROKEN':
        return <Badge className="bg-red-500/20 text-red-700 border-red-500/30"><XCircle className="h-3 w-3 mr-1" /> Quebrado</Badge>;
      default:
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Erro</Badge>;
    }
  };

  const getPercentage = (current: number, expected: number) => {
    if (expected === 0) return 0;
    return Math.min((current / expected) * 100, 100);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Carregando diagnóstico...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" data-testid="text-system-health-title">Saúde do Sistema</h2>
          <p className="text-muted-foreground">Diagnóstico e manutenção dos dados do sistema</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => refetch()} 
          disabled={isRefetching}
          data-testid="button-refresh-health"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {health?.error ? (
        <Card className="border-red-500/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Erro ao carregar diagnóstico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{health.error}</p>
          </CardContent>
        </Card>
      ) : health ? (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Status Geral
                  </CardTitle>
                  <CardDescription>
                    Ambiente: {health.environment} | DB: {health.database.name}
                  </CardDescription>
                </div>
                {getStatusBadge(health.status)}
              </div>
            </CardHeader>
            <CardContent>
              {health.warnings.length > 0 && (
                <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="font-medium text-yellow-700 mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" /> Avisos:
                  </p>
                  <ul className="list-disc list-inside text-sm text-yellow-600 space-y-1">
                    {health.warnings.map((warning, i) => (
                      <li key={i}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                Última verificação: {new Date(health.timestamp).toLocaleString('pt-BR')}
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Cursos Premium
                </CardTitle>
                <CardDescription>Módulos, Trilhas e Lições de estudo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Módulos</span>
                    <span>{health.counts.modules} / {health.expected.modules}</span>
                  </div>
                  <Progress value={getPercentage(health.counts.modules, health.expected.modules)} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Trilhas</span>
                    <span>{health.counts.tracks} / {health.expected.tracks}</span>
                  </div>
                  <Progress value={getPercentage(health.counts.tracks, health.expected.tracks)} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Lições</span>
                    <span>{health.counts.lessons} / {health.expected.lessons}</span>
                  </div>
                  <Progress value={getPercentage(health.counts.lessons, health.expected.lessons)} />
                </div>
                {health.counts.orphanedLessons > 0 && (
                  <div className="p-2 bg-red-500/10 border border-red-500/30 rounded text-sm text-red-600">
                    {health.counts.orphanedLessons} lições órfãs (referência inválida)
                  </div>
                )}
                <Button 
                  className="w-full"
                  variant={health.counts.lessons === 0 ? "default" : "outline"}
                  onClick={() => reseedStudyMutation.mutate()}
                  disabled={reseedStudyMutation.isPending}
                  data-testid="button-reseed-study"
                >
                  {reseedStudyMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Reseed Cursos (limpar e recriar)
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Languages className="h-5 w-5" />
                  Dicionário Strong
                </CardTitle>
                <CardDescription>Entradas hebraico/grego com definições</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Entradas</span>
                    <span>{health.counts.strong.toLocaleString()} / {health.expected.strong.toLocaleString()}</span>
                  </div>
                  <Progress value={getPercentage(health.counts.strong, health.expected.strong)} />
                </div>
                <div className="text-sm text-muted-foreground">
                  {health.counts.strong >= health.expected.strong ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" /> Completo
                    </span>
                  ) : health.counts.strong > 0 ? (
                    <span className="text-yellow-600 flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" /> Parcialmente carregado
                    </span>
                  ) : (
                    <span className="text-red-600 flex items-center gap-1">
                      <XCircle className="h-4 w-4" /> Vazio
                    </span>
                  )}
                </div>
                <Button 
                  className="w-full"
                  variant={health.counts.strong === 0 ? "default" : "outline"}
                  onClick={() => reseedStrongMutation.mutate()}
                  disabled={reseedStrongMutation.isPending}
                  data-testid="button-reseed-strong"
                >
                  {reseedStrongMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Reseed Strong (limpar e recriar)
                </Button>
              </CardContent>
            </Card>
          </div>

          {lastReseedResult && (
            <Card className={lastReseedResult.success ? "border-green-500/50" : "border-red-500/50"}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {lastReseedResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  Resultado do último reseed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-2">{lastReseedResult.message}</p>
                {lastReseedResult.counts && (
                  <div className="text-sm text-muted-foreground">
                    Módulos: {lastReseedResult.counts.modules || 0} |
                    Trilhas: {lastReseedResult.counts.tracks || 0} |
                    Lições: {lastReseedResult.counts.lessons || 0}
                  </div>
                )}
                {lastReseedResult.count !== undefined && (
                  <div className="text-sm text-muted-foreground">
                    Entradas Strong: {lastReseedResult.count.toLocaleString()}
                  </div>
                )}
                {lastReseedResult.details && (
                  <p className="text-sm text-muted-foreground mt-1">{lastReseedResult.details}</p>
                )}
              </CardContent>
            </Card>
          )}
        </>
      ) : null}
    </div>
  );
}
