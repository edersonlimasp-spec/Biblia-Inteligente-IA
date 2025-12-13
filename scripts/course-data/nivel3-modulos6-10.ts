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

// MÓDULO 6: Homilética
const MODULO_6_HOMILETICA: ModuleData = {
  id: "nivel3-mod6-homiletica",
  name: "Homilética",
  description: "A arte e ciência da preparação e apresentação de sermões",
  icon: "Megaphone",
  color: "#DC2626",
  order: 36,
  tracks: [
    {
      id: "track-n3m6-avancado",
      level: "avancado",
      name: "Pregação Expositiva",
      description: "Desenvolvendo pregação fiel e impactante",
      requiredPlan: "premium",
      order: 1,
      lessons: createLessons("n3m6", [
        {
          title: "O Chamado para Pregar",
          content: `A pregação é central no ministério cristão. "Prega a palavra, insta a tempo e fora de tempo" (2 Timóteo 4:2). Deus escolheu usar a loucura da pregação para salvar os que creem (1 Coríntios 1:21). A Palavra pregada é meio de graça.

O pregador é chamado, não se autopromove. "Como pregarão, se não forem enviados?" (Romanos 10:15). Há chamado interno (desejo, convicção) e externo (reconhecimento da igreja). Ambos são necessários.

A pregação é tarefa solene. "Os que ensinam receberão mais duro juízo" (Tiago 3:1). Responsabilidade imensa repousa sobre quem fala em nome de Deus. Não é entretenimento; é proclamação da Palavra do Rei.

O pregador deve viver o que prega. Credibilidade moral é essencial. "Tem cuidado de ti mesmo e da doutrina" (1 Timóteo 4:16). Vida e mensagem devem ser coerentes. Hipocrisia anula a mensagem.`,
          references: "2 Timóteo 4:1-5; 1 Coríntios 1:17-25; Romanos 10:14-17; Tiago 3:1; 1 Timóteo 4:16",
          questions: [
            "1. Por que pregação é central?",
            "2. O que é chamado interno e externo?",
            "3. Por que pregação é solene?",
            "4. Por que a vida do pregador importa?",
            "5. Você sente chamado para pregar?"
          ],
          application: "Se você prega, reavalie seu chamado. Se não, ore sobre como apoiar os que pregam.",
          summary: "A pregação é central, requer chamado interno e externo, é tarefa solene, e exige coerência entre vida e mensagem."
        },
        {
          title: "Tipos de Sermão",
          content: `Existem três tipos principais de sermão: expositivo, textual e tópico. Cada um tem seu lugar, mas a pregação expositiva deve ser a espinha dorsal do ministério da Palavra.

O sermão expositivo explica um texto bíblico, extraindo estrutura e pontos do próprio texto. O texto governa o sermão. Isso garante que a mensagem seja de Deus, não do pregador. É a forma mais segura e nutritiva.

O sermão textual parte de um texto curto, mas os pontos podem não vir diretamente do texto. É útil para textos breves ou memoráveis. Requer cuidado para não distorcer o texto.

O sermão tópico organiza ensinos bíblicos sobre um tema, usando vários textos. É útil para ocasiões especiais ou temas urgentes. O perigo é selecionar versículos fora de contexto para apoiar uma ideia preconcebida.`,
          references: "2 Timóteo 2:15; 4:2; Neemias 8:8; Atos 17:2-3; 20:27",
          questions: [
            "1. Quais são os três tipos de sermão?",
            "2. O que caracteriza pregação expositiva?",
            "3. Quando sermão textual é útil?",
            "4. Qual o perigo do sermão tópico?",
            "5. Qual tipo predomina em sua igreja?"
          ],
          application: "Avalie os sermões que você ouve. São primariamente expositivos, textuais ou tópicos?",
          summary: "Sermões podem ser expositivos (texto governa), textuais (texto curto) ou tópicos (tema com vários textos); expositivo é mais seguro."
        },
        {
          title: "Estudo do Texto",
          content: `A preparação do sermão começa com estudo do texto, não com busca de ilustrações. O pregador deve primeiro ser estudante antes de ser comunicador. Pressa é inimiga da boa pregação.

A exegese é fundamental. O que o texto disse aos leitores originais? Qual o contexto histórico, literário, teológico? Use as ferramentas de exegese aprendidas: observação, interpretação, aplicação.

Identifique a ideia central do texto. Cada passagem tem uma mensagem principal. Esse é o 'grande tema' (big idea) que o sermão comunicará. Se você não consegue resumir em uma frase, não entendeu o texto.

Pergunte: Como este texto aponta para Cristo? Toda Escritura converge para Ele. A pregação cristã não é moralismo; é evangelho. O imperativo (faça) flui do indicativo (Cristo fez). Sem graça, não há poder para mudança.`,
          references: "2 Timóteo 2:15; Atos 8:30-35; Lucas 24:27, 44; Neemias 8:8; 1 Coríntios 2:2",
          questions: [
            "1. Por onde começa a preparação?",
            "2. O que é exegese?",
            "3. O que é a 'ideia central'?",
            "4. Como o texto aponta para Cristo?",
            "5. Qual a diferença entre moralismo e evangelho?"
          ],
          application: "Escolha uma passagem e identifique sua ideia central em uma frase.",
          summary: "A preparação começa com exegese cuidadosa, identificação da ideia central, e conexão cristocêntrica evitando moralismo."
        },
        {
          title: "Estrutura do Sermão",
          content: `Um bom sermão tem estrutura clara: introdução, corpo (pontos principais) e conclusão. A estrutura serve a comunicação; se a audiência não pode seguir, a mensagem se perde.

A introdução deve capturar atenção e estabelecer relevância. Por que devo ouvir? Qual a pergunta que o texto responde? Uma boa introdução cria necessidade sentida que o texto satisfará.

O corpo desenvolve a ideia central em pontos. Os pontos devem emergir do texto (expositivo), ser claros, memoráveis e progressivos. Cada ponto deve ter explicação (o que significa), ilustração (como se parece) e aplicação (o que fazer).

A conclusão resume, aplica e desafia. Não é repetição, mas chegada ao destino. Qual resposta o texto demanda? Chame à ação específica. Termine forte; não se arraste. A última impressão é duradoura.`,
          references: "Neemias 8:8; Atos 2:14-41; 17:22-31; Hebreus 4:12; 2 Timóteo 4:2",
          questions: [
            "1. Quais são as partes do sermão?",
            "2. O que uma boa introdução faz?",
            "3. O que cada ponto deve conter?",
            "4. O que a conclusão deve fazer?",
            "5. Você consegue seguir os sermões que ouve?"
          ],
          application: "Esboce um sermão com introdução, 3 pontos (cada um com explicação, ilustração, aplicação) e conclusão.",
          summary: "Um sermão estruturado tem introdução (atenção/relevância), corpo (pontos emergentes do texto) e conclusão (aplicação/desafio)."
        },
        {
          title: "Ilustrações e Aplicações",
          content: `Ilustrações são janelas que deixam luz entrar. Tornam o abstrato concreto. Jesus usou parábolas; pregadores eficazes usam ilustrações. Mas ilustrações servem ao texto, não substituem.

Boas ilustrações vêm de vida real: experiências pessoais, história, literatura, observação da natureza e sociedade. Cuidado com ilustrações de internet repetidas. Autenticidade conecta.

Cada texto demanda aplicação. "Sede cumpridores da palavra, e não somente ouvintes" (Tiago 1:22). Aplicação deve ser específica, não vaga. "Ame mais" é inútil; "Perdoe seu cônjuge por aquele conflito" é acionável.

A aplicação flui do texto, não é imposta. Pergunte: que resposta o autor original buscava? Isso guia a aplicação legítima. Considere diferentes ouvintes: incrédulos, novos crentes, maduros, sofrendo, rebeldes.`,
          references: "Tiago 1:22-25; Mateus 13:1-52; Lucas 10:25-37; 2 Timóteo 3:16-17; Hebreus 4:12",
          questions: [
            "1. Para que servem ilustrações?",
            "2. De onde vêm boas ilustrações?",
            "3. O que torna aplicação eficaz?",
            "4. Como o texto guia aplicação?",
            "5. Por que considerar diferentes ouvintes?"
          ],
          application: "Pratique observar a vida como fonte de ilustrações. Anote insights esta semana.",
          summary: "Ilustrações tornam o abstrato concreto; aplicações devem ser específicas e fluir do texto para diferentes tipos de ouvintes."
        },
        {
          title: "Entrega do Sermão",
          content: `A entrega importa. O conteúdo mais rico pode morrer na comunicação fraca. "Como pregarão sem pregador?" (Romanos 10:15). O mensageiro afeta a mensagem.

Contato visual conecta. Olhe para as pessoas, não para notas ou teto. Se precisa de anotações, use breves e olhe para cima frequentemente. Conexão visual comunica: "Estou falando com você."

Voz e corpo comunicam. Varie tom, volume, velocidade. Pausas são poderosas. Gesticulação natural reforça; gesticulação mecânica distrai. Seja você mesmo ampliado, não ator.

Paixão é essencial, mas não é gritar. É convicção sentida. Se você não está convencido, ninguém será. "Cremos; por isso também falamos" (2 Coríntios 4:13). O coração inflamado aquece ouvintes frios.`,
          references: "Romanos 10:14-15; 2 Coríntios 4:13; 5:11; Atos 4:13, 31; 1 Tessalonicenses 2:8",
          questions: [
            "1. Por que a entrega importa?",
            "2. Por que contato visual é importante?",
            "3. Como usar voz e corpo eficazmente?",
            "4. O que é paixão genuína?",
            "5. O que você pode melhorar na entrega?"
          ],
          application: "Se você prega, peça feedback honesto sobre sua entrega. Se não, ore pelos pregadores.",
          summary: "A entrega eficaz inclui contato visual, uso variado de voz e corpo, e paixão genuína que reflete convicção pessoal."
        },
        {
          title: "Pregação Cristocêntrica",
          content: `Toda pregação cristã deve ser cristocêntrica. "Nada me propus saber entre vós, senão a Jesus Cristo, e este crucificado" (1 Coríntios 2:2). Cristo é o centro de toda Escritura e deve ser de todo sermão.

Isso não significa mencionar Jesus artificialmente. Significa perguntar: como este texto se conecta à obra redentora de Cristo? Promete Sua vinda? Prefigura Seu sacrifício? Demanda o que só Ele capacita?

A alternativa é moralismo: "Seja como Davi" ou "Não seja como Judas". Isso produz legalismo (esforço próprio) ou desespero (incapacidade). O evangelho transforma porque primeiro declara o que Cristo fez por nós.

A ordem bíblica é: indicativo (Cristo fez) gera imperativo (agora faça). "Sede santos porque eu sou santo" vem depois de "Fostes resgatados... pelo precioso sangue de Cristo" (1 Pedro 1:15-19). Graça capacita obediência.`,
          references: "1 Coríntios 2:2; Lucas 24:27, 44; João 5:39; Gálatas 2:20; 2 Coríntios 5:14-15",
          questions: [
            "1. O que é pregação cristocêntrica?",
            "2. Como conectar qualquer texto a Cristo?",
            "3. O que é moralismo?",
            "4. Qual a ordem bíblica: indicativo ou imperativo primeiro?",
            "5. Como graça capacita obediência?"
          ],
          application: "Avalie um sermão recente: foi cristocêntrico ou moralizante?",
          summary: "Pregação cristocêntrica conecta todo texto a Cristo, evita moralismo, e apresenta graça (indicativo) antes de demandas (imperativo)."
        },
        {
          title: "Pregação para o Coração",
          content: `Bons sermões não apenas informam a mente; transformam o coração. "Do coração procedem as saídas da vida" (Provérbios 4:23). O coração bíblico inclui mente, vontade e emoções - a pessoa toda.

Pregar para o coração significa atingir motivações, não apenas comportamentos. Por que pecamos? Por que resistimos? Quais ídolos competem por adoração? Sermões superficiais tratam sintomas; sermões profundos tratam raízes.

Apele às emoções legitimamente. A Bíblia apela: medo do juízo, amor de Deus, vergonha do pecado, alegria da salvação. Emoção sem verdade é sentimentalismo; verdade sem emoção é aridez. Ambos são necessários.

Vise a adoração, não apenas informação. Quando o sermão termina, os ouvintes devem querer louvar a Deus, não apenas saber mais sobre Ele. Conhecimento que não leva à adoração falhou em seu propósito.`,
          references: "Provérbios 4:23; Romanos 12:1-2; Mateus 22:37; Hebreus 4:12; 2 Coríntios 5:11, 14",
          questions: [
            "1. O que é o 'coração' bíblico?",
            "2. O que significa tratar motivações?",
            "3. Quando emoção é legítima no sermão?",
            "4. Qual deve ser o resultado de um bom sermão?",
            "5. Você sai de sermões querendo adorar?"
          ],
          application: "Reflita sobre o último sermão que ouviu. Ele atingiu seu coração ou só sua mente?",
          summary: "Pregação eficaz atinge o coração todo (mente, vontade, emoções), trata motivações profundas e visa adoração, não apenas informação."
        },
        {
          title: "Série de Sermões",
          content: `Pregar séries através de livros bíblicos oferece vantagens. Cobre todo o conselho de Deus (Atos 20:27). Evita apenas textos favoritos. Força o pregador e a congregação a lidar com passagens difíceis.

Planejamento é essencial. Quanto tempo no livro? Quantos versículos por semana? Onde dividir? Considere o calendário (pausas para datas especiais). Um plano flexível é melhor que nenhum plano.

Varie os livros. Não pregue só Paulo ou só Antigo Testamento. A Escritura inteira é útil. Gêneros diferentes (narrativa, poesia, epístola, apocalíptica) mantêm frescor e desenvolvem habilidades.

Ocasionalmente, séries tópicas são apropriadas. Crises na igreja, datas especiais, necessidades da comunidade podem justificar interrupção da série expositiva. Mas sejam exceções, não regra.`,
          references: "Atos 20:27; 2 Timóteo 3:16-17; 4:2; Neemias 8:1-8; Êxodo 24:7",
          questions: [
            "1. Quais são vantagens de pregar livros inteiros?",
            "2. Por que planejamento é importante?",
            "3. Por que variar os livros?",
            "4. Quando séries tópicas são apropriadas?",
            "5. Sua igreja prega sistematicamente através de livros?"
          ],
          application: "Se você prega, planeje sua próxima série. Se não, encoraje seu pastor a pregar expositivamente.",
          summary: "Pregar séries através de livros cobre todo o conselho de Deus, exige planejamento e variação de gêneros, com exceções tópicas ocasionais."
        },
        {
          title: "Vida Devocional do Pregador",
          content: `O pregador não pode dar o que não tem. Antes de preparar sermões, deve alimentar sua própria alma. Estudo acadêmico não é devoção. Ler a Bíblia para pregar difere de ler para comunhão com Deus.

O perigo do profissionalismo é tratar a Bíblia apenas como ferramenta de trabalho. "Tende cuidado de vós mesmos" (Atos 20:28) - os anciãos de Éfeso foram instruídos a cuidar de si antes de cuidar do rebanho.

Oração é essencial. "Dá-nos cada dia o nosso pão" - o pregador precisa receber antes de distribuir. Ore pelo texto, pelos ouvintes, por si mesmo. Sermões preparados sem oração são palavras humanas, não mensagem de Deus.

Confissão e santificação são necessárias. Pecado oculto esvazia a pregação. "Se eu atender à iniquidade no meu coração, o Senhor não me ouvirá" (Salmo 66:18). Pureza de vida sustenta poder de púlpito.`,
          references: "Atos 20:28; Esdras 7:10; Salmo 66:18; 1 Timóteo 4:16; 2 Timóteo 2:21",
          questions: [
            "1. Por que vida devocional importa para o pregador?",
            "2. Qual o perigo do profissionalismo?",
            "3. Por que orar na preparação?",
            "4. Como pecado oculto afeta pregação?",
            "5. Como está sua vida devocional?"
          ],
          application: "Separe tempo esta semana para ler a Bíblia sem propósito de preparar sermão - apenas comunhão.",
          summary: "O pregador deve nutrir sua própria alma através de devoção pessoal, oração na preparação e santificação contínua."
        }
      ])
    }
  ]
};

