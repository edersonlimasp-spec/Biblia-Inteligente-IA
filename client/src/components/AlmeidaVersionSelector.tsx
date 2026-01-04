/**
 * Bible Version Selector Component
 * Mostra APENAS versões com dados disponíveis
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
import { Check, Loader2, ChevronDown } from "lucide-react";

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
    staleTime: 1000 * 60 * 5, // 5 min cache
  });

  // Filter only versions with data available
  const availableVersions = versions?.filter(v => v.hasData) || [];
  
  const currentVersion = availableVersions.find(v => v.code === selectedVersion);
  const displayText = currentVersion?.code || selectedVersion || "ACF";
  
  const portugueseVersions = availableVersions.filter(v => v.language === 'pt');
  const englishVersions = availableVersions.filter(v => v.language === 'en');
  const spanishVersions = availableVersions.filter(v => v.language === 'es');

  const handleVersionClick = (version: BibleVersion) => {
    console.log(`[BIBLE] VERSION_SELECTED -> translationId=${version.code} from=${selectedVersion} ts=${Date.now()}`);
    onVersionChange(version.code);
  };

  const renderVersionItem = (version: BibleVersion) => {
    const isSelected = selectedVersion === version.code;
    
    return (
      <DropdownMenuItem
        key={version.code}
        onClick={() => handleVersionClick(version)}
        data-testid={`select-version-${version.code}`}
        className={`flex items-center justify-between cursor-pointer ${isSelected ? "bg-primary/10" : ""}`}
      >
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold w-16">{version.code}</span>
          <span className="text-sm truncate max-w-[140px]">{version.name}</span>
        </div>
        {isSelected && <Check className="h-4 w-4 text-primary" />}
      </DropdownMenuItem>
    );
  };
  
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 px-2 font-bold text-xs border border-primary/30 hover:bg-primary/5 gap-1"
          data-testid="button-version-selector"
          disabled={disabled || isLoading}
        >
          {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : displayText}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 z-[100]">
        {portugueseVersions.length > 0 && (
          <>
            <DropdownMenuLabel className="text-xs font-semibold text-primary">
              Português
            </DropdownMenuLabel>
            {portugueseVersions.map(renderVersionItem)}
            {(spanishVersions.length > 0 || englishVersions.length > 0) && <DropdownMenuSeparator />}
          </>
        )}
        
        {spanishVersions.length > 0 && (
          <>
            <DropdownMenuLabel className="text-xs font-semibold text-primary">
              Español
            </DropdownMenuLabel>
            {spanishVersions.map(renderVersionItem)}
            {englishVersions.length > 0 && <DropdownMenuSeparator />}
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
