import { createContext, useContext, useState, useRef, useEffect, useCallback, ReactNode } from 'react';

type Screen = 
  | "splash"
  | "login"
  | "register"
  | "forgot-password"
  | "reset-password"
  | "dashboard"
  | "bible"
  | "bookmarks"
  | "prayer"
  | "achievements"
  | "games"
  | "professor"
  | "ai-modes"
  | "plans-progress"
  | "calendar"
  | "recordings"
  | "subscriptions"
  | "settings"
  | "history"
  | "admin"
  | "professor-premium"
  | "module-detail"
  | "lesson"
  | "install";

interface TargetVerse {
  book: string;
  chapter: number;
  verse: number;
  source?: 'bookmark' | 'annotation';
}

interface NavigationContextValue {
  currentScreen: Screen;
  navigate: (screen: Screen) => void;
  goBack: () => boolean;
  canGoBack: boolean;
  selectedModuleId: string | null;
  setSelectedModuleId: (id: string | null) => void;
  selectedLessonId: string | null;
  setSelectedLessonId: (id: string | null) => void;
  selectedTrackLevel: string;
  setSelectedTrackLevel: (level: string) => void;
  targetVerse: TargetVerse | null;
  navigateToVerse: (book: string, chapter: number, verse: number, source?: 'bookmark' | 'annotation') => void;
  clearTargetVerse: () => void;
  shouldResetAI: boolean;
  clearResetAI: () => void;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

const HOME_SCREEN: Screen = "dashboard";

const SCREEN_PARENT_MAP: Record<Screen, Screen | null> = {
  "splash": null,
  "login": "dashboard",
  "register": "login",
  "forgot-password": "login",
  "reset-password": "login",
  "dashboard": null,
  "bible": "dashboard",
  "bookmarks": "bible",
  "prayer": "dashboard",
  "achievements": "dashboard",
  "games": "dashboard",
  "professor": "dashboard",
  "ai-modes": "dashboard",
  "plans-progress": "dashboard",
  "calendar": "dashboard",
  "recordings": "dashboard",
  "subscriptions": "dashboard",
  "settings": "dashboard",
  "history": "dashboard",
  "admin": "dashboard",
  "professor-premium": "dashboard",
  "module-detail": "professor-premium",
  "lesson": "module-detail",
  "install": "dashboard",
};

interface NavigationProviderProps {
  children: ReactNode;
  onExitRequest: () => void;
}

export function NavigationProvider({ children, onExitRequest }: NavigationProviderProps) {
  const [currentScreen, setCurrentScreen] = useState<Screen>("splash");
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [selectedTrackLevel, setSelectedTrackLevel] = useState<string>("iniciante");
  const [targetVerse, setTargetVerse] = useState<TargetVerse | null>(null);
  const [shouldResetAI, setShouldResetAI] = useState(false);
  
  const historyStack = useRef<Screen[]>(["splash"]);
  const isHandlingPopState = useRef(false);
  const isHandlingGoBack = useRef(false);

  const navigate = useCallback((screen: Screen) => {
    if (screen === currentScreen) return;
    
    if (screen === HOME_SCREEN && historyStack.current.length === 1 && historyStack.current[0] === "splash") {
      historyStack.current = [HOME_SCREEN];
      window.history.replaceState({ screen, stackLength: 1 }, '', window.location.href);
    } else {
      historyStack.current.push(screen);
      window.history.pushState({ screen, stackLength: historyStack.current.length }, '', window.location.href);
    }
    setCurrentScreen(screen);
  }, [currentScreen]);

  const performBack = useCallback((): boolean => {
    if (historyStack.current.length > 1) {
      historyStack.current.pop();
      const previousScreen = historyStack.current[historyStack.current.length - 1];
      
      if (previousScreen === "module-detail" && selectedLessonId) {
        setSelectedLessonId(null);
      }
      if (previousScreen === "dashboard") {
        setSelectedModuleId(null);
        setSelectedLessonId(null);
      }
      
      setCurrentScreen(previousScreen);
      return true;
    }
    
    const parentScreen = SCREEN_PARENT_MAP[currentScreen];
    if (parentScreen) {
      historyStack.current = [HOME_SCREEN];
      if (parentScreen !== HOME_SCREEN) {
        historyStack.current.push(parentScreen);
      }
      setCurrentScreen(parentScreen);
      return true;
    }
    
    if (currentScreen !== HOME_SCREEN) {
      historyStack.current = [HOME_SCREEN];
      setCurrentScreen(HOME_SCREEN);
      return true;
    }
    
    return false;
  }, [currentScreen, selectedLessonId, selectedModuleId]);

  const goBack = useCallback((): boolean => {
    if (isHandlingPopState.current) {
      return performBack();
    }
    
    if (historyStack.current.length > 1 || currentScreen !== HOME_SCREEN) {
      isHandlingGoBack.current = true;
      window.history.back();
      return true;
    }
    
    return false;
  }, [currentScreen, performBack]);

  const navigateToVerse = useCallback((book: string, chapter: number, verse: number, source?: 'bookmark' | 'annotation') => {
    console.log('[NavigationContext] navigateToVerse called - book:', book, 'chapter:', chapter, 'verse:', verse, 'source:', source);
    setTargetVerse({ book, chapter, verse, source });
    // Só resetar AI se vier de anotações (não de bookmarks)
    if (source === 'annotation') {
      console.log('[NavigationContext] Setting shouldResetAI to TRUE');
      setShouldResetAI(true);
    }
    navigate("bible");
  }, [navigate]);

  const clearTargetVerse = useCallback(() => {
    setTargetVerse(null);
  }, []);

  const clearResetAI = useCallback(() => {
    setShouldResetAI(false);
  }, []);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      event.preventDefault();
      
      if (currentScreen === HOME_SCREEN && historyStack.current.length <= 1) {
        window.history.pushState({ screen: HOME_SCREEN, stackLength: 1 }, '', window.location.href);
        onExitRequest();
        return;
      }
      
      isHandlingPopState.current = true;
      const wentBack = performBack();
      isHandlingPopState.current = false;
      isHandlingGoBack.current = false;
      
      if (!wentBack) {
        window.history.pushState({ screen: HOME_SCREEN, stackLength: 1 }, '', window.location.href);
        onExitRequest();
      }
    };

    window.history.replaceState({ screen: currentScreen, stackLength: historyStack.current.length }, '', window.location.href);
    
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [currentScreen, performBack, onExitRequest]);

  useEffect(() => {
    if (isHandlingPopState.current) {
      isHandlingPopState.current = false;
    }
  }, [currentScreen]);

  const value: NavigationContextValue = {
    currentScreen,
    navigate,
    goBack,
    canGoBack: historyStack.current.length > 1 || currentScreen !== HOME_SCREEN,
    selectedModuleId,
    setSelectedModuleId,
    selectedLessonId,
    setSelectedLessonId,
    selectedTrackLevel,
    setSelectedTrackLevel,
    targetVerse,
    navigateToVerse,
    clearTargetVerse,
    shouldResetAI,
    clearResetAI,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}
