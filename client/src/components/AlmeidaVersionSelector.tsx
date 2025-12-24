/**
 * Bible Version Selector Component
 * Mostra todas as versões habilitadas com indicador de dados disponíveis
 * REGRA: NÃO remover versões do menu - mostrar como "(indisponível)" se necessário
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertCircle, Check, Loader2, Lock } from "lucide-react";

interface VersionSelectorProps {
  selectedVersion: string;
  onVersionChange: (version: string) => void;
  disabled?: boolean;
}

interface BibleVersion {
  code: string;
  name: string;
  language: string;
  licenseType: string;
  hasData: boolean;
  verseCount: number;
  notes?: string;
}

export function AlmeidaVersionSelector({
  selectedVersion,
  onVersionChange,
  disabled = false,
}: VersionSelectorProps) {
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [selectedUnavailable, setSelectedUnavailable] = useState<BibleVersion | null>(null);

  const { data: versions, isLoading } = useQuery<BibleVersion[]>({
    queryKey: ['/api/versions'],
    staleTime: 0,
  });

  const currentVersion = versions?.find(v => v.code === selectedVersion);
  const displayText = currentVersion?.code || selectedVersion || "ACF";
  
  const portugueseVersions = versions?.filter(v => v.language === 'pt') || [];
  const englishVersions = versions?.filter(v => v.language === 'en') || [];
  const spanishVersions = versions?.filter(v => v.language === 'es') || [];

  const handleVersionClick = (version: BibleVersion) => {
    // Log obrigatório ao trocar versão
    console.log(`[VersionSelector] CHANGE: from=${selectedVersion} to=${version.code} hasData=${version.hasData} license=${version.licenseType}`);
    
    // Se versão requer licença comercial E não tem dados, mostrar modal
    if (version.licenseType === 'commercial_pending' && !version.hasData) {
      setSelectedUnavailable(version);
      setShowLicenseModal(true);
      return;
    }
    
    // Alterar versão (mesmo se não tiver dados - backend faz fallback)
    onVersionChange(version.code);
  };

  const renderVersionItem = (version: BibleVersion) => {
    const isCommercialPending = version.licenseType === 'commercial_pending';
    const isUnavailable = isCommercialPending && !version.hasData;
    
    return (
      <DropdownMenuItem
        key={version.code}
        onClick={() => handleVersionClick(version)}
        data-testid={`select-version-${version.code}`}
        className={`flex items-center justify-between ${selectedVersion === version.code ? "bg-primary/10" : ""} ${isUnavailable ? "opacity-60" : ""}`}
      >
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold w-16">{version.code}</span>
          <span className="text-sm truncate max-w-[120px]">
            {version.name}
            {isUnavailable && <span className="text-muted-foreground text-[10px] ml-1">(licença)</span>}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {version.hasData ? (
            <Check className="h-3 w-3 text-green-600" />
          ) : isCommercialPending ? (
            <Lock className="h-3 w-3 text-red-500" />
          ) : (
            <AlertCircle className="h-3 w-3 text-amber-500" />
          )}
        </div>
      </DropdownMenuItem>
    );
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-16 h-9 px-1.5 font-bold text-xs border border-primary/30 hover:bg-primary/5"
          data-testid="button-version-selector"
          disabled={disabled || isLoading}
        >
          {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : displayText}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <div className="px-2 py-1 text-[10px] text-muted-foreground flex items-center gap-1">
          <Check className="h-2.5 w-2.5 text-green-600" /> = dados disponíveis
          <AlertCircle className="h-2.5 w-2.5 text-amber-500 ml-2" /> = usa fallback
        </div>
        <DropdownMenuSeparator />
        
        {portugueseVersions.length > 0 && (
          <>
            <DropdownMenuLabel className="text-xs font-semibold text-primary">
              Português
            </DropdownMenuLabel>
            {portugueseVersions.map(renderVersionItem)}
            <DropdownMenuSeparator />
          </>
        )}
        
        {spanishVersions.length > 0 && (
          <>
            <DropdownMenuLabel className="text-xs font-semibold text-primary">
              Español
            </DropdownMenuLabel>
            {spanishVersions.map(renderVersionItem)}
            <DropdownMenuSeparator />
          </>
        )}
        
        {englishVersions.length > 0 && (
          <>
            <DropdownMenuLabel className="text-xs font-semibold text-primary">
              English
            </DropdownMenuLabel>
            {englishVersions.map(renderVersionItem)}
          </>
        )}
      </DropdownMenuContent>
      
      {/* Modal para versões que requerem licença */}
      <Dialog open={showLicenseModal} onOpenChange={setShowLicenseModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Versão Indisponível</DialogTitle>
            <DialogDescription>
              {selectedUnavailable && (
                <>
                  A versão <strong>{selectedUnavailable.code}</strong> ({selectedUnavailable.name}) 
                  requer licenciamento comercial e ainda não está disponível.
                  <br /><br />
                  <span className="text-muted-foreground text-sm">
                    {selectedUnavailable.notes}
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setShowLicenseModal(false)}>
              Entendido
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DropdownMenu>
  );
}
