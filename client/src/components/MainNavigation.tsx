import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { getApiUrl } from "@/lib/queryClient";
import { initializeIAP } from "@/lib/inAppPurchases";
import { SplashScreen } from "./SplashScreen";
import { LoginScreen } from "./LoginScreen";
import { RegisterScreen } from "./RegisterScreen";
import { BibleReader } from "./BibleReader";
import { SubscriptionScreen } from "./SubscriptionScreen";
import { SettingsScreen } from "./SettingsScreen";
import { AIHistoryScreen } from "./AIHistoryScreen";
import { AdminPanel } from "./AdminPanel";
import { Dashboard } from "./Dashboard";
import { PrayerMode } from "./PrayerMode";
import { ProfessorScreen } from "./ProfessorScreen";
import { AIModesScreen } from "./AIModesScreen";
import { PlansProgressScreen } from "./PlansProgressScreen";
import { ReadingPlanDayViewWrapper } from "./ReadingPlanDayViewWrapper";
import { AgendaScreen } from "./AgendaScreen";
import { RecordingsScreen } from "./RecordingsScreen";
import { StudyModulesScreen } from "./StudyModulesScreen";
import { ModuleDetailScreen } from "./ModuleDetailScreen";
import { LessonScreen } from "./LessonScreen";
import { LibraryScreen } from "./LibraryScreen";
import { BookScreen } from "./BookScreen";
import { BookReaderScreen } from "./BookReaderScreen";
import { ThemeProvider } from "./ThemeProvider";
import { ForgotPassword } from "@/pages/ForgotPassword";
import { ResetPassword } from "@/pages/ResetPassword";
import { ExitConfirmDialog } from "./ExitConfirmDialog";
import { BookmarksPage } from "@/pages/BookmarksPage";
import { NavigationProvider, useNavigation } from "@/contexts/NavigationContext";
import { getDeviceId, getPlatform, getLocale } from "@/hooks/use-device-id";
import { RequireAuthScreen } from "./RequireAuthScreen";
import { PaymentSuccess, PaymentError, PaymentPending } from "@/pages/PaymentResult";
import { PrivacyPolicy } from "@/pages/PrivacyPolicy";
import { TermsOfUse } from "@/pages/TermsOfUse";
import { isNative } from "@/lib/capacitor";
import type { MelPosition } from "@shared/mel";
import { DailyDevotionalScreen } from "@/components/mel/DailyDevotionalScreen";
import { MelStage } from "@/components/mel/MelStage";
import { MelPushProvider } from "@/hooks/useMelPush";
import {
  subscribeToMelPushDestination,
  subscribeToMelPushMessage,
  type MelPushDestination,
  type MelPushMessage,
} from "@/lib/mel-push";
import { Bell, X } from "lucide-react";

const AtlasScreen = lazy(() => import("./atlas/AtlasScreen").then((module) => ({ default: module.AtlasScreen })));

