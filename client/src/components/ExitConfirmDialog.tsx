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

interface ExitConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function ExitConfirmDialog({ open, onOpenChange, onConfirm }: ExitConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-[320px] rounded-xl" data-testid="dialog-exit-confirm">
        <AlertDialogHeader>
          <AlertDialogTitle>Sair do aplicativo?</AlertDialogTitle>
          <AlertDialogDescription>
            Deseja realmente sair do aplicativo?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row gap-2">
          <AlertDialogCancel 
            className="flex-1 mt-0" 
            data-testid="button-exit-cancel"
          >
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction 
            className="flex-1" 
            onClick={onConfirm}
            data-testid="button-exit-confirm"
          >
            Sair
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
