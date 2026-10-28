import { useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getDeviceId } from "@/hooks/use-device-id";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LanguageSelector } from "@/components/LanguageSelector";
import {
  BookOpen,
  Brain,
  TrendingUp,
  Check,
  Sun,
  Moon,
  X,
  HandHeart,
  Calendar,
  CreditCard,
  Shield,
  GraduationCap,
  Mic,
  Library,
  LogIn,
  Settings,
  Crown,
  Gem,
  Infinity,
  ChevronRight,
  LucideIcon,
  BookMarked,
  Map,
  Church,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { trackAppOpen, trackPageView } from "@/lib/tracking";
import { devotionalRoutineAt } from "@shared/devotional";
import { getMelDate } from "@/lib/mel-date";
import { useDevotionalJournal } from "@/hooks/use-devotional";
import { useDevotionalInvitation } from "@/hooks/useDevotionalInvitation";

// Modulo SIGI: abre o SIGI DENTRO do app, em tela cheia, ja logado (ingresso de uso unico).
// Nao sai do app nem abre navegador. Os dados da igreja ficam no banco do SIGI.
// Lojas: sem compra, sem link de venda e sem criar conta dentro do SIGI embutido.
let sigiOverlay: HTMLDivElement | null = null;

function closeSigi() {
  if (!sigiOverlay) return;
  sigiOverlay.remove();
  sigiOverlay = null;
  document.body.style.overflow = "";
  window.removeEventListener("popstate", closeSigi);
}

async function openSigi() {
  if (sigiOverlay) return;
  try {
    // import dinamico: nao carrega o cliente de API so por abrir o painel
    const { apiRequest, getAuthToken } = await import("@/lib/queryClient");
    if (!getAuthToken()) {
      window.alert("Entre na sua conta do Bíblia Inteligente (botão Entrar, no topo) para acessar o SIGI.");
      return;
    }
    const r = await apiRequest("POST", "/api/sigi/ticket");
    const d = await r.json();
    if (!d?.url) throw new Error(d?.error || "sem url");

    const overlay = document.createElement("div");
    overlay.setAttribute("data-testid", "sigi-overlay");
    overlay.style.cssText =
      "position:fixed;inset:0;z-index:2147483000;display:flex;flex-direction:column;background:#12295C;" +
      "padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)";
    const bar = document.createElement("div");
    bar.style.cssText = "display:flex;align-items:center;gap:8px;height:44px;padding:0 12px;color:#fff;flex:none";
    const back = document.createElement("button");
    back.type = "button";
    back.textContent = "\u2039 Voltar";
    back.setAttribute("aria-label", "Voltar ao Bíblia Inteligente");
    back.style.cssText = "background:none;border:0;color:#fff;font-size:16px;padding:8px 4px;cursor:pointer";
    back.onclick = () => (window.history.state?.sigi ? window.history.back() : closeSigi());
    const title = document.createElement("strong");
    title.textContent = "SIGI";
    title.style.cssText = "font-size:16px;margin-left:4px";
    bar.append(back, title);
    const frame = document.createElement("iframe");
    frame.src = d.url;
    frame.title = "SIGI — Gestão da Igreja";
    frame.setAttribute("allow", "clipboard-write");
    frame.style.cssText = "flex:1;width:100%;border:0;background:#fff";
    overlay.append(bar, frame);
    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";
    sigiOverlay = overlay;
    // botao "voltar" do Android / navegador fecha o SIGI e volta ao painel
    window.history.pushState({ sigi: true }, "");
    window.addEventListener("popstate", closeSigi);
  } catch {
    window.alert("Não foi possível abrir o SIGI agora. Tente novamente em instantes.");
  }
}

/* ─── tipos ─────────────────────────────────────────────────── */
interface DashboardProps {
  onNavigateToBible: () => void;
  onNavigateToPrayer: () => void;
  onNavigateToSubscriptions: () => void;
  onNavigateToProfessor: () => void;
  onNavigateToAIModes: () => void;
  onNavigateToPlansProgress: () => void;
  onNavigateToCalendar: () => void;
  onNavigateToRecordings: () => void;
  onNavigateToAdmin: () => void;
  onNavigateToProfessorPremium: () => void;
  onNavigateToLogin: () => void;
  onNavigateToSettings: () => void;
  onNavigateToLibrary: () => void;
  onNavigateToAtlas: () => void;
  onMelDevotional: (date: string) => void;
}

interface ModuleDef {
  id: string;
  title: string;
  desc: string;
  icon: LucideIcon;
  from: string;
  to: string;
  badge?: string;
  onClick: () => void;
  testId: string;
}

/* ─── helpers visuais ───────────────────────────────────────── */

/** Rótulo de seção: mono uppercase #647B90 + divisor branco@7% */
function SectionLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mb-3 mt-5">
      <span
        className="font-mono text-[10px] uppercase tracking-[0.14em] flex-shrink-0"
        style={{ color: "#647B90" }}
      >
        {label}
      </span>
      <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
    </div>
  );
}

