import { User, Moon, BookText, CreditCard, Info, LogOut, Bell, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface SettingsScreenProps {
  onBack?: () => void;
  onNavigateToSubscriptions?: () => void;
}

export function SettingsScreen({ onBack, onNavigateToSubscriptions }: SettingsScreenProps) {
  const { user, logout, trialDaysRemaining } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [fontSize, setFontSize] = useState("medium");

  const handleLogout = () => {
    logout();
    onBack?.();
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onBack}
          data-testid="button-settings-back"
          className="mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
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
                  {user?.name.charAt(0).toUpperCase() || 'U'}
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
              <Label>Tamanho da Fonte</Label>
              <div className="flex gap-2 mt-2">
                {["small", "medium", "large"].map((size) => (
                  <Button
                    key={size}
                    variant={fontSize === size ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFontSize(size)}
                    data-testid={`button-font-${size}`}
                  >
                    {size === "small" && "A"}
                    {size === "medium" && "A"}
                    {size === "large" && "A"}
                  </Button>
                ))}
              </div>
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
      </div>
    </div>
  );
}
