import type { ModuleData } from "./types";

function createLessons(moduleId: string, lessonData: Array<{ title: string; content: string; references: string; questions: string[]; application: string; summary: string }>) {
  return lessonData.map((lesson, index) => ({
    id: `${moduleId}-lesson-${index + 1}`,
    title: lesson.title,
    content: lesson.content,
    references: lesson.references,
    questions: lesson.questions.join("\n"),
    application: lesson.application,
    summary: lesson.summary,
    estimatedMinutes: 22,
    order: index + 1,
  }));
}

// MÓDULO 1: Exegese do Antigo Testamento
const MODULO_1_EXEGESE_AT: ModuleData = {
  id: "nivel3-mod1-exegese-at",
  name: "Exegese do Antigo Testamento",
  description: "Métodos e práticas de interpretação dos textos hebraicos",
  icon: "BookOpen",
  color: "#DC2626",
  order: 31,
  tracks: [
    {
      id: "track-n3m1-avancado",
      level: "avancado",
      name: "Interpretando o Antigo Testamento",
      description: "Ferramentas para exposição fiel das Escrituras Hebraicas",
      requiredPlan: "premium",
      order: 1,
      lessons: createLessons("n3m1", [
        {
          title: "Fundamentos da Exegese",
          content: `Exegese significa 'conduzir para fora' - extrair o significado do texto, não impor significado ao texto (eisegese). O objetivo é descobrir o que o autor original comunicou aos leitores originais antes de aplicar à nossa situação.

A exegese requer humildade. Aproximamo-nos do texto não como mestres, mas como alunos. "A tua palavra é lâmpada para os meus pés" (Salmo 119:105). O texto tem autoridade sobre nós; nós não temos autoridade sobre ele. Nossa tarefa é ouvir, não manipular.

O processo exegético inclui: observação (o que o texto diz?), interpretação (o que significa?) e aplicação (como isso afeta minha vida?). Muitos pulam diretamente para aplicação sem fazer o trabalho duro de observação e interpretação. Isso produz interpretações distorcidas.

A oração é essencial na exegese. "Abre os meus olhos, para que veja as maravilhas da tua lei" (Salmo 119:18). O Espírito que inspirou a Escritura ilumina seu entendimento. Métodos sem Espírito produzem conhecimento sem vida; Espírito sem métodos arrisca subjetivismo.`,
          references: "Salmo 119:18, 105; 2 Timóteo 2:15; Neemias 8:8; Atos 17:11; 2 Pedro 1:20-21",
          questions: [
            "1. O que significa 'exegese'?",
            "2. Qual a diferença entre exegese e eisegese?",
            "3. Quais são as três etapas do processo exegético?",
            "4. Por que oração é essencial na exegese?",
            "5. O que acontece quando pulamos etapas?"
          ],
          application: "Na próxima vez que estudar um texto, faça cada etapa separadamente. Observe antes de interpretar; interprete antes de aplicar.",
          summary: "Exegese extrai o significado original do texto através de observação, interpretação e aplicação, com humildade e dependência do Espírito."
        },
        {
          title: "Contexto Histórico-Cultural",
          content: `Todo texto bíblico foi escrito em contexto histórico-cultural específico. Os autores e leitores originais compartilhavam conhecimentos, práticas e referências que nem sempre são óbvias para nós. Ignorar esse contexto leva a interpretações equivocadas.

O Antigo Testamento cobre aproximadamente 2.000 anos de história (Abraão até Malaquias). Patriarcas, êxodo, conquista, juízes, monarquia, exílio, retorno - cada período tem seu contexto único. Um salmo do exílio não deve ser lido como se fosse do reinado de Davi.

A cultura do Antigo Oriente Próximo ilumina muitos textos. Alianças hititas explicam a estrutura de Deuteronômio. Códigos legais mesopotâmicos contextuam a lei mosaica. Mitos de criação do Egito e Babilônia mostram como Gênesis é distintivo.

Cuidado com anacronismo - ler conceitos modernos em textos antigos. Os israelitas não pensavam como ocidentais do século XXI. Precisamos entrar no mundo deles antes de aplicar à nossa realidade. O texto é antigo; suas verdades são eternas.`,
          references: "2 Timóteo 2:15; Atos 17:11; Deuteronômio 29:29; Hebreus 1:1-2; 1 Coríntios 10:11",
          questions: [
            "1. Por que contexto histórico importa?",
            "2. Quantos anos aproximadamente o AT cobre?",
            "3. Como a cultura do Oriente Próximo ajuda?",
            "4. O que é anacronismo?",
            "5. Como você pode pesquisar contexto de um texto?"
          ],
          application: "Escolha um texto do AT. Antes de interpretá-lo, pesquise o período histórico em que foi escrito.",
          summary: "O contexto histórico-cultural do AT abrange 2.000 anos e culturas do Oriente Próximo, sendo essencial para evitar interpretações anacronísticas."
        },
        {
          title: "Gêneros Literários do AT",
          content: `O Antigo Testamento contém diversos gêneros literários, cada um com suas próprias regras de interpretação. Ler poesia como história, ou apocalíptico como narrativa, produz confusão. Identificar o gênero é passo crucial.

A narrativa histórica relata eventos reais. Gênesis a Ester conta a história de Deus com Seu povo. Narrativas descrevem, nem sempre prescrevem - nem tudo que personagens fazem é modelo a seguir. Davi cometeu adultério; isso não é aprovado.

A poesia (especialmente Salmos) usa linguagem figurada, paralelismo e intensidade emocional. "O SENHOR é minha rocha e minha fortaleza" (Salmo 18:2) não significa que Deus é pedra literal. A poesia comunica verdade através de imagens, não proposições secas.

A lei (Torah) contém diferentes tipos: moral (aplicável universalmente), civil (para Israel como nação) e cerimonial (apontando para Cristo). Discernir qual tipo afeta como aplicamos. A literatura sapiencial (Provérbios, Eclesiastes, Jó) oferece observações sobre a vida, nem sempre promessas absolutas.`,
          references: "2 Timóteo 3:16; Salmo 18:2; Provérbios 26:4-5; Eclesiastes 1:1-11; Mateus 5:17-18",
          questions: [
            "1. Por que identificar gênero importa?",
            "2. Narrativas sempre prescrevem comportamento?",
            "3. Como a poesia comunica verdade?",
            "4. Quais são os três tipos de lei?",
            "5. Provérbios são promessas absolutas?"
          ],
          application: "Identifique o gênero de três passagens diferentes do AT. Note como isso afeta sua interpretação.",
          summary: "O AT contém narrativa, poesia, lei, sabedoria e profecia, cada gênero requerendo abordagem interpretativa apropriada."
        },
        {
          title: "Exegese de Narrativa",
          content: `As narrativas bíblicas são 'histórias teológicas' - relatos verdadeiros contados para ensinar verdades sobre Deus. Não são apenas crônicas; têm propósito teológico. O autor selecionou, organizou e apresentou eventos para comunicar mensagem.

Observe a estrutura da narrativa. Onde começa e termina? Qual é o conflito central? Como é resolvido? A repetição de palavras ou frases geralmente indica ênfase. Pergunte: por que o autor incluiu esse detalhe? O que ele quer que eu entenda?

Identifique o ponto de vista do narrador. O narrador bíblico é onisciente e confiável - ele conhece pensamentos dos personagens e nunca mente. Quando ele comenta ou avalia, preste atenção especial. Ele representa a perspectiva de Deus.

Cuidado com moralização apressada. Muitas narrativas são descritivas, não prescritivas. José sendo vendido não ensina a vender irmãos. A lição pode estar em outro nível - a soberania de Deus sobre o mal humano. Sempre pergunte: qual é a mensagem teológica central?`,
          references: "Gênesis 37-50; 1 Samuel 16-31; Rute 1-4; Juízes 2:11-23; Atos 7:2-53",
          questions: [
            "1. O que são 'histórias teológicas'?",
            "2. Que perguntas fazer sobre estrutura narrativa?",
            "3. Quem é o narrador bíblico?",
            "4. O que é moralização apressada?",
            "5. Como encontrar a mensagem teológica central?"
          ],
          application: "Leia uma narrativa do AT (ex: Rute) observando estrutura, repetições e comentários do narrador.",
          summary: "Narrativas bíblicas são histórias teológicas que requerem atenção à estrutura, ponto de vista do narrador e mensagem central, evitando moralização."
        },
        {
          title: "Exegese de Poesia Hebraica",
          content: `A poesia hebraica tem características distintivas que diferem da poesia ocidental. Não usa rima ou métrica regular como na tradição europeia. Seu elemento principal é o paralelismo - a relação entre linhas consecutivas.

O paralelismo sinonímico repete a ideia com palavras diferentes. "Os céus declaram a glória de Deus, e o firmamento anuncia as obras de suas mãos" (Salmo 19:1). Linha B reafirma linha A. Isso intensifica e clarifica o significado.

O paralelismo antitético contrasta ideias opostas. "O SENHOR conhece o caminho dos justos; porém o caminho dos ímpios perecerá" (Salmo 1:6). O contraste ilumina ambos os lados. Provérbios usa muito esse tipo.

O paralelismo sintético avança a ideia. "Pedi, e dar-se-vos-á; buscai, e encontrareis; batei, e abrir-se-vos-á" (Mateus 7:7 - usando estilo hebraico). Linha B desenvolve linha A. A linguagem figurada é abundante - metáforas, símiles, hipérboles. Interprete literalmente a menos que o contexto indique figura.`,
          references: "Salmo 1; 19; 23; 119; Provérbios 1:1-7; Cântico dos Cânticos 1:1-4",
          questions: [
            "1. O que distingue a poesia hebraica?",
            "2. O que é paralelismo sinonímico?",
            "3. O que é paralelismo antitético?",
            "4. O que é paralelismo sintético?",
            "5. Como tratar linguagem figurada?"
          ],
          application: "Leia o Salmo 23 identificando tipos de paralelismo e linguagem figurada.",
          summary: "A poesia hebraica usa paralelismo (sinonímico, antitético, sintético) e linguagem figurada abundante para comunicar verdade intensificada."
        },
        {
          title: "Exegese de Literatura Profética",
          content: `Os profetas foram porta-vozes de Deus, proclamando Sua palavra ao povo de Israel. Seu ministério primário era 'forthtelling' (proclamação ao presente), não 'foretelling' (predição). Eles denunciavam pecado, chamavam ao arrependimento e anunciavam juízo ou restauração.

Entenda o contexto histórico de cada profeta. Isaías profetizou durante o declínio de Judá; Jeremias, durante o exílio; Ageu e Zacarias, no retorno. A mensagem profética era primariamente para seus contemporâneos. Aplicamos por analogia, não diretamente.

A linguagem profética é frequentemente poética e hiperbólica. "Os montes gotejam mosto, e os outeiros se derretem" (Amós 9:13) descreve abundância extraordinária, não fenômenos geológicos literais. Distingua linguagem figurada de literal pelo contexto.

Profecias messiânicas requerem atenção especial. Algumas têm cumprimento duplo - parcial na época do profeta, completo em Cristo. Isaías 7:14 referiu-se a um nascimento iminente e, mais plenamente, ao nascimento virginal de Jesus. Cristo é a chave hermenêutica para profecia.`,
          references: "Isaías 1:1-20; 7:14; 53:1-12; Jeremias 1:1-10; Amós 5:18-27; Malaquias 3:1-4",
          questions: [
            "1. Qual era o ministério primário dos profetas?",
            "2. Por que contexto histórico importa para profecia?",
            "3. Como tratar linguagem hiperbólica profética?",
            "4. O que é cumprimento duplo?",
            "5. Quem é a chave para interpretar profecia?"
          ],
          application: "Leia um capítulo de um profeta. Identifique o contexto histórico e a mensagem principal para os contemporâneos.",
          summary: "Profetas proclamavam a Palavra de Deus primariamente ao seu tempo, usando linguagem poética; Cristo é a chave para profecias messiânicas."
        },
        {
          title: "Exegese de Literatura Sapiencial",
          content: `A literatura sapiencial (Jó, Provérbios, Eclesiastes, alguns Salmos) reflete sobre a vida, relacionamentos, trabalho e o temor do SENHOR. "O temor do SENHOR é o princípio da sabedoria" (Provérbios 9:10). Sabedoria bíblica é prática, não apenas teórica.

Provérbios são observações gerais, não promessas absolutas. "Educa a criança no caminho em que deve andar; e até quando envelhecer não se desviará dele" (Provérbios 22:6) descreve o padrão geral, não garante resultado em cada caso. Pais fiéis podem ter filhos rebeldes.

Eclesiastes e Jó questionam a teologia simplista de retribuição. Os amigos de Jó assumiam: sofrimento sempre indica pecado. Deus os repreendeu. Eclesiastes observa que nem sempre os justos prosperam. A sabedoria reconhece complexidade e mistério na vida.

Compare as diferentes perspectivas sapienciais. Provérbios é geralmente otimista; Eclesiastes, realista sobre a vaidade; Jó, honesto sobre o sofrimento injusto. Juntos oferecem visão balanceada. Não construa teologia apenas de um livro.`,
          references: "Jó 1-2; 38-42; Provérbios 1:1-7; 9:10; 22:6; Eclesiastes 1:1-11; 12:13-14",
          questions: [
            "1. O que é literatura sapiencial?",
            "2. Provérbios são promessas absolutas?",
            "3. O que Jó e Eclesiastes questionam?",
            "4. Por que comparar livros sapienciais?",
            "5. Qual é o fundamento da sabedoria bíblica?"
          ],
          application: "Leia Eclesiastes 3 e Provérbios 3. Note as diferentes ênfases e como se complementam.",
          summary: "Literatura sapiencial oferece observações práticas sobre a vida, com Provérbios, Jó e Eclesiastes trazendo perspectivas complementares."
        },
        {
          title: "Tipologia no Antigo Testamento",
          content: `Tipologia reconhece que pessoas, eventos e instituições do AT prefiguram realidades do NT. O 'tipo' é a sombra; o 'antítipo' é a realidade. "A lei tem sombra dos bens futuros" (Hebreus 10:1). Não é alegoria arbitrária, mas conexões intencionadas por Deus.

Exemplos claros incluem: Adão como tipo de Cristo (Romanos 5:14); o cordeiro pascal como tipo do sacrifício de Cristo (1 Coríntios 5:7); Jonas três dias no ventre do peixe como tipo da morte e ressurreição (Mateus 12:40). O NT valida essas conexões.

Seja cuidadoso com tipologia não confirmada pelo NT. É tentador ver 'tipos' em cada detalhe do AT. Mas tipologia legítima tem correspondência real, é historicamente fundamentada e apontada pela Escritura ou claramente evidente. Não invente conexões forçadas.

A tipologia mostra a unidade da Escritura. O mesmo Deus que atuou no AT cumpriu Seus propósitos em Cristo. O AT não é obsoleto; é preparação. Cristo não veio destruir, mas cumprir. Leia o AT cristocentricamente, sem forçar cada texto a mencionar Jesus diretamente.`,
          references: "Hebreus 10:1; Romanos 5:14; 1 Coríntios 5:7; 10:1-11; Mateus 12:40; João 3:14-15",
          questions: [
            "1. O que é tipologia?",
            "2. Dê três exemplos de tipos no AT.",
            "3. Como saber se uma tipologia é válida?",
            "4. O que a tipologia mostra sobre a Escritura?",
            "5. Como ler o AT cristocentricamente?"
          ],
          application: "Estude o sistema sacrificial de Levítico e identifique como prefigura o sacrifício de Cristo.",
          summary: "Tipologia reconhece que pessoas, eventos e instituições do AT prefiguram Cristo, mostrando a unidade da Escritura e o cumprimento em Jesus."
        },
        {
          title: "Uso do Hebraico na Exegese",
          content: `O hebraico é a língua original de quase todo o AT (algumas porções em aramaico). Mesmo sem fluência, ferramentas modernas permitem acessar insights do texto original que tradução podem obscurecer.

O hebraico é língua semítica com estrutura diferente do português. As palavras derivam de raízes consonantais (geralmente trilíteras). Entender a raiz ajuda a perceber conexões entre palavras relacionadas. A raiz SH-L-M gera shalom (paz), shalem (completo), shillem (pagar).

O sistema verbal hebraico enfatiza aspecto (ação completa vs. incompleta) mais que tempo. O 'perfeito' indica ação completada; o 'imperfeito', ação em progresso ou futura. Isso afeta tradução e interpretação de muitos textos, especialmente proféticos.

Ferramentas úteis incluem: concordâncias Strong's, léxicos (BDB, HALOT), gramáticas introdutórias, softwares bíblicos (Logos, Accordance, versões gratuitas online). Você não precisa ser hebraísta para se beneficiar; use as ferramentas disponíveis com humildade.`,
          references: "2 Timóteo 2:15; Neemias 8:8; Atos 17:11; Salmo 119:18; Hebreus 4:12",
          questions: [
            "1. Por que o hebraico importa para exegese?",
            "2. O que são raízes consonantais?",
            "3. Qual a diferença entre perfeito e imperfeito hebraico?",
            "4. Que ferramentas ajudam no estudo do hebraico?",
            "5. É necessário ser fluente em hebraico?"
          ],
          application: "Use uma concordância Strong's ou software bíblico para estudar uma palavra hebraica chave em um Salmo.",
          summary: "O hebraico original oferece insights que ferramentas modernas tornam acessíveis, incluindo raízes, sistema verbal e nuances semânticas."
        },
        {
          title: "Aplicando o Antigo Testamento Hoje",
          content: `A aplicação do AT requer sabedoria. Nem tudo é diretamente aplicável. Ninguém sacrifica animais hoje - Cristo cumpriu. Não somos Israel teocrático. Mas "tudo o que dantes foi escrito, para nosso ensino foi escrito" (Romanos 15:4). O AT continua relevante.

Distinga entre aplicação direta e princípio subjacente. Mandamentos morais (não matar, não roubar) aplicam-se diretamente. Leis civis e cerimoniais ensinam princípios: o sistema sacrificial ensina sobre gravidade do pecado e necessidade de expiação, ainda que não pratiquemos sacrifícios.

Cristo é o cumprimento do AT. Leia todo o AT à luz de Cristo. Como esta passagem aponta para Ele? Como Ele a cumpre? Isso não significa alegorizar tudo, mas reconhecer que a história da redenção culmina em Jesus.

A comunidade de fé (igreja) é o povo de Deus hoje. Promessas e advertências a Israel aplicam-se analogicamente à igreja. "Aquele que crê que está em pé cuide para que não caia" (1 Coríntios 10:12) - Paulo aplica história de Israel à igreja.`,
          references: "Romanos 15:4; 1 Coríntios 10:1-13; 2 Timóteo 3:16-17; Lucas 24:27, 44; Hebreus 1:1-2",
          questions: [
            "1. Todo o AT aplica-se diretamente?",
            "2. Qual a diferença entre aplicação direta e princípio?",
            "3. Como ler o AT à luz de Cristo?",
            "4. Como a igreja se relaciona com Israel?",
            "5. Como você aplicaria Deuteronômio 6:4-9 hoje?"
          ],
          application: "Escolha uma lei cerimonial do AT. Identifique o princípio subjacente e como se aplica em Cristo.",
          summary: "O AT aplica-se através de mandamentos morais diretos, princípios subjacentes de leis civis/cerimoniais, e leitura cristocêntrica para a igreja."
        }
      ])
    }
  ]
};