// MÓDULO 7: Aconselhamento Pastoral
const MODULO_7_ACONSELHAMENTO: ModuleData = {
  id: "nivel3-mod7-aconselhamento",
  name: "Aconselhamento Pastoral",
  description: "Princípios bíblicos para cuidar de pessoas",
  icon: "Heart",
  color: "#EC4899",
  order: 37,
  tracks: [
    {
      id: "track-n3m7-avancado",
      level: "avancado",
      name: "Cuidando de Almas",
      description: "Aconselhamento fundamentado na Escritura",
      requiredPlan: "premium",
      order: 1,
      lessons: createLessons("n3m7", [
        {
          title: "Fundamentos do Aconselhamento Bíblico",
          content: `O aconselhamento bíblico parte da suficiência das Escrituras. "Toda a Escritura é inspirada... para que o homem de Deus seja perfeito e perfeitamente instruído para toda boa obra" (2 Timóteo 3:16-17). A Bíblia é suficiente para questões de fé e vida.

Isso não significa rejeitar todas as contribuições de outras disciplinas. Psicologia pode descrever comportamentos; a Bíblia prescreve cura. Medicina trata o corpo; a Bíblia trata a alma. Integração sábia, não rejeição cega.

O aconselhamento bíblico é ministério da Palavra. Não é terapia secular com versículos adicionados. É aplicação pastoral da Escritura às situações da vida. O conselheiro bíblico é, acima de tudo, ministro da Palavra.

O objetivo é conformidade a Cristo, não apenas alívio de sintomas. "Até que Cristo seja formado em vós" (Gálatas 4:19). Às vezes o caminho para maturidade passa por sofrimento. O objetivo não é felicidade superficial, mas santidade profunda.`,
          references: "2 Timóteo 3:16-17; Hebreus 4:12; Romanos 15:14; Colossenses 1:28; Gálatas 4:19",
          questions: [
            "1. O que significa suficiência das Escrituras?",
            "2. Como outras disciplinas se relacionam?",
            "3. O que é aconselhamento bíblico?",
            "4. Qual é o objetivo do aconselhamento?",
            "5. Por que santidade importa mais que felicidade?"
          ],
          application: "Quando enfrentar problema, pergunte primeiro: o que a Escritura diz sobre isso?",
          summary: "Aconselhamento bíblico parte da suficiência das Escrituras, é ministério da Palavra, e visa conformidade a Cristo, não apenas alívio."
        },
        {
          title: "O Coração Humano",
          content: `A Bíblia vê o coração como centro da pessoa. "Do coração procedem as saídas da vida" (Provérbios 4:23). Comportamento flui do coração; mudança verdadeira é mudança de coração.

O coração inclui mente (pensamentos), vontade (desejos) e emoções (sentimentos). Não são partes separadas, mas aspectos integrados da pessoa interior. A pessoa age como pensa, deseja e sente.

O coração é 'enganoso acima de tudo' (Jeremias 17:9). Não podemos confiar em autopercepções sem luz da Escritura. O Espírito e a Palavra revelam o que está realmente no coração. Precisamos de honestidade dolorosa.

Ídolos do coração governam comportamento. O que adoramos molda o que fazemos. Aconselhamento eficaz identifica ídolos funcionais (o que realmente buscamos para satisfação, identidade, segurança) e os substitui pela adoração a Deus.`,
          references: "Provérbios 4:23; Jeremias 17:9-10; Mateus 15:18-19; Hebreus 4:12; Ezequiel 14:3-5",
          questions: [
            "1. O que é o coração bíblico?",
            "2. Que aspectos o coração inclui?",
            "3. Por que o coração é 'enganoso'?",
            "4. O que são ídolos do coração?",
            "5. Quais podem ser seus ídolos funcionais?"
          ],
          application: "Pergunte-se: o que eu mais temo perder? O que eu mais quero ter? Essas respostas revelam ídolos.",
          summary: "O coração (mente, vontade, emoções) é o centro da pessoa; é enganoso e governado por ídolos que o aconselhamento deve identificar."
        },
        {
          title: "Ouvir com Sabedoria",
          content: `Ouvir é fundamental no aconselhamento. "Todo homem seja pronto para ouvir, tardio para falar" (Tiago 1:19). A pressa em aconselhar sem ouvir produz conselhos irrelevantes ou prejudiciais.

Ouvir ativamente significa dar atenção plena. Contato visual, postura aberta, perguntas clarificadoras. Não apenas ouvir palavras, mas também o que está por trás delas. Que emoções acompanham? O que não está sendo dito?

Faça perguntas sábias. Jesus frequentemente respondia com perguntas. Perguntas revelam o coração, estimulam reflexão, e evitam que o conselheiro assuma. "O que você quer que eu faça por você?" (Marcos 10:51).

Ouça a história completa. "Responder antes de ouvir é estultícia e vergonha" (Provérbios 18:13). Resista à tentação de diagnosticar rapidamente. Situações são complexas; pessoas são únicas. Ouça até entender verdadeiramente.`,
          references: "Tiago 1:19; Provérbios 18:13, 15, 17; Marcos 10:51; João 4:7-26",
          questions: [
            "1. Por que ouvir vem primeiro?",
            "2. O que é ouvir ativamente?",
            "3. Por que perguntas são importantes?",
            "4. Por que ouvir a história completa?",
            "5. Você tende a ouvir ou falar primeiro?"
          ],
          application: "Na próxima conversa difícil, comprometa-se a fazer mais perguntas que declarações.",
          summary: "Ouvir ativamente com perguntas sábias e paciência para a história completa é fundamental antes de aconselhar."
        },
        {
          title: "Falar a Verdade em Amor",
          content: `Verdade sem amor é brutalidade; amor sem verdade é sentimentalismo. "Seguindo a verdade em amor, cresçamos" (Efésios 4:15). Ambos são necessários para aconselhamento bíblico.

Falar a verdade pode ser desconfortável. Algumas verdades confrontam pecado. "Melhor é a repreensão franca do que o amor encoberto" (Provérbios 27:5). O amor verdadeiro não evita conversas difíceis; enfrenta-as pela pessoa.

O amor governa como falamos. Tom, timing, palavras - tudo importa. "A resposta branda desvia o furor" (Provérbios 15:1). Verdade dita com dureza fecha ouvidos. Verdade dita com amor abre corações.

Às vezes, o amor significa simplesmente estar presente. Jó precisou de silêncio antes de palavras. "Assentaram-se com ele na terra... porque viam que era muito grande a dor" (Jó 2:13). Presença compassiva comunica antes de palavras.`,
          references: "Efésios 4:15, 25; Provérbios 27:5-6; 15:1-2; Jó 2:11-13; Gálatas 6:1-2",
          questions: [
            "1. Por que verdade e amor são ambos necessários?",
            "2. Quando verdade é desconfortável?",
            "3. Como amor governa o falar?",
            "4. Quando silêncio é apropriado?",
            "5. Você tende a enfatizar verdade ou amor?"
          ],
          application: "Se há verdade difícil que precisa dizer a alguém, planeje como dizê-la em amor.",
          summary: "Aconselhamento bíblico une verdade e amor, falando honestamente com compaixão, sabendo quando palavras e quando silêncio são necessários."
        },
        {
          title: "Problemas Comuns: Ansiedade",
          content: `A ansiedade é uma das questões mais comuns. A Bíblia a leva a sério. "Não andeis ansiosos por coisa alguma" (Filipenses 4:6). Isso é comando, o que significa que ansiedade envolve responsabilidade, não apenas vitimização.

A ansiedade frequentemente revela ídolos do coração. Do que temos medo de perder? O que achamos que precisamos para estar bem? A ansiedade é termômetro espiritual que mostra o que realmente adoramos.

O remédio bíblico combina oração e pensamento. "Com ações de graças, façam conhecidos os vossos pedidos a Deus" (Filipenses 4:6). E: "Tudo o que é verdadeiro... nisso pensai" (4:8). Oração reconhece dependência; pensamento correto combate mentiras.

"A paz de Deus, que excede todo entendimento, guardará os vossos corações" (Filipenses 4:7). A promessa não é ausência de problemas, mas presença de paz em meio a eles. Cristo é nossa paz mesmo quando circunstâncias não mudam.`,
          references: "Filipenses 4:6-9; Mateus 6:25-34; 1 Pedro 5:7; Salmo 55:22; 94:19",
          questions: [
            "1. Como a Bíblia vê a ansiedade?",
            "2. O que ansiedade pode revelar?",
            "3. Qual é o remédio bíblico?",
            "4. Que paz é prometida?",
            "5. Com que você tem sido ansioso?"
          ],
          application: "Para cada preocupação, pratique: lançar sobre Deus em oração, pensar no que é verdadeiro.",
          summary: "Ansiedade frequentemente revela ídolos; o remédio bíblico combina oração dependente e pensamento correto, resultando em paz divina."
        },
        {
          title: "Problemas Comuns: Depressão",
          content: `Depressão é experiência comum. Elias desejou morrer após Carmelo (1 Reis 19). Jeremias lamentou profundamente. Davi teve noites escuras (Salmos 42, 88). A Bíblia não ignora sofrimento mental.

A depressão pode ter causas físicas (exaustão, doença), circunstanciais (perda, trauma) e espirituais (pecado, ídolos). Frequentemente é mistura. Cuidado com diagnósticos simplistas que tratam toda depressão igual.

Deus tratou Elias com sono, comida, companhia e missão. Causas físicas requerem cuidado físico. Não espiritualizar tudo. Às vezes a pessoa precisa descansar e comer antes de ouvir teologia.

A esperança é central no tratamento. "Por que estás abatida, ó minha alma? Espera em Deus" (Salmo 42:5). O salmista prega a si mesmo. Direcionar o coração para Deus repetidamente, mesmo quando não sentimos, é caminho para recuperação.`,
          references: "1 Reis 19:1-18; Salmo 42; 88; 2 Coríntios 1:8-9; 4:7-18",
          questions: [
            "1. Personagens bíblicos experimentaram depressão?",
            "2. Quais podem ser as causas?",
            "3. Como Deus tratou Elias?",
            "4. Por que esperança é central?",
            "5. Você ou alguém próximo luta com depressão?"
          ],
          application: "Se você está abatido, verifique: sono, alimentação, companhia. Cuide do físico enquanto busca o espiritual.",
          summary: "Depressão tem causas diversas (físicas, circunstanciais, espirituais); tratamento inclui cuidado integral e direcionamento do coração para Deus."
        },
        {
          title: "Problemas Comuns: Conflito Relacional",
          content: `Conflitos são inevitáveis entre pecadores. A questão é como lidar. "Se possível, quanto depender de vós, tende paz com todos os homens" (Romanos 12:18). Faça sua parte; você não controla a resposta do outro.

Jesus deu passos para resolução. "Vai, e repreende-o entre ti e ele só" (Mateus 18:15). O primeiro passo é conversa privada e direta. Não fofoque, não triangule, não evite. Confronte com mansidão.

Perdão é não-negociável para cristãos. "Perdoai-vos uns aos outros, como também Deus vos perdoou" (Efésios 4:32). Perdão não é sentimento; é decisão de não guardar conta. Sentimentos seguem decisões com o tempo.

Reconciliação nem sempre é possível. O ofensor pode não cooperar. Você pode perdoar unilateralmente; reconciliação requer dois. Mesmo quando reconciliação plena não acontece, libere o ressentimento que envenena você.`,
          references: "Mateus 18:15-20; Efésios 4:26-32; Romanos 12:17-21; Colossenses 3:12-14",
          questions: [
            "1. Conflitos são evitáveis?",
            "2. Qual o primeiro passo de Mateus 18?",
            "3. Perdão é sentimento ou decisão?",
            "4. Qual a diferença entre perdão e reconciliação?",
            "5. Há conflito em sua vida que precisa resolver?"
          ],
          application: "Identifique uma pessoa com quem tem conflito. Planeje uma conversa privada e direta esta semana.",
          summary: "Conflitos requerem confronto amoroso e direto, perdão como decisão, e reconciliação quando possível; libere ressentimento sempre."
        },
        {
          title: "Problemas Comuns: Casamento",
          content: `Problemas conjugais estão entre os mais comuns no aconselhamento. O casamento expõe egoísmo como nenhum outro relacionamento. "Maridos, amai vossas mulheres, como também Cristo amou a igreja" (Efésios 5:25). Amor sacrificial é o padrão.

Comunicação é frequentemente o problema apresentado. Mas comunicação ruim geralmente revela problemas de coração: orgulho, medo, amargura. Técnicas de comunicação sem mudança de coração são superficiais.

Papéis bíblicos são frequentemente mal compreendidos. Liderança do marido é servir, não dominar. Submissão da esposa é respeitar liderança servidora, não ser capacho. Ambos submetem-se a Cristo.

A meta não é casamento sem conflito, mas casamento onde conflitos são resolvidos biblicamente. "Não se ponha o sol sobre a vossa ira" (Efésios 4:26). Resolução rápida, perdão mútuo, graça abundante.`,
          references: "Efésios 5:22-33; Colossenses 3:18-19; 1 Pedro 3:1-7; Provérbios 31:10-31",
          questions: [
            "1. Por que casamento expõe egoísmo?",
            "2. O que comunicação ruim frequentemente revela?",
            "3. O que é liderança bíblica do marido?",
            "4. O que é submissão bíblica da esposa?",
            "5. Qual é a meta para conflitos conjugais?"
          ],
          application: "Se casado, pergunte ao cônjuge: como posso amá-lo/a melhor? Ouça sem defender-se.",
          summary: "Problemas conjugais expõem corações egoístas; a solução envolve amor sacrificial, papéis bíblicos bem compreendidos e resolução rápida de conflitos."
        },
        {
          title: "Aconselhamento e Comunidade",
          content: `Aconselhamento não é só pastor-ovelha; é função de toda a comunidade. "Aconselhai-vos uns aos outros" (Colossenses 3:16). Cada membro pode ministrar a outros. O pastor não é o único conselheiro.

A comunidade cristã é contexto de cura. "Levai as cargas uns dos outros" (Gálatas 6:2). Isolamento agrava problemas; conexão começa cura. Pequenos grupos, amizades intencionais, e mentores são recursos subvalorizados.

Confidencialidade é essencial, mas não absoluta. Segredos devem ser guardados, mas não quando envolvem perigo para a pessoa ou outros (suicídio, abuso). Deixe claro os limites desde o início.

Saiba encaminhar. Nem todo problema é para todo conselheiro. Questões médicas precisam de médicos. Casos complexos podem precisar de conselheiros mais experientes. Humildade reconhece limites.`,
          references: "Colossenses 3:16; Gálatas 6:1-2; Romanos 15:14; Provérbios 11:14; 15:22",
          questions: [
            "1. Quem pode aconselhar na igreja?",
            "2. Por que comunidade é contexto de cura?",
            "3. Quando confidencialidade tem limites?",
            "4. Quando encaminhar?",
            "5. Você está envolvido em aconselhar outros?"
          ],
          application: "Identifique alguém que precisa de apoio. Ofereça-se para ouvir e caminhar junto.",
          summary: "Aconselhamento é função de toda a comunidade, requer confidencialidade com limites, e sabedoria para encaminhar quando necessário."
        },
        {
          title: "O Conselheiro e Autocuidado",
          content: `Quem cuida de outros precisa de cuidado próprio. "Cuida de ti mesmo e do ensino" (1 Timóteo 4:16). Esgotamento (burnout) é risco real para quem está constantemente dando.

Sinais de esgotamento incluem: exaustão constante, cinismo, sensação de ineficácia, irritabilidade, negligência de relações pessoais. Se presentes, reduza carga, busque supervisão, descanse.

Estabeleça limites saudáveis. Você não pode resolver todo problema de todos. Jesus mesmo se retirava para orar (Lucas 5:16). Dizer não às vezes é necessário para dizer sim ao que importa mais.

Tenha seu próprio conselheiro. "O que se crê sábio será sábio" (Provérbios 13:20). Todos precisam de alguém que fala verdade em suas vidas. O conselheiro não está acima da necessidade de ser aconselhado.`,
          references: "1 Timóteo 4:16; Lucas 5:16; Marcos 6:31; 3 João 2; Provérbios 13:20; 27:17",
          questions: [
            "1. Por que autocuidado é necessário?",
            "2. Quais são sinais de esgotamento?",
            "3. Por que limites são importantes?",
            "4. Por que conselheiros precisam de conselheiros?",
            "5. Como está seu próprio cuidado?"
          ],
          application: "Avalie: você está se cuidando? Se não, que mudança precisa fazer esta semana?",
          summary: "Conselheiros precisam de autocuidado através de limites saudáveis, descanso, e ter seu próprio conselheiro para evitar esgotamento."
        }
      ])
    }
  ]
};

