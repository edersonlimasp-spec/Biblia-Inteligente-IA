/**
 * Bible Version Selector Component
 * Usa Shadcn Select para melhor compatibilidade em produção
 * CORRIGIDO: Adiciona fallback com onClick direto nos items para produção
 */

import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const [open, setOpen] = useState(false);
  
  const { data: versions, isLoading } = useQuery<BibleVersion[]>({
    queryKey: ['/api/versions'],
    staleTime: 1000 * 60 * 5,
  });

  const fallbackVersions: BibleVersion[] = [
    { code: 'ACF', name: 'Almeida Corrigida Fiel', language: 'pt', licenseType: 'public_domain', hasData: true, verseCount: 31106 },
    { code: 'ARC', name: 'Almeida Revista e Corrigida', language: 'pt', licenseType: 'public_domain', hasData: true, verseCount: 29779 },
    { code: 'NVI', name: 'Nova Versão Internacional', language: 'pt', licenseType: 'public_domain', hasData: true, verseCount: 29779 },
    { code: 'RVR1960', name: 'Reina Valera 1960', language: 'es', licenseType: 'public_domain', hasData: true, verseCount: 30819 },
    { code: 'KJV', name: 'King James Version', language: 'en', licenseType: 'public_domain', hasData: true, verseCount: 31102 },
  ];

  const availableVersions = (versions?.filter(v => v.hasData) || []).length > 0 
    ? versions!.filter(v => v.hasData) 
    : fallbackVersions;
  
  const portugueseVersions = availableVersions.filter(v => v.language === 'pt');
  const englishVersions = availableVersions.filter(v => v.language === 'en');
  const spanishVersions = availableVersions.filter(v => v.language === 'es');

  // Direct click handler - more reliable in production/PWA
  const handleVersionClick = (versionCode: string) => {
    console.log(`[VERSION_CHANGE] {
      from: "${selectedVersion}",
      to: "${versionCode}",
      origin: "${window.location.origin}",
      isProduction: ${import.meta.env.PROD},
      timestamp: ${Date.now()}
    }`);
    
    if (versionCode && versionCode !== selectedVersion) {
      console.log(`[VERSION_CHANGE_TRIGGERED] calling onVersionChange("${versionCode}")`);
      onVersionChange(versionCode);
      setOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-9 px-3 flex items-center border rounded-md border-primary/30 bg-background">
        <Loader2 className="h-3 w-3 animate-spin" />
      </div>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <Button
          variant="outline"
          size="sm"
          className="w-[70px] h-9 text-xs font-bold border-primary/30 justify-between"
          data-testid="button-version-selector"
        >
          <span>{selectedVersion}</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 z-[100]" align="start">
        {portugueseVersions.length > 0 && (
          <DropdownMenuGroup>
            <DropdownMenuLabel>Português</DropdownMenuLabel>
            {portugueseVersions.map((version) => (
              <DropdownMenuItem
                key={version.code}
                onClick={() => handleVersionClick(version.code)}
                className={selectedVersion === version.code ? "bg-accent" : ""}
                data-testid={`version-item-${version.code}`}
              >
                <span className="font-medium">{version.code}</span>
                <span className="ml-2 text-muted-foreground text-xs">{version.name}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        )}
        
        {spanishVersions.length > 0 && (
          <DropdownMenuGroup>
            <DropdownMenuLabel>Español</DropdownMenuLabel>
            {spanishVersions.map((version) => (
              <DropdownMenuItem
                key={version.code}
                onClick={() => handleVersionClick(version.code)}
                className={selectedVersion === version.code ? "bg-accent" : ""}
                data-testid={`version-item-${version.code}`}
              >
                <span className="font-medium">{version.code}</span>
                <span className="ml-2 text-muted-foreground text-xs">{version.name}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        )}
        
        {englishVersions.length > 0 && (
          <DropdownMenuGroup>
            <DropdownMenuLabel>English</DropdownMenuLabel>
            {englishVersions.map((version) => (
              <DropdownMenuItem
                key={version.code}
                onClick={() => handleVersionClick(version.code)}
                className={selectedVersion === version.code ? "bg-accent" : ""}
                data-testid={`version-item-${version.code}`}
              >
                <span className="font-medium">{version.code}</span>
                <span className="ml-2 text-muted-foreground text-xs">{version.name}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
