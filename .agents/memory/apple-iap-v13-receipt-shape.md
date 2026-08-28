---
name: Recibo Apple no cordova-plugin-purchase v13
description: Formato não óbvio do recibo StoreKit 1 e como evitar falsos erros de dados ausentes.
---

No `cordova-plugin-purchase` v13 com StoreKit 1, o recibo monolítico do aplicativo fica no objeto `Receipt`, dentro de `nativeData.appStoreReceipt`. A transação aprovada carrega seus identificadores diretamente, incluindo o identificador original.

**Why:** Procurar o recibo apenas em `nativePurchase` faz compras aprovadas parecerem inválidas antes mesmo de o backend ser chamado. O JavaScript do plugin inclui suporte StoreKit 2, mas isso não significa que o componente nativo StoreKit 2 esteja instalado ou ativo.

**How to apply:** Normalize dados de compra Apple pelo formato público do plugin instalado e mantenha campos legados apenas como fallback. Ao diagnosticar StoreKit 2, confirme a presença do componente nativo em vez de inferir isso pelo bundle JavaScript.