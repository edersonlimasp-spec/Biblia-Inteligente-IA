import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, ChevronUp, ChevronDown, X, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AIRequest {
  question: string;
  verse?: string;
  book?: string;
  chapter?: number;
  mode: 'essential' | 'premium';
}

interface AIResponse {
  response: string;
}

export function AIPanel() {
  const [question, setQuestion] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const { toast } = useToast();

  const askAIMutation = useMutation({
    mutationFn: async (request: AIRequest) => {
      const res = await apiRequest('POST', '/api/ai/ask', request);
      const data = await res.json() as AIResponse;
      return data;
    },
    onSuccess: (data) => {
      setResponse(data.response);
      setIsExpanded(true);
      // Clear input after successful response
      setQuestion("");
    },
    onError: (error: any) => {
      const errorMessage = error?.data?.error || error?.message || "Erro ao processar pergunta";
      const needsSubscription = error?.status === 403;
      
      toast({
        title: needsSubscription ? "Assinatura Necessária" : "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleAsk = () => {
    if (!question.trim()) return;
    
    // For now, use 'essential' mode by default
    // TODO: Get user's actual subscription level
    askAIMutation.mutate({
      question: question.trim(),
      mode: 'essential',
    });
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
              disabled={!question.trim() || askAIMutation.isPending}
              data-testid="button-ask-ai"
            >
              {askAIMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              {askAIMutation.isPending ? 'Pensando...' : 'Perguntar'}
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
