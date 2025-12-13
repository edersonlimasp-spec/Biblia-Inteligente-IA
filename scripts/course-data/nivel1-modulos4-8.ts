// NÍVEL 1 - MÓDULOS 4-8
// Módulos de formação bíblica fundamental

import type { ModuleData } from "./types";

export const NIVEL_1_MODULOS_4_8: ModuleData[] = [
  // MÓDULO 1.4 - CRISTO NO ANTIGO TESTAMENTO
  {
    id: "n1-cristo-at",
    name: "Cristo no Antigo Testamento",
    description: "Descubra como toda a Escritura aponta para Jesus Cristo, desde Gênesis até Malaquias.",
    icon: "crown",
    color: "#C9A227",
    order: 4,
    tracks: [
      {
        id: "n1-cristo-at-track",
        level: "iniciante",
        name: "Jesus nas Escrituras Hebraicas",
        description: "Tipologia e profecia messiânica",
        requiredPlan: "gold",
        order: 1,
        lessons: [
          {
            id: "n1-cat-1",
            title: "O Princípio Cristocêntrico de Interpretação",
            content: `Jesus ensinou Seus discípulos que toda a Escritura fala dEle. No caminho de Emaús, "começando por Moisés e todos os profetas, explicou-lhes o que constava a Seu respeito em todas as Escrituras" (Lucas 24:27). Este é o princípio cristocêntrico: ler o Antigo Testamento buscando ver como ele aponta para Cristo.

Isso não significa forçar Cristo em cada versículo, mas reconhecer que Ele é o centro da história da redenção. O AT contém promessas, tipologias, símbolos e profecias que encontram cumprimento em Jesus. Sem Cristo, o AT permanece incompleto; com Cristo, tudo faz sentido.

Este princípio transforma nossa leitura: cada sacrifício aponta para o Cordeiro de Deus; cada rei davidico prefigura o Rei eterno; cada profeta anuncia Aquele que seria o Profeta final; cada sacerdote antecipa nosso Grande Sumo Sacerdote.

Ler o AT cristocentricamente não é alegoria arbitrária, mas seguir o exemplo de Jesus e dos apóstolos, que constantemente mostravam como as Escrituras testemunham de Cristo.`,
            references: "Lucas 24:27,44-47, João 5:39,46, Atos 3:18,24, 1 Pedro 1:10-12",
            questions: "O que significa ler o AT de forma cristocêntrica?\nComo Jesus ensinou Seus discípulos sobre Si nas Escrituras?\nQual a diferença entre alegoria arbitrária e tipologia bíblica?\nPor que o AT permanece incompleto sem Cristo?\nComo esse princípio transforma sua leitura bíblica?",
            application: "Ao ler o AT esta semana, pergunte: Como esta passagem aponta para Cristo? Anote suas descobertas.",
            summary: "O princípio cristocêntrico reconhece que toda a Escritura testifica de Jesus, seguindo Seu próprio ensinamento.",
            estimatedMinutes: 20,
            order: 1
          },
          {
            id: "n1-cat-2",
            title: "O Protoevangelho em Gênesis 3:15",
            content: `Logo após a queda, Deus pronunciou a primeira promessa messiânica, chamada de Protoevangelho (primeira boa notícia). Ao amaldiçoar a serpente, Deus declarou: "Porei inimizade entre ti e a mulher, entre a tua descendência e o seu descendente. Este te ferirá a cabeça, e tu lhe ferirás o calcanhar" (Gênesis 3:15).

Esta profecia anuncia a vitória do "descendente da mulher" sobre Satanás. A serpente feriria o calcanhar do Messias (a crucificação), mas o Messias esmagaria a cabeça da serpente (vitória definitiva sobre o mal). Todo o AT desenvolve esta promessa.

Observe que é o descendente "da mulher", não do homem, uma alusão ao nascimento virginal. Esta é a semente de esperança plantada nas trevas da queda, que floresceria plenamente em Jesus Cristo.

Desde o início, Deus tinha um plano de redenção centrado em Seu Filho. O resto da Bíblia narra como essa promessa foi preservada através de Abraão, Judá, Davi, até chegar a Jesus de Nazaré.`,
            references: "Gênesis 3:15, Romanos 16:20, Gálatas 4:4, Apocalipse 12:9, Hebreus 2:14",
            questions: "O que é o Protoevangelho?\nQuem é o 'descendente da mulher'?\nComo a serpente feriu o calcanhar de Cristo?\nComo Cristo esmagou a cabeça da serpente?\nO que isso revela sobre o plano de Deus desde o início?",
            application: "Medite em como Deus já tinha um plano de salvação antes mesmo da queda. Agradeça por Sua graça preveniente.",
            summary: "O Protoevangelho em Gênesis 3:15 é a primeira promessa messiânica, anunciando a vitória de Cristo sobre Satanás.",
            estimatedMinutes: 20,
            order: 2
          },
          {
            id: "n1-cat-3",
            title: "Cristo nos Patriarcas: Abraão, Isaque e Jacó",
            content: `Os patriarcas não apenas fazem parte da linhagem de Cristo, mas suas vidas prefiguram aspectos de Sua pessoa e obra. Abraão é chamado "pai de todos os que creem" (Romanos 4:11), e sua fé aponta para a fé salvífica em Cristo.

O sacrifício de Isaque em Gênesis 22 é uma tipologia poderosa: Abraão, o pai, oferece seu único filho amado; Isaque carrega a lenha (como Cristo carregaria a cruz); um carneiro substituto morre em seu lugar. "Deus proverá para si o cordeiro" – e proveu, no Calvário.

Jesus disse: "Abraão... alegrou-se por ver o meu dia; e viu-o e regozijou-se" (João 8:56). Abraão vislumbrou Cristo pela fé.

Jacó, apesar de suas falhas, foi escolhido pela graça, demonstrando que a salvação não depende de mérito humano. Sua luta em Peniel prefigura a luta do crente com Deus em oração, e sua bênção sobre Judá em Gênesis 49:10 profetiza o Messias: "O cetro não se arredará de Judá... até que venha Siló."`,
            references: "Gênesis 22:1-19, Gênesis 49:10, João 8:56, Romanos 4:11-16, Hebreus 11:17-19",
            questions: "Como Isaque tipifica Cristo?\nO que Abraão viu do dia de Cristo?\nQual é a profecia messiânica de Jacó sobre Judá?\nO que a eleição de Jacó ensina sobre a graça?\nComo essas histórias fortalecem sua fé?",
            application: "Releia Gênesis 22 vendo os paralelos com o sacrifício de Cristo. Ore agradecendo pelo Cordeiro que Deus proveu.",
            summary: "Os patriarcas tipificam e profetizam Cristo: Isaque como sacrifício substituto, e Judá como ancestral do Messias.",
            estimatedMinutes: 25,
            order: 3
          },
          {
            id: "n1-cat-4",
            title: "Cristo no Êxodo e na Páscoa",
            content: `O Êxodo é uma das maiores tipologias de Cristo e da salvação. Israel estava escravizado no Egito (tipo do pecado), sob Faraó (tipo de Satanás). Deus enviou Moisés como libertador (tipo de Cristo), e através de juízos sobre os falsos deuses do Egito, resgatou Seu povo.

A Páscoa é central: cada família deveria sacrificar um cordeiro "sem defeito", aplicar seu sangue nos umbrais, e a morte passaria por cima (Êxodo 12). Paulo declara: "Cristo, nossa Páscoa, foi sacrificado por nós" (1 Coríntios 5:7).

João Batista apresentou Jesus como "o Cordeiro de Deus, que tira o pecado do mundo" (João 1:29). Jesus morreu na Páscoa, cumprindo perfeitamente o tipo. Nenhum de Seus ossos foi quebrado, conforme a Lei determinava para o cordeiro pascal.

A travessia do Mar Vermelho tipifica o batismo e a separação definitiva do antigo modo de vida. O maná prefigura Cristo, o Pão do céu. A rocha que deu água é Cristo (1 Coríntios 10:4). Todo o Êxodo aponta para nossa redenção em Jesus.`,
            references: "Êxodo 12:1-13, João 1:29, 1 Coríntios 5:7, 1 Coríntios 10:1-4, João 6:31-35",
            questions: "Como a Páscoa tipifica a morte de Cristo?\nPor que Jesus é chamado 'Cordeiro de Deus'?\nQuais elementos do Êxodo apontam para Cristo?\nComo a travessia do Mar Vermelho tipifica nossa salvação?\nO que significa Cristo ser nosso 'maná' e nossa 'rocha'?",
            application: "Na próxima ceia do Senhor, medite na conexão entre Páscoa e cruz. Agradeça pelo sangue que o protege.",
            summary: "O Êxodo e a Páscoa tipificam poderosamente Cristo como nosso Cordeiro pascal e Libertador do pecado.",
            estimatedMinutes: 25,
            order: 4
          },
          {
            id: "n1-cat-5",
            title: "Cristo no Tabernáculo e nos Sacrifícios",
            content: `O Tabernáculo era uma "tenda" onde Deus habitava no meio de Israel. Cada elemento apontava para Cristo. Hebreus 9:11 explica que Cristo entrou no "tabernáculo maior e mais perfeito, não feito por mãos".

O único caminho de acesso era através do altar de bronze (sacrifício) e da pia de bronze (purificação). Assim, só chegamos a Deus através do sacrifício de Cristo e da lavagem da regeneração.

O candelabro de ouro representa Cristo, a Luz do mundo. A mesa dos pães da proposição mostra Cristo como Pão da vida. O altar de incenso simboliza as orações que sobem a Deus através de nosso Mediador.

O véu separava o Santo Lugar do Santo dos Santos, onde ficava a arca da aliança. Esse véu foi rasgado quando Cristo morreu (Mateus 27:51), abrindo acesso direto a Deus. O propiciatório sobre a arca era aspergido com sangue no Dia da Expiação – tipo do sangue de Cristo que nos reconcilia com Deus.

O sistema sacrificial inteiro apontava para o único sacrifício perfeito e definitivo: "Sem derramamento de sangue não há remissão" (Hebreus 9:22).`,
            references: "Êxodo 25-27, Hebreus 9:1-14, Hebreus 10:19-22, João 1:14, Mateus 27:51",
            questions: "O que cada peça do Tabernáculo representa em relação a Cristo?\nPor que o véu foi rasgado quando Jesus morreu?\nComo os sacrifícios apontavam para Cristo?\nO que significa Hebreus 9:22 para nós?\nComo você agora tem acesso a Deus?",
            application: "Estude o Tabernáculo (Êxodo 25-27) buscando ver Cristo em cada detalhe. Ore pelo véu rasgado que lhe dá acesso a Deus.",
            summary: "O Tabernáculo e os sacrifícios são tipos elaborados de Cristo, nosso caminho de acesso a Deus e sacrifício perfeito.",
            estimatedMinutes: 25,
            order: 5
          },
          {
            id: "n1-cat-6",
            title: "Cristo como Profeta, Sacerdote e Rei",
            content: `No AT, três ofícios mediavam entre Deus e o povo: profeta, sacerdote e rei. Cristo cumpre todos os três de forma perfeita e permanente.

Como Profeta, Jesus é a Palavra final de Deus (Hebreus 1:1-2). Moisés profetizou: "O Senhor vosso Deus vos suscitará um profeta... como eu" (Deuteronômio 18:15). Jesus não apenas fala a Palavra de Deus; Ele É a Palavra encarnada.

Como Sacerdote, Jesus oferece o sacrifício perfeito (Ele mesmo) e intercede continuamente por nós. Ele é sacerdote "segundo a ordem de Melquisedeque" (Salmo 110:4; Hebreus 7), superior ao sacerdócio levítico.

Como Rei, Jesus é o Filho de Davi que reinará eternamente. O anjo disse a Maria: "O Senhor Deus lhe dará o trono de Davi, seu pai... e o seu reino não terá fim" (Lucas 1:32-33).

Esses três ofícios revelam a suficiência de Cristo: Ele nos revela Deus (profeta), nos reconcilia com Deus (sacerdote), e nos governa em justiça (rei). Em Cristo temos tudo.`,
            references: "Deuteronômio 18:15-18, Salmo 110:1-4, 2 Samuel 7:12-16, Hebreus 1:1-3, Hebreus 7:24-25",
            questions: "Quais são os três ofícios de Cristo?\nComo Jesus cumpre o papel de Profeta?\nEm que sentido Jesus é nosso Sacerdote?\nComo Jesus é o Rei prometido?\nPor que é importante que Cristo cumpra os três ofícios?",
            application: "Reflita: Como Profeta, Jesus revela Deus a você; como Sacerdote, intercede por você; como Rei, governa sua vida. Submeta-se a Ele em cada área.",
            summary: "Cristo é o Profeta, Sacerdote e Rei perfeito, cumprindo os três ofícios mediadores do AT de forma definitiva.",
            estimatedMinutes: 25,
            order: 6
          },
          {
            id: "n1-cat-7",
            title: "O Servo Sofredor de Isaías",
            content: `Os "Cânticos do Servo" em Isaías (42, 49, 50, 52-53) apresentam uma figura misteriosa: um Servo do Senhor que sofreria e morreria para trazer salvação. Isaías 53 é a passagem mais detalhada sobre a morte substitutiva de Cristo no AT.

"Ele foi ferido pelas nossas transgressões, esmagado pelas nossas iniquidades; o castigo que nos traz a paz estava sobre ele, e pelas suas pisaduras fomos sarados" (53:5). Aqui está a expiação substitutiva: nossos pecados sobre Ele, Sua justiça sobre nós.

O Servo é descrito como desprezado, rejeitado, um homem de dores. Ele foi oprimido, mas não abriu a boca (como cordeiro mudo). Morreu com os ímpios, mas Sua sepultura foi com o rico. Após Sua morte, Ele veria o fruto do Seu trabalho e ficaria satisfeito.

O eunuco etíope lia Isaías 53 quando Felipe lhe explicou que o texto falava de Jesus (Atos 8:32-35). Esta passagem é crucial para entender a cruz: Cristo morreu em nosso lugar, carregando nossos pecados.`,
            references: "Isaías 52:13-53:12, Atos 8:26-35, 1 Pedro 2:22-25, Marcos 15:27-28",
            questions: "Quem é o Servo Sofredor de Isaías?\nO que significa 'ferido pelas nossas transgressões'?\nComo Isaías 53 descreve a morte de Cristo com precisão?\nPor que o Servo não abriu a boca?\nComo essa passagem afeta sua compreensão da cruz?",
            application: "Leia Isaías 53 devagar, meditando em cada versículo como descrição do que Cristo fez por você.",
            summary: "Isaías 53 profetiza com detalhes impressionantes a morte substitutiva de Cristo, o Servo Sofredor, por nossos pecados.",
            estimatedMinutes: 25,
            order: 7
          },
          {
            id: "n1-cat-8",
            title: "O Messias nos Salmos",
            content: `Os Salmos contêm numerosas profecias messiânicas, muitas citadas no NT como cumpridas em Jesus.

O Salmo 2 proclama o Filho de Deus como Rei ungido que reinará sobre as nações. "Tu és meu Filho, eu hoje te gerei" (2:7) é aplicado a Cristo em Atos 13:33.

O Salmo 22 descreve a crucificação com detalhes impressionantes: "Meu Deus, meu Deus, por que me desamparaste?" (palavras de Jesus na cruz); mãos e pés traspassados; roupas divididas e lançamento de sortes. Escrito 1000 anos antes de Cristo.

O Salmo 110 é o mais citado no NT: "Disse o Senhor ao meu Senhor: Assenta-te à minha direita". Revela a divindade do Messias e Seu sacerdócio eterno segundo Melquisedeque.

O Salmo 16:10 profetiza a ressurreição: "Não permitirás que o teu Santo veja corrupção." Pedro cita isso em Atos 2:27-31 como prova da ressurreição de Cristo.

Os Salmos messiânicos mostram que a vinda, sofrimento, morte, ressurreição e reinado de Jesus foram planejados e preditos séculos antes.`,
            references: "Salmo 2, Salmo 16:8-11, Salmo 22, Salmo 110, Atos 2:25-36",
            questions: "Quais Salmos são considerados messiânicos?\nComo o Salmo 22 descreve a crucificação?\nO que o Salmo 110 revela sobre o Messias?\nComo o Salmo 16 profetiza a ressurreição?\nO que essas profecias provam sobre Jesus?",
            application: "Leia o Salmo 22 e compare com os relatos da crucificação. Maravilhe-se com a precisão profética.",
            summary: "Os Salmos messiânicos profetizam detalhes da vida, morte, ressurreição e reinado de Cristo séculos antes de Seu nascimento.",
            estimatedMinutes: 25,
            order: 8
          },
          {
            id: "n1-cat-9",
            title: "Profecias Messiânicas Detalhadas",
            content: `O AT contém centenas de profecias sobre o Messias, muitas com detalhes específicos cumpridos em Jesus:

Seu nascimento em Belém (Miquéias 5:2), de uma virgem (Isaías 7:14), da tribo de Judá (Gênesis 49:10), da linhagem de Davi (2 Samuel 7:12-13).

Sua entrada em Jerusalém montado num jumento (Zacarias 9:9). Sua traição por trinta moedas de prata (Zacarias 11:12-13). Seu julgamento injusto e silêncio diante dos acusadores (Isaías 53:7).

Sua crucificação com malfeitores (Isaías 53:12), o lançamento de sortes por Suas vestes (Salmo 22:18), vinagre oferecido para beber (Salmo 69:21), nenhum osso quebrado (Salmo 34:20), Seu lado traspassado (Zacarias 12:10).

Sua ressurreição antes da corrupção (Salmo 16:10), Sua ascensão (Salmo 68:18), e Seu assento à direita de Deus (Salmo 110:1).

A probabilidade matemática de uma pessoa cumprir apenas 8 dessas profecias por acaso é de 1 em 10 a 17. Jesus cumpriu todas. Isso demonstra Sua identidade como o Messias prometido e a confiabilidade das Escrituras.`,
            references: "Miquéias 5:2, Isaías 7:14, Zacarias 9:9, Zacarias 11:12-13, Salmo 34:20",
            questions: "Quantas profecias messiânicas existem no AT?\nQuais detalhes específicos sobre o nascimento de Jesus foram profetizados?\nQuais detalhes da crucificação foram preditos?\nO que a precisão dessas profecias demonstra?\nComo essas profecias fortalecem sua fé em Cristo?",
            application: "Faça uma lista de profecias messiânicas e seus cumprimentos. Use-a para compartilhar Cristo com alguém.",
            summary: "Centenas de profecias detalhadas sobre o Messias foram cumpridas em Jesus, provando Sua identidade e a inspiração das Escrituras.",
            estimatedMinutes: 25,
            order: 9
          },
          {
            id: "n1-cat-10",
            title: "A Esperança Messiânica e Sua Resposta em Jesus",
            content: `Israel viveu séculos de espera pelo Messias prometido. Cada geração se perguntava: será em nossos dias? Os profetas anunciavam, o povo esperava. Esta esperança messiânica era o coração da fé de Israel.

Quando Jesus nasceu, havia intensa expectativa. Simeão e Ana no templo aguardavam a "consolação de Israel". Os magos vieram do oriente buscando o "Rei dos judeus". João Batista preparou o caminho. O momento estava cumprido.

Jesus declarou: "Hoje se cumpriu esta Escritura aos vossos ouvidos" (Lucas 4:21). Ele é a resposta a todas as promessas, o fim de toda a espera. Em Cristo, o "sim" de Deus ressoa a cada promessa (2 Coríntios 1:20).

A primeira vinda cumpriu as profecias do Messias sofredor; a segunda vinda cumprirá as do Messias reinante. Vivemos entre os tempos, com o Messias já vindo e ainda por vir.

Ver Cristo no AT não é um exercício intelectual, mas um encontro com o Deus fiel que cumpre Suas promessas. A esperança de Israel tornou-se a esperança do mundo: Jesus Cristo, ontem, hoje, e eternamente.`,
            references: "Lucas 2:25-38, Lucas 4:16-21, 2 Coríntios 1:20, Gálatas 4:4, Hebreus 13:8",
            questions: "Como Israel viveu a espera pelo Messias?\nQuem reconheceu Jesus como Messias em Seu nascimento?\nO que significa dizer que todas as promessas têm seu 'sim' em Cristo?\nQuais profecias ainda aguardam cumprimento na segunda vinda?\nComo a fidelidade de Deus nas profecias afeta sua esperança?",
            application: "Agradeça a Deus por cumprir Suas promessas em Cristo. Viva hoje na esperança do cumprimento final quando Ele voltar.",
            summary: "A esperança messiânica de Israel encontrou plena resposta em Jesus, demonstrando a fidelidade de Deus a todas as Suas promessas.",
            estimatedMinutes: 20,
            order: 10
          }
        ]
      }
    ]
  },

  // MÓDULO 1.5 - INTRODUÇÃO À CRISTOLOGIA
  {
    id: "n1-cristologia-intro",
    name: "Introdução à Cristologia",
    description: "Estudo sobre a Pessoa de Jesus Cristo: Sua divindade, humanidade, e união das duas naturezas.",
    icon: "sparkles",
    color: "#FFD700",
    order: 5,
    tracks: [
      {
        id: "n1-cristologia-track",
        level: "iniciante",
        name: "Conhecendo a Cristo",
        description: "Fundamentos sobre a Pessoa de Jesus",
        requiredPlan: "gold",
        order: 1,
        lessons: [
          {
            id: "n1-cris-1",
            title: "Por Que Estudar Cristologia?",
            content: `Cristologia é o estudo da Pessoa de Jesus Cristo. É o coração de toda teologia cristã, pois Jesus é o centro de nossa fé. Quem Jesus é determina o que Ele pode fazer por nós e como devemos nos relacionar com Ele.

Jesus perguntou aos discípulos: "Quem dizem os homens ser o Filho do Homem?" e depois: "E vós, quem dizeis que eu sou?" (Mateus 16:13-15). Esta pergunta ecoa através dos séculos. Nossa resposta tem consequências eternas.

Uma cristologia correta é fundamental para o Evangelho. Se Jesus não é verdadeiramente Deus, Ele não pode salvar. Se não é verdadeiramente homem, não pode nos representar. Se as duas naturezas não estão unidas em uma pessoa, não há mediador.

Ao longo da história, a Igreja enfrentou heresias cristológicas: algumas negavam a divindade de Cristo (arianismo), outras negavam Sua humanidade (docetismo), outras dividiam Sua pessoa (nestorianismo). Os concílios ecumênicos defenderam a verdade bíblica.

Estudar cristologia não é mero exercício intelectual, mas adoração ao nosso Senhor e Salvador Jesus Cristo.`,
            references: "Mateus 16:13-17, Colossenses 2:9, João 1:1-14, Hebreus 1:1-4",
            questions: "O que é cristologia?\nPor que é importante estudar a Pessoa de Cristo?\nQuais são as consequências de uma cristologia errada?\nComo você responderia à pergunta: 'Quem é Jesus?'\nQual heresia cristológica você considera mais perigosa hoje?",
            application: "Reflita sobre quem Jesus é para você. Sua compreensão está alinhada com o ensino bíblico?",
            summary: "Cristologia é o estudo sobre a Pessoa de Cristo, essencial para uma fé correta e salvífica.",
            estimatedMinutes: 20,
            order: 1
          },
          {
            id: "n1-cris-2",
            title: "A Preexistência de Cristo",
            content: `Jesus não começou a existir quando nasceu em Belém. Como Filho eterno de Deus, Ele existia antes de toda a criação. Esta é a doutrina da preexistência de Cristo.

João 1:1 declara: "No princípio era o Verbo, e o Verbo estava com Deus, e o Verbo era Deus." Antes de haver tempo, Jesus já existia eternamente com o Pai.

Jesus afirmou: "Antes que Abraão existisse, EU SOU" (João 8:58), usando o nome divino revelado a Moisés (Êxodo 3:14). Isso provocou tentativa de apedrejamento pelos judeus, que entenderam a reivindicação de divindade.

Em Sua oração ao Pai, Jesus disse: "Glorifica-me, ó Pai, junto de ti mesmo, com a glória que eu tinha contigo antes que o mundo existisse" (João 17:5). Ele partilhava a glória divina antes da criação.

Colossenses 1:17 afirma: "Ele é antes de todas as coisas, e nele tudo subsiste." Não apenas existia antes, mas sustenta toda a criação. A preexistência é fundamental para entender que Jesus é Deus.`,
            references: "João 1:1-3, João 8:58, João 17:5, Colossenses 1:15-17, Miquéias 5:2",
            questions: "O que significa a preexistência de Cristo?\nComo João 1:1 ensina esta doutrina?\nPor que a declaração 'EU SOU' foi tão significativa?\nO que Jesus pediu ao Pai em João 17:5?\nComo a preexistência prova a divindade de Cristo?",
            application: "Medite na eternidade de Cristo. Ele não apenas existia antes de você, mas antes de tudo. Adore-O como Deus eterno.",
            summary: "Jesus existia eternamente com o Pai antes de toda a criação, demonstrando Sua plena divindade.",
            estimatedMinutes: 20,
            order: 2
          },
          {
            id: "n1-cris-3",
            title: "A Divindade de Cristo",
            content: `O Novo Testamento afirma inequivocamente a plena divindade de Jesus Cristo. Ele não é um deus menor, um anjo exaltado ou apenas um homem especial – Ele é Deus.

As Escrituras chamam Jesus de "Deus" diretamente. Tomé exclamou: "Senhor meu e Deus meu!" (João 20:28). Tito 2:13 fala de "nosso grande Deus e Salvador Cristo Jesus". Hebreus 1:8 aplica a Jesus: "O teu trono, ó Deus, é para todo o sempre."

Jesus possui atributos exclusivamente divinos: eternidade (João 1:1), onipresença (Mateus 28:20), onisciência (João 21:17), onipotência (Mateus 28:18), imutabilidade (Hebreus 13:8).

Jesus faz obras que só Deus pode fazer: criar (Colossenses 1:16), perdoar pecados (Marcos 2:5-7), dar vida eterna (João 10:28), julgar o mundo (João 5:22).

Jesus recebe adoração, que pertence somente a Deus. Os anjos O adoram (Hebreus 1:6). Os discípulos O adoraram (Mateus 28:9). Toda a criação O adorará (Filipenses 2:10-11).`,
            references: "João 1:1, João 20:28, Tito 2:13, Hebreus 1:8, Colossenses 2:9",
            questions: "Como a Bíblia afirma a divindade de Cristo?\nQuais atributos divinos Jesus possui?\nQuais obras divinas Jesus realiza?\nPor que é significativo que Jesus receba adoração?\nQual evidência da divindade de Cristo mais lhe impacta?",
            application: "Liste razões bíblicas pelas quais Jesus é Deus. Use essa lista para fundamentar sua fé e testemunho.",
            summary: "Jesus é plenamente Deus, possuindo todos os atributos divinos, realizando obras divinas, e recebendo adoração.",
            estimatedMinutes: 25,
            order: 3
          },
          {
            id: "n1-cris-4",
            title: "A Humanidade de Cristo",
            content: `Tão importante quanto a divindade é a plena humanidade de Jesus. "O Verbo se fez carne e habitou entre nós" (João 1:14). Jesus não apenas pareceu ser humano – Ele verdadeiramente se tornou humano.

Jesus tinha corpo humano: nasceu de mulher (Gálatas 4:4), cresceu (Lucas 2:52), sentiu fome (Mateus 4:2), sede (João 19:28), cansaço (João 4:6), e morreu (Filipenses 2:8).

Jesus tinha alma e espírito humanos: experimentou tristeza (Mateus 26:38), alegria (Lucas 10:21), compaixão (Mateus 9:36), angústia (Lucas 22:44), e amor (João 11:5).

A humanidade de Cristo era necessária para nossa salvação. Ele precisava ser humano para morrer em nosso lugar. Hebreus 2:14 explica: "Visto que os filhos são participantes de carne e sangue, também ele participou das mesmas coisas, para que, pela morte, destruísse aquele que tinha o poder da morte."

Ele é um Salvador que compreende nossas fraquezas: "Porque não temos um sumo sacerdote que não possa compadecer-se das nossas fraquezas; porém, foi tentado em tudo, à nossa semelhança, mas sem pecado" (Hebreus 4:15).`,
            references: "João 1:14, Gálatas 4:4, Lucas 2:52, Hebreus 2:14-17, Hebreus 4:15",
            questions: "Por que a humanidade de Cristo é importante?\nQuais evidências bíblicas mostram que Jesus era verdadeiramente humano?\nComo a humanidade de Cristo era necessária para a salvação?\nComo Hebreus 4:15 descreve Jesus como sumo sacerdote?\nComo a humanidade de Cristo o encoraja em suas lutas?",
            application: "Quando enfrentar tentações ou sofrimentos, lembre-se que Jesus passou por isso. Recorra a Ele em oração.",
            summary: "Jesus é plenamente humano, tendo experimentado todas as limitações da natureza humana, exceto o pecado.",
            estimatedMinutes: 25,
            order: 4
          },
          {
            id: "n1-cris-5",
            title: "A Impecabilidade de Cristo",
            content: `Embora plenamente humano, Jesus nunca pecou. Ele é o único ser humano na história a viver uma vida perfeitamente santa. Esta doutrina é chamada de impecabilidade de Cristo.

A Bíblia afirma explicitamente que Jesus não tinha pecado. Hebreus 4:15 diz que Ele foi "tentado em tudo, à nossa semelhança, mas sem pecado". 2 Coríntios 5:21: "Aquele que não conheceu pecado". 1 Pedro 2:22: "Ele não cometeu pecado, nem dolo algum se achou em sua boca".

Jesus desafiou Seus oponentes: "Quem dentre vós me convence de pecado?" (João 8:46). Ninguém pôde responder. Até Pilatos declarou: "Não acho nele crime algum" (João 18:38).

A impecabilidade de Cristo era necessária para a expiação. Somente um sacrifício sem mancha poderia morrer pelos pecadores. O cordeiro pascal deveria ser "sem defeito" (Êxodo 12:5). Cristo é o "Cordeiro sem defeito e sem mácula" (1 Pedro 1:19).

Jesus foi tentado como nós para poder simpatizar conosco, mas venceu todas as tentações para poder nos salvar e ser nosso exemplo.`,
            references: "Hebreus 4:15, 2 Coríntios 5:21, 1 Pedro 2:22, João 8:46, 1 Pedro 1:19",
            questions: "O que significa a impecabilidade de Cristo?\nComo a Bíblia afirma que Jesus não pecou?\nPor que a impecabilidade era necessária para a expiação?\nJesus poderia ter pecado?\nComo a santidade de Cristo afeta sua vida?",
            application: "Olhe para Jesus como seu modelo de santidade. Peça ao Espírito Santo para conformá-lo à imagem de Cristo.",
            summary: "Jesus viveu uma vida perfeitamente santa, qualificando-O para ser nosso sacrifício substitutivo e exemplo de santidade.",
            estimatedMinutes: 20,
            order: 5
          },
          {
            id: "n1-cris-6",
            title: "A União das Duas Naturezas em Cristo",
            content: `Jesus é uma pessoa com duas naturezas: divina e humana. Esta união é chamada de união hipostática (do grego hypostasis, "pessoa"). Ele é verdadeiro Deus e verdadeiro homem em uma pessoa.

O Concílio de Calcedônia (451 d.C.) definiu a fé ortodoxa: as duas naturezas de Cristo são unidas "sem confusão, sem mudança, sem divisão, sem separação". Cada natureza retém suas propriedades distintas, mas estão unidas na única pessoa do Filho de Deus.

Erros a evitar: o arianismo negava a plena divindade; o docetismo negava a plena humanidade; o nestorianismo dividia Cristo em duas pessoas; o eutiquianismo misturava as naturezas em uma só.

A união hipostática significa que é apropriado dizer que Deus morreu na cruz (embora a natureza divina não possa morrer, a pessoa divina de Cristo morreu em Sua natureza humana). Também significa que a pessoa humana de Jesus deve ser adorada, pois é também divina.

Esse mistério ultrapassa a compreensão humana, mas é essencial para a salvação: somente uma pessoa que é Deus e homem pode mediar entre Deus e homens (1 Timóteo 2:5).`,
            references: "Colossenses 2:9, 1 Timóteo 2:5, João 1:14, Filipenses 2:6-8, Hebreus 2:14-18",
            questions: "O que é a união hipostática?\nComo o Concílio de Calcedônia definiu a fé?\nQuais erros devemos evitar sobre as duas naturezas?\nPor que é apropriado dizer que 'Deus morreu' na cruz?\nPor que essa união era necessária para nossa salvação?",
            application: "Adore Cristo por ser seu perfeito Mediador – Deus suficiente para salvar, homem para representá-lo.",
            summary: "Jesus é uma pessoa com duas naturezas completas, divina e humana, unidas sem confusão ou separação.",
            estimatedMinutes: 25,
            order: 6
          },
          {
            id: "n1-cris-7",
            title: "O Nascimento Virginal",
            content: `O nascimento virginal de Jesus é a doutrina de que Maria concebeu Jesus pelo poder do Espírito Santo, sem relação com homem. Isso foi profetizado em Isaías 7:14: "Eis que a virgem conceberá e dará à luz um filho."

Mateus 1:18-25 e Lucas 1:26-38 narram o evento. O anjo disse a Maria: "O Espírito Santo virá sobre ti, e o poder do Altíssimo te envolverá com a sua sombra; por isso o que há de nascer será chamado Santo, Filho de Deus" (Lucas 1:35).

O nascimento virginal é essencial por várias razões: demonstra a iniciativa divina na encarnação; garante a divindade de Jesus como Filho de Deus; e protege a impecabilidade de Cristo (não herdando a natureza pecaminosa de Adão da mesma forma).

Maria foi instrumento da graça, mas não contribuiu para a divindade de Jesus. Ela própria precisou de salvação (Lucas 1:47). A ênfase não está em Maria, mas no ato sobrenatural de Deus em se fazer homem.

O nascimento virginal é milagre, mas para quem crê na ressurreição, não há razão para duvidar. O mesmo poder que ressuscitou Jesus pôde trazê-Lo ao mundo de forma única.`,
            references: "Isaías 7:14, Mateus 1:18-25, Lucas 1:26-38, Gálatas 4:4",
            questions: "O que é o nascimento virginal?\nOnde foi profetizado no AT?\nComo Mateus e Lucas narram o evento?\nPor que o nascimento virginal é teologicamente importante?\nComo essa doutrina exalta a Deus, não a Maria?",
            application: "Agradeça a Deus por tomar a iniciativa de enviar Seu Filho. Reflita no mistério da encarnação.",
            summary: "O nascimento virginal demonstra a iniciativa divina na encarnação, com Jesus concebido pelo Espírito Santo em Maria.",
            estimatedMinutes: 20,
            order: 7
          },
          {
            id: "n1-cris-8",
            title: "Os Nomes e Títulos de Cristo",
            content: `Os nomes e títulos de Jesus revelam Sua pessoa e obra. Cada nome enfatiza um aspecto de quem Ele é.

Jesus (em hebraico, Yeshua/Josué) significa "O Senhor Salva". Este nome foi dado pelo anjo: "chamarás o seu nome Jesus, porque ele salvará o seu povo dos pecados deles" (Mateus 1:21).

Cristo (do grego Christos; em hebraico, Mashiach/Messias) significa "Ungido". Jesus é o Ungido de Deus para ser Profeta, Sacerdote e Rei.

Filho de Deus enfatiza Sua divindade e relação única com o Pai. Filho do Homem (título que Jesus mais usou) enfatiza Sua humanidade e conexão com a figura do Daniel 7:13-14.

Senhor (Kyrios em grego) era o título usado para Deus no AT (tradução de YHWH). Chamar Jesus de Senhor é reconhecê-Lo como divino e soberano.

Emanuel significa "Deus Conosco" (Isaías 7:14; Mateus 1:23). Verbo/Palavra (Logos) em João 1 mostra Jesus como a comunicação final de Deus. Alfa e Ômega (Apocalipse 1:8) declara que Ele é o primeiro e o último, o eterno.`,
            references: "Mateus 1:21-23, João 1:1, Filipenses 2:9-11, Apocalipse 1:8, Daniel 7:13-14",
            questions: "O que significa o nome 'Jesus'?\nO que significa 'Cristo' ou 'Messias'?\nPor que 'Filho do Homem' era o título preferido de Jesus?\nO que significa chamar Jesus de 'Senhor'?\nQual título de Cristo mais lhe impacta?",
            application: "Ao orar, use diferentes nomes de Jesus, refletindo no que cada um significa.",
            summary: "Os nomes de Jesus revelam Sua identidade: Salvador, Ungido, Filho de Deus, Senhor, Emanuel – Deus Conosco.",
            estimatedMinutes: 20,
            order: 8
          },
          {
            id: "n1-cris-9",
            title: "O Conhecimento de Cristo: O Que Jesus Sabia",
            content: `Uma questão intrigante na cristologia é: o que Jesus sabia durante Sua vida terrena? Como Deus, Ele é onisciente. Mas como homem, Ele cresceu "em sabedoria" (Lucas 2:52). Como conciliar isso?

Jesus demonstrou conhecimento sobrenatural: sabia os pensamentos das pessoas (Mateus 9:4), conhecia eventos distantes (João 1:48), predisse Sua morte e ressurreição com detalhes (Mateus 16:21).

No entanto, Jesus afirmou não saber o dia de Sua volta: "Daquele dia e hora ninguém sabe... nem o Filho, mas só o Pai" (Marcos 13:32). Isso indica alguma limitação em Seu conhecimento humano.

A melhor compreensão é que Jesus, em Sua natureza divina, sabe todas as coisas. Mas em Sua natureza humana, voluntariamente limitou o exercício de certos atributos (a "kenosis" de Filipenses 2:7). Ele viveu dependentemente do Pai e do Espírito.

Este mistério mostra a realidade da encarnação. Jesus não fingiu ser humano – Ele verdadeiramente viveu dentro das limitações humanas, ainda que sem pecado, sempre tendo acesso ao conhecimento divino quando necessário para Seu ministério.`,
            references: "Lucas 2:52, Marcos 13:32, João 1:47-48, Mateus 9:4, Filipenses 2:5-8",
            questions: "Como Jesus demonstrou conhecimento sobrenatural?\nO que Marcos 13:32 indica sobre as limitações de Jesus?\nO que é a 'kenosis' de Cristo?\nComo as duas naturezas se relacionam com o conhecimento?\nO que esse mistério ensina sobre a realidade da encarnação?",
            application: "Agradeça que Jesus, mesmo sendo Deus, viveu como homem dependente do Pai, sendo nosso exemplo.",
            summary: "Jesus tinha conhecimento divino, mas voluntariamente viveu dentro de limitações humanas na encarnação.",
            estimatedMinutes: 25,
            order: 9
          },
          {
            id: "n1-cris-10",
            title: "A Suficiência de Cristo",
            content: `Tudo o que precisamos está em Cristo. Esta é a doutrina da suficiência de Cristo. Ele é suficiente para nossa salvação, santificação e glorificação.

Paulo declarou: "Nele habita corporalmente toda a plenitude da Divindade" (Colossenses 2:9). Se a plenitude de Deus está em Cristo, não precisamos buscar nada fora dEle.

Cristo é suficiente para nossa salvação: "Não há salvação em nenhum outro, porque abaixo do céu não existe nenhum outro nome... pelo qual importa que sejamos salvos" (Atos 4:12). Não precisamos de Cristo + obras, Cristo + Maria, Cristo + algo mais. Cristo é suficiente.

Cristo é suficiente para nossa vida cristã: "Estou crucificado com Cristo; logo, já não sou eu quem vive, mas Cristo vive em mim" (Gálatas 2:20). Ele é nossa sabedoria, justiça, santificação e redenção (1 Coríntios 1:30).

Cristo é suficiente para cada necessidade: Ele é nosso pão, água, luz, caminho, verdade, vida, pastor, porta, videira. Nele encontramos tudo. Adicionar a Cristo é insultá-Lo; diminuí-Lo é perdê-Lo. Ele basta.`,
            references: "Colossenses 2:9-10, Atos 4:12, Gálatas 2:20, 1 Coríntios 1:30, João 14:6",
            questions: "O que significa a suficiência de Cristo?\nPor que adicionar algo a Cristo é problemático?\nComo Cristo é suficiente para a salvação?\nComo Cristo é suficiente para a vida cristã?\nEm que área você precisa descansar mais na suficiência de Cristo?",
            application: "Identifique algo que você busca fora de Cristo que Ele mesmo pode suprir. Volte-se para Ele.",
            summary: "Cristo é plenamente suficiente para toda nossa salvação e vida, não precisando de qualquer acréscimo.",
            estimatedMinutes: 20,
            order: 10
          }
        ]
      }
    ]
  },

  // MÓDULO 1.6 - INTRODUÇÃO AO ESPÍRITO SANTO
  {
    id: "n1-espirito-santo",
    name: "Introdução ao Espírito Santo",
    description: "Conheça a Pessoa e a obra do Espírito Santo na criação, nas Escrituras, em Cristo, e na vida do crente.",
    icon: "wind",
    color: "#87CEEB",
    order: 6,
    tracks: [
      {
        id: "n1-es-track",
        level: "iniciante",
        name: "O Consolador",
        description: "A Pessoa e obra do Espírito",
        requiredPlan: "gold",
        order: 1,
        lessons: [
          {
            id: "n1-es-1",
            title: "O Espírito Santo é uma Pessoa",
            content: `O Espírito Santo não é uma força impessoal ou mera influência – Ele é uma Pessoa divina, a terceira Pessoa da Trindade. Reconhecer isso é fundamental para nos relacionarmos corretamente com Ele.

A Bíblia atribui ao Espírito características pessoais: Ele tem mente (Romanos 8:27), vontade (1 Coríntios 12:11), emoções (Efésios 4:30 – pode ser entristecido). Uma força impessoal não pensa, não decide, não sente.

O Espírito realiza ações pessoais: Ele ensina (João 14:26), testifica (João 15:26), convence (João 16:8), guia (Romanos 8:14), intercede (Romanos 8:26). Ele fala às igrejas (Apocalipse 2:7).

Jesus usou pronomes pessoais para o Espírito, mesmo quebrando regras gramaticais gregas (pneuma é neutro, mas Jesus usou "ele" – ekeinos – João 16:13-14). Isso enfatiza a personalidade do Espírito.

Podemos pecar contra o Espírito de formas que só fazem sentido se Ele for pessoa: mentir a Ele (Atos 5:3), resisti-Lo (Atos 7:51), insultá-Lo (Hebreus 10:29), blasfemar contra Ele (Mateus 12:31).`,
            references: "João 14:16-17,26, João 16:13-14, Romanos 8:26-27, Efésios 4:30, Atos 5:3-4",
            questions: "Por que é importante saber que o Espírito Santo é uma Pessoa?\nQuais características pessoais o Espírito possui?\nQuais ações pessoais Ele realiza?\nComo podemos pecar contra o Espírito?\nComo essa verdade afeta sua relação com o Espírito Santo?",
            application: "Ao orar, dirija-se ao Espírito Santo como Pessoa. Peça que Ele o guie e ensine hoje.",
            summary: "O Espírito Santo é uma Pessoa divina, não uma força, possuindo mente, vontade e emoções.",
            estimatedMinutes: 20,
            order: 1
          },
          {
            id: "n1-es-2",
            title: "O Espírito Santo é Deus",
            content: `O Espírito Santo é plenamente Deus, co-igual e co-eterno com o Pai e o Filho. Ele não é inferior às outras Pessoas da Trindade em natureza ou glória.

A Bíblia chama o Espírito Santo de Deus explicitamente. Quando Ananias mentiu ao Espírito, Pedro disse que ele havia mentido "a Deus" (Atos 5:3-4). Paulo identifica o templo de nosso corpo como "templo do Espírito Santo" e "templo de Deus" (1 Coríntios 3:16; 6:19).

O Espírito possui atributos divinos: eternidade (Hebreus 9:14), onipresença (Salmo 139:7-10), onisciência (1 Coríntios 2:10-11), onipotência (Lucas 1:35).

O Espírito realiza obras divinas: criação (Gênesis 1:2), regeneração (João 3:5-8), inspiração das Escrituras (2 Pedro 1:21), ressurreição (Romanos 8:11).

O Espírito é incluído em fórmulas trinitárias junto com o Pai e o Filho: na grande comissão (Mateus 28:19), na bênção apostólica (2 Coríntios 13:14). Isso seria blasfêmia se Ele não fosse igualmente Deus.`,
            references: "Atos 5:3-4, 1 Coríntios 3:16, Hebreus 9:14, Mateus 28:19, 2 Coríntios 13:14",
            questions: "Como Atos 5:3-4 prova que o Espírito é Deus?\nQuais atributos divinos o Espírito possui?\nQuais obras divinas Ele realiza?\nPor que as fórmulas trinitárias são significativas?\nComo você adora ao Espírito Santo?",
            application: "Inclua o Espírito Santo em sua adoração, reconhecendo-O como Deus.",
            summary: "O Espírito Santo é plenamente Deus, possuindo todos os atributos divinos e realizando obras divinas.",
            estimatedMinutes: 20,
            order: 2
          },
          {
            id: "n1-es-3",
            title: "O Espírito Santo no Antigo Testamento",
            content: `O Espírito Santo estava ativo no AT, embora Sua obra fosse diferente em alguns aspectos da era do NT.

Na criação, "o Espírito de Deus pairava sobre as águas" (Gênesis 1:2). Ele participou da obra criadora, dando vida e ordem ao que estava "sem forma e vazio".

O Espírito capacitava indivíduos para tarefas específicas: Bezalel para trabalhos artísticos no tabernáculo (Êxodo 31:3); juízes como Otoniel, Gideão e Sansão para liderança e poder (Juízes 3:10; 6:34; 14:6); reis como Saul e Davi (1 Samuel 10:10; 16:13).

O Espírito inspirou os profetas: "homens santos de Deus falaram inspirados pelo Espírito Santo" (2 Pedro 1:21). Os profetas eram porta-vozes de Deus pelo Espírito.

No AT, o Espírito vinha sobre pessoas selecionadas para missões específicas, e podia ser removido (como aconteceu com Saul – 1 Samuel 16:14). Isso difere da permanência prometida no NT (João 14:16-17). O AT aguardava o derramamento universal do Espírito (Joel 2:28-29), cumprido no Pentecostes.`,
            references: "Gênesis 1:2, Êxodo 31:3, Juízes 14:6, 1 Samuel 16:13-14, Joel 2:28-29",
            questions: "Qual foi o papel do Espírito na criação?\nComo o Espírito capacitava líderes no AT?\nComo o Espírito inspirou os profetas?\nQual a diferença entre a obra do Espírito no AT e no NT?\nO que Joel profetizou sobre o Espírito?",
            application: "Agradeça que hoje o Espírito habita permanentemente em todo crente, não apenas em alguns escolhidos.",
            summary: "No AT, o Espírito criava, capacitava e inspirava, preparando para o derramamento universal no Pentecostes.",
            estimatedMinutes: 25,
            order: 3
          },
          {
            id: "n1-es-4",
            title: "O Espírito Santo na Vida de Jesus",
            content: `O ministério terreno de Jesus foi realizado no poder do Espírito Santo. Jesus, embora sendo Deus, viveu como homem dependente do Espírito, sendo nosso modelo.

Jesus foi concebido pelo Espírito Santo (Lucas 1:35). Seu corpo humano foi formado por obra sobrenatural do Espírito.

No batismo de Jesus, o Espírito desceu sobre Ele como pomba (Lucas 3:22), ungindo-O para Seu ministério público. Jesus citou Isaías 61:1: "O Espírito do Senhor está sobre mim, pelo que me ungiu" (Lucas 4:18).

Jesus foi "cheio do Espírito Santo" (Lucas 4:1) e "conduzido pelo Espírito ao deserto" (Lucas 4:1). Ele "voltou para a Galileia no poder do Espírito" (Lucas 4:14). Seus milagres eram pelo Espírito (Mateus 12:28).

Jesus ofereceu-Se a Deus "pelo Espírito eterno" (Hebreus 9:14), e foi ressuscitado pelo Espírito (Romanos 8:11). Toda a vida de Cristo foi vivida em dependência do Espírito – assim também deve ser a nossa.`,
            references: "Lucas 1:35, Lucas 3:22, Lucas 4:1,14,18, Mateus 12:28, Hebreus 9:14",
            questions: "Qual foi o papel do Espírito na concepção de Jesus?\nO que aconteceu no batismo de Jesus?\nComo Jesus vivia em dependência do Espírito?\nComo Jesus realizou milagres?\nO que o exemplo de Jesus ensina sobre nossa vida no Espírito?",
            application: "Assim como Jesus viveu no poder do Espírito, busque depender do Espírito em cada área da sua vida.",
            summary: "Jesus viveu todo o Seu ministério terreno no poder e dependência do Espírito Santo, sendo nosso modelo.",
            estimatedMinutes: 20,
            order: 4
          },
          {
            id: "n1-es-5",
            title: "O Pentecostes: O Derramamento do Espírito",
            content: `O Pentecostes (Atos 2) é o cumprimento da promessa do Espírito. Jesus havia dito: "Recebereis poder ao descer sobre vós o Espírito Santo" (Atos 1:8). Cinquenta dias após a Páscoa, isso aconteceu.

Os sinais foram extraordinários: som como de vento impetuoso, línguas como de fogo, falar em outras línguas. Esses sinais inaugurais marcaram a chegada de uma nova era.

Pedro explicou o fenômeno citando Joel 2:28-32: "Nos últimos dias, derramarei do meu Espírito sobre toda a carne." O Espírito não mais viria apenas sobre poucos, mas sobre todos os que cressem, judeus e gentios, homens e mulheres, jovens e velhos.

O Pentecostes marca o nascimento da Igreja. O mesmo Espírito que capacitou Jesus agora habita em Seu corpo coletivo. Os discípulos, antes medrosos, tornaram-se ousados pregadores. Três mil pessoas foram convertidas naquele dia.

O Pentecostes é um evento irrepetível (assim como a cruz e a ressurreição), mas seus efeitos continuam. Todo crente, ao converter-se, recebe o Espírito Santo (Romanos 8:9; Efésios 1:13-14).`,
            references: "Atos 1:8, Atos 2:1-41, Joel 2:28-32, Romanos 8:9, Efésios 1:13-14",
            questions: "O que aconteceu no Pentecostes?\nQuais foram os sinais que acompanharam?\nQual profecia foi cumprida?\nQual a relação entre Pentecostes e a Igreja?\nTodo crente hoje recebe o Espírito Santo?",
            application: "Agradeça que você tem o mesmo Espírito que encheu os discípulos no Pentecostes.",
            summary: "O Pentecostes cumpriu a promessa do derramamento do Espírito sobre todos os crentes, inaugurando a era da Igreja.",
            estimatedMinutes: 25,
            order: 5
          },
          {
            id: "n1-es-6",
            title: "A Obra Regeneradora do Espírito",
            content: `A regeneração (ou novo nascimento) é a obra do Espírito Santo pela qual recebemos nova vida espiritual. Sem ela, não podemos ver nem entrar no Reino de Deus (João 3:3,5).

Jesus explicou a Nicodemos: "O que é nascido da carne é carne; o que é nascido do Espírito é espírito" (João 3:6). O nascimento natural nos traz à existência física; o nascimento espiritual nos traz à existência espiritual.

A regeneração é obra exclusiva de Deus. "Não por obras de justiça que nós tivéssemos feito, mas segundo a sua misericórdia, nos salvou mediante o lavar regenerador e renovador do Espírito Santo" (Tito 3:5).

Na regeneração, o Espírito remove o "coração de pedra" e dá um "coração de carne" (Ezequiel 36:26-27). Somos transformados em nosso interior, recebendo novos desejos, nova orientação, nova vida.

A regeneração é imediata, permanente e irreversível. Ocorre no momento da conversão e produz uma nova criatura (2 Coríntios 5:17). O crente genuíno tem evidências de nova vida: fé, arrependimento, amor a Deus e aos irmãos.`,
            references: "João 3:3-8, Tito 3:5, Ezequiel 36:26-27, 2 Coríntios 5:17, 1 João 2:29",
            questions: "O que é regeneração?\nPor que a regeneração é necessária?\nQuem realiza a regeneração?\nO que acontece na regeneração?\nQuais são as evidências de que alguém foi regenerado?",
            application: "Examine se há evidências do novo nascimento em sua vida: fé genuína, arrependimento, amor.",
            summary: "A regeneração é a obra do Espírito que nos dá nova vida espiritual, tornando-nos novas criaturas em Cristo.",
            estimatedMinutes: 25,
            order: 6
          },
          {
            id: "n1-es-7",
            title: "O Batismo e a Habitação do Espírito",
            content: `Quando uma pessoa crê em Cristo, ela é batizada no Espírito Santo e o Espírito passa a habitar nela. Esses são aspectos distintos, mas simultâneos, da obra do Espírito na salvação.

O batismo no Espírito (1 Coríntios 12:13) nos incorpora ao corpo de Cristo: "Em um só Espírito todos nós fomos batizados em um corpo." Isso acontece no momento da conversão, não é uma segunda experiência para alguns crentes.

A habitação do Espírito significa que o Espírito vive permanentemente no crente. "Não sabeis que sois santuário de Deus e que o Espírito de Deus habita em vós?" (1 Coríntios 3:16). "Se alguém não tem o Espírito de Cristo, esse tal não é dele" (Romanos 8:9).

A habitação é permanente: Jesus prometeu que o Espírito estaria "para sempre" com os discípulos (João 14:16). Isso contrasta com o AT, onde o Espírito podia ser retirado.

O Espírito que habita é o "penhor" (arrabōn) de nossa herança (Efésios 1:13-14), garantia de que Deus completará nossa salvação. Sua presença em nós é selo de nossa pertença a Deus.`,
            references: "1 Coríntios 12:13, Romanos 8:9, João 14:16-17, Efésios 1:13-14, 1 Coríntios 3:16",
            questions: "O que é o batismo no Espírito?\nQuando o batismo no Espírito acontece?\nO que significa a habitação do Espírito?\nQual a diferença em relação ao AT?\nO que significa o Espírito ser nosso 'penhor'?",
            application: "Agradeça que o Espírito habita permanentemente em você. Viva consciente de Sua presença.",
            summary: "Todo crente é batizado no Espírito (incorporado a Cristo) e habitado pelo Espírito (que vive nele permanentemente).",
            estimatedMinutes: 20,
            order: 7
          },
          {
            id: "n1-es-8",
            title: "O Fruto do Espírito",
            content: `Quando o Espírito habita em nós, Ele produz fruto em nosso caráter. "O fruto do Espírito é: amor, alegria, paz, longanimidade, benignidade, bondade, fidelidade, mansidão, domínio próprio" (Gálatas 5:22-23).

Observe que é "fruto" (singular), não "frutos". Essas nove qualidades formam um conjunto integrado, aspectos da semelhança com Cristo que o Espírito desenvolve em nós. Não escolhemos algumas; todas devem estar presentes.

O fruto contrasta com as "obras da carne" (Gálatas 5:19-21). As obras da carne vêm de nosso esforço carnal; o fruto vem da vida do Espírito em nós. Não produzimos o fruto por disciplina religiosa, mas permitindo que o Espírito trabalhe.

O crescimento no fruto é gradual, como em árvores. Requer tempo, sol (presença de Deus), água (Palavra), e poda (disciplina). Não ficamos frustrados por não termos fruto perfeito imediatamente, mas cooperamos com o Espírito.

O fruto é a evidência mais clara da vida cristã genuína. Dons espirituais podem ser imitados; fruto do caráter é produto autêntico do Espírito. "Pelos seus frutos os conhecereis" (Mateus 7:16).`,
            references: "Gálatas 5:16-25, João 15:1-8, Mateus 7:16-20, Romanos 8:5-6",
            questions: "O que é o fruto do Espírito?\nPor que é 'fruto' e não 'frutos'?\nQual a diferença entre fruto e obras da carne?\nComo o fruto é desenvolvido em nós?\nQual aspecto do fruto você mais precisa desenvolver?",
            application: "Peça ao Espírito que desenvolva cada aspecto do Seu fruto em você. Identifique uma área para focar esta semana.",
            summary: "O fruto do Espírito é o caráter de Cristo desenvolvido em nós pelo Espírito Santo: amor, alegria, paz, e mais.",
            estimatedMinutes: 25,
            order: 8
          },
          {
            id: "n1-es-9",
            title: "Os Dons do Espírito",
            content: `Além do fruto (caráter), o Espírito dá dons (capacitações para servir). Os dons são para edificação da Igreja, não para exibição pessoal.

As principais listas de dons estão em Romanos 12:6-8, 1 Coríntios 12:4-11 e 28-30, Efésios 4:11. Incluem: profecia, ensino, exortação, serviço, liderança, misericórdia, palavra de sabedoria, palavra de conhecimento, fé, cura, milagres, discernimento de espíritos, línguas, interpretação, apostolado, pastoreio, evangelismo.

Os dons são distribuídos segundo a vontade soberana do Espírito (1 Coríntios 12:11). Ninguém tem todos os dons; todos têm pelo menos um. "A cada um é dada a manifestação do Espírito para o proveito comum" (1 Coríntios 12:7).

Os dons sem amor são inúteis. Paulo enfatiza isso em 1 Coríntios 13, o "capítulo do amor", colocado entre os capítulos sobre dons. O amor é o contexto para exercer dons.

Os dons são para servir, não para status. A Igreja é um corpo, e cada membro é necessário. Não devemos desprezar nossos dons nem invejar os dos outros.`,
            references: "1 Coríntios 12:1-31, Romanos 12:3-8, Efésios 4:7-16, 1 Coríntios 13",
            questions: "O que são dons espirituais?\nOnde encontramos listas de dons no NT?\nQuem distribui os dons?\nQual é a relação entre dons e amor?\nVocê conhece seus dons? Como os usa para servir?",
            application: "Se ainda não sabe seus dons, peça sabedoria a Deus e comece a servir em diferentes áreas da igreja.",
            summary: "Os dons espirituais são capacitações dadas pelo Espírito para servir a Igreja, a serem usados com amor.",
            estimatedMinutes: 25,
            order: 9
          },
          {
            id: "n1-es-10",
            title: "Andando no Espírito",
            content: `A vida cristã é uma caminhada diária no poder do Espírito. "Andai no Espírito e jamais satisfareis à concupiscência da carne" (Gálatas 5:16). Não somos chamados apenas a ter o Espírito, mas a andar no Espírito.

Andar no Espírito significa viver em dependência contínua dEle. Não se trata de um momento de êxtase, mas de uma orientação de vida. Ele dirige, nós seguimos. Ele capacita, nós obedecemos.

Isso envolve não entristecer o Espírito (Efésios 4:30) pelo pecado, e não apagar o Espírito (1 Tessalonicenses 5:19) resistindo à Sua direção. Também envolve ser cheios do Espírito (Efésios 5:18), uma ordem que implica submissão contínua ao Seu controle.

Andar no Espírito produz vitória sobre a carne, fruto de caráter, poder para testemunho, discernimento, oração eficaz, e comunhão com Deus.

Praticamente, isso significa começar cada dia entregando-se ao Espírito, mantendo uma atitude de oração, obedecendo prontamente às convicções que Ele traz, e enchendo-se da Palavra que Ele usa.`,
            references: "Gálatas 5:16-25, Efésios 4:30, Efésios 5:18, 1 Tessalonicenses 5:19, Romanos 8:14",
            questions: "O que significa andar no Espírito?\nComo podemos entristecer o Espírito?\nComo podemos apagar o Espírito?\nO que significa ser cheio do Espírito?\nQuais são os resultados de andar no Espírito?",
            application: "Comece cada dia pedindo para ser cheio do Espírito. Durante o dia, mantenha-se sensível à Sua direção.",
            summary: "Andar no Espírito é viver em dependência contínua dEle, obedecendo Sua direção e sendo cheio de Sua presença.",
            estimatedMinutes: 25,
            order: 10
          }
        ]
      }
    ]
  },

  // MÓDULO 1.7 - FUNDAMENTOS DA VIDA CRISTÃ
  {
    id: "n1-vida-crista",
    name: "Fundamentos da Vida Cristã",
    description: "Os pilares da fé prática: arrependimento, fé, conversão, justificação, santificação e glorificação.",
    icon: "heart",
    color: "#E74C3C",
    order: 7,
    tracks: [
      {
        id: "n1-vida-track",
        level: "iniciante",
        name: "Vida em Cristo",
        description: "Os fundamentos práticos da fé",
        requiredPlan: "gold",
        order: 1,
        lessons: [
          {
            id: "n1-vida-1",
            title: "O Que é o Evangelho?",
            content: `O Evangelho (do grego euangelion, "boa notícia") é a mensagem central do cristianismo. Paulo resume: "Cristo morreu pelos nossos pecados, segundo as Escrituras, foi sepultado, e ressuscitou ao terceiro dia, segundo as Escrituras" (1 Coríntios 15:3-4).

O Evangelho responde ao problema humano mais fundamental: o pecado que nos separa de Deus. Todos pecaram e estão destituídos da glória de Deus (Romanos 3:23). A consequência do pecado é morte e condenação eterna (Romanos 6:23).

A boa notícia é que Deus fez o que não podíamos fazer. Ele enviou Seu Filho para morrer em nosso lugar, levando a punição que merecíamos. Pela fé em Cristo, somos perdoados e reconciliados com Deus.

O Evangelho não é conselho ("faça isso para ser melhor"), mas anúncio ("Cristo fez isso por você"). Não é moralismo ("seja bom para agradar a Deus"), mas graça ("Deus o ama mesmo sendo mau"). A resposta apropriada é arrependimento e fé.

O Evangelho é "poder de Deus para a salvação" (Romanos 1:16). Quando pregado, o Espírito Santo trabalha em corações para produzir fé e transformação. Não temos outro caminho de salvação.`,
            references: "1 Coríntios 15:1-4, Romanos 1:16-17, Romanos 3:23-26, Romanos 6:23, Efésios 2:8-9",
            questions: "O que significa 'evangelho'?\nQual é o conteúdo central do Evangelho?\nQual problema o Evangelho resolve?\nO que Deus fez por nós no Evangelho?\nComo você explicaria o Evangelho a alguém?",
            application: "Pratique articular o Evangelho em uma ou duas frases. Esteja pronto para compartilhá-lo.",
            summary: "O Evangelho é a boa notícia de que Cristo morreu pelos pecadores e ressuscitou, oferecendo salvação pela fé.",
            estimatedMinutes: 20,
            order: 1
          },
          {
            id: "n1-vida-2",
            title: "O Arrependimento Bíblico",
            content: `O arrependimento é a mudança de mente e direção em relação ao pecado e a Deus. Não é apenas sentir remorso, mas uma transformação profunda que leva a uma nova maneira de viver.

A palavra grega para arrependimento é metanoia, literalmente "mudar de mente". Envolve reconhecer o pecado como ofensa contra Deus, sentir tristeza genuína por isso (não apenas pelas consequências), e voltar-se para Deus em fé.

João Batista pregou: "Arrependei-vos, porque está próximo o reino dos céus" (Mateus 3:2). Jesus começou Seu ministério com a mesma mensagem (Marcos 1:15). Os apóstolos pregaram arrependimento (Atos 2:38; 17:30).

O arrependimento genuíno produz frutos (Mateus 3:8). Mudança de comportamento, confissão do pecado, restituição quando possível, e uma nova orientação de vida. Arrependimento sem mudança é falso.

O arrependimento é um dom de Deus (Atos 11:18; 2 Timóteo 2:25), mas também é responsabilidade humana. Deus o concede; nós devemos exercê-lo. É tanto inicial (na conversão) quanto contínuo (ao longo da vida cristã).`,
            references: "Marcos 1:15, Atos 2:38, 2 Coríntios 7:9-10, Atos 26:20, Lucas 15:7",
            questions: "O que é arrependimento bíblico?\nQual a diferença entre remorso e arrependimento?\nQuais são os elementos do arrependimento?\nQuais são os frutos do arrependimento?\nEm que você precisa se arrepender hoje?",
            application: "Examine sua vida. Há pecado do qual você precisa se arrepender? Confesse a Deus e volte-se para Ele.",
            summary: "Arrependimento é a mudança de mente e direção em relação ao pecado, voltando-se para Deus em fé.",
            estimatedMinutes: 20,
            order: 2
          },
          {
            id: "n1-vida-3",
            title: "A Fé Salvífica",
            content: `A fé é o instrumento pelo qual recebemos a salvação em Cristo. "Pela graça sois salvos, mediante a fé, e isto não vem de vós, é dom de Deus" (Efésios 2:8).

A fé bíblica tem três componentes: conhecimento (notitia), assentimento (assensus) e confiança (fiducia). Precisamos conhecer os fatos do Evangelho, aceitar que são verdadeiros, e então confiar pessoalmente em Cristo para salvação.

A fé salvífica não é mero assentimento intelectual. Tiago diz que os demônios também creem que Deus é um, e estremecem (Tiago 2:19). A fé genuína envolve entrega pessoal a Cristo.

O objeto da fé é mais importante que a intensidade da fé. Fé pequena em Cristo salva; fé grande em objeto errado não salva. O que importa é EM QUEM cremos.

A fé vem pelo ouvir a Palavra de Deus (Romanos 10:17). Ela é dom de Deus (Efésios 2:8), mas exercida por nós. Não somos passivos: cremos ativamente. A fé sem obras está morta (Tiago 2:17), não porque obras salvam, mas porque fé genuína produz obediência.`,
            references: "Efésios 2:8-9, Romanos 10:9-17, Hebreus 11:1,6, Tiago 2:14-26, João 3:16",
            questions: "O que é fé salvífica?\nQuais são os componentes da fé bíblica?\nPor que o objeto da fé é mais importante que sua intensidade?\nComo a fé se relaciona com obras?\nSua fé é genuína confiança em Cristo?",
            application: "Examine se sua fé vai além de conhecimento intelectual para confiança pessoal em Cristo.",
            summary: "A fé salvífica é conhecer o Evangelho, aceitar sua verdade, e confiar pessoalmente em Cristo para salvação.",
            estimatedMinutes: 25,
            order: 3
          },
          {
            id: "n1-vida-4",
            title: "A Justificação pela Fé",
            content: `A justificação é o ato de Deus pelo qual Ele declara o pecador justo com base na obra de Cristo, recebida pela fé. É uma declaração legal, não uma transformação moral (isso é santificação).

Paulo ensina: "Sendo justificados gratuitamente, por sua graça, mediante a redenção que há em Cristo Jesus" (Romanos 3:24). Não somos justificados por obras ou mérito, mas pela graça de Deus.

A base da justificação é a justiça de Cristo imputada (creditada) a nós. Nossos pecados foram imputados a Cristo na cruz; Sua justiça é imputada a nós pela fé. "Aquele que não conheceu pecado, ele o fez pecado por nós; para que nele fôssemos feitos justiça de Deus" (2 Coríntios 5:21).

A justificação é instantânea e completa no momento da fé. Não ficamos "mais justificados" com o tempo. Somos declarados justos de uma vez por todas.

A justificação traz paz com Deus (Romanos 5:1), acesso à graça (Romanos 5:2), e certeza de glorificação futura (Romanos 8:30). É o fundamento inabalável da segurança do crente.`,
            references: "Romanos 3:21-26, Romanos 4:1-8, Romanos 5:1-2, 2 Coríntios 5:21, Gálatas 2:16",
            questions: "O que é justificação?\nQual é a base da justificação?\nComo a justiça de Cristo se torna nossa?\nPor que a justificação é diferente de santificação?\nComo a justificação afeta sua segurança?",
            application: "Descanse na verdade de que você é declarado justo em Cristo, não por seus méritos.",
            summary: "Justificação é a declaração divina de que somos justos com base na obra de Cristo, recebida pela fé.",
            estimatedMinutes: 25,
            order: 4
          },
          {
            id: "n1-vida-5",
            title: "A Adoção como Filhos de Deus",
            content: `Além de sermos perdoados e declarados justos, Deus nos adota como Seus filhos. A adoção nos dá uma nova identidade e um novo relacionamento com Deus como Pai.

Paulo escreve: "Vocês não receberam um espírito que os escravize para viverem com medo, mas receberam o Espírito que os adota como filhos, por meio do qual clamamos: 'Aba, Pai'" (Romanos 8:15).

A adoção nos torna herdeiros de Deus e co-herdeiros com Cristo (Romanos 8:17). Toda a herança que pertence a Cristo como Filho eterno é compartilhada conosco por graça.

Como filhos, temos acesso ao Pai em oração. Podemos chamá-Lo de "Aba" (expressão íntima, como "Papai"). Ele cuida de nós como Pai amoroso (Mateus 6:25-34), disciplina-nos para nosso bem (Hebreus 12:5-11), e prepara um lugar para nós (João 14:2).

A adoção nos coloca em uma família – a Igreja. Os outros crentes são nossos irmãos e irmãs. Não somos filhos únicos, mas parte de uma grande família com Deus como nosso Pai comum.`,
            references: "Romanos 8:14-17, Gálatas 4:4-7, Efésios 1:5, João 1:12-13, 1 João 3:1-2",
            questions: "O que é adoção espiritual?\nO que significa ser herdeiro de Deus?\nComo a adoção afeta nossa oração?\nComo Deus nos trata como Pai?\nComo a adoção afeta nosso relacionamento com outros crentes?",
            application: "Ao orar, aproxime-se de Deus como seu Pai amoroso. Reflita na segurança que isso traz.",
            summary: "Pela adoção, somos filhos de Deus com acesso ao Pai, herança em Cristo, e pertença à família da fé.",
            estimatedMinutes: 20,
            order: 5
          },
          {
            id: "n1-vida-6",
            title: "A Santificação Progressiva",
            content: `A santificação é o processo pelo qual somos tornados santos na prática. Enquanto a justificação é instantânea, a santificação é progressiva, continuando ao longo de toda a vida cristã.

A santificação tem três aspectos: posicional (já somos santos em Cristo), progressiva (estamos sendo santificados na prática), e final (seremos perfeitamente santos na glorificação).

Na santificação progressiva, o Espírito Santo trabalha em nós para nos conformar à imagem de Cristo (Romanos 8:29). Ele produz fruto em nosso caráter, mortifica o pecado, e nos capacita para a obediência.

Embora seja obra de Deus, nossa cooperação é necessária. "Desenvolvei a vossa salvação com temor e tremor, porque Deus é quem efetua em vós tanto o querer como o realizar" (Filipenses 2:12-13). Trabalhamos PORQUE Deus trabalha em nós.

Os meios de santificação incluem a Palavra de Deus (João 17:17), a oração, a comunhão cristã, a disciplina da Igreja, os sacramentos, e as provações. Deus usa circunstâncias para nos moldar.`,
            references: "1 Tessalonicenses 4:3, Hebreus 12:14, Romanos 6:1-14, Filipenses 2:12-13, 2 Pedro 3:18",
            questions: "O que é santificação?\nQuais são os três aspectos da santificação?\nComo Deus e nós cooperamos na santificação?\nQuais são os meios de santificação?\nEm que área você está crescendo em santidade?",
            application: "Identifique um pecado recorrente e, com a ajuda do Espírito, trabalhe para mortificá-lo.",
            summary: "A santificação é o processo contínuo pelo qual somos tornados santos na prática, obra do Espírito com nossa cooperação.",
            estimatedMinutes: 25,
            order: 6
          },
          {
            id: "n1-vida-7",
            title: "A Perseverança dos Santos",
            content: `A perseverança dos santos é a doutrina de que aqueles verdadeiramente salvos permanecerão na fé até o fim. Deus preserva Seu povo; eles não se perdem.

Jesus prometeu: "Eu lhes dou a vida eterna; jamais perecerão, e ninguém as arrebatará da minha mão" (João 10:28). Paulo declara: "Aquele que começou boa obra em vós há de completá-la até ao dia de Cristo Jesus" (Filipenses 1:6).

A perseverança não significa que crentes nunca pecam ou vacilam. Pedro negou a Cristo, mas foi restaurado. A perseverança significa que o crente genuíno não abandona permanentemente a fé.

Se alguém abandona a fé completamente, isso demonstra que nunca foi verdadeiramente regenerado (1 João 2:19): "Saíram de nós, mas não eram de nós; porque, se tivessem sido de nós, teriam permanecido conosco."

A perseverança é graça, não presunção. Não devemos dizer: "Estou salvo, posso pecar à vontade." Antes, a certeza da salvação produz gratidão e santidade. Aqueles que Deus guarda também são chamados a se guardar (Judas 21).`,
            references: "João 10:27-29, Romanos 8:28-39, Filipenses 1:6, 1 João 2:19, Judas 21,24",
            questions: "O que é a perseverança dos santos?\nQue promessas bíblicas garantem nossa segurança?\nComo explicar aqueles que 'abandonam' a fé?\nComo perseverança difere de presunção?\nComo essa doutrina lhe traz conforto?",
            application: "Descanse na certeza de que Deus completará a obra que começou em você.",
            summary: "Deus preserva Seu povo na fé até o fim, garantindo que os verdadeiramente salvos jamais se percam.",
            estimatedMinutes: 25,
            order: 7
          },
          {
            id: "n1-vida-8",
            title: "A Glorificação Final",
            content: `A glorificação é o estágio final da salvação, quando seremos completamente transformados à imagem de Cristo. Acontecerá na ressurreição, quando Cristo voltar.

Paulo descreve a esperança: "Amados, agora somos filhos de Deus, e ainda não se manifestou o que haveremos de ser. Sabemos que, quando ele se manifestar, seremos semelhantes a ele, porque haveremos de vê-lo como ele é" (1 João 3:2).

Na glorificação, receberemos corpos ressurretos, livres de doença, dor e morte. "O que se semeia na corrupção ressuscita na incorrupção... Semeia-se corpo natural, ressuscita corpo espiritual" (1 Coríntios 15:42-44).

O pecado será completamente erradicado. Não haverá mais tentação, mais luta, mais queda. Seremos perfeitamente santos, não apenas em posição, mas na prática eterna.

A glorificação é certa para todo o que crê. "Aos que predestinou, a esses também chamou; e aos que chamou, a esses também justificou; e aos que justificou, a esses também glorificou" (Romanos 8:30). Note o tempo passado: para Deus, já está garantido.`,
            references: "Romanos 8:18-23,30, 1 Coríntios 15:35-58, Filipenses 3:20-21, 1 João 3:2",
            questions: "O que é glorificação?\nQuando a glorificação acontecerá?\nComo serão nossos corpos ressurretos?\nO que acontecerá com o pecado na glorificação?\nComo essa esperança afeta sua vida hoje?",
            application: "Quando enfrentar dificuldades, lembre-se da glória futura que o aguarda.",
            summary: "Na glorificação, receberemos corpos ressurretos e seremos perfeitamente conformados à imagem de Cristo.",
            estimatedMinutes: 20,
            order: 8
          },
          {
            id: "n1-vida-9",
            title: "A Certeza da Salvação",
            content: `Podemos ter certeza de nossa salvação? A Bíblia diz que sim. "Estas coisas vos escrevi, a vós que credes no nome do Filho de Deus, para que saibais que tendes a vida eterna" (1 João 5:13).

A certeza se baseia em três pilares: a Palavra de Deus (promessas objetivas), o testemunho do Espírito (confirmação interna), e o fruto da fé (evidências externas).

A Palavra promete salvação a quem crê (João 3:16; Romanos 10:9). Se cremos, a Palavra nos assegura: somos salvos.

O Espírito testifica com nosso espírito que somos filhos de Deus (Romanos 8:16). Há uma confirmação interior que o Espírito dá aos crentes.

O fruto da fé confirma a genuinidade. Se amamos os irmãos (1 João 3:14), praticamos a justiça (1 João 2:29), e guardamos os mandamentos (1 João 2:3), temos evidência de vida espiritual.

Dúvidas podem surgir, especialmente após pecado ou em provações. Mas a dúvida não invalida a salvação. Devemos voltar às promessas, buscar o Senhor, e perseverar. Deus não rejeita quem O busca sinceramente.`,
            references: "1 João 5:13, Romanos 8:16, 2 Coríntios 13:5, 1 João 2:3-6, 2 Pedro 1:10",
            questions: "É possível ter certeza da salvação?\nQuais são os pilares da certeza?\nO que as promessas de Deus garantem?\nComo o Espírito testifica nossa salvação?\nQuais evidências confirmam a fé genuína?",
            application: "Se você luta com dúvidas, examine as promessas da Palavra e as evidências de vida espiritual em você.",
            summary: "Podemos ter certeza da salvação baseada nas promessas de Deus, no testemunho do Espírito, e no fruto da fé.",
            estimatedMinutes: 25,
            order: 9
          },
          {
            id: "n1-vida-10",
            title: "Vivendo pela Graça",
            content: `A vida cristã começa, continua e se completa pela graça. "Porque a graça de Deus se manifestou salvadora a todos os homens, educando-nos para que... vivamos neste presente século de modo sóbrio, justo e piedoso" (Tito 2:11-12).

A graça não apenas nos salva, mas nos transforma. Não ficamos ociosos dizendo "estou salvo"; a graça nos motiva a viver para a glória de Deus. Paulo trabalhava arduamente, mas "não eu, mas a graça de Deus que está comigo" (1 Coríntios 15:10).

Viver pela graça significa descansar na obra de Cristo, não em nosso desempenho. Significa ser motivado pelo amor, não pelo medo. Significa olhar para frente com esperança, não para trás com culpa.

A graça nos liberta do legalismo (regras para ganhar favor) e do licenciosidade (liberdade para pecar). O evangelho da graça produz verdadeira santidade, vinda de dentro, pelo Espírito.

Recebemos graça continuamente: "Cheguemo-nos, pois, confiadamente ao trono da graça, a fim de recebermos misericórdia e acharmos graça para socorro em ocasião oportuna" (Hebreus 4:16). A vida cristã é uma caminhada constante na graça.`,
            references: "Tito 2:11-14, 2 Coríntios 12:9, Hebreus 4:16, 1 Coríntios 15:10, Romanos 5:20-21",
            questions: "O que significa viver pela graça?\nComo a graça nos transforma?\nComo a graça nos liberta do legalismo?\nComo a graça nos protege da licenciosidade?\nEm que você precisa recorrer mais à graça de Deus?",
            application: "Quando falhar, não desanime; corra para o trono da graça. Quando triunfar, agradeça a graça que operou em você.",
            summary: "A vida cristã é vivida pela graça: recebida na salvação, aplicada na santificação, e consumada na glorificação.",
            estimatedMinutes: 25,
            order: 10
          }
        ]
      }
    ]
  },

  // MÓDULO 1.8 - A IGREJA: CORPO DE CRISTO
  {
    id: "n1-igreja",
    name: "A Igreja: Corpo de Cristo",
    description: "Natureza, propósito, governo e ordenanças da Igreja, o povo de Deus no mundo.",
    icon: "users",
    color: "#9B59B6",
    order: 8,
    tracks: [
      {
        id: "n1-igreja-track",
        level: "iniciante",
        name: "A Comunidade da Fé",
        description: "Entendendo a Igreja de Cristo",
        requiredPlan: "gold",
        order: 1,
        lessons: [
          {
            id: "n1-igr-1",
            title: "O Que é a Igreja?",
            content: `A palavra "igreja" vem do grego ekklesia, que significa "assembleia" ou "os chamados para fora". No NT, refere-se à comunidade daqueles que creem em Jesus Cristo.

A Igreja existe em dois sentidos: a Igreja universal (todos os crentes de todos os tempos e lugares) e a igreja local (uma congregação específica de crentes em determinado lugar).

A Igreja não é um edifício, uma organização, ou uma denominação. É um organismo vivo, o povo de Deus. Jesus disse: "Onde estiverem dois ou três reunidos em meu nome, ali estou no meio deles" (Mateus 18:20).

A Igreja é descrita com várias metáforas: o Corpo de Cristo (enfatizando unidade e diversidade), a Noiva de Cristo (enfatizando amor e devoção), o Templo do Espírito (enfatizando a habitação de Deus), o rebanho de Deus (enfatizando cuidado pastoral), a família de Deus (enfatizando relacionamento).

Cristo é a cabeça da Igreja (Efésios 1:22-23). Ela pertence a Ele; Ele a lidera; Ele morreu por ela. A Igreja não é nossa para fazermos o que queremos, mas dEle para fazermos Sua vontade.`,
            references: "Mateus 16:18, Efésios 1:22-23, 1 Coríntios 12:12-27, 1 Pedro 2:9-10, Efésios 5:25-27",
            questions: "O que significa 'ekklesia'?\nQual a diferença entre Igreja universal e local?\nQuais metáforas a Bíblia usa para a Igreja?\nQuem é a cabeça da Igreja?\nComo você vê a Igreja – organização ou organismo?",
            application: "Reflita sobre seu lugar na Igreja. Você está conectado a uma congregação local?",
            summary: "A Igreja é a comunidade dos crentes em Cristo, Seu Corpo, sobre o qual Ele é a Cabeça.",
            estimatedMinutes: 20,
            order: 1
          },
          {
            id: "n1-igr-2",
            title: "A Fundação da Igreja",
            content: `Jesus Cristo é o fundamento da Igreja. Paulo escreveu: "Ninguém pode lançar outro fundamento além do que já está posto, o qual é Jesus Cristo" (1 Coríntios 3:11).

A Igreja foi edificada sobre "o fundamento dos apóstolos e profetas, sendo Cristo Jesus a pedra angular" (Efésios 2:20). Os apóstolos e profetas do NT lançaram o fundamento doutrinário; Cristo é a pedra angular que orienta todo o edifício.

Jesus prometeu: "Sobre esta pedra edificarei a minha igreja, e as portas do Hades não prevalecerão contra ela" (Mateus 16:18). A "pedra" é a confissão de Pedro de que Jesus é "o Cristo, o Filho do Deus vivo" (16:16). A Igreja é edificada sobre esta verdade.

A Igreja nasceu historicamente no Pentecostes (Atos 2), quando o Espírito Santo foi derramado sobre os discípulos. Desde então, a Igreja cresce à medida que pessoas são acrescentadas por Deus (Atos 2:47).

A Igreja tem continuidade com Israel, sendo o povo de Deus, mas também é distinta. O NT fala de "uma nova humanidade" (Efésios 2:15) composta de judeus e gentios unidos em Cristo.`,
            references: "1 Coríntios 3:11, Efésios 2:19-22, Mateus 16:16-18, Atos 2:41-47",
            questions: "Qual é o fundamento da Igreja?\nO que significa Cristo ser a 'pedra angular'?\nQuando a Igreja nasceu historicamente?\nComo a Igreja se relaciona com Israel?\nPor que a promessa de que 'as portas do Hades não prevalecerão' é encorajadora?",
            application: "Agradeça que você faz parte de uma comunidade que Cristo prometeu que permanecerá.",
            summary: "A Igreja está edificada sobre Cristo, a pedra angular, fundada sobre a verdade apostólica desde o Pentecostes.",
            estimatedMinutes: 20,
            order: 2
          },
          {
            id: "n1-igr-3",
            title: "A Missão da Igreja",
            content: `Jesus deu à Igreja uma missão clara: "Ide, portanto, fazei discípulos de todas as nações, batizando-os em nome do Pai, e do Filho, e do Espírito Santo, ensinando-os a guardar todas as coisas que vos tenho ordenado" (Mateus 28:19-20).

A missão tem três dimensões: alcançar (evangelismo), batizar (incorporar à comunidade), e ensinar (discipulado). Não basta ganhar convertidos; devemos fazer discípulos maduros.

Verticalmente, a Igreja existe para adorar a Deus. "Vós sois... povo de propriedade exclusiva de Deus, a fim de proclamardes as virtudes daquele que vos chamou" (1 Pedro 2:9). A adoração é nosso propósito primário.

Horizontalmente, a Igreja existe para edificar os crentes. "Consideremo-nos uns aos outros, para nos estimularmos ao amor e às boas obras" (Hebreus 10:24). Os dons espirituais são para edificação mútua (1 Coríntios 14:26).

Externamente, a Igreja existe para testemunhar ao mundo. Somos "sal da terra" e "luz do mundo" (Mateus 5:13-14). Isso inclui proclamar o Evangelho e demonstrá-lo em vida e boas obras.`,
            references: "Mateus 28:18-20, Atos 1:8, 1 Pedro 2:9-12, Efésios 4:11-16, Mateus 5:13-16",
            questions: "Qual é a Grande Comissão?\nQuais são as três dimensões da missão da Igreja?\nQual é o propósito vertical da Igreja?\nQual é o propósito horizontal?\nComo você participa na missão?",
            application: "Identifique como você pode participar mais ativamente na missão da Igreja: adoração, edificação ou evangelismo.",
            summary: "A Igreja existe para adorar a Deus, edificar os santos e testemunhar ao mundo, fazendo discípulos de todas as nações.",
            estimatedMinutes: 25,
            order: 3
          },
          {
            id: "n1-igr-4",
            title: "Os Sinais da Verdadeira Igreja",
            content: `Nem tudo que se chama "igreja" é verdadeiramente igreja de Cristo. A Reforma Protestante identificou marcas (sinais) da verdadeira igreja para distingui-la de falsas expressões.

A primeira marca é a pregação fiel da Palavra de Deus. Onde a Escritura é fielmente ensinada como autoridade final, ali está a Igreja. Onde a Palavra é distorcida ou substituída por tradições humanas, a Igreja se corrompe.

A segunda marca é a administração correta dos sacramentos (batismo e Ceia). Esses sinais visíveis da graça, instituídos por Cristo, devem ser observados segundo a instituição bíblica.

A terceira marca (adicionada por alguns reformadores) é o exercício da disciplina. A Igreja deve manter pureza doutrinária e ética, corrigindo em amor aqueles que erram e excomungando os impenitentes (Mateus 18:15-18).

Onde essas marcas estão presentes, podemos ter confiança de que é uma igreja verdadeira, ainda que imperfeita. Onde estão ausentes, devemos ser cautelosos. A Igreja não é perfeita nesta vida, mas deve ser fiel a Cristo.`,
            references: "Atos 2:42, 1 Timóteo 3:15, Mateus 18:15-20, 1 Coríntios 11:23-26, Tito 1:9",
            questions: "Por que precisamos de marcas da verdadeira Igreja?\nQual é a primeira marca da Igreja?\nPor que os sacramentos são importantes?\nPor que a disciplina é necessária?\nSua igreja local tem essas marcas?",
            application: "Avalie se sua igreja local tem as marcas de uma igreja verdadeira. Se tiver, agradeça; se não, ore por reforma.",
            summary: "Os sinais da verdadeira Igreja são a pregação fiel da Palavra, a administração correta dos sacramentos, e a disciplina amorosa.",
            estimatedMinutes: 25,
            order: 4
          },
          {
            id: "n1-igr-5",
            title: "A Comunhão dos Santos",
            content: `A comunhão (koinonia) dos santos é o compartilhamento de vida entre crentes. Não somos cristãos solitários; pertencemos uns aos outros no corpo de Cristo.

A igreja primitiva "perseverava na doutrina dos apóstolos e na comunhão, no partir do pão e nas orações" (Atos 2:42). A comunhão não era opcional, mas essencial.

A comunhão tem dimensão espiritual: compartilhamos o mesmo Espírito, a mesma fé, a mesma esperança. Somos membros uns dos outros (Romanos 12:5).

A comunhão tem dimensão prática: os primeiros cristãos "repartiam com todos, segundo a necessidade de cada um" (Atos 2:45). Amor fraternal se expressa em atos concretos (1 João 3:17-18).

Os "uns aos outros" do NT mostram a vida em comunhão: amar uns aos outros, servir uns aos outros, encorajar uns aos outros, suportar uns aos outros, perdoar uns aos outros, confessar pecados uns aos outros, orar uns pelos outros. Cristianismo é vida comunitária.`,
            references: "Atos 2:42-47, Romanos 12:4-5, 1 João 1:3,7, Hebreus 10:24-25, Gálatas 6:2",
            questions: "O que é koinonia?\nComo a igreja primitiva praticava comunhão?\nQual a dimensão espiritual da comunhão?\nQual a dimensão prática?\nComo você pratica os 'uns aos outros' na sua igreja?",
            application: "Escolha um 'uns aos outros' para praticar intencionalmente esta semana: encorajar, servir, orar por um irmão.",
            summary: "A comunhão dos santos é o compartilhamento de vida espiritual e prática entre crentes no corpo de Cristo.",
            estimatedMinutes: 20,
            order: 5
          },
          {
            id: "n1-igr-6",
            title: "A Liderança na Igreja: Presbíteros e Diáconos",
            content: `Cristo governa Sua Igreja através de líderes humanos. O NT menciona dois ofícios principais: presbíteros (anciãos/pastores) e diáconos.

Os presbíteros são chamados para governar, ensinar e pastorear. O NT usa três termos intercambiavelmente: presbítero (ancião, enfatizando maturidade), bispo (supervisor, enfatizando supervisão), e pastor (enfatizando cuidado). As qualificações estão em 1 Timóteo 3:1-7 e Tito 1:5-9.

Os diáconos (do grego diakonos, "servo") servem nas necessidades práticas da Igreja, liberando os presbíteros para oração e ministério da Palavra (Atos 6:1-7). Suas qualificações estão em 1 Timóteo 3:8-13.

Diferentes tradições organizam esses ofícios de formas diversas (episcopado, presbiterato, congregacionalismo). O essencial é que haja liderança qualificada, plural quando possível, e exercida com humildade.

Os líderes da Igreja devem ser exemplos para o rebanho (1 Pedro 5:3), não senhores tirânicos. Eles prestarão contas a Deus pelo cuidado das almas (Hebreus 13:17). Os membros devem obedecer a líderes piedosos e orar por eles.`,
            references: "1 Timóteo 3:1-13, Tito 1:5-9, Atos 20:17-31, 1 Pedro 5:1-4, Hebreus 13:17",
            questions: "Quais são os ofícios mencionados no NT?\nQuais são os termos usados para presbíteros?\nQual é a função dos diáconos?\nQuais são as qualificações para liderança?\nComo você pode apoiar os líderes da sua igreja?",
            application: "Ore pelos líderes da sua igreja local, que levam a séria responsabilidade de cuidar do rebanho de Deus.",
            summary: "A Igreja é liderada por presbíteros (pastores/anciãos) e servida por diáconos, qualificados segundo as Escrituras.",
            estimatedMinutes: 25,
            order: 6
          },
          {
            id: "n1-igr-7",
            title: "O Batismo: Sacramento da Iniciação",
            content: `O batismo é o sacramento de iniciação na Igreja. Jesus ordenou: "batizando-os em nome do Pai, e do Filho, e do Espírito Santo" (Mateus 28:19). É um ato de obediência para todo crente.

O batismo simboliza a união com Cristo em Sua morte e ressurreição. "Fomos sepultados com ele pelo batismo na morte, para que, como Cristo foi ressuscitado dentre os mortos pela glória do Pai, assim também andemos nós em novidade de vida" (Romanos 6:4).

O batismo não salva; é sinal da salvação já recebida pela fé. Assim como a circuncisão não salvava no AT, mas era sinal da aliança, o batismo é sinal da nova aliança em Cristo.

O batismo é público, declarando nossa identificação com Cristo e Sua Igreja. É uma confissão visível de fé. A igreja primitiva batizava prontamente após a conversão (Atos 2:41; 8:36-38).

Cristãos discordam sobre modo (imersão, aspersão) e sujeitos (crentes apenas ou também filhos de crentes). Mas todos concordam que o batismo é ordenança de Cristo, importante e significativa.`,
            references: "Mateus 28:19, Romanos 6:3-5, Colossenses 2:12, Atos 2:38-41, 1 Pedro 3:21",
            questions: "Quem ordenou o batismo?\nO que o batismo simboliza?\nO batismo salva?\nPor que o batismo é público?\nVocê já foi batizado após sua conversão?",
            application: "Se você creu em Cristo mas ainda não foi batizado, converse com seu pastor sobre dar esse passo de obediência.",
            summary: "O batismo é o sacramento de iniciação, simbolizando nossa união com Cristo e incorporação visível à Sua Igreja.",
            estimatedMinutes: 20,
            order: 7
          },
          {
            id: "n1-igr-8",
            title: "A Ceia do Senhor: Comunhão com Cristo e Seu Povo",
            content: `A Ceia do Senhor (também chamada Eucaristia, Comunhão, ou Partir do Pão) foi instituída por Jesus na noite em que foi traído. É um memorial de Sua morte até que Ele venha.

Jesus disse: "Fazei isto em memória de mim" (Lucas 22:19). O pão representa Seu corpo oferecido; o cálice, Seu sangue derramado pela nova aliança. Ao participar, proclamamos Sua morte (1 Coríntios 11:26).

A Ceia é um meio de graça. Nela, encontramos comunhão espiritual com Cristo e uns com os outros. Não é mera recordação, mas encontro real com o Senhor, embora simbólico (não cremos em transubstanciação).

A Ceia requer autoexame (1 Coríntios 11:28). Devemos participar com reverência, discernindo o corpo (reconhecendo o significado) e em unidade com os irmãos. Participar indignamente traz juízo.

A Ceia aponta para o futuro: "até que ele venha" (1 Coríntios 11:26). Cada vez que participamos, celebramos o passado (cruz), vivemos o presente (comunhão), e antecipamos o futuro (banquete no Reino).`,
            references: "Lucas 22:14-20, 1 Coríntios 11:23-34, Mateus 26:26-29, Atos 2:42",
            questions: "Quem instituiu a Ceia do Senhor?\nO que o pão e o cálice representam?\nO que significa 'discernir o corpo'?\nPor que é necessário autoexame?\nPara que a Ceia aponta no futuro?",
            application: "Prepare seu coração antes da próxima Ceia com exame sincero, arrependimento e gratidão pelo sacrifício de Cristo.",
            summary: "A Ceia do Senhor é memorial da morte de Cristo, meio de comunhão, e antecipação de Sua volta.",
            estimatedMinutes: 20,
            order: 8
          },
          {
            id: "n1-igr-9",
            title: "A Disciplina na Igreja",
            content: `A disciplina eclesiástica é o cuidado pastoral da Igreja para manter pureza doutrinária e ética entre seus membros. Não é punição cruel, mas amor corretivo.

Jesus deu instruções em Mateus 18:15-18: confrontação privada, depois com testemunhas, depois diante da Igreja, e finalmente exclusão do impenitente. O objetivo é sempre restauração (Gálatas 6:1).

A disciplina protege a honra de Cristo, a pureza da Igreja, o próprio pecador (que pode ser despertado para arrependimento), e outros que podem ser tentados a pecar.

A disciplina trata de pecados graves e persistentes, não falhas comuns. Diferenciamos entre debilidades (precisam encorajamento) e rebelião (precisa confrontação). E sempre com humildade, "olhando cada um para si mesmo" (Gálatas 6:1).

O objetivo final é restauração, não rejeição permanente. Quando há arrependimento, a Igreja deve perdoar, consolar e confirmar o amor (2 Coríntios 2:7-8). A disciplina bem praticada fortalece a Igreja.`,
            references: "Mateus 18:15-20, 1 Coríntios 5:1-13, Gálatas 6:1-2, 2 Coríntios 2:5-11, Hebreus 12:5-11",
            questions: "O que é disciplina eclesiástica?\nQuais são os passos de Mateus 18?\nQual é o objetivo da disciplina?\nQue pecados requerem disciplina formal?\nComo a Igreja deve responder ao arrependimento?",
            application: "Se há pecado oculto em sua vida, confesse antes que se torne necessária disciplina. Busque ajuda pastoral.",
            summary: "A disciplina eclesiástica é cuidado pastoral amoroso para restaurar pecadores e manter a pureza da Igreja.",
            estimatedMinutes: 25,
            order: 9
          },
          {
            id: "n1-igr-10",
            title: "A Unidade da Igreja",
            content: `Jesus orou pela unidade de Seus seguidores: "Para que todos sejam um... para que o mundo creia que tu me enviaste" (João 17:21). A unidade é essencial para o testemunho da Igreja.

A unidade da Igreja é espiritual e real: somos "um corpo em Cristo" (Romanos 12:5). O Espírito nos batizou em um corpo (1 Coríntios 12:13). Já somos um; devemos manter a unidade que já temos.

Efésios 4:3-6 lista os fundamentos da unidade: um corpo, um Espírito, uma esperança, um Senhor, uma fé, um batismo, um Deus e Pai. Esses são inegociáveis.

A unidade não significa uniformidade. Há diversidade legítima em práticas, tradições e ênfases. Mas a diversidade não deve quebrar a unidade essencial em Cristo. Lutamos por "guardar a unidade do Espírito no vínculo da paz" (Efésios 4:3).

A divisão vem do pecado: orgulho, facções, disputas, heresias. Devemos combater o divisivo e promover a paz. A unidade visível imperfeita aponta para a unidade perfeita que teremos na glória.`,
            references: "João 17:20-23, Efésios 4:1-6, 1 Coríntios 1:10-13, Filipenses 2:1-4, Colossenses 3:14-15",
            questions: "Por que Jesus orou pela unidade?\nQual é a base da unidade cristã?\nQual a diferença entre unidade e uniformidade?\nO que causa divisões na Igreja?\nComo você pode promover unidade?",
            application: "Examine se há algo que você faz ou diz que causa divisão. Busque ser instrumento de paz e unidade.",
            summary: "A Igreja é chamada a manter a unidade que já tem em Cristo, diversa em práticas, mas uma em essência.",
            estimatedMinutes: 20,
            order: 10
          }
        ]
      }
    ]
  }
];
