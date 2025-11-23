/**
 * Almeida Version Selector Component
 * Permite ao usuário escolher entre:
 * - ACF (Almeida Corrigida Fiel)
 * - ARC (Almeida Revista e Corrigida)
 * - AA (Almeida Atualizada)
 * - ALMEIDA_1911 (Almeida 1911)
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AlmeidaVersionSelectorProps {
  selectedVersion: string;
  onVersionChange: (version: string) => void;
  disabled?: boolean;
}

const ALMEIDA_VERSIONS = [
  { code: "ACF", label: "ACF - Corrigida Fiel", short: "ACF" },
  { code: "ARC", label: "ARC - Revista e Corrigida", short: "ARC" },
  { code: "AA", label: "AA - Atualizada", short: "AA" },
  { code: "ALMEIDA_1911", label: "Almeida 1911", short: "ALM" },
];

export function AlmeidaVersionSelector({
  selectedVersion,
  onVersionChange,
  disabled = false,
}: AlmeidaVersionSelectorProps) {
  const currentVersion = ALMEIDA_VERSIONS.find(v => v.code === selectedVersion);
  const displayText = currentVersion?.short || "ACF";
  
  return (
    <Select
      value={selectedVersion}
      onValueChange={onVersionChange}
      disabled={disabled}
    >
      <SelectTrigger className="w-11 text-xs font-bold h-8" data-testid="select-almeida-version">
        <span>{displayText}</span>
      </SelectTrigger>
      <SelectContent data-testid="select-almeida-version-content">
        {ALMEIDA_VERSIONS.map((version) => (
          <SelectItem
            key={version.code}
            value={version.code}
            data-testid={`select-version-${version.code}`}
          >
            {version.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
