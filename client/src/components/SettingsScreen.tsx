import { User, Moon, BookText, CreditCard, Info, LogOut, Bell, ArrowLeft, Lock, RefreshCw, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { ChangePasswordModal } from "@/components/ChangePasswordModal";
import { UserButton } from "@/components/UserButton";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface SettingsScreenProps {
  onBack?: () => void;
  onNavigateToSubscriptions?: () => void;
}

export function SettingsScreen({ onBack, onNavigateToSubscriptions }: SettingsScreenProps) {
  const { user, logout, trialDaysRemaining } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [fontSize, setFontSize] = useState(() => {
    try {
      return localStorage.getItem("bible-font-size") || "medium";
    } catch {
      return "medium";
    }
  });
  const [isClearing, setIsClearing] = useState(false);

  const handleForceUpdate = async () => {
    setIsClearing(true);
    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(r => r.unregister()));
      }
      
      alert(t("settings.cacheCleared") || 'Cache limpo! O app será recarregado.');
      window.location.reload();
    } catch (e) {
      alert('Erro ao limpar cache: ' + String(e));
    } finally {
      setIsClearing(false);
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem("bible-font-size", fontSize);
    } catch (error) {
      console.error("Error saving font size:", error);
    }
  }, [fontSize]);

  const handleLogout = async () => {
    await logout();
    onBack?.();
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await apiRequest("DELETE", "/api/user/me");
      toast({
        title: "Conta apagada",
        description: "Sua conta e seus dados foram removidos permanentemente.",
      });
      // Limpa estado local e cache; logout backend pode falhar (token já é inválido)
      try { await logout(); } catch {}
      queryClient.clear();
      setIsDeleteOpen(false);
      setDeleteConfirm("");
      onBack?.();
    } catch (error: any) {
      toast({
        title: "Erro ao apagar conta",
        description: error?.data?.error || error?.message || "Tente novamente em instantes.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background dark:bg-background text-foreground dark:text-foreground">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{t("settings.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("settings.subtitle")}</p>
          </div>
          <UserButton onNavigateToSubscriptions={onNavigateToSubscriptions} showSubscriptionOption />
        </div>
      </header>
      
      <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {t("settings.profile")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-lg">{user?.name || t("settings.user")}</p>
                <p className="text-sm text-muted-foreground">{user?.email || ''}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Moon className="h-5 w-5" />
              {t("settings.appearance")}
            </CardTitle>
            <CardDescription>{t("settings.appearanceDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="dark-mode">{t("settings.darkMode")}</Label>
              <Switch
                id="dark-mode"
                checked={darkMode}
                onCheckedChange={setDarkMode}
                data-testid="switch-dark-mode"
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <Label htmlFor="notifications">{t("settings.notifications")}</Label>
              <Switch
                id="notifications"
                checked={notifications}
                onCheckedChange={setNotifications}
                data-testid="switch-notifications"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              {t("settings.security")}
            </CardTitle>
            <CardDescription>{t("settings.securityDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setIsChangePasswordOpen(true)}
              data-testid="button-change-password"
            >
              {t("settings.changePassword")}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookText className="h-5 w-5" />
              {t("settings.readingSettings")}
            </CardTitle>
            <CardDescription>{t("settings.readingSettingsDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="mb-3 block">{t("settings.fontSize")}</Label>
              <div className="flex gap-2 mt-3">
                <Button
                  variant={fontSize === "small" ? "default" : "outline"}
                  onClick={() => setFontSize("small")}
                  data-testid="button-font-small"
                  className="flex-1"
                >
                  <span className="text-sm">A</span>
                </Button>
                <Button
                  variant={fontSize === "medium" ? "default" : "outline"}
                  onClick={() => setFontSize("medium")}
                  data-testid="button-font-medium"
                  className="flex-1"
                >
                  <span className="text-lg">A</span>
                </Button>
                <Button
                  variant={fontSize === "large" ? "default" : "outline"}
                  onClick={() => setFontSize("large")}
                  data-testid="button-font-large"
                  className="flex-1"
                >
                  <span className="text-2xl">A</span>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                {fontSize === "small" && t("settings.fontSizeSmall")}
                {fontSize === "medium" && t("settings.fontSizeMedium")}
                {fontSize === "large" && t("settings.fontSizeLarge")}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              {t("settings.subscription")}
            </CardTitle>
            <CardDescription>{t("settings.subscriptionDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{t("settings.currentPlan")}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.trialDays").replace("{days}", String(trialDaysRemaining))}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={onNavigateToSubscriptions}
                  data-testid="button-manage-subscription"
                >
                  {t("settings.manage")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              {t("settings.about")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{t("settings.version")} 1.0.0</p>
            <Button
              variant="ghost"
              className="p-0 h-auto"
              data-testid="link-terms"
              onClick={() => setLocation("/termos")}
            >
              {t("settings.terms") || "Termos de Uso"}
            </Button>
            <br />
            <Button
              variant="ghost"
              className="p-0 h-auto"
              data-testid="link-privacy"
              onClick={() => setLocation("/privacidade")}
            >
              {t("settings.privacy") || "Política de Privacidade"}
            </Button>
            <br />
            <Button variant="ghost" className="p-0 h-auto" data-testid="link-help">
              {t("settings.helpCenter")}
            </Button>
          </CardContent>
        </Card>

        {/* Apagar conta — exigência das lojas (Apple App Store / Google Play). */}
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Apagar conta
            </CardTitle>
            <CardDescription>
              Remove permanentemente seu perfil, marcações, anotações, gravações e histórico do Professor IA.
              Essa ação não pode ser desfeita.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => setIsDeleteOpen(true)}
              data-testid="button-delete-account"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Apagar minha conta
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              {t("settings.maintenance") || "Manutenção"}
            </CardTitle>
            <CardDescription>{t("settings.maintenanceDesc") || "Opções de manutenção do aplicativo"}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleForceUpdate}
              disabled={isClearing}
              data-testid="button-force-update"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isClearing ? 'animate-spin' : ''}`} />
              {isClearing ? (t("settings.clearing") || "Limpando...") : (t("settings.forceUpdate") || "Forçar Atualização")}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              {t("settings.forceUpdateDesc") || "Limpa cache e recarrega com a versão mais recente"}
            </p>
          </CardContent>
        </Card>

        <Button
          variant="destructive"
          className="w-full"
          onClick={handleLogout}
          data-testid="button-logout"
        >
          <LogOut className="h-4 w-4 mr-2" />
          {t("settings.logout")}
        </Button>

        <div className="pt-6 pb-4 text-center">
          <p className="text-xs text-muted-foreground">
            Contato:{" "}
            <a 
              href="https://instagram.com/bibliainteligenteia" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
              data-testid="link-instagram"
            >
              @bibliainteligenteia
            </a>
          </p>
        </div>

        <ChangePasswordModal 
          isOpen={isChangePasswordOpen}
          onClose={() => setIsChangePasswordOpen(false)}
        />

        <AlertDialog open={isDeleteOpen} onOpenChange={(open) => {
          setIsDeleteOpen(open);
          if (!open) setDeleteConfirm("");
        }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Apagar sua conta?</AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <span className="block">
                  Isso vai <strong>excluir permanentemente</strong> todos os seus dados:
                  perfil, marcações, anotações, gravações e histórico do Professor IA.
                </span>
                <span className="block">
                  Para confirmar, digite <strong>APAGAR</strong> abaixo.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="APAGAR"
              className="w-full mt-2 px-3 py-2 rounded-md border bg-background text-foreground"
              data-testid="input-delete-confirm"
              autoComplete="off"
            />
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-delete">Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={deleteConfirm.trim().toUpperCase() !== "APAGAR" || isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-testid="button-confirm-delete"
              >
                {isDeleting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Apagando...</>
                ) : (
                  "Apagar permanentemente"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
