import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getDeviceId } from "@/hooks/use-device-id";
import { Eye, EyeOff } from "lucide-react";
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{modalTitle}</DialogTitle>
          <DialogDescription>{modalDescription}</DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="register" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="register" data-testid="tab-register">{t("auth.createAccount")}</TabsTrigger>
            <TabsTrigger value="login" data-testid="tab-login">{t("common.login")}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="register" className="space-y-4 mt-4">
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
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