function NavigationContent() {
  const { 
    currentScreen, 
    navigate, 
    goBack,
    navigateToVerse,
    selectedModuleId,
    setSelectedModuleId,
    selectedLessonId,
    setSelectedLessonId,
    selectedTrackLevel,
    setSelectedTrackLevel,
    selectedBookId,
    setSelectedBookId,
    selectedBookTitle,
    setSelectedBookTitle,
    selectedChapterNum,
    setSelectedChapterNum,
    libraryPreview,
    setLibraryPreview,
  } = useNavigation();
  
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();
  
  // State for navigating to a specific Bible location.
  
  // State for selected reading plan
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedLessonVideoSeconds, setSelectedLessonVideoSeconds] = useState<number | undefined>();
  const [melDevotionalDate, setMelDevotionalDate] = useState<string | undefined>();
  const [bibleNavTarget, setBibleNavTarget] = useState<{ book: string; chapter: number; verse?: number; versionCode?: string } | null>(null);

  const handleBackToLoginFromReset = () => {
    setLocation("/");
    navigate("login");
  };

  useEffect(() => {
    if (!isNative && currentScreen === "login") {
      setLocation("/sign-in");
    }
    if (!isNative && currentScreen === "register") {
      setLocation("/sign-up");
    }
    if (!isNative && (currentScreen === "forgot-password" || currentScreen === "reset-password")) {
      setLocation("/sign-in");
    }
  }, [currentScreen, setLocation]);

  useEffect(() => {
    const measureHeaderHeight = () => {
      const headerEl = document.querySelector('header') as HTMLElement | null;
      if (!headerEl) {
        document.documentElement.style.setProperty('--mobile-header-height', '56px');
        return;
      }
      
      const height = headerEl.offsetHeight || 56;
      document.documentElement.style.setProperty('--mobile-header-height', `${height}px`);
    };

    const timer = setTimeout(measureHeaderHeight, 100);
    window.addEventListener('resize', measureHeaderHeight);

    // Pré-inicializar store IAP logo no boot (Android/iOS).
    // Isso garante que o CdvPurchase já esteja pronto quando o usuário
    // tentar comprar, evitando timeout na hora da compra.
    // Delay de 2s para o bridge nativo Capacitor terminar de carregar primeiro.
    const iapTimer = setTimeout(() => {
      initializeIAP();
    }, 2000);
    
    return () => {
      clearTimeout(timer);
      clearTimeout(iapTimer);
      window.removeEventListener('resize', measureHeaderHeight);
    };
  }, []);

  useEffect(() => {
    if (location.includes("reset-password")) {
      if (isNative) navigate("reset-password");
      else setLocation("/sign-in");
    }
    if (!isNative && location.includes("forgot-password")) {
      setLocation("/sign-in");
    }
  }, [location, navigate]);

  // Dev-only: deep link para abrir uma tela direto via query params
  // Ex.: /?devScreen=library-reader&bookId=<id>&ch=1
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const params = new URLSearchParams(window.location.search);
    const devScreen = params.get("devScreen");
    if (!devScreen) return;
    // Dev-only: simular largura estreita (?devWidth=360)
    const devWidth = parseInt(params.get("devWidth") ?? "", 10);
    if (Number.isFinite(devWidth) && devWidth >= 280 && devWidth <= 1000) {
      const root = document.getElementById("root");
      if (root) {
        root.style.width = `${devWidth}px`;
        root.style.margin = "0 auto";
        root.style.position = "relative";
        root.style.outline = "1px dashed rgba(255,255,255,0.2)";
      }
    }

    if (devScreen === "library-reader") {
      const bookId = params.get("bookId");
      const chParsed = parseInt(params.get("ch") ?? "1", 10);
      const ch = Number.isFinite(chParsed) && chParsed >= 1 ? chParsed : 1;
      if (bookId) {
        setSelectedBookId(bookId);
        setSelectedBookTitle(params.get("title") ?? "");
        setSelectedChapterNum(ch);
        navigate("library-reader");
      } else {
        navigate("dashboard");
      }
    } else if (["dashboard", "library", "bible", "study"].includes(devScreen)) {
      navigate(devScreen as Parameters<typeof navigate>[0]);
    } else {
      navigate("dashboard");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle payment result pages from Mercado Pago redirect
  const isPaymentPage = location.startsWith("/pagamento/");
  const paymentStatus = isPaymentPage ? location.split("/pagamento/")[1]?.split("?")[0] : null;

  useEffect(() => {
    if (!isLoading) {
      if (currentScreen === "splash") {
        // Dev-only: deep link tem prioridade sobre o redirect padrão
        if (import.meta.env.DEV && new URLSearchParams(window.location.search).has("devScreen")) {
          return;
        }
        // All users (logged or guest) go to dashboard
        navigate("dashboard");
      }
      if (currentScreen === "admin" && !user) {
        navigate("login");
      }
    }
  }, [isLoading, user, currentScreen, navigate]);

  // The visual companion uses the same navigation as the Phase 1 card.
  const handleMelContinue = useCallback((position: MelPosition) => {
    if (position.kind === "bible") {
      setBibleNavTarget({
        book: position.book,
        chapter: position.chapter,
        verse: position.verse,
        versionCode: position.versionCode,
      });
      navigate("bible");
    } else if (position.kind === "devotional") {
      setMelDevotionalDate(position.devotionalDate);
      navigate("mel-devotional");
    } else {
      setSelectedModuleId(position.moduleId);
      setSelectedLessonId(position.lessonId);
      setSelectedTrackLevel(position.trackLevel);
      setSelectedLessonVideoSeconds(position.videoSeconds);
      navigate("lesson");
    }
  }, [navigate, setSelectedModuleId, setSelectedLessonId, setSelectedTrackLevel]);

  useEffect(() => {
    const userId = user?.id;
    if (!userId) return;
    return subscribeToMelPushDestination(userId, (destination: MelPushDestination) => {
      if (user?.id !== userId) return;
      handleMelContinue(destination);
    });
  }, [handleMelContinue, user?.id]);

  const handleMelDevotional = useCallback((date: string) => {
    setMelDevotionalDate(date);
    navigate("mel-devotional");
  }, [navigate]);

  // ── Early returns SEMPRE depois de todos os hooks (Rules of Hooks) ──
  // Render payment result pages directly (bypass normal navigation)
  if (isPaymentPage && paymentStatus) {
    if (paymentStatus === "sucesso") return <PaymentSuccess />;
    if (paymentStatus === "erro") return <PaymentError />;
    if (paymentStatus === "pendente") return <PaymentPending />;
  }

  // Página de reset de senha — early return direto pelo path da URL para
  // evitar race condition com o useEffect de autenticação que poderia
  // redirecionar para "dashboard" antes da tela de reset ser exibida.
  // Idêntico ao padrão usado por /privacidade e /termos.
  if (isNative && (location === "/reset-password" || location.startsWith("/reset-password?"))) {
    return <ResetPassword onBackToLogin={handleBackToLoginFromReset} />;
  }

  // Páginas legais públicas (acessíveis sem login — exigência App Store/Play Store)
  if (location === "/privacidade" || location.startsWith("/privacidade?")) {
    return <PrivacyPolicy onBack={() => setLocation("/")} />;
  }
  if (location === "/termos" || location.startsWith("/termos?")) {
    return <TermsOfUse onBack={() => setLocation("/")} />;
  }

  return (
    <>
      {isNative && currentScreen === "login" && (
        <LoginScreen
          onLogin={() => navigate("dashboard")}
          onNavigateToRegister={() => navigate("register")}
          onNavigateToForgotPassword={() => navigate("forgot-password")}
        />
      )}
      {isNative && currentScreen === "register" && (
        <RegisterScreen
          onRegister={() => navigate("dashboard")}
          onNavigateToLogin={() => navigate("login")}
        />
      )}
      {isNative && currentScreen === "forgot-password" && (
        <ForgotPassword
          onBackToLogin={() => goBack()}
        />
      )}
      {isNative && currentScreen === "reset-password" && (
        <ResetPassword
          onBackToLogin={handleBackToLoginFromReset}
        />
      )}
      {currentScreen === "dashboard" && (
        <Dashboard
          onNavigateToBible={() => {
            setBibleNavTarget(null);
            navigate("bible");
          }}
          onNavigateToPrayer={() => navigate("prayer")}
          onNavigateToProfessor={() => navigate("professor")}
          onNavigateToAIModes={() => navigate("ai-modes")}
          onNavigateToPlansProgress={() => navigate("plans-progress")}
          onNavigateToCalendar={() => navigate("calendar")}
          onNavigateToSubscriptions={() => navigate("subscriptions")}
          onNavigateToRecordings={() => navigate("recordings")}
          onNavigateToAdmin={() => navigate("admin")}
          onNavigateToProfessorPremium={() => navigate("professor-premium")}
          onNavigateToLogin={() => navigate("login")}
          onNavigateToSettings={() => navigate("settings")}
          onNavigateToLibrary={() => navigate("library")}
          onNavigateToAtlas={() => navigate("atlas")}
          onMelContinue={handleMelContinue}
          onMelDevotional={handleMelDevotional}
        />
      )}
      {currentScreen === "mel-devotional" && (
        <DailyDevotionalScreen
          date={melDevotionalDate}
          onBack={() => goBack()}
          onSignIn={() => navigate("login")}
        />
      )}
      {currentScreen === "atlas" && (
        <Suspense fallback={<div className="min-h-screen bg-background p-6 text-muted-foreground">Carregando atlas…</div>}>
          <AtlasScreen onBack={() => goBack()} onSubscribe={() => navigate("subscriptions")} onLogin={() => navigate("login")} navigateToVerse={(book, chapter, verse) => navigateToVerse(book, chapter, verse ?? 1)} />
        </Suspense>
      )}
      {currentScreen === "recordings" && (
        <RequireAuthScreen featureName="Gravações" onAuthCancel={() => goBack()}>
          <RecordingsScreen onBack={() => goBack()} />
        </RequireAuthScreen>
      )}
      {currentScreen === "bible" && (
        <BibleReader 
          onNavigateToSubscriptions={() => navigate("subscriptions")}
          onNavigateToSettings={() => navigate("settings")}
          onNavigateToHistory={() => navigate("bookmarks")}
          onNavigateToAdmin={() => navigate("admin")}
          onNavigateToLogin={() => navigate("login")}
          onNavigateToDashboard={() => {
            setBibleNavTarget(null);
            goBack();
          }}
          initialBook={bibleNavTarget?.book}
          initialChapter={bibleNavTarget?.chapter}
          initialVerse={bibleNavTarget?.verse}
          initialVersion={bibleNavTarget?.versionCode}
        />
      )}
      {currentScreen === "bookmarks" && (
        <RequireAuthScreen featureName="Marcações" onAuthCancel={() => goBack()}>
          <BookmarksPage 
            onBack={() => goBack()} 
          />
        </RequireAuthScreen>
      )}
      {currentScreen === "professor" && (
        <RequireAuthScreen featureName="Professor IA" onAuthCancel={() => goBack()}>
          <ProfessorScreen onBack={() => goBack()} />
        </RequireAuthScreen>
      )}
      {currentScreen === "ai-modes" && (
        <RequireAuthScreen featureName="Modos de IA" onAuthCancel={() => goBack()}>
          <AIModesScreen 
            onBack={() => goBack()} 
            onNavigateToSubscriptions={() => navigate("subscriptions")}
          />
        </RequireAuthScreen>
      )}
      {currentScreen === "plans-progress" && (
        <RequireAuthScreen featureName="Progresso de Leitura" onAuthCancel={() => goBack()}>
          <PlansProgressScreen 
            onBack={() => goBack()} 
            onNavigateToBible={(book?: string, chapter?: number) => {
              if (book && chapter) {
                setBibleNavTarget({ book, chapter });
              } else {
                setBibleNavTarget(null);
              }
              navigate("bible");
            }}
            onOpenMyPlan={(planId: string) => {
              setSelectedPlanId(planId);
              navigate("plan-day");
            }}
          />
        </RequireAuthScreen>
      )}
      {currentScreen === "plan-day" && selectedPlanId && (
        <RequireAuthScreen featureName="Plano de Leitura" onAuthCancel={() => goBack()}>
          <ReadingPlanDayViewWrapper
            planId={selectedPlanId}
            onBack={() => goBack()}
            onNavigateToChapter={(book: string, chapter: number) => {
              setBibleNavTarget({ book, chapter });
              navigate("bible");
            }}
            onAskAI={(question: string) => {
              navigate("professor");
            }}
          />
        </RequireAuthScreen>
      )}
      {currentScreen === "calendar" && (
        <RequireAuthScreen featureName="Agenda" onAuthCancel={() => goBack()}>
          <AgendaScreen onBack={() => goBack()} />
        </RequireAuthScreen>
      )}
      {currentScreen === "prayer" && (
        <RequireAuthScreen featureName="Modo Oração" onAuthCancel={() => goBack()}>
          <PrayerMode onBack={() => goBack()} />
        </RequireAuthScreen>
      )}
      {currentScreen === "subscriptions" && (
        <RequireAuthScreen featureName="Assinaturas" onAuthCancel={() => goBack()}>
          <SubscriptionScreen onBack={() => goBack()} />
        </RequireAuthScreen>
      )}
      {currentScreen === "settings" && (
        <RequireAuthScreen featureName="Configurações" onAuthCancel={() => goBack()}>
          <SettingsScreen 
            onBack={() => goBack()}
            onNavigateToSubscriptions={() => navigate("subscriptions")}
          />
        </RequireAuthScreen>
      )}
      {currentScreen === "history" && (
        <RequireAuthScreen featureName="Histórico de IA" onAuthCancel={() => goBack()}>
          <AIHistoryScreen onBack={() => goBack()} />
        </RequireAuthScreen>
      )}
      {currentScreen === "admin" && (
        <RequireAuthScreen featureName="Painel Admin" onAuthCancel={() => goBack()}>
          <AdminPanel onBack={() => goBack()} />
        </RequireAuthScreen>
      )}
      {currentScreen === "professor-premium" && (
        <StudyModulesScreen 
          onBack={() => goBack()}
          onNavigateToModule={(moduleId) => {
            setSelectedModuleId(moduleId);
            navigate("module-detail");
          }}
          onNavigateToSubscriptions={() => navigate("subscriptions")}
        />
      )}
      {currentScreen === "module-detail" && selectedModuleId && (
        <ModuleDetailScreen
          moduleId={selectedModuleId}
          onBack={() => {
            goBack();
          }}
          onNavigateToLesson={(lessonId, trackLevel) => {
            setSelectedLessonId(lessonId);
            setSelectedTrackLevel(trackLevel);
            setSelectedLessonVideoSeconds(undefined);
            navigate("lesson");
          }}
          onNavigateToSubscriptions={() => navigate("subscriptions")}
        />
      )}
      {currentScreen === "lesson" && selectedLessonId && (
        <LessonScreen
          lessonId={selectedLessonId}
          trackLevel={selectedTrackLevel}
          moduleId={selectedModuleId ?? undefined}
          initialVideoSeconds={selectedLessonVideoSeconds}
          onBack={() => {
            setSelectedLessonId(null);
            setSelectedLessonVideoSeconds(undefined);
            goBack();
          }}
        />
      )}
      {currentScreen === "library" && (
        <LibraryScreen
          onBack={() => goBack()}
          onNavigateToBook={(bookId, bookTitle) => {
            setSelectedBookId(bookId);
            setSelectedBookTitle(bookTitle);
            navigate("library-book");
          }}
          onNavigateToReader={(bookId, chapterNum, bookTitle) => {
            setSelectedBookId(bookId);
            setSelectedBookTitle(bookTitle);
            setSelectedChapterNum(chapterNum);
            setLibraryPreview(false);
            navigate("library-reader");
          }}
        />
      )}
      {currentScreen === "library-book" && selectedBookId && (
        <BookScreen
          bookId={selectedBookId}
          onBack={() => goBack()}
          onNavigateToReader={(bookId, chapterNum, bookTitle) => {
            setSelectedBookId(bookId);
            setSelectedBookTitle(bookTitle);
            setSelectedChapterNum(chapterNum);
            setLibraryPreview(false);
            navigate("library-reader");
          }}
          onNavigateToSubscriptions={() => navigate("subscriptions")}
        />
      )}
      {currentScreen === "library-reader" && selectedBookId && selectedChapterNum !== null && (
        <BookReaderScreen
          bookId={selectedBookId}
          bookTitle={selectedBookTitle ?? ""}
          chapterNum={selectedChapterNum}
          preview={libraryPreview}
          onBack={() => goBack()}
          onNavigateToBible={(book, chapter, verse) => {
            // navigateToVerse sets targetVerse + navigates to "bible"
            // BibleReader scrolls to [data-verse="${verse}"] on mount
            navigateToVerse(book, chapter, verse ?? 1);
          }}
          onNavigateToChapter={(chapterNum) => {
            setSelectedChapterNum(chapterNum);
            navigate("library-reader");
          }}
          onNavigateToSubscriptions={() => navigate("subscriptions")}
        />
      )}
      <MelStage
        currentScreen={currentScreen}
        onContinue={handleMelContinue}
        onOpenDevotional={handleMelDevotional}
      />
      <MelPushNotice onContinue={handleMelContinue} />
    </>
  );
}

