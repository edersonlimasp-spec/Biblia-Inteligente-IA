import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { SplashScreen } from "./SplashScreen";
import { LoginScreen } from "./LoginScreen";
import { RegisterScreen } from "./RegisterScreen";
import { BibleReader } from "./BibleReader";
import { SubscriptionScreen } from "./SubscriptionScreen";
import { SettingsScreen } from "./SettingsScreen";
import { AIHistoryScreen } from "./AIHistoryScreen";
import { ThemeProvider } from "./ThemeProvider";

type Screen = 
  | "splash"
  | "login"
  | "register"
  | "bible"
  | "subscriptions"
  | "settings"
  | "history";

export function MainNavigation() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("splash");
  const [showSplash, setShowSplash] = useState(true);
  const { user, isLoading } = useAuth();

  // Show splash screen for 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Redirect to bible if authenticated, login if not
  useEffect(() => {
    if (!showSplash && !isLoading) {
      if (user && currentScreen !== "bible" && currentScreen !== "subscriptions" && currentScreen !== "settings" && currentScreen !== "history") {
        setCurrentScreen("bible");
      } else if (!user && currentScreen !== "login" && currentScreen !== "register") {
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
        />
      )}
      {currentScreen === "register" && (
        <RegisterScreen
          onRegister={() => setCurrentScreen("bible")}
          onNavigateToLogin={() => setCurrentScreen("login")}
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
