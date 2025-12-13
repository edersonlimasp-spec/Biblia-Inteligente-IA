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

// MÓDULO 6: Soteriologia Sistemática
const MODULO_6_SOTERIOLOGIA: ModuleData = {
  id: "nivel2-mod6-soteriologia",
  name: "Soteriologia Sistemática",
  description: "Estudo sistemático da doutrina da salvação",
  icon: "Heart",
  color: "#EC4899",
  order: 21,
  tracks: [
    {
      id: "track-n2m6-moderado",
      level: "moderado",
      name: "A Doutrina da Salvação",
      description: "Compreendendo os aspectos da obra salvadora de Deus",
      requiredPlan: "premium",
      order: 1,
      lessons: createLessons("n2m6", [
        {
          title: "Eleição e Predestinação",
          content: `A salvação começa na eternidade, antes do tempo. "Nos escolheu nele antes da fundação do mundo" (Efésios 1:4). Deus não reagiu ao pecado; Ele planejou a salvação desde sempre. Este é o mistério da eleição.

Eleição significa que Deus escolheu alguns para salvação não com base em mérito previsto, mas por Sua graça soberana. "Não depende do que quer, nem do que corre, mas de Deus, que se compadece" (Romanos 9:16). A iniciativa é totalmente de Deus.

Predestinação significa que Deus determinou de antemão o destino dos eleitos. "Os que de antemão conheceu, também os predestinou para serem conformes à imagem de seu Filho" (Romanos 8:29). O destino final dos escolhidos está seguro porque Deus o garantiu.

Estas doutrinas não eliminam responsabilidade humana. A Bíblia afirma ambas: soberania divina e responsabilidade humana. "Todo aquele que invocar o nome do Senhor será salvo" (Romanos 10:13). Devemos pregar, e as pessoas devem crer. Mas a fé mesma é dom de Deus.`,
          references: "Efésios 1:3-14; Romanos 8:28-30; 9:6-24; João 6:37-44; Atos 13:48",
          questions: [
            "1. O que é eleição?",
            "2. O que é predestinação?",
            "3. Por que Deus escolhe pessoas?",
            "4. Como eleição e responsabilidade se relacionam?",
            "5. Como essa doutrina afeta sua segurança?"
          ],
          application: "Se você crê em Cristo, foi porque Deus o escolheu. Isso deve produzir humildade (não mérito) e gratidão (pura graça).",
          summary: "Eleição e predestinação ensinam que Deus soberanamente escolheu salvar alguns por graça, garantindo sua salvação desde a eternidade."
        },
        {
          title: "Chamado Eficaz",
          content: `O chamado eficaz é a obra do Espírito Santo que traz os eleitos à fé. Há um chamado geral no evangelho a todos; há um chamado eficaz que produz resposta salvadora nos escolhidos.

Paulo distingue os dois. "Aos que chamou, a estes também justificou" (Romanos 8:30). Este chamado sempre resulta em justificação. O chamado geral pode ser rejeitado; o chamado eficaz atinge seu objetivo. É irresistível, não porque força contra a vontade, mas porque transforma a vontade.

Jesus ensinou: "Ninguém pode vir a mim, se o Pai que me enviou o não trouxer" (João 6:44). E: "Todo o que o Pai me dá virá a mim" (João 6:37). Os que o Pai atrai certamente vêm. O chamado eficaz assegura a resposta.

O chamado eficaz opera através da Palavra e do Espírito. A Palavra é proclamada; o Espírito abre o coração (Atos 16:14). Lídia ouviu Paulo, e "o Senhor lhe abriu o coração para atender às coisas que Paulo dizia." A conjunção de Palavra e Espírito produz fé.`,
          references: "Romanos 8:30; João 6:37-44; Atos 16:14; 2 Tessalonicenses 2:13-14; 1 Coríntios 1:23-24",
          questions: [
            "1. Qual a diferença entre chamado geral e eficaz?",
            "2. Por que o chamado eficaz é 'irresistível'?",
            "3. Como o chamado opera através da Palavra e do Espírito?",
            "4. O que aconteceu com Lídia em Atos 16?",
            "5. Você pode identificar o chamado eficaz em sua conversão?"
          ],
          application: "Agradeça a Deus por tê-lo chamado eficazmente. Ore pelos não-crentes que você conhece, pedindo que Deus os chame também.",
          summary: "O chamado eficaz é a obra do Espírito que traz os eleitos à fé através da Palavra, transformando suas vontades para responder ao evangelho."
        },
        {
          title: "Regeneração",
          content: `Regeneração é o ato soberano de Deus que dá nova vida espiritual ao pecador morto. É o novo nascimento que Jesus disse a Nicodemos ser necessário: "Se alguém não nascer de novo, não pode ver o reino de Deus" (João 3:3).

Regeneração é necessária porque estamos "mortos em delitos e pecados" (Efésios 2:1). Mortos não podem se ressuscitar. "O que é nascido da carne é carne" - a natureza humana não pode produzir vida espiritual. Precisamos nascer "do Espírito" (João 3:6).

Regeneração é obra monergística - Deus age sozinho. "Deus, sendo rico em misericórdia... nos vivificou juntamente com Cristo" (Efésios 2:4-5). Nós não escolhemos nascer fisicamente; também não nos regeneramos. Deus nos dá vida; então cremos.

A regeneração transforma fundamentalmente. Deus dá "novo coração" e "novo espírito" (Ezequiel 36:26). A lei é escrita no coração (Jeremias 31:33). O que antes era odioso (Deus, santidade) torna-se amável. O que era amável (pecado) torna-se odioso. É recriação.`,
          references: "João 3:1-8; Ezequiel 36:26-27; Efésios 2:1-5; Tito 3:5; 1 Pedro 1:23; 1 João 3:9",
          questions: [
            "1. O que é regeneração?",
            "2. Por que é necessária?",
            "3. O que significa ser obra 'monergística'?",
            "4. Como a regeneração transforma a pessoa?",
            "5. Você pode identificar evidências de regeneração em sua vida?"
          ],
          application: "Se você é regenerado, tem novo coração. Examine: você ama o que Deus ama? Odeia o que Ele odeia? Esse é o teste da vida nova.",
          summary: "Regeneração é o novo nascimento onde Deus dá vida espiritual ao pecador morto, transformando seu coração para amar a Deus e odiar o pecado."
        },
        {
          title: "Conversão: Arrependimento e Fé",
          content: `Conversão é a resposta humana à regeneração, consistindo em arrependimento e fé. São dois lados da mesma moeda - virar-se do pecado (arrependimento) e virar-se para Cristo (fé).

Arrependimento (metanoia) significa mudança de mente que resulta em mudança de direção. Não é apenas remorso ou medo de consequências. É reconhecer o pecado como ofensa contra Deus e desejar abandoná-lo. "Arrependei-vos, pois, e convertei-vos para serem cancelados os vossos pecados" (Atos 3:19).

Fé (pistis) é confiar em Cristo para salvação. Inclui conhecimento (saber quem Cristo é e o que fez), assentimento (concordar que é verdade) e confiança (depender pessoalmente dEle). Conhecimento e assentimento sem confiança pessoal não salvam.

Arrependimento e fé são dons de Deus, não méritos humanos. "Deus concedeu também aos gentios o arrependimento para vida" (Atos 11:18). "Pela graça sois salvos, mediante a fé; e isto não vem de vós; é dom de Deus" (Efésios 2:8). Deus capacita a resposta que exige.`,
          references: "Atos 3:19; 11:18; 20:21; Marcos 1:15; Efésios 2:8-9; Romanos 10:9-10",
          questions: [
            "1. O que é conversão?",
            "2. O que é arrependimento bíblico?",
            "3. Quais são os elementos da fé salvadora?",
            "4. Por que arrependimento e fé são dons?",
            "5. Você experimentou conversão genuína?"
          ],
          application: "Examine sua conversão. Houve arrependimento real do pecado? Há confiança pessoal em Cristo? Cultive ambos continuamente.",
          summary: "Conversão é a resposta humana à regeneração, consistindo em arrependimento (virar-se do pecado) e fé (confiar em Cristo), ambos dons de Deus."
        },
        {
          title: "Justificação",
          content: `Justificação é o ato judicial de Deus pelo qual Ele declara o pecador justo com base na obra de Cristo. Não é tornar justo (santificação), mas declarar justo. É termo legal, de tribunal.

A justificação é pela fé somente. "O homem é justificado pela fé, sem as obras da lei" (Romanos 3:28). A fé não é meritória; é a mão vazia que recebe a justiça de Cristo. Obras seguem como fruto, não como base da justificação.

A base da justificação é a justiça de Cristo imputada a nós. "Aquele que não conheceu pecado, ele o fez pecado por nós; para que nele fôssemos feitos justiça de Deus" (2 Coríntios 5:21). Nossos pecados foram imputados a Cristo; Sua justiça é imputada a nós. Dupla imputação.

A justificação é completa e irreversível. Não há graus de justificação; somos tão justos diante de Deus quanto Cristo é. "Quem intentará acusação contra os eleitos de Deus? É Deus quem os justifica" (Romanos 8:33). Nenhuma condenação resta para os que estão em Cristo.`,
          references: "Romanos 3:21-28; 4:1-8; 5:1; 8:1, 33-34; 2 Coríntios 5:21; Gálatas 2:16",
          questions: [
            "1. O que é justificação?",
            "2. Qual a base da justificação?",
            "3. Qual o papel da fé na justificação?",
            "4. O que é dupla imputação?",
            "5. Por que a justificação dá plena segurança?"
          ],
          application: "Você está tão justo diante de Deus quanto Cristo! Viva na liberdade dessa verdade. Não há condenação para você.",
          summary: "Justificação é a declaração legal de Deus de que o pecador é justo, com base na justiça de Cristo imputada, recebida pela fé somente."
        },
        {
          title: "Adoção",
          content: `Adoção é o ato gracioso de Deus pelo qual recebe os justificados em Sua família como filhos. Não somos apenas perdoados (justificação) e transformados (regeneração); somos feitos filhos de Deus (adoção).

A adoção confere nova identidade. "A todos quantos o receberam, deu-lhes o poder de serem feitos filhos de Deus" (João 1:12). Éramos estranhos e inimigos; agora somos família. Deus é nosso Pai; Cristo é nosso irmão mais velho; outros crentes são irmãos.

A adoção confere novos privilégios. "E, se filhos, também herdeiros, herdeiros de Deus e co-herdeiros com Cristo" (Romanos 8:17). Temos acesso ao Pai em oração, cuidado providencial, disciplina amorosa, herança eterna. Tudo o que pertence ao Filho é nosso também.

O Espírito confirma nossa adoção. "Recebestes o Espírito de adoção de filhos, pelo qual clamamos: Aba, Pai. O próprio Espírito testifica com o nosso espírito que somos filhos de Deus" (Romanos 8:15-16). O testemunho interno do Espírito dá certeza de filiação.`,
          references: "João 1:12-13; Romanos 8:14-17; Gálatas 4:4-7; Efésios 1:5; 1 João 3:1-2",
          questions: [
            "1. O que é adoção?",
            "2. Que nova identidade a adoção confere?",
            "3. Quais são os privilégios da adoção?",
            "4. Como o Espírito confirma nossa adoção?",
            "5. Como viver consciente de sua identidade como filho?"
          ],
          application: "Você é filho de Deus! Ore hoje chamando-O de 'Pai' (Abba). Relacione-se com Ele com a intimidade de filho amado.",
          summary: "Adoção é Deus nos recebendo em Sua família como filhos, conferindo nova identidade, privilégios de herdeiros e testemunho do Espírito."
        },
        {
          title: "Santificação",
          content: `Santificação é o processo pelo qual Deus transforma os crentes progressivamente à semelhança de Cristo. Enquanto justificação é ato instantâneo (declaração legal), santificação é processo contínuo (transformação real).

Há aspecto definitivo (posicional) da santificação. "Fostes santificados" (1 Coríntios 6:11) - tempo passado. Em Cristo, fomos separados para Deus. Por isso Paulo chama os coríntios problemáticos de "santos" - é posição, não perfeição.

O aspecto progressivo é o crescimento diário em santidade. "Crescei na graça e no conhecimento de nosso Senhor e Salvador Jesus Cristo" (2 Pedro 3:18). Pecados são mortificados; virtudes são cultivadas. É trabalho de toda a vida, nunca completo aqui.

A santificação é obra sinergística - Deus e crente cooperam. "Desenvolvei a vossa salvação com temor e tremor; porque Deus é quem opera em vós" (Filipenses 2:12-13). Deus capacita; nós nos esforçamos. Graça e esforço não são opostos; graça produz esforço.`,
          references: "1 Tessalonicenses 4:3; 5:23; Filipenses 2:12-13; 2 Pedro 3:18; Hebreus 12:14; Romanos 6:1-14",
          questions: [
            "1. O que é santificação?",
            "2. Qual a diferença entre justificação e santificação?",
            "3. O que é santificação posicional versus progressiva?",
            "4. Como Deus e o crente cooperam na santificação?",
            "5. Em que área você está crescendo em santidade?"
          ],
          application: "Identifique um pecado que você precisa mortificar e uma virtude que precisa cultivar. Trabalhe nisso com a ajuda do Espírito.",
          summary: "Santificação é o processo de tornar-se progressivamente como Cristo, cooperando com a graça de Deus na mortificação do pecado e cultivo de virtude."
        },
        {
          title: "Perseverança dos Santos",
          content: `A perseverança dos santos ensina que aqueles verdadeiramente salvos perseverarão em fé até o fim. Não são salvos por perseverarem, mas perseveram porque são salvos. Deus preserva Seus filhos.

Jesus prometeu: "Todo o que o Pai me dá virá a mim; e o que vem a mim de maneira nenhuma o lançarei fora" (João 6:37). E: "As minhas ovelhas ouvem a minha voz... e dou-lhes a vida eterna, e nunca hão de perecer" (João 10:27-28). A segurança está na mão de Cristo.

Paulo confirma: "Estou certo de que aquele que em vós começou boa obra há de aperfeiçoá-la até ao dia de Cristo Jesus" (Filipenses 1:6). E: "Nenhuma condenação há para os que estão em Cristo Jesus" (Romanos 8:1). O que Deus começou, Ele completa.

Perseverança não significa que não podemos cair temporariamente, mas que não cairemos final e totalmente. Os que parecem cair completamente nunca eram realmente salvos (1 João 2:19). A verdadeira fé persevera porque Deus a sustenta.`,
          references: "João 6:37-40; 10:27-30; Romanos 8:28-39; Filipenses 1:6; 1 Pedro 1:3-5; 1 João 2:19",
          questions: [
            "1. O que ensina a doutrina da perseverança?",
            "2. Quem preserva os santos?",
            "3. O que acontece com os que parecem cair completamente?",
            "4. Como perseverança difere de perfeição?",
            "5. Como essa doutrina traz segurança?"
          ],
          application: "Sua salvação está segura nas mãos de Cristo. Descanse nessa verdade. Ao mesmo tempo, examine se há fruto de fé genuína.",
          summary: "Os verdadeiramente salvos perseverarão em fé até o fim porque Deus os preserva - segurança baseada na fidelidade de Deus, não na nossa."
        },
        {
          title: "Glorificação",
          content: `Glorificação é o estágio final da salvação quando seremos completamente conformados à imagem de Cristo, livres de toda presença e efeito do pecado. É a consumação de tudo que Deus está fazendo em nós.

A glorificação ocorrerá na ressurreição. "Quando ele se manifestar, seremos semelhantes a ele" (1 João 3:2). Nossos corpos serão transformados como o corpo ressurreto de Cristo. "Somos transformados... de glória em glória" (2 Coríntios 3:18).

Na glorificação, a santificação estará completa. Não apenas perdoados e sendo transformados, mas perfeitamente santos. Não haverá mais luta contra o pecado. Seremos o que sempre deveríamos ter sido - plenamente humanos, plenamente como Cristo.

A glorificação é certa porque Deus a predestinou. "Os que de antemão conheceu, também os predestinou... E aos que predestinou, a esses também chamou; e aos que chamou, a esses também justificou; e aos que justificou, a esses também glorificou" (Romanos 8:29-30). Glorificação está em tempo passado - tão certa quanto se já tivesse acontecido!`,
          references: "Romanos 8:17-30; 1 Coríntios 15:42-54; Filipenses 3:20-21; 1 João 3:2; Colossenses 3:4",
          questions: [
            "1. O que é glorificação?",
            "2. Quando ocorrerá a glorificação?",
            "3. O que acontecerá com nossos corpos?",
            "4. Por que a glorificação é certa?",
            "5. Como essa esperança afeta sua vida presente?"
          ],
          application: "Você será glorificado! Deixe essa esperança motivar santidade agora e consolar em sofrimentos presentes.",
          summary: "Glorificação é o estágio final da salvação onde seremos completamente conformados a Cristo, corpos ressurretos, livres de todo pecado."
        },
        {
          title: "A Ordem da Salvação",
          content: `A "ordem da salvação" (ordo salutis) é a sequência lógica dos aspectos da salvação. Embora algumas ocorram simultaneamente no tempo, há ordem lógica: eleição, chamado, regeneração, conversão, justificação, adoção, santificação, perseverança, glorificação.

Eleição é eterna - antes da fundação do mundo. Chamado, regeneração, conversão, justificação e adoção ocorrem simultaneamente no tempo, mas logicamente: Deus chama, regenera (dá vida), o regenerado crê (conversão), o crente é declarado justo (justificação) e feito filho (adoção).

Santificação é processo que segue, durando toda a vida. Perseverança descreve a continuidade da fé genuína. Glorificação é consumação final na ressurreição.

Esta ordem mostra a iniciativa divina e a responsabilidade humana. Deus elege, chama, regenera - isso é graça soberana. O regenerado crê - isso é resposta humana (embora capacitada). Deus justifica, adota, santifica, preserva, glorifica - de início a fim, salvação é do Senhor.`,
          references: "Romanos 8:28-30; Efésios 1:3-14; 2:1-10; João 6:37-44; 1 Pedro 1:2-5",
          questions: [
            "1. O que é a 'ordem da salvação'?",
            "2. Quais aspectos são eternos, quais temporais?",
            "3. Quais ocorrem simultaneamente?",
            "4. O que essa ordem revela sobre Deus e o homem?",
            "5. Como essa visão global fortalece sua fé?"
          ],
          application: "Revise cada aspecto da salvação. Agradeça a Deus por cada um. Maravilhe-se com o plano completo de redenção.",
          summary: "A ordem da salvação mostra a sequência lógica da obra salvadora: da eleição eterna à glorificação final, toda iniciada e completada por Deus."
        }
      ])
    }
  ]
};

