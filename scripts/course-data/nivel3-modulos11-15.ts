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

// MÓDULO 11: Ministério de Ensino
const MODULO_11_ENSINO: ModuleData = {
  id: "nivel3-mod11-ensino",
  name: "Ministério de Ensino",
  description: "Desenvolvendo habilidades para ensinar a Palavra de Deus",
  icon: "BookOpenCheck",
  color: "#0EA5E9",
  order: 41,
  tracks: [
    {
      id: "track-n3m11-avancado",
      level: "avancado",
      name: "O Chamado para Ensinar",
      description: "Formando mestres na Palavra",
      requiredPlan: "premium",
      order: 1,
      lessons: createLessons("n3m11", [
        {
          title: "O Dom e Chamado de Ensinar",
          content: `Ensinar é dom do Espírito dado à igreja. "A uns estabeleceu Deus... como mestres" (1 Coríntios 12:28). Nem todos são chamados para ensinar formalmente, mas os que são carregam grande responsabilidade.

O ensino bíblico difere da educação secular. O objetivo não é apenas informação, mas transformação. "Ensinando-os a guardar todas as coisas" (Mateus 28:20). Guardar, não apenas saber. Obediência é a meta.

Os mestres receberão juízo mais rigoroso. "Meus irmãos, muitos de vós não sejam mestres, sabendo que receberemos mais duro juízo" (Tiago 3:1). Ensinar erro tem consequências; ensinar com vida incongruente também. A responsabilidade é solene.

O ensino flui de vida transformada. Antes de ensinar outros, o mestre deve ser ensinável. "Esdras preparou o coração para buscar a lei do SENHOR, e para a cumprir, e para ensinar" (Esdras 7:10). Buscar, cumprir, depois ensinar - essa é a ordem.`,
          references: "1 Coríntios 12:28; Efésios 4:11; Tiago 3:1; Esdras 7:10; 2 Timóteo 2:2",
          questions: [
            "1. Ensinar é dom espiritual?",
            "2. Qual é o objetivo do ensino bíblico?",
            "3. Por que mestres recebem juízo mais duro?",
            "4. Qual é a ordem em Esdras 7:10?",
            "5. Você sente chamado para ensinar?"
          ],
          application: "Se você ensina, avalie: você está buscando, cumprindo e depois ensinando? Se deseja ensinar, comece buscando.",
          summary: "Ensinar é dom com grande responsabilidade; o objetivo é transformação através de obediência; o mestre deve primeiro ser discípulo."
        },
        {
          title: "Conhecendo Seus Alunos",
          content: `Ensino eficaz considera o aluno, não apenas o conteúdo. Jesus adaptava seu ensino aos ouvintes: parábolas para multidões, explicações para discípulos, confronto para fariseus.

Diferentes idades aprendem diferentemente. Crianças precisam de concreto e ativo; adolescentes, de relevância e discussão; adultos, de aplicabilidade e respeito à experiência. Um método não serve a todos.

Diferentes níveis espirituais requerem alimentação apropriada. "Leite para os inexperientes, alimento sólido para os perfeitos" (Hebreus 5:13-14). Não dê carne a bebês nem leite a adultos. Discernir maturidade guia o ensino.

Conheça seus alunos pessoalmente. Jesus conhecia os discípulos pelo nome, sabia suas fraquezas, orava por eles. O bom mestre não apenas transmite; relaciona-se. Conhecimento pessoal permite aplicação personalizada.`,
          references: "Hebreus 5:12-14; 1 Coríntios 3:1-2; João 10:3; Marcos 4:33-34; 1 Tessalonicenses 2:7-8",
          questions: [
            "1. Por que considerar o aluno?",
            "2. Como diferentes idades aprendem?",
            "3. O que significa 'leite' e 'carne'?",
            "4. Por que conhecer alunos pessoalmente?",
            "5. Você conhece seus alunos além da sala?"
          ],
          application: "Conheça um aluno mais profundamente esta semana. Pergunte sobre sua vida além do estudo.",
          summary: "Ensino eficaz adapta-se aos alunos considerando idade, maturidade espiritual e conhecimento pessoal de cada um."
        },
        {
          title: "Preparando a Lição",
          content: `Preparação é essencial para ensino eficaz. "Preparar o coração" vem antes de ensinar (Esdras 7:10). Não improvise com a Palavra de Deus; prepare-se diligentemente.

Estude o texto primeiro para você. Antes de perguntar 'o que vou ensinar?', pergunte 'o que Deus está me dizendo?'. O texto deve transformar o mestre antes de chegar aos alunos. Ensine do que transborda.

Identifique a ideia central. O que este texto ensina principalmente? Se não consegue resumir em uma frase, não entendeu o suficiente. Clareza começa com compreensão do mestre.

Planeje aplicações específicas. Não termine com 'vamos aplicar isso'. Dê passos concretos. O que os alunos devem fazer em resposta? "Sede cumpridores da palavra" (Tiago 1:22) requer aplicação prática.`,
          references: "Esdras 7:10; 2 Timóteo 2:15; Tiago 1:22-25; Neemias 8:8; Atos 17:11",
          questions: [
            "1. Por que preparação é essencial?",
            "2. Por que estudar para si mesmo primeiro?",
            "3. O que é a 'ideia central'?",
            "4. Por que aplicações devem ser específicas?",
            "5. Como você se prepara para ensinar?"
          ],
          application: "Na próxima lição que preparar, identifique primeiro a ideia central em uma frase.",
          summary: "Preparação envolve transformação pessoal primeiro, identificação da ideia central e planejamento de aplicações específicas."
        },
        {
          title: "Métodos de Ensino",
          content: `Jesus usou diversos métodos: parábolas, perguntas, demonstrações, debates, experiências práticas. Variedade mantém atenção e atende diferentes estilos de aprendizagem.

A palestra não é o único método. Discussão em grupo, estudos de caso, dramatizações, trabalhos em equipe, projetos práticos - o repertório é vasto. Escolha métodos que servem ao conteúdo e aos alunos.

Perguntas são ferramenta poderosa. Jesus frequentemente ensinava perguntando. Perguntas engajam, fazem pensar, revelam compreensão. "O que vocês acham?" é frequentemente melhor que "Eu vou explicar."

Ilustrações tornam o abstrato concreto. Jesus usou semeadores, ovelhas, moedas, banquetes. Histórias memoráveis fixam verdades. Colete ilustrações da vida real; autenticidade conecta.`,
          references: "Mateus 13:1-52; Marcos 4:33-34; Lucas 15:1-32; João 13:1-17",
          questions: [
            "1. Que métodos Jesus usou?",
            "2. Palestra é sempre o melhor método?",
            "3. Por que perguntas são poderosas?",
            "4. Para que servem ilustrações?",
            "5. Que métodos você poderia experimentar?"
          ],
          application: "Na próxima aula, use um método que você normalmente não usa. Avalie o resultado.",
          summary: "Variedade de métodos - perguntas, discussão, ilustrações, experiências práticas - atende diferentes aprendizes e mantém engajamento."
        },
        {
          title: "Ambiente de Aprendizagem",
          content: `O ambiente físico afeta a aprendizagem. Sala confortável, iluminação adequada, assentos organizados, temperatura agradável - detalhes importam. Distrações físicas prejudicam atenção.

O ambiente emocional importa ainda mais. Pessoas aprendem melhor quando se sentem seguras. Crie espaço onde perguntas são bem-vindas, erros não são ridicularizados, e todos são valorizados.

Comunidade facilita aprendizagem. "Consideremo-nos uns aos outros" (Hebreus 10:24). Aprender juntos, discutir em grupo, aplicar em comunidade - o contexto relacional enriquece. O individualismo empobrece.

O Espírito é o verdadeiro mestre. "O Espírito da verdade vos guiará a toda a verdade" (João 16:13). Ore antes, durante e depois. Dependa dEle para iluminar corações. Métodos sem Espírito são vazios.`,
          references: "Hebreus 10:24-25; João 16:13; 1 Coríntios 2:10-14; Atos 2:42",
          questions: [
            "1. Por que ambiente físico importa?",
            "2. O que é ambiente emocional seguro?",
            "3. Como comunidade facilita aprendizagem?",
            "4. Qual é o papel do Espírito?",
            "5. Seu ambiente de ensino é propício?"
          ],
          application: "Avalie seu espaço de ensino: físico e emocional. Que melhoria você pode fazer?",
          summary: "Ambiente de aprendizagem inclui espaço físico confortável, segurança emocional, contexto comunitário e dependência do Espírito."
        },
        {
          title: "Ensinando Crianças",
          content: `Crianças são especialmente receptivas. "Deixai vir a mim as crianças" (Marcos 10:14). Jesus valorizou crianças; o ministério infantil não é secundário. Impressões formadas cedo duram a vida.

Crianças aprendem concretamente. Abstrações são difíceis; histórias, objetos, atividades funcionam melhor. "Ensinarás a teus filhos, e delas falarás... andando pelo caminho" (Deuteronômio 6:7). Ensino integrado à vida.

Repetição é essencial. Crianças precisam ouvir verdades múltiplas vezes. Não é redundância; é reforço. Músicas, versículos memorizados, histórias recontadas - repetição fixa.

Paciência e amor são indispensáveis. Crianças se dispersam, perguntam, interrompem. O mestre de crianças precisa de paciência abundante e amor genuíno. Elas percebem quando são amadas.`,
          references: "Marcos 10:13-16; Deuteronômio 6:6-9; Provérbios 22:6; Salmo 78:1-8; 2 Timóteo 3:15",
          questions: [
            "1. Por que ministério infantil é importante?",
            "2. Como crianças aprendem?",
            "3. Por que repetição é necessária?",
            "4. Que qualidades o professor de crianças precisa?",
            "5. Você considera ensinar crianças?"
          ],
          application: "Se você ensina crianças, observe qual método mais as engaja. Se não ensina, ore por quem ensina.",
          summary: "Ensino de crianças requer métodos concretos, repetição, integração à vida, e abundante paciência e amor."
        },
        {
          title: "Ensinando Adolescentes",
          content: `Adolescentes estão em transição crítica. Questionam, buscam identidade, enfrentam pressões únicas. O ensino deve ser relevante às suas lutas reais, não abstrato e desconectado.

Autenticidade é essencial. Adolescentes detectam falsidade rapidamente. O mestre deve ser genuíno, admitir dúvidas, compartilhar lutas. Perfeição fingida afasta; vulnerabilidade autêntica conecta.

Relacionamento precede ensino. Adolescentes ouvem quem se importa com eles. Investir tempo fora da sala, conhecer seus mundos, interessar-se genuinamente abre portas para verdade.

Desafie-os. Adolescentes querem algo pelo que viver. Não amorteça o evangelho; apresente o chamado radical de Cristo. Baixas expectativas geram baixo compromisso. Desafie a grandeza.`,
          references: "1 Timóteo 4:12; Eclesiastes 12:1; Provérbios 1:8-9; Salmo 119:9; Tito 2:6-8",
          questions: [
            "1. Por que adolescência é fase crítica?",
            "2. Por que autenticidade importa?",
            "3. Por que relacionamento precede ensino?",
            "4. Como desafiar adolescentes?",
            "5. Você está preparado para ensinar adolescentes?"
          ],
          application: "Se trabalha com adolescentes, passe tempo com eles fora do contexto formal. Conheça seus mundos.",
          summary: "Ensinar adolescentes requer autenticidade, relacionamento genuíno, relevância às suas lutas e desafio a compromisso radical."
        },
        {
          title: "Ensinando Adultos",
          content: `Adultos trazem experiência e esperam respeito por ela. O ensino de adultos não é transmissão unilateral, mas diálogo que honra o que já viveram enquanto adiciona novas perspectivas.

Adultos querem aplicabilidade imediata. "Como isso ajuda minha vida, família, trabalho?" Se não veem conexão, desengajam. Comece com necessidades sentidas; conduza a verdades bíblicas.

Adultos aprendem fazendo. Menos palestra, mais discussão e prática. Estudos de caso, análise de problemas reais, aplicação imediata - adultos preferem participação ativa.

Respeite limitações de tempo. Adultos são ocupados. Maximize o tempo disponível; não desperdice com frivolidades. Preparação cuidadosa honra a agenda apertada de adultos.`,
          references: "Hebreus 5:14; Tito 2:1-5; 1 Pedro 5:1-4; Colossenses 3:16; Romanos 15:14",
          questions: [
            "1. O que adultos trazem para aprendizagem?",
            "2. Por que aplicabilidade importa?",
            "3. Como adultos preferem aprender?",
            "4. Por que respeitar tempo?",
            "5. Seu ensino de adultos é participativo?"
          ],
          application: "No próximo estudo com adultos, faça menos palestra e mais discussão. Observe a diferença.",
          summary: "Ensino de adultos respeita experiência, enfatiza aplicabilidade, promove participação ativa e honra tempo limitado."
        },
        {
          title: "Avaliando Aprendizagem",
          content: `Avaliação não é só dar notas; é verificar se houve aprendizagem. O mestre precisa saber: os alunos entenderam? Podem aplicar? Estão mudando?

Perguntas durante o ensino revelam compreensão. "Vocês entenderam?" pode receber 'sim' sem entendimento. Perguntas específicas ("O que esse texto ensina sobre X?") testam melhor.

Observação de vida é avaliação suprema. "Pelos frutos os conhecereis" (Mateus 7:16). Mudança de comportamento indica aprendizagem verdadeira. Conhecimento sem obediência é fracasso.

Feedback dos alunos melhora o ensino. Pergunte: O que foi útil? O que não ficou claro? O que você vai fazer diferente? Humildade para ouvir crítica melhora o mestre.`,
          references: "Mateus 7:16-20; Tiago 1:22-25; João 13:17; 2 Timóteo 3:16-17",
          questions: [
            "1. Para que serve avaliação?",
            "2. Como perguntas testam compreensão?",
            "3. Qual é a avaliação suprema?",
            "4. Por que buscar feedback?",
            "5. Você avalia se alunos aprenderam?"
          ],
          application: "Peça feedback a seus alunos sobre seu ensino. Ouça sem defensividade.",
          summary: "Avaliação verifica aprendizagem através de perguntas, observação de vida mudada, e feedback que melhora o ensino."
        },
        {
          title: "Crescendo como Mestre",
          content: `O mestre nunca para de aprender. "Quem ensina, esmere-se no fazê-lo" (Romanos 12:7). Esmerar-se implica crescimento contínuo. Complacência é inimiga da excelência.

Aprenda com outros mestres. Observe como ensinam, que métodos usam, como conectam. Leia sobre pedagogia e didática. A excelência requer estudo do ofício, não apenas do conteúdo.

Peça avaliação honesta. Convide alguém para observar e criticar. Grave-se e assista. Pergunte aos alunos. O que você não vê, outros podem ver. Humildade abre crescimento.

Ore por seus alunos e por si mesmo. O ensino é espiritual; depende do Espírito. Interceda pelos alunos por nome. Peça sabedoria e unção. Dependência de Deus marca o mestre eficaz.`,
          references: "Romanos 12:7; 2 Timóteo 2:15; Provérbios 9:9; Tiago 1:5; Colossenses 1:28-29",
          questions: [
            "1. O mestre para de aprender?",
            "2. Como aprender com outros mestres?",
            "3. Por que buscar avaliação?",
            "4. Por que orar por alunos?",
            "5. Como você está crescendo como mestre?"
          ],
          application: "Identifique um mestre que você admira. Observe-o ensinar e aprenda.",
          summary: "Crescimento como mestre requer aprendizado contínuo, observação de outros, busca de avaliação e dependência de Deus em oração."
        }
      ])
    }
  ]
};