function MelPushNotice({ onContinue }: { onContinue: (destination: MelPosition) => void }) {
  const { user } = useAuth();
  const [message, setMessage] = useState<MelPushMessage | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setMessage(null);
      return;
    }

    return subscribeToMelPushMessage(user.id, (nextMessage) => {
      setMessage(nextMessage);
    });
  }, [user?.id]);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(null), 20_000);
    return () => window.clearTimeout(timer);
  }, [message]);

  if (!message || !user || message.userId !== user.id) return null;

  return (
    <div
      className="fixed inset-x-3 top-[calc(env(safe-area-inset-top)+0.75rem)] z-[60] mx-auto max-w-lg"
      role="status"
      aria-live="polite"
      data-testid="mel-push-notice"
    >
      <div className="rounded-2xl border bg-card p-4 shadow-xl">
        <div className="flex items-start gap-3">
          <Bell className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          <div className="min-w-0 flex-1 space-y-1">
            <p className="font-semibold">{message.title}</p>
            {message.body && <p className="text-sm text-muted-foreground">{message.body}</p>}
            {message.destination && (
              <button
                type="button"
                className="pt-1 text-sm font-semibold text-primary underline-offset-4 hover:underline"
                onClick={() => {
                  onContinue(message.destination!);
                  setMessage(null);
                }}
              >
                Continuar leitura
              </button>
            )}
          </div>
          <button
            type="button"
            className="rounded p-1 text-muted-foreground hover:bg-muted"
            aria-label="Fechar recado da Mel"
            onClick={() => setMessage(null)}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function MainNavigation() {
  const [showSplash, setShowSplash] = useState(() => {
    try {
      if (import.meta.env.DEV && new URLSearchParams(window.location.search).has("devScreen")) {
        return false;
      }
      const hasVisited = sessionStorage.getItem('hasVisitedApp');
      return !hasVisited;
    } catch {
      return true;
    }
  });
  const [showExitDialog, setShowExitDialog] = useState(false);
  const { isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (showSplash) {
      const timer = setTimeout(() => {
        setShowSplash(false);
        try {
          sessionStorage.setItem('hasVisitedApp', 'true');
        } catch {
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showSplash]);

  useEffect(() => {
    const registerGuest = async () => {
      try {
        const deviceId = getDeviceId();
        const platform = getPlatform();
        const locale = getLocale();
        
        await fetch(getApiUrl('/api/guest/register'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceId, platform, locale })
        });
      } catch (error) {
        console.warn('Erro ao registrar guest:', error);
      }
    };
    
    if (!showSplash && !isLoading) {
      registerGuest();
    }
  }, [showSplash, isLoading]);

  const handleExitRequest = useCallback(() => {
    setShowExitDialog(true);
  }, []);

  const handleExitConfirm = useCallback(() => {
    setShowExitDialog(false);
    if (typeof window !== 'undefined' && (window as any).Android?.exitApp) {
      (window as any).Android.exitApp();
    } else if (typeof window !== 'undefined' && window.close) {
      window.close();
    }
  }, []);

  return (
    <ThemeProvider>
      <MelPushProvider>
      {/* Reset de senha: renderizado diretamente pelo path da URL, ignorando
          splash e loading de auth — o usuário chegou via link do email e
          precisa ver o formulário imediatamente, independente do estado do app. */}
      {isNative && (location === "/reset-password" || location.startsWith("/reset-password?")) ? (
        <ResetPassword onBackToLogin={() => setLocation("/")} />
      ) : (showSplash || isLoading) ? (
        <SplashScreen />
      ) : (
        <NavigationProvider onExitRequest={handleExitRequest}>
          <NavigationContent />
          <ExitConfirmDialog
            open={showExitDialog}
            onOpenChange={setShowExitDialog}
            onConfirm={handleExitConfirm}
          />
        </NavigationProvider>
      )}
      </MelPushProvider>
    </ThemeProvider>
  );
}
