---
name: Configuração Firebase das lojas
description: Registros Firebase informados pelo usuário e política dos arquivos públicos de cliente para releases nativos
---

O usuário informou o projeto Firebase `biblia-inteligente`, número público `498175838160`. O registro Android correto corresponde a `app.replit.bibliainteligente.twa`; o cadastro antigo `com.bibliainteligente.app` não é o aplicativo da Play Store e não deve fornecer a configuração.

O registro iOS informado é `com.bibliainteligente.ios`, app ID público `1:498175838160:ios:58badb01c7e0cfdc04dbd5`.

**Why:** selecionar o cadastro pelo namespace Java antigo produziria uma configuração Firebase para outro aplicativo, mesmo preservando o applicationId da loja.

**How to apply:** comparar pacote/Bundle ID e os identificadores oficiais retornados pelo Firebase antes de aceitar configurações para os builds.

Obter os arquivos oficiais via Firebase Management API (`getConfig`) com uma credencial autorizada, ou receber os arquivos baixados pelo próprio usuário. Nunca construir ou inventar `google-services.json` ou `GoogleService-Info.plist` manualmente. São configurações públicas de cliente e podem ir ao GitHub; credenciais de conta de serviço e material de assinatura não podem.

**Why:** o usuário autorizou explicitamente o versionamento dos arquivos de cliente, mas exigiu procedência oficial e a exclusão do material sensível de assinatura.

**How to apply:** a existência de uma conta de serviço Google Play não comprova permissão Firebase. Se o acesso à API não estiver autorizado, pedir somente os arquivos oficiais de cliente e permitir o build sem Firebase ativo, sem dispensar as demais travas do release.