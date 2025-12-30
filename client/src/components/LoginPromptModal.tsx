import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getDeviceId } from "@/hooks/use-device-id";
import { LogIn, UserPlus } from "lucide-react";
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
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LogIn className="w-5 h-5 text-primary" />
            {t("loginPrompt.title")}
          </DialogTitle>
          <DialogDescription>
            {t("loginPrompt.descriptionPart1")} {displayFeatureName}{t("loginPrompt.descriptionPart2")}
          </DialogDescription>
        </DialogHeader>
        
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
                <Input
                  id="prompt-login-password"
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  data-testid="input-prompt-login-password"
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                data-testid="button-prompt-login-submit"
              >
                {isLoading ? t("auth.loggingIn") : t("auth.login")}
              </Button>
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
                <Input
                  id="prompt-register-password"
                  type="password"
                  placeholder="••••••••"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  required
                  minLength={6}
                  data-testid="input-prompt-register-password"
                />
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
      </DialogContent>
    </Dialog>
  );
}
