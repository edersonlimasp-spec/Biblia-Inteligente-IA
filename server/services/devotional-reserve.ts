import type { DevotionalContent, DevotionalRoutine } from "@shared/devotional";
import { devotionalVerseSnapshot } from "./devotional-verse-snapshots";

// Editorial reserve explicitly commissioned for this experience. Scripture is
// never generated: references are resolved against the app's Bible database.
type Seed = { title: string; book: string; chapter: number; verse: number; endVerse?: number; strong: string; reflection: string; action: string; prayer: string; question: string; nightTitle: string; nightPrayer: string };
export const devotionalReserve: Seed[] = [
  {
    title: "Você não caminha sozinho", book: "psa", chapter: 23, verse: 1, strong: "H7462",
    reflection: "Davi descreve o Senhor como pastor. Essa imagem fala de cuidado, direção e presença, não de uma vida sem dificuldades. A ovelha depende de alguém que conhece o caminho e percebe suas necessidades. Ao começar este dia, você pode reconhecer essa dependência sem vergonha. Confiar em Deus não significa deixar de trabalhar, procurar ajuda ou tomar decisões responsáveis. Significa não carregar tudo como se o mundo estivesse apoiado apenas nos seus ombros.\n\nTalvez você acorde com uma lista grande e pouca disposição. Antes de correr, apresente a Deus uma preocupação concreta. Leia o versículo novamente e observe quem ocupa o centro da frase: o Senhor. Suas necessidades importam, mas elas não precisam governar todos os seus pensamentos. A presença do Pastor pode orientar o próximo passo, mesmo quando o restante do caminho ainda não está claro.\n\nHoje, procure fazer uma coisa de cada vez. Receba com gratidão o cuidado que chega pela Palavra, por uma conversa e por uma ajuda simples. Você pode caminhar com responsabilidade e, ao mesmo tempo, descansar na fidelidade de Deus.",
    action: "Escolha uma preocupação e ore por ela antes de abrir suas mensagens. Depois, faça o próximo passo possível.",
    prayer: "Senhor, reconheço que preciso do teu cuidado. Orienta minhas decisões e ajuda-me a caminhar com confiança, sem tentar controlar tudo. Amém.",
    question: "Em qual situação preciso deixar de carregar tudo sozinho?",
    nightTitle: "Descansar no cuidado do Pastor", nightPrayer: "Senhor, obrigado por teu cuidado neste dia. Entrego o que ficou incompleto e descanso na tua presença. Amém.",
  },
  {
    title: "Um lugar seguro em dias difíceis", book: "psa", chapter: 46, verse: 1, strong: "H4268",
    reflection: "O salmista não escreve que a angústia desapareceu. Ele declara que Deus está presente nela. Refúgio não é uma promessa de que nada dará errado; é a certeza de que podemos nos voltar ao Senhor quando o chão parece instável. Essa diferença importa. Às vezes esperamos sentir tranquilidade antes de orar, quando justamente a inquietação pode ser levada a Deus.\n\nComece este dia nomeando o que tem assustado você. Não é necessário encontrar palavras bonitas. Uma oração sincera pode ser curta: Senhor, estou preocupado com isto. Depois, procure distinguir o que pede uma atitude sua e o que está fora do seu alcance. Buscar refúgio em Deus também pode incluir receber apoio de pessoas responsáveis, conversar com alguém de confiança e procurar cuidado profissional quando necessário.\n\nVocê não precisa provar força escondendo o cansaço. O texto aponta para Deus como fonte de socorro, não para nossa capacidade de enfrentar tudo sem ajuda. Em meio às tarefas de hoje, faça pequenas pausas para lembrar dessa verdade. Há espaço para a sua fragilidade diante do Senhor, e há um próximo passo que pode ser dado com esperança.",
    action: "Converse com alguém de confiança sobre uma dificuldade e peça uma ajuda concreta.",
    prayer: "Deus, meu refúgio, acolhe minhas preocupações e dá-me coragem para pedir ajuda e agir com sabedoria. Amém.",
    question: "Qual dificuldade tenho tentado esconder em vez de apresentar a Deus?",
    nightTitle: "Refúgio para o coração cansado", nightPrayer: "Senhor, receba minhas inquietações. Ajuda-me a repousar sem negar o que sinto, confiando no teu cuidado. Amém.",
  },
  {
    title: "A graça para este dia", book: "mat", chapter: 6, verse: 34, strong: "G2250",
    reflection: "Jesus nos chama a prestar atenção ao dia de hoje. Ele não condena o planejamento responsável. O ensino confronta a ansiedade que nos faz viver antecipadamente problemas que ainda não chegaram. Quando tentamos resolver todos os amanhãs ao mesmo tempo, perdemos a disposição para o bem que está diante de nós agora.\n\nPense nas tarefas desta manhã. Algumas precisam de cuidado real; outras são cenários que sua mente repete sem conseguir transformá-los em ação. Faça essa distinção com gentileza. Anote o que exige uma decisão e escolha um passo pequeno. O que não pode ser resolvido hoje pode ser apresentado ao Senhor em oração. Se a ansiedade estiver persistente, buscar apoio também é uma atitude de cuidado, não falta de fé.\n\nVocê não recebeu a responsabilidade de sustentar o futuro inteiro. Recebeu oportunidades de amar, trabalhar e servir neste dia. Talvez o passo mais fiel seja terminar uma tarefa, ouvir alguém ou descansar por alguns minutos. Volte ao versículo sempre que perceber que sua atenção fugiu para um amanhã distante. Caminhar com Deus inclui aprender a estar presente no tempo que temos.",
    action: "Anote três prioridades possíveis para hoje. Faça a primeira sem tentar resolver toda a semana.",
    prayer: "Pai, ajuda-me a cuidar do que cabe a este dia e a entregar o futuro a ti. Dá-me presença e responsabilidade. Amém.",
    question: "Que preocupação com o amanhã tem roubado minha atenção de hoje?",
    nightTitle: "O amanhã pode esperar", nightPrayer: "Pai, entrego a ti o amanhã. Obrigado pelo que pude viver hoje; ensina-me a descansar sem antecipar todas as respostas. Amém.",
  },
  {
    title: "Aprender a viver com sabedoria", book: "psa", chapter: 90, verse: 12, strong: "H2451",
    reflection: "Esta oração pede que Deus nos ensine a contar os nossos dias. Não é um convite para viver apressado, mas para reconhecer que o tempo é precioso. Um coração sábio aprende a distinguir o urgente do importante e a valorizar aquilo que permanece: a comunhão com Deus, o amor ao próximo e a fidelidade nas pequenas escolhas.\n\nAo olhar sua agenda, pergunte o que merece sua melhor atenção. Há uma conversa que você vem adiando? Um pedido de perdão? Um hábito que ocupa tempo sem oferecer descanso verdadeiro? Não é necessário reorganizar a vida inteira nesta manhã. Escolha uma decisão que aproxime seu dia dos valores que a Palavra apresenta.\n\nContar os dias também nos lembra que não somos ilimitados. Dormir, alimentar-se e aceitar ajuda não são desperdício de tempo. São formas de reconhecer nossa condição humana. A sabedoria bíblica não transforma cada minuto numa cobrança de produtividade; ela nos orienta a viver com reverência e propósito. Peça ao Senhor um coração atento. Depois, ofereça presença real a uma tarefa e a uma pessoa que estarão no seu caminho hoje.",
    action: "Separe dez minutos sem celular para dar atenção a alguém importante.",
    prayer: "Senhor, ensina-me a usar meu tempo com sabedoria, amor e humildade. Que eu não esqueça o que realmente importa. Amém.",
    question: "A quem ou a quê preciso oferecer mais presença?",
    nightTitle: "Reconhecer o valor deste dia", nightPrayer: "Senhor, obrigado pelo tempo recebido. Perdoa minha distração e ensina-me a viver com um coração sábio. Amém.",
  },
  {
    title: "Confiar sem ter todas as respostas", book: "pro", chapter: 3, verse: 5, strong: "H982",
    reflection: "Confiar no Senhor de todo o coração não significa desprezar o conhecimento ou parar de pensar. O provérbio nos alerta contra fazer do nosso próprio entendimento a autoridade final. Nossa visão é limitada. Vemos uma parte da história, enquanto Deus conhece aquilo que ainda não podemos perceber.\n\nTalvez hoje você precise tomar uma decisão. Antes de agir apenas por impulso, apresente a situação ao Senhor. Examine se sua escolha combina com os princípios das Escrituras: honestidade, justiça, amor e responsabilidade. Ouvir uma pessoa madura pode ajudar. A confiança em Deus não elimina a necessidade de avaliar consequências; ela muda a postura com que fazemos essa avaliação.\n\nTambém haverá situações em que nenhuma resposta estará disponível agora. Nesse espaço, você pode permanecer fiel ao que já sabe ser correto. Não precisa chamar de direção divina toda impressão ou coincidência. A Palavra oferece um fundamento mais seguro do que a pressa de encontrar sinais. Dê o passo possível com humildade e permita-se aprender. Confiar inclui reconhecer limites, corrigir o caminho quando necessário e lembrar que não estamos sozinhos diante das escolhas da vida.",
    action: "Antes de uma decisão importante, leia o versículo e peça conselho a uma pessoa madura e confiável.",
    prayer: "Senhor, livra-me da autossuficiência. Ajuda-me a decidir com honestidade e a confiar em ti quando minhas respostas forem limitadas. Amém.",
    question: "Em qual decisão preciso de mais humildade para ouvir?",
    nightTitle: "Entregar o que não compreendo", nightPrayer: "Senhor, entrego o que ainda não compreendo. Guarda meu coração da pressa e ajuda-me a descansar com humildade. Amém.",
  },
  {
    title: "Um começo sustentado pela misericórdia", book: "lam", chapter: 3, verse: 22, endVerse: 23, strong: "H2617",
    reflection: "Estas palavras aparecem num livro marcado por sofrimento. A esperança não nasce porque tudo ficou fácil, mas porque o autor se lembra da misericórdia e da fidelidade do Senhor. Por isso, um novo dia não precisa ser uma promessa de desempenho perfeito. Ele pode ser recebido como oportunidade de voltar a Deus com sinceridade.\n\nTalvez ontem você tenha falhado numa conversa, numa escolha ou numa tarefa. Reconheça o que precisa ser reparado, sem transformar o erro na definição de quem você é. A misericórdia não elimina a responsabilidade. Ela nos dá espaço para arrependimento, reconciliação e recomeço. Quando for necessário, peça perdão de maneira clara e procure mudar uma atitude concreta.\n\nAo iniciar esta manhã, agradeça por algo que você recebeu sem conseguir produzir sozinho: a vida, o cuidado de alguém, uma oportunidade de aprender. A gratidão pode ajudar a perceber a fidelidade de Deus em gestos pequenos. Você não precisa fingir que o sofrimento não existe para ter esperança. Pode apresentar a dor ao Senhor e, ainda assim, escolher o bem possível hoje. A Palavra nos convida a lembrar da misericórdia, especialmente quando o coração esquece.",
    action: "Repare uma pequena falha de ontem: peça perdão, cumpra um compromisso ou retome uma tarefa abandonada.",
    prayer: "Senhor, obrigado pela tua misericórdia. Dá-me humildade para reconhecer meus erros e disposição para recomeçar de maneira responsável. Amém.",
    question: "Qual recomeço concreto posso fazer hoje?",
    nightTitle: "Misericórdia ao encerrar o dia", nightPrayer: "Senhor, recebe minha gratidão e meu arrependimento. Sustenta meu descanso com tua misericórdia e fidelidade. Amém.",
  },
  {
    title: "Esperança para renovar as forças", book: "isa", chapter: 40, verse: 31, strong: "H6960",
    reflection: "O texto fala a pessoas que conhecem o cansaço. Esperar no Senhor não é simplesmente ficar parado, nem garantir que nosso corpo nunca sentirá limites. É colocar a esperança em Deus e aprender a caminhar sustentados por sua fidelidade. Até uma pessoa dedicada precisa reconhecer quando suas forças estão diminuindo.\n\nNesta manhã, observe como você está. Há sono acumulado? Muitas responsabilidades? Uma tristeza que pede conversa? Apresentar esses limites a Deus é um gesto de verdade. Se for possível, reduza uma exigência desnecessária e organize uma pausa. A oração não substitui o cuidado com a saúde; ela pode nos ajudar a recebê-lo com humildade.\n\nA imagem de caminhar sem desfalecer lembra que a perseverança nem sempre tem aparência extraordinária. Às vezes, ela se manifesta em cumprir o básico com honestidade e aceitar que hoje não será possível fazer tudo. Não compare seu ritmo com o de outra pessoa. Procure fidelidade no próximo passo. Ao longo do dia, volte ao Senhor com uma oração simples, receba apoio e faça espaço para descanso. A esperança bíblica pode acompanhar tanto o trabalho quanto a pausa necessária.",
    action: "Agende uma pausa real hoje e avise alguém se precisar dividir uma responsabilidade.",
    prayer: "Senhor, renova minha esperança. Ensina-me a reconhecer meus limites e a perseverar sem desprezar o descanso e o cuidado. Amém.",
    question: "Que limite preciso reconhecer com honestidade?",
    nightTitle: "A pausa também é cuidado", nightPrayer: "Senhor, recebo este descanso com gratidão. Renova minhas forças e ajuda-me a não confundir cansaço com falta de valor. Amém.",
  },
  {
    title: "Transformar preocupação em oração", book: "php", chapter: 4, verse: 6, endVerse: 7, strong: "G1515",
    reflection: "Paulo convida a apresentar pedidos a Deus com ações de graças. O convite não exige esconder sentimentos difíceis. Ele oferece um caminho para lidar com eles: falar com o Senhor de maneira concreta e lembrar dos cuidados já recebidos. A paz descrita no texto guarda o coração em Cristo; não é uma garantia de que todas as circunstâncias serão resolvidas imediatamente.\n\nEscolha uma preocupação desta manhã. Escreva uma frase sobre ela e transforme essa frase numa oração. Depois, lembre de uma razão específica para agradecer. Essa prática simples não precisa eliminar a inquietação de uma vez. Pode ajudar você a interromper o ciclo de pensar sozinho sobre o mesmo problema.\n\nQuando houver uma atitude possível, tome-a com responsabilidade. Quando precisar de apoio, procure-o. A fé não nos obriga a enfrentar ansiedade persistente sem cuidado adequado. O texto nos orienta a uma relação de confiança, na qual pedidos e gratidão podem caminhar juntos. Volte a essa oração durante o dia, especialmente antes de uma conversa difícil ou de uma decisão. Você pode falar com Deus sem escolher entre a sinceridade e a esperança.",
    action: "Escreva um pedido e uma gratidão. Ore por ambos antes da primeira tarefa importante.",
    prayer: "Pai, apresento minhas preocupações e agradeço por teu cuidado. Guarda meu coração em Cristo e orienta minhas atitudes. Amém.",
    question: "Qual pedido preciso apresentar a Deus hoje?",
    nightTitle: "Pedidos e gratidão antes do repouso", nightPrayer: "Pai, recebe meus pedidos e minha gratidão. Guarda meu coração em Cristo enquanto descanso. Amém.",
  },
  {
    title: "Ouvir antes de responder", book: "jas", chapter: 1, verse: 19, strong: "G191",
    reflection: "Tiago apresenta uma orientação muito prática: disposição para ouvir, cuidado ao falar e lentidão para se irar. Num dia cheio de mensagens e opiniões, essa sabedoria pode mudar o ambiente de uma casa ou de uma conversa. Ouvir não significa concordar com tudo. Significa dar à outra pessoa a atenção necessária antes de oferecer uma resposta.\n\nPense numa conversa que provavelmente acontecerá hoje. Talvez você já tenha preparado uma defesa antes de conhecer o que o outro deseja dizer. Peça ao Senhor ajuda para abandonar essa pressa. Faça uma pergunta sincera e escute a resposta até o fim. Quando precisar discordar, procure falar com clareza, sem humilhar.\n\nTambém vale perceber o que acontece no seu próprio coração. Cansaço e preocupação podem tornar uma reação mais intensa. Uma pausa breve permite responder com mais responsabilidade. Isso não exige aceitar violência ou permanecer numa situação insegura; limites respeitosos também fazem parte do cuidado. O ensino bíblico nos chama a uma postura que considera o próximo. Hoje, uma resposta mais calma pode ser uma forma concreta de amar. Comece com uma conversa, não com a cobrança de acertar todas.",
    action: "Em uma conversa hoje, deixe a pessoa terminar e faça uma pergunta antes de responder.",
    prayer: "Senhor, dá-me um coração disposto a ouvir e palavras que expressem verdade com respeito. Ajuda-me a agir sem ferir por impulso. Amém.",
    question: "Em qual relacionamento preciso ouvir melhor?",
    nightTitle: "Acolher o silêncio da noite", nightPrayer: "Senhor, perdoa as palavras impensadas e ajuda-me a reparar o que feriu. Que meu coração encontre descanso em ti. Amém.",
  },
  {
    title: "Fidelidade nas tarefas pequenas", book: "col", chapter: 3, verse: 23, strong: "G5590",
    reflection: "Paulo orienta a fazer o trabalho de coração, como para o Senhor. Essa perspectiva pode dar propósito a tarefas que parecem pequenas ou repetitivas. O valor de uma atitude não depende apenas de receber elogios. Honestidade, cuidado e disposição para servir também importam quando ninguém está observando.\n\nAo começar o dia, escolha uma tarefa simples para realizar com atenção. Pode ser preparar uma refeição, cumprir um prazo, organizar um espaço ou ajudar alguém. Fazer de coração não significa buscar perfeição ou aceitar exigências injustas. O descanso e os limites continuam necessários. O convite é agir com integridade dentro das responsabilidades que realmente cabem a você.\n\nHá dias em que uma comparação tira a alegria do que fazemos. Lembre que você não precisa transformar toda atividade numa prova de valor pessoal. Em Cristo, o serviço pode ser expressão de gratidão, não tentativa de conquistar amor por desempenho. Antes de iniciar a tarefa escolhida, ore brevemente. Depois, faça o possível com cuidado e aceite concluir sem perfeccionismo. Uma vida fiel é construída também por decisões pequenas, repetidas com amor e responsabilidade no cotidiano.",
    action: "Faça uma tarefa cotidiana com atenção, sem distrações, como gesto de serviço a alguém.",
    prayer: "Senhor, ajuda-me a trabalhar com integridade e a servir com amor, sem medir meu valor pelo desempenho. Amém.",
    question: "Que tarefa simples pode se tornar um gesto de amor hoje?",
    nightTitle: "Descansar sem cobrar perfeição", nightPrayer: "Senhor, obrigado pelo trabalho possível hoje. Recebe meu serviço e ajuda-me a descansar sem cobranças desnecessárias. Amém.",
  },
  {
    title: "Continuar fazendo o bem", book: "gal", chapter: 6, verse: 9, strong: "G1573",
    reflection: "Fazer o bem pode cansar, especialmente quando os resultados demoram. Paulo encoraja a perseverança, mas não transforma o tempo de Deus numa fórmula para conseguir o que desejamos. A imagem da colheita aponta para a importância de continuar vivendo de maneira fiel, mesmo quando o fruto não é visível agora.\n\nTalvez você esteja desanimado com um cuidado constante, uma tentativa de reconciliação ou um trabalho pouco reconhecido. Apresente esse cansaço ao Senhor. Pergunte qual gesto de bondade é possível hoje, dentro de limites saudáveis. Perseverar não é permitir abuso nem assumir sozinho responsabilidades que devem ser compartilhadas. Há situações em que pedir ajuda e estabelecer limites é o passo mais responsável.\n\nPense em algo pequeno que não dependa de aplausos: uma mensagem de encorajamento, uma atitude justa, uma ajuda oferecida com respeito. Esses gestos não precisam resolver tudo para ter valor. O texto nos convida a não abandonar o bem por causa da demora. Faça o possível e entregue os resultados a Deus. Também receba cuidado, porque quem serve continua sendo uma pessoa que precisa de descanso, amizade e apoio.",
    action: "Faça um gesto de bondade sem esperar reconhecimento e aceite ajuda numa responsabilidade sua.",
    prayer: "Senhor, sustenta minha disposição para o bem. Dá-me perseverança, limites saudáveis e humildade para receber cuidado. Amém.",
    question: "Qual pequeno gesto de bondade ainda posso escolher?",
    nightTitle: "Entregar os frutos a Deus", nightPrayer: "Senhor, entrego os resultados do meu dia. Obrigado pelo bem possível; ensina-me a descansar e a perseverar com sabedoria. Amém.",
  },
  {
    title: "Escolher o caminho da paz", book: "mat", chapter: 5, verse: 9, strong: "G1518",
    reflection: "Jesus chama bem-aventurados os pacificadores. Promover a paz é mais do que evitar qualquer conversa difícil. Às vezes, exige dizer a verdade com respeito, interromper uma fofoca ou buscar uma reconciliação possível. A paz bíblica não depende de esconder a injustiça; ela considera a dignidade das pessoas envolvidas.\n\nAo pensar nos relacionamentos de hoje, identifique uma atitude que pode diminuir uma tensão desnecessária. Talvez seja perguntar antes de julgar, esclarecer uma mensagem ou pedir perdão por algo específico. Procure agir sem tentar controlar a resposta do outro. Você é responsável pela sua postura, não por garantir que toda conversa termine como deseja.\n\nHá conflitos que precisam de tempo, mediação ou proteção. Não use este versículo para permanecer numa situação de violência. Buscar segurança é legítimo. Dentro do que for seguro e possível, escolha palavras que não aumentem a hostilidade. A Palavra de Jesus pode orientar um gesto pequeno, mas real. Ore por sabedoria antes da conversa e esteja disposto a escutar. Promover a paz começa muitas vezes com abandonar a vontade de vencer para procurar uma relação mais verdadeira e respeitosa.",
    action: "Não repasse uma fofoca. Em vez disso, escolha uma palavra verdadeira de respeito ou encorajamento.",
    prayer: "Senhor, orienta minhas palavras e atitudes para a paz. Dá-me coragem para a verdade e cuidado com a dignidade do próximo. Amém.",
    question: "Que atitude minha pode diminuir uma tensão hoje?",
    nightTitle: "Repousar sem alimentar conflitos", nightPrayer: "Senhor, entrego os conflitos deste dia. Mostra o que preciso reparar e guarda meu coração de alimentar a hostilidade. Amém.",
  },
  {
    title: "Aproximar-se de Deus com confiança", book: "heb", chapter: 4, verse: 16, strong: "G5485",
    reflection: "O convite a aproximar-se do trono da graça está ligado a Jesus, nosso sumo sacerdote. A confiança não nasce de uma vida impecável, mas de quem Cristo é. Podemos apresentar necessidades reais a Deus sem esconder a fraqueza. O texto fala de misericórdia e socorro em tempo oportuno, não de uma negociação para obter tudo o que pedimos.\n\nNesta manhã, permita-se orar de maneira simples. Diga ao Senhor onde precisa de ajuda e onde precisa reconhecer um erro. Se faltarem palavras, leia o versículo lentamente. Uma oração pequena, feita com sinceridade, não vale menos por não ser elaborada. O encontro com Deus não é um teste de eloquência.\n\nReceber graça também pode nos tornar mais pacientes com outras pessoas. Quando lembramos de nossa própria necessidade de misericórdia, diminui a disposição para tratar o próximo apenas por suas falhas. Escolha um gesto de acolhimento hoje, sem deixar de agir com verdade. A Palavra oferece um caminho de aproximação, arrependimento e esperança. Você pode começar o dia diante de Deus exatamente como está, confiando em Cristo e disposto a ser orientado pelas Escrituras.",
    action: "Reserve dois minutos para uma oração sincera, nomeando uma necessidade e um motivo de arrependimento.",
    prayer: "Pai, aproximo-me de ti confiando em Cristo. Recebe minhas necessidades e ajuda-me a viver com gratidão pela tua graça. Amém.",
    question: "O que tenho dificuldade de apresentar a Deus com sinceridade?",
    nightTitle: "Graça para encerrar o dia", nightPrayer: "Pai, obrigado pela graça em Cristo. Recebe minha oração e ajuda-me a repousar sem esconder minhas necessidades de ti. Amém.",
  },
  {
    title: "Permanecer perto de Cristo", book: "jhn", chapter: 15, verse: 5, strong: "G3306",
    reflection: "Jesus usa a imagem da videira e dos ramos para falar de nossa relação com ele. O ramo não produz vida separado da planta. Esse ensino nos convida a reconhecer a dependência de Cristo, em vez de transformar a fé apenas numa lista de tarefas religiosas. Permanecer envolve atenção à sua Palavra e uma vida orientada por seu amor.\n\nTalvez sua rotina esteja tão cheia que o tempo com Deus se tornou mais uma obrigação apressada. Hoje, procure uma pausa breve, mas verdadeira. Leia o versículo, observe o que Jesus afirma sobre si mesmo e apresente seu dia em oração. Não é a duração da pausa que cria uma medida do seu valor. O importante é voltar o coração a Cristo com sinceridade.\n\nEssa relação também se expressa no modo como tratamos as pessoas. O fruto não se limita a um sentimento durante a leitura; pode aparecer em paciência, honestidade e serviço. Escolha um desses caminhos numa situação concreta. Quando se distrair ou falhar, volte novamente. Permanecer não significa nunca enfrentar dificuldade, mas continuar reconhecendo em Cristo a fonte da vida e da direção que precisamos para caminhar.",
    action: "Faça uma pausa sem telas para ler o versículo novamente e escolha um gesto de paciência com alguém.",
    prayer: "Jesus, ajuda-me a permanecer em ti e a ouvir tua Palavra. Que minha vida expresse teu amor em atitudes concretas. Amém.",
    question: "Que espaço posso abrir para a Palavra de Cristo na minha rotina?",
    nightTitle: "Permanecer também no descanso", nightPrayer: "Jesus, obrigado por tua presença. Entrego este dia e descanso lembrando que minha vida depende de ti. Amém.",
  },
];

