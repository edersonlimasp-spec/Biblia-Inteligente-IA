import { db } from '../server/db';
import { strongEntries } from '../shared/schema';
import { sql } from 'drizzle-orm';

// MVP subset of important Strong's entries
// This demonstrates the complete architecture working
// Full 14k+ entries can be added via batch import later

const greekEntries = [
  { number: "G26", lemma: "ἀγάπη", transliteration: "agápē", pronunciation: "ag-ah'-pay", definition: "love, charity", language: "greek" },
  { number: "G25", lemma: "ἀγαπάω", transliteration: "agapáō", pronunciation: "ag-ap-ah'-o", definition: "to love", language: "greek" },
  { number: "G2316", lemma: "θεός", transliteration: "theós", pronunciation: "theh'-os", definition: "God, god", language: "greek" },
  { number: "G2424", lemma: "Ἰησοῦς", transliteration: "Iēsoûs", pronunciation: "ee-ay-sooce'", definition: "Jesus", language: "greek" },
  { number: "G5547", lemma: "Χριστός", transliteration: "Christós", pronunciation: "khris-tos'", definition: "Christ, anointed", language: "greek" },
  { number: "G4151", lemma: "πνεῦμα", transliteration: "pneûma", pronunciation: "pnyoo'-mah", definition: "spirit, Spirit, wind, breath", language: "greek" },
  { number: "G40", lemma: "ἅγιος", transliteration: "hágios", pronunciation: "hag'-ee-os", definition: "holy, saint", language: "greek" },
  { number: "G3056", lemma: "λόγος", transliteration: "lógos", pronunciation: "log'-os", definition: "word, Word, saying, speech", language: "greek" },
  { number: "G4102", lemma: "πίστις", transliteration: "pístis", pronunciation: "pis'-tis", definition: "faith, belief, trust", language: "greek" },
  { number: "G1680", lemma: "ἐλπίς", transliteration: "elpís", pronunciation: "el-pece'", definition: "hope, expectation", language: "greek" },
  { number: "G5485", lemma: "χάρις", transliteration: "cháris", pronunciation: "khar'-ece", definition: "grace, favor, thanks", language: "greek" },
  { number: "G1515", lemma: "εἰρήνη", transliteration: "eirḗnē", pronunciation: "i-ray'-nay", definition: "peace", language: "greek" },
  { number: "G3772", lemma: "οὐρανός", transliteration: "ouranós", pronunciation: "oo-ran-os'", definition: "heaven, sky", language: "greek" },
  { number: "G932", lemma: "βασιλεία", transliteration: "basileía", pronunciation: "bas-il-i'-ah", definition: "kingdom, reign", language: "greek" },
  { number: "G2222", lemma: "ζωή", transliteration: "zōḗ", pronunciation: "dzo-ay'", definition: "life", language: "greek" },
  { number: "G266", lemma: "ἁμαρτία", transliteration: "hamartía", pronunciation: "ham-ar-tee'-ah", definition: "sin", language: "greek" },
  { number: "G1342", lemma: "δίκαιος", transliteration: "díkaios", pronunciation: "dik'-ah-yos", definition: "righteous, just", language: "greek" },
  { number: "G1343", lemma: "δικαιοσύνη", transliteration: "dikaiosýnē", pronunciation: "dik-ah-yos-oo'-nay", definition: "righteousness, justice", language: "greek" },
  { number: "G4982", lemma: "σώζω", transliteration: "sṓzō", pronunciation: "sode'-zo", definition: "to save, deliver", language: "greek" },
  { number: "G4991", lemma: "σωτηρία", transliteration: "sōtēría", pronunciation: "so-tay-ree'-ah", definition: "salvation, deliverance", language: "greek" },
  { number: "G1577", lemma: "ἐκκλησία", transliteration: "ekklēsía", pronunciation: "ek-klay-see'-ah", definition: "church, assembly", language: "greek" },
  { number: "G652", lemma: "ἀπόστολος", transliteration: "apóstolos", pronunciation: "ap-os'-tol-os", definition: "apostle, messenger", language: "greek" },
  { number: "G4396", lemma: "προφήτης", transliteration: "prophḗtēs", pronunciation: "prof-ay'-tace", definition: "prophet", language: "greek" },
  { number: "G4487", lemma: "ῥῆμα", transliteration: "rhēma", pronunciation: "hray'-mah", definition: "word, saying, thing", language: "greek" },
  { number: "G1391", lemma: "δόξα", transliteration: "dóxa", pronunciation: "dox'-ah", definition: "glory, splendor", language: "greek" },
  { number: "G1849", lemma: "ἐξουσία", transliteration: "exousía", pronunciation: "ex-oo-see'-ah", definition: "authority, power, right", language: "greek" },
  { number: "G1411", lemma: "δύναμις", transliteration: "dýnamis", pronunciation: "doo'-nam-is", definition: "power, ability, might", language: "greek" },
  { number: "G3340", lemma: "μετανοέω", transliteration: "metanoéō", pronunciation: "met-an-o-eh'-o", definition: "to repent, change mind", language: "greek" },
  { number: "G2889", lemma: "κόσμος", transliteration: "kósmos", pronunciation: "kos'-mos", definition: "world, universe", language: "greek" },
  { number: "G235", lemma: "ἀλλά", transliteration: "allá", pronunciation: "al-lah'", definition: "but, except, however", language: "greek" },
];