/** Cartão de módulo com gradiente Vitral */
function ModuleCard({ mod, delay, uniform = false }: { mod: ModuleDef; delay: number; uniform?: boolean }) {
  const Icon = mod.icon;
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay }}
      onClick={mod.onClick}
      data-testid={mod.testId}
      className="relative overflow-hidden text-left cursor-pointer w-full"
      style={{
        borderRadius: "11px",
        background: `linear-gradient(158deg, ${mod.from}, ${mod.to})`,
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.13), inset 0 0 0 1px rgba(255,255,255,0.05)",
        padding: "14px",
        /* Altura padronizada pela caixa "Cursos Premium" (título + descrição + badge) */
        ...(uniform ? { minHeight: "138px", height: "100%" } : {}),
      }}
    >
      {/* marca d'água */}
      <Icon
        className="absolute pointer-events-none"
        style={{
          right: 8, top: 8,
          width: 44, height: 44,
          opacity: 0.07,
          color: "#fff",
        }}
        strokeWidth={1.3}
      />

      {/* ícone principal */}
      <div
        className="flex items-center justify-center mb-2.5"
        style={{
          width: 29, height: 29,
          borderRadius: 6,
          background: "rgba(255,255,255,0.15)",
        }}
      >
        <Icon className="w-[15px] h-[15px]" style={{ color: "#fff" }} strokeWidth={1.8} />
      </div>

      {/* título */}
      <p
        className="font-serif text-[13px] font-medium leading-tight mb-0.5"
        style={{ color: "#fff" }}
      >
        {mod.title}
      </p>

      {/* descrição */}
      <p
        className="text-[10px] leading-snug"
        style={{ color: "rgba(255,255,255,0.78)" }}
      >
        {mod.desc}
      </p>

      {/* badge */}
      {mod.badge && (
        <span
          className="inline-block mt-2 px-1.5 py-0.5 rounded-full font-mono text-[9px] uppercase tracking-wide"
          style={{ background: "rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.90)" }}
        >
          {mod.badge}
        </span>
      )}
    </motion.button>
  );
}

