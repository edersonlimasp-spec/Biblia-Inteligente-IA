import { useLanguage, type AppLanguage } from "@/contexts/LanguageContext";

interface LanguageSelectorProps {
  className?: string;
}

export function LanguageSelector({ className = "" }: LanguageSelectorProps) {
  const { language, setLanguage } = useLanguage();

  const flags: { lang: AppLanguage; flag: string; label: string }[] = [
    { lang: "pt", flag: "🇧🇷", label: "Português" },
    { lang: "en", flag: "🇺🇸", label: "English" },
    { lang: "es", flag: "🇪🇸", label: "Español" },
  ];

  const handleClick = (lang: AppLanguage) => {
    console.log("[LanguageSelector] Clicked:", lang, "Current:", language);
    setLanguage(lang);
  };

  return (
    <div 
      className={`inline-flex items-center gap-1 flex-shrink-0 ${className}`}
      data-testid="language-selector"
    >
      {flags.map(({ lang, flag, label }) => {
        const isActive = language === lang;
        return (
          <button
            key={lang}
            type="button"
            onClick={() => handleClick(lang)}
            className={`w-8 h-8 text-lg flex items-center justify-center rounded-md transition-all ${
              isActive 
                ? 'border-2 border-primary bg-primary/10' 
                : 'border border-transparent opacity-60 hover:opacity-100'
            }`}
            title={label}
            aria-label={label}
            data-testid={`flag-${lang}`}
          >
            {flag}
          </button>
        );
      })}
    </div>
  );
}
