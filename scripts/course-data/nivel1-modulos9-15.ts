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

// MÓDULO 9: Escatologia Básica
const MODULO_9_ESCATOLOGIA: ModuleData = {
  id: "modulo-9-escatologia-basica",
  name: "Escatologia Básica",
  description: "Fundamentos sobre os últimos tempos, a segunda vinda de Cristo e a esperança eterna",
  icon: "Clock",
  color: "#9333EA",
  order: 9,
  tracks: [
    {
      id: "track-9-iniciante",
      level: "iniciante",
      name: "Introdução à Escatologia",
      description: "Conceitos fundamentais sobre os eventos futuros revelados nas Escrituras",
      requiredPlan: "premium",
      order: 1,
      lessons: createLessons("mod9", [
        {
          title: "O Que é Escatologia?",
          content: `A escatologia é o estudo das últimas coisas, derivada do grego "eschatos" (último) e "logos" (estudo). Esta disciplina teológica examina o que as Escrituras revelam sobre o futuro da humanidade, da Igreja e do cosmos.

A Bíblia não foi escrita para satisfazer nossa curiosidade sobre datas e eventos, mas para nos preparar espiritualmente para o encontro com Cristo. A escatologia bíblica sempre tem um propósito prático: motivar a santidade, encorajar a perseverança e fortalecer a esperança.

Desde o Antigo Testamento, os profetas anunciaram um "Dia do Senhor" - um tempo de julgamento e restauração. No Novo Testamento, esta esperança se concentra na pessoa de Jesus Cristo, que prometeu voltar para completar a obra de redenção.

A escatologia não é apenas sobre o futuro distante, mas sobre como vivemos hoje. O apóstolo João declara que "todo aquele que nele tem esta esperança purifica-se a si mesmo, como também ele é puro" (1 João 3:3). Nossa visão do futuro molda nosso presente.`,
          references: "1 João 3:1-3; Amós 5:18-20; 2 Pedro 3:10-14",
          questions: [
            "1. Por que é importante estudar escatologia?",
            "2. Como a esperança futura deve afetar nossa vida presente?",
            "3. Qual é o perigo de estudar profecia apenas por curiosidade?",
            "4. O que significa o 'Dia do Senhor' nas Escrituras?",
            "5. Como a escatologia está conectada à santificação?"
          ],
          application: "Reflita sobre como sua visão do futuro afeta suas decisões diárias. Liste três áreas onde a esperança da vinda de Cristo pode motivar maior fidelidade.",
          summary: "A escatologia estuda os eventos finais revelados nas Escrituras, visando preparar-nos espiritualmente para o encontro com Cristo."
        },
        {
          title: "A Certeza da Segunda Vinda",
          content: `A promessa mais frequente do Novo Testamento é a segunda vinda de Cristo. Mencionada em praticamente todos os livros, esta doutrina é central para a fé cristã. Os anjos no monte da Ascensão declararam: "Esse Jesus, que dentre vós foi elevado ao céu, há de vir assim como o vistes subir" (Atos 1:11).

Jesus mesmo prometeu repetidamente que voltaria. Em João 14:3, Ele assegura: "Virei outra vez, e vos levarei para mim mesmo." Esta promessa sustentou a Igreja através de perseguições, dificuldades e séculos de espera.

A segunda vinda será literal, pessoal e visível. Não será um evento místico ou simbólico, mas a manifestação gloriosa do Senhor. "Eis que vem com as nuvens, e todo olho o verá" (Apocalipse 1:7). Cristo virá da mesma forma que partiu - visivelmente, corporalmente, gloriosamente.

Embora não saibamos o momento exato, temos a certeza do evento. Jesus disse: "Daquele dia e hora ninguém sabe... senão o Pai" (Mateus 24:36). Nossa tarefa não é calcular datas, mas viver em constante prontidão.`,
          references: "Atos 1:9-11; João 14:1-3; Apocalipse 1:7; Mateus 24:36-44",
          questions: [
            "1. Por que a segunda vinda é tão central no Novo Testamento?",
            "2. Como Jesus descreveu Sua própria volta?",
            "3. O que significa dizer que a vinda será 'literal, pessoal e visível'?",
            "4. Por que Deus não revelou a data exata?",
            "5. Como devemos responder à incerteza quanto ao momento?"
          ],
          application: "Se você soubesse que Cristo voltaria amanhã, o que faria diferente hoje? Use essa reflexão para avaliar suas prioridades atuais.",
          summary: "A segunda vinda de Cristo é uma promessa certa, literal e pessoal que sustenta a esperança da Igreja através dos séculos."
        },
        {
          title: "O Reino de Deus: Presente e Futuro",
          content: `O Reino de Deus é o tema central da pregação de Jesus. Ele veio anunciando: "O Reino de Deus está próximo; arrependei-vos e crede no evangelho" (Marcos 1:15). Este Reino possui uma dimensão presente e outra futura.

No presente, o Reino já chegou na pessoa de Jesus. Quando Ele expulsava demônios, declarou: "Se eu expulso os demônios pelo Espírito de Deus, é conseguintemente chegado a vós o Reino de Deus" (Mateus 12:28). Todo crente já participa deste Reino, pois "Deus nos transportou para o Reino do Filho do seu amor" (Colossenses 1:13).

Contudo, a consumação plena do Reino aguarda o futuro. Oramos "Venha o teu Reino" porque ainda não vemos sua manifestação completa. Há pecado, sofrimento e morte. O Reino presente é como uma semente que cresce gradualmente, mas a colheita final ainda virá.

Esta tensão entre o "já" e o "ainda não" define a vida cristã. Experimentamos as bênçãos do Reino enquanto aguardamos sua plenitude. Vivemos entre a primeira e a segunda vinda, entre a inauguração e a consumação.`,
          references: "Marcos 1:14-15; Mateus 12:28; Colossenses 1:13; Mateus 6:10",
          questions: [
            "1. Como o Reino de Deus está presente hoje?",
            "2. Por que ainda oramos 'Venha o teu Reino'?",
            "3. O que significa a tensão entre o 'já' e o 'ainda não'?",
            "4. Como Jesus demonstrou a chegada do Reino?",
            "5. Qual é nossa responsabilidade como cidadãos do Reino?"
          ],
          application: "Identifique três maneiras pelas quais você pode manifestar o Reino de Deus em sua vida diária - no trabalho, família e comunidade.",
          summary: "O Reino de Deus está presente na vida dos crentes, mas aguarda sua consumação plena na volta de Cristo."
        },
        {
          title: "A Ressurreição dos Mortos",
          content: `A ressurreição corporal é uma doutrina fundamental do cristianismo. Paulo declara: "Se os mortos não ressuscitam, também Cristo não ressuscitou; e se Cristo não ressuscitou, é vã a vossa fé" (1 Coríntios 15:16-17). A ressurreição de Cristo garante a nossa.

Diferente de conceitos gregos sobre a imortalidade da alma apenas, a visão bíblica inclui o corpo. Deus criou o ser humano como unidade de corpo e alma, e a redenção abrange ambos. "Semeia-se corpo natural, ressuscita corpo espiritual" (1 Coríntios 15:44).

O corpo ressurreto será glorificado, semelhante ao corpo ressurreto de Cristo. Será real e tangível (Jesus comeu peixe após a ressurreição), mas também transformado (Ele atravessou portas fechadas). Será incorruptível, imortal e glorioso.

Esta esperança transforma nossa visão da morte. Paulo pode dizer: "Onde está, ó morte, a tua vitória? Onde está, ó morte, o teu aguilhão?" (1 Coríntios 15:55). A morte não é o fim, mas a passagem para a vida plena com Cristo.`,
          references: "1 Coríntios 15:12-58; João 20:19-29; Filipenses 3:20-21",
          questions: [
            "1. Por que a ressurreição corporal é essencial à fé cristã?",
            "2. Como o corpo ressurreto será diferente do atual?",
            "3. O que a ressurreição de Cristo garante sobre a nossa?",
            "4. Como esta doutrina difere de conceitos de 'imortalidade da alma'?",
            "5. Como a esperança da ressurreição deve afetar nossa visão da morte?"
          ],
          application: "Escreva uma carta a si mesmo sobre como a esperança da ressurreição muda sua perspectiva sobre perdas, envelhecimento ou medo da morte.",
          summary: "A ressurreição corporal dos crentes, garantida pela ressurreição de Cristo, é a esperança central da fé cristã."
        },
        {
          title: "O Julgamento Final",
          content: `As Escrituras ensinam claramente que haverá um julgamento final. "Porque todos devemos comparecer ante o tribunal de Cristo, para que cada um receba segundo o que tiver feito por meio do corpo, ou bem, ou mal" (2 Coríntios 5:10). Este julgamento será universal, justo e definitivo.

Para os crentes, este julgamento não determina salvação - esta já foi garantida pela fé em Cristo. O julgamento avalia obras e fidelidade. Paulo descreve como ouro, prata e pedras preciosas serão testados pelo fogo, e alguns receberão recompensa enquanto outros sofrerão perda, embora sejam salvos (1 Coríntios 3:12-15).

Para os incrédulos, o julgamento confirma sua escolha de rejeitar Cristo. Apocalipse 20 descreve o "grande trono branco" onde todos serão julgados "segundo as suas obras" (Apocalipse 20:12). Aqueles cujos nomes não estão no livro da vida enfrentarão a separação eterna de Deus.

A certeza do julgamento deve motivar evangelismo e santidade. Conhecendo "o temor do Senhor, persuadimos os homens" (2 Coríntios 5:11). Não julgamos os outros, mas vivemos conscientes de que prestaremos contas ao Justo Juiz.`,
          references: "2 Coríntios 5:10-11; 1 Coríntios 3:10-15; Apocalipse 20:11-15; Romanos 14:10-12",
          questions: [
            "1. O que será julgado no tribunal de Cristo para os crentes?",
            "2. Qual é a base do julgamento dos incrédulos?",
            "3. Como a certeza do julgamento deve afetar nosso evangelismo?",
            "4. Qual é a diferença entre salvação e recompensa?",
            "5. Como manter equilíbrio entre graça e responsabilidade?"
          ],
          application: "Avalie três áreas de sua vida à luz do tribunal de Cristo. Identifique o que você está construindo - ouro, prata, palha?",
          summary: "O julgamento final avaliará as obras dos crentes para recompensa e confirmará a escolha dos incrédulos que rejeitaram Cristo."
        },
        {
          title: "O Céu: Nossa Esperança Eterna",
          content: `O céu é a presença plena de Deus, o destino final dos redimidos. Jesus prometeu: "Na casa de meu Pai há muitas moradas... vou preparar-vos lugar" (João 14:2). Esta não é uma existência etérea, mas vida abundante e real.

A descrição bíblica do céu enfatiza o que estará ausente: "E Deus limpará de seus olhos toda a lágrima; e não haverá mais morte, nem pranto, nem clamor, nem dor" (Apocalipse 21:4). Tudo que nos aflige será removido permanentemente.

Mais importante que o lugar é a Pessoa. O céu é estar "com Cristo, o que é muito melhor" (Filipenses 1:23). Veremos Sua face, serviremos a Ele e reinaremos com Ele. A comunhão íntima com Deus, prejudicada pelo pecado no Éden, será plenamente restaurada.

O céu não será monotonia, mas atividade significativa. Apocalipse descreve adoração vibrante, serviço a Deus e governo sobre a nova criação. Seremos plenamente nós mesmos, finalmente livres para ser tudo o que Deus nos criou para ser.`,
          references: "João 14:1-3; Apocalipse 21:1-7; Filipenses 1:21-23; Apocalipse 22:1-5",
          questions: [
            "1. O que é mais central no céu - o lugar ou a Pessoa?",
            "2. O que estará ausente no céu?",
            "3. Por que a visão de inatividade eterna é incorreta?",
            "4. Como o céu restaura o que foi perdido no Éden?",
            "5. Como a esperança do céu deve afetar nossa vida presente?"
          ],
          application: "Liste três aspectos do céu que mais atraem seu coração. Ore agradecendo a Deus por esta esperança e peça que ela molde suas prioridades.",
          summary: "O céu é a presença plena de Deus, onde toda dor será removida e desfrutaremos comunhão perfeita com Cristo eternamente."
        },
        {
          title: "O Inferno: A Realidade do Julgamento",
          content: `Poucos assuntos são tão difíceis quanto a doutrina do inferno, mas Jesus falou sobre ele mais do que qualquer outro no Novo Testamento. Ele advertiu sobre "onde o seu bicho não morre, e o fogo nunca se apaga" (Marcos 9:48) e "as trevas exteriores; ali haverá pranto e ranger de dentes" (Mateus 25:30).

O inferno é primariamente separação de Deus. Para aqueles que passaram a vida rejeitando Deus, o julgamento é simplesmente a confirmação eterna de sua escolha. C.S. Lewis observou que as portas do inferno estão trancadas por dentro - pessoas que não querem Deus recebem exatamente o que escolheram.

A seriedade do inferno revela a gravidade do pecado e a santidade de Deus. Também magnifica a grandeza da graça - o que Cristo suportou na cruz foi precisamente para nos livrar deste destino. "Deus prova o seu amor para conosco, em que Cristo morreu por nós, sendo nós ainda pecadores" (Romanos 5:8).

Esta doutrina deve nos mover à compaixão, não ao julgamento dos outros. Paulo, contemplando a realidade do julgamento, declarou: "Ai de mim, se não anunciar o evangelho!" (1 Coríntios 9:16). A urgência da missão brota da realidade do destino eterno.`,
          references: "Marcos 9:42-48; Mateus 25:30-46; Romanos 5:8; 2 Tessalonicenses 1:8-9",
          questions: [
            "1. Por que Jesus falou tanto sobre o inferno?",
            "2. O que significa dizer que o inferno é 'separação de Deus'?",
            "3. Como esta doutrina revela a gravidade do pecado?",
            "4. Qual deve ser nossa resposta à realidade do julgamento?",
            "5. Como equilibrar amor e advertência ao compartilhar o evangelho?"
          ],
          application: "Ore por três pessoas que você conhece que ainda não conhecem Cristo. Peça oportunidades e coragem para compartilhar o evangelho com elas.",
          summary: "O inferno é a separação eterna de Deus, realidade que magnifica tanto a gravidade do pecado quanto a grandeza da graça salvadora."
        },
        {
          title: "Sinais dos Tempos",
          content: `Jesus instruiu Seus discípulos a observarem os sinais que precederiam Sua volta. Em Mateus 24, Ele mencionou guerras, fomes, terremotos, falsos cristos, perseguição e a pregação do evangelho a todas as nações. Estes são como "dores de parto" que se intensificam antes do fim.

É crucial manter equilíbrio ao interpretar estes sinais. Muitos erraram ao fixar datas ou identificar eventos específicos como cumprimento final de profecias. Jesus advertiu: "Vigiai, pois, porque não sabeis em que dia vem o vosso Senhor" (Mateus 24:42). Os sinais servem para manter-nos alertas, não para alimentar especulação.

O sinal mais importante é a proclamação mundial do evangelho. "E este evangelho do Reino será pregado em todo o mundo, em testemunho a todas as nações, e então virá o fim" (Mateus 24:14). Nosso foco deve estar na missão, não em cálculos cronológicos.

Os sinais também servem como lembretes de que este mundo não é nosso lar permanente. Crises e turbulências nos recordam que "aqui não temos cidade permanente, mas buscamos a futura" (Hebreus 13:14). Cada dificuldade aponta para a necessidade da intervenção final de Deus.`,
          references: "Mateus 24:1-44; Lucas 21:25-36; 2 Timóteo 3:1-5; Hebreus 13:14",
          questions: [
            "1. Quais sinais Jesus mencionou que precederiam Sua volta?",
            "2. Por que devemos evitar fixar datas?",
            "3. Qual é o sinal mais importante segundo Jesus?",
            "4. Como os sinais devem afetar nossa postura?",
            "5. Como manter equilíbrio entre vigilância e vida normal?"
          ],
          application: "Em vez de especular sobre sinais, avalie sua participação na Grande Comissão. Como você está contribuindo para a proclamação do evangelho?",
          summary: "Os sinais dos tempos servem para manter-nos alertas e focados na missão, não para especulação sobre datas."
        },
        {
          title: "A Nova Criação",
          content: `O plano de Deus não termina com almas no céu, mas com uma nova criação. "Vi novo céu e nova terra... a santa cidade, a nova Jerusalém, que de Deus descia do céu" (Apocalipse 21:1-2). Deus não abandona Sua criação - Ele a redime e renova.

Esta visão corrige ideias de que o mundo físico seja inferior ou descartável. Deus criou o mundo material e o declarou "muito bom" (Gênesis 1:31). A redenção inclui não apenas almas, mas "a própria criação será libertada da escravidão da corrupção" (Romanos 8:21).

A nova Jerusalém une céu e terra. Deus habitará com Seu povo: "Eis aqui o tabernáculo de Deus com os homens, pois com eles habitará" (Apocalipse 21:3). A separação entre sagrado e secular será abolida; toda a realidade será permeada pela presença divina.

Esta esperança transforma como vemos nossa responsabilidade atual. O trabalho, a cultura, o cuidado com a criação - tudo ganha significado eterno. Não estamos apenas esperando escapar deste mundo, mas participando da renovação que Deus completará.`,
          references: "Apocalipse 21:1-5; Romanos 8:18-25; 2 Pedro 3:13; Isaías 65:17-25",
          questions: [
            "1. Por que Deus criará uma 'nova terra' e não apenas levará almas ao céu?",
            "2. O que isso revela sobre a visão bíblica do mundo material?",
            "3. O que significa Deus habitar com os homens?",
            "4. Como esta visão afeta nossa responsabilidade ambiental?",
            "5. De que forma nosso trabalho atual tem significado eterno?"
          ],
          application: "Considere como seu trabalho, hobbies ou cuidado com a criação podem refletir a esperança da renovação. Identifique uma forma prática de expressar isso.",
          summary: "Deus não abandonará Sua criação, mas a renovará completamente, habitando eternamente com Seu povo redimido."
        },
        {
          title: "Vivendo à Luz da Eternidade",
          content: `O estudo da escatologia deve culminar em transformação prática. Pedro, após descrever a dissolução dos céus e da terra, pergunta: "Visto que todas estas coisas hão de ser assim dissolvidas, que pessoas deveis vós ser?" (2 Pedro 3:11). A resposta: vida santa e piedosa.

A perspectiva eterna reordena prioridades. Jesus ensinou: "Ajuntai tesouros no céu, onde a traça e a ferrugem não consomem" (Mateus 6:20). Investir no que é temporário à custa do eterno é profunda tolice. A vida breve exige escolhas sábias.

A esperança escatológica também produz perseverança. "Porque a nossa leve e momentânea tribulação produz para nós cada vez mais abundantemente um eterno peso de glória" (2 Coríntios 4:17). Os sofrimentos presentes tornam-se suportáveis à luz da glória futura.

Finalmente, a escatologia alimenta a missão. O tempo é limitado, a tarefa é urgente, e a eternidade está em jogo. Como Paulo, devemos viver "como tendo nada, e possuindo tudo" (2 Coríntios 6:10), livres para servir porque nossa recompensa está garantida no céu.`,
          references: "2 Pedro 3:11-14; Mateus 6:19-21; 2 Coríntios 4:16-18; Colossenses 3:1-4",
          questions: [
            "1. Como a perspectiva eterna reordena prioridades?",
            "2. O que significa 'ajuntar tesouros no céu'?",
            "3. Como a esperança produz perseverança no sofrimento?",
            "4. Qual é a conexão entre escatologia e missão?",
            "5. O que precisa mudar em sua vida à luz da eternidade?"
          ],
          application: "Faça uma 'auditoria de eternidade' - avalie onde você investe tempo, energia e recursos. Identifique três ajustes para alinhar-se com prioridades eternas.",
          summary: "A escatologia bíblica transforma nossa vida presente, reordenando prioridades, produzindo perseverança e motivando a missão."
        }
      ])
    }
  ]
};

