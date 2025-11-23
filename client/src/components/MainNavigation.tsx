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
import { ThemeProvider } from "./ThemeProvider";
import { ForgotPassword } from "@/pages/ForgotPassword";
import { ResetPassword } from "@/pages/ResetPassword";

type Screen = 
  | "splash"
  | "login"
  | "register"
  | "forgot-password"
  | "reset-password"
  | "bible"
  | "subscriptions"
  | "settings"
  | "history";

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
      const headerEl = document.querySelector('header, .header, .topbar, .app-header') as HTMLElement | null;
      if (!headerEl) return;
      
      const height = headerEl.offsetHeight || 56;
      document.documentElement.style.setProperty('--mobile-header-height', `${height}px`);
    };

    // Measure on mount
    measureHeaderHeight();
    
    // Re-measure on resize (for orientation changes on mobile)
    window.addEventListener('resize', measureHeaderHeight);
    return () => window.removeEventListener('resize', measureHeaderHeight);
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

  // Redirect to bible if authenticated, login if not
  useEffect(() => {
    if (!showSplash && !isLoading) {
      if (user && currentScreen !== "bible" && currentScreen !== "subscriptions" && currentScreen !== "settings" && currentScreen !== "history") {
        setCurrentScreen("bible");
      } else if (!user && currentScreen !== "login" && currentScreen !== "register" && currentScreen !== "forgot-password" && currentScreen !== "reset-password") {
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
    </ThemeProvider>
  );
}
