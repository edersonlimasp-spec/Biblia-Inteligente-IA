/**
 * Almeida Version Selector Component
 * Permite ao usuário escolher entre:
 * - ACF (Almeida Corrigida Fiel)
 * - ARC (Almeida Revista e Corrigida)
 * - AA (Almeida Atualizada)
 * - ALMEIDA_1911 (Almeida 1911)
 */

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe } from "lucide-react";

interface AlmeidaVersionSelectorProps {
  selectedVersion: string;
  onVersionChange: (version: string) => void;
  disabled?: boolean;
}

const ALMEIDA_VERSIONS = [
  { code: "ACF", label: "ACF - Corrigida Fiel" },
  { code: "ARC", label: "ARC - Revista e Corrigida" },
  { code: "AA", label: "AA - Atualizada" },
  { code: "ALMEIDA_1911", label: "Almeida 1911" },
];

export function AlmeidaVersionSelector({
  selectedVersion,
  onVersionChange,
  disabled = false,
}: AlmeidaVersionSelectorProps) {
  const currentVersion = ALMEIDA_VERSIONS.find(v => v.code === selectedVersion);
  
  return (
    <div className="flex items-center gap-2">
      <Globe className="w-4 h-4 text-muted-foreground" />
      <Select
        value={selectedVersion}
        onValueChange={onVersionChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-44" data-testid="select-almeida-version">
          <SelectValue />
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
    </div>
  );
}
