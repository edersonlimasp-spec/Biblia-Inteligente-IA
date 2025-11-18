import { useState } from "react";
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

  // Simulate splash screen timeout
  if (currentScreen === "splash") {
    setTimeout(() => setCurrentScreen("login"), 2000);
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
      {currentScreen === "bible" && <BibleReader />}
      {currentScreen === "subscriptions" && <SubscriptionScreen />}
      {currentScreen === "settings" && <SettingsScreen />}
      {currentScreen === "history" && <AIHistoryScreen />}
    </ThemeProvider>
  );
}
