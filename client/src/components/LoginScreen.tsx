import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { SiGoogle } from "react-icons/si";
import { Eye, EyeOff, Sparkles, ChevronRight } from "lucide-react";
import appLogo from "@assets/logo/logo.png";

interface LoginScreenProps {
  onLogin?: () => void;
  onNavigateToRegister?: () => void;
  onNavigateToForgotPassword?: () => void;
}

export function LoginScreen({ onLogin, onNavigateToRegister, onNavigateToForgotPassword }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { login, loginWithGoogle, isGoogleLoginAvailable } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      toast({
        title: t("auth.loginSuccess"),
        description: t("auth.loginSuccessDesc"),
      });
      onLogin?.();
    } catch (error: any) {
      toast({
        title: t("auth.loginError"),
        description: error.data?.error || error.message || t("auth.loginErrorDesc"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle();
      toast({
        title: t("auth.loginSuccess"),
        description: t("auth.registerSuccessDesc"),
      });
      onLogin?.();
    } catch (error: any) {
      toast({
        title: t("auth.loginError"),
        description: error.message || t("error.tryAgain"),
        variant: "destructive",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5 dark:from-primary/20 dark:via-background dark:to-primary/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <img src={appLogo} alt="Logo" className="w-16 h-16" data-testid="img-login-logo" />
          </div>
          <CardTitle className="text-2xl font-bold text-primary">{t("auth.welcome")}</CardTitle>
          <CardDescription>{t("auth.welcomeDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t("auth.enterPassword")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                  data-testid="input-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="button-toggle-password"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full"
              data-testid="button-login"
              disabled={isLoading}
            >
              {isLoading ? t("auth.loggingIn") : t("auth.login")}
            </Button>
            
            {isGoogleLoginAvailable && (
              <>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">{t("common.or")}</span>
                  </div>
                </div>
                
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={handleGoogleLogin}
                  disabled={isGoogleLoading}
                  data-testid="button-google-login"
                >
                  <SiGoogle className="h-4 w-4" />
                  {isGoogleLoading ? t("auth.loggingIn") : t("auth.loginWithGoogle")}
                </Button>
              </>
            )}
            
            {/* Banner de trial - clicável, vai para cadastro */}
            <button
              type="button"
              onClick={onNavigateToRegister}
              className="w-full rounded-md overflow-hidden text-left"
              data-testid="banner-trial-login"
            >
              <div className="bg-gradient-to-r from-primary to-blue-700 dark:from-primary dark:to-blue-800 px-4 py-3 text-white flex items-center gap-3">
                <div className="bg-white/15 border border-white/25 rounded-md p-2 shrink-0">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold leading-tight">Novo por aqui? Ganhe 7 dias Premium grátis</p>
                  <p className="text-xs opacity-80 mt-0.5">IA avançada · Strong's ilimitado · Sem cartão</p>
                </div>
                <ChevronRight className="h-4 w-4 opacity-70 shrink-0" />
              </div>
            </button>
            <div className="text-center">
              <Button
                type="button"
                variant="ghost"
                className="text-sm text-muted-foreground"
                onClick={onNavigateToForgotPassword}
                data-testid="link-forgot-password"
              >
                {t("auth.forgotPassword")}?
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
