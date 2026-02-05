import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { translations } from "@/lib/translations";

export type AppLanguage = "pt" | "en" | "es";

interface LanguageContextType {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  getDefaultBibleVersion: () => string;
  t: (key: string) => string;
}

const LANGUAGE_STORAGE_KEY = "biblia_inteligente_language";

const DEFAULT_BIBLE_VERSIONS: Record<AppLanguage, string> = {
  pt: "ACF",
  en: "KJV",
  es: "RVR1960",
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (stored && ["pt", "en", "es"].includes(stored)) {
        return stored as AppLanguage;
      }
    }
    return "pt";
  });

  useEffect(() => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [language]);

  const setLanguage = useCallback(async (lang: AppLanguage) => {
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    
    if (user) {
      try {
        await apiRequest("POST", "/api/user/language", { language: lang });
      } catch (error) {
        console.warn("[Language] Failed to save language preference to server:", error);
      }
    }
  }, [user]);

  const getDefaultBibleVersion = useCallback(() => {
    return DEFAULT_BIBLE_VERSIONS[language];
  }, [language]);

  const t = useCallback((key: string): string => {
    return translations[language]?.[key] || translations.pt[key] || key;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, getDefaultBibleVersion, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
