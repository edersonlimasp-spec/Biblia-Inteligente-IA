import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe } from "lucide-react";
import type { BibleVersion } from "@shared/schema";

interface BibleVersionSelectorProps {
  selectedVersion: string;
  onVersionChange: (versionCode: string) => void;
}

export function BibleVersionSelector({ selectedVersion, onVersionChange }: BibleVersionSelectorProps) {
  const { data: versions, isLoading } = useQuery<BibleVersion[]>({
    queryKey: ['/api/versions'],
  });

  // Group versions by language
  const versionsByLanguage = (versions || []).reduce((acc, v) => {
    if (!acc[v.language]) acc[v.language] = [];
    acc[v.language].push(v);
    return acc;
  }, {} as Record<string, BibleVersion[]>);

  const languageLabels: Record<string, string> = {
    pt: 'Português',
    en: 'English',
  };

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-muted-foreground" />
      <Select value={selectedVersion} onValueChange={onVersionChange} disabled={isLoading}>
        <SelectTrigger className="w-[180px]" data-testid="select-bible-version">
          <SelectValue placeholder="Selecionar versão..." />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(versionsByLanguage).map(([lang, versionList]) => (
            <div key={lang}>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                {languageLabels[lang] || lang}
              </div>
              {versionList.map(version => (
                <SelectItem key={version.code} value={version.code} data-testid={`option-version-${version.code}`}>
                  {version.code} - {version.name}
                </SelectItem>
              ))}
            </div>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
