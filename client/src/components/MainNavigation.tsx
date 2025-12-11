import { useState, useEffect } from "react";
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
import { ThemeProvider } from "./ThemeProvider";
import { ForgotPassword } from "@/pages/ForgotPassword";
import { ResetPassword } from "@/pages/ResetPassword";
import { getDeviceId, getPlatform, getLocale } from "@/hooks/use-device-id";

type Screen = 
  | "splash"
  | "login"
  | "register"
  | "forgot-password"
  | "reset-password"
  | "dashboard"
  | "bible"
  | "prayer"
  | "achievements"
  | "games"
  | "professor"
  | "ai-modes"
  | "plans-progress"
  | "calendar"
  | "recordings"
  | "subscriptions"
  | "settings"
  | "history"
  | "admin";

export function MainNavigation() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("splash");
  const [showSplash, setShowSplash] = useState(() => {
    try {
      const hasVisited = sessionStorage.getItem('hasVisitedApp');
      return !hasVisited;
    } catch {
      return true;
    }
  });
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
      setCurrentScreen("reset-password");
    }
  }, [location]);

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

  useEffect(() => {
    if (!showSplash && !isLoading) {
      if (currentScreen === "splash") {
        setCurrentScreen("dashboard");
      }
      if (currentScreen === "admin" && !user) {
        setCurrentScreen("login");
      }
    }
  }, [showSplash, isLoading, user, currentScreen]);

  if (showSplash || isLoading) {
    return <SplashScreen />;
  }

  return (
    <ThemeProvider>
      {currentScreen === "login" && (
        <LoginScreen
          onLogin={() => setCurrentScreen("dashboard")}
          onNavigateToRegister={() => setCurrentScreen("register")}
          onNavigateToForgotPassword={() => setCurrentScreen("forgot-password")}
        />
      )}
      {currentScreen === "register" && (
        <RegisterScreen
          onRegister={() => setCurrentScreen("dashboard")}
          onNavigateToLogin={() => setCurrentScreen("login")}
        />
      )}
      {currentScreen === "forgot-password" && (
        <ForgotPassword
          onBackToLogin={() => setCurrentScreen("login")}
        />
      )}
      {currentScreen === "reset-password" && (
        <ResetPassword
          onBackToLogin={() => setCurrentScreen("login")}
        />
      )}
      {currentScreen === "dashboard" && (
        <Dashboard
          onNavigateToBible={() => setCurrentScreen("bible")}
          onNavigateToPrayer={() => setCurrentScreen("prayer")}
          onNavigateToAchievements={() => setCurrentScreen("achievements")}
          onNavigateToGames={() => setCurrentScreen("games")}
          onNavigateToProfessor={() => setCurrentScreen("professor")}
          onNavigateToAIModes={() => setCurrentScreen("ai-modes")}
          onNavigateToPlansProgress={() => setCurrentScreen("plans-progress")}
          onNavigateToCalendar={() => setCurrentScreen("calendar")}
          onNavigateToSubscriptions={() => setCurrentScreen("subscriptions")}
          onNavigateToRecordings={() => setCurrentScreen("recordings")}
          onNavigateToAdmin={() => setCurrentScreen("admin")}
        />
      )}
      {currentScreen === "recordings" && (
        <RecordingsScreen onBack={() => setCurrentScreen("dashboard")} />
      )}
      {currentScreen === "bible" && (
        <BibleReader 
          onNavigateToSubscriptions={() => setCurrentScreen("subscriptions")}
          onNavigateToSettings={() => setCurrentScreen("settings")}
          onNavigateToHistory={() => setCurrentScreen("history")}
          onNavigateToAdmin={() => setCurrentScreen("admin")}
          onNavigateToLogin={() => setCurrentScreen("login")}
          onNavigateToDashboard={() => setCurrentScreen("dashboard")}
        />
      )}
      {currentScreen === "professor" && (
        <ProfessorScreen onBack={() => setCurrentScreen("dashboard")} />
      )}
      {currentScreen === "ai-modes" && (
        <AIModesScreen 
          onBack={() => setCurrentScreen("dashboard")} 
          onNavigateToSubscriptions={() => setCurrentScreen("subscriptions")}
        />
      )}
      {currentScreen === "plans-progress" && (
        <PlansProgressScreen 
          onBack={() => setCurrentScreen("dashboard")} 
          onNavigateToBible={() => setCurrentScreen("bible")}
        />
      )}
      {currentScreen === "calendar" && (
        <AgendaScreen onBack={() => setCurrentScreen("dashboard")} />
      )}
      {currentScreen === "prayer" && (
        <PrayerMode onBack={() => setCurrentScreen("dashboard")} />
      )}
      {currentScreen === "achievements" && (
        <AchievementsScreen onBack={() => setCurrentScreen("dashboard")} />
      )}
      {currentScreen === "games" && (
        <BibleGames onBack={() => setCurrentScreen("dashboard")} />
      )}
      {currentScreen === "subscriptions" && (
        <SubscriptionScreen onBack={() => setCurrentScreen("dashboard")} />
      )}
      {currentScreen === "settings" && (
        <SettingsScreen 
          onBack={() => setCurrentScreen("dashboard")}
          onNavigateToSubscriptions={() => setCurrentScreen("subscriptions")}
        />
      )}
      {currentScreen === "history" && (
        <AIHistoryScreen onBack={() => setCurrentScreen("dashboard")} />
      )}
      {currentScreen === "admin" && (
        <AdminPanel onBack={() => setCurrentScreen("dashboard")} />
      )}
    </ThemeProvider>
  );
}
