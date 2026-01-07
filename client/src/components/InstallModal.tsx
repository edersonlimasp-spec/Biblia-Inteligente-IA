import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/hooks/use-pwa-install";
import { Download, Share, CheckCircle2, ExternalLink, AlertCircle } from "lucide-react";
import appIcon from "@assets/logo/app-icon.png";

interface InstallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  autoPrompt?: boolean;
}

export function InstallModal({ open, onOpenChange, autoPrompt = false }: InstallModalProps) {
  const { 
    isInstalled, 
    isInstalling, 
    isIOS, 
    isAndroid, 
    isInAppBrowser, 
    canInstallDirectly, 
    installOutcome,
    triggerInstall, 
    resetOutcome 
  } = usePWAInstall();

  const [hasAutoPrompted, setHasAutoPrompted] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (open && autoPrompt && canInstallDirectly && !hasAutoPrompted && !isInstalled) {
      setHasAutoPrompted(true);
      const timer = setTimeout(() => {
        triggerInstall();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [open, autoPrompt, canInstallDirectly, hasAutoPrompted, isInstalled, triggerInstall]);

  useEffect(() => {
    if (installOutcome === "accepted") {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        onOpenChange(false);
        setShowSuccess(false);
        resetOutcome();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [installOutcome, onOpenChange, resetOutcome]);

  useEffect(() => {
    if (!open) {
      setHasAutoPrompted(false);
      setShowSuccess(false);
      resetOutcome();
    }
  }, [open, resetOutcome]);

  const handleDirectInstall = async () => {
    await triggerInstall();
  };

  const handleOpenInSafari = () => {
    const currentUrl = window.location.href.replace(/\/install$/, '');
    const safariUrl = `x-safari-${currentUrl}`;
    window.location.href = safariUrl;
  };

  const handleCopyLink = () => {
    const url = window.location.origin + "/install";
    navigator.clipboard.writeText(url);
  };

  const isDesktop = !isIOS && !isAndroid;

  if (isInstalled) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader className="text-center">
            <div className="flex justify-center mb-4">
              <img 
                src={appIcon} 
                alt="Bíblia Inteligente" 
                className="w-20 h-20 rounded-2xl shadow-lg"
              />
            </div>
            <DialogTitle className="text-xl">App já instalado!</DialogTitle>
            <DialogDescription>
              Você já tem o app na sua tela inicial
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-4">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <p className="text-muted-foreground">Abra o app pela sua tela inicial</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src={appIcon} 
              alt="Bíblia Inteligente" 
              className="w-20 h-20 rounded-2xl shadow-lg"
            />
          </div>
          <DialogTitle className="text-xl">Instalar Bíblia Inteligente</DialogTitle>
          <DialogDescription>
            Tenha o app na sua tela inicial para acesso rápido
          </DialogDescription>
        </DialogHeader>

        {showSuccess || installOutcome === "accepted" ? (
          <div className="text-center py-6">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <p className="text-lg font-semibold text-green-600">Instalado com sucesso!</p>
            <p className="text-sm text-muted-foreground">O app foi adicionado à sua tela inicial</p>
          </div>
        ) : (
          <div className="space-y-4">
            {isIOS && isInAppBrowser && (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                      Abra no Safari para instalar
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                      No iPhone/iPad, a instalação só funciona pelo Safari
                    </p>
                    <div className="flex flex-col gap-2 mt-3">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleCopyLink}
                        className="gap-2"
                        data-testid="button-copy-link"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Copiar link para Safari
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Cole o link no Safari para continuar
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {canInstallDirectly && (
              <Button 
                onClick={handleDirectInstall} 
                size="lg" 
                className="w-full gap-2"
                disabled={isInstalling}
                data-testid="button-install-direct"
              >
                <Download className="w-5 h-5" />
                {isInstalling ? "Instalando..." : "Instalar Agora"}
              </Button>
            )}

            {isIOS && !isInAppBrowser && (
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium text-center mb-3">
                  Siga os passos para instalar no iPhone/iPad:
                </p>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                  <div>
                    <p className="text-sm font-medium">Toque no botão Compartilhar</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Share className="w-3 h-3" /> na barra inferior do Safari
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                  <div>
                    <p className="text-sm font-medium">Toque em "Adicionar à Tela de Início"</p>
                    <p className="text-xs text-muted-foreground">Role para baixo no menu</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                    3
                  </div>
                  <div>
                    <p className="text-sm font-medium">Confirme tocando em "Adicionar"</p>
                    <p className="text-xs text-muted-foreground">O app aparecerá na sua tela inicial</p>
                  </div>
                </div>
              </div>
            )}

            {isAndroid && !canInstallDirectly && (
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-start gap-2 mb-3">
                  <AlertCircle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    Instalação automática não disponível. Siga os passos:
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                  <div>
                    <p className="text-sm font-medium">Abra o menu do Chrome</p>
                    <p className="text-xs text-muted-foreground">Toque nos três pontos (⋮) no canto superior</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                  <div>
                    <p className="text-sm font-medium">Toque em "Instalar app"</p>
                    <p className="text-xs text-muted-foreground">Ou "Adicionar à tela inicial"</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                    3
                  </div>
                  <div>
                    <p className="text-sm font-medium">Confirme a instalação</p>
                    <p className="text-xs text-muted-foreground">O app será adicionado à sua tela</p>
                  </div>
                </div>
              </div>
            )}

            {isDesktop && !canInstallDirectly && (
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-start gap-2 mb-3">
                  <AlertCircle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    Instalação automática não disponível. Siga os passos:
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                  <div>
                    <p className="text-sm font-medium">Procure o ícone de instalação</p>
                    <p className="text-xs text-muted-foreground">Na barra de endereço do navegador</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                  <div>
                    <p className="text-sm font-medium">Clique em "Instalar"</p>
                    <p className="text-xs text-muted-foreground">Ou use o menu → "Instalar Bíblia Inteligente"</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
