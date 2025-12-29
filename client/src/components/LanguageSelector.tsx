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
    <div className={`flex items-center gap-0.5 ${className}`} data-testid="language-selector">
      {(Object.keys(FLAGS) as AppLanguage[]).map((lang) => {
        const isActive = language === lang;
        return (
          <button
            key={lang}
            type="button"
            onClick={() => handleLanguageChange(lang)}
            className={`
              text-base sm:text-lg p-1 rounded-md transition-all
              ${isActive 
                ? "bg-primary/20 ring-1 ring-primary/40" 
                : "opacity-50 hover:opacity-100 hover:bg-muted"
              }
            `}
            title={FLAGS[lang].label}
            aria-label={`${FLAGS[lang].label}${isActive ? " (ativo)" : ""}`}
            data-testid={`flag-${lang}`}
          >
            <span className="block w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center">
              {FLAGS[lang].emoji}
            </span>
          </button>
        );
      })}
    </div>
  );
}
