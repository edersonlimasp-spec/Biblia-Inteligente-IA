import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download, Share, Monitor, CheckCircle2 } from "lucide-react";
import { usePWAInstall } from "@/hooks/use-pwa-install";
import appIcon from "@assets/logo/app-icon.png";

interface InstallPageProps {
  onBack: () => void;
}

export function InstallPage({ onBack }: InstallPageProps) {
  const { 
    isInstalled, 
    isInstalling, 
    isStandalone, 
    isIOS, 
    isAndroid,
    canInstallDirectly, 
    triggerInstall 
  } = usePWAInstall();

  const isChrome = /Chrome/.test(navigator.userAgent) && !/Edge|Edg/.test(navigator.userAgent);
  const isDesktop = !isIOS && !isAndroid;

  const handleInstallClick = async () => {
    await triggerInstall();
  };

  if (isInstalled || isStandalone) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="flex items-center gap-3 p-4 border-b bg-card">
          <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Instalar App</h1>
        </header>

        <main className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-md w-full text-center border-0 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
            <CardHeader>
              <div className="mx-auto mb-4 h-20 w-20 rounded-2xl shadow-lg overflow-hidden relative">
                <img 
                  src={appIcon} 
                  alt="Bíblia Inteligente IA" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </div>
              </div>
              <CardTitle className="text-xl">App Instalado!</CardTitle>
              <CardDescription className="text-base">
                O Bíblia Inteligente IA já está na sua tela inicial.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={onBack} className="w-full" data-testid="button-go-back">
                Voltar ao App
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center gap-3 p-4 border-b bg-card">
        <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-back">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">Instalar na Tela Inicial</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        <Card className="border-0 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 h-24 w-24 rounded-2xl shadow-lg overflow-hidden">
              <img 
                src={appIcon} 
                alt="Bíblia Inteligente IA" 
                className="w-full h-full object-cover"
              />
            </div>
            <CardTitle className="text-2xl font-serif bg-gradient-to-r from-primary via-blue-500 to-primary bg-clip-text text-transparent">
              Bíblia Inteligente IA
            </CardTitle>
            <CardDescription className="text-base">
              Instale o app na sua tela inicial para acesso rápido e experiência completa
            </CardDescription>
          </CardHeader>
        </Card>

        {isIOS && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Share className="h-5 w-5" />
                Instruções para iPhone/iPad
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Abra no Safari</p>
                    <p className="text-sm text-muted-foreground">
                      Certifique-se de estar usando o navegador Safari
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Toque no botão Compartilhar</p>
                    <p className="text-sm text-muted-foreground">
                      O ícone <Share className="inline h-4 w-4" /> na barra inferior do Safari
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Selecione "Adicionar à Tela de Início"</p>
                    <p className="text-sm text-muted-foreground">
                      Role para baixo no menu e toque nesta opção
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                    4
                  </div>
                  <div>
                    <p className="font-medium">Confirme tocando em "Adicionar"</p>
                    <p className="text-sm text-muted-foreground">
                      O app aparecerá na sua tela inicial
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {isAndroid && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Download className="h-5 w-5" />
                Instalar no Android
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {canInstallDirectly ? (
                <div className="text-center space-y-4">
                  <p className="text-muted-foreground">
                    Clique no botão abaixo para instalar o app diretamente
                  </p>
                  <Button 
                    onClick={handleInstallClick} 
                    size="lg" 
                    className="w-full"
                    disabled={isInstalling}
                    data-testid="button-install-now"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    {isInstalling ? "Instalando..." : "Instalar Agora"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground mb-4">
                    Se o botão de instalação não aparecer, siga estas instruções:
                  </p>
                  
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                      1
                    </div>
                    <div>
                      <p className="font-medium">Abra o menu do Chrome</p>
                      <p className="text-sm text-muted-foreground">
                        Toque nos três pontos (⋮) no canto superior direito
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                      2
                    </div>
                    <div>
                      <p className="font-medium">Toque em "Instalar app" ou "Adicionar à tela inicial"</p>
                      <p className="text-sm text-muted-foreground">
                        A opção pode variar dependendo da versão do Chrome
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                      3
                    </div>
                    <div>
                      <p className="font-medium">Confirme a instalação</p>
                      <p className="text-sm text-muted-foreground">
                        O app será adicionado à sua tela inicial
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {isDesktop && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Monitor className="h-5 w-5" />
                Instalar no Computador
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {canInstallDirectly ? (
                <div className="text-center space-y-4">
                  <p className="text-muted-foreground">
                    Clique no botão abaixo para instalar o app
                  </p>
                  <Button 
                    onClick={handleInstallClick} 
                    size="lg" 
                    className="w-full"
                    disabled={isInstalling}
                    data-testid="button-install-now"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    {isInstalling ? "Instalando..." : "Instalar Agora"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground mb-4">
                    Para instalar no seu computador:
                  </p>
                  
                  {isChrome && (
                    <>
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                          1
                        </div>
                        <div>
                          <p className="font-medium">Procure o ícone de instalação</p>
                          <p className="text-sm text-muted-foreground">
                            Na barra de endereço do Chrome, procure o ícone de instalação
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                          2
                        </div>
                        <div>
                          <p className="font-medium">Clique em "Instalar"</p>
                          <p className="text-sm text-muted-foreground">
                            Ou use o menu ⋮ → "Instalar Bíblia Inteligente IA"
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                  
                  {!isChrome && (
                    <p className="text-muted-foreground">
                      Para a melhor experiência de instalação, recomendamos usar o Google Chrome ou Microsoft Edge.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-3">Benefícios do App Instalado</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                Acesso rápido direto da tela inicial
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                Experiência em tela cheia sem barra do navegador
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                Funciona mesmo com conexão instável
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                Notificações e atualizações automáticas
              </li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
