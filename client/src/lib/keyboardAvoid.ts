/**
 * Teclado nunca fica por cima do campo em que se está escrevendo — vale para TODAS as telas do app
 * (anotações, perguntas do Atlas, chat, professor, buscas, formulários...), no Android e no iOS.
 *
 * Como funciona, sem precisar mexer em cada tela:
 *  1. Quando o teclado abre (ou o foco muda de campo), mede onde o campo focado está e qual parte
 *     da tela continua visível acima do teclado.
 *  2. Se o campo está coberto, rola os contêineres que o envolvem (inclusive painéis com rolagem
 *     oculta, como a ficha do Atlas) até ele aparecer.
 *  3. Se o campo está num painel fixo no rodapé (ex.: "Minhas Anotações"), sobe o painel o
 *     necessário — sem passar do topo da tela.
 *  4. Página curta demais para rolar: ganha um espaço temporário no fim para poder rolar.
 *  Ao fechar o teclado tudo volta exatamente como estava.
 */

const EDITABLE =
  'input:not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]):not([type=reset])' +
  ':not([type=range]):not([type=file]):not([type=color]):not([type=hidden]), textarea, select, [contenteditable=""], [contenteditable="true"]';
const MARGIN = 16;

let visible = false;
let overlap = 0; // px do teclado que ainda cobrem a WebView (0 quando a WebView já encolheu sozinha)
let timers: number[] = [];
const lifted = new Map<HTMLElement, { orig: string; lift: number }>();
let bodyPad: string | null = null;
let installed = false;

function focusedField(): HTMLElement | null {
  const el = document.activeElement as HTMLElement | null;
  if (!el || el === document.body) return null;
  try {
    return el.matches(EDITABLE) ? el : null;
  } catch {
    return null;
  }
}

/** Linha (em px, a partir do topo da janela) até onde a tela está visível acima do teclado. */
function visibleBottom(): number {
  let bottom = window.innerHeight - overlap;
  const vv = window.visualViewport;
  if (vv && vv.height > 0) bottom = Math.min(bottom, vv.offsetTop + vv.height);
  return bottom;
}

/** Quantos px do campo estão escondidos atrás do teclado (<= 0 quando está visível). */
function hiddenBy(el: HTMLElement): number {
  return el.getBoundingClientRect().bottom + MARGIN - visibleBottom();
}

function canScroll(el: HTMLElement): boolean {
  if (el.scrollHeight <= el.clientHeight + 1) return false;
  const oy = getComputedStyle(el).overflowY;
  return oy === 'auto' || oy === 'scroll' || oy === 'hidden' || oy === 'overlay';
}

function restoreLayout() {
  lifted.forEach((entry, el) => {
    el.style.translate = entry.orig;
  });
  lifted.clear();
  if (bodyPad !== null) {
    document.body.style.paddingBottom = bodyPad;
    bodyPad = null;
  }
}

function liftFixedPanel(field: HTMLElement, need: number): number {
  let panel: HTMLElement | null = field;
  while (panel && panel !== document.body && getComputedStyle(panel).position !== 'fixed') panel = panel.parentElement;
  if (!panel || panel === document.body) return need;
  const room = Math.max(0, panel.getBoundingClientRect().top); // não sobe além do topo da tela
  const extra = Math.min(need, room);
  if (extra <= 0) return need;
  const entry = lifted.get(panel) ?? { orig: panel.style.translate, lift: 0 };
  entry.lift += extra;
  lifted.set(panel, entry);
  const base = entry.orig && entry.orig !== 'none' ? entry.orig.split(' ') : [];
  const x = base[0] ?? '0px';
  const y = base[1] ?? '0px';
  panel.style.translate = `${x} calc(${y} - ${entry.lift}px)`;
  return need - extra;
}

function ensureFieldVisible() {
  if (!visible) return;
  const field = focusedField();
  if (!field) return;
  let need = hiddenBy(field);
  if (need <= 0) return;

  // 1) rola tudo o que envolve o campo (do mais próximo ao mais externo)
  for (let p = field.parentElement; p && need > 0; p = p.parentElement) {
    const scroller = p === document.body || p === document.documentElement ? (document.scrollingElement as HTMLElement | null) : p;
    if (!scroller || !canScroll(scroller)) {
      if (p === document.documentElement) break;
      continue;
    }
    scroller.scrollTop += need;
    need = hiddenBy(field);
    if (p === document.documentElement) break;
  }
  if (need <= 0) return;

  // 2) campo dentro de painel fixo no rodapé: sobe o painel
  need = liftFixedPanel(field, need);
  if (need <= 0) return;

  // 3) página curta: cria espaço no fim para rolar acima do teclado
  const doc = document.scrollingElement as HTMLElement | null;
  if (doc && bodyPad === null && overlap > 0) {
    bodyPad = document.body.style.paddingBottom;
    document.body.style.paddingBottom = `${overlap + MARGIN}px`;
    doc.scrollTop += need;
  }
}

function schedule() {
  timers.forEach((t) => window.clearTimeout(t));
  // o teclado e a tela animam por alguns ms: confere de novo logo depois
  timers = [0, 120, 320].map((ms) => window.setTimeout(ensureFieldVisible, ms));
}

/** Teclado aberto. `keyboardOverlap` = parte do teclado que a WebView não descontou (px). */
export function keyboardShown(keyboardOverlap: number) {
  const next = Math.max(0, Math.round(keyboardOverlap));
  if (!visible || next !== overlap) restoreLayout(); // mudou a área visível: recalcula do zero
  visible = true;
  overlap = next;
  schedule();
}

export function keyboardHidden() {
  visible = false;
  overlap = 0;
  timers.forEach((t) => window.clearTimeout(t));
  timers = [];
  restoreLayout();
}

export function installKeyboardAvoidance() {
  if (installed) return;
  installed = true;
  document.addEventListener('focusin', () => { if (visible) schedule(); });
  // campo de várias linhas crescendo enquanto se digita
  document.addEventListener('input', () => { if (visible) schedule(); }, { passive: true });
  window.visualViewport?.addEventListener('resize', () => { if (visible) schedule(); });
}
