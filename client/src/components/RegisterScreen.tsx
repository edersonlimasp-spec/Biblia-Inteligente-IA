import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Sparkles, Check, BookOpen, Brain, Infinity } from "lucide-react";
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
        <CardContent className="space-y-4">
          {/* Banner de degustação Premium 7 dias */}
          <div className="rounded-md overflow-hidden" data-testid="banner-trial-info">
            {/* Cabeçalho gradiente */}
            <div className="bg-gradient-to-r from-primary to-blue-700 dark:from-primary dark:to-blue-800 px-4 pt-4 pb-3 text-white">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles className="h-3.5 w-3.5 opacity-90" />
                    <span className="text-xs font-semibold uppercase tracking-widest opacity-90">Oferta de Boas-vindas</span>
                  </div>
                  <p className="text-xl font-bold leading-tight">7 dias Premium</p>
                  <p className="text-sm opacity-85 mt-0.5">completamente grátis ao se cadastrar</p>
                </div>
                <div className="bg-white/15 border border-white/25 rounded-md px-3 py-2 text-center shrink-0">
                  <p className="text-3xl font-bold leading-none">7</p>
                  <p className="text-xs leading-none opacity-80 mt-0.5">dias</p>
                </div>
              </div>
            </div>
            {/* Recursos inclusos */}
            <div className="border border-t-0 border-primary/20 bg-primary/5 dark:bg-primary/10 px-4 py-3 rounded-b-md">
              <ul className="space-y-2">
                {[
                  { icon: BookOpen, text: "Strong's ilimitado — Grego e Hebraico" },
                  { icon: Brain,    text: "Professor IA com todos os modos avançados" },
                  { icon: Infinity, text: "100 perguntas por dia ao Professor IA" },
                ].map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-center gap-2.5 text-sm text-foreground">
                    <div className="h-5 w-5 rounded-full bg-primary/12 flex items-center justify-center shrink-0">
                      <Icon className="h-3 w-3 text-primary" />
                    </div>
                    {text}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground mt-3 text-center">Sem cartão de crédito · Após 7 dias volta ao plano gratuito</p>
            </div>
          </div>

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
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("auth.confirmPassword")}</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder={t("auth.enterPassword")}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="pr-10"
                  data-testid="input-confirm-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="button-toggle-confirm-password"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
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
