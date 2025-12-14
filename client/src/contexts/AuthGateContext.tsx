import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LoginPromptModal } from '@/components/LoginPromptModal';

interface PendingAction {
  action: () => void;
  featureName: string;
}

interface AuthGateContextType {
  requireAuth: (action: () => void, featureName?: string) => void;
  isAuthenticated: boolean;
}

const AuthGateContext = createContext<AuthGateContextType | null>(null);

export function AuthGateProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  const isAuthenticated = !!user;

  const requireAuth = useCallback((action: () => void, featureName: string = "este recurso") => {
    if (isAuthenticated) {
      action();
    } else {
      setPendingAction({ action, featureName });
      setShowLoginModal(true);
    }
  }, [isAuthenticated]);

  const handleAuthSuccess = useCallback(() => {
    if (pendingAction) {
      setTimeout(() => {
        pendingAction.action();
        setPendingAction(null);
      }, 100);
    }
  }, [pendingAction]);

  const handleModalClose = useCallback((open: boolean) => {
    setShowLoginModal(open);
    if (!open) {
      setPendingAction(null);
    }
  }, []);

  return (
    <AuthGateContext.Provider value={{ requireAuth, isAuthenticated }}>
      {children}
      <LoginPromptModal
        open={showLoginModal}
        onOpenChange={handleModalClose}
        onAuthSuccess={handleAuthSuccess}
        featureName={pendingAction?.featureName || "este recurso"}
      />
    </AuthGateContext.Provider>
  );
}

export function useAuthGate() {
  const context = useContext(AuthGateContext);
  if (!context) {
    throw new Error('useAuthGate must be used within AuthGateProvider');
  }
  return context;
}

export function useRequireAuth() {
  const { requireAuth, isAuthenticated } = useAuthGate();
  return { requireAuth, isAuthenticated };
}