// MÓDULO 12: Teologia Pastoral
const MODULO_12_TEOLOGIA_PASTORAL: ModuleData = {
  id: "nivel3-mod12-teologia-pastoral",
  name: "Teologia Pastoral",
  description: "Fundamentos teológicos para o ministério pastoral",
  icon: "Shepherd",
  color: "#22C55E",
  order: 42,
  tracks: [
    {
      id: "track-n3m12-avancado",
      level: "avancado",
      name: "O Coração do Pastor",
      description: "Desenvolvendo caráter e práticas pastorais",
      requiredPlan: "premium",
      order: 1,
      lessons: createLessons("n3m12", [
        {
          title: "O Chamado Pastoral",
          content: `O chamado pastoral é vocação divina, não escolha de carreira. "Se alguém aspira ao episcopado, excelente obra almeja" (1 Timóteo 3:1). Aspiração legítima deve ser confirmada por qualificação, chamado interno e reconhecimento da igreja.

O pastor é chamado por Deus para cuidar do rebanho. "Apascentai o rebanho de Deus que está entre vós" (1 Pedro 5:2). A metáfora do pastor transmite proteção, alimentação, direção. O rebanho não é seu; é de Deus. Você é sub-pastor.

O chamado é confirmado pela igreja. Não basta sentir-se chamado; a comunidade deve reconhecer. Os apóstolos impuseram as mãos em Paulo e Barnabé (Atos 13:3). A validação coletiva protege contra autoengano.

O ministério pastoral custa. Não é carreira para quem busca conforto, prestígio ou riqueza. "Não tendes parte nem sorte neste ministério" (Atos 8:21) - as motivações importam. Quem entra por razões erradas sairá ferido.`,
          references: "1 Timóteo 3:1-7; 1 Pedro 5:1-4; Atos 13:1-3; 20:28; João 21:15-17",
          questions: [
            "1. O que é chamado pastoral?",
            "2. O que a metáfora do pastor transmite?",
            "3. Como o chamado é confirmado?",
            "4. Por que motivações importam?",
            "5. Você sente ou discerne chamado pastoral?"
          ],
          application: "Se sente chamado, busque confirmação de líderes maduros. Se pastoreia, renove seu senso de chamado.",
          summary: "O chamado pastoral é vocação divina confirmada pela igreja, envolvendo cuidado do rebanho de Deus com motivações puras."
        },
        {
          title: "Qualificações do Pastor",
          content: `Paulo lista qualificações em 1 Timóteo 3 e Tito 1. A ênfase é esmagadoramente em caráter, não competência. "Irrepreensível" encabeça - não sem pecado, mas sem escândalo que desqualifique.

A vida familiar é teste. "Que governe bem a própria casa" (1 Timóteo 3:4). Quem não lidera bem o lar não deve liderar a igreja. A família é o laboratório onde caráter é testado e formado.

"Apto para ensinar" é única habilidade explícita. O pastor deve ser capaz de comunicar verdade. Isso requer estudo contínuo, compreensão da Escritura e capacidade de explicá-la a outros.

"Não neófito" protege contra prematuridade. Novos convertidos não devem liderar; precisam amadurecer. Promover antes do tempo prejudica tanto o líder quanto os liderados. Paciência é sabedoria.`,
          references: "1 Timóteo 3:1-7; Tito 1:5-9; Atos 6:3; 20:28; 1 Pedro 5:2-3",
          questions: [
            "1. O que 'irrepreensível' significa?",
            "2. Por que vida familiar é teste?",
            "3. Qual única habilidade é listada?",
            "4. Por que não neófito?",
            "5. Quais qualificações você precisa desenvolver?"
          ],
          application: "Autoavalie-se pelas qualificações de 1 Timóteo 3. Trabalhe nas áreas fracas.",
          summary: "Qualificações pastorais enfatizam caráter sobre competência, vida familiar saudável, capacidade de ensinar e maturidade espiritual."
        },
        {
          title: "Alimentando o Rebanho",
          content: `A tarefa primária do pastor é alimentar com a Palavra. "Apascenta as minhas ovelhas" (João 21:17). Ovelhas famintas são fracas; o pastor deve prover alimento nutritivo regularmente.

Isso acontece primariamente através de pregação e ensino. "Prega a palavra" (2 Timóteo 4:2). A pregação semanal é essencial, mas não suficiente. Estudos bíblicos, discipulado, ensino em pequenos grupos complementam.

O alimento deve ser balanceado. "Todo o conselho de Deus" (Atos 20:27). Não apenas favoritos; não apenas exortação ou apenas encorajamento. Toda Escritura para toda a congregação. Variedade nutre plenamente.

O pastor deve alimentar a si mesmo primeiro. Você não pode dar o que não tem. Estudo pessoal, não apenas preparação de sermões. "Tem cuidado de ti mesmo e da doutrina" (1 Timóteo 4:16) - cuidado pessoal precede doutrina.`,
          references: "João 21:15-17; 2 Timóteo 4:2; Atos 20:27-28; 1 Timóteo 4:16; 1 Pedro 5:2",
          questions: [
            "1. Qual é a tarefa primária do pastor?",
            "2. Como o rebanho é alimentado?",
            "3. O que significa alimento 'balanceado'?",
            "4. Por que o pastor se alimenta primeiro?",
            "5. Seu rebanho está bem alimentado?"
          ],
          application: "Avalie: você está estudando para si mesmo ou só para sermões? Reserve tempo para alimentação pessoal.",
          summary: "Alimentar o rebanho através de pregação e ensino balanceado de toda a Escritura é tarefa primária, exigindo que o pastor se alimente primeiro."
        },
        {
          title: "Protegendo o Rebanho",
          content: `O pastor protege contra lobos. "Entrarão no meio de vós lobos cruéis" (Atos 20:29). Falsos mestres, heresias, influências destrutivas ameaçam. O pastor vigia e defende.

Proteção requer conhecimento da verdade. Quem não conhece a verdade não reconhece o erro. O pastor deve ser tão versado em doutrina sadia que detecte desvios rapidamente. Estudo contínuo é armadura.

Proteção às vezes exige confronto. "Reprova-os severamente" (Tito 1:13). Não é popular; é necessário. Pastores que evitam confronto deixam ovelhas expostas. Amor verdadeiro protege mesmo quando dói.

Proteção inclui disciplina. Quando membro vive em pecado escandaloso, a disciplina protege a pessoa (buscando arrependimento) e o rebanho (prevenindo contágio). Disciplina negligenciada desprotege todos.`,
          references: "Atos 20:28-31; Tito 1:9-13; 1 Timóteo 5:19-20; Mateus 18:15-17; 1 Coríntios 5:1-13",
          questions: [
            "1. Contra o que o pastor protege?",
            "2. Por que conhecimento da verdade é necessário?",
            "3. Por que confronto às vezes é necessário?",
            "4. O que é disciplina eclesiástica?",
            "5. Você está protegendo ou negligenciando?"
          ],
          application: "Identifique uma ameaça potencial ao seu rebanho. Planeje como proteger contra ela.",
          summary: "O pastor protege contra lobos através de conhecimento da verdade, confronto quando necessário e disciplina que busca restauração."
        },
        {
          title: "Pastoreio Individual",
          content: `Pastorear não é só pregar; é conhecer ovelhas individualmente. Jesus "chama as suas ovelhas pelo nome" (João 10:3). Grandes igrejas dificultam, mas sistemas podem ajudar o pastor conhecer pessoas.

Visitas pastorais são insubstituíveis. "Lembrai-vos dos presos... e dos maltratados" (Hebreus 13:3). Hospitais, lares de luto, crises - a presença do pastor comunica cuidado. Não delegue tudo; faça você mesmo o essencial.

Aconselhamento é parte do pastoreio. Casamentos em crise, pais desesperados, deprimidos - pessoas procuram o pastor. Você não precisa ser terapeuta, mas deve saber ouvir, aplicar Escritura e encaminhar quando necessário.

O cuidado pastoral é sacerdotal. O pastor representa Deus para o povo e o povo para Deus. Interceder pelas ovelhas é trabalho invisível, mas essencial. "Não cesso de dar graças a vós, fazendo menção de vós nas minhas orações" (Efésios 1:16).`,
          references: "João 10:3, 14; Hebreus 13:3, 17; Atos 20:31; Colossenses 1:28-29; 1 Tessalonicenses 2:11-12",
          questions: [
            "1. Pastorear é só pregar?",
            "2. Por que visitas pastorais importam?",
            "3. Qual é o papel do pastor em aconselhamento?",
            "4. O que significa função 'sacerdotal'?",
            "5. Você conhece suas ovelhas pelo nome?"
          ],
          application: "Faça uma visita pastoral esta semana a alguém que precisa. Presença fala.",
          summary: "Pastoreio individual inclui conhecer ovelhas pelo nome, visitas em momentos cruciais, aconselhamento bíblico e intercessão sacerdotal."
        },
        {
          title: "Liderança Pastoral",
          content: `O pastor lidera, não apenas administra. "Os presbíteros que governam bem" (1 Timóteo 5:17). Governar implica direção, decisão, influência. O rebanho precisa de direção clara.

Liderança pastoral é por exemplo. "Servindo de modelo" (1 Pedro 5:3). O pastor vai na frente; ovelhas seguem. Palavras sem exemplo perdem autoridade. "Faze-te padrão dos fiéis" (1 Timóteo 4:12).

Liderança pastoral não é autoritarismo. "Não como dominadores" (1 Pedro 5:3). Jesus lavou pés; o pastor serve. Autoridade vem de caráter e serviço, não de posição ou título.

Liderança pastoral envolve visão. Para onde o rebanho está indo? Qual é o próximo passo? O pastor discerne direção e comunica claramente. Sem visão, o povo se dispersa (Provérbios 29:18).`,
          references: "1 Timóteo 5:17; 1 Pedro 5:2-3; 1 Timóteo 4:12; Hebreus 13:7, 17; Provérbios 29:18",
          questions: [
            "1. Pastor é só administrador?",
            "2. Por que exemplo é fundamental?",
            "3. Qual a diferença entre liderança e autoritarismo?",
            "4. Qual o papel da visão?",
            "5. Você lidera por exemplo?"
          ],
          application: "Articule a visão para seu ministério em uma ou duas frases. Comunique-a claramente.",
          summary: "Liderança pastoral é por exemplo, não autoritarismo, envolvendo direção clara e visão comunicada, servindo como modelo."
        },
        {
          title: "O Pastor e Sua Família",
          content: `A família do pastor é prioridade. "Que governe bem a própria casa" (1 Timóteo 3:4). Se você perde a família pelo ministério, perdeu o ministério também. Família primeiro; igreja segundo.

O cônjuge não é funcionário da igreja. Espectativas irreais de congregações podem sobrecarregar. Proteja seu cônjuge; não permita que expectativas injustas pesem. Ela (ou ele) é sua primeira ovelha.

Filhos de pastores enfrentam pressões únicas. Viver em vitrine, expectativas de perfeição, competição com 'filhos da igreja' - esses desafios requerem atenção intencional. Priorize tempo com filhos; não os sacrifique no altar do ministério.

Cuide de sua saúde conjugal. O casamento pastoral sofre ataques. Invista no relacionamento; não dê as sobras. Data regular, comunicação aberta, intimidade cultivada - sua família precisa do melhor de você, não do resto.`,
          references: "1 Timóteo 3:4-5, 12; Tito 1:6; Efésios 5:25-33; 6:4; Provérbios 22:6",
          questions: [
            "1. Por que família é prioridade?",
            "2. O cônjuge é funcionário da igreja?",
            "3. Que pressões filhos de pastores enfrentam?",
            "4. Como cuidar do casamento?",
            "5. Sua família recebe o melhor ou as sobras?"
          ],
          application: "Planeje tempo protegido para sua família esta semana. Não cancele por 'emergências' da igreja.",
          summary: "A família do pastor é prioridade sobre a igreja; o cônjuge deve ser protegido e filhos recebem atenção intencional contra pressões únicas."
        },
        {
          title: "Autocuidado Pastoral",
          content: `Pastores sofrem taxas altas de burnout, depressão e abandono de ministério. "Têm cuidado de vós mesmos" (Atos 20:28) - vem antes de "e de todo o rebanho". Você não pode cuidar de outros se não cuidar de si.

Saúde espiritual exige cultivo. Não confunda preparação de sermões com devoção pessoal. Você precisa de tempo com Deus para você, não para ensinar. A fonte precisa ser preenchida para transbordar.

Saúde física importa. Sono, exercício, alimentação - pastores frequentemente negligenciam. "Honrai a Deus com o vosso corpo" (1 Coríntios 6:20). Corpo exausto prejudica ministério.

Saúde emocional e relacional também. Tenha amigos fora do ministério. Tenha mentor ou conselheiro. Tire folgas e férias verdadeiras. Sabbath é mandamento, não sugestão. Deus descansou; você também deve.`,
          references: "Atos 20:28; 1 Coríntios 6:19-20; Marcos 6:31; 1 Reis 19:5-8; 3 João 2",
          questions: [
            "1. Por que pastores sofrem burnout?",
            "2. O que é saúde espiritual pessoal?",
            "3. Por que saúde física importa?",
            "4. O que é sabbath?",
            "5. Você está cuidando de si mesmo?"
          ],
          application: "Identifique área de autocuidado negligenciada. Faça uma mudança concreta esta semana.",
          summary: "Autocuidado pastoral abrange saúde espiritual, física, emocional e relacional, incluindo descanso e folgas regulares."
        },
        {
          title: "Relacionamento com Liderança",
          content: `Pastores raramente lideram sozinhos. Presbíteros, diáconos, líderes de ministérios - trabalho em equipe é bíblico. "Onde não há conselho, fracassam os projetos" (Provérbios 15:22).

O pastor é 'primeiro entre iguais' na maioria dos contextos. Lidera, mas não domina. Ouve, não apenas fala. Decisões importantes são compartilhadas; o pastor não é ditador.

Conflito com liderança é inevitável ocasionalmente. Como resolvê-lo biblicamente? Mateus 18 aplica-se: conversa direta, mediação se necessário. Não triangule, não fofoque. Resolva conflitos; não os deixe apodrecer.

Selecionar e treinar líderes é investimento estratégico. "Transmite a homens fiéis" (2 Timóteo 2:2). A saúde futura da igreja depende da liderança que você desenvolve hoje.`,
          references: "Provérbios 15:22; Atos 20:28; 1 Pedro 5:1-4; Tito 1:5; 2 Timóteo 2:2",
          questions: [
            "1. Pastor lidera sozinho?",
            "2. O que significa 'primeiro entre iguais'?",
            "3. Como resolver conflito com liderança?",
            "4. Por que desenvolver líderes?",
            "5. Como está seu relacionamento com liderança?"
          ],
          application: "Avalie seus relacionamentos com outros líderes. Há algo a resolver ou desenvolver?",
          summary: "O pastor trabalha em equipe com outros líderes, resolvendo conflitos biblicamente e investindo estrategicamente no desenvolvimento de novos líderes."
        },
        {
          title: "Transições e Conclusões",
          content: `Todo pastorado tem fim. Alguns terminam bem; outros mal. Preparar para transições saudáveis é sabedoria. Como você deixará o rebanho quando for hora?

Desenvolva sucessores. Quem pode continuar quando você sair? Se não há resposta, você falhou em uma tarefa chave. Não construa ministério dependente de você; construa ministério que sobrevive a você.

Quando é hora de partir? Alguns sinais: crescimento estagnou há anos, relacionamentos deterioraram, chamado para novo lugar. Nem sempre fácil discernir; busque conselho de sábios.

Termine bem. Não saia em amargura, conflito ou fuga. Quando possível, transite gradualmente. Afirme o sucessor. Retire-se graciosamente. Como você termina importa tanto quanto como você serviu.`,
          references: "2 Timóteo 4:6-8; Atos 20:32; João 17:4; 1 Coríntios 3:6-9; Filipenses 1:6",
          questions: [
            "1. Todo pastorado tem fim?",
            "2. Por que desenvolver sucessores?",
            "3. Como saber quando partir?",
            "4. O que significa terminar bem?",
            "5. Você está preparando para sua transição eventual?"
          ],
          application: "Identifique alguém que você poderia desenvolver como possível sucessor. Comece a investir nele.",
          summary: "Todo pastorado termina; desenvolver sucessores e transitar graciosamente são responsabilidades que preparam a igreja para continuidade."
        }
      ])
    }
  ]
};