// MÓDULO 10: A Oração na Vida Cristã
const MODULO_10_ORACAO: ModuleData = {
  id: "modulo-10-oracao-vida-crista",
  name: "A Oração na Vida Cristã",
  description: "Aprendendo a se comunicar com Deus através da oração",
  icon: "MessageCircle",
  color: "#0EA5E9",
  order: 10,
  tracks: [
    {
      id: "track-10-iniciante",
      level: "iniciante",
      name: "Fundamentos da Oração",
      description: "Princípios essenciais para uma vida de oração eficaz",
      requiredPlan: "premium",
      order: 1,
      lessons: createLessons("mod10", [
        {
          title: "O Que é Oração?",
          content: `A oração é o privilégio extraordinário de comunicação direta com o Criador do universo. Não é um ritual religioso ou uma fórmula mágica, mas relacionamento vivo com nosso Pai celestial. Jesus ensinou: "Vós orareis assim: Pai nosso" (Mateus 6:9), revelando a intimidade que a oração proporciona.

Na oração, falamos com Deus e Ele fala conosco. É uma via de mão dupla onde expressamos adoração, confissão, gratidão e súplica, mas também ouvimos Sua voz através de Sua Palavra e pelo Espírito Santo. A oração muda situações, mas principalmente muda a nós mesmos.

A oração é possível por causa da obra de Cristo. O véu que separava o homem de Deus foi rasgado na cruz, abrindo acesso direto ao trono da graça. "Tendo, pois, irmãos, ousadia para entrar no santuário, pelo sangue de Jesus" (Hebreus 10:19). Não precisamos de intermediários humanos.

Orar não é informar Deus do que Ele não sabe, nem convencê-lo do que Ele não quer fazer. É alinhar nosso coração com o Seu, participar de Seus propósitos e experimentar Sua presença. A oração é o oxigênio da vida espiritual.`,
          references: "Mateus 6:5-15; Hebreus 10:19-22; Filipenses 4:6-7; Jeremias 33:3",
          questions: [
            "1. Por que a oração é chamada de privilégio?",
            "2. O que possibilita nosso acesso a Deus em oração?",
            "3. Por que oramos se Deus já sabe de tudo?",
            "4. Como a oração difere de rituais religiosos?",
            "5. O que significa a oração ser 'via de mão dupla'?"
          ],
          application: "Esta semana, antes de cada oração, pause para lembrar que você está entrando na presença do Rei do universo - seu Pai amoroso.",
          summary: "A oração é comunicação íntima com Deus, possibilitada pela obra de Cristo, que transforma tanto situações quanto nosso próprio coração."
        },
        {
          title: "A Oração do Pai Nosso como Modelo",
          content: `Jesus deu o "Pai Nosso" como modelo de oração (Mateus 6:9-13). Esta oração não é apenas para repetição, mas um padrão que estrutura nossa comunicação com Deus. Cada frase revela prioridades divinas.

"Pai nosso, que estás nos céus" - começamos reconhecendo quem Deus é: nosso Pai amoroso e o Soberano celestial. "Santificado seja o teu nome" - antes de pedir qualquer coisa, adoramos e honramos Seu nome santo. A adoração precede a petição.

"Venha o teu Reino; seja feita a tua vontade" - submetemos nossa vontade à dEle, buscando primeiro Seu Reino e Sua justiça. "O pão nosso de cada dia dá-nos hoje" - então pedimos provisão para necessidades práticas, reconhecendo dependência diária.

"Perdoa-nos as nossas dívidas, assim como nós perdoamos" - confessamos pecados e nos comprometemos com reconciliação. "Não nos deixes cair em tentação, mas livra-nos do mal" - pedimos proteção espiritual. Esta estrutura nos ensina a ordem correta: Deus primeiro, depois nós.`,
          references: "Mateus 6:9-13; Lucas 11:1-4; Mateus 6:33",
          questions: [
            "1. Por que começar a oração reconhecendo quem Deus é?",
            "2. O que significa 'santificado seja o teu nome'?",
            "3. Por que pedir o Reino de Deus antes de nossas necessidades?",
            "4. Como a confissão e o perdão estão conectados?",
            "5. O que esta oração revela sobre dependência diária?"
          ],
          application: "Use cada frase do Pai Nosso como um 'título' para expandir em suas próprias palavras. Faça isso diariamente por uma semana.",
          summary: "O Pai Nosso é um modelo que estrutura a oração: adoração, submissão à vontade de Deus, petição, confissão e proteção espiritual."
        },
        {
          title: "Diferentes Tipos de Oração",
          content: `As Escrituras revelam várias formas de oração, cada uma apropriada para diferentes momentos e necessidades. Conhecê-las enriquece nossa vida de oração e previne a monotonia.

A adoração foca inteiramente em quem Deus é, não no que Ele faz por nós. "Ao Rei dos séculos, imortal, invisível, ao único Deus, seja honra e glória para todo o sempre" (1 Timóteo 1:17). A ação de graças agradece pelo que Deus fez, reconhecendo Suas bênçãos.

A confissão é o reconhecimento honesto de nossos pecados. "Se confessarmos os nossos pecados, ele é fiel e justo para nos perdoar" (1 João 1:9). A súplica apresenta nossas necessidades: "Em tudo, porém, sejam conhecidas diante de Deus as vossas petições" (Filipenses 4:6).

A intercessão ora pelos outros - família, igreja, nação, mundo. Paulo constantemente intercedia por suas igrejas. A lamentação expressa dor e confusão a Deus, como vemos nos Salmos. Todas estas formas são legítimas e necessárias para uma vida de oração saudável.`,
          references: "1 Timóteo 1:17; 1 João 1:9; Filipenses 4:6; Colossenses 1:9-12; Salmo 13",
          questions: [
            "1. Qual a diferença entre adoração e ação de graças?",
            "2. Por que a confissão é essencial na vida de oração?",
            "3. O que caracteriza a intercessão?",
            "4. Quando a lamentação é apropriada?",
            "5. Qual tipo de oração está mais ausente em sua vida?"
          ],
          application: "Nesta semana, pratique intencionalmente um tipo de oração diferente a cada dia. Note como isso enriquece sua comunicação com Deus.",
          summary: "A vida de oração saudável inclui adoração, ação de graças, confissão, súplica, intercessão e até lamentação."
        },
        {
          title: "Obstáculos à Oração Respondida",
          content: `As Escrituras identificam condições que podem impedir nossas orações de serem respondidas. Conhecê-las nos ajuda a remover barreiras e restaurar comunhão eficaz com Deus.

O pecado não confessado é o obstáculo mais óbvio. "Se eu no meu coração contemplasse a iniquidade, o Senhor não me teria ouvido" (Salmo 66:18). Isaías 59:2 confirma: "Vossas iniquidades fazem separação entre vós e o vosso Deus; e os vossos pecados encobrem o seu rosto."

Motivos errados também bloqueiam respostas. "Pedis, e não recebeis, porque pedis mal, para o gastardes em vossos prazeres" (Tiago 4:3). Deus não alimenta nosso egoísmo. Da mesma forma, falta de fé prejudica: "Peça-a, porém, com fé, não duvidando" (Tiago 1:6).

Relacionamentos danificados, especialmente no casamento, afetam a oração: "Maridos... tratando-a com consideração... para que as vossas orações não sejam interrompidas" (1 Pedro 3:7). A recusa em perdoar também nos desconecta da graça (Mateus 6:14-15). Deus nos convida a examinar nossos corações.`,
          references: "Salmo 66:18; Isaías 59:1-2; Tiago 4:3; 1 Pedro 3:7; Mateus 6:14-15",
          questions: [
            "1. Por que o pecado não confessado bloqueia a oração?",
            "2. O que são 'motivos errados' ao pedir?",
            "3. Como relacionamentos danificados afetam a oração?",
            "4. Por que a falta de perdão é tão séria?",
            "5. Como examinar nosso coração antes de orar?"
          ],
          application: "Peça ao Espírito Santo que revele qualquer obstáculo em sua vida de oração. Confesse e abandone o que Ele mostrar.",
          summary: "Pecado não confessado, motivos errados, falta de fé, relacionamentos danificados e recusa em perdoar podem bloquear a oração."
        },
        {
          title: "Perseverança na Oração",
          content: `Jesus ensinou sobre a necessidade de persistência na oração através de parábolas memoráveis. A viúva insistente (Lucas 18:1-8) ilustra "que deviam orar sempre, e não desfalecer." O amigo à meia-noite (Lucas 11:5-8) mostra que a insistência obtém resposta.

Perseverar em oração não é tentar convencer um Deus relutante. É demonstrar que nossa necessidade é real, que confiamos em Deus e que nosso desejo está alinhado com Sua vontade. A persistência desenvolve fé e caráter.

Por que Deus às vezes demora? Os propósitos são variados: fortalecer nossa fé, purificar nossos motivos, ensinar dependência, ou aguardar o tempo perfeito. Daniel orou 21 dias antes de receber resposta (Daniel 10:12-13). Ana orou anos por um filho. O tempo de Deus é perfeito.

A perseverança também inclui orar de diferentes formas sobre o mesmo assunto. Podemos suplicar, agradecer antecipadamente, jejuar, buscar promessas bíblicas e convidar outros a orar conosco. A oração persistente é criativa e confiante.`,
          references: "Lucas 18:1-8; Lucas 11:5-8; Daniel 10:12-13; 1 Samuel 1:9-20; Colossenses 4:2",
          questions: [
            "1. O que as parábolas de Jesus ensinam sobre persistência?",
            "2. Por que Deus às vezes demora em responder?",
            "3. O que a persistência desenvolve em nós?",
            "4. Como perseverar sem se tornar ansioso?",
            "5. O que aprendemos com as demoras de Daniel e Ana?"
          ],
          application: "Escolha uma necessidade pela qual você tem orado sem resposta visível. Comprometa-se a perseverar por mais 30 dias, usando diferentes formas de oração.",
          summary: "A persistência na oração demonstra fé, desenvolve caráter e alinha nosso coração com o tempo e os propósitos de Deus."
        },
        {
          title: "O Papel do Espírito Santo na Oração",
          content: `A oração cristã não é esforço meramente humano - é habilitada pelo Espírito Santo. "Semelhantemente também o Espírito socorre a nossa fraqueza; porque não sabemos orar como convém, mas o Espírito intercede por nós com gemidos inexprimíveis" (Romanos 8:26).

O Espírito nos ensina a orar. Frequentemente não sabemos pelo que orar ou como expressar nossas necessidades. O Espírito traduz nossos gemidos em linguagem celestial e ora conforme a vontade de Deus. Ele faz nossas orações eficazes.

O Espírito também nos direciona no que orar. Ele traz pessoas à mente para intercedermos, revela necessidades e cria "peso de oração" sobre assuntos específicos. Orar "no Espírito" (Efésios 6:18, Judas 20) significa orar sob Sua direção e capacitação.

Quando estamos secos demais para orar, o Espírito intercede. Quando não temos palavras, Ele as supre. Quando não conhecemos a vontade de Deus, Ele a revela. A oração é Trindade em ação: o Espírito nos capacita, Jesus intercede como nosso Sumo Sacerdote, e o Pai ouve e responde.`,
          references: "Romanos 8:26-27; Efésios 6:18; Judas 20; Hebreus 7:25; Gálatas 4:6",
          questions: [
            "1. Como o Espírito 'socorre nossa fraqueza' na oração?",
            "2. O que significa orar 'no Espírito'?",
            "3. Como o Espírito nos direciona na oração?",
            "4. Qual é o papel de cada Pessoa da Trindade na oração?",
            "5. O que fazer quando nos sentimos 'secos' para orar?"
          ],
          application: "Antes de orar esta semana, convide conscientemente o Espírito Santo para guiar sua oração. Pause para ouvir Sua direção.",
          summary: "O Espírito Santo capacita, ensina, direciona e intercede através de nós, tornando nossas orações eficazes."
        },
        {
          title: "Oração e a Vontade de Deus",
          content: `Um dos maiores desafios na oração é discernir e submeter-se à vontade de Deus. Jesus no Getsêmani modelou esta tensão: "Pai, se queres, afasta de mim este cálice; contudo, não se faça a minha vontade, mas a tua" (Lucas 22:42).

Existem três tipos de vontade de Deus. A vontade soberana é Seu plano que certamente acontecerá. A vontade moral são Seus mandamentos revelados nas Escrituras. A vontade específica é Sua direção para decisões particulares em nossa vida. Orar é buscar alinhamento com todas estas.

Quando oramos segundo a vontade de Deus, temos confiança na resposta. "E esta é a confiança que temos nele, que se pedirmos alguma coisa segundo a sua vontade, ele nos ouve" (1 João 5:14). Conhecer a Palavra de Deus é essencial para orar segundo Sua vontade.

Submeter-se à vontade de Deus não é passividade resignada, mas confiança ativa. Apresentamos nossos pedidos com ousadia, mas os seguramos levemente, confiando que Deus sabe o melhor. "Não" ou "espere" são respostas tão válidas quanto "sim."`,
          references: "Lucas 22:42; 1 João 5:14-15; Romanos 12:2; Mateus 26:39-42",
          questions: [
            "1. Como Jesus modelou submissão na oração?",
            "2. Quais são os três tipos de vontade de Deus?",
            "3. Por que conhecer a Bíblia é essencial para orar?",
            "4. Como equilibrar ousadia e submissão?",
            "5. Como responder quando a resposta é 'não'?"
          ],
          application: "Em suas orações desta semana, pratique adicionar 'mas seja feita a tua vontade' genuinamente, não como desculpa, mas como confiança.",
          summary: "Orar segundo a vontade de Deus combina ousadia em pedir com humilde submissão ao Seu plano perfeito."
        },
        {
          title: "Estabelecendo uma Vida de Oração",
          content: `A oração consistente não acontece por acaso - requer intencionalidade. Jesus tinha o hábito de retirar-Se para orar (Lucas 5:16). Daniel orava três vezes ao dia apesar do decreto real (Daniel 6:10). Precisamos estabelecer ritmos de oração.

Escolha um tempo e lugar. Muitos acham a manhã ideal - apresentar o dia a Deus antes que as urgências dominem. Jesus frequentemente orava de madrugada (Marcos 1:35). Outros preferem a noite para reflexão. O importante é consistência, não horário específico.

Use estruturas que ajudem. Listas de oração evitam esquecimento e permitem ver respostas. Orar a Bíblia - especialmente Salmos - dá palavras quando nos faltam. Um diário de oração registra petições e respostas, fortalecendo a fé ao revisar fidelidades passadas.

Comece pequeno e cresça. Cinco minutos fiéis valem mais que uma hora esporádica. À medida que a oração se torna hábito, o tempo naturalmente se expande. Não se condene por falhas, mas recomece. A oração é jornada, não destino.`,
          references: "Lucas 5:16; Daniel 6:10; Marcos 1:35; Salmo 5:3; Salmo 119:147",
          questions: [
            "1. Por que a oração consistente requer intencionalidade?",
            "2. Qual o melhor horário para orar?",
            "3. Quais ferramentas podem ajudar na vida de oração?",
            "4. Como começar quando nunca teve hábito de oração?",
            "5. O que fazer quando falha em manter a rotina?"
          ],
          application: "Esta semana, estabeleça um horário específico diário para oração. Use um cronômetro para manter-se accountable. Registre suas observações.",
          summary: "Uma vida de oração consistente requer tempo definido, lugar apropriado, ferramentas úteis e graça para recomeçar após falhas."
        },
        {
          title: "Oração Corporativa",
          content: `Embora a oração pessoal seja fundamental, a oração em comunidade tem promessas especiais. Jesus declarou: "Se dois de vós concordarem na terra acerca de qualquer coisa que pedirem, isso lhes será feito por meu Pai" (Mateus 18:19). Há poder na concordância.

A igreja primitiva era marcada pela oração coletiva. "Todos estes perseveravam unanimemente em oração" (Atos 1:14). Quando Pedro foi preso, "fazia-se oração incessante a Deus por parte da igreja" (Atos 12:5). A resposta foi miraculosa libertação.

A oração corporativa desenvolve unidade e alinha a comunidade com os propósitos de Deus. Quando oramos juntos, encorajamos uns aos outros, aprendemos com diferentes formas de orar e participamos de algo maior que nós mesmos. Isolamento espiritual é perigoso.

Reuniões de oração não precisam ser longas ou formais. Podem ser em pequenos grupos, famílias ou duplas de oração. O essencial é a concordância em Cristo e a busca comum de Seu rosto. "Onde dois ou três estiverem reunidos em meu nome, ali estou no meio deles" (Mateus 18:20).`,
          references: "Mateus 18:19-20; Atos 1:14; Atos 2:42; Atos 4:24-31; Atos 12:5-17",
          questions: [
            "1. Que promessa especial há na oração concordante?",
            "2. Como a igreja primitiva praticava oração corporativa?",
            "3. Quais benefícios a oração em grupo oferece?",
            "4. Por que o isolamento espiritual é perigoso?",
            "5. Como participar mais ativamente de oração corporativa?"
          ],
          application: "Identifique uma pessoa ou pequeno grupo com quem você pode orar regularmente. Tome a iniciativa de organizar o primeiro encontro esta semana.",
          summary: "A oração corporativa carrega promessas especiais, desenvolve unidade e demonstra nossa dependência comunitária de Deus."
        },
        {
          title: "Oração e Ação",
          content: `A oração genuína conduz à ação. Neemias é o modelo perfeito: ele orou fervorosamente sobre a situação de Jerusalém (Neemias 1), mas então agiu, pedindo permissão ao rei e liderando a reconstrução. Oração sem ação pode ser escape da responsabilidade.

Deus frequentemente responde nossas orações através de nós mesmos. Oramos por provisão, e Ele nos guia a trabalhar. Oramos pelos perdidos, e Ele nos envia para testemunhar. Oramos pelos necessitados, e Ele nos move a servir. A oração alinha nosso coração com o de Deus para que participemos de Suas obras.

Ao mesmo tempo, ação sem oração é presunção. Dependemos do poder de Deus para que nossos esforços produzam fruto eterno. "Sem mim nada podeis fazer" (João 15:5). A combinação de oração fervente e ação diligente é o padrão bíblico.

Não devemos escolher entre orar e agir - fazemos ambos. Os reformadores diziam: "Ore como se tudo dependesse de Deus e trabalhe como se tudo dependesse de você." Esta tensão santa caracteriza a vida cristã madura.`,
          references: "Neemias 1:4-11; 2:1-8; Tiago 2:15-17; João 15:5; Filipenses 2:12-13",
          questions: [
            "1. Como Neemias combinou oração e ação?",
            "2. De que formas Deus responde orações através de nós?",
            "3. Por que ação sem oração é perigosa?",
            "4. Por que oração sem ação pode ser problema?",
            "5. Como manter o equilíbrio entre dependência e responsabilidade?"
          ],
          application: "Identifique uma oração que você tem feito há tempo. Pergunte: 'Há alguma ação que Deus está me chamando a tomar como parte da resposta?'",
          summary: "A oração genuína conduz à ação, e a ação eficaz depende da oração - ambas são necessárias na vida cristã."
        }
      ])
    }
  ]
};

