import { db } from "../server/db";
import { studyModules, studyTracks, studyLessons } from "../shared/schema";
import { eq } from "drizzle-orm";

const MODULES_DATA = [
  {
    id: "fundamentos-fe",
    name: "Fundamentos da Fé",
    description: "Explore os pilares essenciais da fé cristã, desde a natureza de Deus até os princípios básicos da salvação.",
    icon: "foundation",
    color: "#4A90D9",
    order: 1,
    tracks: [
      {
        id: "fund-iniciante",
        level: "iniciante",
        name: "Primeiros Passos",
        description: "Introdução aos conceitos básicos da fé cristã",
        requiredPlan: "gold",
        order: 1,
        lessons: [
          {
            id: "fund-ini-1",
            title: "Quem é Deus?",
            content: "Deus é o Criador de todas as coisas, eterno, onipotente, onisciente e onipresente. Ele é amor (1 João 4:8) e deseja ter um relacionamento pessoal com cada ser humano.",
            references: "João 1:1-3, Gênesis 1:1, Salmos 139:7-10, 1 João 4:8",
            questions: "O que significa para você saber que Deus é amor?\nComo a onipresença de Deus afeta sua vida diária?\nDe que forma você pode conhecer melhor a Deus?",
            application: "Separe 10 minutos hoje para agradecer a Deus por quem Ele é, não apenas pelo que Ele faz.",
            summary: "Deus é o Criador eterno, amoroso e onipresente que deseja se relacionar conosco.",
            estimatedMinutes: 15,
            order: 1
          },
          {
            id: "fund-ini-2",
            title: "A Bíblia: Palavra de Deus",
            content: "A Bíblia é a Palavra inspirada de Deus, escrita por homens movidos pelo Espírito Santo. Ela é nossa autoridade máxima em fé e prática, útil para ensinar, repreender, corrigir e instruir.",
            references: "2 Timóteo 3:16-17, 2 Pedro 1:20-21, Salmos 119:105, Hebreus 4:12",
            questions: "Por que podemos confiar na Bíblia?\nComo a Bíblia pode ser uma lâmpada para seus pés?\nQual o papel das Escrituras em suas decisões?",
            application: "Comece um plano de leitura bíblica diária, começando pelo Evangelho de João.",
            summary: "A Bíblia é a Palavra inspirada de Deus, autoridade máxima para nossa vida.",
            estimatedMinutes: 15,
            order: 2
          },
          {
            id: "fund-ini-3",
            title: "Jesus Cristo: O Salvador",
            content: "Jesus Cristo é o Filho de Deus, plenamente Deus e plenamente homem. Ele veio ao mundo para salvar pecadores, morrendo na cruz e ressuscitando ao terceiro dia. Ele é o único caminho para Deus.",
            references: "João 14:6, Filipenses 2:5-11, Romanos 5:8, 1 Coríntios 15:3-4",
            questions: "O que significa Jesus ser o único caminho para Deus?\nComo a ressurreição de Jesus impacta sua fé?\nDe que forma você pode compartilhar o amor de Jesus?",
            application: "Escreva em um caderno três coisas que Jesus fez por você.",
            summary: "Jesus é o Filho de Deus que morreu e ressuscitou para nossa salvação.",
            estimatedMinutes: 20,
            order: 3
          }
        ]
      },
      {
        id: "fund-moderado",
        level: "moderado",
        name: "Aprofundando a Fé",
        description: "Explorando conceitos teológicos intermediários",
        requiredPlan: "gold",
        order: 2,
        lessons: [
          {
            id: "fund-mod-1",
            title: "A Trindade",
            content: "A doutrina da Trindade ensina que Deus é um ser em três pessoas distintas: Pai, Filho e Espírito Santo. Cada pessoa é plenamente Deus, mas há apenas um Deus.",
            references: "Mateus 28:19, 2 Coríntios 13:14, João 10:30, Gênesis 1:26",
            questions: "Como a Trindade reflete a natureza relacional de Deus?\nDe que forma cada pessoa da Trindade atua em sua vida?\nPor que é importante entender a Trindade?",
            application: "Ore hoje direcionando parte da oração ao Pai, parte ao Filho e parte ao Espírito Santo.",
            summary: "Deus é Um em três pessoas: Pai, Filho e Espírito Santo.",
            estimatedMinutes: 25,
            order: 1
          },
          {
            id: "fund-mod-2",
            title: "Graça e Fé",
            content: "Somos salvos pela graça mediante a fé, não por obras. A graça é o favor imerecido de Deus, e a fé é o meio pelo qual recebemos essa salvação. Boas obras são fruto, não causa, da salvação.",
            references: "Efésios 2:8-10, Romanos 3:23-24, Tiago 2:17-18, Gálatas 2:16",
            questions: "O que significa graça imerecida?\nComo equilibrar graça e obras?\nDe que forma a graça transforma seu comportamento?",
            application: "Identifique uma área onde você tem tentado 'merecer' o amor de Deus e entregue-a a Ele.",
            summary: "Somos salvos pela graça mediante a fé, não por obras.",
            estimatedMinutes: 25,
            order: 2
          }
        ]
      },
      {
        id: "fund-avancado",
        level: "avancado",
        name: "Teologia Sistemática",
        description: "Estudo aprofundado das doutrinas fundamentais",
        requiredPlan: "premium",
        order: 3,
        lessons: [
          {
            id: "fund-ava-1",
            title: "Cristologia Avançada",
            content: "A união hipostática ensina que Jesus possui duas naturezas completas (divina e humana) em uma única pessoa. Esta doutrina foi definida no Concílio de Calcedônia (451 d.C.) e é essencial para a fé cristã.",
            references: "João 1:14, Colossenses 2:9, Hebreus 2:14-18, Filipenses 2:6-8",
            questions: "Por que era necessário que Jesus fosse plenamente humano e plenamente divino?\nComo as duas naturezas de Cristo se relacionam sem confusão?\nQual a implicação prática desta doutrina para sua adoração?",
            application: "Estude o Credo de Calcedônia e reflita sobre como ele expressa a fé bíblica.",
            summary: "Jesus possui duas naturezas completas (divina e humana) em uma única pessoa.",
            estimatedMinutes: 35,
            order: 1
          }
        ]
      }
    ]
  },
  {
    id: "crescimento-espiritual",
    name: "Crescimento Espiritual",
    description: "Desenvolva disciplinas e práticas que fortalecem sua caminhada com Deus.",
    icon: "growth",
    color: "#50C878",
    order: 2,
    tracks: [
      {
        id: "cresc-iniciante",
        level: "iniciante",
        name: "Disciplinas Básicas",
        description: "Oração, leitura bíblica e comunhão",
        requiredPlan: "gold",
        order: 1,
        lessons: [
          {
            id: "cresc-ini-1",
            title: "O Poder da Oração",
            content: "A oração é a comunicação com Deus. Podemos orar em qualquer lugar, a qualquer momento. Jesus nos ensinou a orar no Pai Nosso, mostrando elementos essenciais: adoração, petição, confissão e ação de graças.",
            references: "Mateus 6:9-13, Filipenses 4:6-7, 1 Tessalonicenses 5:17, Tiago 5:16",
            questions: "Quais são os obstáculos para sua vida de oração?\nComo você pode incorporar mais oração ao seu dia?\nO que significa orar sem cessar?",
            application: "Separe 15 minutos hoje para orar usando o modelo do Pai Nosso.",
            summary: "A oração é nossa comunicação direta com Deus, essencial para a vida cristã.",
            estimatedMinutes: 15,
            order: 1
          },
          {
            id: "cresc-ini-2",
            title: "Leitura Bíblica Diária",
            content: "A leitura bíblica regular alimenta nossa alma e nos transforma. Devemos ler com atenção, meditação e aplicação, buscando ouvir a voz de Deus através das Escrituras.",
            references: "Josué 1:8, Salmos 1:1-3, Salmos 119:11, Atos 17:11",
            questions: "Qual o melhor horário para sua leitura bíblica?\nComo você pode meditar no que lê?\nDe que forma a Palavra tem transformado sua vida?",
            application: "Escolha um livro da Bíblia e leia um capítulo por dia durante a próxima semana.",
            summary: "A leitura bíblica regular alimenta nossa alma e nos transforma à imagem de Cristo.",
            estimatedMinutes: 15,
            order: 2
          }
        ]
      },
      {
        id: "cresc-moderado",
        level: "moderado",
        name: "Vida no Espírito",
        description: "Desenvolvendo sensibilidade ao Espírito Santo",
        requiredPlan: "gold",
        order: 2,
        lessons: [
          {
            id: "cresc-mod-1",
            title: "Fruto do Espírito",
            content: "O fruto do Espírito é o resultado natural de uma vida rendida a Deus. Amor, alegria, paz, paciência, bondade, benignidade, fidelidade, mansidão e domínio próprio são evidências da obra do Espírito em nós.",
            references: "Gálatas 5:22-23, João 15:1-8, Romanos 8:5-6, Colossenses 3:12-14",
            questions: "Qual fruto do Espírito você mais precisa desenvolver?\nComo permanecer conectado à videira (Cristo)?\nDe que forma você pode cooperar com o Espírito no desenvolvimento do fruto?",
            application: "Escolha um fruto do Espírito e busque praticá-lo intencionalmente esta semana.",
            summary: "O fruto do Espírito são qualidades de caráter produzidas pela vida no Espírito.",
            estimatedMinutes: 25,
            order: 1
          }
        ]
      },
      {
        id: "cresc-avancado",
        level: "avancado",
        name: "Maturidade Cristã",
        description: "Crescendo para a plenitude em Cristo",
        requiredPlan: "premium",
        order: 3,
        lessons: [
          {
            id: "cresc-ava-1",
            title: "A Jornada da Santificação",
            content: "A santificação é o processo pelo qual somos progressivamente conformados à imagem de Cristo. Envolve a cooperação entre a obra do Espírito e nossa rendição diária, incluindo a mortificação do pecado e a vivificação da justiça.",
            references: "Romanos 8:29, 2 Coríntios 3:18, Filipenses 2:12-13, 1 Pedro 1:15-16",
            questions: "Como você entende a tensão entre 'já' e 'ainda não' na santificação?\nQuais práticas ajudam na mortificação do pecado?\nDe que forma você pode cooperar mais com o Espírito?",
            application: "Identifique um padrão de pecado e desenvolva um plano prático para combatê-lo.",
            summary: "A santificação é o processo contínuo de sermos conformados à imagem de Cristo.",
            estimatedMinutes: 35,
            order: 1
          }
        ]
      }
    ]
  },
  {
    id: "estudos-tematicos",
    name: "Estudos Temáticos",
    description: "Explore temas importantes da Bíblia de forma sistemática e profunda.",
    icon: "topics",
    color: "#9B59B6",
    order: 3,
    tracks: [
      {
        id: "tema-iniciante",
        level: "iniciante",
        name: "Temas Essenciais",
        description: "Amor, perdão, esperança e fé",
        requiredPlan: "gold",
        order: 1,
        lessons: [
          {
            id: "tema-ini-1",
            title: "O Amor de Deus",
            content: "O amor de Deus é incondicional, sacrificial e eterno. Ele nos amou primeiro, enviando Seu Filho para morrer por nós enquanto éramos pecadores. Este amor deve transformar como amamos os outros.",
            references: "1 João 4:7-12, Romanos 5:8, João 3:16, 1 Coríntios 13:4-8",
            questions: "O que significa ser amado incondicionalmente?\nComo o amor de Deus difere do amor humano?\nDe que forma você pode expressar o amor de Deus hoje?",
            application: "Faça algo especial para alguém que você considera difícil de amar.",
            summary: "O amor de Deus é incondicional e deve transformar como amamos os outros.",
            estimatedMinutes: 15,
            order: 1
          },
          {
            id: "tema-ini-2",
            title: "O Poder do Perdão",
            content: "O perdão é central na mensagem cristã. Fomos perdoados por Deus através de Cristo, e somos chamados a perdoar os outros da mesma forma. O perdão liberta tanto quem perdoa quanto quem é perdoado.",
            references: "Mateus 6:14-15, Colossenses 3:13, Efésios 4:32, Mateus 18:21-22",
            questions: "Há alguém que você precisa perdoar?\nO que torna o perdão difícil?\nComo o perdão de Deus motiva seu perdão aos outros?",
            application: "Ore por alguém que o magoou e peça a Deus força para perdoar.",
            summary: "O perdão é central na vida cristã: recebemos e oferecemos o perdão de Deus.",
            estimatedMinutes: 15,
            order: 2
          }
        ]
      },
      {
        id: "tema-moderado",
        level: "moderado",
        name: "Temas Intermediários",
        description: "Mordomia, sofrimento e propósito",
        requiredPlan: "gold",
        order: 2,
        lessons: [
          {
            id: "tema-mod-1",
            title: "O Propósito do Sofrimento",
            content: "O sofrimento faz parte da vida neste mundo caído. Deus usa as dificuldades para nos refinar, desenvolver caráter e nos aproximar dEle. Romanos 8:28 nos assegura que todas as coisas cooperam para o bem.",
            references: "Romanos 8:28, Tiago 1:2-4, 2 Coríntios 1:3-4, 1 Pedro 5:10",
            questions: "Como você tem visto Deus usar dificuldades em sua vida?\nDe que forma o sofrimento pode produzir caráter?\nComo consolar outros com o conforto que você recebeu?",
            application: "Escreva sobre uma dificuldade passada e como Deus trabalhou através dela.",
            summary: "Deus usa o sofrimento para nos refinar e nos aproximar dEle.",
            estimatedMinutes: 25,
            order: 1
          }
        ]
      },
      {
        id: "tema-avancado",
        level: "avancado",
        name: "Temas Avançados",
        description: "Escatologia, apologética e ética",
        requiredPlan: "premium",
        order: 3,
        lessons: [
          {
            id: "tema-ava-1",
            title: "Introdução à Escatologia",
            content: "A escatologia é o estudo dos eventos finais: a segunda vinda de Cristo, a ressurreição, o julgamento final e o estado eterno. Diferentes tradições têm visões sobre o milênio e a ordem dos eventos.",
            references: "1 Tessalonicenses 4:13-18, Apocalipse 20-22, 2 Pedro 3:10-13, 1 Coríntios 15:50-58",
            questions: "Como a esperança da segunda vinda afeta sua vida presente?\nQual a importância prática de estudar escatologia?\nComo viver à luz da eternidade?",
            application: "Medite sobre o céu novo e a nova terra e como isso muda sua perspectiva.",
            summary: "A escatologia estuda os eventos finais e nos dá esperança para o futuro.",
            estimatedMinutes: 35,
            order: 1
          }
        ]
      }
    ]
  },
  {
    id: "personagens-biblicos",
    name: "Personagens Bíblicos",
    description: "Aprenda com a vida de homens e mulheres que marcaram a história bíblica.",
    icon: "people",
    color: "#E74C3C",
    order: 4,
    tracks: [
      {
        id: "pers-iniciante",
        level: "iniciante",
        name: "Heróis da Fé",
        description: "Abraão, Moisés, Davi e outros",
        requiredPlan: "gold",
        order: 1,
        lessons: [
          {
            id: "pers-ini-1",
            title: "Abraão: O Pai da Fé",
            content: "Abraão é chamado de pai da fé porque creu em Deus contra toda esperança. Ele deixou sua terra, esperou décadas pelo filho prometido e estava disposto a sacrificá-lo. Sua fé foi creditada como justiça.",
            references: "Gênesis 12:1-4, Romanos 4:18-22, Hebreus 11:8-12, Gênesis 22:1-14",
            questions: "O que significa deixar sua 'zona de conforto' por Deus?\nComo lidar com promessas que demoram?\nQual área de sua vida precisa de mais fé?",
            application: "Identifique um passo de fé que Deus está pedindo e dê-o esta semana.",
            summary: "Abraão é exemplo de fé, tendo crido em Deus contra toda esperança.",
            estimatedMinutes: 20,
            order: 1
          },
          {
            id: "pers-ini-2",
            title: "Davi: Um Homem Segundo o Coração de Deus",
            content: "Davi foi escolhido por Deus não por sua aparência, mas por seu coração. Ele era adorador, guerreiro e poeta. Mesmo com falhas graves, ele se arrependia e buscava a Deus.",
            references: "1 Samuel 16:7, Atos 13:22, Salmos 51, 2 Samuel 11-12",
            questions: "O que significa ter um coração segundo Deus?\nComo Davi lidou com seus pecados?\nDe que forma você pode cultivar uma vida de adoração?",
            application: "Leia o Salmo 51 como uma oração pessoal de arrependimento.",
            summary: "Davi foi um homem segundo o coração de Deus, conhecido por sua adoração e arrependimento.",
            estimatedMinutes: 20,
            order: 2
          }
        ]
      },
      {
        id: "pers-moderado",
        level: "moderado",
        name: "Mulheres de Valor",
        description: "Ester, Rute, Maria e outras",
        requiredPlan: "gold",
        order: 2,
        lessons: [
          {
            id: "pers-mod-1",
            title: "Ester: Coragem para um Tempo Como Este",
            content: "Ester foi colocada em posição de influência 'para um tempo como este'. Ela arriscou sua vida para salvar seu povo, demonstrando coragem, sabedoria e dependência de Deus através do jejum.",
            references: "Ester 4:14, Ester 4:16, Ester 5-7, Provérbios 31:25",
            questions: "Como Deus tem posicionado você 'para um tempo como este'?\nO que requer coragem em sua vida atualmente?\nComo combinar ação sábia com dependência de Deus?",
            application: "Identifique uma situação que requer coragem e peça sabedoria a Deus.",
            summary: "Ester demonstrou coragem e sabedoria ao confiar na providência de Deus.",
            estimatedMinutes: 25,
            order: 1
          }
        ]
      },
      {
        id: "pers-avancado",
        level: "avancado",
        name: "Apóstolos e Profetas",
        description: "Paulo, Pedro, Elias e outros",
        requiredPlan: "premium",
        order: 3,
        lessons: [
          {
            id: "pers-ava-1",
            title: "Paulo: De Perseguidor a Apóstolo",
            content: "A conversão de Paulo é uma das mais dramáticas da história. De perseguidor da igreja, ele se tornou o maior missionário cristão, escrevendo grande parte do Novo Testamento e estabelecendo igrejas por todo o Império Romano.",
            references: "Atos 9:1-19, Gálatas 1:11-24, Filipenses 3:4-11, 2 Timóteo 4:6-8",
            questions: "O que a transformação de Paulo ensina sobre a graça?\nComo Paulo equilibrou doutrina e prática?\nDe que forma você pode seguir o exemplo de Paulo?",
            application: "Estude uma carta de Paulo observando como ele conecta teologia à vida prática.",
            summary: "Paulo foi transformado de perseguidor em apóstolo, modelo de graça e missão.",
            estimatedMinutes: 35,
            order: 1
          }
        ]
      }
    ]
  },
  {
    id: "livros-biblia",
    name: "Livros da Bíblia",
    description: "Estude cada livro da Bíblia com panoramas, contextos e mensagens principais.",
    icon: "book",
    color: "#F39C12",
    order: 5,
    tracks: [
      {
        id: "livro-iniciante",
        level: "iniciante",
        name: "Evangelhos",
        description: "A vida e ensinamentos de Jesus",
        requiredPlan: "gold",
        order: 1,
        lessons: [
          {
            id: "livro-ini-1",
            title: "Panorama de Mateus",
            content: "Mateus apresenta Jesus como o Messias prometido, o Rei de Israel. Escrito principalmente para judeus, o evangelho conecta Jesus às profecias do Antigo Testamento e estrutura os ensinamentos em cinco grandes discursos.",
            references: "Mateus 1:1, Mateus 5-7, Mateus 28:18-20",
            questions: "Por que é importante que Jesus cumpriu as profecias?\nQual discurso de Jesus mais impacta você?\nComo a Grande Comissão se aplica à sua vida?",
            application: "Leia o Sermão do Monte (Mateus 5-7) em uma sentada.",
            summary: "Mateus apresenta Jesus como o Messias-Rei que cumpriu as profecias do AT.",
            estimatedMinutes: 20,
            order: 1
          },
          {
            id: "livro-ini-2",
            title: "Panorama de João",
            content: "João foi escrito para que creiamos que Jesus é o Cristo, o Filho de Deus. É o mais teológico dos evangelhos, apresentando sete sinais e sete declarações 'Eu Sou' de Jesus.",
            references: "João 20:31, João 1:1-18, João 14:6",
            questions: "Qual das declarações 'Eu Sou' mais ressoa com você?\nComo o Prólogo (1:1-18) resume todo o evangelho?\nO que significa crer para ter vida em Seu nome?",
            application: "Leia um dos sete sinais de João e reflita no seu significado.",
            summary: "João apresenta Jesus como o Filho de Deus para que creiamos e tenhamos vida.",
            estimatedMinutes: 20,
            order: 2
          }
        ]
      },
      {
        id: "livro-moderado",
        level: "moderado",
        name: "Cartas Paulinas",
        description: "Os ensinamentos do apóstolo Paulo",
        requiredPlan: "gold",
        order: 2,
        lessons: [
          {
            id: "livro-mod-1",
            title: "Panorama de Romanos",
            content: "Romanos é a exposição mais sistemática do evangelho no Novo Testamento. Paulo explica a necessidade universal da salvação, a justificação pela fé, a vida no Espírito e as implicações práticas do evangelho.",
            references: "Romanos 1:16-17, Romanos 3:23-24, Romanos 8:28-39, Romanos 12:1-2",
            questions: "Como Romanos explica a justificação pela fé?\nQual a relação entre indicativo (o que Deus fez) e imperativo (o que devemos fazer)?\nComo Romanos 8 traz segurança ao crente?",
            application: "Memorize Romanos 8:28 e medite nele durante a semana.",
            summary: "Romanos apresenta sistematicamente o evangelho da justificação pela fé.",
            estimatedMinutes: 30,
            order: 1
          }
        ]
      },
      {
        id: "livro-avancado",
        level: "avancado",
        name: "Literatura Profética",
        description: "Os profetas maiores e menores",
        requiredPlan: "premium",
        order: 3,
        lessons: [
          {
            id: "livro-ava-1",
            title: "Panorama de Isaías",
            content: "Isaías é chamado de 'Evangelho do Antigo Testamento' por suas profecias messiânicas. O livro divide-se em julgamento (1-39) e consolação (40-66), com o Servo Sofredor em Isaías 53 sendo o ápice profético.",
            references: "Isaías 6:1-8, Isaías 40:1-11, Isaías 53, Isaías 55:1-3",
            questions: "Como Isaías 53 descreve a obra de Cristo?\nQual o significado do chamado de Isaías (cap. 6)?\nDe que forma as profecias de consolação trazem esperança?",
            application: "Leia Isaías 53 e identifique cada aspecto da obra de Cristo mencionado.",
            summary: "Isaías profetiza tanto o julgamento quanto a consolação, culminando no Servo Sofredor.",
            estimatedMinutes: 40,
            order: 1
          }
        ]
      }
    ]
  },
  {
    id: "teologia-pratica",
    name: "Teologia Prática",
    description: "Aplique os princípios bíblicos ao cotidiano: família, trabalho, relacionamentos e sociedade.",
    icon: "practice",
    color: "#1ABC9C",
    order: 6,
    tracks: [
      {
        id: "prat-iniciante",
        level: "iniciante",
        name: "Vida Cristã Diária",
        description: "Aplicando a fé no dia a dia",
        requiredPlan: "gold",
        order: 1,
        lessons: [
          {
            id: "prat-ini-1",
            title: "Fé no Trabalho",
            content: "Todo trabalho honesto é vocação de Deus. Devemos trabalhar como para o Senhor, com excelência, integridade e como testemunho. Nossa profissão é um campo missionário.",
            references: "Colossenses 3:23-24, Provérbios 22:29, 1 Coríntios 10:31, Efésios 6:5-8",
            questions: "Como você pode glorificar a Deus em seu trabalho atual?\nQuais desafios éticos você enfrenta no trabalho?\nDe que forma seu trabalho é um testemunho?",
            application: "Ore por seus colegas de trabalho e busque uma oportunidade de demonstrar o amor de Cristo.",
            summary: "Todo trabalho é vocação de Deus e deve ser feito com excelência para Sua glória.",
            estimatedMinutes: 15,
            order: 1
          },
          {
            id: "prat-ini-2",
            title: "Relacionamentos Saudáveis",
            content: "Fomos criados para relacionamentos. A igreja é uma família onde praticamos os 'uns aos outros': amar, perdoar, encorajar, servir. Relacionamentos saudáveis refletem o amor de Cristo.",
            references: "Hebreus 10:24-25, 1 João 4:7-11, Romanos 12:10, Gálatas 6:2",
            questions: "Como está sua participação na comunidade da fé?\nQuais 'uns aos outros' você precisa praticar mais?\nComo você pode servir sua comunidade esta semana?",
            application: "Encoraje três pessoas diferentes esta semana com palavras ou ações.",
            summary: "Fomos criados para comunidade e devemos praticar amor mútuo.",
            estimatedMinutes: 15,
            order: 2
          }
        ]
      },
      {
        id: "prat-moderado",
        level: "moderado",
        name: "Família Cristã",
        description: "Casamento, filhos e lar",
        requiredPlan: "gold",
        order: 2,
        lessons: [
          {
            id: "prat-mod-1",
            title: "Casamento Bíblico",
            content: "O casamento é uma aliança entre um homem e uma mulher, reflexo da relação entre Cristo e a Igreja. Maridos são chamados a amar sacrificialmente, esposas a respeitar, ambos a servir um ao outro.",
            references: "Efésios 5:22-33, Gênesis 2:24, 1 Pedro 3:1-7, Colossenses 3:18-19",
            questions: "Como o casamento reflete Cristo e a Igreja?\nQuais são os maiores desafios no casamento hoje?\nDe que forma você pode investir mais em seu relacionamento?",
            application: "Se casado, planeje algo especial para seu cônjuge. Se solteiro, ore por casais que você conhece.",
            summary: "O casamento é aliança sagrada que reflete Cristo e a Igreja.",
            estimatedMinutes: 25,
            order: 1
          }
        ]
      },
      {
        id: "prat-avancado",
        level: "avancado",
        name: "Ética e Sociedade",
        description: "Fé e questões contemporâneas",
        requiredPlan: "premium",
        order: 3,
        lessons: [
          {
            id: "prat-ava-1",
            title: "Ética Cristã Contemporânea",
            content: "A ética cristã é baseada no caráter de Deus revelado nas Escrituras. Devemos aplicar princípios bíblicos a questões contemporâneas com sabedoria, amor e firmeza, sendo sal e luz no mundo.",
            references: "Mateus 5:13-16, Romanos 12:2, Miquéias 6:8, 1 Pedro 3:15",
            questions: "Como discernir a vontade de Deus em questões complexas?\nQual o equilíbrio entre verdade e amor?\nComo ser sal e luz sem comprometer a fé?",
            application: "Pesquise uma questão ética atual e desenvolva uma resposta bíblica fundamentada.",
            summary: "A ética cristã aplica princípios bíblicos com sabedoria às questões contemporâneas.",
            estimatedMinutes: 35,
            order: 1
          }
        ]
      }
    ]
  }
];

