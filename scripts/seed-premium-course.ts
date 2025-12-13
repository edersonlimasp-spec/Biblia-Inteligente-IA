import { db } from "../server/db";
import { studyModules, studyTracks, studyLessons } from "../shared/schema";
import { eq } from "drizzle-orm";

import { ModuleData } from "./course-data/types";
import { NIVEL_1_MODULOS_4_8 } from "./course-data/nivel1-modulos4-8";
import { NIVEL_1_MODULOS_9_15 } from "./course-data/nivel1-modulos9-15";
import { NIVEL_1_MODULOS_13_15 } from "./course-data/nivel1-modulos13-15";
import { NIVEL_2_MODULOS_1_5 } from "./course-data/nivel2-modulos1-5";
import { NIVEL_2_MODULOS_6_10 } from "./course-data/nivel2-modulos6-10";
import { NIVEL_2_MODULOS_11_15 } from "./course-data/nivel2-modulos11-15";
import { NIVEL_3_MODULOS_1_5 } from "./course-data/nivel3-modulos1-5";
import { NIVEL_3_MODULOS_6_10 } from "./course-data/nivel3-modulos6-10";
import { NIVEL_3_MODULOS_11_15 } from "./course-data/nivel3-modulos11-15";

// ============================================================================
// PROFESSOR TEOLÓGICO PREMIUM – FORMAÇÃO BÍBLICA AVANÇADA
// ============================================================================
// Curso completo com 3 níveis, 45 módulos e 450+ lições
// Base doutrinária: Cristocêntrica, Autoridade das Escrituras, Espírito Santo
// ============================================================================

// ============================================================================
// NÍVEL 1 - FORMAÇÃO BÍBLICA FUNDAMENTAL (INICIANTE)
// 15 Módulos com 10+ lições cada
// ============================================================================

