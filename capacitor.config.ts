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
      // DARK = ícones brancos — necessário sobre o cabeçalho azul (#1A5299)
      // Implementado via WindowInsetsControllerCompat (API moderna, não depreciada).
      // backgroundColor removido: em modo Edge-to-Edge, a barra de status é transparente
      // e a cor azul do cabeçalho preenche a área visualmente via CSS env(safe-area-inset-top).
      style: 'DARK',
      // overlaysWebView não definido aqui: o EdgeToEdge.enable() em MainActivity.java
      // já configura o modo correto antes dos plugins inicializarem.
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
    // backgroundColor NEUTRO (branco). O body do app define a cor real e responde a light/dark
    // via @media (prefers-color-scheme) — assim a faixa do notch e do home indicator acompanham o tema.
    backgroundColor: '#ffffff',
    webContentsDebuggingEnabled: true,
    handleApplicationNotifications: false,
  },
};

export default config;