// MÓDULO 8: Missiologia
const MODULO_8_MISSIOLOGIA: ModuleData = {
  id: "nivel3-mod8-missiologia",
  name: "Missiologia",
  description: "Teologia e prática da missão cristã no mundo",
  icon: "Globe",
  color: "#10B981",
  order: 38,
  tracks: [
    {
      id: "track-n3m8-avancado",
      level: "avancado",
      name: "A Missão de Deus",
      description: "Compreendendo e participando da missio Dei",
      requiredPlan: "premium",
      order: 1,
      lessons: createLessons("n3m8", [
        {
          title: "A Missio Dei",
          content: `A missão é de Deus, não primariamente da igreja. A missio Dei significa que Deus é missionário - Ele busca, redime, restaura. A igreja participa da missão de Deus; não a possui.

A Trindade é missionária. O Pai envia o Filho; Pai e Filho enviam o Espírito; a Trindade envia a igreja. "Assim como o Pai me enviou, eu também vos envio" (João 20:21). Missão flui do caráter e propósito de Deus.

Toda a Bíblia é história missionária. De Gênesis 3:15 (semente da mulher) a Apocalipse 7:9 (multidão de todas as nações), Deus trabalha para redimir um povo de toda tribo, língua e nação.

A promessa a Abraão é charter missionário. "Em ti serão benditas todas as famílias da terra" (Gênesis 12:3). Israel existia para ser luz às nações; a igreja cumpre essa vocação universalmente.`,
          references: "João 20:21; Gênesis 12:1-3; Isaías 49:6; Mateus 28:18-20; Apocalipse 7:9-10",
          questions: [
            "1. O que é missio Dei?",
            "2. Como a Trindade é missionária?",
            "3. Onde começa a história missionária?",
            "4. Qual é o propósito da promessa a Abraão?",
            "5. A missão é central ou periférica no plano de Deus?"
          ],
          application: "Veja sua participação em missões como envolvimento na missão de Deus, não projeto humano.",
          summary: "A missio Dei reconhece que missão pertence a Deus; a Trindade é missionária e toda a Bíblia narra a história da redenção global."
        },
        {
          title: "A Grande Comissão",
          content: `A Grande Comissão é o mandato de Cristo à igreja. "Ide, fazei discípulos de todas as nações" (Mateus 28:19). Não é sugestão, mas comando. Não é para missionários profissionais apenas, mas para toda a igreja.

O verbo principal é "fazer discípulos", não "ir". Indo, batizando e ensinando são particípios que descrevem como discípulos são feitos. A meta não é conversões apenas, mas discípulos maduros.

"Todas as nações" (panta ta ethne) significa todos os grupos étnicos. A missão não está completa até que haja discípulos de cada grupo. Alguns grupos têm milhões de pessoas sem testemunho cristão. Prioridade deve ir aos não-alcançados.

A autoridade e presença de Cristo garantem a missão. "É-me dada toda autoridade... eis que eu estou convosco" (Mateus 28:18, 20). Não vamos em nossa força ou por nossas estratégias; vamos sob Seu comando e com Sua presença.`,
          references: "Mateus 28:18-20; Marcos 16:15; Lucas 24:46-49; João 20:21; Atos 1:8",
          questions: [
            "1. O que é a Grande Comissão?",
            "2. Qual é o verbo principal?",
            "3. O que significa 'todas as nações'?",
            "4. O que garante a missão?",
            "5. Como você está cumprindo a Grande Comissão?"
          ],
          application: "Ore regularmente por grupos não-alcançados. Considere como você pode contribuir para alcançá-los.",
          summary: "A Grande Comissão manda fazer discípulos de todos os grupos étnicos, garantida pela autoridade e presença de Cristo."
        },
        {
          title: "Povos Não-Alcançados",
          content: `Um povo não-alcançado é aquele sem comunidade cristã nativa capaz de evangelizar seu próprio povo sem ajuda externa. Estima-se que existam mais de 7.000 grupos assim, representando bilhões de pessoas.

Jesus disse: "Este evangelho do reino será pregado em todo o mundo, para testemunho a todas as nações" (Mateus 24:14). A conclusão da missão está ligada ao retorno de Cristo. Urgência missionária é urgência escatológica.

A maioria dos recursos missionários vai para onde já há igreja. Menos de 5% dos missionários trabalham entre os não-alcançados. A estratégia precisa mudar. "Esforço-me por pregar o evangelho onde Cristo não foi nomeado" (Romanos 15:20).

Alcançar os não-alcançados requer sacrifício. São frequentemente lugares difíceis: áreas muçulmanas, hindu, budistas; regiões remotas; contextos de perseguição. A missão pioneira custa, mas é necessária.`,
          references: "Mateus 24:14; Romanos 15:20-21; Apocalipse 5:9; 7:9; 14:6",
          questions: [
            "1. O que é um povo não-alcançado?",
            "2. Quantos grupos assim existem aproximadamente?",
            "3. Por que alcançá-los é urgente?",
            "4. Que porcentagem de missionários vai aos não-alcançados?",
            "5. Você conhece algum povo não-alcançado pelo nome?"
          ],
          application: "Pesquise sobre um povo não-alcançado específico. Ore por ele regularmente.",
          summary: "Milhares de povos não-alcançados ainda existem; a maioria dos recursos vai a alcançados; estratégia e sacrifício são necessários."
        },
        {
          title: "Contextualização",
          content: `Contextualização é comunicar o evangelho de forma compreensível à cultura receptora. Paulo fez isso: "Fiz-me tudo para todos, para de alguma maneira salvar alguns" (1 Coríntios 9:22). O conteúdo não muda; a forma se adapta.

Contextualização não é sincretismo. Sincretismo mistura verdade com erro; contextualização comunica verdade imutável em formas culturalmente apropriadas. A linha é fina, mas crucial. O evangelho julga toda cultura; toda cultura tem elementos redimíveis.

Exemplos incluem: usar música local em adoração, traduzir conceitos bíblicos para categorias locais, estruturar liderança conforme padrões culturais compatíveis com Escritura. Forma é flexível; mensagem é fixa.

O teste é: a mensagem permanece bíblica? As pessoas estão sendo transformadas conforme Cristo? A igreja resultante é autenticamente cristã e autenticamente local? Contextualização bem feita produz igrejas saudáveis enraizadas.`,
          references: "1 Coríntios 9:19-23; Atos 17:22-31; 15:1-29; João 1:14; Filipenses 2:5-8",
          questions: [
            "1. O que é contextualização?",
            "2. Como difere de sincretismo?",
            "3. O que Paulo ensina em 1 Coríntios 9?",
            "4. Dê exemplo de contextualização legítima.",
            "5. Como testar se contextualização é saudável?"
          ],
          application: "Como sua igreja contextualiza (ou não) para sua comunidade local?",
          summary: "Contextualização comunica o evangelho imutável em formas culturalmente compreensíveis, diferente de sincretismo que compromete a mensagem."
        },
        {
          title: "Plantação de Igrejas",
          content: `A meta missionária é plantar igrejas, não apenas fazer convertidos. Atos mostra Paulo plantando igrejas, não criando convertidos dispersos. A igreja é plano A de Deus; não há plano B.

Igrejas saudáveis se reproduzem. O objetivo não é dependência permanente do missionário, mas igrejas locais que evangelizam, discipulam e plantam outras igrejas. Multiplicação, não adição.

Os princípios de igrejas autóctones são: autossustento (financeiramente independentes), autogoverno (liderança local) e autopropagação (evangelizando e plantando). O missionário trabalha para se tornar desnecessário.

Movimentos de plantação de igrejas (CPMs) são multiplicação rápida de igrejas indígenas. Estudos mostram que movimentos mais frutíferos resultam de estratégias que priorizam líderes locais, métodos simples e reproduzíveis, e oração intensiva.`,
          references: "Atos 14:21-23; 16:5; Tito 1:5; Colossenses 1:28-29; 2 Timóteo 2:2",
          questions: [
            "1. Por que plantar igrejas é meta missionária?",
            "2. O que igrejas saudáveis fazem?",
            "3. O que são igrejas autóctones?",
            "4. O que são movimentos de plantação?",
            "5. Como sua igreja pode contribuir para plantação?"
          ],
          application: "Ore por plantadores de igrejas e movimentos de multiplicação entre povos não-alcançados.",
          summary: "A meta missionária é plantar igrejas autóctones que se reproduzem, com liderança local e multiplicação, não dependência."
        },
        {
          title: "Missão Integral",
          content: `Missão integral une proclamação e demonstração do evangelho. Não é só palavras, não é só obras; é ambos. Jesus pregou e curou; a igreja deve fazer o mesmo.

A proclamação é insubstituível. "Como crerão naquele de quem não ouviram?" (Romanos 10:14). Obras sociais sem palavras são humanitarismo; podem até obscurecer o evangelho. Boas obras abrem portas, mas a porta leva à Palavra.

A demonstração valida a proclamação. "Mostra-me a tua fé sem as tuas obras, e eu te mostrarei a minha fé pelas minhas obras" (Tiago 2:18). Comunidades que veem cristãos cuidando de pobres, órfãos, viúvas, enfermos, percebem que o amor pregado é real.

Prioridade não significa exclusividade. A proclamação é primária porque só ela leva à vida eterna; mas a demonstração é necessária porque a fé sem obras é morta e porque amamos como Cristo amou.`,
          references: "Mateus 4:23; Romanos 10:14-15; Tiago 2:14-18; 1 João 3:17-18; Lucas 4:18-19",
          questions: [
            "1. O que é missão integral?",
            "2. Por que proclamação é insubstituível?",
            "3. Por que demonstração é necessária?",
            "4. Qual é a prioridade?",
            "5. Sua igreja pratica missão integral?"
          ],
          application: "Identifique uma necessidade em sua comunidade onde sua igreja pode servir e proclamar juntos.",
          summary: "Missão integral une proclamação (primária) e demonstração do evangelho, validando a mensagem através de amor prático."
        },
        {
          title: "Perseguição e Sofrimento",
          content: `Missões frequentemente envolvem sofrimento. "Todos os que querem viver piedosamente em Cristo Jesus padecerão perseguição" (2 Timóteo 3:12). Milhões de cristãos enfrentam perseguição hoje; missionários compartilham esse risco.

O sofrimento não é surpresa, mas expectativa bíblica. "Se perseguiram a mim, perseguirão a vós" (João 15:20). Jesus prometeu tribulação no mundo. O servo não é maior que o mestre.

O sangue dos mártires é semente da igreja. Historicamente, perseguição frequentemente fortaleceu a igreja. "A vossa perseverança produz uma prova aprovada" (Romanos 5:4). O sofrimento frutífero glorifica a Deus e espalha o evangelho.

A igreja global deve lembrar os que sofrem. "Lembrai-vos dos presos, como se estivésseis presos com eles" (Hebreus 13:3). Ore, advogue, apoie. Os que vivem em liberdade têm responsabilidade para com os que não vivem.`,
          references: "2 Timóteo 3:12; João 15:18-21; Filipenses 1:29; Hebreus 13:3; 1 Pedro 4:12-14",
          questions: [
            "1. Missões sempre envolvem conforto?",
            "2. O que Jesus prometeu sobre perseguição?",
            "3. Como sofrimento pode ser frutífero?",
            "4. O que devemos fazer pelos que sofrem?",
            "5. Você ora regularmente pela igreja perseguida?"
          ],
          application: "Informe-se sobre a igreja perseguida (ex: portas abertas). Ore e considere apoio concreto.",
          summary: "Missões frequentemente envolvem sofrimento e perseguição; a igreja livre deve lembrar, orar e apoiar os que sofrem."
        },
        {
          title: "Mobilização Missionária",
          content: `Mobilização é o processo de levar a igreja a se envolver em missões. Não basta ter missionários; toda a igreja deve participar em oração, oferta, envio, apoio.

Oração é o fundamento. "Rogai ao Senhor da seara que envie ceifeiros" (Mateus 9:38). Oração missionária mobiliza recursos espirituais. Onde há oração fervorosa, há movimento missionário.

Oferta sustenta missionários. "Como pregarão, se não forem enviados?" (Romanos 10:15). Missionários precisam de apoio financeiro. Dar generosamente para missões é participar da obra. O dinheiro que enviamos pregará onde não podemos ir.

Envio intencional muda tudo. Igrejas devem identificar, treinar e enviar seus melhores, não apenas os que sobram. "Separai-me a Barnabé e a Saulo para a obra" (Atos 13:2). A igreja de Antioquia deu seus líderes para missão.`,
          references: "Mateus 9:37-38; Romanos 10:13-15; Atos 13:1-3; Filipenses 4:14-19; 3 João 5-8",
          questions: [
            "1. O que é mobilização missionária?",
            "2. Qual é o papel da oração?",
            "3. Por que ofertar para missões?",
            "4. O que significa enviar intencionalmente?",
            "5. Sua igreja mobiliza para missões?"
          ],
          application: "Avalie: você ora, oferta e promove missões regularmente? Que passo pode dar?",
          summary: "Mobilização envolve toda a igreja em oração, oferta e envio intencional de seus melhores para a obra missionária."
        },
        {
          title: "Missões e a Igreja Local",
          content: `A igreja local é a base de missões. Missionários são enviados por igrejas, não por agências isoladas. Atos mostra igrejas enviando e recebendo relatórios. Agências servem a igreja, não substituem.

Cada igreja local deve ter visão missionária. Não terceirize missões para denominações ou organizações. Ore por missionários específicos, apoie-os generosamente, comunique-se regularmente. Adote povos não-alcançados.

Igrejas saudáveis produzem missionários. Investir em discipulado local eventualmente produz quem irá além. A igreja que foca só em si mesma definha; a que olha para fora cresce.

O pastor é chave para visão missionária. Se o pastor não valoriza missões, a igreja não valorizará. Liderança pastoral apaixonada por missões transforma congregações. Pregue missões regularmente; visite campos; envie equipes.`,
          references: "Atos 13:1-3; 14:26-27; 15:3; Filipenses 4:15-18; Romanos 15:24",
          questions: [
            "1. Qual é a relação entre igreja local e missões?",
            "2. Igrejas devem ter própria visão missionária?",
            "3. Como igrejas saudáveis produzem missionários?",
            "4. Qual é o papel do pastor?",
            "5. Sua igreja tem relacionamento próximo com missionários?"
          ],
          application: "Proponha que sua igreja adote um missionário ou povo não-alcançado para orar e apoiar especificamente.",
          summary: "A igreja local é base de missões, não agências; cada igreja deve ter visão própria, liderada por pastores apaixonados."
        },
        {
          title: "O Futuro das Missões",
          content: `O cenário missionário mudou. O cristianismo cresceu explosivamente no Sul Global. Missionários vêm agora do Brasil, Coreia, Nigéria, não apenas do Ocidente. Missões é empreendimento global.

Desafios permanecem. O mundo islâmico, hindu e budista permanece largamente não-alcançado. Secularização avança no Ocidente. Novas ideologias resistem ao evangelho. A tarefa não está completa.

Tecnologia oferece novas oportunidades. Mídias sociais, tradução bíblica acelerada, treinamento online, análise de dados sobre povos - ferramentas multiplicam alcance. Mas tecnologia não substitui presença encarnacional.

O fim está ligado à missão. "Este evangelho será pregado em todo o mundo... então virá o fim" (Mateus 24:14). Não sabemos o dia, mas sabemos a tarefa. Cada geração deve fazer sua parte até que Cristo volte.`,
          references: "Mateus 24:14; Apocalipse 7:9-10; Atos 1:7-8; 2 Pedro 3:9, 12; Romanos 11:25-26",
          questions: [
            "1. Como o cenário missionário mudou?",
            "2. Quais desafios permanecem?",
            "3. Como tecnologia ajuda?",
            "4. Como a missão se relaciona com o fim?",
            "5. Qual é sua parte na missão desta geração?"
          ],
          application: "Comprometa-se com algum envolvimento missionário: oração, oferta, viagem curta, carreira.",
          summary: "Missões hoje são globais com novos desafios e oportunidades tecnológicas; a tarefa permanece até o retorno de Cristo."
        }
      ])
    }
  ]
};

