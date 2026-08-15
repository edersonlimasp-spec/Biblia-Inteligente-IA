import { useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getDeviceId } from "@/hooks/use-device-id";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LanguageSelector } from "@/components/LanguageSelector";
import {
  BookOpen, Brain, TrendingUp,
  HandHeart, Calendar, CreditCard, Shield, GraduationCap,
  Mic, Library, LogIn, Settings, Crown, Gem, Infinity,
  ChevronRight, LucideIcon, BookMarked,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { trackAppOpen, trackPageView } from "@/lib/tracking";

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
}: DashboardProps) {
  const { user, isSuperAdmin } = useAuth();
  const { t } = useLanguage();
  const deviceId = getDeviceId();
  const isAdmin = user?.role === "admin" || user?.role === "super_admin" || isSuperAdmin;

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
  ], [t, onNavigateToProfessor, onNavigateToAIModes, onNavigateToProfessorPremium, onNavigateToPlansProgress]);

  const rotina: ModuleDef[] = useMemo(() => [
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
      id: "subscriptions", title: t("module.subscriptions"),
      desc: t("module.subscriptions.desc"),
      icon: CreditCard, from: "#3A4657", to: "#2A3441",
      onClick: onNavigateToSubscriptions, testId: "module-subscriptions",
    },
  ], [t, onNavigateToPrayer, onNavigateToCalendar, onNavigateToRecordings, onNavigateToSubscriptions]);

  /* ─── render ─────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-background">
      {/* cabeçalho */}
      <header
        className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
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
          style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom, 0px))" }}
        >
          {/* ── Cartão da Bíblia (largura total) ────────────────── */}
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
          <SectionLabel label="Rotina" />
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
