import { useMemo, useState } from "react";
import { AlertCircle, BookOpen, Check, Loader2, Save, WandSparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAdminDevotionals, useGenerateDevotionals, useUpdateAdminDevotional, type AdminDevotionalRow } from "@/hooks/use-devotional";
import type { DevotionalContent, DevotionalRoutine } from "@shared/devotional";
import { getMelDate } from "@/lib/mel-date";

type Editable = DevotionalContent;
const initialContent = (date: string): Editable => ({
  date, routine: "manha", title: "", book: "mat", chapter: 1, verse: 1, endVerse: null,
  reflection: "", strongNumber: "G3056", action: "", prayer: "", question: "", status: "rascunho",
});
const inputClass = "min-h-11 border-[#d7d0c3] bg-[#fbfaf6] text-[#342e24]";

export function AdminDevotionals() {
  const [from] = useState(getMelDate);
  const { data: rows, isLoading, isError, refetch } = useAdminDevotionals(from);
  const generate = useGenerateDevotionals(from);
  const update = useUpdateAdminDevotional(from);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Editable>(() => initialContent(from));
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const selected: AdminDevotionalRow | undefined = rows?.find((row) => row.id === selectedId);
  const sorted = useMemo(() => [...(rows ?? [])].sort((a, b) => a.date.localeCompare(b.date) || a.routine.localeCompare(b.routine)), [rows]);

  const edit = (row: AdminDevotionalRow) => {
    setSelectedId(row.id);
    setDraft({
      date: row.date, routine: row.routine, title: row.title, book: row.book, chapter: row.chapter,
      verse: row.verse, endVerse: row.endVerse, reflection: row.reflection, strongNumber: row.strongNumber,
      action: row.action, prayer: row.prayer, question: row.question, status: row.status,
    });
    setNotice("");
    setError("");
  };
  const change = <K extends keyof Editable>(key: K, value: Editable[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const save = async (status = draft.status) => {
    if (!selectedId) return;
    setError("");
    setNotice("");
    try {
      await update.mutateAsync({ id: selectedId, content: { ...draft, status } });
      setDraft((current) => ({ ...current, status }));
      setNotice(status === "aprovado" ? "Conteúdo salvo e aprovado." : "Rascunho salvo.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível salvar o devocional.");
    }
  };
  const generateDrafts = async () => {
    setError("");
    setNotice("");
    try {
      const result = await generate.mutateAsync();
      const summary = `${result.created} rascunhos criados; ${result.skipped} já existentes; ${result.failed} falhas.`;
      if (result.failed > 0) {
        setError(result.message || "Parte dos rascunhos não pôde ser gerada. Revise os resultados e tente novamente.");
        setNotice(summary);
      } else {
        setNotice(result.message || summary);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível gerar os rascunhos.");
    }
  };
  const setNumber = (key: "chapter" | "verse" | "endVerse", value: string) =>
    change(key, value === "" ? (key === "endVerse" ? null : 1) : Number(value) as Editable[typeof key]);

  return (
    <section className="space-y-6" data-testid="admin-devotionals">
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-[#ddd4c1] bg-[#f4eddf] p-5 sm:flex-row sm:items-center sm:p-7">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#e3d4b6] text-[#755a2f]"><BookOpen className="h-5 w-5" /></div>
          <div><p className="font-mono text-[10px] uppercase tracking-[.18em] text-[#806339]">Conteúdo editorial</p><h2 className="mt-1 font-serif text-2xl text-[#342e24]">Devocionais</h2><p className="mt-1 text-sm text-[#756b59]">Gere rascunhos, revise cada campo e aprove somente quando estiver pronto.</p></div>
        </div>
        <Button onClick={generateDrafts} disabled={generate.isPending} className="min-h-11 shrink-0 bg-[#70562e] text-white hover:bg-[#594323]" data-testid="button-generate-devotionals">
          {generate.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Gerando rascunhos...</> : <><WandSparkles className="mr-2 h-4 w-4" />Gerar próximos 30 dias</>}
        </Button>
      </div>
      {notice && <p role="status" className="rounded-xl border border-[#bdcbb7] bg-[#edf3e9] p-3 text-sm text-[#3c5d41]">{notice}</p>}
      {error && <p role="alert" className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"><AlertCircle className="h-4 w-4" />{error}</p>}
      <div className="grid gap-5 lg:grid-cols-[minmax(240px,.8fr)_minmax(0,1.6fr)]">
        <div className="overflow-hidden rounded-2xl border border-[#ded7c9] bg-card">
          <div className="flex items-center justify-between border-b px-4 py-3"><h3 className="font-serif text-lg">Conteúdos a revisar</h3><span className="font-mono text-xs text-muted-foreground">{rows?.length ?? "—"}</span></div>
          {isLoading ? <div className="space-y-3 p-4" role="status"><div className="h-12 animate-pulse rounded-lg bg-muted" /><div className="h-12 animate-pulse rounded-lg bg-muted" /><div className="h-12 animate-pulse rounded-lg bg-muted" /></div>
            : isError ? <div className="p-5 text-sm text-muted-foreground"><p>Não foi possível carregar os devocionais.</p><Button variant="outline" className="mt-3" onClick={() => void refetch()}>Tentar novamente</Button></div>
              : sorted.length === 0 ? <div className="p-6 text-sm leading-6 text-muted-foreground">Ainda não há conteúdos neste período. Gere rascunhos para começar a revisão.</div>
                : <div className="max-h-[680px] divide-y overflow-y-auto">{sorted.map((row) => <button key={row.id} type="button" onClick={() => edit(row)} className={`block w-full p-4 text-left transition-colors hover:bg-muted/50 ${row.id === selectedId ? "bg-[#f4eddf]" : ""}`}>
                  <span className="flex items-center justify-between gap-2"><span className="font-serif text-base">{new Date(`${row.date}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} · {row.routine === "manha" ? "Manhã" : "Noite"}</span><span className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-wide ${row.status === "aprovado" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"}`}>{row.status}</span></span>
                  <span className="mt-1 block truncate text-sm text-muted-foreground">{row.title || "Sem título"}</span>
                </button>)}</div>}
        </div>
        <div className="rounded-2xl border border-[#ded7c9] bg-card p-4 sm:p-6">
          {!selected ? <div className="flex min-h-64 flex-col items-center justify-center text-center text-muted-foreground"><BookOpen className="mb-4 h-8 w-8 text-[#9a8156]" /><p className="font-serif text-xl text-foreground">Escolha um rascunho</p><p className="mt-2 max-w-sm text-sm">Cada conteúdo é revisado e aprovado individualmente antes de ficar disponível.</p></div> : <>
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><p className="font-mono text-[10px] uppercase tracking-[.16em] text-[#806339]">{selected.date}</p><h3 className="mt-1 font-serif text-2xl">{selected.title || "Editar devocional"}</h3></div><span className="rounded-full border px-3 py-1 text-xs">{draft.status === "aprovado" ? "Aprovado" : "Rascunho"}</span></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm">Data<Input type="date" value={draft.date} onChange={(event) => change("date", event.target.value)} className={inputClass} /></label>
              <label className="text-sm">Rotina<select value={draft.routine} onChange={(event) => change("routine", event.target.value as DevotionalRoutine)} className={`${inputClass} mt-1 w-full rounded-md border px-3`}><option value="manha">Manhã</option><option value="noite">Noite</option></select></label>
              <label className="text-sm sm:col-span-2">Título<Input value={draft.title} onChange={(event) => change("title", event.target.value)} maxLength={120} className={inputClass} /></label>
              <label className="text-sm">Livro (código de 3 letras)<Input value={draft.book} onChange={(event) => change("book", event.target.value.toLowerCase())} maxLength={3} className={inputClass} /></label>
              <label className="text-sm">Capítulo<Input type="number" min={1} value={draft.chapter} onChange={(event) => setNumber("chapter", event.target.value)} className={inputClass} /></label>
              <label className="text-sm">Versículo inicial<Input type="number" min={1} value={draft.verse} onChange={(event) => setNumber("verse", event.target.value)} className={inputClass} /></label>
              <label className="text-sm">Versículo final (opcional)<Input type="number" min={draft.verse} value={draft.endVerse ?? ""} onChange={(event) => setNumber("endVerse", event.target.value)} className={inputClass} /></label>
              <label className="text-sm sm:col-span-2">Reflexão<Textarea rows={5} value={draft.reflection} onChange={(event) => change("reflection", event.target.value)} className="mt-1 border-[#d7d0c3] bg-[#fbfaf6]" /></label>
              <label className="text-sm">Strong<Input value={draft.strongNumber} onChange={(event) => change("strongNumber", event.target.value.toUpperCase())} className={inputClass} /></label>
              <label className="text-sm sm:col-span-2">Ação prática<Textarea rows={3} value={draft.action} onChange={(event) => change("action", event.target.value)} className="mt-1 border-[#d7d0c3] bg-[#fbfaf6]" /></label>
              <label className="text-sm sm:col-span-2">Oração<Textarea rows={3} value={draft.prayer} onChange={(event) => change("prayer", event.target.value)} className="mt-1 border-[#d7d0c3] bg-[#fbfaf6]" /></label>
              <label className="text-sm sm:col-span-2">Pergunta<Textarea rows={2} value={draft.question} onChange={(event) => change("question", event.target.value)} className="mt-1 border-[#d7d0c3] bg-[#fbfaf6]" /></label>
            </div>
            <div className="mt-5 flex flex-wrap gap-2 border-t pt-4">
              <Button onClick={() => void save("rascunho")} disabled={update.isPending} variant="outline" className="min-h-11"><Save className="mr-2 h-4 w-4" />Salvar rascunho</Button>
              <Button onClick={() => void save("aprovado")} disabled={update.isPending} className="min-h-11 bg-[#70562e] text-white hover:bg-[#594323]"><Check className="mr-2 h-4 w-4" />Salvar e aprovar</Button>
            </div>
          </>}
        </div>
      </div>
    </section>
  );
}