import { useEffect, useRef, useState, type FormEvent } from "react";
import type { AtlasContextRequest } from "@shared/atlas";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest, ApiError } from "@/lib/queryClient";

export function AtlasAssistant({ context, onLogin, onSubscribe, suggestions = [] }: {
  context: AtlasContextRequest; onLogin: () => void; onSubscribe: () => void; suggestions?: string[];
}) {
  const { user } = useAuth();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [asking, setAsking] = useState(false);
  const generation = useRef(0);
  useEffect(() => {
    generation.current++;
    setAnswer("");
    setAsking(false);
    return () => { generation.current++; };
  }, [context.itemId, context.version, context.mode, context.selectedPlaceId, user?.id]);
  async function ask(event: FormEvent) {
    event.preventDefault();
    if (!question.trim() || asking) return;
    if (!user) { onLogin(); return; }
    const request = ++generation.current;
    setAsking(true);
    setAnswer("");
    try {
      const response = await apiRequest("POST", "/api/ai/ask", {
        question: question.trim(), mode: "essential", language: "pt", atlasContext: context,
      });
      const data = await response.json() as { response: string };
      if (request === generation.current) setAnswer(data.response);
    } catch (error) {
      if (request !== generation.current) return;
      const status = error instanceof ApiError ? error.status : undefined;
      if (status === 401) { setAnswer("Sua sessão expirou. Entre novamente."); onLogin(); }
      else if (status === 403) { setAnswer("Sua assinatura não permite esta consulta."); onSubscribe(); }
      else if (status === 429) setAnswer("Limite de consultas atingido. Aguarde a renovação da sua cota antes de tentar novamente.");
      else setAnswer("Não foi possível consultar o assistente agora. Tente novamente.");
    } finally {
      if (request === generation.current) setAsking(false);
    }
  }
  return (
    <section className="atlas-assistant">
      <strong>Pergunte ao assistente sobre esta ficha</strong>
      <p>Peça contexto, compare hipóteses ou esclareça referências. O assistente responde em texto; não gera imagens.</p>
      {suggestions.length > 0 && <div className="atlas-assistant-suggestions" aria-label="Perguntas sugeridas">
        {suggestions.slice(0, 3).map(suggestion => <button type="button" key={suggestion} onClick={() => setQuestion(suggestion)}>{suggestion}</button>)}
      </div>}
      <form onSubmit={ask}>
        <input value={question} onChange={event => setQuestion(event.target.value)} placeholder="Por que esta localização é debatida?" aria-label="Pergunta ao assistente" maxLength={4000} />
        <button className="atlas-button" disabled={asking || !question.trim()}>{asking ? "Consultando…" : "Perguntar"}</button>
      </form>
      <div className="atlas-answer" aria-live="polite">{answer}</div>
    </section>
  );
}