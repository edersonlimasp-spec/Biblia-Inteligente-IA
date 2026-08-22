import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.replit.bibliainteligente.twa',
  appName: 'Bíblia Inteligente',
  webDir: 'dist/public',
  
  // Server configuration for development
  // Uncomment and set your local IP for live reload testing:
  // server: {
  //   url: 'http://YOUR_LOCAL_IP:5000',
  //   cleartext: true
  // },

  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      launchFadeOutDuration: 500,
      backgroundColor: '#1A5299',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      // Ícones claros sobre o cabeçalho escuro. Com overlay, o próprio header
      // preenche a safe area; não sobra uma superfície nativa branca acima dele.
      style: 'LIGHT',
      overlaysWebView: true,
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
    App: {
      // Deep linking configuration if needed
    }
  },

  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },

  ios: {
    // 'never' evita que o WKWebView aplique insets automáticos sobre o conteúdo
    // (causa "fora de esquadro" na abertura). As safe-areas são tratadas via CSS env(safe-area-inset-*).
    contentInset: 'never',
    allowsLinkPreview: true,
    scrollEnabled: true,
    // Fundo de segurança do WKWebView, visível durante a primeira pintura e
    // eventuais redimensionamentos/overscrolls antes do CSS ser redesenhado.
    backgroundColor: '#0A1420',
    webContentsDebuggingEnabled: true,
    handleApplicationNotifications: false,
  },
};

export default config;
