import { Calendar, MessageSquare, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface AIHistoryScreenProps {
  onBack?: () => void;
}

export function AIHistoryScreen({ onBack }: AIHistoryScreenProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Mock history data
  const history = [
    {
      id: 1,
      date: "18 Nov 2025",
      verse: "Gênesis 1:1",
      question: "Qual o significado de 'No princípio' em hebraico?",
      response: "A palavra hebraica 'בְּרֵאשִׁית' (bereshit) significa literalmente 'no princípio'. É uma palavra composta que indica o início absoluto de todas as coisas...",
    },
    {
      id: 2,
      date: "17 Nov 2025",
      verse: "João 3:16",
      question: "Como interpretar 'mundo' neste contexto?",
      response: "A palavra grega 'κόσμος' (kosmos) possui múltiplos significados. Neste contexto específico, refere-se à humanidade como um todo...",
    },
    {
      id: 3,
      date: "17 Nov 2025",
      verse: "Salmos 23:1",
      question: "Qual o contexto histórico deste salmo?",
      response: "O Salmo 23 foi escrito por Davi, provavelmente durante seu tempo como pastor antes de se tornar rei...",
    },
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">
            Histórico de IA
          </h1>
          <p className="text-muted-foreground">
            Suas conversas anteriores com o Professor
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar no histórico..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-history"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            {history.length} conversas
          </p>
          <Button variant="outline" size="sm" data-testid="button-clear-history">
            Limpar Histórico
          </Button>
        </div>

        {/* History List */}
        <div className="space-y-3">
          {history.map((item) => (
            <Collapsible key={item.id}>
              <Card className="hover-elevate">
                <CollapsibleTrigger className="w-full" data-testid={`history-item-${item.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <MessageSquare className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {item.verse}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {item.date}
                          </span>
                        </div>
                        <p className="font-medium text-sm">{item.question}</p>
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 pb-4 px-4">
                    <div className="ml-11 pl-4 border-l-2 border-primary/20">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {item.response}
                      </p>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>
      </div>
    </div>
  );
}
