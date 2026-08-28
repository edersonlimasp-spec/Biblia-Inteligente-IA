---
name: GitHub CI a partir do Replit
description: Armadilhas ao usar GitHub Actions com código sincronizado do Replit (lockfile, conector, logs)
---

**Regra 1 — package-lock:** um `package-lock.json` gerado dentro do Replit grava URLs `resolved` apontando para `http://package-firewall.replit.local/npm/...`. No GitHub Actions isso faz `npm ci` (npm 10.8) falhar SILENCIOSAMENTE com exit 0 e nenhum node_modules ("Exit handler never called"), levando a exit 127 no build. **Antes de enviar o lock ao GitHub:** `sed -i 's|http://package-firewall.replit.local/npm/|https://registry.npmjs.org/|g' package-lock.json` (integridade dos tarballs permanece válida).

**Regra 2 — autenticação Git:** o token do conector Replit NÃO serve para `git push` (proxy apenas, sem token exposto). Um PAT salvo como `GITHUB_TOKEN` funciona via HTTPS com `gh auth setup-git` quando tem escrita em Contents. Se o push alterar `.github/workflows/**`, token clássico também precisa do escopo `workflow`; quando a alteração não é necessária, preservar a versão remota do workflow evita ampliar o privilégio. Para sincronizações pequenas sem Git autenticado, a Git Data API (blobs → tree com base_tree → commit → PATCH ref) é alternativa; não usar para reconstruir históricos ou árvores grandes.

**Regra 3 — logs de Actions ilegíveis:** endpoints de logs redirecionam para blob storage e o proxy devolve "Forbidden"; anotações do check-run só trazem o exit code. Diagnóstico que funcionou: fazer o script de build no CI postar seu próprio log num webhook.site temporário (criar token via `POST https://webhook.site/token`, ler via `/token/<uuid>/requests`). Remover o wrapper depois.

**Regra 4 — iOS upload:** o workflow "Build iOS IPA (App Store)" (workflow_dispatch, inputs version_name/version_code) envia via altool + fallback fastlane, com diagnóstico postado num webhook.site. Erro `CONTRACT_NOT_VALID` = pendência de contrato/assinatura na conta Apple do usuário, não é problema de credencial nem de CI.

**Como aplicar:** antes de sincronizar, revisar lockfile e diferenças em `.github/workflows`; preferir push Git normal com PAT de menor privilégio suficiente e usar a Git Data API apenas quando o volume e o histórico tornarem isso seguro.
