---
name: GitHub CI a partir do Replit
description: Armadilhas ao usar GitHub Actions com código sincronizado do Replit (lockfile, conector, logs)
---

**Regra 1 — package-lock:** o lock gerado no Replit pode gravar `resolved` em `http://package-firewall.replit.local/npm/...` ou `http://package-firewall.replit.internal/npm/...`. No GitHub Actions isso pode fazer `npm ci` falhar silenciosamente com exit 0 e nenhum node_modules ("Exit handler never called"), levando a exit 127 no build. **Antes de enviar o lock ao GitHub:** normalize, por patch, ambos os prefixos para `https://registry.npmjs.org/`; mantenha versões e integridades dos tarballs. Revise também dependências transitivas recém-adicionadas.

**Regra 2 — autenticação Git:** o token do conector Replit NÃO serve para `git push` (proxy apenas, sem token exposto). Um PAT salvo como `GITHUB_TOKEN` funciona via HTTPS com `gh auth setup-git` quando tem escrita em Contents. Se o push alterar `.github/workflows/**`, token clássico também precisa do escopo `workflow`; quando a alteração não é necessária, preservar a versão remota do workflow evita ampliar o privilégio. Para sincronizações pequenas sem Git autenticado, a Git Data API (blobs → tree com base_tree → commit → PATCH ref) é alternativa; não usar para reconstruir históricos ou árvores grandes.

**Regra 3 — privacidade dos diagnósticos:** manter logs somente no GitHub Actions; não enviar diagnósticos ao webhook.site ou a serviços externos de terceiros.

**Why:** o usuário determinou remover o diagnóstico externo usado anteriormente na submissão iOS. A dificuldade de ler logs via proxy não autoriza reativar esse envio.

**How to apply:** quando autorizado a preparar o workflow, remover os wrappers de envio externo e preservar a saída nativa do Actions. Se o acesso aos logs falhar, informar a limitação e usar etapas/anotações disponíveis.

**Regra 4 — iOS upload:** o workflow "Build iOS IPA (App Store)" (workflow_dispatch, inputs version_name/version_code) envia via altool + fallback fastlane. O diagnóstico externo legado não deve ser mantido em novas submissões (Regra 3). Erro `CONTRACT_NOT_VALID` = pendência de contrato/assinatura na conta Apple do usuário, não é problema de credencial nem de CI.

**Regra 5 — limites da submissão:** só disparar builds de loja depois de confirmar APIs e schema necessários em produção. Enviar o IPA ao App Store Connect/TestFlight ou gerar um AAB não autoriza enviar para revisão pública da Apple nem lançar em produção no Google Play.

**Why:** o usuário reservou a revisão e a publicação pública das lojas para execução manual nos consoles e exigiu interromper a sequência quando uma pré-verificação falhar.

**How to apply:** tratar preparação, upload de binários e publicação pública como autorizações separadas; um bloqueio de produção impede avançar para commit/push que dispare builds.

**Regra 6 — preservação em releases:** preparar um release não autoriza alterar lógica do app, Clerk, Mercado Pago, Google Play Billing, StoreKit, planos, regras de assinatura ou painel admin.

**Why:** o usuário reiterou essas restrições para a preparação e a continuação dos builds de loja.

**How to apply:** limitar o trabalho às configurações e à segurança do build autorizadas. Se uma pré-verificação revelar um problema de produção, informar o bloqueio e obter autorização específica antes de mudar o comportamento do aplicativo para resolvê-lo.

**Como aplicar:** antes de sincronizar, revisar lockfile e diferenças em `.github/workflows`; preferir push Git normal com PAT de menor privilégio suficiente e usar a Git Data API apenas quando o volume e o histórico tornarem isso seguro.