// MÓDULO 13: Apologética Avançada
const MODULO_13_APOLOGETICA_AVANCADA: ModuleData = {
  id: "nivel3-mod13-apologetica-avancada",
  name: "Apologética Avançada",
  description: "Defesa aprofundada da fé contra objeções contemporâneas",
  icon: "ShieldCheck",
  color: "#EF4444",
  order: 43,
  tracks: [
    {
      id: "track-n3m13-avancado",
      level: "avancado",
      name: "Respondendo Desafios Contemporâneos",
      description: "Apologética para o século XXI",
      requiredPlan: "premium",
      order: 1,
      lessons: createLessons("n3m13", [
        {
          title: "Apologética no Contexto Pós-Moderno",
          content: `O contexto cultural mudou. O modernismo confiava na razão; o pós-modernismo desconfia. "Verdade absoluta" é vista com suspeita. A apologética deve adaptar-se sem comprometer.

Verdade objetiva permanece. "Eu sou o caminho, a verdade e a vida" (João 14:6). O pós-modernismo nega verdade; o cristianismo a afirma. Mas como comunicar verdade a quem rejeita o próprio conceito?

Narrativa e relacionamento ganham importância. Argumentos lógicos são necessários, mas insuficientes. Histórias pessoais de transformação conectam. Relacionamentos autênticos abrem portas. A verdade é vivida antes de ser argumentada.

Humildade não compromete convicção. Podemos afirmar verdade sem arrogância. "Com mansidão e temor" (1 Pedro 3:15) ressoa com cultura que rejeita dogmatismo intolerante. Certeza firme com postura gentil.`,
          references: "João 14:6; 18:38; 1 Pedro 3:15-16; 2 Timóteo 2:24-26; Colossenses 4:5-6",
          questions: [
            "1. Como o pós-modernismo difere do modernismo?",
            "2. O pós-modernismo tem razão sobre verdade?",
            "3. Por que narrativa e relacionamento importam?",
            "4. Como ser humilde sem comprometer?",
            "5. Como você comunica verdade hoje?"
          ],
          application: "Na próxima conversa apologética, compartilhe também sua história, não apenas argumentos.",
          summary: "O contexto pós-moderno requer apologética que combine verdade objetiva com humildade, narrativa pessoal e relacionamento autêntico."
        },
        {
          title: "Respondendo ao Novo Ateísmo",
          content: `O novo ateísmo (Dawkins, Hitchens, Harris) é mais agressivo que o antigo. Não apenas descrê; ataca ativamente a religião como nociva. Seus argumentos merecem resposta.

O argumento 'Deus como hipótese científica' é categoria errada. Ciência investiga causas naturais; Deus é sobrenatural. Perguntar se Deus existe cientificamente é como perguntar se amor existe quimicamente. Domínios diferentes.

A acusação de que 'religião causa violência' ignora evidência. Regimes ateus (Stalin, Mao, Pol Pot) mataram mais que todas as guerras religiosas combinadas. O problema é o coração humano, não religião per se.

O argumento moral se volta contra o ateísmo. "Religião é má" pressupõe padrão moral objetivo. De onde vem? Se não há Deus, não há base para 'bem' e 'mal'. Ateus vivem de capital emprestado.`,
          references: "Salmo 14:1; Romanos 1:18-23; 2:14-15; Atos 17:22-31; 1 Coríntios 1:20-25",
          questions: [
            "1. O que caracteriza o novo ateísmo?",
            "2. Por que Deus não é 'hipótese científica'?",
            "3. Religião causa mais violência que ateísmo?",
            "4. Como o argumento moral refuta ateísmo?",
            "5. Como você responderia a um 'novo ateu'?"
          ],
          application: "Leia sobre um argumento do novo ateísmo e pesquise respostas. Esteja preparado.",
          summary: "O novo ateísmo falha ao tratar Deus como hipótese científica, ignorar violência ateísta, e usar moralidade sem fundamento."
        },
        {
          title: "Ciência e Fé: Questões de Criação",
          content: `Evolução e idade do universo são objeções frequentes. Cristãos discordam sobre interpretação de Gênesis, mas concordam: Deus é Criador. A questão é 'como', não 'se'.

Criacionismo da Terra Jovem lê Gênesis 1 literalmente: seis dias de 24 horas, universo de ~6.000 anos. Defende que ciência pode ser reinterpretada para acomodar isso.

Criacionismo da Terra Antiga aceita idade científica (~13.8 bilhões de anos para universo, ~4.5 bilhões para Terra), mas rejeita evolução darwiniana. "Dias" podem ser eras longas (day-age) ou há gaps no texto (gap theory).

Evolução teísta aceita evolução como mecanismo que Deus usou. Argumenta que Gênesis não é ciência, mas teologia: Deus é Criador; humanos são especiais; queda é real.

O essencial: Deus criou; humanos são imago Dei; queda é histórica. Detalhes de "como" permitem diversidade entre cristãos fiéis. Não divida sobre secundários; una no essencial.`,
          references: "Gênesis 1-2; Salmo 19:1; 104; Romanos 1:20; Hebreus 11:3; Colossenses 1:16-17",
          questions: [
            "1. Quais são as posições cristãs sobre criação?",
            "2. O que criacionistas da Terra Jovem creem?",
            "3. O que criacionistas da Terra Antiga creem?",
            "4. O que evolucionistas teístas creem?",
            "5. O que é essencial em todas as posições?"
          ],
          application: "Estude posições que diferem da sua com mente aberta. O que você pode aprender?",
          summary: "Cristãos fiéis têm diferentes posições sobre criação; o essencial é que Deus criou, humanos são imagem de Deus, e a queda é histórica."
        },
        {
          title: "O Problema do Mal Revisitado",
          content: `O problema do mal é a objeção emocional mais forte. Ver sofrimento de inocentes desafia fé. A resposta teórica não satisfaz quem sofre; mas mesmo teoria tem lugar.

A versão lógica do problema (mal prova que Deus não existe) foi abandonada por filósofos. Alvin Plantinga mostrou: livre-arbítrio torna mal logicamente compatível com Deus bom. Não há contradição necessária.

A versão evidencial (tanto mal torna Deus improvável) é mais desafiadora. Resposta inclui: não conhecemos todos os propósitos de Deus (Jó); mal serve a bens maiores (José); esta não é a história completa (escatologia).

A resposta cristã é única. Deus não observa de longe; entrou no sofrimento. A cruz é Deus sofrendo com e por nós. Não temos respostas completas, mas temos um Deus que sofreu. Isso é conforto profundo.`,
          references: "Jó 38-42; Gênesis 50:20; Romanos 8:28; Isaías 53:4-5; 2 Coríntios 1:3-5",
          questions: [
            "1. Qual é a diferença entre versão lógica e evidencial?",
            "2. Como livre-arbítrio responde à versão lógica?",
            "3. Como responder à versão evidencial?",
            "4. O que a cruz significa para o problema do mal?",
            "5. Como você responde pessoalmente ao sofrimento?"
          ],
          application: "Prepare-se para confortar, não apenas argumentar, quando alguém sofre.",
          summary: "O problema do mal não refuta Deus logicamente; a resposta cristã única é um Deus que entrou no sofrimento através da cruz."
        },
        {
          title: "Confiabilidade dos Evangelhos",
          content: `Críticos questionam: os evangelhos são história confiável ou lenda posterior? A resposta afeta todo o cristianismo. Se Jesus não disse e fez o que os evangelhos narram, a fé é vã.

Datação importa. Marcos foi escrito ~55-65 d.C., ~25-35 anos após a crucificação. Testemunhas oculares viviam. Lendas precisam de séculos para desenvolver; os evangelhos surgiram cedo demais para serem lendas.

Critérios de autenticidade apoiam os relatos. Múltipla atestação (diferentes fontes independentes), dissimilaridade (coisas que a igreja não inventaria), embaraço (Pedro nega; discípulos dormem), coerência - todos apontam para historicidade.

Manuscritos abundantes confirmam transmissão confiável. Mais de 5.800 manuscritos gregos, alguns muito próximos dos originais. Nenhum livro antigo tem comparável atestação. O que lemos hoje é essencialmente o que foi escrito.`,
          references: "Lucas 1:1-4; 1 Coríntios 15:3-8; 2 Pedro 1:16; João 20:30-31; 21:24",
          questions: [
            "1. Por que datação dos evangelhos importa?",
            "2. O que são critérios de autenticidade?",
            "3. O que a evidência manuscrita mostra?",
            "4. Evangelhos são lendas tardias?",
            "5. Você pode confiar nos evangelhos?"
          ],
          application: "Estude evidências para confiabilidade dos evangelhos. Use em conversas.",
          summary: "Os evangelhos foram escritos cedo demais para serem lendas, com critérios de autenticidade e atestação manuscrita excepcional."
        },
        {
          title: "Religiões Comparadas",
          content: `Muitas religiões existem; o cristianismo é único? Não é arrogância afirmar? Comparação honesta revela diferenças fundamentais, não apenas variações superficiais.

Todas as religiões ensinam o mesmo? Não. Hinduísmo: muitos deuses ou Brahman impessoal. Budismo: nem Deus criador. Islã: Jesus é profeta, não Deus. Contradições lógicas - não podem ser todos verdadeiros.

O cristianismo é único na graça. Outras religiões prescrevem obras para alcançar salvação ou iluminação. O cristianismo anuncia: Cristo fez; você recebe. Graça é distintivo; não é universal.

A ressurreição distingue. Buda morreu; está morto. Maomé morreu; está morto. Jesus morreu e ressuscitou - há evidência histórica. A ressurreição valida Suas afirmações exclusivistas.`,
          references: "João 14:6; Atos 4:12; 17:22-31; 1 Timóteo 2:5; 1 Coríntios 15:17",
          questions: [
            "1. Todas as religiões ensinam o mesmo?",
            "2. O que distingue graça cristã?",
            "3. Por que a ressurreição é distintivo?",
            "4. É arrogância afirmar a verdade do cristianismo?",
            "5. Como dialogar com pessoas de outras religiões?"
          ],
          application: "Aprenda sobre outra religião. Identifique diferenças fundamentais, não apenas superficiais.",
          summary: "O cristianismo difere fundamentalmente de outras religiões em graça (não obras) e ressurreição histórica como validação."
        },
        {
          title: "Ética Sexual e Bioética",
          content: `Questões sexuais e bioéticas são fronteiras apologéticas contemporâneas. A cultura mudou rapidamente; cristãos parecem retrógrados. Como defender posições bíblicas com graça e razão?

A ética sexual cristã não é arbitrária; flui de design criacional. "Macho e fêmea os criou... deixará o homem pai e mãe e se unirá à sua mulher" (Gênesis 1:27; 2:24). Jesus reafirmou esse design (Mateus 19:4-6).

Argumentos naturalistas também apoiam. Complementaridade biológica, reprodução, estrutura familiar para criação de filhos - razões não-religiosas convergem com ensinamento bíblico. Fé e razão se complementam.

Amor verdadeiro inclui verdade. "Seguindo a verdade em amor" (Efésios 4:15). Concordar com tudo não é amor; é covardia. Amor busca o bem real, não aprovação momentânea. Mas verdade sem amor é brutalidade.`,
          references: "Gênesis 1:27; 2:24; Mateus 19:4-6; Romanos 1:26-27; 1 Coríntios 6:18-20; Efésios 4:15",
          questions: [
            "1. A ética sexual cristã é arbitrária?",
            "2. Que razões não-religiosas apoiam ética bíblica?",
            "3. O que é amor verdadeiro?",
            "4. Como falar verdade em amor?",
            "5. Você está preparado para essas conversas?"
          ],
          application: "Prepare-se para conversas sobre ética sexual com graça e verdade, não combatividade.",
          summary: "A ética sexual cristã flui do design criacional, é apoiada por razões naturais, e deve ser comunicada com verdade e amor."
        },
        {
          title: "Pluralismo e Tolerância",
          content: `A cultura valoriza tolerância e pluralismo. "Todas as religiões são válidas" parece gentil. Afirmar exclusividade parece intolerante. Como navegar?

Tolerância clássica significa respeitar pessoas com quem discordamos. Tolerância nova significa afirmar todas as posições como igualmente válidas. Cristãos praticam a primeira; a segunda é logicamente impossível (posições contraditórias não podem ser todas verdadeiras).

Exclusivismo não é ódio. Você pode respeitar pessoas enquanto discorda de suas crenças. Jesus morreu por todos enquanto afirmava ser o único caminho. Amor supremo; verdade inabalável.

A tolerância moderna é seletivamente aplicada. Os mesmos que pregam tolerância são intolerantes com cristãos. Isso revela que todos têm limites; a questão é quais são os limites certos.`,
          references: "João 14:6; Atos 4:12; 17:16-34; Romanos 14:1-12; 1 Coríntios 8:1-13",
          questions: [
            "1. O que é tolerância clássica?",
            "2. Por que tolerância nova é problemática?",
            "3. Exclusivismo significa ódio?",
            "4. A tolerância moderna é consistente?",
            "5. Como você equilibra convicção e respeito?"
          ],
          application: "Pratique respeito por pessoas enquanto mantém convicções. Isso é tolerância verdadeira.",
          summary: "Tolerância verdadeira respeita pessoas enquanto discorda de ideias; exclusivismo cristão não é ódio, mas afirmação de verdade com amor."
        },
        {
          title: "Apologética e Evangelismo",
          content: `Apologética serve ao evangelismo. O objetivo não é vencer debates, mas ganhar pessoas. Argumentos removem obstáculos; o Espírito convence. Apologética prepara o solo; evangelismo planta a semente.

Respostas satisfatórias nem sempre levam à conversão. Pessoas podem ter resposta a cada objeção e ainda rejeitar. O problema último é o coração, não a cabeça. "Preferem as trevas" (João 3:19).

O testemunho pessoal complementa argumentos. "Eu era cego, agora vejo" (João 9:25) é irrefutável. Sua história de transformação é evidência viva. Combine razão e testemunho.

Viva o que defende. Hipócritas destroem apologética. Se você argumenta pelo cristianismo mas não o vive, refutou a si mesmo. A vida coerente é o argumento mais poderoso.`,
          references: "1 Pedro 3:15-16; João 3:19; 9:25; Atos 26:1-29; Colossenses 4:5-6",
          questions: [
            "1. Qual é o objetivo final da apologética?",
            "2. Por que respostas satisfatórias nem sempre convencem?",
            "3. Por que testemunho pessoal importa?",
            "4. Como hipocrisia afeta apologética?",
            "5. Sua vida valida ou refuta seus argumentos?"
          ],
          application: "Combine argumento e testemunho na próxima conversa evangelística.",
          summary: "Apologética serve ao evangelismo removendo obstáculos; testemunho pessoal e vida coerente complementam argumentos racionais."
        },
        {
          title: "Recursos para Crescimento Contínuo",
          content: `O apologista nunca para de aprender. Novas objeções surgem; velhas reaparecem disfarçadas. Crescimento contínuo é necessário para relevância.

Livros fundamentais devem ser estudados. Autores como C.S. Lewis, Alvin Plantinga, William Lane Craig, Tim Keller oferecem bases sólidas. Não precisa concordar com tudo; aprenda de todos.

Pratique em conversas reais. Teoria sem prática é acadêmica. Engaje com céticos, ateístas, pessoas de outras religiões. Conversas reais refinam argumentos e desenvolvem sensibilidade.

Lembre-se: a apologética é dons do Espírito. "Dar-vos-ei boca e sabedoria" (Lucas 21:15). Ore por sabedoria e oportunidades. Dependência de Deus supera preparação meramente humana.`,
          references: "1 Pedro 3:15; Colossenses 4:5-6; 2 Timóteo 2:24-26; Lucas 21:15; Tiago 1:5",
          questions: [
            "1. O apologista para de aprender?",
            "2. Que autores fundamentais estudar?",
            "3. Por que prática é essencial?",
            "4. Qual é o papel do Espírito?",
            "5. Qual é seu próximo passo em crescimento?"
          ],
          application: "Escolha um livro de apologética para estudar no próximo mês. Engaje em conversas reais.",
          summary: "Apologistas crescem continuamente através de leitura, prática em conversas reais, e dependência do Espírito Santo para sabedoria."
        }
      ])
    }
  ]
};

