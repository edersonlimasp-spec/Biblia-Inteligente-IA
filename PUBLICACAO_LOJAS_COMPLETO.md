# Guia Completo de Publicação - App Store e Google Play

Este guia detalha todo o processo para publicar o app "Bíblia Inteligente" nas lojas oficiais usando Capacitor.

## Arquitetura Atual

O projeto utiliza **Capacitor 6** para empacotar a aplicação React/TypeScript em apps nativos:

```
┌─────────────────────────────────────────────────────┐
│                    Código React                      │
│          (client/src - mesmo código web)             │
├─────────────────────────────────────────────────────┤
│                 Capacitor Bridge                     │
│    (plugins nativos: câmera, storage, haptics)       │
├──────────────────────┬──────────────────────────────┤
│    Android (WebView) │      iOS (WKWebView)         │
│    android/          │      ios/                     │
└──────────────────────┴──────────────────────────────┘
```

---

## PARTE 1: Preparação do Ambiente

### 1.1 Requisitos para Android

1. **Instalar Android Studio**: https://developer.android.com/studio
2. **Configurar SDK**: Abra Android Studio > Tools > SDK Manager
   - Instale Android SDK 34 (Android 14)
   - Instale Build Tools 34.0.0
3. **Conta Google Play Console**: https://play.google.com/console ($25 único)

### 1.2 Requisitos para iOS (necessita macOS)

1. **Instalar Xcode 15+**: App Store do macOS
2. **Instalar CocoaPods**: `sudo gem install cocoapods`
3. **Conta Apple Developer**: https://developer.apple.com ($99/ano)

---

## PARTE 2: Build do Projeto

### 2.1 Preparar Ambiente Local

Clone o projeto e configure localmente:

```bash
# Clonar do Replit (obter URL no botão "Git" do Replit)
git clone https://replit.com/@SEU_USER/biblia-inteligente.git
cd biblia-inteligente

# Instalar dependências
npm install

# Configurar variáveis de ambiente
# Crie um arquivo .env com:
DATABASE_URL=sua_url_de_producao
OPENAI_API_KEY=sua_chave
SESSION_SECRET=seu_segredo
```

### 2.2 Gerar Build de Produção

```bash
# Build da aplicação web
npm run build

# Verificar se dist/public foi criado
ls dist/public
```

### 2.3 Adicionar Plataformas Nativas

```bash
# Adicionar plataformas (primeira vez apenas)
npx cap add android
npx cap add ios

# Sincronizar código com plataformas nativas
npx cap sync
```

---

## PARTE 3: Configuração Android

### 3.1 Abrir no Android Studio

```bash
npx cap open android
```

### 3.2 Configurar Versões

Edite `android/app/build.gradle`:

```gradle
android {
    compileSdkVersion 34
    
    defaultConfig {
        applicationId "com.bibliainteligente.app"
        minSdkVersion 24
        targetSdkVersion 34
        versionCode 1        // Incrementar a cada release
        versionName "1.0.0"  // Versão visível ao usuário
    }
}
```

### 3.3 Configurar Ícones

Substitua os ícones em `android/app/src/main/res/`:

| Pasta | Tamanho |
|-------|---------|
| mipmap-mdpi | 48x48 |
| mipmap-hdpi | 72x72 |
| mipmap-xhdpi | 96x96 |
| mipmap-xxhdpi | 144x144 |
| mipmap-xxxhdpi | 192x192 |

Arquivos necessários:
- `ic_launcher.png` (ícone padrão)
- `ic_launcher_round.png` (ícone redondo)
- `ic_launcher_foreground.png` (para ícone adaptativo)

### 3.4 Configurar Splash Screen

Edite ou crie `android/app/src/main/res/drawable/splash.png` com sua imagem de splash.

### 3.5 Criar Keystore (Primeira Vez)

```bash
keytool -genkey -v -keystore biblia-inteligente-release.keystore \
  -alias biblia_key -keyalg RSA -keysize 2048 -validity 10000
```

Guarde este arquivo e a senha em local seguro!

### 3.6 Gerar AAB para Play Store

1. No Android Studio: **Build > Generate Signed Bundle / APK**
2. Selecione **Android App Bundle**
3. Escolha o keystore criado
4. Selecione **release**
5. O arquivo será gerado em `android/app/release/app-release.aab`

---

## PARTE 4: Configuração iOS

### 4.1 Abrir no Xcode

```bash
npx cap open ios
```

### 4.2 Configurar Signing

