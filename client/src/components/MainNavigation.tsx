import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { getApiUrl } from "@/lib/queryClient";
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
import { AchievementsScreen } from "./AchievementsScreen";
import { BibleGames } from "./BibleGames";
import { ProfessorScreen } from "./ProfessorScreen";
import { AIModesScreen } from "./AIModesScreen";
import { PlansProgressScreen } from "./PlansProgressScreen";
import { ReadingPlanDayViewWrapper } from "./ReadingPlanDayViewWrapper";
import { AgendaScreen } from "./AgendaScreen";
import { RecordingsScreen } from "./RecordingsScreen";
import { StudyModulesScreen } from "./StudyModulesScreen";
import { ModuleDetailScreen } from "./ModuleDetailScreen";
import { LessonScreen } from "./LessonScreen";
import { ThemeProvider } from "./ThemeProvider";
import { ForgotPassword } from "@/pages/ForgotPassword";
import { ResetPassword } from "@/pages/ResetPassword";
import { ExitConfirmDialog } from "./ExitConfirmDialog";
import { BookmarksPage } from "@/pages/BookmarksPage";
import { NavigationProvider, useNavigation } from "@/contexts/NavigationContext";
import { getDeviceId, getPlatform, getLocale } from "@/hooks/use-device-id";
import { RequireAuthScreen } from "./RequireAuthScreen";
import { PaymentSuccess, PaymentError, PaymentPending } from "@/pages/PaymentResult";
import { InstallPage } from "@/pages/InstallPage";
import { PrivacyPolicy } from "@/pages/PrivacyPolicy";
import { TermsOfUse } from "@/pages/TermsOfUse";

function NavigationContent() {
  const { 
    currentScreen, 
    navigate, 
    goBack,
    selectedModuleId,
    setSelectedModuleId,
    selectedLessonId,
    setSelectedLessonId,
    selectedTrackLevel,
    setSelectedTrackLevel,
  } = useNavigation();
  
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();
  
  // State for navigating to specific Bible chapter from reading plans
  const [bibleNavTarget, setBibleNavTarget] = useState<{ book: string; chapter: number } | null>(null);
  
  // State for selected reading plan
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const handleBackToLoginFromReset = () => {
    setLocation("/");
    navigate("login");
  };

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
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', measureHeaderHeight);
    };
  }, []);

  useEffect(() => {
    if (location.includes("reset-password")) {
      navigate("reset-password");
    }
    if (location === "/install" || location.startsWith("/install?")) {
      navigate("install");
    }
  }, [location, navigate]);

  // Handle payment result pages from Mercado Pago redirect
  const isPaymentPage = location.startsWith("/pagamento/");
  const paymentStatus = isPaymentPage ? location.split("/pagamento/")[1]?.split("?")[0] : null;

  useEffect(() => {
    if (!isLoading) {
      if (currentScreen === "splash") {
        // All users (logged or guest) go to dashboard
        navigate("dashboard");
      }
      if (currentScreen === "admin" && !user) {
        navigate("login");
      }
    }
  }, [isLoading, user, currentScreen, navigate]);

  // ── Early returns SEMPRE depois de todos os hooks (Rules of Hooks) ──
  // Render payment result pages directly (bypass normal navigation)
  if (isPaymentPage && paymentStatus) {
    if (paymentStatus === "sucesso") return <PaymentSuccess />;
    if (paymentStatus === "erro") return <PaymentError />;
    if (paymentStatus === "pendente") return <PaymentPending />;
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
      {currentScreen === "login" && (
        <LoginScreen
          onLogin={() => navigate("dashboard")}
          onNavigateToRegister={() => navigate("register")}
          onNavigateToForgotPassword={() => navigate("forgot-password")}
        />
      )}
      {currentScreen === "register" && (
        <RegisterScreen
          onRegister={() => navigate("dashboard")}
          onNavigateToLogin={() => navigate("login")}
        />
      )}
      {currentScreen === "forgot-password" && (
        <ForgotPassword
          onBackToLogin={() => goBack()}
        />
      )}
      {currentScreen === "reset-password" && (
        <ResetPassword
          onBackToLogin={handleBackToLoginFromReset}
        />
      )}
      {currentScreen === "dashboard" && (
        <Dashboard
          onNavigateToBible={() => navigate("bible")}
          onNavigateToPrayer={() => navigate("prayer")}
          onNavigateToAchievements={() => navigate("achievements")}
          onNavigateToGames={() => navigate("games")}
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
          onNavigateToInstall={() => navigate("install")}
        />
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
      {currentScreen === "achievements" && (
        <RequireAuthScreen featureName="Conquistas" onAuthCancel={() => goBack()}>
          <AchievementsScreen onBack={() => goBack()} />
        </RequireAuthScreen>
      )}
      {currentScreen === "games" && (
        <RequireAuthScreen featureName="Jogos Bíblicos" onAuthCancel={() => goBack()}>
          <BibleGames onBack={() => goBack()} />
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
            navigate("lesson");
          }}
          onNavigateToSubscriptions={() => navigate("subscriptions")}
        />
      )}
      {currentScreen === "lesson" && selectedLessonId && (
        <LessonScreen
          lessonId={selectedLessonId}
          trackLevel={selectedTrackLevel}
          onBack={() => {
            setSelectedLessonId(null);
            goBack();
          }}
        />
      )}
      {currentScreen === "install" && (
        <InstallPage onBack={() => goBack()} />
      )}
    </>
  );
}

export function MainNavigation() {
  const [showSplash, setShowSplash] = useState(() => {
    try {
      const hasVisited = sessionStorage.getItem('hasVisitedApp');
      return !hasVisited;
    } catch {
      return true;
    }
  });
  const [showExitDialog, setShowExitDialog] = useState(false);
  const { isLoading } = useAuth();

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
      {(showSplash || isLoading) ? (
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
    </ThemeProvider>
  );
}
