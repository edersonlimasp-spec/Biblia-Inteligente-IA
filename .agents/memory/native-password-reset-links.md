---
name: Reset de senha nativo via e-mail
description: Distinção entre a recuperação de senha local do aplicativo e o login web com Clerk.
---

Links de recuperação de senha de contas locais do aplicativo nativo devem abrir um formulário público no navegador que consome o token local. A autenticação web do Clerk continua separada; não trate o link local como uma recuperação de senha Clerk.

**Why:** O aplicativo envia um link HTTPS por e-mail, e o toque no link no iOS pode abrir o navegador em vez da WebView. Se a rota web redireciona ao Clerk, o e-mail chega mas o usuário não consegue criar a nova senha do login nativo.

**How to apply:** Ao alterar a navegação de autenticação, verificar as duas pontas do fluxo: envio do e-mail no app e abertura da rota HTTPS sem sessão; preservar o formulário nativo e a separação entre senhas locais e Clerk.