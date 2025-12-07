import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getDeviceId } from "@/hooks/use-device-id";
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
  title = "Criar conta para assinar",
  description = "Para assinar um plano, você precisa criar uma conta ou fazer login."
}: AuthModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const { login, register } = useAuth();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(loginEmail, loginPassword);
      toast({
        title: "Login realizado",
        description: "Bem-vindo de volta!",
      });
      onOpenChange(false);
      onAuthSuccess?.();
    } catch (error: any) {
      toast({
        title: "Erro ao fazer login",
        description: error.data?.error || error.message || "Verifique suas credenciais",
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
        title: "Conta criada",
        description: "Bem-vindo! Agora você pode assinar um plano.",
      });
      onOpenChange(false);
      onAuthSuccess?.();
    } catch (error: any) {
      toast({
        title: "Erro ao criar conta",
        description: error.data?.error || error.message || "Tente novamente",
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
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="register" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="register" data-testid="tab-register">Criar Conta</TabsTrigger>
            <TabsTrigger value="login" data-testid="tab-login">Entrar</TabsTrigger>
          </TabsList>
          
          <TabsContent value="register" className="space-y-4 mt-4">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register-name">Nome</Label>
                <Input
                  id="register-name"
                  type="text"
                  placeholder="Seu nome"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  required
                  data-testid="input-register-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  required
                  data-testid="input-register-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-password">Senha</Label>
                <Input
                  id="register-password"
                  type="password"
                  placeholder="••••••••"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  required
                  minLength={6}
                  data-testid="input-register-password"
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                data-testid="button-register-submit"
              >
                {isLoading ? "Criando conta..." : "Criar conta e continuar"}
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="login" className="space-y-4 mt-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  data-testid="input-login-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Senha</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  data-testid="input-login-password"
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                data-testid="button-login-submit"
              >
                {isLoading ? "Entrando..." : "Entrar e continuar"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
