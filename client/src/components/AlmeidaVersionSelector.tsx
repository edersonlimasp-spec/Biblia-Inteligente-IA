/**
 * Bible Version Selector Component
 * Mostra APENAS versões com dados disponíveis
 */

import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

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

  const handleVersionChange = (value: string) => {
    console.log(`[BIBLE] VERSION_SELECTED -> translationId=${value} from=${selectedVersion} ts=${Date.now()}`);
    onVersionChange(value);
  };
  
  if (isLoading) {
    return (
      <div className="h-9 px-2 flex items-center border rounded-md border-primary/30">
        <Loader2 className="h-3 w-3 animate-spin" />
      </div>
    );
  }

  return (
    <Select value={selectedVersion} onValueChange={handleVersionChange} disabled={disabled}>
      <SelectTrigger 
        className="w-auto min-w-[70px] h-9 px-2 font-bold text-xs border border-primary/30 hover:bg-primary/5 gap-1"
        data-testid="button-version-selector"
      >
        <SelectValue>{displayText}</SelectValue>
      </SelectTrigger>
      <SelectContent className="z-[200]">
        {portugueseVersions.length > 0 && (
          <SelectGroup>
            <SelectLabel className="text-xs font-semibold text-primary">
              Português
            </SelectLabel>
            {portugueseVersions.map((version) => (
              <SelectItem 
                key={version.code} 
                value={version.code}
                data-testid={`select-version-${version.code}`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold">{version.code}</span>
                  <span className="text-sm truncate max-w-[140px]">{version.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        )}
        
        {spanishVersions.length > 0 && (
          <SelectGroup>
            <SelectLabel className="text-xs font-semibold text-primary">
              Español
            </SelectLabel>
            {spanishVersions.map((version) => (
              <SelectItem 
                key={version.code} 
                value={version.code}
                data-testid={`select-version-${version.code}`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold">{version.code}</span>
                  <span className="text-sm truncate max-w-[140px]">{version.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        )}
        
        {englishVersions.length > 0 && (
          <SelectGroup>
            <SelectLabel className="text-xs font-semibold text-primary">
              English
            </SelectLabel>
            {englishVersions.map((version) => (
              <SelectItem 
                key={version.code} 
                value={version.code}
                data-testid={`select-version-${version.code}`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold">{version.code}</span>
                  <span className="text-sm truncate max-w-[140px]">{version.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        )}
      </SelectContent>
    </Select>
  );
}
