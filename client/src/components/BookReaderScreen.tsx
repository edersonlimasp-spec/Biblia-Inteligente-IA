import { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, Type, MessageSquare, Highlighter,
  ChevronRight, X, Send, Loader2, BookOpen, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigation } from "@/contexts/NavigationContext";
import { getApiUrl, apiRequest, getAuthHeaders } from "@/lib/queryClient";
import { recordStudyCompletion } from "@/lib/completions";
import {
  saveChapterToCache, loadChapterFromCache, pruneExpiredChapterCache, isNetworkError,
} from "@/lib/chapterCache";
import { useToast } from "@/hooks/use-toast";
import {
  useBibleFontSize, setBibleFontSize, type BibleFontSize,
} from "@/hooks/use-bible-font-size";

// ── Paleta couro ──────────────────────────────────────────────────────────
const LEATHER_FROM = "#5C4632";
const LEATHER_TO   = "#3F2F21";
const LEATHER_ACC  = "#C9A87E";

const HIGHLIGHT_COLORS = [
  { id: "yellow", bg: "#FBBF24", label: "Amarelo" },
  { id: "green",  bg: "#34D399", label: "Verde"   },
  { id: "blue",   bg: "#60A5FA", label: "Azul"    },
  { id: "pink",   bg: "#F472B6", label: "Rosa"    },
];

// ── Nomes por extenso dos capítulos ──────────────────────────────────────
const PT_ORDINALS: Record<number, string> = {
  1:"Primeiro",2:"Segundo",3:"Terceiro",4:"Quarto",5:"Quinto",
  6:"Sexto",7:"Sétimo",8:"Oitavo",9:"Nono",10:"Décimo",
  11:"Décimo Primeiro",12:"Décimo Segundo",13:"Décimo Terceiro",
  14:"Décimo Quarto",15:"Décimo Quinto",16:"Décimo Sexto",
  17:"Décimo Sétimo",18:"Décimo Oitavo",19:"Décimo Nono",20:"Vigésimo",
  21:"Vigésimo Primeiro",22:"Vigésimo Segundo",23:"Vigésimo Terceiro",
  24:"Vigésimo Quarto",25:"Vigésimo Quinto",30:"Trigésimo",40:"Quadragésimo",
};
function chapterOrdinalName(n: number): string {
  return PT_ORDINALS[n] ?? `Capítulo ${n}`;
}

// ── Tipos ─────────────────────────────────────────────────────────────────
interface ChapterContent {
  id: string; bookId: string; orderNum: number; title: string;
  content: string; estimatedReadTime: string | null;
  isSample: boolean; totalChapters: number; accessState: "sample" | "owned";
}
interface LibraryHighlight {
  id: string; chapterId: string; selectedText: string;
  color: string; annotation: string | null;
}
interface BookReaderScreenProps {
  bookId: string; bookTitle: string; chapterNum: number;
  totalChapters?: number;
  /** Pré-visualização administrativa: usa rotas admin e não grava progresso/destaques */
  preview?: boolean;
  onBack: () => void;
  onNavigateToBible: (book: string, chapter: number, verse: number) => void;
  onNavigateToChapter: (chapterNum: number) => void;
  onNavigateToSubscriptions?: () => void;
}

// ── Entrelinha ────────────────────────────────────────────────────────────
type BookLineHeight = "compact" | "normal" | "wide";
const BOOK_LH_KEY = "book-line-height";
function readBookLineHeight(): BookLineHeight {
  try {
    const v = localStorage.getItem(BOOK_LH_KEY);
    if (v === "compact" || v === "normal" || v === "wide") return v;
  } catch {}
  return "normal";
}

// ── Regex de referências bíblicas ─────────────────────────────────────────
const BOOKS_PAT = "Gênesis|Genesis|Gn|Êxodo|Exodo|Ex|Levítico|Levitico|Lv|Números|Numeros|Nm|Deuteronômio|Deuteronomio|Dt|Josué|Josue|Js|Juízes|Juizes|Jz|Rute|Rt|1Samuel|1Sm|2Samuel|2Sm|1Reis|1Rs|2Reis|2Rs|1Crônicas|1Cronicas|1Cr|2Crônicas|2Cronicas|2Cr|Esdras|Ed|Neemias|Ne|Ester|Et|Jó|Job|Salmos|Salmo|Sl|Provérbios|Proverbios|Pv|Eclesiastes|Ec|Cânticos|Canticos|Ct|Isaías|Isaias|Is|Jeremias|Jr|Lamentações|Lamentacoes|Lm|Ezequiel|Ez|Daniel|Dn|Oséias|Oseias|Os|Joel|Jl|Amós|Amos|Am|Obadias|Ob|Jonas|Jn|Miquéias|Miqueias|Mq|Naum|Na|Habacuque|Hc|Sofonias|Sf|Ageu|Ag|Zacarias|Zc|Malaquias|Ml|Mateus|Mt|Marcos|Mc|Lucas|Lc|João|Joao|Jo|Atos|At|Romanos|Rm|1Coríntios|1Corintios|1Co|2Coríntios|2Corintios|2Co|Gálatas|Galatas|Gl|Efésios|Efesios|Ef|Filipenses|Fp|Colossenses|Cl|1Tessalonicenses|1Ts|2Tessalonicenses|2Ts|1Timóteo|1Timoteo|1Tm|2Timóteo|2Timoteo|2Tm|Tito|Tt|Filêmon|Filemon|Fm|Hebreus|Hb|Tiago|Tg|1Pedro|1Pe|2Pedro|2Pe|1João|1Joao|1Jo|2João|2Joao|2Jo|3João|3Joao|3Jo|Judas|Jd|Apocalipse|Ap";
const COMBINED_REF_RE = () => new RegExp(
  `\\[((?:${BOOKS_PAT})[^\\]]*)\\]|\\b(${BOOKS_PAT})\\s+(\\d+):(\\d+)(?:-(\\d+))?`,
  "g"
);
// Um item dentro do colchete: "Livro 1:2", "1:2-5", "1:2,3", "21:4"
const BRACKET_ITEM_RE = new RegExp(
  `^\\s*(?:(${BOOKS_PAT})\\s+)?(\\d+):(\\d+)((?:[,-]\\d+)*)\\s*$`
);

