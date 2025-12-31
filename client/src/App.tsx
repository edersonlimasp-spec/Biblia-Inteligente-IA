import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthGateProvider } from "@/contexts/AuthGateContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { MainNavigation } from "@/components/MainNavigation";
import { DebugPanel, useDebugMode } from "@/components/DebugPanel";

function AppContent() {
  const isDebug = useDebugMode();
  
  return (
    <>
      <Toaster />
      <MainNavigation />
      {isDebug && <DebugPanel />}
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <LanguageProvider>
            <AuthGateProvider>
              <AppContent />
            </AuthGateProvider>
          </LanguageProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
