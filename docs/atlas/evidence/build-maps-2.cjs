/* Atlas, Antigo Testamento — lote 1.
 * Run from repository root: node docs/atlas/evidence/build-maps-2.cjs
 * The base compiler runs first so maps-review.md is reproducible in one command.
 * Every geographic coordinate below is read from a retained OpenBible row.
 * SVG viewBox positions are diagram layout, not geographic coordinates.
 */
const fs = require("node:fs");
require("./build-maps.cjs");

const dir = "docs/atlas/evidence";
const atlasManifest = JSON.parse(fs.readFileSync("data/atlas/manifest.json", "utf8"));
const sampleFor = id => {
  const entry = atlasManifest.items.find(item => item.id === id);
  if (!entry) throw new Error(`Manifest entry missing for generated Atlas item: ${id}`);
  return entry.sample;
};
const rows = new Map(fs.readFileSync(`${dir}/openbible-merged.txt`, "utf8")
  .split(/\r?\n/).filter(line => line && !line.startsWith("#"))
  .map(line => { const columns = line.split("\t"); return [columns[0], columns]; }));
const date = new Date().toISOString().slice(0, 10);
const r = (book, chapter, verseStart, verseEnd) => ({
  book, chapter, verseStart, ...(verseEnd ? { verseEnd } : {}),
  label: `${book} ${chapter}:${verseStart}${verseEnd ? `–${verseEnd}` : ""}`,
});
function place(key, id, name, modernName, reference, explanation, certainty = "probable") {
  const row = rows.get(key);
  if (!row) throw new Error(`OpenBible key missing: ${key}`);
  if (/[~<>?]/.test(row[2] + row[3])) throw new Error(`Not a direct place geocode: ${key}`);
  const coordinates = [Number(row[3]), Number(row[2])];
  if (coordinates.some(x => !Number.isFinite(x))) throw new Error(`Invalid geocode: ${key}`);
  return { id, name, modernName, coordinates, certainty, explanation: `${explanation} Ponto da fonte, não posição exata do episódio.`, references: [reference], sourceIds: ["openbible"], _key: key };
}
function unknown(id, name, modernName, reference, explanation, key) {
  if (key && !rows.has(key)) throw new Error(`OpenBible key missing: ${key}`);
  return { id, name, modernName, coordinates: null, certainty: "unknown",
    explanation, references: [reference], sourceIds: key ? ["openbible", "biblical"] : ["biblical"], ...(key ? { _key: key } : {}) };
}
function debated(id, name, modernName, reference, explanation, key) {
  return { ...unknown(id, name, modernName, reference, explanation, key), certainty: "debated" };
}
const route = (id, label, places, explanation) => {
  if (places.length < 2 || places.some(p => !p.coordinates)) throw new Error(`Unlocated route: ${id}`);
  return { id, label, kind: "route", certainty: "debated",
    coordinates: places.map(p => p.coordinates), explanation: `ESQUEMÁTICA; NÃO É ESTRADA OU PERCURSO COMPROVADO. ${explanation}`,
    sourceIds: ["openbible", "editorial"] };
};
const campaignPoint = (id, label, place, explanation) => ({
  id, label, kind: "point", certainty: "debated", coordinates: [place.coordinates],
  explanation: `Marcador editorial de campanha, não área de ocupação ou fronteira. ${explanation}`,
  sourceIds: ["openbible", "editorial"],
});
const step = (p, explanation, reference = p.references[0], group) => ({
  placeId: p.id, explanation, reference, ...(group ? { group } : {}),
});
const storyStepsFor = (narrative, places) => (narrative && narrative.length ? narrative : places.map(p => step(p, p.explanation))).map((s, i) => ({
  placeId: s.placeId, title: (places.find(p => p.id === s.placeId)?.name || `Passo ${i + 1}`).split(" — ")[0].split(" (")[0],
  text: s.explanation, reference: s.reference,
}));
const authored = (text, reference, sourceIds = ["biblical"]) => ({ text, reference, sourceIds });
const authoredContent = {
 "nations-gen-10":[authored("Babel, Ereque e Acade são citadas juntas como cidades do início do reino de Ninrode.",r("Gen",10,10),["biblical","openbible"]),authored("Gênesis 10:11 pode ser lido como continuação da expansão de Ninrode ou como uma nova ação de Assur; a pontuação não resolve a atribuição.",r("Gen",10,11),["biblical","openbible"]),authored("Sidom e Gaza são nomes de cidades no limite literário de Canaã, não polígonos étnicos.",r("Gen",10,19),["biblical","openbible"])],
 "isaac-jacob":[authored("Gerar é o cenário da permanência de Isaque entre os filisteus; o ponto moderno é uma identificação debatida.",r("Gen",26,1,6),["biblical","openbible"]),authored("Jacó recebe o nome Betel para o lugar onde teve o sonho durante a viagem a Harã.",r("Gen",28,19),["biblical","openbible"]),authored("Em Sucote, Jacó constrói uma casa e faz abrigos para o rebanho antes de chegar a Siquém.",r("Gen",33,17,18),["biblical","openbible"])],
 "joseph-egypt":[authored("José procura os irmãos primeiro em Siquém e só depois os encontra em Dotã.",r("Gen",37,13,17),["biblical","openbible"]),authored("On é citada como a cidade de origem de Asenate, não como a residência de José.",r("Gen",41,45),["biblical","openbible"]),authored("Jacó pede para a família morar em Gósen, uma região cuja extensão não é delimitada no texto.",r("Gen",47,1,6),["biblical","openbible"])],
 "wilderness-kadesh":[authored("Mara e Elim são estações consecutivas: em Mara a água é amarga, e em Elim há fontes e palmeiras.",r("Exod",15,23,27),["biblical","openbible"]),authored("O texto associa Refidim à falta de água e ao confronto com Amaleque.",r("Exod",17,1,8),["biblical","openbible"]),authored("Números 33 preserva uma lista de estações, mas não fornece coordenadas para a maioria delas.",r("Num",33,1,49),["biblical"])],
 "tribes-camp":[authored("Judá, Issacar e Zebulom formam o grupo que acampa ao leste do Tabernáculo.",r("Num",2,3,9),["biblical"]),authored("Rúben, Simeão e Gade ficam ao sul do acampamento; Números 3:29 coloca os coatitas ao sul do Tabernáculo.",r("Num",2,10,16),["biblical"]),authored("Dã, Aser e Naftali ficam ao norte; os números são homens recenseados, não a população total.",r("Num",2,25,31),["biblical"])],
 "conquest-canaan":[authored("Após a travessia, Gilgal é descrita como o primeiro acampamento em Canaã.",r("Josh",4,19),["biblical","openbible"]),authored("A campanha do sul inclui a descida de Bete-Horom e a perseguição até Azeca.",r("Josh",10,10,11),["biblical","openbible"]),authored("Josué 24 reúne o povo em Siquém depois das campanhas; por isso Siquém não é desenhada como etapa de Josué 1–12.",r("Josh",24,1),["biblical","openbible"])]
};
const curiositiesFor = places => places.filter(p => p.references[0]).slice(0, 4).map(p => ({
  text: `A narrativa menciona ${p.name} em ${p.references[0].label}; o ponto apresentado é apenas uma referência documental.`,
  reference: p.references[0], sourceIds: [...new Set(["biblical", ...p.sourceIds])],
}));
const sources = [
  { id: "openbible", title: "OpenBible.info — Bible Geocoding (merged, 2007)", url: "https://www.openbible.info/geo/data/merged.txt",
    license: "CC BY 4.0; atribuição OpenBible.info", note: "Chave, coordenadas brutas e passagens preservadas em docs/atlas/evidence/openbible-merged.txt. Identificações debatidas não são confirmação arqueológica." },
  { id: "biblical", title: "Referências bíblicas (paráfrases originais)", url: "https://ebible.org/web/",
    license: "WEB: domínio público; nenhuma tradução protegida copiada", note: "A referência fundamenta a sequência textual, não demonstra a localização de um evento." },
  { id: "editorial", title: "Geometria editorial esquemática", url: "https://www.openbible.info/geo/",
    license: "Desenho original; pontos de apoio OpenBible.info CC BY 4.0", note: "As linhas unem somente pontos de fonte, não registram estradas nem distâncias percorridas. Não são fronteiras antigas." },
];
function add({ id, title, subtitle, subsection, order, period, era, books, characters = [], summary, modernSummary, modernOverview, places, overlays = [], narrative, storySteps, curiosities, references, aliases = [], kind = "map", illustration }) {
  const located = places.filter(p => p.coordinates);
  const bounds = located.length ? [
    Math.min(...located.map(p => p.coordinates[0])), Math.min(...located.map(p => p.coordinates[1])),
    Math.max(...located.map(p => p.coordinates[0])), Math.max(...located.map(p => p.coordinates[1])),
  ] : [0, 0, 0, 0]; // Sentinel for non-geographic diagram; never interpreted as a map.
  const item = {
    id, version: "1", kind, category: "Geografia do Antigo Testamento", testament: "AT",
    books, characters, period, title, subtitle, summary, modernSummary,
    certainty: "debated", sample: sampleFor(id), keywords: [title, ...aliases, ...books, "atlas"],
    section: "old-testament", subsection, order, era, modernOverview,
    keyReferences: references.slice(0, 8), aliases: [...new Set([title, ...aliases, ...places.map(p => p.name)])],
    references, sources: kind === "illustration" ? sources.slice(1, 2) : overlays.length ? sources : sources.slice(0, 2),
    places, overlays, narrative, storySteps: storyStepsFor(storySteps || narrative, places), curiosities: curiosities || curiositiesFor(places), bounds, ...(illustration ? { illustration } : {}),
    review: { date, status: "needs-specialist",
      verified: ["Coordenadas não nulas transcritas de chaves exatas do OpenBible retido; localizações incertas não recebem pino.", "Referências, sequência narrativa e limites compilados editorialmente; nenhuma revisão especializada afirmada."],
      uncertainties: [subtitle, "Pontuação do geocodificador não comprova o episódio, o trajeto ou a época; as alternativas estão anotadas em cada local e na revisão."],
      methodology: "Compilação editorial reprodutível a partir do OpenBible legado preservado. Linhas unicamente entre pontos documentados, sempre esquemáticas; não representam caminhos reais. Locais sem identificação confiável permanecem sem coordenada." },
  };
  for (const p of places) if (p.coordinates && (p.coordinates[0] < bounds[0] || p.coordinates[0] > bounds[2] || p.coordinates[1] < bounds[1] || p.coordinates[1] > bounds[3])) throw new Error(`Bounds: ${id}/${p.id}`);
  for (const o of overlays) for (const [x, y] of o.coordinates) if (x < bounds[0] || x > bounds[2] || y < bounds[1] || y > bounds[3]) throw new Error(`Overlay bounds: ${id}/${o.id}`);
  for (const s of narrative) if (!places.some(p => p.id === s.placeId)) throw new Error(`Orphan step: ${id}/${s.placeId}`);
  const clean = { ...item, places: places.map(({ _key, ...p }) => p) };
  const authoredCuriosities = authoredContent[id];
  clean.storySteps = clean.storySteps.map((s, index) => ({
    ...s,
    title: (places.find(p => p.id === s.placeId)?.name || `Passo ${index + 1}`).split(" — ")[0].split(" (")[0],
  }));
  if (authoredCuriosities) clean.curiosities = authoredCuriosities;
  fs.writeFileSync(`data/atlas/${kind === "map" ? "maps" : "illustrations"}/${id}.json`, JSON.stringify(clean, null, 2) + "\n");
  return item;
}

