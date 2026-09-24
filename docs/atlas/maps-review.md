# Mapas do atlas — revisão documental, não aprovação especializada

Compilação: 2026-09-24. Versão 1; dez mapas; todos sample=true. Nenhum revisor humano ou especialista aprovou estes dados. O estado documented significa identificação de cidades rastreável, não reconstrução histórica certificada; needs-specialist sinaliza incerteza de reconstrução. Não foram usadas imagens, tiles ou traçados de mapas de terceiros.

## Fontes e procedimento efetivamente executado

- Download público real de https://www.openbible.info/geo/data/merged.txt e https://www.openbible.info/geo/data/places.txt; arquivos integrais preservados em evidence/. São bases legadas de 2007, não a edição mais recente. A página https://www.openbible.info/geo/ declara: “The dataset as a whole is licensed under the Creative Commons Attribution license” e liga CC BY 4.0; também alerta que alguns dados atuais são OSM. Não foram importados basemaps OSM.
- Download real dos JSON Pleiades 687928 (Jerusalém), 599612 (Éfeso) e 678437 (Tiro), retidos integralmente. O campo rights dos registros declara Creative Commons Attribution 3.0. Atribuição: Pleiades contributors / The Creators; créditos individuais e bibliografia nos JSON. Usado reprPoint, sem fingir que seus decimais oferecem exatidão métrica.
- Leitura das linhas do OpenBible por chave exata; inversão de latitude/longitude para [longitude,latitude], mantendo o valor numérico original. Marcas ~, <, > e ? na fonte significam aproximação ou relação espacial, não prova. Pontos de locais particulares reduzidos à coordenada genérica de uma cidade NÃO foram adotados como locais exatos.
- Referências em OSIS normalizado (por exemplo Exod, Josh, 1Kgs, Matt, Acts, Rev); referências não são transcrição de tradução protegida. Links bíblicos apontam para WEB, domínio público. As explicações em português e geometrias foram redigidas originalmente nesta compilação.
- Polilinhas são segmentos entre representantes; polígonos são envelopes editoriais, nunca fronteiras urbanas antigas, fronteiras modernas ou áreas de soberania. Não foram digitalizadas imagens de atlas comercial. A fonte editorial liga a documentação do geocodificador apenas como apoio, sem alegar que ele publicou nossos polígonos.
- Conferência documental da chave, coordenada, contexto narrativo e limites do recorte, não inspeção em campo. O script build-maps.cjs permite reproduzir os JSON a partir das evidências retidas. A data indica compilação, não data de revisão humana.

## Evidência por mapa e localidade

### palestine-jesus — Palestina no tempo de Jesus

Estado: **needs-specialist**. Período: c. 6 a.C.–30 d.C.; recorte geográfico do início do século I. Recorte [oeste,sul,leste,norte]: [34.1,30.9,36.5,33.7].