// ── Renderer de Markdown tipográfico para livros ──────────────────────────
function renderBookMarkdown(md: string): React.ReactNode[] {
  const lines = md.split("\n");
  const nodes: React.ReactNode[] = [];
  let key = 0;
  let paraId = 0;
  let isFirstPara = true;
  let prevWasBlock = false;

  // Inline: negrito, itálico, refs bíblicas
  const inline = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let ik = 0;

    const applyBoldItalic = (src: string): React.ReactNode[] => {
      const res: React.ReactNode[] = [];
      let last = 0;
      const re = /(\*\*\*(.+?)\*\*\*)|(\*\*(.+?)\*\*)|(\*(.+?)\*)|(_(.+?)_)/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(src)) !== null) {
        if (m.index > last) res.push(src.slice(last, m.index));
        if (m[2]) res.push(<strong key={ik++}><em>{m[2]}</em></strong>);
        else if (m[4]) res.push(<strong key={ik++}>{m[4]}</strong>);
        else if (m[6]) res.push(<em key={ik++}>{m[6]}</em>);
        else if (m[8]) res.push(<em key={ik++}>{m[8]}</em>);
        last = m.index + m[0].length;
      }
      if (last < src.length) res.push(src.slice(last));
      return res;
    };

    const re2 = COMBINED_REF_RE();
    let last2 = 0;
    let m2: RegExpExecArray | null;
    while ((m2 = re2.exec(text)) !== null) {
      if (m2.index > last2) parts.push(...applyBoldItalic(text.slice(last2, m2.index)));
      const isBracket = m2[1] !== undefined;
      if (isBracket) {
        // Lista de referências dentro de colchetes: "Is 64:6; Lc 14:33; 13:20"
        const items = m2[1].split(";");
        let lastBook = "";
        const rendered: React.ReactNode[] = [];
        let ok = true;
        for (const item of items) {
          const mi = BRACKET_ITEM_RE.exec(item);
          if (!mi) { ok = false; break; }
          const abbr = mi[1] ?? lastBook;
          if (!abbr) { ok = false; break; }
          lastBook = abbr;
          const ch = mi[2], vs = mi[3], rest = mi[4] ?? "";
          if (rendered.length > 0) rendered.push("; ");
          rendered.push(
            <span key={`br-${key++}`} className="book-bible-ref"
              data-bible-ref={`${abbr}|${ch}|${vs}`}>
              {abbr} {ch}:{vs}{rest}
            </span>
          );
        }
        if (ok) {
          parts.push(<span key={`brg-${key++}`}>{rendered}</span>);
        } else {
          // Não parseável — mantém o texto original com colchetes
          parts.push(m2[0]);
        }
      } else {
        const abbr = m2[2];
        const ch   = m2[3];
        const vs   = m2[4];
        // Ref livre — cor couro, clicável
        parts.push(
          <span key={`pr-${key++}`} className="underline cursor-pointer"
            style={{ color: LEATHER_ACC }} data-bible-ref={`${abbr}|${ch}|${vs}`}>
            {m2[0]}
          </span>
        );
      }
      last2 = m2.index + m2[0].length;
    }
    if (last2 < text.length) parts.push(...applyBoldItalic(text.slice(last2)));
    return parts;
  };

  const isBlockStop = (l: string) =>
    l.startsWith("#") || l.startsWith("> ") || l.startsWith("~ ") || /^---+$/.test(l.trim()) ||
    /^[-*]\s/.test(l) || /^\d+\.\s/.test(l) || l.trim().startsWith("|");

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // HR
    if (/^---+$/.test(line.trim())) {
      nodes.push(<hr key={key++} className="book-hr" />);
      prevWasBlock = true; i++; continue;
    }

    // Headings → tratados como seções dentro do capítulo
    if (line.startsWith("# ") || line.startsWith("## ")) {
      const txt = line.startsWith("# ") ? line.slice(2) : line.slice(3);
      nodes.push(<h2 key={key++} className="book-h2">{inline(txt)}</h2>);
      prevWasBlock = true; i++; continue;
    }
    if (line.startsWith("### ")) {
      nodes.push(<h3 key={key++} className="book-h3">{inline(line.slice(4))}</h3>);
      prevWasBlock = true; i++; continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      const qls: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) { qls.push(lines[i].slice(2)); i++; }
      nodes.push(
        <blockquote key={key++} className="book-blockquote">
          {qls.map((ql, qi) => <p key={qi}>{inline(ql)}</p>)}
        </blockquote>
      );
      prevWasBlock = true; continue;
    }

    // Verso (estrofe em itálico centralizada) — linhas iniciadas com "~ "
    if (line.startsWith("~ ")) {
      const vls: string[] = [];
      while (i < lines.length && lines[i].startsWith("~ ")) { vls.push(lines[i].slice(2)); i++; }
      nodes.push(
        <div key={key++} className="book-verse">
          {vls.map((vl, vi) => <p key={vi}>{inline(vl)}</p>)}
        </div>
      );
      prevWasBlock = true; continue;
    }

    // Lista não-ordenada
    if (/^[-*]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s/, "")); i++;
      }
      nodes.push(
        <ul key={key++} className="book-list" style={{ listStyleType: "disc" }}>
          {items.map((it, ii) => <li key={ii}>{inline(it)}</li>)}
        </ul>
      );
      prevWasBlock = true; continue;
    }

    // Lista ordenada
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, "")); i++;
      }
      nodes.push(
        <ol key={key++} className="book-list" style={{ listStyleType: "decimal" }}>
          {items.map((it, ii) => <li key={ii}>{inline(it)}</li>)}
        </ol>
      );
      prevWasBlock = true; continue;
    }

    // Tabela
    if (line.trim().startsWith("|")) {
      const tls: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) { tls.push(lines[i]); i++; }
      const parseRow = (r: string) =>
        r.split("|").filter((_, ci) => ci > 0 && ci < r.split("|").length - 1).map(c => c.trim());
      const [headerRow, , ...bodyRows] = tls;
      const headers = parseRow(headerRow ?? "");
      nodes.push(
        <div key={key++} className="book-list" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", fontSize: "0.88em", borderCollapse: "collapse" }}>
            <thead>
              <tr>{headers.map((h, hi) => (
                <th key={hi} style={{ borderBottom: `1px solid ${LEATHER_ACC}40`, padding: "0.25em 0.5em", textAlign: "left", fontWeight: 600 }}>
                  {inline(h)}
                </th>
              ))}</tr>
            </thead>
            <tbody>
              {bodyRows.map((row, ri) => (
                <tr key={ri}>{parseRow(row).map((cell, ci) => (
                  <td key={ci} style={{ padding: "0.2em 0.5em", borderBottom: "1px solid hsl(var(--border)/0.3)" }}>
                    {inline(cell)}
                  </td>
                ))}</tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      prevWasBlock = true; continue;
    }

    // Linha vazia
    if (line.trim() === "") { i++; continue; }

    // Parágrafo — coleta linhas consecutivas
    const pls: string[] = [];
    while (i < lines.length && lines[i].trim() !== "" && !isBlockStop(lines[i])) {
      pls.push(lines[i]); i++;
    }
    if (!pls.length) continue;

    const text = pls.join(" ");
    const pid = paraId++;

    if (isFirstPara) {
      isFirstPara = false;
      prevWasBlock = false;
      // Capitular + versalete nas primeiras palavras
      const words = text.trim().split(/\s+/);
      const firstWord   = words[0] ?? "";
      const dropcapLtr  = firstWord.slice(0, 1);
      const dropcapRest = firstWord.slice(1);
      const scWords     = words.slice(1, 4).join(" ");
      const normalPart  = words.slice(4).join(" ");
      nodes.push(
        <p key={key++} className="book-para book-para-first" data-para-id={pid}>
          {dropcapLtr && <span className="book-dropcap" aria-hidden="true">{dropcapLtr}</span>}
          <span className="book-smallcaps">
            {dropcapRest}{dropcapRest && scWords ? " " : ""}{scWords}
          </span>
          {normalPart ? " " : ""}
          {normalPart ? inline(normalPart) : null}
        </p>
      );
    } else {
      const cls = prevWasBlock ? "book-para book-para-no-indent" : "book-para";
      prevWasBlock = false;
      nodes.push(
        <p key={key++} className={cls} data-para-id={pid}>
          {inline(text)}
        </p>
      );
    }
  }
  return nodes;
}

// ── Contexto para o Professor (baseado em página) ─────────────────────────
function getPageContext(content: string, currentPage: number, totalPages: number): string {
  const WINDOW = 1500;
  if (!content) return "";
  if (totalPages <= 1) return content.slice(0, WINDOW);
  const progress = currentPage / Math.max(totalPages - 1, 1);
  const center = Math.floor(progress * content.length);
  const half = Math.floor(WINDOW / 2);
  const start = Math.max(0, center - half);
  return content.slice(start, Math.min(content.length, start + WINDOW));
}

// ── Professor Sheet ───────────────────────────────────────────────────────
function ProfessorSheet({
  open, onClose, bookTitle, chapterTitle, contextText,
}: {
  open: boolean; onClose: () => void;
  bookTitle: string; chapterTitle: string; contextText: string;
}) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const ask = async () => {
    if (!question.trim()) return;
    setLoading(true);
    try {
      const prompt = `Contexto: Livro "${bookTitle}", capítulo "${chapterTitle}".\n\nTrecho do capítulo:\n${contextText}\n\nPergunta: ${question}`;
      const res = await apiRequest("POST", "/api/ai/ask", {
        question: prompt, mode: "essential", book: null, chapter: null,
      });
      const data = await res.json();
      setAnswer(data.response ?? data.answer ?? "Sem resposta.");
    } catch {
      setAnswer("Erro ao consultar o Professor.");
    } finally { setLoading(false); }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex flex-col justify-end"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/50" onClick={onClose} />
          <motion.div className="relative rounded-t-2xl bg-card border-t border-border overflow-hidden"
            style={{ maxHeight: "70vh" }}
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}>
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" style={{ color: LEATHER_ACC }} />
                <span className="font-serif text-sm font-semibold">Perguntar ao Professor</span>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: "calc(70vh - 8rem)" }}>
              <div className="p-4">
                {!user && (
                  <p className="text-xs text-muted-foreground mb-3 bg-muted rounded-lg p-2">
                    Faça login para usar o Professor IA sem limitações.
                  </p>
                )}
                <p className="text-xs text-muted-foreground mb-3 italic">
                  {bookTitle} — {chapterTitle}
                </p>
                {answer && (
                  <div className="mb-4 bg-muted/50 rounded-lg p-3">
                    <p className="text-sm text-foreground leading-relaxed">{answer}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="p-3 border-t border-border flex gap-2 bg-card">
              <input
                className="flex-1 bg-muted rounded-lg px-3 py-2 text-sm outline-none"
                placeholder="Faça sua pergunta sobre este capítulo..."
                value={question} onChange={e => setQuestion(e.target.value)}
                onKeyDown={e => e.key === "Enter" && ask()} disabled={loading}
              />
              <Button size="icon" disabled={loading || !question.trim()} onClick={ask}
                style={{ background: `linear-gradient(158deg,${LEATHER_FROM},${LEATHER_TO})`, border: "none" }}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Send className="w-4 h-4 text-white" />}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Popover de tipografia (fonte + entrelinha) ────────────────────────────
function TypographyPopover({
  onClose, lineHeight, onLineHeight,
}: {
  onClose: () => void; lineHeight: BookLineHeight; onLineHeight: (v: BookLineHeight) => void;
}) {
  const currentSize = useBibleFontSize();
  const lhOptions: { v: BookLineHeight; label: string }[] = [
    { v: "compact", label: "Compacta" },
    { v: "normal",  label: "Normal"   },
    { v: "wide",    label: "Ampla"    },
  ];
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
      className="absolute bottom-full mb-2 left-0 bg-card border border-border rounded-xl shadow-xl p-3 z-50 min-w-[180px]">
      {/* Tamanho da fonte */}
      <p className="text-[10px] font-mono text-muted-foreground mb-2 uppercase tracking-wide">Tamanho</p>
      <div className="flex gap-2 mb-3">
        {(["small","medium","large","xlarge"] as BibleFontSize[]).map((s, i) => (
          <button key={s}
            onClick={() => { setBibleFontSize(s); }}
            className="flex items-center justify-center rounded-lg border transition-colors"
            style={{
              width: 30 + i * 4, height: 30 + i * 4,
              fontSize: 10 + i * 2,
              borderColor: s === currentSize ? LEATHER_ACC : "hsl(var(--border))",
              background: s === currentSize ? `${LEATHER_FROM}22` : "transparent",
              color: s === currentSize ? LEATHER_ACC : "hsl(var(--foreground))",
              fontFamily: "Georgia, serif", fontWeight: 600,
            }}>A</button>
        ))}
      </div>
      {/* Entrelinha */}
      <p className="text-[10px] font-mono text-muted-foreground mb-2 uppercase tracking-wide">Entrelinha</p>
      <div className="flex gap-1.5">
        {lhOptions.map(({ v, label }) => (
          <button key={v}
            onClick={() => { onLineHeight(v); }}
            className="flex-1 py-1 rounded-lg border text-[11px] transition-colors"
            style={{
              borderColor: v === lineHeight ? LEATHER_ACC : "hsl(var(--border))",
              background: v === lineHeight ? `${LEATHER_FROM}22` : "transparent",
              color: v === lineHeight ? LEATHER_ACC : "hsl(var(--foreground))",
            }}>{label}</button>
        ))}
      </div>
      <button onClick={onClose} className="absolute top-2 right-2 text-muted-foreground hover:text-foreground">
        <X className="w-3 h-3" />
      </button>
    </motion.div>
  );
}

