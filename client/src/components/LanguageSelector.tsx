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

  return (
    <div 
      className={`inline-flex items-center ml-4 ${className}`}
      style={{ gap: '1px' }}
      data-testid="language-selector"
    >
      {flags.map(({ lang, flag, label }) => {
        const isActive = language === lang;
        return (
          <button
            key={lang}
            type="button"
            onClick={() => setLanguage(lang)}
            className={`
              text-sm rounded px-1 py-0.5 transition-all
              ${isActive 
                ? 'bg-primary/20 ring-1 ring-primary' 
                : 'opacity-50 hover:opacity-100 hover:bg-muted'
              }
            `}
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
