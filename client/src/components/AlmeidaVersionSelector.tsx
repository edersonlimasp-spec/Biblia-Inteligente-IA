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

  const availableVersions = versions?.filter(v => v.hasData) || [];
  
  const portugueseVersions = availableVersions.filter(v => v.language === 'pt');
  const englishVersions = availableVersions.filter(v => v.language === 'en');
  const spanishVersions = availableVersions.filter(v => v.language === 'es');

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    console.log(`[BIBLE] VERSION_SELECTED -> translationId=${value} from=${selectedVersion} ts=${Date.now()}`);
    onVersionChange(value);
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
      className="h-9 px-2 text-xs font-bold border border-primary/30 rounded-md bg-background text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 flex-shrink-0 appearance-none"
      style={{ 
        minWidth: '70px',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 6px center',
        paddingRight: '24px'
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
