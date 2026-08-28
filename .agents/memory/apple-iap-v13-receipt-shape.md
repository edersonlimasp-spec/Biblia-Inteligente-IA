---
name: Recibo Apple no cordova-plugin-purchase v13
description: Formato não óbvio do recibo StoreKit 1 e como evitar falsos erros de dados ausentes.
---

No `cordova-plugin-purchase` v13 com StoreKit 1, o recibo monolítico do aplicativo fica no objeto `Receipt`, dentro de `nativeData.appStoreReceipt`. A transação aprovada carrega seus identificadores diretamente, incluindo o identificador original.

**Why:** Procurar o recibo apenas em `nativePurchase` faz compras aprovadas parecerem inválidas antes mesmo de o backend ser chamado. O JavaScript do plugin inclui suporte StoreKit 2, mas isso não significa que o componente nativo StoreKit 2 esteja instalado ou ativo.

**How to apply:** Normalize dados de compra Apple pelo formato público do plugin instalado e mantenha campos legados apenas como fallback. Ao diagnosticar StoreKit 2, confirme a presença do componente nativo em vez de inferir isso pelo bundle JavaScript.

Algumas versões do plugin retornam o recibo atualizado diretamente sem atualizar imediatamente a coleção compartilhada de recibos.

**Why:** Aguardar somente `localReceipts` após uma atualização bem-sucedida mantém o falso erro de “dados ausentes”. Além disso, os níveis INFO/DEBUG do plugin serializam recibos carregados e não são seguros para diagnóstico em produção.

**How to apply:** Consuma o retorno direto da atualização e use evento/polling de cache apenas como complemento. Em produção, limite logs do plugin a alertas e persista só metadados permitidos, nunca recibo ou JWS.