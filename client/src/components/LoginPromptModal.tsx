import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getDeviceId } from "@/hooks/use-device-id";
import { getApiUrl } from "@/lib/queryClient";
import { LogIn, UserPlus, Eye, EyeOff, ArrowLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LoginPromptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAuthSuccess?: () => void;
  featureName?: string;
}

export function LoginPromptModal({ 
  open, 
  onOpenChange, 
  onAuthSuccess,
  featureName
}: LoginPromptModalProps) {
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
  const { t } = useLanguage();
  
  const displayFeatureName = featureName || t("loginPrompt.thisFeature");

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
      const response = await fetch(getApiUrl("/api/auth/forgot-password"), {
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
        title: t("auth.accountCreated"),
        description: t("auth.trialGranted"),
      });
      onOpenChange(false);
      onAuthSuccess?.();
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
    <Dialog open={open} onOpenChange={(val) => { onOpenChange(val); if (!val) { setShowForgotPassword(false); setForgotSubmitted(false); setForgotEmail(""); setForgotLoading(false); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LogIn className="w-5 h-5 text-primary" />
            {showForgotPassword ? t("auth.recoverPassword") : t("loginPrompt.title")}
          </DialogTitle>
          <DialogDescription>
            {showForgotPassword 
              ? t("auth.recoverPasswordDesc")
              : `${t("loginPrompt.descriptionPart1")} ${displayFeatureName}${t("loginPrompt.descriptionPart2")}`
            }
          </DialogDescription>
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
                  data-testid="button-back-to-login-prompt"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t("auth.backToLogin")}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email-prompt">{t("auth.email")}</Label>
                  <Input
                    id="forgot-email-prompt"
                    type="email"
                    placeholder={t("auth.enterEmail")}
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    data-testid="input-forgot-email-prompt"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={forgotLoading}
                  data-testid="button-send-reset-prompt"
                >
                  {forgotLoading ? t("auth.sending") : t("auth.sendRecoveryEmail")}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => { setShowForgotPassword(false); setForgotEmail(""); }}
                  data-testid="button-cancel-forgot-prompt"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t("auth.backToLogin")}
                </Button>
              </form>
            )}
          </div>
        ) : (
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login" data-testid="tab-prompt-login">
              <LogIn className="w-4 h-4 mr-1.5" />
              {t("auth.login")}
            </TabsTrigger>
            <TabsTrigger value="register" data-testid="tab-prompt-register">
              <UserPlus className="w-4 h-4 mr-1.5" />
              {t("auth.createAccount")}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="space-y-4 mt-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="prompt-login-email">{t("auth.email")}</Label>
                <Input
                  id="prompt-login-email"
                  type="email"
                  placeholder={t("auth.enterEmail")}
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  data-testid="input-prompt-login-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prompt-login-password">{t("auth.password")}</Label>
                <div className="relative">
                  <Input
                    id="prompt-login-password"
                    type={showLoginPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    className="pr-10"
                    data-testid="input-prompt-login-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    data-testid="button-toggle-prompt-login-password"
                  >
                    {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                data-testid="button-prompt-login-submit"
              >
                {isLoading ? t("auth.loggingIn") : t("auth.login")}
              </Button>
              <div className="text-center">
                <Button
                  type="button"
                  variant="ghost"
                  className="text-sm text-muted-foreground"
                  onClick={() => { setShowForgotPassword(true); setForgotEmail(loginEmail); }}
                  data-testid="link-forgot-password-prompt"
                >
                  {t("auth.forgotPassword")}?
                </Button>
              </div>
            </form>
          </TabsContent>
          
          <TabsContent value="register" className="space-y-4 mt-4">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="prompt-register-name">{t("auth.name")}</Label>
                <Input
                  id="prompt-register-name"
                  type="text"
                  placeholder={t("auth.yourName")}
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  required
                  data-testid="input-prompt-register-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prompt-register-email">{t("auth.email")}</Label>
                <Input
                  id="prompt-register-email"
                  type="email"
                  placeholder={t("auth.enterEmail")}
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  required
                  data-testid="input-prompt-register-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prompt-register-password">{t("auth.password")}</Label>
                <div className="relative">
                  <Input
                    id="prompt-register-password"
                    type={showRegisterPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    required
                    minLength={6}
                    className="pr-10"
                    data-testid="input-prompt-register-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    data-testid="button-toggle-prompt-register-password"
                  >
                    {showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                data-testid="button-prompt-register-submit"
              >
                {isLoading ? t("auth.creatingAccount") : t("auth.createFreeAccount")}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