// ── Pontos de progresso ───────────────────────────────────────────────────
function ProgressDots({ current, total }: { current: number; total: number }) {
  const count = Math.min(Math.max(total, 1), 9);
  const active = total <= 9
    ? current
    : Math.round((current / Math.max(total - 1, 1)) * (count - 1));
  return (
    <div style={{ display: "flex", gap: 3.5, alignItems: "center" }}>
      {Array.from({ length: count }, (_, i) => (
        <span key={i} style={{
          width: i === active ? 5 : 3, height: i === active ? 5 : 3,
          borderRadius: "50%",
          backgroundColor: i === active
            ? "hsl(var(--foreground)/0.6)"
            : "hsl(var(--foreground)/0.2)",
          display: "inline-block", flexShrink: 0,
          transition: "all 0.2s ease",
        }} />
      ))}
    </div>
  );
}

// ── Registo de conclusão de capítulo (local + servidor) ──────────────────
function recordChapterCompletion() {
  recordStudyCompletion("library_chapter");
}

// ── Mapa de livros bíblicos ───────────────────────────────────────────────
const BOOK_MAP: Record<string, string> = {
  "Gênesis":"gen","Genesis":"gen","Gn":"gen","Êxodo":"exo","Exodo":"exo","Ex":"exo",
  "Levítico":"lev","Levitico":"lev","Lv":"lev","Números":"num","Numeros":"num","Nm":"num",
  "Deuteronômio":"deu","Deuteronomio":"deu","Dt":"deu","Josué":"jos","Josue":"jos","Js":"jos",
  "Juízes":"jdg","Juizes":"jdg","Jz":"jdg","Rute":"rut","Rt":"rut",
  "1Samuel":"1sa","1Sm":"1sa","2Samuel":"2sa","2Sm":"2sa",
  "1Reis":"1ki","1Rs":"1ki","2Reis":"2ki","2Rs":"2ki",
  "1Crônicas":"1ch","1Cronicas":"1ch","1Cr":"1ch","2Crônicas":"2ch","2Cronicas":"2ch","2Cr":"2ch",
  "Esdras":"ezr","Ed":"ezr","Neemias":"neh","Ne":"neh","Ester":"est","Et":"est",
  "Jó":"job","Job":"job","Salmos":"psa","Salmo":"psa","Sl":"psa",
  "Provérbios":"pro","Proverbios":"pro","Pv":"pro","Eclesiastes":"ecc","Ec":"ecc",
  "Cânticos":"sng","Canticos":"sng","Ct":"sng","Isaías":"isa","Isaias":"isa","Is":"isa",
  "Jeremias":"jer","Jr":"jer","Lamentações":"lam","Lamentacoes":"lam","Lm":"lam",
  "Ezequiel":"ezk","Ez":"ezk","Daniel":"dan","Dn":"dan",
  "Oséias":"hos","Oseias":"hos","Os":"hos","Joel":"jol","Jl":"jol",
  "Amós":"amo","Amos":"amo","Am":"amo","Obadias":"oba","Ob":"oba",
  "Jonas":"jon","Jn":"jon","Miquéias":"mic","Miqueias":"mic","Mq":"mic",
  "Naum":"nam","Na":"nam","Habacuque":"hab","Hc":"hab",
  "Sofonias":"zep","Sf":"zep","Ageu":"hag","Ag":"hag","Zacarias":"zec","Zc":"zec",
  "Malaquias":"mal","Ml":"mal","Mateus":"mat","Mt":"mat","Marcos":"mar","Mc":"mar",
  "Lucas":"luk","Lc":"luk","João":"jhn","Joao":"jhn","Jo":"jhn","Atos":"act","At":"act",
  "Romanos":"rom","Rm":"rom","1Coríntios":"1co","1Corintios":"1co","1Co":"1co",
  "2Coríntios":"2co","2Corintios":"2co","2Co":"2co","Gálatas":"gal","Galatas":"gal","Gl":"gal",
  "Efésios":"eph","Efesios":"eph","Ef":"eph","Filipenses":"php","Fp":"php",
  "Colossenses":"col","Cl":"col","1Tessalonicenses":"1th","1Ts":"1th",
  "2Tessalonicenses":"2th","2Ts":"2th","1Timóteo":"1ti","1Timoteo":"1ti","1Tm":"1ti",
  "2Timóteo":"2ti","2Timoteo":"2ti","2Tm":"2ti","Tito":"tit","Tt":"tit",
  "Filêmon":"phm","Filemon":"phm","Fm":"phm","Hebreus":"heb","Hb":"heb",
  "Tiago":"jas","Tg":"jas","1Pedro":"1pe","1Pe":"1pe","2Pedro":"2pe","2Pe":"2pe",
  "1João":"1jn","1Joao":"1jn","1Jo":"1jn","2João":"2jn","2Joao":"2jn","2Jo":"2jn",
  "3João":"3jn","3Joao":"3jn","3Jo":"3jn","Judas":"jud","Jd":"jud","Apocalipse":"rev","Ap":"rev",
};

