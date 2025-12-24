/**
 * Bible Version Selector Component
 * Permite ao usuário escolher entre múltiplas versões
 */

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

interface VersionSelectorProps {
  selectedVersion: string;
  onVersionChange: (version: string) => void;
  disabled?: boolean;
}

const PORTUGUESE_VERSIONS = [
  { code: "ACF", label: "Almeida Corrigida Fiel", short: "ACF" },
  { code: "ARC", label: "Almeida Revista e Corrigida", short: "ARC" },
  { code: "AA", label: "Almeida Atualizada", short: "AA" },
  { code: "ALMEIDA_1911", label: "Almeida 1911", short: "1911" },
  { code: "NVI", label: "Nova Versão Internacional", short: "NVI" },
  { code: "NTLH", label: "Nova Tradução Linguagem de Hoje", short: "NTLH" },
  { code: "NBV", label: "Nova Bíblia Viva", short: "NBV" },
  { code: "TLA", label: "Tradução Linguagem Atual", short: "TLA" },
  { code: "KJA", label: "King James Atualizada", short: "KJA" },
];

const SPANISH_VERSIONS = [
  { code: "RVR1960", label: "Reina Valera 1960", short: "RVR" },
];

const ENGLISH_VERSIONS = [
  { code: "KJV", label: "King James Version", short: "KJV" },
  { code: "ASV", label: "American Standard Version", short: "ASV" },
  { code: "ESV", label: "English Standard Version", short: "ESV" },
  { code: "NASB", label: "New American Standard Bible", short: "NASB" },
  { code: "WEB", label: "World English Bible", short: "WEB" },
];

export function AlmeidaVersionSelector({
  selectedVersion,
  onVersionChange,
  disabled = false,
}: VersionSelectorProps) {
  const allVersions = [...PORTUGUESE_VERSIONS, ...SPANISH_VERSIONS, ...ENGLISH_VERSIONS];
  const currentVersion = allVersions.find(v => v.code === selectedVersion);
  const displayText = currentVersion?.short || "ACF";
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-14 h-9 px-1.5 font-bold text-xs border border-primary/30 hover:bg-primary/5"
          data-testid="button-version-selector"
          disabled={disabled}
        >
          {displayText}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 max-h-80 overflow-y-auto">
        <DropdownMenuLabel className="text-xs font-semibold text-primary">
          Português
        </DropdownMenuLabel>
        {PORTUGUESE_VERSIONS.map((version) => (
          <DropdownMenuItem
            key={version.code}
            onClick={() => onVersionChange(version.code)}
            data-testid={`select-version-${version.code}`}
            className={selectedVersion === version.code ? "bg-primary/10" : ""}
          >
            <span className="font-mono text-xs font-bold mr-2 w-12">{version.short}</span>
            <span className="text-sm truncate">{version.label}</span>
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel className="text-xs font-semibold text-primary">
          Español
        </DropdownMenuLabel>
        {SPANISH_VERSIONS.map((version) => (
          <DropdownMenuItem
            key={version.code}
            onClick={() => onVersionChange(version.code)}
            data-testid={`select-version-${version.code}`}
            className={selectedVersion === version.code ? "bg-primary/10" : ""}
          >
            <span className="font-mono text-xs font-bold mr-2 w-12">{version.short}</span>
            <span className="text-sm truncate">{version.label}</span>
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel className="text-xs font-semibold text-primary">
          English
        </DropdownMenuLabel>
        {ENGLISH_VERSIONS.map((version) => (
          <DropdownMenuItem
            key={version.code}
            onClick={() => onVersionChange(version.code)}
            data-testid={`select-version-${version.code}`}
            className={selectedVersion === version.code ? "bg-primary/10" : ""}
          >
            <span className="font-mono text-xs font-bold mr-2 w-12">{version.short}</span>
            <span className="text-sm truncate">{version.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
