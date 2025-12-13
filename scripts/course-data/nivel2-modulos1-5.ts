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

// MÓDULO 1: Hermenêutica Bíblica
const MODULO_1_HERMENEUTICA: ModuleData = {
  id: "nivel2-mod1-hermeneutica",
  name: "Hermenêutica Bíblica",
  description: "Princípios de interpretação das Escrituras Sagradas",
  icon: "BookOpen",
  color: "#6366F1",
  order: 16,
  tracks: [
    {
      id: "track-n2m1-moderado",
      level: "moderado",
      name: "Interpretação Bíblica",
      description: "Métodos e princípios para interpretar corretamente a Bíblia",
      requiredPlan: "premium",
      order: 1,
      lessons: createLessons("n2m1", [
        {
          title: "O Que é Hermenêutica",
          content: `Hermenêutica é a ciência e arte da interpretação bíblica. O termo vem do grego "hermeneuo", que significa interpretar ou traduzir. Seu propósito é descobrir o significado original do texto bíblico para então aplicá-lo corretamente à vida contemporânea.

A necessidade da hermenêutica surge de várias lacunas entre nós e o texto bíblico: lacuna temporal (milhares de anos), lacuna cultural (costumes diferentes), lacuna linguística (hebraico, aramaico, grego) e lacuna geográfica (Oriente Médio antigo). Precisamos de ferramentas para atravessar essas lacunas.

A interpretação bíblica não é subjetiva - "o que o texto significa para mim." Cada texto tem um significado objetivo que o autor original pretendeu comunicar. Nossa tarefa é descobrir esse significado, não criar nosso próprio. "Nenhuma profecia da Escritura é de particular interpretação" (2 Pedro 1:20).

A hermenêutica nos protege de erros doutrinários e aplicações incorretas. Sem princípios sólidos de interpretação, a Bíblia pode ser usada para apoiar qualquer ideia. A história está repleta de heresias que nasceram de má interpretação bíblica.`,
          references: "2 Pedro 1:20-21; 2 Timóteo 2:15; Neemias 8:8; Atos 8:30-31; Lucas 24:27",
          questions: [
            "1. O que é hermenêutica e qual sua origem?",
            "2. Quais lacunas existem entre nós e o texto bíblico?",
            "3. Por que a interpretação não é puramente subjetiva?",
            "4. Como a hermenêutica nos protege de erros?",
            "5. Qual a diferença entre significado e aplicação?"
          ],
          application: "Reflita sobre como você interpreta a Bíblia. Usa princípios consistentes ou apenas sentimentos? Comprometa-se a estudar hermenêutica para crescer.",
          summary: "Hermenêutica é a ciência de interpretação bíblica que nos ajuda a atravessar as lacunas entre nós e o texto original para descobrir seu verdadeiro significado."
        },
        {
          title: "Iluminação do Espírito Santo",
          content: `O Espírito Santo é essencial na interpretação bíblica. Ele inspirou as Escrituras (2 Pedro 1:21) e também ilumina nossa compreensão. "Quando vier aquele Espírito da verdade, ele vos guiará em toda a verdade" (João 16:13). Sem Ele, permanecemos cegos ao significado espiritual.

Iluminação não é o mesmo que inspiração. Inspiração foi o processo pelo qual Deus deu as Escrituras - único e irrepetível. Iluminação é o processo contínuo pelo qual o Espírito nos ajuda a entender o que foi escrito. Todo crente tem acesso à iluminação.

No entanto, iluminação não substitui estudo diligente. Paulo exorta Timóteo a "manejar bem a palavra da verdade" (2 Timóteo 2:15). O verbo grego sugere trabalho cuidadoso, como um artesão. O Espírito trabalha através de nossa mente disciplinada, não apesar dela.

A iluminação também requer coração receptivo. Pecado não confessado, orgulho intelectual e preconceitos podem bloquear nossa compreensão. "Se alguém quiser fazer a vontade dele, conhecerá a respeito da doutrina" (João 7:17). Obediência e entendimento caminham juntos.`,
          references: "João 16:13; 1 Coríntios 2:10-14; 2 Timóteo 2:15; João 7:17; Salmo 119:18",
          questions: [
            "1. Qual o papel do Espírito Santo na interpretação?",
            "2. Qual a diferença entre inspiração e iluminação?",
            "3. Por que a iluminação não substitui o estudo?",
            "4. O que pode bloquear a iluminação espiritual?",
            "5. Como buscar a iluminação do Espírito em seus estudos?"
          ],
          application: "Antes de estudar a Bíblia, ore pedindo iluminação. Mas não pare ali - também se prepare para estudar diligentemente.",
          summary: "O Espírito Santo ilumina nossa compreensão das Escrituras, mas trabalha através de estudo diligente e coração obediente."
        },
        {
          title: "O Contexto Literário",
          content: `A regra de ouro da hermenêutica é: contexto, contexto, contexto. O significado de qualquer versículo é determinado por seu contexto literário. Tirar versículos de contexto é a causa mais comum de má interpretação.

O contexto imediato são os versículos ao redor da passagem. Qual é o argumento do autor? Como este versículo se conecta ao anterior e ao próximo? Um texto sem contexto é apenas um pretexto para dizer o que queremos. Por exemplo, "Tudo posso" (Filipenses 4:13) no contexto fala sobre contentamento, não sucesso ilimitado.

O contexto do livro também é crucial. Qual o propósito do livro? Quem é o autor e para quem escreve? Uma carta de Paulo às igrejas da Galácia sobre legalismo será interpretada diferentemente de sua carta pessoal a Filemom sobre um escravo fugitivo.

O contexto bíblico amplo completa a interpretação. Como esta passagem se relaciona com o ensino total das Escrituras? A Bíblia não se contradiz; se nossa interpretação entra em conflito com outras passagens claras, precisamos reconsiderar. Escritura interpreta Escritura.`,
          references: "2 Timóteo 2:15; Atos 17:11; Neemias 8:8; Lucas 24:27; 2 Pedro 3:16",
          questions: [
            "1. Por que o contexto é tão importante?",
            "2. O que é o contexto imediato e como usá-lo?",
            "3. Por que o contexto do livro é relevante?",
            "4. Como o contexto bíblico amplo ajuda na interpretação?",
            "5. Dê um exemplo de versículo frequentemente tirado do contexto."
          ],
          application: "Escolha um versículo favorito. Leia o capítulo inteiro ao redor dele. Seu entendimento mudou? Pratique sempre ler o contexto.",
          summary: "O contexto literário - imediato, do livro e bíblico amplo - é essencial para interpretar corretamente qualquer passagem das Escrituras."
        },
        {
          title: "Contexto Histórico-Cultural",
          content: `A Bíblia foi escrita em culturas muito diferentes da nossa. Entender o contexto histórico-cultural é essencial para interpretação precisa. O que parece estranho para nós era natural para os primeiros leitores, e vice-versa.

O contexto histórico inclui os eventos, personagens e situações da época. Por que Paulo escreveu aos Coríntios sobre carne sacrificada a ídolos? Porque Corinto era cheia de templos pagãos e esse era um dilema real. Sem esse conhecimento, a passagem parece irrelevante.

O contexto cultural abrange costumes, práticas sociais, economia e política. Por que Jesus lavou os pés dos discípulos? Porque era tarefa de escravos e Ele estava demonstrando humildade servil. Por que Rute dormiu aos pés de Boaz? Era um costume de pedido de casamento segundo a lei do resgate.

Recursos como dicionários bíblicos, comentários e atlas são ferramentas valiosas para entender o contexto histórico-cultural. Não temos que adivinhar - estudiosos já pesquisaram extensivamente esses backgrounds para nos ajudar.`,
          references: "1 Coríntios 8:1-13; João 13:1-17; Rute 3:1-11; Atos 17:16-34",
          questions: [
            "1. Por que o contexto histórico-cultural é importante?",
            "2. O que o contexto histórico inclui?",
            "3. Dê exemplos de como a cultura afeta a interpretação.",
            "4. Que recursos ajudam a entender o background bíblico?",
            "5. Como você pode aprender mais sobre o mundo bíblico?"
          ],
          application: "Ao estudar uma passagem difícil, pesquise seu contexto histórico-cultural. Use um bom comentário ou dicionário bíblico como auxílio.",
          summary: "O contexto histórico-cultural - eventos, costumes e práticas da época - é fundamental para entender o que os autores bíblicos comunicavam."
        },
        {
          title: "Gêneros Literários",
          content: `A Bíblia contém diversos gêneros literários, e cada um deve ser interpretado de acordo com suas próprias regras. Ler poesia como lei, ou parábola como história, leva a confusão. Identificar o gênero é passo crucial na interpretação.

Narrativa histórica conta eventos que realmente aconteceram. Devemos distinguir entre descrição (o que aconteceu) e prescrição (o que deve acontecer). Nem tudo que a Bíblia descreve ela aprova. A poligamia de Davi é descrita, mas não prescrita.

A poesia usa linguagem figurada, paralelismos e imagens vívidas. "O Senhor é minha rocha" não significa que Deus é feito de pedra. É metáfora expressando segurança e estabilidade. Os Salmos são oração e louvor, não tratados teológicos sistemáticos.

Profecia combina predição futura com proclamação presente. Muito profeta era "forthtelling" (proclamar a mensagem de Deus) não apenas "foretelling" (prever o futuro). Profecia também usa linguagem apocalíptica com símbolos e imagens que não devem ser literalizados.`,
          references: "Salmo 18:2; Isaías 55:12; Lucas 15:1-7; Apocalipse 1:12-16; 2 Timóteo 3:16",
          questions: [
            "1. Por que identificar o gênero literário é importante?",
            "2. Qual a diferença entre descrição e prescrição em narrativas?",
            "3. Como a poesia deve ser interpretada diferentemente?",
            "4. O que distingue forthtelling de foretelling na profecia?",
            "5. Que erros ocorrem quando ignoramos o gênero?"
          ],
          application: "Identifique o gênero de três livros bíblicos diferentes (ex: Gênesis, Salmos, Romanos). Como isso afeta sua interpretação?",
          summary: "Cada gênero literário bíblico - narrativa, poesia, profecia, etc. - tem regras próprias de interpretação que devem ser respeitadas."
        },
        {
          title: "Figuras de Linguagem",
          content: `A Bíblia está repleta de figuras de linguagem que enriquecem sua comunicação. Reconhecê-las é essencial para evitar interpretações literais absurdas ou, inversamente, espiritualizar textos literais.

A metáfora compara duas coisas sem usar "como". "Eu sou a porta" (João 10:9) - Jesus não é uma porta literal, mas o acesso a Deus. "Vocês são o sal da terra" (Mateus 5:13) - cristãos preservam e dão sabor como o sal. Metáforas comunicam verdades profundas de forma memorável.

A hipérbole é exagero intencional para enfatizar um ponto. "Se o teu olho direito te escandalizar, arranca-o" (Mateus 5:29) - Jesus não está comandando automutilação, mas enfatizando a seriedade de lidar com o pecado. A hipérbole era recurso retórico comum no mundo antigo.

Ironia, metonímia, personificação e outras figuras também aparecem nas Escrituras. "Os montes e os outeiros romperão em cântico" (Isaías 55:12) é personificação - a natureza não canta literalmente, mas celebra figurativamente. Sensibilidade literária ajuda a discernir essas figuras.`,
          references: "João 10:9; Mateus 5:13-30; Isaías 55:12; João 6:35; Salmo 91:4",
          questions: [
            "1. Por que as figuras de linguagem são usadas na Bíblia?",
            "2. O que é uma metáfora e dê um exemplo bíblico.",
            "3. O que é hipérbole e como reconhecê-la?",
            "4. Dê exemplos de outras figuras de linguagem bíblicas.",
            "5. Como distinguir linguagem literal de figurada?"
          ],
          application: "Leia João 15:1-8 e identifique as figuras de linguagem. O que Jesus comunica através dessas imagens?",
          summary: "As figuras de linguagem bíblicas - metáforas, hipérboles, personificação - comunicam verdades profundas e devem ser interpretadas adequadamente."
        },
        {
          title: "Interpretando Narrativas",
          content: `Grande parte da Bíblia é narrativa - histórias que registram os atos de Deus na história. Interpretar narrativas corretamente requer entender como elas funcionam e o que pretendem ensinar.

Narrativas descrevem, não necessariamente prescrevem. O fato de Abraão ter mentido sobre Sara não significa que podemos mentir. O fato de Gideão ter pedido sinais não significa que devemos. Devemos buscar o ensinamento teológico por trás da história, não simplesmente imitar os personagens.

Os personagens bíblicos são complexos, não simplesmente "bons" ou "maus." Davi era homem segundo o coração de Deus, mas também adúltero e assassino. As narrativas não sanitizam seus heróis. Isso nos ensina sobre a graça de Deus que trabalha através de pessoas imperfeitas.

O narrador bíblico é confiável e inspirado. Mesmo quando não comenta explicitamente, sua seleção e arranjo do material comunica significado. Por que incluir este detalhe? Por que esta ordem? Por que repetir essa frase? Atenção ao narrador revela intenção teológica.`,
          references: "Gênesis 12:10-20; Juízes 6:36-40; 2 Samuel 11-12; Lucas 15:11-32; Atos 15:36-41",
          questions: [
            "1. Qual a diferença entre descrição e prescrição em narrativas?",
            "2. Por que os personagens bíblicos são retratados com falhas?",
            "3. Quem é o narrador bíblico e por que ele é confiável?",
            "4. O que buscamos aprender nas narrativas?",
            "5. Como evitar a 'moralização' de narrativas?"
          ],
          application: "Releia a história de Davi e Golias (1 Samuel 17). Qual é a mensagem teológica principal, além de 'seja corajoso'?",
          summary: "Narrativas bíblicas descrevem os atos de Deus através de personagens imperfeitos, ensinando verdades teológicas, não apenas exemplos morais."
        },
        {
          title: "Interpretando Poesia e Sabedoria",
          content: `Os livros poéticos - Jó, Salmos, Provérbios, Eclesiastes, Cantares - formam cerca de um terço do Antigo Testamento. Sua interpretação requer atenção especial às características do gênero.

O paralelismo é a estrutura fundamental da poesia hebraica. Ideias são apresentadas em pares: paralelismo sinônimo (a segunda linha repete a primeira com palavras diferentes), antitético (contrasta ideias opostas) ou sintético (a segunda linha desenvolve a primeira). Reconhecer paralelismo ajuda a entender o significado.

Provérbios são máximas de sabedoria geral, não promessas absolutas. "Ensina a criança no caminho em que deve andar, e até quando envelhecer não se desviará dele" (Provérbios 22:6) é princípio geral, não garantia. Pais piedosos às vezes têm filhos rebeldes. Provérbios descrevem o que geralmente acontece, não o que sempre acontece.

Os Salmos são expressões de adoração, lamento, súplica e ação de graças. Expressam emoções humanas autênticas perante Deus. Nem toda afirmação em um salmo de lamento é teologia normativa - é o clamor de um coração aflito. Devemos ler os Salmos como modelo de oração honesta.`,
          references: "Salmo 1:1-6; Provérbios 22:6; Eclesiastes 1:1-11; Jó 3:1-26; Cantares 2:1-7",
          questions: [
            "1. O que é paralelismo e quais são seus tipos?",
            "2. Por que provérbios não são promessas absolutas?",
            "3. Como devemos ler os salmos de lamento?",
            "4. Qual a mensagem central de Eclesiastes?",
            "5. Como Cantares deve ser interpretado?"
          ],
          application: "Leia o Salmo 73. Identifique os paralelismos e observe como o salmista processa suas dúvidas diante de Deus.",
          summary: "A poesia bíblica usa paralelismo e linguagem figurada; provérbios são princípios gerais, não promessas; salmos modelam oração honesta."
        },
        {
          title: "Interpretando Profecia",
          content: `Os profetas bíblicos eram mensageiros de Deus chamados para proclamar Sua Palavra a Israel e às nações. Interpretar profecia corretamente requer entender sua natureza e propósito.

A maior parte da profecia é "forthtelling" - proclamar a mensagem de Deus para a situação presente. Os profetas confrontavam idolatria, injustiça social e infidelidade à aliança. Antes de buscar predições futuras, devemos entender o que o profeta dizia a seus contemporâneos.

Profecia preditiva frequentemente tem múltiplos cumprimentos. Uma profecia pode ser cumprida parcialmente no contexto imediato e completamente em Cristo ou na consumação final. Por exemplo, Isaías 7:14 foi cumprido no nascimento de um filho no tempo de Acaz e plenamente no nascimento virginal de Jesus.

A linguagem profética é frequentemente poética e simbólica. Não devemos literalizar todas as imagens. "Os montes escorrerão vinho" (Amós 9:13) descreve abundância, não fenômeno geológico. A linguagem apocalíptica de Daniel e Apocalipse requer especial cuidado com simbolismo.`,
          references: "Isaías 7:14; Amós 5:21-24; Miquéias 6:8; Joel 2:28-32; Atos 2:16-21",
          questions: [
            "1. Qual o papel principal dos profetas bíblicos?",
            "2. O que significa 'forthtelling' versus 'foretelling'?",
            "3. O que é cumprimento múltiplo de profecia?",
            "4. Como lidar com linguagem simbólica na profecia?",
            "5. Por que devemos primeiro entender o contexto original?"
          ],
          application: "Leia Miquéias 6:6-8. Qual era a mensagem de Deus para Israel? Como isso se aplica hoje?",
          summary: "Profecia bíblica primariamente proclama a mensagem de Deus ao presente, usa linguagem simbólica e pode ter cumprimentos múltiplos."
        },
        {
          title: "Aplicação Bíblica",
          content: `O objetivo final da interpretação é aplicação - viver o que a Bíblia ensina. "Sede cumpridores da palavra, e não somente ouvintes, enganando-vos a vós mesmos" (Tiago 1:22). Conhecimento sem obediência é estéril.

A ponte entre interpretação e aplicação passa pela teologia. Primeiro, o que o texto significava para seus leitores originais? Segundo, qual o princípio teológico atemporal por trás? Terceiro, como esse princípio se aplica ao nosso contexto? Não podemos pular diretamente do texto antigo para nossa situação.

Nem toda aplicação é direta e literal. Não construímos arcos como Noé, mas obedecemos a Deus em fé. Não sacrificamos animais, mas nos apropriamos do sacrifício de Cristo. O princípio permanece; a forma de aplicação muda conforme o contexto redemptivo.

Aplicação genuína é específica e prática. "Vou amar mais meu próximo" é vago. "Vou visitar meu vizinho enfermo esta semana" é concreto. O Espírito Santo nos guia a aplicações específicas enquanto meditamos na Palavra e buscamos sabedoria.`,
          references: "Tiago 1:22-25; 2 Timóteo 3:16-17; Romanos 15:4; 1 Coríntios 10:6-11; Hebreus 4:12",
          questions: [
            "1. Por que aplicação é o objetivo da interpretação?",
            "2. Quais são os passos da interpretação à aplicação?",
            "3. Por que nem toda aplicação é direta e literal?",
            "4. Como fazer aplicações específicas e práticas?",
            "5. Qual o papel do Espírito Santo na aplicação?"
          ],
          application: "Escolha uma passagem que você estudou recentemente. Siga os passos: significado original, princípio atemporal, aplicação específica para esta semana.",
          summary: "A aplicação bíblica conecta significado original a princípios teológicos atemporais e então a obediência específica e prática em nosso contexto."
        }
      ])
    }
  ]
};

