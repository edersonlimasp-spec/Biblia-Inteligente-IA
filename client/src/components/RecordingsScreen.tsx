import { useState, useRef, useEffect } from "react";
import { useRequireAuth } from "@/contexts/AuthGateContext";
import { UserButton } from "@/components/UserButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  useRecordings,
  useAudioRecorder,
  formatDuration,
  formatDate,
  type RecordingMetadata,
} from "@/hooks/use-recordings";
import {
  Mic,
  Square,
  Play,
  Pause,
  Trash2,
  Share2,
  ArrowLeft,
  Save,
  X,
  Clock,
  Calendar,
  AlertCircle,
  Download,
  Mail,
  MessageCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface RecordingsScreenProps {
  onBack: () => void;
}

export function RecordingsScreen({ onBack }: RecordingsScreenProps) {
  const { requireAuth } = useRequireAuth();
  const { toast } = useToast();
  const {
    recordings,
    isLoading,
    error: storageError,
    saveRecording,
    getRecordingBlob,
    deleteRecording,
  } = useRecordings();

  const {
    isRecording,
    isPaused,
    duration,
    error: recorderError,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    cancelRecording,
  } = useAudioRecorder();

  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingTitle, setRecordingTitle] = useState("");
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [shareRecordingId, setShareRecordingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const handleStartRecording = () => {
    requireAuth(async () => {
      const success = await startRecording();
      if (success) {
        toast({
          title: "Gravação iniciada",
          description: "Fale próximo ao microfone",
        });
      }
    }, "gravar sermões");
  };

  const handleStopRecording = async () => {
    const blob = await stopRecording();
    if (blob) {
      setRecordedBlob(blob);
      setRecordingDuration(duration);
      setRecordingTitle(`Sermão - ${new Date().toLocaleDateString("pt-BR")}`);
      setShowSaveDialog(true);
    }
  };

  const handleSaveRecording = async () => {
    if (!recordedBlob || !recordingTitle.trim()) {
      toast({
        title: "Erro",
        description: "Informe um título para a gravação",
        variant: "destructive",
      });
      return;
    }

    try {
      await saveRecording(recordedBlob, recordingTitle.trim(), recordingDuration);
      toast({
        title: "Gravação salva",
        description: `"${recordingTitle}" foi salva com sucesso`,
      });
      setShowSaveDialog(false);
      setRecordedBlob(null);
      setRecordingTitle("");
      setRecordingDuration(0);
    } catch {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a gravação",
        variant: "destructive",
      });
    }
  };

  const handleCancelSave = () => {
    setShowSaveDialog(false);
    setRecordedBlob(null);
    setRecordingTitle("");
    setRecordingDuration(0);
  };

  const handlePlayRecording = async (recording: RecordingMetadata) => {
    try {
      if (playingId === recording.id) {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
        setPlayingId(null);
        return;
      }

      if (audioRef.current) {
        audioRef.current.pause();
      }

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
        setPlayingId(null);
        URL.revokeObjectURL(url);
      };
      
      audio.onerror = () => {
        setPlayingId(null);
        toast({
          title: "Erro",
          description: "Não foi possível reproduzir o áudio",
          variant: "destructive",
        });
      };

      await audio.play();
      audioRef.current = audio;
      setPlayingId(recording.id);
    } catch {
      toast({
        title: "Erro",
        description: "Erro ao reproduzir gravação",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRecording = async () => {
    if (!deleteConfirmId) return;
    
    try {
      if (playingId === deleteConfirmId && audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
        setPlayingId(null);
      }
      
      await deleteRecording(deleteConfirmId);
      toast({
        title: "Gravação excluída",
        description: "A gravação foi removida com sucesso",
      });
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível excluir a gravação",
        variant: "destructive",
      });
    }
    setDeleteConfirmId(null);
  };

  const handleShare = async (recording: RecordingMetadata) => {
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

      if (navigator.share && navigator.canShare) {
        const file = new File([blob], `${recording.title}.webm`, { type: blob.type });
        const shareData = {
          title: recording.title,
          text: `Ouça este sermão gravado no app Bíblia Inteligente: "${recording.title}"\n\n---\nEnviado por Bíblia Inteligente IA\nConheça a BI: https://bibliainteligente.replit.app`,
          files: [file],
        };

        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          return;
        }
      }

      setShareRecordingId(recording.id);
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setShareRecordingId(recording.id);
      }
    }
  };

  const handleWhatsAppShare = async (recording: RecordingMetadata) => {
    const text = encodeURIComponent(
      `Ouça este sermão gravado no app Bíblia Inteligente:\n\n"${recording.title}"\nDuração: ${formatDuration(recording.duration)}\n\n---\nEnviado por Bíblia Inteligente IA\nConheça a BI: https://bibliainteligente.replit.app`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
    setShareRecordingId(null);
  };

  const handleEmailShare = async (recording: RecordingMetadata) => {
    const subject = encodeURIComponent(`Sermão Gravado - ${recording.title}`);
    const body = encodeURIComponent(
      `Olá!\n\nGostaria de compartilhar este sermão gravado no app Bíblia Inteligente:\n\nTítulo: ${recording.title}\nDuração: ${formatDuration(recording.duration)}\nData: ${formatDate(recording.createdAt)}\n\nPara ouvir, baixe o arquivo anexado ou acesse o app.\n\n---\nEnviado por Bíblia Inteligente IA\nConheça a BI: https://bibliainteligente.replit.app`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
    setShareRecordingId(null);
  };

  const handleDownload = async (recording: RecordingMetadata) => {
    try {
      const blob = await getRecordingBlob(recording.id);
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const extension = recording.mimeType.includes("mp4") ? "m4a" 
        : recording.mimeType.includes("ogg") ? "ogg"
        : recording.mimeType.includes("mpeg") || recording.mimeType.includes("aac") ? "mp3"
        : "webm";
      a.download = `${recording.title}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download iniciado",
        description: "O arquivo está sendo baixado",
      });
      setShareRecordingId(null);
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível baixar o arquivo",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const error = storageError || recorderError;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              data-testid="button-back-recordings"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold">Gravações de Sermões</h1>
              <p className="text-xs text-muted-foreground">
                Grave e organize suas mensagens
              </p>
            </div>
          </div>
          <UserButton />
        </div>
      </header>

      <ScrollArea className="h-[calc(100vh-73px)]">
        <div className="p-4 space-y-6 pb-24">
          {error && (
            <Card className="border-destructive bg-destructive/10">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </CardContent>
            </Card>
          )}

          <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Mic className="h-5 w-5" />
                Gravador
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center gap-4">
                <AnimatePresence mode="wait">
                  {isRecording ? (
                    <motion.div
                      key="recording"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="flex flex-col items-center gap-4"
                    >
                      <div className="relative">
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          className="absolute inset-0 bg-red-500/30 rounded-full"
                        />
                        <div className="relative w-24 h-24 bg-red-500 rounded-full flex items-center justify-center">
                          <Mic className="h-10 w-10 text-white" />
                        </div>
                      </div>

                      <div className="text-center">
                        <Badge variant="destructive" className="mb-2">
                          <span className="animate-pulse mr-1">●</span>
                          Gravando
                        </Badge>
                        <p className="text-3xl font-mono font-bold" data-testid="text-recording-duration">
                          {formatDuration(duration)}
                        </p>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={isPaused ? resumeRecording : pauseRecording}
                          data-testid="button-pause-recording"
                        >
                          {isPaused ? <Play className="h-5 w-5 mr-2" /> : <Pause className="h-5 w-5 mr-2" />}
                          {isPaused ? "Continuar" : "Pausar"}
                        </Button>
                        <Button
                          variant="destructive"
                          size="lg"
                          onClick={handleStopRecording}
                          data-testid="button-stop-recording"
                        >
                          <Square className="h-5 w-5 mr-2" />
                          Parar
                        </Button>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={cancelRecording}
                        className="text-muted-foreground"
                        data-testid="button-cancel-recording"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancelar gravação
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="idle"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="flex flex-col items-center gap-4"
                    >
                      <Button
                        size="lg"
                        className="h-24 w-24 rounded-full bg-primary hover:bg-primary/90"
                        onClick={handleStartRecording}
                        data-testid="button-start-recording"
                      >
                        <Mic className="h-10 w-10" />
                      </Button>
                      <p className="text-sm text-muted-foreground text-center">
                        Toque para iniciar a gravação do sermão
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Gravações Salvas</h2>
              <Badge variant="secondary">{recordings.length}</Badge>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-4 bg-muted rounded w-2/3 mb-2" />
                      <div className="h-3 bg-muted rounded w-1/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : recordings.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Mic className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">
                    Nenhuma gravação salva ainda.
                    <br />
                    Grave seu primeiro sermão!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {recordings.map((recording) => (
                  <motion.div
                    key={recording.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="hover-elevate" data-testid={`card-recording-${recording.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium truncate" data-testid={`text-recording-title-${recording.id}`}>
                              {recording.title}
                            </h3>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(recording.createdAt)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDuration(recording.duration)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handlePlayRecording(recording)}
                              data-testid={`button-play-${recording.id}`}
                            >
                              {playingId === recording.id ? (
                                <Pause className="h-4 w-4" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleShare(recording)}
                              data-testid={`button-share-${recording.id}`}
                            >
                              <Share2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteConfirmId(recording.id)}
                              className="text-destructive hover:text-destructive"
                              data-testid={`button-delete-${recording.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {playingId === recording.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="mt-3 pt-3 border-t"
                          >
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1 bg-primary/20 rounded-full overflow-hidden">
                                <motion.div
                                  className="h-full bg-primary"
                                  animate={{ width: ["0%", "100%"] }}
                                  transition={{ duration: recording.duration, ease: "linear" }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {formatDuration(recording.duration)}
                              </span>
                            </div>
                          </motion.div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      <AlertDialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Salvar Gravação</AlertDialogTitle>
            <AlertDialogDescription>
              Dê um título para sua gravação. Ela ficará salva no app para você ouvir depois.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <Input
              placeholder="Ex: Sermão de Domingo - 12/12"
              value={recordingTitle}
              onChange={(e) => setRecordingTitle(e.target.value)}
              data-testid="input-recording-title"
            />

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Duração: {formatDuration(recordingDuration)}
              </span>
            </div>

            {recordedBlob && (
              <div className="bg-muted rounded-lg p-3">
                <p className="text-sm font-medium mb-2">Prévia do áudio:</p>
                <audio
                  ref={previewAudioRef}
                  controls
                  className="w-full h-10"
                  src={URL.createObjectURL(recordedBlob)}
                />
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelSave} data-testid="button-cancel-save">
              Descartar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveRecording} data-testid="button-confirm-save">
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Gravação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta gravação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRecording}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!shareRecordingId} onOpenChange={() => setShareRecordingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Compartilhar Gravação</AlertDialogTitle>
            <AlertDialogDescription>
              Escolha como deseja compartilhar esta gravação:
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="grid gap-3 py-4">
            {recordings.find((r) => r.id === shareRecordingId) && (
              <>
                <Button
                  variant="outline"
                  className="justify-start h-12"
                  onClick={() => {
                    const rec = recordings.find((r) => r.id === shareRecordingId);
                    if (rec) handleWhatsAppShare(rec);
                  }}
                  data-testid="button-share-whatsapp"
                >
                  <MessageCircle className="h-5 w-5 mr-3 text-green-500" />
                  Compartilhar via WhatsApp
                </Button>

                <Button
                  variant="outline"
                  className="justify-start h-12"
                  onClick={() => {
                    const rec = recordings.find((r) => r.id === shareRecordingId);
                    if (rec) handleEmailShare(rec);
                  }}
                  data-testid="button-share-email"
                >
                  <Mail className="h-5 w-5 mr-3 text-blue-500" />
                  Compartilhar via E-mail
                </Button>

                <Button
                  variant="outline"
                  className="justify-start h-12"
                  onClick={() => {
                    const rec = recordings.find((r) => r.id === shareRecordingId);
                    if (rec) handleDownload(rec);
                  }}
                  data-testid="button-download-recording"
                >
                  <Download className="h-5 w-5 mr-3 text-purple-500" />
                  Baixar arquivo para anexar
                </Button>
              </>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-close-share">Fechar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <LoginPromptModal
        open={showLoginPrompt}
        onOpenChange={setShowLoginPrompt}
        featureName="as Gravações"
        onAuthSuccess={() => {
          setShowLoginPrompt(false);
          toast({
            title: "Login realizado!",
            description: "Agora você pode gravar seus sermões.",
          });
        }}
      />
    </div>
  );
}
