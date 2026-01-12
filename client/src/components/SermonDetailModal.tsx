import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { jsPDF } from "jspdf";
import {
  Play,
  Pause,
  Mic,
  FileText,
  Sparkles,
  StickyNote,
  Save,
  FileDown,
  Share2,
  Loader2,
  Copy,
  Check,
  Tag,
  User,
} from "lucide-react";
import type { RecordingMetadata } from "@/hooks/use-recordings";

interface SermonData {
  id: string;
  title: string;
  category: string;
  speaker?: string;
  tags?: string[];
  transcriptText?: string;
  transcriptStatus: string;
  summaryJson?: any;
  summaryText?: string;
  notesText?: string;
  createdAt: string;
}

interface SermonDetailModalProps {
  recording: RecordingMetadata;
  isOpen: boolean;
  onClose: () => void;
  getRecordingBlob: (id: string) => Promise<Blob | null>;
}

export function SermonDetailModal({
  recording,
  isOpen,
  onClose,
  getRecordingBlob,
}: SermonDetailModalProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [sermonData, setSermonData] = useState<SermonData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  const [editTitle, setEditTitle] = useState(recording.title);
  const [editCategory, setEditCategory] = useState("culto");
  const [editSpeaker, setEditSpeaker] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editTranscript, setEditTranscript] = useState("");
  const [editSummary, setEditSummary] = useState("");
  const [editNotes, setEditNotes] = useState("");

  useEffect(() => {
    if (isOpen && recording) {
      loadSermonData();
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [isOpen, recording]);

  const loadSermonData = async () => {
    try {
      const res = await fetch(`/api/sermons/${recording.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      
      if (res.ok) {
        const data = await res.json();
        setSermonData(data);
        setEditTitle(data.title || recording.title);
        setEditCategory(data.category || "culto");
        setEditSpeaker(data.speaker || "");
        setEditTags(data.tags?.join(", ") || "");
        setEditTranscript(data.transcriptText || "");
        setEditSummary(data.summaryText || "");
        setEditNotes(data.notesText || "");
      } else if (res.status === 404) {
        await syncRecording();
      }
    } catch (error) {
      console.error("Error loading sermon:", error);
    }
  };

  const syncRecording = async () => {
    try {
      const res = await apiRequest("POST", "/api/sermons", {
        id: recording.id,
        title: recording.title,
        duration: recording.duration,
        category: "culto",
      });
      
      if (res.ok) {
        const data = await res.json();
        setSermonData(data);
        setEditTitle(data.title);
        setEditCategory(data.category);
      }
    } catch (error) {
      console.error("Error syncing recording:", error);
    }
  };

  const handlePlayPause = async () => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    try {
      const blob = await getRecordingBlob(recording.id);
      if (!blob) {
        toast({
          title: "Erro",
          description: "Áudio não encontrado",
          variant: "destructive",
        });
        return;
      }

      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(url);
      };
      
      await audio.play();
      audioRef.current = audio;
      setIsPlaying(true);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao reproduzir áudio",
        variant: "destructive",
      });
    }
  };

  const handleTranscribe = async () => {
    if (sermonData?.transcriptText && !confirm("Já existe uma transcrição. Deseja substituí-la?")) {
      return;
    }

    setIsTranscribing(true);
    try {
      const blob = await getRecordingBlob(recording.id);
      if (!blob) {
        throw new Error("Áudio não encontrado");
      }

      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(",")[1];
          resolve(base64);
        };
      });
      reader.readAsDataURL(blob);
      const audioBase64 = await base64Promise;

      const res = await apiRequest("POST", `/api/sermons/${recording.id}/transcribe`, {
        audioBase64,
        mimeType: blob.type,
      });

      if (!res.ok) {
        throw new Error("Falha na transcrição");
      }

      const data = await res.json();
      setEditTranscript(data.transcriptText);
      setSermonData((prev) => prev ? { ...prev, transcriptText: data.transcriptText, transcriptStatus: "done" } : null);
      
      toast({
        title: "Transcrição concluída",
        description: "O áudio foi transcrito com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro na transcrição",
        description: "Não foi possível transcrever o áudio",
        variant: "destructive",
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleSummarize = async () => {
    if (!editTranscript) {
      toast({
        title: "Transcrição necessária",
        description: "Primeiro transcreva o áudio para gerar o resumo",
        variant: "destructive",
      });
      return;
    }

    if (sermonData?.summaryText && !confirm("Já existe um resumo. Deseja regenerá-lo?")) {
      return;
    }

    setIsSummarizing(true);
    try {
      const res = await apiRequest("POST", `/api/sermons/${recording.id}/summarize`, {});

      if (!res.ok) {
        throw new Error("Falha na geração do resumo");
      }

      const data = await res.json();
      setEditSummary(data.summaryText);
      setSermonData((prev) => prev ? { ...prev, summaryJson: data.summaryJson, summaryText: data.summaryText } : null);
      
      toast({
        title: "Resumo gerado",
        description: "O resumo foi gerado com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro ao gerar resumo",
        description: "Não foi possível gerar o resumo",
        variant: "destructive",
      });
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const tags = editTags.split(",").map((t) => t.trim()).filter(Boolean);
      
      const res = await apiRequest("PATCH", `/api/sermons/${recording.id}`, {
        title: editTitle,
        category: editCategory,
        speaker: editSpeaker,
        tags,
        transcriptText: editTranscript,
        summaryText: editSummary,
        notesText: editNotes,
      });

      if (!res.ok) {
        throw new Error("Falha ao salvar");
      }

      toast({
        title: "Salvo",
        description: "Alterações salvas com sucesso!",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/sermons"] });
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as alterações",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const margin = 20;
    let y = margin;
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxWidth = pageWidth - 2 * margin;

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    const titleLines = doc.splitTextToSize(editTitle, maxWidth);
    doc.text(titleLines, margin, y);
    y += titleLines.length * 8 + 5;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text(`Data: ${new Date(recording.createdAt).toLocaleDateString("pt-BR")}`, margin, y);
    y += 6;
    doc.text(`Categoria: ${editCategory}`, margin, y);
    y += 6;
    if (editSpeaker) {
      doc.text(`Orador: ${editSpeaker}`, margin, y);
      y += 6;
    }
    if (editTags) {
      doc.text(`Tags: ${editTags}`, margin, y);
      y += 6;
    }
    y += 10;

    doc.setTextColor(0);

    if (editSummary) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Resumo", margin, y);
      y += 8;

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      const summaryLines = doc.splitTextToSize(editSummary, maxWidth);
      for (const line of summaryLines) {
        if (y > 270) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += 6;
      }
      y += 10;
    }

    if (editNotes) {
      if (y > 250) {
        doc.addPage();
        y = margin;
      }
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Anotações", margin, y);
      y += 8;

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      const notesLines = doc.splitTextToSize(editNotes, maxWidth);
      for (const line of notesLines) {
        if (y > 270) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += 6;
      }
    }

    doc.save(`${editTitle.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`);
    
    toast({
      title: "PDF exportado",
      description: "O arquivo foi baixado com sucesso!",
    });
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const res = await apiRequest("POST", `/api/sermons/${recording.id}/share`, {});
      
      if (!res.ok) {
        throw new Error("Falha ao gerar link");
      }

      const data = await res.json();
      await navigator.clipboard.writeText(data.shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      toast({
        title: "Link copiado",
        description: "Link de compartilhamento copiado para a área de transferência!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível gerar o link de compartilhamento",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };

  const getStatus = () => {
    if (sermonData?.summaryText) return { label: "Com resumo", variant: "default" as const };
    if (sermonData?.transcriptText) return { label: "Transcrito", variant: "secondary" as const };
    return { label: "Sem transcrição", variant: "outline" as const };
  };

  const status = getStatus();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] max-w-3xl h-[90vh] max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 border-b shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg font-bold truncate">{editTitle}</DialogTitle>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant={status.variant}>{status.label}</Badge>
                <Badge variant="outline">{editCategory}</Badge>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                data-testid="button-export-pdf"
              >
                <FileDown className="h-4 w-4 mr-1" />
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                disabled={isSharing}
                data-testid="button-share-sermon"
              >
                {isSharing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Share2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="audio" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-4 shrink-0 px-4 pt-2">
            <TabsTrigger value="audio" className="text-xs sm:text-sm" data-testid="tab-audio">
              <Mic className="h-4 w-4 mr-1" />
              Áudio
            </TabsTrigger>
            <TabsTrigger value="transcript" className="text-xs sm:text-sm" data-testid="tab-transcript">
              <FileText className="h-4 w-4 mr-1" />
              Transcrição
            </TabsTrigger>
            <TabsTrigger value="summary" className="text-xs sm:text-sm" data-testid="tab-summary">
              <Sparkles className="h-4 w-4 mr-1" />
              Resumo IA
            </TabsTrigger>
            <TabsTrigger value="notes" className="text-xs sm:text-sm" data-testid="tab-notes">
              <StickyNote className="h-4 w-4 mr-1" />
              Notas
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto p-4">
            <TabsContent value="audio" className="mt-0 space-y-4">
              <div className="flex flex-col items-center gap-4 py-8">
                <Button
                  size="lg"
                  className="h-20 w-20 rounded-full"
                  onClick={handlePlayPause}
                  data-testid="button-play-audio"
                >
                  {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
                </Button>
                <p className="text-sm text-muted-foreground">
                  {isPlaying ? "Reproduzindo..." : "Clique para reproduzir"}
                </p>
              </div>

              <div className="space-y-4 border-t pt-4">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título</Label>
                    <Input
                      id="title"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      data-testid="input-title"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Categoria</Label>
                      <Select value={editCategory} onValueChange={setEditCategory}>
                        <SelectTrigger id="category" data-testid="select-category">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="culto">Culto</SelectItem>
                          <SelectItem value="reuniao">Reunião</SelectItem>
                          <SelectItem value="estudo">Estudo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="speaker">Orador</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="speaker"
                          value={editSpeaker}
                          onChange={(e) => setEditSpeaker(e.target.value)}
                          className="pl-9"
                          placeholder="Nome do orador"
                          data-testid="input-speaker"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="tags"
                        value={editTags}
                        onChange={(e) => setEditTags(e.target.value)}
                        className="pl-9"
                        placeholder="fé, esperança, amor"
                        data-testid="input-tags"
                      />
                    </div>
                  </div>
                </div>

                <Button onClick={handleSave} disabled={isSaving} className="w-full" data-testid="button-save-metadata">
                  {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Salvar Informações
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="transcript" className="mt-0 space-y-4">
              {!editTranscript && sermonData?.transcriptStatus !== "processing" && (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground mb-4">Nenhuma transcrição disponível</p>
                  <Button onClick={handleTranscribe} disabled={isTranscribing} data-testid="button-transcribe">
                    {isTranscribing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Transcrevendo...
                      </>
                    ) : (
                      <>
                        <Mic className="h-4 w-4 mr-2" />
                        Transcrever Áudio
                      </>
                    )}
                  </Button>
                </div>
              )}

              {(editTranscript || sermonData?.transcriptStatus === "processing") && (
                <div className="space-y-4">
                  {sermonData?.transcriptStatus === "processing" && !editTranscript && (
                    <div className="flex items-center justify-center gap-2 py-4">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Transcrevendo...</span>
                    </div>
                  )}
                  
                  {editTranscript && (
                    <>
                      <Textarea
                        value={editTranscript}
                        onChange={(e) => setEditTranscript(e.target.value)}
                        className="min-h-[300px] text-sm"
                        placeholder="Transcrição do áudio..."
                        data-testid="textarea-transcript"
                      />
                      <div className="flex gap-2">
                        <Button onClick={handleSave} disabled={isSaving} className="flex-1" data-testid="button-save-transcript">
                          {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                          Salvar
                        </Button>
                        <Button onClick={handleTranscribe} disabled={isTranscribing} variant="outline" data-testid="button-retranscribe">
                          {isTranscribing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="summary" className="mt-0 space-y-4">
              {!editSummary && !isSummarizing && (
                <div className="text-center py-8">
                  <Sparkles className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground mb-4">
                    {editTranscript ? "Gere um resumo estruturado com IA" : "Primeiro transcreva o áudio"}
                  </p>
                  <Button 
                    onClick={handleSummarize} 
                    disabled={!editTranscript || isSummarizing}
                    data-testid="button-summarize"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Gerar Resumo com IA
                  </Button>
                </div>
              )}

              {isSummarizing && (
                <div className="flex items-center justify-center gap-2 py-8">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Gerando resumo...</span>
                </div>
              )}

              {editSummary && !isSummarizing && (
                <div className="space-y-4">
                  <Textarea
                    value={editSummary}
                    onChange={(e) => setEditSummary(e.target.value)}
                    className="min-h-[300px] text-sm"
                    placeholder="Resumo gerado pela IA..."
                    data-testid="textarea-summary"
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={isSaving} className="flex-1" data-testid="button-save-summary">
                      {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                      Salvar
                    </Button>
                    <Button onClick={handleSummarize} disabled={isSummarizing} variant="outline" data-testid="button-regenerate-summary">
                      {isSummarizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="notes" className="mt-0 space-y-4">
              <Textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="min-h-[300px] text-sm"
                placeholder="Suas anotações pessoais sobre este sermão..."
                data-testid="textarea-notes"
              />
              <Button onClick={handleSave} disabled={isSaving} className="w-full" data-testid="button-save-notes">
                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Salvar Anotações
              </Button>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