const NIVEL_1_INICIANTE: ModuleData[] = [
  // MÓDULO 1.1 - REVELAÇÃO E INSPIRAÇÃO DAS ESCRITURAS
  {
    id: "n1-revelacao-escrituras",
    name: "Revelação e Inspiração das Escrituras",
    description: "Compreenda como Deus se revelou à humanidade através de Sua Palavra inspirada, a Bíblia Sagrada.",
    icon: "book-open",
    color: "#4A90D9",
    order: 1,
    tracks: [
      {
        id: "n1-rev-track",
        level: "iniciante",
        name: "Fundamentos da Revelação",
        description: "A Palavra de Deus como revelação viva",
        requiredPlan: "gold",
        order: 1,
        lessons: [
          {
            id: "n1-rev-1",
            title: "O Que é Revelação Divina?",
            content: `A revelação divina é o ato gracioso de Deus pelo qual Ele se dá a conhecer aos seres humanos. Deus, sendo infinito e transcendente, não poderia ser conhecido pela mente humana finita se não fosse Sua iniciativa de se revelar. A Bíblia nos ensina que Deus se revela de duas formas principais: a revelação geral (através da criação e da consciência) e a revelação especial (através das Escrituras e, supremamente, em Jesus Cristo).

A revelação geral está presente nos céus que declaram a glória de Deus (Salmo 19:1) e na lei moral escrita no coração dos homens (Romanos 2:14-15). Porém, esta revelação, embora suficiente para deixar o homem indesculpável diante de Deus, não é suficiente para a salvação.

A revelação especial é aquela pela qual Deus comunicou verdades específicas sobre Si mesmo, Seus propósitos e Seu plano de redenção. Esta revelação culminou na Pessoa de Jesus Cristo, a Palavra que se fez carne (João 1:14), e está registrada de forma infalível nas Escrituras Sagradas.

Compreender a revelação divina é fundamental para nossa fé, pois nos assegura que conhecemos a Deus não por especulação humana, mas porque Ele mesmo quis se fazer conhecido a nós por amor.`,
            references: "Salmo 19:1-4, Romanos 1:19-20, Romanos 2:14-15, João 1:14, Hebreus 1:1-2",
            questions: "Por que Deus precisou tomar a iniciativa de se revelar?\nQual a diferença entre revelação geral e especial?\nComo Jesus Cristo é a revelação máxima de Deus?\nDe que forma a revelação de Deus afeta sua vida diária?\nPor que a revelação geral não é suficiente para a salvação?",
            application: "Nesta semana, ao observar a natureza, agradeça a Deus por se revelar na criação. Depois, dedique tempo à leitura das Escrituras reconhecendo que ali está a revelação especial de Deus para você.",
            summary: "Revelação divina é o ato gracioso pelo qual Deus se faz conhecer, culminando em Jesus Cristo e registrada nas Escrituras.",
            estimatedMinutes: 20,
            order: 1
          },
          {
            id: "n1-rev-2",
            title: "A Inspiração da Bíblia",
            content: `A doutrina da inspiração das Escrituras ensina que a Bíblia foi escrita por homens, mas sob a supervisão e direção do Espírito Santo, de modo que o resultado final é verdadeiramente a Palavra de Deus. O texto de 2 Timóteo 3:16 declara: "Toda a Escritura é inspirada por Deus" (em grego, theopneustos, literalmente "soprada por Deus").

Esta inspiração não significa um ditado mecânico, onde os escritores seriam meras máquinas. Deus utilizou as personalidades, estilos, vocabulários e contextos históricos de cada autor humano. Porém, o Espírito Santo os guiou de tal forma que escreveram exatamente o que Deus queria comunicar, sem erro.

Pedro explica em 2 Pedro 1:21 que "homens santos de Deus falaram inspirados pelo Espírito Santo". A iniciativa é de Deus, que "moveu" (ou "carregou") os escritores, garantindo que Sua mensagem fosse fielmente transmitida.

A inspiração se estende a toda a Escritura canônica (os 66 livros da Bíblia), em seus manuscritos originais (autógrafos). Isso significa que podemos confiar plenamente na Bíblia como autoridade máxima para fé e prática.

Essa doutrina é essencial porque, se a Bíblia não fosse inspirada, seria apenas um livro humano, sujeito a erros. Mas sendo inspirada por Deus, ela é viva e eficaz, capaz de transformar vidas.`,
            references: "2 Timóteo 3:16-17, 2 Pedro 1:20-21, 1 Tessalonicenses 2:13, Jeremias 1:9, 1 Coríntios 2:13",
            questions: "O que significa dizer que a Bíblia é 'soprada por Deus'?\nComo a inspiração preservou as personalidades dos escritores humanos?\nPor que é importante crer na inspiração de toda a Escritura?\nComo essa doutrina afeta a forma como você lê a Bíblia?\nQual a diferença entre inspiração e ditado mecânico?",
            application: "Ao ler a Bíblia hoje, lembre-se que cada palavra foi cuidadosamente supervisionada pelo Espírito Santo. Ore pedindo iluminação para compreender o que o Autor divino quis comunicar.",
            summary: "A inspiração bíblica significa que Deus supervisionou os escritores humanos pelo Espírito Santo, resultando em Sua Palavra infalível.",
            estimatedMinutes: 25,
            order: 2
          },
          {
            id: "n1-rev-3",
            title: "A Inerrância das Escrituras",
            content: `A inerrância das Escrituras é a doutrina que afirma que a Bíblia, sendo inspirada por Deus, está isenta de erros em tudo o que afirma. Como Deus é verdade (João 14:6) e não pode mentir (Tito 1:2), Sua Palavra escrita reflete Seu caráter de perfeita veracidade.

É importante entender que a inerrância se refere às afirmações originais da Escritura, não a erros de cópia ou tradução que possam ter ocorrido ao longo dos séculos. Também devemos interpretar a Bíblia segundo seu gênero literário: quando usa linguagem fenomenológica ("o sol nasceu"), figuras de linguagem, ou números arredondados, isso não constitui erro, pois são formas legítimas de comunicação.

Jesus tinha a mais alta visão das Escrituras. Ele disse: "a Escritura não pode ser anulada" (João 10:35) e "até que o céu e a terra passem, nem um jota ou til jamais passará da Lei" (Mateus 5:18). Se nosso Senhor confiava plenamente na Palavra de Deus, devemos fazer o mesmo.

A inerrância não é apenas uma doutrina acadêmica, mas tem implicações práticas profundas. Significa que podemos confiar nas promessas de Deus, que Suas instruções são confiáveis, e que a mensagem do Evangelho é verdadeira.

Questionar a inerrância abre portas para que cada pessoa decida o que é ou não verdade na Bíblia, tornando-a refém da opinião humana. Mas afirmando a inerrância, mantemos a Bíblia como nossa autoridade final.`,
            references: "João 10:35, Mateus 5:18, Tito 1:2, João 17:17, Provérbios 30:5-6, Salmo 12:6",
            questions: "O que significa dizer que a Bíblia é inerrante?\nComo Jesus via as Escrituras do Antigo Testamento?\nPor que a inerrância é importante para a fé cristã?\nComo devemos tratar dificuldades ou aparentes contradições na Bíblia?\nQual é a relação entre inerrância e a confiança nas promessas de Deus?",
            application: "Identifique uma passagem bíblica que você acha difícil de entender. Em vez de duvidar, pesquise com humildade e ore pedindo que Deus lhe dê compreensão, confiando que Sua Palavra é verdadeira.",
            summary: "A inerrância significa que a Bíblia é totalmente verdadeira em tudo que afirma, refletindo o caráter de Deus que é a verdade.",
            estimatedMinutes: 25,
            order: 3
          },
          {
            id: "n1-rev-4",
            title: "A Autoridade das Escrituras",
            content: `A autoridade da Bíblia decorre diretamente de sua natureza como Palavra de Deus. Se a Bíblia é verdadeiramente a Palavra do Deus Todo-Poderoso, então ela possui autoridade absoluta sobre todas as áreas da vida, fé e prática.

A autoridade das Escrituras significa que ela é a norma final para determinar o que devemos crer e como devemos viver. Tradições, experiências pessoais, opiniões de líderes e descobertas científicas devem ser avaliadas à luz da Bíblia, não o contrário.

Esta doutrina foi central na Reforma Protestante, resumida no princípio "Sola Scriptura" (Somente a Escritura). Os reformadores não negavam a importância da tradição ou da razão, mas afirmavam que apenas a Bíblia é a autoridade última e infalível.

Jesus exemplificou a submissão à autoridade das Escrituras quando, tentado pelo diabo, respondeu três vezes: "Está escrito" (Mateus 4:4,7,10). Ele também corrigiu os fariseus dizendo: "Errais, não conhecendo as Escrituras" (Mateus 22:29).

Na prática, reconhecer a autoridade da Bíblia significa lê-la com disposição de obedecer, mesmo quando seus ensinamentos confrontam nossos desejos ou a cultura ao redor. Significa também que a igreja deve fundamentar todas as suas doutrinas e práticas na Palavra de Deus.`,
            references: "2 Timóteo 3:16-17, Isaías 8:20, Mateus 4:4,7,10, Mateus 22:29, Atos 17:11, Salmo 119:89",
            questions: "O que significa a autoridade das Escrituras na prática?\nComo a Bíblia deve se relacionar com tradições, experiências e ciência?\nO que significa 'Sola Scriptura'?\nComo Jesus demonstrou submissão à autoridade das Escrituras?\nEm que área da sua vida você precisa submeter-se mais à autoridade da Bíblia?",
            application: "Escolha um mandamento bíblico que você tem negligenciado e comprometa-se a obedecê-lo nesta semana, reconhecendo a autoridade de Deus sobre sua vida.",
            summary: "A autoridade da Bíblia significa que ela é a norma final e infalível para fé e prática, à qual devemos submeter todas as outras fontes.",
            estimatedMinutes: 20,
            order: 4
          },
          {
            id: "n1-rev-5",
            title: "A Suficiência das Escrituras",
            content: `A suficiência das Escrituras é a doutrina que afirma que a Bíblia contém tudo o que precisamos saber para a salvação e para viver uma vida piedosa que agrada a Deus. Ela é completa para cumprir seu propósito.

O apóstolo Paulo escreveu a Timóteo: "as sagradas letras... podem fazer-te sábio para a salvação, pela fé que há em Cristo Jesus" (2 Timóteo 3:15). E continua: a Escritura é "útil para o ensino, para a repreensão, para a correção, para a educação na justiça, a fim de que o homem de Deus seja perfeito e perfeitamente habilitado para toda boa obra" (3:16-17).

Isso não significa que a Bíblia responde todas as perguntas possíveis (ela não é um manual de física ou medicina), mas que ela é suficiente para aquilo a que se propõe: revelar Deus, mostrar o caminho da salvação em Cristo, e guiar-nos na vida piedosa.

A suficiência das Escrituras nos protege de dois erros: o legalismo (adicionar regras humanas como necessárias para salvação) e o misticismo (buscar revelações especiais além da Bíblia). Apocalipse 22:18-19 adverte contra adicionar ou tirar da Palavra de Deus.

Esta doutrina traz grande conforto: não precisamos buscar em outro lugar as verdades essenciais para nossa fé. Tudo o que é necessário para conhecer a Deus, ser salvo e viver para Sua glória está disponível nas Escrituras.`,
            references: "2 Timóteo 3:15-17, 2 Pedro 1:3, Deuteronômio 29:29, Apocalipse 22:18-19, Salmo 19:7-11",
            questions: "O que significa dizer que a Bíblia é suficiente?\nPara que a Bíblia é suficiente?\nComo essa doutrina nos protege do legalismo?\nComo essa doutrina nos protege do misticismo?\nEm que sentido a Bíblia não pretende ser um manual para tudo?",
            application: "Quando surgir uma questão sobre como viver de forma piedosa, busque primeiro a resposta na Bíblia antes de procurar em outras fontes. Confie que Deus proveu tudo o que você precisa em Sua Palavra.",
            summary: "A suficiência das Escrituras significa que a Bíblia contém tudo necessário para conhecer a salvação e viver piedosamente.",
            estimatedMinutes: 20,
            order: 5
          },
          {
            id: "n1-rev-6",
            title: "A Clareza das Escrituras",
            content: `A clareza (ou perspicuidade) das Escrituras é a doutrina que afirma que as verdades centrais da Bíblia, necessárias para a salvação e vida cristã, podem ser compreendidas por qualquer pessoa que a leia com sinceridade e com a ajuda do Espírito Santo.

Isso não significa que tudo na Bíblia seja fácil de entender. O próprio Pedro reconheceu que nas cartas de Paulo "há pontos difíceis de entender" (2 Pedro 3:16). Mas as verdades essenciais – quem é Deus, o problema do pecado, a salvação em Cristo, como viver de modo a agradá-Lo – estão claramente apresentadas.

O Salmo 119:105 declara: "Lâmpada para os meus pés é a tua palavra e luz para o meu caminho." A Palavra de Deus ilumina, não confunde. O Salmo 19:7 diz que "o testemunho do Senhor é fiel e dá sabedoria aos símplices".

A clareza das Escrituras fundamenta o direito e o dever de todos os cristãos de lerem a Bíblia por si mesmos. Durante a Idade Média, a Igreja Católica Romana desencorajava a leitura individual, alegando que apenas o clero poderia interpretá-la. Os reformadores, especialmente Lutero, insistiram que as Escrituras são claras o suficiente para o crente comum.

Isso não elimina a necessidade de estudo diligente, bons mestres, e dependência do Espírito Santo. Mas garante que a mensagem principal da Bíblia não está escondida dos simples que a buscam com coração sincero.`,
            references: "Salmo 119:105, Salmo 19:7, Deuteronômio 30:11-14, 2 Pedro 3:16, Mateus 11:25",
            questions: "O que significa a clareza das Escrituras?\nPor que ainda existem passagens difíceis na Bíblia?\nComo essa doutrina fundamenta a leitura pessoal da Bíblia?\nQual é o papel do Espírito Santo na compreensão das Escrituras?\nComo equilibrar clareza com a necessidade de estudo e bons mestres?",
            application: "Leia um capítulo de João ou Romanos esta semana, pedindo que o Espírito Santo ilumine seu entendimento. Observe como as verdades centrais do Evangelho são claramente apresentadas.",
            summary: "A clareza das Escrituras significa que suas verdades essenciais podem ser compreendidas por qualquer pessoa sincera com a ajuda do Espírito.",
            estimatedMinutes: 20,
            order: 6
          },
          {
            id: "n1-rev-7",
            title: "O Cânon Bíblico",
            content: `O cânon bíblico refere-se à lista oficial dos 66 livros que compõem a Bíblia (39 no Antigo Testamento e 27 no Novo Testamento). A palavra "cânon" vem do grego e significa "régua" ou "padrão de medida".

É importante entender que a Igreja não criou o cânon; ela reconheceu os livros que já possuíam autoridade divina. Os critérios usados incluíam: autoria apostólica ou profética, conformidade com a doutrina já aceita, uso e reconhecimento amplo pelas igrejas, e evidências de inspiração divina.

O cânon do Antigo Testamento já estava essencialmente definido no tempo de Jesus. Ele se referiu às Escrituras judaicas como divididas em "Lei, Profetas e Salmos" (Lucas 24:44), abrangendo todos os livros que hoje reconhecemos.

O cânon do Novo Testamento foi gradualmente reconhecido nos primeiros séculos da Igreja. Os escritos dos apóstolos eram lidos nas igrejas desde o início (Colossenses 4:16). Concílios como o de Cartago (397 d.C.) formalizaram o que já era amplamente aceito.

Os livros apócrifos (ou deuterocanônicos), aceitos pela Igreja Católica Romana, não fazem parte do cânon protestante porque não eram reconhecidos pelos judeus, não foram citados por Jesus ou os apóstolos, e contêm ensinos que conflitam com os livros canônicos.

Confiar no cânon é confiar que Deus, em Sua providência, preservou Sua Palavra e guiou a Igreja a reconhecer os livros inspirados.`,
            references: "Lucas 24:44, 2 Pedro 3:15-16, Colossenses 4:16, Judas 3, Apocalipse 22:18-19",
            questions: "O que é o cânon bíblico?\nA Igreja criou ou reconheceu o cânon?\nQuais critérios foram usados para reconhecer os livros canônicos?\nPor que os livros apócrifos não são aceitos no cânon protestante?\nComo podemos confiar que temos os livros certos na Bíblia?",
            application: "Pesquise brevemente sobre a história de como a Bíblia chegou até você. Agradeça a Deus por Sua providência em preservar Sua Palavra através dos séculos.",
            summary: "O cânon bíblico é a lista dos 66 livros reconhecidos como inspirados por Deus, preservados pela Sua providência.",
            estimatedMinutes: 25,
            order: 7
          },
          {
            id: "n1-rev-8",
            title: "A Preservação das Escrituras",
            content: `A preservação das Escrituras é a doutrina que afirma que Deus, em Sua providência, cuidou para que Sua Palavra fosse transmitida de forma confiável através das gerações. Embora os manuscritos originais não existam mais, Deus preservou Sua mensagem nos milhares de cópias que sobreviveram.

Jesus prometeu: "O céu e a terra passarão, mas as minhas palavras não hão de passar" (Mateus 24:35). Esta promessa garante que a Palavra de Deus permanece disponível e confiável para Seu povo em todas as épocas.

A transmissão das Escrituras envolveu um processo cuidadoso de cópia. Os escribas judeus tinham regras rigorosas para copiar o Antigo Testamento. Os cristãos primitivos também demonstraram grande cuidado com os escritos apostólicos.

A descoberta dos Manuscritos do Mar Morto em 1947 foi uma confirmação extraordinária da preservação do Antigo Testamento. Textos copiados mais de 1000 anos antes dos manuscritos que tínhamos mostraram que o texto foi transmitido com notável fidelidade.

Hoje, a ciência da crítica textual compara os milhares de manuscritos existentes para estabelecer o texto original. As variantes textuais que existem são em sua maioria mínimas e nenhuma doutrina essencial do cristianismo é afetada por elas.

Podemos ter plena confiança de que a Bíblia que lemos hoje transmite fielmente a mensagem que Deus inspirou originalmente.`,
            references: "Mateus 24:35, Isaías 40:8, 1 Pedro 1:24-25, Salmo 119:89, Mateus 5:18",
            questions: "O que significa a preservação das Escrituras?\nComo os escribas demonstraram cuidado na cópia do texto bíblico?\nQual foi a importância dos Manuscritos do Mar Morto?\nO que são variantes textuais e elas afetam nossa confiança na Bíblia?\nComo a promessa de Jesus em Mateus 24:35 nos dá confiança?",
            application: "Dê graças a Deus porque você pode ler Sua Palavra preservada fielmente. Valorize sua Bíblia como um tesouro que Deus providencialmente guardou para você.",
            summary: "Deus preservou providencialmente Sua Palavra através dos séculos, garantindo que podemos confiar na Bíblia que lemos hoje.",
            estimatedMinutes: 20,
            order: 8
          },
          {
            id: "n1-rev-9",
            title: "O Espírito Santo e as Escrituras",
            content: `A relação entre o Espírito Santo e as Escrituras é íntima e essencial. O mesmo Espírito que inspirou os escritores bíblicos é Aquele que ilumina nossa mente para compreender e aplicar a Palavra de Deus.

Na inspiração, o Espírito Santo "moveu" os autores humanos (2 Pedro 1:21) a escreverem exatamente o que Deus queria comunicar. Na iluminação, o Espírito abre nosso entendimento para compreender o que foi escrito.

Paulo ensina que "o homem natural não compreende as coisas do Espírito de Deus" (1 Coríntios 2:14). Sem a obra iluminadora do Espírito, podemos ler as palavras da Bíblia mas não captar seu significado espiritual. Por isso Jesus prometeu que o Espírito "vos guiará a toda a verdade" (João 16:13).

O Espírito nunca opera independentemente da Palavra, nem a Palavra opera independentemente do Espírito. Eles trabalham juntos. Buscar o Espírito sem a Palavra leva ao misticismo; estudar a Palavra sem o Espírito leva ao intelectualismo morto.

Na prática, isso significa que devemos orar pedindo iluminação sempre que abrimos a Bíblia. Devemos depender do Espírito para aplicar a verdade em nosso coração e nos dar força para obedecê-la. E devemos estar sensíveis à Sua voz enquanto lemos.

O Espírito Santo não revela novas verdades além da Escritura, mas torna vivas e pessoais as verdades já reveladas na Palavra de Deus.`,
            references: "2 Pedro 1:21, 1 Coríntios 2:12-14, João 16:13, João 14:26, Efésios 1:17-18, Salmo 119:18",
            questions: "Qual é a diferença entre inspiração e iluminação?\nPor que precisamos do Espírito Santo para entender a Bíblia?\nComo Palavra e Espírito trabalham juntos?\nQue perigos existem quando separamos Espírito e Palavra?\nComo você pode depender mais do Espírito ao ler a Bíblia?",
            application: "Antes de cada leitura bíblica nesta semana, ore especificamente pedindo que o Espírito Santo ilumine seu entendimento e aplique a Palavra em seu coração.",
            summary: "O Espírito Santo inspirou as Escrituras e ilumina nossa mente para compreendê-las, trabalhando sempre em conjunto com a Palavra.",
            estimatedMinutes: 25,
            order: 9
          },
          {
            id: "n1-rev-10",
            title: "A Palavra Viva e Eficaz",
            content: `A Bíblia não é apenas um livro antigo com informações sobre Deus; ela é "viva e eficaz" (Hebreus 4:12). Isso significa que a Palavra de Deus tem poder sobrenatural para transformar vidas.

Hebreus 4:12 continua: "mais cortante do que qualquer espada de dois gumes, e penetra até ao ponto de dividir alma e espírito, juntas e medulas, e é apta para discernir os pensamentos e propósitos do coração." A Palavra de Deus nos conhece profundamente e trabalha em nosso interior.

A eficácia da Palavra é garantida pelo próprio Deus: "Assim será a palavra que sair da minha boca; ela não voltará para mim vazia, mas fará o que me apraz, e prosperará naquilo para que a enviei" (Isaías 55:11). A Palavra sempre cumpre seu propósito divino.

Ao longo da história bíblica e da Igreja, vemos o poder transformador da Palavra: pecadores convertidos, viciados libertados, casamentos restaurados, nações transformadas. O Evangelho é "poder de Deus para salvação" (Romanos 1:16).

Isso tem implicações práticas profundas: devemos nos aproximar da Bíblia com expectativa, sabendo que o Espírito Santo a usará para nos santificar. Devemos pregá-la com confiança, sabendo que ela não volta vazia. E devemos memorizá-la para que esteja sempre disponível em nosso coração.

A Palavra de Deus é nossa alimentação espiritual diária, nossa arma contra o pecado e contra o diabo, nosso conforto na tribulação, e nossa luz nas decisões.`,
            references: "Hebreus 4:12, Isaías 55:10-11, Romanos 1:16, 1 Pedro 1:23, Salmo 119:11, Jeremias 23:29",
            questions: "O que significa dizer que a Palavra é 'viva e eficaz'?\nComo a Palavra de Deus discerne os pensamentos do coração?\nQue garantia Isaías 55:11 nos dá sobre a eficácia da Palavra?\nVocê já experimentou o poder transformador da Palavra em sua vida?\nComo você pode permitir que a Palavra opere mais plenamente em você?",
            application: "Escolha um versículo para memorizar esta semana. Medite nele diariamente e observe como o Espírito Santo o usa para falar ao seu coração.",
            summary: "A Bíblia é viva e eficaz, com poder sobrenatural para transformar vidas e cumprir os propósitos de Deus.",
            estimatedMinutes: 25,
            order: 10
          }
        ]
      }
    ]
  },

  // MÓDULO 1.2 - PANORAMA DO ANTIGO TESTAMENTO
  {
    id: "n1-panorama-at",
    name: "Panorama do Antigo Testamento",
    description: "Uma visão geral dos 39 livros do Antigo Testamento, sua história, estrutura e mensagem central apontando para Cristo.",
    icon: "scroll",
    color: "#8B4513",
    order: 2,
    tracks: [
      {
        id: "n1-at-track",
        level: "iniciante",
        name: "Conhecendo o Antigo Testamento",
        description: "A história da redenção antes de Cristo",
        requiredPlan: "gold",
        order: 1,
        lessons: [
          {
            id: "n1-at-1",
            title: "Introdução ao Antigo Testamento",
            content: `O Antigo Testamento é a primeira parte da Bíblia, composta por 39 livros escritos ao longo de aproximadamente 1.000 anos (de Moisés até Malaquias). Ele registra a história da criação, da queda, da promessa de redenção, e da preparação do povo de Deus para a vinda do Messias.

O Antigo Testamento é a Bíblia que Jesus conheceu e citou. Ele se referia a ela como "a Lei e os Profetas" (Mateus 7:12) ou "Lei, Profetas e Salmos" (Lucas 24:44). Para Jesus, estas Escrituras eram a Palavra autoritativa de Deus.

Os 39 livros podem ser organizados de diferentes formas. A divisão hebraica tradicional é: Torá (Lei), Neviim (Profetas) e Ketuvim (Escritos). A organização cristã comum é: Pentateuco (5 livros), Históricos (12), Poéticos (5), Profetas Maiores (5) e Profetas Menores (12).

O tema central do Antigo Testamento é a promessa de redenção que se cumpriria em Cristo. Desde Gênesis 3:15, a primeira promessa messiânica, até as profecias de Malaquias, todo o AT aponta para Aquele que viria. Jesus disse: "Examinais as Escrituras... e são elas mesmas que testificam de mim" (João 5:39).

O Antigo Testamento não é obsoleto para o cristão. Ele revela o caráter de Deus, estabelece os fundamentos das doutrinas do Novo Testamento, fornece exemplos de fé e advertências contra o pecado, e nos prepara para entender plenamente a obra de Cristo.`,
            references: "Lucas 24:44, João 5:39, Mateus 5:17, Romanos 15:4, 2 Timóteo 3:16",
            questions: "Por que o Antigo Testamento é importante para os cristãos?\nComo Jesus via as Escrituras do Antigo Testamento?\nQuais são as principais divisões dos livros do AT?\nComo o AT aponta para Cristo?\nQue benefícios tiramos do estudo do Antigo Testamento?",
            application: "Faça um plano para ler um livro do Antigo Testamento que você nunca leu. Observe como ele se conecta com a mensagem de Cristo.",
            summary: "O Antigo Testamento com seus 39 livros é a Escritura que Jesus conheceu, revelando o caráter de Deus e apontando para Cristo.",
            estimatedMinutes: 20,
            order: 1
          },
          {
            id: "n1-at-2",
            title: "O Pentateuco: Os Cinco Livros de Moisés",
            content: `O Pentateuco (do grego "cinco livros") ou Torá (do hebraico "lei" ou "instrução") é composto por Gênesis, Êxodo, Levítico, Números e Deuteronômio. Estes livros, escritos por Moisés, são o fundamento de toda a revelação bíblica.

Gênesis ("origens") narra a criação, a queda, o dilúvio, e a história dos patriarcas: Abraão, Isaque, Jacó e José. Ele estabelece os temas fundamentais da Bíblia: a criação boa de Deus, a entrada do pecado, a promessa de redenção, e a escolha de uma família através da qual a bênção viria a todas as nações.

Êxodo ("saída") narra a libertação de Israel do Egito, a entrega da Lei no Sinai, e a construção do Tabernáculo. A Páscoa e o êxodo se tornam a grande tipologia da salvação em Cristo.

Levítico apresenta as leis de santidade, sacrifícios e sacerdócio. Embora pareça distante para nós hoje, ele revela a santidade de Deus e a necessidade de expiação – verdades cumpridas em Cristo, nosso grande Sumo Sacerdote.

Números registra os 40 anos de peregrinação no deserto, as murmurações do povo, e a fidelidade de Deus. É uma advertência contra a incredulidade.

Deuteronômio ("segunda lei") é o discurso final de Moisés, relembrando a lei e exortando o povo à obediência antes de entrar na Terra Prometida.`,
            references: "Gênesis 1:1, Êxodo 20:1-17, Levítico 11:45, Números 14:1-4, Deuteronômio 6:4-9",
            questions: "Por que o Pentateuco é fundamental para a Bíblia?\nQual é o tema central de cada um dos cinco livros?\nComo Gênesis estabelece os temas desenvolvidos no resto da Bíblia?\nO que podemos aprender de Levítico sobre Deus e a salvação?\nComo a história do êxodo é tipologia da salvação em Cristo?",
            application: "Leia Gênesis 1-3 esta semana, observando os temas de criação, queda e promessa de redenção.",
            summary: "O Pentateuco contém os cinco livros de Moisés que formam o fundamento de toda a revelação bíblica.",
            estimatedMinutes: 25,
            order: 2
          },
          {
            id: "n1-at-3",
            title: "Os Livros Históricos",
            content: `Os Livros Históricos (Josué, Juízes, Rute, 1-2 Samuel, 1-2 Reis, 1-2 Crônicas, Esdras, Neemias e Ester) narram a história de Israel desde a entrada na Terra Prometida até o retorno do exílio babilônico – cerca de 1.000 anos.

Josué registra a conquista da Terra Prometida sob a liderança de Josué, sucessor de Moisés. Ele mostra a fidelidade de Deus em cumprir Sua promessa a Abraão.

Juízes e Rute cobrem o período turbulento entre Josué e a monarquia. Juízes mostra o ciclo de pecado, opressão, clamor e livramento. Rute, em contraste, é uma história de fidelidade e redenção.

1-2 Samuel narra a transição para a monarquia, com os reinados de Saul e Davi. A aliança davídica (2 Samuel 7) é fundamental para a esperança messiânica.

1-2 Reis conta a história de Salomão, a divisão do reino, os reis de Israel e Judá, e finalmente os exílios assírio e babilônico.

1-2 Crônicas recontar a história de uma perspectiva sacerdotal, enfatizando o templo e a adoração.

Esdras, Neemias e Ester narram o retorno do exílio e a restauração da comunidade judaica.

Ao longo desses livros, vemos a fidelidade de Deus mesmo diante da infidelidade humana, e a esperança de um Rei maior que Davi que reinaria para sempre.`,
            references: "Josué 1:9, Juízes 21:25, 2 Samuel 7:12-16, 1 Reis 8:27, Esdras 1:1-4",
            questions: "Qual é o período histórico coberto pelos livros históricos?\nO que o ciclo de Juízes nos ensina sobre a natureza humana e a graça de Deus?\nPor que a aliança davídica é importante para a esperança messiânica?\nO que causou a divisão do reino e os exílios?\nComo esses livros apontam para a necessidade de um Rei perfeito?",
            application: "Leia a história de Davi em 1 Samuel 16-17, observando como Deus escolhe e usa pessoas comuns para Seus propósitos.",
            summary: "Os Livros Históricos narram a história de Israel desde a conquista até o retorno do exílio, mostrando a fidelidade de Deus.",
            estimatedMinutes: 25,
            order: 3
          },
          {
            id: "n1-at-4",
            title: "Os Livros Poéticos e de Sabedoria",
            content: `Os Livros Poéticos e de Sabedoria (Jó, Salmos, Provérbios, Eclesiastes e Cantares de Salomão) formam o coração devocional do Antigo Testamento. Eles expressam as emoções, reflexões e adoração do povo de Deus.

Jó aborda o problema do sofrimento do justo. Mostra que nem todo sofrimento é resultado de pecado pessoal e que Deus é soberano mesmo quando não entendemos Seus caminhos.

Salmos é o hinário de Israel e da Igreja. Com 150 poemas/cânticos, expressa toda a gama de emoções humanas – louvor, lamento, confissão, ação de graças, súplica. Muitos Salmos são messiânicos, descrevendo Cristo (Sl 22, 110).

Provérbios é uma coleção de sabedoria prática para a vida diária. Ensina que "o temor do Senhor é o princípio da sabedoria" (1:7) e oferece orientação sobre trabalho, relacionamentos, fala, dinheiro e muito mais.

Eclesiastes é uma reflexão filosófica sobre o sentido da vida. O "Pregador" conclui que "debaixo do sol" (sem Deus), tudo é vaidade, mas a verdadeira sabedoria está em temer a Deus e guardar Seus mandamentos (12:13).

Cantares de Salomão é um poema de amor que celebra o casamento e, segundo muitos intérpretes, também simboliza o amor entre Deus e Seu povo, ou Cristo e a Igreja.

Estes livros nos ensinam a adorar, a pensar corretamente, e a viver sabiamente diante de Deus.`,
            references: "Jó 42:5-6, Salmo 1:1-3, Provérbios 1:7, Eclesiastes 12:13-14, Cantares 8:6-7",
            questions: "Qual é a mensagem central de cada livro poético?\nO que Jó nos ensina sobre o sofrimento?\nComo os Salmos expressam a vida de fé?\nQual é o fundamento da verdadeira sabedoria segundo Provérbios?\nComo podemos aplicar a literatura de sabedoria em nossa vida?",
            application: "Leia um Salmo por dia nesta semana. Observe as diferentes emoções expressas e use-os como modelo para suas próprias orações.",
            summary: "Os Livros Poéticos expressam adoração, sabedoria e reflexão, ensinando-nos a viver e adorar diante de Deus.",
            estimatedMinutes: 25,
            order: 4
          },
          {
            id: "n1-at-5",
            title: "Os Profetas Maiores",
            content: `Os Profetas Maiores (Isaías, Jeremias, Lamentações, Ezequiel e Daniel) são assim chamados por causa do tamanho de seus livros, não por maior importância. Eles ministraram em tempos de crise nacional, chamando Israel ao arrependimento e anunciando tanto juízo quanto esperança.

Isaías, o "príncipe dos profetas", ministrou em Judá durante cerca de 60 anos (740-680 a.C.). Seu livro contém algumas das profecias messiânicas mais claras (7:14, 9:6-7, 53) e promessas de restauração.

Jeremias, o "profeta choroso", ministrou antes e durante a queda de Jerusalém (627-586 a.C.). Ele chamou Judá ao arrependimento, mas foi rejeitado. Lamentações é seu lamento pela destruição de Jerusalém.

Ezequiel profetizou entre os exilados na Babilônia. Seu livro contém visões dramáticas da glória de Deus, oráculos de juízo contra as nações, e promessas de restauração, incluindo a visão dos ossos secos (cap. 37).

Daniel também ministrou no exílio babilônico. Ele se destacou por sua integridade e sabedoria na corte pagã. Suas visões apocalípticas revelam o plano de Deus para a história mundial e a vinda do Reino de Deus.

Os profetas maiores revelam o coração de Deus que ama Seu povo mas também é santo e não pode tolerar o pecado. Eles apontam para o dia em que Deus faria uma nova aliança e enviaria o Messias prometido.`,
            references: "Isaías 53:5-6, Jeremias 31:31-34, Lamentações 3:22-23, Ezequiel 37:1-14, Daniel 7:13-14",
            questions: "Por que esses profetas são chamados de 'maiores'?\nQual era a mensagem central dos profetas?\nComo Isaías 53 descreve a obra de Cristo?\nO que é a nova aliança prometida em Jeremias 31?\nO que a visão de Daniel 7 revela sobre o Messias?",
            application: "Leia Isaías 53 meditando em como cada verso descreve a obra de Cristo por você.",
            summary: "Os Profetas Maiores chamaram Israel ao arrependimento e anunciaram a vinda do Messias e da nova aliança.",
            estimatedMinutes: 25,
            order: 5
          },
          {
            id: "n1-at-6",
            title: "Os Profetas Menores",
            content: `Os Profetas Menores (Oseias, Joel, Amós, Obadias, Jonas, Miqueias, Naum, Habacuque, Sofonias, Ageu, Zacarias e Malaquias) são assim chamados pelo tamanho de seus livros, não pela importância. Eles complementam a mensagem dos profetas maiores.

Oseias usa seu casamento doloroso como ilustração do amor de Deus por Israel infiel. Joel anuncia o dia do Senhor e promete o derramamento do Espírito (2:28-29).

Amós denuncia a injustiça social e o culto vazio. Obadias profetiza contra Edom. Jonas relata a relutante missão do profeta a Nínive, mostrando a compaixão de Deus pelos gentios.

Miqueias combina denúncia de injustiça com promessas messiânicas (5:2 – nascimento em Belém). Naum anuncia a queda de Nínive. Habacuque questiona Deus sobre o mal e recebe resposta sobre a soberania divina e a vida pela fé (2:4).

Sofonias anuncia o dia do Senhor. Ageu e Zacarias encorajam a reconstrução do templo após o exílio. Zacarias tem ricas profecias messiânicas (9:9, 12:10).

Malaquias, o último profeta do AT, chama o povo ao arrependimento e anuncia o mensageiro que preparará o caminho (3:1) – cumprido em João Batista.

Os profetas menores mostram que Deus continuou falando ao Seu povo, oferecendo tanto advertência quanto esperança, até que veio "a plenitude do tempo" (Gálatas 4:4).`,
            references: "Oseias 11:1, Joel 2:28-29, Amós 5:24, Miqueias 5:2, Habacuque 2:4, Malaquias 3:1",
            questions: "Por que estudar os profetas menores?\nQual é o tema de cada profeta menor?\nComo Miqueias 5:2 foi cumprido em Cristo?\nO que Malaquias 3:1 profetizou sobre João Batista?\nQue lições práticas podemos tirar dos profetas menores?",
            application: "Leia o livro de Jonas esta semana. Reflita sobre a compaixão de Deus pelos perdidos e sua própria atitude em relação a eles.",
            summary: "Os Profetas Menores complementam a mensagem profética, apontando para o dia do Senhor e a vinda do Messias.",
            estimatedMinutes: 25,
            order: 6
          },
          {
            id: "n1-at-7",
            title: "Temas Teológicos do Antigo Testamento",
            content: `O Antigo Testamento desenvolve temas teológicos fundamentais que são completados no Novo Testamento. Compreender esses temas nos ajuda a ver a unidade da revelação bíblica.

A Criação: Deus criou tudo bom e o ser humano à Sua imagem. Isso estabelece a dignidade humana e o propósito da vida: glorificar a Deus.

A Queda: O pecado entrou no mundo através de Adão, trazendo morte e separação de Deus. Mas Deus imediatamente prometeu redenção (Gênesis 3:15).

A Aliança: Deus faz alianças com Seu povo (Noé, Abraão, Moisés, Davi), prometendo bênção através da fé e obediência. A nova aliança (Jeremias 31) seria cumprida em Cristo.

A Eleição: Deus escolhe Abraão e sua descendência para serem instrumentos de bênção para todas as nações. Israel não foi escolhido por méritos, mas pelo amor gracioso de Deus.

A Lei: Dada por Moisés, a Lei revela o caráter santo de Deus e o padrão de vida para Seu povo. Ela também expõe o pecado e mostra a necessidade de um Salvador.

O Sacrifício: O sistema sacrificial apontava para a necessidade de expiação pelo pecado. Os animais não podiam de fato tirar pecados (Hebreus 10:4), mas prefiguravam Cristo.

A Esperança Messiânica: Através do AT cresce a expectativa de um Ungido (Messias) que reinaria como rei, sofreria como servo, e traria salvação.`,
            references: "Gênesis 3:15, Gênesis 12:1-3, Êxodo 19:5-6, Jeremias 31:31-34, Isaías 9:6-7",
            questions: "Quais são os principais temas teológicos do Antigo Testamento?\nComo a promessa de Gênesis 3:15 aponta para Cristo?\nO que significa Israel ser povo da aliança?\nQual era o propósito do sistema sacrificial?\nComo esses temas se conectam ao Novo Testamento?",
            application: "Ao ler o Antigo Testamento, procure identificar esses temas e como eles apontam para Cristo. Faça anotações.",
            summary: "O AT desenvolve temas como criação, queda, aliança, eleição, lei, sacrifício e esperança messiânica, todos cumpridos em Cristo.",
            estimatedMinutes: 25,
            order: 7
          },
          {
            id: "n1-at-8",
            title: "A História de Israel: Da Criação ao Êxodo",
            content: `A história bíblica começa com Deus criando os céus e a terra. Ele fez tudo "muito bom" (Gênesis 1:31), incluindo o ser humano à Sua imagem. Adão e Eva foram colocados no Éden para cultivá-lo e guardá-lo, em comunhão com seu Criador.

A queda veio quando o casal desobedeceu, comendo do fruto proibido. O pecado trouxe consequências terríveis: morte, vergonha, alienação de Deus. Mas ali mesmo, Deus prometeu que a descendência da mulher esmagaria a cabeça da serpente (Gênesis 3:15).

A humanidade degenerou rapidamente (Caim mata Abel, a geração de Noé). O dilúvio foi juízo divino, mas Noé e sua família foram salvos pela graça. A aliança com Noé prometeu a preservação da criação.

Em Babel, a humanidade unida em rebelião foi dispersa. Então Deus chamou Abraão (c. 2000 a.C.) de Ur dos Caldeus, prometendo fazer dele uma grande nação, dar-lhe uma terra, e abençoar todas as famílias da terra através de sua descendência.

A família de Abraão cresceu através de Isaque e Jacó (renomeado Israel). Os doze filhos de Jacó se tornaram as doze tribos. José, vendido como escravo, foi exaltado no Egito e salvou sua família durante a fome.

Após 400 anos no Egito, Israel cresceu mas foi escravizado. Deus levantou Moisés para libertá-los. As dez pragas e a Páscoa demonstraram o poder de Deus e prefiguraram a redenção em Cristo. O êxodo é o evento central do AT, a grande salvação que prefigurava a maior salvação em Cristo.`,
            references: "Gênesis 1:1, Gênesis 3:15, Gênesis 12:1-3, Êxodo 3:7-10, Êxodo 12:13",
            questions: "Quais são os eventos principais de Gênesis?\nComo a promessa a Abraão se relaciona com Cristo?\nPor que o êxodo é tão importante na história bíblica?\nO que a Páscoa prefigurava?\nComo você vê a fidelidade de Deus nessa história?",
            application: "Leia Gênesis 12 e Êxodo 12, observando as promessas de Deus e como Ele as cumpre.",
            summary: "Da criação ao êxodo, vemos Deus criando, julgando o pecado, prometendo redenção, e salvando Seu povo com braço forte.",
            estimatedMinutes: 25,
            order: 8
          },
          {
            id: "n1-at-9",
            title: "A História de Israel: Do Sinai ao Exílio",
            content: `No monte Sinai, Deus fez uma aliança com Israel, dando-lhes a Lei e constituindo-os como "reino sacerdotal e nação santa" (Êxodo 19:6). O Tabernáculo foi construído para que Deus habitasse no meio do Seu povo.

Após 40 anos de peregrinação no deserto (por causa da incredulidade), Josué liderou Israel na conquista de Canaã. A terra foi dividida entre as tribos, cumprindo a promessa a Abraão.

O período dos juízes foi marcado por um ciclo trágico: apostasia, opressão por inimigos, clamor a Deus, e levantamento de juízes libertadores. "Cada um fazia o que parecia reto aos seus olhos" (Juízes 21:25).

Israel pediu um rei "como as nações". Saul foi o primeiro, mas falhou. Davi, "homem segundo o coração de Deus", recebeu a promessa de uma dinastia eterna (2 Samuel 7) – cumprida em Cristo. Salomão construiu o templo, mas sua idolatria causou a divisão do reino.

O reino do norte (Israel, 10 tribos) teve apenas reis maus e caiu diante da Assíria em 722 a.C. O reino do sul (Judá) teve alguns reis bons, mas também caiu, diante da Babilônia em 586 a.C. Jerusalém foi destruída e o povo exilado.

O exílio foi juízo pelo pecado, mas também refinou o remanescente fiel. Deus prometeu restauração através dos profetas. Após 70 anos, sob Ciro da Pérsia, um remanescente retornou, reconstruiu o templo e os muros, e aguardou a vinda do Messias prometido.`,
            references: "Êxodo 19:5-6, 2 Samuel 7:12-16, 1 Reis 11:11-13, 2 Crônicas 36:15-21, Esdras 1:1-3",
            questions: "Qual foi o propósito da aliança do Sinai?\nO que o ciclo de Juízes nos ensina?\nPor que a aliança davídica é importante?\nO que causou os exílios de Israel e Judá?\nComo Deus foi fiel mesmo no juízo?",
            application: "Reflita sobre como os erros de Israel (idolatria, desobediência) podem se manifestar em formas modernas em sua própria vida.",
            summary: "Do Sinai ao exílio, Israel experimentou a aliança, o reino, a divisão e o juízo, mas Deus preservou um remanescente fiel.",
            estimatedMinutes: 25,
            order: 9
          },
          {
            id: "n1-at-10",
            title: "O Antigo Testamento Aponta para Cristo",
            content: `Uma das verdades mais emocionantes sobre o Antigo Testamento é que ele todo aponta para Jesus Cristo. Após a ressurreição, Jesus explicou aos discípulos "o que dele se achava em todas as Escrituras, começando por Moisés e todos os Profetas" (Lucas 24:27).

As profecias messiânicas são numerosas e específicas: nasceria de uma virgem (Isaías 7:14), em Belém (Miqueias 5:2); seria da linhagem de Davi (2 Samuel 7); profeta como Moisés (Deuteronômio 18:15); sacerdote segundo a ordem de Melquisedeque (Salmo 110); rei cujo reino não teria fim (Isaías 9:6-7).

Isaías 53 descreve o Servo Sofredor com detalhes impressionantes: rejeitado, ferido por nossas transgressões, moído pelas nossas iniquidades, levado como ovelha ao matadouro. Todo cristão deveria conhecer esta passagem.

Além das profecias, há tipos e figuras: Adão é tipo de Cristo (Romanos 5:14); Isaque sendo oferecido aponta para Cristo; José, rejeitado pelos irmãos e exaltado, prefigura Cristo; a Páscoa é tipo do Cordeiro de Deus; o sistema sacrificial todo apontava para o sacrifício perfeito de Cristo.

Eventos também prefiguram Cristo: o êxodo é tipo da salvação; a serpente de bronze (Números 21) é tipo da crucificação (João 3:14); Jonas três dias no peixe é tipo da morte e ressurreição de Cristo (Mateus 12:40).

Ler o Antigo Testamento cristologicamente – buscando ver como cada parte se conecta a Cristo – transforma nosso estudo e nos leva a adorar.`,
            references: "Lucas 24:27, Lucas 24:44, João 5:39-40, 1 Pedro 1:10-12, Hebreus 10:1",
            questions: "Por que é importante ler o AT à luz de Cristo?\nQuais são algumas das principais profecias messiânicas?\nO que são tipos bíblicos e como eles apontam para Cristo?\nComo Isaías 53 descreve a obra de Cristo?\nComo essa perspectiva transforma seu estudo do AT?",
            application: "Ao ler o Antigo Testamento nesta semana, pergunte: 'Como esta passagem aponta para Cristo ou me prepara para entendê-Lo melhor?'",
            summary: "Todo o Antigo Testamento – profecias, tipos, eventos – converge para Jesus Cristo, o cumprimento das promessas de Deus.",
            estimatedMinutes: 25,
            order: 10
          }
        ]
      }
    ]
  },

  // MÓDULO 1.3 - PANORAMA DO NOVO TESTAMENTO
  {
    id: "n1-panorama-nt",
    name: "Panorama do Novo Testamento",
    description: "Uma visão geral dos 27 livros do Novo Testamento, o cumprimento das promessas em Cristo e o nascimento da Igreja.",
    icon: "book",
    color: "#2E86AB",
    order: 3,
    tracks: [
      {
        id: "n1-nt-track",
        level: "iniciante",
        name: "Conhecendo o Novo Testamento",
        description: "O cumprimento em Cristo e a Igreja nascente",
        requiredPlan: "gold",
        order: 1,
        lessons: [
          {
            id: "n1-nt-1",
            title: "Introdução ao Novo Testamento",
            content: `O Novo Testamento é a segunda parte da Bíblia, composta por 27 livros escritos ao longo de aproximadamente 50 anos (de cerca de 45 d.C. com Tiago até cerca de 95 d.C. com Apocalipse). Ele registra o cumprimento das promessas do Antigo Testamento em Jesus Cristo e o nascimento da Igreja.

O NT começa com os quatro Evangelhos, que narram a vida, ministério, morte e ressurreição de Jesus Cristo. Cada Evangelho apresenta Jesus de uma perspectiva particular: Mateus como o Rei messiânico; Marcos como o Servo sofredor; Lucas como o Salvador universal; João como o Filho divino.

Atos dos Apóstolos narra a expansão da Igreja desde Jerusalém "até aos confins da terra" (Atos 1:8), sob a liderança do Espírito Santo. É a continuação da obra de Jesus através de Sua Igreja.

As 21 Epístolas (13 de Paulo, 8 de outros autores) ensinam doutrina e aplicação prática para as igrejas e indivíduos. Elas explicam o significado da obra de Cristo e como viver a vida cristã.

O Apocalipse conclui o cânon, revelando a consumação do plano de Deus na história: a vitória final de Cristo e Sua Igreja sobre o mal, o juízo, e a criação do novo céu e nova terra.

O Novo Testamento é nosso guia para conhecer Cristo, entender o Evangelho, e viver como discípulos em comunidade.`,
            references: "Mateus 5:17, João 20:31, Atos 1:8, Romanos 1:16-17, Apocalipse 22:20",
            questions: "Quais são as principais divisões do Novo Testamento?\nPor que temos quatro Evangelhos?\nQual é o papel do livro de Atos?\nPor que as Epístolas são importantes para a Igreja?\nComo o Apocalipse conclui a história bíblica?",
            application: "Faça um plano para ler todo o Novo Testamento este ano. Comece pelo Evangelho de João.",
            summary: "O Novo Testamento com seus 27 livros registra o cumprimento das promessas em Cristo e a vida da Igreja nascente.",
            estimatedMinutes: 20,
            order: 1
          },
          {
            id: "n1-nt-2",
            title: "O Evangelho de Mateus",
            content: `Mateus, também chamado Levi, era cobrador de impostos antes de seguir Jesus. Seu Evangelho foi escrito principalmente para judeus, apresentando Jesus como o Messias prometido, o Rei de Israel.

Uma característica distintiva de Mateus é a frequente citação do Antigo Testamento, mostrando como Jesus cumpriu as profecias. A frase "para que se cumprisse o que foi dito pelo profeta" aparece repetidamente. Mateus demonstra que Jesus é o cumprimento da esperança de Israel.

O Evangelho começa com a genealogia de Jesus, traçando-a de Abraão a Davi até José, marido de Maria. Isso estabelece as credenciais messiânicas de Jesus como filho de Davi e filho de Abraão.

Mateus organiza o ensino de Jesus em cinco grandes discursos: o Sermão do Monte (5-7), o Discurso Missionário (10), as Parábolas do Reino (13), o Discurso sobre a Comunidade (18), e o Discurso Escatológico (24-25).

O Sermão do Monte é particularmente importante, apresentando a ética do Reino de Deus. As bem-aventuranças, a oração do Pai Nosso, e o ensino sobre não julgar estão todos ali.

Mateus termina com a Grande Comissão: "Ide, fazei discípulos de todas as nações" (28:19-20), ampliando a missão além de Israel para incluir todos os povos.`,
            references: "Mateus 1:1, Mateus 5:17, Mateus 16:16, Mateus 28:18-20",
            questions: "Por que Mateus cita tanto o Antigo Testamento?\nO que a genealogia de Jesus demonstra?\nQuais são os cinco discursos de Mateus e seus temas?\nO que é o Sermão do Monte?\nQual é a importância da Grande Comissão?",
            application: "Leia Mateus 5-7 (Sermão do Monte) esta semana, refletindo sobre como viver segundo a ética do Reino de Deus.",
            summary: "Mateus apresenta Jesus como o Messias-Rei prometido, cumprindo as profecias do AT e inaugurando o Reino de Deus.",
            estimatedMinutes: 25,
            order: 2
          },
          {
            id: "n1-nt-3",
            title: "Os Evangelhos de Marcos e Lucas",
            content: `Marcos, provavelmente escrito primeiro (por volta de 60-70 d.C.), é o mais curto e dinâmico dos Evangelhos. Segundo a tradição, Marcos registrou as memórias do apóstolo Pedro. Ele apresenta Jesus como o Servo sofredor que veio "para servir e dar a sua vida em resgate de muitos" (10:45).

Marcos é marcado pela ação. A palavra "imediatamente" (euthys em grego) aparece 42 vezes. Os milagres de Jesus são destacados, demonstrando Sua autoridade. Porém, o foco principal está na Paixão – cerca de um terço do Evangelho cobre a última semana de Jesus.

O segredo messiânico é um tema importante em Marcos: Jesus frequentemente pedia silêncio sobre Sua identidade, revelando-a plenamente apenas na cruz.

Lucas, médico e companheiro de Paulo, escreveu o mais longo e literariamente polido dos Evangelhos. Ele apresenta Jesus como o Salvador universal – para judeus e gentios, homens e mulheres, ricos e pobres.

Lucas enfatiza a compaixão de Jesus pelos marginalizados: publicanos, pecadores, samaritanos, pobres, mulheres. Parábolas exclusivas de Lucas (o Bom Samaritano, o Filho Pródigo) ilustram essa ênfase.

O papel do Espírito Santo e a oração também são destacados em Lucas. Jesus é mostrado orando em momentos cruciais, e o Espírito está presente desde a concepção até o ministério.

Lucas é a "parte 1" de uma obra que continua em Atos dos Apóstolos.`,
            references: "Marcos 1:1, Marcos 10:45, Lucas 1:1-4, Lucas 19:10, Lucas 24:47",
            questions: "Qual é a ênfase distintiva de Marcos?\nO que é o 'segredo messiânico'?\nPor que Lucas enfatiza a universalidade do Evangelho?\nQuais grupos marginalizados recebem atenção em Lucas?\nComo Lucas e Atos se conectam?",
            application: "Leia a parábola do Filho Pródigo (Lucas 15:11-32), refletindo sobre a graça do Pai celestial.",
            summary: "Marcos apresenta Jesus como o Servo sofredor, e Lucas como o Salvador universal compassivo com todos os povos.",
            estimatedMinutes: 25,
            order: 3
          },
          {
            id: "n1-nt-4",
            title: "O Evangelho de João",
            content: `O Evangelho de João é profundamente diferente dos sinóticos (Mateus, Marcos, Lucas). Escrito pelo "discípulo amado" (provavelmente por volta de 90 d.C.), seu propósito é claramente declarado: "para que creiais que Jesus é o Cristo, o Filho de Deus, e para que, crendo, tenhais vida em seu nome" (20:31).

João é o mais teológico dos Evangelhos. Ele começa não com o nascimento de Jesus, mas com a eternidade: "No princípio era o Verbo, e o Verbo estava com Deus, e o Verbo era Deus" (1:1). Este prólogo (1:1-18) resume todo o Evangelho.

Uma característica distintiva são os sete sinais (milagres) que demonstram a divindade de Jesus: água em vinho, cura do filho do oficial, cura do paralítico, alimentação dos cinco mil, Jesus anda sobre as águas, cura do cego, ressurreição de Lázaro.

As sete declarações "Eu Sou" revelam a identidade de Jesus: "Eu sou o pão da vida", "a luz do mundo", "a porta", "o bom pastor", "a ressurreição e a vida", "o caminho, a verdade e a vida", "a videira verdadeira".

João registra os discursos de despedida (caps. 13-17), onde Jesus prepara os discípulos para Sua partida, promete o Consolador (Espírito Santo), e ora por eles.

A narrativa da Paixão em João enfatiza a soberania de Jesus: Ele não é vítima, mas Aquele que dá Sua vida voluntariamente.`,
            references: "João 1:1, João 1:14, João 3:16, João 14:6, João 20:31",
            questions: "Qual é o propósito declarado do Evangelho de João?\nO que o prólogo (1:1-18) revela sobre Jesus?\nQuais são os sete sinais de João?\nO que as declarações 'Eu Sou' comunicam?\nComo João apresenta a Paixão de Cristo?",
            application: "Leia João 1:1-18 devotamente, adorando Jesus como o Verbo eterno que se fez carne.",
            summary: "João apresenta Jesus como o Filho divino de Deus, revelando Sua identidade através de sinais e declarações 'Eu Sou'.",
            estimatedMinutes: 25,
            order: 4
          },
          {
            id: "n1-nt-5",
            title: "Atos dos Apóstolos",
            content: `Atos dos Apóstolos, escrito por Lucas como continuação de seu Evangelho, narra a história da Igreja primitiva desde a ascensão de Jesus até a chegada de Paulo a Roma. É o registro do cumprimento da promessa de Jesus: "Recebereis poder, ao descer sobre vós o Espírito Santo, e sereis minhas testemunhas" (1:8).

O livro pode ser dividido geograficamente segundo 1:8: Jerusalém (caps. 1-7), Judeia e Samaria (caps. 8-12), e "até aos confins da terra" (caps. 13-28). Ou pode ser dividido entre o ministério de Pedro (caps. 1-12) e o ministério de Paulo (caps. 13-28).

O Pentecostes (cap. 2) é o evento central do início: o Espírito Santo é derramado sobre os discípulos, capacitando-os para a missão. Pedro prega e três mil são convertidos. A Igreja nasce em poder.

Atos registra o crescimento explosivo da Igreja: milagres, perseguição, a dispersão que espalhou o Evangelho, a conversão de gentios (Cornélio), a primeira viagem missionária de Paulo, o Concílio de Jerusalém (cap. 15), e as viagens de Paulo pela Ásia Menor e Grécia.

A figura central (depois de Jesus e do Espírito) é o apóstolo Paulo, cuja conversão dramática (cap. 9) o transformou de perseguidor em maior missionário da Igreja. Suas três viagens missionárias estabeleceram igrejas por todo o Mediterrâneo.

Atos termina com Paulo em Roma, pregando "o reino de Deus e ensinando as coisas concernentes ao Senhor Jesus Cristo, com toda a intrepidez, sem impedimento" (28:31).`,
            references: "Atos 1:8, Atos 2:41-42, Atos 9:1-19, Atos 15:1-29, Atos 28:30-31",
            questions: "Qual é o papel do Espírito Santo em Atos?\nComo 1:8 funciona como esboço do livro?\nQual foi a importância do Pentecostes?\nComo a conversão de Paulo mudou a história da Igreja?\nO que Atos nos ensina sobre a missão da Igreja?",
            application: "Leia Atos 2, observando a obra do Espírito Santo. Ore pedindo poder para testemunhar.",
            summary: "Atos narra a expansão da Igreja pelo poder do Espírito Santo, de Jerusalém até os confins da terra.",
            estimatedMinutes: 25,
            order: 5
          },
          {
            id: "n1-nt-6",
            title: "As Cartas de Paulo: Visão Geral",
            content: `O apóstolo Paulo escreveu 13 das 27 cartas do Novo Testamento, formando a base da teologia cristã. Suas cartas foram escritas para igrejas e indivíduos, abordando questões teológicas e práticas.

As cartas paulinas geralmente seguem uma estrutura: saudação, ação de graças, corpo doutrinário, exortações práticas, saudações finais. Paulo sempre conecta doutrina com vida – o que Deus fez (indicativo) é fundamento para como devemos viver (imperativo).

Podemos agrupar as cartas de Paulo de várias formas:

Cartas Principais/Maiores: Romanos, 1 e 2 Coríntios, Gálatas – abordam questões fundamentais como justificação pela fé, vida na comunidade, dons espirituais.

Cartas da Prisão: Efésios, Filipenses, Colossenses, Filemom – escritas enquanto Paulo estava preso, enfatizam a supremacia de Cristo e a unidade da Igreja.

Cartas Escatológicas: 1 e 2 Tessalonicenses – tratam da segunda vinda de Cristo e como viver à luz dela.

Cartas Pastorais: 1 e 2 Timóteo, Tito – instruções para líderes de igreja sobre doutrina, organização e ministério.

As cartas de Paulo nos ensinam o Evangelho, nos mostram como viver em comunidade, nos preparam para a eternidade, e nos equipam para o ministério. Elas são essenciais para todo cristão.`,
            references: "Romanos 1:16-17, Gálatas 2:20, Efésios 2:8-10, Filipenses 2:5-11, 2 Timóteo 3:16-17",
            questions: "Quantas cartas Paulo escreveu?\nQual é a estrutura típica de uma carta paulina?\nComo Paulo conecta doutrina e prática?\nQuais são os principais grupos de cartas paulinas?\nPor que as cartas de Paulo são tão importantes para a Igreja?",
            application: "Escolha uma carta de Paulo para ler inteira esta semana. Observe a estrutura: doutrina que fundamenta a prática.",
            summary: "Paulo escreveu 13 cartas fundamentais que ensinam doutrina cristã e sua aplicação prática para a vida e a Igreja.",
            estimatedMinutes: 25,
            order: 6
          },
          {
            id: "n1-nt-7",
            title: "As Epístolas Gerais",
            content: `As Epístolas Gerais (ou Católicas, no sentido de "universais") são as oito cartas escritas por outros apóstolos além de Paulo: Hebreus, Tiago, 1-2 Pedro, 1-3 João e Judas. Elas são chamadas "gerais" porque a maioria não é dirigida a uma igreja específica.

Hebreus (autor desconhecido) apresenta Cristo como superior a tudo: aos anjos, a Moisés, ao sacerdócio levítico, aos sacrifícios antigos. Cristo é o grande Sumo Sacerdote que ofereceu o sacrifício perfeito uma vez por todas. O cap. 11 é o grande "hall da fama" da fé.

Tiago, irmão de Jesus, escreve sobre fé prática. "A fé sem obras é morta" (2:26) não contradiz Paulo, mas complementa: a fé verdadeira se manifesta em obras.

1 Pedro encoraja cristãos sofrendo perseguição, apontando para a esperança viva em Cristo. 2 Pedro adverte contra falsos mestres e lembra da certeza da segunda vinda.

1 João aborda testes de fé genuína: verdade doutrinária, obediência moral, e amor fraternal. 2 e 3 João são cartas breves sobre hospitalidade e verdade. 

Judas é uma forte advertência contra falsos mestres que se infiltram na Igreja.

Essas cartas complementam os escritos de Paulo, oferecendo perspectivas diversas sobre a fé cristã e tratando de questões específicas que as igrejas enfrentavam.`,
            references: "Hebreus 4:14-16, Tiago 2:17, 1 Pedro 1:3-9, 1 João 4:7-8, Judas 3",
            questions: "Por que essas cartas são chamadas 'gerais'?\nQual é a mensagem central de Hebreus?\nComo Tiago e Paulo se relacionam sobre fé e obras?\nQuais são os testes de fé genuína em 1 João?\nO que essas cartas acrescentam ao NT?",
            application: "Leia Tiago esta semana, aplicando seus ensinamentos práticos sobre a vida cristã.",
            summary: "As Epístolas Gerais complementam Paulo, abordando a superioridade de Cristo, fé prática, perseverança e combate a falsos mestres.",
            estimatedMinutes: 25,
            order: 7
          },
          {
            id: "n1-nt-8",
            title: "O Apocalipse",
            content: `O Apocalipse (ou Revelação) é o último livro da Bíblia, escrito pelo apóstolo João durante seu exílio na ilha de Patmos (cerca de 95 d.C.). É literatura apocalíptica, cheia de símbolos, visões e números com significados especiais.

O livro começa com cartas a sete igrejas da Ásia Menor (caps. 2-3), contendo advertências, encorajamentos e promessas. Essas cartas são relevantes para igrejas de todas as épocas.

A partir do cap. 4, João é levado ao céu para ver "as coisas que devem acontecer depois destas". O centro da visão é o trono de Deus e o Cordeiro que foi morto. Os selos, trombetas e taças representam juízos sobre um mundo rebelde.

Temas centrais incluem: a soberania de Deus sobre a história; a vitória final de Cristo sobre Satanás, a besta e o falso profeta; a perseverança dos santos em meio à tribulação; e a consumação do Reino de Deus.

O clímax é a destruição da Babilônia (símbolo do sistema mundial anti-Deus), as bodas do Cordeiro, a segunda vinda de Cristo, o juízo final, e a criação do novo céu e nova terra onde Deus habitará com Seu povo para sempre.

O Apocalipse termina com o convite "Vem, Senhor Jesus!" (22:20) – a esperança que sustenta a Igreja em todas as épocas.`,
            references: "Apocalipse 1:1-3, Apocalipse 5:9-10, Apocalipse 19:11-16, Apocalipse 21:1-5, Apocalipse 22:20",
            questions: "O que é literatura apocalíptica?\nQual é a relevância das cartas às sete igrejas?\nQual é o tema central do Apocalipse?\nComo o livro oferece esperança em meio à tribulação?\nComo a Bíblia termina – qual é a mensagem final?",
            application: "Leia Apocalipse 21-22, meditando na esperança do novo céu e nova terra. Que essa esperança transforme como você vive hoje.",
            summary: "O Apocalipse revela a vitória final de Cristo, o juízo do mal, e a consumação do Reino de Deus no novo céu e nova terra.",
            estimatedMinutes: 25,
            order: 8
          },
          {
            id: "n1-nt-9",
            title: "Temas Teológicos do Novo Testamento",
            content: `O Novo Testamento desenvolve e cumpre os temas do Antigo Testamento, centrando tudo em Jesus Cristo. Alguns temas principais:

O Reino de Deus: Jesus anunciou que "o Reino de Deus está próximo" (Marcos 1:15). O Reino já veio em Jesus, mas ainda aguarda consumação. Vivemos na tensão do "já" e "ainda não".

A Pessoa de Cristo: O NT revela Jesus como plenamente Deus e plenamente homem, o Verbo encarnado, o Messias prometido, o Senhor ressurreto.

A Obra de Cristo: Jesus morreu como sacrifício pelos pecados, foi ressuscitado para nossa justificação, e intercede por nós à direita do Pai.

O Espírito Santo: O Consolador prometido foi derramado no Pentecostes, habita nos crentes, capacita para o ministério, produz fruto, e une a Igreja.

A Salvação: Somos salvos pela graça mediante a fé, justificados pela obra de Cristo, sendo santificados pelo Espírito, e seremos glorificados na volta de Cristo.

A Igreja: O NT apresenta a Igreja como o Corpo de Cristo, templo do Espírito, comunidade de discípulos chamados a adorar, servir e fazer discípulos de todas as nações.

A Escatologia: O NT promete a segunda vinda de Cristo, a ressurreição dos mortos, o juízo final, e a vida eterna no novo céu e nova terra.

Esses temas formam o tecido da fé cristã e devem moldar nossa vida e esperança.`,
            references: "Marcos 1:15, João 1:14, Romanos 5:1, Atos 2:38, Efésios 2:19-22",
            questions: "O que significa o Reino de Deus ter vindo em Jesus?\nComo o NT revela a Pessoa de Cristo?\nQuais são os aspectos da obra de Cristo?\nQual é o papel do Espírito Santo no NT?\nComo a escatologia deve afetar nossa vida presente?",
            application: "Escolha um desses temas e estude-o mais profundamente esta semana, lendo passagens relacionadas.",
            summary: "O NT centra toda a teologia em Cristo, revelando o Reino, a salvação, a Igreja e a esperança da consumação.",
            estimatedMinutes: 25,
            order: 9
          },
          {
            id: "n1-nt-10",
            title: "A Unidade entre Antigo e Novo Testamento",
            content: `A Bíblia é um livro unificado. Embora composta por 66 livros, escritos por cerca de 40 autores, ao longo de 1.500 anos, ela conta uma única história: a redenção da humanidade através de Jesus Cristo.

O Antigo Testamento é promessa; o Novo é cumprimento. O AT pergunta; o NT responde. O AT planta sementes; o NT mostra a colheita. Agostinho resumiu: "O Novo está oculto no Antigo; o Antigo é revelado no Novo."

Jesus é o elo que une os dois Testamentos. Ele disse: "Não penseis que vim revogar a Lei ou os Profetas; não vim para revogar, vim para cumprir" (Mateus 5:17). Toda a Escritura testemunha dEle.

Os escritores do NT constantemente citam o AT para mostrar o cumprimento em Cristo. Mateus usa "para que se cumprisse"; Paulo desenvolve doutrinas a partir de Gênesis e da Lei; Hebreus mostra como Cristo é o cumprimento do sistema levítico.

Os temas do AT são completados no NT: a criação será restaurada; a queda foi vencida na cruz; a aliança foi estabelecida em sangue; a Lei foi cumprida por Cristo; o templo agora é o povo de Deus; o sacerdócio culminou em Jesus; o reino davídico é eterno em Cristo.

Ler a Bíblia como unidade nos faz ver a grandiosidade do plano de Deus e adorá-Lo por Sua sabedoria. Devemos ler o AT à luz do NT, e o NT fundamentado no AT.`,
            references: "Mateus 5:17, Lucas 24:27, 2 Coríntios 1:20, Hebreus 1:1-2, Apocalipse 21:1-5",
            questions: "Por que é importante ver a unidade da Bíblia?\nComo Jesus une os dois Testamentos?\nDe que formas o NT cita e usa o AT?\nQuais temas do AT são completados no NT?\nComo devemos ler a Bíblia para ver sua unidade?",
            application: "Ao estudar a Bíblia, sempre pergunte como AT e NT se conectam. Observe citações do AT no NT e seu contexto original.",
            summary: "A Bíblia é uma história unificada de redenção, com o AT como promessa e o NT como cumprimento em Cristo.",
            estimatedMinutes: 25,
            order: 10
          }
        ]
      }
    ]
  }
];

