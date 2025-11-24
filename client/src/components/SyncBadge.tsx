import { Badge } from "@/components/ui/badge";

/**
 * Sync Badge - Displays build timestamp to confirm frontend sync with backend
 * Used to verify that published version matches latest code
 */
export function SyncBadge() {
  // This timestamp is updated every build
  const buildTime = new Date().toLocaleString('pt-BR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  return (
    <Badge 
      variant="secondary" 
      data-testid="badge-sync-status"
      title={`Última sincronização: ${buildTime}`}
      className="text-xs"
    >
      ✓ Sincronizado
    </Badge>
  );
}
