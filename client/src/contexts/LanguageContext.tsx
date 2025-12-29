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
    "module.bible": "Bíblia",
    "module.bible.desc": "Leitura, Strong's, Hebraico e Grego",
    "module.chat": "Chat com Professor",
    "module.chat.desc": "Tire suas dúvidas e agregue conhecimentos",
    "module.ai.modes": "Modos IA Premium",
    "module.ai.modes.desc": "Pregador, Exegese, Teológica",
    "module.courses": "Cursos Premium",
    "module.courses.desc": "Estudos estruturados com IA",
    "module.plans": "Planos & Progresso",
    "module.plans.desc": "Planos de leitura e progresso por livro",
    "module.prayer": "Modo Oração",
    "module.prayer.desc": "Pedidos de oração e temporizador",
    "module.achievements": "Conquistas",
    "module.achievements.desc": "Distintivos e marcos alcançados",
    "module.agenda": "Minha Agenda",
    "module.agenda.desc": "Eventos da igreja e compromissos",
    "module.games": "Jogos Bíblicos",
    "module.games.desc": "Quiz e desafios interativos",
    "module.recordings": "Gravações",
    "module.recordings.desc": "Grave e organize seus sermões",
    "module.subscriptions": "Assinaturas",
    "module.subscriptions.desc": "Gerencie seu plano e conta",
    "module.install": "Instalar App",
    "module.install.desc": "Adicione à sua tela inicial",
    "welcome": "Bem-vindo",
    "welcome.guest": "Estudo bíblico com textos originais",
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
    "module.bible": "Bible",
    "module.bible.desc": "Reading, Strong's, Hebrew and Greek",
    "module.chat": "Chat with Professor",
    "module.chat.desc": "Ask questions and gain knowledge",
    "module.ai.modes": "Premium AI Modes",
    "module.ai.modes.desc": "Preacher, Exegesis, Theological",
    "module.courses": "Premium Courses",
    "module.courses.desc": "Structured studies with AI",
    "module.plans": "Plans & Progress",
    "module.plans.desc": "Reading plans and progress by book",
    "module.prayer": "Prayer Mode",
    "module.prayer.desc": "Prayer requests and timer",
    "module.achievements": "Achievements",
    "module.achievements.desc": "Badges and milestones reached",
    "module.agenda": "My Agenda",
    "module.agenda.desc": "Church events and appointments",
    "module.games": "Bible Games",
    "module.games.desc": "Quiz and interactive challenges",
    "module.recordings": "Recordings",
    "module.recordings.desc": "Record and organize your sermons",
    "module.subscriptions": "Subscriptions",
    "module.subscriptions.desc": "Manage your plan and account",
    "module.install": "Install App",
    "module.install.desc": "Add to your home screen",
    "welcome": "Welcome",
    "welcome.guest": "Bible study with original texts",
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
    "module.bible": "Biblia",
    "module.bible.desc": "Lectura, Strong's, Hebreo y Griego",
    "module.chat": "Chat con Profesor",
    "module.chat.desc": "Resuelve tus dudas y aprende más",
    "module.ai.modes": "Modos IA Premium",
    "module.ai.modes.desc": "Predicador, Exégesis, Teológica",
    "module.courses": "Cursos Premium",
    "module.courses.desc": "Estudios estructurados con IA",
    "module.plans": "Planes y Progreso",
    "module.plans.desc": "Planes de lectura y progreso por libro",
    "module.prayer": "Modo Oración",
    "module.prayer.desc": "Peticiones de oración y temporizador",
    "module.achievements": "Logros",
    "module.achievements.desc": "Insignias y metas alcanzadas",
    "module.agenda": "Mi Agenda",
    "module.agenda.desc": "Eventos de la iglesia y compromisos",
    "module.games": "Juegos Bíblicos",
    "module.games.desc": "Quiz y desafíos interactivos",
    "module.recordings": "Grabaciones",
    "module.recordings.desc": "Graba y organiza tus sermones",
    "module.subscriptions": "Suscripciones",
    "module.subscriptions.desc": "Gestiona tu plan y cuenta",
    "module.install": "Instalar App",
    "module.install.desc": "Añade a tu pantalla de inicio",
    "welcome": "Bienvenido",
    "welcome.guest": "Estudio bíblico con textos originales",
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