// MÓDULO 2: Exegese do Novo Testamento
const MODULO_2_EXEGESE_NT: ModuleData = {
  id: "nivel3-mod2-exegese-nt",
  name: "Exegese do Novo Testamento",
  description: "Métodos e práticas de interpretação dos textos gregos",
  icon: "FileText",
  color: "#2563EB",
  order: 32,
  tracks: [
    {
      id: "track-n3m2-avancado",
      level: "avancado",
      name: "Interpretando o Novo Testamento",
      description: "Ferramentas para exposição fiel das Escrituras Gregas",
      requiredPlan: "premium",
      order: 1,
      lessons: createLessons("n3m2", [
        {
          title: "Contexto do Novo Testamento",
          content: `O Novo Testamento foi escrito em aproximadamente 50 anos (45-100 d.C.) no contexto do Império Romano. O mundo mediterrâneo era unificado politicamente por Roma e culturalmente pelo helenismo. O grego koiné era a língua franca.

O judaísmo do Segundo Templo era diverso. Fariseus, saduceus, essênios e zelotes representavam diferentes respostas à dominação estrangeira. Jesus e os apóstolos interagiram com esse contexto. Entender o judaísmo do primeiro século ilumina muitos conflitos e debates nos evangelhos.

A cultura greco-romana influenciou as igrejas. Paulo escreveu a comunidades em cidades romanas, enfrentando questões culturais: carne sacrificada a ídolos, tribunais pagãos, relações senhor-escravo. As cartas respondem a situações reais em contextos específicos.

A Septuaginta (LXX), tradução grega do AT, era a Bíblia da igreja primitiva. Os autores do NT frequentemente citam a LXX. Conhecê-la ajuda a entender como o NT interpreta e aplica o AT. A continuidade entre os Testamentos é fundamental.`,
          references: "Lucas 2:1-3; Atos 17:16-34; 1 Coríntios 8:1-13; Gálatas 1:13-14; Filipenses 3:4-6",
          questions: [
            "1. Quando o NT foi escrito?",
            "2. Quais grupos judaicos existiam no primeiro século?",
            "3. Como a cultura greco-romana afetou a igreja?",
            "4. O que é a Septuaginta?",
            "5. Por que esse contexto importa para interpretação?"
          ],
          application: "Leia Atos 17 observando como Paulo adapta sua mensagem ao contexto cultural de Atenas.",
          summary: "O NT foi escrito no contexto do Império Romano, judaísmo diversificado e cultura helenística, usando grego koiné e a Septuaginta."
        },
        {
          title: "Gêneros do Novo Testamento",
          content: `O Novo Testamento contém gêneros distintos que requerem abordagens interpretativas apropriadas. Evangelhos, Atos, epístolas e Apocalipse - cada um tem características próprias.

Os Evangelhos são 'biografias teológicas' de Jesus. Não são biografias modernas exaustivas, mas retratos seletivos com propósito teológico. João declara: "Estes foram escritos para que creiais que Jesus é o Cristo" (João 20:31). Cada evangelista tem perspectiva e ênfase próprias.

As epístolas são cartas ocasionais - escritas para ocasiões específicas. Romanos difere de Filemom em extensão e propósito. Entender a ocasião ilumina a mensagem. Coríntios responde a problemas específicos daquela igreja; precisamos 'ouvir os dois lados' para interpretar bem.

Apocalipse é literatura apocalíptica - gênero altamente simbólico com raízes no AT (Daniel, Ezequiel). Números, cores, animais são simbólicos, não literais. Besta de sete cabeças não é animal literal. Apocalipse requer familiaridade com AT e sensibilidade ao simbolismo.`,
          references: "João 20:30-31; Lucas 1:1-4; 1 Coríntios 1:10-11; Apocalipse 1:1-3; Gálatas 1:6-9",
          questions: [
            "1. Quais são os principais gêneros do NT?",
            "2. O que são 'biografias teológicas'?",
            "3. O que significa epístolas 'ocasionais'?",
            "4. Como interpretar simbolismo apocalíptico?",
            "5. Por que identificar gênero importa?"
          ],
          application: "Compare como os quatro evangelhos relatam a mesma história. Note diferenças de ênfase.",
          summary: "O NT contém evangelhos (biografias teológicas), epístolas (cartas ocasionais), Atos (história) e Apocalipse (apocalíptica simbólica)."
        },
        {
          title: "Exegese dos Evangelhos",
          content: `Os Evangelhos requerem atenção especial porque contêm ensinos de Jesus e narrativas sobre Ele. Distingua entre o que Jesus disse, o que os personagens disseram, e o que o narrador comenta. Nem toda fala nos evangelhos é modelo a seguir - Pedro também negou Jesus.

Observe o contexto literário de cada perícope (unidade textual). O que vem antes e depois? Como a passagem se encaixa no fluxo do livro? Mateus organiza por temas; Marcos por cronologia aproximada; Lucas por geografia (rumo a Jerusalém); João teologicamente.

Considere a questão sinótica. Mateus, Marcos e Lucas compartilham muito material. Onde diferem? As diferenças revelam ênfases teológicas distintas. Não são contradições, mas perspectivas complementares. João é largamente independente, com 90% de material único.

O ensino de Jesus usava formas memoráveis: parábolas, hipérboles, paradoxos, perguntas retóricas. "Se teu olho te faz tropeçar, arranca-o" (Mateus 5:29) é hipérbole - ênfase forte, não instrução literal. Identifique a forma literária para interpretar corretamente.`,
          references: "Mateus 5:27-30; 13:1-52; Marcos 4:1-34; Lucas 15:1-32; João 1:1-18; 20:30-31",
          questions: [
            "1. Como os evangelhos diferem entre si?",
            "2. O que é perícope?",
            "3. O que é a questão sinótica?",
            "4. Que formas literárias Jesus usou?",
            "5. Como identificar hipérbole?"
          ],
          application: "Estude uma parábola identificando o contexto, ponto principal e aplicação para os ouvintes originais.",
          summary: "A exegese dos evangelhos requer atenção ao contexto, questão sinótica, formas literárias de Jesus e propósito teológico de cada evangelista."
        },
        {
          title: "Exegese de Parábolas",
          content: `Parábolas são histórias com significado espiritual. Jesus as usou abundantemente - mais de 40 nos evangelhos. "Sem parábola nada lhes falava" (Marcos 4:34). Elas revelavam verdade aos receptivos e ocultavam dos endurecidos.

A maioria das parábolas tem um ponto central. Busque a lição principal em vez de alegorizar cada detalhe. Na parábola do filho pródigo, a cor da roupa não tem significado especial. O ponto central é o amor perdoador do Pai que recebe pecadores arrependidos.

Considere o contexto em que Jesus contou a parábola. Para quem falou? Que pergunta ou situação provocou? A parábola dos lavradores maus (Mateus 21:33-46) foi contada contra os líderes religiosos - eles entenderam que falava deles.

Algumas parábolas foram explicadas por Jesus (semeador, joio). Use as explicações dadas como guia para interpretar parábolas similares. Quando Jesus não explicou, seja cuidadoso em atribuir significados a detalhes. O contexto e a conclusão geralmente revelam o ponto.`,
          references: "Mateus 13:1-52; 21:33-46; 25:1-46; Marcos 4:1-34; Lucas 15:1-32; 16:1-13",
          questions: [
            "1. O que são parábolas?",
            "2. Quantos pontos centrais a maioria tem?",
            "3. Por que contexto importa para parábolas?",
            "4. Como parábolas explicadas ajudam?",
            "5. Qual o ponto central do filho pródigo?"
          ],
          application: "Estude a parábola do bom samaritano. Identifique o contexto, o ponto central e a aplicação.",
          summary: "Parábolas têm geralmente um ponto central revelado pelo contexto e conclusão; evite alegorizar cada detalhe sem base."
        },
        {
          title: "Exegese de Epístolas",
          content: `As epístolas são cartas reais para pessoas e igrejas reais. Não são tratados abstratos, mas comunicação pastoral. Entender a ocasião (por que foi escrita) é crucial. Coríntios responde a divisões, imoralidade e confusão doutrinária; o tom reflete isso.

Identifique o argumento do autor. Epístolas são argumentativas - desenvolvem raciocínio. Pergunte: qual é a tese? Como o autor a desenvolve? Que evidências usa? Romanos desenvolve o evangelho da justificação pela fé ao longo de 16 capítulos com lógica cuidadosa.

Preste atenção às partículas conectivas: 'portanto', 'porque', 'mas', 'pois'. Elas indicam relações lógicas entre ideias. "Portanto, agora nenhuma condenação há" (Romanos 8:1) - 'portanto' conecta a conclusão com o argumento anterior. Siga o fluxo do pensamento.

Distinga entre mandamentos universais e instruções situacionais. "Saudai-vos uns aos outros com ósculo santo" (Romanos 16:16) - o princípio (saudação afetuosa) é universal; a forma (ósculo) era cultural. Busque o princípio transcultural por trás da instrução específica.`,
          references: "Romanos 1:1-17; 8:1; 1 Coríntios 1:10-17; Gálatas 1:6-10; Filipenses 1:3-11; Filemom 1-25",
          questions: [
            "1. Por que ocasião importa para epístolas?",
            "2. Como identificar o argumento do autor?",
            "3. O que partículas conectivas indicam?",
            "4. Como distinguir mandamento de instrução cultural?",
            "5. Qual é o princípio por trás do 'ósculo santo'?"
          ],
          application: "Leia uma epístola curta (Filemom, Tito) identificando ocasião, argumento principal e instruções práticas.",
          summary: "Epístolas são cartas ocasionais com argumentos desenvolvidos; siga o fluxo lógico e distinga princípios universais de instruções culturais."
        },
        {
          title: "Exegese de Apocalipse",
          content: `Apocalipse é o livro mais mal interpretado do NT. Combina três gêneros: profecia, apocalíptico e carta. "Revelação de Jesus Cristo" (Apocalipse 1:1) - é sobre Cristo, não primariamente sobre eventos futuros.

A literatura apocalíptica usa simbolismo extenso. Números são simbólicos: 7 (perfeição), 12 (povo de Deus), 1000 (completude). Cores têm significado: branco (pureza, vitória), vermelho (violência). Animais representam impérios ou poderes. Não literalize o simbólico.

Leia Apocalipse com o AT em mente. Há mais de 500 alusões ao AT, especialmente Daniel, Ezequiel, Isaías e Êxodo. A besta emerge do mar como em Daniel 7. A nova Jerusalém reflete Ezequiel 40-48. Familiaridade com essas fontes é essencial.

O propósito era encorajar cristãos perseguidos. Roma parecia invencível; Apocalipse revela que Cristo reina e triunfará. "Vencerão porque o Cordeiro os vencerá" (Apocalipse 17:14). A mensagem principal é esperança e fidelidade diante de oposição, não esquema cronológico detalhado.`,
          references: "Apocalipse 1:1-3; 4-5; 12; 17:14; 21-22; Daniel 7; Ezequiel 1; 40-48",
          questions: [
            "1. Quais gêneros Apocalipse combina?",
            "2. O que números simbolizam em Apocalipse?",
            "3. Por que conhecer o AT ajuda?",
            "4. Qual era o propósito original?",
            "5. Qual a mensagem principal?"
          ],
          application: "Leia Apocalipse 5. Identifique símbolos do AT e a mensagem central sobre Cristo.",
          summary: "Apocalipse é profecia apocalíptica cheia de simbolismo do AT, escrita para encorajar perseguidos com a certeza do triunfo de Cristo."
        },
        {
          title: "Uso do Grego na Exegese",
          content: `O grego koiné era a língua comum do primeiro século. Diferente do grego clássico de Platão, era o grego do povo, mercados e cartas. É a língua do NT e da Septuaginta.

Mesmo sem fluência, ferramentas modernas dão acesso ao texto grego. Léxicos (BDAG, Thayer), concordâncias, análises gramaticais estão disponíveis. Softwares como Logos, Blue Letter Bible e outros facilitam o estudo.

Tempo verbal grego enfatiza aspecto mais que tempo. O aoristo indica ação completa; presente, ação contínua; perfeito, ação completada com resultados presentes. "Arrependei-vos" (aoristo) - decisão inicial; "segui-me" (presente) - compromisso contínuo.

Cuidado com 'estudos de palavras' superficiais. Significado depende do contexto, não de etimologia. A falácia etimológica assume que a raiz de uma palavra determina seu significado. Mas 'dinamite' não explica 'dynamis' (poder) em Paulo - anacronismo. Deixe o contexto definir significado.`,
          references: "2 Timóteo 2:15; Atos 17:11; 1 Coríntios 2:13; 2 Pedro 3:15-16; Mateus 4:17",
          questions: [
            "1. O que é grego koiné?",
            "2. Que ferramentas ajudam no estudo do grego?",
            "3. O que os tempos verbais gregos enfatizam?",
            "4. O que é falácia etimológica?",
            "5. Como o contexto define significado?"
          ],
          application: "Use uma ferramenta online para estudar uma palavra grega chave em um texto que você está estudando.",
          summary: "O grego koiné é acessível através de ferramentas modernas; tempos verbais enfatizam aspecto; evite falácia etimológica."
        },
        {
          title: "Citações do AT no NT",
          content: `O NT cita o AT extensamente - centenas de citações e alusões. Entender como os autores do NT usaram o AT ilumina sua teologia e metodologia. Nem sempre citam literalmente; às vezes parafraseiam ou combinam textos.

Os autores do NT viam Cristo como o cumprimento do AT. "Convinha que se cumprisse tudo o que de mim estava escrito na Lei de Moisés, e nos Profetas e nos Salmos" (Lucas 24:44). Eles liam o AT cristocentricamente - uma hermenêutica autorizada por Jesus.

Tipos de uso incluem: cumprimento direto (Mateus 1:22-23 citando Isaías 7:14); tipologia (1 Coríntios 5:7 - Cristo como Páscoa); analogia (1 Coríntios 10:1-11 - Israel como advertência); ilustração (Tiago 5:17-18 - Elias como exemplo de oração).

Os autores frequentemente citavam a Septuaginta (LXX), não o texto hebraico. Às vezes a LXX difere do texto massorético. Hebreus 10:5 cita Salmo 40:6 conforme a LXX ("corpo me preparaste") em vez do hebraico ("abriste-me os ouvidos"). Ambos são inspirados; o autor escolheu a versão que servia seu argumento.`,
          references: "Lucas 24:44-47; Mateus 1:22-23; 2:15; 1 Coríntios 5:7; 10:1-11; Hebreus 1:5-14; 10:5-7",
          questions: [
            "1. Com que frequência o NT cita o AT?",
            "2. Como os autores do NT viam o AT?",
            "3. Quais são os tipos de uso do AT no NT?",
            "4. O que é a Septuaginta?",
            "5. Por que os autores escolhiam versões diferentes?"
          ],
          application: "Estude Hebreus 1. Identifique as citações do AT e como o autor as usa para provar a superioridade de Cristo.",
          summary: "O NT cita o AT extensamente como cumprido em Cristo, usando vários métodos e frequentemente citando a Septuaginta."
        },
        {
          title: "Teologia Bíblica do NT",
          content: `Teologia bíblica traça temas através da narrativa da Escritura. O NT desenvolve e cumpre temas do AT: reino, aliança, templo, sacrifício. Reconhecer essas linhas teológicas enriquece a exegese de passagens individuais.

O tema do Reino de Deus é central em Jesus. "Arrependei-vos, porque está próximo o reino dos céus" (Mateus 4:17). O reino inaugurado mas não consumado - 'já, mas ainda não'. Essa tensão explica muito do ensino de Jesus e da experiência cristã.

A nova aliança prometida em Jeremias 31 é inaugurada na Última Ceia. "Este cálice é a nova aliança no meu sangue" (Lucas 22:20). Conceitos de aliança - promessas, condições, maldições, bênçãos - informam a soteriologia do NT.

O templo é redefinido. Jesus disse: "Destruí este templo, e em três dias o levantarei" (João 2:19) - Seu corpo. A igreja é templo (1 Coríntios 3:16); cristãos são templo (1 Coríntios 6:19). O acesso a Deus não requer edifício; temos em Cristo.`,
          references: "Mateus 4:17; Lucas 22:20; João 2:19-21; 1 Coríntios 3:16; 6:19; Efésios 2:19-22; Hebreus 8-10",
          questions: [
            "1. O que é teologia bíblica?",
            "2. O que significa 'já, mas ainda não'?",
            "3. Como a nova aliança se relaciona com Jeremias 31?",
            "4. Como Jesus redefiniu o templo?",
            "5. Como esses temas enriquecem a exegese?"
          ],
          application: "Trace o tema 'templo' do AT ao NT. Como ele se transforma e se cumpre?",
          summary: "Teologia bíblica traça temas (reino, aliança, templo) através da Escritura, mostrando como o NT cumpre promessas do AT."
        },
        {
          title: "Aplicando o Novo Testamento Hoje",
          content: `A aplicação fiel requer ponte do mundo antigo para o moderno. Primeiro entenda o que o texto significou para os leitores originais; depois pergunte como se aplica hoje. Não pule a primeira etapa.

Identifique o princípio transcultural. Instruções específicas podem ser culturais; princípios subjacentes são universais. "Mulheres cubram a cabeça" (1 Coríntios 11) - a cultura de Corinto dava significado específico a coberturas. O princípio pode ser: expressem apropriadamente respeito e distinção de gêneros.

Considere a situação análoga. Não enfrentamos exatamente os mesmos problemas que os coríntios. Mas enfrentamos questões análogas. Carne sacrificada a ídolos não é nossa questão; liberdade cristã e consciência fraca, sim. Aplique por analogia.

A aplicação deve ser específica e acionável. "Ame mais" é vago; "Perdoe a pessoa que você está ressentido" é específico. A Escritura transforma quando aplicada concretamente. Pergunte: o que Deus quer que eu faça em resposta a este texto?`,
          references: "2 Timóteo 3:16-17; Tiago 1:22-25; Romanos 12:1-2; 1 Coríntios 10:11; Hebreus 4:12",
          questions: [
            "1. Por que entender os leitores originais primeiro?",
            "2. Como identificar princípios transculturais?",
            "3. O que significa aplicar por analogia?",
            "4. Por que aplicação deve ser específica?",
            "5. Dê exemplo de aplicação vaga vs. específica."
          ],
          application: "Escolha uma passagem do NT. Identifique o significado original, o princípio transcultural e uma aplicação específica para você.",
          summary: "Aplicação fiel requer entender o significado original, identificar princípios transculturais e fazer aplicações específicas e acionáveis."
        }
      ])
    }
  ]
};

