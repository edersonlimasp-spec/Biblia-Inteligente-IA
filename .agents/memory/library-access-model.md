---
name: Modelo de acesso da Biblioteca
description: Regras do modelo único Premium da Biblioteca (amostra gratuita, compras preservadas)
---
Todos os livros da Biblioteca são Premium (`access_type='plan'`, `plan_required='premium'`, price NULL) — não existe mais livro gratuito nem compra avulsa nova.

Regras:
- Amostra: os 2 primeiros capítulos SEMPRE são gratuitos (piso mínimo, nunca zero), mais qualquer capítulo marcado `is_sample` pelo admin. Acessível sem cadastro.
- Compras avulsas antigas (`library_purchases` com status confirmed) continuam dando acesso total ("owned") — ninguém que pagou perde acesso.
- Plano exigido: premium ou superior (vitalício). Gold NÃO dá acesso.
- Admin: rotas POST/PUT de livro FORÇAM plan/premium/price=null; UI não mostra mais seleção de tipo de acesso.

**Why:** decisão de produto do usuário (jul/2026) — amostra é a única porta gratuita; converter tudo mantendo quem comprou.
**How to apply:** ao mexer em `resolveAccess`, admin de livros ou UI da estante/leitor, preservar essas três regras; migração já aplicada em dev e prod.

- Plan types reais no banco: `premium`, `premium_annual` (com dois N), `gold`, `strong_lifetime`. A hierarquia em resolveAccess precisa incluir as duas grafias (`premium_anual` legado + `premium_annual`).
- Admin/super_admin têm acesso completo via resolveAccess (userRole vem do JWT; auth usa header `Authorization: Bearer`, não cookie).
- A Biblioteca deve usar o mesmo entitlement canônico de `/api/user/subscription-status`: validade/expiração, origem permitida por plataforma, bônus Premium, degustação ativa e vitalício. Não consultar apenas uma linha `subscriptions.status='active'`, pois isso diverge do plano mostrado ao usuário.

## Cliente precisa enviar Bearer nas rotas da Biblioteca
A autenticação é SÓ por header `Authorization: Bearer` (localStorage authToken via getAuthHeaders() em queryClient.ts) — `credentials: "include"` não faz nada. Bug real em produção (jul 2026): fetches da Biblioteca sem o header faziam Premium/admin serem tratados como visitantes. Todo fetch novo a /api/library/* deve incluir getAuthHeaders(); após login, invalidar queries /api/library no react-query (cache é agnóstico de usuário).