// MÓDULO 7: Eclesiologia Prática
const MODULO_7_ECLESIOLOGIA: ModuleData = {
  id: "nivel2-mod7-eclesiologia",
  name: "Eclesiologia Prática",
  description: "A doutrina da Igreja e sua vida prática",
  icon: "Church",
  color: "#14B8A6",
  order: 22,
  tracks: [
    {
      id: "track-n2m7-moderado",
      level: "moderado",
      name: "A Igreja de Cristo",
      description: "Natureza, estrutura e missão da Igreja",
      requiredPlan: "premium",
      order: 1,
      lessons: createLessons("n2m7", [
        {
          title: "A Natureza da Igreja",
          content: `A palavra "igreja" (ekklesia) significa "assembleia chamada para fora." No Novo Testamento, refere-se ao povo de Deus reunido em Cristo. Não é edifício ou instituição primariamente, mas pessoas.

A Igreja é universal e local. A Igreja universal é o conjunto de todos os verdadeiros crentes de todos os tempos e lugares - invisível aos olhos humanos, conhecida por Deus. A igreja local é a expressão visível em comunidades específicas que se reúnem para adoração, ensino e comunhão.

A Igreja pertence a Cristo. "Edificarei a minha igreja" (Mateus 16:18). Ele a comprou com Seu sangue (Atos 20:28). É "corpo de Cristo" (1 Coríntios 12:27), "templo do Espírito" (1 Coríntios 3:16), "noiva de Cristo" (Efésios 5:25-27). Estas imagens revelam intimidade e pertencimento.

A Igreja é santa, não porque seus membros são perfeitos, mas porque foi separada para Deus e está sendo santificada por Cristo. Paulo escreve aos "santos" em Corinto (1 Coríntios 1:2), apesar de seus muitos problemas. Santidade é posição e processo.`,
          references: "Mateus 16:18; Efésios 1:22-23; 5:25-27; 1 Coríntios 12:12-27; 1 Pedro 2:9-10",
          questions: [
            "1. O que significa 'ekklesia'?",
            "2. Qual a diferença entre Igreja universal e local?",
            "3. A quem pertence a Igreja?",
            "4. O que significam as imagens 'corpo', 'templo', 'noiva'?",
            "5. Em que sentido a Igreja é santa?"
          ],
          application: "Valorize sua igreja local como expressão visível da Igreja de Cristo. Você não pode amar a Igreja invisível e negligenciar a visível.",
          summary: "A Igreja é o povo de Deus reunido em Cristo, expressa universal e localmente, pertencendo a Cristo como Seu corpo, templo e noiva."
        },
        {
          title: "As Marcas da Verdadeira Igreja",
          content: `Como identificar uma igreja verdadeira? Os reformadores identificaram marcas essenciais: pregação fiel da Palavra, administração correta dos sacramentos e exercício da disciplina.

A pregação da Palavra é fundamental. "A fé vem pelo ouvir, e o ouvir pela palavra de Cristo" (Romanos 10:17). Igreja sem Palavra pregada não gera fé. A Bíblia deve ser central, não opiniões humanas. Onde a Palavra não reina, ali não está a Igreja de Cristo.

Os sacramentos (batismo e Ceia do Senhor) são sinais visíveis do evangelho invisível. Batismo declara união com Cristo em Sua morte e ressurreição. A Ceia proclama a morte do Senhor até que Ele venha. Administrados conforme a instituição de Cristo, confirmam e fortalecem a fé.

A disciplina protege a pureza e testemunho da Igreja. "Se teu irmão pecar... se não os escutar, dize-o à igreja" (Mateus 18:15-17). Sem disciplina, a distinção entre Igreja e mundo desaparece. Disciplina corrige em amor, visando restauração, não punição.`,
          references: "Romanos 10:14-17; Mateus 28:19-20; 1 Coríntios 11:23-26; Mateus 18:15-20; 1 Coríntios 5:1-13",
          questions: [
            "1. Quais são as marcas da verdadeira Igreja?",
            "2. Por que a pregação da Palavra é essencial?",
            "3. Qual o papel dos sacramentos?",
            "4. Por que a disciplina é necessária?",
            "5. Como sua igreja se compara a essas marcas?"
          ],
          application: "Avalie sua igreja local pelas marcas bíblicas. Ore por ela e contribua para que cresça nessas áreas.",
          summary: "As marcas da verdadeira Igreja são: pregação fiel da Palavra, administração correta dos sacramentos e exercício amoroso da disciplina."
        },
        {
          title: "Ofícios na Igreja: Presbíteros",
          content: `O Novo Testamento estabelece dois ofícios permanentes na igreja local: presbíteros (também chamados bispos ou pastores) e diáconos. Presbíteros lideram e ensinam; diáconos servem.

Presbítero (presbyteros), bispo (episkopos) e pastor (poimen) são termos para o mesmo ofício. Atos 20:17, 28 usa os três para o mesmo grupo. Presbítero enfatiza maturidade; bispo, supervisão; pastor, cuidado. São funções do mesmo líder espiritual.

As qualificações para presbíteros estão em 1 Timóteo 3:1-7 e Tito 1:5-9. Incluem: irrepreensível, marido de uma só mulher, temperante, prudente, hospitaleiro, apto para ensinar, não dado ao vinho, não violento, não ganancioso, bom líder do lar, não neófito, boa reputação externa.

As funções incluem: ensinar/pregar (1 Timóteo 5:17), pastorear/cuidar (1 Pedro 5:1-4), governar/liderar (Hebreus 13:17), orar pelos enfermos (Tiago 5:14). Presbíteros devem ser plurais em cada igreja (Atos 14:23) e são responsáveis perante Cristo, o Chefe Supremo da Igreja.`,
          references: "Atos 20:17, 28; 1 Timóteo 3:1-7; Tito 1:5-9; 1 Pedro 5:1-4; Hebreus 13:17",
          questions: [
            "1. Quais os dois ofícios permanentes na igreja?",
            "2. Presbítero, bispo e pastor são ofícios diferentes?",
            "3. Quais são as qualificações para presbíteros?",
            "4. Quais são as funções dos presbíteros?",
            "5. Como você pode apoiar os presbíteros de sua igreja?"
          ],
          application: "Ore pelos presbíteros/pastores de sua igreja. Obedeça sua liderança. Encoraje-os em seu trabalho árduo.",
          summary: "Presbíteros (bispos/pastores) são líderes espirituais qualificados que ensinam, pastoreiam, governam e oram pela igreja."
        },
        {
          title: "Ofícios na Igreja: Diáconos",
          content: `Diáconos são o segundo ofício na igreja local. O termo grego diakonos significa "servo" ou "ministro." Enquanto presbíteros focam em Palavra e oração, diáconos cuidam de necessidades práticas.

A origem do diaconato está em Atos 6:1-7. Os apóstolos não podiam deixar a Palavra para "servir às mesas." Sete homens foram escolhidos para este ministério prático. Isso libertou os apóstolos para seu chamado primário e atendeu as viúvas necessitadas.

As qualificações para diáconos estão em 1 Timóteo 3:8-13. São semelhantes às de presbíteros em caráter: dignos, não de língua dobre, não dados a muito vinho, não cobiçosos, mantendo o mistério da fé com consciência limpa, provados primeiro, irrepreensíveis.

A diferença chave é que "apto para ensinar" não é requisito para diáconos como é para presbíteros. Diáconos servem; presbíteros ensinam e governam. Ambos os ofícios são importantes. A igreja funciona bem quando cada um cumpre seu papel.`,
          references: "Atos 6:1-7; 1 Timóteo 3:8-13; Romanos 16:1; Filipenses 1:1",
          questions: [
            "1. O que significa 'diácono'?",
            "2. Qual a origem do diaconato?",
            "3. Quais as qualificações para diáconos?",
            "4. Qual a diferença entre presbíteros e diáconos?",
            "5. Você tem dons para servir como diácono?"
          ],
          application: "Mesmo não sendo diácono oficial, todo cristão deve ter espírito de servo. Busque maneiras de servir sua igreja praticamente.",
          summary: "Diáconos são servos qualificados que cuidam das necessidades práticas da igreja, libertando presbíteros para Palavra e oração."
        },
        {
          title: "O Batismo",
          content: `O batismo é sacramento instituído por Cristo que marca a entrada visível na comunidade da aliança. "Ide, fazei discípulos de todas as nações, batizando-os em nome do Pai, e do Filho, e do Espírito Santo" (Mateus 28:19).

O batismo simboliza união com Cristo em Sua morte e ressurreição. "Fomos sepultados com ele pelo batismo na morte; para que, como Cristo ressuscitou dos mortos... assim andemos nós também em novidade de vida" (Romanos 6:4). A imersão (se praticada) representa esse morrer e ressurgir.

O batismo não salva por si mesmo, mas é sinal e selo da salvação. Assim como a circuncisão não salvava no AT mas marcava pertencimento ao povo da aliança, o batismo marca pertencimento à nova comunidade em Cristo.

O batismo é de uma só vez. "Há... um só batismo" (Efésios 4:5). Não se repete. Mesmo quem se afasta e retorna não é rebatizado. O batismo marca o início da vida cristã; a Ceia marca a continuação.`,
          references: "Mateus 28:19-20; Romanos 6:3-4; Colossenses 2:11-12; Atos 2:38-41; Efésios 4:5",
          questions: [
            "1. Quem instituiu o batismo?",
            "2. O que o batismo simboliza?",
            "3. O batismo salva?",
            "4. Por que o batismo é realizado uma só vez?",
            "5. Você foi batizado? Se não, por que não?"
          ],
          application: "Se você é crente mas não foi batizado, busque o batismo em sua igreja. É mandamento de Cristo, não opcional.",
          summary: "O batismo é sacramento de iniciação que simboliza união com Cristo em Sua morte e ressurreição, marcando entrada na comunidade visível."
        },
        {
          title: "A Ceia do Senhor",
          content: `A Ceia do Senhor é sacramento instituído por Cristo na noite de Sua traição. "Fazei isto em memória de mim" (Lucas 22:19). É memorial regular que proclama a morte do Senhor até Sua volta.

Os elementos são pão e vinho (ou suco de uva). O pão representa o corpo de Cristo dado por nós. O cálice representa Seu sangue derramado para remissão de pecados. Participamos fisicamente de símbolos que apontam para realidades espirituais.

A Ceia é comunhão com Cristo e uns com os outros. "O cálice da bênção que abençoamos não é a comunhão do sangue de Cristo? O pão que partimos não é a comunhão do corpo de Cristo?" (1 Coríntios 10:16). É refeição familiar dos redimidos.

Paulo adverte sobre participação indigna. "Examine-se, pois, o homem a si mesmo, e assim coma deste pão e beba deste cálice" (1 Coríntios 11:28). Não significa ser perfeito, mas examinar-se, confessar pecado e vir em fé. A Ceia é para pecadores perdoados, não santos perfeitos.`,
          references: "Mateus 26:26-29; Lucas 22:14-20; 1 Coríntios 10:16-17; 11:23-32",
          questions: [
            "1. Quem instituiu a Ceia do Senhor?",
            "2. O que os elementos representam?",
            "3. O que significa 'comunhão' na Ceia?",
            "4. O que é participação indigna?",
            "5. Com que frequência você participa da Ceia?"
          ],
          application: "Na próxima Ceia, examine-se previamente. Confesse pecados. Venha com fé e gratidão pelo corpo e sangue de Cristo.",
          summary: "A Ceia do Senhor é memorial regular onde participamos de pão e vinho representando o corpo e sangue de Cristo, em comunhão com Ele e uns com outros."
        },
        {
          title: "A Adoração Cristã",
          content: `Adoração é a resposta apropriada do ser humano a Deus. No contexto da igreja, é a reunião dos santos para encontrar Deus através de Sua Palavra, louvor, oração e sacramentos.

A adoração é em espírito e verdade. "Os verdadeiros adoradores adorarão o Pai em espírito e em verdade" (João 4:23). Em espírito - interior, sincera, pelo Espírito Santo. Em verdade - conforme a revelação de Deus, não invenções humanas.

Os elementos da adoração neotestamentária incluem: leitura das Escrituras (1 Timóteo 4:13), pregação (2 Timóteo 4:2), cânticos (Efésios 5:19), orações (1 Timóteo 2:1-2), ofertas (1 Coríntios 16:1-2), sacramentos. Estes elementos são prescritos, não inventados.

A adoração é coletiva e individual, mas a ênfase do NT é na reunião. "Não deixemos de congregar-nos" (Hebreus 10:25). Há algo que acontece quando o povo de Deus se reúne que não pode ser reproduzido individualmente. Somos corpo, não indivíduos isolados.`,
          references: "João 4:23-24; Colossenses 3:16; Hebreus 10:24-25; Atos 2:42; 1 Coríntios 14:26",
          questions: [
            "1. O que é adoração?",
            "2. O que significa adorar em espírito e verdade?",
            "3. Quais são os elementos da adoração bíblica?",
            "4. Por que a adoração coletiva é importante?",
            "5. Como você pode melhorar sua participação na adoração?"
          ],
          application: "Prepare-se para o culto. Venha com expectativa de encontrar Deus. Participe ativamente, não passivamente.",
          summary: "A adoração cristã é resposta a Deus em espírito e verdade, incluindo elementos prescritos na Escritura, vivida coletivamente como corpo de Cristo."
        },
        {
          title: "Comunhão e Edificação Mútua",
          content: `A vida cristã não é individualista; é comunitária. "Perseveravam... na comunhão" (Atos 2:42). Koinonia (comunhão) significa participação comum, parceria, compartilhar juntos. Somos família.

A comunhão inclui cuidado mútuo. "Levai as cargas uns dos outros, e assim cumprireis a lei de Cristo" (Gálatas 6:2). Quando um membro sofre, todos sofrem com ele (1 Coríntios 12:26). Não somos espectadores, mas participantes ativos na vida uns dos outros.

A edificação mútua é responsabilidade de todos. "Consideremos uns aos outros para nos estimularmos ao amor e às boas obras" (Hebreus 10:24). Cada crente tem algo a contribuir. O corpo cresce quando "cada parte faz a sua obra" (Efésios 4:16).

Os "uns aos outros" do NT são abundantes: amem uns aos outros, sirvam uns aos outros, perdoem uns aos outros, exortem uns aos outros, orem uns pelos outros, confessem pecados uns aos outros. Cristianismo é vida em comunidade.`,
          references: "Atos 2:42-47; Gálatas 6:1-2; Efésios 4:11-16; Hebreus 10:24-25; 1 João 3:16-18",
          questions: [
            "1. O que é koinonia?",
            "2. Por que a vida cristã é comunitária?",
            "3. O que significa edificação mútua?",
            "4. Liste alguns 'uns aos outros' do NT.",
            "5. Como você está praticando comunhão em sua igreja?"
          ],
          application: "Escolha um 'uns aos outros' para praticar esta semana. Seja intencional em viver comunidade, não apenas frequentar cultos.",
          summary: "Comunhão cristã é vida compartilhada em comunidade, cuidando uns dos outros, edificando mutuamente, praticando os 'uns aos outros' bíblicos."
        },
        {
          title: "Missão da Igreja",
          content: `A Igreja existe para adorar a Deus e fazer discípulos. A Grande Comissão define sua missão: "Fazei discípulos de todas as nações, batizando-os... ensinando-os a guardar todas as coisas" (Mateus 28:19-20). Toda igreja deve ser missionária.

A missão é local e global. Começamos onde estamos (Jerusalém) e expandimos para todo o mundo (confins da terra). Atos 1:8 descreve círculos concêntricos de testemunho. Cada crente e cada igreja deve estar envolvido em ambos - alcançar vizinhos e nações.

A missão é integral. Inclui proclamação (pregar o evangelho) e demonstração (viver o evangelho). "Ide por todo o mundo e pregai" (Marcos 16:15) junto com "lembrar dos pobres" (Gálatas 2:10). Palavra e obras juntas refletem Cristo.

A missão requer envio e sustento. A igreja envia missionários e os sustenta. "Como ouvirão se não há quem pregue? E como pregarão se não forem enviados?" (Romanos 10:14-15). Alguns vão; outros enviam. Todos participam da missão.`,
          references: "Mateus 28:18-20; Atos 1:8; Romanos 10:14-15; 2 Coríntios 5:18-20; Marcos 16:15",
          questions: [
            "1. Qual é a missão da Igreja?",
            "2. O que significa a missão ser local e global?",
            "3. O que é missão integral?",
            "4. Qual o papel de enviar e sustentar?",
            "5. Como você está participando da missão?"
          ],
          application: "Ore diariamente por missionários. Considere como você pode se envolver mais ativamente na missão da igreja - local e globalmente.",
          summary: "A missão da Igreja é fazer discípulos em todas as nações, proclamando e demonstrando o evangelho, enviando e sustentando missionários."
        },
        {
          title: "Igreja e Estado",
          content: `Qual o relacionamento entre a Igreja e o governo civil? O NT oferece princípios para navegar essa questão complexa que tem implicações práticas significativas.

O governo é instituído por Deus. "Não há autoridade que não venha de Deus; e as autoridades que há foram ordenadas por Deus" (Romanos 13:1). Mesmo governos imperfeitos servem ao propósito divino de manter ordem. Devemos submissão básica às leis justas.

A Igreja e o Estado têm esferas distintas. "Dai, pois, a César o que é de César, e a Deus o que é de Deus" (Mateus 22:21). Há obrigações para ambos, mas Deus reina supremo. Quando o Estado demanda o que pertence a Deus, "Antes importa obedecer a Deus do que aos homens" (Atos 5:29).

A Igreja não é o Estado, nem o Estado é a Igreja. A Igreja prega, discipula, administra sacramentos; o Estado mantém ordem, pune malfeitores, protege cidadãos. Confundir os dois corrompe ambos. A Igreja profeticamente confronta injustiça sem buscar poder político.`,
          references: "Romanos 13:1-7; Mateus 22:15-22; Atos 5:29; 1 Pedro 2:13-17; 1 Timóteo 2:1-2",
          questions: [
            "1. Por que devemos submissão ao governo?",
            "2. Qual a distinção entre Igreja e Estado?",
            "3. Quando devemos desobedecer ao governo?",
            "4. Qual o papel profético da Igreja?",
            "5. Como você pratica cidadania cristã responsável?"
          ],
          application: "Ore pelas autoridades de seu país (1 Timóteo 2:1-2). Seja cidadão responsável. Esteja pronto para obedecer a Deus acima de tudo.",
          summary: "Igreja e Estado são esferas distintas ordenadas por Deus; devemos submissão ao Estado exceto quando contradiz a obediência a Deus."
        }
      ])
    }
  ]
};

