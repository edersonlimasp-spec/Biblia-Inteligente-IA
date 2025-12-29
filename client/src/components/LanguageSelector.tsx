import { useLanguage, type AppLanguage } from "@/contexts/LanguageContext";

const FLAGS: Record<AppLanguage, { code: string; label: string }> = {
  pt: { code: "PT", label: "Português" },
  en: { code: "EN", label: "English" },
  es: { code: "ES", label: "Español" },
};

interface LanguageSelectorProps {
  className?: string;
}

export function LanguageSelector({ className = "" }: LanguageSelectorProps) {
  const { language, setLanguage } = useLanguage();

  const handleLanguageChange = (lang: AppLanguage) => {
    if (lang !== language) {
      setLanguage(lang);
    }
  };

  return (
    <div className={`flex items-center gap-1 ${className}`} data-testid="language-selector">
      {(Object.keys(FLAGS) as AppLanguage[]).map((lang) => {
        const isActive = language === lang;
        return (
          <button
            key={lang}
            onClick={() => handleLanguageChange(lang)}
            className={`
              text-xs font-bold leading-none px-2 py-1 rounded transition-all duration-150
              ${isActive 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted text-muted-foreground hover:bg-muted/80"
              }
            `}
            title={FLAGS[lang].label}
            aria-label={`${FLAGS[lang].label}${isActive ? " (ativo)" : ""}`}
            data-testid={`flag-${lang}`}
          >
            {FLAGS[lang].code}
          </button>
        );
      })}
    </div>
  );
}
