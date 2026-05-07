# Bíblia Inteligente IA — v1.0.26 (versionCode 26)

## Correções desta versão

### 1. Compras de assinatura funcionando no Android
Corrigidos 3 bugs encadeados que impediam finalizar qualquer compra no app Android:

- **Fluxo errado**: O botão "Comprar no Google Play" tentava usar Google Play Billing
  nativo (não instalado), gerava o erro "Compras não disponíveis nesta versão"
  e parava aí. Agora o Android vai direto para o checkout Mercado Pago.

- **URL que não abria**: Dentro do Capacitor (WebView Android), `window.location`
  não consegue redirecionar para sites externos. Corrigido para usar
  `window.open(url, '_system')` que abre o browser padrão do celular.

- **Botão travado em "Processando..."**: Após abrir o browser externo, o botão
  ficava bloqueado. Agora reseta automaticamente para o estado normal.

### 2. Faixa/listra na notch (já corrigida na 1.0.25, mantida)
O indicador de scroll nativo do iOS/Android que aparecia como uma
listra fina no topo da tela foi removido.

---

**Nota curta para o Google Play Console (até 500 caracteres):**

Correção importante: compras de assinatura agora funcionam corretamente no Android.
O botão "Finalizar Compra" abre o pagamento no browser do celular sem travar.
Também corrigida a listra visual no topo da tela em alguns dispositivos.
