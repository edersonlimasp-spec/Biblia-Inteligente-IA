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

// MÓDULO 11: Hamartiologia (Doutrina do Pecado)
const MODULO_11_HAMARTIOLOGIA: ModuleData = {
  id: "nivel2-mod11-hamartiologia",
  name: "Hamartiologia",
  description: "Estudo sistemático da doutrina do pecado e suas consequências",
  icon: "AlertTriangle",
  color: "#7C3AED",
  order: 26,
  tracks: [
    {
      id: "track-n2m11-moderado",
      level: "moderado",
      name: "A Doutrina do Pecado",
      description: "Compreendendo a natureza, origem e consequências do pecado",
      requiredPlan: "premium",
      order: 1,
      lessons: createLessons("n2m11", [
        {
          title: "A Origem do Pecado",
          content: `O pecado não é eterno nem foi criado por Deus. Originou-se na queda de Satanás e entrou na humanidade através de Adão. "Por um homem entrou o pecado no mundo, e pelo pecado a morte" (Romanos 5:12). A desobediência de Adão trouxe consequências universais.

Deus criou o homem bom e reto. "Fez Deus o homem reto, mas ele buscou muitas invenções" (Eclesiastes 7:29). O pecado não fazia parte do design original; é intrusão, corrupção da boa criação de Deus. É parasita, não substância independente.

A queda foi real e histórica. Adão e Eva existiram; o Éden existiu; a serpente tentou; eles pecaram. Negar a historicidade da queda compromete toda a teologia bíblica. Paulo trata Adão como figura histórica paralela a Cristo (Romanos 5:12-21).

A permissão divina do pecado é mistério. Deus não é autor do pecado, mas o permitiu em Seu plano soberano. O mal serve aos propósitos de Deus sem que Deus seja responsável pelo mal. A cruz demonstra isso: o maior mal (deicídio) resultou no maior bem (redenção).`,
          references: "Gênesis 3:1-24; Romanos 5:12-21; Eclesiastes 7:29; Isaías 14:12-15; Ezequiel 28:12-19",
          questions: [
            "1. Onde o pecado se originou?",
            "2. Por que é importante que a queda seja histórica?",
            "3. Como Adão e Cristo são paralelos?",
            "4. Deus é autor do pecado?",
            "5. Como o mal pode servir aos propósitos de Deus?"
          ],
          application: "Reconheça que o pecado não é natural, mas invasor. Não o normalize. Lute contra ele como a corrupção que é.",
          summary: "O pecado originou-se na queda de Satanás e entrou na humanidade através de Adão, corrompendo a boa criação de Deus sem que Ele seja autor do mal."
        },
        {
          title: "A Natureza do Pecado",
          content: `Pecado é transgressão da lei de Deus. "O pecado é iniquidade" (1 João 3:4). Não é mera imperfeição ou erro; é rebelião contra o Legislador. Todo pecado é primariamente contra Deus. "Contra ti, contra ti somente pequei" (Salmo 51:4).

O pecado inclui atos, pensamentos e omissões. Não apenas o que fazemos de errado, mas o que deixamos de fazer de certo. "Aquele que sabe que deve fazer o bem e não o faz, nisso está pecando" (Tiago 4:17). O pecado de omissão é tão sério quanto o de comissão.

O pecado é mais que atos isolados; é condição do coração. "Do coração procedem os maus pensamentos" (Mateus 15:19). Antes de pecarmos por ação, somos pecadores por natureza. A árvore má produz frutos maus porque é má.

O pecado é universal. "Todos pecaram e destituídos estão da glória de Deus" (Romanos 3:23). Não há exceções exceto Cristo. "Não há justo, nem um sequer" (Romanos 3:10). Esta universalidade aponta para a raiz em Adão, não apenas escolhas individuais.`,
          references: "1 João 3:4; Romanos 3:10-23; Salmo 51:4-5; Tiago 4:17; Mateus 15:18-20",
          questions: [
            "1. O que é pecado segundo 1 João 3:4?",
            "2. Por que todo pecado é contra Deus?",
            "3. O que é pecado de omissão?",
            "4. Por que o coração é a raiz do pecado?",
            "5. Como Romanos 3 descreve a universalidade do pecado?"
          ],
          application: "Examine não apenas suas ações, mas seu coração. Confesse não só o que fez, mas o que é. Peça transformação interior.",
          summary: "Pecado é transgressão da lei de Deus em atos, pensamentos e omissões, fluindo de um coração corrompido e afetando toda a humanidade."
        },
        {
          title: "Pecado Original",
          content: `Pecado original é a doutrina de que a culpa e corrupção do pecado de Adão são transmitidas a todos os seus descendentes. Nascemos pecadores, não nos tornamos. "Em pecado me concebeu minha mãe" (Salmo 51:5).

A culpa de Adão é imputada a toda a raça. "Pela ofensa de um só, morreram muitos" (Romanos 5:15). Adão agia como nosso representante federal; seu pecado é legalmente nosso. Por isso todos morrem, mesmo bebês que não cometeram pecados pessoais.

A corrupção adâmica é herdada por todos. Nascemos com natureza inclinada ao mal. "O pendor da carne é inimizade contra Deus" (Romanos 8:7). Não somos pecadores porque pecamos; pecamos porque somos pecadores. A natureza precede os atos.

Isso não elimina responsabilidade pessoal. Somos culpados tanto pelo pecado de Adão quanto pelos nossos próprios. "Cada um de nós dará conta de si mesmo a Deus" (Romanos 14:12). A depravação não é desculpa, mas agrava nossa necessidade de graça.`,
          references: "Romanos 5:12-21; Salmo 51:5; 58:3; Efésios 2:3; Romanos 8:7-8",
          questions: [
            "1. O que é pecado original?",
            "2. Como a culpa de Adão se relaciona conosco?",
            "3. O que significa 'representante federal'?",
            "4. Como herdamos a corrupção adâmica?",
            "5. A depravação elimina responsabilidade?"
          ],
          application: "Entenda que sua luta com pecado não é apenas comportamental; é natureza. Você precisa de novo nascimento, não apenas reforma.",
          summary: "Pecado original significa que a culpa e corrupção de Adão são transmitidas a todos os descendentes, tornando-nos pecadores por natureza desde a concepção."
        },
        {
          title: "Depravação Total",
          content: `Depravação total não significa que somos tão maus quanto poderíamos ser, mas que o pecado afeta cada parte de nosso ser. Mente, vontade, emoções, corpo - tudo está corrompido. Nenhuma área escapou.

A mente está obscurecida. "O deus deste século cegou os entendimentos dos incrédulos" (2 Coríntios 4:4). Não compreendemos verdades espirituais naturalmente. "O homem natural não compreende as coisas do Espírito de Deus" (1 Coríntios 2:14).

A vontade está escravizada. "Todo aquele que comete pecado é escravo do pecado" (João 8:34). Não temos liberdade para escolher Deus. "Ninguém pode vir a mim, se o Pai não o trouxer" (João 6:44). A vontade está livre de coerção externa, mas escravizada ao pecado interno.

A incapacidade é moral, não física. Não conseguimos vir a Cristo não porque falta capacidade física, mas porque não queremos. "Vós não quereis vir a mim para terdes vida" (João 5:40). O problema é o coração, não a capacidade.`,
          references: "Romanos 3:10-18; 8:7-8; Efésios 2:1-3; 4:17-19; 1 Coríntios 2:14; João 6:44",
          questions: [
            "1. O que significa 'depravação total'?",
            "2. Como o pecado afeta a mente?",
            "3. Como o pecado afeta a vontade?",
            "4. Qual a diferença entre incapacidade moral e física?",
            "5. Por que isso torna a graça absolutamente necessária?"
          ],
          application: "Abandone toda autoconfiança espiritual. Se você crê, é porque Deus operou. Agradeça; não se vanglorie.",
          summary: "Depravação total significa que o pecado corrompeu cada parte do ser humano - mente, vontade, emoções - tornando-nos incapazes de buscar Deus sem Sua graça."
        },
        {
          title: "Consequências do Pecado: Separação de Deus",
          content: `A consequência primária do pecado é separação de Deus. "As vossas iniquidades fazem separação entre vós e o vosso Deus" (Isaías 59:2). Antes da queda, Adão tinha comunhão com Deus; após, escondeu-se. O pecado cria barreira.

Esta separação é espiritual, relacional e eterna. Espiritualmente, estamos "mortos em delitos" (Efésios 2:1). Relacionalmente, somos "inimigos" de Deus (Romanos 5:10). Eternamente, sem Cristo, enfrentamos "eterna destruição, banidos da face do Senhor" (2 Tessalonicenses 1:9).

A separação produz alienação existencial. Sem Deus, a vida perde sentido. "Separados da vida de Deus" (Efésios 4:18). O vazio que todos sentem é ausência de comunhão com o Criador. Nada criado pode preencher o que só o Criador satisfaz.

Somente Cristo remove a separação. "Ele é a nossa paz, o qual de ambos os povos fez um; e, derribando a parede de separação" (Efésios 2:14). O véu rasgado no templo simboliza: em Cristo, o acesso a Deus foi restaurado.`,
          references: "Isaías 59:2; Efésios 2:1-3, 12-14; 4:18; Romanos 5:10; 2 Tessalonicenses 1:9",
          questions: [
            "1. Qual a consequência primária do pecado?",
            "2. Como a separação se manifesta em três dimensões?",
            "3. Por que a separação causa vazio existencial?",
            "4. Como Cristo remove a separação?",
            "5. O que o véu rasgado simboliza?"
          ],
          application: "Se você está em Cristo, regozije-se no acesso ao Pai. Use-o! Aproxime-se diariamente. Não viva como se ainda houvesse separação.",
          summary: "O pecado causa separação de Deus em dimensões espiritual, relacional e eterna, produzindo alienação que só Cristo pode reverter."
        },
        {
          title: "Consequências do Pecado: Morte",
          content: `"O salário do pecado é a morte" (Romanos 6:23). Deus advertiu Adão: "No dia em que dela comeres, certamente morrerás" (Gênesis 2:17). A morte entrou pela desobediência. É consequência judicial, não natural, do pecado.

A morte é tripla: espiritual, física e eterna. A morte espiritual é separação da vida de Deus - ocorreu imediatamente quando Adão pecou. A morte física é separação da alma do corpo - ocorre eventualmente para todos. A morte eterna é separação definitiva de Deus no inferno.

A morte física atesta a realidade do pecado. Todo funeral é sermão silencioso: "O pecado é real e mortal." A universalidade da morte confirma a universalidade do pecado. "Em Adão todos morrem" (1 Coríntios 15:22).

Cristo conquistou a morte em todas as dimensões. Espiritualmente, vivifica os mortos (Efésios 2:5). Fisicamente, ressuscitará os corpos (1 Coríntios 15:52). Eternamente, livra do inferno (João 5:24). "Tragada foi a morte pela vitória" (1 Coríntios 15:54).`,
          references: "Romanos 6:23; Gênesis 2:17; 1 Coríntios 15:21-22, 54-57; Efésios 2:1-5; Apocalipse 20:14",
          questions: [
            "1. O que é 'o salário do pecado'?",
            "2. Quais são as três dimensões da morte?",
            "3. Por que a morte física é universal?",
            "4. Como Cristo venceu cada tipo de morte?",
            "5. O que significa 'a morte foi tragada'?"
          ],
          application: "Não tema a morte se está em Cristo. Ela perdeu o aguilhão. Viva hoje à luz da eternidade.",
          summary: "O pecado resulta em morte tríplice - espiritual, física e eterna - mas Cristo conquistou cada dimensão pela cruz e ressurreição."
        },
        {
          title: "Pecado e Culpa",
          content: `Culpa é a condição legal de quem transgrediu a lei. Não é apenas sentimento, mas realidade objetiva diante de Deus. Podemos sentir culpa sem ser culpados, ou ser culpados sem sentir. O que importa é o veredito divino.

Toda a humanidade é culpada. "Todo o mundo seja condenável diante de Deus" (Romanos 3:19). O tribunal de Deus encontra todos réus. "Não há justo, nem um sequer" (Romanos 3:10). A lei silencia toda autodefesa.

A consciência testifica a culpa, mesmo imperfeita. "Os gentios... mostram a obra da lei escrita em seus corações, testificando juntamente a sua consciência" (Romanos 2:15). A culpa sentida aponta para culpa real, embora o sentimento possa ser suprimido ou distorcido.

Cristo remove a culpa pela justificação. "Justificados, pois, mediante a fé, temos paz com Deus" (Romanos 5:1). A culpa foi imputada a Cristo; Sua justiça é imputada a nós. O veredito muda de "culpado" para "justo". Não há mais condenação (Romanos 8:1).`,
          references: "Romanos 3:19-20; 5:1; 8:1; 2:14-15; Hebreus 10:22; 1 João 1:9",
          questions: [
            "1. O que é culpa objetiva?",
            "2. Por que toda humanidade é culpada?",
            "3. Como a consciência testifica a culpa?",
            "4. Como Cristo remove a culpa?",
            "5. O que significa 'não há condenação'?"
          ],
          application: "Se carrega culpa desnecessária após confissão, lembre-se: Cristo já pagou. Creia no veredito de Deus, não nos seus sentimentos.",
          summary: "Culpa é a condição legal de transgressão que afeta toda humanidade, mas Cristo remove pela justificação, mudando o veredito para 'justo'."
        },
        {
          title: "Pecado e Vergonha",
          content: `Vergonha é a experiência subjetiva de indignidade e exposição. Adão e Eva sentiram após pecar: "Conheceram que estavam nus; e coseram folhas de figueira, e fizeram para si cintas" (Gênesis 3:7). Tentaram cobrir o que foi exposto.

A vergonha difere da culpa. Culpa diz: "Fiz algo errado." Vergonha diz: "Sou algo errado." Culpa foca atos; vergonha foca identidade. Ambas resultam do pecado, mas requerem tratamentos distintos. Cristo trata ambas.

A vergonha distorce a identidade. Produz ocultamento, performance para compensar, ou desespero. Adão escondeu-se; Caim fugiu; muitos hoje vestem máscaras. A vergonha isola porque teme exposição.

Cristo venceu a vergonha. "Aquele que crê nele não será confundido" (1 Pedro 2:6). Na cruz, Jesus suportou vergonha pública para nos libertar. "O qual, pelo gozo que lhe estava proposto, suportou a cruz, desprezando a vergonha" (Hebreus 12:2). Em Cristo, vergonha é substituída por honra.`,
          references: "Gênesis 3:7-10; Hebreus 12:2; 1 Pedro 2:6; Romanos 10:11; Isaías 61:7",
          questions: [
            "1. O que é vergonha?",
            "2. Como vergonha difere de culpa?",
            "3. Como vergonha distorce a identidade?",
            "4. Como Cristo venceu a vergonha?",
            "5. Como podemos viver livres da vergonha?"
          ],
          application: "Pare de se esconder. Em Cristo, você pode ser conhecido e ainda amado. Vulnerabilidade em comunidade cura vergonha.",
          summary: "Vergonha é a experiência de indignidade que distorce identidade, mas Cristo a venceu na cruz, oferecendo honra em lugar de vergonha."
        },
        {
          title: "Graus de Pecado",
          content: `Todo pecado merece condenação, mas nem todo pecado é igual. Jesus falou de "maior pecado" (João 19:11). Há pecados mais graves que outros, com consequências proporcionais.

A lei de Moisés distinguia pecados "de mão levantada" (rebelião deliberada) de pecados de fraqueza ou ignorância (Números 15:30-31). Pecados presunçosos eram punidos mais severamente. A intenção afeta a gravidade.

Jesus ensinou graus de castigo. "Será castigado com muitos açoites" versus "poucos açoites" (Lucas 12:47-48). Os que têm mais conhecimento têm mais responsabilidade. Corazim e Betsaida terão juízo mais severo que Tiro e Sidom (Mateus 11:21-22).

No entanto, qualquer pecado nos condena. "Qualquer que guardar toda a lei, e tropeçar em um só ponto, tornou-se culpado de todos" (Tiago 2:10). Não há pecado pequeno o suficiente para ignorar. Todo pecado precisa do sangue de Cristo.`,
          references: "João 19:11; Lucas 12:47-48; Mateus 11:20-24; Números 15:30-31; Tiago 2:10; 1 João 5:16-17",
          questions: [
            "1. Todos os pecados são iguais em gravidade?",
            "2. Que fatores afetam a gravidade do pecado?",
            "3. O que Jesus ensinou sobre graus de castigo?",
            "4. O que Tiago 2:10 ensina?",
            "5. Como isso equilibra seriedade com esperança?"
          ],
          application: "Não minimize nenhum pecado, mas também não desespere. Mesmo o 'maior pecado' encontra perdão no sangue de Cristo.",
          summary: "Há graus de gravidade no pecado afetados por conhecimento e intenção, mas todo pecado condena e requer o sacrifício de Cristo."
        },
        {
          title: "Pecado Imperdoável",
          content: `Jesus falou de um pecado que "não será perdoado, nem neste mundo nem no vindouro" (Mateus 12:32): a blasfêmia contra o Espírito Santo. Esta é a rejeição final e deliberada do testemunho do Espírito sobre Cristo.

O contexto define o pecado. Os fariseus atribuíram a Satanás a obra do Espírito em Cristo (Mateus 12:24). Não era ignorância, mas rejeição deliberada de evidência clara. Chamaram bem de mal, luz de trevas, enquanto viam os milagres.

Este pecado é imperdoável não porque Deus não possa perdoar, mas porque quem o comete não pode arrepender-se. O Espírito convence de pecado (João 16:8); rejeitar persistentemente o Espírito endurece o coração além do arrependimento. É estado final, não ato isolado.

Se você teme tê-lo cometido, provavelmente não cometeu. A preocupação indica sensibilidade ao Espírito - o oposto do pecado descrito. Quem blasfema contra o Espírito não se importa; você se importa. Corra para Cristo enquanto o Espírito atrai.`,
          references: "Mateus 12:22-32; Marcos 3:28-30; Lucas 12:10; Hebreus 6:4-6; 10:26-29",
          questions: [
            "1. O que é o pecado imperdoável?",
            "2. Qual era o contexto quando Jesus o mencionou?",
            "3. Por que é imperdoável?",
            "4. Por que preocupação com isso é bom sinal?",
            "5. Como devemos responder ao Espírito hoje?"
          ],
          application: "Não endureça seu coração quando o Espírito convence. Cada resistência pode tornar a próxima mais fácil. Responda agora.",
          summary: "A blasfêmia contra o Espírito é a rejeição final e deliberada do testemunho do Espírito sobre Cristo, levando ao endurecimento irreversível."
        }
      ])
    }
  ]
};

