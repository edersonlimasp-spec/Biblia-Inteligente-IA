import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
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
import { AgendaScreen } from "./AgendaScreen";
import { RecordingsScreen } from "./RecordingsScreen";
import { StudyModulesScreen } from "./StudyModulesScreen";
import { ModuleDetailScreen } from "./ModuleDetailScreen";
import { LessonScreen } from "./LessonScreen";
import { ThemeProvider } from "./ThemeProvider";
import { ForgotPassword } from "@/pages/ForgotPassword";
import { ResetPassword } from "@/pages/ResetPassword";
import { ExitConfirmDialog } from "./ExitConfirmDialog";
import { NavigationProvider, useNavigation } from "@/contexts/NavigationContext";
import { getDeviceId, getPlatform, getLocale } from "@/hooks/use-device-id";

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
  const [location] = useLocation();

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
  }, [location, navigate]);

  useEffect(() => {
    if (!isLoading) {
      if (currentScreen === "splash") {
        navigate("dashboard");
      }
      if (currentScreen === "admin" && !user) {
        navigate("login");
      }
    }
  }, [isLoading, user, currentScreen, navigate]);

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
          onBackToLogin={() => navigate("login")}
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
        />
      )}
      {currentScreen === "recordings" && (
        <RecordingsScreen onBack={() => goBack()} />
      )}
      {currentScreen === "bible" && (
        <BibleReader 
          onNavigateToSubscriptions={() => navigate("subscriptions")}
          onNavigateToSettings={() => navigate("settings")}
          onNavigateToHistory={() => navigate("history")}
          onNavigateToAdmin={() => navigate("admin")}
          onNavigateToLogin={() => navigate("login")}
          onNavigateToDashboard={() => goBack()}
        />
      )}
      {currentScreen === "professor" && (
        <ProfessorScreen onBack={() => goBack()} />
      )}
      {currentScreen === "ai-modes" && (
        <AIModesScreen 
          onBack={() => goBack()} 
          onNavigateToSubscriptions={() => navigate("subscriptions")}
        />
      )}
      {currentScreen === "plans-progress" && (
        <PlansProgressScreen 
          onBack={() => goBack()} 
          onNavigateToBible={() => navigate("bible")}
        />
      )}
      {currentScreen === "calendar" && (
        <AgendaScreen onBack={() => goBack()} />
      )}
      {currentScreen === "prayer" && (
        <PrayerMode onBack={() => goBack()} />
      )}
      {currentScreen === "achievements" && (
        <AchievementsScreen onBack={() => goBack()} />
      )}
      {currentScreen === "games" && (
        <BibleGames onBack={() => goBack()} />
      )}
      {currentScreen === "subscriptions" && (
        <SubscriptionScreen onBack={() => goBack()} />
      )}
      {currentScreen === "settings" && (
        <SettingsScreen 
          onBack={() => goBack()}
          onNavigateToSubscriptions={() => navigate("subscriptions")}
        />
      )}
      {currentScreen === "history" && (
        <AIHistoryScreen onBack={() => goBack()} />
      )}
      {currentScreen === "admin" && (
        <AdminPanel onBack={() => goBack()} />
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
        
        await fetch('/api/guest/register', {
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

  if (showSplash || isLoading) {
    return <SplashScreen />;
  }

  return (
    <ThemeProvider>
      <NavigationProvider onExitRequest={handleExitRequest}>
        <NavigationContent />
        <ExitConfirmDialog
          open={showExitDialog}
          onOpenChange={setShowExitDialog}
          onConfirm={handleExitConfirm}
        />
      </NavigationProvider>
    </ThemeProvider>
  );
}
