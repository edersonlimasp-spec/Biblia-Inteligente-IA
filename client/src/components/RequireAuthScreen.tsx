import { useAuth } from "@/contexts/AuthContext";
import { LoginPromptModal } from "./LoginPromptModal";
import { useState, useEffect } from "react";

interface RequireAuthScreenProps {
  children: React.ReactNode;
  featureName: string;
  onAuthCancel?: () => void;
}

export function RequireAuthScreen({ 
  children, 
  featureName,
  onAuthCancel 
}: RequireAuthScreenProps) {
  const { user, isLoading } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [hasTriedAuth, setHasTriedAuth] = useState(false);

  useEffect(() => {
    console.log(`[RequireAuthScreen:${featureName}] isLoading=${isLoading}, user=${user?.id || 'null'}, hasTriedAuth=${hasTriedAuth}`);
    if (!isLoading && !user && !hasTriedAuth) {
      setShowLoginModal(true);
      setHasTriedAuth(true);
    }
  }, [isLoading, user, hasTriedAuth, featureName]);

  const handleModalClose = (open: boolean) => {
    setShowLoginModal(open);
    if (!open && !user) {
      onAuthCancel?.();
    }
  };

  const handleAuthSuccess = () => {
    setShowLoginModal(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <LoginPromptModal
        open={showLoginModal}
        onOpenChange={handleModalClose}
        onAuthSuccess={handleAuthSuccess}
        featureName={featureName}
      />
    );
  }

  return <>{children}</>;
}
