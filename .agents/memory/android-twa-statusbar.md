---
name: Superfície superior sem faixa branca
description: Como distinguir um espaçamento real do DOM de uma faixa criada pela primeira pintura, safe area, status bar ou fundo nativo.
---

Antes de alterar margens ou transforms, execute `elementsFromPoint` no centro da tela em vários valores de Y próximos ao topo. Se o header e seus ancestrais já começam em `y=0`, com fundo correto e sem margem/padding indevido, a faixa não pertence ao layout React.

Nessa situação, trate a superfície superior como um contrato entre quatro camadas: tema aplicado antes da primeira pintura, cor PWA/browser, sobreposição da status bar/safe area e fundo de segurança da janela/WebView. Todas devem nascer na mesma família de cor do app; uma única camada clara pode aparecer como faixa mesmo com o DOM correto.

O sufixo histórico do application ID não prova qual runtime está publicado. Confirme o pipeline de build antes de decidir entre uma correção PWA/TWA ou Capacitor; o projeto pode preservar um ID antigo enquanto gera um binário Capacitor.

**Why:** tentativas de compensar visualmente com offsets falharam porque o header já ocupava o topo. A faixa era produzida fora do fluxo do documento por estados claros conflitantes durante a pintura e pela integração da status bar.

**How to apply:** em qualquer regressão no topo, primeiro registre os elementos e estilos em Y=10/20/40/60/80. Só mexa no layout se a sondagem mostrar um elemento ou espaço real; caso contrário, audite as quatro camadas acima.
