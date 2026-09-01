import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, CalendarClock, CreditCard, RefreshCw, TrendingUp, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type Period = 30 | 90 | 180 | 365;

interface RecurringRevenueMetrics {
  period: { days: number; from: string; to: string };
  activeRecurring: number;
  activeByPlan: { gold: number; premium: number; lifetime: number };
  mrr: number;
  arpu: number;
  renewalRate: number;
  churnRate: number;
  expiringNext30Days: number;
  totals: {
    gross: number;
    net: number;
    fees: number;
    renewalGross: number;
    renewalNet: number;
    otherGross: number;
    otherNet: number;
    renewalTransactions: number;
    otherTransactions: number;
  };
  dailyTrend: Array<{ date: string; otherRevenue: number; renewalRevenue: number; netRevenue: number; transactions: number }>;
  providers: Array<{ provider: string; gross: number; net: number; transactions: number }>;
}

const periods: Array<{ value: Period; label: string }> = [
  { value: 30, label: "30 dias" },
  { value: 90, label: "90 dias" },
  { value: 180, label: "6 meses" },
  { value: 365, label: "1 ano" },
];

const money = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format((value || 0) / 100);

const percent = (value: number) => `${(value || 0).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;

const dateLabel = (value: string, compact = false) => {
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", compact ? { day: "2-digit", month: "2-digit" } : { day: "2-digit", month: "short" }).format(parsed);
};

function MetricTile({
  label,
  value,
  detail,
  tone = "default",
}: {
  label: string;
  value: string | number;
  detail: string;
  tone?: "default" | "positive" | "warning";
}) {
  const tones = {
    default: "border-border bg-background/40",
    positive: "border-[#527b68]/30 bg-[#527b68]/[0.07] dark:bg-[#527b68]/[0.12]",
    warning: "border-[#a36b35]/30 bg-[#a36b35]/[0.07] dark:bg-[#a36b35]/[0.12]",
  };
  return (
    <div className={`rounded-lg border p-3 transition-colors duration-200 hover:bg-accent/35 ${tones[tone]}`}>
      <p className="text-[11px] font-medium uppercase tracking-[0.11em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function RevenueTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const items = payload.filter((entry: any) => entry.value !== undefined);
  return (
    <div className="min-w-44 rounded-md border border-border bg-card px-3 py-2 text-xs shadow-sm">
      <p className="mb-2 font-medium text-foreground">{dateLabel(label)}</p>
      {items.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-6 py-0.5">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
            {entry.name}
          </span>
          <span className="font-medium tabular-nums text-foreground">{entry.dataKey === "transactions" ? entry.value : money(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function RecurringRevenuePanel() {
  const [period, setPeriod] = useState<Period>(30);
  const queryKey = [`/api/admin/metrics/recurring-revenue?days=${period}`];
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery<RecurringRevenueMetrics>({
    queryKey,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const hasTrend = Boolean(data?.dailyTrend?.length);
  const hasProviders = Boolean(data?.providers?.length);
  const transactions = (data?.totals.renewalTransactions || 0) + (data?.totals.otherTransactions || 0);
  const realizedRenewals = data?.totals.renewalNet || 0;

  return (
    <Card className="overflow-hidden border-border/90" data-testid="card-recurring-revenue">
      <CardHeader className="border-b border-border/70 bg-[#9e3129]/[0.035] pb-4 dark:bg-[#b03a32]/[0.08]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <CardTitle className="text-lg">Receita recorrente</CardTitle>
            </div>
            <CardDescription>
              Renovações realizadas e receita projetada da base ativa em uma única leitura.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border bg-card p-1" aria-label="Período do relatório">
            {periods.map((option) => (
              <Button
                key={option.value}
                variant={period === option.value ? "default" : "ghost"}
                size="sm"
                onClick={() => setPeriod(option.value)}
                className="h-7 px-2.5 text-xs"
                aria-pressed={period === option.value}
                data-testid={`button-recurring-period-${option.value}`}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="space-y-5 p-5">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-28 w-full" />)}
            </div>
            <Skeleton className="h-72 w-full" />
          </div>
        ) : isError ? (
          <div className="flex min-h-60 flex-col items-center justify-center gap-3 p-6 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive"><AlertTriangle className="h-5 w-5" aria-hidden="true" /></span>
            <div>
              <p className="font-medium">Não foi possível carregar a receita recorrente</p>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">{error instanceof Error ? error.message : "Verifique a conexão e tente novamente."}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>Tentar novamente</Button>
          </div>
        ) : !data ? null : (
          <div>
            <div className="grid gap-px bg-border/70 md:grid-cols-2 xl:grid-cols-4">
              <div className="bg-card p-4">
                <div className="flex items-center justify-between text-primary"><span className="text-xs font-medium">MRR projetado</span><TrendingUp className="h-4 w-4" aria-hidden="true" /></div>
                <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{money(data.mrr)}</p>
                <p className="mt-1 text-xs text-muted-foreground">Base de {data.activeRecurring.toLocaleString("pt-BR")} assinaturas recorrentes</p>
              </div>
              <div className="bg-card p-4">
                <div className="flex items-center justify-between text-[#527b68]"><span className="text-xs font-medium">Renovado no período</span><RefreshCw className="h-4 w-4" aria-hidden="true" /></div>
                <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{money(realizedRenewals)}</p>
                <p className="mt-1 text-xs text-muted-foreground">{data.totals.renewalTransactions.toLocaleString("pt-BR")} cobranças confirmadas</p>
              </div>
              <div className="bg-card p-4">
                <div className="flex items-center justify-between text-[#a36b35]"><span className="text-xs font-medium">Taxa de renovação</span><ArrowUpRight className="h-4 w-4" aria-hidden="true" /></div>
                <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{percent(data.renewalRate)}</p>
                <p className="mt-1 text-xs text-muted-foreground">Churn de {percent(data.churnRate)} no mesmo ciclo</p>
              </div>
              <div className="bg-card p-4">
                <div className="flex items-center justify-between text-muted-foreground"><span className="text-xs font-medium">ARPU mensal</span><WalletCards className="h-4 w-4" aria-hidden="true" /></div>
                <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{money(data.arpu)}</p>
                <p className="mt-1 text-xs text-muted-foreground">Por assinatura recorrente ativa</p>
              </div>
            </div>

            <div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(260px,0.8fr)]">
              <section aria-labelledby="revenue-trend-title">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 id="revenue-trend-title" className="text-sm font-semibold">Fluxo diário de receita</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">{dateLabel(data.period.from)} a {dateLabel(data.period.to)} · valores líquidos, já considerando reembolsos Apple</p>
                  </div>
                  <span className="hidden text-xs text-muted-foreground sm:block">{transactions.toLocaleString("pt-BR")} transações</span>
                </div>
                {hasTrend ? (
                  <div className="h-72" role="img" aria-label="Gráfico diário de receita líquida, novas assinaturas e renovações">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.dailyTrend} margin={{ top: 5, right: 4, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="recurringNetFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#9e3129" stopOpacity={0.28} /><stop offset="100%" stopColor="#9e3129" stopOpacity={0.02} /></linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 4" />
                        <XAxis dataKey="date" tickFormatter={(value) => dateLabel(value, true)} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} minTickGap={24} />
                        <YAxis tickFormatter={(value) => `R$${Math.round(value / 100)}`} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={48} />
                        <Tooltip content={<RevenueTooltip />} />
                        <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                        <Area type="monotone" dataKey="netRevenue" name="Líquido" stroke="#9e3129" strokeWidth={2.25} fill="url(#recurringNetFill)" />
                        <Area type="monotone" dataKey="renewalRevenue" name="Renovações" stroke="#527b68" strokeWidth={1.5} fill="none" />
                        <Area type="monotone" dataKey="otherRevenue" name="Demais cobranças" stroke="#a36b35" strokeWidth={1.5} fill="none" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : <p className="flex h-72 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">Ainda não há movimentação diária neste período.</p>}
              </section>

              <aside className="space-y-3 border-t border-border pt-5 xl:border-l xl:border-t-0 xl:pl-5 xl:pt-0" aria-label="Resumo operacional">
                <div className="flex items-center gap-2"><CalendarClock className="h-4 w-4 text-[#a36b35]" aria-hidden="true" /><h3 className="text-sm font-semibold">Próximo ciclo</h3></div>
                <MetricTile label="Vencendo em 30 dias" value={data.expiringNext30Days.toLocaleString("pt-BR")} detail="Assinaturas para acompanhar antes da cobrança" tone={data.expiringNext30Days ? "warning" : "default"} />
                <div className="rounded-lg border border-border p-3">
                  <p className="text-[11px] font-medium uppercase tracking-[0.11em] text-muted-foreground">Base por plano</p>
                  <div className="mt-3 space-y-2">
                    {[["Gold", data.activeByPlan.gold, "#b78b42"], ["Premium", data.activeByPlan.premium, "#9e3129"], ["Vitalício", data.activeByPlan.lifetime, "#527b68"]].map(([label, value, color]) => (
                      <div key={label as string} className="flex items-center justify-between text-sm"><span className="flex items-center gap-2 text-muted-foreground"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: color as string }} />{label}</span><span className="font-medium tabular-nums">{(value as number).toLocaleString("pt-BR")}</span></div>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-[11px] font-medium uppercase tracking-[0.11em] text-muted-foreground">Resultado do período</p>
                  <div className="mt-2 grid grid-cols-2 gap-y-2 text-sm">
                    <span className="text-muted-foreground">Bruto</span><span className="text-right font-medium tabular-nums">{money(data.totals.gross)}</span>
                    <span className="text-muted-foreground">Taxas</span><span className="text-right font-medium tabular-nums text-[#a36b35]">−{money(data.totals.fees)}</span>
                    <span className="font-medium">Líquido</span><span className="text-right font-semibold tabular-nums">{money(data.totals.net)}</span>
                  </div>
                </div>
              </aside>
            </div>

            <div className="border-t border-border bg-muted/20 p-5">
              <div className="mb-3 flex items-center gap-2"><CreditCard className="h-4 w-4 text-primary" aria-hidden="true" /><h3 className="text-sm font-semibold">Canais de cobrança</h3></div>
              {hasProviders ? (
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full min-w-[460px] text-left text-sm">
                      <thead className="bg-background/60 text-[11px] uppercase tracking-[0.08em] text-muted-foreground"><tr><th className="px-3 py-2 font-medium">Provedor</th><th className="px-3 py-2 text-right font-medium">Bruto</th><th className="px-3 py-2 text-right font-medium">Líquido</th><th className="px-3 py-2 text-right font-medium">Transações</th></tr></thead>
                      <tbody>{data.providers.map((provider) => <tr key={provider.provider} className="border-t border-border/70 transition-colors hover:bg-accent/30"><td className="px-3 py-2.5 font-medium">{provider.provider}</td><td className="px-3 py-2.5 text-right tabular-nums">{money(provider.gross)}</td><td className="px-3 py-2.5 text-right font-medium tabular-nums">{money(provider.net)}</td><td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">{provider.transactions.toLocaleString("pt-BR")}</td></tr>)}</tbody>
                    </table>
                  </div>
                  <div className="h-40" role="img" aria-label="Comparação de receita líquida por canal de cobrança">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.providers} layout="vertical" margin={{ top: 2, right: 10, left: 8, bottom: 0 }}><XAxis type="number" hide /><YAxis type="category" dataKey="provider" width={92} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} /><Tooltip content={<RevenueTooltip />} /><Bar dataKey="net" name="Líquido" radius={[0, 3, 3, 0]}>{data.providers.map((provider, index) => <Cell key={provider.provider} fill={index === 0 ? "#9e3129" : "#527b68"} />)}</Bar></BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : <p className="rounded-lg border border-dashed border-border py-7 text-center text-sm text-muted-foreground">Nenhum canal registrou receita neste período.</p>}
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <MetricTile label="Demais cobranças recorrentes" value={money(data.totals.otherNet)} detail={`${data.totals.otherTransactions.toLocaleString("pt-BR")} cobranças sem renovação confirmada pelo provedor`} />
                <MetricTile label="Renovações identificadas" value={money(data.totals.renewalNet)} detail={`${data.totals.renewalTransactions.toLocaleString("pt-BR")} renovações confirmadas pela Apple`} tone="positive" />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}