// Build NT lemma→Strong's Exhaustive (forma flexionada) aliases.
// Popula bible_words.pdf_strong para tokens NT cuja forma flexionada
// corresponde a um número Strong distinto do lema (convenção SBB Almeida-Strong).
//
// Estratégia: para cada (lema, morfologia) conhecida, mapeia para o Strong
// flexionado correspondente. Não toca em AT (segundo decisão do usuário).

import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ===========================================================================
// MAPEAMENTOS lema (G####) + morfologia → Strong's Exhaustive (forma flexionada)
// ===========================================================================
// Morfologia segue padrão UGNT/Robinson: "Gr,V,IPA3,,S," etc.
// Onde o terceiro campo descreve tempo/voz/modo/pessoa.
//
// Para verbos: TVMPN (Tense/Voice/Mood + Person + Number)
//   Pos 0: T = Present, I = Imperfect, F = Future, A = Aorist, X = Perfect, Y = Pluperfect
//   Pos 1: P = Indicative... wait, the actual UGNT format is:
//     IPA3 = Indicative Present Active 3sg
//     IIA3 = Indicative Imperfect Active 3sg
//     IFM3 = Indicative Future Middle 3sg (lol -> Greek future of εἰμί is morphologically middle)
//     IAA3 = Indicative Aorist Active 3sg
//     SPA3 = Subjunctive Present Active 3sg
//     OPA3 = Optative Present Active 3sg
//     MPA3 = iMperative Present Active 3sg
//     NPA  = iNfinitive Present Active
//     PPA  = Participle Present Active
//     IIM1 = Indicative Imperfect Middle 1sg

// εἰμί (G1510) — verbo "ser/estar"
// Strong's Exhaustive separa cada conjugação em número distinto.
function mapEimi(morph) {
  // morph format: "Gr,V,XXX,Y," where XXX is tense+mood+voice+person, Y is number
  if (!morph || !morph.startsWith('Gr,V,')) return null;
  const parts = morph.split(',');
  const tmvp = parts[2] || '';   // ex: IPA3, IIA3, IFM3
  const number = parts[4] || ''; // S or P

  // Mapeamento explícito (casos cobertos pela SBB)
  const map = {
    // Presente Indicativo
    'IPA1,S': 'G1510', // εἰμι (já é o lema)
    'IPA2,S': 'G1488', // εἶ
    'IPA3,S': 'G2076', // ἐστι(ν)
    'IPA1,P': 'G2070', // ἐσμεν
    'IPA2,P': 'G2075', // ἐστε
    'IPA3,P': 'G1526', // εἰσι(ν)
    // Imperfeito Indicativo (todas as pessoas → G2258 na SBB)
    'IIA1,S': 'G2252', // ἤμην
    'IIA2,S': 'G2258', // ἦς
    'IIA3,S': 'G2258', // ἦν
    'IIA1,P': 'G2258', // ἦμεν
    'IIA2,P': 'G2258', // ἦτε
    'IIA3,P': 'G2258', // ἦσαν
    'IIM1,S': 'G2252', // middle imperfect (variante de ἤμην)
    // Futuro (futuro de εἰμί é morfologicamente médio na UGNT)
    'IFM1,S': 'G2071', // ἔσομαι
    'IFM2,S': 'G2071', // ἔσῃ
    'IFM3,S': 'G2071', // ἔσται
    'IFM1,P': 'G2071', // ἐσόμεθα
    'IFM2,P': 'G2071', // ἔσεσθε
    'IFM3,P': 'G2071', // ἔσονται
    // Subjuntivo, Optativo, Imperativo, Infinitivo, Particípio
    'SPA1,S': 'G5600', 'SPA2,S': 'G5600', 'SPA3,S': 'G5600',
    'SPA1,P': 'G5600', 'SPA2,P': 'G5600', 'SPA3,P': 'G5600',
    'OPA1,S': 'G1498', 'OPA2,S': 'G1498', 'OPA3,S': 'G1498',
    'OPA1,P': 'G1498', 'OPA2,P': 'G1498', 'OPA3,P': 'G1498',
    'MPA2,S': 'G2468', 'MPA3,S': 'G2468',
    'MPA2,P': 'G2468', 'MPA3,P': 'G2468',
  };
  // Particípio e Infinitivo (sem pessoa/número no terceiro campo)
  if (tmvp === 'NPA') return 'G1511';                    // εἶναι (infinitivo)
  if (tmvp === 'PPA') return 'G5607';                    // ὤν (particípio)

  const key = `${tmvp},${number}`;
  return map[key] || null;
}

