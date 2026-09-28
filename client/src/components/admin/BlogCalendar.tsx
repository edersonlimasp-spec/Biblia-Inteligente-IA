import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CalendarKeyword {
  id: string | number;
  keyword: string;
  status: string;
  schedule_date?: string | null;
}

const today = () => new Intl.DateTimeFormat("sv-SE", {
  timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit",
}).format(new Date());
const dateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export function BlogCalendar({ keywords, busy, onSchedule }: {
  keywords: CalendarKeyword[];
  busy: boolean;
  onSchedule: (id: string | number, date: string) => void;
}) {
  const [month, setMonth] = useState(() => {
    const current = new Date(`${today()}T12:00:00`);
    return new Date(current.getFullYear(), current.getMonth(), 1);
  });
  const [selected, setSelected] = useState(today);
  const queued = keywords.filter((item) => item.status === "queued");
  const offset = (month.getDay() + 6) % 7;
  const days = Array.from({ length: offset + new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate() },
    (_value, index) => index < offset ? null : dateKey(new Date(month.getFullYear(), month.getMonth(), index - offset + 1)));
  const chosen = queued.filter((item) => item.schedule_date === selected);
  const unscheduled = queued.filter((item) => !item.schedule_date);

  return (
    <section className="space-y-5">
      <div><h3 className="text-lg font-semibold">Calendário editorial</h3>
        <p className="text-sm text-muted-foreground">Agende ou reagende pautas da fila. O agendador usa a data de São Paulo e só processa pautas cuja data já chegou.</p></div>
      <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <Button size="icon" variant="outline" aria-label="Mês anterior" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft className="h-4 w-4" /></Button>
          <h4 className="text-lg font-semibold capitalize">{new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(month)}</h4>
          <Button size="icon" variant="outline" aria-label="Próximo mês" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight className="h-4 w-4" /></Button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
          {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((day) => <div key={day} className="pb-2">{day}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">{days.map((date, index) => date ? (
          <button key={date} type="button" onClick={() => setSelected(date)} aria-label={`${date}: ${queued.filter((item) => item.schedule_date === date).length} pautas`}
            className={`min-h-16 rounded-md border p-1 text-left text-sm transition-colors sm:min-h-20 ${date === selected ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}>
            <span className="font-medium">{Number(date.slice(-2))}</span>
            {queued.some((item) => item.schedule_date === date) && <span className="mt-1 block rounded bg-primary/15 px-1 text-[10px] text-primary">{queued.filter((item) => item.schedule_date === date).length} pauta(s)</span>}
          </button>
        ) : <div key={`blank-${index}`} />)}</div>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {([
          { title: `Agendadas para ${selected}`, items: chosen },
          { title: "Na fila, sem data", items: unscheduled },
        ]).map(({ title, items }) => (
          <div key={title} className="rounded-xl border border-border bg-card p-5">
            <h4 className="mb-3 font-semibold">{title}</h4>
            {!items.length && <p className="text-sm text-muted-foreground">Nenhuma pauta nesta lista.</p>}
            {items.map((item) => <div key={item.id} className="flex flex-col gap-2 border-t border-border py-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm font-medium">{item.keyword}</span>
              <div className="flex items-center gap-2">
                <label className="sr-only" htmlFor={`date-${item.id}`}>Agendar {item.keyword}</label>
                <Input id={`date-${item.id}`} type="date" className="w-40" value={item.schedule_date || ""} disabled={busy}
                  onChange={(event) => onSchedule(item.id, event.target.value)} />
                {item.schedule_date && <Button size="sm" variant="ghost" disabled={busy} onClick={() => onSchedule(item.id, "")}>Limpar</Button>}
              </div>
            </div>)}
          </div>
        ))}
      </div>
    </section>
  );
}