const hebrewEntries = [
  { number: "H430", lemma: "אֱלֹהִים", transliteration: "ʾĕlōhîm", pronunciation: "el-o-heem'", definition: "God, gods", language: "hebrew" },
  { number: "H3068", lemma: "יְהֹוָה", transliteration: "YHWH", pronunciation: "yeh-ho-vaw'", definition: "LORD, Yahweh", language: "hebrew" },
  { number: "H136", lemma: "אֲדֹנָי", transliteration: "ʾădōnāy", pronunciation: "ad-o-noy'", definition: "Lord, master", language: "hebrew" },
  { number: "H157", lemma: "אָהֵב", transliteration: "ʾāhēḇ", pronunciation: "aw-hab'", definition: "to love", language: "hebrew" },
  { number: "H160", lemma: "אַהֲבָה", transliteration: "ʾahăḇāh", pronunciation: "a-hab-aw'", definition: "love", language: "hebrew" },
  { number: "H7307", lemma: "רוּחַ", transliteration: "rûaḥ", pronunciation: "roo'-akh", definition: "spirit, Spirit, wind, breath", language: "hebrew" },
  { number: "H6944", lemma: "קֹדֶשׁ", transliteration: "qōḏeš", pronunciation: "ko'-desh", definition: "holiness, holy, sanctuary", language: "hebrew" },
  { number: "H1697", lemma: "דָּבָר", transliteration: "dāḇār", pronunciation: "daw-baw'", definition: "word, matter, thing", language: "hebrew" },
  { number: "H530", lemma: "אֱמוּנָה", transliteration: "ʾĕmûnāh", pronunciation: "em-oo-naw'", definition: "faithfulness, truth, faith", language: "hebrew" },
  { number: "H8615", lemma: "תִּקְוָה", transliteration: "tiqwāh", pronunciation: "tik-vaw'", definition: "hope, expectation", language: "hebrew" },
  { number: "H2617", lemma: "חֶסֶד", transliteration: "ḥeseḏ", pronunciation: "kheh'-sed", definition: "lovingkindness, mercy, grace", language: "hebrew" },
  { number: "H7965", lemma: "שָׁלוֹם", transliteration: "šālôm", pronunciation: "shaw-lome'", definition: "peace, completeness, welfare", language: "hebrew" },
  { number: "H8064", lemma: "שָׁמַיִם", transliteration: "šāmayim", pronunciation: "shaw-mah'-yim", definition: "heaven, sky", language: "hebrew" },
  { number: "H4467", lemma: "מַמְלָכָה", transliteration: "mamlāḵāh", pronunciation: "mam-law-kaw'", definition: "kingdom, dominion", language: "hebrew" },
  { number: "H2416", lemma: "חַי", transliteration: "ḥay", pronunciation: "khah'-ee", definition: "living, alive, life", language: "hebrew" },
  { number: "H2403", lemma: "חַטָּאָה", transliteration: "ḥaṭṭāʾāh", pronunciation: "khat-taw-aw'", definition: "sin, sin offering", language: "hebrew" },
  { number: "H6664", lemma: "צֶדֶק", transliteration: "ṣeḏeq", pronunciation: "tseh'-dek", definition: "righteousness, justice", language: "hebrew" },
  { number: "H6662", lemma: "צַדִּיק", transliteration: "ṣaddîq", pronunciation: "tsad-deek'", definition: "righteous, just", language: "hebrew" },
  { number: "H3467", lemma: "יָשַׁע", transliteration: "yāšaʿ", pronunciation: "yaw-shah'", definition: "to save, deliver", language: "hebrew" },
  { number: "H3444", lemma: "יְשׁוּעָה", transliteration: "yəšûʿāh", pronunciation: "yesh-oo'-aw", definition: "salvation, deliverance", language: "hebrew" },
  { number: "H5971", lemma: "עַם", transliteration: "ʿam", pronunciation: "am", definition: "people, nation", language: "hebrew" },
  { number: "H5030", lemma: "נָבִיא", transliteration: "nāḇîʾ", pronunciation: "naw-bee'", definition: "prophet", language: "hebrew" },
  { number: "H3519", lemma: "כָּבוֹד", transliteration: "kāḇôḏ", pronunciation: "kaw-bode'", definition: "glory, honor, abundance", language: "hebrew" },
  { number: "H7725", lemma: "שׁוּב", transliteration: "šûḇ", pronunciation: "shoob", definition: "to return, repent, restore", language: "hebrew" },
  { number: "H776", lemma: "אֶרֶץ", transliteration: "ʾereṣ", pronunciation: "eh'-rets", definition: "earth, land", language: "hebrew" },
  { number: "H1285", lemma: "בְּרִית", transliteration: "bərîṯ", pronunciation: "ber-eeth'", definition: "covenant, alliance", language: "hebrew" },
  { number: "H4428", lemma: "מֶלֶךְ", transliteration: "meleḵ", pronunciation: "meh'-lek", definition: "king", language: "hebrew" },
  { number: "H4872", lemma: "מֹשֶׁה", transliteration: "Mōšeh", pronunciation: "mo-sheh'", definition: "Moses", language: "hebrew" },
  { number: "H1732", lemma: "דָּוִד", transliteration: "Dāwiḏ", pronunciation: "daw-veed'", definition: "David", language: "hebrew" },
  { number: "H3389", lemma: "יְרוּשָׁלִַם", transliteration: "Yərûšālaim", pronunciation: "yer-oo-shaw-lah'-im", definition: "Jerusalem", language: "hebrew" },
];