// MÓDULO 9: Plantação de Igrejas
const MODULO_9_PLANTACAO: ModuleData = {
  id: "nivel3-mod9-plantacao",
  name: "Plantação de Igrejas",
  description: "Princípios e práticas para estabelecer novas comunidades de fé",
  icon: "Building",
  color: "#6366F1",
  order: 39,
  tracks: [
    {
      id: "track-n3m9-avancado",
      level: "avancado",
      name: "Estabelecendo Novas Igrejas",
      description: "Estratégias bíblicas para multiplicação",
      requiredPlan: "premium",
      order: 1,
      lessons: createLessons("n3m9", [
        {
          title: "Base Bíblica para Plantação",
          content: `A plantação de igrejas é o método de missão no Novo Testamento. Paulo não apenas evangelizou; plantou igrejas. "Para que estabeleças presbíteros em cada cidade" (Tito 1:5). O objetivo era comunidades estabelecidas, não apenas indivíduos convertidos.

A Grande Comissão implica plantação. "Fazei discípulos" requer comunidade. Discipulado acontece em relacionamentos; relacionamentos formam igreja. Você não pode fazer discípulos sem formar comunidade.

A igreja é o plano de Deus para o mundo. "A sabedoria de Deus, em toda a sua diversidade, se torne conhecida... por meio da igreja" (Efésios 3:10). Deus não escolheu apenas indivíduos, mas comunidade. A igreja exibe a glória de Deus ao mundo.

Plantar igrejas é a forma mais eficaz de evangelismo. Estudos mostram que igrejas novas alcançam mais pessoas por membro que igrejas estabelecidas. Novas igrejas têm energia, flexibilidade e fome evangelística.`,
          references: "Tito 1:5; Atos 14:23; Mateus 28:18-20; Efésios 3:10; 1 Timóteo 3:15",
          questions: [
            "1. Como Paulo fazia missões?",
            "2. Por que discipulado requer comunidade?",
            "3. Qual é o papel da igreja no plano de Deus?",
            "4. Por que novas igrejas são evangelisticamente eficazes?",
            "5. Sua igreja tem visão de plantar outras?"
          ],
          application: "Ore por plantadores de igrejas e considere se Deus pode estar chamando você.",
          summary: "Plantação de igrejas é método bíblico de missão; a igreja é plano de Deus e novas igrejas são evangelisticamente eficazes."
        },
        {
          title: "O Plantador de Igrejas",
          content: `Nem todo líder é plantador. Plantação requer dons específicos: evangelismo, liderança, resiliência, flexibilidade. Muitos excelentes pastores não seriam bons plantadores; e vice-versa.

O chamado é essencial. Plantar é difícil; sem convicção de chamado, desistência é provável. O plantador deve saber: Deus me chamou para isso. Essa certeza sustenta nas noites escuras.

Caráter supera competência. Um plantador com habilidades mas caráter falho prejudicará a obra. As qualificações de 1 Timóteo 3 e Tito 1 aplicam-se ao plantador. Humildade, integridade, perseverança são inegociáveis.

A família deve estar a bordo. Plantação afeta toda a família. Cônjuge deve apoiar o chamado; filhos serão impactados. Sacrificar família por ministério não é piedade; é idolatria ministerial. Cuide da casa primeiro.`,
          references: "1 Timóteo 3:1-7; Tito 1:5-9; Atos 13:2-3; 2 Timóteo 2:2; Efésios 4:11-12",
          questions: [
            "1. Todo líder pode plantar?",
            "2. Por que chamado é essencial?",
            "3. O que é mais importante: caráter ou competência?",
            "4. Por que a família precisa estar a bordo?",
            "5. Você tem perfil de plantador?"
          ],
          application: "Avalie honestamente: você tem chamado e dons para plantação? Se não, como pode apoiar quem tem?",
          summary: "Plantadores precisam de dons específicos, chamado claro, caráter qualificado e família que apoia o ministério."
        },
        {
          title: "Equipe de Plantação",
          content: `Plantar sozinho é perigoso e menos eficaz. Jesus enviou discípulos de dois em dois (Lucas 10:1). Paulo sempre teve equipe. A diversidade de dons na equipe cobre fraquezas individuais.

A equipe ideal combina dons complementares. Alguém com evangelismo, alguém com ensino, alguém com administração, alguém com pastoreio. Nenhum plantador tem todos os dons; a equipe completa.

Recrutar equipe requer intencionalidade. Ore pedindo colaboradores (Mateus 9:38). Identifique pessoas com visão compartilhada. Treine-os antes de partir. Esclareça expectativas, papéis e comprometimento.

Unidade na equipe é crucial. Conflitos de equipe podem destruir a plantação antes de começar. Invista em relacionamentos. Pratique resolução de conflitos. Equipes que oram juntas, permanecem juntas.`,
          references: "Lucas 10:1; Atos 13:2-4; 16:1-3; Eclesiastes 4:9-12; 1 Coríntios 12:12-27",
          questions: [
            "1. Por que não plantar sozinho?",
            "2. Que dons a equipe ideal inclui?",
            "3. Como recrutar equipe?",
            "4. Por que unidade é crucial?",
            "5. Você faz parte de uma equipe ministerial?"
          ],
          application: "Se está envolvido em ministério, avalie: você trabalha em equipe? Há complementaridade de dons?",
          summary: "Plantação eficaz requer equipe com dons complementares, recrutada intencionalmente e unida em relacionamento e oração."
        },
        {
          title: "Escolhendo o Local",
          content: `A localização importa estrategicamente. Paulo focou em cidades estratégicas (Éfeso, Corinto, Roma) de onde o evangelho se espalharia. Pense regionalmente, não apenas localmente.

Pesquise antes de escolher. Quem vive na área? Quais são as necessidades? Há igrejas saudáveis? Plantar onde já há abundância pode ser desperdício de recursos; vá onde há carência.

Considere acessibilidade e visibilidade. A igreja precisa ser encontrável. Bairros residenciais, áreas comerciais, locais de fluxo - cada um tem vantagens e desvantagens. A cultura do local afeta a estratégia.

Ore e discirna. Além de análise estratégica, busque direção de Deus. "O Espírito não permitiu... descendo a Trôade" (Atos 16:6-8). A estratégia humana é boa; a direção divina é melhor. Combine ambas.`,
          references: "Atos 16:6-10; 19:8-10; Romanos 15:22-24; Mateus 9:35-38",
          questions: [
            "1. Por que localização importa?",
            "2. Que perguntas fazer sobre a área?",
            "3. O que considerar sobre acessibilidade?",
            "4. Como combinar estratégia e direção divina?",
            "5. Há lugares em sua cidade que precisam de igrejas?"
          ],
          application: "Identifique um bairro ou cidade sem igreja evangélica saudável. Ore por ela.",
          summary: "Escolha de local requer pesquisa estratégica, consideração de acessibilidade e discernimento da direção de Deus."
        },
        {
          title: "Formando a Comunidade",
          content: `Os primeiros encontros definem DNA. O que você faz no início estabelece cultura. Priorize desde o início: evangelismo, discipulado, comunidade, missão. Não espere 'estabilizar' para fazer.

Comece pequeno intencionalmente. Grupos pequenos precedem cultos grandes. Relacionamentos profundos são formados em pequeno. A multiplicação saudável vem de intimidade, não de multidões.

A hospitalidade é ferramenta poderosa. "Perseverando juntos... partindo pão de casa em casa" (Atos 2:46). Refeições, lares abertos, vida compartilhada atraem e integram pessoas. Igreja é família, não evento.

Inclua novos crentes rapidamente. Não espere que amadureçam para servir. Dê responsabilidades cedo. Pessoas aprendem fazendo. Erros acontecerão, mas envolvimento acelera crescimento.`,
          references: "Atos 2:42-47; Romanos 12:13; 16:5; 1 Coríntios 16:19; Filemom 2",
          questions: [
            "1. Por que o início define DNA?",
            "2. Por que começar pequeno?",
            "3. Como hospitalidade ajuda?",
            "4. Por que envolver novos crentes cedo?",
            "5. O que define a cultura de sua comunidade?"
          ],
          application: "Avalie: sua comunidade pratica hospitalidade? Como você pode crescer nisso?",
          summary: "Formação de comunidade requer DNA intencional desde o início, começando pequeno, com hospitalidade e envolvimento rápido de novos crentes."
        },
        {
          title: "Evangelismo Local",
          content: `Plantação sem evangelismo é transferência, não crescimento. Se a nova igreja só recebe cristãos de outras, não está cumprindo a missão. O evangelismo deve estar no DNA desde o primeiro dia.

Conheça a comunidade. O que as pessoas valorizam? Quais são suas dores? Onde se reúnem? Evangelismo eficaz fala à realidade das pessoas. Oiça antes de falar; sirva antes de convidar.

Relacionamentos são ponte para o evangelho. Amizades genuínas abrem portas. Não use pessoas como projetos; ame-as como Jesus amou. O interesse genuíno é percebido e apreciado.

Eventos podem atrair, mas relacionamentos retêm. Grandes eventos podem trazer multidões, mas sem acompanhamento relacional, desaparecem. Invista mais em conexões pessoais que em programas impessoais.`,
          references: "Mateus 4:19; Lucas 19:10; João 4:1-42; Atos 2:47; 1 Coríntios 9:19-23",
          questions: [
            "1. Por que evangelismo é essencial na plantação?",
            "2. Por que conhecer a comunidade?",
            "3. Como relacionamentos servem ao evangelismo?",
            "4. Qual a limitação de grandes eventos?",
            "5. Quantos não-crentes você conhece pelo nome?"
          ],
          application: "Liste três não-crentes com quem você tem relacionamento. Ore por eles e planeje conexão intencional.",
          summary: "Plantação requer evangelismo ativo através de conhecimento da comunidade, relacionamentos genuínos e acompanhamento pessoal."
        },
        {
          title: "Discipulado Intencional",
          content: `Discipulado é o coração da Grande Comissão. "Fazei discípulos... ensinando-os a guardar todas as coisas" (Mateus 28:19-20). Convertidos sem discipulado permanecem bebês. Igrejas fracas resultam de discipulado fraco.

Discipulado é relacional, não apenas conteúdo. Jesus escolheu doze "para que estivessem com ele" (Marcos 3:14). Informação sem relacionamento é educação; discipulado é formação de vida em vida.

Cada um deve discipular alguém. Não é apenas função pastoral; é chamado de todo cristão. "O que de mim ouviste... transmite a homens fiéis" (2 Timóteo 2:2). Multiplicação acontece quando todos discipulam.

Discipulado visa obediência, não apenas conhecimento. "Ensinando-os a guardar" - não apenas saber, mas fazer. O teste do discipulado é vida transformada, não informação acumulada.`,
          references: "Mateus 28:19-20; Marcos 3:14; 2 Timóteo 2:2; Colossenses 1:28; João 8:31-32",
          questions: [
            "1. Por que discipulado é essencial?",
            "2. Como Jesus discipulou?",
            "3. Quem deve discipular?",
            "4. Qual é o teste do discipulado?",
            "5. Você está discipulando alguém?"
          ],
          application: "Identifique uma pessoa menos madura na fé. Inicie um relacionamento de discipulado intencional.",
          summary: "Discipulado é relacional, responsabilidade de todos, e visa obediência e vida transformada, não apenas conhecimento."
        },
        {
          title: "Desenvolvendo Líderes",
          content: `A saúde futura da igreja depende de liderança local. O plantador não deve ser indispensável. Desde o início, identifique e desenvolva líderes locais que eventualmente conduzirão a igreja.

Identifique pessoas FAT: Fiéis, Disponíveis (Available), Ensináveis (Teachable). Talentos são desenvolvíveis; caráter é mais difícil. Escolha caráter primeiro; habilidades virão.

Treine no contexto, não apenas em sala. Jesus treinou fazendo junto. Delegue responsabilidades gradualmente crescentes. Deixe errar; corrija com graça. Aprendizado prático forma mais que teoria.

Empodere sem microgerenciar. Dê autoridade real, não apenas tarefas. Líderes só crescem quando têm espaço para liderar. O plantador que controla tudo limita o crescimento de todos.`,
          references: "2 Timóteo 2:2; Tito 1:5; Atos 14:23; Efésios 4:11-12; Êxodo 18:21-22",
          questions: [
            "1. Por que desenvolver líderes locais?",
            "2. O que significa FAT?",
            "3. Como treinamento prático funciona?",
            "4. Por que empoderar sem microgerenciar?",
            "5. Você está desenvolvendo alguém para liderança?"
          ],
          application: "Identifique uma pessoa em quem você pode investir para liderança. Comece a encontrar-se regularmente.",
          summary: "Desenvolvimento de líderes locais FAT (fiéis, disponíveis, ensináveis) através de treinamento prático e empoderamento garante saúde futura."
        },
        {
          title: "Sustentabilidade Financeira",
          content: `Igrejas saudáveis caminham para autossustento. Dependência permanente de recursos externos atrofia. O objetivo é que a igreja local sustente seu próprio ministério e contribua para além de si.

Ensine generosidade desde o início. "Deus ama ao que dá com alegria" (2 Coríntios 9:7). Não espere crescimento para ensinar mordomia. A cultura de generosidade é formada nos primeiros dias.

Simplicidade reduz necessidades. Instalações caras, equipamentos sofisticados, salários altos - tudo exige mais recursos. Comece simples. O que realmente precisamos para fazer discípulos? Geralmente, menos do que pensamos.

Bivocacionalidade pode ser estratégica. Paulo fazia tendas (Atos 18:3). Plantadores que trabalham secularmente alcançam pessoas no mercado de trabalho e não pressionam financeiramente a igreja nascente.`,
          references: "2 Coríntios 9:6-11; Atos 20:33-35; 18:3; 1 Tessalonicenses 2:9; Filipenses 4:10-19",
          questions: [
            "1. Por que autossustento é importante?",
            "2. Quando ensinar generosidade?",
            "3. Por que simplicidade ajuda?",
            "4. Quando bivocacionalidade é estratégica?",
            "5. Sua igreja caminha para sustentabilidade?"
          ],
          application: "Avalie: você pratica generosidade? Como pode crescer em mordomia fiel?",
          summary: "Sustentabilidade financeira vem de ensinar generosidade cedo, manter simplicidade e considerar bivocacionalidade estrategicamente."
        },
        {
          title: "Multiplicação",
          content: `Igrejas saudáveis multiplicam outras. A meta não é uma igreja grande, mas muitas igrejas multiplicando. Crescimento por adição é bom; crescimento por multiplicação é melhor.

Pense em multiplicação desde o início. Não espere 'estabilizar' para pensar em plantar. Inclua multiplicação no DNA. Fale sobre isso, planeje para isso, celebre quando acontecer.

Libere pessoas para plantar. Os melhores líderes frequentemente são candidatos a plantadores. Segurá-los limita o reino. Envie seus melhores; Deus honra generosidade.

Movimentos acontecem quando igrejas plantam igrejas que plantam igrejas. Não uma geração apenas, mas múltiplas. O objetivo é movimento autossustentável que continua sem você. Isso é legado.`,
          references: "Atos 9:31; 16:5; Colossenses 1:6; 2 Timóteo 2:2; Mateus 13:31-32",
          questions: [
            "1. Qual é a meta: uma igreja grande ou muitas multiplicando?",
            "2. Quando pensar em multiplicação?",
            "3. Por que liberar os melhores para plantar?",
            "4. O que é um movimento?",
            "5. Sua igreja tem visão de multiplicação?"
          ],
          application: "Ore para que sua igreja seja igreja que planta igrejas. Como você pode contribuir para isso?",
          summary: "Igrejas saudáveis multiplicam outras desde o início, liberando seus melhores e visando movimentos de múltiplas gerações."
        }
      ])
    }
  ]
};

