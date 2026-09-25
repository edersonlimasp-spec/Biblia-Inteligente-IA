# Plano do Atlas bíblico

## Objetivo e estado desta etapa

O Atlas é um catálogo de mapas históricos, geografia física e ilustrações
didáticas para estudo bíblico. O catálogo tem 75 itens disponíveis (42 mapas e
33 diagramas SVG, incluindo o acampamento). A gratuidade é declarada por item
no manifesto; só os itens marcados como amostra são gratuitos.
`sample: true` no manifesto de um item pendente marca uma gratuidade futura, não
finge que o conteúdo já exista.

 O manifesto canônico é `data/atlas/manifest.json`. Seu `expectedAvailable`
 deve permanecer igual ao número de itens com `status: "disponivel"` (75).
Itens pendentes não devem aparecer como conteúdo carregável, e nenhum mapa
pendente deve receber coordenadas inventadas ou uma afirmação de revisão por
especialista. Gold, Premium e degustação ativa liberam o catálogo completo;
visitante, conta gratuita e Strong vitalício isolado recebem somente os dois
itens gratuitos de cada pasta.

## Ordem editorial

As seções do catálogo aparecem nesta ordem:

1. **Antigo Testamento**, com Origens e patriarcas; Êxodo e deserto;
   Conquista e juízes; Reino unido; Reino dividido; Impérios e exílio;
   Retorno.
2. **Entre os Testamentos**.
3. **Novo Testamento**, com Vida de Jesus; Igreja primitiva; Viagens de
   Paulo; Epístolas e Apocalipse.
4. **Jerusalém através do tempo**.
5. **Tabernáculo**.
6. **Templo de Salomão**.
7. **Geografia e tabelas**.

O campo `order` é cronológico dentro da seção/subseção quando a cronologia é
significativa; nos demais casos é a ordem didática. Uma ordem de catálogo não
é uma afirmação de datação histórica.

## Catálogo planejado

### Antigo Testamento

**Origens e patriarcas**

- Mundo do Antigo Oriente Próximo (disponível; não amostra).
- Tabela das nações de Gn 10 (disponível; não amostra).
- Jornadas de Abraão (amostra, disponível).
- Isaque e Jacó (disponível; não amostra).
- José e a ida de Israel ao Egito (disponível; não amostra).

**Êxodo e deserto**

- Êxodo: hipóteses de rota (amostra, disponível).
- Peregrinação no deserto (Nm 33) e Cades (disponível; não amostra).
- Acampamento das tribos ao redor do Tabernáculo (Nm 2–3, diagrama disponível; não amostra).

**Conquista e juízes**

- Conquista de Canaã (campanhas central, sul e norte; disponível; não amostra).
- Divisão das 12 tribos (disponível; não amostra).
- Cidades de refúgio e levíticas (disponível; não amostra).
- Período dos juízes (disponível; não amostra).

**Reino unido**

- Samuel e Saul (disponível; não amostra).
- Davi, da fuga ao trono (disponível; não amostra).
- Reino unido de Davi e Salomão.

**Reino dividido**

- Reino dividido (disponível; não amostra).
- Elias e Eliseu (disponível; não amostra).
- Os profetas no mapa (disponível; não amostra; filtros por século e reino).

**Impérios e exílio**

- Império Assírio e queda de Samaria (disponível; não amostra).
- Império Babilônico e exílio (disponível; não amostra).
- Jonas (disponível; não amostra).

**Retorno**

- Império Persa e retorno (Esdras, Neemias; disponível; não amostra).

### Entre os Testamentos

- Alexandre e o mundo grego (amostra disponível).
- Ptolomeus, Selêucidas e Macabeus (amostra disponível).

### Novo Testamento

**Vida de Jesus**