const batch = [];
{
  const p = [
    unknown("japheth", "Descendentes de Jafé — regiões descritas", "Regiões do Mediterrâneo e da Anatólia; atribuições debatidas", r("Gen",10,2), "Gênesis 10:2–5 apresenta povos e ilhas; não permite desenhar fronteiras étnicas."),
    unknown("ham", "Descendentes de Cam — regiões descritas", "Nordeste da África e partes do Levante; atribuições debatidas", r("Gen",10,6), "Os nomes de Gênesis 10:6–20 abrangem territórios de épocas diferentes; não são um mapa de etnias modernas."),
    place("Babylon","babel","Babel/Babilônia","Ruínas de Babilônia, perto de Hillah, Iraque",r("Gen",10,10),"O texto nomeia Babel no início do reino de Ninrode; a cidade histórica não data essa narrativa.","debated"),
    place("Erech","erech","Ereque/Uruque","Sítio de Uruk/Warka, Iraque",r("Gen",10,10),"Identificação convencional de Ereque com Uruk."),
    debated("accad","Acade","Desconhecido; sítio da cidade de Acade não identificado",r("Gen",10,10),"A linha Accad da base oferece um ponto, mas a cidade antiga não foi localizada de modo seguro. Não usar esse geocódigo como descoberta.", "Accad"),
    place("Nineveh","nineveh","Nínive","Margem oriental de Mossul, Iraque",r("Gen",10,11),"Sítio assírio citado no desenvolvimento da narrativa; não prova a cronologia de Gênesis 10."),
    place("Calah","calah","Calá","Nimrud, perto de Mossul, Iraque",r("Gen",10,11),"Calá é usualmente associada a Nimrud; a atribuição ao personagem do texto é literária."),
    place("Sidon","sidon","Sidom","Saida, Líbano",r("Gen",10,19),"Cidade fenícia; localização da cidade não equivale aos limites de Canaã."),
    place("Gaza","gaza","Gaza","Cidade de Gaza, Faixa de Gaza",r("Gen",10,19),"Topônimo na descrição; o ponto urbano não é fronteira política ou étnica."),
    unknown("shem","Descendentes de Sem — regiões descritas","Mesopotâmia e Levante; associação de povos debatida",r("Gen",10,22),"Os povos de Gênesis 10:22–31 não ocupam uma área uniforme ou demarcável."),
  ];
  batch.push(add({id:"nations-gen-10",title:"Tabela das nações",subtitle:"Gn 10: regiões literárias aproximadas, nunca fronteiras étnicas",subsection:"Origens e patriarcas",order:2,period:"Horizonte literário de Gênesis 10; datação e identificação de povos debatidas",era:"Origens e patriarcas",books:["Gen"],characters:["Jafé","Cam","Sem","Ninrode"],summary:"Gênesis 10 organiza descendentes de Jafé, Cam e Sem em famílias e regiões. Os marcadores só representam cidades identificáveis citadas no capítulo; não representam povos como pontos. A identificação de muitos povos e sua relação com etnias posteriores são debatidas.",modernSummary:"As cidades citadas ficam hoje no Iraque, Líbano e Faixa de Gaza. As descrições de regiões não equivalem a limites nacionais atuais.",
    modernOverview:"Os pontos de Babilônia, Uruque, Nínive e Nimrud ficam no atual Iraque. Sidom fica no Líbano e Gaza na Faixa de Gaza. Jafé, Cam e Sem são apresentados como agrupamentos literários de regiões aproximadas, não como fronteiras ou ancestralidades comprovadas. A cidade de Acade não foi geolocalizada com segurança.",
    places:p, narrative:p.map(x=>step(x, x.explanation)), references:[r("Gen",10,1,5),r("Gen",10,6,20),r("Gen",10,21,31)],aliases:["Gênesis 10","Jafé","Cam","Sem","Ninrode","Babel","Uruque"]}));
}
{
  const p = [
    place("Beersheba","beersheba","Berseba","Tel Be'er Sheva, perto de Be'er Sheva, Israel",r("Gen",28,10),"Partida de Jacó; o sítio antigo não é a casa individual de Isaque."),
    place("Gerar","gerar","Gerar","Região de Tel Haror, sul de Israel; identificação discutida",r("Gen",26,1),"Local de Isaque na narrativa; associação do sítio é debatida.","debated"),
    place("Bethel 1","bethel","Betel","Área de Beitin, Cisjordânia; identificação provável",r("Gen",28,19),"Identificação de Betel com Beitin é comum, não prova a pedra do relato.","probable"),
    place("Haran","haran","Harã (Padã-Arã)","Harran, Turquia",r("Gen",29,4),"A cidade de Harã representa a região de Padã-Arã; não identifica a casa de Labão."),
    unknown("gilead","Gileade","Região a leste do Jordão, sobretudo Jordânia; ponto exato desconhecido",r("Gen",31,21),"O geocódigo Gilead aponta para um ponto genérico de região (>), não para o acampamento de Jacó.", "Gilead"),
    debated("mahanaim","Maanaim","Transjordânia, Jordânia; localização debatida",r("Gen",32,2),"OpenBible sinaliza seu ponto com '?'; não usar esse candidato como localização comprovada.", "Mahanaim"),
    place("Penuel","peniel","Peniel/Penuel","Vale do Jaboque, Jordânia; sítio debatido",r("Gen",32,30),"O ponto de Penuel é um candidato; não localiza o encontro noturno com precisão.","debated"),
    debated("jabbok-ford","Vau do Jaboque","Rio Zarqa, Jordânia; vau exato desconhecido",r("Gen",32,22),"A fonte geocodifica o rio Jaboque, não o vau atravessado por Jacó. Não substituir a travessia pelo ponto do rio.", "Jabbok"),
    place("Succoth 1","succoth","Sucote (leste do Jordão)","Vale do Jordão oriental, Jordânia; sítio debatido",r("Gen",33,17),"Distinta de Sucote do Egito. O sítio específico é discutido.","debated"),
    place("Shechem","shechem","Siquém","Tell Balata, junto a Nablus, Cisjordânia",r("Gen",33,18),"Localidade da narrativa de retorno."),
    place("Bethlehem 1","bethlehem","Belém/Efrata","Belém, Cisjordânia",r("Gen",35,19),"Localidade ligada ao sepultamento de Raquel; não localiza o túmulo com exatidão."),
    place("Hebron","hebron","Hebrom","Al-Khalil/Hebrom, Cisjordânia",r("Gen",35,27),"Chegada à região onde Isaque viveu, sem identificar sua residência."),
  ];
  batch.push(add({id:"isaac-jacob",title:"Isaque e Jacó",subtitle:"Gn 26–35: locais textuais, retornos e travessias incertas",subsection:"Origens e patriarcas",order:4,period:"Horizonte patriarcal; datação histórica não demonstrada",era:"Origens e patriarcas",books:["Gen"],characters:["Isaque","Jacó","Labão"],summary:"O recorte começa com Isaque em Gerar e acompanha Jacó desde Berseba: Betel, Harã e o retorno por Gileade, Maanaim, Peniel, Sucote, Siquém, Betel, Efrata e Hebrom. Lugares sem sítio ou travessia identificável permanecem sem pino; as conexões desenhadas são apenas esquemas parciais.",modernSummary:"O recorte abrange o sul de Israel, a Cisjordânia, a Jordânia e o sudeste da Turquia. Nem todos os locais do texto são identificáveis hoje.",
    modernOverview:"Berseba e o candidato a Gerar ficam no sul de Israel. Betel, Siquém, Belém e Hebrom ficam na Cisjordânia. Harã fica na Turquia; o vale do Jaboque e a região de Sucote ficam na Jordânia. Maanaim, o acampamento de Gileade e o vau do Jaboque não possuem ponto confiável nesta compilação.",
    places:p, overlays:[route("departure","Berseba → Betel → Harã",[p[0],p[2],p[3]],"Ordem de Gênesis 28–29; não representa estrada."),route("return-south","Peniel → Sucote → Siquém → Betel → Belém → Hebrom",[p[6],p[8],p[9],p[2],p[10],p[11]],"Trecho final de Gênesis 32–35; a lacuna Harã–Peniel fica sem linha porque Gileade e Maanaim não têm geocódigos aceitos.")],
    narrative:[step(p[1],"Isaque permanece na região de Gerar, sem que seu acampamento seja identificável.",r("Gen",26,6)),step(p[0],"Jacó parte de Berseba em direção a Harã."),step(p[2],"Jacó chama o lugar de Betel depois do sonho."),step(p[3],"Jacó chega à região de Harã; Padã-Arã não é uma cidade distinta.",r("Gen",29,4)),step(p[4],"Na volta, Jacó atravessa a região de Gileade; seu acampamento não é conhecido."),step(p[5],"O relato nomeia Maanaim, mas a localização do sítio é debatida."),step(p[7],"O texto menciona o vau do Jaboque, não um ponto de travessia recuperável."),step(p[6],"Peniel é um candidato regional, não a posição exata do encontro."),step(p[8],"Jacó ergue uma casa em Sucote, a leste do Jordão."),step(p[9],"Depois chega à região de Siquém."),step(p[2],"O retorno a Betel ocorre em Gênesis 35.",r("Gen",35,6)),step(p[10],"A narrativa segue pela região de Efrata, identificada com Belém."),step(p[11],"Jacó chega a Isaque na região de Hebrom.")],
     references:[r("Gen",26,1,6),r("Gen",28,10,19),r("Gen",29,4),r("Gen",31,21),r("Gen",32,2,31),r("Gen",33,17,18),r("Gen",35,6,27)],aliases:["Padã-Arã","Jaboque","Efrata","Maanaim","Peniel"]}));
}
{
  const p = [
    place("Hebron","hebron","Hebrom","Al-Khalil/Hebrom, Cisjordânia",r("Gen",37,14),"Ponto urbano próximo da residência familiar; não identifica a residência de José."),
    place("Shechem","shechem","Siquém","Tell Balata, junto a Nablus, Cisjordânia",r("Gen",37,13),"José procura os irmãos na região."),
    place("Dothan","dothan","Dotã","Tell Dothan, Cisjordânia",r("Gen",37,17),"O texto situa os irmãos em Dotã; não localiza a cisterna."),
    unknown("egypt","Egito — chegada de José","Egito; residência de José desconhecida",r("Gen",39,1),"O texto não identifica a casa de Potifar, o cárcere nem uma residência de José por coordenada."),
    place("On","on","On/Heliópolis","Sítio de Heliópolis, Cairo, Egito",r("Gen",41,45),"Cidade de origem da esposa de José; não se afirma que ele tenha morado aqui."),
    debated("goshen","Terra de Gósen","Delta oriental do Nilo, Egito; limites e centro desconhecidos",r("Gen",47,1),"A base fornece um ponto para Goshen 1, mas a passagem fala de uma região, não de uma cidade no ponto. Nenhum centro ou fronteira é comprovado.", "Goshen 1"),
  ];
  batch.push(add({id:"joseph-egypt",title:"José e a ida de Israel ao Egito",subtitle:"Gn 37–50: localidades citadas e região de Gósen sem ponto inventado",subsection:"Origens e patriarcas",order:5,period:"Horizonte patriarcal; datação histórica não demonstrada",era:"Origens e patriarcas",books:["Gen"],characters:["José","Jacó","Faraó"],summary:"José sai da região de Hebrom, procura os irmãos em Siquém e chega a Dotã antes de ser levado ao Egito. On/Heliópolis é citada pela família de Asenate; o texto não dá a residência de José. Gósen é uma região associada à família de Jacó, não uma cidade geocodificada com segurança.",modernSummary:"Hebrom, Siquém e Dotã ficam na Cisjordânia. On/Heliópolis fica no Cairo atual e Gósen é geralmente situada no delta oriental do Nilo, Egito.",
    modernOverview:"Hebrom, Siquém e Dotã ficam hoje na Cisjordânia. A narrativa segue para o Egito sem especificar a casa ou cidade de José. On/Heliópolis está na área do Cairo. Gósen é associada ao delta oriental do Nilo, mas seus limites e centro não são identificados com segurança.",
    places:p, overlays:[route("brothers","Hebrom → Siquém → Dotã",[p[0],p[1],p[2]],"Sequência de Gênesis 37:14–17; não se desenha o itinerário de Dotã ao Egito nem a ida de Jacó a Gósen.")],
    narrative:[step(p[0],"José parte do vale de Hebrom a pedido de Jacó para procurar os irmãos.",r("Gen",37,14)),step(p[1],"José chega à região de Siquém e recebe de um homem a informação de que seus irmãos seguiram adiante.",r("Gen",37,15,16)),step(p[2],"José prossegue até Dotã, onde encontra os irmãos.",r("Gen",37,17)),step(p[3],"José é levado ao Egito; Gênesis não informa sua residência com coordenada.",r("Gen",39,1)),step(p[4],"On é citada como origem de Asenate, não como residência atribuída a José."),step(p[5],"A família de Jacó se estabelece na terra de Gósen, cuja extensão continua debatida.",r("Gen",47,1))],
    references:[r("Gen",37,14,17),r("Gen",37,28),r("Gen",39,1),r("Gen",41,45),r("Gen",45,10),r("Gen",46,28),r("Gen",47,1,6)],aliases:["Dotã","Gósen","Heliópolis","On","Jacó no Egito"]}));
}
{
  const p = [
    place("Marah","marah","Mara","Península do Sinai, Egito; identificação tradicional debatida",r("Exod",15,23),"A identidade da fonte de água não está demonstrada.","debated"),
    place("Elim","elim","Elim","Península do Sinai, Egito; identificação tradicional debatida",r("Exod",15,27),"Não comprova as doze fontes e setenta palmeiras.","debated"),
    debated("sin-wilderness","Deserto de Sim","Península do Sinai, Egito; extensão desconhecida",r("Exod",16,1),"A linha 'Sin' usa um ponto regional com '>'; não localiza um acampamento.", "Sin"),
    debated("rephidim","Refidim","Península do Sinai, Egito; sítio debatido",r("Exod",17,1),"A base propõe um ponto, mas a estação não tem identificação arqueológica segura.", "Rephidim"),
    place("Sinai","sinai","Sinai — candidato meridional tradicional","Jebel Musa, península do Sinai, Egito",r("Exod",19,1),"Jebel Musa é candidato tradicional debatido, não identificação do monte bíblico demonstrada.","debated"),
    debated("other-sinai","Sinai — outras hipóteses","Norte do Sinai ou noroeste da Arábia; monte desconhecido",r("Exod",19,1),"Segunda família de propostas mencionada no mapa do Êxodo; não se escolhe um monte nem se desenha rota."),
    place("Kadesh-barnea","kadesh","Cades-Barneia","Região de Tell el-Qudeirat, nordeste do Sinai, Egito",r("Deut",1,19),"Candidato habitual; correspondência narrativa não é comprovada.","debated"),
    place("Ezion-geber","ezion","Eziom-Geber","Região de Eilat/Aqaba, golfo de Aqaba; sítio debatido",r("Num",33,35),"Geocódigo candidato, sem comprovar a estação da peregrinação.","debated"),
    debated("hor","Monte Hor","Sul da Jordânia; identificação do monte debatida",r("Num",20,22),"O ponto Mount Hor 1 é candidato tradicional; o monte da morte de Arão não foi localizado com segurança.", "Mount Hor 1"),
    unknown("moab-plains","Planícies de Moabe","Leste do Jordão, na atual Jordânia; acampamento exato desconhecido",r("Num",33,48),"O ponto genérico da região Moab usa '>' e não localiza as planícies nem o acampamento.", "Moab"),
    place("Mount Nebo","nebo","Monte Nebo","Jabal Nībū, Jordânia",r("Deut",34,1),"Monte tradicionalmente identificado; o texto não indica um ponto específico da vista.","probable"),
  ];
  const missing = [
    ["dophkah","Dofca",12],["alush","Alus",13],["rithmah","Ritma",18],["rimmon-perez","Rimom-Perez",19],
    ["libnah-station","Libna (estação)",20],["rissah","Rissa",21],["kehelathah","Queelata",22],
    ["haradah","Harada",24],["makheloth","Maquelote",25],["tahath","Taate",26],["terah","Tara",27],
    ["mithkah","Mitca",28],["hashmonah","Hasmona",29],["moseroth","Moserote",30],
    ["bene-jaakan","Bene-Jaacã",31],["hor-haggidgad","Hor-Hagidgade",32],["jotbathah","Jotbatá",33],
    ["abronah","Abrona",34],["zalmonah","Zalmona",41],["punon","Punom",42],["oboth","Obote",43],
    ["iye-abarim","Ijé-Abarim",44],["dibon-gad","Dibom-Gade",45],["almon-diblathaim","Almom-Diblataim",46],
  ].map(([id,name,verse])=>unknown(id,name,"Desconhecido",r("Num",33,verse),"A estação é nomeada em Números 33, mas esta compilação não dispõe de geocódigo confiável para o acampamento."));
  batch.push(add({id:"wilderness-kadesh",title:"Peregrinação no deserto",subtitle:"Êx 15–19, Nm 10–21 e 33, Dt 1–2: estações incertas; sem rota inventada",subsection:"Êxodo e deserto",order:7,period:"Narrativa do deserto; datação e itinerário histórico debatidos",era:"Êxodo e deserto",books:["Exod","Num","Deut"],characters:["Moisés","Arão"],summary:"As estações citadas nos textos não permitem reconstituir uma trilha. O candidato meridional tradicional para o Sinai e as propostas do norte do Sinai/noroeste da Arábia são famílias de hipóteses, não trajetos equivalentes comprovados. A maioria das estações de Números 33 permanece sem coordenada.",modernSummary:"As propostas se distribuem pelo Egito, península do Sinai, sul do Levante e Jordânia. Nenhuma estrada do deserto é reconstruída.",
    modernOverview:"Mara, Elim e o candidato Jebel Musa estão na atual península do Sinai, Egito. Cades-Barneia é frequentemente proposta no nordeste do Sinai; Eziom-Geber se associa ao golfo de Aqaba. As planícies de Moabe e o monte Nebo ficam na atual Jordânia. As propostas setentrionais para o Sinai alcançam o norte da península ou o noroeste da Arábia, mas não há localização ou rota consensual.",
    places:[...p,...missing], narrative:[
      ...p.slice(0,3).map(x=>step(x,x.explanation)),
      ...missing.slice(0,2).map(x=>step(x,"Estação textual de Números 33, sem localização confiável nesta compilação.")),
      step(p[3],p[3].explanation),step(p[4],p[4].explanation),
      // A hipótese alternativa permanece em places, mas não é uma estação
      // posterior: é uma interpretação concorrente do mesmo Sinai de Ex 19.
      ...missing.slice(2,18).map(x=>step(x,"Estação textual de Números 33, sem localização confiável nesta compilação.")),
      step(p[7],p[7].explanation),step(p[6],"Após Eziom-Geber, a lista de estações registra Cades; usa-se aqui a referência posterior de Nm 33, não a recapitulação de Dt 1.",r("Num",33,36)),step(p[8],p[8].explanation),
      ...missing.slice(18).map(x=>step(x,"Estação textual de Números 33, sem localização confiável nesta compilação.")),
      step(p[9],p[9].explanation),step(p[10],p[10].explanation),
    ],
    references:[r("Exod",15,23,27),r("Exod",16,1),r("Exod",17,1),r("Exod",19,1),r("Num",20,22),r("Num",33,1,49),r("Deut",1,19),r("Deut",34,1)],aliases:["Mara","Elim","Refidim","Sinai","Cades-Barneia","Moabe","Nebo","Números 33"]}));
}
{
  const tribal = [
    ["judah","Judá",74600,r("Num",2,3)],["issachar","Issacar",54400,r("Num",2,5)],["zebulun","Zebulom",57400,r("Num",2,7)],
    ["reuben","Rúben",46500,r("Num",2,10)],["simeon","Simeão",59300,r("Num",2,12)],["gad","Gade",45650,r("Num",2,14)],
    ["ephraim","Efraim",40500,r("Num",2,18)],["manasseh","Manassés",32200,r("Num",2,20)],["benjamin","Benjamim",35400,r("Num",2,22)],
    ["dan","Dã",62700,r("Num",2,25)],["asher","Aser",41500,r("Num",2,27)],["naphtali","Naftali",53400,r("Num",2,29)],
  ];
  const inner = [
    ["priests","Moisés, Arão e sacerdotes","leste",r("Num",3,38)],
    ["gershon","Gersonitas","oeste",r("Num",3,23)],
    ["kohath","Coatitas","sul",r("Num",3,29)],
    ["merari","Meraritas","norte",r("Num",3,35)],
  ];
  const places = [
    ...tribal.map(([id,name,count,ref])=>unknown(id,`${name} — ${Number(count).toLocaleString("pt-BR")}`, "Acampamento textual; local geográfico desconhecido", ref, "Números 2 informa a posição cardinal e o censo, não distâncias, forma geométrica ou localização arqueológica.")),
    ...inner.map(([id,name,direction,ref])=>unknown(id,name, "Acampamento textual; local geográfico desconhecido", ref, `Números 3 situa este grupo no ${direction} do Tabernáculo, sem medidas ou contorno.`)),
    unknown("tabernacle","Tabernáculo","Desconhecido",r("Num",2,2),"Centro do arranjo textual; não é localização geográfica recuperável."),
  ];
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 760" role="img" aria-labelledby="title desc">',
    '<title id="title">Acampamento das tribos ao redor do Tabernáculo</title>',
    '<desc id="desc">Diagrama textual, não mapa nem planta em escala. Judá, Issacar e Zebulom a leste; Rúben, Simeão e Gade ao sul; Efraim, Manassés e Benjamim a oeste; Dã, Aser e Naftali ao norte. Famílias levíticas no círculo interno.</desc>',
    '<rect width="1000" height="760" fill="#142923"/><text x="500" y="31" text-anchor="middle" fill="#f2e9d9" font-family="sans-serif" font-size="22">Nm 2–3 · orientação textual, sem escala</text>',
  ];
  const card = (x,y,name,detail,width=150) => `<g><rect x="${x}" y="${y}" width="${width}" height="66" rx="10" fill="#244037" stroke="#82c8b8"/><text x="${x+width/2}" y="${y+26}" text-anchor="middle" fill="#f2e9d9" font-family="sans-serif" font-size="16">${name}</text><text x="${x+width/2}" y="${y+49}" text-anchor="middle" fill="#e4a45e" font-family="sans-serif" font-size="15">${detail}</text></g>`;
  svg.push('<text x="500" y="66" text-anchor="middle" fill="#e4a45e" font-family="sans-serif">NORTE · Dã</text>');
  [250,425,600].forEach((x,i)=>svg.push(card(x,85,tribal[9+i][1],Number(tribal[9+i][2]).toLocaleString("pt-BR"))));
  svg.push('<text x="500" y="590" text-anchor="middle" fill="#e4a45e" font-family="sans-serif">SUL · Rúben</text>');
  [250,425,600].forEach((x,i)=>svg.push(card(x,610,tribal[3+i][1],Number(tribal[3+i][2]).toLocaleString("pt-BR"))));
  svg.push('<text x="110" y="169" text-anchor="middle" fill="#e4a45e" font-family="sans-serif">OESTE · Efraim</text>');
  [190,315,440].forEach((y,i)=>svg.push(card(35,y,tribal[6+i][1],Number(tribal[6+i][2]).toLocaleString("pt-BR"))));
  svg.push('<text x="890" y="169" text-anchor="middle" fill="#e4a45e" font-family="sans-serif">LESTE · Judá</text>');
  [190,315,440].forEach((y,i)=>svg.push(card(815,y,tribal[i][1],Number(tribal[i][2]).toLocaleString("pt-BR"))));
  svg.push('<rect x="240" y="220" width="520" height="350" rx="24" fill="none" stroke="#a99b7f" stroke-dasharray="6 7"/>');
  svg.push(card(425,247,"Meraritas","norte"));svg.push(card(275,355,"Gersonitas","oeste"));svg.push(card(575,355,"Moisés e Arão","sacerdotes · leste",170));svg.push(card(425,464,"Coatitas","sul"));
  svg.push('<rect x="433" y="346" width="134" height="93" rx="12" fill="#ad8654" stroke="#f2dab1"/><text x="500" y="398" text-anchor="middle" fill="#16251f" font-family="sans-serif" font-weight="bold" font-size="16">TABERNÁCULO</text>');
  svg.push('<text x="500" y="712" text-anchor="middle" fill="#f2e9d9" font-family="sans-serif" font-size="16">O texto não fornece distâncias nem formato exato do acampamento.</text></svg>');
  fs.writeFileSync("data/atlas/svg/tribes-camp.svg", svg.join("\n") + "\n");
  batch.push(add({id:"tribes-camp",title:"Acampamento das tribos ao redor do Tabernáculo",subtitle:"Nm 2–3: diagrama de orientação, não mapa geográfico nem planta em escala",subsection:"Êxodo e deserto",order:8,period:"Organização do acampamento conforme Números 2–3",era:"Êxodo e deserto",books:["Num"],characters:["Moisés","Arão"],kind:"illustration",summary:"O Tabernáculo aparece no centro do diagrama textual. Leste: Judá, Issacar e Zebulom; sul: Rúben, Simeão e Gade; oeste: Efraim, Manassés e Benjamim; norte: Dã, Aser e Naftali. A disposição das famílias levíticas é indicada no círculo interno; Números não fornece distâncias nem desenho em escala.",modernSummary:"Este é um diagrama de orientação textual, não um local identificável no mapa de hoje. Nenhum acampamento foi localizado por coordenadas.",
    modernOverview:"O diagrama não corresponde a um país, cidade ou sítio moderno identificado. As posições cardinais vêm de Números 2–3, não de escavação de um acampamento específico. Os números são os totais de homens recenseados em Números 2, não populações completas. Não há no texto distância entre tribos ou planta em escala.",
    places,narrative:[step(places[16],"O Tabernáculo ocupa o centro do arranjo descrito, sem sítio geográfico fixado."),...places.slice(0,16).map(x=>step(x,x.explanation))],
    references:[r("Num",2,2),r("Num",2,3,9),r("Num",2,10,16),r("Num",2,18,24),r("Num",2,25,31),r("Num",3,23),r("Num",3,29),r("Num",3,35)],
    aliases:["Números 2","Números 3","tribos","levitas","orientação","censo"],
    illustration:{svgFile:"tribes-camp.svg",dimensions:[],notes:["Diagrama original, não mapa nem planta em escala.","Os totais são os do censo de Números 2; não há distância ou formato exato no texto."],relatedIds:["exodus-hypotheses","wilderness-kadesh"],parts:[
      {id:"east",name:"Leste",description:"Judá, Issacar e Zebulom; sacerdotes a leste do Tabernáculo.",references:[r("Num",2,3),r("Num",3,38)]},
      {id:"south",name:"Sul",description:"Rúben, Simeão e Gade; coatitas ao sul do Tabernáculo.",references:[r("Num",2,10),r("Num",3,29)]},
      {id:"west",name:"Oeste",description:"Efraim, Manassés e Benjamim; gersonitas a oeste do Tabernáculo.",references:[r("Num",2,18),r("Num",3,23)]},
      {id:"north",name:"Norte",description:"Dã, Aser e Naftali; meraritas ao norte do Tabernáculo.",references:[r("Num",2,25),r("Num",3,35)]},
    ]}}));
}
{
  const p = [
    place("Shittim","shittim","Sitim","Vale do Jordão, atual Jordânia",r("Josh",3,1),"Local de partida da travessia; não fixa o vau do Jordão.","probable"),
    unknown("jordan-crossing","Travessia do Jordão","Rio Jordão; vau exato desconhecido",r("Josh",3,14),"O rio é identificável, mas o ponto de travessia descrito não foi estabelecido."),
    place("Gilgal 1","gilgal","Gilgal","Região de Jericó, Cisjordânia; identificação debatida",r("Josh",4,19),"O sítio do primeiro acampamento após o Jordão não é comprovado.","debated"),
    place("Jericho","jericho","Jericó","Tell es-Sultan, Ariha/Jericó, Cisjordânia",r("Josh",6,1),"Tell es-Sultan é sítio antigo de Jericó; data e escala do episódio são debatidas.","probable"),
    place("Ai 1","ai","Ai — candidato et-Tell","Região de et-Tell, Cisjordânia; alternativas discutidas",r("Josh",7,2),"Identificação com et-Tell é debatida e há alternativas; o ponto não comprova a destruição descrita.","debated"),
    place("Bethel 1","bethel","Betel","Área de Beitin, Cisjordânia",r("Josh",8,17),"Os habitantes de Betel são mencionados junto aos de Ai; não se afirma uma escala militar comprovada.","probable"),
    place("Mount Ebal","ebal","Monte Ebal","Monte Ebal, junto a Nablus, Cisjordânia",r("Josh",8,30),"Elevação da cerimônia textual, sem localização de altar."),
    place("Mount Gerizim","gerizim","Monte Gerizim","Monte Gerizim, junto a Nablus, Cisjordânia",r("Josh",8,33),"Elevação citada com o Ebal."),
    place("Shechem","shechem","Siquém","Tell Balata, junto a Nablus, Cisjordânia",r("Josh",24,1),"Referência regional para os montes Ebal e Gerizim. Siquém é nomeada na reunião posterior de Josué 24, não em Josué 8:33.","probable"),
    place("Gibeon","gibeon","Gibeão","Al-Jib, Cisjordânia",r("Josh",10,6),"Localidade da aliança e da campanha meridional."),
    place("Beth-horon","beth-horon","Bete-Horom","Passagem de Bete-Horom, Cisjordânia",r("Josh",10,10),"A fonte aponta Bete-Horom inferior; o texto descreve a descida, não um ponto único.","probable"),
    place("Azekah","azekah","Azeca","Tel Azekah, Israel",r("Josh",10,11),"Extensão da perseguição descrita no texto."),
    debated("makkedah","Maquedá","Sefelá, Israel; sítio exato debatido",r("Josh",10,16),"Há candidatos para Maquedá; o ponto do OpenBible não basta para fixar a caverna ou cidade.", "Makkedah"),
    debated("libnah","Libna","Sefelá, Israel; sítio exato desconhecido",r("Josh",10,29),"A linha Libnah 1 usa o ponto de Laquis com til (~); rejeitada para não marcar Libna como Laquis.", "Libnah 1"),
    place("Lachish","lachish","Laquis","Tel Lachish, Israel",r("Josh",10,31),"Sítio de Laquis; não estabelece a cronologia da campanha."),
    debated("eglon","Eglom","Sefelá, Israel; identificação debatida",r("Josh",10,34),"A geocodificação de Eglom é candidato não corroborado aqui.", "Eglon"),
    place("Hebron","hebron","Hebrom","Al-Khalil/Hebrom, Cisjordânia",r("Josh",10,36),"Cidade do relato meridional, sem confirmar o ano da campanha."),
    debated("debir","Debir","Sul do Levante; identificação debatida",r("Josh",10,38),"O geocódigo Debir 1 é candidato disputado; não se usa como local confirmado.", "Debir 1"),
    debated("merom","Águas de Merom","Norte de Israel; localização das águas debatida",r("Josh",11,5),"A linha Merom oferece ponto candidato, mas o corpo de água da batalha não tem identificação conclusiva.", "Merom"),
    place("Hazor 1","hazor","Hazor","Tel Hazor, Israel",r("Josh",11,10),"Cidade bem identificada; atribuir uma camada arqueológica específica a Josué 11 requer pesquisa.","probable"),
  ];
  batch.push(add({id:"conquest-canaan",title:"Conquista de Canaã",subtitle:"Js 1–12: campanhas central, sul e norte; escala e datas debatidas",subsection:"Conquista e juízes",order:9,period:"Narrativa de Josué 1–12; data e extensão histórica debatidas",era:"Conquista e juízes",books:["Josh"],characters:["Josué"],summary:"Três camadas separam a sequência central (Sitim até os montes Ebal e Gerizim), a campanha do sul (Gibeão a Debir) e a do norte (Merom e Hazor). Siquém é mantida apenas como referência posterior de Josué 24. Cada linha é apenas conexão esquemática entre pontos citados, nunca caminho militar reconstruído. Ai e vários centros do sul têm identificação debatida; a data e a escala histórica da conquista também são discutidas.",modernSummary:"A região apresentada ocupa hoje Israel, a Cisjordânia e a margem oriental do Jordão, na Jordânia. Sítios antigos e cidades atuais não coincidem sempre.",
    modernOverview:"Sitim é situada na atual Jordânia; Jericó, Betel, os montes de Ebal e Gerizim, Gibeão e Hebrom ficam na Cisjordânia. Azeca, Laquis e Hazor ficam no atual Israel. O ponto exato de travessia do Jordão, as águas de Merom e muitos sítios do sul permanecem discutidos. Os marcadores atuais orientam o leitor, sem fixar datas, fronteiras ou a escala histórica das campanhas.",
    places:p, overlays:[
      route("central","Campanha central — trechos com ponto documentado",[p[0],p[2],p[3],p[4],p[5],p[6],p[7]],"O vau do Jordão não é desenhado; Betel é citada com Ai em Josué 8:17 e Siquém fica fora desta campanha."),
      route("south","Campanha sul — trecho inicial",[p[9],p[10],p[11]],"Maquedá e Libna não recebem linha por não terem sítio aceito aqui."),
      campaignPoint("north","Campanha norte — Hazor (Merom sem pino)",p[19],"A batalha junto às águas de Merom não é colocada no mapa."),
    ],
    narrative:[
      ...p.slice(0,8).map(x=>step(x,x.explanation,x.references[0],"Campanha central")),
      ...p.slice(9,18).map(x=>step(x,x.explanation,x.references[0],"Campanha sul")),
      ...p.slice(18).map(x=>step(x,x.explanation,x.references[0],"Campanha norte")),
      step(p[8],"Siquém é registrada aqui como referência contextual posterior, na assembleia de Josué 24; não integra a campanha de Josué 1–12.",r("Josh",24,1),"Contexto posterior"),
    ],
    references:[r("Josh",3,1,17),r("Josh",4,19),r("Josh",6,1),r("Josh",7,2),r("Josh",8,30,35),r("Josh",10,6,42),r("Josh",11,5,13),r("Josh",12,16)],
    aliases:["Sitim","Ai","et-Tell","Jericó","Merom","Hazor","Gibeão","campanha central","campanha sul","campanha norte"]}));
}