// ============================================================================
// COMBINE ALL MODULES (45 Total)
// ============================================================================
// Level 1 (Iniciante): Modules 1-15 (order 1-15)
// Level 2 (Moderado): Modules 16-30 (order 16-30)
// Level 3 (Avançado): Modules 31-45 (order 31-45)
// ============================================================================

const ALL_MODULES: ModuleData[] = [
  ...NIVEL_1_INICIANTE,      // Modules 1-3 (inline above)
  ...NIVEL_1_MODULOS_4_8,    // Modules 4-8
  ...NIVEL_1_MODULOS_9_15,   // Modules 9-12 (some overlap handling)
  ...NIVEL_1_MODULOS_13_15,  // Modules 13-15
  ...NIVEL_2_MODULOS_1_5,    // Modules 16-20
  ...NIVEL_2_MODULOS_6_10,   // Modules 21-25
  ...NIVEL_2_MODULOS_11_15,  // Modules 26-30
  ...NIVEL_3_MODULOS_1_5,    // Modules 31-35
  ...NIVEL_3_MODULOS_6_10,   // Modules 36-40
  ...NIVEL_3_MODULOS_11_15,  // Modules 41-45
];

// Export the module data
export const PREMIUM_COURSE_DATA = {
  nivel1: [...NIVEL_1_INICIANTE, ...NIVEL_1_MODULOS_4_8, ...NIVEL_1_MODULOS_9_15, ...NIVEL_1_MODULOS_13_15],
  nivel2: [...NIVEL_2_MODULOS_1_5, ...NIVEL_2_MODULOS_6_10, ...NIVEL_2_MODULOS_11_15],
  nivel3: [...NIVEL_3_MODULOS_1_5, ...NIVEL_3_MODULOS_6_10, ...NIVEL_3_MODULOS_11_15],
  all: ALL_MODULES,
};

