import { useAuth } from "@/contexts/AuthContext";
import { useDeviceId } from "@/hooks/use-device-id";
import { LoginPromptModal } from "./LoginPromptModal";
import { useState, useEffect } from "react";
import { isNative } from "@/lib/capacitor";

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
  const { user, isLoading, accessDenied } = useAuth();
  const { deviceId, isLoading: deviceIdLoading } = useDeviceId();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [hasTriedAuth, setHasTriedAuth] = useState(false);

  const hasAccess = user || (allowGuests && deviceId);

  useEffect(() => {
    if (!isNative && !isLoading && !accessDenied && !hasAccess) {
      window.location.assign(`${import.meta.env.BASE_URL.replace(/\/$/, "")}/sign-in`);
    } else if (isNative && !isLoading && !deviceIdLoading && !hasAccess && !hasTriedAuth) {
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
  if (accessDenied) {
    return <div className="flex min-h-screen items-center justify-center bg-background p-6 text-center">
      <div className="max-w-md space-y-3"><h1 className="font-serif text-2xl font-semibold">Acesso não autorizado</h1><p className="text-muted-foreground">Sua conta foi autenticada, mas não tem autorização para acessar os dados deste aplicativo. Entre em contato com o suporte se acreditar que isso é um engano.</p></div>
    </div>;
  }

  if (!hasAccess) {
    return (
      <>
      {isNative && <LoginPromptModal
        open={showLoginModal}
        onOpenChange={handleModalClose}
        onAuthSuccess={handleAuthSuccess}
        featureName={featureName}
      />}
      </>
    );
  }

  return <>{children}</>;
}