// MÓDULO 12: Ética Cristã
const MODULO_12_ETICA: ModuleData = {
  id: "nivel2-mod12-etica",
  name: "Ética Cristã",
  description: "Princípios bíblicos para a vida moral e decisões éticas",
  icon: "Scale",
  color: "#0EA5E9",
  order: 27,
  tracks: [
    {
      id: "track-n2m12-moderado",
      level: "moderado",
      name: "Fundamentos da Ética Bíblica",
      description: "Construindo uma base sólida para decisões morais",
      requiredPlan: "premium",
      order: 1,
      lessons: createLessons("n2m12", [
        {
          title: "Fundamentos da Ética Cristã",
          content: `A ética cristã fundamenta-se no caráter de Deus, não em preferências humanas. "Sede santos, porque eu sou santo" (1 Pedro 1:16). O padrão moral é o próprio Deus; o certo e errado derivam de quem Ele é, não de consenso cultural.

A lei moral reflete o caráter imutável de Deus. "Eu, o SENHOR, não mudo" (Malaquias 3:6). Por isso a ética bíblica não é relativa às culturas ou épocas. O que era errado para Moisés continua errado hoje. Absolutos morais existem porque Deus existe.

Cristo é o modelo perfeito da ética vivida. "Deixando-vos exemplo, para que sigais as suas pisadas" (1 Pedro 2:21). Estudar a vida de Jesus revela como viver moralmente. Ele é a lei encarnada, o padrão em forma humana.

A ética cristã não é legalismo, mas resposta de amor. "Se me amais, guardareis os meus mandamentos" (João 14:15). Obedecemos não para ganhar aprovação, mas porque já somos aprovados em Cristo. A motivação é gratidão, não medo.`,
          references: "1 Pedro 1:15-16; 2:21; João 14:15; Malaquias 3:6; Romanos 12:1-2; Efésios 5:1-2",
          questions: [
            "1. Qual é o fundamento da ética cristã?",
            "2. Por que a ética bíblica não é relativa?",
            "3. Como Cristo é modelo ético?",
            "4. Qual a diferença entre legalismo e obediência amorosa?",
            "5. O que motiva a obediência cristã?"
          ],
          application: "Examine suas decisões: são baseadas em preferências ou no caráter de Deus? Estude os evangelhos para ver a ética de Cristo.",
          summary: "A ética cristã fundamenta-se no caráter imutável de Deus, revelado perfeitamente em Cristo, e é vivida por amor, não legalismo."
        },
        {
          title: "Lei Moral, Civil e Cerimonial",
          content: `A lei do Antigo Testamento divide-se em três categorias: moral, civil e cerimonial. Entender essas distinções é crucial para aplicar a Escritura hoje. Nem tudo que era obrigatório para Israel é obrigatório para a igreja.

A lei moral reflete o caráter eterno de Deus - os Dez Mandamentos são seu resumo. "Não penseis que vim revogar a Lei" (Mateus 5:17). Jesus não aboliu a lei moral; cumpriu-a e a aprofundou. O adultério agora inclui olhar com cobiça (Mateus 5:28).

A lei civil regulava Israel como nação teocrática. Punições específicas, regulamentos de terra, leis de guerra aplicavam-se àquela nação. Não temos teocracia hoje; os princípios subjacentes podem instruir, mas as aplicações específicas não obrigam.

A lei cerimonial apontava para Cristo - sacrifícios, festas, purificações. "Sombra dos bens futuros" (Hebreus 10:1). Cristo é a realidade; as sombras cessaram. Não oferecemos sacrifícios porque o sacrifício perfeito foi feito. A lei cerimonial foi cumprida, não violada.`,
          references: "Mateus 5:17-20; Hebreus 10:1-14; Gálatas 3:24-25; Colossenses 2:16-17; Romanos 13:8-10",
          questions: [
            "1. Quais são as três categorias da lei?",
            "2. Como Jesus cumpriu a lei moral?",
            "3. Por que a lei civil não obriga cristãos hoje?",
            "4. O que a lei cerimonial prefigurava?",
            "5. Como aplicamos a lei corretamente hoje?"
          ],
          application: "Quando ler o Antigo Testamento, pergunte: isto é moral, civil ou cerimonial? Como se aplica em Cristo?",
          summary: "A lei divide-se em moral (eternamente obrigatória), civil (aplicável a Israel como nação) e cerimonial (cumprida em Cristo)."
        },
        {
          title: "Consciência e Discernimento",
          content: `A consciência é dom de Deus que testifica sobre certo e errado. "Sua consciência também dá testemunho" (Romanos 2:15). É voz interior que aprova ou condena. Porém, a consciência não é infalível; pode ser deformada.

A consciência precisa ser educada pela Escritura. Uma consciência 'fraca' é excessivamente escrupulosa (1 Coríntios 8:7-12). Uma consciência 'cauterizada' perdeu sensibilidade (1 Timóteo 4:2). Ambas estão deformadas. A Palavra recalibra a consciência.

Não devemos violar nossa consciência, mesmo quando errada. "Tudo o que não provém de fé é pecado" (Romanos 14:23). Se pensamos que algo é errado (mesmo que não seja), fazê-lo é pecado porque fazemos contra a consciência. Primeiro eduque, depois aja.

O discernimento vai além da consciência. "Examinai tudo. Retende o bem" (1 Tessalonicenses 5:21). Requer sabedoria para navegar situações complexas. "Se algum de vós tem falta de sabedoria, peça-a a Deus" (Tiago 1:5). A oração e a comunidade ajudam no discernimento.`,
          references: "Romanos 2:14-15; 14:23; 1 Coríntios 8:7-12; 1 Timóteo 4:2; Tiago 1:5; 1 Tessalonicenses 5:21",
          questions: [
            "1. O que é consciência?",
            "2. Por que a consciência não é infalível?",
            "3. O que é consciência 'fraca' e 'cauterizada'?",
            "4. Por que não devemos violar a consciência?",
            "5. Como desenvolver discernimento?"
          ],
          application: "Avalie sua consciência: está alinhada com a Escritura? É sensível demais ou de menos? Ore por calibração bíblica.",
          summary: "A consciência testifica sobre certo e errado mas precisa ser educada pela Escritura; o discernimento requer sabedoria para decisões complexas."
        },
        {
          title: "Ética do Amor",
          content: `O amor é o resumo de toda lei moral. "Toda a lei se cumpre numa só palavra: Amarás o teu próximo como a ti mesmo" (Gálatas 5:14). Amor não é sentimento apenas, mas ação comprometida com o bem do outro.

Jesus deu o 'novo mandamento': "Que vos ameis uns aos outros; como eu vos amei" (João 13:34). A novidade está no padrão: não apenas amar como a si mesmo, mas como Cristo amou - sacrificialmente, até a morte. Amor cruciforme.

O amor não anula regras; cumpre-as. "O amor é o cumprimento da lei" (Romanos 13:10). Quem ama não rouba, não mata, não adultera - não porque a lei proíbe, mas porque o amor não faz mal ao próximo. As regras protegem o amor.

O amor requer conhecimento e discernimento. "O meu amor cresça mais e mais em pleno conhecimento e toda a percepção" (Filipenses 1:9). Amor sem sabedoria pode prejudicar. Amar bem exige entender o que realmente beneficia a pessoa, não apenas o que ela quer.`,
          references: "Gálatas 5:14; João 13:34-35; Romanos 13:8-10; 1 Coríntios 13:1-13; Filipenses 1:9-11",
          questions: [
            "1. Como o amor resume a lei?",
            "2. O que é o 'novo mandamento'?",
            "3. O amor anula regras?",
            "4. Por que amor requer conhecimento?",
            "5. Como amar bem requer sabedoria?"
          ],
          application: "Pergunte-se: minhas ações são genuinamente amorosas ou apenas aparentemente? O amor verdadeiro busca o bem real, não o fácil.",
          summary: "O amor resume e cumpre toda a lei moral, seguindo o padrão sacrificial de Cristo, guiado por conhecimento e discernimento."
        },
        {
          title: "Santidade no Dia a Dia",
          content: `Santidade significa separação para Deus e Seus propósitos. "Segui a paz com todos, e a santificação, sem a qual ninguém verá o Senhor" (Hebreus 12:14). Não é opção para super-cristãos; é chamado para todos os crentes.

Santidade é positiva, não apenas negativa. Não é só evitar pecado, mas buscar justiça. "Foge das paixões da mocidade; e segue a justiça, a fé, o amor" (2 Timóteo 2:22). A santidade preenche a vida com o bem, não apenas esvazia do mal.

Santidade permeia toda a vida, não apenas 'momentos espirituais'. "Quer comais, quer bebais, ou façais outra qualquer coisa, fazei tudo para glória de Deus" (1 Coríntios 10:31). Trabalho, lazer, relacionamentos - tudo é arena de santidade.

O Espírito Santo capacita a santidade. "Andai em Espírito, e não cumprireis a concupiscência da carne" (Gálatas 5:16). Não é esforço humano apenas; é cooperação com o Espírito. Ele produz o fruto; nós cultivamos o terreno.`,
          references: "Hebreus 12:14; 1 Pedro 1:15-16; 2 Timóteo 2:22; 1 Coríntios 10:31; Gálatas 5:16-25",
          questions: [
            "1. O que é santidade?",
            "2. Santidade é apenas evitar pecado?",
            "3. Que áreas da vida a santidade abrange?",
            "4. Como o Espírito capacita a santidade?",
            "5. O que significa cooperar com o Espírito?"
          ],
          application: "Identifique uma área 'secular' de sua vida (trabalho, hobby). Como você pode santificá-la para a glória de Deus?",
          summary: "Santidade é separação para Deus em todas as áreas da vida, buscando o bem positivamente, capacitada pelo Espírito Santo."
        },
        {
          title: "Trabalho e Vocação",
          content: `Todo trabalho honesto é sagrado quando feito para o Senhor. "Tudo quanto fizerdes, fazei-o de todo o coração, como ao Senhor" (Colossenses 3:23). Não há divisão sagrado-secular; há trabalhos feitos para Deus ou não.

A vocação (chamado) abrange mais que ministério eclesiástico. Deus chama pessoas para medicina, negócios, artes, educação. Lutero restaurou essa visão: o sapateiro cristão serve a Deus fazendo bons sapatos. A excelência no trabalho glorifica ao Criador.

O trabalho é dom, não maldição. Antes da queda, Adão trabalhava no jardim (Gênesis 2:15). A maldição afetou o trabalho com fadiga e frustração (Gênesis 3:17-19), mas não o tornou mau. Redenção restaura o trabalho ao seu propósito: cultivar a criação para Deus.

A ética cristã proíbe preguiça e desonestidade no trabalho. "O que furtava, não furte mais; antes trabalhe" (Efésios 4:28). Trabalho desonesto, mesmo para empregador injusto, contradiz o evangelho. Trabalhamos com integridade como testemunho.`,
          references: "Colossenses 3:22-24; Efésios 4:28; 6:5-9; Gênesis 2:15; 2 Tessalonicenses 3:10-12",
          questions: [
            "1. Todo trabalho honesto é sagrado?",
            "2. O que é vocação?",
            "3. O trabalho é maldição?",
            "4. Como trabalhar com integridade?",
            "5. Como seu trabalho glorifica a Deus?"
          ],
          application: "Reavalie seu trabalho como vocação. Como você pode fazê-lo 'como para o Senhor' esta semana?",
          summary: "Todo trabalho honesto é vocação sagrada quando feito com excelência e integridade como para o Senhor, glorificando-O na criação."
        },
        {
          title: "Dinheiro e Mordomia",
          content: `Tudo pertence a Deus; somos mordomos, não proprietários. "Do SENHOR é a terra e a sua plenitude" (Salmo 24:1). Dinheiro, posses, talentos - administramos o que é dEle. Prestaremos contas do uso.

O dinheiro não é mal em si, mas o amor ao dinheiro é raiz de males. "O amor ao dinheiro é a raiz de toda a espécie de males" (1 Timóteo 6:10). Riqueza pode ser bênção usada para o bem, ou ídolo que afasta de Deus. O coração determina.

Generosidade é marca do cristão. "Deus ama ao que dá com alegria" (2 Coríntios 9:7). Não damos para ganhar favor; damos porque recebemos graça abundante. O cristão sempre dá; a pergunta é quanto e para quem.

O contentamento liberta da tirania materialista. "Tendo, porém, sustento e com que nos cobrirmos, estejamos com isso contentes" (1 Timóteo 6:8). Contentamento não é passividade, mas paz interior independente de circunstâncias. É fruto do Espírito.`,
          references: "Salmo 24:1; 1 Timóteo 6:6-10, 17-19; 2 Coríntios 9:6-11; Lucas 16:10-13; Mateus 6:19-24",
          questions: [
            "1. Somos proprietários ou mordomos?",
            "2. O dinheiro é mal?",
            "3. Por que generosidade é marca cristã?",
            "4. O que é contentamento bíblico?",
            "5. Como você pode crescer em mordomia?"
          ],
          application: "Revise seus gastos da última semana. Eles refletem mordomia ou propriedade? Generosidade ou acumulação?",
          summary: "Somos mordomos, não proprietários; o amor ao dinheiro é perigoso, mas generosidade e contentamento caracterizam a vida cristã."
        },
        {
          title: "Sexualidade e Pureza",
          content: `Deus criou a sexualidade como boa. "Criou homem e mulher... Viu Deus tudo quanto tinha feito, e eis que era muito bom" (Gênesis 1:27, 31). O sexo não é tabu, mas dom a ser celebrado dentro dos limites divinos.

O casamento é o único contexto para expressão sexual. "Digno de honra entre todos seja o matrimônio, e o leito sem mácula" (Hebreus 13:4). Sexo pré-marital, extramarital e homossexual violam o design de Deus. Não são alternativas válidas; são distorções.

A pureza começa no coração e na mente. "Qualquer que olhar para uma mulher com intenção impura, no coração já adulterou" (Mateus 5:28). Guardar os olhos e pensamentos é essencial. "Guarda o teu coração, porque dele procedem as saídas da vida" (Provérbios 4:23).

A graça oferece perdão e poder para pureza. Pecados sexuais não são imperdoáveis. "Tais fostes alguns de vós; mas vós vos lavastes" (1 Coríntios 6:11). Cristo liberta do passado e capacita novo futuro. Há esperança para todos.`,
          references: "Gênesis 1:27-31; 2:24; Hebreus 13:4; Mateus 5:27-30; 1 Coríntios 6:9-11, 18-20",
          questions: [
            "1. A sexualidade é boa ou má?",
            "2. Qual é o contexto bíblico para sexo?",
            "3. Por que pureza começa no coração?",
            "4. Pecados sexuais são imperdoáveis?",
            "5. Como a graça capacita pureza?"
          ],
          application: "Seja honesto sobre suas lutas. Busque accountability. Lembre-se: pureza é possível pela graça, não apenas esforço.",
          summary: "A sexualidade é dom bom de Deus para o casamento; pureza começa no coração e é possível pela graça para todos."
        },
        {
          title: "Verdade e Integridade",
          content: `Deus é verdade; mentira reflete Satanás. "O diabo... é mentiroso e pai da mentira" (João 8:44). Quando mentimos, alinhamo-nos com o adversário. "Deixando a mentira, fale cada um a verdade" (Efésios 4:25).

A verdade vai além de não mentir; inclui não enganar. Meias-verdades, exageros, omissões intencionais - todas são formas de engano. "Tudo o que exceder disto provém do maligno" (Mateus 5:37). Sim seja sim; não seja não.

A verdade deve ser falada em amor. "Seguindo a verdade em amor, cresçamos em tudo" (Efésios 4:15). Verdade sem amor é brutalidade; amor sem verdade é sentimentalismo. Precisamos de ambos: falar verdade, mas de forma que edifique.

A integridade é coerência entre público e privado. "Bem-aventurado o homem... em cujo espírito não há dolo" (Salmo 32:2). O íntegro é o mesmo em todo lugar. Não há hipocrisia, máscara ou vida dupla. O que você é em público é o que é em secreto.`,
          references: "João 8:44; Efésios 4:15, 25; Provérbios 12:22; Mateus 5:33-37; Salmo 15:1-2",
          questions: [
            "1. Por que a mentira é grave?",
            "2. Que formas de engano devemos evitar?",
            "3. Como equilibrar verdade e amor?",
            "4. O que é integridade?",
            "5. Você é o mesmo em público e privado?"
          ],
          application: "Identifique áreas de inconsistência entre sua vida pública e privada. Confesse e busque integridade total.",
          summary: "A verdade reflete Deus e deve ser falada em amor; integridade é coerência entre vida pública e privada, sem hipocrisia."
        },
        {
          title: "Justiça Social",
          content: `Deus ama justiça e odeia opressão. "Aprendei a fazer o bem; buscai a justiça, repreendei ao opressor" (Isaías 1:17). A preocupação com o pobre e oprimido não é opcional; é central ao caráter de Deus e deve ser ao nosso.

A justiça bíblica vai além de caridade. Caridade alivia sintomas; justiça ataca causas. "Abre a tua boca a favor do mudo... julga a causa do pobre e do necessitado" (Provérbios 31:8-9). Devemos advogar por sistemas justos, não apenas ajudar indivíduos.

O profeta Amós denunciou religiosos que negligenciavam justiça. "Corra, porém, o juízo como as águas, e a justiça como o ribeiro impetuoso" (Amós 5:24). Adoração sem justiça é hipocrisia detestável a Deus. Fé e obras são inseparáveis.

A igreja primitiva cuidou dos necessitados como parte essencial de seu testemunho. "Repartiam com todos, segundo cada um tinha necessidade" (Atos 2:45). Cuidar do pobre não é programa; é identidade cristã. É como o mundo vê o amor de Deus em ação.`,
          references: "Isaías 1:17; 58:6-12; Amós 5:21-24; Miqueias 6:8; Tiago 1:27; 2:15-17; Atos 2:44-45",
          questions: [
            "1. Deus se importa com justiça social?",
            "2. Qual a diferença entre caridade e justiça?",
            "3. Por que os profetas denunciavam injustiça?",
            "4. Como a igreja primitiva cuidou dos necessitados?",
            "5. Como sua igreja pode crescer em justiça?"
          ],
          application: "Identifique uma injustiça em sua comunidade. Ore sobre como você pode ser parte da solução, não apenas observador.",
          summary: "Deus ama justiça e ordena cuidar do pobre e oprimido; justiça vai além de caridade para transformar sistemas e reflete amor cristão."
        }
      ])
    }
  ]
};

