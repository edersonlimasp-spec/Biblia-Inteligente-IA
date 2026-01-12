import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { jsPDF } from "jspdf";
import {
  Play,
  Pause,
  FileText,
  Sparkles,
  StickyNote,
  Save,
  FileDown,
  Share2,
  Loader2,
  Check,
  Tag,
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

  const ensureSermonExists = async (): Promise<boolean> => {
    if (sermonData) return true;
    
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
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error creating sermon:", error);
      return false;
    }
  };

  const handleTranscribe = async () => {
    if (sermonData?.transcriptText && !confirm("Já existe uma transcrição. Deseja substituí-la?")) {
      return;
    }

    setIsTranscribing(true);
    try {
      if (!await ensureSermonExists()) {
        throw new Error("Não foi possível sincronizar a gravação");
      }

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
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Falha na transcrição");
      }

      const data = await res.json();
      setEditTranscript(data.transcriptText);
      setSermonData((prev) => prev ? { ...prev, transcriptText: data.transcriptText, transcriptStatus: "done" } : null);
      
      toast({
        title: "Transcrição concluída",
        description: "O áudio foi transcrito com sucesso!",
      });
    } catch (error: any) {
      console.error("Transcription error:", error);
      toast({
        title: "Erro na transcrição",
        description: error.message || "Não foi possível transcrever o áudio",
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
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 pb-3 border-b shrink-0 bg-gradient-to-r from-primary/10 to-primary/5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg font-bold truncate">{editTitle}</DialogTitle>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant={status.variant} className="text-xs">{status.label}</Badge>
                <Badge variant="outline" className="text-xs">{editCategory}</Badge>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button variant="ghost" size="icon" onClick={handleExportPDF} data-testid="button-export-pdf">
                <FileDown className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleShare} disabled={isSharing} data-testid="button-share-sermon">
                {isSharing ? <Loader2 className="h-4 w-4 animate-spin" /> : copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-center py-4">
              <Button
                size="lg"
                className="h-16 w-16 rounded-full shadow-lg"
                onClick={handlePlayPause}
                data-testid="button-play-audio"
              >
                {isPlaying ? <Pause className="h-7 w-7" /> : <Play className="h-7 w-7 ml-1" />}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={editTranscript ? "secondary" : "default"}
                className="h-auto py-4 flex-col gap-2"
                onClick={handleTranscribe}
                disabled={isTranscribing}
                data-testid="button-transcribe-main"
              >
                {isTranscribing ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <FileText className="h-6 w-6" />
                )}
                <span className="text-xs font-medium">
                  {isTranscribing ? "Transcrevendo..." : editTranscript ? "Re-transcrever" : "Transcrever"}
                </span>
              </Button>

              <Button
                variant={editSummary ? "secondary" : "default"}
                className="h-auto py-4 flex-col gap-2"
                onClick={handleSummarize}
                disabled={!editTranscript || isSummarizing}
                data-testid="button-summarize-main"
              >
                {isSummarizing ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <Sparkles className="h-6 w-6" />
                )}
                <span className="text-xs font-medium">
                  {isSummarizing ? "Gerando..." : editSummary ? "Regenerar Resumo" : "Gerar Resumo IA"}
                </span>
              </Button>
            </div>

            {editTranscript && (
              <div className="space-y-2 rounded-lg border p-3 bg-muted/30">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Transcrição
                  </h4>
                  <Badge variant="outline" className="text-xs">
                    {editTranscript.split(" ").length} palavras
                  </Badge>
                </div>
                <Textarea
                  value={editTranscript}
                  onChange={(e) => setEditTranscript(e.target.value)}
                  className="min-h-[120px] text-sm bg-background"
                  placeholder="Transcrição do áudio..."
                  data-testid="textarea-transcript"
                />
              </div>
            )}

            {editSummary && (
              <div className="space-y-2 rounded-lg border p-3 bg-gradient-to-br from-primary/5 to-transparent">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Resumo IA
                </h4>
                <Textarea
                  value={editSummary}
                  onChange={(e) => setEditSummary(e.target.value)}
                  className="min-h-[150px] text-sm bg-background"
                  placeholder="Resumo gerado pela IA..."
                  data-testid="textarea-summary"
                />
              </div>
            )}

            <div className="space-y-2 rounded-lg border p-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <StickyNote className="h-4 w-4" />
                Minhas Anotações
              </h4>
              <Textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="min-h-[100px] text-sm"
                placeholder="Suas anotações pessoais sobre este sermão..."
                data-testid="textarea-notes"
              />
            </div>

            <details className="rounded-lg border">
              <summary className="p-3 cursor-pointer text-sm font-medium flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Informações Adicionais
              </summary>
              <div className="p-3 pt-0 space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="title" className="text-xs">Título</Label>
                  <Input
                    id="title"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="h-9"
                    data-testid="input-title"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="category" className="text-xs">Categoria</Label>
                    <Select value={editCategory} onValueChange={setEditCategory}>
                      <SelectTrigger id="category" className="h-9" data-testid="select-category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="culto">Culto</SelectItem>
                        <SelectItem value="reuniao">Reunião</SelectItem>
                        <SelectItem value="estudo">Estudo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="speaker" className="text-xs">Orador</Label>
                    <Input
                      id="speaker"
                      value={editSpeaker}
                      onChange={(e) => setEditSpeaker(e.target.value)}
                      className="h-9"
                      placeholder="Nome"
                      data-testid="input-speaker"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tags" className="text-xs">Tags</Label>
                  <Input
                    id="tags"
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                    className="h-9"
                    placeholder="fé, esperança, amor"
                    data-testid="input-tags"
                  />
                </div>
              </div>
            </details>
          </div>
        </div>

        <div className="p-4 border-t shrink-0 bg-muted/30">
          <Button onClick={handleSave} disabled={isSaving} className="w-full" data-testid="button-save-all">
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar Tudo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