/* ─── componente principal ──────────────────────────────────── */
export function Dashboard({
  onNavigateToBible,
  onNavigateToPrayer,
  onNavigateToSubscriptions,
  onNavigateToProfessor,
  onNavigateToAIModes,
  onNavigateToPlansProgress,
  onNavigateToCalendar,
  onNavigateToRecordings,
  onNavigateToAdmin,
  onNavigateToProfessorPremium,
  onNavigateToLogin,
  onNavigateToSettings,
  onNavigateToLibrary,
  onNavigateToAtlas,
  onMelDevotional,
}: DashboardProps) {
  const { user, isSuperAdmin } = useAuth();
  const { t } = useLanguage();
  const deviceId = getDeviceId();
  const isAdmin = user?.role === "admin" || user?.role === "super_admin" || isSuperAdmin;
  const [dashboardClock, setDashboardClock] = useState(() => new Date());
  useEffect(() => {
    const refresh = () => setDashboardClock(new Date());
    const timer = window.setInterval(refresh, 60_000);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, []);
  const momentDate = getMelDate(dashboardClock);
  const momentRoutine = devotionalRoutineAt(dashboardClock);
  const { data: momentJournal } = useDevotionalJournal(momentDate, momentRoutine);
  const momentDone = !!momentJournal?.completed;
  const invitation = useDevotionalInvitation(user?.id, momentDate, momentRoutine);

  /* último capítulo lido (para a faixa "Continuar") */
  const [lastRead, setLastRead] = useState<{
    book?: string; bookName?: string; chapter?: number;
  } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("reading_history");
      if (!raw) return;
      const history = JSON.parse(raw);
      if (Array.isArray(history) && history.length > 0) {
        setLastRead(history[history.length - 1]);
      }
    } catch { /* noop */ }
  }, []);

  /* último livro lido na Biblioteca (para a faixa "Continuar" da caixa Biblioteca) */
  const [lastBook, setLastBook] = useState<{
    bookId?: string; bookTitle?: string; currentChapter?: number; globalPage?: number;
  } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("library_last_progress");
      if (!raw) return;
      const p = JSON.parse(raw);
      if (p && p.bookTitle) setLastBook(p);
    } catch { /* noop */ }
  }, []);

  useEffect(() => {
    trackAppOpen().catch(() => {});
    trackPageView("dashboard").catch(() => {});
  }, []);

  useQuery<{ active: boolean; daysRemaining: number }>({
    queryKey: ["/api/guest/trial", deviceId],
    enabled: !!deviceId && !user,
  });

  const { data: subscriptionStatus } = useQuery<{
    hasGold: boolean; hasPremium: boolean; hasLifetime: boolean; trialActive: boolean;
  }>({
    queryKey: ["/api/user/subscription-status"],
    enabled: !!user,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const getSubscriptionBadge = () => {
    if (!user || !subscriptionStatus) return null;
    if (subscriptionStatus.hasPremium)
      return (
        <Badge variant="outline" className="text-xs py-1 px-2 gap-1 border-primary/40 text-primary" data-testid="badge-premium">
          <Gem className="w-3 h-3" /> Premium
        </Badge>
      );
    if (subscriptionStatus.hasLifetime)
      return (
        <Badge variant="outline" className="text-xs py-1 px-2 gap-1 border-primary/40 text-primary" data-testid="badge-lifetime">
          <Infinity className="w-3 h-3" /> {t("subscription.lifetime")}
        </Badge>
      );
    if (subscriptionStatus.hasGold)
      return (
        <Badge variant="outline" className="text-xs py-1 px-2 gap-1 border-primary/40 text-primary" data-testid="badge-gold">
          <Crown className="w-3 h-3" /> Gold
        </Badge>
      );
    return null;
  };

  /* ─── definição dos módulos ────────────────────────────────── */
  const iaEstudo: ModuleDef[] = useMemo(() => [
    {
      id: "professor", title: t("module.chat"),
      desc: t("module.chat.desc"),
      icon: GraduationCap, from: "#3E5F8A", to: "#2A4466",
      badge: "IA", onClick: onNavigateToProfessor,
      testId: "module-professor",
    },
    {
      id: "ai-modes", title: t("module.ai.modes"),
      desc: t("module.ai.modes.desc"),
      icon: Brain, from: "#75356A", to: "#5A2551",
      badge: t("module.ai.modes.badge"),
      onClick: onNavigateToAIModes, testId: "module-ai-modes",
    },
    {
      id: "cursos", title: t("module.courses"),
      desc: t("module.courses.desc"),
      icon: Library, from: "#4A4285", to: "#362F66",
      badge: t("module.courses.badge"),
      onClick: onNavigateToProfessorPremium, testId: "module-professor-premium",
    },
    {
      id: "planos", title: t("module.plans"),
      desc: t("module.plans.desc"),
      icon: TrendingUp, from: "#1F6A5C", to: "#134C43",
      onClick: onNavigateToPlansProgress, testId: "module-plans-progress",
    },
    {
      id: "atlas", title: "Mapas e Imagens",
      desc: "Geografia, rotas e reconstruções para o estudo bíblico.",
      icon: Map, from: "#2D5E7A", to: "#1C3E5A",
      onClick: onNavigateToAtlas, testId: "module-atlas",
    },
  ], [t, onNavigateToProfessor, onNavigateToAIModes, onNavigateToProfessorPremium, onNavigateToPlansProgress, onNavigateToAtlas]);

  const rotina: ModuleDef[] = useMemo(() => [
    {
      id: "devotional", title: "Devocional",
      desc: momentRoutine === "manha" ? "Bom Dia com Deus · 5 min" : "Boa Noite com Deus · 3 min",
      icon: momentDone ? Check : momentRoutine === "manha" ? Sun : Moon,
      from: "#315F66", to: "#203F47",
      badge: momentDone ? "Concluído" : "Gratuito",
      onClick: () => onMelDevotional(momentDate), testId: "module-devotional",
    },
    {
      id: "prayer", title: t("module.prayer"),
      desc: t("module.prayer.desc"),
      icon: HandHeart, from: "#93602A", to: "#734818",
      onClick: onNavigateToPrayer, testId: "module-prayer",
    },
    {
      id: "agenda", title: t("module.agenda"),
      desc: t("module.agenda.desc"),
      icon: Calendar, from: "#2C6076", to: "#1B4557",
      onClick: onNavigateToCalendar, testId: "module-calendar",
    },
    {
      id: "recordings", title: t("module.recordings"),
      desc: t("module.recordings.desc"),
      icon: Mic, from: "#9A4432", to: "#7A3022",
      badge: t("common.new"),
      onClick: onNavigateToRecordings, testId: "module-recordings",
    },
    {
      id: "sigi", title: "SIGI — Gestão da Igreja",
      desc: "Membros, cultos e financeiro da sua igreja",
      icon: Church, from: "#1B4A9C", to: "#12295C",
      onClick: () => { void openSigi(); }, testId: "module-sigi",
    },
    {
      id: "subscriptions", title: t("module.subscriptions"),
      desc: t("module.subscriptions.desc"),
      icon: CreditCard, from: "#3A4657", to: "#2A3441",
      onClick: onNavigateToSubscriptions, testId: "module-subscriptions",
    },
  ], [t, onNavigateToPrayer, onNavigateToCalendar, onNavigateToRecordings, onNavigateToSubscriptions, onMelDevotional, momentDate, momentRoutine, momentDone]);

  /* ─── render ─────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-background">
      {/* cabeçalho */}
      <header
        className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border"
        style={{ paddingTop: "var(--safe-area-inset-top,env(safe-area-inset-top,0px))" }}
      >
        <div className="max-w-2xl mx-auto px-3 py-2 flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-serif font-bold text-foreground truncate">
              Bíblia Inteligente
            </h1>
            <p className="text-[10px] truncate" style={{ color: "#8FA3B8" }}>
              {user ? `${t("welcome")}, ${user.name || "estudante"}` : t("welcome.guest")}
            </p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {user && getSubscriptionBadge()}
            <Button variant="ghost" size="icon" onClick={onNavigateToSettings} data-testid="button-settings">
              <Settings className="w-5 h-5" />
            </Button>
            {!user && (
              <Button variant="outline" size="sm" onClick={onNavigateToLogin} data-testid="button-login" className="gap-1 px-2">
                <LogIn className="w-3.5 h-3.5" />
                <span className="text-xs">{t("common.login")}</span>
              </Button>
            )}
            <LanguageSelector />
          </div>
        </div>
      </header>

      <ScrollArea className="h-[calc(100vh-60px)]">
        <div
          className="max-w-2xl mx-auto px-3 py-4 sm:px-5"
          style={{ paddingBottom: "calc(2rem + var(--safe-area-inset-bottom,env(safe-area-inset-bottom,0px)))" }}
        >
          {!invitation.closed && !momentDone && <div className="relative mb-3" data-testid="devotional-invitation">
          <button
            type="button"
            onClick={() => onMelDevotional(momentDate)}
            data-testid="dashboard-devotional"
            className="group relative block w-full overflow-hidden rounded-[18px] text-left transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              background: momentRoutine === "manha"
                ? "linear-gradient(118deg, #f0dfbb 0%, #e8d7b6 54%, #d8c49c 100%)"
                : "linear-gradient(118deg, #26383c 0%, #1c2c31 54%, #34434a 100%)",
              color: momentRoutine === "manha" ? "#342e24" : "#f1e9d9",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,.35), 0 12px 28px rgba(16,25,28,.13)",
              padding: "20px",
            }}
          >
            <div className="absolute right-[-12px] top-[-24px] h-36 w-36 rounded-full border opacity-20" style={{ borderColor: momentRoutine === "manha" ? "#8c6c36" : "#d3bd83" }} />
            <div className="absolute right-5 top-5 h-24 w-24 rounded-full border opacity-15" style={{ borderColor: momentRoutine === "manha" ? "#8c6c36" : "#d3bd83" }} />
            <div className="relative flex items-start justify-between gap-4 pr-10">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[.17em]" style={{ color: momentRoutine === "manha" ? "#806339" : "#cdb77d" }}>
                  {momentRoutine === "manha" ? "Meu Momento com Deus · 5 min" : "Meu Momento com Deus · 3 min"}
                </p>
                <h2 className="mt-2 font-serif text-[25px] font-medium leading-tight">{momentRoutine === "manha" ? "Bom Dia com Deus" : "Boa Noite com Deus"}</h2>
                <p className="mt-2 max-w-[280px] text-sm leading-5 opacity-75">
                  {momentRoutine === "manha" ? "Comece o dia com a Palavra, um passo de cada vez." : "Feche o dia com uma leitura e um instante de quietude."}
                </p>
              </div>
            </div>
            <div className="relative mt-5 flex items-center justify-between border-t pt-3 text-xs font-medium" style={{ borderColor: momentRoutine === "manha" ? "rgba(52,46,36,.17)" : "rgba(241,233,217,.18)" }}>
              <span>{momentDone ? "Momento concluído hoje" : "Gratuito, para ler no seu tempo"}</span>
              <span className="inline-flex items-center gap-1">Abrir <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></span>
            </div>
          </button>
          <button
            type="button"
            onClick={invitation.close}
            aria-label="Dispensar convite do devocional"
            data-testid="dismiss-devotional-invitation"
            className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full hover:bg-black/10 focus-visible:outline-none focus-visible:ring-2"
            style={{ color: momentRoutine === "manha" ? "#342e24" : "#f1e9d9" }}
          >
            <X className="h-5 w-5" />
          </button>
          </div>}
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28 }}
            onClick={onNavigateToBible}
            data-testid="module-bible"
            className="relative overflow-hidden w-full text-left cursor-pointer block"
            style={{
              borderRadius: "11px",
              background: "linear-gradient(158deg, #22668F, #154968)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.13), inset 0 0 0 1px rgba(255,255,255,0.05)",
              padding: "18px 18px 16px",
            }}
          >
            {/* marca d'água */}
            <BookOpen
              className="absolute pointer-events-none"
              style={{ right: 14, top: 14, width: 60, height: 60, opacity: 0.07, color: "#fff" }}
              strokeWidth={1.2}
            />

            {/* ícone + título */}
            <div className="flex items-center gap-3 mb-3">
              <div
                className="flex items-center justify-center flex-shrink-0"
                style={{
                  width: 29, height: 29,
                  borderRadius: 6,
                  background: "rgba(255,255,255,0.15)",
                }}
              >
                <BookOpen className="w-[15px] h-[15px]" style={{ color: "#fff" }} strokeWidth={1.8} />
              </div>
              <h2 className="font-serif text-[17px] font-semibold" style={{ color: "#fff" }}>
                {t("module.bible")}
              </h2>
            </div>

            <p className="text-sm leading-relaxed mb-3" style={{ color: "rgba(255,255,255,0.78)" }}>
              {t("module.bible.desc")}
            </p>

            {/* badges */}
            <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
              {["Hebraico", "Grego", "Strong's"].map((b) => (
                <span
                  key={b}
                  className="px-1.5 py-0.5 rounded-full font-mono text-[9px] uppercase tracking-wide"
                  style={{ background: "rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.90)" }}
                >
                  {b}
                </span>
              ))}
            </div>

            {/* faixa "Continuar de onde parou" */}
            {lastRead && (lastRead.book || lastRead.bookName) && (
              <div
                className="flex items-center justify-between mt-3 -mx-4 -mb-3 px-4 py-2.5 rounded-b-[11px]"
                style={{ background: "rgba(255,255,255,0.13)" }}
              >
                <div>
                  <span
                    className="block font-mono text-[9px] uppercase tracking-[0.12em] mb-0.5"
                    style={{ color: "rgba(255,255,255,0.60)" }}
                  >
                    Continuar de onde parou
                  </span>
                  <span className="font-serif text-sm font-medium" style={{ color: "#fff" }}>
                    {lastRead.bookName || lastRead.book}
                    {lastRead.chapter ? ` ${lastRead.chapter}` : ""}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: "rgba(255,255,255,0.70)" }} />
              </div>
            )}
          </motion.button>

          {/* ── IA e Estudo ─────────────────────────────────────── */}
          <SectionLabel label="IA e Estudo" />
          <div className="grid grid-cols-2 gap-2.5">
            {iaEstudo.map((mod, i) => (
              <ModuleCard key={mod.id} mod={mod} delay={0.04 + i * 0.04} uniform />
            ))}
          </div>

          {/* ── Rotina ──────────────────────────────────────────── */}
          <SectionLabel label="Rotinas" />
          <div className="grid grid-cols-2 gap-2.5">
            {rotina.map((mod, i) => (
              <ModuleCard key={mod.id} mod={mod} delay={0.20 + i * 0.04} uniform />
            ))}
          </div>

          {/* ── Conhecimento ─────────────────────────────────────── */}
          <SectionLabel label="Conhecimento" />
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: 0.4 }}
            onClick={onNavigateToLibrary}
            data-testid="module-library"
            className="relative overflow-hidden w-full text-left cursor-pointer block"
            style={{
              borderRadius: "11px",
              /* Cor couro exclusiva da Biblioteca — nenhum outro módulo usa marrom */
              background: "linear-gradient(158deg, #5C4632, #3F2F21)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.13), inset 0 0 0 1px rgba(255,255,255,0.05)",
              padding: "18px 18px 16px",
            }}
          >
            {/* marca d'água */}
            <BookMarked
              className="absolute pointer-events-none"
              style={{ right: 14, top: 14, width: 60, height: 60, opacity: 0.07, color: "#fff" }}
              strokeWidth={1.2}
            />

            {/* ícone + título */}
            <div className="flex items-center gap-3 mb-3">
              <div
                className="flex items-center justify-center flex-shrink-0"
                style={{
                  width: 29, height: 29,
                  borderRadius: 6,
                  background: "rgba(255,255,255,0.15)",
                }}
              >
                <BookMarked className="w-[15px] h-[15px]" style={{ color: "#fff" }} strokeWidth={1.8} />
              </div>
              <h2 className="font-serif text-[17px] font-semibold" style={{ color: "#fff" }}>
                Biblioteca
              </h2>
            </div>

            <p className="text-sm leading-relaxed mb-0.5" style={{ color: "rgba(255,255,255,0.78)" }}>
              Livros para ler dentro do app
            </p>

            {/* faixa "Continuar de onde parou" */}
            {lastBook?.bookTitle && (
              <div
                className="flex items-center justify-between mt-3 -mx-4 -mb-3 px-4 py-2.5 rounded-b-[11px]"
                style={{ background: "rgba(255,255,255,0.13)" }}
              >
                <div>
                  <span
                    className="block font-mono text-[9px] uppercase tracking-[0.12em] mb-0.5"
                    style={{ color: "rgba(255,255,255,0.60)" }}
                  >
                    Continuar de onde parou
                  </span>
                  <span className="font-serif text-sm font-medium" style={{ color: "#fff" }}>
                    {lastBook.bookTitle}
                    {lastBook.globalPage
                      ? ` — Página ${lastBook.globalPage}`
                      : lastBook.currentChapter
                        ? ` — Capítulo ${lastBook.currentChapter}`
                        : ""}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: "rgba(255,255,255,0.70)" }} />
              </div>
            )}
          </motion.button>

          {/* ── Admin (condicional) ──────────────────────────────── */}
          {isAdmin && (
            <div className="mt-2.5">
              <ModuleCard
                mod={{
                  id: "admin",
                  title: t("module.admin"),
                  desc: t("module.admin.desc"),
                  icon: Shield,
                  from: "#7A2733", to: "#5E1D28",
                  badge: "Admin",
                  onClick: onNavigateToAdmin,
                  testId: "module-admin",
                }}
                delay={0.44}
              />
            </div>
          )}

          {/* ── Banner de assinatura ──────────────────────────────── */}
          {!subscriptionStatus?.hasPremium && !subscriptionStatus?.hasLifetime && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: 0.46 }}
              className="mt-5"
            >
              <button
                type="button"
                onClick={onNavigateToSubscriptions}
                data-testid="banner-upgrade"
                className="w-full text-left cursor-pointer"
                style={{
                  borderRadius: "11px",
                  background: "linear-gradient(158deg, #1F5C74, #123F53)",
                  boxShadow:
                    "inset 0 1px 0 rgba(255,255,255,0.13), inset 0 0 0 1px rgba(255,255,255,0.05)",
                  padding: "16px",
                }}
              >
                <div className="flex items-center gap-3">
                  <Crown
                    className="w-5 h-5 flex-shrink-0"
                    style={{ color: "rgba(255,255,255,0.80)" }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-sm font-semibold" style={{ color: "#F2F6FA" }}>
                      {t("dashboard.unlockAll")}
                    </p>
                    <p className="text-xs truncate mt-0.5" style={{ color: "rgba(255,255,255,0.70)" }}>
                      {t("dashboard.unlockAllDesc")}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold"
                    style={{ background: "#F2F6FA", color: "#123F53" }}
                    onClick={onNavigateToSubscriptions}
                    data-testid="button-see-plans"
                  >
                    Ver planos
                  </button>
                </div>
              </button>
            </motion.div>
          )}

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center text-xs pb-2 mt-5"
            style={{ color: "#647B90" }}
          >
            {t("dashboard.tapToStart")}
          </motion.p>
        </div>
      </ScrollArea>
    </div>
  );
}
