/**
 * Bible Version Selector Component
 * Usa select nativo para máxima compatibilidade
 */

import { useQuery } from "@tanstack/react-query";
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
    staleTime: 1000 * 60 * 5,
  });

  // Fallback versions for when API is loading or fails
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

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
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
    <select
      value={selectedVersion}
      onChange={handleChange}
      disabled={disabled}
      data-testid="button-version-selector"
      className="h-9 px-2 text-xs font-bold border border-primary/30 rounded-md bg-background text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 flex-shrink-0 relative z-50"
      style={{ 
        width: '70px',
        minWidth: '70px',
      }}
    >
      {portugueseVersions.length > 0 && (
        <optgroup label="Português">
          {portugueseVersions.map((version) => (
            <option key={version.code} value={version.code}>
              {version.code} - {version.name}
            </option>
          ))}
        </optgroup>
      )}
      
      {spanishVersions.length > 0 && (
        <optgroup label="Español">
          {spanishVersions.map((version) => (
            <option key={version.code} value={version.code}>
              {version.code} - {version.name}
            </option>
          ))}
        </optgroup>
      )}
      
      {englishVersions.length > 0 && (
        <optgroup label="English">
          {englishVersions.map((version) => (
            <option key={version.code} value={version.code}>
              {version.code} - {version.name}
            </option>
          ))}
        </optgroup>
      )}
    </select>
  );
}
