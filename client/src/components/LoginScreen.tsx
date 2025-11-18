import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import appLogo from "@assets/generated_images/App_logo_biblical_metallic_blue_695d5d1c.png";

interface LoginScreenProps {
  onLogin?: () => void;
  onNavigateToRegister?: () => void;
}

export function LoginScreen({ onLogin, onNavigateToRegister }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login attempt:", { email, password });
    onLogin?.();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <img src={appLogo} alt="Logo" className="w-16 h-16" data-testid="img-login-logo" />
          </div>
          <CardTitle className="text-2xl font-bold text-primary">Bem-vindo</CardTitle>
          <CardDescription>Entre para acessar a Bíblia com IA</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="input-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                data-testid="input-password"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              data-testid="button-login"
            >
              Entrar
            </Button>
            <div className="text-center">
              <Button
                type="button"
                variant="ghost"
                onClick={onNavigateToRegister}
                data-testid="link-register"
              >
                Não tem conta? Cadastre-se
              </Button>
            </div>
            <div className="text-center">
              <Button
                type="button"
                variant="ghost"
                className="text-sm text-muted-foreground"
                data-testid="link-forgot-password"
              >
                Esqueceu a senha?
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