async function importMVP() {
  console.log('🔄 Starting Strong\'s Dictionary MVP Import...\n');
  console.log('📊 This imports a curated subset of theologically important terms');
  console.log('   to demonstrate the complete architecture.\n');

  try {
    // Clear existing entries
    console.log('🗑️  Clearing existing entries...');
    await db.delete(strongEntries).execute();

    // Prepare combined entries (using correct column names from schema)
    const allEntries = [
      ...greekEntries.map(e => ({
        strongNumber: e.number,
        language: e.language as 'greek' | 'hebrew',
        lemma: e.lemma,
        translit: e.transliteration, // Schema column name: translit
        pron: e.pronunciation,       // Schema column name: pron
        kjvDef: e.definition,         // Schema column name: kjvDef
        strongsDef: e.definition,     // Schema column name: strongsDef
        derivation: null
      })),
      ...hebrewEntries.map(e => ({
        strongNumber: e.number,
        language: e.language as 'greek' | 'hebrew',
        lemma: e.lemma,
        translit: e.transliteration, // Schema column name: translit
        pron: e.pronunciation,       // Schema column name: pron
        kjvDef: e.definition,         // Schema column name: kjvDef
        strongsDef: e.definition,     // Schema column name: strongsDef
        derivation: null
      }))
    ];

    // Insert in batches of 50
    console.log('💾 Importing entries to database...');
    const batchSize = 50;
    let imported = 0;

    for (let i = 0; i < allEntries.length; i += batchSize) {
      const batch = allEntries.slice(i, i + batchSize);
      await db.insert(strongEntries).values(batch).execute();
      imported += batch.length;
      console.log(`   Imported ${imported}/${allEntries.length} entries...`);
    }

    console.log('\n✅ MVP IMPORT COMPLETE!');
    console.log(`   Total: ${allEntries.length} Strong's entries in database`);
    console.log(`   Greek: ${greekEntries.length} entries`);
    console.log(`   Hebrew: ${hebrewEntries.length} entries\n`);
    console.log('📚 Coverage:');
    console.log('   - Core theological terms (God, love, faith, grace, etc.)');
    console.log('   - Key biblical names (Jesus, Moses, David, Jerusalem)');
    console.log('   - Essential concepts (sin, righteousness, salvation, kingdom)\n');
    console.log('🎯 Next Steps:');
    console.log('   - Full 14k+ entries can be imported via batch process');
    console.log('   - Architecture ready for complete Strong\'s integration');

  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

importMVP();
