import { User, Moon, BookText, CreditCard, Info, LogOut, Bell, ArrowLeft, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ChangePasswordModal } from "@/components/ChangePasswordModal";
import { UserButton } from "@/components/UserButton";

interface SettingsScreenProps {
  onBack?: () => void;
  onNavigateToSubscriptions?: () => void;
}

export function SettingsScreen({ onBack, onNavigateToSubscriptions }: SettingsScreenProps) {
  const { user, logout, trialDaysRemaining } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [fontSize, setFontSize] = useState(() => {
    try {
      return localStorage.getItem("bible-font-size") || "medium";
    } catch {
      return "medium";
    }
  });

  // Persist font size to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("bible-font-size", fontSize);
    } catch (error) {
      console.error("Erro ao salvar tamanho da fonte:", error);
    }
  }, [fontSize]);

  const handleLogout = async () => {
    await logout();
    onBack?.();
  };

  return (
    <div className="min-h-screen bg-background dark:bg-background text-foreground dark:text-foreground">
      {/* Header com botão voltar */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Configurações</h1>
            <p className="text-sm text-muted-foreground">Personalize o aplicativo</p>
          </div>
          <UserButton onNavigateToSubscriptions={onNavigateToSubscriptions} showSubscriptionOption />
        </div>
      </header>
      
      <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6">
        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Perfil
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
                <p className="font-semibold text-lg">{user?.name || 'Usuário'}</p>
                <p className="text-sm text-muted-foreground">{user?.email || ''}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Moon className="h-5 w-5" />
              Aparência
            </CardTitle>
            <CardDescription>Personalize a aparência do aplicativo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="dark-mode">Modo Escuro</Label>
              <Switch
                id="dark-mode"
                checked={darkMode}
                onCheckedChange={setDarkMode}
                data-testid="switch-dark-mode"
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <Label htmlFor="notifications">Notificações</Label>
              <Switch
                id="notifications"
                checked={notifications}
                onCheckedChange={setNotifications}
                data-testid="switch-notifications"
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Segurança
            </CardTitle>
            <CardDescription>Gerencie sua senha e segurança</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setIsChangePasswordOpen(true)}
              data-testid="button-change-password"
            >
              Alterar Senha
            </Button>
          </CardContent>
        </Card>

        {/* Reading Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookText className="h-5 w-5" />
              Configurações de Leitura
            </CardTitle>
            <CardDescription>Ajuste a experiência de leitura</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="mb-3 block">Tamanho da Fonte do Texto Bíblico</Label>
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
                {fontSize === "small" && "Tamanho: Pequeno"}
                {fontSize === "medium" && "Tamanho: Médio (padrão)"}
                {fontSize === "large" && "Tamanho: Grande"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Subscription */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Assinatura
            </CardTitle>
            <CardDescription>Gerencie sua assinatura</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Plano Atual</p>
                  <p className="text-sm text-muted-foreground">
                    Trial ({trialDaysRemaining} dias restantes)
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={onNavigateToSubscriptions}
                  data-testid="button-manage-subscription"
                >
                  Gerenciar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Sobre
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Versão 1.0.0</p>
            <Button variant="ghost" className="p-0 h-auto" data-testid="link-terms">
              Termos de Uso
            </Button>
            <br />
            <Button variant="ghost" className="p-0 h-auto" data-testid="link-privacy">
              Política de Privacidade
            </Button>
            <br />
            <Button variant="ghost" className="p-0 h-auto" data-testid="link-help">
              Central de Ajuda
            </Button>
          </CardContent>
        </Card>

        {/* Logout */}
        <Button
          variant="destructive"
          className="w-full"
          onClick={handleLogout}
          data-testid="button-logout"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sair da Conta
        </Button>

        {/* Change Password Modal */}
        <ChangePasswordModal 
          isOpen={isChangePasswordOpen}
          onClose={() => setIsChangePasswordOpen(false)}
        />
      </div>
    </div>
  );
}