// ════════════════════════════════════════════════════════════════════════════
// ── Componente principal ──────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════
export function BookReaderScreen({
  bookId, bookTitle, chapterNum, onBack,
  onNavigateToBible, onNavigateToChapter,
  onNavigateToSubscriptions,
  preview = false,
}: BookReaderScreenProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const fontSize = useBibleFontSize();
  const { bookReturn, setBookReturn } = useNavigation();

  // ── Retorno da Bíblia: página exata a restaurar ───────────────────────
  const pendingReturnPageRef = useRef<number | null>(
    bookReturn && bookReturn.bookId === bookId && bookReturn.chapterNum === chapterNum
      ? bookReturn.page
      : null
  );
  useEffect(() => {
    // Consumir/descartar a origem guardada ao entrar no leitor
    if (bookReturn) setBookReturn(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Detecção de ambiente com mouse (computador)
  const isDesktop = useMemo(
    () => typeof window !== "undefined" &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches,
    []
  );

  // ── Estado de tipografia ──────────────────────────────────────────────
  const [lineHeight, setLineHeightState] = useState<BookLineHeight>(readBookLineHeight);
  const setLineHeight = useCallback((v: BookLineHeight) => {
    try { localStorage.setItem(BOOK_LH_KEY, v); } catch {}
    // Captura âncora antes de mudar
    captureAnchorBeforeReflow();
    setLineHeightState(v);
  }, []);// eslint-disable-line react-hooks/exhaustive-deps

  // ── Estado da paginação ───────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages]   = useState(0);
  const [pageDim, setPageDim]         = useState({ w: 0, h: 0 });
  const [useFallbackScroll, setUseFallbackScroll] = useState(false);
  const [chapterStartPage, setChapterStartPage]   = useState(0);

  // ── Estado de chrome ──────────────────────────────────────────────────
  const [showChrome, setShowChrome]     = useState(true);
  const [showTypo, setShowTypo]         = useState(false);
  const [showProfessor, setShowProfessor] = useState(false);
  const [showHighlightBar, setShowHighlightBar] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [annotationDraft, setAnnotationDraft] = useState("");
  const [highlights, setHighlights]     = useState<LibraryHighlight[]>([]);
  const [activeHl, setActiveHl]         = useState<LibraryHighlight | null>(null);
  const [noteDraft, setNoteDraft]       = useState("");
  const [savingNote, setSavingNote]     = useState(false);
  const [deletingHl, setDeletingHl]     = useState(false);

  // ── Toque / gesto ─────────────────────────────────────────────────────
  const [dragOffset, setDragOffset]     = useState(0);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isDragging  = useRef(false);
  const lastTouchAt = useRef(0);   // evita duplicar toque + clique sintético
  const wheelLockAt = useRef(0);   // trava da rolagem do mouse

  // ── Refs de layout ────────────────────────────────────────────────────
  const columnAreaRef = useRef<HTMLDivElement>(null); // container com overflow:hidden
  const columnRef     = useRef<HTMLDivElement>(null); // CSS columns div (overflow:visible)
  const anchorRef     = useRef<number | null>(null);  // para-id a restaurar após reflow
  const hasRestoredRef = useRef(false);
  const progressSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Consultas ─────────────────────────────────────────────────────────
  const bookDetailUrl = preview
    ? `/api/admin/library/preview/${bookId}`
    : `/api/library/books/${bookId}`;
  const { data: bookDetail } = useQuery<{ title: string; publishStatus?: string }>({
    queryKey: [preview ? "/api/admin/library/preview" : "/api/library/books", bookId],
    queryFn: async () => {
      const res = await fetch(getApiUrl(bookDetailUrl), { credentials: "include", headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Book not found");
      return res.json();
    },
    staleTime: Infinity,
  });
  const resolvedTitle = bookDetail?.title ?? bookTitle;
  const isDraftPreview = preview && bookDetail?.publishStatus !== "published";

  const chapterUrl = preview
    ? `/api/admin/library/preview/${bookId}/chapters/${chapterNum}`
    : `/api/library/books/${bookId}/chapters/${chapterNum}`;
  const [isFromOfflineCache, setIsFromOfflineCache] = useState(false);
  useEffect(() => { void pruneExpiredChapterCache(); }, []);
  // Cache com escopo por usuário (evita vazamento entre contas no mesmo aparelho)
  const cacheUserId = user?.id ?? "guest";
  const { data: chapter, isLoading, error: chapterError } = useQuery<ChapterContent>({
    queryKey: [preview ? "/api/admin/library/preview" : "/api/library/books", bookId, "chapters", chapterNum],
    queryFn: async () => {
      setIsFromOfflineCache(false); // reset no início de cada requisição
      let res: Response;
      try {
        res = await fetch(getApiUrl(chapterUrl), { credentials: "include", headers: getAuthHeaders() });
      } catch (err) {
        // Fallback offline SOMENTE para falha real de conectividade
        // (nunca para respostas HTTP como 401/403/404/500).
        if (!preview && isNetworkError(err)) {
          const cached = await loadChapterFromCache<ChapterContent>(cacheUserId, bookId, chapterNum);
          if (cached) {
            setIsFromOfflineCache(true);
            return cached;
          }
        }
        throw err;
      }
      if (res.status === 403) throw new Error("__locked__");
      if (!res.ok) throw new Error("Capítulo não encontrado");
      const data: ChapterContent = await res.json();
      if (!preview) void saveChapterToCache(cacheUserId, bookId, chapterNum, data);
      return data;
    },
    retry: false,
  });

  const totalChapters = chapter?.totalChapters ?? 0;
  const isChapterLocked = chapterError instanceof Error && chapterError.message === "__locked__";

  // ── Lista de capítulos (para saber onde a amostra termina) ───────────
  const { data: chapterList = [] } = useQuery<{ orderNum: number; accessState: string }[]>({
    queryKey: ["/api/library/books", bookId, "chapters"],
    queryFn: async () => {
      const res = await fetch(getApiUrl(`/api/library/books/${bookId}/chapters`), { credentials: "include", headers: getAuthHeaders() });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !preview,
  });
  const nextChapterLocked = chapterList.some(
    c => c.orderNum === chapterNum + 1 && c.accessState === "locked"
  );
  const lockedRemaining = chapterList.filter(c => c.accessState === "locked").length;

  // ── Highlights ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user || !chapter || preview) return;
    fetch(getApiUrl(`/api/library/highlights/${bookId}`), { credentials: "include", headers: getAuthHeaders() })
      .then(r => r.ok ? r.json() : [])
      .then((hs: LibraryHighlight[]) => setHighlights(hs.filter(h => h.chapterId === chapter.id)))
      .catch(() => {});
  }, [user, chapter, bookId, preview]);

  // ── Marcas visuais dos destaques + toque para ver/editar a nota ──────
  const openHighlightRef = useRef<(id: string) => void>(() => {});
  openHighlightRef.current = (id: string) => {
    const h = highlights.find(x => x.id === id);
    if (!h) return;
    setActiveHl(h);
    setNoteDraft(h.annotation ?? "");
    setShowHighlightBar(false);
  };

  useEffect(() => {
    const col = columnRef.current;
    if (!col || highlights.length === 0 || isLoading || !chapter) return;

    const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const created: HTMLElement[] = [];

    for (const h of highlights) {
      const sel = h.selectedText?.trim();
      if (!sel || sel.length < 2) continue;

      // Coleta todos os nós de texto (ignorando trechos já marcados)
      const walker = document.createTreeWalker(col, NodeFilter.SHOW_TEXT);
      const nodes: Text[] = [];
      const starts: number[] = [];
      let full = "";
      let n: Node | null;
      while ((n = walker.nextNode())) {
        if ((n.parentElement)?.closest("[data-hl-id]")) continue;
        starts.push(full.length);
        nodes.push(n as Text);
        full += n.nodeValue ?? "";
      }

      // Busca tolerante a espaços/quebras de linha
      let m: RegExpExecArray | null = null;
      try {
        const pattern = sel.split(/\s+/).map(escapeRegExp).join("\\s+");
        m = new RegExp(pattern).exec(full);
      } catch { m = null; }
      if (!m) continue;

      const start = m.index;
      const end = m.index + m[0].length;
      const color = HIGHLIGHT_COLORS.find(c => c.id === h.color)?.bg ?? "#FBBF24";

      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const ns = starts[i];
        const ne = ns + (node.nodeValue?.length ?? 0);
        if (ne <= start || ns >= end) continue;
        const from = Math.max(0, start - ns);
        const to = Math.min(node.nodeValue!.length, end - ns);
        if (from >= to) continue;
        const range = document.createRange();
        range.setStart(node, from);
        range.setEnd(node, to);
        const mark = document.createElement("mark");
        mark.setAttribute("data-hl-id", h.id);
        mark.setAttribute("data-testid", `mark-highlight-${h.id}`);
        mark.style.backgroundColor = `${color}55`;
        mark.style.color = "inherit";
        mark.style.cursor = "pointer";
        mark.style.borderRadius = "2px";
        try { range.surroundContents(mark); created.push(mark); } catch {}
      }
    }

    const clickHandler = (e: Event) => {
      // Toques já são tratados em handleTouchEnd (evita abrir duas vezes)
      if (Date.now() - lastTouchAt.current < 700) return;
      const t = (e.target as HTMLElement).closest("[data-hl-id]");
      if (!t) return;
      if ((e.target as HTMLElement).closest("[data-bible-ref]")) return;
      if ((window.getSelection()?.toString() ?? "").trim().length > 0) return;
      e.stopPropagation();
      openHighlightRef.current(t.getAttribute("data-hl-id")!);
    };
    col.addEventListener("click", clickHandler);

    return () => {
      col.removeEventListener("click", clickHandler);
      for (const mark of created) {
        const parent = mark.parentNode;
        if (!parent) continue;
        while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
        parent.removeChild(mark);
        parent.normalize();
      }
    };
  }, [highlights, chapter, isLoading, useFallbackScroll]);

  // ── Salvar nota de um destaque existente ─────────────────────────────
  const saveNote = async () => {
    if (!activeHl) return;
    setSavingNote(true);
    try {
      const res = await fetch(getApiUrl(`/api/library/highlights/${activeHl.id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        credentials: "include",
        body: JSON.stringify({ annotation: noteDraft.trim() }),
      });
      if (res.ok) {
        const updated: LibraryHighlight = await res.json();
        setHighlights(prev => prev.map(h =>
          h.id === updated.id ? { ...h, annotation: updated.annotation } : h
        ));
        toast({ description: "Nota salva." });
        setActiveHl(null);
      } else {
        toast({ description: "Não foi possível salvar a nota." });
      }
    } catch {
      toast({ description: "Não foi possível salvar a nota." });
    }
    setSavingNote(false);
  };

  // ── Remover um destaque existente ────────────────────────────────────
  const deleteHighlight = async () => {
    if (!activeHl) return;
    setDeletingHl(true);
    try {
      const res = await fetch(getApiUrl(`/api/library/highlights/${activeHl.id}`), {
        method: "DELETE",
        credentials: "include",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        setHighlights(prev => prev.filter(h => h.id !== activeHl.id));
        toast({ description: "Destaque removido." });
        setActiveHl(null);
      } else {
        toast({ description: "Não foi possível remover o destaque." });
      }
    } catch {
      toast({ description: "Não foi possível remover o destaque." });
    }
    setDeletingHl(false);
  };

  // ── Reset ao mudar capítulo ───────────────────────────────────────────
  useEffect(() => {
    setCurrentPage(0);
    setTotalPages(0);
    setActiveHl(null);
    hasRestoredRef.current = false;
  }, [chapterNum]);

  // ── Medição das dimensões da área de coluna ───────────────────────────
  useLayoutEffect(() => {
    const measure = () => {
      if (!columnAreaRef.current) return;
      const w = columnAreaRef.current.offsetWidth;
      const h = columnAreaRef.current.offsetHeight;
      if (w > 0 && h > 0) setPageDim({ w, h });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (columnAreaRef.current) ro.observe(columnAreaRef.current);
    return () => ro.disconnect();
  }, []);

  // ── Medição de páginas (após fonte/entrelinha/capítulo/dimensões) ─────
  useEffect(() => {
    if (!chapter || pageDim.w === 0 || pageDim.h === 0) return;
    let cancelled = false;

    const measure = () => {
      if (cancelled || !columnRef.current || !columnAreaRef.current) return;
      const pageW = columnAreaRef.current.offsetWidth;
      if (pageW === 0) return;

      const paras = columnRef.current.querySelectorAll("[data-para-id]");
      if (paras.length === 0) return;

      const lastPara = paras[paras.length - 1] as HTMLElement;
      const lastLeft = lastPara.offsetLeft;
      // Math.round tolera desvios de subpixel (lastLeft = k*pageW ± 1px)
      // que ocorrem em viewports estreitas (320/360px) em alguns webviews.
      let total = Math.round(lastLeft / pageW) + 1;

      // Medição alternativa via scrollWidth — largura total das colunas.
      const colScrollW = columnRef.current.scrollWidth;
      const scrollTotal = Math.max(1, Math.round(colScrollW / pageW));

      // Detecção de fallback: capítulo longo mas colunas não funcionaram
      const contentLen = chapter.content.length;
      if (total <= 1 && contentLen > 1200 && paras.length > 4) {
        if (scrollTotal > 1) {
          // offsetLeft não confiável neste navegador/webview, mas as colunas
          // existem (scrollWidth > pageW): usar a medição por scrollWidth.
          console.warn(
            `[BookReader] offsetLeft não confiável (lastLeft=${lastLeft}); usando scrollWidth (${scrollTotal} páginas)`
          );
          total = scrollTotal;
        } else {
          // CSS columns realmente falhou — cair para rolagem contínua.
          console.warn(
            "[BookReader] CSS multi-column indisponível — usando modo de rolagem (fallback)"
          );
          if (!cancelled) setUseFallbackScroll(true);
          return;
        }
      }

      if (cancelled) return;
      setUseFallbackScroll(false);
      setTotalPages(Math.max(1, total));

      // Restaurar âncora (após troca de fonte/entrelinha)
      if (anchorRef.current !== null) {
        const anchor = columnRef.current.querySelector(
          `[data-para-id="${anchorRef.current}"]`
        ) as HTMLElement | null;
        if (anchor) {
          const pg = Math.round(anchor.offsetLeft / pageW);
          setCurrentPage(Math.max(0, Math.min(pg, total - 1)));
        }
        anchorRef.current = null;
        return;
      }

      // Retorno da Bíblia: restaurar a página exata de onde o leitor saiu
      if (pendingReturnPageRef.current !== null) {
        const pg = Math.max(0, Math.min(pendingReturnPageRef.current, total - 1));
        pendingReturnPageRef.current = null;
        hasRestoredRef.current = true;
        setCurrentPage(pg);
        return;
      }

      // Restaurar posição salva (primeira vez neste capítulo)
      if (!hasRestoredRef.current) {
        hasRestoredRef.current = true;
        try {
          const stored = JSON.parse(localStorage.getItem("library_last_progress") ?? "null");
          if (stored?.bookId === bookId && stored?.currentChapter === chapterNum && total > 1) {
            const pg = Math.min(Math.floor((stored.percentComplete / 100) * total), total - 1);
            setCurrentPage(Math.max(0, pg));
          }
        } catch {}
      }
    };

    if (typeof document.fonts !== "undefined") {
      document.fonts.ready.then(measure).catch(measure);
    } else {
      setTimeout(measure, 80);
    }
    return () => { cancelled = true; };
  }, [chapter?.id, fontSize, lineHeight, pageDim.w, pageDim.h]);

  // ── Numeração contínua de páginas ────────────────────────────────────
  useEffect(() => {
    if (!totalPages) return;
    try {
      const key = `book_chap_pages_${bookId}`;
      const stored: Record<number, number> = JSON.parse(localStorage.getItem(key) ?? "{}");
      stored[chapterNum] = totalPages;
      localStorage.setItem(key, JSON.stringify(stored));
      let start = 0;
      for (let c = 1; c < chapterNum; c++) start += stored[c] ?? 0;
      setChapterStartPage(start);
    } catch { setChapterStartPage(0); }
  }, [totalPages, bookId, chapterNum]);

  // Dev-only: logar total de páginas para verificação automatizada
  useEffect(() => {
    if (import.meta.env.DEV && totalPages > 0) {
      console.log(`[BookReader] cap ${chapterNum}: ${totalPages} páginas (largura ${pageDim.w}px)`);
    }
  }, [totalPages, chapterNum, pageDim.w]);

  // ── Salvar progresso ─────────────────────────────────────────────────
  const saveProgress = useCallback((page: number, total: number) => {
    if (!chapter || preview) return;
    const pct = total > 0 ? Math.round((page / Math.max(total - 1, 1)) * 100) : 0;
    const progress = {
      bookId, currentChapter: chapterNum, scrollPosition: page, percentComplete: pct,
      bookTitle: resolvedTitle, globalPage: chapterStartPage + page + 1,
    };
    try { localStorage.setItem("library_last_progress", JSON.stringify(progress)); } catch {}
    if (!user) return;
    if (progressSaveTimer.current) clearTimeout(progressSaveTimer.current);
    progressSaveTimer.current = setTimeout(() => {
      fetch(getApiUrl(`/api/library/progress/${bookId}`), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        credentials: "include",
        body: JSON.stringify({ currentChapter: chapterNum, scrollPosition: page, percentComplete: pct }),
      }).catch(() => {});
    }, 3000);
  }, [user, chapter, bookId, chapterNum, preview, resolvedTitle, chapterStartPage]);

  // ── Capturar âncora antes de reflow ─────────────────────────────────
  const captureAnchorBeforeReflow = useCallback(() => {
    const col = columnRef.current;
    const area = columnAreaRef.current;
    if (!col || !area) return;
    const pageW = area.offsetWidth;
    if (!pageW) return;
    const paras = Array.from(col.querySelectorAll("[data-para-id]"));
    const targetX = currentPage * pageW;
    for (const p of paras) {
      const el = p as HTMLElement;
      if (el.offsetLeft >= targetX) {
        anchorRef.current = parseInt(el.getAttribute("data-para-id") ?? "0", 10);
        return;
      }
    }
    if (paras.length > 0) {
      anchorRef.current = parseInt(
        (paras[paras.length - 1] as HTMLElement).getAttribute("data-para-id") ?? "0", 10
      );
    }
  }, [currentPage]);

  // Capturar âncora ao mudar fonte
  const handleFontChange = useCallback((s: BibleFontSize) => {
    captureAnchorBeforeReflow();
    setBibleFontSize(s);
  }, [captureAnchorBeforeReflow]);

  // ── Navegação entre páginas ──────────────────────────────────────────
  const goToPage = useCallback((pg: number) => {
    const safe = Math.max(0, Math.min(pg, totalPages - 1));
    setCurrentPage(safe);
    saveProgress(safe, totalPages);
  }, [totalPages, saveProgress]);

  const goNext = useCallback(() => goToPage(currentPage + 1), [currentPage, goToPage]);
  const goPrev = useCallback(() => goToPage(currentPage - 1), [currentPage, goToPage]);

  // ── Gestos de toque ──────────────────────────────────────────────────
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isDragging.current = false;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) {
      isDragging.current = true;
      setDragOffset(Math.max(-(pageDim.w ?? 375), Math.min(pageDim.w ?? 375, dx)));
    }
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    lastTouchAt.current = Date.now();
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    const wasDrag = isDragging.current;
    isDragging.current = false;
    setDragOffset(0);

    if (wasDrag && Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) goNext(); else goPrev();
      return;
    }

    // Tap simples
    if (Math.abs(dx) < 12 && Math.abs(dy) < 12) {
      const target = e.target as HTMLElement;
      if (target.closest?.("[data-hl-id]") && !target.closest?.("[data-bible-ref]") &&
          (window.getSelection()?.toString() ?? "").trim().length === 0) {
        const id = (target.closest("[data-hl-id]") as HTMLElement).getAttribute("data-hl-id")!;
        openHighlightRef.current(id);
        return;
      }
      const x = e.changedTouches[0].clientX;
      const vw = pageDim.w || window.innerWidth;
      if (x < vw * 0.2) { goPrev(); return; }
      if (x > vw * 0.8) { goNext(); return; }
      setShowChrome(v => !v);
    }
  };

  // ── Teclado (computador): setas e barra de espaço ───────────────────
  useEffect(() => {
    if (useFallbackScroll) return;
    const handler = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key === "ArrowLeft") { e.preventDefault(); goPrev(); }
      else if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); goNext(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev, useFallbackScroll]);

  // ── Rolagem do mouse com trava (evita pular várias páginas) ─────────
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (Math.abs(e.deltaY) < 10) return;
    const now = Date.now();
    if (now - wheelLockAt.current < 650) return;
    wheelLockAt.current = now;
    if (e.deltaY > 0) goNext(); else goPrev();
  }, [goNext, goPrev]);

  // ── Clique do mouse: terço esquerdo volta, terço direito avança,
  //    centro alterna controles. Sem camadas sobre o texto: referências
  //    e seleção de trechos continuam funcionando normalmente.
  const handleAreaClick = useCallback((e: React.MouseEvent) => {
    // Toques geram um clique sintético logo em seguida — ignorar
    if (Date.now() - lastTouchAt.current < 700) return;
    const t = e.target as HTMLElement;
    if (t.closest("button") || t.closest("[data-bible-ref]") || t.closest("[data-hl-id]")) return;
    if ((window.getSelection()?.toString() ?? "").trim().length > 0) return;
    const area = columnAreaRef.current;
    if (!area) return;
    const rect = area.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 3) { goPrev(); return; }
    if (x > (rect.width * 2) / 3) { goNext(); return; }
    setShowChrome(v => !v);
  }, [goPrev, goNext]);

  // ── Cliques em referências bíblicas ──────────────────────────────────
  const currentPageRef = useRef(0);
  useEffect(() => { currentPageRef.current = currentPage; }, [currentPage]);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("[data-bible-ref]");
      if (!target) return;
      const ref = (target as HTMLElement).dataset.bibleRef ?? "";
      const [abbr, chStr, vsStr] = ref.split("|");
      if (!abbr || !chStr) return;
      const bibleBookId = BOOK_MAP[abbr];
      if (bibleBookId) {
        // Guardar a origem para o botão "Voltar para o livro" na Bíblia
        setBookReturn({
          bookId, bookTitle: resolvedTitle, chapterNum,
          page: currentPageRef.current,
        });
        onNavigateToBible(bibleBookId, parseInt(chStr, 10), parseInt(vsStr ?? "1", 10));
      }
    };
    const el = columnRef.current;
    el?.addEventListener("click", handler);
    return () => el?.removeEventListener("click", handler);
  }, [onNavigateToBible, setBookReturn, bookId, resolvedTitle, chapterNum]);

  // ── Seleção de texto para destaque ───────────────────────────────────
  const handleSelectionEnd = () => {
    const text = window.getSelection()?.toString().trim() ?? "";
    if (text.length > 3) { setSelectedText(text); setShowHighlightBar(true); }
    else { setShowHighlightBar(false); }
  };

  const saveHighlight = async (color: string) => {
    if (!user || !chapter || !selectedText || preview) return;
    try {
      const res = await fetch(getApiUrl("/api/library/highlights"), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        credentials: "include",
        body: JSON.stringify({
          bookId, chapterId: chapter.id, selectedText, color,
          annotation: annotationDraft.trim() || null,
        }),
      });
      if (res.ok) {
        const h = await res.json();
        setHighlights(prev => [...prev, h]);
        toast({ description: "Destaque salvo." });
      }
    } catch {}
    window.getSelection()?.removeAllRanges();
    setShowHighlightBar(false);
    setSelectedText("");
    setAnnotationDraft("");
  };

  // ── Estimativa de leitura restante ────────────────────────────────────
  const remainingMinutes = totalPages > 0
    ? Math.max(1, Math.ceil((totalPages - currentPage) / 2))
    : null;
  const readingTimeText = remainingMinutes
    ? remainingMinutes <= 1 ? "< 1 min" : `${remainingMinutes} min`
    : "";

  // ── Classe CSS para fonte e entrelinha ────────────────────────────────
  const fontClass = `book-font-${fontSize} book-lh-${lineHeight}`;
  const absolutePageNum = chapterStartPage + currentPage + 1;

  // ── Popover da nota de um destaque ────────────────────────────────────
  const notePopover = (
    <AnimatePresence>
      {activeHl && (
        <motion.div
          className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-card border border-border rounded-xl shadow-xl px-3 py-2 w-[min(20rem,calc(100vw-2rem))]"
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
          onMouseUp={(e) => e.stopPropagation()} onTouchEnd={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          data-testid="popover-highlight-note"
        >
          <div className="flex items-start gap-2">
            <span
              className="w-3 h-3 rounded-full mt-1 flex-shrink-0 border border-white/30"
              style={{ backgroundColor: HIGHLIGHT_COLORS.find(c => c.id === activeHl.color)?.bg ?? "#FBBF24" }}
            />
            <p className="flex-1 text-xs italic text-muted-foreground line-clamp-2">
              “{activeHl.selectedText}”
            </p>
            <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0"
              onClick={() => setActiveHl(null)} data-testid="button-close-note">
              <X className="w-3 h-3" />
            </Button>
          </div>
          <textarea
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            placeholder="Adicionar nota…"
            rows={3}
            className="mt-2 w-full text-sm bg-muted/50 border border-border rounded-md p-2 resize-none focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
            data-testid="input-note-edit"
          />
          <Button
            size="sm" className="mt-2 w-full font-semibold"
            disabled={savingNote}
            style={{ background: `linear-gradient(158deg,${LEATHER_FROM},${LEATHER_TO})`, color: "#fff", border: "none" }}
            onClick={saveNote}
            data-testid="button-save-note"
          >
            {savingNote ? "Salvando…" : "Salvar nota"}
          </Button>
          <Button
            variant="ghost" size="sm"
            className="mt-1 w-full text-destructive hover:text-destructive"
            disabled={deletingHl}
            onClick={deleteHighlight}
            data-testid="button-delete-highlight"
          >
            {deletingHl ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            )}
            {deletingHl ? "Removendo…" : "Remover destaque"}
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // ── Página de transição — fim da amostra ─────────────────────────────
  const sampleEndBlock = (
    <div data-testid="block-sample-end">
      <div style={{ width: 40, height: 1, background: `${LEATHER_ACC}60`, margin: "0 auto 1.4rem" }} />
      <p className="book-chapter-num" style={{ display: "block", marginBottom: "0.8rem" }}>
        FIM DA AMOSTRA
      </p>
      <p className="text-sm mb-1" style={{ color: "hsl(var(--foreground))" }}>
        A amostra gratuita deste livro termina aqui.
      </p>
      <p className="text-sm mb-4" style={{ color: "hsl(var(--muted-foreground))" }}>
        {lockedRemaining > 0
          ? `Restam ${lockedRemaining} capítulo${lockedRemaining !== 1 ? "s" : ""} para continuar a leitura.`
          : "Os demais capítulos fazem parte do plano Premium."}
      </p>
      {onNavigateToSubscriptions && (
        <Button
          className="w-full font-semibold"
          style={{ background: `linear-gradient(158deg,${LEATHER_FROM},${LEATHER_TO})`, color: "#fff", border: "none", maxWidth: 280 }}
          onClick={onNavigateToSubscriptions}
          data-testid="button-know-premium"
        >
          Conhecer o plano Premium
        </Button>
      )}
    </div>
  );

  // ── Capítulo bloqueado (acesso direto sem amostra) ───────────────────
  if (isChapterLocked) {
    return (
      <div className="min-h-screen bible-page overflow-x-hidden">
        <header className="linho-chrome linho-chrome-top sticky top-0 z-40 border-b">
          <div className="flex items-center px-3 h-11 gap-2 max-w-2xl mx-auto">
            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={onBack}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <p className="flex-1 text-sm font-medium truncate">{resolvedTitle}</p>
          </div>
        </header>
        <main className="max-w-[68ch] mx-auto px-6 py-16 text-center">
          <p className="book-chapter-num" style={{ display: "block", marginBottom: "0.8rem" }}>
            CONTEÚDO PREMIUM
          </p>
          <span className="book-ornament" style={{ display: "block", marginBottom: "1.2rem" }}>❧</span>
          <p className="text-sm mb-1" style={{ color: "hsl(var(--foreground))" }}>
            Este capítulo faz parte do conteúdo completo do livro.
          </p>
          <p className="text-sm mb-6" style={{ color: "hsl(var(--muted-foreground))" }}>
            A amostra gratuita continua disponível a qualquer momento.
          </p>
          <div className="flex flex-col items-center gap-2">
            {onNavigateToSubscriptions && (
              <Button
                className="w-full font-semibold"
                style={{ background: `linear-gradient(158deg,${LEATHER_FROM},${LEATHER_TO})`, color: "#fff", border: "none", maxWidth: 280 }}
                onClick={onNavigateToSubscriptions}
                data-testid="button-know-premium-locked"
              >
                Conhecer o plano Premium
              </Button>
            )}
            <Button variant="outline" style={{ maxWidth: 280 }} className="w-full" onClick={onBack}>
              Voltar ao livro
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  // MODO FALLBACK — rolagem contínua com tipografia de livro
  // ════════════════════════════════════════════════════════════════════════
  if (useFallbackScroll) {
    return (
      <div className="min-h-screen bible-page overflow-x-hidden"
        onMouseUp={handleSelectionEnd} onTouchEnd={handleSelectionEnd}>
        <header className="linho-chrome linho-chrome-top sticky top-0 z-40 border-b">
          <div className="flex items-center px-3 h-11 gap-2 max-w-2xl mx-auto">
            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={onBack}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <p className="flex-1 text-sm font-medium truncate">{resolvedTitle}</p>
            <span className="text-[11px] font-mono text-muted-foreground flex-shrink-0">
              Cap. {chapterNum}{totalChapters > 0 ? ` / ${totalChapters}` : ""}
            </span>
          </div>
        </header>
        {isDraftPreview && (
          <div className="sticky top-11 z-30 text-center text-[10px] tracking-wide py-0.5"
            style={{ background: "rgba(201,168,126,0.16)", color: LEATHER_ACC, borderBottom: `1px solid ${LEATHER_ACC}30` }}>
            Pré-visualização — livro em rascunho
          </div>
        )}
        {isFromOfflineCache && !isDraftPreview && (
          <div className="sticky top-11 z-30 text-center text-[10px] tracking-wide py-0.5"
            data-testid="banner-offline-mode"
            style={{ background: "rgba(201,168,126,0.16)", color: LEATHER_ACC, borderBottom: `1px solid ${LEATHER_ACC}30` }}>
            Modo offline — capítulo salvo neste aparelho
          </div>
        )}
        <main className="max-w-[68ch] mx-auto px-5 py-6 pb-32">
          {isLoading ? (
            <div className="space-y-3 mt-4">
              <Skeleton className="h-7 w-3/4" /><Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" />
            </div>
          ) : chapter ? (
            <div ref={columnRef}>
              <div className="text-center mb-6 pb-4">
                <p className="book-chapter-num" style={{ display: "block", marginBottom: "0.5rem" }}>
                  {chapterOrdinalName(chapterNum).toUpperCase()}
                </p>
                <p className="book-chapter-title-text" style={{ display: "block", marginBottom: "0.4rem" }}>
                  {chapter.title}
                </p>
                <span className="book-ornament" style={{ display: "block" }}>❧</span>
              </div>
              <div className={`${fontClass}`}>
                {chapter.content.trim()
                  ? renderBookMarkdown(chapter.content)
                  : <p className="text-center italic text-sm py-8" style={{ color: "hsl(var(--muted-foreground))" }}>
                      Capítulo ainda sem conteúdo.
                    </p>}
              </div>
              <div className="mt-10 pt-6 border-t border-border/40">
                {chapterNum < totalChapters && nextChapterLocked && !preview ? (
                  <div className="text-center py-2">{sampleEndBlock}</div>
                ) : chapterNum < totalChapters ? (
                  <Button className="w-full font-semibold"
                    style={{ background: `linear-gradient(158deg,${LEATHER_FROM},${LEATHER_TO})`, color: "#fff", border: "none" }}
                    onClick={() => { if (!preview) recordChapterCompletion(); onNavigateToChapter(chapterNum + 1); }}>
                    Próximo capítulo <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                      style={{ background: `linear-gradient(158deg,${LEATHER_FROM},${LEATHER_TO})` }}>
                      <BookOpen className="w-5 h-5" style={{ color: LEATHER_ACC }} />
                    </div>
                    <p className="font-serif text-lg font-semibold mb-1">Livro concluído!</p>
                    <Button variant="outline" onClick={() => { if (!preview) recordChapterCompletion(); onBack(); }}>
                      Voltar à Biblioteca
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : <p className="text-center text-muted-foreground py-8">Capítulo não encontrado.</p>}
        </main>
        <div className="linho-chrome fixed bottom-0 left-0 right-0 z-40 border-t safe-area-inset-bottom">
          <div className="flex items-center gap-2 px-3 h-14 max-w-2xl mx-auto relative">
            <div className="relative">
              <AnimatePresence>
                {showTypo && <TypographyPopover onClose={() => setShowTypo(false)} lineHeight={lineHeight} onLineHeight={setLineHeight} />}
              </AnimatePresence>
              <Button variant="ghost" size="icon" onClick={() => setShowTypo(v => !v)}>
                <Type className="w-4 h-4" />
              </Button>
            </div>
            <Button className="flex-1 font-semibold text-sm"
              style={{ background: `linear-gradient(158deg,${LEATHER_FROM},${LEATHER_TO})`, color: "#fff", border: "none" }}
              onClick={() => setShowProfessor(true)}>
              <MessageSquare className="w-4 h-4 mr-1.5" />Perguntar ao Professor
            </Button>
            <Button variant="ghost" size="icon" onClick={() => {
              if (!user) { toast({ description: "Faça login para salvar destaques." }); return; }
              const sel = window.getSelection()?.toString().trim() ?? "";
              if (sel.length > 3) { setSelectedText(sel); setShowHighlightBar(true); }
              else toast({ description: "Selecione um trecho para destacar." });
            }}><Highlighter className="w-4 h-4" /></Button>
          </div>
        </div>
        {notePopover}
        <ProfessorSheet open={showProfessor} onClose={() => setShowProfessor(false)}
          bookTitle={resolvedTitle} chapterTitle={chapter?.title ?? `Capítulo ${chapterNum}`}
          contextText={chapter?.content ?? ""} />
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  // MODO PAGINADO — layout principal
  // ════════════════════════════════════════════════════════════════════════
  const isAnimating = dragOffset !== 0;
  const transform   = `translateX(${-currentPage * pageDim.w + dragOffset}px)`;

  return (
    <div
      className="book-reader-root"
      style={{
        height: "100dvh", overflow: "hidden", position: "relative", touchAction: "none",
        background: "hsl(var(--background))",
      }}
      onMouseUp={handleSelectionEnd}
    >
      {/* ── Chrome superior ─────────────────────────────────────────── */}
      <header className="linho-chrome linho-chrome-top"
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: 44, zIndex: 40 }}>
        <div className="flex items-center px-3 h-full gap-2 max-w-2xl mx-auto">
          <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={onBack}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <p className="flex-1 text-sm font-medium truncate">{resolvedTitle}</p>
          <span className="text-[11px] font-mono text-muted-foreground flex-shrink-0">
            Cap. {chapterNum}{totalChapters > 0 ? ` / ${totalChapters}` : ""}
          </span>
        </div>
      </header>

      {/* ── Faixa de pré-visualização (rascunho) ────────────────────── */}
      {isDraftPreview && (
        <div className="text-center text-[10px] tracking-wide"
          style={{
            position: "absolute", top: 44, left: 0, right: 0, height: 20, zIndex: 40,
            lineHeight: "20px",
            background: "rgba(201,168,126,0.16)", color: LEATHER_ACC,
            borderBottom: `1px solid ${LEATHER_ACC}30`,
          }}>
          Pré-visualização — livro em rascunho
        </div>
      )}

      {/* ── Faixa de modo offline (conteúdo servido do cache) ───────── */}
      {isFromOfflineCache && !isDraftPreview && (
        <div className="text-center text-[10px] tracking-wide"
          data-testid="banner-offline-mode"
          style={{
            position: "absolute", top: 44, left: 0, right: 0, height: 20, zIndex: 40,
            lineHeight: "20px",
            background: "rgba(201,168,126,0.16)", color: LEATHER_ACC,
            borderBottom: `1px solid ${LEATHER_ACC}30`,
          }}>
          Modo offline — capítulo salvo neste aparelho
        </div>
      )}

      {/* ── Área de leitura — página centralizada (~68ch) em tela grande ── */}
      <div className="bible-page" style={{
        position: "absolute", top: (isDraftPreview || isFromOfflineCache) ? 64 : 44, bottom: 56,
        left: 0, right: 0, maxWidth: "min(100%, 44rem)", margin: "0 auto",
      }}>

        {/* Cabeçalho corrente — escondido na primeira página */}
        <AnimatePresence>
          {showChrome && currentPage > 0 && (
            <motion.div className="book-running-header"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}>
              <span className="truncate max-w-[45%]">{resolvedTitle}</span>
              <span className="truncate max-w-[45%] text-right">{chapter?.title ?? ""}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rodapé de página */}
        <AnimatePresence>
          {showChrome && totalPages > 0 && (
            <motion.div className="book-page-footer"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}>
              <span style={{ minWidth: 28 }}>{absolutePageNum}</span>
              <ProgressDots current={currentPage} total={totalPages} />
              <span style={{ minWidth: 40, textAlign: "right" }}>{readingTimeText}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Container de clipping das colunas ─────────────────────── */}
        <div
          ref={columnAreaRef}
          style={{
            position: "absolute",
            top: showChrome && currentPage > 0 ? 28 : 0,
            bottom: showChrome && totalPages > 0 ? 28 : 0,
            left: 0, right: 0,
            overflow: "hidden",
            transition: "top 0.18s ease, bottom 0.18s ease",
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
          onClick={handleAreaClick}
        >
          {isLoading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-6 w-1/2 mx-auto" />
              <Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" /><Skeleton className="h-4 w-full" />
            </div>
          ) : chapter ? (
            <>
              {/* ── Div CSS multi-column ─────────────────────────── */}
              <div
                ref={columnRef}
                className={`book-columns ${fontClass}`}
                style={{
                  columnWidth: pageDim.w > 0 ? `${pageDim.w}px` : "100%",
                  height: pageDim.h > 0 ? `${pageDim.h}px` : "100%",
                  transform,
                  transition: isAnimating ? "none" : "transform 0.26s cubic-bezier(0.25,0.46,0.45,0.94)",
                  willChange: "transform",
                }}
              >
                {/* Abertura do capítulo */}
                <div className="book-chapter-open">
                  <span className="book-chapter-num">{chapterOrdinalName(chapterNum).toUpperCase()}</span>
                  <span className="book-chapter-title-text">{chapter.title}</span>
                  <span className="book-ornament">❧</span>
                </div>

                {/* Corpo do capítulo */}
                {chapter.content.trim()
                  ? renderBookMarkdown(chapter.content)
                  : <p className="text-center italic text-sm py-8" style={{ color: "hsl(var(--muted-foreground))" }}>
                      Capítulo ainda sem conteúdo.
                    </p>}

                {/* Fim do capítulo */}
                <div className="book-chapter-end">
                  {chapterNum < totalChapters && nextChapterLocked && !preview ? (
                    sampleEndBlock
                  ) : chapterNum < totalChapters ? (
                    <div>
                      <div style={{
                        width: 40, height: 1, background: `${LEATHER_ACC}60`,
                        margin: "0 auto 1.2rem",
                      }} />
                      <Button
                        className="w-full font-semibold"
                        style={{ background: `linear-gradient(158deg,${LEATHER_FROM},${LEATHER_TO})`, color: "#fff", border: "none", maxWidth: 280 }}
                        onClick={() => { if (!preview) recordChapterCompletion(); onNavigateToChapter(chapterNum + 1); }}>
                        Próximo capítulo <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                        style={{ background: `linear-gradient(158deg,${LEATHER_FROM},${LEATHER_TO})` }}>
                        <BookOpen className="w-5 h-5" style={{ color: LEATHER_ACC }} />
                      </div>
                      <p className="font-serif text-base font-semibold mb-1" style={{ color: "hsl(var(--foreground))" }}>
                        Livro concluído!
                      </p>
                      <p className="text-sm mb-3" style={{ color: "hsl(var(--muted-foreground))" }}>
                        Você terminou de ler este livro.
                      </p>
                      <Button variant="outline" onClick={() => { if (!preview) recordChapterCompletion(); onBack(); }}>
                        Voltar à Biblioteca
                      </Button>
                    </div>
                  )}
                </div>
              </div>

            </>
          ) : (
            <p className="text-center p-8" style={{ color: "hsl(var(--muted-foreground))" }}>
              Capítulo não encontrado.
            </p>
          )}
        </div>
      </div>

      {/* ── Setas visíveis nas laterais externas (só com mouse) ──────── */}
      {isDesktop && !isLoading && chapter && (
        <>
          {currentPage > 0 && (
            <button className="book-nav-arrow book-nav-arrow-left" onClick={goPrev}
              aria-label="Página anterior" data-testid="button-page-prev">
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          {currentPage < totalPages - 1 && (
            <button className="book-nav-arrow book-nav-arrow-right" onClick={goNext}
              aria-label="Próxima página" data-testid="button-page-next">
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </>
      )}

      {/* ── Barra inferior fixa ──────────────────────────────────────── */}
      <AnimatePresence>
        {showChrome && (
          <motion.div className="linho-chrome"
            initial={{ y: 56 }} animate={{ y: 0 }} exit={{ y: 56 }}
            transition={{ duration: 0.18 }}
            style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 56, zIndex: 40, borderTop: "1px solid hsl(var(--border))" }}>
            <div className="flex items-center gap-2 px-3 h-full max-w-2xl mx-auto relative">
              <div className="relative">
                <AnimatePresence>
                  {showTypo && (
                    <TypographyPopover
                      onClose={() => setShowTypo(false)}
                      lineHeight={lineHeight}
                      onLineHeight={(v) => { captureAnchorBeforeReflow(); setLineHeight(v); }}
                    />
                  )}
                </AnimatePresence>
                <Button variant="ghost" size="icon" onClick={() => setShowTypo(v => !v)}
                  title="Tipografia">
                  <Type className="w-4 h-4" />
                </Button>
              </div>

              <Button className="flex-1 font-semibold text-sm"
                style={{ background: `linear-gradient(158deg,${LEATHER_FROM},${LEATHER_TO})`, color: "#fff", border: "none" }}
                onClick={() => setShowProfessor(true)}>
                <MessageSquare className="w-4 h-4 mr-1.5" />Perguntar ao Professor
              </Button>

              <Button variant="ghost" size="icon" onClick={() => {
                if (!user) { toast({ description: "Faça login para salvar destaques." }); return; }
                const sel = window.getSelection()?.toString().trim() ?? "";
                if (sel.length > 3) { setSelectedText(sel); setShowHighlightBar(true); }
                else toast({ description: "Selecione um trecho para destacar." });
              }} title="Destacar">
                <Highlighter className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Barra de destaque ────────────────────────────────────────── */}
      <AnimatePresence>
        {showHighlightBar && user && (
          <motion.div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-card border border-border rounded-xl shadow-xl px-3 py-2 w-[min(20rem,calc(100vw-2rem))]"
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            onMouseUp={(e) => e.stopPropagation()} onTouchEnd={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2">
              {HIGHLIGHT_COLORS.map(c => (
                <button key={c.id} onClick={() => saveHighlight(c.id)}
                  className="w-6 h-6 rounded-full border-2 border-white/30 transition-transform hover:scale-110"
                  style={{ backgroundColor: c.bg }} title={c.label}
                  data-testid={`button-highlight-${c.id}`} />
              ))}
              <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto"
                onClick={() => { setShowHighlightBar(false); setAnnotationDraft(""); }}>
                <X className="w-3 h-3" />
              </Button>
            </div>
            <textarea
              value={annotationDraft}
              onChange={(e) => setAnnotationDraft(e.target.value)}
              placeholder="Adicionar nota…"
              rows={2}
              className="mt-2 w-full text-sm bg-muted/50 border border-border rounded-md p-2 resize-none focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
              data-testid="input-highlight-annotation"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Popover da nota do destaque ─────────────────────────────── */}
      {notePopover}

      {/* ── Professor ───────────────────────────────────────────────── */}
      <ProfessorSheet
        open={showProfessor} onClose={() => setShowProfessor(false)}
        bookTitle={resolvedTitle}
        chapterTitle={chapter?.title ?? `Capítulo ${chapterNum}`}
        contextText={chapter ? getPageContext(chapter.content, currentPage, totalPages) : ""}
      />
    </div>
  );
}
