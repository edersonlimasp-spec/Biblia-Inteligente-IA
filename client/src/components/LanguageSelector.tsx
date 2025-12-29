import { useLanguage, type AppLanguage } from "@/contexts/LanguageContext";

const FLAGS: Record<AppLanguage, { emoji: string; label: string }> = {
  pt: { emoji: "🇧🇷", label: "Português" },
  en: { emoji: "🇺🇸", label: "English" },
  es: { emoji: "🇪🇸", label: "Español" },
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
              text-lg leading-none p-1 rounded transition-all duration-150
              ${isActive 
                ? "opacity-100 ring-2 ring-primary/50 ring-offset-1 ring-offset-background scale-110" 
                : "opacity-50 hover:opacity-80 hover:scale-105"
              }
            `}
            title={FLAGS[lang].label}
            aria-label={`${FLAGS[lang].label}${isActive ? " (ativo)" : ""}`}
            data-testid={`flag-${lang}`}
          >
            <span role="img" aria-hidden="true">
              {FLAGS[lang].emoji}
            </span>
          </button>
        );
      })}
    </div>
  );
}