// MÓDULO 2: Teologia do Antigo Testamento
const MODULO_2_TEOLOGIA_AT: ModuleData = {
  id: "nivel2-mod2-teologia-at",
  name: "Teologia do Antigo Testamento",
  description: "Os grandes temas teológicos revelados no Antigo Testamento",
  icon: "ScrollText",
  color: "#8B5CF6",
  order: 17,
  tracks: [
    {
      id: "track-n2m2-moderado",
      level: "moderado",
      name: "Temas do Antigo Testamento",
      description: "Compreendendo a mensagem teológica do Antigo Testamento",
      requiredPlan: "premium",
      order: 1,
      lessons: createLessons("n2m2", [
        {
          title: "A Unidade do Antigo Testamento",
          content: `O Antigo Testamento não é uma coleção aleatória de histórias antigas, mas uma narrativa teológica unificada. Escrito por múltiplos autores ao longo de mil anos, compartilha temas, personagens e propósito comum - revelar o Deus de Israel e Seu plano redentor.

O Antigo Testamento é organizado de forma diferente na Bíblia hebraica e nas traduções cristãs, mas a mensagem é a mesma. Jesus referia-se à "Lei, Profetas e Escritos" (Lucas 24:44), a divisão judaica tradicional. Toda esta literatura aponta para Cristo.

Muitos cristãos negligenciam o Antigo Testamento, considerando-o ultrapassado. Mas Paulo afirma: "Tudo o que dantes foi escrito, para nosso ensino foi escrito" (Romanos 15:4). O Novo Testamento cita o Antigo centenas de vezes. Não podemos entender plenamente o Novo sem conhecer o Antigo.

A teologia do Antigo Testamento busca identificar os temas centrais que unificam esta vasta literatura. Aliança, Reino de Deus, promessa e cumprimento, a presença de Deus - estes e outros temas formam o arcabouço teológico que encontra plenitude em Cristo.`,
          references: "Lucas 24:44-47; Romanos 15:4; 2 Timóteo 3:16; Mateus 5:17-18; João 5:39",
          questions: [
            "1. Por que o Antigo Testamento é uma unidade?",
            "2. Como era organizada a Bíblia hebraica?",
            "3. Por que muitos negligenciam o Antigo Testamento?",
            "4. Qual o propósito de estudar teologia do AT?",
            "5. Como o AT aponta para Cristo?"
          ],
          application: "Comprometa-se a ler o Antigo Testamento sistematicamente, buscando ver Cristo em cada parte.",
          summary: "O Antigo Testamento é uma narrativa teológica unificada que revela Deus e Seu plano redentor, apontando para Cristo."
        },
        {
          title: "Deus Como Criador e Soberano",
          content: `O Antigo Testamento abre com a majestosa declaração: "No princípio, criou Deus os céus e a terra" (Gênesis 1:1). Deus é o Criador de tudo o que existe. Não há cosmogonia de lutas entre deuses como nas religiões vizinhas - apenas a Palavra soberana que cria.

Como Criador, Deus é distinto de Sua criação. O paganismo confunde criador e criatura, adorando natureza, astros ou animais. A Bíblia proclama transcendência absoluta. "A quem me fareis semelhante?" (Isaías 40:25). Deus está acima de toda a criação.

A soberania de Deus sobre a história é tema constante. Ele levanta e derruba reis (Daniel 2:21), controla nações (Isaías 10:5-15) e cumpre Seus propósitos através de todos os eventos. "O meu conselho será firme, e farei toda a minha vontade" (Isaías 46:10).

Esta teologia do Deus soberano confrontava diretamente as crenças do mundo antigo. Os deuses pagãos eram limitados a territórios e podiam ser derrotados. O Deus de Israel é Senhor de toda a terra, único Deus verdadeiro, soberano absoluto.`,
          references: "Gênesis 1:1; Isaías 40:12-31; Daniel 2:21; Isaías 46:9-10; Salmo 24:1-2",
          questions: [
            "1. O que significa Deus ser Criador?",
            "2. Como a criação bíblica difere das cosmogonias pagãs?",
            "3. O que significa transcendência divina?",
            "4. Como o AT demonstra a soberania de Deus na história?",
            "5. Por que essa teologia era revolucionária no mundo antigo?"
          ],
          application: "Leia Isaías 40:12-31. Deixe a grandeza de Deus impactar sua perspectiva sobre seus problemas atuais.",
          summary: "O Antigo Testamento revela Deus como Criador transcendente e soberano absoluto sobre toda a criação e história."
        },
        {
          title: "A Aliança com Abraão",
          content: `Aliança (berith em hebraico) é conceito central na teologia do Antigo Testamento. Deus se relaciona com Seu povo através de alianças - acordos solenes que estabelecem compromissos e prometem bênçãos.

A aliança com Abraão (Gênesis 12, 15, 17) é fundacional. Deus promete três coisas: terra ("a tua descendência darei esta terra"), descendência ("farei de ti uma grande nação") e bênção universal ("em ti serão benditas todas as famílias da terra"). Toda a história bíblica desdobra estas promessas.

Abraão não merecia esta aliança - ela foi pura graça. Em Gênesis 15, Deus sozinho passa entre os animais divididos, assumindo toda a responsabilidade. A aliança é unilateral - Deus faz; Abraão recebe. A resposta apropriada é fé, e "creu ele no Senhor, e foi-lhe imputado para justiça" (Gênesis 15:6).

As promessas a Abraão encontram cumprimento progressivo: parcialmente em Israel, plenamente em Cristo. Em Jesus, a bênção de Abraão chega a todas as nações. "Se sois de Cristo, também sois descendentes de Abraão, e herdeiros conforme a promessa" (Gálatas 3:29).`,
          references: "Gênesis 12:1-3; 15:1-21; 17:1-14; Gálatas 3:6-29; Hebreus 11:8-19",
          questions: [
            "1. O que é uma aliança bíblica?",
            "2. Quais são as três promessas da aliança abraâmica?",
            "3. Por que a aliança foi graça, não mérito?",
            "4. O que significa a cerimônia de Gênesis 15?",
            "5. Como a aliança abraâmica se cumpre em Cristo?"
          ],
          application: "Você é herdeiro das promessas a Abraão através de Cristo. Reflita sobre o que isso significa para sua identidade e esperança.",
          summary: "A aliança com Abraão promete terra, descendência e bênção universal por graça, encontrando cumprimento pleno em Cristo."
        },
        {
          title: "O Êxodo e a Redenção",
          content: `O Êxodo é o evento redentor central do Antigo Testamento. Deus libertou Israel da escravidão no Egito com mão poderosa, demonstrando Seu amor, poder e fidelidade às promessas. O Êxodo molda a identidade de Israel para sempre.

A libertação do Êxodo é paradigma de toda redenção. Deus vê o sofrimento ("bem vi a aflição do meu povo" - Êxodo 3:7), ouve o clamor, desce para libertar e leva para um lugar melhor. Este padrão se repete através das Escrituras e culmina na obra de Cristo.

A Páscoa está no coração do Êxodo. O sangue do cordeiro nos umbrais protegia da morte. "Vendo eu o sangue, passarei por cima de vós" (Êxodo 12:13). João Batista apontou para Jesus: "Eis o Cordeiro de Deus, que tira o pecado do mundo" (João 1:29). Cristo é nossa Páscoa (1 Coríntios 5:7).

O Êxodo também estabelece Deus como Rei de Israel. Após a libertação, Ele dá a Lei e habita entre Seu povo. O Êxodo não é apenas liberdade de algo, mas para algo - para servir a Deus em adoração e obediência. Redenção e serviço estão unidos.`,
          references: "Êxodo 3:7-10; 12:1-14; 15:1-18; João 1:29; 1 Coríntios 5:7",
          questions: [
            "1. Por que o Êxodo é tão central no AT?",
            "2. Qual é o padrão redentor do Êxodo?",
            "3. Como a Páscoa aponta para Cristo?",
            "4. O que significa o Êxodo para a identidade de Israel?",
            "5. Qual a relação entre redenção e serviço?"
          ],
          application: "Você foi liberto por Cristo, o Cordeiro Pascal. Para que você foi liberto? Como isso afeta sua vida diária?",
          summary: "O Êxodo é o paradigma de redenção no AT, com a Páscoa apontando para Cristo, o Cordeiro de Deus que nos liberta para servi-Lo."
        },
        {
          title: "A Lei e a Aliança Sinaítica",
          content: `No Sinai, Deus faz aliança com Israel e entrega a Torá (Lei). Esta não é legislação arbitrária, mas revelação do caráter de Deus e do caminho de vida para Seu povo. "Que povo há tão grande que tenha estatutos e juízos tão justos?" (Deuteronômio 4:8).

A Lei começa com o Decálogo - os Dez Mandamentos (Êxodo 20). Os primeiros mandamentos governam o relacionamento com Deus; os últimos, relacionamentos humanos. Jesus resumiu: amar a Deus e amar o próximo (Mateus 22:37-40). A Lei não é fardo, mas expressão de amor.

A Lei sinaítica inclui também leis cerimoniais (sacrifícios, festas, pureza) e civis (justiça social, propriedade, crimes). Estas moldavam Israel como nação santa, distinta dos povos. Muitas foram cumpridas em Cristo; os princípios morais permanecem eternos.

A aliança sinaítica era condicional: bênçãos para obediência, maldições para desobediência (Deuteronômio 28). Israel repetidamente falhou. A Lei revelou a necessidade de algo mais - um novo coração, uma nova aliança. A Lei é "aio para nos conduzir a Cristo" (Gálatas 3:24).`,
          references: "Êxodo 19-24; Deuteronômio 4:5-8; 28:1-68; Gálatas 3:19-25; Romanos 7:7-12",
          questions: [
            "1. Qual o propósito da Lei dada no Sinai?",
            "2. Como os Dez Mandamentos estão organizados?",
            "3. Quais são os três tipos de leis na Torá?",
            "4. O que significa a Lei ser condicional?",
            "5. Como a Lei nos conduz a Cristo?"
          ],
          application: "Leia os Dez Mandamentos em Êxodo 20. Como eles revelam o caráter de Deus? Onde você precisa de Cristo?",
          summary: "A Lei sinaítica revela o caráter de Deus e o caminho de vida, mas sua condicionalidade expõe a necessidade humana de graça."
        },
        {
          title: "O Sistema Sacrificial",
          content: `O Tabernáculo e depois o Templo eram o centro da adoração israelita. Ali, através de sacrifícios, o povo se aproximava de um Deus santo. O sistema sacrificial ensinava verdades profundas sobre pecado, expiação e comunhão.

Os sacrifícios principais incluíam: holocausto (consagração total a Deus), oferta de manjares (gratidão), sacrifício pacífico (comunhão), oferta pelo pecado (purificação) e oferta pela culpa (restituição). Cada um comunicava aspecto diferente do relacionamento com Deus.

O sangue era central: "A vida da carne está no sangue; pelo que vo-lo tenho dado sobre o altar, para fazer expiação pelas vossas almas" (Levítico 17:11). Sem derramamento de sangue não há remissão. Os animais morriam no lugar do pecador, prefigurando a substituição.

Todos os sacrifícios apontavam para Cristo. "É impossível que o sangue de touros e bodes tire os pecados" (Hebreus 10:4). Eram sombras; Cristo é a realidade. Seu único sacrifício realizou o que milhares de animais nunca puderam - redenção eterna (Hebreus 9:11-14).`,
          references: "Levítico 1-7; 16:1-34; 17:11; Hebreus 9:1-14; 10:1-18",
          questions: [
            "1. Qual era a função do sistema sacrificial?",
            "2. Quais eram os principais tipos de sacrifícios?",
            "3. Por que o sangue era tão importante?",
            "4. O que significa substituição vicária?",
            "5. Como os sacrifícios apontavam para Cristo?"
          ],
          application: "Leia Hebreus 10:1-18. Agradeça que Cristo ofereceu um sacrifício definitivo e você tem acesso direto a Deus.",
          summary: "O sistema sacrificial ensinava sobre pecado e expiação através de sangue substitutivo, apontando para o sacrifício definitivo de Cristo."
        },
        {
          title: "A Aliança Davídica",
          content: `A aliança com Davi (2 Samuel 7) é pilar da esperança messiânica. Deus promete a Davi: "A tua casa e o teu reino serão firmados para sempre" (2 Samuel 7:16). Um descendente de Davi reinará eternamente no trono de Israel.

Esta promessa parecia impossível quando o reino caiu e o exílio veio. Onde estava o rei eterno? Os profetas mantiveram viva a esperança: um Rebento de Jessé (Isaías 11:1), um Rei justo (Jeremias 23:5), o Príncipe da Paz (Isaías 9:6-7). O Messias viria.

Os Salmos celebram o rei davídico e profetizam sobre o Rei maior que viria. Salmo 2, 72, 89, 110 são exemplos de "salmos reais" que transcendem qualquer rei histórico e apontam para o Messias. "Tu és sacerdote eternamente, segundo a ordem de Melquisedeque" (Salmo 110:4).

Jesus é o Filho de Davi prometido. Gabriel anunciou a Maria: "O Senhor Deus lhe dará o trono de Davi, seu pai, e reinará eternamente" (Lucas 1:32-33). Cristo cumpre a aliança davídica - Ele é o Rei eterno, e Seu reino não terá fim.`,
          references: "2 Samuel 7:1-17; Isaías 9:6-7; 11:1-10; Salmo 110; Lucas 1:32-33; Mateus 1:1",
          questions: [
            "1. O que Deus prometeu a Davi?",
            "2. Como o exílio desafiou essa promessa?",
            "3. Como os profetas mantiveram a esperança messiânica?",
            "4. O que são os salmos reais?",
            "5. Como Jesus cumpre a aliança davídica?"
          ],
          application: "Jesus é Rei. Examine áreas de sua vida onde você resiste ao Seu reinado. Submeta-as ao Rei davídico.",
          summary: "A aliança davídica promete um Rei eterno do descendente de Davi, cumprido em Jesus Cristo, o Messias."
        },
        {
          title: "Os Profetas e a Justiça Social",
          content: `Os profetas de Israel não eram apenas preditores do futuro, mas porta-vozes de Deus confrontando pecado e chamando ao arrependimento. Uma ênfase constante era a justiça social - Deus se importa profundamente com como tratamos os vulneráveis.

Amós trovejava contra Israel próspero que oprimia os pobres: "Vendem o justo por dinheiro e o necessitado por um par de sapatos" (Amós 2:6). Religiosidade sem justiça era repugnante: "Aborreço, desprezo as vossas festas... Corra, porém, o juízo como as águas" (Amós 5:21-24).

Miquéias resume a vontade de Deus: "Que é o que o Senhor pede de ti, senão que pratiques a justiça, e ames a benignidade, e andes humildemente com o teu Deus?" (Miquéias 6:8). Adoração vertical sem justiça horizontal é falsa.

Isaías condena jejuns religiosos enquanto os trabalhadores são oprimidos (Isaías 58). O verdadeiro jejum é "soltar as ligaduras da impiedade... deixar livres os oprimidos... repartir o teu pão com o faminto." A verdadeira espiritualidade se manifesta em compaixão prática.`,
          references: "Amós 2:6-8; 5:21-24; Miquéias 6:6-8; Isaías 1:10-17; 58:1-12; Jeremias 22:13-17",
          questions: [
            "1. Qual era o papel dos profetas em Israel?",
            "2. Por que os profetas enfatizavam justiça social?",
            "3. O que Miquéias 6:8 ensina sobre a vontade de Deus?",
            "4. Por que religiosidade sem justiça é rejeitada?",
            "5. Como aplicar a mensagem profética hoje?"
          ],
          application: "Examine sua vida: sua fé produz justiça e compaixão pelos vulneráveis? Identifique uma ação concreta que você pode tomar.",
          summary: "Os profetas insistiam que adoração verdadeira inclui justiça social - cuidado pelos pobres, viúvas, órfãos e oprimidos."
        },
        {
          title: "O Exílio e a Esperança",
          content: `O exílio babilônico (586 a.C.) foi catástrofe nacional e teológica. Jerusalém destruída, Templo arrasado, povo deportado. Onde estava Deus? As promessas falharam? O exílio forçou Israel a repensar tudo.

Os profetas explicaram: o exílio era julgamento por séculos de pecado. Deus não falhou; Israel falhou. Jeremias havia advertido por quarenta anos. Mas mesmo no julgamento, havia esperança. O exílio não era o fim, mas disciplina de um Pai amoroso.

A esperança do retorno brilha nos profetas. Isaías 40-66 proclama consolação: "Consolai, consolai o meu povo... Falai benignamente a Jerusalém" (Isaías 40:1-2). Deus fará um novo êxodo, mais glorioso que o primeiro. Ele restaurará Seu povo.

Ezequiel viu ossos secos revivendo (Ezequiel 37). Jeremias anunciou nova aliança com a lei escrita nos corações (Jeremias 31:31-34). O exílio ensinou que a salvação última exigia transformação interior que somente Deus poderia fazer. Assim, a esperança messiânica cresceu.`,
          references: "2 Reis 25:1-21; Isaías 40:1-11; Jeremias 29:10-14; 31:31-34; Ezequiel 37:1-14",
          questions: [
            "1. O que foi o exílio babilônico?",
            "2. Como os profetas explicaram o exílio?",
            "3. Que esperança havia durante o exílio?",
            "4. O que é a 'nova aliança' de Jeremias?",
            "5. Como o exílio moldou a esperança messiânica?"
          ],
          application: "Você já passou por 'exílios' - tempos de disciplina ou sofrimento? Como Deus usou isso para aprofundar sua fé?",
          summary: "O exílio, embora julgamento pelo pecado, não foi o fim - os profetas anunciavam restauração e uma nova aliança superior."
        },
        {
          title: "A Esperança Messiânica",
          content: `Por todo o Antigo Testamento, a esperança de um Libertador crescia. Prometido em Gênesis 3:15, confirmado a Abraão, anunciado nos profetas - o Messias (Ungido) viria para resgatar e reinar.

Isaías pintou retratos vívidos do Messias. Ele seria nascido de uma virgem (7:14), teria governo sobre seus ombros (9:6-7), seria Servo Sofredor que carrega pecados (53). Estas profecias são cumpridas detalhadamente em Jesus.

Daniel viu "um como Filho do Homem" vindo nas nuvens do céu, recebendo domínio, glória e reino eterno (Daniel 7:13-14). Jesus usava este título - Filho do Homem - mais que qualquer outro para Si mesmo, reivindicando esta identidade.

Zacarias profetizou um rei humilde montado em jumento (9:9), cumprido na entrada triunfal. Malaquias anunciou o mensageiro que prepararia o caminho (3:1), cumprido em João Batista. Todo o Antigo Testamento aponta para Jesus - Ele é o cumprimento de suas esperanças.`,
          references: "Gênesis 3:15; Isaías 7:14; 9:6-7; 53:1-12; Daniel 7:13-14; Zacarias 9:9; Malaquias 3:1",
          questions: [
            "1. De onde vem a esperança messiânica no AT?",
            "2. Como Isaías descreve o Messias?",
            "3. Quem é o 'Filho do Homem' em Daniel?",
            "4. Cite outras profecias messiânicas cumpridas em Jesus.",
            "5. Por que é importante ver o AT apontando para Cristo?"
          ],
          application: "Leia Isaías 53 lentamente, reconhecendo Jesus em cada verso. Agradeça pelo cumprimento destas promessas.",
          summary: "O Antigo Testamento progressivamente revela a esperança messiânica que encontra cumprimento completo em Jesus Cristo."
        }
      ])
    }
  ]
};