// MÓDULO 3: Teologia Bíblica Avançada
const MODULO_3_TEOLOGIA_BIBLICA: ModuleData = {
  id: "nivel3-mod3-teologia-biblica",
  name: "Teologia Bíblica Avançada",
  description: "Estudo da progressão da revelação através da história redentora",
  icon: "Layers",
  color: "#7C3AED",
  order: 33,
  tracks: [
    {
      id: "track-n3m3-avancado",
      level: "avancado",
      name: "A História da Redenção",
      description: "Traçando os temas bíblicos da criação à nova criação",
      requiredPlan: "premium",
      order: 1,
      lessons: createLessons("n3m3", [
        {
          title: "O Que é Teologia Bíblica",
          content: `Teologia bíblica é o estudo da progressão da revelação de Deus através da história. Diferente da teologia sistemática (que organiza doutrinas topicamente), a teologia bíblica segue a narrativa: como Deus revelou-se progressivamente de Gênesis a Apocalipse?

A Bíblia é uma história unificada com um herói: Jesus Cristo. Cada parte contribui para essa grande narrativa. "Examinais as Escrituras... e são elas que de mim testificam" (João 5:39). O AT aponta para Cristo; o NT revela-O; o todo é cristocêntrico.

A revelação é progressiva. Deus não disse tudo de uma vez. Abraão sabia menos que Davi; Davi menos que Isaías; Isaías menos que Paulo. "Havendo Deus outrora falado, muitas vezes e de muitas maneiras... nestes últimos dias nos falou pelo Filho" (Hebreus 1:1-2).

Teologia bíblica identifica temas que atravessam a narrativa: criação, queda, redenção, consumação; reino de Deus; aliança; templo e presença; terra prometida; povo de Deus. Esses temas desenvolvem-se, transformam-se e cumprem-se em Cristo.`,
          references: "João 5:39; Lucas 24:27, 44; Hebreus 1:1-2; Efésios 1:9-10; Colossenses 1:15-20",
          questions: [
            "1. O que diferencia teologia bíblica de sistemática?",
            "2. Quem é o herói da história bíblica?",
            "3. O que significa revelação progressiva?",
            "4. Quais são alguns temas que atravessam a Bíblia?",
            "5. Por que teologia bíblica é importante?"
          ],
          application: "Escolha um tema (ex: templo) e trace-o de Gênesis a Apocalipse brevemente.",
          summary: "Teologia bíblica estuda a progressão da revelação divina através da história, identificando temas que culminam em Cristo."
        },
        {
          title: "Criação: O Início da História",
          content: `A criação estabelece o fundamento de toda a teologia bíblica. "No princípio, criou Deus os céus e a terra" (Gênesis 1:1). Deus é Criador; tudo mais é criatura. Essa distinção fundamental governa toda a teologia: Deus é transcendente, soberano, auto-existente.

A criação era "muito boa" (Gênesis 1:31). O mundo material não é mau - Deus o fez e o aprovou. O dualismo (matéria má, espírito bom) é heresia, não cristianismo. A redenção não escapa da criação, mas a restaura.

O homem foi criado à imagem de Deus (imago Dei). "Façamos o homem à nossa imagem, conforme a nossa semelhança" (Gênesis 1:26). Isso significa representação e relacionamento. Somos vice-regentes de Deus, chamados a governar a criação sob Sua autoridade.

O mandato cultural ordena: "Enchei a terra, e sujeitai-a" (Gênesis 1:28). O trabalho é bom, não maldição. Cultura, arte, ciência, civilização - desenvolver a criação para a glória de Deus. A redenção não anula esse mandato; capacita seu cumprimento.`,
          references: "Gênesis 1-2; Salmo 8; 19:1-6; 104; Colossenses 1:16-17; João 1:1-3",
          questions: [
            "1. O que a criação estabelece teologicamente?",
            "2. A matéria é má?",
            "3. O que é imago Dei?",
            "4. O que é o mandato cultural?",
            "5. Como a redenção se relaciona com a criação?"
          ],
          application: "Como seu trabalho ou vocação cumpre o mandato cultural de desenvolver a criação para Deus?",
          summary: "A criação estabelece Deus como Criador soberano, a bondade do mundo material, a imagem de Deus no homem e o mandato cultural."
        },
        {
          title: "Queda: A Intrusão do Pecado",
          content: `A queda explica a condição atual do mundo. "Por um homem entrou o pecado no mundo, e pelo pecado a morte" (Romanos 5:12). O pecado não é original ao design; é intruso que corrompeu a boa criação. Sem entender a queda, não compreendemos a redenção.

As consequências foram abrangentes. Relacionamento com Deus - quebrado (separação). Relacionamento consigo mesmo - distorcido (vergonha). Relacionamento com outros - conflituoso (culpa transferida). Relacionamento com a criação - árduo (maldição do solo). Toda a realidade foi afetada.

A queda não frustrou os propósitos de Deus. O proto-evangelho em Gênesis 3:15 promete redenção: "Porei inimizade entre ti e a mulher, entre a tua descendência e o seu descendente. Este te ferirá a cabeça, e tu lhe ferirás o calcanhar." A serpente será derrotada pela semente da mulher - Cristo.

A história redentora é resposta à queda. Cada ato de Deus - chamado de Abraão, êxodo, aliança, profetas, encarnação, cruz, ressurreição - trabalha para reverter as consequências da queda e restaurar o que foi perdido. A nova criação superará o Éden.`,
          references: "Gênesis 3; Romanos 5:12-21; 8:18-25; 1 Coríntios 15:21-22; Apocalipse 21-22",
          questions: [
            "1. O que a queda explica?",
            "2. Quais relacionamentos foram afetados?",
            "3. O que é o proto-evangelho?",
            "4. A queda frustrou Deus?",
            "5. Como a nova criação se compara ao Éden?"
          ],
          application: "Identifique consequências da queda em sua vida. Como o evangelho as aborda?",
          summary: "A queda corrompeu todos os relacionamentos, mas não frustrou Deus; o proto-evangelho promete redenção que culmina em nova criação."
        },
        {
          title: "Aliança: Estrutura da Redenção",
          content: `Aliança é o modo pelo qual Deus se relaciona com Seu povo. Uma aliança bíblica inclui: partes (Deus e povo), promessas (o que Deus fará), condições (resposta esperada), sinais (marcadores visíveis), e consequências (bênçãos e maldições).

As alianças principais formam a espinha dorsal da história redentora. Aliança com Noé (preservação da criação); com Abraão (povo, terra, bênção); com Israel/Moisés (lei, presença, nação); com Davi (reino eterno); Nova Aliança (perdão, Espírito, transformação).

Cada aliança desenvolve e avança a promessa. Abraão recebeu promessa; Moisés, estrutura nacional; Davi, realeza; profetas, nova aliança. Não são substituições, mas desenvolvimentos. Cristo cumpre todas: descendente de Abraão, cumpridor da lei, filho de Davi, mediador da nova aliança.

A nova aliança é 'melhor' (Hebreus 7:22; 8:6). Perdão definitivo, não repetição de sacrifícios. Espírito internamente, não apenas lei externamente. Transformação do coração, não apenas regulação do comportamento. "Este é o cálice da nova aliança no meu sangue" (Lucas 22:20).`,
          references: "Gênesis 9; 12; 15; 17; Êxodo 19-24; 2 Samuel 7; Jeremias 31:31-34; Hebreus 8-10",
          questions: [
            "1. O que é aliança bíblica?",
            "2. Quais são as alianças principais?",
            "3. Como as alianças se relacionam entre si?",
            "4. O que torna a nova aliança 'melhor'?",
            "5. Como Cristo cumpre as alianças?"
          ],
          application: "Reflita sobre os benefícios da nova aliança em sua vida: perdão, Espírito, transformação.",
          summary: "Alianças estruturam a história redentora, cada uma desenvolvendo promessas até a nova aliança em Cristo que oferece perdão definitivo e transformação."
        },
        {
          title: "O Povo de Deus",
          content: `Deus sempre teve um povo. Desde Adão, através de Sete, Noé, Abraão, Israel, até a igreja - há continuidade do povo de Deus. "Vós sois a geração eleita, o sacerdócio real, a nação santa, o povo adquirido" (1 Pedro 2:9) - linguagem de Israel aplicada à igreja.

Israel foi escolhido não por mérito, mas por graça. "Não vos teve o SENHOR afeição, nem vos escolheu porque fôsseis mais numerosos... mas porque o SENHOR vos amava" (Deuteronômio 7:7-8). A eleição é graça soberana, não conquista humana.

Israel era 'luz para as nações' (Isaías 49:6). O propósito nunca foi exclusivista, mas missionário. Através de Israel, todas as famílias da terra seriam abençoadas (Gênesis 12:3). A vocação de Israel apontava para a missão universal.

A igreja é o povo da nova aliança, composta de judeus e gentios em Cristo. "Não há judeu nem grego... todos vós sois um em Cristo Jesus. E, se sois de Cristo, então sois descendência de Abraão" (Gálatas 3:28-29). A igreja cumpre o propósito universal de Israel.`,
          references: "Gênesis 12:1-3; Êxodo 19:5-6; Deuteronômio 7:6-8; Isaías 49:6; 1 Pedro 2:9-10; Gálatas 3:26-29",
          questions: [
            "1. Há continuidade no povo de Deus?",
            "2. Por que Israel foi escolhido?",
            "3. Qual era a vocação missionária de Israel?",
            "4. Quem compõe a igreja?",
            "5. Como a igreja cumpre o propósito de Israel?"
          ],
          application: "Como membro do povo de Deus, você é 'luz para as nações'. Como isso afeta sua missão?",
          summary: "O povo de Deus é contínuo de Israel à igreja, escolhido por graça para missão universal, cumprida em Cristo que une judeus e gentios."
        },
        {
          title: "O Reino de Deus",
          content: `O Reino de Deus é tema central das Escrituras. Significa o governo soberano de Deus sobre tudo. "Do SENHOR é o reino" (Salmo 22:28). Deus sempre reinou; a questão é: onde esse reino é reconhecido e manifestado?

No AT, Israel era o locus do reino. Deus era Rei de Israel (1 Samuel 8:7). Os reis humanos eram vice-regentes; quando falharam, profetas anunciaram um Rei messiânico vindouro. "Será grande... e o Senhor Deus lhe dará o trono de Davi" (Lucas 1:32).

Jesus proclamou: "O tempo está cumprido, e o reino de Deus está próximo" (Marcos 1:15). Em Jesus, o reino irrompeu na história. Seus milagres demonstravam poder do reino; Seus ensinos, valores do reino; Sua morte e ressurreição, vitória do reino.

O reino é 'já, mas ainda não'. Já inaugurado em Cristo; ainda não consumado até Sua volta. Vivemos na tensão entre os tempos. O reino está presente na igreja, mas aguarda plena manifestação. "Venha o teu reino" permanece nossa oração.`,
          references: "Salmo 22:28; 145:13; Marcos 1:14-15; Mateus 6:10; 12:28; Lucas 17:20-21; Apocalipse 11:15",
          questions: [
            "1. O que é o Reino de Deus?",
            "2. Como Israel se relacionava com o reino?",
            "3. O que Jesus proclamou sobre o reino?",
            "4. O que significa 'já, mas ainda não'?",
            "5. Como vivemos na tensão entre os tempos?"
          ],
          application: "Onde você vê sinais do reino de Deus hoje? Como pode viver os valores do reino?",
          summary: "O Reino de Deus é Seu governo soberano, inaugurado em Jesus mas ainda não consumado, criando tensão 'já, mas ainda não'."
        },
        {
          title: "Templo e Presença de Deus",
          content: `O templo representa a presença de Deus com Seu povo. No Éden, Deus andava com Adão (Gênesis 3:8). Após a queda, a presença foi mediada: tabernáculo no deserto, templo em Jerusalém. A arca simbolizava o trono de Deus entre querubins.

O templo era microcosmo da criação. Santo dos Santos representava o céu; lugar santo, o lugar celestial; átrio, a terra. A estrutura inteira apontava para acesso a Deus - acesso que o pecado bloqueou e que sacerdotes mediavam imperfeitamente.

Jesus é o verdadeiro templo. "Destruí este templo, e em três dias o levantarei... falava do templo do seu corpo" (João 2:19-21). Nele, Deus habitou plenamente entre nós. "O Verbo se fez carne e habitou (lit. 'tabernaculou') entre nós" (João 1:14).

A igreja é templo do Espírito. "Não sabeis que sois o templo de Deus e que o Espírito de Deus habita em vós?" (1 Coríntios 3:16). Cada cristão e a comunidade são morada de Deus. Na nova criação, não há templo porque "o Senhor Deus Todo-Poderoso e o Cordeiro são o seu templo" (Apocalipse 21:22).`,
          references: "Êxodo 25:8-9; 40:34-35; 1 Reis 8:10-13; João 1:14; 2:19-21; 1 Coríntios 3:16; 6:19; Apocalipse 21:22",
          questions: [
            "1. O que o templo representava?",
            "2. Como o templo era microcosmo da criação?",
            "3. Como Jesus é o verdadeiro templo?",
            "4. Como a igreja é templo?",
            "5. Por que não há templo na nova criação?"
          ],
          application: "Você é templo do Espírito Santo. Como isso afeta como você trata seu corpo e vida?",
          summary: "O templo representa a presença de Deus, cumprido em Jesus, estendido à igreja, e consumado na nova criação onde Deus habita plenamente."
        },
        {
          title: "Terra Prometida",
          content: `A terra prometida é tema importante. Deus prometeu a Abraão: "Toda esta terra que vês, eu ta darei" (Gênesis 13:15). A promessa foi parcialmente cumprida na conquista sob Josué, mas nunca plenamente - sempre havia inimigos, exílio pendente.

A terra era lugar de bênção e presença. Fluía leite e mel; Deus habitava em Sião. Mas também era condicional - desobediência resultou em exílio. "A terra vomitará também a vós" (Levítico 18:28). Israel perdeu a terra porque quebrou a aliança.

Os profetas prometeram restauração - não apenas retorno do exílio, mas nova criação. "Eis que eu crio novos céus e nova terra" (Isaías 65:17). A terra prometida expandiu-se para esperança cósmica. O particular (Canaã) apontava para o universal (nova criação).

No NT, a herança é redefinida. "Bem-aventurados os mansos, porque eles herdarão a terra" (Mateus 5:5). A promessa abraâmica inclui "o mundo" (Romanos 4:13). O destino final não é céu incorpóreo, mas nova terra - criação renovada onde habitaremos eternamente.`,
          references: "Gênesis 12:7; 13:15; Josué 21:43-45; Isaías 65:17-25; Romanos 4:13; Hebreus 11:16; Apocalipse 21:1-4",
          questions: [
            "1. O que Deus prometeu a Abraão?",
            "2. A promessa foi plenamente cumprida em Josué?",
            "3. O que causou o exílio?",
            "4. Como os profetas expandiram a promessa?",
            "5. Qual é o destino final do povo de Deus?"
          ],
          application: "Sua esperança final é escapar da terra ou habitação na nova terra renovada? Como isso afeta como você vive agora?",
          summary: "A terra prometida a Abraão aponta para a nova criação, onde o povo de Deus habitará em criação renovada eternamente."
        },
        {
          title: "Cristo: Centro da História",
          content: `Jesus Cristo é o centro para o qual todo o AT aponta e do qual todo o NT flui. "Examinais as Escrituras... e são elas que de mim testificam" (João 5:39). Ele é o cumprimento de promessas, tipos, profecias e expectativas.

Cristo é o último Adão que reverteu a queda. "Assim como em Adão todos morrem, assim em Cristo todos serão vivificados" (1 Coríntios 15:22). Onde Adão falhou, Cristo venceu. Ele restaura a imagem de Deus, o domínio sobre a criação, o relacionamento com o Pai.

Cristo cumpre as alianças. Descendente de Abraão que abençoa nações (Gálatas 3:16). Cumpridor da lei mosaica (Mateus 5:17). Filho de Davi que reina para sempre (Lucas 1:32-33). Mediador da nova aliança (Hebreus 9:15).

Cristo inaugura o reino, é o templo verdadeiro, conquista a terra (nova criação), e forma Seu povo. Cada tema bíblico converge nEle. Ler a Bíblia sem ver Cristo é perder o centro; Ele é a chave hermenêutica que abre toda a Escritura.`,
          references: "João 5:39; Lucas 24:27, 44-47; Gálatas 3:16; Hebreus 1:1-3; Colossenses 1:15-20; 2:17",
          questions: [
            "1. Como o AT e NT se relacionam com Cristo?",
            "2. Como Cristo é o último Adão?",
            "3. Como Cristo cumpre as alianças?",
            "4. Que temas bíblicos convergem em Cristo?",
            "5. O que acontece se lemos a Bíblia sem ver Cristo?"
          ],
          application: "Ao estudar qualquer passagem, pergunte: como isso aponta para ou se relaciona com Cristo?",
          summary: "Cristo é o centro da história redentora, cumprindo todas as promessas, tipos e temas do AT, sendo a chave para toda interpretação."
        },
        {
          title: "Nova Criação: O Fim da História",
          content: `A história redentora culmina na nova criação. "Vi novo céu e nova terra" (Apocalipse 21:1). Não é destruição da criação, mas sua renovação e glorificação. O destino final é físico e material - corpos ressurretos em terra renovada.

A nova criação restaura e supera o Éden. Árvore da vida reaparece (Apocalipse 22:2). A presença de Deus é plena - "Eis o tabernáculo de Deus com os homens" (Apocalipse 21:3). Não mais templo mediado; acesso direto. Não mais maldição, morte, dor, lágrimas.

A consumação completa a redenção. O que Cristo conquistou na cruz é plenamente aplicado. O 'ainda não' torna-se 'agora'. O reino consumado. A igreja glorificada. O cosmos restaurado. Todas as coisas sob os pés de Cristo.

Vivemos entre os tempos - inauguração e consumação. Essa tensão escatológica molda a vida cristã. Somos já cidadãos do céu, mas ainda peregrinos na terra. Já regenerados, mas ainda lutando com pecado. A esperança da nova criação sustenta nossa perseverança.`,
          references: "Apocalipse 21-22; Romanos 8:18-25; 2 Pedro 3:13; Isaías 65:17-25; 1 Coríntios 15:24-28",
          questions: [
            "1. O que é nova criação?",
            "2. A nova criação restaura ou destrói a criação original?",
            "3. Como nova criação supera o Éden?",
            "4. O que significa 'entre os tempos'?",
            "5. Como a esperança escatológica sustenta você?"
          ],
          application: "A esperança da nova criação afeta como você vive hoje? Como essa visão molda suas prioridades?",
          summary: "A história redentora culmina na nova criação onde Deus habita plenamente com Seu povo em cosmos renovado, superando o Éden."
        }
      ])
    }
  ]
};

