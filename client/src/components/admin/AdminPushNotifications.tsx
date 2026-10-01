import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { MelPosition } from "@shared/mel";
import { pushDestinationSchema, pushTrackLevels } from "@shared/push";
import { apiRequest } from "@/lib/queryClient";
import { bibleBookNames } from "@/lib/bible-book-names";
import { getMelDate } from "@/lib/mel-date";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type PushStats = { android: number; ios: number; total: number; configured: boolean };
type SendResult = { sent?: number; failed?: number; skipped?: boolean; message?: string };
type Audience = "all" | "free" | "paid";
type Campaign = { title: string; body: string; destination: MelPosition; audience: Audience; confirmed: true };
const audiences: Record<Audience, string> = {
  all: "Todos os usuários com push ativo",
  free: "Somente usuários gratuitos",
  paid: "Somente usuários com acesso pago ativo",
};
const selectClass = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

function describeResult(result: SendResult) {
  if (result.skipped) return result.message ?? "Push indisponível. Nenhuma notificação foi enviada.";
  return `${result.sent ?? 0} dispositivo(s) notificado(s). ${result.failed ?? 0} falha(s).`;
}

/** Additive admin surface. No existing campaign/payment behavior is reused or changed. */
export function AdminPushNotifications() {
  const [title, setTitle] = useState("Um recado da Mel");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<Audience>("all");
  const [kind, setKind] = useState<MelPosition["kind"]>("bible");
  const [book, setBook] = useState("psa");
  const [chapter, setChapter] = useState("23");
  const [verse, setVerse] = useState("1");
  const [devotionalDate, setDevotionalDate] = useState(getMelDate);
  const [lessonId, setLessonId] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [trackLevel, setTrackLevel] = useState("iniciante");
  const [confirmation, setConfirmation] = useState<Campaign | null>(null);
  const [feedback, setFeedback] = useState("");
  const stats = useQuery<PushStats>({
    queryKey: ["/api/admin/push/stats"],
    queryFn: async () => (await apiRequest("GET", "/api/admin/push/stats")).json(),
    retry: false,
  });
  const test = useMutation({
    mutationFn: async () => (await apiRequest("POST", "/api/admin/push/test", {})).json() as Promise<SendResult>,
    onSuccess: (result) => { setFeedback(describeResult(result)); void stats.refetch(); },
    onError: () => setFeedback("Não foi possível enviar o teste. As demais funções do painel continuam disponíveis."),
  });
  const campaign = useMutation({
    mutationFn: async (input: Campaign) =>
      (await apiRequest("POST", "/api/admin/push/campaign", input)).json() as Promise<SendResult>,
    onSuccess: (result) => { setFeedback(describeResult(result)); setConfirmation(null); void stats.refetch(); },
    onError: () => { setFeedback("Não foi possível confirmar o envio. Confira o resultado antes de tentar novamente."); setConfirmation(null); },
  });
  const busy = test.isPending || campaign.isPending;
  const ready = stats.data?.configured === true;

  function reviewCampaign(event: React.FormEvent) {
    event.preventDefault();
    if (!ready || busy) return;
    let destination: MelPosition;
    if (kind === "bible") {
      const chapterNumber = Number(chapter);
      const verseNumber = Number(verse);
      if (!bibleBookNames[book] || !Number.isInteger(chapterNumber) || chapterNumber < 1
        || chapterNumber > 150 || !Number.isInteger(verseNumber) || verseNumber < 1 || verseNumber > 176) {
        setFeedback("Informe um livro, capítulo e versículo válidos.");
        return;
      }
      destination = { kind: "bible", book, chapter: chapterNumber, verse: verseNumber, versionCode: "ACF" };
    } else if (kind === "devotional") {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(devotionalDate)
        || Number.isNaN(Date.parse(`${devotionalDate}T00:00:00Z`))) {
        setFeedback("Informe uma data válida para o devocional.");
        return;
      }
      destination = { kind: "devotional", devotionalDate };
    } else {
      if (!lessonId.trim() || !moduleId.trim() || !trackLevel.trim()) {
        setFeedback("Informe a aula, o módulo e a trilha de destino.");
        return;
      }
      destination = { kind: "lesson", lessonId: lessonId.trim(), moduleId: moduleId.trim(), trackLevel: trackLevel.trim() };
    }
    if (!pushDestinationSchema.safeParse(destination).success) {
      setFeedback("Confira os dados do destino antes de enviar.");
      return;
    }
    if (!title.trim() || !body.trim()) return;
    setFeedback("");
    setConfirmation({ title: title.trim(), body: body.trim(), audience, destination, confirmed: true });
  }

  return (
    <div className="space-y-6" data-testid="admin-push">
      <Card>
        <CardHeader>
          <CardTitle>Notificações push</CardTitle>
          <CardDescription>Recados para os aparelhos Android e iPhone que autorizaram notificações. Navegadores não recebem push.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {stats.isLoading ? <p role="status">Carregando dispositivos…</p> : stats.isError
            ? <p role="status" className="text-sm text-muted-foreground">Não foi possível consultar os dispositivos agora.</p>
            : <dl className="grid grid-cols-3 gap-3">
                {([["Android", stats.data?.android], ["iPhone", stats.data?.ios], ["Total", stats.data?.total]] as const).map(([label, count]) => (
                  <div key={label} className="rounded-lg border p-3">
                    <dt className="text-sm text-muted-foreground">{label}</dt>
                    <dd className="text-2xl font-semibold">{count ?? 0}</dd>
                  </div>
                ))}
              </dl>}
          {!stats.isLoading && !ready && (
            <p className="text-sm text-muted-foreground">Push ainda indisponível. Configure o Firebase e aplique a migração para habilitar os envios, sem afetar o restante do app.</p>
          )}
          <p className="text-sm text-muted-foreground">O teste vai somente aos aparelhos cadastrados na sua própria conta de administrador.</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" disabled={!ready || busy} onClick={() => { setFeedback(""); test.mutate(); }} data-testid="push-test">
              {test.isPending ? "Enviando…" : "Enviar teste para mim"}
            </Button>
            <Button variant="ghost" disabled={stats.isFetching || busy} onClick={() => void stats.refetch()}>Atualizar contagem</Button>
          </div>
          {feedback && <p role="status" aria-live="polite" className="text-sm">{feedback}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Enviar campanha</CardTitle><CardDescription>A mensagem só será enviada após sua confirmação.</CardDescription></CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={reviewCampaign}>
            <div className="space-y-2"><Label htmlFor="push-title">Título</Label><Input id="push-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={100} required /></div>
            <div className="space-y-2"><Label htmlFor="push-body">Texto</Label><Textarea id="push-body" value={body} onChange={(event) => setBody(event.target.value)} maxLength={500} required placeholder="Mensagem curta e carinhosa, com a Mel como companhia." /></div>
            <div className="space-y-2"><Label htmlFor="push-audience">Público</Label><select id="push-audience" className={selectClass} value={audience} onChange={(event) => setAudience(event.target.value as Audience)}>{Object.entries(audiences).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></div>
            <div className="space-y-2"><Label htmlFor="push-kind">Abrir ao tocar</Label><select id="push-kind" className={selectClass} value={kind} onChange={(event) => setKind(event.target.value as MelPosition["kind"])}><option value="bible">Texto na Bíblia</option><option value="devotional">Devocional</option><option value="lesson">Aula do curso</option></select></div>
            {kind === "bible" && <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-2"><Label htmlFor="push-book">Livro</Label><select id="push-book" className={selectClass} value={book} onChange={(event) => setBook(event.target.value)}>{Object.entries(bibleBookNames).map(([id, names]) => <option key={id} value={id}>{names.pt}</option>)}</select></div>
              <div className="space-y-2"><Label htmlFor="push-chapter">Capítulo</Label><Input id="push-chapter" type="number" min={1} max={150} value={chapter} onChange={(event) => setChapter(event.target.value)} required /></div>
              <div className="space-y-2"><Label htmlFor="push-verse">Versículo</Label><Input id="push-verse" type="number" min={1} max={176} value={verse} onChange={(event) => setVerse(event.target.value)} required /></div>
            </div>}
            {kind === "devotional" && <div className="space-y-2"><Label htmlFor="push-date">Data do devocional</Label><Input id="push-date" type="date" value={devotionalDate} onChange={(event) => setDevotionalDate(event.target.value)} required /></div>}
            {kind === "lesson" && <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-2"><Label htmlFor="push-lesson">Identificador da aula</Label><Input id="push-lesson" value={lessonId} onChange={(event) => setLessonId(event.target.value)} required /></div>
              <div className="space-y-2"><Label htmlFor="push-module">Identificador do módulo</Label><Input id="push-module" value={moduleId} onChange={(event) => setModuleId(event.target.value)} required /></div>
              <div className="space-y-2"><Label htmlFor="push-track">Trilha</Label><select id="push-track" className={selectClass} value={trackLevel} onChange={(event) => setTrackLevel(event.target.value)}>{pushTrackLevels.map((level) => <option key={level} value={level}>{level === "iniciante" ? "Iniciante" : level === "moderado" ? "Moderado" : "Avançado"}</option>)}</select></div>
            </div>}
            <Button type="submit" disabled={!ready || busy} data-testid="push-review-campaign">Revisar envio</Button>
          </form>
        </CardContent>
      </Card>
      <AlertDialog open={!!confirmation} onOpenChange={(open) => { if (!open && !campaign.isPending) setConfirmation(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Confirmar campanha push?</AlertDialogTitle><AlertDialogDescription>
            Público: {confirmation ? audiences[confirmation.audience] : ""}. O envio não pode ser desfeito.
          </AlertDialogDescription></AlertDialogHeader>
          <div className="space-y-2 break-words"><p className="font-semibold">{confirmation?.title}</p><p className="text-sm">{confirmation?.body}</p></div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={campaign.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={campaign.isPending} onClick={(event) => {
              event.preventDefault();
              if (confirmation && !campaign.isPending) campaign.mutate(confirmation);
            }} data-testid="push-confirm-campaign">{campaign.isPending ? "Enviando…" : "Confirmar e enviar"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}