// Seed function
async function seedPremiumCourse() {
  console.log("Starting Premium Course seed...");
  console.log(`Total modules to seed: ${ALL_MODULES.length}`);

  try {
    // Clear existing data
    console.log("Clearing existing study data...");
    await db.delete(studyLessons);
    await db.delete(studyTracks);
    await db.delete(studyModules);

    let totalLessons = 0;
    let totalTracks = 0;

    // Seed all modules
    for (const moduleData of ALL_MODULES) {
      console.log(`Seeding module ${moduleData.order}: ${moduleData.name}`);
      
      // Insert module
      await db.insert(studyModules).values({
        id: moduleData.id,
        name: moduleData.name,
        description: moduleData.description,
        icon: moduleData.icon,
        color: moduleData.color,
        order: moduleData.order,
      });

      // Insert tracks and lessons
      for (const track of moduleData.tracks) {
        await db.insert(studyTracks).values({
          id: track.id,
          moduleId: moduleData.id,
          level: track.level,
          name: track.name,
          description: track.description,
          requiredPlan: track.requiredPlan,
          order: track.order,
        });
        totalTracks++;

        for (const lesson of track.lessons) {
          await db.insert(studyLessons).values({
            id: lesson.id,
            trackId: track.id,
            title: lesson.title,
            content: lesson.content,
            references: lesson.references,
            questions: lesson.questions,
            application: lesson.application,
            summary: lesson.summary,
            estimatedMinutes: lesson.estimatedMinutes,
            order: lesson.order,
          });
          totalLessons++;
        }
      }
    }

    console.log("\n========================================");
    console.log("Premium Course seed completed successfully!");
    console.log(`Seeded ${ALL_MODULES.length} modules`);
    console.log(`Seeded ${totalTracks} tracks`);
    console.log(`Seeded ${totalLessons} lessons`);
    console.log("========================================\n");
    
  } catch (error) {
    console.error("Error seeding premium course:", error);
    throw error;
  }
}

// Run if executed directly
seedPremiumCourse()
  .then(() => {
    console.log("Seed completed.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
