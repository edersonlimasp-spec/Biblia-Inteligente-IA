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
    console.error("[LanguageSelector] LanguageContext is undefined");
    return null;
  }
  
  const { language, setLanguage } = languageContext;

  const handleLanguageChange = (lang: AppLanguage) => {
    console.log("[LanguageSelector] Changing language to:", lang);
    setLanguage(lang);
  };

  return (
    <div 
      className={`flex items-center ml-6 ${className}`} 
      data-testid="language-selector"
      style={{ 
        gap: '2px',
        zIndex: 9999, 
        position: 'relative',
      }}
    >
      {(Object.keys(FLAGS) as AppLanguage[]).map((lang) => {
        const isActive = language === lang;
        return (
          <button
            key={lang}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleLanguageChange(lang);
            }}
            style={{
              fontSize: '1.5rem',
              lineHeight: 1,
              padding: '2px 4px',
              borderRadius: '4px',
              border: isActive ? '2px solid #1A5299' : '2px solid transparent',
              background: isActive ? 'rgba(26, 82, 153, 0.2)' : 'transparent',
              opacity: isActive ? 1 : 0.5,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              display: 'inline-block',
              fontFamily: 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif',
            }}
            title={FLAGS[lang].label}
            aria-label={FLAGS[lang].label}
            data-testid={`flag-${lang}`}
          >
            <span style={{ display: 'block' }}>{FLAGS[lang].emoji}</span>
          </button>
        );
      })}
    </div>
  );
}
