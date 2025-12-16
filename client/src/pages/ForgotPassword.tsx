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
  const [resetLink, setResetLink] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!email) {
        throw new Error("Por favor, insira seu email");
      }

      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao processar sua solicitação");
      }

      setIsSubmitted(true);
      // Only show link if email was NOT sent (dev mode fallback)
      if (!data.emailSent && (data.devLink || data.resetLink)) {
        setResetLink(data.devLink || data.resetLink);
      }
      toast({
        title: data.emailSent ? "Email enviado!" : "Link de reset gerado",
        description: data.emailSent 
          ? "Verifique sua caixa de entrada e spam"
          : "Use o link abaixo para redefinir sua senha",
      });
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

  const handleCopyLink = () => {
    if (resetLink) {
      navigator.clipboard.writeText(resetLink);
      toast({
        title: "Link copiado",
        description: "Cole o link na barra de endereço do seu navegador",
      });
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
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
                {resetLink ? (
                  <>
                    <p className="text-sm text-green-900 dark:text-green-100 mb-3">
                      Link de reset de senha gerado:
                    </p>
                    <div className="space-y-3">
                      <div className="bg-white dark:bg-slate-900 p-3 rounded border border-gray-200 dark:border-gray-700 break-all">
                        <p className="text-xs text-muted-foreground mb-2">Link de reset:</p>
                        <p className="text-xs font-mono text-primary">{resetLink}</p>
                      </div>
                      
                      <div className="space-y-2">
                        <Button
                          onClick={handleCopyLink}
                          variant="default"
                          className="w-full"
                          data-testid="button-copy-reset-link"
                        >
                          Copiar Link
                        </Button>
                        
                        <a href={resetLink} className="block">
                          <Button
                            variant="outline"
                            className="w-full"
                            data-testid="button-use-reset-link"
                          >
                            Usar Link de Reset
                          </Button>
                        </a>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-green-900 dark:text-green-100 mb-2">
                      Email enviado com sucesso!
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Verifique sua caixa de entrada e pasta de spam.
                    </p>
                  </div>
                )}
              </div>

              <p className="text-xs text-muted-foreground text-center">
                O link expira em 30 minutos. Se não receber, verifique o spam ou solicite novamente.
              </p>

              <Button
                onClick={onBackToLogin}
                variant="ghost"
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
