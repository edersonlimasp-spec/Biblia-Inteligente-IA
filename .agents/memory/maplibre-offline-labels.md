---
name: MapLibre offline em WebView
description: Restrição de fontes de rótulos para mapas sem rede em clientes web e nativos
---

Rótulos de texto em camadas `symbol` do MapLibre precisam de glifos configurados no estilo e disponíveis localmente. Quando não houver glifos empacotados, renderize os nomes a partir dos dados locais com marcadores HTML, sem depender de URL pública de fontes ou tiles.

**Why:** Uma camada `text-field` pode compilar, mas falhar em tempo de execução se o estilo não fornecer glifos. O Atlas precisa funcionar sem servidores externos de tiles, inclusive em WebView e TWA.

**How to apply:** Ao adicionar nomes de cidades ou países aos mapas, confira a origem local de dados e fontes e valide o resultado em um navegador/dispositivo, não apenas pelo typecheck.

O prebundle de dependências do Vite em desenvolvimento pode carregar o módulo MapLibre sem disponibilizar seu worker; a tela monta, mas a base cartográfica não termina de carregar. Mantenha MapLibre fora da otimização de dependências do Vite.

**Why:** A compilação e os arquivos locais passaram, mas o mapa falhou no navegador porque o worker não existia no diretório de dependências otimizadas.

**How to apply:** Quando a base local falhar, confira o log do Vite por worker ausente antes de alterar dados geográficos ou endpoints. Valide a renderização após reiniciar o workflow e aguardar os recursos locais carregarem.