- Reino de Herodes e divisão entre os filhos (disponível).
- Palestina no tempo de Jesus (amostra, disponível).
- Nascimento e infância de Jesus (amostra disponível).
- Ministério na Galileia (disponível).
- Decápolis, Tiro, Sidom e Pereia (disponível).
- Última semana e ressurreição (disponível).

**Igreja primitiva**

- Pentecostes: as nações de At 2 (amostra disponível).
- Igreja em At 1–12 (disponível).
- Conversão e primeiros anos de Paulo (disponível).

**Viagens de Paulo**

- Primeira viagem missionária de Paulo (amostra, disponível).
- Segunda viagem.
- Terceira viagem.
- Viagem a Roma.

**Epístolas e Apocalipse**

- Destinatários das epístolas.
- Sete igrejas do Apocalipse (amostra, disponível).
- Império Romano no século I (amostra, disponível).

### Jerusalém através do tempo

- Cidade de Davi (amostra planejada).
- Salomão.
- Ezequias.
- Neemias.
- Tempo de Jesus (amostra, disponível).
- 70 d.C. e Aelia Capitolina.

### Geografia e tabelas

- **Geografia e tabelas:** Relevo e regiões da Terra Santa (amostra planejada);
  Mares, rios e montes da Bíblia; Pesos, medidas e moedas da Bíblia (amostra
  planejada); Reis de Israel e Judá; Festas e calendário bíblico; Clima e
  agricultura bíblicos.

### Tabernáculo

- Visão geral (amostra, disponível).
- Pátio e cercado (disponível).
- Porta do pátio (disponível).
- Altar do holocausto (disponível).
- Pia de bronze (disponível).
- Estrutura: tábuas, bases de prata e travessas (disponível).
- As quatro cobertas (disponível).
- Véu e cortina da entrada (disponível).
- Candelabro (disponível).
- Mesa dos pães (disponível).
- Altar do incenso (disponível).
- Arca e propiciatório com querubins (amostra, disponível).
- Vestes do sumo sacerdote (conjunto, disponível).
- Éfode e cinto (disponível).
- Peitoral com 12 pedras (disponível; **não** gratuito).
- Manto azul com romãs e campainhas (disponível).
- Mitra e lâmina de ouro (disponível).
- Túnica, cinto e calções (disponível).
- Vestes dos sacerdotes comuns (disponível).

### Templo de Salomão

- Visão geral (gratuita e disponível).
- Planta.
- Pórtico (ulam).
- Lugar Santo (hekal), com 10 candelabros e 10 mesas.
- Santo dos Santos (debir) e querubins.
- Câmaras laterais.
- Colunas Jaquim e Boaz.
- Mar de fundição com 12 bois.
- As 10 bases com rodas.
- As 10 pias.
- Altar de bronze.
- Pátios.
- Comparação Tabernáculo x Templo (gratuita e disponível).

### Conteúdo planejado adicional

- **Dicionário de lugares da Bíblia:** fichas geradas somente da base OpenBible
  preservada no projeto.
- **Roteiros por personagem:** Abraão, Moisés, Davi, Elias, Jesus, Pedro,
  Filipe e Paulo.
- **Mapas extras:** Rute (disponível); Daniel e Ester (disponível); Pedro e Filipe (At 8–10); conversão
  de Paulo; Creta e as epístolas pastorais; batalhas de Davi (disponível); comércio de
  Salomão (disponível); Josias e Megido (disponível); Arca de Noé e Ararat (disponível; região debatida); Babel e
  os zigurates (disponível).
- **Imagens extras:** Templo de Herodes; templo da visão de Ezequiel; Monte do
  Templo hoje.

## Evidência, licenças e limites

### Matriz de cobertura do lote 1 do Antigo Testamento

