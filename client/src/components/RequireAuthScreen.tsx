import { useAuth } from "@/contexts/AuthContext";
import { useDeviceId } from "@/hooks/use-device-id";
import { LoginPromptModal } from "./LoginPromptModal";
import { useState, useEffect } from "react";

interface RequireAuthScreenProps {
  children: React.ReactNode;
  featureName: string;
  onAuthCancel?: () => void;
  allowGuests?: boolean;
}

export function RequireAuthScreen({ 
  children, 
  featureName,
  onAuthCancel,
  allowGuests = true
}: RequireAuthScreenProps) {
  const { user, isLoading } = useAuth();
  const { deviceId, isLoading: deviceIdLoading } = useDeviceId();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [hasTriedAuth, setHasTriedAuth] = useState(false);

  const hasAccess = user || (allowGuests && deviceId);

  useEffect(() => {
    if (!isLoading && !deviceIdLoading && !hasAccess && !hasTriedAuth) {
      setShowLoginModal(true);
      setHasTriedAuth(true);
    }
  }, [isLoading, deviceIdLoading, hasAccess, hasTriedAuth]);

  const handleModalClose = (open: boolean) => {
    setShowLoginModal(open);
    if (!open && !hasAccess) {
      onAuthCancel?.();
    }
  };

  const handleAuthSuccess = () => {
    setShowLoginModal(false);
  };

  if (isLoading || deviceIdLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!hasAccess) {
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
