# Guia de Publicação nas Lojas - Capacitor

Este guia explica como compilar o app "Bíblia Inteligente" para publicação nas lojas iOS (App Store) e Android (Google Play).

## Visão Geral

O projeto usa **Capacitor** para empacotar a aplicação web React em apps nativos. Isso significa que todo o código React existente é reutilizado, rodando dentro de uma WebView nativa com acesso a recursos do dispositivo.

## Pré-requisitos

### Para Android:
- **Android Studio** (versão mais recente)
- **JDK 17+**
- Conta de desenvolvedor Google Play ($25 única)

### Para iOS:
- **Xcode 15+** (apenas macOS)
- **CocoaPods** (`sudo gem install cocoapods`)
- Conta Apple Developer ($99/ano)

## Comandos Disponíveis

```bash
# Compilar o projeto web
npm run build

# Sincronizar assets com projetos nativos
npx cap sync

# Abrir no Android Studio
npx cap open android

# Abrir no Xcode
npx cap open ios

# Executar no dispositivo/emulador
npx cap run android
npx cap run ios
```

## Passo a Passo

### 1. Primeiro Build

```bash
# Compilar a versão web de produção
npm run build

# Adicionar plataformas nativas (já instaladas via npm)
npx cap add android
npx cap add ios

# Sincronizar arquivos
npx cap sync
```

### 2. Configurar Android

1. Abra o projeto: `npx cap open android`
2. No Android Studio:
   - Aguarde o Gradle sincronizar
   - Vá em **File > Project Structure > Modules**
   - Configure `minSdkVersion: 24` e `targetSdkVersion: 34`
3. Configure o ícone do app em `android/app/src/main/res/`
4. Para gerar APK/AAB: **Build > Build Bundle(s) / APK(s)**

### 3. Configurar iOS

1. Abra o projeto: `npx cap open ios`
2. No Xcode:
   - Selecione o target "App"
   - Configure Team na aba "Signing & Capabilities"
   - Defina o Bundle Identifier: `com.bibliainteligente.app`
3. Configure ícones em **Assets.xcassets > AppIcon**
4. Para Archive: **Product > Archive**

## Configuração de Ícones

### Android
Coloque ícones em diferentes resoluções em:
- `android/app/src/main/res/mipmap-hdpi/` (72x72)
- `android/app/src/main/res/mipmap-mdpi/` (48x48)
- `android/app/src/main/res/mipmap-xhdpi/` (96x96)
- `android/app/src/main/res/mipmap-xxhdpi/` (144x144)
- `android/app/src/main/res/mipmap-xxxhdpi/` (192x192)

### iOS
Use o Asset Catalog no Xcode para adicionar ícones em todas as resoluções necessárias.

## Splash Screen

A splash screen está configurada em `capacitor.config.ts` com:
- Cor de fundo: #1A5299 (azul metálico)
- Duração: 2 segundos
- Fade out: 500ms

Para personalizar a imagem:
- **Android:** `android/app/src/main/res/drawable/splash.png`
- **iOS:** Configure no Asset Catalog do Xcode

## Live Reload (Desenvolvimento)

Para testar em dispositivo real com hot reload:

1. Descubra seu IP local: `hostname -I` (Linux) ou `ipconfig` (Windows)
2. Edite `capacitor.config.ts`:
```typescript
server: {
  url: 'http://SEU_IP:5000',
  cleartext: true
}
```
3. Execute `npx cap run android` ou `npx cap run ios`

**⚠️ Remova a configuração `server` antes do build de produção!**

## Publicação

### Google Play Store

1. Gere um AAB (Android App Bundle): **Build > Build Bundle(s) / APK(s) > Build Bundle(s)**
2. Crie uma chave de assinatura (keystore)
3. Faça upload no [Google Play Console](https://play.google.com/console)

### Apple App Store

1. No Xcode: **Product > Archive**
2. Clique em "Distribute App"
3. Selecione "App Store Connect"
4. Complete o processo no [App Store Connect](https://appstoreconnect.apple.com)

## Plugins Capacitor Instalados

| Plugin | Função |
|--------|--------|
| @capacitor/splash-screen | Splash screen nativa |
| @capacitor/status-bar | Controle da barra de status |
| @capacitor/app | Eventos do app (background, deep links) |
| @capacitor/keyboard | Controle do teclado virtual |
| @capacitor/haptics | Feedback tátil (vibração) |

## Estrutura de Arquivos Capacitor

```
projeto/
├── android/                 # Projeto Android Studio
├── ios/                     # Projeto Xcode
├── capacitor.config.ts      # Configuração do Capacitor
└── client/src/lib/capacitor.ts  # Utilitários para código React
```

## Detectando Plataforma no Código

```typescript
import { isNative, isIOS, isAndroid, isWeb } from '@/lib/capacitor';

if (isNative) {
  // Código específico para app nativo
}

if (isIOS) {
  // Código específico iOS
}
```

## Solução de Problemas

### "Unable to find native platform"
Execute: `npx cap add android` ou `npx cap add ios`

### Erros de permissão no Android
Adicione permissões em `android/app/src/main/AndroidManifest.xml`

### Build iOS falha
1. Execute `pod install` dentro de `ios/App`
2. Verifique se o Team está configurado no Xcode

## Próximos Passos

1. Configure os ícones do app
2. Prepare screenshots para as lojas
3. Crie descrições e metadata
4. Configure políticas de privacidade
5. Submeta para revisão
