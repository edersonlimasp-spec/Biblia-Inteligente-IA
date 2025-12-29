import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { apiRequest } from "@/lib/queryClient";

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
  es: "RVR",
};

const translations: Record<AppLanguage, Record<string, string>> = {
  pt: {
    "search.placeholder": "Buscar versículo ou palavra...",
    "version.select": "Selecionar versão",
    "strong.fallback": "Definição disponível em inglês",
    "ai.thinking": "Pensando...",
    "ai.send": "Enviar",
    "ai.placeholder": "Faça uma pergunta sobre a Bíblia...",
    "nav.bible": "Bíblia",
    "nav.dashboard": "Início",
    "nav.settings": "Configurações",
    "nav.bookmarks": "Marcações",
    "loading": "Carregando...",
    "error": "Erro",
    "retry": "Tentar novamente",
    "chapter": "Capítulo",
    "verse": "Versículo",
    "book": "Livro",
  },
  en: {
    "search.placeholder": "Search verse or word...",
    "version.select": "Select version",
    "strong.fallback": "Definition available in English",
    "ai.thinking": "Thinking...",
    "ai.send": "Send",
    "ai.placeholder": "Ask a question about the Bible...",
    "nav.bible": "Bible",
    "nav.dashboard": "Home",
    "nav.settings": "Settings",
    "nav.bookmarks": "Bookmarks",
    "loading": "Loading...",
    "error": "Error",
    "retry": "Try again",
    "chapter": "Chapter",
    "verse": "Verse",
    "book": "Book",
  },
  es: {
    "search.placeholder": "Buscar versículo o palabra...",
    "version.select": "Seleccionar versión",
    "strong.fallback": "Definición disponible en inglés",
    "ai.thinking": "Pensando...",
    "ai.send": "Enviar",
    "ai.placeholder": "Haz una pregunta sobre la Biblia...",
    "nav.bible": "Biblia",
    "nav.dashboard": "Inicio",
    "nav.settings": "Configuración",
    "nav.bookmarks": "Marcadores",
    "loading": "Cargando...",
    "error": "Error",
    "retry": "Intentar de nuevo",
    "chapter": "Capítulo",
    "verse": "Versículo",
    "book": "Libro",
  },
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
      const browserLang = navigator.language.substring(0, 2).toLowerCase();
      if (browserLang === "es") return "es";
      if (browserLang === "en") return "en";
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
