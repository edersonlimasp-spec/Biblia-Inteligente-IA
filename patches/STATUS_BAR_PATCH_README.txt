Patch do @capacitor/status-bar v8.0.0 para compatibilidade com Android 15 Edge-to-Edge
======================================================================================

Arquivo patched: node_modules/@capacitor/status-bar/android/src/main/java/com/capacitorjs/plugins/statusbar/StatusBar.java
Backup do arquivo patched: patches/StatusBar.patched.java

MOTIVO:
O @capacitor/status-bar v8.0.0 usa APIs descontinuadas no Android 15:
  - window.setStatusBarColor()      → flagged pelo Google Play Console
  - window.getStatusBarColor()      → flagged pelo Google Play Console
  - View.setSystemUiVisibility()    → flagged pelo Google Play Console
  - View.SYSTEM_UI_FLAG_LAYOUT_*    → flagged pelo Google Play Console

MUDANÇAS APLICADAS:
1. setOverlaysWebView():
   - API 30+ (Android 11+): Usa WindowCompat.setDecorFitsSystemWindows() — API moderna
   - API 29- (Android 10-): Mantém código legado com SYSTEM_UI_FLAG (necessário nessas versões)

2. Constructor:
   - API 35+ (Android 15+): Não chama getStatusBarColorDeprecated(); usa Color.TRANSPARENT
   - API 34-: Mantém comportamento original

3. getInfo():
   - API 35+ (Android 15+): Retorna currentStatusBarColor armazenado em vez de ler da janela
   - API 34-: Mantém comportamento original

4. getIsOverlaid():
   - API 30+: Usa WindowInsetsCompat + getFitsSystemWindows() para detectar modo overlay
   - API 29-: Mantém código legado com SYSTEM_UI_FLAG

COMO RE-APLICAR após npm install:
  cp patches/StatusBar.patched.java node_modules/@capacitor/status-bar/android/src/main/java/com/capacitorjs/plugins/statusbar/StatusBar.java

OU adicionar ao postinstall do package.json:
  "postinstall": "cp patches/StatusBar.patched.java node_modules/@capacitor/status-bar/android/src/main/java/com/capacitorjs/plugins/statusbar/StatusBar.java"