// MÓDULO 4: Teologia Sistemática
const MODULO_4_TEOLOGIA_SISTEMATICA: ModuleData = {
  id: "nivel3-mod4-teologia-sistematica",
  name: "Teologia Sistemática",
  description: "Organização das doutrinas bíblicas em sistema coerente",
  icon: "Grid3X3",
  color: "#0891B2",
  order: 34,
  tracks: [
    {
      id: "track-n3m4-avancado",
      level: "avancado",
      name: "Doutrinas Fundamentais",
      description: "Estudo sistemático das principais doutrinas cristãs",
      requiredPlan: "premium",
      order: 1,
      lessons: createLessons("n3m4", [
        {
          title: "O Que é Teologia Sistemática",
          content: `Teologia sistemática organiza os ensinos da Bíblia em categorias lógicas. Pergunta: o que a Bíblia inteira ensina sobre Deus? Sobre Cristo? Sobre salvação? Reúne textos de toda a Escritura para formar doutrina coerente.

Diferente da teologia bíblica (que segue a narrativa), a sistemática agrupa topicamente. Não é superior nem inferior; são abordagens complementares. Bíblica pergunta: como a doutrina se desenvolveu? Sistemática pergunta: qual é o ensino completo?

A teologia sistemática é inevitável. Todos têm algum sistema de crenças, consciente ou não. A questão é: seu sistema é bíblico, coerente e balanceado? Estudar sistematicamente ajuda a identificar lacunas, corrigir erros e articular a fé com clareza.

As categorias tradicionais incluem: Teologia Própria (doutrina de Deus), Bibliologia (Escritura), Cristologia (Cristo), Pneumatologia (Espírito Santo), Antropologia (humanidade), Hamartiologia (pecado), Soteriologia (salvação), Eclesiologia (igreja), Escatologia (últimas coisas).`,
          references: "2 Timóteo 3:16-17; Atos 20:27; Tito 2:1; Hebreus 6:1-2; 1 Pedro 3:15; Judas 3",
          questions: [
            "1. O que é teologia sistemática?",
            "2. Como difere de teologia bíblica?",
            "3. Por que teologia sistemática é inevitável?",
            "4. Quais são as categorias tradicionais?",
            "5. Por que estudar sistematicamente?"
          ],
          application: "Identifique uma área doutrinária onde você tem dúvidas. Comprometa-se a estudá-la sistematicamente.",
          summary: "Teologia sistemática organiza os ensinos bíblicos topicamente em categorias coerentes, complementando a teologia bíblica narrativa."
        },
        {
          title: "A Doutrina de Deus: Atributos Incomunicáveis",
          content: `Os atributos de Deus são tradicionalmente divididos em incomunicáveis (únicos de Deus) e comunicáveis (compartilhados em grau com criaturas). Os incomunicáveis enfatizam a transcendência divina.

Auto-existência (aseidade): Deus existe por Si mesmo, não dependendo de nada. "Eu Sou o que Sou" (Êxodo 3:14). Tudo mais existe porque Deus existe; Deus existe porque é Deus. Ele é a fonte de todo ser.

Eternidade: Deus existe fora do tempo que Ele criou. "Antes que os montes nascessem... de eternidade a eternidade, tu és Deus" (Salmo 90:2). Não teve começo, não terá fim. O tempo é criação; Deus é eterno.

Imutabilidade: "Eu, o SENHOR, não mudo" (Malaquias 3:6). Deus não melhora (já é perfeito) nem piora (não pode decair). Seu caráter, propósitos e promessas são firmes. Isso não significa que não age; significa que age consistentemente com Seu caráter imutável.

Onipresença, onisciência, onipotência: Deus está em todo lugar, sabe tudo, pode tudo. "Para onde me irei do teu Espírito?" (Salmo 139:7). Nenhuma limitação de espaço, conhecimento ou poder.`,
          references: "Êxodo 3:14; Salmo 90:2; 139:1-16; Malaquias 3:6; Isaías 40:28; 46:10; Jó 42:2",
          questions: [
            "1. O que são atributos incomunicáveis?",
            "2. O que é auto-existência divina?",
            "3. O que significa Deus ser eterno?",
            "4. Imutabilidade significa que Deus não age?",
            "5. Como esses atributos afetam sua adoração?"
          ],
          application: "Medite na eternidade de Deus. Como isso afeta suas preocupações temporais?",
          summary: "Os atributos incomunicáveis de Deus (auto-existência, eternidade, imutabilidade, onipresença) O distinguem absolutamente de toda criatura."
        },
        {
          title: "A Doutrina de Deus: Atributos Comunicáveis",
          content: `Os atributos comunicáveis são aqueles que Deus compartilha, em grau limitado, com Suas criaturas. Eles enfatizam a imanência de Deus - Ele se relaciona conosco.

Amor: "Deus é amor" (1 João 4:8). Não apenas que Deus ama, mas que amor define Seu ser. A Trindade é comunidade eterna de amor. O amor de Deus é não-merecido (graça), para indignos (misericórdia), eterno (fidelidade).

Santidade: "Santo, santo, santo é o SENHOR" (Isaías 6:3). Santidade é separação do pecado e dedicação à pureza. Deus é absolutamente puro; nada contaminado pode estar em Sua presença. A santidade gera reverência e temor.

Justiça: Deus julga corretamente. "O Juiz de toda a terra não fará justiça?" (Gênesis 18:25). Ele recompensa o bem e pune o mal. A justiça de Deus exigiu a cruz - o pecado precisava ser pago. A cruz satisfez tanto amor quanto justiça.

Sabedoria, verdade, bondade, graça: Deus sabe a melhor forma de alcançar os melhores fins. Ele é verdade absoluta; não pode mentir. É genuinamente bom; deseja nosso bem. Sua graça dá o que não merecemos.`,
          references: "1 João 4:8; Isaías 6:3; Gênesis 18:25; Salmo 145:8-9, 17; Tiago 1:17; João 14:6",
          questions: [
            "1. O que são atributos comunicáveis?",
            "2. O que significa 'Deus é amor'?",
            "3. Por que santidade gera reverência?",
            "4. Como a cruz demonstra justiça e amor?",
            "5. Qual atributo comunicável você mais precisa refletir?"
          ],
          application: "Escolha um atributo comunicável e reflita: como posso refleti-lo melhor esta semana?",
          summary: "Os atributos comunicáveis de Deus (amor, santidade, justiça, sabedoria) são refletidos limitadamente em criaturas e revelam Sua imanência."
        },
        {
          title: "A Doutrina da Trindade",
          content: `A Trindade é a doutrina de que Deus é um ser em três Pessoas. Não três deuses (triteísmo) nem um Deus com três máscaras (modalismo). Um Deus, três Pessoas distintas - Pai, Filho e Espírito Santo - coeternas, coiguais, coessenciais.

A Bíblia afirma monoteísmo. "Ouve, Israel, o SENHOR nosso Deus é o único SENHOR" (Deuteronômio 6:4). Há um só Deus. Mas também atribui divindade ao Pai, ao Filho ("Meu Senhor e meu Deus" - João 20:28) e ao Espírito ("Mentiste ao Espírito Santo... não mentiste aos homens, mas a Deus" - Atos 5:3-4).

As Pessoas são distintas, não idênticas. O Pai envia o Filho; o Filho não envia o Pai. O Espírito procede; o Pai não procede. Há ordem na Trindade sem hierarquia de essência. Igual em natureza, distinto em função.

A Trindade é fundamento de muitas doutrinas. Amor eterno (não precisou criar para amar - havia comunhão intra-trinitária). Comunicação (o Verbo existia eternamente). Redenção (o Pai envia, o Filho morre, o Espírito aplica). Unidade e diversidade na igreja refletem a Trindade.`,
          references: "Deuteronômio 6:4; Mateus 28:19; João 1:1-3; 20:28; Atos 5:3-4; 2 Coríntios 13:14",
          questions: [
            "1. O que a Trindade afirma?",
            "2. Qual a diferença entre triteísmo e modalismo?",
            "3. Como a Bíblia atribui divindade às três Pessoas?",
            "4. As Pessoas são idênticas ou distintas?",
            "5. Por que a Trindade é importante para outras doutrinas?"
          ],
          application: "Ore conscientemente a cada Pessoa da Trindade esta semana: Pai como Criador, Filho como Redentor, Espírito como Santificador.",
          summary: "A Trindade afirma um Deus em três Pessoas distintas - Pai, Filho e Espírito - coeternas e coiguais, fundamento de múltiplas doutrinas."
        },
        {
          title: "Cristologia: A Pessoa de Cristo",
          content: `Cristologia estuda a Pessoa e obra de Cristo. Quem Jesus é? Ele é plenamente Deus e plenamente homem - uma Pessoa com duas naturezas (união hipostática).

A divindade de Cristo é afirmada claramente. "No princípio era o Verbo, e o Verbo estava com Deus, e o Verbo era Deus" (João 1:1). Ele recebe adoração (Mateus 28:17), perdoa pecados (Marcos 2:5-7), é chamado "Deus" (Tito 2:13). Os atributos divinos são Seus.

A humanidade de Cristo é igualmente importante. "O Verbo se fez carne" (João 1:14). Ele nasceu, cresceu, teve fome, sede, cansaço, chorou, morreu. Sua humanidade é real, não aparência. Sem humanidade genuína, não poderia morrer por nós.

As duas naturezas estão unidas em uma Pessoa sem confusão, sem mudança, sem divisão, sem separação (Calcedônia, 451 d.C.). Jesus não é às vezes Deus e às vezes homem; é sempre ambos. Não é mistura; as naturezas permanecem distintas mas inseparáveis.`,
          references: "João 1:1, 14; Filipenses 2:5-11; Colossenses 2:9; Hebreus 2:14-18; 4:15; 1 Timóteo 2:5",
          questions: [
            "1. O que é união hipostática?",
            "2. Como a Bíblia afirma a divindade de Cristo?",
            "3. Por que a humanidade de Cristo é necessária?",
            "4. O que Calcedônia definiu?",
            "5. Por que Jesus ser Deus-homem importa para salvação?"
          ],
          application: "Reflita sobre como a humanidade de Cristo o torna 'sumo sacerdote que pode se compadecer' (Hebreus 4:15).",
          summary: "Cristo é uma Pessoa com duas naturezas - plenamente Deus e plenamente homem - unidas sem confusão, essencial para a redenção."
        },
        {
          title: "Cristologia: A Obra de Cristo",
          content: `A obra de Cristo inclui Seus ofícios como Profeta, Sacerdote e Rei. Como Profeta, revela Deus e proclama verdade. Como Sacerdote, oferece sacrifício e intercede. Como Rei, governa Seu povo e vencerá todos os inimigos.

A expiação é o coração de Sua obra sacerdotal. "Cristo morreu por nossos pecados, segundo as Escrituras" (1 Coríntios 15:3). Sua morte foi substitutiva - Ele morreu em nosso lugar, pagando a penalidade que merecíamos. Propiciação satisfez a ira de Deus; expiação removeu o pecado.

A ressurreição vindicou Sua obra. "Ressuscitou para nossa justificação" (Romanos 4:25). Se não ressuscitasse, a morte teria vencido; o pecado não estaria pago. A ressurreição prova que o sacrifício foi aceito, a morte vencida, a vida garantida.

A ascensão e sessão à direita significam autoridade e intercessão contínua. "Está à direita de Deus e também intercede por nós" (Romanos 8:34). Cristo reina agora e voltará para consumar o reino.`,
          references: "1 Coríntios 15:3-4; Romanos 4:25; 8:34; Hebreus 7:25; 9:11-14; Filipenses 2:9-11",
          questions: [
            "1. Quais são os três ofícios de Cristo?",
            "2. O que é expiação substitutiva?",
            "3. O que a ressurreição prova?",
            "4. O que Cristo faz agora à direita do Pai?",
            "5. Como Sua obra afeta sua vida diária?"
          ],
          application: "Agradeça especificamente por cada aspecto da obra de Cristo: profecia, sacerdócio, reinado.",
          summary: "A obra de Cristo inclui Seus ofícios profético, sacerdotal e real, culminando na expiação substitutiva, ressurreição e intercessão contínua."
        },
        {
          title: "Pneumatologia: A Pessoa do Espírito Santo",
          content: `Pneumatologia é a doutrina do Espírito Santo. Ele é a terceira Pessoa da Trindade - não força impessoal, mas Pessoa divina. Tem atributos pessoais: ensina (João 14:26), guia (Romanos 8:14), pode ser entristecido (Efésios 4:30).

A divindade do Espírito é clara. "Mentiste ao Espírito Santo... não mentiste aos homens, mas a Deus" (Atos 5:3-4). Ele possui atributos divinos: eternidade, onipresença, onisciência. Ele é 'Senhor' (2 Coríntios 3:17).

O Espírito procede do Pai e do Filho (filioque - tradição ocidental). "O Consolador, o Espírito Santo, a quem o Pai enviará em meu nome" (João 14:26). "Se eu for, vo-lo enviarei" (João 16:7). Pai e Filho enviam o Espírito.

No AT, o Espírito vinha sobre indivíduos para tarefas específicas (juízes, profetas, reis). No NT, após Pentecostes, habita permanentemente em cada crente. "Não sabeis que o vosso corpo é o templo do Espírito Santo?" (1 Coríntios 6:19).`,
          references: "João 14:16-17, 26; 16:7-15; Atos 5:3-4; 1 Coríntios 6:19; 2 Coríntios 3:17; Efésios 4:30",
          questions: [
            "1. O Espírito Santo é Pessoa ou força?",
            "2. Como a divindade do Espírito é demonstrada?",
            "3. O que significa o Espírito 'proceder'?",
            "4. Como a obra do Espírito difere no AT e NT?",
            "5. O que significa ser templo do Espírito?"
          ],
          application: "Reconheça que o Espírito habita em você. Como isso afeta suas escolhas diárias?",
          summary: "O Espírito Santo é a terceira Pessoa da Trindade, plenamente Deus, que agora habita permanentemente em cada crente como templo."
        },
        {
          title: "Pneumatologia: A Obra do Espírito Santo",
          content: `A obra do Espírito é vasta. Na criação, "o Espírito de Deus pairava sobre as águas" (Gênesis 1:2). Na inspiração, "homens santos de Deus falaram inspirados pelo Espírito Santo" (2 Pedro 1:21). Ele atua da criação à consumação.

Na salvação, o Espírito convence, regenera e habita. "Convencerá o mundo do pecado, da justiça e do juízo" (João 16:8). Sem Ele, ninguém percebe seu pecado ou necessidade de Cristo. Ele dá vida nova: "nascido do Espírito" (João 3:6).

Na santificação, o Espírito transforma progressivamente. "Todos nós... somos transformados de glória em glória, pela ação do Senhor, o Espírito" (2 Coríntios 3:18). Ele produz fruto: "amor, alegria, paz..." (Gálatas 5:22-23). A santificação é cooperação com o Espírito.

O Espírito capacita para serviço através de dons. "A cada um, porém, é dada a manifestação do Espírito para o que for útil" (1 Coríntios 12:7). Os dons edificam a igreja. São diversos, complementares, e todos são necessários para o corpo funcionar.`,
          references: "Gênesis 1:2; João 3:5-8; 16:8-11; Romanos 8:1-17; Gálatas 5:16-25; 1 Coríntios 12:4-11",
          questions: [
            "1. Onde o Espírito atuou na criação?",
            "2. Qual o papel do Espírito na salvação?",
            "3. Como o Espírito santifica?",
            "4. Para que servem os dons espirituais?",
            "5. Você está cooperando com o Espírito na santificação?"
          ],
          application: "Identifique áreas onde precisa mais do fruto do Espírito. Ore especificamente por crescimento.",
          summary: "O Espírito Santo atua na criação, inspiração, convicção, regeneração, santificação progressiva e capacitação através de dons."
        },
        {
          title: "Soteriologia: A Ordem da Salvação",
          content: `A 'ordem da salvação' (ordo salutis) descreve os passos lógicos (não necessariamente temporais) da salvação. Diferentes tradições organizam diferentemente, mas os elementos principais são reconhecidos.

Eleição: Deus escolheu alguns para salvação antes da fundação do mundo. "Nos escolheu nele antes da fundação do mundo" (Efésios 1:4). A iniciativa é de Deus, não do homem.

Chamado/Regeneração/Conversão: Deus chama eficazmente, dá vida nova (regeneração), e o pecador responde com arrependimento e fé (conversão). A fé não precede regeneração; segue dela. "Todo o que o Pai me dá virá a mim" (João 6:37).

Justificação: Deus declara o pecador justo com base na obra de Cristo. É ato judicial, não processo. "Justificados, pois, mediante a fé, temos paz com Deus" (Romanos 5:1). A justiça de Cristo é imputada.

Santificação: Crescimento progressivo em semelhança a Cristo. "Vos transformando de glória em glória" (2 Coríntios 3:18). Continua a vida toda.

Glorificação: Consumação final quando receberemos corpos glorificados e seremos completamente livres do pecado. "Seremos semelhantes a ele" (1 João 3:2).`,
          references: "Romanos 8:28-30; Efésios 1:3-14; João 6:37-44; Romanos 5:1; 2 Coríntios 3:18; 1 João 3:2",
          questions: [
            "1. O que é a 'ordem da salvação'?",
            "2. O que é eleição?",
            "3. Regeneração precede ou segue a fé?",
            "4. O que é justificação?",
            "5. O que é glorificação?"
          ],
          application: "Onde você está na jornada? Justificado (sim, se crê). Santificado (em processo). Glorificado (aguardando). Viva conforme.",
          summary: "A ordem da salvação inclui eleição, chamado, regeneração, conversão, justificação, santificação e glorificação - de Deus por Deus."
        },
        {
          title: "Eclesiologia e Escatologia",
          content: `Eclesiologia estuda a igreja. A igreja é o corpo de Cristo (1 Coríntios 12:27), noiva de Cristo (Efésios 5:25-27), templo do Espírito (1 Coríntios 3:16). É local (congregação em Corinto) e universal (todos os crentes de todos os tempos).

As marcas da verdadeira igreja incluem: pregação fiel da Palavra, administração correta dos sacramentos (batismo e Ceia), e disciplina amorosa. Onde essas estão presentes, há igreja verdadeira; onde faltam, a identidade é questionável.

Escatologia estuda as 'últimas coisas'. Inclui: retorno de Cristo, ressurreição, juízo final, destino eterno (céu/inferno), e nova criação. Há diferentes perspectivas sobre detalhes (pré/pós/amilenismo, pre/pos/mid-tribulação), mas os essenciais são consenso.

Os essenciais escatológicos incluem: Cristo voltará pessoal e visivelmente; haverá ressurreição corporal de justos e injustos; haverá juízo final; o destino é eterno e definitivo; Deus renovará a criação. "Eis que faço novas todas as coisas" (Apocalipse 21:5).`,
          references: "1 Coríntios 3:16; 12:27; Efésios 5:25-27; Mateus 28:18-20; 1 Tessalonicenses 4:13-18; Apocalipse 20-22",
          questions: [
            "1. O que é a igreja?",
            "2. Quais são as marcas da verdadeira igreja?",
            "3. O que escatologia estuda?",
            "4. Quais são os essenciais escatológicos consensuais?",
            "5. Como escatologia afeta como você vive?"
          ],
          application: "Avalie sua igreja pelas marcas: Palavra fiel? Sacramentos corretos? Disciplina amorosa?",
          summary: "A igreja é corpo, noiva e templo de Cristo com marcas identificáveis; a escatologia afirma retorno de Cristo, ressurreição e nova criação."
        }
      ])
    }
  ]
};