// MÓDULO 8: Escatologia Intermediária
const MODULO_8_ESCATOLOGIA: ModuleData = {
  id: "nivel2-mod8-escatologia",
  name: "Escatologia Intermediária",
  description: "Estudo das últimas coisas e esperança cristã",
  icon: "Clock",
  color: "#8B5CF6",
  order: 23,
  tracks: [
    {
      id: "track-n2m8-moderado",
      level: "moderado",
      name: "As Últimas Coisas",
      description: "Morte, ressurreição, julgamento e vida eterna",
      requiredPlan: "premium",
      order: 1,
      lessons: createLessons("n2m8", [
        {
          title: "A Importância da Escatologia",
          content: `Escatologia é o estudo das "últimas coisas" (do grego eschatos). Inclui morte, estado intermediário, segunda vinda de Cristo, ressurreição, julgamento e destino eterno. Longe de ser especulação ociosa, escatologia molda como vivemos agora.

A esperança escatológica permeia o Novo Testamento. Paulo "tinha esperança em Deus... de que há de haver ressurreição" (Atos 24:15). Pedro nos diz para colocar "toda a esperança na graça que se vos oferecerá quando Jesus Cristo for revelado" (1 Pedro 1:13). Escatologia é esperança.

O conhecimento do futuro transforma o presente. "Todo aquele que nele tem esta esperança purifica-se a si mesmo" (1 João 3:3). Saber que veremos a Deus motiva santidade. Saber que haverá prestação de contas motiva fidelidade. Escatologia não é fuga, mas combustível.

Ao estudar escatologia, devemos equilibrar confiança e humildade. Confiança no que a Escritura claramente ensina; humildade sobre detalhes cronológicos debatidos. O propósito não é satisfazer curiosidade, mas produzir esperança, consolo e vida piedosa.`,
          references: "1 Tessalonicenses 4:13-18; Tito 2:11-13; 1 João 3:2-3; 2 Pedro 3:11-14; Hebreus 9:27-28",
          questions: [
            "1. O que é escatologia?",
            "2. Por que escatologia é importante?",
            "3. Como a esperança futura afeta o presente?",
            "4. Que atitude devemos ter ao estudar escatologia?",
            "5. Como sua vida mudaria se você pensasse mais no futuro eterno?"
          ],
          application: "Medite em 2 Pedro 3:11-14. Se tudo será transformado, que tipo de pessoa você deveria ser?",
          summary: "Escatologia estuda as últimas coisas - morte, ressurreição, julgamento, eternidade - moldando esperança e vida piedosa no presente."
        },
        {
          title: "A Morte",
          content: `A morte é consequência do pecado. "O salário do pecado é a morte" (Romanos 6:23). Deus advertiu Adão: "no dia em que dela comeres, certamente morrerás" (Gênesis 2:17). A morte entrou no mundo pelo pecado, e por ele reina sobre todos.

A morte física é separação de alma e corpo. O corpo retorna ao pó; a alma/espírito vai para Deus ou para julgamento. "O pó volte à terra... e o espírito volte a Deus que o deu" (Eclesiastes 12:7). A morte física não é aniquilação, mas transição.

Para o crente, a morte perdeu seu terror. "Onde está, ó morte, a tua vitória?" (1 Coríntios 15:55). Cristo derrotou a morte por Sua ressurreição. "Morrer é lucro" (Filipenses 1:21) porque significa estar "com Cristo" (Filipenses 1:23). A morte é portal, não fim.

Contudo, a morte permanece inimiga. "O último inimigo a ser aniquilado é a morte" (1 Coríntios 15:26). Ela será destruída na ressurreição final. Até lá, enfrentamos a morte com esperança realista - não negação, mas confiança em Cristo que a venceu.`,
          references: "Romanos 5:12; 6:23; 1 Coríntios 15:26, 54-57; Filipenses 1:21-23; Hebreus 2:14-15",
          questions: [
            "1. Qual a origem da morte?",
            "2. O que é morte física?",
            "3. Por que a morte não aterroriza o crente?",
            "4. Em que sentido a morte ainda é inimiga?",
            "5. Como você pode viver à luz da morte?"
          ],
          application: "Reflita sobre sua própria mortalidade. Isso não deve gerar medo, mas urgência para viver para Cristo e esperança no que vem depois.",
          summary: "A morte é consequência do pecado, mas para o crente foi derrotada por Cristo - portal para Sua presença, não fim terrificante."
        },
        {
          title: "O Estado Intermediário",
          content: `O que acontece entre a morte e a ressurreição? O "estado intermediário" é a condição das almas desencarnadas que aguardam a ressurreição corporal. A Bíblia ensina existência consciente, não sono da alma.

Para os crentes, o estado intermediário é "estar com Cristo." Paulo desejava "partir e estar com Cristo, porque isto é incomparavelmente melhor" (Filipenses 1:23). Jesus prometeu ao ladrão: "Hoje estarás comigo no Paraíso" (Lucas 23:43). Imediatamente após a morte, os salvos estão na presença de Cristo.

Este estado é bom, mas incompleto. "Gememos neste tabernáculo... querendo ser revestidos da nossa habitação celestial" (2 Coríntios 5:2-4). Almas desencarnadas não são estado final. Ansiamos pela ressurreição do corpo. O estado intermediário é transição, não destino.

Para os incrédulos, o estado intermediário é de sofrimento consciente. O rico da parábola estava "atormentado nesta chama" (Lucas 16:24). Esperam o julgamento final em condição de angústia. Não há segunda chance após a morte.`,
          references: "Lucas 23:43; 16:19-31; 2 Coríntios 5:1-8; Filipenses 1:21-24; Apocalipse 6:9-11",
          questions: [
            "1. O que é o estado intermediário?",
            "2. Onde estão os crentes após a morte?",
            "3. Por que o estado intermediário é incompleto?",
            "4. Qual a condição dos incrédulos no estado intermediário?",
            "5. Há segunda chance após a morte?"
          ],
          application: "Se você morrer hoje, estará com Cristo. Essa certeza deve trazer paz sobre a morte e urgência sobre os não-salvos.",
          summary: "O estado intermediário é existência consciente após a morte - crentes com Cristo em bem-estar, incrédulos em sofrimento aguardando julgamento."
        },
        {
          title: "A Segunda Vinda de Cristo",
          content: `A segunda vinda de Cristo é esperança central da fé cristã. "Esse Jesus... virá do modo como o vistes subir" (Atos 1:11). Ele voltará pessoalmente, visivelmente, corporalmente e gloriosamente.

A segunda vinda será pública e inconfundível. "Assim como o relâmpago sai do oriente e se mostra até no ocidente, assim será a vinda do Filho do Homem" (Mateus 24:27). Não será evento secreto. "Todo olho o verá" (Apocalipse 1:7). Será impossível não perceber.

Quanto ao tempo, "Daquele dia e hora ninguém sabe" (Mateus 24:36). Tentativas de prever datas têm repetidamente falhado e contradizem a Escritura. Devemos viver em prontidão constante, não em especulação cronológica.

Cristo virá para julgar, ressuscitar os mortos e consumar o Reino. "Quando o Filho do Homem vier em sua glória... todas as nações serão reunidas em sua presença" (Mateus 25:31-32). A história caminha para este clímax quando Cristo reinará visivelmente.`,
          references: "Atos 1:11; Mateus 24:29-31, 36-44; 1 Tessalonicenses 4:16-17; Apocalipse 1:7; Tito 2:13",
          questions: [
            "1. Como será a segunda vinda?",
            "2. Por que tentativas de prever datas são erradas?",
            "3. O que Cristo fará quando voltar?",
            "4. Como devemos viver à luz da vinda?",
            "5. Você vive em prontidão?"
          ],
          application: "Viva cada dia como se Cristo pudesse voltar hoje, mas planeje como se Ele demorasse. Equilíbrio é chave.",
          summary: "Cristo voltará pessoalmente, visivelmente e em glória em tempo desconhecido para julgar, ressuscitar e consumar Seu reino eterno."
        },
        {
          title: "A Ressurreição dos Mortos",
          content: `A ressurreição corporal é distintivo cristão. Não apenas sobrevivência da alma, mas restauração do corpo transformado. "Semeia-se corpo natural, ressuscita corpo espiritual" (1 Coríntios 15:44).

A ressurreição de Cristo é modelo e garantia da nossa. "Se os mortos não ressuscitam, também Cristo não ressuscitou" (1 Coríntios 15:16). A ressurreição dEle prova que os mortos ressuscitam. "Cristo ressuscitou dentre os mortos e foi feito as primícias dos que dormem" (1 Coríntios 15:20).

O corpo de ressurreição será transformado. Cristo ressurreto comeu peixe e foi tocado, mas também atravessava paredes e aparecia e desaparecia. Será corpo real, tangível, porém glorificado, imortal, imperecível. O mesmo corpo, mas transformado.

A ressurreição será universal. "Todos os que estão nos túmulos ouvirão a sua voz e sairão; os que fizeram o bem, para a ressurreição da vida; e os que fizeram o mal, para a ressurreição da condenação" (João 5:28-29). Todos ressuscitarão - uns para vida, outros para julgamento.`,
          references: "1 Coríntios 15:1-58; João 5:28-29; Filipenses 3:20-21; 1 Tessalonicenses 4:16; Romanos 8:11",
          questions: [
            "1. O que torna a ressurreição distintamente cristã?",
            "2. Como a ressurreição de Cristo garante a nossa?",
            "3. Como será o corpo de ressurreição?",
            "4. Quem ressuscitará?",
            "5. Como a esperança da ressurreição afeta sua vida?"
          ],
          application: "Seu corpo será ressuscitado e transformado! Cuide dele como templo, mas não o idolatre. A melhor versão ainda está por vir.",
          summary: "Todos ressuscitarão corporalmente - crentes para vida com corpos transformados e glorificados, incrédulos para julgamento e condenação."
        },
        {
          title: "O Julgamento Final",
          content: `Cristo voltará como Juiz. "Deus... estabeleceu um dia em que há de julgar o mundo com justiça, por meio de um homem que destinou" (Atos 17:31). Toda a humanidade prestará contas diante do tribunal de Cristo.

O julgamento será universal e público. "Todos devemos comparecer ante o tribunal de Cristo, para que cada um receba segundo o que tiver feito por meio do corpo" (2 Coríntios 5:10). Nada estará oculto. Pensamentos, palavras e obras serão examinados.

Para os crentes, não há condenação (Romanos 8:1), mas há avaliação. Obras serão testadas "pelo fogo." Se permanecerem, haverá recompensa; se queimarem, haverá perda, "mas o tal será salvo, todavia como pelo fogo" (1 Coríntios 3:15). Salvação é segura; recompensas variam.

Para os incrédulos, o julgamento resulta em condenação. "Os que não conhecem a Deus e... não obedecem ao evangelho... sofrerão penalidade de eterna destruição" (2 Tessalonicenses 1:8-9). O julgamento será justo, proporcional e terrível.`,
          references: "Atos 17:31; 2 Coríntios 5:10; Romanos 14:10-12; 1 Coríntios 3:12-15; Apocalipse 20:11-15",
          questions: [
            "1. Quem julgará a humanidade?",
            "2. Quem será julgado?",
            "3. O que o julgamento significa para os crentes?",
            "4. O que o julgamento significa para os incrédulos?",
            "5. Como viver à luz do julgamento vindouro?"
          ],
          application: "Você prestará contas a Cristo. Examine suas obras - são de ouro, prata, pedras preciosas ou de palha? Viva para recompensa eterna.",
          summary: "Todos comparecerão ao tribunal de Cristo - crentes para avaliação e recompensa, incrédulos para condenação proporcional e justa."
        },
        {
          title: "O Inferno",
          content: `O inferno é realidade solene ensinada por Jesus mais que por qualquer outro. É o destino final dos que morrem sem Cristo - separação eterna de Deus e Suas bênçãos.

Jesus usou linguagem severa. Fogo que não se apaga (Marcos 9:43-48), trevas exteriores (Mateus 22:13), choro e ranger de dentes (Mateus 13:42), destruição eterna (Mateus 10:28). Esta linguagem pode ser parcialmente simbólica, mas simboliza algo real e terrível.

O inferno é justo. Não é Deus sendo cruel, mas dando às pessoas o que escolheram - vida sem Ele. Os que rejeitam a Deus recebem existência separada de tudo o que Ele é: amor, bondade, verdade. Isso é inferno - o eu sem Deus, para sempre.

O inferno deve nos mover à compaixão e evangelismo urgente. Se cremos no que Jesus ensinou, não podemos ficar indiferentes aos perdidos. "Conhecendo o temor do Senhor, persuadimos os homens" (2 Coríntios 5:11). A doutrina do inferno corretamente entendida produz missão.`,
          references: "Mateus 10:28; 13:41-42; 25:41, 46; Marcos 9:43-48; 2 Tessalonicenses 1:9; Apocalipse 20:15",
          questions: [
            "1. Quem ensinou mais sobre o inferno?",
            "2. Como Jesus descreveu o inferno?",
            "3. Por que o inferno é justo?",
            "4. Como a doutrina do inferno deve nos afetar?",
            "5. Isso aumenta sua urgência em compartilhar o evangelho?"
          ],
          application: "Ore por pessoas que você conhece que estão sem Cristo. O inferno é real. Seja instrumento de Deus para alertá-las.",
          summary: "O inferno é destino final dos que rejeitam Cristo - separação eterna de Deus, terrível mas justo, devendo nos motivar a evangelizar."
        },
        {
          title: "O Céu e a Nova Criação",
          content: `O destino final dos redimidos não é simplesmente "ir para o céu," mas habitar na nova criação onde céu e terra são unidos. "Vi novo céu e nova terra" (Apocalipse 21:1). Deus habitará com Seu povo para sempre.

A nova Jerusalém desce do céu (Apocalipse 21:2). Não é fuga do material, mas redenção da criação. "A própria criação será libertada da escravidão da corrupção" (Romanos 8:21). Corpos ressurretos habitarão terra renovada.

A característica central é a presença de Deus. "Eis o tabernáculo de Deus com os homens. Deus habitará com eles" (Apocalipse 21:3). O que perdemos no Éden - comunhão direta com Deus - é restaurado e superado. Veremos Sua face (Apocalipse 22:4).

Não haverá mais morte, nem pranto, nem dor (Apocalipse 21:4). Toda maldição será removida. Haverá atividade significativa - serviremos a Deus. Não será tédio eterno, mas vida plena, relacional, criativa, adoradora - tudo que deveríamos ter sido.`,
          references: "Apocalipse 21:1-22:5; Romanos 8:18-25; 2 Pedro 3:13; Isaías 65:17-25; 1 Coríntios 2:9",
          questions: [
            "1. Qual o destino final dos redimidos?",
            "2. O que é a nova criação?",
            "3. O que será central na nova criação?",
            "4. O que será removido?",
            "5. Como será a vida na nova criação?"
          ],
          application: "Deixe a esperança da nova criação encorajá-lo em qualquer dificuldade presente. O melhor está por vir!",
          summary: "O destino final é a nova criação onde Deus habitará com Seu povo, sem morte, dor ou pecado - vida plena e eterna em Sua presença."
        },
        {
          title: "O Milênio: Perspectivas",
          content: `Apocalipse 20 menciona um "mil anos" (milênio) de reinado de Cristo. Cristãos interpretam isso de formas diferentes. As três principais visões são: pré-milenismo, pós-milenismo e amilenismo.

O pré-milenismo ensina que Cristo voltará antes de um reino literal de mil anos na terra. Há variações: o pré-milenismo histórico vê a igreja passando pela tribulação; o dispensacionalismo ensina arrebatamento secreto antes da tribulação.

O pós-milenismo ensina que o evangelho gradualmente transformará o mundo, preparando o reino de Cristo que culminará em Sua volta. O milênio é período de grande influência cristã antes da segunda vinda.

O amilenismo interpreta o milênio simbolicamente como o período presente entre a primeira e segunda vindas de Cristo. Cristo reina agora do céu; o milênio é a era da igreja. Cristãos sinceros discordam; a unidade está na certeza da volta de Cristo e vida eterna.`,
          references: "Apocalipse 20:1-10; 1 Coríntios 15:22-28; Romanos 11:25-27; 2 Pedro 3:8-13",
          questions: [
            "1. O que é o milênio?",
            "2. O que ensina o pré-milenismo?",
            "3. O que ensina o pós-milenismo?",
            "4. O que ensina o amilenismo?",
            "5. Qual deve ser nossa atitude diante dessas diferenças?"
          ],
          application: "Estude as visões com mente aberta, mas não deixe que diferenças sobre o milênio dividam você de outros crentes.",
          summary: "Cristãos sinceros discordam sobre a natureza do milênio (pré, pós ou amilenismo), mas concordam na certeza da volta de Cristo."
        },
        {
          title: "Vivendo à Luz da Eternidade",
          content: `Escatologia não é especulação acadêmica, mas verdade que transforma a vida. Como devemos viver à luz do que estudamos? O NT dá orientações práticas.

Devemos viver em santidade. "Que tipo de pessoas vocês devem ser? Vocês devem viver de maneira santa e piedosa" (2 Pedro 3:11). Saber que veremos a Deus motiva pureza. Saber que haverá julgamento motiva integridade.

Devemos viver com esperança. "Não vos entristeçais como os demais, que não têm esperança" (1 Tessalonicenses 4:13). A esperança da ressurreição e vida eterna transforma como enfrentamos sofrimento, perda e morte. Não estamos desesperados.

Devemos viver com urgência. "Enquanto temos oportunidade, façamos o bem" (Gálatas 6:10). O tempo é curto. A volta de Cristo pode ser hoje. Os perdidos precisam ouvir. Cada dia é oportunidade que não voltará.

Devemos viver com perspectiva. "Ajuntai tesouros no céu" (Mateus 6:20). Investimentos eternos superam ganhos temporais. Viver para este mundo apenas é viver de forma míope quando a eternidade nos aguarda.`,
          references: "2 Pedro 3:11-14; 1 Tessalonicenses 4:13-18; Gálatas 6:10; Mateus 6:19-21; Colossenses 3:1-4",
          questions: [
            "1. Como a escatologia deve afetar nossa santidade?",
            "2. Como deve afetar nossa esperança?",
            "3. Como deve produzir urgência?",
            "4. Como deve moldar nossas prioridades?",
            "5. O que você precisa mudar à luz da eternidade?"
          ],
          application: "Revise suas prioridades, investimentos e uso do tempo. Estão alinhados com a realidade eterna ou são meramente temporais?",
          summary: "A escatologia chama à santidade, esperança, urgência missionária e perspectiva eterna - transformando como vivemos cada dia."
        }
      ])
    }
  ]
};