// MÓDULO 3: Teologia do Novo Testamento
const MODULO_3_TEOLOGIA_NT: ModuleData = {
  id: "nivel2-mod3-teologia-nt",
  name: "Teologia do Novo Testamento",
  description: "Os grandes temas teológicos revelados no Novo Testamento",
  icon: "Cross",
  color: "#EF4444",
  order: 18,
  tracks: [
    {
      id: "track-n2m3-moderado",
      level: "moderado",
      name: "Temas do Novo Testamento",
      description: "Compreendendo a mensagem teológica do Novo Testamento",
      requiredPlan: "premium",
      order: 1,
      lessons: createLessons("n2m3", [
        {
          title: "O Novo Testamento como Cumprimento",
          content: `O Novo Testamento não é novo começo desconectado do Antigo, mas cumprimento das promessas antigas. "O tempo está cumprido, e o reino de Deus está próximo" (Marcos 1:15) - Jesus anuncia que a longa espera terminou.

Mateus organiza seu Evangelho para demonstrar cumprimento. Repetidamente nota: "para que se cumprisse o que foi dito pelo profeta" (Mateus 1:22; 2:15; etc.). Jesus é a resposta às esperanças de Israel. O Novo Testamento só faz sentido à luz do Antigo.

Jesus mesmo declarou: "Não penseis que vim revogar a Lei ou os Profetas; não vim para revogar, vim para cumprir" (Mateus 5:17). Ele não descarta o Antigo Testamento; Ele o realiza. A Lei, os Profetas, os Salmos - todos apontam para Ele (Lucas 24:44).

Esta continuidade fundamenta nossa fé. Não adoramos um Deus novo, mas o mesmo Deus de Abraão, Isaque e Jacó - agora plenamente revelado em Cristo. Somos enxertados na oliveira de Israel (Romanos 11). O plano de Deus é uno, do Gênesis ao Apocalipse.`,
          references: "Marcos 1:14-15; Mateus 5:17-18; Lucas 24:44-47; Romanos 1:1-4; 2 Coríntios 1:20",
          questions: [
            "1. Como o NT se relaciona com o AT?",
            "2. O que significa Jesus 'cumprir' a Lei e os Profetas?",
            "3. Por que Mateus enfatiza o cumprimento de profecias?",
            "4. Como esta continuidade fortalece nossa fé?",
            "5. Por que não podemos entender o NT sem o AT?"
          ],
          application: "Ao ler o Novo Testamento, busque as conexões com o Antigo. Pergunte: 'O que está sendo cumprido aqui?'",
          summary: "O Novo Testamento é cumprimento das promessas do Antigo - Jesus realiza o que foi profetizado, continuando o único plano de Deus."
        },
        {
          title: "O Reino de Deus",
          content: `O Reino de Deus é o tema central da pregação de Jesus. "O tempo está cumprido, e o reino de Deus está próximo; arrependei-vos, e crede no evangelho" (Marcos 1:15). Mais que qualquer outro assunto, Jesus falava sobre o Reino.

O Reino de Deus é Seu governo e reinado. Não é primariamente um lugar, mas o exercício da autoridade soberana de Deus. Onde Deus reina, ali está Seu Reino. Em Jesus, o Reino invadiu a história. "Se eu expulso os demônios pelo dedo de Deus, certamente é chegado o reino de Deus sobre vós" (Lucas 11:20).

O Reino é "já, mas ainda não." Já está presente em Cristo e naqueles que se submetem a Ele. Ainda não está consumado em plenitude. Vivemos na tensão entre inauguração e consumação. O Reino veio, está vindo e virá.

As parábolas de Jesus frequentemente descrevem o Reino. É como semente que cresce misteriosamente (Marcos 4:26-29), como fermento que transforma toda a massa (Mateus 13:33), como tesouro pelo qual vale tudo sacrificar (Mateus 13:44). Entrar no Reino exige resposta radical.`,
          references: "Marcos 1:14-15; Lucas 11:20; Mateus 6:33; 13:1-52; Lucas 17:20-21",
          questions: [
            "1. O que é o Reino de Deus?",
            "2. O que significa dizer que o Reino é 'já, mas ainda não'?",
            "3. Como as parábolas ilustram o Reino?",
            "4. Qual deve ser nossa resposta ao Reino?",
            "5. Como você vive a realidade do Reino hoje?"
          ],
          application: "Ore hoje: 'Venha o Teu Reino' (Mateus 6:10). Submeta uma área de resistência ao reinado de Deus.",
          summary: "O Reino de Deus - Seu reinado soberano - é o tema central de Jesus, já presente mas ainda aguardando consumação plena."
        },
        {
          title: "A Pessoa de Cristo",
          content: `Jesus Cristo é o centro absoluto do Novo Testamento. Quem é Ele? Os Evangelhos respondem: Ele é plenamente Deus e plenamente homem, o Filho eterno encarnado.

A divindade de Cristo é afirmada consistentemente. João abre: "No princípio era o Verbo, e o Verbo estava com Deus, e o Verbo era Deus" (João 1:1). Jesus perdoa pecados (algo que só Deus pode fazer), aceita adoração, declara "Eu e o Pai somos um" (João 10:30). Tomé confessa: "Senhor meu, e Deus meu!" (João 20:28).

A humanidade de Cristo é igualmente clara. Ele nasceu, cresceu, sentiu fome, sede, cansaço. Chorou no túmulo de Lázaro. Agonizou no Getsêmani. "Sendo tentado em tudo, semelhante a nós, mas sem pecado" (Hebreus 4:15). Sua humanidade real fundamenta Sua capacidade de nos representar.

A união das duas naturezas em uma pessoa (união hipostática) é mistério que a igreja definiu em Calcedônia (451 d.C.). Cristo é "verdadeiro Deus e verdadeiro homem, da mesma substância do Pai quanto à divindade, da mesma substância nossa quanto à humanidade." Esta verdade é essencial à salvação.`,
          references: "João 1:1-14; Filipenses 2:5-11; Colossenses 1:15-20; Hebreus 1:1-4; 4:14-16",
          questions: [
            "1. Como o NT afirma a divindade de Cristo?",
            "2. Como o NT afirma a humanidade de Cristo?",
            "3. Por que ambas as naturezas são necessárias para a salvação?",
            "4. O que é a união hipostática?",
            "5. Como esta verdade afeta sua adoração a Cristo?"
          ],
          application: "Adore Cristo como verdadeiro Deus. Aproxime-se dEle como irmão que entende suas tentações. Ambas as verdades são para você.",
          summary: "Jesus Cristo é plenamente Deus e plenamente homem em uma pessoa - verdade essencial para a salvação e nossa relação com Ele."
        },
        {
          title: "A Obra de Cristo",
          content: `A obra de Cristo é primariamente Sua morte e ressurreição para salvação dos pecadores. Este é o coração do evangelho. "Cristo morreu por nossos pecados, segundo as Escrituras, e... ressuscitou ao terceiro dia" (1 Coríntios 15:3-4).

A cruz é explicada por várias imagens complementares. Substituição: Cristo morreu em nosso lugar (Romanos 5:8). Propiciação: Ele satisfez a ira de Deus (Romanos 3:25). Redenção: Ele pagou o preço do resgate (Marcos 10:45). Reconciliação: Ele removeu a inimizade (2 Coríntios 5:18-19).

A ressurreição valida tudo. "Se Cristo não ressuscitou, é vã a vossa fé" (1 Coríntios 15:17). A ressurreição prova que o sacrifício foi aceito, que a morte foi derrotada, que Jesus é quem dizia ser. Sem ressurreição, o cristianismo desmorona.

Cristo continua Sua obra. Ascendeu ao Pai e está à destra de Deus, intercedendo por nós (Romanos 8:34; Hebreus 7:25). Ele voltará em glória para julgar vivos e mortos e consumar o Reino. A obra de Cristo é completa quanto à salvação, mas continua em intercessão e virá a consumação.`,
          references: "1 Coríntios 15:1-8; Romanos 3:21-26; 5:6-11; 2 Coríntios 5:18-21; Hebreus 7:23-25",
          questions: [
            "1. Qual é a obra central de Cristo?",
            "2. Explique as imagens bíblicas da cruz.",
            "3. Por que a ressurreição é essencial?",
            "4. O que Cristo faz agora à destra de Deus?",
            "5. Como Sua obra afeta você pessoalmente?"
          ],
          application: "A cada dia desta semana, medite em uma imagem da obra de Cristo: substituição, propiciação, redenção, reconciliação. Agradeça.",
          summary: "A obra de Cristo inclui Sua morte substitutiva, ressurreição vitoriosa, intercessão contínua e retorno futuro em glória."
        },
        {
          title: "O Espírito Santo",
          content: `O Novo Testamento revela plenamente o Espírito Santo como terceira pessoa da Trindade. Jesus prometeu: "Eu rogarei ao Pai, e ele vos dará outro Consolador" (João 14:16). Em Pentecostes, a promessa se cumpriu.

O Espírito aplica a salvação. Ele convence do pecado (João 16:8), regenera o coração morto (João 3:5-6), batiza no corpo de Cristo (1 Coríntios 12:13), habita no crente (Romanos 8:9), sela para a redenção (Efésios 1:13-14). Tudo que Cristo conquistou, o Espírito aplica.

O Espírito capacita para a vida cristã. Ele produz fruto - amor, alegria, paz (Gálatas 5:22-23). Ele concede dons para ministério (1 Coríntios 12). Ele guia à verdade (João 16:13), auxilia na oração (Romanos 8:26), dá poder para testemunho (Atos 1:8).

A vida no Espírito é marca distintiva da nova aliança. "A letra mata, mas o Espírito vivifica" (2 Coríntios 3:6). Não mais externa e escrita em pedra, mas interna, escrita no coração. O Espírito faz o que a Lei não podia - transforma de dentro para fora.`,
          references: "João 14:16-17, 26; 16:7-15; Atos 2:1-4; Romanos 8:1-17; Gálatas 5:16-26",
          questions: [
            "1. Como o NT revela a pessoa do Espírito Santo?",
            "2. Qual o papel do Espírito na salvação?",
            "3. Como o Espírito capacita a vida cristã?",
            "4. O que distingue a vida no Espírito da vida sob a Lei?",
            "5. Como você cultiva sensibilidade ao Espírito?"
          ],
          application: "Peça ao Espírito que mostre áreas onde você está resistindo Sua obra. Submeta-se à Sua transformação interior.",
          summary: "O Espírito Santo aplica a salvação, habita no crente, produz fruto e capacita para ministério, cumprindo a promessa da nova aliança."
        },
        {
          title: "A Salvação pela Graça",
          content: `A salvação no Novo Testamento é pela graça mediante a fé, não por obras. Esta é a revolução do evangelho. "Porque pela graça sois salvos, por meio da fé; e isto não vem de vós, é dom de Deus" (Efésios 2:8).

Graça é favor imerecido. Não ganhamos nem merecemos. Éramos mortos em pecados, inimigos de Deus, sem forças. "Deus prova o seu amor para conosco, em que Cristo morreu por nós, sendo nós ainda pecadores" (Romanos 5:8). Graça significa que Deus dá; nós recebemos.

A fé é o instrumento que recebe a graça. Fé não é obra meritória - é mão vazia que aceita o dom. Abraão "creu em Deus, e isso lhe foi imputado para justiça" (Romanos 4:3). Fé olha para fora de si, para Cristo e Sua obra. Quem confia em obras olha para si.

Obras são fruto, não raiz da salvação. "Somos feitura sua, criados em Cristo Jesus para as boas obras" (Efésios 2:10). Salvos pela graça para fazer obras. A ordem é crucial: não obras para ser salvo, mas salvo para fazer obras. Tiago e Paulo concordam quando entendidos corretamente.`,
          references: "Efésios 2:1-10; Romanos 3:21-28; 4:1-8; 5:1-2; Gálatas 2:16; Tiago 2:14-26",
          questions: [
            "1. O que é graça?",
            "2. O que é fé salvadora?",
            "3. Por que obras não salvam?",
            "4. Qual é o lugar das obras na vida cristã?",
            "5. Como Tiago e Paulo se harmonizam?"
          ],
          application: "Examine se você está descansando na graça ou ainda tentando merecer. Abandone toda confiança em si mesmo e descanse em Cristo.",
          summary: "A salvação é pela graça (favor imerecido de Deus), mediante a fé (confiança em Cristo), resultando em boas obras como fruto."
        },
        {
          title: "A Igreja como Corpo de Cristo",
          content: `A Igreja é tema central do Novo Testamento. Jesus disse: "Edificarei a minha igreja" (Mateus 16:18). Atos registra seu nascimento em Pentecostes. As Epístolas instruem sua vida e missão. A Igreja é o povo de Deus na nova aliança.

Paulo usa a imagem do "corpo de Cristo" para descrever a Igreja. "Vós sois o corpo de Cristo, e seus membros em particular" (1 Coríntios 12:27). Cristo é a cabeça; cada crente é membro. Somos organicamente conectados a Cristo e uns aos outros.

A Igreja é universal e local. Universal é o conjunto de todos os crentes de todos os tempos e lugares. Local é a expressão visível em reuniões concretas. Não existe cristianismo solitário no NT. Somos salvos para comunidade, não para isolamento.

As marcas da Igreja incluem: doutrina dos apóstolos (ensino bíblico), comunhão (koinonia), partir do pão (ceia e refeições), orações (Atos 2:42). Ela pratica os sacramentos (batismo e ceia), exerce disciplina, envia missionários. A Igreja é o plano de Deus para esta era.`,
          references: "Mateus 16:18; Atos 2:42-47; 1 Coríntios 12:12-27; Efésios 4:1-16; 5:25-27",
          questions: [
            "1. O que é a Igreja segundo o NT?",
            "2. O que significa a Igreja ser 'corpo de Cristo'?",
            "3. Qual a diferença entre Igreja universal e local?",
            "4. Quais são as marcas essenciais da Igreja?",
            "5. Por que não existe cristianismo solitário?"
          ],
          application: "Avalie seu comprometimento com uma igreja local. Você está exercendo seus dons? Servindo ativamente? Vivendo em comunhão?",
          summary: "A Igreja é o corpo de Cristo, comunidade dos salvos expressa localmente, marcada por doutrina, comunhão, sacramentos e missão."
        },
        {
          title: "A Vida Cristã",
          content: `O Novo Testamento não apenas anuncia salvação, mas ensina como viver como salvos. A indicativo (o que Deus fez) fundamenta o imperativo (o que devemos fazer). Porque somos santos, devemos viver santamente.

A vida cristã é conformidade a Cristo. "Predestinou para serem conformes à imagem de seu Filho" (Romanos 8:29). Santificação é crescer em semelhança a Jesus. Olhamos para Ele - Seu caráter, atitudes, ações - e o Espírito nos transforma.

Paulo frequentemente lista virtudes a buscar e vícios a evitar. "Revesti-vos do novo homem" (Efésios 4:24) - compaixão, benignidade, humildade, mansidão. "Despojai-vos do velho homem" (Efésios 4:22) - imoralidade, impureza, cobiça, ira. Transformação moral é marca de cristãos genuínos.

A vida cristã é vivida em comunidade, casamento, família, trabalho, sociedade. As Epístolas dão instruções práticas para todas estas esferas. O evangelho transforma não apenas indivíduos, mas relacionamentos e instituições. Todo aspecto da vida está sob o senhorio de Cristo.`,
          references: "Romanos 12:1-2; Efésios 4:17-5:21; Colossenses 3:1-17; 1 Pedro 1:13-2:12; Tiago 1-5",
          questions: [
            "1. Como indicativo e imperativo se relacionam?",
            "2. O que é conformidade a Cristo?",
            "3. Quais virtudes o NT enfatiza?",
            "4. Como o evangelho transforma diferentes esferas da vida?",
            "5. Em que área você precisa de maior transformação?"
          ],
          application: "Escolha uma virtude de Colossenses 3:12-14 para cultivar esta semana. Peça ao Espírito que a forme em você.",
          summary: "A vida cristã é crescer em conformidade a Cristo, desenvolvendo virtudes e aplicando o evangelho a todas as esferas da existência."
        },
        {
          title: "A Esperança Futura",
          content: `O Novo Testamento é permeado de esperança futura. Cristo voltará, os mortos ressuscitarão, haverá julgamento final e nova criação. Esta esperança não é escape, mas combustível para vida fiel agora.

A segunda vinda de Cristo é promessa certa. "Esse Jesus, que dentre vós foi recebido em cima no céu, há de vir assim como para o céu o vistes ir" (Atos 1:11). Ele voltará pessoalmente, visivelmente, gloriosamente. A Igreja aguarda seu Noivo.

A ressurreição corporal é distintiva cristã. Não apenas sobrevivência da alma, mas corpo transformado. "Semeia-se corpo natural, ressuscita corpo espiritual" (1 Coríntios 15:44). O corpo de ressurreição de Jesus é modelo - real, tangível, glorificado.

O destino final é nova criação. "Vi novo céu e nova terra" (Apocalipse 21:1). Não destruição do material, mas renovação. "Eis que faço novas todas as coisas" (Apocalipse 21:5). Céu e terra unidos, Deus habitando com Seu povo para sempre. Este é nosso destino glorioso.`,
          references: "Atos 1:9-11; 1 Coríntios 15:35-58; 1 Tessalonicenses 4:13-18; Apocalipse 21:1-22:5",
          questions: [
            "1. O que o NT ensina sobre a segunda vinda?",
            "2. O que é a ressurreição corporal?",
            "3. O que é nova criação?",
            "4. Como essa esperança afeta a vida presente?",
            "5. O que você mais espera sobre o futuro?"
          ],
          application: "Medite em Apocalipse 21:1-5. Deixe a esperança da nova criação encorajá-lo em qualquer dificuldade presente.",
          summary: "O NT promete a segunda vinda de Cristo, ressurreição corporal, julgamento e nova criação - esperança que transforma o presente."
        },
        {
          title: "A Missão da Igreja",
          content: `O Novo Testamento termina com mandato missionário. "Ide, portanto, fazei discípulos de todas as nações" (Mateus 28:19). A Igreja existe não para si mesma, mas para levar o evangelho ao mundo.

A Grande Comissão é multifacetada: ir, fazer discípulos, batizar, ensinar. Não apenas evangelismo, mas discipulado completo. Não apenas decisões, mas maturidade. A meta é fazer discípulos que fazem discípulos - multiplicação.

Atos mostra a expansão: "Sereis minhas testemunhas tanto em Jerusalém como em toda a Judéia e Samaria e até aos confins da terra" (Atos 1:8). De Jerusalém para Roma, de judeus para gentios. O Espírito impulsiona a missão, quebra barreiras, capacita testemunhas.

A missão é holística. Inclui proclamação verbal ("preguei o evangelho" - Romanos 15:19) e demonstração prática ("me lembrar dos pobres" - Gálatas 2:10). Palavra e ação juntas. O Reino de Deus é anunciado e demonstrado. A Igreja continua a obra de Jesus no mundo.`,
          references: "Mateus 28:18-20; Atos 1:8; Romanos 10:13-17; 2 Coríntios 5:18-20; 1 Pedro 2:9-12",
          questions: [
            "1. O que é a Grande Comissão?",
            "2. Qual a diferença entre evangelismo e discipulado?",
            "3. Como Atos mostra a expansão missionária?",
            "4. O que significa missão holística?",
            "5. Qual é seu papel na missão?"
          ],
          application: "Ore por uma pessoa específica que precisa ouvir o evangelho. Busque uma oportunidade de compartilhar esta semana.",
          summary: "A missão da Igreja é fazer discípulos de todas as nações, proclamando e demonstrando o evangelho até os confins da terra."
        }
      ])
    }
  ]
};