// MÓDULO 14: Cosmovisão Cristã
const MODULO_14_COSMOVISAO: ModuleData = {
  id: "nivel3-mod14-cosmovisao",
  name: "Cosmovisão Cristã",
  description: "Desenvolvendo pensamento bíblico sobre todas as áreas da vida",
  icon: "Globe2",
  color: "#8B5CF6",
  order: 44,
  tracks: [
    {
      id: "track-n3m14-avancado",
      level: "avancado",
      name: "Pensando Biblicamente",
      description: "Aplicando a fé a toda a realidade",
      requiredPlan: "premium",
      order: 1,
      lessons: createLessons("n3m14", [
        {
          title: "O Que é Cosmovisão",
          content: `Cosmovisão é o conjunto de pressupostos fundamentais através dos quais interpretamos toda a realidade. Todos têm uma, consciente ou não. A questão é: sua cosmovisão é verdadeira?

Uma cosmovisão responde perguntas fundamentais: De onde viemos? (origem) Quem somos? (identidade) O que está errado? (problema) Qual é a solução? (redenção) Para onde vamos? (destino). Diferentes cosmovisões dão respostas diferentes.

A cosmovisão afeta tudo. Não existe neutralidade. Política, economia, ética, arte, ciência - todos são interpretados através de lentes. "Transformai-vos pela renovação do vosso entendimento" (Romanos 12:2). A mente renovada vê diferentemente.

A cosmovisão cristã é baseada na revelação de Deus. Não construímos a partir de razão autônoma; recebemos de Deus que fala. A Escritura é a lente através da qual vemos tudo o mais corretamente.`,
          references: "Romanos 12:1-2; Colossenses 2:8; 2 Coríntios 10:5; Provérbios 9:10; Salmo 36:9",
          questions: [
            "1. O que é cosmovisão?",
            "2. Que perguntas uma cosmovisão responde?",
            "3. Existe neutralidade?",
            "4. Em que a cosmovisão cristã é baseada?",
            "5. Sua cosmovisão é conscientemente cristã?"
          ],
          application: "Identifique uma área de sua vida onde você talvez pense mais culturalmente que biblicamente.",
          summary: "Cosmovisão é o conjunto de pressupostos que interpretam a realidade; a cosmovisão cristã é baseada na revelação de Deus na Escritura."
        },
        {
          title: "Criação, Queda, Redenção, Restauração",
          content: `A narrativa bíblica em quatro atos fornece estrutura para cosmovisão. Criação: Deus fez tudo bom. Queda: pecado corrompeu tudo. Redenção: Cristo restaura. Restauração: nova criação virá.

Criação afirma bondade do mundo material. Não é ilusão (como em algumas religiões orientais) nem tudo que importa (como no materialismo). É bom, mas não final. Desfrutamos sem idolatrar.

Queda explica o que está errado. O problema não é ignorância (iluminismo) nem matéria (platonismo) nem opressão apenas (marxismo). É rebelião contra Deus. O diagnóstico correto é pré-requisito para cura.

Redenção é a solução de Deus, não humana. Salvação não vem de educação, tecnologia, política ou evolução. Vem de Cristo crucificado e ressuscitado. A humanidade não se salva; é salva.

Restauração orienta esperança. O destino não é escape do mundo, mas mundo renovado. Nova criação, não abandono da criação. Isso afeta como vivemos agora - cultivando o que será aperfeiçoado.`,
          references: "Gênesis 1-3; Romanos 5:12-21; 8:18-25; Apocalipse 21-22; Colossenses 1:15-20",
          questions: [
            "1. Quais são os quatro atos da narrativa bíblica?",
            "2. O que a criação afirma?",
            "3. Qual é o problema segundo a queda?",
            "4. De onde vem a redenção?",
            "5. Qual é o destino final?"
          ],
          application: "Use criação-queda-redenção-restauração para analisar um problema atual.",
          summary: "A narrativa bíblica de criação, queda, redenção e restauração fornece estrutura para entender toda a realidade corretamente."
        },
        {
          title: "Cosmovisões Competidoras",
          content: `Cosmovisões competem pelo coração humano. Naturalismo, panteísmo, pós-modernismo, islamismo - cada uma oferece respostas diferentes às perguntas fundamentais.

O naturalismo afirma: só existe matéria; não há sobrenatural. Origem: acaso. Problema: falha evolutiva. Solução: ciência e educação. Destino: extinção. Consequência: sem propósito último, sem moralidade objetiva.

O panteísmo (hinduísmo, Nova Era) afirma: tudo é deus; individualidade é ilusão. Problema: ignorância. Solução: iluminação. Destino: absorção no todo. Consequência: mal também é divino; não há distinção clara bem/mal.

O pós-modernismo nega verdade objetiva e metanarrativas. Tudo é construção social e poder. Consequência: relativismo moral e epistêmico; contradição interna (afirma absolutamente que não há absolutos).

A cosmovisão cristã explica a realidade mais completamente. Origem pessoal explica personalidade. Queda explica mal sem torná-lo necessário. Redenção oferece esperança. Coerência interna e adequação à realidade.`,
          references: "Colossenses 2:8; 1 João 4:1-6; Atos 17:16-34; Romanos 1:18-32; 1 Coríntios 1:18-25",
          questions: [
            "1. O que o naturalismo afirma?",
            "2. O que o panteísmo afirma?",
            "3. O que o pós-modernismo afirma?",
            "4. Quais são problemas de cada cosmovisão?",
            "5. Por que a cosmovisão cristã é superior?"
          ],
          application: "Identifique qual cosmovisão mais influencia sua cultura local. Como o cristianismo a desafia?",
          summary: "Naturalismo, panteísmo e pós-modernismo falham onde a cosmovisão cristã oferece explicação coerente e completa da realidade."
        },
        {
          title: "Fé e Razão",
          content: `Fé e razão não são inimigas. "Amarás o Senhor teu Deus... de todo o teu entendimento" (Marcos 12:30). Deus deu razão; espera que usemos. Fé não é salto cego; é confiança baseada em evidência.

A razão tem limites. Está corrompida pela queda ("obscurecido o entendimento" - Efésios 4:18). Não pode descobrir Deus autonomamente. Precisa de revelação e iluminação do Espírito.

A revelação não contradiz razão; transcende. Trindade, encarnação, ressurreição - não são irracionais (contra razão), são supraracionais (além da razão). A razão pode recebê-las, não as inventaria.

Fé e razão cooperam. Fé busca entendimento (Anselmo: credo ut intelligam). Razão apoia fé (apologética). Ambas são dons de Deus para conhecê-Lo. Nem fideísmo (fé sem razão) nem racionalismo (razão sem fé).`,
          references: "Marcos 12:30; Isaías 1:18; Romanos 12:1-2; 1 Pedro 3:15; 2 Coríntios 10:5",
          questions: [
            "1. Fé e razão são inimigas?",
            "2. Quais são os limites da razão?",
            "3. A revelação contradiz a razão?",
            "4. Como fé e razão cooperam?",
            "5. Você usa razão em sua fé?"
          ],
          application: "Desenvolva um argumento racional para uma verdade que você crê. Fé e razão juntas.",
          summary: "Fé e razão cooperam; razão tem limites que revelação supre; ambas são dons de Deus para conhecê-Lo verdadeiramente."
        },
        {
          title: "Trabalho e Vocação",
          content: `A cosmovisão cristã redime o trabalho. Não é maldição pós-queda (trabalho existia antes - Gênesis 2:15); é vocação. "Tudo quanto fizerdes, fazei-o de todo o coração, como ao Senhor" (Colossenses 3:23).

Toda vocação legítima pode glorificar a Deus. O carpinteiro, o médico, o artista, o empresário - todos podem servir a Deus em sua esfera. Não há dicotomia sagrado/secular. Há trabalho feito para Deus ou não.

O trabalho participa do mandato cultural. "Enchei a terra, e sujeitai-a" (Gênesis 1:28). Desenvolvemos a criação, criamos cultura, servimos o próximo. Nosso trabalho tem significado cósmico, não apenas econômico.

O trabalho será redimido na nova criação. Não é atividade temporária sem valor eterno. O que fazemos para a glória de Deus tem permanência. A nova Jerusalém inclui civilização; cultura redimida continua.`,
          references: "Gênesis 1:28; 2:15; Colossenses 3:23-24; Efésios 6:5-8; 1 Coríntios 10:31",
          questions: [
            "1. O trabalho é maldição?",
            "2. Há vocações 'sagradas' e 'seculares'?",
            "3. O que é mandato cultural?",
            "4. O trabalho tem valor eterno?",
            "5. Você vê seu trabalho como vocação?"
          ],
          application: "Reflita: como seu trabalho serve a Deus e ao próximo? Como pode fazer melhor?",
          summary: "O trabalho é vocação que glorifica a Deus, participa do mandato cultural, e tem significado que transcende o econômico para o eterno."
        },
        {
          title: "Política e Governo",
          content: `Governo é ordenação de Deus. "Não há autoridade que não proceda de Deus" (Romanos 13:1). Isso não significa todo governo é bom; significa governo é instituição legítima. Anarquia não é opção cristã.

O propósito do governo é limitar mal e promover bem. "Ministro de Deus para teu bem" (Romanos 13:4). Justiça, ordem, proteção dos fracos - estas são funções legítimas. Governo não salva; apenas restringe.

O cristão é cidadão de dois reinos. Obedece autoridades terrestres ("dai a César" - Mateus 22:21), mas lealdade suprema é a Cristo ("mais importa obedecer a Deus que aos homens" - Atos 5:29). Quando conflitam, Deus prevalece.

Engajamento político é legítimo, mas limitado. Política não é salvação. Mudança verdadeira vem do evangelho, não de legislação. Participe; não idolatre. Mantenha esperança em Cristo, não em partidos.`,
          references: "Romanos 13:1-7; Mateus 22:21; Atos 5:29; 1 Pedro 2:13-17; 1 Timóteo 2:1-4",
          questions: [
            "1. O governo é ordenação de Deus?",
            "2. Qual é o propósito do governo?",
            "3. O que significa 'cidadão de dois reinos'?",
            "4. Quando desobedecer governo?",
            "5. Política pode salvar?"
          ],
          application: "Avalie seu engajamento político: equilibrado ou idolátrico? Esperança em Cristo ou em partido?",
          summary: "Governo é ordenação divina para limitar mal; cristãos participam da política sem idolatrar, mantendo lealdade suprema a Cristo."
        },
        {
          title: "Educação e Conhecimento",
          content: `Todo conhecimento é conhecimento de Deus ou de Sua criação. "O temor do SENHOR é o princípio do saber" (Provérbios 1:7). Educação secular que exclui Deus é fundamentalmente distorcida.

A educação cristã integra fé e aprendizado. Não adiciona "aula de religião" a currículo secular; pensa sobre todas as matérias através de lentes bíblicas. Matemática, história, literatura - tudo reflete o Criador.

A família é responsável primária pela educação. "Ensinarás a teus filhos" (Deuteronômio 6:7). Escolas e igrejas auxiliam; não substituem. Pais não podem terceirizar formação espiritual e worldview dos filhos.

O conhecimento é para servir, não dominar. "Conhecimento incha; amor edifica" (1 Coríntios 8:1). Educação cristã visa formação de caráter e serviço, não apenas acumulação de informação ou sucesso profissional.`,
          references: "Provérbios 1:7; 9:10; Deuteronômio 6:4-9; Colossenses 2:3; 1 Coríntios 8:1",
          questions: [
            "1. Qual é a base de todo conhecimento?",
            "2. O que é educação cristã?",
            "3. Quem é responsável primário pela educação?",
            "4. Qual é o propósito do conhecimento?",
            "5. Como você está formando sua mente biblicamente?"
          ],
          application: "Identifique uma área de conhecimento onde você pensa mais secularmente que biblicamente. Estude-a.",
          summary: "Educação cristã integra fé a todas as áreas do conhecimento, é responsabilidade primária dos pais, e visa formação de caráter para servir."
        },
        {
          title: "Arte e Beleza",
          content: `Deus é a fonte de toda beleza. "Quão formosos são os teus tabernáculos" (Salmo 84:1). Ele criou beleza; a criação exibe Sua glória estética. Arte não é frivolidade; é reflexo do Criador.

O cristão pode criar e apreciar arte. Deus deu "sabedoria, e inteligência, e conhecimento em todo lavor, para elaborar desenhos artísticos" (Êxodo 35:31-33). Bezalel foi cheio do Espírito para arte. Criatividade é dom divino.

Toda arte comunica worldview. Não há arte neutra. O que ela afirma sobre realidade, humanidade, propósito? Avalie esteticamente (é bela?) e também filosoficamente (o que está dizendo?).

Arte cristã não é apenas 'sobre Jesus'. Bezalel não fez apenas coisas religiosas. Arte que reflete verdade, bondade e beleza glorifica a Deus, mesmo sem tema explicitamente religioso. Excelência em qualquer gênero honra o Criador.`,
          references: "Êxodo 35:30-35; Salmo 19:1; 84:1; Filipenses 4:8; Apocalipse 21:10-27",
          questions: [
            "1. Qual é a fonte da beleza?",
            "2. Criatividade é dom divino?",
            "3. Há arte neutra?",
            "4. Arte cristã é só 'sobre Jesus'?",
            "5. Como você avalia arte que consome?"
          ],
          application: "Avalie uma obra de arte (filme, música, livro) esteticamente e filosoficamente.",
          summary: "Beleza vem de Deus; arte é dom divino que comunica worldview; arte cristã reflete verdade, bondade e beleza em qualquer gênero."
        },
        {
          title: "Ciência e Tecnologia",
          content: `A ciência é possível porque Deus criou mundo ordenado. Leis naturais refletem a fidelidade de Deus. Cientistas cristãos como Kepler, Newton, Faraday fundaram a ciência moderna com base em cosmovisão cristã.

Ciência investiga criação; não substitui Criador. A ciência responde 'como'; não responde 'por que' ou 'para que'. Explicar mecanismos não elimina necessidade de propósito. Confundir isso é erro de categoria.

Tecnologia é aplicação do mandato cultural. Desenvolvemos criação, facilitamos trabalho, curamos doenças. Tecnologia pode ser bênção. Mas também pode ser usado para mal. Ferramenta neutra; coração determina uso.

Limites éticos são necessários. "Posso" não significa "devo". Clonagem, edição genética, inteligência artificial - capacidade não autoriza. A ética bíblica guia o uso da tecnologia, não apenas a possibilidade técnica.`,
          references: "Salmo 19:1-6; Provérbios 25:2; Gênesis 1:28; Romanos 1:20; Colossenses 1:16-17",
          questions: [
            "1. Por que a ciência é possível?",
            "2. O que a ciência não pode responder?",
            "3. Tecnologia é boa ou má?",
            "4. Capacidade significa permissão?",
            "5. Como você usa tecnologia eticamente?"
          ],
          application: "Avalie seu uso de tecnologia esta semana. É para glória de Deus ou outro propósito?",
          summary: "Ciência investiga criação ordenada; tecnologia aplica o mandato cultural; ambas requerem limites éticos bíblicos."
        },
        {
          title: "Vivendo com Cosmovisão Integrada",
          content: `Cosmovisão não é teoria; é vida. "Sede cumpridores da palavra, e não somente ouvintes" (Tiago 1:22). Pensar corretamente deve resultar em viver corretamente. Incoerência entre crença e prática é hipocrisia.

Integração requer intencionalidade. A cultura pressiona para compartimentalização: fé no domingo, secularismo no trabalho. Resistir exige esforço consciente. "Transformai-vos pela renovação do vosso entendimento" (Romanos 12:2).

A comunidade ajuda na integração. "Uns aos outros" - juntos discernimos melhor. Isolamento facilita desvio. A igreja que pensa junto aplica melhor. Discuta questões de cosmovisão em comunidade.

O Espírito Santo é guia final. Ele "guiará a toda a verdade" (João 16:13). Ore por sabedoria para aplicar fé a situações complexas. Dependência de Deus, não autonomia humana, é a chave para cosmovisão vivida.`,
          references: "Romanos 12:1-2; Tiago 1:22-25; João 16:13; Colossenses 3:17; 1 Coríntios 10:31",
          questions: [
            "1. Cosmovisão é só teoria?",
            "2. O que a cultura pressiona?",
            "3. Como comunidade ajuda?",
            "4. Qual é o papel do Espírito?",
            "5. Sua vida reflete sua cosmovisão?"
          ],
          application: "Identifique uma área onde crença e prática não estão alinhadas. Trabalhe nela esta semana.",
          summary: "Cosmovisão integrada é vivida, não apenas pensada; requer intencionalidade, comunidade, e dependência do Espírito Santo."
        }
      ])
    }
  ]
};