1. Selecione o projeto "App" na barra lateral
2. Na aba **Signing & Capabilities**:
   - Marque "Automatically manage signing"
   - Selecione seu Team (conta Apple Developer)
   - Bundle Identifier: `com.bibliainteligente.app`

### 4.3 Configurar Ícones

1. Abra **Assets.xcassets > AppIcon**
2. Arraste ícones para cada slot (1024x1024 para App Store)

Use ferramentas como https://appicon.co para gerar todos os tamanhos.

### 4.4 Configurar Info.plist

Edite `ios/App/App/Info.plist` e adicione:

```xml
<key>NSMicrophoneUsageDescription</key>
<string>Precisamos do microfone para gravar sermões e reuniões.</string>

<key>NSCameraUsageDescription</key>
<string>Usamos a câmera para foto de perfil.</string>
```

### 4.5 Gerar Archive

1. Selecione "Any iOS Device" como destino
2. Menu **Product > Archive**
3. Após conclusão, clique em **Distribute App**
4. Selecione **App Store Connect** > **Upload**

---

## PARTE 5: Publicação nas Lojas

### 5.1 Google Play Console

1. Acesse https://play.google.com/console
2. Crie um novo aplicativo
3. Preencha as informações:
   - Nome: Bíblia Inteligente IA
   - Categoria: Livros e referências > Religião
   - Classificação: PEGI 3 / Livre
4. Faça upload do AAB
5. Configure preços e países
6. Envie para revisão

### 5.2 App Store Connect

1. Acesse https://appstoreconnect.apple.com
2. Crie um novo App
3. Preencha as informações:
   - Nome: Bíblia Inteligente IA
   - Categoria principal: Referência
   - Categoria secundária: Livros
4. Configure screenshots (6.5" e 5.5")
5. Preencha política de privacidade
6. Envie para revisão

---

## PARTE 6: Materiais Necessários

### Screenshots (obrigatório)

| Plataforma | Tamanhos |
|------------|----------|
| iOS | 6.5" (1284x2778), 5.5" (1242x2208) |
| Android | 1080x1920 mínimo |

Capture telas de:
1. Tela inicial (leitura da Bíblia)
2. Dicionário Strong's
3. Chat com IA
4. Gravação de sermões
5. Recursos premium

### Descrições

**Título**: Bíblia Inteligente IA

**Descrição Curta** (80 caracteres):
"Estude a Bíblia com Strong's, IA e transcrição de sermões"

**Descrição Longa**:
```
Descubra a Bíblia como nunca antes com o Bíblia Inteligente IA!

RECURSOS PRINCIPAIS:
• 16 versões da Bíblia (português, inglês, espanhol)
• Dicionário Strong's com 14.197 palavras em hebraico e grego
• Professor IA para dúvidas teológicas
• Gravação e transcrição de sermões
• Resumos automáticos com Inteligência Artificial
• Anotações pessoais e marcadores
• Planos de leitura personalizados
• Modo offline completo

STRONG'S DICTIONARY:
Acesse definições profissionais de cada palavra original da Bíblia, incluindo etimologia, transliteração e uso teológico.

PROFESSOR IA:
Tire dúvidas sobre versículos, contexto histórico e aplicações práticas com nossa IA treinada em teologia.

GRAVAÇÃO DE SERMÕES:
Grave cultos e reuniões, transcreva automaticamente e gere resumos estruturados com IA.

Comece seu teste gratuito de 30 dias agora!
```

### Política de Privacidade

Crie uma página web com sua política de privacidade e insira a URL nas lojas.

---

## PARTE 7: Checklist Final

### Antes de Submeter

- [ ] Build de produção sem erros
- [ ] Ícones em todas as resoluções
- [ ] Splash screen configurada
- [ ] Versão e build number atualizados
- [ ] Screenshots capturadas
- [ ] Descrições prontas
- [ ] Política de privacidade publicada
- [ ] Keystore salvo em local seguro (Android)
- [ ] Certificado de assinatura configurado (iOS)

### Após Submeter

- [ ] Monitorar e-mails de revisão
- [ ] Responder feedback da loja se necessário
- [ ] Testar download após aprovação

---

## Suporte

Se encontrar problemas:

1. **Erro de build Android**: Execute `cd android && ./gradlew clean`
2. **Erro de pods iOS**: Execute `cd ios/App && pod install --repo-update`
3. **WebView em branco**: Verifique se `dist/public/index.html` existe

Para mais ajuda, consulte:
- https://capacitorjs.com/docs
- https://developer.android.com/studio
- https://developer.apple.com/documentation
