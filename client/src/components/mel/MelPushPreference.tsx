import { useState } from "react";
import { Bell, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MelMascot } from "@/components/mel/MelMascot";
import { useMelPush } from "@/hooks/useMelPush";

export function MelPushPreference() {
  const {
    isNative,
    isEnabled,
    isRegistering,
    isRegistered,
    pushError,
    enablePush,
    retry,
  } = useMelPush();
  const [showExplanation, setShowExplanation] = useState(false);
  const [requestStarted, setRequestStarted] = useState(false);

  if (!isNative) return null;

  const handlePermissionRequest = async () => {
    setRequestStarted(true);
    try {
      await enablePush();
      setShowExplanation(false);
    } catch {
      setShowExplanation(false);
    } finally {
      setRequestStarted(false);
    }
  };

  return (
    <>
      <div className="mt-5 space-y-3 rounded-lg border bg-muted/20 p-4" data-testid="mel-push-preference">
        <div className="flex items-start gap-3">
          <Bell className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          <div className="min-w-0 space-y-1">
            <p className="font-medium">Receber recados da Mel neste aparelho</p>
            <p className="text-sm text-muted-foreground">
              {isRegistered
                ? "Pronto! Se chegar um lembrete enquanto o app estiver aberto, toque no recado para continuar na leitura."
                : "Ative as notificações para receber seus lembretes mesmo com o aplicativo fechado."}
            </p>
          </div>
        </div>

        {!isRegistered && (
          <Button
            type="button"
            variant={isEnabled ? "outline" : "default"}
            onClick={() => {
              if (isEnabled) void retry();
              else setShowExplanation(true);
            }}
            disabled={isRegistering}
            data-testid="button-enable-mel-push"
          >
            {isRegistering && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
            {isRegistering ? "Ativando..." : isEnabled ? "Tentar ativar novamente" : "Ativar lembretes da Mel"}
          </Button>
        )}

        {pushError && !isRegistered && (
          <p className="text-sm text-destructive" role="alert" data-testid="mel-push-error">
            {pushError}
          </p>
        )}
        {isRegistered && (
          <p className="text-sm text-green-700 dark:text-green-400" role="status" data-testid="mel-push-active">
            Notificações ativadas neste aparelho
          </p>
        )}
      </div>

      <Dialog
        open={showExplanation}
        onOpenChange={(open) => {
          if (!requestStarted) setShowExplanation(open);
        }}
      >
        <DialogContent data-testid="mel-push-explanation">
          <DialogHeader>
            <DialogTitle>A Mel quer continuar pertinho</DialogTitle>
            <DialogDescription>
              Com a sua autorização, você pode receber um lembrete carinhoso para seguir sua leitura, mesmo quando o app estiver fechado. Tocar no recado abre o texto da Bíblia indicado pela Mel.
            </DialogDescription>
          </DialogHeader>
          <div className="mx-auto max-w-28" aria-hidden="true">
            <MelMascot scene="welcome" className="h-28 w-28" />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={requestStarted}
              onClick={() => setShowExplanation(false)}
            >
              Agora não
            </Button>
            <Button
              type="button"
              disabled={requestStarted}
              onClick={() => void handlePermissionRequest()}
              data-testid="button-confirm-mel-push"
            >
              {requestStarted && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
              {requestStarted ? "Ativando..." : "Continuar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}