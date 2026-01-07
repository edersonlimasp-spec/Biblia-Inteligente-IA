import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface Window {
    __pwaInstallPrompt?: BeforeInstallPromptEvent | null;
  }
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    typeof window !== 'undefined' ? window.__pwaInstallPrompt || null : null
  );
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installOutcome, setInstallOutcome] = useState<"accepted" | "dismissed" | null>(null);

  const isStandalone = typeof window !== 'undefined' && (
    window.matchMedia("(display-mode: standalone)").matches || 
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );

  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';

  const isIOS = /iPad|iPhone|iPod/.test(ua) && 
    !(window as unknown as { MSStream?: unknown }).MSStream;

  const isAndroid = /Android/i.test(ua);

  const isMobile = isIOS || isAndroid;

  const isInAppBrowser = /FBAN|FBAV|Instagram|Line|WhatsApp|Snapchat|Twitter/i.test(ua);

  const isSafari = isIOS && /Safari/i.test(ua) && !/CriOS|FxiOS|OPiOS|EdgiOS/i.test(ua);

  const canInstallDirectly = !isIOS && deferredPrompt !== null;

  useEffect(() => {
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    if (window.__pwaInstallPrompt) {
      setDeferredPrompt(window.__pwaInstallPrompt);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      const prompt = e as BeforeInstallPromptEvent;
      window.__pwaInstallPrompt = prompt;
      setDeferredPrompt(prompt);
    };

    window.addEventListener("beforeinstallprompt", handler);

    const installedHandler = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      window.__pwaInstallPrompt = null;
    };

    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, [isStandalone]);

  const triggerInstall = useCallback(async (): Promise<"accepted" | "dismissed" | "unavailable"> => {
    const prompt = deferredPrompt || window.__pwaInstallPrompt;
    if (!prompt) return "unavailable";

    setIsInstalling(true);
    setInstallOutcome(null);
    try {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      setInstallOutcome(outcome);
      
      if (outcome === "accepted") {
        setIsInstalled(true);
        setDeferredPrompt(null);
        window.__pwaInstallPrompt = null;
      }
      return outcome;
    } catch (error) {
      console.error("Install error:", error);
      return "unavailable";
    } finally {
      setIsInstalling(false);
    }
  }, [deferredPrompt]);

  const resetOutcome = useCallback(() => {
    setInstallOutcome(null);
  }, []);

  const openInSafari = useCallback(() => {
    const currentUrl = window.location.href;
    window.location.href = currentUrl;
  }, []);

  return {
    isInstalled,
    isInstalling,
    isStandalone,
    isIOS,
    isAndroid,
    isMobile,
    isInAppBrowser,
    isSafari,
    canInstallDirectly,
    installOutcome,
    triggerInstall,
    resetOutcome,
    openInSafari,
  };
}
