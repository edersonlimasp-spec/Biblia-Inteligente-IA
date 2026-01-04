/**
 * Bible Version Selector Component
 * Mostra APENAS versões com dados disponíveis
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  const [open, setOpen] = useState(false);
  
  const { data: versions, isLoading } = useQuery<BibleVersion[]>({
    queryKey: ['/api/versions'],
    staleTime: 1000 * 60 * 5,
  });

  const availableVersions = versions?.filter(v => v.hasData) || [];
  
  const currentVersion = availableVersions.find(v => v.code === selectedVersion);
  const displayText = currentVersion?.code || selectedVersion || "ACF";
  
  const portugueseVersions = availableVersions.filter(v => v.language === 'pt');
  const englishVersions = availableVersions.filter(v => v.language === 'en');
  const spanishVersions = availableVersions.filter(v => v.language === 'es');

  const handleVersionClick = (version: BibleVersion) => {
    console.log(`[BIBLE] VERSION_SELECTED -> translationId=${version.code} from=${selectedVersion} ts=${Date.now()}`);
    onVersionChange(version.code);
    setOpen(false);
  };

  const renderVersionItem = (version: BibleVersion) => {
    const isSelected = selectedVersion === version.code;
    
    return (
      <button
        key={version.code}
        onClick={() => handleVersionClick(version)}
        data-testid={`select-version-${version.code}`}
        className={`flex items-center justify-between w-full px-3 py-2 text-left rounded-md hover:bg-accent/50 ${isSelected ? "bg-primary/10" : ""}`}
      >
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold w-14">{version.code}</span>
          <span className="text-sm truncate max-w-[120px]">{version.name}</span>
        </div>
        {isSelected && <Check className="h-4 w-4 text-primary flex-shrink-0" />}
      </button>
    );
  };

  const renderGroup = (label: string, versions: BibleVersion[]) => {
    if (versions.length === 0) return null;
    return (
      <div className="mb-2">
        <div className="text-xs font-semibold text-primary px-3 py-1">{label}</div>
        {versions.map(renderVersionItem)}
      </div>
    );
  };
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 px-2 font-bold text-xs border border-primary/30 hover:bg-primary/5 gap-1"
          data-testid="button-version-selector"
          disabled={disabled || isLoading}
          onClick={() => setOpen(!open)}
        >
          {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : displayText}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-64 p-2 z-[9999]" 
        align="start"
        sideOffset={4}
      >
        <div className="max-h-[300px] overflow-y-auto">
          {renderGroup("Português", portugueseVersions)}
          {renderGroup("Español", spanishVersions)}
          {renderGroup("English", englishVersions)}
        </div>
      </PopoverContent>
    </Popover>
  );
}
