import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard } from '@capacitor/keyboard';
import { App } from '@capacitor/app';

export const isNative = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform();
export const isIOS = platform === 'ios';
export const isAndroid = platform === 'android';
export const isWeb = platform === 'web';

export async function hideSplashScreen() {
  if (!isNative) return;
  try {
    await SplashScreen.hide({ fadeOutDuration: 300 });
  } catch (e) {
    console.warn('[Capacitor] SplashScreen.hide error:', e);
  }
}

export async function initializeCapacitor() {
  if (!isNative) return;

  try {
    // O conteúdo ocupa também a área da status bar; os headers absorvem o
    // safe-area-inset-top e pintam essa região com a mesma cor do app.
    await StatusBar.setOverlaysWebView({ overlay: true });
    await StatusBar.setStyle({ style: Style.Light });
    
    // setBackgroundColor removida por ser uma API descontinuada de ponta a ponta.

    let baseWindowHeight = window.innerHeight;
    let keyboardVisible = false;

    window.addEventListener('resize', () => {
      if (!keyboardVisible) {
        baseWindowHeight = window.innerHeight;
      }
    });

    const handleKeyboardShow = (keyboardHeight: number) => {
      keyboardVisible = true;
      document.body.classList.add('keyboard-visible');
      const windowShrink = Math.max(0, baseWindowHeight - window.innerHeight);
      const offset = windowShrink > keyboardHeight / 2
        ? 0
        : Math.max(0, keyboardHeight - windowShrink);
      document.documentElement.style.setProperty('--keyboard-offset', `${offset}px`);
    };

    const handleKeyboardHide = () => {
      keyboardVisible = false;
      document.body.classList.remove('keyboard-visible');
      document.documentElement.style.setProperty('--keyboard-offset', '0px');
    };

    Keyboard.addListener('keyboardWillShow', ({ keyboardHeight }) => {
      handleKeyboardShow(keyboardHeight);
    });
    Keyboard.addListener('keyboardDidShow', ({ keyboardHeight }) => {
      handleKeyboardShow(keyboardHeight);
    });
    Keyboard.addListener('keyboardWillHide', handleKeyboardHide);
    Keyboard.addListener('keyboardDidHide', handleKeyboardHide);

    document.addEventListener('touchstart', (event) => {
      if (!document.body.classList.contains('keyboard-visible')) return;
      const eventTarget = event.target;
      const target = eventTarget instanceof Element
        ? eventTarget
        : eventTarget instanceof Node
          ? eventTarget.parentElement
          : null;
      if (!target) return;
      if (target.closest('input, textarea, select, button, a, [contenteditable], [role="button"]')) return;
      void Keyboard.hide().catch((error) => {
        console.warn('[Capacitor] Keyboard.hide on outside touch failed:', error);
      });
    }, { passive: true });

    App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        App.exitApp();
      }
    });

    console.log('[Capacitor] Initialized successfully on', platform);
  } catch (error) {
    console.error('[Capacitor] Initialization error:', error);
  }
}

export async function setStatusBarStyle(dark: boolean) {
  if (!isNative) return;
  
  try {
    await StatusBar.setStyle({ style: dark ? Style.Light : Style.Dark });
  } catch (error) {
    console.error('[Capacitor] StatusBar error:', error);
  }
}

export async function hideKeyboard() {
  if (!isNative) return;
  
  try {
    await Keyboard.hide();
  } catch (error) {
    console.error('[Capacitor] Keyboard hide error:', error);
  }
}
