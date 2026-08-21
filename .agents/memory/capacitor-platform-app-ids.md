---
name: Capacitor app IDs por plataforma
description: Exceção intencional entre o appId compartilhado do Capacitor e o Bundle ID nativo do alvo iOS.
---

O `appId` compartilhado do Capacitor deve continuar representando a identidade já publicada do Android. O alvo iOS usa seu próprio Bundle ID no projeto Xcode; StoreKit, assinatura do archive e `App.getInfo()` no dispositivo leem essa identidade nativa.

**Why:** Normalizar o `appId` compartilhado para o valor do iOS mudaria a identidade do Android publicado. O arquivo `capacitor.config.json` copiado para o diretório iOS pode, portanto, mostrar o appId Android sem alterar o Bundle ID efetivo do binário iOS.

**How to apply:** Ao conferir compras Apple, valide o Bundle ID do target Xcode, a expansão do Info.plist, o provisioning/export e o valor em runtime. Trate o appId compartilhado divergente como exceção intencional, não como motivo para trocar a identidade global.