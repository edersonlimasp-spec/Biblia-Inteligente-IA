import { Capacitor, registerPlugin } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard } from '@capacitor/keyboard';
import { App } from '@capacitor/app';
import { installKeyboardAvoidance, keyboardShown, keyboardHidden } from './keyboardAvoid';

export const isNative = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform();
export const isIOS = platform === 'ios';
export const isAndroid = platform === 'android';
export const isWeb = platform === 'web';

// Android: o recuo das barras do sistema é feito no nativo (MainActivity) e a cor
// dessas barras acompanha o topo/rodapé da tela aberta. Ver syncAndroidSystemBars().
const SystemBarsColor = registerPlugin<{ setColors(o: { top: string; bottom: string }): Promise<void> }>('SystemBarsColor');

function toHex(color: string): string | null {
  const m = color.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s/]+([\d.]+))?\s*\)/);
  if (!m) return null;
  if (m[4] !== undefined && parseFloat(m[4]) < 0.5) return null; // transparente: sobe para o pai
  return '#' + [m[1], m[2], m[3]].map((n) => Number(n).toString(16).padStart(2, '0')).join('');
}

function colorAt(x: number, y: number): string | null {
  let el: Element | null = document.elementFromPoint(x, y);
  while (el) {
    const cs = getComputedStyle(el);
    const solid = toHex(cs.backgroundColor);
    if (solid) return solid;
    const grad = cs.backgroundImage.match(/rgba?\([^)]*\)/);
    if (grad) { const g = toHex(grad[0]); if (g) return g; }
    el = el.parentElement;
  }
  return toHex(getComputedStyle(document.body).backgroundColor) ?? toHex(getComputedStyle(document.documentElement).backgroundColor);
}

let lastBars = '';
function syncAndroidSystemBars() {
  const w = window.innerWidth / 2;
  const top = colorAt(w, 1) ?? '#0A1420';
  const bottom = colorAt(w, window.innerHeight - 2) ?? top;
  const key = top + bottom;
  if (key === lastBars) return;
  lastBars = key;
  void SystemBarsColor.setColors({ top, bottom }).catch(() => { lastBars = ''; });
}

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
    if (isAndroid) {
      // Recuo feito no nativo: o conteúdo web não soma safe-area (evita a faixa preta).
      document.documentElement.classList.add('android-native-insets');
      syncAndroidSystemBars();
      window.setInterval(syncAndroidSystemBars, 400);
      document.addEventListener('visibilitychange', () => { lastBars = ''; syncAndroidSystemBars(); });
    } else {
      await StatusBar.setOverlaysWebView({ overlay: true });
      await StatusBar.setStyle({ style: Style.Light });
    }
    
    // setBackgroundColor removida por ser uma API descontinuada de ponta a ponta.

    let baseWindowHeight = window.innerHeight;
    let keyboardVisible = false;
    let lastKeyboardHeight = 0;

    window.addEventListener('resize', () => {
      if (!keyboardVisible) {
        baseWindowHeight = window.innerHeight;
      } else {
        // a tela encolheu/cresceu com o teclado aberto: recalcula o quanto ele ainda cobre
        handleKeyboardShow(lastKeyboardHeight);
      }
    });

    const handleKeyboardShow = (keyboardHeight: number) => {
      keyboardVisible = true;
      lastKeyboardHeight = keyboardHeight;
      document.body.classList.add('keyboard-visible');
      const windowShrink = Math.max(0, baseWindowHeight - window.innerHeight);
      const offset = windowShrink > keyboardHeight / 2
        ? 0
        : Math.max(0, keyboardHeight - windowShrink);
      document.documentElement.style.setProperty('--keyboard-offset', `${offset}px`);
      keyboardShown(offset); // campo focado nunca fica atrás do teclado
    };

    const handleKeyboardHide = () => {
      keyboardVisible = false;
      document.body.classList.remove('keyboard-visible');
      document.documentElement.style.setProperty('--keyboard-offset', '0px');
      keyboardHidden();
    };

    Keyboard.addListener('keyboardWillShow', ({ keyboardHeight }) => {
      handleKeyboardShow(keyboardHeight);
    });
    Keyboard.addListener('keyboardDidShow', ({ keyboardHeight }) => {
      handleKeyboardShow(keyboardHeight);
    });
    Keyboard.addListener('keyboardWillHide', handleKeyboardHide);
    Keyboard.addListener('keyboardDidHide', handleKeyboardHide);
    installKeyboardAvoidance();

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
  if (isAndroid) { lastBars = ''; syncAndroidSystemBars(); return; } // cor/ícones vêm da tela
  
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