| Item | Tipo | Cobertura verificável | Lacunas assumidas |
| --- | --- | --- | --- |
| Tabela das nações | Mapa | Cidades citadas em Gn 10 e agrupamentos literários de Jafé, Cam e Sem | Acade sem sítio; não há fronteiras étnicas nem coordenadas das regiões |
| Isaque e Jacó | Mapa | Berseba, Betel, Harã e etapas do retorno em Gn 26–35 | O recorte não afirma cobertura de Gn 24; acampamento de Gileade, Maanaim e vau do Jaboque sem ponto seguro; linhas parciais |
| José e a ida de Israel ao Egito | Mapa | Hebrom–Siquém–Dotã, On e descrição de Gósen em Gn 37–50 | Sem residência de José ou centro/fronteira de Gósen |
| Peregrinação no deserto | Mapa | Mara, Elim, Sim, Refidim, Sinai, Cades, Eziom-Geber, Hor, planícies de Moabe e Nebo, além das estações nomeadas de Nm 33 como passos textuais | A maioria das estações de Nm 33 permanece sem geocódigo; isso é cobertura textual parcial, não localização; nenhuma rota desenhada |
| Acampamento das tribos | SVG não geográfico | Quatro lados, famílias levíticas e contagens de Nm 2–3 | Sem distâncias ou forma exata do acampamento |
| Conquista de Canaã | Mapa | Campanhas central, sul e norte em Js 1–12 | Ai e várias cidades sem identificação segura; datas e escala debatidas |

Os seis itens do lote novo não são gratuitos. Coordenadas dos cinco
mapas saem apenas dos registros preservados em `evidence/openbible-merged.txt`;
vértices de rotas usam os próprios pontos da fonte. Lugares com geocódigo
regional, rejeitado ou desconhecido não recebem pino. O SVG tem coordenadas de
layout, não geográficas. Para reproduzir **apenas o lote 1**, usar
`node docs/atlas/evidence/build-maps-2.cjs`; essa rotina não gera os nove
  mapas dos lotes 2 e 3 e reescreve `maps-review.md`, portanto não executá-la
  como rotina de atualização do catálogo atual.

### Matriz de cobertura do lote 2 do Antigo Testamento

| Item | Cobertura verificável | Lacunas assumidas |
| --- | --- | --- |
| Rute | Belém → região de Moabe → Belém; Noemi, Rute e Boaz (Rt 1–4) | Moabe é região; campo de Boaz sem pino exato |
| Cidades de refúgio e levíticas | As seis cidades de refúgio, cidades levíticas localizáveis e finalidade jurídica (Nm 35; Dt 4; Js 20–21) | Nem toda cidade levítica tem sítio identificável; pinos não reconstituem fronteiras tribais |
| Período dos juízes | Débora/Baraque, Gideão, Jefté, Sansão, Siló e migração de Dã (Jz 4–7; 11; 13–18) | Eventos e locais debatidos permanecem sem localização exata; camadas por juiz são esquemáticas |
| Samuel e Saul | Principais locais de 1Sm 1–31 e itinerário da arca em 1Sm 4–7 | Não há estrada da arca reconstituída; locais ambíguos sem pino seguro |
| Davi, da fuga ao trono | Do vale de Elá à conquista de Jerusalém (1Sm 17–2Sm 5) | Caverna de Adulão e vários locais do deserto não são identificações definitivas |
| Batalhas de Davi | Filisteus, amonitas, Moabe, Edom e Arã-Zobá (2Sm 5; 8; 11–12) | Área do reino é envelope didático, não fronteira histórica |
| Comércio de Salomão | Cidades fortificadas, Tiro, frota de Eziom-Geber, Sabá e distritos (1Rs 4–10) | Sabá é região debatida; Ofir e Társis sem pino |
| Elias e Eliseu | Episódios de 1Rs 17–2Rs 8 do Jordão a Damasco | Querite sem geocódigo; Tisbe e Horebe debatidos |
| Josias e Megido | Reforma em Jerusalém/Betel e encontro em Megido; Carquemis como destino de Neco (2Rs 23; 2Cr 35; Jr 46) | O trajeto militar entre os locais não é conhecido |

