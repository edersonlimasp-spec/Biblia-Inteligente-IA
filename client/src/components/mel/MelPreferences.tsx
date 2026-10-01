import { useEffect, useState, type FormEvent } from "react";
import { Bell, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { useMelVisibility } from "@/hooks/useMelVisibility";
import {
  useMelPreferences,
  type MelDailyGoalMinutes,
  type MelPreferences as MelPreferencesValue,
  type MelReminderPeriod,
} from "@/hooks/useMel";

const defaultPreferences: MelPreferencesValue = {
  reminderPeriod: "morning",
  reminderTime: null,
  dailyGoalMinutes: 10,
};

export function MelPreferences() {
  const { user } = useAuth();
  const { preferences, isLoading, error, savePreferences, isSaving } = useMelPreferences();
  const { enabled, setEnabled } = useMelVisibility();
  const [draft, setDraft] = useState<MelPreferencesValue>(defaultPreferences);
  const [message, setMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (preferences) setDraft(preferences);
  }, [preferences]);

  const updateDraft = <K extends keyof MelPreferencesValue>(key: K, value: MelPreferencesValue[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setMessage(null);
    setSaveError(null);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setSaveError(null);
    try {
      await savePreferences({
        ...draft,
        reminderTime: draft.reminderPeriod === "exact" ? draft.reminderTime : null,
      });
      setMessage("Preferências da Mel salvas.");
    } catch (saveException) {
      const details = (saveException as { data?: { error?: string } })?.data?.error;
      setSaveError(details || (saveException instanceof Error ? saveException.message : "Não foi possível salvar. Tente novamente."));
    }
  };

  if (!user) return null;

  return (
    <Card data-testid="mel-preferences">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" aria-hidden="true" />
          Lembretes da Mel
        </CardTitle>
        <CardDescription>
          Escolha um horário e uma meta diária para sua rotina. Os lembretes ficam salvos na sua conta; notificações push ainda não estão ativadas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-5 flex items-center justify-between gap-4 rounded-lg border p-3">
          <div className="space-y-1">
            <Label htmlFor="mel-show-on-screen">Mostrar a Mel na tela</Label>
            <p className="text-xs text-muted-foreground">
              Esta opção fica salva somente neste dispositivo e não altera seus lembretes.
            </p>
          </div>
          <Switch
            id="mel-show-on-screen"
            checked={enabled}
            onCheckedChange={setEnabled}
            aria-label="Mostrar a Mel na tela"
            data-testid="switch-mel-visibility"
          />
        </div>
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Carregando preferências...
          </div>
        ) : error ? (
          <p className="text-sm text-destructive" role="alert">
            Não foi possível carregar as preferências da Mel. Tente novamente mais tarde.
          </p>
        ) : (
          <form className="space-y-5" onSubmit={submit}>
            <div className="space-y-2">
              <Label htmlFor="mel-reminder-period">Quando prefere receber o lembrete?</Label>
              <select
                id="mel-reminder-period"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={draft.reminderPeriod}
                onChange={(event) => {
                  const reminderPeriod = event.target.value as MelReminderPeriod;
                  updateDraft("reminderPeriod", reminderPeriod);
                  if (reminderPeriod === "exact" && !draft.reminderTime) {
                    setDraft((current) => ({ ...current, reminderTime: "08:00" }));
                  }
                }}
                data-testid="select-mel-reminder-period"
              >
                <option value="morning">Manhã</option>
                <option value="afternoon">Tarde</option>
                <option value="evening">Noite</option>
                <option value="exact">Horário exato</option>
              </select>
            </div>
            {draft.reminderPeriod === "exact" && (
              <div className="space-y-2">
                <Label htmlFor="mel-reminder-time">Horário</Label>
                <input
                  id="mel-reminder-time"
                  type="time"
                  required
                  value={draft.reminderTime ?? ""}
                  onChange={(event) => updateDraft("reminderTime", event.target.value || null)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  data-testid="input-mel-reminder-time"
                />
              </div>
            )}
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Meta diária de leitura</legend>
              <div className="grid grid-cols-3 gap-2">
                {([5, 10, 15] as MelDailyGoalMinutes[]).map((minutes) => (
                  <Button
                    key={minutes}
                    type="button"
                    variant={draft.dailyGoalMinutes === minutes ? "default" : "outline"}
                    aria-pressed={draft.dailyGoalMinutes === minutes}
                    onClick={() => updateDraft("dailyGoalMinutes", minutes)}
                    data-testid={`button-mel-goal-${minutes}`}
                  >
                    {minutes} min
                  </Button>
                ))}
              </div>
            </fieldset>
            <Button type="submit" disabled={isSaving} data-testid="button-save-mel-preferences">
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
              {isSaving ? "Salvando..." : "Salvar preferências"}
            </Button>
            {message && <p className="text-sm text-green-700 dark:text-green-400" role="status" aria-live="polite">{message}</p>}
            {saveError && <p className="text-sm text-destructive" role="alert" data-testid="mel-preferences-error">{saveError}</p>}
          </form>
        )}
      </CardContent>
    </Card>
  );
}