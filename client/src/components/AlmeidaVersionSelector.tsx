/**
 * Bible Version Selector Component
 * Usa Shadcn Select para melhor compatibilidade em produção
 */

import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

  const handleValueChange = (value: string) => {
    console.log(`[BIBLE] VERSION_SELECTED -> translationId=${value} from=${selectedVersion} ts=${Date.now()}`);
    if (value) {
      onVersionChange(value);
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
    <Select value={selectedVersion} onValueChange={handleValueChange} disabled={disabled}>
      <SelectTrigger 
        className="w-[70px] h-9 text-xs font-bold border-primary/30"
        data-testid="button-version-selector"
      >
        <SelectValue placeholder="Versão" />
      </SelectTrigger>
      <SelectContent className="z-[100]">
        {portugueseVersions.length > 0 && (
          <SelectGroup>
            <SelectLabel>Português</SelectLabel>
            {portugueseVersions.map((version) => (
              <SelectItem key={version.code} value={version.code}>
                {version.code} - {version.name}
              </SelectItem>
            ))}
          </SelectGroup>
        )}
        
        {spanishVersions.length > 0 && (
          <SelectGroup>
            <SelectLabel>Español</SelectLabel>
            {spanishVersions.map((version) => (
              <SelectItem key={version.code} value={version.code}>
                {version.code} - {version.name}
              </SelectItem>
            ))}
          </SelectGroup>
        )}
        
        {englishVersions.length > 0 && (
          <SelectGroup>
            <SelectLabel>English</SelectLabel>
            {englishVersions.map((version) => (
              <SelectItem key={version.code} value={version.code}>
                {version.code} - {version.name}
              </SelectItem>
            ))}
          </SelectGroup>
        )}
      </SelectContent>
    </Select>
  );
}