// MÓDULO 4: Cristologia Avançada
const MODULO_4_CRISTOLOGIA: ModuleData = {
  id: "nivel2-mod4-cristologia",
  name: "Cristologia Avançada",
  description: "Estudo aprofundado da pessoa e obra de Jesus Cristo",
  icon: "Crown",
  color: "#F59E0B",
  order: 19,
  tracks: [
    {
      id: "track-n2m4-moderado",
      level: "moderado",
      name: "A Doutrina de Cristo",
      description: "Explorando a pessoa e obra do Senhor Jesus",
      requiredPlan: "premium",
      order: 1,
      lessons: createLessons("n2m4", [
        {
          title: "A Preexistência de Cristo",
          content: `Jesus não começou a existir em Belém. Ele é eternamente Deus, existindo antes da criação. "No princípio era o Verbo, e o Verbo estava com Deus, e o Verbo era Deus... E o Verbo se fez carne" (João 1:1, 14). A encarnação não foi início, mas entrada na humanidade.

Jesus afirmou Sua preexistência claramente. "Antes que Abraão existisse, EU SOU" (João 8:58). O uso de "Eu Sou" (ego eimi) ecoa o nome divino de Êxodo 3:14. Os judeus entenderam a reivindicação e pegaram pedras para apedrejá-Lo por blasfêmia.

Paulo confirma: "Ele é antes de todas as coisas, e todas as coisas subsistem por ele" (Colossenses 1:17). Cristo não apenas existia antes da criação, mas a própria criação foi feita por Ele e nEle se mantém. Hebreus 1:2 afirma que o Pai "fez o universo" através do Filho.

A preexistência é crucial para a salvação. Se Jesus fosse apenas humano criado, não poderia salvar. Somente Deus eterno pode oferecer sacrifício de valor infinito. Somente o Criador pode recriar. A preexistência fundamenta toda cristologia ortodoxa.`,
          references: "João 1:1-18; 8:58; 17:5; Colossenses 1:15-17; Hebreus 1:1-3; Filipenses 2:6",
          questions: [
            "1. O que significa a preexistência de Cristo?",
            "2. Como Jesus afirmou Sua preexistência?",
            "3. Qual o significado de 'Eu Sou' em João 8:58?",
            "4. Qual o papel de Cristo na criação?",
            "5. Por que a preexistência é essencial para a salvação?"
          ],
          application: "Adore Cristo como o eterno 'Eu Sou'. Ele não é apenas figura histórica, mas Deus eterno que entrou na história por você.",
          summary: "Cristo é eternamente Deus, existindo antes de toda a criação, que Ele mesmo fez e sustenta - verdade fundamental para a salvação."
        },
        {
          title: "A Encarnação",
          content: `A encarnação é o mistério central do cristianismo. "O Verbo se fez carne e habitou entre nós" (João 1:14). O Deus eterno assumiu natureza humana, nascendo de Maria. Não deixou de ser Deus; tornou-se também homem.

Filipenses 2:6-7 descreve este movimento: "Sendo em forma de Deus... esvaziou-se a si mesmo, tomando a forma de servo." O "esvaziamento" (kenosis) não foi abandono da divindade, mas adição da humanidade. Ele velou Sua glória, não a eliminou.

A concepção virginal (Mateus 1:18-25; Lucas 1:26-38) é o meio da encarnação. Maria concebeu pelo Espírito Santo sem participação de pai humano. Isso assegurou tanto a divindade (gerado pelo Espírito) quanto a humanidade (nascido de mulher) de Jesus.

A encarnação não foi temporária. Cristo permanece eternamente o Deus-homem. Após a ressurreição, Seu corpo foi transformado, não descartado. No céu, Ele ainda é o "homem Cristo Jesus" (1 Timóteo 2:5). A encarnação é permanente - nossa humanidade foi assumida para sempre.`,
          references: "João 1:14; Filipenses 2:5-11; Hebreus 2:14-18; 1 Timóteo 2:5; Mateus 1:18-25",
          questions: [
            "1. O que é a encarnação?",
            "2. O que significa 'kenosis'?",
            "3. Qual a importância da concepção virginal?",
            "4. Por que a encarnação é permanente?",
            "5. Como a encarnação afeta nossa salvação?"
          ],
          application: "Maravilhe-se: o Criador do universo se fez bebê, viveu entre nós, e permanece humano para sempre. Isso é amor!",
          summary: "Na encarnação, o Filho eterno de Deus assumiu permanentemente natureza humana, tornando-se o Deus-homem para nos salvar."
        },
        {
          title: "Os Ofícios de Cristo",
          content: `Cristo cumpre três ofícios do Antigo Testamento: Profeta, Sacerdote e Rei. Estes eram mediadores ungidos entre Deus e Israel. Jesus é o Mediador ungido supremo, cumprindo todos os três perfeitamente.

Como Profeta, Cristo revela Deus perfeitamente. "Deus... nos falou pelo Filho" (Hebreus 1:1-2). Ele é a Palavra final de Deus. Moisés profetizou um profeta maior (Deuteronômio 18:15), cumprido em Jesus. Ele proclama a verdade com autoridade divina.

Como Sacerdote, Cristo oferece sacrifício e intercede. Mas Ele é sacerdote diferente - ofereceu a Si mesmo como sacrifício perfeito e único (Hebreus 7:27). Agora vive para interceder por nós (Hebreus 7:25). Temos acesso direto a Deus através dEle.

Como Rei, Cristo governa sobre tudo. "Todo o poder me foi dado no céu e na terra" (Mateus 28:18). É o Rei davídico prometido cujo reino não terá fim (Lucas 1:33). Agora reina à destra de Deus; virá em glória para consumar Seu reino visível.`,
          references: "Deuteronômio 18:15-18; Hebreus 1:1-3; 7:23-28; Mateus 28:18; Apocalipse 19:16",
          questions: [
            "1. Quais são os três ofícios de Cristo?",
            "2. Como Jesus cumpre o ofício de Profeta?",
            "3. Como Jesus cumpre o ofício de Sacerdote?",
            "4. Como Jesus cumpre o ofício de Rei?",
            "5. Qual ofício mais impacta sua vida agora?"
          ],
          application: "Submeta-se a Cristo como seu Profeta (ouça Sua Palavra), Sacerdote (confie em Sua intercessão) e Rei (obedeça Seu governo).",
          summary: "Cristo cumpre perfeitamente os ofícios de Profeta (revela Deus), Sacerdote (oferece sacrifício e intercede) e Rei (governa soberanamente)."
        },
        {
          title: "A Impecabilidade de Cristo",
          content: `Jesus foi "tentado em tudo como nós, mas sem pecado" (Hebreus 4:15). Esta impecabilidade (ausência de pecado) é essencial para Sua obra redentora. Um pecador não poderia morrer pelos pecados de outros.

A impecabilidade inclui ausência de pecado original e pecados atuais. Jesus não herdou natureza corrompida (a concepção virginal protegeu isso) nem cometeu qualquer ato pecaminoso. Ele desafiou Seus oponentes: "Quem dentre vós me convence de pecado?" (João 8:46). Ninguém pôde.

Surge a questão: Se Jesus não podia pecar, Suas tentações foram reais? A resposta é sim. Tentação é atração externa, não apenas sucumbir. Jesus sentiu o peso total da tentação - na verdade, mais que nós, porque resistiu até o fim. Quem sempre cede não conhece a força máxima da tentação.

A impecabilidade de Cristo é nosso consolo e modelo. Consolo porque Ele nos entende, tendo enfrentado tentações reais. Modelo porque mostra que é possível viver sem pecado pelo poder do Espírito. Nós falhamos; Ele nunca falhou. Sua justiça é creditada a nós.`,
          references: "Hebreus 4:15; 7:26; João 8:46; 2 Coríntios 5:21; 1 Pedro 2:22; 1 João 3:5",
          questions: [
            "1. O que significa impecabilidade?",
            "2. As tentações de Jesus foram reais?",
            "3. Por que a impecabilidade era necessária para a salvação?",
            "4. Como a impecabilidade de Cristo consola você?",
            "5. Como ela é modelo para sua vida?"
          ],
          application: "Na próxima tentação, lembre-se: Jesus enfrentou o mesmo e venceu. Peça a força que Ele tem para você também vencer.",
          summary: "Cristo foi tentado em tudo como nós, porém sem pecado - essencial para Sua obra redentora e modelo para nossa vitória."
        },
        {
          title: "A Morte Expiatória",
          content: `A cruz não foi acidente ou martírio; foi o propósito central da vinda de Cristo. "O Filho do Homem não veio para ser servido, mas para servir e dar a sua vida em resgate por muitos" (Marcos 10:45). A morte de Cristo é expiatória - resolve o problema do pecado.

Expiação significa cobertura e remoção do pecado. No Antigo Testamento, sacrifícios de animais faziam expiação temporária. Cristo "se manifestou uma vez por todas... para tirar os pecados pelo sacrifício de si mesmo" (Hebreus 9:26). Seu sacrifício é eficaz definitivamente.

A cruz envolve substituição penal. Cristo morreu no nosso lugar, recebendo a penalidade que merecíamos. "Aquele que não conheceu pecado, o fez pecado por nós" (2 Coríntios 5:21). A justiça de Deus foi satisfeita; o pecador que crê é justificado.

A cruz também envolve vitória sobre os poderes. "Despojou os principados e potestades, e os expôs publicamente, e triunfou sobre eles na cruz" (Colossenses 2:15). Satanás foi derrotado. O poder do pecado foi quebrado. A morte foi destruída. Cristo é vencedor.`,
          references: "Marcos 10:45; Romanos 3:25; 2 Coríntios 5:21; Hebreus 9:11-14; Colossenses 2:13-15",
          questions: [
            "1. O que significa expiação?",
            "2. Como a cruz difere dos sacrifícios do AT?",
            "3. O que é substituição penal?",
            "4. Sobre quem Cristo triunfou na cruz?",
            "5. Como a cruz afeta sua vida diária?"
          ],
          application: "Agradeça a Cristo por tomar seu lugar na cruz. Viva hoje na liberdade que Seu sacrifício conquistou para você.",
          summary: "A morte de Cristo é expiatória (cobre pecados), substitutiva (morreu em nosso lugar) e vitoriosa (derrotou os poderes do mal)."
        },
        {
          title: "A Ressurreição Corporal",
          content: `A ressurreição de Cristo é fundamento do cristianismo. "Se Cristo não ressuscitou, é vã a vossa fé" (1 Coríntios 15:17). Não foi apenas sobrevivência espiritual, mas ressurreição corporal - o mesmo corpo crucificado, agora transformado e glorificado.

As evidências são convincentes. O túmulo estava vazio - inimigos poderiam ter refutado mostrando o corpo. Jesus apareceu a muitas testemunhas - indivíduos, grupos, até quinhentos de uma vez (1 Coríntios 15:6). Os discípulos foram transformados de medrosos em mártires corajosos.

O corpo ressurreto era real mas transformado. Jesus comeu peixe (Lucas 24:42-43), foi tocado (João 20:27), mas também atravessava paredes (João 20:19) e aparecia e desaparecia. Este é o tipo de corpo que teremos na ressurreição final.

A ressurreição prova várias verdades. Jesus é quem dizia ser - o Filho de Deus. O sacrifício foi aceito pelo Pai. A morte foi derrotada. A justificação está garantida. "Ressuscitou para nossa justificação" (Romanos 4:25). Nossa esperança está segura.`,
          references: "1 Coríntios 15:1-20; Romanos 4:25; Atos 2:24-32; Lucas 24:36-43; João 20:19-29",
          questions: [
            "1. Por que a ressurreição é essencial ao cristianismo?",
            "2. Quais são as evidências da ressurreição?",
            "3. Como era o corpo ressurreto de Jesus?",
            "4. O que a ressurreição prova?",
            "5. Como a ressurreição afeta sua esperança?"
          ],
          application: "Porque Cristo ressuscitou, você também ressuscitará. Viva hoje com a perspectiva da eternidade transformando suas prioridades.",
          summary: "A ressurreição corporal de Cristo é fato histórico bem atestado que prova Sua divindade, garante nossa justificação e fundamenta nossa esperança."
        },
        {
          title: "A Ascensão e Sessão",
          content: `Quarenta dias após a ressurreição, Jesus ascendeu ao céu. "Foi elevado às alturas, à vista deles, e uma nuvem o recebeu" (Atos 1:9). A ascensão não foi despedida; foi entronização. Cristo foi recebido em glória para reinar.

Cristo está "assentado à destra de Deus" - a posição de honra e autoridade suprema. "Depois de fazer a purificação dos pecados, assentou-se à destra da Majestade nas alturas" (Hebreus 1:3). Sua obra sacrificial está completa; agora reina.

Da destra, Cristo exerce ministério contínuo. Ele intercede por nós: "Vive sempre para interceder por eles" (Hebreus 7:25). Ele advoga quando pecamos: "Temos um Advogado para com o Pai" (1 João 2:1). Ele prepara lugar para nós (João 14:2).

A ascensão abriu caminho para Pentecostes. "Sendo... exaltado pela destra de Deus, e tendo recebido do Pai a promessa do Espírito Santo, derramou isto" (Atos 2:33). Cristo enviou o Espírito para habitar, capacitar e guiar a Igreja.`,
          references: "Atos 1:9-11; 2:33; Hebreus 1:3; 7:25; 8:1; Efésios 1:20-23; 1 João 2:1",
          questions: [
            "1. O que é a ascensão de Cristo?",
            "2. O que significa estar 'à destra de Deus'?",
            "3. O que Cristo faz agora no céu?",
            "4. Qual a conexão entre ascensão e Pentecostes?",
            "5. Como o ministério celestial de Cristo ajuda você?"
          ],
          application: "Cristo está intercedendo por você agora mesmo. Traga suas preocupações a Ele, confiante que Ele advoga por você.",
          summary: "Cristo ascendeu ao céu e está assentado à destra de Deus, reinando, intercedendo por nós e tendo enviado o Espírito Santo."
        },
        {
          title: "A Segunda Vinda",
          content: `A segunda vinda de Cristo é esperança central da fé cristã. "Esse Jesus... virá do modo como o vistes subir" (Atos 1:11). Ele voltará pessoalmente, visivelmente, gloriosamente para consumar todas as coisas.

A segunda vinda será pública e inconfundível. "Eis que vem com as nuvens, e todo olho o verá" (Apocalipse 1:7). Não será evento secreto. Como relâmpago que ilumina de leste a oeste, assim será Sua vinda (Mateus 24:27).

Na segunda vinda, Cristo julgará vivos e mortos (Atos 10:42). Os mortos ressuscitarão. Os crentes serão vindicados e glorificados. Os incrédulos enfrentarão julgamento. A justiça finalmente prevalecerá em toda a terra.

Quanto ao tempo, "Daquele dia e hora ninguém sabe" (Mateus 24:36). Devemos estar sempre prontos. A esperança da vinda deve produzir santidade: "Todo aquele que nele tem esta esperança purifica-se a si mesmo" (1 João 3:3). Aguardamos ativamente, não passivamente.`,
          references: "Atos 1:11; Mateus 24:29-31; 1 Tessalonicenses 4:13-18; Apocalipse 1:7; 19:11-16",
          questions: [
            "1. O que as Escrituras ensinam sobre a segunda vinda?",
            "2. Como será a segunda vinda?",
            "3. O que acontecerá quando Cristo voltar?",
            "4. Podemos saber quando Cristo voltará?",
            "5. Como a esperança da vinda afeta sua vida?"
          ],
          application: "Viva cada dia como se Cristo pudesse voltar hoje. Há algo que você precisaria mudar se Ele voltasse agora?",
          summary: "Cristo voltará pessoalmente, visivelmente e em glória para julgar, ressuscitar os mortos e consumar Seu reino eterno."
        },
        {
          title: "Os Nomes e Títulos de Cristo",
          content: `Os nomes e títulos de Jesus revelam Sua pessoa e obra. Cada nome comunica verdade teológica profunda. Conhecer Seus nomes é conhecê-Lo melhor.

"Jesus" (Yeshua) significa "Yahweh salva." "Lhe porás o nome de Jesus, porque ele salvará o seu povo dos seus pecados" (Mateus 1:21). É Seu nome humano dado pelo anjo, revelando Sua missão salvadora.

"Cristo" (Christos, do hebraico Messias) significa "Ungido." Reis, sacerdotes e profetas eram ungidos. Jesus é o Ungido supremo, cumprindo os três ofícios. Confessar "Jesus é o Cristo" é reconhecer Seu papel redentor único.

"Senhor" (Kyrios) é título divino. Era usado para traduzir Yahweh na Septuaginta. Chamar Jesus de Senhor é reconhecê-Lo como Deus e submeter-se à Sua autoridade. "Ninguém pode dizer: Jesus é o Senhor, senão pelo Espírito Santo" (1 Coríntios 12:3).`,
          references: "Mateus 1:21; 16:16; Filipenses 2:9-11; João 20:28; Apocalipse 19:16; Isaías 9:6",
          questions: [
            "1. O que significa o nome 'Jesus'?",
            "2. O que significa 'Cristo'?",
            "3. Por que chamar Jesus de 'Senhor' é significativo?",
            "4. Que outros títulos de Jesus você conhece?",
            "5. Qual título mais ressoa com você e por quê?"
          ],
          application: "Medite em um dos títulos de Cristo hoje. Deixe seu significado moldar como você se relaciona com Ele.",
          summary: "Os nomes de Jesus - Jesus (Salvador), Cristo (Ungido), Senhor (Deus soberano) - revelam Sua pessoa e obra redentora."
        },
        {
          title: "Heresias Cristológicas",
          content: `A igreja primitiva enfrentou heresias sobre Cristo e definiu ortodoxia em resposta. Conhecer esses erros ajuda a valorizar a verdade e evitar desvios.

O Docetismo negava a humanidade real de Cristo, ensinando que Ele apenas "parecia" (dokeo) humano. 1 João 4:2-3 responde: "Todo espírito que confessa que Jesus Cristo veio em carne é de Deus." A encarnação foi real.

O Arianismo negava a divindade plena de Cristo, ensinando que Ele foi criado. Nicéia (325 d.C.) afirmou que Cristo é "da mesma substância" (homoousios) do Pai, eternamente gerado, não criado. Cristo é Deus verdadeiro de Deus verdadeiro.

O Nestorianismo separava demais as duas naturezas, quase fazendo de Cristo duas pessoas. O Eutiquianismo misturava as naturezas em uma terceira coisa. Calcedônia (451 d.C.) definiu: duas naturezas distintas em uma pessoa, "sem confusão, sem mudança, sem divisão, sem separação."`,
          references: "João 1:1, 14; Colossenses 2:9; 1 João 4:2-3; Hebreus 2:14-17; Filipenses 2:5-11",
          questions: [
            "1. O que era o Docetismo?",
            "2. O que era o Arianismo?",
            "3. O que Nicéia afirmou?",
            "4. O que Calcedônia definiu?",
            "5. Por que é importante conhecer essas heresias?"
          ],
          application: "Agradeça aos cristãos que lutaram para preservar a verdade sobre Cristo. Comprometa-se a manter a fé ortodoxa.",
          summary: "As heresias cristológicas negaram a humanidade (Docetismo) ou divindade (Arianismo) de Cristo, ou confundiram Suas naturezas. Nicéia e Calcedônia definiram a ortodoxia."
        }
      ])
    }
  ]
};

