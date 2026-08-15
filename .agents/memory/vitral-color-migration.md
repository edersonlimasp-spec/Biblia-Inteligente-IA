---
name: Vitral color migration
description: Strategy and completion record for migrating all hard-coded colors to Vitral dark palette
---

## What was done
Full Vitral identity migration across ~18 files. All hard-coded rainbow/slate
colors replaced with Vitral module gradients and semantic tokens.

## Key patterns used
- `sed -i -e 's/pattern/replacement/g' file` for global bulk replacements
- Targeted `edit` calls for JSX restructuring (inline style, data constant rename)
- `bgGradient: "from-X to-Y"` renamed to `gradient: "linear-gradient(158deg, X, Y)"`
  in category data constants; JSX changed from className template literal to
  `style={{ background: category.gradient }}`

## Vitral module gradients (158deg from→to)
Bíblia #22668F→#154968 | Professor #3E5F8A→#2A4466 | AI Modos #75356A→#5A2551
Cursos #4A4285→#362F66 | Planos #1F6A5C→#134C43 | Oração #93602A→#734818
Conquistas #8A6A2E→#6B501C | Agenda #2C6076→#1B4557 | Jogos #8E3341→#6E2431
Gravações #9A4432→#7A3022 | Assinaturas #3A4657→#2A3441 | Admin #7A2733→#5E1D28

## Bg tokens
bg `#0A1420`, card `#0E1B2B`, elevated `#16354F`, border `#1D3247`
fg `#F2F6FA`, muted-fg `#8FA3B8`, tertiary `#647B90`

## Accent approximations (used in badge/icon contexts)
Gold: text-[#BFA87A] bg-[#8A6A2E]/20 | Blue: text-[#7BAED4] bg-[#22668F]
Teal: text-[#68B8A2] | Purple: text-[#9B95CA] bg-[#4A4285]/20

## Final audit result
`grep -rn "#357ABD|from-violet-500|bg-slate-100|..." client/src/**/*.tsx` → 0 matches
