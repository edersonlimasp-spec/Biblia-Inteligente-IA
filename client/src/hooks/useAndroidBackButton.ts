import { useEffect, useRef, useCallback } from 'react';

type Screen = string;

interface UseAndroidBackButtonOptions {
  currentScreen: Screen;
  setCurrentScreen: (screen: Screen) => void;
  homeScreen: Screen;
  onExitRequest: () => void;
  getParentScreen?: (screen: Screen) => Screen | null;
}

export function useAndroidBackButton({
  currentScreen,
  setCurrentScreen,
  homeScreen,
  onExitRequest,
  getParentScreen,
}: UseAndroidBackButtonOptions) {
  const historyStack = useRef<Screen[]>([homeScreen]);
  const isNavigatingBack = useRef(false);
  const lastPushedScreen = useRef<Screen>(homeScreen);

  const navigateTo = useCallback((screen: Screen) => {
    if (screen === currentScreen) return;
    
    historyStack.current.push(screen);
    lastPushedScreen.current = screen;
    
    window.history.pushState({ screen }, '', window.location.href);
    
    setCurrentScreen(screen);
  }, [currentScreen, setCurrentScreen]);

  const goBack = useCallback(() => {
    if (historyStack.current.length > 1) {
      historyStack.current.pop();
      const previousScreen = historyStack.current[historyStack.current.length - 1];
      isNavigatingBack.current = true;
      setCurrentScreen(previousScreen);
      return true;
    }
    
    if (getParentScreen) {
      const parentScreen = getParentScreen(currentScreen);
      if (parentScreen) {
        historyStack.current = [homeScreen, parentScreen];
        isNavigatingBack.current = true;
        setCurrentScreen(parentScreen);
        return true;
      }
    }
    
    if (currentScreen !== homeScreen) {
      historyStack.current = [homeScreen];
      isNavigatingBack.current = true;
      setCurrentScreen(homeScreen);
      return true;
    }
    
    return false;
  }, [currentScreen, homeScreen, setCurrentScreen, getParentScreen]);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      event.preventDefault();
      
      if (currentScreen === homeScreen) {
        window.history.pushState({ screen: homeScreen }, '', window.location.href);
        onExitRequest();
        return;
      }
      
      const wentBack = goBack();
      
      if (!wentBack) {
        onExitRequest();
      }
    };

    window.history.replaceState({ screen: currentScreen }, '', window.location.href);
    
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [currentScreen, homeScreen, goBack, onExitRequest]);

  useEffect(() => {
    if (isNavigatingBack.current) {
      isNavigatingBack.current = false;
      return;
    }
    
    if (currentScreen !== lastPushedScreen.current && currentScreen !== historyStack.current[historyStack.current.length - 1]) {
      historyStack.current.push(currentScreen);
      lastPushedScreen.current = currentScreen;
      window.history.pushState({ screen: currentScreen }, '', window.location.href);
    }
  }, [currentScreen]);

  return {
    navigateTo,
    goBack,
    canGoBack: historyStack.current.length > 1 || currentScreen !== homeScreen,
  };
}
