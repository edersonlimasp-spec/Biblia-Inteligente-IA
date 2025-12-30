import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import appLogo from "@assets/logo/logo.png";

interface RegisterScreenProps {
  onRegister?: () => void;
  onNavigateToLogin?: () => void;
}

export function RegisterScreen({ onRegister, onNavigateToLogin }: RegisterScreenProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: t("auth.passwordsNotMatch"),
        description: t("auth.loginErrorDesc"),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await register(name, email, password);
      toast({
        title: t("auth.registerSuccess"),
        description: t("auth.registerSuccessDesc"),
      });
      onRegister?.();
    } catch (error: any) {
      toast({
        title: t("auth.registerError"),
        description: error.data?.error || error.message || t("error.tryAgain"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5 dark:from-primary/20 dark:via-background dark:to-primary/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <img src={appLogo} alt="Logo" className="w-16 h-16" data-testid="img-register-logo" />
          </div>
          <CardTitle className="text-2xl font-bold text-primary">{t("auth.createAccount")}</CardTitle>
          <CardDescription>{t("auth.createAccountDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("auth.name")}</Label>
              <Input
                id="name"
                type="text"
                placeholder={t("auth.enterName")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                data-testid="input-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t("auth.enterEmail")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="input-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t("auth.enterPassword")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                data-testid="input-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("auth.confirmPassword")}</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder={t("auth.enterPassword")}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                data-testid="input-confirm-password"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              data-testid="button-register"
              disabled={isLoading}
            >
              {isLoading ? t("auth.registering") : t("auth.createAccount")}
            </Button>
            <div className="text-center">
              <Button
                type="button"
                variant="ghost"
                onClick={onNavigateToLogin}
                data-testid="link-login"
              >
                {t("auth.hasAccount")} {t("auth.login")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
