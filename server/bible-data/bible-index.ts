// Índice centralizado de todos os livros da Bíblia
import { Chapter } from './types';
import { genChapters } from './gen';
import { exoChapters } from './exo';
import { levChapters } from './lev';
import { numChapters } from './num';
import { deuChapters } from './deu';
import { josChapters } from './jos';
import { jdgChapters } from './jdg';
import { rutChapters } from './rut';
import { book1saChapters } from './1sa';
import { book2saChapters } from './2sa';
import { book1kiChapters } from './1ki';
import { book2kiChapters } from './2ki';
import { book1chChapters } from './1ch';
import { book2chChapters } from './2ch';
import { ezrChapters } from './ezr';
import { nehChapters } from './neh';
import { estChapters } from './est';
import { jobChapters } from './job';
import { psaChapters } from './psa';
import { proChapters } from './pro';
import { eccChapters } from './ecc';
import { sngChapters } from './sng';
import { isaChapters } from './isa';
import { jerChapters } from './jer';
import { lamChapters } from './lam';
import { ezkChapters } from './ezk';
import { danChapters } from './dan';
import { hosChapters } from './hos';
import { jolChapters } from './jol';
import { amoChapters } from './amo';
import { obaChapters } from './oba';
import { jonChapters } from './jon';
import { micChapters } from './mic';
import { namChapters } from './nam';
import { habChapters } from './hab';
import { zepChapters } from './zep';
import { hagChapters } from './hag';
import { zecChapters } from './zec';
import { malChapters } from './mal';
import { matChapters } from './mat';
import { mrkChapters } from './mrk';
import { lukChapters } from './luk';
import { jhnChapters } from './jhn';
import { actChapters } from './act';
import { romChapters } from './rom';
import { book1coChapters } from './1co';
import { book2coChapters } from './2co';
import { galChapters } from './gal';
import { ephChapters } from './eph';
import { phpChapters } from './php';
import { colChapters } from './col';
import { book1thChapters } from './1th';
import { book2thChapters } from './2th';
import { book1tiChapters } from './1ti';
import { book2tiChapters } from './2ti';
import { titChapters } from './tit';
import { phmChapters } from './phm';
import { hebChapters } from './heb';
import { jasChapters } from './jas';
import { book1peChapters } from './1pe';
import { book2peChapters } from './2pe';
import { book1jnChapters } from './1jn';
import { book2jnChapters } from './2jn';
import { book3jnChapters } from './3jn';
import { judChapters } from './jud';
import { revChapters } from './rev';

// Mapeamento de book ID para os capítulos
export const allBibleBooks: Record<string, Chapter[]> = {
  'gen': genChapters,
  'exo': exoChapters,
  'lev': levChapters,
  'num': numChapters,
  'deu': deuChapters,
  'jos': josChapters,
  'jdg': jdgChapters,
  'rut': rutChapters,
  '1sa': book1saChapters,
  '2sa': book2saChapters,
  '1ki': book1kiChapters,
  '2ki': book2kiChapters,
  '1ch': book1chChapters,
  '2ch': book2chChapters,
  'ezr': ezrChapters,
  'neh': nehChapters,
  'est': estChapters,
  'job': jobChapters,
  'psa': psaChapters,
  'pro': proChapters,
  'ecc': eccChapters,
  'sng': sngChapters,
  'isa': isaChapters,
  'jer': jerChapters,
  'lam': lamChapters,
  'ezk': ezkChapters,
  'dan': danChapters,
  'hos': hosChapters,
  'jol': jolChapters,
  'amo': amoChapters,
  'oba': obaChapters,
  'jon': jonChapters,
  'mic': micChapters,
  'nam': namChapters,
  'hab': habChapters,
  'zep': zepChapters,
  'hag': hagChapters,
  'zec': zecChapters,
  'mal': malChapters,
  'mat': matChapters,
  'mrk': mrkChapters,
  'luk': lukChapters,
  'jhn': jhnChapters,
  'act': actChapters,
  'rom': romChapters,
  '1co': book1coChapters,
  '2co': book2coChapters,
  'gal': galChapters,
  'eph': ephChapters,
  'php': phpChapters,
  'col': colChapters,
  '1th': book1thChapters,
  '2th': book2thChapters,
  '1ti': book1tiChapters,
  '2ti': book2tiChapters,
  'tit': titChapters,
  'phm': phmChapters,
  'heb': hebChapters,
  'jas': jasChapters,
  '1pe': book1peChapters,
  '2pe': book2peChapters,
  '1jn': book1jnChapters,
  '2jn': book2jnChapters,
  '3jn': book3jnChapters,
  'jud': judChapters,
  'rev': revChapters
};

// Função auxiliar para buscar capítulo de qualquer livro
export function getBookChapter(bookId: string, chapterNum: number): Chapter | undefined {
  const bookChapters = allBibleBooks[bookId];
  if (!bookChapters) return undefined;
  return bookChapters.find(ch => ch.chapter === chapterNum);
}