Os nove mapas deste lote não são amostras. Os pinos usam exclusivamente
`evidence/openbible-merged.txt` ou JSON Pleiades retidos nesta pasta;
regiões são envelopes aproximados, nunca limites políticos comprovados.
As fichas e as decisões sobre pontos rejeitados constam em `maps-review.md`.

### Matriz de cobertura do lote 3 — impérios, exílio, retorno e intertestamental

| Item | Cobertura verificável | Limites assumidos |
| --- | --- | --- |
| Império Assírio e queda de Samaria | Nínive, Calá, Samaria, Laquis, Habor e Carquemis; 2Rs 17–18 | Assur, Hala e cidades dos medos sem pino seguro; c. 722/721 (Samaria) não se confunde com 701 (Laquis); envelope não é fronteira exata |
| Jonas | Gate-Hefer, Jope, Nínive; Jn 1–4; 2Rs 14:25 | Társis fica sem pino; hipóteses ocidentais não equivalem a identificação |
| Império Babilônico e exílio | Babilônia, Ribla, Jerusalém, Laquis, Azeca e destinos egípcios; 2Rs 24–25; Jr 34, 43–44; Ez 1 | Quebar é região, Migdol incerto; deportações c. 605, 597, 587/586 têm cronologia discutida e rotas esquemáticas |
| Daniel e Ester | Babilônia, Susã, Ecbátana/Acmetá e Ulai em Dn 1–8, Et 1–10 e Ed 6:2 | Ulai é região aproximada, sem ponto do episódio |
| Império Persa e retorno | Susã, Ecbátana, Babilônia, Jerusalém; Ed 1–2, 7–8; Ne 2 | Persépolis e Aava sem pino seguro; Além-do-Rio é envelope c. 539 a.C., não fronteira exata |
| Profetas no mapa | Profetas ligados a cidades ou contextos indicados no texto; filtros por século e reino/contexto | Oseias não recebe uma cidade de nascimento inventada; Moresete, Quebar, Elcós e Tisbe sem pino seguro |
| Arca de Noé e Ararate | Gn 6:15 e 8:4; região de Urartu e SVG proporcional 300 × 50 × 30 côvados | Nenhum cume identificado como certo; campo de futebol é comparação ilustrativa, não reconstrução arqueológica |
| Babel e os zigurates | Gn 11:2; terra de Sinar; Ur e Babilônia como paralelos culturais | Nenhum zigurate é identificado como a torre bíblica; Sinar sem marcador pontual |
| Alexandre e o mundo grego (grátis) | Tiro, Gaza, Alexandria, Babilônia; leitura tradicional de Dn 8:5–8, 21–22 | Macedônia e Grande Mar são regiões; campanhas e divisão dos generais não são fronteiras reconstituídas |
| Ptolomeus, Selêucidas e Macabeus (grátis) | Alexandria, Antioquia, Jerusalém, Bete-Horom; 1 Macabeus como fonte histórica e Jo 10:22 | Modim e Emaús sem localização adotada; Jo 10:22 atesta a Dedicação, não as batalhas |

Os oito novos mapas do Antigo Testamento exigem acesso completo; os dois de
Entre os Testamentos são gratuitos. As coordenadas geográficas foram copiadas
somente das evidências OpenBible ou Pleiades retidas; coordenadas do desenho
SVG são apenas pixels. Textos históricos, versículos e datas são distinguidos
na ficha. Cada envelope é didático, traz ano de referência e declara
**“não é fronteira exata”**. Nenhum conteúdo deste lote foi publicado.

### Matriz de cobertura do lote 4 — Jesus e igreja primitiva

