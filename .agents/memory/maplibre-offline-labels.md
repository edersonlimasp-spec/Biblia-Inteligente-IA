---
name: MapLibre offline em WebView
description: Restrição de fontes de rótulos para mapas sem rede em clientes web e nativos
---

Rótulos de texto em camadas `symbol` do MapLibre precisam de glifos configurados no estilo e disponíveis localmente. Quando não houver glifos empacotados, renderize os nomes a partir dos dados locais com marcadores HTML, sem depender de URL pública de fontes ou tiles.

**Why:** Uma camada `text-field` pode compilar, mas falhar em tempo de execução se o estilo não fornecer glifos. O Atlas precisa funcionar sem servidores externos de tiles, inclusive em WebView e TWA.

**How to apply:** Ao adicionar nomes de cidades ou países aos mapas, confira a origem local de dados e fontes e valide o resultado em um navegador/dispositivo, não apenas pelo typecheck.