async function seedStudyModules() {
  console.log("Starting study modules seed...");
  
  for (const moduleData of MODULES_DATA) {
    console.log(`Creating module: ${moduleData.name}`);
    
    const existingModule = await db.select().from(studyModules).where(eq(studyModules.id, moduleData.id)).limit(1);
    
    if (existingModule.length > 0) {
      console.log(`Module ${moduleData.id} already exists, skipping...`);
      continue;
    }
    
    await db.insert(studyModules).values({
      id: moduleData.id,
      name: moduleData.name,
      description: moduleData.description,
      icon: moduleData.icon,
      color: moduleData.color,
      order: moduleData.order,
      isActive: true,
    });
    
    for (const trackData of moduleData.tracks) {
      console.log(`  Creating track: ${trackData.name}`);
      
      await db.insert(studyTracks).values({
        id: trackData.id,
        moduleId: moduleData.id,
        level: trackData.level,
        name: trackData.name,
        description: trackData.description,
        requiredPlan: trackData.requiredPlan,
        order: trackData.order,
      });
      
      for (const lessonData of trackData.lessons) {
        console.log(`    Creating lesson: ${lessonData.title}`);
        
        await db.insert(studyLessons).values({
          id: lessonData.id,
          trackId: trackData.id,
          order: lessonData.order,
          title: lessonData.title,
          content: lessonData.content,
          references: lessonData.references,
          questions: lessonData.questions,
          application: lessonData.application,
          summary: lessonData.summary,
          estimatedMinutes: lessonData.estimatedMinutes,
        });
      }
    }
  }
  
  console.log("Study modules seed completed!");
  
  const moduleCount = await db.select().from(studyModules);
  const trackCount = await db.select().from(studyTracks);
  const lessonCount = await db.select().from(studyLessons);
  
  console.log(`Summary: ${moduleCount.length} modules, ${trackCount.length} tracks, ${lessonCount.length} lessons`);
}

seedStudyModules()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