// λέγω (G3004) → aoristos viram G2036 (εἶπον)
// Apenas formas IAA* (Indicativo Aoristo Ativo)
function mapLego(morph) {
  if (!morph || !morph.startsWith('Gr,V,')) return null;
  const tmvp = morph.split(',')[2] || '';
  // SBB usa G2036 para todas as formas do aoristo de λέγω
  if (tmvp.startsWith('IAA') || tmvp === 'PAA' || tmvp === 'NAA' ||
      tmvp.startsWith('SAA') || tmvp.startsWith('MAA') || tmvp.startsWith('OAA')) {
    return 'G2036';
  }
  // Futuro ἐρῶ → G2046
  if (tmvp.startsWith('IFA') || tmvp.startsWith('IFM') || tmvp === 'NFA' || tmvp === 'PFA') {
    return 'G2046';
  }
  // Perfeito εἴρηκα → G2046 (cross-ref clássico)
  if (tmvp.startsWith('IXA') || tmvp.startsWith('IYA') || tmvp === 'PXA' || tmvp === 'PYA') {
    return 'G2046';
  }
  return null;
}

// ἐγώ (G1473) — pronome pessoal 1ª pessoa
// SBB distingue formas ENCLÍTICAS (μου, μοι, με) de formas TÔNICAS (ἐμοῦ, ἐμοί, ἐμέ).
// Usamos a palavra original para escolher o Strong correto.
function mapEgo(morph, word) {
  if (!morph || !morph.startsWith('Gr,RP,')) return null;
  const parts = morph.split(',');
  const casePerson = parts[4] || '';
  const number = parts[5] || '';
  const w = (word || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (number === 'S') {
    if (casePerson === '1N') return 'G1473';
    if (casePerson === '1G') return w.startsWith('εμ') ? 'G1700' : 'G3450';
    if (casePerson === '1A') return w.startsWith('εμ') ? 'G1691' : 'G3165';
    if (casePerson === '1D') return w.startsWith('εμ') ? 'G1698' : 'G3427';
  }
  if (number === 'P') {
    if (casePerson === '1N') return 'G2249';
    if (casePerson === '1G') return 'G2257';
    if (casePerson === '1A') return 'G2248';
    if (casePerson === '1D') return 'G2254';
  }
  return null;
}

// σύ (G4771) — pronome pessoal 2ª pessoa
function mapSy(morph, word) {
  if (!morph || !morph.startsWith('Gr,RP,')) return null;
  const parts = morph.split(',');
  const casePerson = parts[4] || '';
  const number = parts[5] || '';

  const key = `${casePerson},${number}`;
  const map = {
    '2N,S': 'G4771', // σύ (lema)
    '2G,S': 'G4675', // σου
    '2A,S': 'G4571', // σε
    '2D,S': 'G4671', // σοι
    '2N,P': 'G5210', // ὑμεῖς
    '2G,P': 'G5216', // ὑμῶν
    '2A,P': 'G5209', // ὑμᾶς
    '2D,P': 'G5213', // ὑμῖν
  };
  return map[key] || null;
}

// εἷς (G1520) — numeral "um/uma"
// SBB usa G3391 para o feminino μία (e suas flexões)
function mapHeis(morph, word) {
  if (!morph) return null;
  // Todas as flexões femininas viram G3391
  if (/[NGAD]F[SP]/.test(morph)) return 'G3391';
  return 'G1520';
}

// Ἱεροσόλυμα (G2414) — Jerusalém em forma grega
// SBB usa G2419 para a forma hebraica indeclinável Ἰερουσαλήμ
function mapJerusalem(morph, word) {
  if (!word) return null;
  const w = word.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  // Ἰερουσαλήμ (indeclinável) → G2419
  if (w.startsWith('ιερουσαλη')) return 'G2419';
  return 'G2414';
}

// ἐσθίω (G2068) — verbo "comer". SBB usa G5315 para formas de raiz φαγ-/εφαγ-
function mapEsthio(morph, word) {
  if (!word) return null;
  const w = word.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (w.startsWith('φαγ') || w.startsWith('εφαγ') || w.startsWith('εφαγο')) return 'G5315';
  return 'G2068';
}

// ὁράω (G3708) — verbo "ver". SBB tem várias variantes:
//   ἰδού, ἴδε → G2400 (interjeição "veja!")
//   ὀφθήσομαι, ὤφθη... → G3700 (passivo/aoristo passivo)
//   ὁρῶ, ὁρᾷς, ὅρα → G3708 (lema)
//   εἶδον/ἴδω/ὄψομαι (formas regulares) → ainda G3708
function mapHorao(morph, word) {
  if (!word) return null;
  const w = word.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  // ἰδού interjeição (presente meio-passivo, mas usado como exclamação)
  if (w === 'ιδου') return 'G2400';
  if (w === 'ιδε') return 'G2396';
  // ὤφθη (aor passivo 3sg) e similares → G3700
  if (w.startsWith('ωφθ') || w.startsWith('ωφθη') || w.startsWith('οφθ') ||
      w.startsWith('οψ') || w.startsWith('οπτα') || w.startsWith('οπτο')) return 'G3700';
  return 'G3708';
}

// μιμνῄσκομαι (G3403) — "lembrar". SBB usa G3415 (μνάομαι, lema clássico)
function mapMimnesko(morph, word) {
  return 'G3415';
}

// οὗτος (G3778) — pronome demonstrativo "este"
// Morfologia: "Gr,RD,,,,ANS," → 6o campo = caso+gênero+número
function mapHoutos(morph) {
  if (!morph || !morph.startsWith('Gr,')) return null;
  const parts = morph.split(',');
  // Aceita tanto RD (pronoun demonstrative) quanto ED (determiner demonstrative)
  if (parts[1] !== 'RD' && parts[1] !== 'ED') return null;
  const cgn = parts[5] || ''; // ex: NMS, GNP, AFS

  // SBB usa números distintos por caso/gênero/número
  const map = {
    'NMS': 'G3778', // οὗτος (lema)
    'GMS': 'G5127', // τούτου
    'DMS': 'G5129', // τούτῳ
    'AMS': 'G5126', // τοῦτον
    'NFS': 'G3778', // αὕτη
    'GFS': 'G5026', // ταύτης
    'DFS': 'G5026', // ταύτῃ
    'AFS': 'G5026', // ταύτην
    'NNS': 'G5124', // τοῦτο (sujeito neutro)
    'GNS': 'G5127', // τούτου (gen neut = mesmo masc)
    'DNS': 'G5129', // τούτῳ (dat neut)
    'ANS': 'G5124', // τοῦτο (acc neut)
    'NMP': 'G3778', // οὗτοι
    'GMP': 'G5130', // τούτων
    'DMP': 'G5125', // τούτοις
    'AMP': 'G5128', // τούτους
    'NFP': 'G3778', // αὗται
    'GFP': 'G5130', // τούτων (gen pl)
    'DFP': 'G5025', // ταύταις
    'AFP': 'G5025', // ταύτας (raro)
    'NNP': 'G5023', // ταῦτα (nom neut pl)
    'GNP': 'G5130', // τούτων (gen pl)
    'DNP': 'G5125', // τούτοις (dat pl)
    'ANP': 'G5023', // ταῦτα (acc neut pl)
  };
  return map[cgn] || null;
}

// ἐκεῖνος (G1565) — pronome demonstrativo "aquele"
// SBB usa G1565 para TODAS as formas (lema = exhaustive aqui).
// Apenas mantém G1565 (não há diferença).
function mapEkeinos(morph) {
  return 'G1565';
}

// Estrutura final: lemma_strong → função(morph, original_word) → exhaustive_strong
const ALIAS_RULES = {
  'G1510': (m, w) => {
    // Imperativo MPA3 → G2077 (ἔστω) específico SBB
    if (m && m.includes(',MPA3,')) return 'G2077';
    return mapEimi(m);
  },
  'G3004': (m, w) => mapLego(m),
  'G1473': mapEgo,
  'G4771': mapSy,
  'G3778': (m, w) => mapHoutos(m),
  'G1565': () => 'G1565',
  'G1520': mapHeis,
  'G2414': mapJerusalem,
  'G2068': mapEsthio,
  'G3708': mapHorao,
  'G3403': mapMimnesko,
};

// Lista de livros NT
const NT_BOOKS = [
  'mat','mrk','luk','jhn','act','rom','1co','2co','gal','eph','php','col',
  '1th','2th','1ti','2ti','tit','phm','heb','jas','1pe','2pe','1jn','2jn','3jn','jud','rev'
];

async function main() {
  console.log('=== Construindo aliases lema→flexionado para NT ===\n');

  // 1) Estatística antes
  const before = await pool.query(`
    SELECT COUNT(*) as total,
           COUNT(*) FILTER (WHERE pdf_strong IS NOT NULL) as with_alias
    FROM bible_words
    WHERE book = ANY($1::text[]) AND strong_number LIKE 'G%'
  `, [NT_BOOKS]);
  console.log(`Tokens NT: ${before.rows[0].total}, com alias antes: ${before.rows[0].with_alias}`);

  // 2) Buscar tokens NT cujo lema está nas regras
  const lemmas = Object.keys(ALIAS_RULES);
  console.log(`\nLemas tratados: ${lemmas.join(', ')}`);

  // Transação: ou tudo, ou nada (evita estado intermediário em caso de falha)
  const client = await pool.connect();
  await client.query('BEGIN');

  // Limpa pdf_strong NT antes (idempotente, dentro da mesma transação)
  await client.query(`UPDATE bible_words SET pdf_strong = NULL WHERE book = ANY($1::text[])`, [NT_BOOKS]);

  const rowsResult = await client.query(`
    SELECT id, strong_number, morphology, original_word
    FROM bible_words
    WHERE book = ANY($1::text[])
      AND strong_number = ANY($2::text[])
  `, [NT_BOOKS, lemmas]);
  console.log(`\nTokens candidatos: ${rowsResult.rows.length}`);

  // 3) Calcular alias para cada token
  let mapped = 0;
  let unchanged = 0;
  let unmapped = 0;
  const unmappedSamples = new Map();
  const updates = []; // [{id, pdf_strong}]

  for (const row of rowsResult.rows) {
    const fn = ALIAS_RULES[row.strong_number];
    if (!fn) continue;
    const exhaustive = fn(row.morphology, row.original_word);
    if (!exhaustive) {
      unmapped++;
      const key = `${row.strong_number}|${row.morphology}`;
      unmappedSamples.set(key, (unmappedSamples.get(key) || 0) + 1);
      continue;
    }
    if (exhaustive === row.strong_number) {
      // alias = lema (caso já coberto, ex: G1510 ↔ εἰμι 1sg)
      // Mesmo assim populamos para que a métrica conte corretamente
      updates.push({ id: row.id, pdf_strong: exhaustive });
      unchanged++;
    } else {
      updates.push({ id: row.id, pdf_strong: exhaustive });
      mapped++;
    }
  }
  console.log(`Mapeados (alias ≠ lema): ${mapped}`);
  console.log(`Iguais ao lema (alias = lema): ${unchanged}`);
  console.log(`Sem mapeamento (morfologia incomum): ${unmapped}`);
  if (unmapped > 0) {
    console.log('Top 10 morfologias sem regra:');
    const top = [...unmappedSamples.entries()].sort((a,b) => b[1]-a[1]).slice(0,10);
    for (const [k, c] of top) console.log(`  ${k}  (${c}x)`);
  }

  // 4) Aplicar UPDATE em batches (mesma transação)
  console.log(`\nAplicando ${updates.length} UPDATEs em batches de 5000...`);
  const BATCH = 5000;
  try {
    for (let i = 0; i < updates.length; i += BATCH) {
      const batch = updates.slice(i, i + BATCH);
      const values = batch.map((u, idx) => `($${idx*2 + 1}, $${idx*2 + 2})`).join(',');
      const params = batch.flatMap(u => [u.id, u.pdf_strong]);
      await client.query(`
        UPDATE bible_words AS bw
        SET pdf_strong = v.alias
        FROM (VALUES ${values}) AS v(id, alias)
        WHERE bw.id = v.id
      `, params);
      process.stdout.write(`\r  ${Math.min(i + BATCH, updates.length)}/${updates.length}`);
    }
    await client.query('COMMIT');
    console.log('\nUPDATEs concluídos (transação commitada).');
  } catch (err) {
    await client.query('ROLLBACK');
    client.release();
    throw err;
  }
  client.release();

  // 5) Estatística depois
  const after = await pool.query(`
    SELECT COUNT(*) as total,
           COUNT(*) FILTER (WHERE pdf_strong IS NOT NULL) as with_alias
    FROM bible_words
    WHERE book = ANY($1::text[]) AND strong_number LIKE 'G%'
  `, [NT_BOOKS]);
  console.log(`\nTokens NT: ${after.rows[0].total}, com alias depois: ${after.rows[0].with_alias}`);

  // 6) Distribuição dos novos aliases
  const dist = await pool.query(`
    SELECT pdf_strong, COUNT(*) as cnt
    FROM bible_words
    WHERE book = ANY($1::text[]) AND pdf_strong IS NOT NULL
    GROUP BY pdf_strong
    ORDER BY cnt DESC
    LIMIT 20
  `, [NT_BOOKS]);
  console.log('\nTop 20 aliases gerados:');
  for (const r of dist.rows) console.log(`  ${r.pdf_strong}: ${r.cnt}x`);

  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