| Item | Cobertura verificável | Limites assumidos |
| --- | --- | --- |
| Herodes e seus filhos | Herodes, Arquelau (Mt 2:22), Antipas e Filipe (Lc 3:1); contexto histórico em Josefo | Territórios são envelopes por período, não fronteiras exatas; monumentos sem localização comprovada ficam sem pino |
| Nascimento e infância (grátis) | Belém, Nazaré, apresentação e Jesus aos doze anos (Lc 2); fuga e retorno (Mt 2) | Mateus e Lucas narram partes distintas, sem itinerário egípcio pontual nem cronologia harmonizada |
| Ministério na Galileia | Mt 4:12–25, Mc 1–6; cidades, lago e episódios locais | Tabor é tradição debatida; multiplicação não recebe lugar certo |
| Decápolis, Tiro, Sidom e Pereia | Mc 5; 7; Mt 8:28; 16:13; Jo 1:28; 4; 10:40 | Gadara/Gerasa divergem entre relatos; poço de Jacó e Betânia além do Jordão sem pino arbitrário |
| Última semana e ressurreição | Lc 19; 24; Mt 28; Jo 21; Jerusalém, arredores e Galileia | Gólgota e Getsêmani sem local exato; Emaús debatida; divergências de sequência entre os Evangelhos explícitas |
| Pentecostes: nações de Atos 2 (grátis) | Quinze regiões/povos de At 2:9–11 ligados ao relato em Jerusalém | Regiões não são pontos ou trajetos individuais comprovados |
| Igreja em Atos 1–12 | Filipe em At 8, Pedro e Cornélio em At 9–10, Antioquia em At 11 | Estrada de Gaza e cena de conversão não recebem pino exato |
| Conversão e primeiros anos de Paulo | At 9; 11; 2Co 11:32–33; Gl 1–2 | Arábia é região; intervalo e articulação das fontes são aproximados |

Os oito novos mapas do NT são fichas documentais, não reconstruções
certificadas. Os dois assinalados como grátis são nascimento e infância e
Pentecostes; os outros seis exigem acesso completo. Coordenadas plotadas usam
apenas as evidências OpenBible ou Pleiades guardadas. Referências a Josefo são
fontes históricas, não versículos dos Evangelhos. Os passos preservam episódios
sem geocódigo como texto, sem forçar uma ordem única dos quatro Evangelhos.
Nenhum conteúdo deste lote foi publicado.

Os mapas disponíveis são uma compilação editorial rastreável, não um atlas
arqueológico certificado. Coordenadas de OpenBible.info e Pleiades são pontos
representativos; linhas e áreas são geometrias didáticas. Rotas retas não são
estradas, trilhas GPS ou itinerários medidos. Hipóteses devem permanecer
rotuladas como prováveis, debatidas ou desconhecidas, e lugares sem
identificação segura devem permanecer sem coordenadas.

As fontes retidas no repositório devem declarar suas licenças e atribuições:
Natural Earth (domínio público) para a base moderna, OpenBible.info (CC BY
4.0) e Pleiades (CC BY 3.0). A base Natural Earth é apenas orientação
contemporânea; ela não prova fronteiras antigas, soberania ou localização de
um episódio bíblico. Textos bíblicos devem continuar referenciados sem
reproduzir traduções protegidas.

As 19 ilustrações do Tabernáculo são SVGs originais feitos em código.
Cada peça inclui pontos numerados, vistas disponíveis e dados estruturados;
a navegação didática passa da porta ao Santo dos Santos e acompanha a ordem
das vestes em Levítico 8. As 13 ilustrações do Templo de Salomão também são
SVGs originais com planta, frente, corte e vista 3/4 (além de vista explodida
das bases). A revisão documental de cada peça está em `maps-review.md`.
Somente visão geral e comparação são gratuitas na pasta do Templo.

