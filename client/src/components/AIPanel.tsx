import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, ChevronUp, ChevronDown, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export function AIPanel() {
  const [question, setQuestion] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [response, setResponse] = useState<string | null>(null);

  const handleAsk = () => {
    if (!question.trim()) return;
    console.log("AI question:", question);
    // Simulate AI response
    setResponse(`Esta é uma resposta simulada da IA Professor Teológico para: "${question}". 

No contexto bíblico, este versículo possui profunda significância teológica. A palavra hebraica original revela nuances que não aparecem em traduções modernas.

Análise Contextual:
• Contexto histórico do período
• Significado cultural da época
• Implicações teológicas

Esta passagem deve ser entendida dentro do contexto maior das escrituras...`);
    setIsExpanded(true);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t shadow-lg">
      {/* Expanded Response */}
      {isExpanded && response && (
        <div className="border-b bg-background">
          <div className="max-w-3xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="font-semibold text-primary">Professor Teológico</span>
                <Badge variant="secondary" className="text-xs">IA Premium</Badge>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsExpanded(false);
                  setResponse(null);
                }}
                data-testid="button-close-ai-response"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <ScrollArea className="h-64">
              <div className="prose prose-sm dark:prose-invert max-w-none pr-4">
                <p className="text-sm leading-relaxed whitespace-pre-line">
                  {response}
                </p>
              </div>
            </ScrollArea>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="max-w-3xl mx-auto px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex gap-2">
            <Input
              placeholder="Pergunte ao Professor Teológico..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAsk();
              }}
              className="flex-1"
              data-testid="input-ai-question"
            />
            <Button
              onClick={handleAsk}
              disabled={!question.trim()}
              data-testid="button-ask-ai"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Perguntar
            </Button>
          </div>
          {response && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              data-testid="button-toggle-ai-panel"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