// MÓDULO 10: Formação de Líderes
const MODULO_10_FORMACAO: ModuleData = {
  id: "nivel3-mod10-formacao",
  name: "Formação de Líderes",
  description: "Princípios para desenvolver a próxima geração de líderes",
  icon: "GraduationCap",
  color: "#8B5CF6",
  order: 40,
  tracks: [
    {
      id: "track-n3m10-avancado",
      level: "avancado",
      name: "Desenvolvendo Líderes",
      description: "Multiplicando liderança para o reino",
      requiredPlan: "premium",
      order: 1,
      lessons: createLessons("n3m10", [
        {
          title: "A Importância da Formação",
          content: `A formação de líderes é a tarefa mais importante do líder. "O que de mim ouviste... transmite a homens fiéis" (2 Timóteo 2:2). Paulo investiu em Timóteo, que investiria em fiéis, que investiriam em outros. Quatro gerações em um versículo.

A igreja do futuro depende dos líderes que formamos hoje. Se não desenvolvermos líderes, a obra morre conosco. Investir em pessoas é investir em perpetuidade. Programas são temporários; pessoas transformadas permanecem.

Jesus priorizou formação. Três anos com doze; foco especial em três. Não alcançou as massas diretamente, mas formou líderes que transformariam o mundo. Qualidade sobre quantidade; profundidade sobre amplitude.

A formação de líderes não é apenas transmissão de conteúdo. É formação de caráter, visão, habilidades. É vida em vida. Requer tempo, proximidade, intencionalidade. Não há atalhos.`,
          references: "2 Timóteo 2:2; Marcos 3:14; Mateus 28:19-20; Efésios 4:11-12; Êxodo 18:21",
          questions: [
            "1. Por que formação de líderes é prioritária?",
            "2. Quantas gerações 2 Timóteo 2:2 menciona?",
            "3. Como Jesus priorizou formação?",
            "4. Formação é só transmissão de conteúdo?",
            "5. Você está investindo em formar líderes?"
          ],
          application: "Identifique 2-3 pessoas em quem você pode investir intencionalmente para liderança.",
          summary: "Formação de líderes é tarefa prioritária para perpetuar a obra; Jesus modelou investimento profundo em poucos para multiplicação."
        },
        {
          title: "Identificando Potenciais Líderes",
          content: `Nem todos são chamados para liderança formal, mas todos podem crescer em influência. Identificar quem tem potencial de liderança permite investimento estratégico.

Busque caráter primeiro. As qualificações de 1 Timóteo 3 e Tito 1 enfatizam caráter sobre habilidade. Habilidades são desenvolvíveis; caráter falho é mais difícil de corrigir. Não promova pessoas com talentos mas caráter questionável.

Observe FATO: Fiel (cumpre compromissos), Disponível (tempo e disposição), Ensinável (humilde para aprender), Obediente (aplica o que aprende). Pessoas FATO crescem; pessoas resistentes estagnam.

Veja além das aparências. Deus vê o coração (1 Samuel 16:7). O mais óbvio nem sempre é o melhor. Davi era o menor, negligenciado pela família; Deus o escolheu. Procure jóias brutas, não apenas polidas.`,
          references: "1 Timóteo 3:1-7; Tito 1:5-9; 1 Samuel 16:7; Êxodo 18:21; 2 Timóteo 2:2",
          questions: [
            "1. Todos são chamados para liderança formal?",
            "2. O que buscar primeiro em potenciais líderes?",
            "3. O que significa FATO?",
            "4. Por que ver além das aparências?",
            "5. Quem em sua comunidade tem potencial?"
          ],
          application: "Ore pedindo discernimento para identificar pessoas FATO em quem investir.",
          summary: "Identificar líderes requer olhar para caráter primeiro, observar qualidades FATO, e ver além das aparências para encontrar potencial."
        },
        {
          title: "Mentoria Individual",
          content: `Mentoria é relacionamento intencional onde um mais experiente investe em um menos experiente. Não é amizade casual, nem ensino formal; é meio-termo - relacional e propositivo.

A mentoria bíblica era relacional. Moisés e Josué, Elias e Eliseu, Paulo e Timóteo - não havia apenas transmissão de informação, mas convivência. "Está com ele" precede "envia-os" (Marcos 3:14).

Encontros regulares são essenciais. Consistência importa mais que intensidade. Encontros semanais ou quinzenais de 1-2 horas por período extenso (1-2 anos) formam melhor que retiros intensivos esporádicos.

A agenda inclui: vida pessoal (como está?), crescimento espiritual (o que Deus está ensinando?), ministério (como está indo?), desafios (onde está lutando?), próximos passos (o que vai fazer?). Seja flexível, mas intencional.`,
          references: "2 Timóteo 1:2; 2:1-2; 1 Reis 19:19-21; 2 Reis 2:1-15; Filipenses 2:19-22",
          questions: [
            "1. O que é mentoria?",
            "2. Como mentoria bíblica funcionava?",
            "3. Qual a importância da consistência?",
            "4. O que a agenda de mentoria pode incluir?",
            "5. Você tem mentor? Você mentoreia alguém?"
          ],
          application: "Convide alguém para ser seu mentor ou aceite mentorar alguém. Estabeleça ritmo de encontros.",
          summary: "Mentoria é relacionamento intencional com encontros regulares, combinando vida pessoal, crescimento espiritual e desenvolvimento ministerial."
        },
        {
          title: "Treinamento Prático",
          content: `Liderança se aprende fazendo, não apenas estudando. Jesus treinou enviando: "Enviou-os de dois em dois" (Marcos 6:7). Depois debriefou: "Contaram-lhe tudo" (Marcos 6:30). Prática com feedback forma.

Delegue responsabilidades reais. Não apenas tarefas menores; dê liderança genuína. Liderar grupo pequeno, ensinar classe, coordenar evento - experiências reais em ambiente supervisionado.

Permita falhas seguras. Erros são professores poderosos se processados corretamente. Crie ambiente onde errar não é fatal, mas educativo. O medo de falhar paralisa; permissão para errar libera.

Feedback frequente acelera crescimento. Elogie especificamente o que foi bem. Corrija construtivamente o que pode melhorar. "O que você faria diferente?" ensina a refletir. Não espere avaliações formais; converse regularmente.`,
          references: "Marcos 6:7-13, 30; Lucas 10:1-20; Atos 16:1-3; 2 Timóteo 4:11",
          questions: [
            "1. Onde liderança é realmente aprendida?",
            "2. O que significa delegar responsabilidades reais?",
            "3. Por que permitir falhas?",
            "4. Como dar feedback eficaz?",
            "5. Que experiências práticas você poderia oferecer?"
          ],
          application: "Identifique uma responsabilidade que você pode delegar a alguém em desenvolvimento. Faça-o com acompanhamento.",
          summary: "Treinamento prático envolve delegar responsabilidades reais, permitir falhas seguras e dar feedback frequente para acelerar crescimento."
        },
        {
          title: "Ensinando a Ensinar",
          content: `Líderes cristãos devem ser capazes de ensinar. "Apto para ensinar" é qualificação de presbíteros (1 Timóteo 3:2). Não apenas saber a verdade, mas comunicá-la eficazmente.

Ensine o processo, não apenas o produto. Mostre como você estuda, prepara, aplica. "Observe como eu faço" antes de "faça você mesmo". O aprendiz precisa ver o processo, não apenas o resultado.

Dê oportunidades graduais. Comece com ensino em pequeno grupo, depois avance para contextos maiores. Avalie juntos. Refine progressivamente. A confiança cresce com prática bem-sucedida.

O melhor teste do ensino é se os ensinados podem ensinar outros. "O que de mim ouviste... transmite" (2 Timóteo 2:2). Se seus discípulos não podem reproduzir, seu discipulado não está completo.`,
          references: "2 Timóteo 2:2, 15; 1 Timóteo 3:2; 4:11-16; Tito 2:1; Hebreus 5:12",
          questions: [
            "1. Por que líderes devem saber ensinar?",
            "2. O que significa ensinar o processo?",
            "3. Como dar oportunidades graduais?",
            "4. Qual é o teste final?",
            "5. Seus discípulos podem ensinar outros?"
          ],
          application: "Na próxima vez que ensinar algo, leve um aprendiz para observar e depois debater o processo.",
          summary: "Ensinar líderes a ensinar requer mostrar o processo, dar oportunidades graduais e verificar se podem reproduzir em outros."
        },
        {
          title: "Desenvolvendo Caráter",
          content: `Caráter é mais importante que competência. Habilidade sem integridade é perigosa. As maiores falhas de liderança são morais, não técnicas. Formação de caráter deve ser prioridade.

Caráter é formado em provação. "A tribulação produz perseverança; a perseverança, experiência" (Romanos 5:3-4). Não proteja totalmente de dificuldades; elas formam. Acompanhe em crises, não remova delas.

Modelagem é o método principal. Líderes são formados observando outros líderes. "Sede meus imitadores, como também eu sou de Cristo" (1 Coríntios 11:1). Você ensina mais pelo que é que pelo que diz.

Confronte falhas de caráter diretamente. Ignorar pequenas falhas permite grandes quedas. "Melhor é a repreensão franca" (Provérbios 27:5). Ame o suficiente para falar verdade difícil. Confronte em privado, restaure em graça.`,
          references: "Romanos 5:3-5; 1 Coríntios 11:1; 1 Timóteo 4:12; Tito 2:7-8; Provérbios 27:5-6",
          questions: [
            "1. O que é mais importante: caráter ou competência?",
            "2. Como caráter é formado?",
            "3. Por que modelagem é fundamental?",
            "4. Por que confrontar falhas?",
            "5. Seu caráter é digno de imitação?"
          ],
          application: "Identifique uma área de caráter onde você precisa crescer. Busque accountability para isso.",
          summary: "Caráter supera competência; é formado em provação, através de modelagem, e requer confronto amoroso de falhas."
        },
        {
          title: "Delegação Eficaz",
          content: `Delegação não é apenas distribuir tarefas; é desenvolver pessoas através de responsabilidades. Moisés aprendeu com Jetro: "Não é bom o que fazes... escolherás homens capazes" (Êxodo 18:17, 21).

Delegue resultados, não apenas atividades. Diga o que precisa ser alcançado; deixe o como para o líder em desenvolvimento. Autonomia promove crescimento; microgerenciamento atrofia.

Acompanhe sem sufocar. Estabeleça checkpoints, não vigilância constante. "Como está indo?" demonstra interesse sem controle excessivo. Esteja disponível para consulta sem impor presença.

Celebre sucessos publicamente; corrija privadamente. Reconhecimento motiva; exposição humilha. Quando acertam, diga a todos. Quando erram, converse em particular. Isso constrói confiança e lealdade.`,
          references: "Êxodo 18:13-26; Números 11:16-17; Atos 6:1-7; 2 Timóteo 2:2",
          questions: [
            "1. O que Moisés aprendeu com Jetro?",
            "2. Qual a diferença entre delegar resultados e atividades?",
            "3. Como acompanhar sem sufocar?",
            "4. Por que celebrar publicamente e corrigir privadamente?",
            "5. Você delega bem? O que pode melhorar?"
          ],
          application: "Identifique algo que você faz que deveria delegar. Transfira a responsabilidade esta semana.",
          summary: "Delegação eficaz transfere resultados com autonomia, acompanha sem sufocar, e celebra publicamente enquanto corrige privadamente."
        },
        {
          title: "Criando Cultura de Desenvolvimento",
          content: `Formação de líderes não é programa, mas cultura. Programas vêm e vão; cultura persiste. Quando desenvolvimento é 'como fazemos as coisas aqui', acontece organicamente.

Expectativa universal muda tudo. Quando todos sabem que serão desenvolvidos e que devem desenvolver outros, o sistema se auto-alimenta. Não é função de um departamento; é responsabilidade de todos.

Estruturas apoiam cultura. Encontros de mentoria no calendário. Avaliações regulares de desenvolvimento. Orçamento para treinamento. Celebração pública de quem desenvolve outros. O que você estrutura, você prioriza.

Líderes seniores devem modelar. Se os principais líderes não investem em outros, ninguém investirá. Priorize tempo para desenvolvimento, mesmo quando ocupado. O que você faz fala mais alto que o que você diz.`,
          references: "2 Timóteo 2:2; Efésios 4:11-16; Tito 2:1-8; Hebreus 5:12; Deuteronômio 6:6-7",
          questions: [
            "1. Qual a diferença entre programa e cultura?",
            "2. Por que expectativa universal importa?",
            "3. Como estruturas apoiam cultura?",
            "4. Por que líderes seniores devem modelar?",
            "5. Sua organização tem cultura de desenvolvimento?"
          ],
          application: "Avalie: há cultura de desenvolvimento onde você está? O que você pode fazer para promovê-la?",
          summary: "Cultura de desenvolvimento onde todos desenvolvem outros é sustentada por expectativa universal, estruturas intencionais e modelagem de líderes."
        },
        {
          title: "Lidando com Falhas",
          content: `Líderes em desenvolvimento falharão. A questão não é se, mas quando e como responder. Falhas tratadas bem formam; tratadas mal destroem.

Distinga entre falha e rebelião. Falha vem de inexperiência ou erro de julgamento; rebelião é desobediência deliberada. A primeira requer paciência e coaching; a segunda, confronto e possivelmente remoção.

Use falhas como momentos de ensino. Pergunte: o que aconteceu? O que você aprendeu? O que fará diferente? Processe juntos sem atacar a pessoa. Separar comportamento de identidade protege dignidade.

Restaure rapidamente. Não estenda vergonha. Quando a lição é aprendida, siga em frente. "Nem eu te condeno; vai-te, e não peques mais" (João 8:11). Graça restauradora liberta para tentar novamente.`,
          references: "João 8:11; 21:15-19; Gálatas 6:1; 2 Timóteo 4:11; Lucas 22:31-32",
          questions: [
            "1. Líderes em desenvolvimento falharão?",
            "2. Qual a diferença entre falha e rebelião?",
            "3. Como usar falhas como ensino?",
            "4. Por que restaurar rapidamente?",
            "5. Como você responde a falhas de outros?"
          ],
          application: "Se alguém em quem você investe falhou recentemente, inicie conversa restauradora hoje.",
          summary: "Falhas são inevitáveis e devem ser distinguidas de rebelião, usadas como ensino, e seguidas de restauração rápida e graciosa."
        },
        {
          title: "Liberando para o Próximo Nível",
          content: `O objetivo final é que os desenvolvidos superem o desenvolvedor. "Quem crer em mim fará as obras que eu faço; e fará maiores" (João 14:12). Bons líderes celebram quando discípulos vão além.

Saiba quando soltar. Segurar por insegurança limita o reino. Quando estão prontos (ou quase), libere-os para liderar independentemente, plantar igrejas, assumir novas funções. Generosidade com pessoas multiplica.

A transição requer intencionalidade. Anuncie publicamente a nova função. Afirme autoridade perante outros. Retire-se gradualmente de áreas transferidas. Esteja disponível para consulta sem reassumir controle.

Sucessão saudável é sinal de liderança madura. Quem não desenvolveu sucessores falhou em uma das tarefas principais. Pergunte-se: se eu saísse hoje, quem poderia continuar? Se não há resposta, trabalhe nisso.`,
          references: "João 14:12; Atos 9:27; 15:39-40; 2 Timóteo 4:11; 1 Reis 19:16, 19-21",
          questions: [
            "1. Qual é o objetivo final do desenvolvimento?",
            "2. Por que alguns líderes não soltam?",
            "3. Como fazer transição saudável?",
            "4. O que sucessão saudável indica?",
            "5. Quem poderia continuar se você saísse?"
          ],
          application: "Identifique alguém que você está desenvolvendo. Planeje intencionalmente os próximos passos para liberá-lo.",
          summary: "O objetivo é que discípulos superem mentores; isso requer saber quando soltar, transição intencional e planejamento de sucessão."
        }
      ])
    }
  ]
};

export const NIVEL_3_MODULOS_6_10: ModuleData[] = [
  MODULO_6_HOMILETICA,
  MODULO_7_ACONSELHAMENTO,
  MODULO_8_MISSIOLOGIA,
  MODULO_9_PLANTACAO,
  MODULO_10_FORMACAO
];