// MÓDULO 13: Apologética Básica
const MODULO_13_APOLOGETICA: ModuleData = {
  id: "nivel2-mod13-apologetica",
  name: "Apologética Básica",
  description: "Defesa racional da fé cristã contra objeções comuns",
  icon: "Shield",
  color: "#F59E0B",
  order: 28,
  tracks: [
    {
      id: "track-n2m13-moderado",
      level: "moderado",
      name: "Fundamentos da Defesa da Fé",
      description: "Preparando-se para dar razão da esperança",
      requiredPlan: "premium",
      order: 1,
      lessons: createLessons("n2m13", [
        {
          title: "O Que é Apologética",
          content: `Apologética vem do grego 'apologia', significando defesa. "Estai sempre preparados para responder a todo o que vos pedir a razão da esperança que há em vós" (1 Pedro 3:15). Não é pedir desculpas pela fé, mas defendê-la racionalmente.

A apologética tem função dupla: remover obstáculos intelectuais e fortalecer a fé dos crentes. Paulo "arrazoava" com judeus e gregos (Atos 17:2, 17). Ele respondia objeções e apresentava argumentos. A mente importa; Deus quer ser amado também com o entendimento.

A apologética não salva; o Espírito convence. Argumentos preparam o terreno, mas somente Deus regenera. Todavia, Deus usa meios humanos, incluindo raciocínio. "Pela graça sois salvos, mediante a fé" (Efésios 2:8) - e fé responde a verdade apresentada.

A apologética deve ser feita "com mansidão e temor" (1 Pedro 3:15). Não é para vencer debates, mas pessoas. Arrogância intelectual prejudica o testemunho. O objetivo não é provar que estamos certos, mas apontar para Cristo.`,
          references: "1 Pedro 3:15; Atos 17:2-4, 16-34; 2 Coríntios 10:3-5; Judas 3; Filipenses 1:7, 16",
          questions: [
            "1. O que significa 'apologia'?",
            "2. Qual é a dupla função da apologética?",
            "3. Argumentos salvam pessoas?",
            "4. Como devemos fazer apologética?",
            "5. Qual é o objetivo final da apologética?"
          ],
          application: "Identifique objeções que você ou pessoas próximas têm. Comprometa-se a buscar respostas com humildade.",
          summary: "Apologética é a defesa racional da fé cristã para remover obstáculos e fortalecer crentes, feita com mansidão apontando para Cristo."
        },
        {
          title: "A Existência de Deus: Argumento Cosmológico",
          content: `O argumento cosmológico parte da existência do universo. Tudo que começa a existir tem uma causa. O universo começou a existir (Big Bang confirma). Portanto, o universo tem uma causa. Esta causa deve ser atemporal, imaterial, incrivelmente poderosa - atributos de Deus.

"No princípio, criou Deus os céus e a terra" (Gênesis 1:1). A Bíblia afirma o que a ciência confirma: o universo teve início. Um início demanda iniciador. Nada vem do nada. O universo não é autoexplicativo.

A causa deve ser pessoal. Causas impessoais produzem efeitos necessariamente, dado as condições. Se as condições existem desde sempre, o efeito também existiria desde sempre. Mas o universo começou em um ponto. Isso sugere escolha, decisão - uma Causa pessoal que decidiu criar.

Este argumento não prova o Deus cristão especificamente, mas é passo importante. Estabelece que ateísmo é irracional: um universo sem causa é impossível. Teísmo faz sentido; ateísmo não. A partir daqui, outros argumentos e a revelação completam o quadro.`,
          references: "Gênesis 1:1; Romanos 1:20; Salmo 19:1; Hebreus 11:3; Atos 17:24-28",
          questions: [
            "1. O que é o argumento cosmológico?",
            "2. O que a ciência confirma sobre o início do universo?",
            "3. Por que a causa deve ser pessoal?",
            "4. O argumento prova o Deus cristão especificamente?",
            "5. Por que o ateísmo é irracional à luz deste argumento?"
          ],
          application: "Pratique explicar este argumento em linguagem simples. Use-o quando alguém questionar a existência de Deus.",
          summary: "O argumento cosmológico mostra que o universo, tendo começado a existir, requer uma causa atemporal, poderosa e pessoal - Deus."
        },
        {
          title: "A Existência de Deus: Argumento Teleológico",
          content: `O argumento teleológico (do design) aponta a ordem e propósito no universo. "Os céus declaram a glória de Deus, e o firmamento anuncia as obras de suas mãos" (Salmo 19:1). Design implica designer; propósito implica inteligência.

O ajuste fino do universo é impressionante. As constantes físicas (força gravitacional, força nuclear, etc.) são calibradas com precisão inimaginável para permitir vida. Alteração mínima em qualquer uma tornaria vida impossível. Isso parece projeto, não acidente.

A complexidade biológica aprofunda o argumento. O DNA é código de informação mais sofisticado que qualquer software humano. Informação sempre vem de mente. Nunca observamos informação surgindo de processos aleatórios. Células são fábricas microscópicas de engenharia surpreendente.

A objeção evolucionista não resolve. Mesmo se a evolução explicasse complexidade biológica (questionável), não explica o ajuste fino cósmico anterior. E a própria evolução dependeria de leis ordenadas - de onde vêm as leis? Ordem demanda Ordenador.`,
          references: "Salmo 19:1-4; Romanos 1:19-20; Atos 14:17; 17:24-28; Isaías 40:26",
          questions: [
            "1. O que é o argumento teleológico?",
            "2. O que é 'ajuste fino' do universo?",
            "3. Por que DNA sugere designer?",
            "4. A evolução refuta este argumento?",
            "5. Como você explicaria este argumento para um amigo?"
          ],
          application: "Observe a natureza esta semana com olhos novos. Veja design e agradeça ao Designer.",
          summary: "O argumento teleológico mostra que a ordem, ajuste fino e complexidade informacional do universo apontam para um Designer inteligente."
        },
        {
          title: "A Existência de Deus: Argumento Moral",
          content: `O argumento moral parte da realidade de valores morais objetivos. Se existem verdades morais absolutas (assassinato é realmente errado, não apenas desaprovado), então existe um Legislador moral transcendente. Valores morais objetivos existem. Logo, Deus existe.

A lei moral está "escrita em seus corações" (Romanos 2:15). Todas as culturas reconhecem certas coisas como erradas. O Holocausto não é apenas impopular; é genuinamente mau. Se negamos isso, não temos base para condenar nada. Mas intuitivamente sabemos: há certo e errado reais.

O ateísmo não pode fundamentar moralidade objetiva. Se somos apenas matéria em movimento, de onde vem obrigação moral? Evolução explica (talvez) por que temos certos instintos, não por que devemos segui-los. "Dever" transcende "é". Matéria não gera dever.

Este argumento não diz que ateus são imorais. Muitos ateus são moralmente exemplares. Mas vivem de 'capital emprestado' - valores que fazem sentido no teísmo, não no ateísmo. Quando agem moralmente, confirmam o que sabem: há padrão moral real.`,
          references: "Romanos 2:14-15; 1:32; Eclesiastes 3:11; Atos 17:26-28; Gênesis 1:27",
          questions: [
            "1. O que são valores morais objetivos?",
            "2. Por que a lei moral aponta para Deus?",
            "3. O ateísmo pode fundamentar moralidade?",
            "4. Ateus são imorais?",
            "5. O que significa 'capital emprestado'?"
          ],
          application: "Quando sentir indignação moral, pergunte: por que isso é realmente errado? Trace a resposta até Deus.",
          summary: "O argumento moral mostra que valores morais objetivos (que sabemos existir) requerem um Legislador moral transcendente - Deus."
        },
        {
          title: "A Confiabilidade da Bíblia",
          content: `A Bíblia é o livro mais bem atestado da antiguidade. Temos mais manuscritos, mais antigos e mais concordantes que qualquer outro texto antigo. Se duvidarmos da Bíblia, teríamos que descartar toda história antiga.

A evidência manuscrita é impressionante. Mais de 5.800 manuscritos gregos do Novo Testamento, alguns datando de décadas após os originais. Homero tem menos de 700 manuscritos; Platão, menos de 10. A diferença é astronômica. E as variantes textuais não afetam nenhuma doutrina.

O testemunho arqueológico confirma a Bíblia repetidamente. Críticos duvidaram de pessoas e lugares bíblicos (hititas, Pilatos, piscina de Siloé); arqueologia os confirmou. Nenhum achado arqueológico jamais contradisse a Bíblia; muitos a corroboraram.

Profecias cumpridas atestam origem divina. Isaías profetizou sobre Ciro por nome 150 anos antes (Isaías 44:28). Daniel previu impérios. Dezenas de profecias messiânicas cumpriram-se em Jesus. A precisão profética excede qualquer possibilidade de coincidência ou manipulação.`,
          references: "2 Timóteo 3:16; 2 Pedro 1:20-21; João 10:35; Lucas 1:1-4; Isaías 44:28; 53:1-12",
          questions: [
            "1. Como a evidência manuscrita suporta a Bíblia?",
            "2. Que exemplos arqueológicos confirmam a Bíblia?",
            "3. Dê exemplo de profecia cumprida.",
            "4. Por que profecias cumpridas são evidência de origem divina?",
            "5. Como você responderia a quem diz que a Bíblia foi corrompida?"
          ],
          application: "Estude uma profecia messiânica e seu cumprimento em Jesus. Use isso em conversas sobre a Bíblia.",
          summary: "A Bíblia é excepcionalmente atestada por manuscritos, arqueologia e profecias cumpridas, demonstrando confiabilidade e origem divina."
        },
        {
          title: "A Ressurreição de Jesus",
          content: `A ressurreição é o fundamento do cristianismo. "Se Cristo não ressuscitou, é vã a vossa fé" (1 Coríntios 15:17). Não é mito piedoso, mas afirmação histórica que pode ser investigada. A evidência é substancial.

Fatos aceitos por historiadores, crentes ou não: Jesus morreu por crucificação. Seus discípulos creram vê-Lo ressuscitado. Saulo, perseguidor, e Tiago, cético, converteram-se. O túmulo estava vazio. Esses fatos requerem explicação.

Alternativas naturalistas falham. Alucinação? Grupos não têm alucinações idênticas. Roubo do corpo? Discípulos não morreriam por mentira que inventaram. Desmaio? Romanos sabiam matar. Lenda? Muito cedo para desenvolvimento lendário; testemunhas vivas verificavam.

A melhor explicação é a ressurreição real. "Pelo que também Deus o exaltou soberanamente" (Filipenses 2:9). Se Jesus ressuscitou, tudo que ensinou é verdade. Ele é quem afirmou ser. A ressurreição valida todo o cristianismo.`,
          references: "1 Coríntios 15:1-20; Mateus 28:1-20; Lucas 24:1-53; João 20-21; Atos 1:3; 2:32; Romanos 1:4",
          questions: [
            "1. Por que a ressurreição é central?",
            "2. Quais fatos historiadores geralmente aceitam?",
            "3. Por que a teoria da alucinação falha?",
            "4. Por que a teoria do roubo falha?",
            "5. O que a ressurreição prova sobre Jesus?"
          ],
          application: "Prepare-se para explicar a evidência da ressurreição em 2 minutos. Pratique até ficar natural.",
          summary: "A ressurreição de Jesus é fato histórico bem evidenciado que valida toda Sua obra e ensino, fundamento do cristianismo."
        },
        {
          title: "O Problema do Mal",
          content: `O problema do mal é a objeção mais comum contra Deus. Se Deus é bom e todo-poderoso, por que existe mal? Parece contradição: ou Deus não é bom, ou não é poderoso, ou não existe.

A resposta envolve livre-arbítrio. Deus criou seres livres que podem escolher mal. Amor genuíno requer liberdade; robôs programados não amam. O mal é resultado de escolhas, humanas e angélicas. Deus permitiu, mas não causou.

Mal também serve a propósitos maiores. José disse aos irmãos: "Vós intentastes o mal contra mim; porém Deus o tornou em bem" (Gênesis 50:20). A cruz é o exemplo supremo: o maior mal produziu o maior bem. Deus usa o que não aprova para fins que aprova.

O cristão tem esperança além do mal presente. "Tenho-vos dito estas coisas, para que em mim tenhais paz. No mundo tereis aflições; mas tende bom ânimo, eu venci o mundo" (João 16:33). Deus entrará para corrigir toda injustiça. O mal é temporário; a justiça de Deus é eterna.`,
          references: "Gênesis 50:20; Romanos 8:28; Jó 38-42; João 16:33; Apocalipse 21:4; Isaías 55:8-9",
          questions: [
            "1. Qual é o problema do mal?",
            "2. Como livre-arbítrio responde parcialmente?",
            "3. Como Deus usa o mal para o bem?",
            "4. Como o exemplo de José ilustra isso?",
            "5. Que esperança o cristão tem diante do mal?"
          ],
          application: "Quando enfrentar sofrimento, lembre-se: Deus pode usar isso. Confie mesmo sem entender completamente.",
          summary: "O problema do mal é respondido por livre-arbítrio, pelo uso soberano de Deus do mal para bem, e pela promessa de restauração final."
        },
        {
          title: "Jesus: Único Caminho?",
          content: `A exclusividade de Cristo ofende sensibilidades pluralistas. Mas Jesus afirmou: "Eu sou o caminho, e a verdade, e a vida. Ninguém vem ao Pai senão por mim" (João 14:6). Não foi arrogância; foi verdade.

A exclusividade não é arrogância cristã, mas afirmação de Cristo. Cristãos não inventaram isso; Jesus declarou. "Não há outro nome... pelo qual devamos ser salvos" (Atos 4:12). Se Jesus ressuscitou, devemos levar Suas palavras a sério.

Todas as religiões não ensinam o mesmo. Hinduísmo e budismo dizem que não há Deus pessoal; cristianismo diz que há. Islã nega que Jesus morreu; cristianismo afirma. Não podem ser verdadeiros simultaneamente. Contradições lógicas não são 'perspectivas diferentes'.

A exclusividade é inclusiva em alcance. "Deus quer que todos os homens se salvem" (1 Timóteo 2:4). Há um único caminho, mas está aberto a todos. "Todo aquele que invocar o nome do Senhor será salvo" (Romanos 10:13). A porta é estreita, mas convida todos a entrar.`,
          references: "João 14:6; Atos 4:12; 1 Timóteo 2:3-6; Romanos 10:12-13; João 3:16; 1 João 5:11-12",
          questions: [
            "1. O que Jesus afirmou sobre Si mesmo?",
            "2. A exclusividade é arrogância cristã?",
            "3. Todas as religiões ensinam o mesmo?",
            "4. Como a exclusividade é também inclusiva?",
            "5. Como você explicaria isso com gentileza?"
          ],
          application: "Ore por oportunidades de compartilhar Cristo com pessoas de outras crenças. Faça-o com amor, não superioridade.",
          summary: "Jesus afirmou ser o único caminho para Deus - afirmação que, se Ele ressuscitou, devemos aceitar como verdade inclusiva para todos."
        },
        {
          title: "Ciência e Fé",
          content: `Ciência e fé não são inimigas. Os fundadores da ciência moderna eram cristãos devotos: Kepler, Newton, Faraday, Maxwell. Criam que um Deus racional criou um universo ordenado, investigável. A fé motivou a ciência.

"Ciência prova que Deus não existe" é declaração não-científica. Ciência investiga causas naturais; Deus é sobrenatural. Ciência não pode provar ou refutar Deus, assim como não pode provar ou refutar amor, justiça ou beleza. São domínios diferentes.

Muitas descobertas científicas apontam para Deus. O Big Bang confirma criação. O ajuste fino sugere design. A informação em DNA indica inteligência. Cientistas ateus admitem que o universo parece projetado; negam o Designer por filosofia, não evidência.

A Bíblia não é livro de ciência, mas quando toca ciência, é confiável. Descreve o ciclo hidrológico (Eclesiastes 1:7), correntes oceânicas (Salmo 8:8), e a expansão do universo (Isaías 40:22) antes da ciência descobrir. Não há conflito real, apenas mal-entendidos.`,
          references: "Salmo 19:1-4; Romanos 1:20; Provérbios 25:2; Gênesis 1:1; Hebreus 11:3",
          questions: [
            "1. Ciência e fé são inimigas?",
            "2. Ciência pode provar que Deus não existe?",
            "3. Que descobertas científicas apontam para Deus?",
            "4. A Bíblia é livro de ciência?",
            "5. Como responder quando dizem 'ciência refuta Deus'?"
          ],
          application: "Estude a história de cientistas cristãos. Use seus exemplos em conversas sobre ciência e fé.",
          summary: "Ciência e fé são complementares, não antagônicas; a ciência investiga o 'como' natural, a fé o 'por que' e o Quem transcendente."
        },
        {
          title: "Respondendo Objeções com Graça",
          content: `A apologética eficaz combina verdade e amor. "Seguindo a verdade em amor" (Efésios 4:15). Ganhar argumento e perder pessoa é derrota. O objetivo não é humilhar, mas ajudar. "Com mansidão e temor" (1 Pedro 3:15) não é sugestão; é comando.

Ouvir é tão importante quanto falar. Muitas objeções escondem questões mais profundas. A pessoa que pergunta sobre sofrimento pode estar sofrendo. A que ataca a Bíblia pode ter sido ferida por cristãos. Ouvir o coração, não apenas a cabeça.

Admita o que não sabe. "Não sei, mas vou pesquisar" é resposta honesta e poderosa. Fingir conhecimento prejudica credibilidade. Humildade intelectual é atraente; arrogância repele. Não precisa ter todas as respostas; aponte para Quem tem.

Ore antes, durante e depois de conversas apologéticas. O Espírito convence; nós plantamos e regamos. "Eu plantei, Apolo regou; mas Deus deu o crescimento" (1 Coríntios 3:6). Conversões são milagres divinos, não conquistas humanas. Dependência de Deus é essencial.`,
          references: "1 Pedro 3:15-16; Efésios 4:15; Colossenses 4:5-6; 2 Timóteo 2:24-26; 1 Coríntios 3:6",
          questions: [
            "1. Como combinar verdade e amor?",
            "2. Por que ouvir é importante na apologética?",
            "3. Por que admitir o que não sabemos é poderoso?",
            "4. Qual o papel do Espírito Santo?",
            "5. Como você pode melhorar em responder objeções?"
          ],
          application: "Na próxima conversa difícil, faça mais perguntas que afirmações. Ouça para entender, não para responder.",
          summary: "Apologética eficaz combina verdade com amor, ouve antes de falar, admite limitações e depende do Espírito para convencer."
        }
      ])
    }
  ]
};