export function reserveForDate(date: string, routine: DevotionalRoutine): DevotionalContent {
  const index = ((Math.floor(Date.parse(`${date}T00:00:00Z`) / 86400000) % 14) + 14) % 14;
  const seed = devotionalReserve[index];
  return {
    date, routine, title: routine === "manha" ? seed.title : seed.nightTitle,
    book: routine === "manha" ? seed.book : "psa",
    chapter: routine === "manha" ? seed.chapter : 4,
    verse: routine === "manha" ? seed.verse : 8,
    endVerse: routine === "manha" ? seed.endVerse ?? null : null,
    reflection: routine === "manha" ? seed.reflection : "Ao encerrar o dia, leia este Salmo sem pressa. A confiança do salmista não depende de ter resolvido tudo, mas do cuidado do Senhor. Reconheça um motivo de gratidão, entregue uma preocupação e considere o que precisa de perdão ou reparação. Não há obrigação de escrever: este espaço é um apoio à oração. Se algo ficou difícil, apresente-o a Deus com sinceridade. Descansar não é abandonar a responsabilidade; é reconhecer nossos limites diante daquele que cuida de nós.",
    strongNumber: routine === "manha" ? seed.strong : "H7965",
    action: seed.action, prayer: routine === "manha" ? seed.prayer : seed.nightPrayer,
    question: routine === "manha" ? seed.question : "O que desejo apresentar a Deus antes de descansar?",
    verseText: devotionalVerseSnapshot(routine === "manha" ? seed : { book: "psa", chapter: 4, verse: 8 }),
    verseVersion: "ACF",
    status: "aprovado",
  };
}