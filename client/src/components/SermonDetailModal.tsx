import { useState, useRef, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
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
  Tag,
  Clock,
  Calendar,
  Mic,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Copy,
  FolderDown,
  CheckCircle,
  Info,
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

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function SermonDetailModal({
  recording,
  isOpen,
  onClose,
  getRecordingBlob,
}: SermonDetailModalProps) {
  const { toast } = useToast();
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const listenersRef = useRef<{
    loadedmetadata?: () => void;
    timeupdate?: () => void;
    ended?: () => void;
    play?: () => void;
    pause?: () => void;
    error?: () => void;
  }>({});

  const [sermonData, setSermonData] = useState<SermonData | null>(null);
  const [activeTab, setActiveTab] = useState("player");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(recording.duration || 0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [audioReady, setAudioReady] = useState(false);

  const [editTitle, setEditTitle] = useState(recording.title);
  const [editCategory, setEditCategory] = useState("culto");
  const [editSpeaker, setEditSpeaker] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editTranscript, setEditTranscript] = useState("");
  const [editSummary, setEditSummary] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const cleanupAudio = useCallback(() => {
    if (audioRef.current) {
      const audio = audioRef.current;
      const listeners = listenersRef.current;
      
      if (listeners.loadedmetadata) audio.removeEventListener("loadedmetadata", listeners.loadedmetadata);
      if (listeners.timeupdate) audio.removeEventListener("timeupdate", listeners.timeupdate);
      if (listeners.ended) audio.removeEventListener("ended", listeners.ended);
      if (listeners.play) audio.removeEventListener("play", listeners.play);
      if (listeners.pause) audio.removeEventListener("pause", listeners.pause);
      if (listeners.error) audio.removeEventListener("error", listeners.error);
      
      audio.pause();
      audio.src = "";
      audioRef.current = null;
      listenersRef.current = {};
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    setIsPlaying(false);
    setCurrentTime(0);
    setAudioReady(false);
  }, []);

  const initializeAudio = useCallback(async () => {
    if (audioRef.current) return;

    try {
      const blob = await getRecordingBlob(recording.id);
      if (!blob) {
        toast({
          title: "Erro",
          description: "Áudio não encontrado no dispositivo",
          variant: "destructive",
        });
        return;
      }

      const url = URL.createObjectURL(blob);
      audioUrlRef.current = url;

      const audio = new Audio();
      audio.src = url;
      audio.preload = "metadata";

      const onLoadedMetadata = () => {
        if (audio.duration && isFinite(audio.duration)) {
          setDuration(audio.duration);
        }
        setAudioReady(true);
      };

      const onTimeUpdate = () => {
        setCurrentTime(audio.currentTime);
      };

      const onEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };

      const onPlay = () => {
        setIsPlaying(true);
      };

      const onPause = () => {
        setIsPlaying(false);
      };

      const onError = () => {
        toast({
          title: "Erro",
          description: "Erro ao carregar o áudio",
          variant: "destructive",
        });
        setAudioReady(false);
      };

      listenersRef.current = {
        loadedmetadata: onLoadedMetadata,
        timeupdate: onTimeUpdate,
        ended: onEnded,
        play: onPlay,
        pause: onPause,
        error: onError,
      };

      audio.addEventListener("loadedmetadata", onLoadedMetadata);
      audio.addEventListener("timeupdate", onTimeUpdate);
      audio.addEventListener("ended", onEnded);
      audio.addEventListener("play", onPlay);
      audio.addEventListener("pause", onPause);
      audio.addEventListener("error", onError);

      audioRef.current = audio;
    } catch (error) {
      console.error("Error initializing audio:", error);
    }
  }, [recording.id, getRecordingBlob, toast]);

  const loadSermonData = useCallback(async () => {
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  }, [recording.id, recording.title]);

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

  useEffect(() => {
    if (isOpen && recording) {
      setActiveTab("player");
      setCurrentTime(0);
      setIsPlaying(false);
      loadSermonData();
      initializeAudio();
    }
    return () => {
      cleanupAudio();
    };
  }, [isOpen, recording?.id, loadSermonData, initializeAudio, cleanupAudio]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const handlePlayPause = async () => {
    if (!audioRef.current) {
      await initializeAudio();
    }

    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      try {
        await audioRef.current.play();
      } catch (error) {
        console.error("Error playing audio:", error);
        toast({
          title: "Erro",
          description: "Não foi possível reproduzir o áudio",
          variant: "destructive",
        });
      }
    }
  };

  const handleSeek = (values: number[]) => {
    const newTime = values[0];
    if (audioRef.current && isFinite(newTime)) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleSkip = (seconds: number) => {
    if (audioRef.current) {
      const newTime = Math.max(0, Math.min(audioRef.current.currentTime + seconds, duration));
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (values: number[]) => {
    const newVolume = values[0];
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
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
      if (!(await ensureSermonExists())) {
        throw new Error("Não foi possível sincronizar a gravação");
      }

      const blob = await getRecordingBlob(recording.id);
      if (!blob) {
        throw new Error("Áudio não encontrado");
      }

      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const result = reader.result as string;
          const base64 = result.split(",")[1];
          resolve(base64);
        };
        reader.onerror = () => reject(new Error("Erro ao ler arquivo"));
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
      setSermonData((prev) =>
        prev ? { ...prev, transcriptText: data.transcriptText, transcriptStatus: "done" } : null
      );

      toast({
        title: "Transcrição concluída",
        description: "O áudio foi transcrito com sucesso!",
      });

      setActiveTab("transcription");
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
      setActiveTab("transcription");
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
      setSermonData((prev) =>
        prev ? { ...prev, summaryJson: data.summaryJson, summaryText: data.summaryText } : null
      );

      toast({
        title: "Resumo gerado",
        description: "O resumo foi gerado com sucesso!",
      });

      setActiveTab("summary");
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
      if (!(await ensureSermonExists())) {
        throw new Error("Não foi possível sincronizar a gravação");
      }

      const tags = editTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

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
        description: "Todas as alterações foram salvas!",
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

  const generatePDF = (): jsPDF => {
    const doc = new jsPDF();
    const margin = 20;
    let y = margin;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const maxWidth = pageWidth - 2 * margin;
    const primaryColor: [number, number, number] = [26, 82, 153];
    const accentColor: [number, number, number] = [59, 130, 246];
    const textDark: [number, number, number] = [30, 30, 30];
    const textMuted: [number, number, number] = [100, 100, 100];

    const addNewPageIfNeeded = (requiredSpace: number) => {
      if (y + requiredSpace > pageHeight - 30) {
        doc.addPage();
        y = margin;
      }
    };

    const drawSectionHeader = (title: string, iconSymbol: string, color: [number, number, number]) => {
      addNewPageIfNeeded(25);
      doc.setFillColor(...color);
      doc.roundedRect(margin, y - 4, 6, 18, 2, 2, "F");
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...color);
      doc.text(title, margin + 12, y + 8);
      y += 20;
    };

    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 50, "F");
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(255, 255, 255, 0.7);
    doc.text("RELATÓRIO DE REUNIÃO", margin, 15);
    
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    const titleLines = doc.splitTextToSize(editTitle, maxWidth - 10);
    doc.text(titleLines, margin, 32);
    
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255, 0.8);
    const dateStr = new Date(recording.createdAt).toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    doc.text(dateStr, margin, 45);

    y = 60;

    doc.setFillColor(245, 247, 250);
    doc.roundedRect(margin, y, maxWidth, 30, 3, 3, "F");
    
    doc.setFontSize(9);
    doc.setTextColor(...textMuted);
    doc.setFont("helvetica", "normal");
    
    let infoX = margin + 8;
    doc.text("Categoria", infoX, y + 10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...textDark);
    doc.text(editCategory.charAt(0).toUpperCase() + editCategory.slice(1), infoX, y + 20);
    
    if (editSpeaker) {
      infoX += 50;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...textMuted);
      doc.text("Orador", infoX, y + 10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...textDark);
      doc.text(editSpeaker, infoX, y + 20);
    }
    
    infoX = maxWidth - 30;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...textMuted);
    doc.text("Duração", infoX, y + 10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...textDark);
    doc.text(formatTime(recording.duration), infoX, y + 20);

    y += 40;

    if (editTags) {
      doc.setFontSize(9);
      doc.setTextColor(...textMuted);
      const tagsArray = editTags.split(",").map(t => t.trim()).filter(Boolean);
      let tagX = margin;
      tagsArray.forEach((tag) => {
        const tagWidth = doc.getTextWidth(tag) + 10;
        if (tagX + tagWidth > pageWidth - margin) {
          tagX = margin;
          y += 12;
        }
        doc.setFillColor(230, 235, 245);
        doc.roundedRect(tagX, y - 5, tagWidth, 12, 3, 3, "F");
        doc.setTextColor(...primaryColor);
        doc.text(tag, tagX + 5, y + 3);
        tagX += tagWidth + 5;
      });
      y += 20;
    }

    if (editSummary) {
      drawSectionHeader("Resumo", "✨", accentColor);
      
      doc.setFillColor(248, 250, 252);
      const summaryLines = doc.splitTextToSize(editSummary, maxWidth - 20);
      const summaryHeight = summaryLines.length * 6 + 15;
      addNewPageIfNeeded(summaryHeight);
      doc.roundedRect(margin, y - 5, maxWidth, summaryHeight, 4, 4, "F");
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...textDark);
      summaryLines.forEach((line: string) => {
        addNewPageIfNeeded(8);
        doc.text(line, margin + 10, y + 5);
        y += 6;
      });
      y += 15;
    }

    if (editTranscript) {
      drawSectionHeader("Transcrição", "📝", [76, 175, 80]);
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...textMuted);
      const transcriptLines = doc.splitTextToSize(editTranscript, maxWidth);
      transcriptLines.forEach((line: string) => {
        addNewPageIfNeeded(7);
        doc.text(line, margin, y);
        y += 5;
      });
      y += 15;
    }

    if (editNotes) {
      drawSectionHeader("Minhas Anotações", "📌", [255, 152, 0]);
      
      doc.setFillColor(255, 251, 235);
      const notesLines = doc.splitTextToSize(editNotes, maxWidth - 20);
      const notesHeight = notesLines.length * 6 + 15;
      addNewPageIfNeeded(notesHeight);
      doc.roundedRect(margin, y - 5, maxWidth, notesHeight, 4, 4, "F");
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...textDark);
      notesLines.forEach((line: string) => {
        addNewPageIfNeeded(8);
        doc.text(line, margin + 10, y + 5);
        y += 6;
      });
      y += 10;
    }

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Bíblia Inteligente IA`, margin, pageHeight - 10);
      doc.text(`Página ${i} de ${pageCount}`, pageWidth - margin, pageHeight - 10, { align: "right" });
    }

    return doc;
  };

  const handleExportPDF = () => {
    const doc = generatePDF();
    const pdfBlob = doc.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, "_blank");
    
    setTimeout(() => {
      URL.revokeObjectURL(pdfUrl);
    }, 10000);

    toast({
      title: "PDF Aberto",
      description: "O relatório foi aberto em uma nova aba!",
    });
  };

  const handleSaveToDevice = async () => {
    try {
      const doc = generatePDF();
      const pdfBlob = doc.output("blob");
      const filename = `${editTitle.replace(/[^a-zA-Z0-9áàâãéèêíìîóòôõúùûç\s]/gi, "_")}.pdf`;

      if ("showSaveFilePicker" in window) {
        try {
          const handle = await (window as any).showSaveFilePicker({
            suggestedName: filename,
            types: [
              {
                description: "Documento PDF",
                accept: { "application/pdf": [".pdf"] },
              },
            ],
          });
          const writable = await handle.createWritable();
          await writable.write(pdfBlob);
          await writable.close();

          toast({
            title: "Documento Salvo",
            description: "O PDF foi salvo no local escolhido!",
          });
          return;
        } catch (err) {
          if ((err as Error).name === "AbortError") return;
        }
      }

      handleExportPDF();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar o documento",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const shareText = `${editTitle}\n\n${editSummary ? `Resumo:\n${editSummary}\n\n` : ""}${editNotes ? `Anotações:\n${editNotes}\n\n` : ""}---\nBíblia Inteligente IA`;

      if (navigator.share) {
        const shareData: ShareData = {
          title: editTitle,
          text: shareText,
        };

        try {
          const doc = generatePDF();
          const pdfBlob = doc.output("blob");
          const file = new File(
            [pdfBlob],
            `${editTitle.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`,
            { type: "application/pdf" }
          );

          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            shareData.files = [file];
          }
        } catch (e) {
          console.log("PDF sharing not supported, sharing text only");
        }

        await navigator.share(shareData);
        toast({
          title: "Compartilhado",
          description: "Conteúdo compartilhado com sucesso!",
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        toast({
          title: "Copiado",
          description: "Conteúdo copiado para a área de transferência!",
        });
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        try {
          await navigator.clipboard.writeText(`${editTitle}\n\n${editSummary || ""}`);
          toast({
            title: "Copiado",
            description: "Texto copiado para a área de transferência!",
          });
        } catch {
          toast({
            title: "Erro",
            description: "Não foi possível compartilhar",
            variant: "destructive",
          });
        }
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copiado",
        description: `${label} copiado para a área de transferência!`,
      });
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o texto",
        variant: "destructive",
      });
    }
  };

  const getStatus = () => {
    if (editSummary) return { label: "Resumo pronto", icon: CheckCircle, color: "text-green-500" };
    if (editTranscript) return { label: "Transcrito", icon: FileText, color: "text-blue-500" };
    return { label: "Novo", icon: Mic, color: "text-muted-foreground" };
  };

  const status = getStatus();
  const StatusIcon = status.icon;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] max-w-3xl max-h-[95vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2 shrink-0 bg-gradient-to-r from-primary to-primary/80">
          <DialogDescription className="sr-only">
            Detalhes da gravação de sermão com opções de transcrição, resumo IA e anotações
          </DialogDescription>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg font-bold text-primary-foreground truncate">
                {editTitle}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <Badge variant="secondary" className="text-xs flex items-center gap-1">
                  <StatusIcon className={`h-3 w-3 ${status.color}`} />
                  {status.label}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  <Calendar className="h-3 w-3 mr-1" />
                  {new Date(recording.createdAt).toLocaleDateString("pt-BR")}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatTime(recording.duration)}
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="px-4 border-b shrink-0 bg-muted/30">
              <TabsList className="w-full justify-start h-auto p-0 bg-transparent gap-0">
                <TabsTrigger
                  value="player"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
                  data-testid="tab-player"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Player
                </TabsTrigger>
                <TabsTrigger
                  value="transcription"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
                  data-testid="tab-transcription"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Transcrição
                  {editTranscript && <span className="ml-1 w-2 h-2 rounded-full bg-green-500" />}
                </TabsTrigger>
                <TabsTrigger
                  value="summary"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
                  data-testid="tab-summary"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Resumo IA
                  {editSummary && <span className="ml-1 w-2 h-2 rounded-full bg-green-500" />}
                </TabsTrigger>
                <TabsTrigger
                  value="notes"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
                  data-testid="tab-notes"
                >
                  <StickyNote className="h-4 w-4 mr-2" />
                  Notas
                  {editNotes && <span className="ml-1 w-2 h-2 rounded-full bg-green-500" />}
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto">
              <TabsContent value="player" className="m-0 h-full">
                <div className="p-4 space-y-6">
                  <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center gap-6">
                        <div className="relative">
                          <div className={`w-28 h-28 rounded-full flex items-center justify-center ${isPlaying ? "bg-primary/30 animate-pulse" : "bg-primary/20"}`}>
                            <Button
                              size="lg"
                              className="h-20 w-20 rounded-full shadow-lg"
                              onClick={handlePlayPause}
                              data-testid="button-play-audio"
                            >
                              {isPlaying ? (
                                <Pause className="h-8 w-8" />
                              ) : (
                                <Play className="h-8 w-8 ml-1" />
                              )}
                            </Button>
                          </div>
                        </div>

                        <div className="w-full space-y-3">
                          <Slider
                            value={[currentTime]}
                            max={duration || 100}
                            step={0.1}
                            onValueChange={handleSeek}
                            className="cursor-pointer"
                            data-testid="slider-audio-progress"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{formatTime(currentTime)}</span>
                            <span>{formatTime(duration)}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 w-full">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleSkip(-10)}
                              data-testid="button-skip-back"
                            >
                              <SkipBack className="h-5 w-5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleSkip(10)}
                              data-testid="button-skip-forward"
                            >
                              <SkipForward className="h-5 w-5" />
                            </Button>
                          </div>
                          
                          <div className="flex-1" />
                          
                          <div className="flex items-center gap-2 w-32">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={toggleMute}
                              data-testid="button-toggle-mute"
                            >
                              {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                            </Button>
                            <Slider
                              value={[isMuted ? 0 : volume]}
                              max={1}
                              step={0.01}
                              onValueChange={handleVolumeChange}
                              className="flex-1"
                              data-testid="slider-volume"
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

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
                      <span className="text-sm font-medium">
                        {isTranscribing ? "Transcrevendo..." : editTranscript ? "Re-transcrever" : "Transcrever Áudio"}
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
                      <span className="text-sm font-medium">
                        {isSummarizing ? "Gerando..." : editSummary ? "Regenerar Resumo" : "Gerar Resumo IA"}
                      </span>
                    </Button>
                  </div>

                  {!editTranscript && (
                    <Card className="border-dashed">
                      <CardContent className="p-4 flex items-start gap-3">
                        <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="text-sm text-muted-foreground">
                          <p className="font-medium mb-1">Como usar</p>
                          <ol className="list-decimal list-inside space-y-1">
                            <li>Clique em "Transcrever Áudio" para converter o áudio em texto</li>
                            <li>Após a transcrição, clique em "Gerar Resumo IA" para análise</li>
                            <li>Adicione suas anotações pessoais na aba "Notas"</li>
                            <li>Exporte como PDF ou compartilhe</li>
                          </ol>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Informações
                    </h4>
                    <div className="grid gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="title" className="text-xs">Título</Label>
                        <Input
                          id="title"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          data-testid="input-title"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="category" className="text-xs">Categoria</Label>
                          <Select value={editCategory} onValueChange={setEditCategory}>
                            <SelectTrigger id="category" data-testid="select-category">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="culto">Culto</SelectItem>
                              <SelectItem value="reuniao">Reunião</SelectItem>
                              <SelectItem value="estudo">Estudo Bíblico</SelectItem>
                              <SelectItem value="conferencia">Conferência</SelectItem>
                              <SelectItem value="outro">Outro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="speaker" className="text-xs">Orador/Pregador</Label>
                          <Input
                            id="speaker"
                            value={editSpeaker}
                            onChange={(e) => setEditSpeaker(e.target.value)}
                            placeholder="Nome do orador"
                            data-testid="input-speaker"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="tags" className="text-xs">Tags (separadas por vírgula)</Label>
                        <Input
                          id="tags"
                          value={editTags}
                          onChange={(e) => setEditTags(e.target.value)}
                          placeholder="fé, esperança, amor, salvação"
                          data-testid="input-tags"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="transcription" className="m-0 h-full">
                <div className="p-4 space-y-4">
                  {!editTranscript ? (
                    <Card className="border-dashed">
                      <CardContent className="p-8 text-center">
                        <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                        <h3 className="font-semibold mb-2">Nenhuma transcrição</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Transcreva o áudio para ver o texto aqui
                        </p>
                        <Button onClick={handleTranscribe} disabled={isTranscribing} data-testid="button-transcribe-empty">
                          {isTranscribing ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <FileText className="h-4 w-4 mr-2" />
                          )}
                          {isTranscribing ? "Transcrevendo..." : "Transcrever Agora"}
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {editTranscript.split(/\s+/).length} palavras
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            ~{Math.ceil(editTranscript.length / 1500)} min leitura
                          </Badge>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyText(editTranscript, "Transcrição")}
                            data-testid="button-copy-transcript"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleTranscribe}
                            disabled={isTranscribing}
                            data-testid="button-retranscribe"
                          >
                            {isTranscribing ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <FileText className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <Textarea
                        value={editTranscript}
                        onChange={(e) => setEditTranscript(e.target.value)}
                        className="min-h-[300px] font-serif leading-relaxed"
                        placeholder="Transcrição do áudio..."
                        data-testid="textarea-transcript"
                      />

                      {!editSummary && (
                        <Button className="w-full" onClick={handleSummarize} disabled={isSummarizing}>
                          {isSummarizing ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4 mr-2" />
                          )}
                          {isSummarizing ? "Gerando Resumo..." : "Gerar Resumo IA a partir desta transcrição"}
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="summary" className="m-0 h-full">
                <div className="p-4 space-y-4">
                  {!editSummary ? (
                    <Card className="border-dashed">
                      <CardContent className="p-8 text-center">
                        <Sparkles className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                        <h3 className="font-semibold mb-2">Nenhum resumo</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          {editTranscript
                            ? "Gere um resumo inteligente a partir da transcrição"
                            : "Primeiro transcreva o áudio para poder gerar o resumo"}
                        </p>
                        <Button
                          onClick={editTranscript ? handleSummarize : handleTranscribe}
                          disabled={isSummarizing || isTranscribing}
                          data-testid="button-summarize-empty"
                        >
                          {isSummarizing || isTranscribing ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : editTranscript ? (
                            <Sparkles className="h-4 w-4 mr-2" />
                          ) : (
                            <FileText className="h-4 w-4 mr-2" />
                          )}
                          {isSummarizing
                            ? "Gerando..."
                            : isTranscribing
                            ? "Transcrevendo..."
                            : editTranscript
                            ? "Gerar Resumo IA"
                            : "Transcrever Primeiro"}
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <Badge variant="default" className="bg-gradient-to-r from-primary to-primary/80">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Resumo Inteligente
                        </Badge>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyText(editSummary, "Resumo")}
                            data-testid="button-copy-summary"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleSummarize}
                            disabled={isSummarizing}
                            data-testid="button-regenerate-summary"
                          >
                            {isSummarizing ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Sparkles className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <Card className="bg-gradient-to-br from-primary/5 to-transparent">
                        <CardContent className="p-4">
                          <Textarea
                            value={editSummary}
                            onChange={(e) => setEditSummary(e.target.value)}
                            className="min-h-[300px] bg-transparent border-0 focus-visible:ring-0 resize-none leading-relaxed"
                            placeholder="Resumo gerado pela IA..."
                            data-testid="textarea-summary"
                          />
                        </CardContent>
                      </Card>
                    </>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="notes" className="m-0 h-full">
                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold flex items-center gap-2">
                      <StickyNote className="h-4 w-4" />
                      Minhas Anotações
                    </h3>
                    {editNotes && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyText(editNotes, "Anotações")}
                        data-testid="button-copy-notes"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <Textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="min-h-[350px] leading-relaxed"
                    placeholder="Digite suas anotações pessoais aqui...

Sugestões:
- Pontos importantes do sermão
- Versículos para estudar depois
- Aplicações para sua vida
- Perguntas para reflexão
- Insights e revelações"
                    data-testid="textarea-notes"
                  />
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <div className="p-4 border-t shrink-0 bg-muted/30 space-y-3">
          <div className="grid grid-cols-4 gap-2">
            <Button variant="outline" size="sm" onClick={handleExportPDF} className="flex-col h-auto py-2 gap-1" data-testid="button-export-pdf">
              <FileDown className="h-4 w-4" />
              <span className="text-xs">PDF</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleSaveToDevice} className="flex-col h-auto py-2 gap-1" data-testid="button-save-device">
              <FolderDown className="h-4 w-4" />
              <span className="text-xs">Salvar</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare} disabled={isSharing} className="flex-col h-auto py-2 gap-1" data-testid="button-share-sermon">
              {isSharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
              <span className="text-xs">Compartilhar</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleCopyText(`${editTitle}\n\n${editSummary || editTranscript || ""}`, "Conteúdo")} className="flex-col h-auto py-2 gap-1" data-testid="button-copy-all">
              <Copy className="h-4 w-4" />
              <span className="text-xs">Copiar</span>
            </Button>
          </div>

          <Button onClick={handleSave} disabled={isSaving} className="w-full" data-testid="button-save-all">
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar Alterações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
