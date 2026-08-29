---
name: Autenticação nativa e cache
description: Regras para validar, renovar e preservar com segurança a sessão JWT no aplicativo Capacitor.
---

O bootstrap de uma sessão nativa não pode depender de respostas condicionais sem corpo. Chamadas autenticadas e sua validação inicial precisam produzir uma resposta completa, e falhas de sessão devem ser diferenciadas de ausência de conteúdo.

**Why:** uma resposta sem corpo foi interpretada como sessão inválida, apagando uma credencial ainda válida; a falha de autenticação seguinte foi apresentada incorretamente como conteúdo inexistente.

**How to apply:** ao alterar autenticação ou cache HTTP, garanta corpo completo na validação inicial e preserve na interface um caminho explícito para entrar novamente após qualquer falha persistente.

Uma credencial nativa assinada e não expirada deve ser validada por suas propriedades criptográficas e pelo vínculo com uma conta já existente, não por metadados auxiliares de transporte. Nunca crie uma conta a partir das alegações da credencial. Mantenha também os ciclos de vida das sessões web e nativa separados.

**Why:** WebViews nativas podem perder metadados auxiliares embora preservem a credencial, criando loops de login. Misturar ciclos de vida permitiria que uma sessão sobrevivesse ao logout ou à revogação do sistema que a originou.

**How to apply:** trate informações de plataforma como contexto de política, não como prova de identidade. Para renovar depois da expiração, use uma credencial separada, rotacionável e revogável; nunca prolongue indefinidamente um token de acesso ainda válido.