Na planta da casa, 40 côvados de hekal (1Rs 6:17) + 20 de debir
(1Rs 6:20) = 60 côvados (1Rs 6:2). O pórtico mede **20 de largura × 10
de profundidade** (1Rs 6:3) e não acrescenta 20 ao comprimento interno
de 60. Escrever `20 + 40 + 20 = 60` confunde a largura do pórtico com
comprimento e é matematicamente errado. Divergências Reis/Crônicas mantêm
ambas as leituras e referências, sem escolher uma silenciosamente.
No esquema axial, a profundidade do pórtico soma-se separadamente:
10 + 40 + 20 = 70 côvados, **sem contar espessuras de paredes**.
Essa soma não é uma cota externa informada pelo texto.

Ilustrações futuras serão SVGs originais, com peças clicáveis, medidas em
côvados quando a fonte fornecer medida, material, referências e área de
destaque. Conversões métricas serão apresentadas como aproximadas; ausência
de medida não deve ser preenchida por estimativa escondida.

## Etapas de implementação

1. Validar o manifesto e gerar os JSON disponíveis a partir das evidências
   preservadas; criar diretórios de ilustrações e SVG sem fingir conteúdo.
2. Fazer o servidor carregar arquivos válidos, registrar arquivos inválidos e
   continuar com o catálogo válido quando diretórios estiverem vazios ou
   ausentes.
3. Expandir schema e resumos com seção, ordem, era, panorama moderno,
   referências-chave e aliases; validar manifesto, JSON e SVG referenciado
   em testes.
4. Organizar o catálogo em seções e subseções cronológicas; em produção,
   ocultar seções sem conteúdo; em desenvolvimento, indicar “Em breve”.
5. Implementar a ficha com “Como era”, “Como é hoje” e comparação, incluindo
   mapa local sem servidor de tiles público, fontes, incerteza, referências,
   lugares e assistente existente.
6. Adicionar as ilustrações do Templo após conferir fontes, revisão editorial
   e SVGs originais correspondentes (concluído nesta etapa).
7. Rodar a suíte completa, revisar visualmente web/TWA/WebView iOS e só então
   submeter para revisão do dono. Esta etapa não publica o projeto.

## Critérios de aceitação

- `GET /api/atlas/catalog` responde 200 mesmo quando uma pasta é ausente ou
  vazia, contendo apenas arquivos válidos e registrando os inválidos.
- Os 75 IDs disponíveis do manifesto carregam e passam pelo schema: 42 mapas
  e 33 ilustrações SVG. Os mapas conservam panorama moderno de 3–6 frases;
  as ilustrações documentam função, partes, cotas e incertezas em vez de
  descrever uma localização moderna inexistente.
- Somente itens `sample: true` no manifesto são gratuitos; itens planejados
  permanecem `pendente` e não são carregados como conteúdo.
- Nenhum item pendente é servido como se estivesse disponível; as 13
  ilustrações do Templo possuem JSON e SVGs correspondentes e só as duas
  amostras declaradas no manifesto são abertas ao visitante.
- A tela ordena as seções, filtra AT/NT, época e disponibilidade, e leva itens
  bloqueados à tela de assinaturas existente.
- A comparação histórica diferencia nomes/rotas antigas da orientação moderna,
  mantém atribuições visíveis, oferece áreas de toque acessíveis e não usa
  tiles remotos.
- Referências tocáveis reutilizam a navegação bíblica existente quando houver
  destino compatível; perguntas usam somente `POST /api/ai/ask` e o contexto
  validado do Atlas.
- Nenhuma alteração é feita em preços, planos, checkout, pagamentos,
  webhooks, lojas, Clerk, painel admin, `/oferta`, Google Ads ou tela de
  assinaturas.

## Preservação de autenticação, IA e publicação

O Atlas reutiliza as regras de acesso e a tela de assinaturas já existentes.
Não cria tabela, migração, rota de IA nova ou quota nova. A divergência de
quota já documentada em `docs/atlas/integration.md` permanece documentada e
não é corrigida neste plano. O projeto não deve ser publicado nesta etapa;
o dono revisará conteúdo, fontes, incertezas, testes e visual antes da
publicação.