// MÓDULO 9: Angelologia e Demonologia
const MODULO_9_ANGELOLOGIA: ModuleData = {
  id: "nivel2-mod9-angelologia",
  name: "Angelologia e Demonologia",
  description: "O mundo espiritual: anjos, demônios e batalha espiritual",
  icon: "Sparkles",
  color: "#F97316",
  order: 24,
  tracks: [
    {
      id: "track-n2m9-moderado",
      level: "moderado",
      name: "O Mundo Espiritual",
      description: "Anjos, demônios e a batalha espiritual do crente",
      requiredPlan: "premium",
      order: 1,
      lessons: createLessons("n2m9", [
        {
          title: "A Realidade do Mundo Espiritual",
          content: `A Bíblia revela um mundo espiritual real, habitado por seres criados por Deus. Negar essa realidade é rejeitar o ensino claro das Escrituras. "Porque a nossa luta não é contra a carne e o sangue, mas... contra as forças espirituais do mal" (Efésios 6:12).

O mundo moderno tende a dois extremos: materialismo (negar o espiritual) ou ocultismo (obsessão com o espiritual). A visão bíblica é equilibrada: o mundo espiritual é real, mas não devemos temê-lo nem buscá-lo indevidamente. Cristo é Senhor de ambos os mundos.

Os seres espirituais incluem anjos (servos de Deus) e demônios (anjos caídos que servem a Satanás). Ambos são criaturas, não divindades. São poderosos, mas limitados. Somente Deus é onipresente, onisciente e onipotente.

Nosso conhecimento do mundo espiritual vem exclusivamente da Escritura. Não devemos especular além do revelado nem buscar informação de fontes ocultas. "As coisas encobertas pertencem ao Senhor nosso Deus; porém as reveladas nos pertencem" (Deuteronômio 29:29).`,
          references: "Efésios 6:10-12; Colossenses 1:16; Hebreus 1:14; 2 Reis 6:16-17; Deuteronômio 29:29",
          questions: [
            "1. O que a Bíblia ensina sobre o mundo espiritual?",
            "2. Quais são os dois extremos a evitar?",
            "3. Quem habita o mundo espiritual?",
            "4. De onde vem nosso conhecimento sobre esse mundo?",
            "5. Por que não devemos buscar informação de fontes ocultas?"
          ],
          application: "Mantenha visão bíblica equilibrada: nem negando o espiritual, nem sendo obcecado por ele. Cristo é Senhor de tudo.",
          summary: "O mundo espiritual é real, habitado por anjos e demônios. Devemos ter visão equilibrada baseada exclusivamente na Escritura."
        },
        {
          title: "A Natureza dos Anjos",
          content: `Anjos são seres espirituais criados por Deus para servi-Lo e ministrarem aos santos. A palavra "anjo" (angelos em grego, mal'ak em hebraico) significa "mensageiro." São criados para servir, não para serem adorados.

Anjos são seres espirituais, normalmente invisíveis. Podem assumir forma visível quando enviados em missão (Gênesis 18-19). São incontáveis: "milhares de milhares, e milhões de milhões" (Apocalipse 5:11). São poderosos: um anjo matou 185.000 assírios (2 Reis 19:35).

Anjos são inteligentes mas não oniscientes. Desejam compreender o evangelho (1 Pedro 1:12). São poderosos mas não onipotentes. São presentes onde Deus os envia mas não onipresentes. São superiores aos humanos em alguns aspectos, mas os redimidos julgarão anjos (1 Coríntios 6:3).

Anjos não devem ser adorados. Quando João caiu para adorar um anjo, foi repreendido: "Olha, não faças tal; sou conservo teu... adora a Deus" (Apocalipse 22:9). A adoração pertence exclusivamente a Deus.`,
          references: "Hebreus 1:14; Salmo 103:20-21; Lucas 1:26-38; Apocalipse 5:11; 22:8-9",
          questions: [
            "1. O que significa 'anjo'?",
            "2. Qual a natureza dos anjos?",
            "3. Quais são as limitações dos anjos?",
            "4. Por que não devemos adorar anjos?",
            "5. Você tem consciência de que anjos ministram aos santos?"
          ],
          application: "Agradeça a Deus pelos anjos que Ele envia para ministrar a você. Mas nunca busque ou adore anjos - adore somente a Deus.",
          summary: "Anjos são seres espirituais criados, poderosos mas limitados, que servem a Deus e ministram aos santos, nunca devendo ser adorados."
        },
        {
          title: "O Ministério dos Anjos",
          content: `Os anjos servem a Deus de várias maneiras. "Não são porventura todos eles espíritos ministradores, enviados a serviço dos que hão de herdar a salvação?" (Hebreus 1:14). Seu ministério é centrado em Deus e beneficia os santos.

Anjos adoram a Deus. Os serafins clamam "Santo, Santo, Santo" (Isaías 6:3). Os vinte e quatro anciãos e seres viventes adoram continuamente (Apocalipse 4-5). A adoração celestial é atividade principal do mundo angélico.

Anjos são mensageiros de Deus. Gabriel anunciou a Daniel, Zacarias e Maria. Anjos anunciaram o nascimento de Jesus aos pastores. Revelaram a ressurreição às mulheres. Como mensageiros, comunicam a vontade de Deus.

Anjos protegem e livram os santos. "O anjo do Senhor acampa-se ao redor dos que o temem" (Salmo 34:7). Um anjo libertou Pedro da prisão (Atos 12). Anjos guardadores ministram aos pequeninos (Mateus 18:10). Eles servem aos santos em maneiras que frequentemente não percebemos.`,
          references: "Hebreus 1:14; Salmo 34:7; 91:11-12; Atos 12:7-10; Mateus 18:10",
          questions: [
            "1. Qual o ministério principal dos anjos?",
            "2. Como os anjos servem como mensageiros?",
            "3. Como os anjos protegem os santos?",
            "4. O que são 'anjos guardadores'?",
            "5. Como essa verdade traz conforto?"
          ],
          application: "Viva confiante de que Deus usa anjos para ministrar a você. Não os veja, mas eles estão atuando por ordem de Deus.",
          summary: "Anjos adoram a Deus, servem como mensageiros e protegem os santos, ministrando ativamente aos que herdarão a salvação."
        },
        {
          title: "A Queda de Satanás e Origem dos Demônios",
          content: `Demônios são anjos caídos que seguiram Satanás em sua rebelião. Foram criados bons, mas escolheram rebelar-se. "Deus não perdoou aos anjos que pecaram, mas... os entregou às cadeias da escuridão" (2 Pedro 2:4).

Satanás ("adversário") era aparentemente anjo de alta posição. Isaías 14 e Ezequiel 28 parecem descrever sua queda, motivada por orgulho. "Como caíste do céu, ó estrela da manhã... Contudo serás precipitado até ao mais profundo do abismo" (Isaías 14:12, 15).

Um terço dos anjos pode ter caído com Satanás. Apocalipse 12:4 menciona que "a cauda [do dragão] arrastava a terça parte das estrelas do céu." Se estrelas representam anjos, isso sugere a magnitude da rebelião.

Os demônios agora servem a Satanás na oposição a Deus e Seu povo. São seres pessoais, inteligentes, malignos, organizados hierarquicamente. Seu destino está selado: "Apartai-vos de mim, malditos, para o fogo eterno, preparado para o diabo e seus anjos" (Mateus 25:41).`,
          references: "2 Pedro 2:4; Judas 1:6; Isaías 14:12-15; Ezequiel 28:12-19; Apocalipse 12:4, 9",
          questions: [
            "1. O que são demônios?",
            "2. Quem é Satanás?",
            "3. O que causou a queda de Satanás?",
            "4. Quantos anjos podem ter caído?",
            "5. Qual o destino final dos demônios?"
          ],
          application: "O orgulho causou a queda de Satanás. Examine seu coração por sinais de orgulho e humilhe-se diante de Deus.",
          summary: "Demônios são anjos que caíram com Satanás por orgulho, agora servindo-o na oposição a Deus, mas com destino selado de destruição."
        },
        {
          title: "A Atividade de Satanás",
          content: `Satanás é real, ativo e perigoso. Pedro adverte: "Sede sóbrios; vigiai; porque o diabo, vosso adversário, anda em derredor, bramando como leão, buscando a quem possa tragar" (1 Pedro 5:8). Ele opera no mundo e contra a Igreja.

Satanás é acusador. Seu nome significa "adversário" ou "acusador." Ele acusa os crentes diante de Deus (Apocalipse 12:10). Sussurra condenação e culpa. Mas "temos um Advogado para com o Pai" (1 João 2:1) que responde toda acusação.

Satanás é enganador. "O diabo... é mentiroso e pai da mentira" (João 8:44). Ele distorce a verdade, semeia dúvidas, oferece falsas promessas. A serpente enganou Eva. Satanás tentou Jesus com mentiras. A verdade é nossa defesa.

Satanás é tentador. Tentou Jesus no deserto (Mateus 4:1-11). Tenta os crentes de várias formas. Mas Deus é fiel e não permite tentação além do que podemos suportar, providenciando sempre livramento (1 Coríntios 10:13).`,
          references: "1 Pedro 5:8-9; João 8:44; 2 Coríntios 11:14; Apocalipse 12:9-10; Efésios 6:11",
          questions: [
            "1. Por que Satanás é chamado 'adversário'?",
            "2. Como Satanás atua como acusador?",
            "3. Como Satanás atua como enganador?",
            "4. Como Satanás atua como tentador?",
            "5. Como podemos nos defender?"
          ],
          application: "Esteja alerta às estratégias de Satanás: acusação, engano, tentação. Resista firme na fé e na verdade de Deus.",
          summary: "Satanás é ativo como acusador, enganador e tentador, mas podemos resistir pela verdade, graça e poder de Cristo."
        },
        {
          title: "Os Limites de Satanás",
          content: `Embora Satanás seja poderoso, é criatura limitada. Ele não é contra-Deus (igual e oposto). É anjo criado, inferior a Deus em todos os sentidos. Esta perspectiva evita medo excessivo.

Satanás não é onipotente. Pode fazer apenas o que Deus permite. O livro de Jó mostra Satanás precisando de permissão para afligir Jó (Jó 1:12; 2:6). Deus estabelece limites que Satanás não pode ultrapassar.

Satanás não é onisciente. Não conhece todos os nossos pensamentos. Não sabe o futuro. Ele observa, engana, tenta, mas não tem conhecimento infinito. Apenas Deus conhece todas as coisas.

Satanás não é onipresente. Não pode estar em todos os lugares. Demônios estão espalhados, mas o próprio Satanás é local. Provavelmente a maioria das pessoas nunca foi tentada pessoalmente por Satanás, mas por seus servos.

Satanás foi derrotado na cruz. "Para isto se manifestou o Filho de Deus: para destruir as obras do diabo" (1 João 3:8). Seu poder foi quebrado. Seu destino está selado. Ele age agora como inimigo derrotado, ainda perigoso, mas condenado.`,
          references: "Jó 1:12; 2:6; Colossenses 2:15; 1 João 3:8; 4:4; Apocalipse 20:10",
          questions: [
            "1. Satanás é igual a Deus?",
            "2. Por que Satanás não é onipotente?",
            "3. Por que Satanás não é onisciente?",
            "4. Por que Satanás não é onipresente?",
            "5. O que significa Satanás ter sido derrotado?"
          ],
          application: "Não tenha medo excessivo de Satanás. Ele é inimigo derrotado. Aquele que está em você é maior que aquele que está no mundo.",
          summary: "Satanás é limitado - não onipotente, onisciente ou onipresente - e foi derrotado na cruz, agindo agora como inimigo condenado."
        },
        {
          title: "Possessão e Opressão Demoníaca",
          content: `Os Evangelhos registram muitos casos de possessão demoníaca. Demônios controlavam pessoas, causando tormentos diversos. Jesus expulsava demônios com autoridade, demonstrando Seu poder sobre o mundo espiritual.

Possessão é controle interno de demônios sobre uma pessoa. Os endemoninhados de Gadara eram violentos e viviam nos sepulcros (Mateus 8:28). O menino endemoninhado tinha convulsões (Marcos 9:20). Possessão vai além de doença mental natural.

Há debate se um verdadeiro crente pode ser possuído. Muitos argumentam que, tendo o Espírito Santo habitando, a possessão é impossível. "Maior é o que está em vós do que o que está no mundo" (1 João 4:4). Crentes podem ser oprimidos, atacados, mas não possuídos.

Opressão é influência externa que afeta pensamentos, emoções e circunstâncias sem controle interno. Crentes podem experimentar ataques espirituais, mas têm recursos para resistir. "Resisti ao diabo, e ele fugirá de vós" (Tiago 4:7).`,
          references: "Mateus 8:28-34; Marcos 5:1-20; 9:14-29; Lucas 8:26-39; 1 João 4:4; Tiago 4:7",
          questions: [
            "1. O que é possessão demoníaca?",
            "2. Que sinais indicam possessão nos Evangelhos?",
            "3. Um cristão pode ser possuído?",
            "4. O que é opressão demoníaca?",
            "5. Como cristãos devem responder a ataques espirituais?"
          ],
          application: "Se você experimenta opressão espiritual, resista ao diabo pela fé, Palavra e oração. Busque apoio de líderes maduros.",
          summary: "Possessão é controle interno demoníaco; crentes provavelmente não podem ser possuídos, mas podem ser oprimidos e devem resistir pela fé."
        },
        {
          title: "A Armadura de Deus",
          content: `Efésios 6:10-18 descreve a armadura espiritual para a batalha. Não lutamos com armas carnais, mas espirituais. Cada peça da armadura é essencial para a vitória.

O cinto da verdade protege contra mentiras de Satanás. A couraça da justiça protege o coração com a justiça de Cristo imputada e vivida. Os pés calçados preparam para proclamar o evangelho da paz.

O escudo da fé apaga dardos do maligno - dúvidas, acusações, tentações são neutralizados pela confiança em Deus e Sua Palavra. O capacete da salvação protege a mente com certeza da salvação.

A espada do Espírito é a Palavra de Deus - arma ofensiva para atacar mentiras com verdade. Jesus usou a Escritura para responder a Satanás no deserto. A oração permeia tudo: "orando em todo tempo no Espírito" (Efésios 6:18).`,
          references: "Efésios 6:10-18; 2 Coríntios 10:3-5; 1 Tessalonicenses 5:8; Romanos 13:12",
          questions: [
            "1. Por que precisamos de armadura espiritual?",
            "2. O que representa cada peça da armadura?",
            "3. Qual é a única arma ofensiva?",
            "4. Qual o papel da oração?",
            "5. Qual peça você precisa fortalecer?"
          ],
          application: "Mentalmente 'vista' a armadura cada manhã. Identifique as peças que você negligencia e fortaleça-as.",
          summary: "A armadura de Deus - verdade, justiça, evangelho, fé, salvação, Palavra, oração - equipa o crente para resistir aos ataques espirituais."
        },
        {
          title: "Batalha Espiritual Equilibrada",
          content: `Há dois erros sobre batalha espiritual: ignorar demônios (naturalismo) ou ver demônios em tudo (animismo). A visão bíblica é equilibrada: reconhece a realidade espiritual sem exageros.

Nem todo problema é demoníaco. Doença, pecado, circunstâncias adversas podem ter causas naturais. Jó sofreu por permissão divina, não por pecado ou demônios especiais. Paulo tinha "espinho na carne" - não necessariamente demoníaco.

Também não devemos negligenciar a dimensão espiritual. Há batalha real contra principados e potestades. Ignorar isso deixa o crente vulnerável. "Para que não sejamos vencidos por Satanás; porque não lhe ignoramos os desígnios" (2 Coríntios 2:11).

A vida cristã normal não é obsessão com demônios, mas foco em Cristo. Resistimos ao diabo vivendo em intimidade com Deus, andando no Espírito, revestindo-nos da armadura, praticando as disciplinas espirituais. Vitória vem de proximidade com Deus, não de técnicas especiais.`,
          references: "2 Coríntios 2:11; 10:3-5; Efésios 6:12; Tiago 4:7-8; 1 Pedro 5:8-9",
          questions: [
            "1. Quais são os dois erros sobre batalha espiritual?",
            "2. Por que nem todo problema é demoníaco?",
            "3. Por que não devemos ignorar a dimensão espiritual?",
            "4. Qual deve ser o foco da vida cristã?",
            "5. Como você mantém equilíbrio?"
          ],
          application: "Mantenha equilíbrio: reconheça a batalha espiritual sem obsessão com demônios. Foque em Cristo; a vitória flui daí.",
          summary: "Batalha espiritual equilibrada reconhece a realidade demoníaca sem exagero, focando em Cristo e intimidade com Deus como fonte de vitória."
        },
        {
          title: "A Vitória Final",
          content: `A batalha espiritual tem resultado garantido: Cristo vence. Satanás foi derrotado na cruz e será definitivamente destruído no fim. Esta certeza fundamenta nossa confiança agora.

Na cruz, Cristo "despojou os principados e potestades, os expôs publicamente e sobre eles triunfou" (Colossenses 2:15). O triunfo já aconteceu. Satanás opera agora como inimigo derrotado, sabendo que seu tempo é curto (Apocalipse 12:12).

Participamos da vitória de Cristo. "Maior é o que está em vós do que o que está no mundo" (1 João 4:4). "Eles o venceram pelo sangue do Cordeiro e pela palavra do seu testemunho" (Apocalipse 12:11). A vitória é por Cristo, não por nós.

O destino final de Satanás é lago de fogo. "E o diabo, que os enganava, foi lançado no lago de fogo e enxofre... e serão atormentados para todo o sempre" (Apocalipse 20:10). A vitória será completa e eterna. Não haverá mais oposição espiritual.`,
          references: "Colossenses 2:15; Apocalipse 12:10-11; 20:10; Romanos 16:20; Hebreus 2:14-15",
          questions: [
            "1. Quando Satanás foi derrotado?",
            "2. Por que Satanás ainda opera se já foi derrotado?",
            "3. Como participamos da vitória de Cristo?",
            "4. Qual o destino final de Satanás?",
            "5. Como essa certeza afeta sua luta hoje?"
          ],
          application: "Lute confiante: a vitória é garantida! Cristo já venceu. Você está do lado vencedor. Resista e verá Satanás fugir.",
          summary: "Cristo derrotou Satanás na cruz, e nós participamos de Sua vitória. O destino de Satanás está selado - o lago de fogo eterno."
        }
      ])
    }
  ]
};

