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
      // Evita ANR "No focused window" na abertura e flags de tela cheia descontinuadas.
      launchShowDuration: 0,
      launchAutoHide: true,
      launchFadeOutDuration: 500,
      backgroundColor: '#1A5299',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: false,
      splashImmersive: false,
    },
    SystemBars: {
      // Android: barras do sistema tratadas no nativo (MainActivity) em todas as versoes.
      insetsHandling: 'disable',
    },
    StatusBar: {
      // Ícones claros sobre o cabeçalho escuro. Com overlay, o próprio header
      // preenche a safe area; não sobra uma superfície nativa branca acima dele.
      style: 'LIGHT',
      overlaysWebView: true,
    },
    FirebaseMessaging: {
      presentationOptions: ['alert', 'badge', 'sound'],
    },
    Keyboard: {
      resize: 'body',
      // Android: o recuo do teclado e feito no nativo (MainActivity); evita espaco em dobro.
      resizeOnFullScreen: false,
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
    handleApplicationNotifications: true,
  },
};

export default config;
