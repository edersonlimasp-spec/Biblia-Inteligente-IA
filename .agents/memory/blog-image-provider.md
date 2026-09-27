---
name: Provedor de capas do Blog
description: Compatibilidade dos provedores atuais com o modelo de geração de imagem solicitado para capas editoriais.
---

As credenciais OpenAI já presentes no projeto responderam que DALL·E 3 não existe ou não é suportado. A credencial direta aceitou GPT Image 1 em teste real. O endpoint compatível também recusou os parâmetros `style` e `response_format` antes de recusar o próprio modelo DALL·E 3.

**Why:** O pedido exige DALL·E 3 especificamente. Um fallback silencioso poderia entregar imagens por um modelo diferente e mascarar uma falha de geração. O texto e as sugestões funcionam, mas a geração completa de rascunho falha explicitamente na capa até haver credencial com suporte a DALL·E 3 ou consentimento para trocar o modelo.

**How to apply:** Antes de prometer capas DALL·E 3, confirme o acesso real do provedor com uma chamada mínima, sem imprimir credenciais ou URLs assinadas. Se o usuário aprovar outro modelo, atualize o código do Blog e teste o retorno; se quiser manter DALL·E 3, use o fluxo de segredos ou uma integração compatível. Persistir os bytes da imagem no banco, nunca a URL temporária.