- **Nazaré** (nazareth); hoje: An-Nasira/Nazaré, Israel. Certeza: established; coordenada: [35.30152807767973,32.70674542474383]; referências: Luke 4:16.
  - Método/evidência OpenBible: chave literal “Nazareth”; raiz “(direta)”; latitude bruta “32.70674542474383”; longitude bruta “35.30152807767973”; excerto da coluna de passagens: “Matt 2:23, Matt 4:13, Matt 21:11, Matt 26:71”. Arquivo: [merged.txt](evidence/openbible-merged.txt); [fonte pública](https://www.openbible.info/geo/data/merged.txt). Ponto transcrito; identificação narrativa avaliada separadamente.
  - Limite interpretativo: Localidade galileia associada à criação de Jesus. Ponto representativo da localidade, não limite urbano antigo.
- **Cafarnaum** (capernaum); hoje: Kfar Nahum, margem norte do lago da Galileia, Israel. Certeza: established; coordenada: [35.57515767479308,32.88059412581622]; referências: Matt 4:13.
  - Método/evidência OpenBible: chave literal “Capernaum”; raiz “(direta)”; latitude bruta “32.88059412581622”; longitude bruta “35.57515767479308”; excerto da coluna de passagens: “Matt 4:13, Matt 8:5, Matt 11:23, Matt 17:24”. Arquivo: [merged.txt](evidence/openbible-merged.txt); [fonte pública](https://www.openbible.info/geo/data/merged.txt). Ponto transcrito; identificação narrativa avaliada separadamente.
  - Limite interpretativo: Sítio junto ao lago associado ao ministério de Jesus. Ponto representativo da localidade, não limite urbano antigo.
- **Belém** (bethlehem); hoje: Bayt Lahm/Belém, Cisjordânia. Certeza: established; coordenada: [35.21026630105202,31.70536129174666]; referências: Matt 2:1.
  - Método/evidência OpenBible: chave literal “Bethlehem 1”; raiz “(direta)”; latitude bruta “31.70536129174666”; longitude bruta “35.21026630105202”; excerto da coluna de passagens: “Gen 35:19, Gen 48:7, Judg 12:8, Judg 12:10”. Arquivo: [merged.txt](evidence/openbible-merged.txt); [fonte pública](https://www.openbible.info/geo/data/merged.txt). Ponto transcrito; identificação narrativa avaliada separadamente.
  - Limite interpretativo: Belém da Judeia, distinta da localidade homônima da Galileia. Ponto representativo da localidade, não limite urbano antigo.
- **Jerusalém** (jerusalem); hoje: Jerusalém; a Cidade Velha fica em Jerusalém Oriental. Certeza: established; coordenada: [35.234935,31.777444]; referências: Matt 21:10.
  - Método/evidência OpenBible: chave literal “Jerusalem”; raiz “(direta)”; latitude bruta “31.777444”; longitude bruta “35.234935”; excerto da coluna de passagens: “Josh 10:1, Josh 10:3, Josh 10:5, Josh 10:23”. Arquivo: [merged.txt](evidence/openbible-merged.txt); [fonte pública](https://www.openbible.info/geo/data/merged.txt). Ponto transcrito; identificação narrativa avaliada separadamente.
  - Limite interpretativo: Centro da Judeia sob domínio romano; a situação política atual não é projetada sobre o século I. Ponto representativo da localidade, não limite urbano antigo.
- **Jericó** (jericho); hoje: Ariha/Jericó, Cisjordânia. Certeza: probable; coordenada: [35.44386371224434,31.87060143818292]; referências: Luke 19:1.
  - Método/evidência OpenBible: chave literal “Jericho”; raiz “(direta)”; latitude bruta “31.87060143818292”; longitude bruta “35.44386371224434”; excerto da coluna de passagens: “Num 22:1, Num 26:3, Num 26:63, Num 31:12”. Arquivo: [merged.txt](evidence/openbible-merged.txt); [fonte pública](https://www.openbible.info/geo/data/merged.txt). Ponto transcrito; identificação narrativa avaliada separadamente.
  - Limite interpretativo: O geocódigo é de Tell es-Sultan; a Jericó herodiana tinha núcleo ao sul. Não identifica o ponto exato do encontro com Zaqueu. Ponto representativo da localidade, não limite urbano antigo.
- **Betânia** (bethany); hoje: Al-Eizariya, Cisjordânia. Certeza: probable; coordenada: [35.26212203964414,31.77166591433378]; referências: John 11:1.
  - Método/evidência OpenBible: chave literal “Bethany 1”; raiz “(direta)”; latitude bruta “31.77166591433378”; longitude bruta “35.26212203964414”; excerto da coluna de passagens: “Matt 21:17, Matt 26:6, Mark 11:1, Mark 11:11”. Arquivo: [merged.txt](evidence/openbible-merged.txt); [fonte pública](https://www.openbible.info/geo/data/merged.txt). Ponto transcrito; identificação narrativa avaliada separadamente.
  - Limite interpretativo: Identificação usual a leste de Jerusalém; distinta da Betânia além do Jordão. Ponto representativo da localidade, não limite urbano antigo.
- **Tiro** (tyre); hoje: Sour, Líbano. Certeza: established; coordenada: [35.201829000000004,33.2693355]; referências: Mark 7:24.
  - Método/evidência Pleiades: title “Tyrus/Col. Septimia Severa”; description “The ancient city of Tyre (modern es-Sur on the coast of Lebanon). A UNESCO World Heritage Site, in part because of its "important archaeological remains, mainly from Roman times."”; reprPoint [35.201829000000004,33.2693355]. [JSON preservado](evidence/pleiades-678437.json), [registro](https://pleiades.stoa.org/places/678437).
  - Comparação documental, não média: OpenBible “Tyre” tem [35.19257453545583, 33.27582782266882]. Diferença entre representantes de bases não é deslocamento histórico comprovado; manteve-se o Pleiades, sem mesclar coordenadas.
  - Limite interpretativo: A narrativa menciona a região de Tiro, não exige entrada neste centro urbano. Centro representativo do registro Pleiades; não delimita a cidade antiga.

Geometrias: Galileia — faixa aproximada (debated; area; original); Samaria — faixa aproximada (debated; area; original); Judeia — faixa aproximada (debated; area; original).

Incertezas e cobertura: Os polígonos não representam fronteiras precisas nem um único ano administrativo. Jericó do período romano não coincide exatamente com o ponto de Tell es-Sultan. Não se reconstrói uma cronologia harmonizada dos quatro Evangelhos.

### jerusalem-jesus — Jerusalém no tempo de Jesus

Estado: **needs-specialist**. Período: c. 20–33 d.C.; antes da destruição de 70 d.C.. Recorte [oeste,sul,leste,norte]: [35.21,31.75,35.28,31.8].

- **Jerusalém do Segundo Templo** (jerusalem); hoje: Cidade Velha de Jerusalém, Jerusalém Oriental. Certeza: established; coordenada: [35.234978,31.7771895]; referências: Matt 21:10.
  - Método/evidência Pleiades: title “Ierusalem/Hierosolyma/Col. Aelia Capitolina”; description “The city of Jerusalem.”; reprPoint [35.234978,31.7771895]. [JSON preservado](evidence/pleiades-687928.json), [registro](https://pleiades.stoa.org/places/687928).
  - Comparação documental, não média: OpenBible “Jerusalem” tem [35.234935, 31.777444]. Diferença entre representantes de bases não é deslocamento histórico comprovado; manteve-se o Pleiades, sem mesclar coordenadas.
  - Limite interpretativo: Ponto geral da cidade na fase de Jesus; o registro Pleiades também cobre outras fases que não são mapeadas aqui. Centro representativo do registro Pleiades; não delimita a cidade antiga.
- **Monte das Oliveiras** (olives); hoje: Jabal al-Zaytun/Monte das Oliveiras, Jerusalém Oriental. Certeza: established; coordenada: [35.2471976093501,31.77809503341373]; referências: Luke 19:37.
  - Método/evidência OpenBible: chave literal “Mount of Olives”; raiz “(direta)”; latitude bruta “31.77809503341373”; longitude bruta “35.2471976093501”; excerto da coluna de passagens: “2 Sam 15:30, Zech 14:4, Matt 21:1, Matt 24:3”. Arquivo: [merged.txt](evidence/openbible-merged.txt); [fonte pública](https://www.openbible.info/geo/data/merged.txt). Ponto transcrito; identificação narrativa avaliada separadamente.
  - Limite interpretativo: Elevação a leste da cidade, não uma localização exata de cada discurso. Ponto representativo da localidade, não limite urbano antigo.
- **Betânia** (bethany); hoje: Al-Eizariya, Cisjordânia. Certeza: probable; coordenada: [35.26212203964414,31.77166591433378]; referências: Mark 11:1, John 11:1.
  - Método/evidência OpenBible: chave literal “Bethany 1”; raiz “(direta)”; latitude bruta “31.77166591433378”; longitude bruta “35.26212203964414”; excerto da coluna de passagens: “Matt 21:17, Matt 26:6, Mark 11:1, Mark 11:11”. Arquivo: [merged.txt](evidence/openbible-merged.txt); [fonte pública](https://www.openbible.info/geo/data/merged.txt). Ponto transcrito; identificação narrativa avaliada separadamente.
  - Limite interpretativo: Localidade a leste do monte das Oliveiras. Ponto representativo da localidade, não limite urbano antigo.
- **Getsêmani** (gethsemane); hoje: Desconhecido com exatidão; tradição ao pé do monte das Oliveiras. Certeza: debated; coordenada: null; referências: Matt 26:36.
  - Método/evidência OpenBible: chave literal “Gethsemane”; raiz “Jerusalem”; latitude bruta “~31.777444”; longitude bruta “~35.234935”; excerto da coluna de passagens: “Matt 26:36, Mark 14:32”. Arquivo: [merged.txt](evidence/openbible-merged.txt); [fonte pública](https://www.openbible.info/geo/data/merged.txt). Coordenada da fonte deliberadamente rejeitada por não localizar o sítio específico.
  - Limite interpretativo: O OpenBible legado atribui a Getsêmani o ponto genérico de Jerusalém com til. Esse ponto não foi reutilizado como coordenada do jardim; a localização tradicional não é uma comprovação do episódio.
- **Gólgota** (golgotha); hoje: Desconhecido com exatidão; identificação tradicional no Santo Sepulcro, Jerusalém. Certeza: debated; coordenada: null; referências: John 19:17.
  - Método: local citado na narrativa, sem geocódigo aceito. Nenhuma consulta foi inventada; a ausência de uma identificação suficiente é explicitada, e coordinates=null impede falsa precisão. Fonte textual: John 19:17.
  - Limite interpretativo: A identificação tradicional é importante historicamente, mas este recorte não fornece uma coordenada arqueológica verificada para o local da execução.

Geometrias: Betânia → monte das Oliveiras → Jerusalém (probable; route; original).

Incertezas e cobertura: Não há reconstrução de muralhas, portas, dimensões do Templo ou traçado urbano. Getsêmani e Gólgota permanecem sem coordenadas nesta amostra. Todas as fases históricas diferentes da fase de Jesus estão adiadas.

### paul-first-journey — Primeira viagem de Paulo

Estado: **needs-specialist**. Período: c. 46–48 d.C.; datação aproximada. Recorte [oeste,sul,leste,norte]: [29.8,34.2,37,39].

- **Antioquia da Síria** (antioch); hoje: Antakya, província de Hatay, Turquia. Certeza: established; coordenada: [36.16238775165068,36.20233087051257]; referências: Acts 13:1, Acts 14:26.
  - Método/evidência OpenBible: chave literal “Antioch 1”; raiz “(direta)”; latitude bruta “36.20233087051257”; longitude bruta “36.16238775165068”; excerto da coluna de passagens: “Acts 6:5, Acts 11:19, Acts 11:20, Acts 11:22”. Arquivo: [merged.txt](evidence/openbible-merged.txt); [fonte pública](https://www.openbible.info/geo/data/merged.txt). Ponto transcrito; identificação narrativa avaliada separadamente.
  - Limite interpretativo: Cidade de partida e retorno de Paulo e Barnabé; 'da Síria' é a designação histórica, não o país atual. Ponto representativo da localidade, não limite urbano antigo.
- **Selêucia Piéria** (seleucia); hoje: Çevlik/Samandağ, Turquia. Certeza: established; coordenada: [35.92680788324002,36.11101750333098]; referências: Acts 13:4.
  - Método/evidência OpenBible: chave literal “Seleucia”; raiz “(direta)”; latitude bruta “36.11101750333098”; longitude bruta “35.92680788324002”; excerto da coluna de passagens: “Acts 13:4”. Arquivo: [merged.txt](evidence/openbible-merged.txt); [fonte pública](https://www.openbible.info/geo/data/merged.txt). Ponto transcrito; identificação narrativa avaliada separadamente.
  - Limite interpretativo: Porto de embarque mencionado por Atos. Ponto representativo da localidade, não limite urbano antigo.
- **Salamina** (salamis); hoje: Ruínas de Salamina, perto de Famagusta, Chipre. Certeza: established; coordenada: [33.90755212865949,35.17724606944397]; referências: Acts 13:5.
  - Método/evidência OpenBible: chave literal “Salamis”; raiz “(direta)”; latitude bruta “35.17724606944397”; longitude bruta “33.90755212865949”; excerto da coluna de passagens: “Acts 13:5”. Arquivo: [merged.txt](evidence/openbible-merged.txt); [fonte pública](https://www.openbible.info/geo/data/merged.txt). Ponto transcrito; identificação narrativa avaliada separadamente.
  - Limite interpretativo: Primeira localidade nomeada na etapa cipriota. Ponto representativo da localidade, não limite urbano antigo.
- **Pafos** (paphos); hoje: Pafos, Chipre. Certeza: established; coordenada: [32.40016213313376,34.75410576175517]; referências: Acts 13:6.
  - Método/evidência OpenBible: chave literal “Paphos”; raiz “(direta)”; latitude bruta “34.75410576175517”; longitude bruta “32.40016213313376”; excerto da coluna de passagens: “Acts 13:6, Acts 13:13”. Arquivo: [merged.txt](evidence/openbible-merged.txt); [fonte pública](https://www.openbible.info/geo/data/merged.txt). Ponto transcrito; identificação narrativa avaliada separadamente.
  - Limite interpretativo: Localidade no oeste da ilha; o percurso interior não é informado. Ponto representativo da localidade, não limite urbano antigo.
- **Perge** (perga); hoje: Perge/Aksu, perto de Antalya, Turquia. Certeza: established; coordenada: [30.90494591606115,37.00520811721595]; referências: Acts 13:13, Acts 14:25.
  - Método/evidência OpenBible: chave literal “Perga”; raiz “(direta)”; latitude bruta “37.00520811721595”; longitude bruta “30.90494591606115”; excerto da coluna de passagens: “Acts 13:13, Acts 13:14, Acts 14:25”. Arquivo: [merged.txt](evidence/openbible-merged.txt); [fonte pública](https://www.openbible.info/geo/data/merged.txt). Ponto transcrito; identificação narrativa avaliada separadamente.
  - Limite interpretativo: Escala da Panfília na ida e na volta. Ponto representativo da localidade, não limite urbano antigo.
- **Antioquia da Pisídia** (pisidian-antioch); hoje: Sítio junto a Yalvaç, Turquia. Certeza: established; coordenada: [31.17948683048973,38.31643056393041]; referências: Acts 13:14.
  - Método/evidência OpenBible: chave literal “Antioch 2”; raiz “(direta)”; latitude bruta “38.31643056393041”; longitude bruta “31.17948683048973”; excerto da coluna de passagens: “Acts 13:14, Acts 14:19, Acts 14:21, 2 Tim 3:11”. Arquivo: [merged.txt](evidence/openbible-merged.txt); [fonte pública](https://www.openbible.info/geo/data/merged.txt). Ponto transcrito; identificação narrativa avaliada separadamente.
  - Limite interpretativo: Distinta da Antioquia da Síria; tradicionalmente chamada 'da Pisídia'. Ponto representativo da localidade, não limite urbano antigo.
- **Icônio** (iconium); hoje: Konya, Turquia. Certeza: established; coordenada: [32.4942625657248,37.88353038890398]; referências: Acts 14:1.
  - Método/evidência OpenBible: chave literal “Iconium”; raiz “(direta)”; latitude bruta “37.88353038890398”; longitude bruta “32.4942625657248”; excerto da coluna de passagens: “Acts 13:51, Acts 14:1, Acts 14:19, Acts 14:21”. Arquivo: [merged.txt](evidence/openbible-merged.txt); [fonte pública](https://www.openbible.info/geo/data/merged.txt). Ponto transcrito; identificação narrativa avaliada separadamente.
  - Limite interpretativo: Cidade na sequência narrativa de Atos 14. Ponto representativo da localidade, não limite urbano antigo.
- **Listra** (lystra); hoje: Hatunsaray, perto de Konya, Turquia. Certeza: probable; coordenada: [32.45318282875567,37.57813498250009]; referências: Acts 14:6.
  - Método/evidência OpenBible: chave literal “Lystra”; raiz “(direta)”; latitude bruta “37.57813498250009”; longitude bruta “32.45318282875567”; excerto da coluna de passagens: “Acts 14:6, Acts 14:8, Acts 14:21, Acts 16:1”. Arquivo: [merged.txt](evidence/openbible-merged.txt); [fonte pública](https://www.openbible.info/geo/data/merged.txt). Ponto transcrito; identificação narrativa avaliada separadamente.
  - Limite interpretativo: Identificação do sítio de Listra na região de Hatunsaray. Ponto representativo da localidade, não limite urbano antigo.
- **Derbe** (derbe); hoje: Kerti Höyük, região de Karaman, Turquia. Certeza: probable; coordenada: [33.27141769926378,37.35092016962404]; referências: Acts 14:20.
  - Método/evidência OpenBible: chave literal “Derbe”; raiz “(direta)”; latitude bruta “37.35092016962404”; longitude bruta “33.27141769926378”; excerto da coluna de passagens: “Acts 14:6, Acts 14:20, Acts 16:1, Acts 20:4”. Arquivo: [merged.txt](evidence/openbible-merged.txt); [fonte pública](https://www.openbible.info/geo/data/merged.txt). Ponto transcrito; identificação narrativa avaliada separadamente.
  - Limite interpretativo: Identificação usual em Kerti Höyük; ponto aproximado da base legada. Ponto representativo da localidade, não limite urbano antigo.
- **Atália** (attalia); hoje: Antalya, Turquia. Certeza: established; coordenada: [30.69456557778969,36.88082580070078]; referências: Acts 14:25.
  - Método/evidência OpenBible: chave literal “Attalia”; raiz “(direta)”; latitude bruta “36.88082580070078”; longitude bruta “30.69456557778969”; excerto da coluna de passagens: “Acts 14:25”. Arquivo: [merged.txt](evidence/openbible-merged.txt); [fonte pública](https://www.openbible.info/geo/data/merged.txt). Ponto transcrito; identificação narrativa avaliada separadamente.
  - Limite interpretativo: Porto da etapa final de retorno. Ponto representativo da localidade, não limite urbano antigo.

Geometrias: Ida: Antioquia → Chipre → Derbe (probable; route; original); Volta: Derbe → Atália → Antioquia (probable; route; original).

Incertezas e cobertura: Cronologia aproximada; nenhuma estrada ou rota marítima é considerada exata. As escalas são textuais; a geometria dos trajetos é editorial. Listra e Derbe exigem verificação especializada antes de uso arqueológico.

### exodus-hypotheses — Êxodo: hipóteses geográficas

Estado: **needs-specialist**. Período: Narrativa situada no II milênio a.C.; propostas nos séculos XV e XIII a.C., sem data consensual. Recorte [oeste,sul,leste,norte]: [30,27,37,32.8].

- **Ramessés** (rameses); hoje: Qantir/Pi-Ramessés, delta oriental do Nilo, Egito. Certeza: probable; coordenada: [31.834216685474,30.799370210096]; referências: Exod 12:37.
  - Método/evidência OpenBible: chave literal “Rameses”; raiz “(direta)”; latitude bruta “30.799370210096”; longitude bruta “31.834216685474”; excerto da coluna de passagens: “Gen 47:11, Ex 12:37, Num 33:3, Num 33:5”. Arquivo: [merged.txt](evidence/openbible-merged.txt); [fonte pública](https://www.openbible.info/geo/data/merged.txt). Ponto transcrito; identificação narrativa avaliada separadamente.
  - Limite interpretativo: A associação toponímica com Pi-Ramessés é comum; não fixa a data do êxodo nem demonstra o evento. Ponto representativo da localidade, não limite urbano antigo.
- **Sucote do Egito** (succoth); hoje: Região de Tjeku/Wadi Tumilat, Egito; sítio exato desconhecido. Certeza: debated; coordenada: [32.25869322351544,30.62077414398056]; referências: Exod 12:37, Exod 13:20.
  - Método/evidência OpenBible: chave literal “Succoth 2”; raiz “(direta)”; latitude bruta “30.62077414398056”; longitude bruta “32.25869322351544”; excerto da coluna de passagens: “Ex 12:37, Ex 13:20, Num 33:5, Num 33:6”. Arquivo: [merged.txt](evidence/openbible-merged.txt); [fonte pública](https://www.openbible.info/geo/data/merged.txt). Ponto transcrito; identificação narrativa avaliada separadamente.
  - Limite interpretativo: Geocódigo legado como hipótese regional; não confundir com Sucote a leste do Jordão. Ponto representativo da localidade, não limite urbano antigo.
- **Sinai — candidato tradicional meridional** (sinai); hoje: Jebel Musa, península do Sinai, Egito. Certeza: debated; coordenada: [33.973333,28.539722]; referências: Exod 19:1–2.
  - Método/evidência OpenBible: chave literal “Sinai”; raiz “Mount Sinai”; latitude bruta “28.539722”; longitude bruta “33.973333”; excerto da coluna de passagens: “Ex 16:1, Ex 19:1, Ex 19:2, Lev 7:38”. Arquivo: [merged.txt](evidence/openbible-merged.txt); [fonte pública](https://www.openbible.info/geo/data/merged.txt). Ponto transcrito; identificação narrativa avaliada separadamente.
  - Limite interpretativo: Coordenada do candidato tradicional Jebel Musa, não coordenada demonstrada do Sinai bíblico. Ponto representativo da localidade, não limite urbano antigo.
- **Cades-Barneia — identificação proposta** (kadesh); hoje: Tell el-Qudeirat, nordeste do Sinai, Egito. Certeza: probable; coordenada: [34.49479554246946,30.68771281376111]; referências: Num 13:26, Deut 1:19.
  - Método/evidência OpenBible: chave literal “Kadesh-barnea”; raiz “(direta)”; latitude bruta “30.68771281376111”; longitude bruta “34.49479554246946”; excerto da coluna de passagens: “Num 32:8, Num 34:4, Deut 1:2, Deut 1:19”. Arquivo: [merged.txt](evidence/openbible-merged.txt); [fonte pública](https://www.openbible.info/geo/data/merged.txt). Ponto transcrito; identificação narrativa avaliada separadamente.
  - Limite interpretativo: Identificação usual de Cades na região de oásis; cronologia e correspondência narrativa requerem discussão. Ponto representativo da localidade, não limite urbano antigo.
- **Travessia do mar** (sea-crossing); hoje: Desconhecido; propostas no delta oriental e nos golfos do mar Vermelho. Certeza: unknown; coordenada: null; referências: Exod 14:21–22.
  - Método: local citado na narrativa, sem geocódigo aceito. Nenhuma consulta foi inventada; a ausência de uma identificação suficiente é explicitada, e coordinates=null impede falsa precisão. Fonte textual: Exod 14:21–22.
  - Limite interpretativo: Yam Suph recebe traduções e localizações diversas. Nenhum ponto de travessia foi demonstrado e não se escolhe uma coordenada arbitrária.
- **Sinai — outras propostas** (alternative-sinai); hoje: Desconhecido; propostas no norte do Sinai e no noroeste da Arábia. Certeza: debated; coordenada: null; referências: Exod 19:1, Gal 4:25.
  - Método: local citado na narrativa, sem geocódigo aceito. Nenhuma consulta foi inventada; a ausência de uma identificação suficiente é explicitada, e coordinates=null impede falsa precisão. Fonte textual: Exod 19:1; Gal 4:25.
  - Limite interpretativo: As alternativas não são equiparadas a sítios confirmados. Faltam nesta compilação provas suficientes para escolher um monte ou traçar uma segunda rota detalhada.

Geometrias: Hipótese meridional tradicional — sequência, não estrada (debated; route; original).

Incertezas e cobertura: Data, escala e historicidade dos movimentos não são resolvidas pelo geocódigo. O candidato Jebel Musa não é identificação arqueológica demonstrada. Outras famílias de hipóteses são descritas, mas não recebem rotas inventadas. Não se apresenta evidência de uma travessia específica do mar.

### twelve-tribes — As doze tribos: distribuição literária

Estado: **needs-specialist**. Período: Horizonte narrativo da instalação em Canaã; tradições territoriais sem data única. Recorte [oeste,sul,leste,norte]: [34.2,30.7,36.6,33.6].

- **Siquém** (shechem); hoje: Tell Balata, junto a Nablus, Cisjordânia. Certeza: established; coordenada: [35.2817986718367,32.21369123124062]; referências: Gen 12:6, Josh 24:1.
  - Método/evidência OpenBible: chave literal “Shechem”; raiz “(direta)”; latitude bruta “32.21369123124062”; longitude bruta “35.2817986718367”; excerto da coluna de passagens: “Gen 12:6, Gen 33:18, Gen 35:4, Gen 37:12”. Arquivo: [merged.txt](evidence/openbible-merged.txt); [fonte pública](https://www.openbible.info/geo/data/merged.txt). Ponto transcrito; identificação narrativa avaliada separadamente.
  - Limite interpretativo: O sítio de Tell Balata é a identificação arqueológica usual de Siquém. Ponto representativo da localidade, não limite urbano antigo.
- **Hebrom** (hebron); hoje: Al-Khalil/Hebrom, Cisjordânia. Certeza: established; coordenada: [35.09409986578734,31.53577362133176]; referências: Gen 13:18, Josh 14:13.
  - Método/evidência OpenBible: chave literal “Hebron”; raiz “(direta)”; latitude bruta “31.53577362133176”; longitude bruta “35.09409986578734”; excerto da coluna de passagens: “Gen 13:18, Gen 23:2, Gen 23:19, Gen 35:27”. Arquivo: [merged.txt](evidence/openbible-merged.txt); [fonte pública](https://www.openbible.info/geo/data/merged.txt). Ponto transcrito; identificação narrativa avaliada separadamente.
  - Limite interpretativo: O ponto localiza a cidade associada às narrativas patriarcais e à tradição de Calebe; não identifica a tenda de Abraão. Ponto representativo da localidade, não limite urbano antigo.
- **Dã** (dan); hoje: Tel Dan, norte de Israel. Certeza: established; coordenada: [35.65248345039043,33.24865997897308]; referências: Josh 19:47, 1Kgs 12:29.
  - Método/evidência OpenBible: chave literal “Dan”; raiz “(direta)”; latitude bruta “33.24865997897308”; longitude bruta “35.65248345039043”; excerto da coluna de passagens: “Gen 14:14, Josh 19:47, Judg 18:29, Judg 20:1”. Arquivo: [merged.txt](evidence/openbible-merged.txt); [fonte pública](https://www.openbible.info/geo/data/merged.txt). Ponto transcrito; identificação narrativa avaliada separadamente.
  - Limite interpretativo: Tell el-Qadi/Tel Dan é a identificação corrente; o mapa não resolve as etapas de migração narradas. Ponto representativo da localidade, não limite urbano antigo.
- **Siló** (shiloh); hoje: Khirbet Seilun, Cisjordânia. Certeza: established; coordenada: [35.28952869712683,32.05570050712985]; referências: Josh 18:1.
  - Método/evidência OpenBible: chave literal “Shiloh”; raiz “(direta)”; latitude bruta “32.05570050712985”; longitude bruta “35.28952869712683”; excerto da coluna de passagens: “Josh 18:1, Josh 18:8, Josh 18:9, Josh 18:10”. Arquivo: [merged.txt](evidence/openbible-merged.txt); [fonte pública](https://www.openbible.info/geo/data/merged.txt). Ponto transcrito; identificação narrativa avaliada separadamente.
  - Limite interpretativo: Local de reunião na narrativa da distribuição territorial. Ponto representativo da localidade, não limite urbano antigo.
- **Berseba** (beersheba); hoje: Tel Be'er Sheva, junto a Be'er Sheva, Israel. Certeza: established; coordenada: [34.8408885849849,31.24495217357714]; referências: Josh 19:2.
  - Método/evidência OpenBible: chave literal “Beersheba”; raiz “(direta)”; latitude bruta “31.24495217357714”; longitude bruta “34.8408885849849”; excerto da coluna de passagens: “Gen 21:14, Gen 21:31, Gen 21:32, Gen 21:33”. Arquivo: [merged.txt](evidence/openbible-merged.txt); [fonte pública](https://www.openbible.info/geo/data/merged.txt). Ponto transcrito; identificação narrativa avaliada separadamente.
  - Limite interpretativo: Marco meridional na lista de cidades de Simeão; não implica fronteira fixa. Ponto representativo da localidade, não limite urbano antigo.
- **Jericó** (jericho); hoje: Tell es-Sultan, Ariha/Jericó, Cisjordânia. Certeza: established; coordenada: [35.44386371224434,31.87060143818292]; referências: Josh 18:21.
  - Método/evidência OpenBible: chave literal “Jericho”; raiz “(direta)”; latitude bruta “31.87060143818292”; longitude bruta “35.44386371224434”; excerto da coluna de passagens: “Num 22:1, Num 26:3, Num 26:63, Num 31:12”. Arquivo: [merged.txt](evidence/openbible-merged.txt); [fonte pública](https://www.openbible.info/geo/data/merged.txt). Ponto transcrito; identificação narrativa avaliada separadamente.
  - Limite interpretativo: Localidade listada no território de Benjamim. Ponto representativo da localidade, não limite urbano antigo.

Geometrias: Judá (debated; area; original); Simeão (dentro de Judá) (debated; area; original); Benjamim (debated; area; original); Efraim (debated; area; original); Manassés ocidental (debated; area; original); Issacar (debated; area; original); Zebulom (debated; area; original); Aser (debated; area; original); Naftali (debated; area; original); Dã (alocação inicial) (debated; area; original); Rúben (debated; area; original); Gade (debated; area; original); Meia tribo de Manassés oriental (debated; area; original).

Incertezas e cobertura: Todos os envelopes tribais são altamente esquemáticos; não se conhece uma fronteira contínua demonstrada. As tradições descrevem alocações e cidades; não equivalem a ocupação uniforme. Levi tem cidades dispersas; não há polígono de Levi. Dã setentrional não substitui silenciosamente sua alocação inicial.

### divided-kingdom — O reino dividido

Estado: **needs-specialist**. Período: c. 930–722 a.C. para Israel; Judá até 587/586 a.C.. Recorte [oeste,sul,leste,norte]: [34.2,30.7,36.6,33.7].

- **Jerusalém** (jerusalem); hoje: Jerusalém; a Cidade Velha fica em Jerusalém Oriental. Certeza: established; coordenada: [35.234935,31.777444]; referências: Matt 21:10.
  - Método/evidência OpenBible: chave literal “Jerusalem”; raiz “(direta)”; latitude bruta “31.777444”; longitude bruta “35.234935”; excerto da coluna de passagens: “Josh 10:1, Josh 10:3, Josh 10:5, Josh 10:23”. Arquivo: [merged.txt](evidence/openbible-merged.txt); [fonte pública](https://www.openbible.info/geo/data/merged.txt). Ponto transcrito; identificação narrativa avaliada separadamente.
  - Limite interpretativo: Centro da Judeia sob domínio romano; a situação política atual não é projetada sobre o século I. Ponto representativo da localidade, não limite urbano antigo.
- **Siquém** (shechem); hoje: Tell Balata, junto a Nablus, Cisjordânia. Certeza: established; coordenada: [35.2817986718367,32.21369123124062]; referências: Gen 12:6, Josh 24:1.
  - Método/evidência OpenBible: chave literal “Shechem”; raiz “(direta)”; latitude bruta “32.21369123124062”; longitude bruta “35.2817986718367”; excerto da coluna de passagens: “Gen 12:6, Gen 33:18, Gen 35:4, Gen 37:12”. Arquivo: [merged.txt](evidence/openbible-merged.txt); [fonte pública](https://www.openbible.info/geo/data/merged.txt). Ponto transcrito; identificação narrativa avaliada separadamente.
  - Limite interpretativo: O sítio de Tell Balata é a identificação arqueológica usual de Siquém. Ponto representativo da localidade, não limite urbano antigo.
- **Samaria** (samaria); hoje: Sebastia, Cisjordânia. Certeza: established; coordenada: [35.19792900000002,32.28023100000001]; referências: 1Kgs 16:24.
  - Método/evidência OpenBible: chave literal “Samaria”; raiz “(direta)”; latitude bruta “32.28023100000001”; longitude bruta “35.19792900000002”; excerto da coluna de passagens: “1 Kgs 13:32, 1 Kgs 16:24, 1 Kgs 16:28, 1 Kgs 16:29”. Arquivo: [merged.txt](evidence/openbible-merged.txt); [fonte pública](https://www.openbible.info/geo/data/merged.txt). Ponto transcrito; identificação narrativa avaliada separadamente.
  - Limite interpretativo: Capital fundada por Onri segundo Reis; não foi capital do norte desde o primeiro ano da divisão. Ponto representativo da localidade, não limite urbano antigo.
- **Dã** (dan); hoje: Tel Dan, norte de Israel. Certeza: established; coordenada: [35.65248345039043,33.24865997897308]; referências: Josh 19:47, 1Kgs 12:29.
  - Método/evidência OpenBible: chave literal “Dan”; raiz “(direta)”; latitude bruta “33.24865997897308”; longitude bruta “35.65248345039043”; excerto da coluna de passagens: “Gen 14:14, Josh 19:47, Judg 18:29, Judg 20:1”. Arquivo: [merged.txt](evidence/openbible-merged.txt); [fonte pública](https://www.openbible.info/geo/data/merged.txt). Ponto transcrito; identificação narrativa avaliada separadamente.
  - Limite interpretativo: Tell el-Qadi/Tel Dan é a identificação corrente; o mapa não resolve as etapas de migração narradas. Ponto representativo da localidade, não limite urbano antigo.
- **Hebrom** (hebron); hoje: Al-Khalil/Hebrom, Cisjordânia. Certeza: established; coordenada: [35.09409986578734,31.53577362133176]; referências: Gen 13:18, Josh 14:13.
  - Método/evidência OpenBible: chave literal “Hebron”; raiz “(direta)”; latitude bruta “31.53577362133176”; longitude bruta “35.09409986578734”; excerto da coluna de passagens: “Gen 13:18, Gen 23:2, Gen 23:19, Gen 35:27”. Arquivo: [merged.txt](evidence/openbible-merged.txt); [fonte pública](https://www.openbible.info/geo/data/merged.txt). Ponto transcrito; identificação narrativa avaliada separadamente.
  - Limite interpretativo: O ponto localiza a cidade associada às narrativas patriarcais e à tradição de Calebe; não identifica a tenda de Abraão. Ponto representativo da localidade, não limite urbano antigo.
- **Berseba** (beersheba); hoje: Tel Be'er Sheva, Israel. Certeza: established; coordenada: [34.8408885849849,31.24495217357714]; referências: Amos 5:5.
  - Método/evidência OpenBible: chave literal “Beersheba”; raiz “(direta)”; latitude bruta “31.24495217357714”; longitude bruta “34.8408885849849”; excerto da coluna de passagens: “Gen 21:14, Gen 21:31, Gen 21:32, Gen 21:33”. Arquivo: [merged.txt](evidence/openbible-merged.txt); [fonte pública](https://www.openbible.info/geo/data/merged.txt). Ponto transcrito; identificação narrativa avaliada separadamente.
  - Limite interpretativo: Centro meridional mencionado nas críticas proféticas; não uma capital. Ponto representativo da localidade, não limite urbano antigo.

Geometrias: Israel — núcleo ocidental aproximado (debated; area; original); Judá — núcleo aproximado (debated; area; original).

Incertezas e cobertura: Divisão convencionalmente datada por volta de 930 a.C.; cronologias variam. Os reinos mudaram de extensão e não coexistiram até a queda de Judá. Polígonos não incluem todos os territórios transjordanianos e não são fronteiras arqueológicas.

### abraham-journeys — Jornadas de Abraão

Estado: **needs-specialist**. Período: Horizonte patriarcal tradicional no II milênio a.C.; datação histórica não demonstrada. Recorte [oeste,sul,leste,norte]: [33.8,29.5,47.2,38].

- **Ur dos caldeus — candidato meridional** (ur); hoje: Tell el-Muqayyar, sul do Iraque. Certeza: debated; coordenada: [46.10374195774169,30.9620520474569]; referências: Gen 11:28, Gen 11:31.
  - Método/evidência OpenBible: chave literal “Ur”; raiz “(direta)”; latitude bruta “30.9620520474569”; longitude bruta “46.10374195774169”; excerto da coluna de passagens: “Gen 11:28, Gen 11:31, Gen 15:7, Neh 9:7”. Arquivo: [merged.txt](evidence/openbible-merged.txt); [fonte pública](https://www.openbible.info/geo/data/merged.txt). Ponto transcrito; identificação narrativa avaliada separadamente.
  - Limite interpretativo: Coordenada da cidade suméria de Ur; sua identificação com a Ur de Abraão é tradicional, mas não consensual. Ponto representativo da localidade, não limite urbano antigo.
- **Harã** (haran); hoje: Harran, província de Şanlıurfa, Turquia. Certeza: established; coordenada: [39.03219672227345,36.86386407659651]; referências: Gen 11:31, Gen 12:4.
  - Método/evidência OpenBible: chave literal “Haran”; raiz “(direta)”; latitude bruta “36.86386407659651”; longitude bruta “39.03219672227345”; excerto da coluna de passagens: “Gen 11:31, Gen 11:32, Gen 12:4, Gen 12:5”. Arquivo: [merged.txt](evidence/openbible-merged.txt); [fonte pública](https://www.openbible.info/geo/data/merged.txt). Ponto transcrito; identificação narrativa avaliada separadamente.
  - Limite interpretativo: Topônimo associado à cidade de Harran; não prova a presença pessoal de Abraão. Ponto representativo da localidade, não limite urbano antigo.
- **Siquém** (shechem); hoje: Tell Balata, junto a Nablus, Cisjordânia. Certeza: established; coordenada: [35.2817986718367,32.21369123124062]; referências: Gen 12:6, Josh 24:1.
  - Método/evidência OpenBible: chave literal “Shechem”; raiz “(direta)”; latitude bruta “32.21369123124062”; longitude bruta “35.2817986718367”; excerto da coluna de passagens: “Gen 12:6, Gen 33:18, Gen 35:4, Gen 37:12”. Arquivo: [merged.txt](evidence/openbible-merged.txt); [fonte pública](https://www.openbible.info/geo/data/merged.txt). Ponto transcrito; identificação narrativa avaliada separadamente.
  - Limite interpretativo: O sítio de Tell Balata é a identificação arqueológica usual de Siquém. Ponto representativo da localidade, não limite urbano antigo.
- **Hebrom** (hebron); hoje: Al-Khalil/Hebrom, Cisjordânia. Certeza: established; coordenada: [35.09409986578734,31.53577362133176]; referências: Gen 13:18, Josh 14:13.
  - Método/evidência OpenBible: chave literal “Hebron”; raiz “(direta)”; latitude bruta “31.53577362133176”; longitude bruta “35.09409986578734”; excerto da coluna de passagens: “Gen 13:18, Gen 23:2, Gen 23:19, Gen 35:27”. Arquivo: [merged.txt](evidence/openbible-merged.txt); [fonte pública](https://www.openbible.info/geo/data/merged.txt). Ponto transcrito; identificação narrativa avaliada separadamente.
  - Limite interpretativo: O ponto localiza a cidade associada às narrativas patriarcais e à tradição de Calebe; não identifica a tenda de Abraão. Ponto representativo da localidade, não limite urbano antigo.
- **Berseba** (beersheba); hoje: Tel Be'er Sheva e região de Be'er Sheva, Israel. Certeza: established; coordenada: [34.8408885849849,31.24495217357714]; referências: Gen 21:31–33.
  - Método/evidência OpenBible: chave literal “Beersheba”; raiz “(direta)”; latitude bruta “31.24495217357714”; longitude bruta “34.8408885849849”; excerto da coluna de passagens: “Gen 21:14, Gen 21:31, Gen 21:32, Gen 21:33”. Arquivo: [merged.txt](evidence/openbible-merged.txt); [fonte pública](https://www.openbible.info/geo/data/merged.txt). Ponto transcrito; identificação narrativa avaliada separadamente.
  - Limite interpretativo: A narrativa menciona o poço e a região; o geocódigo não identifica o poço de Abraão. Ponto representativo da localidade, não limite urbano antigo.
- **Egito — estadia de Abraão** (egypt); hoje: Egito; cidade da estadia desconhecida. Certeza: unknown; coordenada: null; referências: Gen 12:10.
  - Método: local citado na narrativa, sem geocódigo aceito. Nenhuma consulta foi inventada; a ausência de uma identificação suficiente é explicitada, e coordinates=null impede falsa precisão. Fonte textual: Gen 12:10.
  - Limite interpretativo: Gênesis 12:10 menciona a descida ao Egito sem nomear a cidade. Não se usa Memphis ou outra capital como substituto especulativo.

Geometrias: Ur → Harã → Siquém (debated; route; original); Siquém → Hebrom → Berseba (debated; route; original).

Incertezas e cobertura: Ur meridional é um candidato, não consenso sobre a origem de Abraão. Datas e percursos dos patriarcas não são verificáveis por estes geocódigos. A linha não é uma reconstrução de estradas mesopotâmicas ou cananeias.

### seven-churches — As sete igrejas do Apocalipse

Estado: **documented**. Período: Fim do século I d.C.; data frequentemente proposta c. 90–96 d.C., com alternativas. Recorte [oeste,sul,leste,norte]: [26.5,37.2,29.7,39.6].

- **Éfeso** (ephesus); hoje: Sítio de Efes, perto de Selçuk, Turquia. Certeza: established; coordenada: [27.34240298195866,37.940164271971945]; referências: Rev 2:1, Acts 19:1.
  - Método/evidência Pleiades: title “Ephesus/Arsinoe(ia)”; description “Ephesus/Arsinoe(ia) was the most important ancient metropolis of Ionian Asia Minor.”; reprPoint [27.34240298195866,37.940164271971945]. [JSON preservado](evidence/pleiades-599612.json), [registro](https://pleiades.stoa.org/places/599612).
  - Comparação documental, não média: OpenBible “Ephesus” tem [27.36782511573013, 37.95331433666365]. Diferença entre representantes de bases não é deslocamento histórico comprovado; manteve-se o Pleiades, sem mesclar coordenadas.
  - Limite interpretativo: Metrópole da província romana da Ásia. O ponto difere do geocódigo legado do OpenBible porque cada base escolhe um representante do sítio. Centro representativo do registro Pleiades; não delimita a cidade antiga.
- **Esmirna** (smyrna); hoje: İzmir, Turquia. Certeza: established; coordenada: [27.16192104844777,38.45196037886051]; referências: Rev 2:8.
  - Método/evidência OpenBible: chave literal “Smyrna”; raiz “(direta)”; latitude bruta “38.45196037886051”; longitude bruta “27.16192104844777”; excerto da coluna de passagens: “Rev 1:11, Rev 2:8”. Arquivo: [merged.txt](evidence/openbible-merged.txt); [fonte pública](https://www.openbible.info/geo/data/merged.txt). Ponto transcrito; identificação narrativa avaliada separadamente.
  - Limite interpretativo: Localidade destinatária da segunda mensagem. Ponto representativo da localidade, não limite urbano antigo.
- **Pérgamo** (pergamum); hoje: Bergama, Turquia. Certeza: established; coordenada: [27.16512610475739,39.11894592031751]; referências: Rev 2:12.
  - Método/evidência OpenBible: chave literal “Pergamum”; raiz “(direta)”; latitude bruta “39.11894592031751”; longitude bruta “27.16512610475739”; excerto da coluna de passagens: “Rev 1:11, Rev 2:12”. Arquivo: [merged.txt](evidence/openbible-merged.txt); [fonte pública](https://www.openbible.info/geo/data/merged.txt). Ponto transcrito; identificação narrativa avaliada separadamente.
  - Limite interpretativo: Cidade no norte da sequência das sete mensagens. Ponto representativo da localidade, não limite urbano antigo.
- **Tiatira** (thyatira); hoje: Akhisar, Turquia. Certeza: established; coordenada: [27.85655574592795,38.92579128786831]; referências: Rev 2:18.
  - Método/evidência OpenBible: chave literal “Thyatira”; raiz “(direta)”; latitude bruta “38.92579128786831”; longitude bruta “27.85655574592795”; excerto da coluna de passagens: “Acts 16:14, Rev 1:11, Rev 2:18, Rev 2:24”. Arquivo: [merged.txt](evidence/openbible-merged.txt); [fonte pública](https://www.openbible.info/geo/data/merged.txt). Ponto transcrito; identificação narrativa avaliada separadamente.
  - Limite interpretativo: Cidade também associada à origem de Lídia em Atos 16:14. Ponto representativo da localidade, não limite urbano antigo.
- **Sardes** (sardis); hoje: Sart, perto de Salihli, Turquia. Certeza: established; coordenada: [28.11413118732089,38.47682690345803]; referências: Rev 3:1.
  - Método/evidência OpenBible: chave literal “Sardis”; raiz “(direta)”; latitude bruta “38.47682690345803”; longitude bruta “28.11413118732089”; excerto da coluna de passagens: “Rev 1:11, Rev 3:1, Rev 3:4”. Arquivo: [merged.txt](evidence/openbible-merged.txt); [fonte pública](https://www.openbible.info/geo/data/merged.txt). Ponto transcrito; identificação narrativa avaliada separadamente.
  - Limite interpretativo: Antiga capital lídia; a comunidade é destinatária de uma mensagem. Ponto representativo da localidade, não limite urbano antigo.
- **Filadélfia** (philadelphia); hoje: Alaşehir, Turquia. Certeza: established; coordenada: [28.51946209047604,38.34904803135629]; referências: Rev 3:7.
  - Método/evidência OpenBible: chave literal “Philadelphia”; raiz “(direta)”; latitude bruta “38.34904803135629”; longitude bruta “28.51946209047604”; excerto da coluna de passagens: “Rev 1:11, Rev 3:7”. Arquivo: [merged.txt](evidence/openbible-merged.txt); [fonte pública](https://www.openbible.info/geo/data/merged.txt). Ponto transcrito; identificação narrativa avaliada separadamente.
  - Limite interpretativo: Cidade do interior da província romana da Ásia. Ponto representativo da localidade, não limite urbano antigo.
- **Laodiceia do Lico** (laodicea); hoje: Laodikeia, perto de Denizli, Turquia. Certeza: established; coordenada: [29.06450110237073,37.76986723761415]; referências: Rev 3:14.
  - Método/evidência OpenBible: chave literal “Laodicea”; raiz “(direta)”; latitude bruta “37.76986723761415”; longitude bruta “29.06450110237073”; excerto da coluna de passagens: “Col 2:1, Col 4:13, Col 4:15, Col 4:16”. Arquivo: [merged.txt](evidence/openbible-merged.txt); [fonte pública](https://www.openbible.info/geo/data/merged.txt). Ponto transcrito; identificação narrativa avaliada separadamente.
  - Limite interpretativo: Distinta de outras cidades antigas chamadas Laodiceia. Ponto representativo da localidade, não limite urbano antigo.

Geometrias: Ordem das mensagens: Éfeso → Laodiceia (probable; route; original).

Incertezas e cobertura: A cronologia do Apocalipse é discutida; a data proposta não é certeza. O traçado não é uma estrada romana reconstituída nem uma jornada documentada. O ponto Pleiades de Éfeso e o legado OpenBible têm centros representativos distintos.

### roman-empire — O mundo romano do Novo Testamento

Estado: **needs-specialist**. Período: Século I d.C.; localidades em diferentes momentos, não fronteiras de 117 d.C.. Recorte [oeste,sul,leste,norte]: [-11,23,46,57].

- **Roma** (rome); hoje: Roma, Itália. Certeza: established; coordenada: [12.48333333333333,41.9]; referências: Acts 28:16.
  - Método/evidência OpenBible: chave literal “Rome”; raiz “(direta)”; latitude bruta “41.9”; longitude bruta “12.48333333333333”; excerto da coluna de passagens: “Acts 2:10, Acts 18:2, Acts 19:21, Acts 23:11”. Arquivo: [merged.txt](evidence/openbible-merged.txt); [fonte pública](https://www.openbible.info/geo/data/merged.txt). Ponto transcrito; identificação narrativa avaliada separadamente.
  - Limite interpretativo: Capital imperial, chegada de Paulo segundo Atos. Ponto representativo da localidade, não limite urbano antigo.
- **Corinto** (corinth); hoje: Ancient Corinth/Archaia Korinthos, Grécia. Certeza: established; coordenada: [22.87788175588845,37.9059573586561]; referências: Acts 18:1.
  - Método/evidência OpenBible: chave literal “Corinth”; raiz “(direta)”; latitude bruta “37.9059573586561”; longitude bruta “22.87788175588845”; excerto da coluna de passagens: “Acts 18:1, Acts 19:1, 1 Cor 1:2, 2 Cor 1:1”. Arquivo: [merged.txt](evidence/openbible-merged.txt); [fonte pública](https://www.openbible.info/geo/data/merged.txt). Ponto transcrito; identificação narrativa avaliada separadamente.
  - Limite interpretativo: Cidade romana próxima ao istmo, distinta do centro moderno de Corinto. Ponto representativo da localidade, não limite urbano antigo.
- **Atenas** (athens); hoje: Athina/Atenas, Grécia. Certeza: established; coordenada: [23.73333333333333,37.98333333333333]; referências: Acts 17:16.
  - Método/evidência OpenBible: chave literal “Athens”; raiz “(direta)”; latitude bruta “37.98333333333333”; longitude bruta “23.73333333333333”; excerto da coluna de passagens: “Acts 17:15, Acts 17:16, Acts 17:22, Acts 18:1”. Arquivo: [merged.txt](evidence/openbible-merged.txt); [fonte pública](https://www.openbible.info/geo/data/merged.txt). Ponto transcrito; identificação narrativa avaliada separadamente.
  - Limite interpretativo: Ponto geral da cidade; não coordenada exata do discurso. Ponto representativo da localidade, não limite urbano antigo.
- **Éfeso** (ephesus); hoje: Sítio de Efes, perto de Selçuk, Turquia. Certeza: established; coordenada: [27.34240298195866,37.940164271971945]; referências: Rev 2:1, Acts 19:1.
  - Método/evidência Pleiades: title “Ephesus/Arsinoe(ia)”; description “Ephesus/Arsinoe(ia) was the most important ancient metropolis of Ionian Asia Minor.”; reprPoint [27.34240298195866,37.940164271971945]. [JSON preservado](evidence/pleiades-599612.json), [registro](https://pleiades.stoa.org/places/599612).
  - Comparação documental, não média: OpenBible “Ephesus” tem [27.36782511573013, 37.95331433666365]. Diferença entre representantes de bases não é deslocamento histórico comprovado; manteve-se o Pleiades, sem mesclar coordenadas.
  - Limite interpretativo: Metrópole da província romana da Ásia. O ponto difere do geocódigo legado do OpenBible porque cada base escolhe um representante do sítio. Centro representativo do registro Pleiades; não delimita a cidade antiga.
- **Antioquia da Síria** (antioch); hoje: Antakya, província de Hatay, Turquia. Certeza: established; coordenada: [36.16238775165068,36.20233087051257]; referências: Acts 13:1, Acts 14:26.
  - Método/evidência OpenBible: chave literal “Antioch 1”; raiz “(direta)”; latitude bruta “36.20233087051257”; longitude bruta “36.16238775165068”; excerto da coluna de passagens: “Acts 6:5, Acts 11:19, Acts 11:20, Acts 11:22”. Arquivo: [merged.txt](evidence/openbible-merged.txt); [fonte pública](https://www.openbible.info/geo/data/merged.txt). Ponto transcrito; identificação narrativa avaliada separadamente.
  - Limite interpretativo: Cidade de partida e retorno de Paulo e Barnabé; 'da Síria' é a designação histórica, não o país atual. Ponto representativo da localidade, não limite urbano antigo.
- **Jerusalém** (jerusalem); hoje: Jerusalém; a Cidade Velha fica em Jerusalém Oriental. Certeza: established; coordenada: [35.234935,31.777444]; referências: Matt 21:10.
  - Método/evidência OpenBible: chave literal “Jerusalem”; raiz “(direta)”; latitude bruta “31.777444”; longitude bruta “35.234935”; excerto da coluna de passagens: “Josh 10:1, Josh 10:3, Josh 10:5, Josh 10:23”. Arquivo: [merged.txt](evidence/openbible-merged.txt); [fonte pública](https://www.openbible.info/geo/data/merged.txt). Ponto transcrito; identificação narrativa avaliada separadamente.
  - Limite interpretativo: Centro da Judeia sob domínio romano; a situação política atual não é projetada sobre o século I. Ponto representativo da localidade, não limite urbano antigo.
- **Alexandria** (alexandria); hoje: Al-Iskandariya/Alexandria, Egito. Certeza: established; coordenada: [29.9569242709775,31.2278414761719]; referências: Acts 18:24, Acts 27:6.
  - Método/evidência OpenBible: chave literal “Alexandria”; raiz “(direta)”; latitude bruta “31.2278414761719”; longitude bruta “29.9569242709775”; excerto da coluna de passagens: “Acts 18:24, Acts 27:6, Acts 28:11”. Arquivo: [merged.txt](evidence/openbible-merged.txt); [fonte pública](https://www.openbible.info/geo/data/merged.txt). Ponto transcrito; identificação narrativa avaliada separadamente.
  - Limite interpretativo: Cidade de origem de Apolo e referência a navios alexandrinos; não escala afirmada de Paulo nessa viagem. Ponto representativo da localidade, não limite urbano antigo.

Geometrias: Corinto → Éfeso → Jerusalém → Antioquia (debated; route; original); Janela didática do Mediterrâneo oriental (debated; area; original).

Incertezas e cobertura: Não há contorno integral, nem fronteiras provinciais do império. Atos 18:22 não nomeia Jerusalém explicitamente; a conexão é interpretação provável. A amostra privilegia o Mediterrâneo oriental; Britânia, Gália, Hispânia e fronteiras do Danúbio não são detalhadas.

### ancient-near-east — Antigo Oriente Próximo

Estado: **needs-specialist**. Período: II–I milênios a.C.; panorama diacrônico, não um único império. Recorte [oeste,sul,leste,norte]: [28,24,51,40].

- **Nínive** (nineveh); hoje: Margem oriental de Mossul, Iraque. Certeza: established; coordenada: [43.152887,36.35941]; referências: Jonah 1:2, 2Kgs 19:36.
  - Método/evidência OpenBible: chave literal “Nineveh”; raiz “(direta)”; latitude bruta “36.359410”; longitude bruta “43.152887”; excerto da coluna de passagens: “Gen 10:11, Gen 10:12, 2 Kgs 19:36, Isa 37:37”. Arquivo: [merged.txt](evidence/openbible-merged.txt); [fonte pública](https://www.openbible.info/geo/data/merged.txt). Ponto transcrito; identificação narrativa avaliada separadamente.
  - Limite interpretativo: Centro assírio; ponto do sítio, não limite de toda a aglomeração. Ponto representativo da localidade, não limite urbano antigo.
- **Babilônia** (babylon); hoje: Ruínas de Babilônia, perto de Hillah, Iraque. Certeza: established; coordenada: [44.42088287373876,32.53650368616845]; referências: 2Kgs 24:10, 2Kgs 25:1.
  - Método/evidência OpenBible: chave literal “Babylon”; raiz “Babel”; latitude bruta “32.53650368616845”; longitude bruta “44.42088287373876”; excerto da coluna de passagens: “2 Kgs 17:24, 2 Kgs 17:30, 2 Kgs 20:12, 2 Kgs 20:14”. Arquivo: [merged.txt](evidence/openbible-merged.txt); [fonte pública](https://www.openbible.info/geo/data/merged.txt). Ponto transcrito; identificação narrativa avaliada separadamente.
  - Limite interpretativo: Centro babilônico associado à conquista de Jerusalém e ao exílio. Ponto representativo da localidade, não limite urbano antigo.
- **Susã** (susa); hoje: Shush, província do Khuzistão, Irã. Certeza: established; coordenada: [48.25788647687722,32.18919123705116]; referências: Neh 1:1, Esth 1:2.
  - Método/evidência OpenBible: chave literal “Susa”; raiz “(direta)”; latitude bruta “32.18919123705116”; longitude bruta “48.25788647687722”; excerto da coluna de passagens: “Ezra 4:9, Neh 1:1, Est 1:2, Est 1:5”. Arquivo: [merged.txt](evidence/openbible-merged.txt); [fonte pública](https://www.openbible.info/geo/data/merged.txt). Ponto transcrito; identificação narrativa avaliada separadamente.
  - Limite interpretativo: Centro elamita e aquemênida; referência ao cenário persa. Ponto representativo da localidade, não limite urbano antigo.
- **Mênfis/Nof** (memphis); hoje: Mit Rahina, ao sul do Cairo, Egito. Certeza: established; coordenada: [31.253958,29.849632]; referências: Hos 9:6, Jer 2:16.
  - Método/evidência OpenBible: chave literal “Memphis”; raiz “(direta)”; latitude bruta “29.849632”; longitude bruta “31.253958”; excerto da coluna de passagens: “Isa 19:13, Jer 2:16, Jer 44:1, Jer 46:14”. Arquivo: [merged.txt](evidence/openbible-merged.txt); [fonte pública](https://www.openbible.info/geo/data/merged.txt). Ponto transcrito; identificação narrativa avaliada separadamente.
  - Limite interpretativo: Centro egípcio; identificação tradicional da Nof bíblica. Ponto representativo da localidade, não limite urbano antigo.
- **Damasco** (damascus); hoje: Dimashq/Damasco, Síria. Certeza: established; coordenada: [36.31344999999999,33.519299]; referências: 1Kgs 11:24.
  - Método/evidência OpenBible: chave literal “Damascus”; raiz “(direta)”; latitude bruta “33.519299”; longitude bruta “36.31344999999999”; excerto da coluna de passagens: “Gen 14:15, Gen 15:2, 2 Sam 8:5, 2 Sam 8:6”. Arquivo: [merged.txt](evidence/openbible-merged.txt); [fonte pública](https://www.openbible.info/geo/data/merged.txt). Ponto transcrito; identificação narrativa avaliada separadamente.
  - Limite interpretativo: Centro arameu; não representa todo o território de Aram. Ponto representativo da localidade, não limite urbano antigo.
- **Harã** (haran); hoje: Harran, Turquia. Certeza: established; coordenada: [39.03219672227345,36.86386407659651]; referências: Gen 11:31.
  - Método/evidência OpenBible: chave literal “Haran”; raiz “(direta)”; latitude bruta “36.86386407659651”; longitude bruta “39.03219672227345”; excerto da coluna de passagens: “Gen 11:31, Gen 11:32, Gen 12:4, Gen 12:5”. Arquivo: [merged.txt](evidence/openbible-merged.txt); [fonte pública](https://www.openbible.info/geo/data/merged.txt). Ponto transcrito; identificação narrativa avaliada separadamente.
  - Limite interpretativo: Centro do norte da Mesopotâmia e referência patriarcal. Ponto representativo da localidade, não limite urbano antigo.
- **Jerusalém** (jerusalem); hoje: Jerusalém; a Cidade Velha fica em Jerusalém Oriental. Certeza: established; coordenada: [35.234935,31.777444]; referências: 2Kgs 25:1.
  - Método/evidência OpenBible: chave literal “Jerusalem”; raiz “(direta)”; latitude bruta “31.777444”; longitude bruta “35.234935”; excerto da coluna de passagens: “Josh 10:1, Josh 10:3, Josh 10:5, Josh 10:23”. Arquivo: [merged.txt](evidence/openbible-merged.txt); [fonte pública](https://www.openbible.info/geo/data/merged.txt). Ponto transcrito; identificação narrativa avaliada separadamente.
  - Limite interpretativo: Jerusalém como centro de Judá no contexto da conquista babilônica; ponto representativo, não limite urbano antigo.
- **Éden** (eden); hoje: Desconhecido; localização geográfica não estabelecida. Certeza: unknown; coordenada: null; referências: Gen 2:8–14.
  - Método: local citado na narrativa, sem geocódigo aceito. Nenhuma consulta foi inventada; a ausência de uma identificação suficiente é explicitada, e coordinates=null impede falsa precisão. Fonte textual: Gen 2:8–14.
  - Limite interpretativo: Gênesis menciona rios, mas não fornece uma localização verificável do jardim. Não se equipara o Éden a uma cidade ou ponto moderno e não se desenha um perímetro.

Geometrias: Vale inferior do Nilo — envelope (debated; area; original); Levante — envelope (debated; area; original); Mesopotâmia — envelope (debated; area; original).

Incertezas e cobertura: Panorama de muitos séculos: não implica coexistência de todos os poderes. Éden desconhecido, sem coordenadas ou polígono. Faixas físicas simplificadas não são mapas de extensão imperial.

## Cobertura e pendências explícitas

Dez amostras, não atlas exaustivo. Jerusalém tem somente a fase de Jesus; outras fases estão adiadas. As doze tribos têm 13 envelopes devido às duas porções de Manassés; Levi não recebe polígono. Êxodo só desenha a família meridional como hipótese e descreve alternativas sem fabricar rotas. Império Romano oferece uma rede oriental e Roma, não seu contorno integral. Éden, travessia do mar, outras propostas do Sinai, Getsêmani, Gólgota e cidade da estadia de Abraão no Egito não recebem coordenadas. Éfeso, Jerusalém e Tiro têm evidência dupla independente de geocodificadores; os demais pontos usam apenas o OpenBible legado e requerem corroboração especializada antes de uso arqueológico. Nenhum trajeto é certificado. Nenhuma fronteira contemporânea é traçada.
