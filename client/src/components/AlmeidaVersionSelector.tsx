/**
 * Bible Version Selector Component
 * Mostra todas as versões habilitadas com indicador de dados disponíveis
 */

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
import { AlertCircle, Check, Loader2 } from "lucide-react";

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
  const { data: versions, isLoading } = useQuery<BibleVersion[]>({
    queryKey: ['/api/versions'],
    staleTime: 0,
  });

  const currentVersion = versions?.find(v => v.code === selectedVersion);
  const displayText = currentVersion?.code || selectedVersion || "ACF";
  
  const portugueseVersions = versions?.filter(v => v.language === 'pt') || [];
  const englishVersions = versions?.filter(v => v.language === 'en') || [];
  const spanishVersions = versions?.filter(v => v.language === 'es') || [];

  const renderVersionItem = (version: BibleVersion) => (
    <DropdownMenuItem
      key={version.code}
      onClick={() => onVersionChange(version.code)}
      data-testid={`select-version-${version.code}`}
      className={`flex items-center justify-between ${selectedVersion === version.code ? "bg-primary/10" : ""}`}
    >
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs font-bold w-16">{version.code}</span>
        <span className="text-sm truncate max-w-[140px]">{version.name}</span>
      </div>
      <div className="flex items-center gap-1">
        {version.hasData ? (
          <Check className="h-3 w-3 text-green-600" />
        ) : (
          <AlertCircle className="h-3 w-3 text-amber-500" />
        )}
      </div>
    </DropdownMenuItem>
  );
  
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
    </DropdownMenu>
  );
}
