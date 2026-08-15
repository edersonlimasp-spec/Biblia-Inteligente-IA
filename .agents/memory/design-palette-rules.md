---
name: Design palette isolation rules
description: Regras duráveis de design para a identidade visual do app — quais cores vão onde.
---

## Regras

A paleta do app NASCE do ícone: livro azul-petróleo, lombada azul-marinho, marcador vermelho.
Nenhuma cor deve ser inventada fora desse conjunto de origem.

### Tokens CSS (index.css)
- `--primary` = vermelho encadernação (#9E3129 light / #B03A32 dark) — acento único.
- `--background` = azul-petróleo (#F2F5F8 light / #0B2135 dark) — nunca creme, nunca bege.
- `--card` = superfície elevada (#FAFCFD light / #10293F dark).
- `--strong-code-color` = dourado #A88445 (38 42% 47%) — para --strong-code-color APENAS.

### Isolamento crítico
- **Pergaminho (`bible-panel-bg: 38 48% 90%` ≈ #F2E9DA)** — aparece APENAS dentro de `.bible-page`. Em nenhum outro componente, nenhum fundo de card, nenhuma outra tela. O vazamento do pergaminho foi o que estragou a versão anterior.
- **Dourado (`--strong-code-color` / rgba(168,132,69,...))** — aparece APENAS em `.strong-word` (sublinhado) e nos códigos Strong exibidos no modal. Em NENHUM outro lugar: sem dourado em logos, ícones, banners, botões, fundos.

### Acento vermelho — uso máximo
- No máximo 2 elementos com acento (vermelho) por tela.
- Usos válidos: botão/ação principal, estado ativo, borda do banner de assinatura.
- Nunca em icon-backgrounds, nunca em mais de 2 lugares por tela.

### Dark mode
- Padrão: dark. ThemeProvider tem `defaultTheme = "dark"`.
- theme-color meta: `#0B2135` no dark, `#F2F5F8` no light.

### Ícones nos cards
- Ícones são traço fino (`strokeWidth={1.5}`), cor `text-muted-foreground`, sem fundo colorido.
- Ícone ativo: `text-primary` — apenas quando o item está explicitamente selecionado/ativo.
- Remover SEMPRE: `bg-primary/15`, `rounded-xl bg-primary/10`, qualquer wrapper colorido de ícone.

**Why:** Versão anterior usou dourado como `--primary` e o token vazou para fundos de card, ícones e banners em todo o app, tornando o visual "SaaS genérico" em vez de encadernação sóbria.

**How to apply:** Qualquer nova tela ou componente deve usar APENAS os tokens semânticos (`bg-card`, `bg-background`, `text-foreground`, `text-muted-foreground`, `text-primary`). Se o design precisar de pergaminho, conferir que o componente é literalmente o leitor bíblico. Se precisar de dourado, conferir que é o dicionário Strong.
