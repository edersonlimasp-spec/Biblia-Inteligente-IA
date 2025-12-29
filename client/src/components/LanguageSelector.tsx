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
  const languageContext = useLanguage();
  
  if (!languageContext) {
    console.error("[LanguageSelector] LanguageContext is undefined - component not wrapped in LanguageProvider");
    return null;
  }
  
  const { language, setLanguage } = languageContext;

  const handleLanguageChange = (lang: AppLanguage) => {
    if (lang !== language) {
      setLanguage(lang);
    }
  };

  return (
    <div 
      className={`flex items-center gap-1 relative ${className}`} 
      data-testid="language-selector"
      style={{ 
        zIndex: 9999, 
        pointerEvents: 'auto',
        display: 'flex',
        visibility: 'visible',
      }}
    >
      {(Object.keys(FLAGS) as AppLanguage[]).map((lang) => {
        const isActive = language === lang;
        return (
          <button
            key={lang}
            type="button"
            onClick={() => handleLanguageChange(lang)}
            style={{
              fontSize: '1.25rem',
              lineHeight: 1,
              padding: '4px 6px',
              borderRadius: '6px',
              border: isActive ? '2px solid #1A5299' : '2px solid transparent',
              background: isActive ? 'rgba(26, 82, 153, 0.15)' : 'transparent',
              opacity: isActive ? 1 : 0.6,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title={FLAGS[lang].label}
            aria-label={`${FLAGS[lang].label}${isActive ? " (ativo)" : ""}`}
            data-testid={`flag-${lang}`}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.background = 'rgba(0,0,0,0.05)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.opacity = '0.6';
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            {FLAGS[lang].emoji}
          </button>
        );
      })}
    </div>
  );
}
