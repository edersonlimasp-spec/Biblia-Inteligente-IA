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

export async function initializeCapacitor() {
  if (!isNative) return;

  try {
    await SplashScreen.hide({ fadeOutDuration: 500 });
    
    await StatusBar.setStyle({ style: Style.Dark });
    
    if (isAndroid) {
      await StatusBar.setBackgroundColor({ color: '#1A5299' });
    }

    Keyboard.addListener('keyboardWillShow', () => {
      document.body.classList.add('keyboard-visible');
    });

    Keyboard.addListener('keyboardWillHide', () => {
      document.body.classList.remove('keyboard-visible');
    });

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
