import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import appLogo from "@assets/logo/logo.png";

interface ForgotPasswordProps {
  onBackToLogin?: () => void;
}

export function ForgotPassword({ onBackToLogin }: ForgotPasswordProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Em produção, isso chamaria uma API para enviar email de reset
      // Por enquanto, simulamos o sucesso
      if (!email) {
        throw new Error("Por favor, insira seu email");
      }

      // Simulação de envio de email
      setTimeout(() => {
        setIsSubmitted(true);
        toast({
          title: "Email enviado",
          description: `Se uma conta existe com ${email}, você receberá um email de reset de senha em breve.`,
        });
      }, 1000);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao processar sua solicitação",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <img src={appLogo} alt="Logo" className="w-16 h-16" data-testid="img-forgot-logo" />
          </div>
          <CardTitle className="text-2xl font-bold text-primary">Recuperar Senha</CardTitle>
          <CardDescription>
            {isSubmitted
              ? "Verifique seu email para instruções de reset"
              : "Insira seu email para receber um link de reset de senha"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSubmitted ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                Enviamos um link de reset de senha para <strong>{email}</strong>
              </p>
              <p className="text-xs text-muted-foreground">
                Se não receber o email em alguns minutos, verifique sua pasta de spam.
              </p>
              <Button
                onClick={onBackToLogin}
                className="w-full"
                data-testid="button-back-to-login"
              >
                Voltar ao Login
              </Button>
            </div>
          ) : (
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
                  data-testid="input-forgot-email"
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                data-testid="button-send-reset"
                disabled={isLoading}
              >
                {isLoading ? "Enviando..." : "Enviar Email de Reset"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={onBackToLogin}
                data-testid="button-cancel-forgot"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Login
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
