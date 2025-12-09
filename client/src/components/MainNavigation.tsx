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
  | "bible"
  | "subscriptions"
  | "settings"
  | "history"
  | "admin";

export function MainNavigation() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("splash");
  // Only show splash on first visit (not on page reload)
  const [showSplash, setShowSplash] = useState(() => {
    const hasVisited = sessionStorage.getItem('hasVisitedApp');
    return !hasVisited;
  });
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  // MOBILE FIX: Dynamically measure header height for mobile padding
  useEffect(() => {
    const measureHeaderHeight = () => {
      const headerEl = document.querySelector('header') as HTMLElement | null;
      if (!headerEl) {
        // Fallback: set default if header not found
        document.documentElement.style.setProperty('--mobile-header-height', '56px');
        return;
      }
      
      const height = headerEl.offsetHeight || 56;
      document.documentElement.style.setProperty('--mobile-header-height', `${height}px`);
    };

    // Measure after a small delay to ensure DOM is fully rendered
    const timer = setTimeout(measureHeaderHeight, 100);
    
    // Re-measure on resize (for orientation changes on mobile)
    window.addEventListener('resize', measureHeaderHeight);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', measureHeaderHeight);
    };
  }, []);

  // Handle URL-based routing for reset password
  useEffect(() => {
    if (location.includes("reset-password")) {
      setCurrentScreen("reset-password");
    }
  }, [location]);

  // Show splash screen for 2 seconds (only on first visit)
  useEffect(() => {
    if (showSplash) {
      const timer = setTimeout(() => {
        setShowSplash(false);
        sessionStorage.setItem('hasVisitedApp', 'true');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showSplash]);

  // Register guest device on first load
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

  // NOVO FLUXO: Ir direto para Bíblia (sem login obrigatório)
  // Login só é exigido para Admin ou ao assinar
  useEffect(() => {
    if (!showSplash && !isLoading) {
      // Só redireciona para bible se está em splash/login/register
      // e não está em telas especiais que precisam de login
      if (currentScreen === "splash") {
        setCurrentScreen("bible");
      }
      // Se tentando acessar admin sem ser admin, redireciona para bible
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
          onLogin={() => setCurrentScreen("bible")}
          onNavigateToRegister={() => setCurrentScreen("register")}
          onNavigateToForgotPassword={() => setCurrentScreen("forgot-password")}
        />
      )}
      {currentScreen === "register" && (
        <RegisterScreen
          onRegister={() => setCurrentScreen("bible")}
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
      {currentScreen === "bible" && (
        <BibleReader 
          onNavigateToSubscriptions={() => setCurrentScreen("subscriptions")}
          onNavigateToSettings={() => setCurrentScreen("settings")}
          onNavigateToHistory={() => setCurrentScreen("history")}
          onNavigateToAdmin={() => setCurrentScreen("admin")}
          onNavigateToLogin={() => setCurrentScreen("login")}
        />
      )}
      {currentScreen === "subscriptions" && (
        <SubscriptionScreen onBack={() => setCurrentScreen("bible")} />
      )}
      {currentScreen === "settings" && (
        <SettingsScreen 
          onBack={() => setCurrentScreen("bible")}
          onNavigateToSubscriptions={() => setCurrentScreen("subscriptions")}
        />
      )}
      {currentScreen === "history" && (
        <AIHistoryScreen onBack={() => setCurrentScreen("bible")} />
      )}
      {currentScreen === "admin" && (
        <AdminPanel onBack={() => setCurrentScreen("bible")} />
      )}
    </ThemeProvider>
  );
}
