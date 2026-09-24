/* Reproducible editorial compilation. Run from repository root.
 * Inputs are the retained, publicly downloaded source files beside this file.
 * Coordinates are source representative points, NOT surveyed ancient boundaries.
 */
const fs = require("node:fs");
const path = require("node:path");
const dir = "docs/atlas/evidence";
const rows = new Map(fs.readFileSync(`${dir}/openbible-merged.txt`, "utf8").split(/\r?\n/).filter(x => x && !x.startsWith("#")).map(x => [x.split("\t")[0], x.split("\t")]));
const date = new Date().toISOString().slice(0, 10);
const ref = (book, chapter, verseStart, verseEnd) => ({book, chapter, verseStart, ...(verseEnd ? {verseEnd} : {}), label: `${book} ${chapter}:${verseStart}${verseEnd ? `–${verseEnd}` : ""}`});
const r = ref;
const ob = {id:"openbible", title:"OpenBible.info — Bible Geocoding, merged dataset (2007)", url:"https://www.openbible.info/geo/data/merged.txt", license:"CC BY 4.0; atribuição: OpenBible.info. A versão histórica de 2007 é usada, não o cadastro atual.", note:"Pontos representativos extraídos das linhas nominais preservadas em docs/atlas/evidence/openbible-merged.txt. A precisão decimal da fonte não equivale a precisão arqueológica. Identificações antigas não são certificadas por este banco."};
const editorial = {id:"editorial", title:"Geometria editorial original e método de compilação", url:"https://www.openbible.info/geo/", license:"Geometria original desta compilação; nenhum mapa ou imagem de terceiros copiado. Dados de apoio: OpenBible.info, CC BY 4.0.", note:"Polilinhas ligam pontos apenas para leitura; polígonos são envelopes didáticos desenhados nesta compilação, não fronteiras antigas ou atuais. O endereço documenta o geocodificador de apoio, não publica nem endossa estes desenhos. Método e vértices no repositório."};
function p(key, id, name, modernName, references, explanation, certainty="established") {
  const row = rows.get(key);
  if (!row) throw new Error(`Missing OpenBible row: ${key}`);
  const coords = [Number(row[3].replace(/[~<>?]/g,"")),Number(row[2].replace(/[~<>?]/g,""))];
  if (coords.some(x => !Number.isFinite(x))) throw new Error(`Invalid coordinates: ${key}`);
  return {id, name, modernName, coordinates:coords, certainty, explanation:`${explanation} Ponto representativo da localidade, não limite urbano antigo.`, references, sourceIds:["openbible"], _key:key};
}
function pleiades(id, key, name, modernName, references, explanation) {
  const data = JSON.parse(fs.readFileSync(`${dir}/pleiades-${id}.json`,"utf8"));
  return {id:key, name, modernName, coordinates:data.reprPoint, certainty:"established", explanation:`${explanation} Centro representativo do registro Pleiades; não delimita a cidade antiga.`, references, sourceIds:[`pleiades-${id}`], _pleiades:id};
}
const jer = () => p("Jerusalem","jerusalem","Jerusalém","Jerusalém; a Cidade Velha fica em Jerusalém Oriental",[r("Matt",21,10)],"Centro da Judeia sob domínio romano; a situação política atual não é projetada sobre o século I.");
const shechem = () => p("Shechem","shechem","Siquém","Tell Balata, junto a Nablus, Cisjordânia",[r("Gen",12,6),r("Josh",24,1)],"O sítio de Tell Balata é a identificação arqueológica usual de Siquém.");
const heb = () => p("Hebron","hebron","Hebrom","Al-Khalil/Hebrom, Cisjordânia",[r("Gen",13,18),r("Josh",14,13)],"O ponto localiza a cidade associada às narrativas patriarcais e à tradição de Calebe; não identifica a tenda de Abraão.");
const dan = () => p("Dan","dan","Dã","Tel Dan, norte de Israel",[r("Josh",19,47),r("1Kgs",12,29)],"Tell el-Qadi/Tel Dan é a identificação corrente; o mapa não resolve as etapas de migração narradas.");
const beth = () => p("Bethlehem 1","bethlehem","Belém","Bayt Lahm/Belém, Cisjordânia",[r("Matt",2,1)],"Belém da Judeia, distinta da localidade homônima da Galileia.");
const ant = () => p("Antioch 1","antioch","Antioquia da Síria","Antakya, província de Hatay, Turquia",[r("Acts",13,1),r("Acts",14,26)],"Cidade de partida e retorno de Paulo e Barnabé; 'da Síria' é a designação histórica, não o país atual.");
const ephesus = () => pleiades("599612","ephesus","Éfeso","Sítio de Efes, perto de Selçuk, Turquia",[r("Rev",2,1),r("Acts",19,1)],"Metrópole da província romana da Ásia. O ponto difere do geocódigo legado do OpenBible porque cada base escolhe um representante do sítio.");
const maps = [];
const organization = {
 "ancient-near-east":["old-testament","Origens e patriarcas",1],
 "abraham-journeys":["old-testament","Origens e patriarcas",2],
 "exodus-hypotheses":["old-testament","Êxodo e deserto",3],
 "twelve-tribes":["old-testament","Conquista e juízes",4],
 "divided-kingdom":["old-testament","Reino dividido",5],
 "jerusalem-jesus":["jerusalem","Tempo de Jesus",1],
 "palestine-jesus":["new-testament","Vida de Jesus",1],
 "paul-first-journey":["new-testament","Viagens de Paulo",2],
 "seven-churches":["new-testament","Epístolas e Apocalipse",3],
 "roman-empire":["new-testament","Igreja primitiva",4],
};
const shortEras = {
 "ancient-near-east":"II–I milênios a.C.", "abraham-journeys":"Horizonte patriarcal",
 "exodus-hypotheses":"II–I milênios a.C.", "twelve-tribes":"Instalação em Canaã",
 "divided-kingdom":"c. 930–587 a.C.", "jerusalem-jesus":"c. 20–33 d.C.",
 "palestine-jesus":"c. 6 a.C.–30 d.C.", "paul-first-journey":"c. 46–48 d.C.",
 "seven-churches":"c. 90–96 d.C.", "roman-empire":"Século I d.C.",
};
function add(id,title,subtitle,testament,books,characters,period,bounds,summary,modernSummary,places,overlays,references,uncertainties,status="needs-specialist") {
  const [section, subsection, order] = organization[id] || [testament === "AT" ? "old-testament" : "new-testament", undefined, 99];
  const keyReferences = [...references];
  for (const place of places) for (const candidate of place.references) {
    if (keyReferences.length >= 3) break;
    if (!keyReferences.some(existing => existing.label === candidate.label)) keyReferences.push(candidate);
  }
  const aliases = [...new Set([title, ...characters, ...places.flatMap(place => [place.name, place.modernName])])];
  maps.push({id,version:"1",kind:"map",category:testament==="AT"?"Geografia do Antigo Testamento":"Geografia do Novo Testamento",testament,books,characters,period,title,subtitle,summary,modernSummary,certainty:status==="documented"?"established":"debated",sample:true,keywords:[title,...books,...characters,"atlas","amostra","geografia histórica"],section,subsection,order,era:shortEras[id] || period.split(";")[0],modernOverview:`${modernSummary} As fronteiras e os nomes atuais são exibidos apenas como orientação geográfica. Cidades modernas são pontos de referência aproximados e não provam a localização de eventos antigos.`,keyReferences:keyReferences.slice(0,8),aliases,references,sources:[],places,overlays,bounds,review:{date,status,verified:["Pontos transcritos de registros públicos retidos no repositório; latitude/longitude convertidas para [longitude, latitude].","Referências bíblicas associadas à narrativa ou à localidade, não usadas como prova arqueológica.","Desenhos originais identificados explicitamente como esquemáticos; nenhuma imagem de terceiros."],uncertainties,methodology:"Compilação documental assistida por software: extração nominal do OpenBible e leitura de reprPoint do Pleiades; seleção editorial das referências e explicações. Não houve aprovação humana ou revisão por especialista. 'documented' indica rastreabilidade documental, não certificação histórica."}});
}
const route = (id,label,places,explanation,certainty="probable") => ({id,label,kind:"route",certainty,coordinates:places.map(p=>p.coordinates),explanation:`ESQUEMÁTICO, NÃO EXATO. ${explanation} Segmentos retos indicam relações entre localidades; não são estradas identificadas, distâncias percorridas nem trilhas GPS.`,sourceIds:[...new Set(["editorial",...places.flatMap(p=>p.sourceIds)])]});
const area = (id,label,coordinates,explanation) => ({id,label,kind:"area",certainty:"debated",coordinates,explanation:`POLÍGONO EDITORIAL ESQUEMÁTICO, NÃO FRONTEIRA EXATA. ${explanation} Não delimita cidades antigas, soberania atual ou propriedades.`,sourceIds:["editorial","biblical"]});
const rect = (w,s,e,n) => [[w,s],[e,s],[e,n],[w,n],[w,s]];
{
 const places=[
  p("Nazareth","nazareth","Nazaré","An-Nasira/Nazaré, Israel",[r("Luke",4,16)],"Localidade galileia associada à criação de Jesus."),
  p("Capernaum","capernaum","Cafarnaum","Kfar Nahum, margem norte do lago da Galileia, Israel",[r("Matt",4,13)],"Sítio junto ao lago associado ao ministério de Jesus."),
  beth(),jer(),
  p("Jericho","jericho","Jericó","Ariha/Jericó, Cisjordânia",[r("Luke",19,1)],"O geocódigo é de Tell es-Sultan; a Jericó herodiana tinha núcleo ao sul. Não identifica o ponto exato do encontro com Zaqueu.","probable"),
  p("Bethany 1","bethany","Betânia","Al-Eizariya, Cisjordânia",[r("John",11,1)],"Identificação usual a leste de Jerusalém; distinta da Betânia além do Jordão.","probable"),
  pleiades("678437","tyre","Tiro","Sour, Líbano",[r("Mark",7,24)],"A narrativa menciona a região de Tiro, não exige entrada neste centro urbano.")
 ];
 add("palestine-jesus","Palestina no tempo de Jesus","Galileia, Samaria e Judeia: localidades e regiões", "NT",["Matt","Mark","Luke","John"],["Jesus"],"c. 6 a.C.–30 d.C.; recorte geográfico do início do século I",[34.1,30.9,36.5,33.7],"Localidades dos Evangelhos e três faixas regionais aproximadas. 'Palestina' é aqui um termo geográfico editorial; não se afirma que esse fosse o nome oficial de uma única província durante o ministério de Jesus. Galileia e Judeia tiveram administrações distintas.","Hoje o recorte inclui Israel, o território palestino ocupado (Cisjordânia, incluindo Jerusalém Oriental) e o sul do Líbano. Rótulos geográficos não decidem soberania; Jerusalém possui estatuto político disputado.",places,[
 area("galilee","Galileia — faixa aproximada",rect(35.05,32.5,35.65,33.1),"Área de leitura dos relatos; não reproduz a fronteira da tetrarquia de Herodes Antipas."),
 area("samaria","Samaria — faixa aproximada",rect(35.02,32.02,35.5,32.5),"Região entre Galileia e Judeia, sem fronteira administrativa reconstruída."),
 area("judea","Judeia — faixa aproximada",rect(34.9,31.35,35.5,32.02),"Envelope da área central; não abrange toda a província romana.")
 ],[r("Matt",4,12,25),r("John",4,3,5)],["Os polígonos não representam fronteiras precisas nem um único ano administrativo.","Jericó do período romano não coincide exatamente com o ponto de Tell es-Sultan.","Não se reconstrói uma cronologia harmonizada dos quatro Evangelhos."]);
}
{
 const places=[
 pleiades("687928","jerusalem","Jerusalém do Segundo Templo","Cidade Velha de Jerusalém, Jerusalém Oriental",[r("Matt",21,10)],"Ponto geral da cidade na fase de Jesus; o registro Pleiades também cobre outras fases que não são mapeadas aqui."),
 p("Mount of Olives","olives","Monte das Oliveiras","Jabal al-Zaytun/Monte das Oliveiras, Jerusalém Oriental",[r("Luke",19,37)],"Elevação a leste da cidade, não uma localização exata de cada discurso."),
 p("Bethany 1","bethany","Betânia","Al-Eizariya, Cisjordânia",[r("Mark",11,1),r("John",11,1)],"Localidade a leste do monte das Oliveiras.","probable"),
 {id:"gethsemane",name:"Getsêmani",modernName:"Desconhecido com exatidão; tradição ao pé do monte das Oliveiras",coordinates:null,certainty:"debated",explanation:"O OpenBible legado atribui a Getsêmani o ponto genérico de Jerusalém com til. Esse ponto não foi reutilizado como coordenada do jardim; a localização tradicional não é uma comprovação do episódio.",references:[r("Matt",26,36)],sourceIds:["openbible","biblical"],_key:"Gethsemane"},
 {id:"golgotha",name:"Gólgota",modernName:"Desconhecido com exatidão; identificação tradicional no Santo Sepulcro, Jerusalém",coordinates:null,certainty:"debated",explanation:"A identificação tradicional é importante historicamente, mas este recorte não fornece uma coordenada arqueológica verificada para o local da execução.",references:[r("John",19,17)],sourceIds:["biblical"]}
 ];
 add("jerusalem-jesus","Jerusalém no tempo de Jesus","Somente a fase herodiana e romana do início do século I","NT",["Matt","Mark","Luke","John"],["Jesus"],"c. 20–33 d.C.; antes da destruição de 70 d.C.",[35.21,31.75,35.28,31.80],"Foco exclusivo na Jerusalém do período de Jesus e em seu entorno oriental. O mapa não desenha muralhas nem identifica tribunais ou a Via Dolorosa como itinerário comprovado. As fases de Davi e Salomão, exílica, persa, pós-70, Aelia Capitolina, bizantina e islâmica ficam adiadas.","A área mostrada inclui a Cidade Velha e o monte das Oliveiras em Jerusalém Oriental, território ocupado segundo a ONU, e Al-Eizariya na Cisjordânia. Os nomes não atribuem soberania.",places,[route("approach","Betânia → monte das Oliveiras → Jerusalém", [places[2],places[1],places[0]],"Ordem de aproximação inspirada em Marcos 11 e Lucas 19, não percurso rua a rua.")],[r("Mark",11,1,11),r("Luke",19,29,44)],["Não há reconstrução de muralhas, portas, dimensões do Templo ou traçado urbano.","Getsêmani e Gólgota permanecem sem coordenadas nesta amostra.","Todas as fases históricas diferentes da fase de Jesus estão adiadas."]);
}
{
 const places=[ant(),
 p("Seleucia","seleucia","Selêucia Piéria","Çevlik/Samandağ, Turquia",[r("Acts",13,4)],"Porto de embarque mencionado por Atos."),
 p("Salamis","salamis","Salamina","Ruínas de Salamina, perto de Famagusta, Chipre",[r("Acts",13,5)],"Primeira localidade nomeada na etapa cipriota."),
 p("Paphos","paphos","Pafos","Pafos, Chipre",[r("Acts",13,6)],"Localidade no oeste da ilha; o percurso interior não é informado."),
 p("Perga","perga","Perge","Perge/Aksu, perto de Antalya, Turquia",[r("Acts",13,13),r("Acts",14,25)],"Escala da Panfília na ida e na volta."),
 p("Antioch 2","pisidian-antioch","Antioquia da Pisídia","Sítio junto a Yalvaç, Turquia",[r("Acts",13,14)],"Distinta da Antioquia da Síria; tradicionalmente chamada 'da Pisídia'."),
 p("Iconium","iconium","Icônio","Konya, Turquia",[r("Acts",14,1)],"Cidade na sequência narrativa de Atos 14."),
 p("Lystra","lystra","Listra","Hatunsaray, perto de Konya, Turquia",[r("Acts",14,6)],"Identificação do sítio de Listra na região de Hatunsaray.","probable"),
 p("Derbe","derbe","Derbe","Kerti Höyük, região de Karaman, Turquia",[r("Acts",14,20)],"Identificação usual em Kerti Höyük; ponto aproximado da base legada.","probable"),
 p("Attalia","attalia","Atália","Antalya, Turquia",[r("Acts",14,25)],"Porto da etapa final de retorno.")
 ];
 add("paul-first-journey","Primeira viagem de Paulo","Paulo e Barnabé: sequência de Atos 13–14","NT",["Acts"],["Paulo","Barnabé","João Marcos"],"c. 46–48 d.C.; datação aproximada",[29.8,34.2,37,39],"Percurso de leitura de Antioquia da Síria a Chipre e à Anatólia, com retorno por cidades já visitadas. A narrativa registra localidades e algumas travessias, mas não permite reconstruir cada estrada, porto intermediário ou tempo de caminhada.","Os pontos estão na Turquia e na ilha de Chipre. Salamina fica no norte da ilha, sob administração de facto turco-cipriota, sem que o mapa reconheça uma alteração de soberania.",places,[route("outbound","Ida: Antioquia → Chipre → Derbe",places.slice(0,9),"Sequência textual de Atos 13:1–14:20."),route("return","Volta: Derbe → Atália → Antioquia",[places[8],places[7],places[6],places[5],places[4],places[9],places[0]],"Sequência de Atos 14:21–26. O retorno de Atália é marítimo; a linha direta não é rota de navegação.")],[r("Acts",13,1,14),r("Acts",14,20,28)],["Cronologia aproximada; nenhuma estrada ou rota marítima é considerada exata.","As escalas são textuais; a geometria dos trajetos é editorial.","Listra e Derbe exigem verificação especializada antes de uso arqueológico."]);
}
{
 const places=[
 p("Rameses","rameses","Ramessés","Qantir/Pi-Ramessés, delta oriental do Nilo, Egito",[r("Exod",12,37)],"A associação toponímica com Pi-Ramessés é comum; não fixa a data do êxodo nem demonstra o evento.","probable"),
 p("Succoth 2","succoth","Sucote do Egito","Região de Tjeku/Wadi Tumilat, Egito; sítio exato desconhecido",[r("Exod",12,37),r("Exod",13,20)],"Geocódigo legado como hipótese regional; não confundir com Sucote a leste do Jordão.","debated"),
 p("Sinai","sinai","Sinai — candidato tradicional meridional","Jebel Musa, península do Sinai, Egito",[r("Exod",19,1,2)],"Coordenada do candidato tradicional Jebel Musa, não coordenada demonstrada do Sinai bíblico.","debated"),
 p("Kadesh-barnea","kadesh","Cades-Barneia — identificação proposta","Tell el-Qudeirat, nordeste do Sinai, Egito",[r("Num",13,26),r("Deut",1,19)],"Identificação usual de Cades na região de oásis; cronologia e correspondência narrativa requerem discussão.","probable"),
 {id:"sea-crossing",name:"Travessia do mar",modernName:"Desconhecido; propostas no delta oriental e nos golfos do mar Vermelho",coordinates:null,certainty:"unknown",explanation:"Yam Suph recebe traduções e localizações diversas. Nenhum ponto de travessia foi demonstrado e não se escolhe uma coordenada arbitrária.",references:[r("Exod",14,21,22)],sourceIds:["biblical"]},
 {id:"alternative-sinai",name:"Sinai — outras propostas",modernName:"Desconhecido; propostas no norte do Sinai e no noroeste da Arábia",coordinates:null,certainty:"debated",explanation:"As alternativas não são equiparadas a sítios confirmados. Faltam nesta compilação provas suficientes para escolher um monte ou traçar uma segunda rota detalhada.",references:[r("Exod",19,1),r("Gal",4,25)],sourceIds:["biblical"]}
 ];
 add("exodus-hypotheses","Êxodo: hipóteses geográficas","Candidatos de localização, não uma rota comprovada","AT",["Exod","Num","Deut","Gal"],["Moisés","Arão"],"Narrativa situada no II milênio a.C.; propostas nos séculos XV e XIII a.C., sem data consensual",[30,27,37,32.8],"O mapa distingue topônimos associados a sítios conhecidos, candidatos tradicionais e locais desconhecidos. Uma linha mostra apenas a sequência Ramessés–Sucote–Sinai–Cades na hipótese meridional; as etapas de Números 33 não são todas localizáveis. A ausência de consenso não autoriza inventar itinerários.","Recorte do Egito, Sinai, sul do Levante e noroeste da Península Arábica. Países modernos orientam o leitor, sem projetar fronteiras contemporâneas sobre a narrativa.",places,[route("southern-hypothesis","Hipótese meridional tradicional — sequência, não estrada",places.slice(0,4),"A ligação passa por um candidato tradicional ao Sinai. Não localiza a travessia do mar e omite numerosas estações não identificadas.","debated")],[r("Exod",12,37),r("Exod",14,21,22),r("Exod",19,1,2),r("Num",33,1,49)],["Data, escala e historicidade dos movimentos não são resolvidas pelo geocódigo.","O candidato Jebel Musa não é identificação arqueológica demonstrada.","Outras famílias de hipóteses são descritas, mas não recebem rotas inventadas.","Não se apresenta evidência de uma travessia específica do mar."]);
}
{
 const places=[shechem(),heb(),dan(),
 p("Shiloh","shiloh","Siló","Khirbet Seilun, Cisjordânia",[r("Josh",18,1)],"Local de reunião na narrativa da distribuição territorial."),
 p("Beersheba","beersheba","Berseba","Tel Be'er Sheva, junto a Be'er Sheva, Israel",[r("Josh",19,2)],"Marco meridional na lista de cidades de Simeão; não implica fronteira fixa."),
 p("Jericho","jericho","Jericó","Tell es-Sultan, Ariha/Jericó, Cisjordânia",[r("Josh",18,21)],"Localidade listada no território de Benjamim.")
 ];
 const tribes=[
 ["judah","Judá",34.85,31.1,35.35,31.7,"Josh",15,1],
 ["simeon","Simeão (dentro de Judá)",34.65,31,35.05,31.4,"Josh",19,1],
 ["benjamin","Benjamim",35.12,31.7,35.55,31.95,"Josh",18,11],
 ["ephraim","Efraim",35.0,31.95,35.5,32.2,"Josh",16,5],
 ["manasseh","Manassés ocidental",34.8,32.2,35.55,32.6,"Josh",17,1],
 ["issachar","Issacar",35.3,32.5,35.65,32.72,"Josh",19,17],
 ["zebulun","Zebulom",35.12,32.65,35.4,32.85,"Josh",19,10],
 ["asher","Aser",35,32.75,35.3,33.25,"Josh",19,24],
 ["naphtali","Naftali",35.35,32.8,35.7,33.3,"Josh",19,32],
 ["dan","Dã (alocação inicial)",34.65,31.8,35.1,32.05,"Josh",19,40],
 ["reuben","Rúben",35.55,31.25,35.95,31.85,"Josh",13,15],
 ["gad","Gade",35.55,31.85,36.05,32.4,"Josh",13,24],
 ["manasseh-east","Meia tribo de Manassés oriental",35.65,32.4,36.25,33.05,"Josh",13,29]
 ];
 add("twelve-tribes","As doze tribos: distribuição literária","Treze envelopes para doze tribos territoriais; Manassés em duas partes","AT",["Josh","Gen"],["Josué"],"Horizonte narrativo da instalação em Canaã; tradições territoriais sem data única",[34.2,30.7,36.6,33.6],"Leitura de Josué 13–21: Efraim e Manassés figuram separadamente; Levi não recebe território contínuo e Simeão é descrito dentro de Judá. Manassés tem duas porções. Os treze envelopes não são um cadastro territorial e podem sobrepor-se; Dã aparece também como localidade setentrional da tradição de migração.","A região corresponde hoje sobretudo a Israel, Cisjordânia, Jordânia e sul do Líbano. Os polígonos não legitimam reivindicações territoriais modernas.",places,tribes.map(([id,label,w,s,e,n,b,c,v])=>area(id,label,rect(w,s,e,n),`Envelope de orientação da descrição de ${b} ${c}:${v}; não reproduz os marcos da lista nem ocupação efetiva.`)),[r("Josh",13,14),r("Josh",13,15,33),r("Josh",18,1,10),r("Josh",19,1),r("Josh",21,1,3)],["Todos os envelopes tribais são altamente esquemáticos; não se conhece uma fronteira contínua demonstrada.","As tradições descrevem alocações e cidades; não equivalem a ocupação uniforme.","Levi tem cidades dispersas; não há polígono de Levi. Dã setentrional não substitui silenciosamente sua alocação inicial."]);
}
{
 const places=[jer(),shechem(),
 p("Samaria","samaria","Samaria","Sebastia, Cisjordânia",[r("1Kgs",16,24)],"Capital fundada por Onri segundo Reis; não foi capital do norte desde o primeiro ano da divisão."),
 dan(),heb(),
 p("Beersheba","beersheba","Berseba","Tel Be'er Sheva, Israel",[r("Amos",5,5)],"Centro meridional mencionado nas críticas proféticas; não uma capital.")
 ];
 add("divided-kingdom","O reino dividido","Israel e Judá; capitais em momentos diferentes","AT",["1Kgs","2Kgs","Amos"],["Jeroboão I","Roboão","Onri"],"c. 930–722 a.C. para Israel; Judá até 587/586 a.C.",[34.2,30.7,36.6,33.7],"A divisão de Reis separa o reino do norte, Israel, de Judá ao sul. Siquém e depois Samaria ilustram mudanças no centro político setentrional; Jerusalém permanece central para Judá. As áreas não representam um ano preciso e não incluem todas as expansões ou perdas territoriais.","Recorte do sul do Levante, hoje Israel, território palestino ocupado, Jordânia e áreas vizinhas. Os nomes históricos Israel e Judá não são limites dos Estados atuais.",places,[area("north","Israel — núcleo ocidental aproximado",rect(34.9,31.98,35.8,33.25),"A extensão a leste do Jordão variou; envelope não exaustivo."),area("south","Judá — núcleo aproximado",rect(34.85,31.15,35.55,31.98),"Não retrata todas as mudanças de controle da Sefelá ou do Neguebe.")],[r("1Kgs",12,1,24),r("1Kgs",16,24),r("2Kgs",17,6),r("2Kgs",25,8,10)],["Divisão convencionalmente datada por volta de 930 a.C.; cronologias variam.","Os reinos mudaram de extensão e não coexistiram até a queda de Judá.","Polígonos não incluem todos os territórios transjordanianos e não são fronteiras arqueológicas."]);
}
{
 const places=[
 p("Ur","ur","Ur dos caldeus — candidato meridional","Tell el-Muqayyar, sul do Iraque",[r("Gen",11,28),r("Gen",11,31)],"Coordenada da cidade suméria de Ur; sua identificação com a Ur de Abraão é tradicional, mas não consensual.","debated"),
 p("Haran","haran","Harã","Harran, província de Şanlıurfa, Turquia",[r("Gen",11,31),r("Gen",12,4)],"Topônimo associado à cidade de Harran; não prova a presença pessoal de Abraão."),
 shechem(),heb(),
 p("Beersheba","beersheba","Berseba","Tel Be'er Sheva e região de Be'er Sheva, Israel",[r("Gen",21,31,33)],"A narrativa menciona o poço e a região; o geocódigo não identifica o poço de Abraão."),
 {id:"egypt",name:"Egito — estadia de Abraão",modernName:"Egito; cidade da estadia desconhecida",coordinates:null,certainty:"unknown",explanation:"Gênesis 12:10 menciona a descida ao Egito sem nomear a cidade. Não se usa Memphis ou outra capital como substituto especulativo.",references:[r("Gen",12,10)],sourceIds:["biblical"]}
 ];
 add("abraham-journeys","Jornadas de Abraão","Localidades narrativas e conexões aproximadas","AT",["Gen"],["Abraão","Sara","Ló"],"Horizonte patriarcal tradicional no II milênio a.C.; datação histórica não demonstrada",[33.8,29.5,47.2,38],"A sequência Ur–Harã–Canaã organiza a leitura de Gênesis 11–13. Os pontos identificam candidatos de cidades, não vestígios dos deslocamentos de uma pessoa. A estadia no Egito e outras etapas sem geocódigo seguro aparecem no texto sem coordenadas inventadas.","O quadro abrange Iraque, Turquia, Síria e o sul do Levante. Hebrom e Siquém ficam na Cisjordânia; as conexões não descrevem estradas, fronteiras ou permissões de viagem atuais.",places,[route("to-canaan","Ur → Harã → Siquém",[places[0],places[1],places[2]],"Sequência de Gênesis 11:31–12:6; a primeira identificação é debatida. A reta Ur–Harã não é um caminho pelo deserto.","debated"),route("canaan","Siquém → Hebrom → Berseba",[places[2],places[3],places[4]],"Síntese de localidades de Gênesis 12–21; não continuidade cronológica, pois omite Betel, o Egito e outras etapas.","debated")],[r("Gen",11,31),r("Gen",12,4,10),r("Gen",13,18),r("Gen",21,31,33)],["Ur meridional é um candidato, não consenso sobre a origem de Abraão.","Datas e percursos dos patriarcas não são verificáveis por estes geocódigos.","A linha não é uma reconstrução de estradas mesopotâmicas ou cananeias."]);
}
{
 const places=[ephesus(),
 p("Smyrna","smyrna","Esmirna","İzmir, Turquia",[r("Rev",2,8)],"Localidade destinatária da segunda mensagem."),
 p("Pergamum","pergamum","Pérgamo","Bergama, Turquia",[r("Rev",2,12)],"Cidade no norte da sequência das sete mensagens."),
 p("Thyatira","thyatira","Tiatira","Akhisar, Turquia",[r("Rev",2,18)],"Cidade também associada à origem de Lídia em Atos 16:14."),
 p("Sardis","sardis","Sardes","Sart, perto de Salihli, Turquia",[r("Rev",3,1)],"Antiga capital lídia; a comunidade é destinatária de uma mensagem."),
 p("Philadelphia","philadelphia","Filadélfia","Alaşehir, Turquia",[r("Rev",3,7)],"Cidade do interior da província romana da Ásia."),
 p("Laodicea","laodicea","Laodiceia do Lico","Laodikeia, perto de Denizli, Turquia",[r("Rev",3,14)],"Distinta de outras cidades antigas chamadas Laodiceia.")
 ];
 add("seven-churches","As sete igrejas do Apocalipse","Sete cidades da província romana da Ásia","NT",["Rev","Acts"],["João"],"Fim do século I d.C.; data frequentemente proposta c. 90–96 d.C., com alternativas",[26.5,37.2,29.7,39.6],"As sete mensagens de Apocalipse 2–3 são dirigidas a comunidades em cidades reais da Ásia romana. Os marcadores representam cidades, não edifícios de igrejas do século I. A sequência de leitura não prova uma viagem de João ou um circuito postal específico.","Todas as cidades estão na atual Turquia ocidental. 'Ásia' designa aqui a província romana, não todo o continente. Sítios antigos e centros urbanos modernos nem sempre coincidem.",places,[route("letters","Ordem das mensagens: Éfeso → Laodiceia",places,"Conexão visual na ordem de Apocalipse 1:11 e capítulos 2–3; não itinerário histórico afirmado.")],[r("Rev",1,11),r("Rev",2,1),r("Rev",3,14)],["A cronologia do Apocalipse é discutida; a data proposta não é certeza.","O traçado não é uma estrada romana reconstituída nem uma jornada documentada.","O ponto Pleiades de Éfeso e o legado OpenBible têm centros representativos distintos."],"documented");
}
{
 const places=[
 p("Rome","rome","Roma","Roma, Itália",[r("Acts",28,16)],"Capital imperial, chegada de Paulo segundo Atos."),
 p("Corinth","corinth","Corinto","Ancient Corinth/Archaia Korinthos, Grécia",[r("Acts",18,1)],"Cidade romana próxima ao istmo, distinta do centro moderno de Corinto."),
 p("Athens","athens","Atenas","Athina/Atenas, Grécia",[r("Acts",17,16)],"Ponto geral da cidade; não coordenada exata do discurso."),
 ephesus(),ant(),jer(),
 p("Alexandria","alexandria","Alexandria","Al-Iskandariya/Alexandria, Egito",[r("Acts",18,24),r("Acts",27,6)],"Cidade de origem de Apolo e referência a navios alexandrinos; não escala afirmada de Paulo nessa viagem.")
 ];
 add("roman-empire","O mundo romano do Novo Testamento","Rede de cidades do Mediterrâneo oriental, não mapa integral do império","NT",["Acts","Luke","Rom"],["Paulo","Apolo","Augusto"],"Século I d.C.; localidades em diferentes momentos, não fronteiras de 117 d.C.",[-11,23,46,57],"Pontos de referência para a circulação de pessoas e cartas no século I. O império abrangia também extensas regiões ocidentais não detalhadas nesta amostra. O mapa não usa a extensão máxima de Trajano como se fosse contemporânea ao nascimento de Jesus.","Recorte europeu, norte-africano e próximo-oriental. Os pontos selecionados estão em Itália, Grécia, Turquia, Egito e Jerusalém; as regiões romanas não equivalem aos Estados nacionais atuais.",places,[route("paul-network","Corinto → Éfeso → Jerusalém → Antioquia",[places[1],places[3],places[5],places[4]],"Síntese de Atos 18:18–22; omite Cencreia e Cesareia. A 'subida' à igreja é usualmente interpretada como Jerusalém, mas o versículo não nomeia a cidade.","debated"),area("eastern-context","Janela didática do Mediterrâneo oriental",rect(20,29,37,40),"Apenas área de atenção visual das cidades orientais; NÃO representa a extensão do Império Romano.")],[r("Luke",2,1),r("Acts",18,18,24),r("Acts",28,16)],["Não há contorno integral, nem fronteiras provinciais do império.","Atos 18:22 não nomeia Jerusalém explicitamente; a conexão é interpretação provável.","A amostra privilegia o Mediterrâneo oriental; Britânia, Gália, Hispânia e fronteiras do Danúbio não são detalhadas."]);
}
{
 const places=[
 p("Nineveh","nineveh","Nínive","Margem oriental de Mossul, Iraque",[r("Jonah",1,2),r("2Kgs",19,36)],"Centro assírio; ponto do sítio, não limite de toda a aglomeração."),
 p("Babylon","babylon","Babilônia","Ruínas de Babilônia, perto de Hillah, Iraque",[r("2Kgs",24,10),r("2Kgs",25,1)],"Centro babilônico associado à conquista de Jerusalém e ao exílio."),
 p("Susa","susa","Susã","Shush, província do Khuzistão, Irã",[r("Neh",1,1),r("Esth",1,2)],"Centro elamita e aquemênida; referência ao cenário persa."),
 p("Memphis","memphis","Mênfis/Nof","Mit Rahina, ao sul do Cairo, Egito",[r("Hos",9,6),r("Jer",2,16)],"Centro egípcio; identificação tradicional da Nof bíblica."),
 p("Damascus","damascus","Damasco","Dimashq/Damasco, Síria",[r("1Kgs",11,24)],"Centro arameu; não representa todo o território de Aram."),
 p("Haran","haran","Harã","Harran, Turquia",[r("Gen",11,31)],"Centro do norte da Mesopotâmia e referência patriarcal."),
 jer(),
 {id:"eden",name:"Éden",modernName:"Desconhecido; localização geográfica não estabelecida",coordinates:null,certainty:"unknown",explanation:"Gênesis menciona rios, mas não fornece uma localização verificável do jardim. Não se equipara o Éden a uma cidade ou ponto moderno e não se desenha um perímetro.",references:[r("Gen",2,8,14)],sourceIds:["biblical"]}
 ];
 // Replace the NT reference inherited from the shared Jerusalem helper.
 places[6].references=[r("2Kgs",25,1)];places[6].explanation="Jerusalém como centro de Judá no contexto da conquista babilônica; ponto representativo, não limite urbano antigo.";
 add("ancient-near-east","Antigo Oriente Próximo","Cidades de referência entre o Nilo, o Levante e a Mesopotâmia","AT",["Gen","1Kgs","2Kgs","Neh","Esth","Hos","Jer","Jonah"],["Abraão","Nabucodonosor","Ester","Jonas"],"II–I milênios a.C.; panorama diacrônico, não um único império",[28,24,51,40],"Cidades ajudam a distinguir contextos egípcio, arameu, assírio, babilônico e persa. Esses poderes não atingiram seus apogeus simultaneamente. As faixas ilustram grandes regiões físicas, não limites de impérios. O Éden permanece sem coordenada.","O recorte inclui Egito, Israel, território palestino ocupado, Jordânia, Líbano, Síria, Turquia, Iraque e Irã. Divisões modernas são apenas orientação geográfica e não reproduzem identidades antigas.",places,[area("nile","Vale inferior do Nilo — envelope",rect(30,25,32,31.5),"Faixa física aproximada; não território total do Egito antigo."),area("levant","Levante — envelope",rect(34,30.5,37,36.5),"Região física de passagem, não unidade política antiga."),area("mesopotamia","Mesopotâmia — envelope",[[38,37],[40,38],[46.5,31],[45,30],[38,35],[38,37]],"Faixa aproximada entre os sistemas do Tigre e Eufrates; não fronteira da Assíria ou Babilônia.")],[r("Gen",2,8,14),r("2Kgs",19,36),r("2Kgs",25,1),r("Esth",1,2)],["Panorama de muitos séculos: não implica coexistência de todos os poderes.","Éden desconhecido, sem coordenadas ou polígono.","Faixas físicas simplificadas não são mapas de extensão imperial."]);
}
const bibleCodes={Gen:"GEN",Exod:"EXO",Josh:"JOS","1Kgs":"1KI",Matt:"MAT",Mark:"MRK",Acts:"ACT",Rev:"REV",Luke:"LUK"};
let review = `# Mapas do atlas — revisão documental, não aprovação especializada\n\nCompilação: ${date}. Versão 1; dez mapas; todos sample=true. Nenhum revisor humano ou especialista aprovou estes dados. O estado documented significa identificação de cidades rastreável, não reconstrução histórica certificada; needs-specialist sinaliza incerteza de reconstrução. Não foram usadas imagens, tiles ou traçados de mapas de terceiros.\n\n## Fontes e procedimento efetivamente executado\n\n- Download público real de https://www.openbible.info/geo/data/merged.txt e https://www.openbible.info/geo/data/places.txt; arquivos integrais preservados em evidence/. São bases legadas de 2007, não a edição mais recente. A página https://www.openbible.info/geo/ declara: “The dataset as a whole is licensed under the Creative Commons Attribution license” e liga CC BY 4.0; também alerta que alguns dados atuais são OSM. Não foram importados basemaps OSM.\n- Download real dos JSON Pleiades 687928 (Jerusalém), 599612 (Éfeso) e 678437 (Tiro), retidos integralmente. O campo rights dos registros declara Creative Commons Attribution 3.0. Atribuição: Pleiades contributors / The Creators; créditos individuais e bibliografia nos JSON. Usado reprPoint, sem fingir que seus decimais oferecem exatidão métrica.\n- Leitura das linhas do OpenBible por chave exata; inversão de latitude/longitude para [longitude,latitude], mantendo o valor numérico original. Marcas ~, <, > e ? na fonte significam aproximação ou relação espacial, não prova. Pontos de locais particulares reduzidos à coordenada genérica de uma cidade NÃO foram adotados como locais exatos.\n- Referências em OSIS normalizado (por exemplo Exod, Josh, 1Kgs, Matt, Acts, Rev); referências não são transcrição de tradução protegida. Links bíblicos apontam para WEB, domínio público. As explicações em português e geometrias foram redigidas originalmente nesta compilação.\n- Polilinhas são segmentos entre representantes; polígonos são envelopes editoriais, nunca fronteiras urbanas antigas, fronteiras modernas ou áreas de soberania. Não foram digitalizadas imagens de atlas comercial. A fonte editorial liga a documentação do geocodificador apenas como apoio, sem alegar que ele publicou nossos polígonos.\n- Conferência documental da chave, coordenada, contexto narrativo e limites do recorte, não inspeção em campo. O script build-maps.cjs permite reproduzir os JSON a partir das evidências retidas. A data indica compilação, não data de revisão humana.\n\n## Evidência por mapa e localidade\n`;
fs.mkdirSync("data/atlas/maps",{recursive:true});
for (const map of maps) {
 const first = map.references[0];
 map.sources=[ob,{id:"biblical",title:`Referência textual: ${map.references.map(x=>x.label).join("; ")}`,url:`https://ebible.org/web/${bibleCodes[first.book] || "GEN"}${String(first.chapter).padStart(2,"0")}.htm`,license:"World English Bible (WEB): domínio público. Apenas referências e paráfrases editoriais em português; nenhum texto de tradução protegida reproduzido.",note:"A narrativa fundamenta a associação literária e a ordem das localidades, não comprova coordenadas, cronologia absoluta ou fronteiras."}];
 if(map.overlays.length) map.sources.push(editorial);
 for (const id of new Set(map.places.flatMap(x=>x._pleiades ? [x._pleiades] : []))) {
  const d=JSON.parse(fs.readFileSync(`${dir}/pleiades-${id}.json`,"utf8"));
  map.sources.push({id:`pleiades-${id}`,title:`Pleiades ${id}: ${d.title}`,url:`https://pleiades.stoa.org/places/${id}`,license:"CC BY 3.0; Pleiades contributors / The Creators. Créditos específicos preservados no JSON de evidência.",note:`${d.description} Usado reprPoint do JSON recuperado, não polígono da cidade.`});
 }
 review += `\n### ${map.id} — ${map.title}\n\nEstado: **${map.review.status}**. Período: ${map.period}. Recorte [oeste,sul,leste,norte]: ${JSON.stringify(map.bounds)}.\n\n`;
 for (const place of map.places) {
  review += `- **${place.name}** (${place.id}); hoje: ${place.modernName}. Certeza: ${place.certainty}; coordenada: ${JSON.stringify(place.coordinates)}; referências: ${place.references.map(x=>x.label).join(", ")}.\n`;
  if(place._key) {
   const row=rows.get(place._key);
   review+=`  - Método/evidência OpenBible: chave literal “${row[0]}”; raiz “${row[1]||"(direta)"}”; latitude bruta “${row[2]}”; longitude bruta “${row[3]}”; excerto da coluna de passagens: “${row[4].split(", ").slice(0,4).join(", ")}”. Arquivo: [merged.txt](evidence/openbible-merged.txt); [fonte pública](https://www.openbible.info/geo/data/merged.txt). ${place.coordinates ? "Ponto transcrito; identificação narrativa avaliada separadamente." : "Coordenada da fonte deliberadamente rejeitada por não localizar o sítio específico."}\n`;
  } else if(place._pleiades) {
   const d=JSON.parse(fs.readFileSync(`${dir}/pleiades-${place._pleiades}.json`,"utf8"));
   review+=`  - Método/evidência Pleiades: title “${d.title}”; description “${d.description}”; reprPoint ${JSON.stringify(d.reprPoint)}. [JSON preservado](evidence/pleiades-${place._pleiades}.json), [registro](https://pleiades.stoa.org/places/${place._pleiades}).\n`;
   const compareKey=place.id==="ephesus"?"Ephesus":place.id==="jerusalem"?"Jerusalem":"Tyre";
   const row=rows.get(compareKey);
   review+=`  - Comparação documental, não média: OpenBible “${compareKey}” tem [${row[3]}, ${row[2]}]. Diferença entre representantes de bases não é deslocamento histórico comprovado; manteve-se o Pleiades, sem mesclar coordenadas.\n`;
  } else review+=`  - Método: local citado na narrativa, sem geocódigo aceito. Nenhuma consulta foi inventada; a ausência de uma identificação suficiente é explicitada, e coordinates=null impede falsa precisão. Fonte textual: ${place.references.map(x=>x.label).join("; ")}.\n`;
  review+=`  - Limite interpretativo: ${place.explanation}\n`;
 }
 review+=`\nGeometrias: ${map.overlays.map(x=>`${x.label} (${x.certainty}; ${x.kind}; original)`).join("; ")}.\n\nIncertezas e cobertura: ${map.review.uncertainties.join(" ")}\n`;
 const output={...map,places:map.places.map(({_key,_pleiades,...place})=>place)};
 for(const place of output.places) if(place.coordinates) {
  const [x,y]=place.coordinates,[w,s,e,n]=map.bounds;
  if(x<w||x>e||y<s||y>n) throw new Error(`Outside bounds: ${map.id}/${place.id}`);
 }
 for(const overlay of map.overlays) for(const [x,y] of overlay.coordinates) {
  const [w,s,e,n]=map.bounds;
  if(x<w||x>e||y<s||y>n) throw new Error(`Outside bounds: ${map.id}/${overlay.id}`);
 }
 fs.writeFileSync(`data/atlas/maps/${map.id}.json`,JSON.stringify(output,null,2)+"\n");
}
review+=`\n## Cobertura e pendências explícitas\n\nDez amostras, não atlas exaustivo. Jerusalém tem somente a fase de Jesus; outras fases estão adiadas. As doze tribos têm 13 envelopes devido às duas porções de Manassés; Levi não recebe polígono. Êxodo só desenha a família meridional como hipótese e descreve alternativas sem fabricar rotas. Império Romano oferece uma rede oriental e Roma, não seu contorno integral. Éden, travessia do mar, outras propostas do Sinai, Getsêmani, Gólgota e cidade da estadia de Abraão no Egito não recebem coordenadas. Éfeso, Jerusalém e Tiro têm evidência dupla independente de geocodificadores; os demais pontos usam apenas o OpenBible legado e requerem corroboração especializada antes de uso arqueológico. Nenhum trajeto é certificado. Nenhuma fronteira contemporânea é traçada.\n`;
fs.writeFileSync("docs/atlas/maps-review.md",review);
console.log(`Compiled ${maps.length} maps; ${maps.reduce((n,m)=>n+m.places.length,0)} place entries; ${maps.reduce((n,m)=>n+m.overlays.length,0)} original overlays.`);