// MÓDULO 15: Discipulado Multiplicador
const MODULO_15_DISCIPULADO: ModuleData = {
  id: "nivel3-mod15-discipulado",
  name: "Discipulado Multiplicador",
  description: "Fazendo discípulos que fazem discípulos",
  icon: "Users2",
  color: "#14B8A6",
  order: 45,
  tracks: [
    {
      id: "track-n3m15-avancado",
      level: "avancado",
      name: "Multiplicação de Discípulos",
      description: "Reproduzindo a fé em gerações futuras",
      requiredPlan: "premium",
      order: 1,
      lessons: createLessons("n3m15", [
        {
          title: "O Mandato de Fazer Discípulos",
          content: `A Grande Comissão é mandato de discipulado. "Fazei discípulos de todas as nações" (Mateus 28:19). O verbo principal é "fazer discípulos", não "ir" ou "batizar" ou "ensinar". Estes são meios; discípulos são o fim.

Discípulo é seguidor-aprendiz de Jesus. O termo implica relacionamento com mestre, aprendizado de vida, e imitação gradual. "Serão todos ensinados por Deus" (João 6:45). Cristo é o Mestre; nós facilitamos o encontro.

Discipulado não é programa; é processo relacional. Acontece quando crentes mais maduros caminham com menos maduros. "Sede meus imitadores, como também eu sou de Cristo" (1 Coríntios 11:1). Vida transmite vida.

O objetivo é maturidade em Cristo. "Até que todos cheguemos... à medida da estatura completa de Cristo" (Efésios 4:13). Não apenas conhecimento, mas caráter. Não apenas crentes, mas discípulos que fazem discípulos.`,
          references: "Mateus 28:18-20; 1 Coríntios 11:1; Efésios 4:11-16; Colossenses 1:28; 2 Timóteo 2:2",
          questions: [
            "1. Qual é o verbo principal da Grande Comissão?",
            "2. O que é um discípulo?",
            "3. Discipulado é programa ou processo?",
            "4. Qual é o objetivo do discipulado?",
            "5. Você está fazendo discípulos?"
          ],
          application: "Identifique alguém que você pode discipular intencionalmente. Comece esta semana.",
          summary: "O mandato é fazer discípulos através de relacionamento intencional, visando maturidade em Cristo e reprodução em outros."
        },
        {
          title: "O Modelo de Jesus",
          content: `Jesus é o modelo supremo de discipulador. Ele escolheu doze "para que estivessem com ele e para os enviar a pregar" (Marcos 3:14). Proximidade precedeu comissão. Ele investiu profundamente em poucos.

Jesus usou tempo extenso. Três anos de convivência diária. Discipulado não é curso de fim de semana; é jornada de anos. Paciência com crescimento gradual é essencial.

Jesus ensinou em contexto de vida. Caminhando, comendo, enfrentando crises - toda situação era aula. Vida compartilhada oferece momentos de ensino que sala de aula não oferece.

Jesus graduou responsabilidade. Primeiro observaram; depois participaram; depois lideraram. "Enviou-os de dois em dois" (Marcos 6:7) - missão supervisionada. Progressão sábia evita sobrecarga e desenvolve competência.`,
          references: "Marcos 3:14; 6:7-13, 30; Lucas 10:1-20; João 17:6-19; Mateus 10:1-42",
          questions: [
            "1. O que Jesus fez primeiro com os doze?",
            "2. Quanto tempo Jesus investiu?",
            "3. Onde Jesus ensinava?",
            "4. Como Jesus graduou responsabilidade?",
            "5. O que você pode imitar do modelo de Jesus?"
          ],
          application: "Passe tempo com quem você está discipulando fora de contextos formais. Vida compartilhada ensina.",
          summary: "Jesus modelou discipulado com proximidade extensa, ensino em contexto de vida, e graduação sábia de responsabilidade."
        },
        {
          title: "Selecionando Discípulos",
          content: `Jesus selecionou cuidadosamente. "Passou a noite orando a Deus. Quando amanheceu, chamou a si os seus discípulos; e escolheu doze" (Lucas 6:12-13). Oração precedeu escolha. Não qualquer um; os certos.

Busque pessoas FAT: Fiéis (cumprem compromissos), Disponíveis (tempo e disposição), Treináveis (humildes para aprender). Talentos podem ser desenvolvidos; coração resistente raramente muda.

Não escolha apenas os óbvios. Jesus escolheu pescadores, não rabinos. Deus vê o coração, não aparência (1 Samuel 16:7). Procure potencial escondido; não julgue por superficialidades.

Comece com poucos. Jesus focou em doze; especialmente em três (Pedro, Tiago, João). Profundidade requer limitação. Melhor três bem discipulados que doze superficialmente tocados.`,
          references: "Lucas 6:12-16; 2 Timóteo 2:2; 1 Samuel 16:7; Marcos 5:37; 9:2",
          questions: [
            "1. Como Jesus selecionou os doze?",
            "2. O que FAT significa?",
            "3. Por que não escolher só os óbvios?",
            "4. Por que começar com poucos?",
            "5. Quem você deve selecionar para discipular?"
          ],
          application: "Ore pedindo discernimento para identificar pessoas FAT em quem investir.",
          summary: "Seleção de discípulos requer oração, busca por pessoas FAT, olhar além do óbvio, e foco em poucos para profundidade."
        },
        {
          title: "Conteúdo do Discipulado",
          content: `Discipulado abrange conhecimento, caráter e competência. Conhecimento: verdades bíblicas fundamentais. Caráter: semelhança a Cristo. Competência: habilidades para ministério. Os três são necessários.

Fundamentos doutrinários incluem: Deus (Quem Ele é), Cristo (obra salvadora), Espírito (vida no Espírito), salvação (evangelho), igreja (comunidade de fé), missão (propósito de vida). Bases sólidas sustentam crescimento.

Disciplinas espirituais formam caráter: oração, leitura bíblica, jejum, comunhão, adoração, serviço, mordomia. Não são legalismo; são meios de graça. "Exercita-te a ti mesmo na piedade" (1 Timóteo 4:7).

Habilidades para ministério incluem: compartilhar fé, orar com outros, liderar pequeno grupo, discipular, usar dons. O discípulo deve saber fazer, não apenas saber sobre.`,
          references: "2 Timóteo 3:16-17; 1 Timóteo 4:7-8; Colossenses 1:28; Hebreus 5:12-14; 2 Pedro 1:5-8",
          questions: [
            "1. Que três áreas o discipulado abrange?",
            "2. Quais são fundamentos doutrinários essenciais?",
            "3. O que disciplinas espirituais formam?",
            "4. Que habilidades o discípulo deve desenvolver?",
            "5. O que está faltando em seu discipulado?"
          ],
          application: "Avalie seu crescimento nas três áreas. Identifique a mais fraca e trabalhe nela.",
          summary: "Discipulado abrange conhecimento doutrinário, caráter através de disciplinas espirituais, e competência em habilidades ministeriais."
        },
        {
          title: "Métodos de Discipulado",
          content: `Encontros regulares são essenciais. Consistência supera intensidade. Encontros semanais ou quinzenais por período extenso formam melhor que eventos esporádicos. Estabeleça ritmo sustentável.

Vida compartilhada é metodologia. Não apenas estudo; experiências juntos. Refeições, projetos, crises - momentos da vida são salas de aula. Jesus estava com os discípulos continuamente.

Perguntas são ferramentas poderosas. Jesus frequentemente ensinava perguntando. Perguntas fazem pensar, revelam coração, e envolvem ativamente. "O que vocês acham?" é frequentemente melhor que "Eu vou explicar."

Responsabilidade mútua (accountability) promove crescimento. "Confessai as vossas culpas uns aos outros" (Tiago 5:16). Perguntas honestas sobre caminhada espiritual, pecados recorrentes, e crescimento. Prestação de contas protege e catalisa.`,
          references: "Atos 2:42-47; Hebreus 10:24-25; Tiago 5:16; Provérbios 27:17; Gálatas 6:2",
          questions: [
            "1. Por que encontros regulares importam?",
            "2. O que é vida compartilhada?",
            "3. Por que perguntas são eficazes?",
            "4. O que é accountability?",
            "5. Que métodos você usa ou poderia usar?"
          ],
          application: "Estabeleça accountability com quem você discipula ou por quem é discipulado.",
          summary: "Discipulado eficaz usa encontros regulares, vida compartilhada, perguntas provocativas, e accountability mútua."
        },
        {
          title: "Lidando com Obstáculos",
          content: `Crescimento espiritual não é linear. Há platôs, regressões, crises. O discipulador deve ter paciência. Jesus tolerou lentidão dos discípulos; nós também devemos.

Pecado recorrente é obstáculo comum. A resposta não é desistir nem ignorar. Confronte com graça, busque raízes (por que esse pecado persiste?), aponte para Cristo. Graça é maior que pecado.

Falta de compromisso frustra. Alguns começam entusiasmados, depois evadem. Avalie: você os selecionou bem? Eles são FAT? Às vezes é melhor liberar os descompromissados e investir nos sérios.

Ocupação excessiva impede. Vida moderna consome tempo. Ajude a priorizar, a dizer não a boas coisas por melhores coisas. "Buscai primeiro o reino" (Mateus 6:33) requer escolhas práticas.`,
          references: "Gálatas 6:1; 2 Timóteo 2:24-26; Hebreus 12:1-2; Mateus 6:33; Lucas 14:26-33",
          questions: [
            "1. Crescimento é sempre linear?",
            "2. Como lidar com pecado recorrente?",
            "3. O que fazer com falta de compromisso?",
            "4. Como ajudar com ocupação excessiva?",
            "5. Que obstáculo você enfrenta?"
          ],
          application: "Identifique um obstáculo em quem você discipula (ou em si). Planeje como abordá-lo.",
          summary: "Obstáculos como crescimento não-linear, pecado, descompromisso e ocupação requerem paciência, confronto gracioso e priorização."
        },
        {
          title: "Multiplicação: A Meta Final",
          content: `O objetivo não é apenas discípulos, mas discípulos que fazem discípulos. "O que de mim ouviste... transmite a homens fiéis, que sejam idôneos para também ensinarem a outros" (2 Timóteo 2:2). Quatro gerações em um versículo.

Adição é boa; multiplicação é melhor. Uma pessoa que ganha 1.000 convertidos é menos eficaz que uma que faz 10 discípulos que cada um faz 10 mais. Multiplicação exponencial transforma nações.

Desde o início, ensine a multiplicar. Não espere até 'estarem prontos'. A expectativa de reprodução faz parte do DNA do discipulado. "Você vai fazer isso com outros" é mensagem desde o dia um.

Libere para reproduzir. Alguns discipuladores retêm discípulos por insegurança ou controle. Quando estão prontos (ou quase), envie-os para fazer o mesmo. O sucesso do discipulador é medido por discípulos que discipulam.`,
          references: "2 Timóteo 2:2; Mateus 28:19-20; Atos 1:8; João 14:12; Colossenses 1:28-29",
          questions: [
            "1. Qual é a meta final do discipulado?",
            "2. Por que multiplicação supera adição?",
            "3. Quando ensinar a multiplicar?",
            "4. Por que alguns não liberam discípulos?",
            "5. Seus discípulos estão discipulando?"
          ],
          application: "Se você discipula, pergunte: seus discípulos estão fazendo discípulos? Se não, por quê?",
          summary: "A meta é multiplicação de discípulos que fazem discípulos; isso requer expectativa desde o início e liberação quando prontos."
        },
        {
          title: "Discipulado e Pequenos Grupos",
          content: `Pequenos grupos são contexto natural para discipulado. A igreja primitiva reunia-se "de casa em casa" (Atos 2:46). Grupos pequenos permitem intimidade, participação, e accountability que grandes reuniões não permitem.

O líder de pequeno grupo é discipulador. Não apenas facilita discussão; pastoreia pessoas. Conhece a vida de cada um, ora por eles, visita em crises. Liderança de grupo é ministério pastoral em escala menor.

Grupos saudáveis se multiplicam. Quando crescem demais, dividem. O objetivo não é um grupo enorme, mas muitos grupos reproduzindo. Líderes são desenvolvidos dentro do grupo para liderar novos grupos.

Discipulado individual e em grupo se complementam. Individual para profundidade personalizada; grupo para comunidade e diversidade de perspectivas. Ambos são necessários para formação completa.`,
          references: "Atos 2:42-47; 20:20; Hebreus 10:24-25; Romanos 16:5; Filemom 2",
          questions: [
            "1. Por que pequenos grupos são contexto para discipulado?",
            "2. O que o líder de grupo faz?",
            "3. O que grupos saudáveis fazem?",
            "4. Como individual e grupo se complementam?",
            "5. Você participa de pequeno grupo?"
          ],
          application: "Se você lidera grupo, avalie: está discipulando ou apenas facilitando? Se não lidera, considere.",
          summary: "Pequenos grupos são contexto natural para discipulado, liderados pastoralmente, reproduzindo-se, complementando discipulado individual."
        },
        {
          title: "Discipulado Transcultural",
          content: `O mandato é fazer discípulos de todas as nações. Isso requer cruzar barreiras culturais. Princípios são universais; métodos são contextualizados. Não confunda evangelho com cultura ocidental.

Ouça antes de ensinar. Cada cultura tem valores, pressupostos, formas de aprender. O discipulador transcultural primeiro entende o contexto antes de aplicar métodos. Humildade cultural é essencial.

Desenvolva líderes locais rapidamente. Missionário estrangeiro é sempre limitado culturalmente. Líderes locais entendem nuances que estrangeiros não captam. A meta é discípulos locais discipulando, não dependência do missionário.

Igrejas autóctones são objetivo. Autogovernadas (liderança local), autossustentadas (financeiramente independentes), autopropagadas (evangelizando e plantando). O discipulador transcultural trabalha para se tornar desnecessário.`,
          references: "Mateus 28:19; Atos 1:8; 1 Coríntios 9:19-23; Apocalipse 7:9; Colossenses 1:27-28",
          questions: [
            "1. O discipulado é só para nossa cultura?",
            "2. Por que ouvir antes de ensinar?",
            "3. Por que líderes locais são essenciais?",
            "4. O que são igrejas autóctones?",
            "5. Como você pode participar de discipulado transcultural?"
          ],
          application: "Ore por discipulado em outra cultura. Considere como você pode contribuir.",
          summary: "Discipulado transcultural contextualiza métodos, ouve antes de ensinar, desenvolve líderes locais, e visa igrejas autóctones."
        },
        {
          title: "Legado de Multiplicação",
          content: `O verdadeiro teste é o que permanece depois de você. Paulo escreveu a Timóteo sabendo que seu tempo era curto (2 Timóteo 4:6). Mas seu legado continuou através de Timóteo e outros.

Você pode não ver os frutos completos. Plantamos; outros colhem. "Um semeia, outro colhe" (João 4:37). Fidelidade agora produz frutos que talvez não presenciemos. Visão de longo prazo sustenta esforço presente.

A multiplicação compensa a lentidão aparente. Parece mais lento que evangelismo de massa no início. Mas 10 gerações de discípulos superam milhões de convertidos não-discipulados. O tempo prova a sabedoria.

Seu legado é pessoas, não programas. Programas passam; pessoas permanecem e reproduzem. "A verdadeira realeza é criar reis" (Napoleão). Invista em pessoas; elas são seu legado eterno.`,
          references: "2 Timóteo 4:6-8; 2:2; João 4:37-38; 1 Coríntios 3:6-9; Filipenses 1:6",
          questions: [
            "1. O que permanece depois de você?",
            "2. Veremos todos os frutos?",
            "3. Por que multiplicação supera adição no longo prazo?",
            "4. Seu legado é programas ou pessoas?",
            "5. Quem você está deixando como legado?"
          ],
          application: "Liste as pessoas em quem você está investindo. Elas são seu legado. Invista bem.",
          summary: "Legado de multiplicação produz gerações de discípulos através de investimento fiel em pessoas que continuam reproduzindo a fé."
        }
      ])
    }
  ]
};

export const NIVEL_3_MODULOS_11_15: ModuleData[] = [
  MODULO_11_ENSINO,
  MODULO_12_TEOLOGIA_PASTORAL,
  MODULO_13_APOLOGETICA_AVANCADA,
  MODULO_14_COSMOVISAO,
  MODULO_15_DISCIPULADO
];
