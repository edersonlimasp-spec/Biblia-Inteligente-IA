/**
 * Bible Version Selector Component
 * Permite ao usuário escolher entre múltiplas versões
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  { code: "ACF", label: "ACF - Corrigida Fiel", short: "ACF", available: true },
  { code: "ARC", label: "ARC - Revista e Corrigida", short: "ARC", available: true },
  { code: "NVI", label: "NVI - Nova Versão Internacional", short: "NVI", available: true },
];

const SPANISH_VERSIONS = [
  { code: "RVR1960", label: "RVR - Reina Valera 1960", short: "RVR", available: true },
];

const ENGLISH_VERSIONS = [
  { code: "KJV", label: "KJV - King James Version", short: "KJV", available: true },
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
      <DropdownMenuContent align="end" className="w-56">
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
            <span className="text-sm">{version.label.replace(/^[A-Z]+\s*-\s*/, '')}</span>
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
            <span className="text-sm">{version.label.replace(/^[A-Z]+\s*-\s*/, '')}</span>
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
            <span className="text-sm">{version.label.replace(/^[A-Z]+\s*-\s*/, '')}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
