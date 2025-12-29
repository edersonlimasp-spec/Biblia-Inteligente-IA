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
      className={`inline-flex items-center ml-3 ${className}`}
      style={{ gap: '2px' }}
      data-testid="language-selector"
    >
      {flags.map(({ lang, flag, label }) => {
        const isActive = language === lang;
        return (
          <button
            key={lang}
            type="button"
            onClick={() => handleClick(lang)}
            style={{
              width: '20px',
              height: '20px',
              fontSize: '12px',
              lineHeight: 1,
              padding: 0,
              borderRadius: '3px',
              border: isActive ? '1.5px solid #1A5299' : '1px solid transparent',
              background: isActive ? 'rgba(26, 82, 153, 0.15)' : 'transparent',
              opacity: isActive ? 1 : 0.5,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.1s ease',
            }}
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