// MÓDULO 5: História da Igreja
const MODULO_5_HISTORIA_IGREJA: ModuleData = {
  id: "nivel3-mod5-historia-igreja",
  name: "História da Igreja",
  description: "Panorama histórico da igreja de Pentecostes até hoje",
  icon: "Clock",
  color: "#F59E0B",
  order: 35,
  tracks: [
    {
      id: "track-n3m5-avancado",
      level: "avancado",
      name: "2000 Anos de Cristianismo",
      description: "Aprendendo com a história da fé",
      requiredPlan: "premium",
      order: 1,
      lessons: createLessons("n3m5", [
        {
          title: "Por Que Estudar História da Igreja",
          content: `A história da igreja não é opcional para cristãos sérios. "Lembrai-vos dos vossos guias que vos falaram a palavra de Deus; considerando o fim de sua carreira, imitai a fé" (Hebreus 13:7). Somos parte de uma longa história de fiéis.

Estudar história protege contra arrogância cronológica - a suposição de que somos mais sábios que nossos antepassados. Os primeiros cristãos enfrentaram as mesmas heresias que enfrentamos. Suas respostas são sabedoria acumulada.

A história mostra como Deus preservou Sua igreja. "As portas do inferno não prevalecerão" (Mateus 16:18). Perseguição, heresias, cismas, escândalos - a igreja sobreviveu a tudo porque Cristo a mantém. Isso gera esperança para nossos desafios.

A história nos chama à humildade. Nossas tradições têm história; não surgiram do nada. Entender origens ajuda a discernir o essencial do secundário. O que recebemos veio de outros; passaremos adiante.`,
          references: "Hebreus 11:1-40; 12:1; 13:7; Mateus 16:18; 1 Coríntios 11:2; 2 Tessalonicenses 2:15",
          questions: [
            "1. Por que história da igreja importa?",
            "2. O que é arrogância cronológica?",
            "3. Como a história gera esperança?",
            "4. Como a história gera humildade?",
            "5. O que você espera aprender?"
          ],
          application: "Identifique uma tradição de sua igreja. Pesquise sua origem histórica.",
          summary: "Estudar história da igreja protege de arrogância, mostra a fidelidade de Deus em preservar a igreja, e ensina humildade sobre nossas tradições."
        },
        {
          title: "Igreja Apostólica (30-100 d.C.)",
          content: `A era apostólica cobre o período dos apóstolos, de Pentecostes até a morte de João. O Espírito Santo foi derramado (Atos 2), a igreja nasceu em Jerusalém e rapidamente se espalhou pelo Império Romano.

A missão foi explosiva. De Jerusalém a Judeia, Samaria e confins da terra (Atos 1:8). Paulo plantou igrejas em todo o Mediterrâneo em apenas 25 anos. A mensagem atravessou barreiras culturais - judeus e gentios unidos em Cristo.

A estrutura era simples. Apóstolos supervisionavam; anciãos (presbíteros) e diáconos serviam localmente. Os crentes reuniam-se em casas, partiam o pão, oravam, perseveravam na doutrina dos apóstolos (Atos 2:42).

Desafios surgiram cedo. Perseguição (Estevão martirizado em Atos 7). Heresia (judaizantes em Gálatas). Divisão (facções em Corinto). Os problemas de hoje têm precedentes antigos. O NT foi escrito para enfrentar esses desafios.`,
          references: "Atos 1-28; Gálatas 1-6; 1 Coríntios 1:10-17; Apocalipse 2-3; 1 João 2:18-19",
          questions: [
            "1. Que período a era apostólica cobre?",
            "2. Como a missão se expandiu?",
            "3. Como era a estrutura da igreja primitiva?",
            "4. Que desafios surgiu cedo?",
            "5. Como o NT respondeu aos desafios?"
          ],
          application: "Compare sua igreja com Atos 2:42-47. O que sua igreja pode aprender da igreja primitiva?",
          summary: "A era apostólica viu nascimento em Pentecostes, expansão missionária explosiva, estrutura simples, e desafios de perseguição e heresia."
        },
        {
          title: "Pais Apostólicos e Perseguição (100-313 d.C.)",
          content: `Os Pais Apostólicos foram líderes que conheceram os apóstolos ou seus discípulos. Clemente de Roma, Inácio de Antioquia, Policarpo de Esmirna - seus escritos nos dão janela para a igreja do segundo século.

A perseguição era realidade constante. Nero (64 d.C.) culpou cristãos pelo incêndio de Roma. Domiciano, Trajano, Décio, Diocleciano - cada imperador tinha sua política. Milhares morreram como mártires. "Sangue dos mártires é semente da igreja" (Tertuliano).

Os cristãos enfrentavam acusações: ateísmo (não adoravam deuses romanos), canibalismo (interpretação distorcida da Ceia), incesto (chamavam-se 'irmãos'). Apologistas como Justino Mártir responderam às acusações.

Heresias exigiram definição doutrinária. Gnosticismo, marcionismo, montanismo - cada erro forçou a igreja a articular ortodoxia. Irineu, Tertuliano, Orígenes defenderam a fé. O cânon do NT foi gradualmente reconhecido, não inventado.`,
          references: "Apocalipse 2:10; Hebreus 11:35-38; 1 Pedro 4:12-16; Filipenses 1:29; Atos 5:41",
          questions: [
            "1. Quem foram os Pais Apostólicos?",
            "2. Por que cristãos eram perseguidos?",
            "3. Que acusações enfrentavam?",
            "4. Como heresias ajudaram a definir ortodoxia?",
            "5. O que você aprenderia com os mártires?"
          ],
          application: "Leia sobre um mártir da igreja primitiva (ex: Policarpo). Que lições você aprende?",
          summary: "Os Pais Apostólicos conectaram a era apostólica; perseguição forjou mártires; heresias forçaram definição de ortodoxia e cânon."
        },
        {
          title: "Era Constantiniana (313-590 d.C.)",
          content: `Constantino legalizou o cristianismo em 313 (Édito de Milão). De religião perseguida a religião favorecida, depois oficial (Teodósio, 380). A mudança teve consequências vastas - boas e problemáticas.

Concílios definiram doutrina. Niceia (325) afirmou a divindade de Cristo contra o arianismo. Constantinopla (381) definiu a Trindade. Éfeso (431) e Calcedônia (451) trataram de Cristologia. Os credos que recitamos vêm dessa era.

Teólogos monumentais emergiram. Atanásio, defensor de Niceia. Os Capadócios (Basílio, Gregório de Nazianzo, Gregório de Nissa) desenvolveram teologia trinitária. Agostinho de Hipona influenciou todo o Ocidente com obras sobre graça, Trindade, e a cidade de Deus.

Problemas também surgiram. Igreja e Estado misturados criaram cristandade nominal. Paganismo infiltrou-se em práticas. Monasticismo cresceu como reação - busca por piedade autêntica fora da igreja comprometida. A queda de Roma (476) marcou transição.`,
          references: "Mateus 28:19; João 1:1-14; Colossenses 2:9; Hebreus 1:3; 1 Timóteo 3:16",
          questions: [
            "1. O que Constantino fez em 313?",
            "2. Que concílios foram importantes?",
            "3. Quem foi Agostinho?",
            "4. Que problemas a legalização trouxe?",
            "5. Por que estudar os credos antigos?"
          ],
          application: "Leia o Credo de Niceia. O que ele afirma? Por que era necessário?",
          summary: "A era constantiniana viu legalização, concílios doutrinários, grandes teólogos, mas também mistura problemática de igreja e Estado."
        },
        {
          title: "Idade Média (590-1517)",
          content: `A Idade Média é frequentemente mal compreendida. Não foi 'idade das trevas' sem mais. A igreja preservou conhecimento, desenvolveu educação (universidades), produziu arte e arquitetura impressionantes.

O papado cresceu em poder. Gregório I (590-604) é marco inicial. Reivindicações papais aumentaram até Inocêncio III (1198-1216), que afirmou autoridade suprema. A igreja era poder político e espiritual.

O monasticismo floresceu. Beneditinos, franciscanos, dominicanos preservaram a fé, copiaram manuscritos, serviram os pobres. Figuras como Bernardo de Claraval, Francisco de Assis, Tomás de Aquino são gigantes teológicos.

Problemas persistiam. Simonia (venda de cargos), clero corrupto, superstição popular, Inquisição. Movimentos pré-reformadores (Valdenses, Wycliffe, Hus) tentaram reforma antes de Lutero. A tensão entre o ideal evangélico e a realidade institucional crescia.`,
          references: "Mateus 23:1-12; 1 Pedro 5:1-4; Atos 20:28-31; Apocalipse 2:4-5; 3:15-17",
          questions: [
            "1. A Idade Média foi só 'trevas'?",
            "2. Como o papado se desenvolveu?",
            "3. Qual foi o papel do monasticismo?",
            "4. Que problemas existiam?",
            "5. Quem foram os pré-reformadores?"
          ],
          application: "Leia sobre um monge medieval (ex: Francisco). O que você admira e questiona?",
          summary: "A Idade Média preservou conhecimento e produziu teologia, mas também viu crescimento de poder papal e necessidade de reforma."
        },
        {
          title: "A Reforma Protestante (1517-1648)",
          content: `Martinho Lutero afixou suas 95 teses em 31 de outubro de 1517, protestando contra indulgências. A Reforma explodiu porque as condições estavam maduras: corrupção eclesiástica, nacionalismo crescente, imprensa de Gutenberg, humanismo bíblico.

Os reformadores compartilhavam convicções fundamentais: Sola Scriptura (autoridade da Escritura), Solus Christus (salvação só em Cristo), Sola Gratia (só pela graça), Sola Fide (só pela fé), Soli Deo Gloria (glória só a Deus).

Diferentes tradições emergiram. Lutero na Alemanha (luteranismo). Zuínglio e depois Calvino na Suíça (tradição reformada). Igreja da Inglaterra (anglicanismo). Anabatistas (precursores de batistas e menonitas). Diversidade na unidade essencial.

A Reforma teve custos. Guerras de religião devastaram a Europa. Divisões persistem até hoje. Mas a recuperação do evangelho, tradução da Bíblia para o vernáculo, educação do povo, e renovação espiritual transformaram o mundo.`,
          references: "Romanos 1:16-17; 3:21-28; Gálatas 2:16; Efésios 2:8-9; 2 Timóteo 3:16-17",
          questions: [
            "1. O que Lutero fez em 1517?",
            "2. Quais são os 'cinco solas'?",
            "3. Que tradições emergiram da Reforma?",
            "4. Quais foram os custos da Reforma?",
            "5. Qual foi o maior ganho?"
          ],
          application: "Reflita: você compreende e abraça os 'cinco solas'? Qual precisa de mais estudo?",
          summary: "A Reforma recuperou o evangelho através dos 'cinco solas', produziu tradições diversas, e transformou a igreja e sociedade europeias."
        },
        {
          title: "Avivamentos e Missões (1700-1900)",
          content: `Os séculos XVIII e XIX viram notáveis avivamentos. O Grande Despertar na América (Jonathan Edwards, George Whitefield). O avivamento metodista na Inglaterra (John Wesley). O Segundo Grande Despertar. Avivamentos transformaram sociedades.

As missões modernas explodiram. William Carey (1793) foi para a Índia. Hudson Taylor fundou a China Inland Mission. David Livingstone explorou a África. De movimento ocidental, o cristianismo tornou-se verdadeiramente global.

Movimentos de reforma social acompanharam avivamentos. Abolição da escravatura (Wilberforce), reforma prisional, educação para pobres, direitos trabalhistas - cristãos avivados não podiam ignorar injustiça. Piedade pessoal gerou ação social.

Desafios também emergiram. O liberalismo teológico questionou doutrinas tradicionais. A crítica histórica da Bíblia desafiou a ortodoxia. O modernismo ameaçou fundamentos. A igreja teve que responder com apologética renovada.`,
          references: "Atos 2:17-21; Joel 2:28-32; Habacuque 3:2; Isaías 6:8; Mateus 28:19-20",
          questions: [
            "1. O que foram os grandes avivamentos?",
            "2. Quem iniciou as missões modernas?",
            "3. Como avivamentos geraram reforma social?",
            "4. Que desafios surgiram?",
            "5. O que você pode aprender de missionários?"
          ],
          application: "Leia sobre um missionário do século XIX. Como sua dedicação desafia você?",
          summary: "Os séculos XVIII-XIX viram avivamentos, explosão missionária, reforma social, mas também desafios do liberalismo teológico."
        },
        {
          title: "O Século XX e Além",
          content: `O século XX foi tumultuado. Duas guerras mundiais abalaram otimismo. O comunismo perseguiu cristãos brutalmente. A secularização acelerou no Ocidente. Mas o cristianismo cresceu explosivamente no Sul Global.

O movimento pentecostal/carismático emergiu (Azusa Street, 1906) e tornou-se a corrente de maior crescimento. Ênfase na experiência do Espírito, dons espirituais, adoração vibrante. Desafios de excessos, mas inegável impacto global.

O movimento ecumênico buscou unidade. Concílio Mundial de Igrejas (1948). Vaticano II (1962-65) renovou o catolicismo. Alguns viram ganhos; outros alertaram para compromisso doutrinário. O debate continua.

O cristianismo global mudou de centro. A maioria dos cristãos agora está na África, Ásia e América Latina, não na Europa. A igreja sofre perseguição severa em muitos lugares, mas cresce. A história continua.`,
          references: "Mateus 24:14; Apocalipse 7:9-10; Atos 1:8; Hebreus 12:1-2; Judas 3",
          questions: [
            "1. Que desafios o século XX trouxe?",
            "2. O que é o movimento pentecostal?",
            "3. O que é o movimento ecumênico?",
            "4. Como a geografia do cristianismo mudou?",
            "5. O que você espera para o futuro da igreja?"
          ],
          application: "Ore pelos cristãos perseguidos hoje. Informe-se e interceda regularmente.",
          summary: "O século XX viu guerras, perseguição, secularização, mas também crescimento global, movimento pentecostal e mudança do centro cristão."
        },
        {
          title: "A Igreja no Brasil",
          content: `O cristianismo chegou ao Brasil com os portugueses (1500). A Igreja Católica foi religião oficial por séculos, moldando cultura, arquitetura, festas. Missionários estabeleceram escolas, hospitais, catequese.

O protestantismo chegou com imigrantes (alemães, ingleses) no século XIX, mas a evangelização ativa começou com missionários americanos. Presbiterianos (1859), batistas (1882), metodistas - cada denominação plantou igrejas e escolas.

O pentecostalismo explodiu no século XX. Assembleia de Deus (1911), Congregação Cristã, e depois ondas neopentecostais transformaram o cenário. O Brasil tornou-se país com uma das maiores populações evangélicas do mundo.

Desafios persistem. Sincretismo, teologia da prosperidade, escândalos. Mas há também sinais de maturidade: compromisso com teologia bíblica, missões transculturais, engajamento social. A igreja brasileira amadurece.`,
          references: "Mateus 28:19-20; Atos 13:1-3; Romanos 15:20; 1 Coríntios 3:6-9",
          questions: [
            "1. Como o cristianismo chegou ao Brasil?",
            "2. Quando o protestantismo começou a crescer?",
            "3. Qual o impacto do pentecostalismo?",
            "4. Que desafios a igreja brasileira enfrenta?",
            "5. Que sinais de maturidade você vê?"
          ],
          application: "Pesquise a história de sua denominação no Brasil. Que lições você aprende?",
          summary: "O Brasil recebeu catolicismo colonial, protestantismo missionário, e explosão pentecostal, enfrentando desafios e sinais de amadurecimento."
        },
        {
          title: "Lições da História",
          content: `A história ensina que a igreja é vulnerável. Gerações perderam a fé; igrejas florescentes morreram. A Turquia foi berço do cristianismo; hoje é menos de 1%. A Europa, centro da Reforma, é largamente secular. Nada é garantido.

A história mostra que Deus preserva Sua igreja. Perseguição não a destrói; frequentemente a fortalece. Heresia a purifica na resposta. O portões do inferno não prevalecem. Cristo sustenta Seu corpo através de todas as eras.

A história convida à humildade. Nossas inovações raramente são novas. Nossos erros repetem erros antigos. Somos anões sobre ombros de gigantes. Devemos muito aos que vieram antes.

A história chama à fidelidade. A nuvem de testemunhas nos rodeia (Hebreus 12:1). Eles correram sua carreira; agora é nossa vez. Que passemos a tocha fielmente à próxima geração. A história continua - e nós fazemos parte dela.`,
          references: "Hebreus 11:1-12:3; 13:7-8; 1 Coríntios 15:58; 2 Timóteo 2:2; Judas 3",
          questions: [
            "1. Por que a igreja é vulnerável?",
            "2. Como Deus preserva a igreja?",
            "3. Por que a história convida à humildade?",
            "4. O que significa ser fiel em nossa geração?",
            "5. Que papel você quer ter na história?"
          ],
          application: "Comprometa-se a passar a fé à próxima geração. Identifique quem você está discipulando.",
          summary: "A história ensina vulnerabilidade, mas também preservação divina, convida à humildade e chama à fidelidade para passar a fé adiante."
        }
      ])
    }
  ]
};

export const NIVEL_3_MODULOS_1_5: ModuleData[] = [
  MODULO_1_EXEGESE_AT,
  MODULO_2_EXEGESE_NT,
  MODULO_3_TEOLOGIA_BIBLICA,
  MODULO_4_TEOLOGIA_SISTEMATICA,
  MODULO_5_HISTORIA_IGREJA
];
