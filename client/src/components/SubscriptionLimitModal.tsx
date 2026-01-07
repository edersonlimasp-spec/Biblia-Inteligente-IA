import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Crown, Sparkles } from "lucide-react";

interface SubscriptionLimitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string;
  onSubscribe: () => void;
  subscriptionType: 'free' | 'gold' | 'premium';
}

export function SubscriptionLimitModal({
  open,
  onOpenChange,
  title,
  message,
  onSubscribe,
  subscriptionType,
}: SubscriptionLimitModalProps) {
  const showUpgradeButton = subscriptionType !== 'premium';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            {message}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {showUpgradeButton && (
          <div className="py-4 space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
              <Sparkles className="h-5 w-5 text-amber-500 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium">Upgrade seu plano</p>
                <p className="text-muted-foreground">
                  {subscriptionType === 'free' 
                    ? 'Gold: 30 itens | Premium: 100 itens' 
                    : 'Premium: 100 itens'}
                </p>
              </div>
            </div>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel data-testid="button-cancel-limit">
            Fechar
          </AlertDialogCancel>
          {showUpgradeButton && (
            <AlertDialogAction 
              onClick={onSubscribe}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              data-testid="button-upgrade-subscription"
            >
              <Crown className="h-4 w-4 mr-2" />
              Ver Planos
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
