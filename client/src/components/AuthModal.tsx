import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getDeviceId } from "@/hooks/use-device-id";
import { Eye, EyeOff, ArrowLeft, Sparkles, Check, BookOpen, Brain, Infinity } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAuthSuccess?: () => void;
  title?: string;
  description?: string;
}

export function AuthModal({ 
  open, 
  onOpenChange, 
  onAuthSuccess,
  title,
  description
}: AuthModalProps) {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSubmitted, setForgotSubmitted] = useState(false);
  const { login, register } = useAuth();
  const { toast } = useToast();
  
  const modalTitle = title || t("authModal.title");
  const modalDescription = description || t("authModal.description");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(loginEmail, loginPassword);
      toast({
        title: t("auth.loginSuccess"),
        description: t("auth.welcomeBack"),
      });
      onOpenChange(false);
      onAuthSuccess?.();
    } catch (error: any) {
      toast({
        title: t("auth.loginError"),
        description: error.data?.error || error.message || t("auth.checkCredentials"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t("auth.processingError"));
      setForgotSubmitted(true);
      toast({
        title: data.emailSent ? t("auth.emailSent") : t("auth.linkGenerated"),
        description: data.emailSent
          ? t("auth.checkInbox")
          : t("auth.checkEmailReset"),
      });
    } catch (error: any) {
      toast({
        title: t("auth.loginError"),
        description: error.message || t("auth.processingError"),
        variant: "destructive",
      });
    } finally {
      setForgotLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const deviceId = getDeviceId();
      await register(registerName, registerEmail, registerPassword, deviceId);
      toast({
        title: t("auth.registerSuccess"),
        description: t("authModal.nowSubscribe"),
      });
      onOpenChange(false);
      onAuthSuccess?.();
    } catch (error: any) {
      toast({
        title: t("auth.registerError"),
        description: error.data?.error || error.message || t("common.tryAgain"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { onOpenChange(val); if (!val) { setShowForgotPassword(false); setForgotSubmitted(false); setForgotEmail(""); setForgotLoading(false); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{showForgotPassword ? t("auth.recoverPassword") : modalTitle}</DialogTitle>
          <DialogDescription>{showForgotPassword ? t("auth.recoverPasswordDesc") : modalDescription}</DialogDescription>
        </DialogHeader>
        
        {showForgotPassword ? (
          <div className="space-y-4">
            {forgotSubmitted ? (
              <div className="space-y-4">
                <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-md p-4 text-center">
                  <p className="text-sm text-green-900 dark:text-green-100">
                    {t("auth.emailIfRegistered")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {t("auth.checkSpamToo")}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => { setShowForgotPassword(false); setForgotSubmitted(false); setForgotEmail(""); }}
                  data-testid="button-back-to-login-modal"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t("auth.backToLogin")}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email-modal">{t("auth.email")}</Label>
                  <Input
                    id="forgot-email-modal"
                    type="email"
                    placeholder={t("auth.enterEmail")}
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    data-testid="input-forgot-email-modal"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={forgotLoading}
                  data-testid="button-send-reset-modal"
                >
                  {forgotLoading ? t("auth.sending") : t("auth.sendRecoveryEmail")}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => { setShowForgotPassword(false); setForgotEmail(""); }}
                  data-testid="button-cancel-forgot-modal"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t("auth.backToLogin")}
                </Button>
              </form>
            )}
          </div>
        ) : (
        <Tabs defaultValue="register" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="register" data-testid="tab-register">{t("auth.createAccount")}</TabsTrigger>
            <TabsTrigger value="login" data-testid="tab-login">{t("common.login")}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="register" className="space-y-4 mt-4">
            {/* Banner de degustação Premium 7 dias */}
            <div className="rounded-md overflow-hidden" data-testid="banner-trial-info">
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

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register-name">{t("auth.name")}</Label>
                <Input
                  id="register-name"
                  type="text"
                  placeholder={t("auth.yourName")}
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  required
                  data-testid="input-register-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-email">{t("auth.email")}</Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder={t("auth.enterEmail")}
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  required
                  data-testid="input-register-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-password">{t("auth.password")}</Label>
                <div className="relative">
                  <Input
                    id="register-password"
                    type={showRegisterPassword ? "text" : "password"}
                    placeholder={t("auth.enterPassword")}
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    required
                    minLength={6}
                    className="pr-10"
                    data-testid="input-register-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    data-testid="button-toggle-register-password"
                  >
                    {showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                data-testid="button-register-submit"
              >
                {isLoading ? t("auth.creatingAccount") : t("authModal.createAndContinue")}
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="login" className="space-y-4 mt-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">{t("auth.email")}</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder={t("auth.enterEmail")}
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  data-testid="input-login-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">{t("auth.password")}</Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showLoginPassword ? "text" : "password"}
                    placeholder={t("auth.enterPassword")}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    className="pr-10"
                    data-testid="input-login-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    data-testid="button-toggle-login-password"
                  >
                    {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                data-testid="button-login-submit"
              >
                {isLoading ? t("auth.loggingIn") : t("authModal.loginAndContinue")}
              </Button>
              <div className="text-center">
                <Button
                  type="button"
                  variant="ghost"
                  className="text-sm text-muted-foreground"
                  onClick={() => { setShowForgotPassword(true); setForgotEmail(loginEmail); }}
                  data-testid="link-forgot-password-auth-modal"
                >
                  {t("auth.forgotPassword")}?
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
