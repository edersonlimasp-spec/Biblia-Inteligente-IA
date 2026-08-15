import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, BookOpen, Check, X, Eye, EyeOff, GripVertical, BookOpenCheck } from "lucide-react";
import { useNavigation } from "@/contexts/NavigationContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getApiUrl } from "@/lib/queryClient";

// ── Paleta couro ─────────────────────────────────────────────────────────
const LEATHER_FROM = "#5C4632";
const LEATHER_TO   = "#3F2F21";
const LEATHER_ACC  = "#C9A87E";

const CATEGORIES = [
  "Devocionais", "Vida Cristã", "Ministério",
  "Estudo Bíblico e Teologia", "Família", "Clássicos",
];

// Modelo único de acesso: todo livro é Premium, com capítulos de amostra
// gratuitos (2 primeiros sempre; o admin pode marcar outros).

interface LibraryBook {
  id: string;
  title: string;
  subtitle: string | null;
  author: string;
  description: string | null;
  coverUrl: string | null;
  category: string;
  accessType: string;
  price: string | null;
  planRequired: string | null;
  estimatedReadTime: string | null;
  chaptersCount: number;
  totalChapters?: number;
  filledChapters?: number;
  emptyChapters?: number;
  publishStatus: string;
  isNew: boolean;
  editionNote: string | null;
}

interface LibraryChapter {
  id: string;
  bookId: string;
  orderNum: number;
  title: string;
  content: string;
  estimatedReadTime: string | null;
  isSample: boolean;
}

const EMPTY_BOOK: Partial<LibraryBook> = {
  title: "", author: "", category: CATEGORIES[0],
  accessType: "plan", publishStatus: "draft", isNew: false,
};

async function apiFetch(url: string, options?: RequestInit) {
  const res = await fetch(getApiUrl(url), {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ── Simple Markdown preview renderer (for admin panel) ────────────────────
function MarkdownPreview({ md }: { md: string }) {
  const lines = md.split("\n");
  const nodes: React.ReactNode[] = [];
  let key = 0;

  const inline = (text: string) => {
    // Simple inline: bold, italic
    const parts: React.ReactNode[] = [];
    let last = 0;
    const re = /(\*\*\*(.+?)\*\*\*)|(\*\*(.+?)\*\*)|(\*(.+?)\*)|(_(.+?)_)/g;
    let m;
    let ki = 0;
    while ((m = re.exec(text)) !== null) {
      if (m.index > last) parts.push(text.slice(last, m.index));
      if (m[2]) parts.push(<strong key={ki++}><em>{m[2]}</em></strong>);
      else if (m[4]) parts.push(<strong key={ki++}>{m[4]}</strong>);
      else if (m[6]) parts.push(<em key={ki++}>{m[6]}</em>);
      else if (m[8]) parts.push(<em key={ki++}>{m[8]}</em>);
      last = m.index + m[0].length;
    }
    if (last < text.length) parts.push(text.slice(last));
    return parts;
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^---+$/.test(line.trim())) { nodes.push(<hr key={key++} className="border-border my-3" />); i++; continue; }
    if (line.startsWith("# "))  { nodes.push(<h1 key={key++} className="font-serif text-xl font-bold mt-4 mb-2">{inline(line.slice(2))}</h1>); i++; continue; }
    if (line.startsWith("## ")) { nodes.push(<h2 key={key++} className="font-serif text-lg font-semibold mt-3 mb-1">{inline(line.slice(3))}</h2>); i++; continue; }
    if (line.startsWith("### ")){ nodes.push(<h3 key={key++} className="font-serif text-base font-medium mt-2 mb-1">{inline(line.slice(4))}</h3>); i++; continue; }
    if (line.startsWith("> "))  {
      const qs: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) { qs.push(lines[i].slice(2)); i++; }
      nodes.push(<blockquote key={key++} className="border-l-4 pl-3 my-3 italic text-muted-foreground" style={{ borderColor: LEATHER_ACC }}>{qs.map((q,qi) => <p key={qi}>{inline(q)}</p>)}</blockquote>);
      continue;
    }
    if (/^[-*]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i])) { items.push(lines[i].replace(/^[-*]\s/, "")); i++; }
      nodes.push(<ul key={key++} className="list-disc list-inside mb-2 space-y-0.5">{items.map((it,ii) => <li key={ii}>{inline(it)}</li>)}</ul>);
      continue;
    }
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) { items.push(lines[i].replace(/^\d+\.\s/, "")); i++; }
      nodes.push(<ol key={key++} className="list-decimal list-inside mb-2 space-y-0.5">{items.map((it,ii) => <li key={ii}>{inline(it)}</li>)}</ol>);
      continue;
    }
    if (line.trim().startsWith("|")) {
      const rows: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) { rows.push(lines[i]); i++; }
      const parseRow = (r: string) => r.split("|").filter((_,ci,a) => ci > 0 && ci < a.length - 1).map(c => c.trim());
      const [hdr, , ...body] = rows;
      nodes.push(
        <div key={key++} className="overflow-x-auto my-3">
          <table className="w-full text-xs border-collapse">
            <thead><tr>{parseRow(hdr).map((h,hi) => <th key={hi} className="border border-border px-2 py-1 text-left bg-muted/50 font-semibold">{inline(h)}</th>)}</tr></thead>
            <tbody>{body.map((row,ri) => <tr key={ri}>{parseRow(row).map((cell,ci) => <td key={ci} className="border border-border px-2 py-1">{inline(cell)}</td>)}</tr>)}</tbody>
          </table>
        </div>
      );
      continue;
    }
    if (line.trim() === "") { i++; continue; }
    const paraLines: string[] = [];
    while (i < lines.length && lines[i].trim() !== "" && !lines[i].startsWith("#") && !lines[i].startsWith(">") && !/^---+$/.test(lines[i].trim()) && !/^[-*]\s/.test(lines[i]) && !/^\d+\.\s/.test(lines[i]) && !lines[i].trim().startsWith("|")) {
      paraLines.push(lines[i]); i++;
    }
    if (paraLines.length) nodes.push(<p key={key++} className="leading-relaxed mb-2">{inline(paraLines.join(" "))}</p>);
  }
  return <>{nodes}</>;
}