let review = fs.readFileSync("docs/atlas/maps-review.md","utf8");
review = review.replace("Versão 1; dez mapas; todos sample=true.", "Versão 1: dez mapas amostrais (sample=true) e lote adicional de cinco mapas e um diagrama (sample=false).");
review += "\n## Lote 1 — seis novos itens do Antigo Testamento\n\nA data do gerador não indica revisão humana. Nenhuma coordenada foi criada para uma localidade sem geocódigo confiável; as posições no SVG são somente composição visual. Os envelopes de povos de Gn 10 não foram desenhados: as associações não justificam vértices precisos. As campanhas são linhas esquemáticas parciais ou um marcador em Hazor, nunca fronteiras.\n";
for (const map of batch) {
  review += `\n### ${map.id} — ${map.title}\n\nEstado: **${map.review.status}**. Referências-chave: ${map.keyReferences.map(x=>x.label).join("; ")}. Bounds [oeste,sul,leste,norte]: ${JSON.stringify(map.bounds)}${map.kind === "illustration" ? " (sentinela não geográfica)" : ""}.\n\n`;
  for (const p of map.places) {
    review += `- **${p.name}** (${p.id}); hoje: ${p.modernName}; coordenada: ${JSON.stringify(p.coordinates)}; certeza: ${p.certainty}; referência: ${p.references.map(x=>x.label).join(", ")}.\n`;
    if (p._key) {
      const row = rows.get(p._key);
      review += `  - Fonte retida: [openbible-merged.txt](evidence/openbible-merged.txt), chave literal “${row[0]}”, latitude “${row[2]}”, longitude “${row[3]}”${p.coordinates ? "; transcritas como [longitude, latitude]." : "; ponto da fonte rejeitado: não localiza este sítio/evento com confiança."}\n`;
    } else review += "  - Sem geocódigo aceito; fonte da associação: passagem bíblica citada. Nenhuma posição inferida.\n";
    review += `  - Incerteza: ${p.explanation}\n`;
  }
  review += `\nPassos narrativos: ${map.storySteps.length}; curiosidades: ${map.curiosities.length}; referências e incertezas permanecem rastreáveis no JSON gerado.\n\nCamadas: ${map.overlays.map(o=>`${o.label} (${o.kind}, ${o.certainty}): ${o.explanation}`).join("; ") || "nenhuma geometria de trajeto ou região"}. Limites: ${map.review.uncertainties.join(" ")}\n`;
}
fs.writeFileSync("docs/atlas/maps-review.md",review);
console.log(`Compiled ${batch.length} new items; ${batch.reduce((n,m)=>n+m.places.length,0)} place entries.`);