// MÓDULO 14: Teologia da Adoração
const MODULO_14_ADORACAO: ModuleData = {
  id: "nivel2-mod14-adoracao",
  name: "Teologia da Adoração",
  description: "Princípios bíblicos e práticas de adoração verdadeira",
  icon: "Music",
  color: "#8B5CF6",
  order: 29,
  tracks: [
    {
      id: "track-n2m14-moderado",
      level: "moderado",
      name: "Adoração que Agrada a Deus",
      description: "Compreendendo a verdadeira adoração bíblica",
      requiredPlan: "premium",
      order: 1,
      lessons: createLessons("n2m14", [
        {
          title: "O Que é Adoração",
          content: `Adoração é a resposta apropriada do ser humano ao encontrar a glória de Deus. A palavra hebraica 'shachah' significa prostrar-se; a grega 'proskyneo' significa beijar em direção a, inclinar-se. Adoração reconhece a supremacia de Deus.

Adoração é mais que música; é vida toda. "Rogo-vos, pois, irmãos, pela compaixão de Deus, que apresenteis os vossos corpos em sacrifício vivo, santo e agradável a Deus, que é o vosso culto racional" (Romanos 12:1). Cada ato pode ser adoração quando oferecido a Deus.

Adoração é para a glória de Deus, não nossa satisfação. "Não a nós, SENHOR, não a nós, mas ao teu nome dá glória" (Salmo 115:1). Embora adorar traga alegria, o foco não somos nós. Adoração centrada em nós é idolatria disfarçada.

Jesus ensinou: "Os verdadeiros adoradores adorarão o Pai em espírito e em verdade" (João 4:23). Adoração requer coração engajado (espírito) e conteúdo correto (verdade). Forma sem coração é hipocrisia; emoção sem verdade é emocionalismo.`,
          references: "João 4:23-24; Romanos 12:1-2; Salmo 95:6; 100:1-5; Apocalipse 4:8-11; 5:9-14",
          questions: [
            "1. O que significa 'proskyneo'?",
            "2. Adoração é apenas música?",
            "3. Para quem é a adoração?",
            "4. O que significa adorar 'em espírito'?",
            "5. O que significa adorar 'em verdade'?"
          ],
          application: "Esta semana, identifique atividades cotidianas que podem se tornar adoração consciente a Deus.",
          summary: "Adoração é a resposta de render-se à glória de Deus, abrangendo toda a vida, feita em espírito (coração) e verdade (conteúdo correto)."
        },
        {
          title: "Adoração no Antigo Testamento",
          content: `A adoração no Antigo Testamento era estruturada em torno do tabernáculo e templo. Deus deu instruções detalhadas para adoração porque ela importa. "Tudo o que te ordeno observarás; nada lhe acrescentarás nem diminuirás" (Deuteronômio 12:32).

Os sacrifícios eram centrais. Apontavam para Cristo, o sacrifício definitivo. "Sem derramamento de sangue não há remissão" (Hebreus 9:22). O adorador israelita via constantemente a seriedade do pecado e a necessidade de expiação. A cruz estava prefigurada.

As festas eram adoração comunitária. Páscoa, Pentecostes, Tabernáculos - cada uma celebrava a fidelidade de Deus e formava identidade corporativa. Israel adorava junto, não apenas individualmente. A comunidade era essencial.

Os Salmos mostram a amplitude da adoração. Louvor exuberante (Salmo 150), lamento profundo (Salmo 88), confissão de pecado (Salmo 51), celebração de história (Salmo 78). Toda emoção humana encontra expressão na adoração bíblica. Adoração é honesta.`,
          references: "Êxodo 25-40; Levítico 1-7; 23; Deuteronômio 16; Salmos 95-100; 145-150; Hebreus 9-10",
          questions: [
            "1. O que o tabernáculo/templo significava?",
            "2. Para o que os sacrifícios apontavam?",
            "3. Qual o propósito das festas?",
            "4. Que tipos de salmos existem?",
            "5. O que aprendemos sobre adoração do AT?"
          ],
          application: "Leia um salmo de louvor e um de lamento esta semana. Veja como ambos são adoração.",
          summary: "A adoração no AT era estruturada em tabernáculo/templo, sacrifícios e festas, prefigurando Cristo e expressando toda gama de emoções."
        },
        {
          title: "Adoração no Novo Testamento",
          content: `Jesus transformou a adoração. "Vem a hora em que nem neste monte nem em Jerusalém adorareis o Pai" (João 4:21). O templo não é mais necessário; Cristo é o novo templo. Deus habita em Seu povo, não em edifícios.

A igreja primitiva adorava em simplicidade. "Perseveravam na doutrina dos apóstolos, na comunhão, no partir do pão e nas orações" (Atos 2:42). Palavra, comunhão, Ceia e oração - os elementos básicos. Não tinham templos, liturgias elaboradas ou instrumentos. Tinham presença de Deus.

A adoração cristã é cristocêntrica. "Onde estiverem dois ou três reunidos em meu nome, aí estou eu no meio deles" (Mateus 18:20). Reunimo-nos ao redor de Cristo, por Cristo, para glorificar Cristo. Ele é o mediador que possibilita nosso acesso a Deus.

Paulo instrui a adoração. "Habite, ricamente, em vós a palavra de Cristo; instruí-vos e aconselhai-vos mutuamente... cantando a Deus, com gratidão, salmos, hinos e cânticos espirituais" (Colossenses 3:16). Palavra central, música congregacional, edificação mútua.`,
          references: "João 4:21-24; Atos 2:42-47; Colossenses 3:16; Efésios 5:19; Hebreus 10:24-25; 1 Coríntios 14:26",
          questions: [
            "1. Como Jesus transformou a adoração?",
            "2. Quais eram os elementos da adoração primitiva?",
            "3. Por que a adoração é cristocêntrica?",
            "4. O que Paulo instrui sobre adoração?",
            "5. Como isso difere de práticas contemporâneas?"
          ],
          application: "Compare seu culto de domingo com Atos 2:42. O que está presente? O que falta?",
          summary: "O NT mostra adoração transformada por Cristo, simples em elementos (Palavra, comunhão, Ceia, oração), cristocêntrica e mutuamente edificante."
        },
        {
          title: "Música na Adoração",
          content: `A música é parte importante, mas não totalidade, da adoração. "Cantai ao SENHOR um cântico novo; cantai ao SENHOR, todas as terras" (Salmo 96:1). O povo de Deus sempre cantou - de Moisés no Mar Vermelho ao cântico do Cordeiro em Apocalipse.

A música serve ao conteúdo, não o contrário. Letras importam mais que melodias. "Habite, ricamente, em vós a palavra de Cristo... cantando" (Colossenses 3:16). Música é veículo para verdade. Canções vazias ou heréticas desonram a Deus, não importa quão bonitas musicalmente.

A música congrega, não apenas entretém. "Falaei entre vós em salmos, e hinos, e cânticos espirituais" (Efésios 5:19). Cantar juntos une o corpo. Não é performance para consumo, mas participação corporativa. A congregação canta; não assiste.

Estilos musicais variam; princípios permanecem. A Bíblia não prescreve gênero musical. Culturas diferentes cantam diferentemente. O teste é: glorifica a Deus? Comunica verdade? Edifica o corpo? Engaja o coração? Forma importa menos que substância.`,
          references: "Salmo 96:1-2; 150; Êxodo 15:1-21; Colossenses 3:16; Efésios 5:19; Apocalipse 5:9-10",
          questions: [
            "1. Música é toda a adoração?",
            "2. O que importa mais: letra ou melodia?",
            "3. Qual é a função da música congregacional?",
            "4. A Bíblia prescreve estilos musicais?",
            "5. Que perguntas devemos fazer sobre nossa música?"
          ],
          application: "Preste atenção às letras das músicas no próximo culto. Elas comunicam verdade bíblica?",
          summary: "A música é veículo para verdade na adoração, servindo ao conteúdo e congregando o corpo, independente de estilo específico."
        },
        {
          title: "A Pregação na Adoração",
          content: `A pregação da Palavra é central na adoração. "Prega a palavra, insta a tempo e fora de tempo" (2 Timóteo 4:2). Quando Deus fala através de Sua Palavra exposta, adoramos respondendo em obediência. A pregação não é prelúdio para adoração; é adoração.

A igreja primitiva dava primazia à Palavra. "Perseveravam na doutrina dos apóstolos" (Atos 2:42). Paulo em Trôade "continuou a falar até à meia-noite" (Atos 20:7). A Palavra era central, não opcional. Não havia culto sem Escritura.

A pregação deve ser expositiva - expondo o que a Escritura diz. "Leram no livro, na lei de Deus, claramente, dando sentido, de maneira que se entendesse a leitura" (Neemias 8:8). O pregador não impõe significado; extrai o significado do texto. Deus fala; nós explicamos.

Ouvir pregação é adoração ativa. Não é entretenimento passivo. "Todo o povo atentamente ouvia a leitura do livro da lei" (Neemias 8:3). Ouvimos com expectativa, anotamos, aplicamos. A Palavra demanda resposta - isso é adoração.`,
          references: "2 Timóteo 4:1-5; Atos 2:42; 20:7-12; Neemias 8:1-12; Romanos 10:17; Hebreus 4:12",
          questions: [
            "1. A pregação é parte da adoração?",
            "2. Qual era o lugar da Palavra na igreja primitiva?",
            "3. O que é pregação expositiva?",
            "4. Como ouvir pregação é adorar?",
            "5. Como você pode ouvir mais ativamente?"
          ],
          application: "No próximo sermão, tome notas e identifique uma aplicação específica. Responder à Palavra é adorar.",
          summary: "A pregação expositiva é central na adoração, pois quando Deus fala através de Sua Palavra, nossa resposta obediente é adoração."
        },
        {
          title: "Oração na Adoração",
          content: `A oração é diálogo com Deus que permeia toda adoração. "A minha casa será chamada casa de oração" (Mateus 21:13). A igreja que não ora não adora verdadeiramente. Oração é o ar que a adoração respira.

A oração coletiva tem poder especial. "Se dois de vós concordarem na terra acerca de qualquer coisa que pedirem, isso lhes será feito por meu Pai" (Mateus 18:19). Não porque Deus precisa de quórum, mas porque oração unida expressa unidade do corpo e fé corporativa.

A oração inclui elementos diversos. ACTS: Adoração (louvar a Deus por quem Ele é), Confissão (reconhecer pecados), Agradecimento (gratidão por bênçãos), Súplica (pedidos). Oração equilibrada inclui todos; muitos apenas pedem.

O Pai Nosso é modelo. "Vós, pois, orai assim" (Mateus 6:9). Começa com Deus (nome, reino, vontade), depois passa às necessidades (pão, perdão, proteção). Deus primeiro; nós depois. Esta ordem reflete prioridades corretas na oração.`,
          references: "Mateus 6:5-15; 18:19-20; 21:13; Atos 2:42; 4:24-31; Efésios 6:18; Filipenses 4:6",
          questions: [
            "1. Por que oração é essencial na adoração?",
            "2. Qual é o poder da oração coletiva?",
            "3. O que significa ACTS na oração?",
            "4. O que o Pai Nosso nos ensina?",
            "5. Como sua oração pode ser mais equilibrada?"
          ],
          application: "Use o modelo ACTS em sua oração esta semana. Note quais elementos você normalmente negligencia.",
          summary: "A oração permeia a adoração, incluindo adoração, confissão, agradecimento e súplica, seguindo o modelo equilibrado do Pai Nosso."
        },
        {
          title: "A Ceia do Senhor",
          content: `A Ceia do Senhor é ordenança central dada por Cristo. "Fazei isto em memória de mim" (Lucas 22:19). Não é ritual vazio, mas participação significativa na comunidade da nova aliança, proclamando a morte do Senhor até que Ele venha.

A Ceia comunica o evangelho visualmente. "Anunciais a morte do Senhor, até que venha" (1 Coríntios 11:26). Pão partido representa corpo dado; vinho representa sangue derramado. Cada celebração é pregação do evangelho em forma visível.

A Ceia une o corpo de Cristo. "Porque nós, embora muitos, somos um só pão, um só corpo" (1 Coríntios 10:17). Comemos juntos porque somos um em Cristo. A Ceia expressa e fortalece a comunhão dos santos. É refeição de família.

A Ceia requer exame. "Examine-se o homem a si mesmo" (1 Coríntios 11:28). Não é para todos automaticamente; é para crentes que se examinaram. Participar indignamente traz juízo. A solenidade da Ceia reflete a seriedade do sacrifício de Cristo.`,
          references: "Lucas 22:14-20; 1 Coríntios 10:16-17; 11:23-34; Mateus 26:26-29; Atos 2:42; 20:7",
          questions: [
            "1. Quem ordenou a Ceia?",
            "2. O que a Ceia comunica?",
            "3. Como a Ceia une o corpo?",
            "4. Por que exame é necessário?",
            "5. Como você se prepara para a Ceia?"
          ],
          application: "Antes da próxima Ceia, passe tempo em auto-exame. Confesse pecados e renove gratidão pelo sacrifício de Cristo.",
          summary: "A Ceia do Senhor é ordenança que proclama o evangelho visualmente, une o corpo de Cristo e requer auto-exame solene."
        },
        {
          title: "Batismo como Adoração",
          content: `O batismo é ordenança que marca a entrada na comunidade de fé. "Ide, fazei discípulos... batizando-os em nome do Pai, do Filho e do Espírito Santo" (Mateus 28:19). É ato público de identificação com Cristo e Sua igreja.

O batismo simboliza morte e ressurreição com Cristo. "Fomos sepultados com ele pelo batismo na morte; para que, como Cristo ressuscitou, andemos nós também em novidade de vida" (Romanos 6:4). A imersão representa sepultamento; a emersão, ressurreição. O velho morreu; o novo vive.

O batismo é testemunho público. "Confessarás com a tua boca ao Senhor Jesus" (Romanos 10:9). Ser batizado declara: "Pertenço a Cristo." É passo de obediência e coragem. Muitos contextos tornam o batismo custoso, mas Jesus é digno.

O batismo não salva, mas expressa salvação. O ladrão na cruz foi salvo sem batismo (Lucas 23:43). Mas crentes devem ser batizados como demonstração de fé e obediência. É mandamento, não sugestão.`,
          references: "Mateus 28:18-20; Romanos 6:3-4; Atos 2:38-41; 8:35-39; 16:30-34; 1 Pedro 3:21",
          questions: [
            "1. O que o batismo significa?",
            "2. O que a imersão simboliza?",
            "3. Por que batismo é testemunho?",
            "4. Batismo salva?",
            "5. Por que todo crente deve ser batizado?"
          ],
          application: "Se você não foi batizado, considere dar este passo de obediência. Se foi, lembre-se do que significou.",
          summary: "O batismo é ordenança que simboliza morte e ressurreição com Cristo, servindo como testemunho público de fé e entrada na comunidade."
        },
        {
          title: "Adoração Pessoal e Devocional",
          content: `A adoração pessoal nutre a vida espiritual. Jesus tinha práticas devocionais regulares. "Levantando-se de manhã, muito cedo, saiu, e foi para um lugar deserto, e ali orava" (Marcos 1:35). Se Jesus precisava de tempo com o Pai, quanto mais nós.

Devoções incluem Palavra e oração. "No teu coração guardei a tua palavra, para não pecar contra ti" (Salmo 119:11). Leitura bíblica sistemática alimenta a alma. Oração responde ao que Deus fala. O diálogo completo inclui ambos: ouvir e falar.

Consistência supera intensidade. Melhor 15 minutos diários que 2 horas esporádicas. "Buscai ao SENHOR enquanto se pode achar" (Isaías 55:6). Hábitos formam caráter. Devoções irregulares produzem cristãos instáveis.

A adoração pessoal prepara para adoração coletiva. Quem não adora durante a semana dificilmente adorará no domingo. O coração cultivado em particular expressa-se em público. A fonte deve estar cheia para transbordar.`,
          references: "Marcos 1:35; Salmo 1:1-3; 119:9-16, 105; Isaías 55:6-7; Josué 1:8; Lucas 5:16",
          questions: [
            "1. Jesus tinha práticas devocionais?",
            "2. O que incluir em devoções pessoais?",
            "3. Por que consistência importa?",
            "4. Como devoções pessoais afetam adoração coletiva?",
            "5. Qual é seu plano devocional?"
          ],
          application: "Estabeleça ou refine seu tempo devocional diário. Escolha hora, lugar e plano de leitura.",
          summary: "A adoração pessoal através de Palavra e oração consistentes nutre a vida espiritual e prepara para adoração coletiva."
        },
        {
          title: "Adoração e Vida Diária",
          content: `Toda a vida é arena de adoração. "Quer comais, quer bebais, ou façais outra qualquer coisa, fazei tudo para glória de Deus" (1 Coríntios 10:31). Não há divisão sagrado-secular; há vida vivida para Deus ou não.

O trabalho é adoração. "Tudo quanto fizerdes, fazei-o de todo o coração, como ao Senhor" (Colossenses 3:23). O carpinteiro cristão adora fazendo móveis excelentes. O contador adora com integridade nos números. A mãe adora cuidando dos filhos.

Relacionamentos são adoração. "Amai-vos cordialmente uns aos outros" (Romanos 12:10). Cada interação pode glorificar a Deus. Paciência no trânsito, gentileza com funcionários, fidelidade ao cônjuge - adoração em forma relacional.

O lazer pode ser adoração. Descanso é dom de Deus. Recreação que renova (não degrada) honra ao Criador. "Alegrai-vos sempre no Senhor" (Filipenses 4:4). Alegria lícita glorifica a Deus. Ele dá "todas as coisas ricamente para delas usufruirmos" (1 Timóteo 6:17).`,
          references: "1 Coríntios 10:31; Colossenses 3:17, 23-24; Romanos 12:1-2; 14:7-8; Filipenses 4:4",
          questions: [
            "1. Toda a vida é adoração?",
            "2. Como o trabalho pode ser adoração?",
            "3. Como relacionamentos podem ser adoração?",
            "4. O lazer pode ser adoração?",
            "5. O que impede sua vida de ser adoração contínua?"
          ],
          application: "Escolha uma atividade 'secular' e conscientemente dedique-a a Deus esta semana. Note a diferença.",
          summary: "Toda a vida - trabalho, relacionamentos, lazer - pode ser adoração quando vivida conscientemente para a glória de Deus."
        }
      ])
    }
  ]
};

