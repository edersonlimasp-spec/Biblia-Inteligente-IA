/**
 * Translation Registry - Catálogo único de versões bíblicas
 * 
 * Este arquivo define todas as traduções disponíveis no sistema,
 * suas licenças, fontes e status de disponibilidade.
 */

export type LicenseType = "public_domain" | "licensed_api" | "commercial_pending";
export type DataSource = "local_db" | "external_api" | "pending";

export interface BibleTranslation {
  id: string;
  code: string;
  name: string;
  language: "pt" | "en" | "es";
  licenseType: LicenseType;
  source: DataSource;
  enabled: boolean;
  hasData: boolean;
  sourceUrl?: string;
  notes?: string;
}

export const TRANSLATION_REGISTRY: BibleTranslation[] = [
  // === PORTUGUÊS ===
  {
    id: "pt-acf",
    code: "ACF",
    name: "Almeida Corrigida Fiel",
    language: "pt",
    licenseType: "public_domain",
    source: "local_db",
    enabled: true,
    hasData: true,
    sourceUrl: "https://github.com/thiagobodruk/bible",
    notes: "Domínio público. 31,106 versos importados."
  },
  {
    id: "pt-arc",
    code: "ARC",
    name: "Almeida Revista e Corrigida",
    language: "pt",
    licenseType: "public_domain",
    source: "local_db",
    enabled: true,
    hasData: true,
    sourceUrl: "https://github.com/thiagobodruk/bible",
    notes: "Domínio público. 29,779 versos importados."
  },
  {
    id: "pt-nvi",
    code: "NVI",
    name: "Nova Versão Internacional",
    language: "pt",
    licenseType: "public_domain",
    source: "local_db",
    enabled: true,
    hasData: true,
    sourceUrl: "https://github.com/thiagobodruk/bible",
    notes: "29,779 versos importados."
  },
  {
    id: "pt-aa",
    code: "AA",
    name: "Almeida Atualizada",
    language: "pt",
    licenseType: "public_domain",
    source: "local_db",
    enabled: false,
    hasData: false,
    notes: "Dados pendentes de importação."
  },
  {
    id: "pt-almeida1911",
    code: "ALMEIDA_1911",
    name: "Almeida 1911",
    language: "pt",
    licenseType: "public_domain",
    source: "local_db",
    enabled: false,
    hasData: false,
    notes: "Domínio público. Dados pendentes de importação."
  },
  {
    id: "pt-kja",
    code: "KJA",
    name: "King James Atualizada",
    language: "pt",
    licenseType: "commercial_pending",
    source: "pending",
    enabled: false,
    hasData: false,
    sourceUrl: "https://www.kingmessiahbible.com",
    notes: "Licença comercial necessária. Aguardando autorização."
  },
  {
    id: "pt-nbv",
    code: "NBV",
    name: "Nova Bíblia Viva",
    language: "pt",
    licenseType: "commercial_pending",
    source: "pending",
    enabled: false,
    hasData: false,
    sourceUrl: "https://www.sbb.org.br",
    notes: "Licença SBB necessária. Aguardando autorização."
  },
  {
    id: "pt-ntlh",
    code: "NTLH",
    name: "Nova Tradução na Linguagem de Hoje",
    language: "pt",
    licenseType: "commercial_pending",
    source: "pending",
    enabled: false,
    hasData: false,
    sourceUrl: "https://www.sbb.org.br",
    notes: "Licença SBB necessária. Aguardando autorização."
  },
  {
    id: "pt-tla",
    code: "TLA",
    name: "Tradução Linguagem Atual",
    language: "pt",
    licenseType: "commercial_pending",
    source: "pending",
    enabled: false,
    hasData: false,
    sourceUrl: "https://www.sbb.org.br",
    notes: "Licença SBB necessária. Aguardando autorização."
  },

  // === ENGLISH ===
  {
    id: "en-kjv",
    code: "KJV",
    name: "King James Version",
    language: "en",
    licenseType: "public_domain",
    source: "local_db",
    enabled: true,
    hasData: true,
    sourceUrl: "https://github.com/thiagobodruk/bible",
    notes: "Domínio público (1611). 31,102 versos importados."
  },
  {
    id: "en-asv",
    code: "ASV",
    name: "American Standard Version",
    language: "en",
    licenseType: "public_domain",
    source: "local_db",
    enabled: false,
    hasData: false,
    sourceUrl: "https://github.com/thiagobodruk/bible",
    notes: "Domínio público (1901). Dados pendentes de importação."
  },
  {
    id: "en-web",
    code: "WEB",
    name: "World English Bible",
    language: "en",
    licenseType: "public_domain",
    source: "local_db",
    enabled: false,
    hasData: false,
    sourceUrl: "https://github.com/WorldEnglishBible/WEB",
    notes: "Domínio público. Dados pendentes de importação."
  },
  {
    id: "en-esv",
    code: "ESV",
    name: "English Standard Version",
    language: "en",
    licenseType: "commercial_pending",
    source: "pending",
    enabled: false,
    hasData: false,
    sourceUrl: "https://www.crossway.org",
    notes: "Licença Crossway necessária. Aguardando autorização."
  },
  {
    id: "en-nasb",
    code: "NASB",
    name: "New American Standard Bible",
    language: "en",
    licenseType: "commercial_pending",
    source: "pending",
    enabled: false,
    hasData: false,
    sourceUrl: "https://www.lockman.org",
    notes: "Licença Lockman Foundation necessária. Aguardando autorização."
  },

  // === ESPAÑOL ===
  {
    id: "es-rvr1960",
    code: "RVR1960",
    name: "Reina Valera 1960",
    language: "es",
    licenseType: "public_domain",
    source: "local_db",
    enabled: true,
    hasData: true,
    sourceUrl: "https://github.com/thiagobodruk/bible",
    notes: "Domínio público. 30,819 versos importados."
  },
  {
    id: "es-rvr1909",
    code: "RVR1909",
    name: "Reina Valera 1909",
    language: "es",
    licenseType: "public_domain",
    source: "local_db",
    enabled: false,
    hasData: false,
    notes: "Domínio público. Dados pendentes de importação."
  }
];

export function getTranslation(code: string): BibleTranslation | undefined {
  return TRANSLATION_REGISTRY.find(t => t.code === code);
}

export function getEnabledTranslations(): BibleTranslation[] {
  return TRANSLATION_REGISTRY.filter(t => t.enabled);
}

export function getTranslationsWithData(): BibleTranslation[] {
  return TRANSLATION_REGISTRY.filter(t => t.enabled && t.hasData);
}

export function getTranslationsByLanguage(language: "pt" | "en" | "es"): BibleTranslation[] {
  return TRANSLATION_REGISTRY.filter(t => t.language === language && t.enabled);
}

export function isValidTranslation(code: string): boolean {
  const translation = getTranslation(code);
  return translation !== undefined && translation.enabled;
}

export function hasDataAvailable(code: string): boolean {
  const translation = getTranslation(code);
  return translation !== undefined && translation.hasData;
}

export function getDefaultTranslation(language: "pt" | "en" | "es" = "pt"): string {
  const defaults: Record<string, string> = {
    pt: "ACF",
    en: "KJV", 
    es: "RVR1960"
  };
  return defaults[language] || "ACF";
}