// MÓDULO 11: O Pecado e a Graça
const MODULO_11_PECADO_GRACA: ModuleData = {
  id: "modulo-11-pecado-graca",
  name: "O Pecado e a Graça",
  description: "Compreendendo a realidade do pecado e a suficiência da graça de Deus",
  icon: "Scale",
  color: "#EF4444",
  order: 11,
  tracks: [
    {
      id: "track-11-iniciante",
      level: "iniciante",
      name: "Pecado e Graça",
      description: "A gravidade do pecado e a grandeza da graça salvadora",
      requiredPlan: "premium",
      order: 1,
      lessons: createLessons("mod11", [
        {
          title: "A Origem do Pecado",
          content: `O pecado não existia na criação original de Deus. Gênesis 1 declara repetidamente que tudo era "bom" e "muito bom." O pecado entrou no mundo através da escolha de Adão e Eva em desobedecer a Deus, seduzidos pela serpente.

A tentação no Éden atacou a palavra de Deus ("É assim que Deus disse?"), o caráter de Deus ("Certamente não morrereis") e a bondade de Deus ("Deus sabe que... sereis como Deus"). Este padrão de dúvida, mentira e desejo ilícito continua até hoje.

A consequência foi devastadora. A morte entrou no mundo - física e espiritual. O relacionamento com Deus foi quebrado. A harmonia com a natureza foi perdida. O trabalho se tornou árduo e o parto doloroso. O pecado não afetou apenas Adão e Eva, mas toda a humanidade.

Paulo explica: "Portanto, assim como por um só homem entrou o pecado no mundo, e pelo pecado a morte, assim também a morte passou a todos os homens, porque todos pecaram" (Romanos 5:12). O pecado de Adão teve consequências universais, transmitido a toda sua descendência.`,
          references: "Gênesis 3:1-24; Romanos 5:12-21; 1 Coríntios 15:21-22",
          questions: [
            "1. Como era o mundo antes do pecado?",
            "2. Quais foram as três táticas da serpente?",
            "3. Quais foram as consequências imediatas da queda?",
            "4. Como o pecado de Adão afeta toda a humanidade?",
            "5. Por que entender a origem do pecado é importante?"
          ],
          application: "Identifique como as três táticas da serpente (duvidar, mentir, desejar) aparecem nas tentações que você enfrenta.",
          summary: "O pecado entrou no mundo pela desobediência de Adão e Eva, trazendo morte e separação de Deus para toda a humanidade."
        },
        {
          title: "O Que é Pecado?",
          content: `O pecado é mais do que meros erros ou falhas - é rebelião contra Deus, violação de Sua lei santa. A definição clássica é "errar o alvo" (do grego hamartia), mas isso é apenas parte da realidade. Pecado é também transgressão, iniquidade e impiedade.

No seu âmago, o pecado é destronamento de Deus. É declarar independência do Criador, fazer-se senhor da própria vida. Isaías descreve: "Todos nós andávamos desgarrados como ovelhas; cada um se desviava pelo seu caminho" (Isaías 53:6). O problema não é apenas ações, mas direção.

O pecado é universal. "Não há justo, nem um sequer... todos se desviaram" (Romanos 3:10-12). Não existem gradações que coloquem alguns como "bons" e outros como "maus." Diante da santidade de Deus, todos falham. "Todos pecaram e destituídos estão da glória de Deus" (Romanos 3:23).

O pecado se manifesta em ações (o que fazemos), omissões (o que deixamos de fazer), palavras, pensamentos e atitudes. Pode ser aberto ou secreto. Jesus ensinou que o adultério começa no olhar e o homicídio no ódio (Mateus 5:21-28). Deus vê o coração.`,
          references: "Romanos 3:10-23; Isaías 53:6; 1 João 3:4; Tiago 4:17; Mateus 5:21-28",
          questions: [
            "1. O que significa 'errar o alvo'?",
            "2. Por que o pecado é chamado de 'rebelião'?",
            "3. Como sabemos que o pecado é universal?",
            "4. De quantas formas o pecado se manifesta?",
            "5. Por que pecados de pensamento são tão sérios quanto ações?"
          ],
          application: "Peça ao Espírito Santo que revele não apenas pecados de ação, mas áreas onde você tem destronado Deus de Sua posição legítima.",
          summary: "O pecado é rebelião contra Deus, universal em alcance, manifestando-se em ações, omissões, palavras, pensamentos e atitudes."
        },
        {
          title: "As Consequências do Pecado",
          content: `As consequências do pecado são abrangentes e devastadoras. A primeira e mais séria é a separação de Deus. "Vossas iniquidades fazem separação entre vós e o vosso Deus" (Isaías 59:2). Esta ruptura espiritual afeta todo o resto da vida.

O pecado traz culpa - a percepção de ter violado um padrão santo - e vergonha - o sentimento de indignidade que faz querer esconder-se. Adão e Eva se esconderam de Deus após pecarem (Gênesis 3:8). Esta dinâmica continua em nós.

Há também consequências práticas. O pecado escraviza: "Todo aquele que comete pecado é escravo do pecado" (João 8:34). O que parece liberdade torna-se prisão. Relacionamentos são danificados. Saúde pode ser afetada. Oportunidades são perdidas. As consequências são naturais, não arbitrárias.

A consequência final é a morte. "O salário do pecado é a morte" (Romanos 6:23). Esta inclui morte física, mas principalmente a segunda morte - separação eterna de Deus. Sem intervenção divina, este seria o destino de toda a humanidade.`,
          references: "Isaías 59:2; João 8:34; Romanos 6:23; Gênesis 3:7-10; Efésios 2:1-3",
          questions: [
            "1. Qual é a consequência mais séria do pecado?",
            "2. Qual a diferença entre culpa e vergonha?",
            "3. Como o pecado escraviza?",
            "4. Que tipos de 'morte' o pecado traz?",
            "5. Por que as consequências do pecado são 'naturais'?"
          ],
          application: "Reflita sobre como o pecado tem afetado diferentes áreas de sua vida: relacionamento com Deus, consigo mesmo, com outros.",
          summary: "O pecado traz separação de Deus, culpa, vergonha, escravidão, danos relacionais e, finalmente, morte física e espiritual."
        },
        {
          title: "O Que é Graça?",
          content: `A graça é o amor imerecido de Deus em ação a favor de pecadores. É frequentemente definida como "favor imerecido" - recebemos o que não merecemos e deixamos de receber o que merecemos. A graça é a resposta de Deus ao problema do pecado.

A graça não é conquistada, comprada ou merecida. "Porque pela graça sois salvos, por meio da fé; e isto não vem de vós, é dom de Deus; não de obras, para que ninguém se glorie" (Efésios 2:8-9). Se pudéssemos ganhar a salvação, não seria graça.

A graça é radicalmente diferente de qualquer sistema religioso humano. Religiões ensinam como alcançar Deus através de esforço. O evangelho anuncia que Deus desceu até nós. "Mas Deus prova o seu amor para conosco, em que Cristo morreu por nós, sendo nós ainda pecadores" (Romanos 5:8).

A graça não minimiza o pecado - ela o leva extremamente a sério. Custou a vida do Filho de Deus. A cruz demonstra simultaneamente a gravidade do pecado (exigiu tal sacrifício) e a grandeza do amor de Deus (Ele estava disposto a pagar).`,
          references: "Efésios 2:1-10; Romanos 5:6-8; João 1:14-17; Tito 2:11-14",
          questions: [
            "1. O que significa 'favor imerecido'?",
            "2. Por que a graça não pode ser conquistada?",
            "3. Como o evangelho difere de sistemas religiosos humanos?",
            "4. A graça minimiza ou magnifica a seriedade do pecado?",
            "5. O que a cruz revela sobre o pecado e o amor de Deus?"
          ],
          application: "Medite em quanto custou a Deus salvar você. Como essa compreensão afeta sua gratidão e seu compromisso com Ele?",
          summary: "A graça é o amor imerecido de Deus que salva pecadores através do sacrifício de Cristo, custando infinitamente ao Pai."
        },
        {
          title: "Graça que Justifica",
          content: `Justificação é o ato de Deus pelo qual pecadores são declarados justos com base na obra de Cristo. Não é tornar-se justo gradualmente, mas ser declarado justo imediatamente. É um veredito legal do Juiz do universo.

A base da justificação é a obra de Cristo, não a nossa. "Sendo justificados gratuitamente pela sua graça, pela redenção que há em Cristo Jesus" (Romanos 3:24). Jesus viveu a vida perfeita que deveríamos viver e morreu a morte que merecíamos morrer.

O meio da justificação é a fé. "Concluímos, pois, que o homem é justificado pela fé, sem as obras da lei" (Romanos 3:28). Fé não é uma obra que nos torna dignos, mas a mão vazia que recebe o dom de Deus. É confiança em Cristo, não em nós mesmos.

O resultado da justificação é paz com Deus. "Tendo sido, pois, justificados pela fé, temos paz com Deus, por nosso Senhor Jesus Cristo" (Romanos 5:1). A guerra acabou. Não somos mais inimigos, mas filhos. Esta é a grande transação da graça.`,
          references: "Romanos 3:21-28; Romanos 5:1-2; 2 Coríntios 5:21; Gálatas 2:16",
          questions: [
            "1. O que significa ser 'declarado justo'?",
            "2. Qual é a base da justificação?",
            "3. Por que a fé não é considerada uma obra?",
            "4. O que Jesus fez para justificar pecadores?",
            "5. Qual é o resultado imediato da justificação?"
          ],
          application: "Leia Romanos 8:1 em voz alta. Você vive como alguém que não tem mais condenação, ou ainda carrega falsa culpa?",
          summary: "A justificação é a declaração divina de que pecadores são justos através da fé em Cristo, resultando em paz com Deus."
        },
        {
          title: "Graça que Santifica",
          content: `A graça não apenas declara justos os pecadores (justificação), mas também os transforma (santificação). A mesma graça que salva também capacita para viver em santidade. Não somos deixados na condição em que fomos encontrados.

Paulo explica: "Porque a graça de Deus se manifestou, trazendo salvação a todos os homens, ensinando-nos que, renunciando à impiedade e às concupiscências mundanas, vivamos neste presente século sóbria, justa e piedosamente" (Tito 2:11-12). A graça ensina e transforma.

A santificação é cooperação entre Deus e o crente. "Desenvolvei a vossa salvação com temor e tremor; porque Deus é quem efetua em vós tanto o querer como o realizar" (Filipenses 2:12-13). Deus opera em nós, mas nós também trabalhamos - não para ganhar salvação, mas porque já fomos salvos.

Este processo é gradual e durará toda a vida. Não atingiremos perfeição antes da glorificação final. Mas podemos crescer, amadurecer e nos tornar cada vez mais semelhantes a Cristo. "E todos nós... somos transformados de glória em glória na mesma imagem" (2 Coríntios 3:18).`,
          references: "Tito 2:11-14; Filipenses 2:12-13; 2 Coríntios 3:18; Romanos 6:1-14; 1 Tessalonicenses 4:3-7",
          questions: [
            "1. Qual a relação entre justificação e santificação?",
            "2. Como a graça 'ensina'?",
            "3. O que significa 'cooperação' na santificação?",
            "4. Por que a santificação é gradual?",
            "5. Qual é o objetivo final da santificação?"
          ],
          application: "Identifique uma área de sua vida onde a graça ainda precisa produzir transformação. Submeta-a a Deus em oração.",
          summary: "A graça santificadora transforma progressivamente o crente à semelhança de Cristo através da cooperação entre Deus e o crente."
        },
        {
          title: "Graça que Capacita",
          content: `A graça não é apenas para salvação, mas para todo aspecto da vida cristã. Paulo declarou: "Pela graça de Deus sou o que sou; e a sua graça para comigo não foi vã, antes trabalhei muito mais do que todos eles; todavia não eu, mas a graça de Deus que está comigo" (1 Coríntios 15:10).

A graça capacita para o serviço. Cada crente recebe dons espirituais "segundo a graça que nos foi dada" (Romanos 12:6). Ministério eficaz não vem de talento natural ou esforço humano apenas, mas da graça capacitadora de Deus operando através de nós.

A graça fortalece na fraqueza. Quando Paulo pediu livramento de seu "espinho na carne," Deus respondeu: "A minha graça te basta, porque o meu poder se aperfeiçoa na fraqueza" (2 Coríntios 12:9). Nossas limitações tornam-se oportunidades para a graça brilhar.

A graça sustenta no sofrimento. Pedro encoraja: "E o Deus de toda a graça, que em Cristo Jesus vos chamou à sua eterna glória, depois de haverdes padecido um pouco, ele mesmo vos aperfeiçoará, confirmará, fortificará e fundamentará" (1 Pedro 5:10). A graça é suficiente para todas as circunstâncias.`,
          references: "1 Coríntios 15:10; 2 Coríntios 12:9; Romanos 12:6; 1 Pedro 5:10; Hebreus 4:16",
          questions: [
            "1. Como a graça capacitou Paulo para seu ministério?",
            "2. Qual a relação entre graça e dons espirituais?",
            "3. Por que nossa fraqueza é oportunidade para a graça?",
            "4. Como a graça sustenta no sofrimento?",
            "5. O que significa dizer que a graça 'basta'?"
          ],
          application: "Identifique uma área de fraqueza em sua vida. Ore pedindo que a graça de Deus seja manifestada ali de forma poderosa.",
          summary: "A graça capacita para o serviço, fortalece na fraqueza e sustenta no sofrimento - ela é suficiente para todas as circunstâncias."
        },
        {
          title: "O Perigo do Legalismo",
          content: `O legalismo é a tentativa de ganhar ou manter o favor de Deus através da obediência a regras. É o oposto da graça e uma das maiores ameaças à vida cristã. Paulo combateu ferozmente este erro nas cartas aos Gálatas e Romanos.

O legalismo assume várias formas. Pode ser adicionar obras à fé para salvação - "crer em Jesus mais guardar certas práticas." Pode ser tentar crescer espiritualmente por esforço próprio em vez de dependência da graça. Pode ser julgar outros por padrões externos.

O problema do legalismo não é o desejo de obedecer - obediência é boa e bíblica. O problema é a motivação e a fonte de poder. O legalista obedece para ser aceito; o crente na graça obedece porque já foi aceito. O legalista depende de si; o crente depende do Espírito.

Os frutos do legalismo são destrutivos: orgulho quando "conseguimos" e desespero quando falhamos; comparação constante com outros; religiosidade externa sem transformação interna; fardo pesado em vez de jugo suave. A graça liberta de tudo isso.`,
          references: "Gálatas 2:16-21; 3:1-5; 5:1-6; Romanos 7:4-6; Colossenses 2:16-23",
          questions: [
            "1. O que é legalismo?",
            "2. Quais são algumas formas que o legalismo assume?",
            "3. Qual é a diferença entre obediência legalista e obediência graciosa?",
            "4. Quais são os frutos do legalismo?",
            "5. Por que o legalismo é tão atraente?"
          ],
          application: "Examine sua motivação para obedecer a Deus. Você obedece para ser aceito ou porque já foi aceito em Cristo?",
          summary: "O legalismo, a tentativa de ganhar favor divino por obras, produz orgulho ou desespero e escraviza, enquanto a graça liberta."
        },
        {
          title: "O Perigo do Licenciosismo",
          content: `Se o legalismo adiciona obras à graça, o licenciosismo abusa da graça para justificar o pecado. Paulo antecipou esta distorção: "Permaneceremos no pecado, para que a graça abunde? De modo nenhum" (Romanos 6:1-2). Graça não é licença para pecar.

Judas alertou contra aqueles que "transformam a graça de nosso Deus em dissolução" (Judas 4). A lógica parece fazer sentido: se a graça cobre pecados, por que se preocupar com santidade? Mas esta pergunta revela incompreensão fundamental do evangelho.

Quem realmente encontrou a graça foi transformado por ela. "Se alguém está em Cristo, nova criatura é; as coisas velhas já passaram" (2 Coríntios 5:17). A pessoa que usa a graça como desculpa para pecar provavelmente nunca a experimentou genuinamente.

A graça não minimiza a santidade - ela a possibilita. Sob a lei, lutávamos com nossa força e falhávamos. Sob a graça, o Espírito nos capacita a viver de forma santa. Não temos menos padrão, mas mais poder. A graça produz frutos de justiça, não permissão para impiedade.`,
          references: "Romanos 6:1-14; Judas 4; 2 Coríntios 5:17; Tito 2:11-14; Gálatas 5:13",
          questions: [
            "1. O que é licenciosismo?",
            "2. Como Paulo respondeu à sugestão de 'pecar mais para a graça abundar'?",
            "3. O que revela alguém que usa a graça como desculpa para pecar?",
            "4. Como a graça realmente se relaciona com a santidade?",
            "5. Por que temos 'mais poder' sob a graça do que sob a lei?"
          ],
          application: "Existe alguma área onde você tem usado a graça como desculpa para continuar em pecado? Arrependa-se e peça capacitação do Espírito.",
          summary: "O licenciosismo distorce a graça em permissão para pecar, mas a graça genuína transforma e capacita para a santidade."
        },
        {
          title: "Vivendo na Graça",
          content: `Viver na graça é o equilíbrio entre legalismo e licenciosismo. É abraçar a salvação completamente gratuita enquanto buscamos santidade por gratidão e capacitação divina. É descansar na obra completa de Cristo enquanto trabalhamos diligentemente no poder do Espírito.

Viver na graça significa começar cada dia consciente de nossa posição em Cristo. "Não há, portanto, agora, nenhuma condenação para os que estão em Cristo Jesus" (Romanos 8:1). Independente de como nos sentimos ou como nos saímos ontem, somos aceitos pelo sangue de Jesus.

Viver na graça significa responder ao pecado com arrependimento, não desespero. Quando caímos, confessamos e seguimos em frente, confiando no perdão prometido. Não ficamos na autoflagelação nem no endurecimento. A graça cobre, mas também transforma.

Viver na graça significa estender aos outros o que recebemos. "Suportai-vos uns aos outros... perdoando-vos uns aos outros, como Deus vos perdoou em Cristo" (Colossenses 3:13). Pessoas de graça criam comunidades de graça. O evangelho flui através de nós para outros.`,
          references: "Romanos 8:1; 1 João 1:9; Colossenses 3:12-14; 2 Pedro 3:18; Efésios 4:32",
          questions: [
            "1. O que significa 'viver na graça'?",
            "2. Como devemos começar cada dia?",
            "3. Qual é a resposta correta ao pecado sob a graça?",
            "4. Como a graça recebida deve afetar nossos relacionamentos?",
            "5. Qual é o equilíbrio entre descanso e trabalho na graça?"
          ],
          application: "Nesta semana, pratique estender graça a alguém que o ofendeu. Observe como isso afeta você e o relacionamento.",
          summary: "Viver na graça equilibra segurança em Cristo com busca de santidade, respondendo ao pecado com arrependimento e estendendo graça aos outros."
        }
      ])
    }
  ]
};

