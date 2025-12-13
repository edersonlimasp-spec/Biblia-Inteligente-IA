import type { ModuleData } from "./types";

// Helper function to create lessons for a module
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

// MÓDULO 13: Os Atributos de Deus
const MODULO_13_ATRIBUTOS: ModuleData = {
  id: "modulo-13-atributos-deus",
  name: "Os Atributos de Deus",
  description: "Conhecendo o caráter e as perfeições de Deus revelados nas Escrituras",
  icon: "Crown",
  color: "#8B5CF6",
  order: 13,
  tracks: [
    {
      id: "track-13-iniciante",
      level: "iniciante",
      name: "Quem é Deus",
      description: "Os atributos essenciais que revelam a natureza de Deus",
      requiredPlan: "premium",
      order: 1,
      lessons: createLessons("mod13", [
        {
          title: "A Importância de Conhecer a Deus",
          content: `O conhecimento de Deus é a base de toda vida espiritual genuína. Jeremias registra as palavras do Senhor: "O que se gloriar, glorie-se nisto: em me conhecer e saber que eu sou o Senhor" (Jeremias 9:24). Não há maior busca que conhecer o Criador.

Conhecer a Deus corretamente afeta tudo mais. A.W. Tozer escreveu: "O que nos vem à mente quando pensamos em Deus é a coisa mais importante sobre nós." Ideias distorcidas sobre Deus produzem vida espiritual distorcida. Teologia correta é fundamento para piedade autêntica.

Jesus definiu vida eterna como conhecimento de Deus: "E a vida eterna é esta: que te conheçam a ti só por único Deus verdadeiro, e a Jesus Cristo, a quem enviaste" (João 17:3). Este conhecimento não é meramente intelectual, mas relacional - conhecer a Deus pessoalmente.

Estudar os atributos de Deus não é exercício acadêmico frio, mas adoração aquecida pela verdade. Cada atributo que descobrimos deve nos levar a maior reverência, amor e confiança. Conhecimento que não produz adoração ainda não é conhecimento verdadeiro.`,
          references: "Jeremias 9:23-24; João 17:3; Oséias 6:3; Colossenses 1:10; 2 Pedro 3:18",
          questions: [
            "1. Por que o conhecimento de Deus é tão importante?",
            "2. Como ideias erradas sobre Deus afetam nossa vida?",
            "3. Qual a relação entre conhecer Deus e vida eterna?",
            "4. Por que conhecimento de Deus deve produzir adoração?",
            "5. Como você pode crescer em conhecimento de Deus?"
          ],
          application: "Ao estudar cada atributo de Deus neste módulo, pause para adorá-Lo por essa característica. Não deixe o conhecimento ficar apenas na mente.",
          summary: "Conhecer Deus corretamente é a maior busca humana, fundamento de toda vida espiritual e fonte de adoração verdadeira."
        },
        {
          title: "Deus é Santo",
          content: `A santidade é talvez o atributo mais distintivo de Deus. Os serafins proclamam: "Santo, santo, santo é o Senhor dos Exércitos" (Isaías 6:3). A repetição tripla enfatiza infinita intensidade. Nenhum outro atributo recebe esta ênfase nas Escrituras.

Santidade significa separação - Deus é absolutamente diferente de tudo mais. Não há ninguém como Ele. "A quem, pois, me fareis semelhante, e a quem serei igualado?" (Isaías 40:25). Ele transcende toda categoria humana. É o "totalmente outro."

A santidade também significa pureza moral absoluta. Em Deus não há sombra de pecado, imperfeição ou mal. "Deus é luz, e não há nele trevas nenhumas" (1 João 1:5). Sua santidade é o padrão contra o qual todo pecado é medido. O que é contrário a Deus é pecado.

O encontro com a santidade de Deus transforma. Isaías, vendo o Santo, exclamou: "Ai de mim! Pois estou perdido" (Isaías 6:5). Jó, após encontrar Deus, disse: "Agora te veem os meus olhos. Por isso me abomino, e me arrependo no pó e na cinza" (Jó 42:5-6). A santidade de Deus expõe nossa pecaminosidade.`,
          references: "Isaías 6:1-8; 1 João 1:5; Habacuque 1:13; Levítico 11:44-45; Apocalipse 4:8",
          questions: [
            "1. Por que a santidade é o atributo mais enfatizado?",
            "2. O que significa Deus ser 'separado'?",
            "3. Como a santidade de Deus se relaciona com pureza moral?",
            "4. O que acontece quando encontramos a santidade de Deus?",
            "5. Como devemos responder à santidade divina?"
          ],
          application: "Leia Isaías 6:1-8 lentamente. Deixe a visão do Deus santo impactar seu coração. Confesse qualquer pecado que o Espírito revelar.",
          summary: "A santidade de Deus significa que Ele é absolutamente diferente de tudo mais e moralmente puro, expondo nossa pecaminosidade."
        },
        {
          title: "Deus é Amor",
          content: `"Deus é amor" (1 João 4:8) - não apenas que Ele ama, mas que amor é Sua própria natureza. Tudo o que Deus faz flui de amor perfeito. Mesmo Sua justiça e ira são expressões de amor santo que não pode tolerar o que destrói Seus amados.

O amor de Deus é diferente do amor humano. Não é causado por algo atraente em nós. "Nisto está o amor, não em que nós tenhamos amado a Deus, mas em que ele nos amou e enviou seu Filho" (1 João 4:10). Deus nos ama apesar de nós, não por causa de nós.

A maior demonstração do amor de Deus é a cruz. "Deus prova o seu amor para conosco, em que Cristo morreu por nós, sendo nós ainda pecadores" (Romanos 5:8). O amor de Deus não é sentimento passivo, mas ação sacrificial. Custou-Lhe infinitamente.

O amor de Deus é eterno e imutável. "Com amor eterno eu te amei" (Jeremias 31:3). Não depende de nosso comportamento. Nada pode separar-nos deste amor (Romanos 8:38-39). É o fundamento de nossa segurança e a fonte de nossa capacidade de amar outros.`,
          references: "1 João 4:7-21; Romanos 5:8; João 3:16; Efésios 2:4-5; Romanos 8:35-39",
          questions: [
            "1. O que significa dizer que 'Deus é amor'?",
            "2. Como o amor de Deus difere do amor humano?",
            "3. Qual é a maior demonstração do amor divino?",
            "4. O que garante a permanência do amor de Deus por nós?",
            "5. Como o amor de Deus nos capacita a amar outros?"
          ],
          application: "Medite em Romanos 8:38-39. Existe algo que você teme poder separar você do amor de Deus? Entregue esse medo a Ele.",
          summary: "Deus é amor em Sua essência, demonstrado supremamente na cruz, eterno e imutável, fundamento de nossa segurança."
        },
        {
          title: "Deus é Onipotente",
          content: `Deus é todo-poderoso - não há limite para Seu poder. "Ah! Senhor Deus! Eis que tu fizeste os céus e a terra com o teu grande poder e com o teu braço estendido; coisa alguma te é demasiadamente maravilhosa" (Jeremias 32:17). Nada é impossível para Deus.

A onipotência de Deus significa que Ele pode fazer tudo o que decide fazer. "O nosso Deus está nos céus e faz tudo o que lhe apraz" (Salmo 115:3). Nenhum obstáculo pode impedi-Lo. Nenhum inimigo pode derrotá-Lo. Seus propósitos sempre se cumprem.

Contudo, a onipotência não significa que Deus faz qualquer coisa. Ele não pode mentir (Hebreus 6:18), não pode negar a Si mesmo (2 Timóteo 2:13), não pode pecar. Estas não são fraquezas, mas expressões de Sua perfeição. Deus age consistente com Seu caráter.

A onipotência de Deus é consolo para Seus filhos. O mesmo poder que criou o universo trabalha a nosso favor. "Se Deus é por nós, quem será contra nós?" (Romanos 8:31). Nada é grande demais para Ele resolver. Podemos confiar nossos problemas impossíveis ao Deus onipotente.`,
          references: "Jeremias 32:17; Salmo 115:3; Mateus 19:26; Efésios 1:19-20; Romanos 8:31",
          questions: [
            "1. O que significa onipotência?",
            "2. Há algo que Deus não pode fazer? Por quê?",
            "3. Como a onipotência se relaciona com os propósitos de Deus?",
            "4. Por que a onipotência é consolo para os crentes?",
            "5. Como você pode confiar mais no poder de Deus?"
          ],
          application: "Identifique uma situação 'impossível' em sua vida. Ore a Jeremias 32:17, entregando-a ao Deus onipotente.",
          summary: "Deus é todo-poderoso, capaz de fazer tudo consistente com Seu caráter perfeito, trabalhando a favor de Seus filhos."
        },
        {
          title: "Deus é Onisciente",
          content: `Deus sabe todas as coisas - passadas, presentes e futuras, reais e possíveis. "Grande é o nosso Senhor, e de grande poder; o seu entendimento é infinito" (Salmo 147:5). Nada escapa ao Seu conhecimento. Não há surpresas para Deus.

Deus conhece cada detalhe da criação. Jesus disse que os cabelos de nossa cabeça estão contados (Mateus 10:30) e nenhum pardal cai sem o conhecimento do Pai. Ele conhece nossos pensamentos antes de os pensarmos (Salmo 139:2) e nossas palavras antes de falarmos (Salmo 139:4).

A onisciência inclui conhecimento do futuro. "Eu sou Deus, e não há outro Deus, não há outro semelhante a mim; que anuncio o fim desde o princípio" (Isaías 46:9-10). Deus não prevê o futuro - Ele o conhece porque está acima do tempo. O futuro é tão claro para Ele quanto o passado.

Esta verdade traz conforto e desafio. Conforto porque Deus conhece nossas necessidades antes de pedirmos (Mateus 6:8). Desafio porque nada está escondido dEle (Hebreus 4:13). Podemos viver com transparência diante do Deus que vê tudo.`,
          references: "Salmo 139:1-6; Salmo 147:5; Isaías 46:9-10; Hebreus 4:13; Mateus 10:29-30",
          questions: [
            "1. O que significa onisciência?",
            "2. Que tipos de coisas Deus conhece?",
            "3. Como Deus conhece o futuro?",
            "4. Por que a onisciência é consoladora?",
            "5. Por que a onisciência é desafiadora?"
          ],
          application: "Leia Salmo 139:1-6. Permita que a realidade de ser completamente conhecido por Deus traga segurança, não medo.",
          summary: "Deus conhece todas as coisas perfeitamente - passado, presente e futuro - trazendo conforto e chamando à transparência."
        },
        {
          title: "Deus é Onipresente",
          content: `Deus está presente em todo lugar simultaneamente. "Para onde me irei do teu Espírito, ou para onde fugirei da tua face? Se subir ao céu, lá tu estás; se fizer no inferno a minha cama, eis que tu ali estás também" (Salmo 139:7-8). Não há lugar onde Deus não esteja.

A onipresença não significa que Deus é uma força impessoal espalhada pelo universo. Ele é pessoal e está totalmente presente em cada lugar. Não está dividido ou diluído. Onde você está agora, Deus está completamente presente com toda Sua atenção.

Esta verdade significa que nunca estamos sozinhos. "Não te deixarei, nem te desampararei" (Hebreus 13:5). Na escuridão mais profunda, Deus está lá. Na solidão mais intensa, Ele está presente. Não há vale tão profundo que Sua presença não alcance.

A onipresença também significa que não há como fugir de Deus. Jonas tentou e descobriu que era impossível (Jonas 1). Para o rebelde, a onipresença é ameaça. Para o filho, é consolo. A mesma presença que persegue o ímpio, abraça o santo.`,
          references: "Salmo 139:7-12; Jeremias 23:23-24; Atos 17:27-28; Mateus 28:20; Hebreus 13:5",
          questions: [
            "1. O que significa onipresença?",
            "2. Como Deus pode estar em todo lugar ao mesmo tempo?",
            "3. Por que a onipresença é confortante?",
            "4. Por que a onipresença pode ser ameaçadora?",
            "5. Como você pode viver mais consciente da presença de Deus?"
          ],
          application: "Durante esta semana, pratique a presença de Deus. Lembre-se que Ele está com você em cada situação - no trabalho, em casa, sozinho.",
          summary: "Deus está totalmente presente em todo lugar, trazendo consolo aos Seus filhos e advertência aos que fogem dEle."
        },
        {
          title: "Deus é Eterno e Imutável",
          content: `Deus existe fora do tempo e sem mudança. "Antes que os montes nascessem, ou que tu formasses a terra e o mundo, mesmo de eternidade a eternidade, tu és Deus" (Salmo 90:2). Não teve início, não terá fim. É o "Eu Sou" eterno.

A eternidade de Deus significa que Ele não está limitado pelo tempo como nós. "Um dia para o Senhor é como mil anos, e mil anos como um dia" (2 Pedro 3:8). O passado, presente e futuro estão igualmente diante dEle. Ele reina acima da linha do tempo.

A imutabilidade significa que Deus não muda. "Porque eu, o Senhor, não mudo" (Malaquias 3:6). Seu caráter, propósitos e promessas são constantes. O Deus de Abraão é o mesmo Deus que servimos. Ele não melhora (já é perfeito) nem piora.

Estas verdades fundamentam nossa segurança. Um Deus que muda seria imprevisível - Suas promessas poderiam ser revogadas. Mas o Deus imutável é rocha sólida. "Jesus Cristo é o mesmo, ontem, hoje e eternamente" (Hebreus 13:8). Podemos confiar completamente.`,
          references: "Salmo 90:2; Malaquias 3:6; Hebreus 13:8; Tiago 1:17; Isaías 40:28",
          questions: [
            "1. O que significa Deus ser eterno?",
            "2. Como Deus se relaciona com o tempo?",
            "3. O que é imutabilidade?",
            "4. Por que a imutabilidade é importante para nossa fé?",
            "5. Como estas verdades trazem segurança?"
          ],
          application: "Em um mundo de mudanças constantes, descanse na imutabilidade de Deus. Ele é a mesma rocha que sempre foi.",
          summary: "Deus é eterno (sem início ou fim) e imutável (sem mudança), fundamentando nossa confiança em Suas promessas."
        },
        {
          title: "Deus é Justo",
          content: `A justiça de Deus significa que Ele sempre age corretamente. "O Senhor é justo em todos os seus caminhos" (Salmo 145:17). Não há injustiça nEle. Seus julgamentos são perfeitos, Suas decisões corretas. Ele é o padrão absoluto do que é certo.

A justiça de Deus exige que o pecado seja punido. "De modo nenhum terá por inocente o culpado" (Êxodo 34:7). Um juiz que ignora crimes não é justo. Deus não pode simplesmente fechar os olhos para o mal. Sua santidade requer resposta ao pecado.

A cruz é onde a justiça e a misericórdia de Deus se encontram. Ali, o pecado foi punido - Jesus carregou nossa penalidade. Ali, pecadores foram perdoados - através do sacrifício substitutivo. "Para que ele seja justo e justificador daquele que tem fé em Jesus" (Romanos 3:26).

A justiça de Deus é fundamento de esperança. Os ímpios prosperarão? Não permanentemente. Os justos sofrem injustiça? Será corrigida. "Não te indignes por causa dos malfeitores... porque em breve serão ceifados como a relva" (Salmo 37:1-2). Deus acertará todas as contas.`,
          references: "Salmo 145:17; Romanos 3:25-26; Deuteronômio 32:4; Salmo 37:1-11; Gênesis 18:25",
          questions: [
            "1. O que significa Deus ser justo?",
            "2. Por que a justiça exige punição do pecado?",
            "3. Como justiça e misericórdia se unem na cruz?",
            "4. Como a justiça de Deus traz esperança?",
            "5. Como devemos responder à justiça divina?"
          ],
          application: "Existe alguma injustiça que você sofreu e ainda carrega? Entregue a Deus, confiando que Ele é justo e acertará as contas.",
          summary: "Deus é perfeitamente justo, exigindo punição do pecado enquanto providencia perdão através da cruz."
        },
        {
          title: "Deus é Misericordioso",
          content: `A misericórdia de Deus é Sua compaixão pelos que sofrem e pecam. "O Senhor, o Senhor, Deus misericordioso e piedoso, tardio em irar-se e grande em beneficência e verdade" (Êxodo 34:6). Sua misericórdia não nos dá o que merecemos.

A misericórdia de Deus é revelada em Sua paciência. "O Senhor não retarda a sua promessa... mas é longânimo para convosco, não querendo que nenhum pereça" (2 Pedro 3:9). Ele poderia julgar imediatamente, mas espera, dando tempo para arrependimento. Cada dia é expressão de misericórdia.

A misericórdia de Deus é nova cada manhã. "As misericórdias do Senhor são a causa de não sermos consumidos; porque as suas misericórdias não têm fim. Novas são cada manhã; grande é a tua fidelidade" (Lamentações 3:22-23). Não importa o quanto falhamos ontem, a misericórdia de hoje está disponível.

A misericórdia não é fraqueza - é força controlada. Deus tem todo direito e poder de julgar, mas escolhe mostrar compaixão. Esta misericórdia deve fluir através de nós aos outros. "Bem-aventurados os misericordiosos, porque eles alcançarão misericórdia" (Mateus 5:7).`,
          references: "Êxodo 34:6-7; Lamentações 3:22-23; Efésios 2:4-5; Tito 3:5; Mateus 5:7",
          questions: [
            "1. O que é misericórdia?",
            "2. Como a paciência de Deus demonstra misericórdia?",
            "3. O que significa as misericórdias serem 'novas cada manhã'?",
            "4. Por que a misericórdia não é fraqueza?",
            "5. Como devemos responder à misericórdia de Deus?"
          ],
          application: "Cada manhã desta semana, agradeça a Deus por Suas misericórdias renovadas. Depois, procure mostrar misericórdia a alguém.",
          summary: "A misericórdia de Deus é compaixão ativa que nos poupa do que merecemos, renovada diariamente e fluindo através de nós a outros."
        },
        {
          title: "Respondendo aos Atributos de Deus",
          content: `Conhecer os atributos de Deus sem responder apropriadamente é conhecimento vão. Cada atributo divino demanda uma resposta de nosso coração e vida. Teologia verdadeira leva à doxologia - louvor a Deus.

A santidade de Deus exige reverência e santidade em nós. "Sede santos, porque eu sou santo" (1 Pedro 1:16). O amor de Deus demanda amor em retorno - a Ele e aos outros. "Nós amamos porque ele nos amou primeiro" (1 João 4:19). A onipotência convida confiança. A onisciência chama à transparência.

A eternidade de Deus coloca nossa vida em perspectiva. Somos um sopro; Ele é eterno. A imutabilidade produz segurança. A justiça gera reverência e esperança. A misericórdia evoca gratidão. Cada atributo molda como vivemos.

O maior crescimento espiritual vem de contemplar Deus. "E todos nós, com rosto descoberto, refletindo como um espelho a glória do Senhor, somos transformados de glória em glória na mesma imagem" (2 Coríntios 3:18). Quanto mais vemos de Deus, mais nos tornamos como Ele. Conhecimento de Deus é o caminho para a santidade.`,
          references: "1 Pedro 1:15-16; 1 João 4:19; 2 Coríntios 3:18; Romanos 12:1-2; Colossenses 1:10",
          questions: [
            "1. Por que conhecimento de Deus deve produzir resposta?",
            "2. Que resposta cada atributo estudado exige?",
            "3. Como contemplar Deus nos transforma?",
            "4. Qual a relação entre conhecer Deus e santidade?",
            "5. Qual atributo mais impactou você neste estudo? Por quê?"
          ],
          application: "Escolha o atributo que mais tocou seu coração. Passe tempo esta semana meditando nele e permitindo que transforme sua vida.",
          summary: "O conhecimento dos atributos de Deus exige resposta prática: adoração, confiança, reverência e transformação à Sua semelhança."
        }
      ])
    }
  ]
};