// MÓDULO 5: Pneumatologia Aprofundada
const MODULO_5_PNEUMATOLOGIA: ModuleData = {
  id: "nivel2-mod5-pneumatologia",
  name: "Pneumatologia Aprofundada",
  description: "Estudo aprofundado da pessoa e obra do Espírito Santo",
  icon: "Wind",
  color: "#3B82F6",
  order: 20,
  tracks: [
    {
      id: "track-n2m5-moderado",
      level: "moderado",
      name: "A Doutrina do Espírito Santo",
      description: "Explorando a pessoa e obra do Espírito de Deus",
      requiredPlan: "premium",
      order: 1,
      lessons: createLessons("n2m5", [
        {
          title: "A Personalidade do Espírito Santo",
          content: `O Espírito Santo não é força impessoal ou influência divina, mas pessoa com mente, vontade e emoções. Esta verdade fundamental é frequentemente negligenciada, tratando o Espírito como "algo" em vez de "Alguém."

O Espírito possui atributos pessoais. Ele tem mente: "O Espírito a todas as coisas perscruta" (1 Coríntios 2:10). Ele tem vontade: distribui dons "a cada um, individualmente, como quer" (1 Coríntios 12:11). Ele tem emoções: pode ser "entristecido" (Efésios 4:30).

O Espírito realiza ações pessoais. Ele ensina (João 14:26), testifica (João 15:26), guia (Romanos 8:14), intercede (Romanos 8:26), fala (Atos 13:2), proíbe (Atos 16:6-7). Forças impessoais não fazem essas coisas - pessoas sim.

Reconhecer a personalidade do Espírito transforma nosso relacionamento com Ele. Não buscamos uma experiência, mas comunhão com uma Pessoa. Não usamos o Espírito; nos submetemos a Ele. "A comunhão do Espírito Santo seja com todos vós" (2 Coríntios 13:14).`,
          references: "João 14:16-17, 26; 16:13-14; Romanos 8:26-27; Efésios 4:30; 1 Coríntios 12:11",
          questions: [
            "1. Por que é importante que o Espírito seja pessoa?",
            "2. Quais atributos pessoais o Espírito possui?",
            "3. Que ações pessoais o Espírito realiza?",
            "4. Como isso muda nossa relação com o Espírito?",
            "5. Você trata o Espírito como Pessoa ou força?"
          ],
          application: "Cultive comunhão consciente com o Espírito Santo. Fale com Ele, agradeça-Lhe, peça Sua direção como Pessoa presente.",
          summary: "O Espírito Santo é pessoa divina com mente, vontade e emoções, merecendo comunhão pessoal, não apenas experiência."
        },
        {
          title: "A Divindade do Espírito Santo",
          content: `O Espírito Santo é Deus, a terceira pessoa da Trindade, igual em essência ao Pai e ao Filho. Esta verdade é claramente ensinada nas Escrituras e fundamental para a fé cristã.

Atributos divinos são atribuídos ao Espírito. Ele é eterno (Hebreus 9:14), onipresente (Salmo 139:7-8), onisciente (1 Coríntios 2:10-11), onipotente (Lucas 1:35). Apenas Deus possui estes atributos em plenitude.

Obras divinas são realizadas pelo Espírito. Ele cria (Gênesis 1:2; Jó 33:4), regenera (João 3:5-6), inspira as Escrituras (2 Pedro 1:21), ressuscitará nossos corpos (Romanos 8:11). Obras que somente Deus pode fazer.

O Espírito é igualado a Deus explicitamente. Pedro disse a Ananias: "Por que mentiste ao Espírito Santo?... Não mentiste aos homens, mas a Deus" (Atos 5:3-4). Mentir ao Espírito é mentir a Deus porque o Espírito é Deus.`,
          references: "Atos 5:3-4; 1 Coríntios 2:10-11; 2 Coríntios 3:17-18; Hebreus 9:14; Gênesis 1:2",
          questions: [
            "1. Por que é importante que o Espírito seja Deus?",
            "2. Quais atributos divinos o Espírito possui?",
            "3. Quais obras divinas o Espírito realiza?",
            "4. Como Atos 5:3-4 demonstra a divindade do Espírito?",
            "5. Como a divindade do Espírito afeta sua adoração?"
          ],
          application: "Adore o Espírito Santo como Deus verdadeiro. Honre-O como você honra o Pai e o Filho.",
          summary: "O Espírito Santo é Deus - possui atributos divinos, realiza obras divinas e é explicitamente identificado como Deus nas Escrituras."
        },
        {
          title: "O Espírito na Criação e Antigo Testamento",
          content: `A obra do Espírito não começou em Pentecostes. Desde a criação, o Espírito de Deus estava ativo. Entender Sua obra no Antigo Testamento ilumina Sua obra hoje.

Na criação, "O Espírito de Deus se movia sobre a face das águas" (Gênesis 1:2). O verbo hebraico sugere chocando, pairando como ave sobre seus ovos. O Espírito dá vida e ordem ao caos. Jó afirma: "O Espírito de Deus me fez" (Jó 33:4).

No Antigo Testamento, o Espírito capacitava para tarefas específicas. Ele veio sobre juízes para livrar Israel (Juízes 3:10), sobre artesãos para construir o Tabernáculo (Êxodo 31:3), sobre profetas para declarar a Palavra (2 Pedro 1:21). Era capacitação seletiva e frequentemente temporária.

A promessa da nova aliança era o Espírito para todos. Joel profetizou: "Derramarei o meu Espírito sobre toda a carne" (Joel 2:28). Ezequiel prometeu: "Porei dentro de vós o meu Espírito" (Ezequiel 36:27). Pentecostes cumpriu estas promessas gloriosamente.`,
          references: "Gênesis 1:2; Jó 33:4; Juízes 3:10; Ezequiel 36:26-27; Joel 2:28-32; Números 11:29",
          questions: [
            "1. Qual o papel do Espírito na criação?",
            "2. Como o Espírito agia no Antigo Testamento?",
            "3. Qual era a diferença da obra do Espírito antes de Pentecostes?",
            "4. O que Joel e Ezequiel profetizaram?",
            "5. Como Pentecostes cumpriu essas promessas?"
          ],
          application: "Agradeça que o Espírito foi derramado sobre todos os crentes. Você tem o que reis e profetas ansiavam!",
          summary: "O Espírito atuou na criação e capacitou líderes no AT, mas Pentecostes cumpriu a promessa do Espírito para todos os crentes."
        },
        {
          title: "O Espírito na Vida de Jesus",
          content: `O Espírito Santo estava intimamente envolvido em toda a vida e ministério de Jesus. Entender esta relação ilumina nossa própria vida no Espírito.

Jesus foi concebido pelo Espírito. O anjo disse a Maria: "Descerá sobre ti o Espírito Santo, e a virtude do Altíssimo te cobrirá com a sua sombra" (Lucas 1:35). A humanidade de Cristo foi formada pelo Espírito.

Jesus foi ungido pelo Espírito em Seu batismo. "O Espírito Santo desceu sobre ele em forma corpórea, como pomba" (Lucas 3:22). Esta unção O capacitou para o ministério público. Jesus começou declarando: "O Espírito do Senhor está sobre mim" (Lucas 4:18).

Jesus ministrou pelo poder do Espírito. Expulsou demônios "pelo Espírito de Deus" (Mateus 12:28). Ofereceu-se na cruz "pelo Espírito eterno" (Hebreus 9:14). Foi ressuscitado pelo Espírito (Romanos 8:11). O Espírito capacitou cada aspecto de Sua obra.`,
          references: "Lucas 1:35; 3:21-22; 4:1, 14, 18; Mateus 12:28; Hebreus 9:14; Atos 10:38",
          questions: [
            "1. Qual o papel do Espírito na concepção de Jesus?",
            "2. O que aconteceu no batismo de Jesus?",
            "3. Como o Espírito capacitou o ministério de Jesus?",
            "4. Se Jesus precisou do Espírito, o que isso nos ensina?",
            "5. Como você pode depender mais do Espírito?"
          ],
          application: "Jesus, mesmo sendo Deus, ministrou pelo poder do Espírito. Quanto mais nós! Busque essa mesma dependência.",
          summary: "O Espírito Santo esteve envolvido em toda a vida de Jesus - concepção, unção, ministério, morte e ressurreição - modelo para nossa dependência."
        },
        {
          title: "Pentecostes e a Era do Espírito",
          content: `Pentecostes marca o início de nova era na história da redenção. O Espírito prometido foi derramado sobre a Igreja, inaugurando a era do Espírito que continua até hoje.

Jesus prometeu: "Recebereis poder, ao descer sobre vós o Espírito Santo, e sereis minhas testemunhas" (Atos 1:8). Cinquenta dias após a Páscoa (Pentecostes significa "quinquagésimo"), o Espírito veio com vento, fogo e línguas.

Pedro explicou: "Isto é o que foi dito pelo profeta Joel" (Atos 2:16). As profecias do Antigo Testamento sobre derramamento do Espírito estavam se cumprindo. A nova aliança prometida em Jeremias e Ezequiel estava em vigor.

Pentecostes foi evento único e irrepetível - a inauguração da era do Espírito. Mas seus efeitos continuam. Todo crente agora recebe o Espírito na conversão. "Se alguém não tem o Espírito de Cristo, esse tal não é dele" (Romanos 8:9). O Espírito habita em cada filho de Deus.`,
          references: "Atos 2:1-41; Joel 2:28-32; Ezequiel 36:26-27; Romanos 8:9; 1 Coríntios 12:13",
          questions: [
            "1. O que é Pentecostes?",
            "2. Que promessas foram cumpridas em Pentecostes?",
            "3. Por que Pentecostes foi evento único?",
            "4. Como Pentecostes afeta os crentes hoje?",
            "5. Você tem consciência de que o Espírito habita em você?"
          ],
          application: "Você vive na era do Espírito! O Espírito que desceu em Pentecostes habita em você agora. Viva consciente dessa realidade.",
          summary: "Pentecostes inaugurou a era do Espírito, cumprindo promessas do AT. Todo crente agora recebe o Espírito permanentemente."
        },
        {
          title: "O Batismo e o Selo do Espírito",
          content: `Quando alguém crê em Cristo, o Espírito Santo realiza várias obras instantâneas e definitivas. Batismo e selo são duas delas, essenciais para entender nossa posição em Cristo.

O batismo no Espírito coloca o crente no corpo de Cristo. "Todos nós fomos batizados em um Espírito, formando um corpo" (1 Coríntios 12:13). Não é segunda experiência após a conversão; é a própria obra de incorporação na Igreja. Todo crente foi batizado no Espírito.

O selo do Espírito marca o crente como propriedade de Deus. "Fostes selados com o Espírito Santo da promessa, o qual é o penhor da nossa herança" (Efésios 1:13-14). Selos indicavam propriedade e proteção. O Espírito é marca de que pertencemos a Deus.

Como penhor (arras), o Espírito é garantia da herança completa. Ele é o "adiantamento" das bênçãos futuras. A presença do Espírito agora garante que a plenitude virá. Temos as primícias da glória eterna.`,
          references: "1 Coríntios 12:13; Efésios 1:13-14; 4:30; 2 Coríntios 1:21-22; 5:5; Romanos 8:23",
          questions: [
            "1. O que é o batismo no Espírito Santo?",
            "2. Quando ocorre o batismo no Espírito?",
            "3. O que significa ser selado com o Espírito?",
            "4. O que significa o Espírito ser 'penhor'?",
            "5. Como essas verdades dão segurança?"
          ],
          application: "Você foi batizado e selado pelo Espírito. Descanse na segurança de que pertence a Deus para sempre.",
          summary: "O batismo do Espírito incorpora ao corpo de Cristo, e o selo marca como propriedade de Deus, garantindo nossa herança eterna."
        },
        {
          title: "A Plenitude do Espírito",
          content: `Além das obras iniciais, somos chamados a ser continuamente cheios do Espírito. "Enchei-vos do Espírito" (Efésios 5:18) é mandamento para todos os crentes, indicando experiência a ser buscada e vivida.

Plenitude não é ter mais do Espírito (Ele não pode ser dividido), mas o Espírito ter mais de nós. É rendição completa ao Seu controle. Assim como embriaguez significa ser controlado pelo álcool, plenitude significa ser controlado pelo Espírito.

A plenitude é evidenciada por fruto e dons em operação, mas primariamente por vida cristocêntrica. O Espírito glorifica a Cristo (João 16:14). Vida cheia do Espírito é vida que exalta Jesus em palavra, atitude e ação.

A plenitude é repetível e necessita renovação. Os apóstolos, cheios em Pentecostes, foram "cheios de novo" em Atos 4:31. Não é experiência única, mas estilo de vida de contínua rendição. Diariamente precisamos ser enchidos novamente.`,
          references: "Efésios 5:18-21; Atos 4:31; 6:3; 7:55; Gálatas 5:16-25; Colossenses 3:16-17",
          questions: [
            "1. O que significa ser cheio do Espírito?",
            "2. Qual a diferença entre batismo e plenitude?",
            "3. Como a plenitude é evidenciada?",
            "4. Por que precisamos de enchimentos repetidos?",
            "5. Como você busca a plenitude do Espírito?"
          ],
          application: "Ore hoje pedindo para ser cheio do Espírito. Renda cada área de sua vida ao Seu controle.",
          summary: "A plenitude do Espírito é o Espírito controlando completamente nossa vida, resultando em vida cristocêntrica e frutífera, necessitando contínua renovação."
        },
        {
          title: "O Fruto do Espírito",
          content: `O fruto do Espírito é o caráter de Cristo formado em nós pela obra transformadora do Espírito. "O fruto do Espírito é: amor, alegria, paz, longanimidade, benignidade, bondade, fidelidade, mansidão, domínio próprio" (Gálatas 5:22-23).

Observe que é "fruto" (singular), não "frutos." É unidade orgânica de virtudes que crescem juntas. Não escolhemos algumas e negligenciamos outras. O Espírito produz todo o caráter de Cristo em medida crescente.

O fruto contrasta com as "obras da carne" (Gálatas 5:19-21). Obras da carne são produzidas por esforço humano corrupto. Fruto do Espírito é produzido sobrenaturalmente pelo Espírito. Nós cooperamos, mas Ele é o agricultor.

O fruto cresce gradualmente. Assim como fruto natural requer tempo, o fruto espiritual amadurece progressivamente. Santificação é processo que dura a vida toda. O Espírito trabalha pacientemente, conformando-nos à imagem de Cristo (2 Coríntios 3:18).`,
          references: "Gálatas 5:16-26; João 15:1-8; 2 Coríntios 3:18; Romanos 8:29; Colossenses 3:12-14",
          questions: [
            "1. O que é o fruto do Espírito?",
            "2. Por que é 'fruto' (singular)?",
            "3. Como fruto difere de obras?",
            "4. Como o fruto cresce em nós?",
            "5. Em qual aspecto do fruto você mais precisa crescer?"
          ],
          application: "Examine cada aspecto do fruto em Gálatas 5:22-23. Onde você mais precisa de crescimento? Peça ao Espírito que produza isso em você.",
          summary: "O fruto do Espírito é o caráter uno de Cristo (nove virtudes interconectadas) produzido sobrenaturalmente em nós pelo Espírito ao longo do tempo."
        },
        {
          title: "Os Dons do Espírito",
          content: `Além de fruto para caráter, o Espírito concede dons para serviço. "A cada um, porém, é dada a manifestação do Espírito, visando a um fim proveitoso" (1 Coríntios 12:7). Todo crente recebe dons para edificar a Igreja.

As principais listas de dons estão em Romanos 12, 1 Coríntios 12 e Efésios 4. Incluem profecia, ensino, exortação, serviço, liderança, misericórdia, fé, curas, milagres, línguas, interpretação, pastoreio, evangelismo. As listas não são exaustivas.

Os dons são distribuídos pelo Espírito "a cada um, individualmente, como quer" (1 Coríntios 12:11). Não escolhemos nossos dons; o Espírito distribui soberanamente. Nosso papel é descobrir, desenvolver e usar os dons recebidos.

Dons são para edificação mútua, não exibição pessoal. "Servi uns aos outros, cada um conforme o dom que recebeu" (1 Pedro 4:10). Nenhum dom torna alguém superior. Todos são necessários no corpo. Sem sua contribuição, o corpo sofre.`,
          references: "1 Coríntios 12:1-31; Romanos 12:3-8; Efésios 4:7-16; 1 Pedro 4:10-11",
          questions: [
            "1. O que são dons espirituais?",
            "2. Quem distribui os dons?",
            "3. Qual o propósito dos dons?",
            "4. Quais dons você reconhece ter recebido?",
            "5. Como você está usando seus dons?"
          ],
          application: "Identifique seus dons e busque oportunidades de usá-los para servir outros na igreja local.",
          summary: "O Espírito distribui dons a cada crente para edificação mútua da Igreja, cada um contribuindo com sua parte insubstituível."
        },
        {
          title: "Não Entristecer nem Apagar o Espírito",
          content: `Embora o Espírito nunca abandone o crente, podemos afetar negativamente nossa comunhão com Ele. As Escrituras advertem: "Não entristeçais o Espírito Santo" (Efésios 4:30) e "Não apagueis o Espírito" (1 Tessalonicenses 5:19).

Entristecer o Espírito está conectado a pecados relacionais em Efésios 4: mentira, ira pecaminosa, roubo, palavras corruptas, amargura, ira, clamor, maledicência, malícia. Quando pecamos assim, entristecemos a Pessoa que habita em nós.

Apagar o Espírito, no contexto de 1 Tessalonicenses 5, relaciona-se a "desprezar profecias" - resistir à obra e direção do Espírito. Quando ignoramos Sua voz, resistimos Sua liderança, sufocamos Seus impulsos, estamos apagando Sua influência em nossa vida.

A resposta é sensibilidade e obediência. Confessar pecado prontamente restaura comunhão. Ouvir e obedecer Sua voz mantém Sua influência fluindo. Andar no Espírito (Gálatas 5:16) é viver em contínua responsividade à Sua direção.`,
          references: "Efésios 4:29-32; 1 Tessalonicenses 5:19-22; Gálatas 5:16-17; Atos 7:51; Hebreus 10:29",
          questions: [
            "1. O que significa entristecer o Espírito?",
            "2. O que significa apagar o Espírito?",
            "3. Quais pecados entristecem o Espírito?",
            "4. Como mantemos comunhão com o Espírito?",
            "5. Há algo entristecendo o Espírito em sua vida agora?"
          ],
          application: "Examine sua vida à luz de Efésios 4:25-32. Confesse qualquer pecado e peça ao Espírito que restaure comunhão plena.",
          summary: "Podemos entristecer o Espírito pelo pecado e apagá-Lo resistindo Sua direção. Confissão e obediência restauram comunhão plena."
        }
      ])
    }
  ]
};

export const NIVEL_2_MODULOS_1_5: ModuleData[] = [
  MODULO_1_HERMENEUTICA,
  MODULO_2_TEOLOGIA_AT,
  MODULO_3_TEOLOGIA_NT,
  MODULO_4_CRISTOLOGIA,
  MODULO_5_PNEUMATOLOGIA,
];