// MÓDULO 12: A Salvação em Cristo
const MODULO_12_SALVACAO: ModuleData = {
  id: "modulo-12-salvacao-cristo",
  name: "A Salvação em Cristo",
  description: "A obra completa de Cristo para a redenção da humanidade",
  icon: "Heart",
  color: "#F97316",
  order: 12,
  tracks: [
    {
      id: "track-12-iniciante",
      level: "iniciante",
      name: "A Obra da Salvação",
      description: "Compreendendo os aspectos da salvação oferecida em Cristo",
      requiredPlan: "premium",
      order: 1,
      lessons: createLessons("mod12", [
        {
          title: "A Necessidade da Salvação",
          content: `Antes de apreciar a salvação, precisamos compreender por que ela é necessária. O diagnóstico bíblico da condição humana é grave: todos pecaram (Romanos 3:23), estão mortos em delitos (Efésios 2:1), e são incapazes de salvar a si mesmos.

A humanidade não está meramente "doente" espiritualmente - está morta. Um doente pode cooperar no tratamento; um morto não pode fazer nada. Esta é a doutrina da depravação total: cada parte de nosso ser foi afetada pelo pecado, e somos incapazes de nos aproximar de Deus por iniciativa própria.

O problema não é apenas o que fazemos, mas o que somos. Jesus disse: "Não é o que entra pela boca que contamina o homem, mas o que sai da boca, isso é o que o contamina" (Mateus 15:11). O coração humano é "enganoso mais do que todas as coisas e desesperadamente corrupto" (Jeremias 17:9).

A gravidade desta condição significa que qualquer solução deve vir de fora de nós. Nenhum esforço humano, ritual religioso ou melhoria moral pode resolver o problema fundamental. Precisamos de resgate, intervenção divina - precisamos de um Salvador.`,
          references: "Romanos 3:10-23; Efésios 2:1-3; Jeremias 17:9; João 6:44; Romanos 8:7-8",
          questions: [
            "1. Por que o diagnóstico bíblico é tão severo?",
            "2. O que significa 'depravação total'?",
            "3. Por que esforços humanos não podem resolver o problema?",
            "4. Qual a diferença entre estar 'doente' e estar 'morto'?",
            "5. De onde deve vir a solução para nossa condição?"
          ],
          application: "Lembre-se de sua condição antes de Cristo. Agradeça a Deus pela iniciativa que Ele tomou para salvá-lo.",
          summary: "A humanidade está espiritualmente morta, incapaz de auto-salvação, necessitando de intervenção divina."
        },
        {
          title: "O Plano Eterno de Salvação",
          content: `A salvação não foi um plano emergencial de Deus após a queda. Antes da fundação do mundo, Deus já havia determinado resgatar um povo para Si. "Nos escolheu nele antes da fundação do mundo" (Efésios 1:4). A salvação é fruto de propósito eterno.

O Pai, o Filho e o Espírito cooperam nesta obra. O Pai planejou e elegeu (Efésios 1:4-6). O Filho executou a redenção pelo Seu sacrifício (Efésios 1:7). O Espírito aplica a salvação ao coração humano (Efésios 1:13-14). A Trindade opera em perfeita harmonia.

Este plano foi progressivamente revelado ao longo da história. O protoevangelhos em Gênesis 3:15 prometeu a semente que esmagaria a serpente. Os sacrifícios apontavam para o Cordeiro vindouro. Os profetas detalharam cada vez mais a obra do Servo Sofredor. Tudo convergia para Cristo.

Quando chegou a plenitude dos tempos, Deus enviou Seu Filho (Gálatas 4:4). O plano eterno tornou-se realidade histórica. Jesus nasceu, viveu, morreu e ressuscitou - cumprindo cada promessa, satisfazendo cada requisito, completando a obra planejada antes dos tempos.`,
          references: "Efésios 1:3-14; 1 Pedro 1:18-20; Gálatas 4:4-5; Gênesis 3:15; Atos 2:23",
          questions: [
            "1. Quando Deus planejou a salvação?",
            "2. Qual é o papel de cada Pessoa da Trindade na salvação?",
            "3. Como o plano foi progressivamente revelado?",
            "4. O que significa 'a plenitude dos tempos'?",
            "5. Como isso afeta nossa segurança em Cristo?"
          ],
          application: "Medite no fato de que Deus planejou salvá-lo antes de criar o mundo. Como isso impacta seu senso de valor e propósito?",
          summary: "A salvação foi planejada pela Trindade antes da criação, progressivamente revelada e plenamente executada em Cristo."
        },
        {
          title: "A Obra de Cristo na Cruz",
          content: `A cruz é o centro da salvação cristã. O que pareceu a maior derrota foi, na verdade, a maior vitória. Jesus declarou "Está consumado" (João 19:30) - a obra de redenção foi completada. Nada mais precisa ser adicionado.

Na cruz, Jesus levou nossos pecados. "Carregando ele mesmo em seu corpo, sobre o madeiro, os nossos pecados" (1 Pedro 2:24). O justo morreu pelos injustos. Ele bebeu a taça da ira divina que era nossa. Pela fé, Sua justiça é creditada a nós.

A cruz satisfez a justiça de Deus (propiciação) e removeu nossa culpa (expiação). Deus não poderia simplesmente ignorar o pecado - Sua santidade exige punição. Mas em amor, Ele mesmo proveu o sacrifício. A cruz demonstra justiça e amor simultaneamente.

A cruz também derrotou poderes espirituais. "Despojando os principados e potestades, os expôs publicamente e deles triunfou" (Colossenses 2:15). Satanás foi julgado, a morte perdeu seu aguilhão, o pecado foi derrotado. A vitória está consumada.`,
          references: "João 19:30; 1 Pedro 2:24; Romanos 3:25-26; Colossenses 2:13-15; Hebreus 9:11-14",
          questions: [
            "1. O que Jesus quis dizer com 'Está consumado'?",
            "2. O que significa Jesus ter 'levado nossos pecados'?",
            "3. Como a cruz satisfez tanto a justiça quanto o amor de Deus?",
            "4. O que a cruz fez aos poderes espirituais?",
            "5. Por que nada mais precisa ser adicionado à obra de Cristo?"
          ],
          application: "Contemple a cruz esta semana. Leia Isaías 53 e agradeça a Jesus pelo preço que Ele pagou por você.",
          summary: "Na cruz, Cristo levou nossos pecados, satisfez a justiça de Deus, removeu nossa culpa e derrotou os poderes das trevas."
        },
        {
          title: "A Ressurreição e Nossa Salvação",
          content: `A ressurreição de Cristo não é um detalhe secundário - é fundamental para a salvação. Paulo declara: "E se Cristo não ressuscitou, é vã a vossa fé, e ainda estais nos vossos pecados" (1 Coríntios 15:17). Sem ressurreição, não há salvação.

A ressurreição valida a morte de Cristo. Provou que Seu sacrifício foi aceito pelo Pai. "Foi entregue por causa das nossas transgressões, e ressuscitou por causa da nossa justificação" (Romanos 4:25). A ressurreição é o recibo de Deus, declarando que a dívida foi paga.

A ressurreição garante nossa própria ressurreição futura. "Cristo ressuscitou dentre os mortos e foi feito as primícias dos que dormem" (1 Coríntios 15:20). Ele é o primeiro; nós seguiremos. Sua vitória sobre a morte é nossa vitória também.

A ressurreição nos dá vida presente. "Para conhecê-lo, e o poder da sua ressurreição" (Filipenses 3:10). O mesmo poder que ressuscitou Cristo opera em nós para vida e santificação. A ressurreição não é apenas evento passado ou esperança futura - é poder presente.`,
          references: "1 Coríntios 15:12-26; Romanos 4:25; Filipenses 3:10-11; Romanos 6:4-5; Efésios 1:19-20",
          questions: [
            "1. Por que a fé seria 'vã' sem ressurreição?",
            "2. O que a ressurreição prova sobre a morte de Cristo?",
            "3. Como a ressurreição de Cristo garante a nossa?",
            "4. Qual poder opera em nós por causa da ressurreição?",
            "5. Como a ressurreição afeta nossa vida presente?"
          ],
          application: "Leia Efésios 1:19-20. Ore pedindo a Deus que você experimente mais deste poder de ressurreição em sua vida diária.",
          summary: "A ressurreição valida a morte de Cristo, garante nossa ressurreição futura e disponibiliza poder para a vida presente."
        },
        {
          title: "Arrependimento e Fé",
          content: `Arrependimento e fé são as respostas humanas ao evangelho. Não são obras que nos salvam, mas os meios pelos quais recebemos a salvação oferecida gratuitamente. Jesus pregou: "Arrependei-vos, e crede no evangelho" (Marcos 1:15).

Arrependimento (metanoia em grego) significa mudança de mente que resulta em mudança de direção. Não é apenas remorso pelos pecados ou medo das consequências. É reconhecer o pecado como ofensa a Deus e decidir abandoná-lo. Envolve mente, emoções e vontade.

Fé é confiança pessoal em Cristo para salvação. Vai além de crer que Deus existe (até os demônios creem - Tiago 2:19). É colocar peso sobre Cristo, depender exclusivamente dEle. Inclui conhecimento (do evangelho), assentimento (é verdade) e confiança (em Cristo pessoalmente).

Arrependimento e fé são inseparáveis - são dois lados da mesma moeda. Virar-se do pecado (arrependimento) é virar-se para Cristo (fé). Ambos são dons de Deus (Atos 5:31; Efésios 2:8), mas também mandamentos que exigem nossa resposta. A graça capacita o que ordena.`,
          references: "Marcos 1:15; Atos 2:38; 20:21; Efésios 2:8-9; Romanos 10:9-10",
          questions: [
            "1. O que é arrependimento verdadeiro?",
            "2. Qual a diferença entre remorso e arrependimento?",
            "3. Os três elementos da fé salvadora são quais?",
            "4. Como arrependimento e fé se relacionam?",
            "5. Por que arrependimento e fé são chamados 'dons de Deus'?"
          ],
          application: "Examine se sua fé vai além de conhecimento intelectual para confiança pessoal em Cristo. Onde você precisa crescer?",
          summary: "Arrependimento é mudança de mente e direção; fé é confiança pessoal em Cristo. Ambos são respostas inseparáveis ao evangelho."
        },
        {
          title: "A Regeneração: Novo Nascimento",
          content: `A regeneração é a obra do Espírito Santo que produz vida espiritual em quem estava morto. Jesus disse a Nicodemos: "Se alguém não nascer de novo, não pode ver o Reino de Deus" (João 3:3). Este novo nascimento é absolutamente necessário.

Assim como não escolhemos nosso nascimento físico, não produzimos nosso nascimento espiritual. "O qual nasceu não do sangue, nem da vontade da carne, nem da vontade do homem, mas de Deus" (João 1:13). É obra exclusiva de Deus, misteriosa como o vento (João 3:8).

A regeneração produz mudança radical. "Se alguém está em Cristo, nova criatura é; as coisas velhas já passaram; eis que tudo se fez novo" (2 Coríntios 5:17). Recebemos nova natureza, novos desejos, nova capacidade de agradar a Deus. O coração de pedra torna-se coração de carne (Ezequiel 36:26).

Esta nova vida se manifesta em frutos. Amor por Deus e Sua Palavra, desejo de obediência, capacidade de crer, amor pelos irmãos - estes são sinais de regeneração. Não são a causa da nova vida, mas suas evidências. Onde há vida, há frutos.`,
          references: "João 3:1-8; 2 Coríntios 5:17; Ezequiel 36:26-27; 1 João 5:1; Tito 3:5",
          questions: [
            "1. Por que o novo nascimento é necessário?",
            "2. Quem produz a regeneração?",
            "3. O que muda na pessoa regenerada?",
            "4. Quais são os frutos da regeneração?",
            "5. Qual a diferença entre causas e evidências do novo nascimento?"
          ],
          application: "Reflita sobre as mudanças que ocorreram em você desde que nasceu de novo. Agradeça a Deus pela nova vida.",
          summary: "A regeneração é a obra do Espírito que produz vida espiritual, resultando em nova natureza e novos desejos."
        },
        {
          title: "A Adoção como Filhos",
          content: `Além de perdoar e regenerar, Deus nos adota como filhos. "Mas, a todos quantos o receberam, deu-lhes o poder de serem feitos filhos de Deus" (João 1:12). Não somos apenas perdoados criminosos; somos filhos amados do Rei.

A adoção no mundo romano era legal e permanente. O filho adotado recebia todos os direitos do filho biológico, incluindo herança. Da mesma forma, somos "herdeiros de Deus e co-herdeiros com Cristo" (Romanos 8:17). Toda bênção celestial nos pertence.

Como filhos, temos acesso íntimo ao Pai. "Porque não recebestes o espírito de escravidão para viverdes, outra vez, atemorizados, mas recebestes o espírito de adoção de filhos, pelo qual clamamos: Aba, Pai" (Romanos 8:15). "Aba" é termo de intimidade - "Papai." Podemos aproximar-nos com confiança.

A adoção também implica transformação. O Pai nos disciplina porque somos filhos (Hebreus 12:5-11). Somos chamados a refletir Seu caráter. "Sede pois imitadores de Deus, como filhos amados" (Efésios 5:1). Pertencemos a uma nova família com novas responsabilidades.`,
          references: "João 1:12; Romanos 8:14-17; Gálatas 4:4-7; Efésios 1:5; 1 João 3:1",
          questions: [
            "1. O que a adoção acrescenta à salvação?",
            "2. O que significava adoção no mundo romano?",
            "3. Quais privilégios a adoção nos confere?",
            "4. O que significa chamar Deus de 'Aba'?",
            "5. Quais responsabilidades acompanham a adoção?"
          ],
          application: "Pratique dirigir-se a Deus como 'Pai' (ou 'Aba') em suas orações esta semana. Deixe a intimidade desta relação tocar seu coração.",
          summary: "A adoção nos faz filhos de Deus com plenos direitos, incluindo intimidade com o Pai e herança celestial."
        },
        {
          title: "União com Cristo",
          content: `Uma das verdades mais profundas da salvação é nossa união com Cristo. Estamos "em Cristo" - esta frase aparece mais de 160 vezes nas cartas de Paulo. Não apenas recebemos benefícios de Cristo; estamos ligados a Ele organicamente.

Esta união é ilustrada de várias formas. Somos ramos ligados à Videira (João 15). Somos membros do Corpo do qual Ele é a Cabeça (1 Coríntios 12). Somos a noiva unida ao Noivo (Efésios 5). Cada imagem revela diferente aspecto desta conexão vital.

Por causa da união, o que é verdade de Cristo torna-se verdade de nós. Morremos com Ele, ressuscitamos com Ele, estamos assentados com Ele nos lugares celestiais (Efésios 2:6). Sua história tornou-se nossa história. Sua vitória é nossa vitória.

Esta união é também a fonte de nossa santificação. Assim como o ramo recebe vida da videira, recebemos tudo de Cristo. "Separados de mim nada podeis fazer" (João 15:5). A vida cristã não é imitação de Cristo por esforço próprio, mas participação em Sua vida pelo Espírito.`,
          references: "João 15:1-8; Efésios 2:4-6; Romanos 6:3-11; Gálatas 2:20; Colossenses 3:1-4",
          questions: [
            "1. O que significa estar 'em Cristo'?",
            "2. Quais imagens ilustram nossa união com Cristo?",
            "3. Como a história de Cristo se torna nossa história?",
            "4. Qual a relação entre união e santificação?",
            "5. O que significa 'sem mim nada podeis fazer'?"
          ],
          application: "Leia Gálatas 2:20 e medite nele. Como esta verdade pode transformar sua forma de viver hoje?",
          summary: "Estamos unidos a Cristo de modo que Sua história, vitória e vida tornam-se nossas através desta conexão vital."
        },
        {
          title: "A Segurança da Salvação",
          content: `Uma das grandes bênçãos do evangelho é a certeza de que a salvação não pode ser perdida. Jesus prometeu: "As minhas ovelhas ouvem a minha voz, e eu conheço-as, e elas me seguem; e dou-lhes a vida eterna, e nunca hão de perecer, e ninguém as arrebatará da minha mão" (João 10:27-28).

A segurança não se baseia em nossa fidelidade, mas na fidelidade de Deus. "Aquele que começou em vós a boa obra a aperfeiçoará até o dia de Jesus Cristo" (Filipenses 1:6). Deus termina o que começa. Nossa perseverança final é garantida pela preservação divina.

Paulo argumenta que nada pode separar-nos do amor de Cristo - nem tribulação, perseguição, fome, perigo ou espada (Romanos 8:35-39). Se pudéssemos perder a salvação, o amor de Cristo não seria suficiente. Mas Ele é poderoso para guardar o que lhe confiamos (2 Timóteo 1:12).

Esta segurança não encoraja negligência, mas gratidão e confiança. Corremos a carreira não para não cair, mas porque a linha de chegada é garantida. Trabalhamos não para ser salvos, mas porque já somos salvos. A segurança produz serviço alegre, não preguiça espiritual.`,
          references: "João 10:27-30; Filipenses 1:6; Romanos 8:28-39; 1 Pedro 1:3-5; Judas 24-25",
          questions: [
            "1. Em que se baseia nossa segurança?",
            "2. O que Jesus prometeu sobre Suas ovelhas?",
            "3. O que pode separar-nos do amor de Cristo?",
            "4. Como a segurança afeta nossa vida cristã?",
            "5. Por que segurança não produz negligência?"
          ],
          application: "Se você luta com dúvidas sobre sua salvação, leia 1 João 5:11-13 e descanse na promessa de Deus.",
          summary: "A salvação é garantida pela fidelidade de Deus, não pela nossa; nada pode separar-nos de Seu amor."
        },
        {
          title: "A Glorificação: Salvação Completa",
          content: `A salvação tem dimensões passadas, presentes e futuras. Fomos salvos da penalidade do pecado (justificação). Estamos sendo salvos do poder do pecado (santificação). Seremos salvos da presença do pecado (glorificação). A glorificação é a consumação final.

Na glorificação, seremos totalmente conformados à imagem de Cristo. "Quando ele se manifestar, seremos semelhantes a ele, porque assim como é o veremos" (1 João 3:2). Todo resquício de pecado será removido. Seremos finalmente quem fomos criados para ser.

Nossos corpos serão transformados. "O Senhor Jesus Cristo... transformará o nosso corpo de humilhação, para ser semelhante ao corpo da sua glória" (Filipenses 3:20-21). Não seremos espíritos incorpóreos, mas teremos corpos ressurretos, gloriosos e eternos como o de Cristo.

A glorificação inclui também a renovação de toda a criação. "A própria criação será libertada da escravidão da corrupção" (Romanos 8:21). Haverá novos céus e nova terra. A maldição será desfeita. Tudo o que o pecado destruiu será restaurado e transcendido.`,
          references: "1 João 3:2; Filipenses 3:20-21; Romanos 8:18-25; 1 Coríntios 15:51-57; Apocalipse 21:1-5",
          questions: [
            "1. Quais são as três dimensões temporais da salvação?",
            "2. O que acontecerá conosco na glorificação?",
            "3. Como serão nossos corpos glorificados?",
            "4. O que acontecerá com a criação?",
            "5. Como a esperança da glorificação afeta nossa vida presente?"
          ],
          application: "Quando enfrentar dificuldades ou tentações, lembre-se: a glorificação vem. O melhor ainda está por vir. Deixe essa esperança encorajá-lo.",
          summary: "A glorificação completará nossa salvação: seremos conformados a Cristo, nossos corpos transformados, e toda a criação renovada."
        }
      ])
    }
  ]
};

// Export all Level 1 modules 9-15
export const NIVEL_1_MODULOS_9_15: ModuleData[] = [
  MODULO_9_ESCATOLOGIA,
  MODULO_10_ORACAO,
  MODULO_11_PECADO_GRACA,
  MODULO_12_SALVACAO,
];

// Modules 13-15 will be added in a separate file to manage size