// MÓDULO 14: O Plano de Redenção
const MODULO_14_REDENCAO: ModuleData = {
  id: "modulo-14-plano-redencao",
  name: "O Plano de Redenção",
  description: "A história da salvação do Gênesis ao Apocalipse",
  icon: "BookOpen",
  color: "#10B981",
  order: 14,
  tracks: [
    {
      id: "track-14-iniciante",
      level: "iniciante",
      name: "História da Redenção",
      description: "A narrativa unificada da salvação através das Escrituras",
      requiredPlan: "premium",
      order: 1,
      lessons: createLessons("mod14", [
        {
          title: "Uma História, Um Herói",
          content: `A Bíblia não é uma coleção aleatória de histórias, mas uma narrativa unificada com um tema central: a redenção da humanidade através de Jesus Cristo. De Gênesis a Apocalipse, tudo aponta para Ele. Jesus disse: "São estas as Escrituras que de mim testificam" (João 5:39).

Esta perspectiva transforma como lemos a Bíblia. Cada genealogia, lei, profecia e evento histórico faz parte de um plano maior. "Tendo Deus, outrora, falado muitas vezes e de muitas maneiras, aos pais, pelos profetas, nestes últimos dias nos falou pelo Filho" (Hebreus 1:1-2). Cristo é o clímax da revelação.

A história da redenção pode ser resumida em quatro movimentos: Criação (o mundo como Deus o fez), Queda (o mundo arruinado pelo pecado), Redenção (o mundo sendo resgatado por Cristo), e Consumação (o mundo totalmente restaurado). Cada texto bíblico se encaixa em algum ponto desta narrativa.

Entender o plano de redenção nos protege de leituras fragmentadas e moralizantes. Não lemos a Bíblia primariamente para "ser como Davi" ou "evitar ser como Jonas." Lemos para ver Cristo em toda parte e ser transformados pela graça que Ele trouxe.`,
          references: "João 5:39; Lucas 24:27; Hebreus 1:1-2; Efésios 1:9-10; Colossenses 1:15-20",
          questions: [
            "1. Por que a Bíblia é uma história unificada?",
            "2. Quem é o herói central das Escrituras?",
            "3. Quais são os quatro movimentos da história da redenção?",
            "4. Como isso transforma nossa leitura da Bíblia?",
            "5. Por que é problemático ler a Bíblia apenas moralisticamente?"
          ],
          application: "Na próxima vez que ler uma passagem do Antigo Testamento, pergunte: 'Como isso aponta para Cristo ou para minha necessidade dEle?'",
          summary: "A Bíblia conta uma história unificada de redenção com Jesus Cristo como o herói central, em quatro movimentos: Criação, Queda, Redenção, Consumação."
        },
        {
          title: "Criação: O Mundo Bom de Deus",
          content: `A história começa com Deus criando o mundo bom. "Viu Deus tudo quanto tinha feito, e eis que era muito bom" (Gênesis 1:31). Não havia pecado, morte, sofrimento ou separação. Deus habitava com Sua criação em perfeita harmonia.

O ser humano foi criado à imagem de Deus (Gênesis 1:27) para refletir Seu caráter e governar a terra sob Sua autoridade. Adão e Eva desfrutavam comunhão íntima com o Criador, trabalho significativo no jardim e relacionamento perfeito um com o outro. Era shalom - paz completa.

A criação estabelece as bases para tudo que segue. O pecado será visto como invasor que destruiu algo bom. A redenção será restauração ao propósito original, não escape para algum outro destino. A consumação será nova criação, retomando e transcendendo o Éden.

Entender a bondade original da criação molda nossa esperança. Não esperamos apenas "ir para o céu," mas a restauração de toda a criação. "A própria criação será libertada da escravidão da corrupção" (Romanos 8:21). O plano de Deus é redenção, não abandono.`,
          references: "Gênesis 1-2; Salmo 8; Romanos 8:19-22; Apocalipse 21:1-5",
          questions: [
            "1. Como era o mundo na criação original?",
            "2. Para que o ser humano foi criado?",
            "3. O que significa 'shalom'?",
            "4. Como a criação molda nosso entendimento da redenção?",
            "5. Por que o destino final não é 'escapar' da criação?"
          ],
          application: "Observe a criação ao seu redor - natureza, relacionamentos, trabalho. Agradeça a Deus pelo propósito original e ore pela restauração.",
          summary: "Deus criou um mundo muito bom onde humanidade habitava em perfeita harmonia com Ele, estabelecendo o padrão para a redenção futura."
        },
        {
          title: "Queda: O Pecado Invade",
          content: `O terceiro capítulo de Gênesis descreve a tragédia que mudou tudo. A serpente enganou Eva, ela comeu do fruto proibido, deu a Adão, e ele também comeu. "Então foram abertos os olhos de ambos, e conheceram que estavam nus" (Gênesis 3:7). A inocência foi perdida.

As consequências foram abrangentes. O relacionamento com Deus foi quebrado - eles se esconderam. O relacionamento entre si foi danificado - culparam um ao outro. O trabalho se tornou árduo. A terra foi amaldiçoada. A morte entrou no mundo. Tudo que era bom foi distorcido.

Mas mesmo no julgamento, há esperança. Deus promete que a semente da mulher esmagará a cabeça da serpente (Gênesis 3:15). Este é o "protoevangelhos" - a primeira promessa do evangelho. Desde o início, Deus anuncia Sua intenção de resgatar.

A queda explica o mundo como o conhecemos. Por que sofrimento? Por que morte? Por que maldade? Não porque Deus criou assim, mas porque o pecado corrompeu o que era bom. O diagnóstico bíblico da condição humana é realista, mas não desesperançoso - há promessa de cura.`,
          references: "Gênesis 3; Romanos 5:12-21; 1 Coríntios 15:21-22; Romanos 8:20-22",
          questions: [
            "1. O que aconteceu na queda?",
            "2. Quais foram as consequências para humanidade?",
            "3. Quais foram as consequências para a criação?",
            "4. Onde encontramos esperança em Gênesis 3?",
            "5. Como a queda explica o mundo que vemos hoje?"
          ],
          application: "A próxima vez que encontrar sofrimento ou maldade, lembre: 'Isso não era para ser assim, e não será assim para sempre.'",
          summary: "O pecado de Adão e Eva trouxe morte e corrupção a toda a criação, mas mesmo no julgamento Deus prometeu redenção."
        },
        {
          title: "Promessa: A Aliança com Abraão",
          content: `Após a queda, o pecado se multiplica: Caim mata Abel, a humanidade se corrompe, Deus envia o dilúvio, Babel tenta construir torre aos céus. Mas Deus não abandona Seu plano. Ele chama Abraão e faz uma aliança que moldará toda a história da redenção.

A promessa a Abraão tem três elementos: terra, descendência e bênção. "Farei de ti uma grande nação, e abençoar-te-ei... e em ti serão benditas todas as famílias da terra" (Gênesis 12:2-3). A última frase é crucial - através de Abraão, todas as nações seriam alcançadas.

Esta promessa é repetida e confirmada ao longo de Gênesis (15, 17, 22). Abraão creu no Senhor, "e foi-lhe imputado isto por justiça" (Gênesis 15:6). Ele é o pai dos que creem - a justificação pela fé não é novidade do Novo Testamento.

Paulo explica que a semente prometida a Abraão é Cristo: "Ora, as promessas foram feitas a Abraão e à sua descendência. Não diz: E às descendências, como falando de muitas, mas como de uma só: E à tua descendência, que é Cristo" (Gálatas 3:16). A promessa se cumpre plenamente em Jesus.`,
          references: "Gênesis 12:1-3; 15:1-6; Gálatas 3:6-16; Romanos 4:1-25; Hebreus 11:8-19",
          questions: [
            "1. Por que Deus escolheu Abraão?",
            "2. Quais são os três elementos da promessa?",
            "3. Como todas as nações seriam abençoadas?",
            "4. O que significa Abraão ser 'pai da fé'?",
            "5. Quem é a 'descendência' prometida?"
          ],
          application: "Você é herdeiro da promessa a Abraão através de Cristo. Agradeça a Deus por incluí-lo neste plano eterno.",
          summary: "Deus prometeu a Abraão terra, descendência e bênção para todas as nações, cumprida plenamente em Cristo."
        },
        {
          title: "Libertação: O Êxodo do Egito",
          content: `Os descendentes de Abraão tornaram-se escravos no Egito. Clamaram a Deus, e Ele levantou Moisés como libertador. O Êxodo é o grande ato de salvação do Antigo Testamento, modelo para toda redenção futura.

As dez pragas demonstraram o poder de Deus sobre os deuses do Egito. A décima praga - morte dos primogênitos - foi evitada pelo sangue do cordeiro pascal nas portas. "Quando eu vir o sangue, passarei por vós" (Êxodo 12:13). A Páscoa é sombra da cruz.

O Mar Vermelho abriu, Israel passou, os egípcios foram destruídos. "E viu Israel a grande obra que o Senhor havia feito contra os egípcios; e o povo temeu ao Senhor e creu nele" (Êxodo 14:31). A salvação foi completamente obra de Deus.

O Novo Testamento vê a salvação em Cristo como o verdadeiro Êxodo. Jesus é o "Cordeiro de Deus, que tira o pecado do mundo" (João 1:29). Somos libertos da escravidão do pecado. Passamos da morte para a vida. O Êxodo do Egito aponta para o Êxodo maior na cruz.`,
          references: "Êxodo 12-15; João 1:29; 1 Coríntios 5:7; 1 Pedro 1:18-19; Hebreus 11:28",
          questions: [
            "1. Por que o Êxodo é tão importante na história da redenção?",
            "2. Como as pragas demonstraram o poder de Deus?",
            "3. Qual o significado do sangue do cordeiro?",
            "4. Como o Êxodo aponta para Cristo?",
            "5. Como a Páscoa é sombra da cruz?"
          ],
          application: "Leia Êxodo 12 pensando na cruz. Veja como cada detalhe da Páscoa encontra cumprimento em Cristo.",
          summary: "O Êxodo libertou Israel do Egito pelo sangue do cordeiro, apontando para a libertação maior do pecado através de Cristo."
        },
        {
          title: "Lei: A Aliança do Sinai",
          content: `No Sinai, Deus deu a Lei a Israel. Os Dez Mandamentos e as leis civis e cerimoniais estabeleceram como o povo deveria viver como nação santa. "Vós me sereis um reino sacerdotal e o povo santo" (Êxodo 19:6).

A Lei revelou o caráter de Deus e o padrão de justiça. Também expôs o pecado humano. "Pela lei vem o conhecimento do pecado" (Romanos 3:20). Ninguém conseguiu cumpri-la perfeitamente, demonstrando a necessidade de um Salvador.

O sistema sacrificial apontava para Cristo. Cada animal oferecido ensinava que "sem derramamento de sangue não há remissão" (Hebreus 9:22). Mas o sangue de animais não podia realmente tirar pecados (Hebreus 10:4) - era sombra do sacrifício definitivo de Cristo.

Jesus cumpriu a Lei de três formas. Ele viveu perfeitamente sob ela (vida ativa). Ele sofreu a maldição que ela impunha sobre transgressores (morte substitutiva). Ele trouxe o que a Lei antecipava (cumprimento). Não viemos abolir a Lei, mas ela encontrou seu propósito em Cristo (Mateus 5:17).`,
          references: "Êxodo 19-20; Romanos 3:19-20; Gálatas 3:24; Hebreus 9:1-14; Mateus 5:17",
          questions: [
            "1. Qual era o propósito da Lei?",
            "2. Como a Lei revela o pecado?",
            "3. Para que servia o sistema sacrificial?",
            "4. Como Jesus cumpriu a Lei?",
            "5. Qual é nossa relação com a Lei hoje?"
          ],
          application: "Leia os Dez Mandamentos (Êxodo 20:1-17). Reconheça sua necessidade de Cristo para cada mandamento que você falhou em guardar.",
          summary: "A Lei revelou o caráter de Deus e o pecado humano, apontando para Cristo que a cumpriu perfeitamente por nós."
        },
        {
          title: "Reino: Davi e a Promessa Messiânica",
          content: `Deus prometeu a Davi um reino eterno: "A tua casa e o teu reino serão firmados para sempre diante de ti; teu trono será firme para sempre" (2 Samuel 7:16). Esta aliança davídica é crucial para entender o Messias.

Os reis de Israel e Judá falharam. Até Davi, o homem segundo o coração de Deus, pecou gravemente. Nenhum rei humano podia estabelecer o reino justo e eterno prometido. Mas a promessa não falhou - apontava para um Rei maior.

Os profetas desenvolveram esta esperança messiânica. Isaías anunciou um filho que se assentaria no trono de Davi para sempre (Isaías 9:6-7). Jeremias prometeu um "Renovo justo" de Davi que reinaria com sabedoria (Jeremias 23:5). Ezequiel viu Davi (o Messias) como pastor eterno (Ezequiel 34:23-24).

Jesus é o Filho de Davi prometido. Os Evangelhos começam estabelecendo Sua linhagem davídica (Mateus 1:1). Ele pregou o Reino de Deus. Após a ressurreição, foi exaltado ao trono celestial. "Ele reinará para todo o sempre" (Apocalipse 11:15). A promessa se cumpre.`,
          references: "2 Samuel 7:1-17; Isaías 9:6-7; Mateus 1:1; Lucas 1:32-33; Apocalipse 11:15",
          questions: [
            "1. O que Deus prometeu a Davi?",
            "2. Por que os reis de Israel falharam?",
            "3. Como os profetas desenvolveram a esperança messiânica?",
            "4. Como Jesus cumpre a promessa davídica?",
            "5. Onde Jesus reina agora?"
          ],
          application: "Submeta-se conscientemente ao reinado de Cristo hoje. Onde você precisa reconhecê-Lo como Rei?",
          summary: "Deus prometeu a Davi um reino eterno, cumprido em Jesus, o Filho de Davi que reina para sempre."
        },
        {
          title: "Profetas: Julgamento e Esperança",
          content: `Os profetas foram enviados para chamar Israel ao arrependimento e anunciar tanto julgamento quanto esperança. Eles denunciaram a idolatria e injustiça do povo, mas também pintaram imagens do futuro glorioso que Deus traria.

Os profetas previram o exílio como julgamento pelo pecado. Israel foi para a Assíria (722 a.C.) e Judá para a Babilônia (586 a.C.). Mas eles também prometeram restauração. "Eu os restaurarei da terra para onde os levei cativos" (Jeremias 29:14).

Mais importante, os profetas anunciaram a vinda do Servo Sofredor. Isaías 53 descreve alguém que seria "traspassado pelas nossas transgressões, moído pelas nossas iniquidades" (Isaías 53:5). Este capítulo é citado mais vezes no Novo Testamento do que qualquer outro do Antigo.

Os profetas também viram além do sofrimento para a glória. Anunciaram nova aliança (Jeremias 31:31-34), derramamento do Espírito (Joel 2:28-29), e restauração de todas as coisas (Isaías 65:17-25). Jesus e os apóstolos viram estas profecias cumpridas na primeira e segunda vindas de Cristo.`,
          references: "Isaías 53; Jeremias 31:31-34; Joel 2:28-29; Malaquias 3:1-4; Isaías 11:1-9",
          questions: [
            "1. Qual era a função dos profetas?",
            "2. Por que Israel e Judá foram para o exílio?",
            "3. Quem é o Servo Sofredor de Isaías 53?",
            "4. O que os profetas viram além do sofrimento?",
            "5. Como as profecias se cumprem em Cristo?"
          ],
          application: "Leia Isaías 53 lentamente, como se fosse a primeira vez. Agradeça a Jesus por cada detalhe cumprido.",
          summary: "Os profetas anunciaram julgamento pelo pecado, mas também a vinda do Servo Sofredor e a restauração final através dele."
        },
        {
          title: "Cumprimento: Cristo, o Centro da História",
          content: `"Vindo a plenitude dos tempos, Deus enviou seu Filho" (Gálatas 4:4). Todas as promessas, tipos e profecias convergem em Jesus. Ele é a semente prometida a Eva, a bênção prometida a Abraão, o Cordeiro Pascal, o cumpridor da Lei, o Filho de Davi, o Servo Sofredor.

Jesus anunciou: "O tempo está cumprido, e o reino de Deus está próximo" (Marcos 1:15). Seu ministério inaugurou o Reino. Seus milagres demonstraram poder sobre doença, demônios, natureza e morte. Seu ensino revelou a vontade do Pai. Sua vida perfeita cumpriu toda justiça.

A cruz é o centro da história. Ali, o pecado foi punido, a maldição foi absorvida, Satanás foi derrotado, e a salvação foi conquistada. "Está consumado" (João 19:30) significa que a obra de redenção foi completada. Nada mais precisa ser adicionado.

A ressurreição valida tudo. Prova que Jesus é quem disse ser, que Seu sacrifício foi aceito, e que a morte foi vencida. A ascensão O colocou no trono celestial. O envio do Espírito aplica Sua obra. Agora aguardamos Sua volta para consumar tudo.`,
          references: "Gálatas 4:4-5; Marcos 1:15; João 19:30; Romanos 1:4; Atos 2:32-36",
          questions: [
            "1. O que significa 'plenitude dos tempos'?",
            "2. Quais promessas Jesus cumpriu?",
            "3. Por que a cruz é o centro da história?",
            "4. O que a ressurreição prova?",
            "5. O que aguardamos agora?"
          ],
          application: "Trace as linhas de promessa estudadas até Cristo. Veja como tudo converge nEle. Adore-O como o centro de toda a história.",
          summary: "Jesus cumpriu todas as promessas, tipos e profecias do Antigo Testamento, completando a obra de redenção na cruz."
        },
        {
          title: "Consumação: A Nova Criação",
          content: `A história da redenção ainda não está completa. Vivemos entre a inauguração do Reino (primeira vinda) e sua consumação (segunda vinda). Cristo voltará para julgar os vivos e mortos e estabelecer definitivamente Seu Reino.

O Apocalipse descreve o destino final: "Vi novo céu e nova terra... E ouvi uma grande voz do céu, que dizia: Eis aqui o tabernáculo de Deus com os homens, pois com eles habitará" (Apocalipse 21:1-3). A presença de Deus com Seu povo será plena e permanente.

A nova criação retoma e transcende o Éden. Haverá árvore da vida e água da vida (Apocalipse 22). Mas não haverá mais maldição, morte, dor ou pranto. O que foi perdido será restaurado - e mais. "As primeiras coisas são passadas" (Apocalipse 21:4).

Esta esperança molda como vivemos agora. "Havendo de perecer assim todas estas coisas, considerai que pessoas devíeis ser... esperando e apressando a vinda do dia de Deus" (2 Pedro 3:11-12). A consumação futura motiva santidade, missão e perseverança presentes.`,
          references: "Apocalipse 21-22; 2 Pedro 3:10-14; 1 Coríntios 15:24-28; Romanos 8:18-25",
          questions: [
            "1. O que acontecerá na volta de Cristo?",
            "2. Como a nova criação se relaciona com o Éden?",
            "3. O que estará ausente na nova criação?",
            "4. O que estará presente?",
            "5. Como a esperança futura deve afetar nossa vida presente?"
          ],
          application: "Medite em Apocalipse 21:1-5. Deixe essa esperança encorajá-lo em qualquer dificuldade que esteja enfrentando.",
          summary: "Cristo voltará para consumar a redenção, criando novos céus e nova terra onde Deus habitará eternamente com Seu povo."
        }
      ])
    }
  ]
};