// MÓDULO 10: Antropologia Bíblica
const MODULO_10_ANTROPOLOGIA: ModuleData = {
  id: "nivel2-mod10-antropologia",
  name: "Antropologia Bíblica",
  description: "A doutrina bíblica do ser humano",
  icon: "User",
  color: "#10B981",
  order: 25,
  tracks: [
    {
      id: "track-n2m10-moderado",
      level: "moderado",
      name: "O Ser Humano",
      description: "Criação, queda e natureza humana segundo a Bíblia",
      requiredPlan: "premium",
      order: 1,
      lessons: createLessons("n2m10", [
        {
          title: "A Criação do Ser Humano",
          content: `O ser humano é o ápice da criação de Deus. Após criar tudo mais, Deus disse: "Façamos o homem à nossa imagem" (Gênesis 1:26). O plural sugere deliberação trinitária. Somos únicos entre as criaturas.

A criação humana foi íntima e pessoal. "Formou o Senhor Deus o homem do pó da terra, e soprou em suas narinas o fôlego de vida" (Gênesis 2:7). Enquanto Deus falou e as outras criaturas surgiram, Ele formou Adão com Suas mãos e soprou vida nele.

O homem foi criado à imagem de Deus (imago Dei). Isso inclui racionalidade, moralidade, criatividade, relacionalidade, autoridade delegada. Refletimos Deus de maneiras que nenhuma outra criatura reflete. Somos Seus representantes na terra.

A mulher foi criada do homem, para ser sua auxiliadora correspondente (Gênesis 2:18-24). Ambos, homem e mulher, carregam igualmente a imagem de Deus. "Homem e mulher os criou" (Gênesis 1:27). Igualdade em dignidade, complementaridade em função.`,
          references: "Gênesis 1:26-28; 2:7, 18-24; Salmo 8:3-8; 139:13-16",
          questions: [
            "1. Por que o ser humano é o ápice da criação?",
            "2. O que foi único na criação de Adão?",
            "3. O que significa 'imagem de Deus'?",
            "4. Como homem e mulher se relacionam na criação?",
            "5. Como ser imagem de Deus afeta sua identidade?"
          ],
          application: "Você é criado à imagem de Deus! Isso define sua dignidade e propósito. Viva de forma que reflita seu Criador.",
          summary: "O ser humano é o ápice da criação, formado pessoalmente por Deus, carregando Sua imagem, com homem e mulher iguais em dignidade."
        },
        {
          title: "A Imagem de Deus",
          content: `A imagem de Deus (imago Dei) é o que distingue humanos de todas as outras criaturas. Teólogos identificam vários aspectos desta imagem.

O aspecto estrutural inclui capacidades que refletem Deus: razão, linguagem, criatividade, consciência moral, capacidade relacional. Estas capacidades permanecem mesmo após a Queda, embora corrompidas. Todo ser humano tem dignidade por carregar a imagem.

O aspecto funcional é o papel de governar a criação como representantes de Deus. "Domine sobre os peixes do mar, e sobre as aves dos céus, e sobre todos os animais" (Gênesis 1:28). Somos vice-regentes, administradores do que Deus criou.

O aspecto relacional enfatiza que fomos criados para relacionamento com Deus, outros e a criação. O Deus triuno nos fez relacionais como Ele é relacional. Solidão não é boa (Gênesis 2:18); fomos feitos para comunhão.

Em Cristo, a imagem está sendo restaurada. "Vos despistes do velho homem... e vos revestistes do novo, que se refaz para o pleno conhecimento, segundo a imagem daquele que o criou" (Colossenses 3:9-10). Santificação é restauração da imagem.`,
          references: "Gênesis 1:26-28; 9:6; Colossenses 3:9-10; Efésios 4:24; 2 Coríntios 3:18",
          questions: [
            "1. Quais são os aspectos da imagem de Deus?",
            "2. O que inclui o aspecto estrutural?",
            "3. O que é o aspecto funcional?",
            "4. Por que somos seres relacionais?",
            "5. Como a imagem está sendo restaurada?"
          ],
          application: "Considere como você exerce seu papel de 'vice-regente' de Deus. Você administra bem a criação, relacionamentos e recursos?",
          summary: "A imagem de Deus inclui aspectos estruturais (capacidades), funcionais (domínio) e relacionais (comunhão), sendo restaurada em Cristo."
        },
        {
          title: "Corpo e Alma",
          content: `O ser humano é unidade de corpo e alma/espírito. Não somos almas presas em corpos, nem corpos sem dimensão espiritual. Somos seres psicossomáticos - unidade de material e imaterial.

A visão bíblica é dicotomia ou tricotomia? Dicotomia vê duas partes: corpo (material) e alma/espírito (imaterial, termos intercambiáveis). Tricotomia vê três: corpo, alma (psique, vida emocional) e espírito (relação com Deus). Ambas as visões têm defensores.

Independente de dois ou três aspectos, o ponto crucial é que somos unidade. Corpo não é inferior à alma. Na ressurreição, teremos corpos eternos. O corpo importa - por isso cuidamos dele e vivemos corporalmente de forma santa.

A morte separa corpo e alma temporariamente. O corpo decompõe; a alma vai para Cristo (crente) ou aguarda julgamento (incrédulo). A ressurreição reunirá corpo (transformado) e alma para sempre. A separação na morte é temporária e antinatural.`,
          references: "Gênesis 2:7; Mateus 10:28; 1 Tessalonicenses 5:23; Hebreus 4:12; 2 Coríntios 5:1-8",
          questions: [
            "1. O que significa ser 'psicossomático'?",
            "2. O que é dicotomia versus tricotomia?",
            "3. Por que o corpo é importante biblicamente?",
            "4. O que acontece na morte?",
            "5. Como isso afeta como você cuida de seu corpo?"
          ],
          application: "Cuide de seu corpo como templo do Espírito, mas não o idolatre. Você é unidade de corpo e alma, ambos importam para Deus.",
          summary: "O ser humano é unidade de corpo e alma/espírito, ambos importantes para Deus, separados temporariamente na morte e reunidos na ressurreição."
        },
        {
          title: "A Queda no Pecado",
          content: `Gênesis 3 narra a tragédia que mudou a história humana. Tentados pela serpente, Adão e Eva desobedeceram a Deus comendo do fruto proibido. As consequências foram catastróficas e universais.

A tentação atacou a Palavra de Deus ("É assim que Deus disse?"), o caráter de Deus ("Certamente não morrereis") e ofereceu autonomia ("Sereis como Deus"). O padrão se repete: duvidar da Palavra, desconfiar de Deus, buscar independência.

As consequências foram imediatas. Vergonha entrou - eles se esconderam. Medo entrou - temeram a Deus. Culpa entrou - culparam outros. Morte entrou - espiritual (separação de Deus) imediatamente, física (mortalidade) progressivamente.

Adão era representante federal da humanidade. Seu pecado afetou todos os seus descendentes. "Por um homem entrou o pecado no mundo, e pelo pecado a morte, assim também a morte passou a todos os homens, porque todos pecaram" (Romanos 5:12). Nascemos caídos.`,
          references: "Gênesis 3:1-24; Romanos 5:12-21; 1 Coríntios 15:21-22",
          questions: [
            "1. Como a serpente tentou Eva?",
            "2. Quais foram as consequências imediatas da Queda?",
            "3. O que significa Adão ser 'representante federal'?",
            "4. Como o pecado de Adão nos afeta?",
            "5. Como reconhecer os padrões da tentação em sua vida?"
          ],
          application: "Identifique onde você é tentado a duvidar da Palavra de Deus, desconfiar de Seu caráter ou buscar autonomia. Resista!",
          summary: "A Queda resultou de desconfiança em Deus e desobediência, trazendo vergonha, medo, culpa e morte, afetando toda a humanidade em Adão."
        },
        {
          title: "O Pecado Original",
          content: `Pecado original refere-se tanto ao primeiro pecado de Adão quanto à condição pecaminosa herdada por todos os humanos. Nascemos em pecado, não nos tornamos pecadores ao pecar - pecamos porque somos pecadores.

A corrupção é total - afeta todas as faculdades humanas. Mente ("o entendimento está entenebrecido" - Efésios 4:18), vontade ("escravos do pecado" - Romanos 6:17), emoções ("paixões pecaminosas" - Romanos 7:5), corpo ("membros como instrumentos de injustiça" - Romanos 6:13).

Depravação total não significa que somos tão maus quanto possível, nem que não fazemos nenhum bem relativo. Significa que nenhuma parte de nós escapou da corrupção. Não podemos, por esforço próprio, nos aproximar de Deus ou merecer salvação.

A culpa de Adão também é imputada a nós. "Pela ofensa de um só, reinaram a morte... pela ofensa de um só, vieram sobre todos os homens a condenação" (Romanos 5:17-18). Assim como em Adão todos morremos, em Cristo todos serão vivificados (1 Coríntios 15:22).`,
          references: "Romanos 5:12-19; Salmo 51:5; Efésios 2:1-3; Jeremias 17:9; 1 Coríntios 15:22",
          questions: [
            "1. O que é pecado original?",
            "2. O que significa depravação total?",
            "3. Todas as partes da natureza humana são afetadas?",
            "4. O que significa a imputação da culpa de Adão?",
            "5. Por que precisamos de regeneração, não apenas instrução?"
          ],
          application: "Reconheça sua incapacidade total de salvar-se. Sua única esperança é a graça de Deus em Cristo. Descanse completamente nEle.",
          summary: "Pecado original é a condição herdada de corrupção total (afetando todas as faculdades) e culpa imputada de Adão a todos os descendentes."
        },
        {
          title: "Livre-Arbítrio e Escravidão",
          content: `A questão do livre-arbítrio é complexa. Em que sentido humanos são livres? A Bíblia afirma responsabilidade humana (somos culpados por nosso pecado) e incapacidade espiritual (não podemos nos salvar).

Antes da Queda, Adão tinha liberdade genuína para obedecer ou desobedecer. Escolheu desobedecer. Após a Queda, a vontade humana ficou escravizada ao pecado. "Todo aquele que comete pecado é escravo do pecado" (João 8:34). Podemos escolher entre pecados, mas não podemos escolher não pecar.

Livre-arbítrio para escolhas cotidianas permanece. Decidimos o que comer, vestir, fazer. Mas espiritualmente, estamos mortos, cegos, hostis. "Ninguém pode vir a mim, se o Pai... não o trouxer" (João 6:44). Precisamos de graça capacitadora.

A regeneração restaura a vontade para responder a Deus. O regenerado agora pode escolher obedecer. Na glorificação, teremos liberdade perfeita - capacidade de não pecar mais. A verdadeira liberdade não é fazer o que quisermos, mas poder fazer o que deveríamos.`,
          references: "João 6:44; 8:34-36; Romanos 6:17-22; 8:7-8; Efésios 2:1-5; Filipenses 2:13",
          questions: [
            "1. Que tipo de liberdade Adão tinha antes da Queda?",
            "2. O que aconteceu à vontade após a Queda?",
            "3. Em que sentido temos livre-arbítrio?",
            "4. O que a regeneração faz à vontade?",
            "5. O que será a liberdade na glorificação?"
          ],
          application: "Reconheça que sua capacidade de responder a Deus é obra da graça. Agradeça pela liberdade restaurada em Cristo.",
          summary: "A vontade humana, livre antes da Queda, tornou-se escrava do pecado, sendo restaurada pela regeneração e aperfeiçoada na glorificação."
        },
        {
          title: "Pecados Atuais",
          content: `Além do pecado original herdado, cometemos pecados atuais - transgressões específicas da lei de Deus. Toda pessoa peca em pensamento, palavra e ação. "Todos pecaram e destituídos estão da glória de Deus" (Romanos 3:23).

Pecado pode ser definido de várias formas: transgressão da lei ("Pecado é a transgressão da lei" - 1 João 3:4), falha em cumprir a lei ("Aquele que sabe fazer o bem e não o faz, nisto lhe é pecado" - Tiago 4:17), ou qualquer coisa que não procede de fé ("Tudo o que não é de fé é pecado" - Romanos 14:23).

Pecados variam em gravidade. Jesus mencionou "pecado maior" (João 19:11). Alguns pecados têm consequências mais severas. Mas todo pecado, por menor que pareça, é ofensa contra o Deus santo e merece julgamento.

A Bíblia lista muitos pecados específicos: obras da carne (Gálatas 5:19-21), listas de vícios (Romanos 1:29-31; 1 Coríntios 6:9-10). Estas listas não são exaustivas, mas representativas. O Espírito Santo convence de pecado específico em cada consciência.`,
          references: "Romanos 3:23; 1 João 3:4; Tiago 4:17; Gálatas 5:19-21; 1 Coríntios 6:9-10",
          questions: [
            "1. O que são pecados atuais?",
            "2. Como a Bíblia define pecado?",
            "3. Todos os pecados são igualmente graves?",
            "4. Que exemplos de pecados a Bíblia lista?",
            "5. Como o Espírito Santo convence você de pecado específico?"
          ],
          application: "Examine sua vida à luz das listas bíblicas de pecados. Confesse pecados específicos; não generalize. Busque santidade concreta.",
          summary: "Pecados atuais são transgressões específicas da lei de Deus em pensamento, palavra e ação, variando em gravidade, todos merecendo julgamento."
        },
        {
          title: "Consciência",
          content: `A consciência é a faculdade moral interior que aprova ou condena nossas ações. "Sua consciência também dá testemunho, e os seus pensamentos os acusam ou também os defendem" (Romanos 2:15). É parte da imagem de Deus em nós.

A consciência é universal. Mesmo gentios sem a lei escrita "mostram a norma da lei gravada no seu coração" (Romanos 2:15). Toda cultura reconhece diferença entre certo e errado, embora discordem sobre aplicações específicas.

A consciência pode estar em diferentes estados. Boa consciência (1 Timóteo 1:5) - saudável e sensível. Má consciência (Hebreus 10:22) - acusadora por pecado não confessado. Fraca consciência (1 Coríntios 8:7) - excessivamente restritiva. Cauterizada (1 Timóteo 4:2) - insensível por repetida supressão.

Devemos manter consciência limpa confessando pecado prontamente. Devemos educar a consciência pela Palavra, pois pode estar errada. Não devemos violar a consciência mesmo fraca, mas buscar maturidade. "Procuro ter sempre consciência limpa diante de Deus e dos homens" (Atos 24:16).`,
          references: "Romanos 2:14-15; 9:1; 1 Coríntios 8:7-12; 1 Timóteo 1:5, 19; 4:2; Hebreus 10:22",
          questions: [
            "1. O que é consciência?",
            "2. Por que a consciência é universal?",
            "3. Quais são os diferentes estados da consciência?",
            "4. Como manter consciência limpa?",
            "5. Qual o estado de sua consciência?"
          ],
          application: "Examine o estado de sua consciência. Há pecado não confessado pesando nela? Confesse e receba purificação.",
          summary: "A consciência é faculdade moral universal que acusa ou defende, podendo estar boa, má, fraca ou cauterizada, devendo ser mantida limpa pela confissão."
        },
        {
          title: "O Coração Humano",
          content: `Na Bíblia, "coração" refere-se ao centro da pessoa - sede de pensamentos, vontade, emoções, desejos. Não é apenas sentimento, mas o núcleo de onde flui toda a vida. "De tudo o que se deve guardar, guarda o teu coração, porque dele procedem as fontes da vida" (Provérbios 4:23).

O coração caído é enganoso e desesperadamente corrupto. "Enganoso é o coração, mais do que todas as coisas, e perverso; quem o conhecerá?" (Jeremias 17:9). Jesus ensinou que do coração procedem maus pensamentos, adultérios, furtos, homicídios (Mateus 15:19).

Deus conhece o coração perfeitamente. "O Senhor esquadrinha todos os corações" (1 Crônicas 28:9). Não podemos esconder dele. Por isso, não basta mudar comportamento externo; o coração precisa ser transformado.

A salvação dá novo coração. "Dar-vos-ei um coração novo, e porei dentro de vós um espírito novo" (Ezequiel 36:26). A regeneração substitui o coração de pedra por coração de carne. O crente tem novo centro, novos desejos, nova direção - embora a luta com o velho homem continue.`,
          references: "Provérbios 4:23; Jeremias 17:9-10; Mateus 15:18-19; Ezequiel 36:26-27; Hebreus 4:12",
          questions: [
            "1. O que significa 'coração' na Bíblia?",
            "2. Qual a condição do coração caído?",
            "3. Por que Deus conhecer o coração é significativo?",
            "4. O que a salvação faz ao coração?",
            "5. Como você guarda seu coração?"
          ],
          application: "Guarde seu coração cuidadosamente. O que você permite entrar forma o que sai. Nutra-o com Palavra, oração, comunhão.",
          summary: "O coração é o centro da pessoa de onde flui toda a vida; caído é corrupto, mas na salvação Deus dá novo coração com novos desejos."
        },
        {
          title: "Dignidade e Miséria Humana",
          content: `A doutrina do homem equilibra dignidade e miséria. Somos imagem de Deus - isso confere dignidade infinita. Somos pecadores - isso explica a miséria universal. Ambas as verdades são essenciais.

A dignidade humana fundamenta ética. Todo ser humano, independente de idade, raça, condição social ou capacidade, tem valor intrínseco. Assassinato é proibido porque humanos carregam imagem de Deus (Gênesis 9:6). Amaldiçoar pessoas é inconsistente porque são "feitas à semelhança de Deus" (Tiago 3:9).

A miséria humana explica o mal. Por que guerras, injustiça, violência, depravação? Porque somos pecadores. O problema não é educação, pobreza ou ambiente - é o coração. Soluções meramente externas falham; precisamos de redenção.

Cristo veio para tratar a miséria sem destruir a dignidade. Ele nos valoriza o suficiente para morrer por nós; reconhece nossa pecaminosidade o suficiente para nos salvar. Em Cristo, dignidade é restaurada e miséria é resolvida progressivamente.`,
          references: "Gênesis 1:27; 9:6; Romanos 3:10-18; Tiago 3:9-10; Efésios 2:1-10",
          questions: [
            "1. Como dignidade e miséria se relacionam?",
            "2. Por que todo ser humano tem dignidade?",
            "3. Como a miséria explica o mal no mundo?",
            "4. Por que soluções meramente externas falham?",
            "5. Como Cristo restaura dignidade e resolve miséria?"
          ],
          application: "Trate toda pessoa com dignidade porque carrega imagem de Deus. Reconheça a miséria universal que só Cristo pode curar.",
          summary: "O ser humano tem dignidade por carregar imagem de Deus e miséria por ser pecador; em Cristo, dignidade é restaurada e miséria resolvida."
        }
      ])
    }
  ]
};

export const NIVEL_2_MODULOS_6_10: ModuleData[] = [
  MODULO_6_SOTERIOLOGIA,
  MODULO_7_ECLESIOLOGIA,
  MODULO_8_ESCATOLOGIA,
  MODULO_9_ANGELOLOGIA,
  MODULO_10_ANTROPOLOGIA,
];
