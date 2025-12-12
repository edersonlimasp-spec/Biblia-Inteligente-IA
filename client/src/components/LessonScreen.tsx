import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Check, BookOpen, MessageCircle, Send, Clock, ChevronDown, ChevronUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { getDeviceId } from "@/hooks/use-device-id";

interface LessonScreenProps {
  lessonId: string;
  trackLevel: string;
  onBack: () => void;
}

interface Lesson {
  id: string;
  title: string;
  content: string;
  references: string;
  questions: string;
  application: string;
  summary: string;
  estimatedMinutes: number;
  order: number;
}

interface LessonData {
  lesson: Lesson;
  completed: boolean;
}

export function LessonScreen({ lessonId, trackLevel, onBack }: LessonScreenProps) {
  const { user } = useAuth();
  const deviceId = getDeviceId();
  const { toast } = useToast();
  
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    references: true,
    questions: true,
    application: true,
    summary: true,
  });
  
  const [showAskProfessor, setShowAskProfessor] = useState(false);
  const [question, setQuestion] = useState("");
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAskingProfessor, setIsAskingProfessor] = useState(false);

  const { data: lessonData, isLoading } = useQuery<LessonData>({
    queryKey: ['/api/study/lessons', lessonId],
  });

  const markCompletedMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/study/progress', { 
        lessonId, 
        completed: true 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/study/lessons', lessonId] });
      queryClient.invalidateQueries({ queryKey: ['/api/study/modules'] });
      toast({
        title: "Lição concluída!",
        description: "Seu progresso foi salvo.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível salvar o progresso.",
        variant: "destructive",
      });
    },
  });

  const handleAskProfessor = async () => {
    if (!question.trim()) return;
    
    setIsAskingProfessor(true);
    try {
      const endpoint = user ? '/api/ai/ask' : '/api/guest/ai/ask';
      const body = user 
        ? { question: `Sobre a lição "${lessonData?.lesson.title}": ${question}`, mode: 'professor' }
        : { question: `Sobre a lição "${lessonData?.lesson.title}": ${question}`, mode: 'professor', deviceId };
      
      const response = await apiRequest('POST', endpoint, body);
      const data = await response.json();
      
      setAiResponse(data.answer || data.response);
    } catch (error: any) {
      toast({
        title: "Erro ao perguntar",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsAskingProfessor(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Skeleton className="h-6 w-48" />
          </div>
        </header>
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    );
  }

  const lesson = lessonData?.lesson;
  const isCompleted = lessonData?.completed;
  
  const referencesList = lesson?.references.split(',').map(r => r.trim()).filter(Boolean) || [];
  const questionsList = lesson?.questions.split('\n').filter(q => q.trim()) || [];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onBack}
            data-testid="button-back-lesson"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-serif font-bold truncate">{lesson?.title}</h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{lesson?.estimatedMinutes} min</span>
              {isCompleted && (
                <Badge variant="outline" className="ml-1 text-green-600 border-green-500/30">
                  <Check className="w-3 h-3 mr-1" />
                  Concluída
                </Badge>
              )}
            </div>
          </div>
          <Button 
            size="icon" 
            variant="ghost"
            onClick={() => setShowAskProfessor(true)}
            data-testid="button-ask-professor"
          >
            <MessageCircle className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <ScrollArea className="h-[calc(100vh-60px)]">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="prose prose-sm dark:prose-invert max-w-none mb-6"
          >
            <p className="text-base leading-relaxed">{lesson?.content}</p>
          </motion.div>

          <Section
            title="Referências Bíblicas"
            icon={<BookOpen className="w-4 h-4" />}
            expanded={expandedSections.references}
            onToggle={() => toggleSection('references')}
          >
            <div className="flex flex-wrap gap-2">
              {referencesList.map((ref, i) => (
                <Badge key={i} variant="outline" className="text-sm">
                  {ref}
                </Badge>
              ))}
            </div>
          </Section>

          <Section
            title="Perguntas para Reflexão"
            icon={<MessageCircle className="w-4 h-4" />}
            expanded={expandedSections.questions}
            onToggle={() => toggleSection('questions')}
          >
            <ul className="space-y-2">
              {questionsList.map((q, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="text-primary font-medium">{i + 1}.</span>
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section
            title="Aplicação Prática"
            icon={<Check className="w-4 h-4" />}
            expanded={expandedSections.application}
            onToggle={() => toggleSection('application')}
          >
            <p className="text-sm bg-muted/50 p-3 rounded-lg">{lesson?.application}</p>
          </Section>

          <Section
            title="Resumo"
            icon={<BookOpen className="w-4 h-4" />}
            expanded={expandedSections.summary}
            onToggle={() => toggleSection('summary')}
          >
            <p className="text-sm italic text-muted-foreground">{lesson?.summary}</p>
          </Section>

          {!isCompleted && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8"
            >
              <Button 
                className="w-full" 
                size="lg"
                onClick={() => markCompletedMutation.mutate()}
                disabled={markCompletedMutation.isPending}
                data-testid="button-mark-completed"
              >
                <Check className="w-5 h-5 mr-2" />
                {markCompletedMutation.isPending ? "Salvando..." : "Marcar como Concluída"}
              </Button>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      {showAskProfessor && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute inset-x-0 bottom-0 bg-background border-t rounded-t-2xl max-h-[80vh] overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Perguntar ao Professor</h3>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => {
                  setShowAskProfessor(false);
                  setQuestion("");
                  setAiResponse(null);
                }}
                data-testid="button-close-ask-professor"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <ScrollArea className="flex-1 p-4">
              {aiResponse && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-muted/50 rounded-lg p-4 mb-4"
                >
                  <p className="text-sm font-medium mb-2">Resposta do Professor:</p>
                  <p className="text-sm whitespace-pre-wrap">{aiResponse}</p>
                </motion.div>
              )}
            </ScrollArea>
            
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Textarea
                  placeholder={`Pergunte sobre "${lesson?.title}"...`}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="min-h-[60px] resize-none"
                  data-testid="input-professor-question"
                />
                <Button 
                  size="icon"
                  onClick={handleAskProfessor}
                  disabled={!question.trim() || isAskingProfessor}
                  data-testid="button-send-question"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function Section({ 
  title, 
  icon, 
  expanded, 
  onToggle, 
  children 
}: { 
  title: string; 
  icon: React.ReactNode; 
  expanded: boolean; 
  onToggle: () => void; 
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4"
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 bg-card border rounded-lg hover-elevate"
        data-testid={`section-toggle-${title.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium text-sm">{title}</span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="p-3 border-x border-b rounded-b-lg"
        >
          {children}
        </motion.div>
      )}
    </motion.div>
  );
}