// MÓDULO 15: A Grande Comissão
const MODULO_15_GRANDE_COMISSAO: ModuleData = {
  id: "modulo-15-grande-comissao",
  name: "A Grande Comissão",
  description: "Nossa missão de fazer discípulos de todas as nações",
  icon: "Globe",
  color: "#3B82F6",
  order: 15,
  tracks: [
    {
      id: "track-15-iniciante",
      level: "iniciante",
      name: "Missão da Igreja",
      description: "Entendendo e vivendo a missão que Cristo nos confiou",
      requiredPlan: "premium",
      order: 1,
      lessons: createLessons("mod15", [
        {
          title: "O Mandato de Cristo",
          content: `Antes de ascender ao céu, Jesus deu aos discípulos uma ordem final: "Toda a autoridade me foi dada no céu e na terra. Ide, portanto, fazei discípulos de todas as nações, batizando-os em nome do Pai, e do Filho, e do Espírito Santo; ensinando-os a guardar todas as coisas que vos tenho ordenado" (Mateus 28:18-20).

Esta não é uma sugestão ou opção - é mandamento do Senhor ressurreto. A Grande Comissão define a missão central da Igreja até que Cristo volte. Não é tarefa de alguns especialistas, mas de todo discípulo. Se você é discípulo, é também comissionado a fazer discípulos.

A base da missão é a autoridade de Cristo. "Toda autoridade me foi dada" precede o "ide." Não vamos em nosso próprio nome ou poder, mas sob Sua autoridade e com Seu respaldo. Ele é o Senhor do céu e da terra, e envia Sua Igreja.

A promessa que acompanha é preciosa: "E eis que eu estou convosco todos os dias, até a consumação dos séculos" (Mateus 28:20). A missão é desafiadora, mas não a fazemos sozinhos. O próprio Cristo prometeu Sua presença constante. Esta promessa nos sustenta.`,
          references: "Mateus 28:18-20; Marcos 16:15; Lucas 24:46-49; João 20:21; Atos 1:8",
          questions: [
            "1. Por que chamamos esta ordem de 'Grande Comissão'?",
            "2. A quem este mandamento se aplica?",
            "3. Qual é a base da missão?",
            "4. Qual promessa acompanha a comissão?",
            "5. Por que a presença de Cristo é crucial para a missão?"
          ],
          application: "Releia Mateus 28:18-20 e pergunte: 'Estou vivendo como alguém comissionado por Cristo?' Peça a Ele que reacenda sua paixão pela missão.",
          summary: "Jesus comissionou todos os discípulos a fazerem discípulos de todas as nações, prometendo Sua autoridade e presença constante."
        },
        {
          title: "Fazer Discípulos: O Coração da Missão",
          content: `O verbo principal da Grande Comissão não é "ir," mas "fazer discípulos" (matheteusate). Ir, batizar e ensinar são participiais que descrevem como fazer discípulos. A meta não é apenas conversões, mas discípulos maduros.

Um discípulo é um seguidor-aprendiz. No primeiro século, discípulos viviam com seus mestres, aprendendo não apenas ideias, mas um modo de vida. Jesus chama pessoas a segui-Lo, aprender dEle e tornarem-se como Ele. Este é o processo de discipulado.

Fazer discípulos envolve reprodução. Paulo instruiu Timóteo: "O que de mim, entre muitas testemunhas, ouviste, confia-o a homens fiéis, que sejam idôneos para também ensinarem outros" (2 Timóteo 2:2). Discípulos fazem discípulos que fazem discípulos. É multiplicação, não apenas adição.

Fazer discípulos é relacional e intencional. Não acontece automaticamente através de programas ou eventos. Requer investimento de tempo, exemplo de vida, ensino pessoal e acompanhamento contínuo. É o método que Jesus usou e nos ensinou a usar.`,
          references: "Mateus 28:19; 2 Timóteo 2:2; Mateus 4:19; João 13:34-35; 1 Coríntios 11:1",
          questions: [
            "1. Qual é o verbo principal da Grande Comissão?",
            "2. O que é um discípulo?",
            "3. Como discípulos são multiplicados?",
            "4. Por que discipulado requer relacionamento?",
            "5. Como Jesus fez discípulos?"
          ],
          application: "Você está sendo discipulado por alguém? Você está discipulando alguém? Ore sobre como você pode crescer em ambas as áreas.",
          summary: "A missão central é fazer discípulos - seguidores-aprendizes de Jesus que se reproduzem em outros através de relacionamentos intencionais."
        },
        {
          title: "Todas as Nações: O Alcance da Missão",
          content: `A Grande Comissão especifica o alcance: "todas as nações" (panta ta ethne). Ethne refere-se a grupos étnicos ou povos distintos. A missão não está completa até que discípulos de todos os povos da terra adorem a Cristo.

Esta visão global não é nova no Novo Testamento. Deus prometeu a Abraão: "Em ti serão benditas todas as famílias da terra" (Gênesis 12:3). Os Salmos convidam: "Louvai ao Senhor, vós todos os gentios" (Salmo 117:1). A missão aos gentios estava no plano desde o início.

Jesus ampliou a perspectiva dos discípulos. "Sereis minhas testemunhas tanto em Jerusalém como em toda a Judeia e Samaria e até aos confins da terra" (Atos 1:8). A missão começa localmente, mas não pode parar ali. Círculos cada vez maiores devem ser alcançados.

O Apocalipse mostra o resultado: "Depois destas coisas vi, e eis grande multidão que ninguém podia contar, de todas as nações, tribos, povos e línguas, em pé diante do trono" (Apocalipse 7:9). A missão será bem-sucedida. Representantes de todo povo estarão lá.`,
          references: "Mateus 28:19; Gênesis 12:1-3; Atos 1:8; Apocalipse 7:9-10; Salmo 67",
          questions: [
            "1. O que significa 'todas as nações' (ethne)?",
            "2. Como a missão global aparece no Antigo Testamento?",
            "3. Quais são os círculos de Atos 1:8?",
            "4. O que Apocalipse 7:9 garante?",
            "5. Como você pode participar da missão global?"
          ],
          application: "Ore pelos povos não alcançados. Visite joshuaproject.net para conhecer grupos que ainda não têm acesso ao evangelho.",
          summary: "A missão se estende a todos os povos da terra, cumprindo a promessa a Abraão e garantindo adoradores de toda nação diante do trono."
        },
        {
          title: "Batizando: A Iniciação Pública",
          content: `O batismo é a primeira ordenança mencionada na Grande Comissão. "Batizando-os em nome do Pai, e do Filho, e do Espírito Santo" (Mateus 28:19). O batismo é a iniciação pública na comunidade dos discípulos de Cristo.

O batismo simboliza união com Cristo em Sua morte e ressurreição. "Fomos sepultados com ele pelo batismo na morte; para que, como Cristo ressuscitou dos mortos pela glória do Pai, assim andemos nós também em novidade de vida" (Romanos 6:4). É identificação visível com o evangelho.

O batismo não salva - a fé em Cristo salva. Mas o batismo é a expressão pública dessa fé. Na Igreja primitiva, não havia crentes não batizados. A profissão de fé incluía imediatamente o batismo. Era o passo de obediência inicial.

"Em nome do Pai, e do Filho, e do Espírito Santo" identifica a quem os discípulos pertencem. Não somos batizados em nome de uma denominação, líder ou instituição. Somos batizados no nome do Deus Triúno - pertencemos a Ele.`,
          references: "Mateus 28:19; Romanos 6:3-4; Atos 2:38; Gálatas 3:27; Colossenses 2:12",
          questions: [
            "1. Qual é o significado do batismo?",
            "2. O que o batismo simboliza?",
            "3. O batismo salva?",
            "4. O que significa ser batizado 'em nome da Trindade'?",
            "5. Por que o batismo é importante no discipulado?"
          ],
          application: "Se você ainda não foi batizado, considere dar esse passo de obediência. Se já foi, lembre-se do compromisso que fez.",
          summary: "O batismo é identificação pública com Cristo, simbolizando morte e ressurreição com Ele e pertencimento ao Deus Triúno."
        },
        {
          title: "Ensinando: A Formação Contínua",
          content: `A Grande Comissão não termina com conversão e batismo. Continua: "Ensinando-os a guardar todas as coisas que vos tenho ordenado" (Mateus 28:20). O ensino é componente essencial do fazer discípulos.

Note que o objetivo não é apenas conhecimento, mas obediência. "Guardar todas as coisas" significa praticar. O discipulado bíblico visa transformação de vida, não apenas informação. Saber sem fazer é conhecimento estéril.

O conteúdo é "todas as coisas que vos tenho ordenado." Isso inclui todo o ensino de Jesus - Sermão do Monte, parábolas, mandamentos, exemplos. Discípulos são formados pela totalidade da revelação de Cristo, não apenas pelos tópicos favoritos.

Este ensino acontece na comunidade. A Igreja é a escola de Cristo. Através de cultos, estudos bíblicos, grupos pequenos e relacionamentos de discipulado, os crentes são ensinados a guardar tudo que Cristo ordenou. É processo vitalício de crescimento.`,
          references: "Mateus 28:20; Tiago 1:22; Colossenses 3:16; Efésios 4:11-16; 2 Timóteo 3:16-17",
          questions: [
            "1. Qual é o objetivo do ensino no discipulado?",
            "2. Por que 'guardar' é mais do que 'saber'?",
            "3. O que deve ser ensinado?",
            "4. Onde este ensino acontece?",
            "5. Por que discipulado é processo vitalício?"
          ],
          application: "Avalie: você está apenas aprendendo ou também praticando? Identifique um ensino de Jesus que você conhece mas não está guardando.",
          summary: "O discipulado inclui ensino contínuo visando obediência prática a tudo que Jesus ordenou, dentro da comunidade de fé."
        },
        {
          title: "O Poder do Espírito para a Missão",
          content: `Jesus instruiu os discípulos a esperarem antes de iniciar a missão. "Ficai, porém, na cidade de Jerusalém, até que do alto sejais revestidos de poder" (Lucas 24:49). A missão requer poder sobrenatural.

Em Atos 1:8, Jesus prometeu: "Recebereis poder, ao descer sobre vós o Espírito Santo, e sereis minhas testemunhas." O Espírito é o capacitador da missão. Sem Ele, nossos esforços são meramente humanos. Com Ele, o impossível torna-se possível.

Pentecostes demonstrou este poder. Discípulos medrosos tornaram-se pregadores ousados. Três mil se converteram em um dia. A Igreja nascente enfrentou perseguição com alegria. O Espírito transformou pescadores e cobradores de impostos em agentes de revolução mundial.

O mesmo Espírito está disponível hoje. Não dependemos de nossa eloquência, inteligência ou carisma. "Não por força nem por violência, mas pelo meu Espírito, diz o Senhor" (Zacarias 4:6). A oração por poder do Espírito é pré-requisito para missão eficaz.`,
          references: "Atos 1:8; Lucas 24:49; Atos 2:1-41; Zacarias 4:6; João 15:26-27",
          questions: [
            "1. Por que os discípulos precisavam esperar antes de ir?",
            "2. O que o Espírito Santo capacita?",
            "3. O que Pentecostes demonstrou?",
            "4. Como dependemos do Espírito hoje?",
            "5. Qual a relação entre oração e missão?"
          ],
          application: "Ore pedindo a plenitude do Espírito Santo para testemunhar com ousadia. Peça oportunidades e palavras.",
          summary: "A missão requer o poder do Espírito Santo, que transforma pessoas comuns em testemunhas ousadas e eficazes de Cristo."
        },
        {
          title: "Proclamando o Evangelho",
          content: `A missão central é proclamar as boas novas de Jesus Cristo. "Ide por todo o mundo, pregai o evangelho a toda criatura" (Marcos 16:15). O evangelho - a morte e ressurreição de Cristo para perdão de pecados - é a mensagem que deve ser anunciada.

Paulo resumiu o evangelho: "Cristo morreu por nossos pecados, segundo as Escrituras, e que foi sepultado, e que ressuscitou ao terceiro dia, segundo as Escrituras" (1 Coríntios 15:3-4). Esta é a mensagem que salva. Não pode ser substituída por moralismo, filosofia ou religião genérica.

A proclamação assume várias formas. Pode ser pregação pública ou conversa pessoal. Pode ser através de mídia ou relacionamentos. Pode acontecer em grandes cruzadas ou ao redor de uma mesa de café. O método varia; a mensagem permanece a mesma.

Proclamar exige coragem. Paulo pedia oração "para que me seja dada, no abrir da minha boca, a palavra, para com intrepidez fazer conhecido o mistério do evangelho" (Efésios 6:19). O medo nos silencia. Precisamos de ousadia do Espírito para abrir a boca e falar.`,
          references: "Marcos 16:15; Romanos 10:14-15; 1 Coríntios 15:1-4; 2 Coríntios 5:18-20; Efésios 6:19-20",
          questions: [
            "1. O que deve ser proclamado?",
            "2. Qual é o resumo do evangelho?",
            "3. Quais formas a proclamação pode assumir?",
            "4. Por que precisamos de coragem?",
            "5. O que Paulo pedia em oração para sua proclamação?"
          ],
          application: "Identifique três pessoas que precisam ouvir o evangelho. Ore por elas diariamente e peça oportunidades para compartilhar.",
          summary: "A missão é proclamar o evangelho de Cristo - Sua morte e ressurreição para perdão de pecados - com coragem dada pelo Espírito."
        },
        {
          title: "Vivendo o Evangelho",
          content: `A missão não é apenas verbal; é também vivencial. Jesus disse: "Assim resplandeça a vossa luz diante dos homens, para que vejam as vossas boas obras e glorifiquem a vosso Pai que está nos céus" (Mateus 5:16). Nossas vidas devem autenticar nossa mensagem.

O amor é o testemunho mais poderoso. "Nisto todos conhecerão que sois meus discípulos, se vos amardes uns aos outros" (João 13:35). A qualidade de nossos relacionamentos - na igreja e fora dela - fala alto sobre a realidade de Cristo em nós.

A integridade é essencial. Hipocrisia é o maior obstáculo ao evangelho. Quando nossas vidas contradizem nossas palavras, desacreditamos a mensagem. "Portai-vos de modo digno do evangelho de Cristo" (Filipenses 1:27). O mensageiro afeta a credibilidade da mensagem.

Boas obras demonstram o amor de Cristo de forma tangível. "Façamos bem a todos" (Gálatas 6:10). Cuidar de pobres, doentes, marginalizados - estas ações mostram que o evangelho não é apenas palavra, mas poder que transforma vidas e comunidades.`,
          references: "Mateus 5:13-16; João 13:34-35; Filipenses 1:27; Tiago 2:14-17; 1 Pedro 2:12",
          questions: [
            "1. Por que viver o evangelho é importante?",
            "2. Como o amor funciona como testemunho?",
            "3. Qual é o perigo da hipocrisia?",
            "4. Como boas obras se relacionam com a missão?",
            "5. Sua vida autentica ou contradiz o evangelho?"
          ],
          application: "Peça a uma pessoa próxima feedback honesto: 'Minha vida reflete o que digo crer?' Esteja aberto a ouvir.",
          summary: "A missão inclui viver o evangelho através de amor, integridade e boas obras que autenticam a mensagem proclamada."
        },
        {
          title: "Orando pela Colheita",
          content: `Jesus instruiu: "Rogai, pois, ao Senhor da seara, que mande ceifeiros para a sua seara" (Mateus 9:38). A oração é componente essencial da missão. Antes de ir, oramos. Enquanto vamos, oramos. A missão é sustentada pela oração.

A oração prepara corações. Oramos por aqueles que precisam ouvir o evangelho - que seus corações sejam abertos, que tenham fome espiritual, que encontrem crentes para testemunhar. A oração precede a conversão, trabalhando no invisível.

A oração levanta obreiros. Jesus observou que "a seara é realmente grande, mas poucos os ceifeiros" (Mateus 9:37). Oramos para que Deus chame, capacite e envie mais trabalhadores. Talvez em resposta a essa oração, Ele nos envie.

A oração sustenta missionários. Paulo constantemente pedia oração das igrejas. "Finalmente, irmãos, orai por nós" (2 Tessalonicenses 3:1). Aqueles que vão precisam daqueles que oram. A oração é parceria na missão, não atividade de segunda classe.`,
          references: "Mateus 9:37-38; Colossenses 4:2-4; Romanos 10:1; Efésios 6:18-20; 2 Tessalonicenses 3:1",
          questions: [
            "1. Por que a oração é essencial para a missão?",
            "2. Como a oração prepara corações?",
            "3. Por que devemos orar por obreiros?",
            "4. Como a oração sustenta missionários?",
            "5. Você ora regularmente pela missão?"
          ],
          application: "Comece a orar diariamente por um país ou grupo não alcançado. Ore também por missionários que você conhece.",
          summary: "A oração é fundamento da missão - prepara corações, levanta obreiros e sustenta aqueles que vão."
        },
        {
          title: "Sua Parte na Grande Comissão",
          content: `A Grande Comissão é para todos, mas nem todos têm o mesmo papel. Alguns são chamados a ir a lugares distantes; outros são chamados a enviar, sustentar e orar. Todos são chamados a testemunhar onde estão. A missão requer o corpo inteiro.

Pergunte: "O que Deus está me chamando a fazer?" Pode ser um chamado missionário transcultural. Pode ser discipular vizinhos e colegas. Pode ser sustentar financeiramente obreiros. Pode ser mobilizar sua igreja para missões. Sua parte é única e importante.

Barreiras devem ser enfrentadas. Medo, conforto, materialismo, falta de preparo - muitos obstáculos nos impedem. Mas se Cristo é Senhor, Suas prioridades devem ser nossas. A Grande Comissão não é opcional para quem realmente O segue.

A recompensa é eterna. "Os que a muitos ensinam a justiça resplandecerão como as estrelas, sempre e eternamente" (Daniel 12:3). Não há investimento mais significativo do que participar da missão de Deus. O que fazemos para a eternidade tem valor eterno.`,
          references: "Romanos 10:14-15; 3 João 5-8; Atos 13:1-3; Daniel 12:3; 1 Coríntios 3:12-15",
          questions: [
            "1. Todos devem ser missionários transculturais?",
            "2. Quais são as diferentes formas de participar?",
            "3. Quais barreiras você enfrenta?",
            "4. O que Cristo sendo Senhor implica para sua vida?",
            "5. Qual recompensa aguarda os que participam?"
          ],
          application: "Ore sinceramente: 'Senhor, qual é minha parte na Grande Comissão?' Esteja disposto a obedecer o que Ele mostrar.",
          summary: "Cada crente tem um papel na Grande Comissão - ir, enviar, orar, dar - e participar traz recompensa eterna."
        }
      ])
    }
  ]
};

// Export all Level 1 modules 13-15
export const NIVEL_1_MODULOS_13_15: ModuleData[] = [
  MODULO_13_ATRIBUTOS,
  MODULO_14_REDENCAO,
  MODULO_15_GRANDE_COMISSAO,
];