// MÓDULO 15: Liderança Bíblica
const MODULO_15_LIDERANCA: ModuleData = {
  id: "nivel2-mod15-lideranca",
  name: "Liderança Bíblica",
  description: "Princípios de liderança servidora segundo as Escrituras",
  icon: "Users",
  color: "#14B8A6",
  order: 30,
  tracks: [
    {
      id: "track-n2m15-moderado",
      level: "moderado",
      name: "O Líder Segundo o Coração de Deus",
      description: "Desenvolvendo liderança servidora e piedosa",
      requiredPlan: "premium",
      order: 1,
      lessons: createLessons("n2m15", [
        {
          title: "O Modelo de Cristo",
          content: `Jesus é o modelo supremo de liderança. "O Filho do Homem não veio para ser servido, mas para servir e dar a sua vida em resgate de muitos" (Marcos 10:45). Ele redefiniu grandeza: não é ser servido, mas servir.

Jesus lavou os pés dos discípulos. "Ora, se eu, Senhor e Mestre, vos lavei os pés, vós também deveis lavar os pés uns dos outros" (João 13:14). O maior fez o trabalho do menor. Liderança cristã inverte a pirâmide: o líder está embaixo, suportando.

Jesus liderou pelo exemplo. "Eu vos dei o exemplo, para que, como eu vos fiz, façais vós também" (João 13:15). Ele não pediu o que não praticou. Autoridade moral vem de vida coerente. Líderes hipócritas perdem influência.

Jesus liderou com sacrifício final. "Deu a sua vida" - não apenas tempo ou energia, mas a própria vida. Liderança cristã custa. Quem não está disposto a pagar o preço não deve liderar. A cruz é o símbolo máximo de liderança.`,
          references: "Marcos 10:42-45; João 13:1-17; Filipenses 2:5-11; 1 Pedro 5:1-4; Hebreus 13:7",
          questions: [
            "1. Como Jesus redefiniu grandeza?",
            "2. O que lavar os pés ensina sobre liderança?",
            "3. Por que o exemplo é crucial?",
            "4. Quanto a liderança cristã pode custar?",
            "5. Como você pode servir aqueles que lidera?"
          ],
          application: "Identifique uma forma concreta de servir quem está 'abaixo' de você esta semana.",
          summary: "Jesus é o modelo de liderança servidora que redefine grandeza como servir, liderar pelo exemplo e sacrificar-se pelos outros."
        },
        {
          title: "Qualificações do Líder",
          content: `Paulo lista qualificações para líderes eclesiásticos. "Convém que o bispo seja irrepreensível" (1 Timóteo 3:2). A lista enfatiza caráter, não competência técnica. Habilidades podem ser desenvolvidas; caráter falho desqualifica.

A vida familiar revela capacidade de liderança. "Que governe bem a própria casa" (1 Timóteo 3:4). Quem não lidera bem o lar não deve liderar a igreja. A família é o laboratório onde liderança é testada e formada.

A reputação importa. "Convém que tenha bom testemunho dos que estão de fora" (1 Timóteo 3:7). Líderes representam Cristo. Reputação manchada prejudica o evangelho. Não perfeição, mas integridade reconhecida.

Maturidade é essencial. "Não neófito" (1 Timóteo 3:6). Novos convertidos não devem liderar; precisam crescer primeiro. Liderança prematura prejudica tanto o líder quanto os liderados. Paciência no desenvolvimento é sábia.`,
          references: "1 Timóteo 3:1-13; Tito 1:5-9; 1 Pedro 5:1-4; Atos 6:3; 20:28",
          questions: [
            "1. Qual ênfase Paulo dá às qualificações?",
            "2. Por que a vida familiar importa?",
            "3. Por que reputação externa importa?",
            "4. Por que neófitos não devem liderar?",
            "5. Quais qualificações você precisa desenvolver?"
          ],
          application: "Avalie-se honestamente pelas qualificações de 1 Timóteo 3. Trabalhe nas áreas fracas.",
          summary: "As qualificações para liderança enfatizam caráter, vida familiar saudável, boa reputação e maturidade espiritual."
        },
        {
          title: "Liderança Servidora",
          content: `Liderança servidora inverte modelos mundanos. "Os governadores das nações as dominam... Não será assim entre vós" (Mateus 20:25-26). O mundo busca poder; Cristo ensina serviço. São paradigmas opostos.

Servir não é fraqueza; é força sob controle. Jesus tinha todo poder, mas escolheu servir. "Eu estou entre vós como aquele que serve" (Lucas 22:27). Poder usado para controlar é tirania; poder usado para servir é liderança cristã.

Líderes servidores desenvolvem outros. "E o que de mim ouviste... transmite a homens fiéis" (2 Timóteo 2:2). O objetivo não é dependência, mas reprodução. Bons líderes trabalham para se tornarem dispensáveis, não indispensáveis.

Liderança servidora requer humildade genuína. "Com humildade, cada um considere os outros superiores a si mesmo" (Filipenses 2:3). Não é falsa modéstia, mas reconhecimento honesto de limitações e valor dos outros. Humildade atrai; arrogância repele.`,
          references: "Mateus 20:25-28; Lucas 22:24-27; João 13:1-17; Filipenses 2:3-8; 2 Timóteo 2:2",
          questions: [
            "1. Como liderança servidora difere da mundana?",
            "2. Servir é fraqueza?",
            "3. O que líderes servidores desenvolvem?",
            "4. Por que humildade é essencial?",
            "5. Você lidera para ser servido ou para servir?"
          ],
          application: "Pergunte a quem você lidera: 'Como posso servi-lo melhor?' Ouça e aja.",
          summary: "Liderança servidora inverte modelos mundanos usando poder para servir, desenvolver outros e demonstrar humildade genuína."
        },
        {
          title: "Liderança e Integridade",
          content: `Integridade é a base da liderança. "Apascenta o rebanho de Deus... servindo de modelo" (1 Pedro 5:2-3). Líderes sem integridade são contradições ambulantes. Suas palavras são anuladas por suas vidas.

Integridade significa coerência interna. O que você é em público é o que é em privado. "Bem-aventurado o homem... em cujo espírito não há dolo" (Salmo 32:2). Não há máscara, fachada ou vida dupla. Transparência é liberdade.

A integridade é testada sob pressão. Crises revelam caráter. "A prova da vossa fé produz perseverança" (Tiago 1:3). Quando é difícil ser honesto, ser humilde, fazer o certo - aí a integridade é demonstrada ou exposta.

Falhas de integridade têm consequências desproporcionais. "A quem muito foi dado, muito lhe será exigido" (Lucas 12:48). Líderes são modelos; quando caem, arrastam outros. A responsabilidade é maior porque a influência é maior.`,
          references: "1 Pedro 5:1-4; Salmo 15; 78:72; Provérbios 11:3; 20:7; Lucas 12:48; Tito 2:7-8",
          questions: [
            "1. Por que integridade é fundamental?",
            "2. O que é coerência interna?",
            "3. Como a integridade é testada?",
            "4. Por que falhas de líderes são tão graves?",
            "5. Há áreas de incongruência em sua vida?"
          ],
          application: "Convide alguém próximo a apontar incongruências em sua vida. Ouça sem defensividade.",
          summary: "Integridade - coerência entre vida pública e privada - é base da liderança, testada sob pressão e crucial devido à influência do líder."
        },
        {
          title: "Liderança e Visão",
          content: `Líderes fornecem direção. "Não havendo visão, o povo se corrompe" (Provérbios 29:18). Sem direção clara, grupos vagam. Líderes discernem para onde Deus está guiando e comunicam essa direção.

A visão cristã vem de Deus, não de técnicas. Neemias orou antes de planejar (Neemias 1:4-11). A visão não é inventada; é recebida. Líderes buscam a Deus para entender Seu propósito antes de elaborar estratégias.

A visão deve ser comunicada claramente. "Escreve a visão e torna-a bem legível" (Habacuque 2:2). Visão confusa produz ação confusa. Líderes traduzem complexidade em clareza. Se as pessoas não entendem para onde vão, não chegarão.

A visão requer persistência. Obstáculos surgem; desânimo ataca. Neemias enfrentou oposição feroz, mas completou o muro em 52 dias. "Estou satisfazendo a uma grande obra, de modo que não poderei descer" (Neemias 6:3). Foco e determinação levam a visão à realidade.`,
          references: "Provérbios 29:18; Neemias 1-6; Habacuque 2:2-3; Hebreus 12:1-3; Filipenses 3:13-14",
          questions: [
            "1. Por que visão é necessária?",
            "2. De onde vem a visão cristã?",
            "3. Por que comunicação clara importa?",
            "4. Como Neemias exemplifica visão persistente?",
            "5. Qual é a visão de sua liderança?"
          ],
          application: "Escreva a visão que Deus deu para sua área de influência. Comunique-a claramente esta semana.",
          summary: "Líderes discernem a visão de Deus, comunicam-na claramente e persistem com foco até a realização, como Neemias exemplificou."
        },
        {
          title: "Liderança e Delegação",
          content: `Líderes eficazes delegam. Moisés quase esgotou-se até Jetro aconselhar: "Escolherás dentre todo o povo homens capazes... que julguem o povo" (Êxodo 18:21-22). Fazer tudo sozinho é insustentável e impede crescimento de outros.

Jesus delegou aos doze e aos setenta. "Enviou-os de dois em dois" (Marcos 6:7). Ele confiou missão antes de os discípulos estarem 'prontos'. Delegação é escola de liderança. Aprende-se fazendo, não apenas observando.

Delegação requer confiança e tolerância a erro. Os discípulos falharam repetidamente, mas Jesus continuou delegando. Perfeccionismo impede delegação. Líderes microgerenciadores sufocam potencial. Permita que outros aprendam através de erros.

Delegação libera para prioridades. Os apóstolos delegaram serviço de mesas para se dedicarem "à oração e ao ministério da palavra" (Atos 6:4). Nem tudo que você pode fazer é o que deve fazer. Líderes identificam e focam no essencial.`,
          references: "Êxodo 18:13-26; Marcos 6:7-13; Atos 6:1-7; 2 Timóteo 2:2; Números 11:16-17",
          questions: [
            "1. Por que Moisés precisou delegar?",
            "2. Como Jesus delegou?",
            "3. Por que tolerância a erro é necessária?",
            "4. O que delegação libera o líder para fazer?",
            "5. O que você precisa delegar?"
          ],
          application: "Identifique uma responsabilidade que você pode delegar. Treine alguém e confie a tarefa.",
          summary: "Delegação é essencial para sustentabilidade do líder e desenvolvimento de outros, exigindo confiança e tolerância a erros."
        },
        {
          title: "Liderança e Conflito",
          content: `Conflito é inevitável em qualquer grupo. A igreja primitiva teve conflitos - mesmo Paulo e Barnabé "tiveram contenda, a ponto de se separarem" (Atos 15:39). A questão não é se haverá conflito, mas como lidar com ele.

Jesus ensinou resolução direta. "Vai, e repreende-o entre ti e ele só" (Mateus 18:15). Não fofoca, não triangulação - confronto direto e privado primeiro. Muitos conflitos se resolvem neste estágio quando tratados com amor.

O objetivo é restauração, não punição. "Se te ouvir, ganhaste a teu irmão" (Mateus 18:15). O sucesso é ganhar a pessoa, não vencer a discussão. Conflito tratado corretamente fortalece relacionamentos; tratado errado, destrói.

Às vezes, líderes devem tomar decisões impopulares. Paulo confrontou Pedro publicamente quando necessário (Gálatas 2:11). Nem toda harmonia é saudável; paz falsa esconde problemas. Conflito produtivo traz questões à luz para resolução.`,
          references: "Mateus 18:15-17; Gálatas 2:11-14; Atos 15:36-41; Provérbios 27:6; Efésios 4:15, 25-27",
          questions: [
            "1. Conflito é sempre pecaminoso?",
            "2. Qual é o primeiro passo de Mateus 18?",
            "3. Qual é o objetivo da resolução de conflito?",
            "4. Quando confronto público é necessário?",
            "5. Como você normalmente lida com conflito?"
          ],
          application: "Se há conflito não resolvido em sua vida, dê o primeiro passo de Mateus 18 esta semana.",
          summary: "Conflito é inevitável; líderes o tratam com confronto direto e amoroso buscando restauração, às vezes tomando decisões difíceis."
        },
        {
          title: "Liderança e Prestação de Contas",
          content: `Líderes prestam contas a Deus e aos homens. "Todos havemos de comparecer ante o tribunal de Cristo" (2 Coríntios 5:10). Ninguém está acima de prestação de contas. Poder sem accountability corrompe.

Líderes bíblicos eram responsabilizáveis. Davi foi confrontado por Natã (2 Samuel 12). Pedro foi confrontado por Paulo (Gálatas 2). Reis tinham profetas; todos têm a Palavra. Ninguém lidera sozinho, sem supervisão.

Accountability requer vulnerabilidade. Líderes precisam de pessoas que possam falar verdade a eles. "Melhor é a repreensão franca do que o amor encoberto" (Provérbios 27:5). Cercar-se de bajuladores é receita para desastre.

Accountability protege o líder e os liderados. Líderes solitários são alvos fáceis para tentação e engano. Prestação de contas não é desconfiança; é sabedoria. "Onde não há conselho, fracassam os projetos" (Provérbios 15:22).`,
          references: "2 Coríntios 5:10; 2 Samuel 12:1-15; Gálatas 2:11; Provérbios 27:5-6; 15:22; Hebreus 13:17",
          questions: [
            "1. A quem líderes prestam contas?",
            "2. Dê exemplo bíblico de líder confrontado.",
            "3. Por que vulnerabilidade é necessária?",
            "4. Como accountability protege?",
            "5. Você tem pessoas que podem confrontá-lo?"
          ],
          application: "Identifique 2-3 pessoas a quem você pode prestar contas. Convide-os para esse papel.",
          summary: "Líderes prestam contas a Deus e a pessoas, precisando de vulnerabilidade e relacionamentos que permitam confronto amoroso."
        },
        {
          title: "Liderança e Formação de Líderes",
          content: `A maior tarefa do líder é desenvolver outros líderes. "O que de mim ouviste... transmite a homens fiéis, que sejam idôneos para também ensinarem a outros" (2 Timóteo 2:2). São quatro gerações: Paulo, Timóteo, homens fiéis, outros. Multiplicação, não apenas adição.

Jesus investiu profundamente em poucos. Três anos com doze; foco especial em Pedro, Tiago e João. Não tentou alcançar as massas diretamente, mas formou líderes que multiplicariam. Qualidade sobre quantidade no desenvolvimento.

Formação requer tempo e proximidade. Jesus chamou os doze "para que com ele estivessem" (Marcos 3:14). Antes de enviá-los, fez que estivessem com Ele. Líderes são formados em relacionamento, não em aula apenas.

O objetivo é que os formados superem o formador. "Quem crer em mim também fará as obras que eu faço; e as fará maiores" (João 14:12). Bons líderes celebram quando discípulos vão além. O sucesso de liderança é medido pelo sucesso dos desenvolvidos.`,
          references: "2 Timóteo 2:2; Marcos 3:13-14; João 14:12; Efésios 4:11-12; 1 Coríntios 4:14-17",
          questions: [
            "1. Qual é a maior tarefa do líder?",
            "2. Quantas gerações 2 Timóteo 2:2 menciona?",
            "3. Por que Jesus focou em poucos?",
            "4. O que 'estar com Ele' ensina sobre formação?",
            "5. Quem você está formando?"
          ],
          application: "Identifique 2-3 pessoas em quem você pode investir intencionalmente. Comece a se reunir com elas.",
          summary: "A maior tarefa do líder é multiplicar líderes através de investimento profundo em poucos, visando que eles superem o mentor."
        },
        {
          title: "Liderança e Perseverança",
          content: `Liderança é maratona, não corrida curta. "Não nos cansemos de fazer o bem, pois a seu tempo ceifaremos" (Gálatas 6:9). Muitos começam bem, mas poucos terminam. Perseverança distingue líderes duradouros.

Os desafios são constantes. Paulo listou: "Em trabalhos, muito mais; em açoites, mais do que eles; em prisões, muito mais" (2 Coríntios 11:23). Liderança traz oposição, decepção, cansaço. Quem espera facilidade desistirá.

A fonte de perseverança é Deus, não força própria. "Tudo posso naquele que me fortalece" (Filipenses 4:13). Paulo não era super-homem; dependia de Cristo. A fraqueza levava à força: "Quando estou fraco então sou forte" (2 Coríntios 12:10).

O exemplo final é Jesus. "Considerai aquele que suportou tanta oposição... para que não vos canseis" (Hebreus 12:3). Quando tentados a desistir, olhamos para quem completou a carreira. Ele perseverou até o fim; nós também podemos.`,
          references: "Gálatas 6:9; 2 Coríntios 11:23-28; 12:9-10; Filipenses 4:13; Hebreus 12:1-3; 2 Timóteo 4:7",
          questions: [
            "1. Liderança é curta ou longa jornada?",
            "2. Que desafios Paulo enfrentou?",
            "3. Qual é a fonte de perseverança?",
            "4. Como a fraqueza se relaciona com força?",
            "5. O que olhar para Jesus nos dá?"
          ],
          application: "Identifique uma área onde você está tentado a desistir. Renove seu compromisso com os olhos em Cristo.",
          summary: "Liderança requer perseverança através de desafios constantes, encontrando força em Cristo e olhando para Seu exemplo de fidelidade."
        }
      ])
    }
  ]
};

export const NIVEL_2_MODULOS_11_15: ModuleData[] = [
  MODULO_11_HAMARTIOLOGIA,
  MODULO_12_ETICA,
  MODULO_13_APOLOGETICA,
  MODULO_14_ADORACAO,
  MODULO_15_LIDERANCA
];
