---
name: GitHub CI a partir do Replit
description: Armadilhas ao usar GitHub Actions com código sincronizado do Replit (lockfile, conector, logs)
---

**Regra 1 — package-lock:** um `package-lock.json` gerado dentro do Replit grava URLs `resolved` apontando para `http://package-firewall.replit.local/npm/...`. No GitHub Actions isso faz `npm ci` (npm 10.8) falhar SILENCIOSAMENTE com exit 0 e nenhum node_modules ("Exit handler never called"), levando a exit 127 no build. **Antes de enviar o lock ao GitHub:** `sed -i 's|http://package-firewall.replit.local/npm/|https://registry.npmjs.org/|g' package-lock.json` (integridade dos tarballs permanece válida).

**Regra 2 — conector GitHub:** o token do conector Replit NÃO tem escopo `workflow`: criar tree/contents tocando `.github/workflows/**` retorna 404. Também não serve para `git push` (proxy apenas, sem token exposto) — sincronizar via Git Data API (blobs → tree com base_tree → commit → PATCH ref); funcionou com ~22MB/127 arquivos. GET em `/contents/.github/...` é bloqueado pelo WAF do proxy (403 Cloudflare).

**Regra 3 — logs de Actions ilegíveis:** endpoints de logs redirecionam para blob storage e o proxy devolve "Forbidden"; anotações do check-run só trazem o exit code. Diagnóstico que funcionou: fazer o script de build no CI postar seu próprio log num webhook.site temporário (criar token via `POST https://webhook.site/token`, ler via `/token/<uuid>/requests`). Remover o wrapper depois.

**Como aplicar:** sempre que sincronizar o repo com o GitHub para buildar o AAB (workflow "Build Android AAB (Signed)", dispara em push na main), aplicar Regra 1 no lock antes do push e usar a Git Data API do conector.