// ── BookForm ──────────────────────────────────────────────────────────────
function BookForm({
  initial, onSave, onCancel,
}: {
  initial?: Partial<LibraryBook>;
  onSave: (data: Partial<LibraryBook>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Partial<LibraryBook>>({ ...EMPTY_BOOK, ...initial });
  const set = (key: keyof LibraryBook, val: any) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Título *</label>
          <Input value={form.title ?? ""} onChange={e => set("title", e.target.value)} placeholder="Título do livro" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Subtítulo</label>
          <Input value={form.subtitle ?? ""} onChange={e => set("subtitle", e.target.value)} placeholder="Opcional" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Autor *</label>
          <Input value={form.author ?? ""} onChange={e => set("author", e.target.value)} placeholder="Nome do autor" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Categoria *</label>
          <Select value={form.category} onValueChange={v => set("category", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Descrição</label>
        <Textarea
          value={form.description ?? ""}
          onChange={e => set("description", e.target.value)}
          placeholder="Sinopse do livro"
          rows={3}
        />
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Nota da edição</label>
        <Textarea
          value={form.editionNote ?? ""}
          onChange={e => set("editionNote", e.target.value)}
          placeholder="Origem da obra, crédito de tradução, domínio público, etc."
          rows={2}
        />
        <p className="text-[10px] text-muted-foreground mt-0.5">Exibida abaixo da descrição com filete lateral.</p>
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">URL ou caminho da capa (PNG, JPG, SVG…)</label>
        <Input value={form.coverUrl ?? ""} onChange={e => set("coverUrl", e.target.value)} placeholder="https://... ou /covers/livro.svg" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Acesso</label>
          <div className="h-9 px-3 flex items-center rounded-md border border-border bg-muted/40 text-sm text-muted-foreground">
            Premium (assinantes)
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Os 2 primeiros capítulos são amostra gratuita; outros podem ser marcados como amostra.
          </p>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Tempo de leitura</label>
          <Input value={form.estimatedReadTime ?? ""} onChange={e => set("estimatedReadTime", e.target.value)} placeholder="3h 20min" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Situação</label>
          <Select value={form.publishStatus} onValueChange={v => set("publishStatus", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Rascunho</SelectItem>
              <SelectItem value="published">Publicado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isNew ?? false} onChange={e => set("isNew", e.target.checked)} />
            <span className="text-sm">Marcar como Novo</span>
          </label>
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <Button
          className="flex-1"
          style={{ background: `linear-gradient(158deg, ${LEATHER_FROM}, ${LEATHER_TO})`, color: "#fff", border: "none" }}
          onClick={() => onSave(form)}
          disabled={!form.title || !form.author || !form.category}
        >
          <Check className="w-4 h-4 mr-1" /> Salvar
        </Button>
        <Button variant="outline" onClick={onCancel}>
          <X className="w-4 h-4 mr-1" /> Cancelar
        </Button>
      </div>
    </div>
  );
}

// ── ChapterForm ────────────────────────────────────────────────────────────
function ChapterForm({
  bookId, initial, onSave, onCancel, onPreviewInReader,
}: {
  bookId: string;
  initial?: Partial<LibraryChapter>;
  onSave: (data: Partial<LibraryChapter>) => void;
  onCancel: () => void;
  onPreviewInReader?: () => void;
}) {
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    content: initial?.content ?? "",
    orderNum: initial?.orderNum ?? 1,
    estimatedReadTime: initial?.estimatedReadTime ?? "",
    isSample: initial?.isSample ?? false,
  });
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Ordem *</label>
          <Input
            type="number" min={1}
            value={form.orderNum}
            onChange={e => setForm(f => ({ ...f, orderNum: parseInt(e.target.value) || 1 }))}
          />
        </div>
        <div className="col-span-2">
          <label className="text-xs text-muted-foreground mb-1 block">Título *</label>
          <Input
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Título do capítulo"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Tempo estimado</label>
          <Input
            value={form.estimatedReadTime}
            onChange={e => setForm(f => ({ ...f, estimatedReadTime: e.target.value }))}
            placeholder="12 min"
          />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isSample}
              onChange={e => setForm(f => ({ ...f, isSample: e.target.checked }))}
            />
            <span className="text-sm">Amostra gratuita</span>
          </label>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs text-muted-foreground">
            Conteúdo (Markdown)
            <span className="ml-1 text-muted-foreground/50">— pode ficar vazio para placeholder</span>
          </label>
          <button
            type="button"
            onClick={() => setShowPreview(v => !v)}
            className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground"
          >
            {showPreview ? <><EyeOff className="w-3 h-3" /> Editar</> : <><Eye className="w-3 h-3" /> Preview</>}
          </button>
        </div>
        {showPreview ? (
          <div className="min-h-[200px] rounded-lg border border-border p-3 text-sm font-serif leading-relaxed bg-muted/30 overflow-auto">
            {form.content
              ? <MarkdownPreview md={form.content} />
              : <span className="text-muted-foreground italic">Nenhum conteúdo</span>
            }
          </div>
        ) : (
          <Textarea
            value={form.content}
            onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            placeholder={"# Capítulo\n\nDigite o conteúdo em Markdown...\n\n## Seção\n### Subseção\n\n**negrito**, *itálico*, > citação\n\n- lista\n1. lista numerada\n\n| Col1 | Col2 |\n|------|------|\n| dado | dado |\n\nReferências bíblicas como João 3:16 ou [Is 64:6] serão detectadas automaticamente."}
            rows={12}
            className="font-mono text-sm"
          />
        )}
      </div>

      <div className="flex gap-2 pt-1">
        <Button
          className="flex-1"
          style={{ background: `linear-gradient(158deg, ${LEATHER_FROM}, ${LEATHER_TO})`, color: "#fff", border: "none" }}
          onClick={() => onSave(form)}
          disabled={!form.title}
        >
          <Check className="w-4 h-4 mr-1" /> Salvar capítulo
        </Button>
        <Button variant="outline" onClick={onCancel}>
          <X className="w-4 h-4 mr-1" /> Cancelar
        </Button>
      </div>
      {onPreviewInReader && (
        <Button variant="outline" className="w-full" onClick={onPreviewInReader}>
          <BookOpenCheck className="w-4 h-4 mr-1.5" /> Ver este capítulo no leitor
        </Button>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export function AdminLibrary() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const {
    navigate,
    setSelectedBookId: setNavBookId,
    setSelectedBookTitle: setNavBookTitle,
    setSelectedChapterNum: setNavChapterNum,
    setLibraryPreview,
  } = useNavigation();

  // Abre um livro/capítulo no leitor paginado em modo pré-visualização (admin)
  const previewInReader = (book: LibraryBook, chapterNum = 1) => {
    setNavBookId(book.id);
    setNavBookTitle(book.title);
    setNavChapterNum(chapterNum);
    setLibraryPreview(true);
    navigate("library-reader");
  };
  const [activeTab, setActiveTab] = useState<"books" | "chapters">("books");
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [editingBook, setEditingBook] = useState<Partial<LibraryBook> | null>(null);
  const [editingChapter, setEditingChapter] = useState<Partial<LibraryChapter> | null>(null);
  const [newBook, setNewBook] = useState(false);
  const [newChapter, setNewChapter] = useState(false);

  // Drag-to-reorder state
  const dragId = useRef<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const { data: books = [], isLoading: booksLoading } = useQuery<LibraryBook[]>({
    queryKey: ["/api/admin/library/books"],
    queryFn: () => apiFetch("/api/admin/library/books"),
  });

  const { data: chapters = [], isLoading: chaptersLoading } = useQuery<LibraryChapter[]>({
    queryKey: ["/api/admin/library/chapters", selectedBookId],
    queryFn: () => apiFetch(`/api/admin/library/chapters/${selectedBookId}`),
    enabled: !!selectedBookId,
  });

  const createBookMut = useMutation({
    mutationFn: (data: Partial<LibraryBook>) => apiFetch("/api/admin/library/books", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/admin/library/books"] }); setNewBook(false); toast({ description: "Livro criado." }); },
    onError: (e: any) => toast({ variant: "destructive", description: `Erro: ${e.message}` }),
  });

  const updateBookMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<LibraryBook> }) =>
      apiFetch(`/api/admin/library/books/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/admin/library/books"] }); setEditingBook(null); toast({ description: "Livro atualizado." }); },
    onError: (e: any) => toast({ variant: "destructive", description: `Erro: ${e.message}` }),
  });

  const deleteBookMut = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/admin/library/books/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/admin/library/books"] }); toast({ description: "Livro excluído." }); },
    onError: (e: any) => toast({ variant: "destructive", description: `Erro: ${e.message}` }),
  });

  const createChapterMut = useMutation({
    mutationFn: (data: Partial<LibraryChapter>) => apiFetch(`/api/admin/library/chapters/${selectedBookId}`, { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/admin/library/chapters", selectedBookId] }); setNewChapter(false); toast({ description: "Capítulo criado." }); },
    onError: (e: any) => toast({ variant: "destructive", description: `Erro: ${e.message}` }),
  });

  const updateChapterMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<LibraryChapter> }) =>
      apiFetch(`/api/admin/library/chapters/${selectedBookId}/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/admin/library/chapters", selectedBookId] }); setEditingChapter(null); toast({ description: "Capítulo atualizado." }); },
    onError: (e: any) => toast({ variant: "destructive", description: `Erro: ${e.message}` }),
  });

  const deleteChapterMut = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/admin/library/chapters/${selectedBookId}/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/admin/library/chapters", selectedBookId] }); toast({ description: "Capítulo excluído." }); },
    onError: (e: any) => toast({ variant: "destructive", description: `Erro: ${e.message}` }),
  });

  const reorderChaptersMut = useMutation({
    mutationFn: (order: Array<{ id: string; orderNum: number }>) =>
      apiFetch(`/api/admin/library/chapters/${selectedBookId}/reorder`, { method: "PATCH", body: JSON.stringify({ order }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/admin/library/chapters", selectedBookId] }); },
    onError: (e: any) => toast({ variant: "destructive", description: `Erro ao reordenar: ${e.message}` }),
  });

  // ── Drag handlers ────────────────────────────────────────────────────
  const handleDragStart = (id: string) => { dragId.current = id; };
  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (dragId.current !== id) setDragOverId(id);
  };
  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDragOverId(null);
    const srcId = dragId.current;
    dragId.current = null;
    if (!srcId || srcId === targetId) return;

    const sorted = [...chapters].sort((a, b) => a.orderNum - b.orderNum);
    const srcIdx = sorted.findIndex(c => c.id === srcId);
    const tgtIdx = sorted.findIndex(c => c.id === targetId);
    if (srcIdx === -1 || tgtIdx === -1) return;

    // Reorder array and reassign orderNums preserving original numeric values
    const reordered = [...sorted];
    const [moved] = reordered.splice(srcIdx, 1);
    reordered.splice(tgtIdx, 0, moved);

    // Build new orderNum assignments using original numbers to preserve gaps
    const originalNums = sorted.map(c => c.orderNum);
    const order = reordered.map((ch, i) => ({ id: ch.id, orderNum: originalNums[i] }));
    reorderChaptersMut.mutate(order);
  };

  const selectedBook = books.find(b => b.id === selectedBookId);

  return (
    <div className="space-y-6">
      {/* Tab selector */}
      <div className="flex gap-2 border-b border-border">
        {(["books", "chapters"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="pb-2 px-1 text-sm font-medium border-b-2 transition-colors"
            style={{
              borderColor: activeTab === tab ? LEATHER_ACC : "transparent",
              color: activeTab === tab ? LEATHER_ACC : "hsl(var(--muted-foreground))",
            }}
          >
            {tab === "books" ? "Livros" : "Capítulos"}
          </button>
        ))}
      </div>

      {/* ── BOOKS tab ─────────────────────────────────────────────────────── */}
      {activeTab === "books" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">{books.length} livro{books.length !== 1 ? "s" : ""} no catálogo</p>
            <Button
              onClick={() => setNewBook(true)}
              style={{ background: `linear-gradient(158deg, ${LEATHER_FROM}, ${LEATHER_TO})`, color: "#fff", border: "none" }}
            >
              <Plus className="w-4 h-4 mr-1" /> Novo livro
            </Button>
          </div>

          {newBook && (
            <BookForm
              onSave={d => createBookMut.mutate(d)}
              onCancel={() => setNewBook(false)}
            />
          )}

          {booksLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : books.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhum livro cadastrado ainda.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {books.map(book => (
                <div key={book.id}>
                  {editingBook?.id === book.id ? (
                    <BookForm
                      initial={book}
                      onSave={d => updateBookMut.mutate({ id: book.id, data: d })}
                      onCancel={() => setEditingBook(null)}
                    />
                  ) : (
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                      <div className="w-8 h-12 rounded overflow-hidden bg-muted flex-shrink-0">
                        {book.coverUrl ? (
                          <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center" style={{ background: `${LEATHER_FROM}30` }}>
                            <BookOpen className="w-3 h-3" style={{ color: LEATHER_ACC }} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{book.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{book.author} · {book.category}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge variant={book.publishStatus === "published" ? "default" : "secondary"} className="text-[9px] px-1 py-0">
                            {book.publishStatus === "published" ? "Publicado" : "Rascunho"}
                          </Badge>
                          <span className="text-[9px] font-mono text-muted-foreground">
                            {(book.totalChapters ?? book.chaptersCount)} cap
                            {book.totalChapters !== undefined && (
                              <> · {book.filledChapters} com conteúdo · {book.emptyChapters} vazio{(book.emptyChapters ?? 0) !== 1 ? "s" : ""}</>
                            )}
                            {" · "}Premium
                          </span>
                          {book.editionNote && (
                            <span className="text-[9px] text-muted-foreground/60 truncate max-w-[120px]" title={book.editionNote}>
                              nota: {book.editionNote.slice(0, 30)}…
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => previewInReader(book)}
                          title="Pré-visualizar no leitor"
                          data-testid={`button-preview-book-${book.id}`}
                        >
                          <BookOpenCheck className="w-3.5 h-3.5" style={{ color: LEATHER_ACC }} />
                        </Button>
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => { setSelectedBookId(book.id); setActiveTab("chapters"); }}
                          title="Ver capítulos"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => setEditingBook(book)}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => {
                            if (confirm(`Excluir "${book.title}"? Esta ação não pode ser desfeita.`)) {
                              deleteBookMut.mutate(book.id);
                            }
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── CHAPTERS tab ──────────────────────────────────────────────────── */}
      {activeTab === "chapters" && (
        <div className="space-y-4">
          {/* Book selector */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Selecione o livro</label>
            <Select value={selectedBookId ?? ""} onValueChange={setSelectedBookId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Escolha um livro..." />
              </SelectTrigger>
              <SelectContent>
                {books.map(b => <SelectItem key={b.id} value={b.id}>{b.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {selectedBookId && (
            <>
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  {selectedBook?.title} — {chapters.length} capítulo{chapters.length !== 1 ? "s" : ""}
                  <span className="ml-2 text-[10px] text-muted-foreground/60">arraste ☰ para reordenar</span>
                </p>
                <Button
                  onClick={() => setNewChapter(true)}
                  style={{ background: `linear-gradient(158deg, ${LEATHER_FROM}, ${LEATHER_TO})`, color: "#fff", border: "none" }}
                >
                  <Plus className="w-4 h-4 mr-1" /> Novo capítulo
                </Button>
              </div>

              {newChapter && (
                <ChapterForm
                  bookId={selectedBookId}
                  initial={{ orderNum: chapters.length > 0 ? Math.max(...chapters.map(c => c.orderNum)) + 1 : 1 }}
                  onSave={d => createChapterMut.mutate(d)}
                  onCancel={() => setNewChapter(false)}
                />
              )}

              {chaptersLoading ? (
                <p className="text-sm text-muted-foreground">Carregando...</p>
              ) : chapters.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <p className="text-sm">Nenhum capítulo cadastrado para este livro.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {[...chapters].sort((a, b) => a.orderNum - b.orderNum).map(ch => (
                    <div
                      key={ch.id}
                      draggable={editingChapter?.id !== ch.id}
                      onDragStart={() => handleDragStart(ch.id)}
                      onDragOver={e => handleDragOver(e, ch.id)}
                      onDragLeave={() => setDragOverId(null)}
                      onDrop={e => handleDrop(e, ch.id)}
                      style={{
                        opacity: dragId.current === ch.id ? 0.4 : 1,
                        outline: dragOverId === ch.id ? `2px solid ${LEATHER_ACC}` : "none",
                        borderRadius: 8,
                        transition: "opacity 0.15s",
                      }}
                    >
                      {editingChapter?.id === ch.id ? (
                        <ChapterForm
                          bookId={selectedBookId}
                          initial={ch}
                          onSave={d => updateChapterMut.mutate({ id: ch.id, data: d })}
                          onCancel={() => setEditingChapter(null)}
                          onPreviewInReader={selectedBook ? () => previewInReader(selectedBook, ch.orderNum) : undefined}
                        />
                      ) : (
                        <div className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                          {/* Drag handle */}
                          <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0 cursor-grab active:cursor-grabbing" />
                          <span className="text-xs font-mono text-muted-foreground w-6 text-right flex-shrink-0">{ch.orderNum}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{ch.title}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {ch.isSample && (
                                <Badge variant="outline" className="text-[9px] px-1 py-0" style={{ borderColor: `${LEATHER_ACC}60`, color: LEATHER_ACC }}>
                                  Amostra
                                </Badge>
                              )}
                              {ch.estimatedReadTime && (
                                <span className="text-[9px] font-mono text-muted-foreground">{ch.estimatedReadTime}</span>
                              )}
                              <span className="text-[9px] text-muted-foreground">
                                {ch.content.length > 0 ? `${Math.ceil(ch.content.length / 1000)}k chars` : "⏳ aguardando conteúdo"}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingChapter(ch)}>
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => {
                                if (confirm(`Excluir capítulo "${ch.title}"?`)) deleteChapterMut.mutate(ch.id);
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {!selectedBookId && (
            <div className="text-center py-10 text-muted-foreground">
              <p className="text-sm">Selecione um livro acima para gerenciar seus capítulos.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
