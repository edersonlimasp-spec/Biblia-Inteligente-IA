import { useState, useEffect, useCallback } from "react";

export interface Recording {
  id: string;
  title: string;
  blob: Blob;
  duration: number;
  createdAt: Date;
  serverUrl?: string;
  userId?: number;
  deviceId?: string;
}

export interface RecordingMetadata {
  id: string;
  title: string;
  duration: number;
  createdAt: Date;
  serverUrl?: string;
  mimeType: string;
}

const DB_NAME = "BibliaInteligenteRecordings";
const DB_VERSION = 1;
const STORE_NAME = "recordings";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt", { unique: false });
        store.createIndex("title", "title", { unique: false });
      }
    };
  });
}

export function useRecordings() {
  const [recordings, setRecordings] = useState<RecordingMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRecordings = useCallback(async () => {
    try {
      setIsLoading(true);
      const db = await openDB();
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index("createdAt");

      const request = index.getAll();
      
      request.onsuccess = () => {
        const results = request.result.map((rec: Recording & { mimeType?: string }) => ({
          id: rec.id,
          title: rec.title,
          duration: rec.duration,
          createdAt: new Date(rec.createdAt),
          serverUrl: rec.serverUrl,
          mimeType: rec.mimeType || "audio/webm",
        }));
        results.sort((a: RecordingMetadata, b: RecordingMetadata) => 
          b.createdAt.getTime() - a.createdAt.getTime()
        );
        setRecordings(results);
        setIsLoading(false);
      };

      request.onerror = () => {
        setError("Erro ao carregar gravações");
        setIsLoading(false);
      };
    } catch (err) {
      setError("IndexedDB não disponível");
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecordings();
  }, [loadRecordings]);

  const saveRecording = useCallback(async (
    blob: Blob,
    title: string,
    duration: number
  ): Promise<string> => {
    const id = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const recording = {
      id,
      title,
      blob,
      duration,
      createdAt: new Date(),
      mimeType: blob.type || "audio/webm",
    };

    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.add(recording);
      request.onsuccess = () => {
        loadRecordings();
        resolve(id);
      };
      request.onerror = () => reject(request.error);
    });
  }, [loadRecordings]);

  const getRecordingBlob = useCallback(async (id: string): Promise<Blob | null> => {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => {
        if (request.result?.blob) {
          resolve(request.result.blob);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }, []);

  const deleteRecording = useCallback(async (id: string): Promise<void> => {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => {
        loadRecordings();
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }, [loadRecordings]);

  const updateRecordingTitle = useCallback(async (id: string, newTitle: string): Promise<void> => {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        if (getRequest.result) {
          const updated = { ...getRequest.result, title: newTitle };
          const putRequest = store.put(updated);
          putRequest.onsuccess = () => {
            loadRecordings();
            resolve();
          };
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          reject(new Error("Gravação não encontrada"));
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }, [loadRecordings]);

  return {
    recordings,
    isLoading,
    error,
    saveRecording,
    getRecordingBlob,
    deleteRecording,
    updateRecordingTitle,
    refreshRecordings: loadRecordings,
  };
}

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setAudioChunks([]);
      setDuration(0);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError("Seu navegador não suporta gravação de áudio. Tente atualizar ou usar outro navegador.");
        return false;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        } 
      });

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")
        ? "audio/ogg;codecs=opus"
        : "audio/mp4";

      const recorder = new MediaRecorder(stream, { mimeType });
      
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
          setAudioChunks([...chunks]);
        }
      };

      recorder.onerror = () => {
        setError("Erro durante a gravação");
        setIsRecording(false);
      };

      recorder.start(1000);
      setMediaRecorder(recorder);
      setIsRecording(true);
      setIsPaused(false);
      return true;
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "NotAllowedError") {
        setError("Permissão para microfone negada. Por favor, permita o acesso ao microfone nas configurações do navegador.");
      } else if (err instanceof Error && err.name === "NotFoundError") {
        setError("Nenhum microfone encontrado. Conecte um microfone e tente novamente.");
      } else {
        setError("Erro ao iniciar gravação. Verifique se seu navegador suporta gravação de áudio.");
      }
      return false;
    }
  }, []);

  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorder) {
        resolve(null);
        return;
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunks, { type: mediaRecorder.mimeType });
        mediaRecorder.stream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);
        setIsPaused(false);
        setMediaRecorder(null);
        resolve(blob);
      };

      if (mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
      } else {
        resolve(null);
      }
    });
  }, [mediaRecorder, audioChunks]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.pause();
      setIsPaused(true);
    }
  }, [mediaRecorder]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state === "paused") {
      mediaRecorder.resume();
      setIsPaused(false);
    }
  }, [mediaRecorder]);

  const cancelRecording = useCallback(() => {
    if (mediaRecorder) {
      mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      if (mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
      }
    }
    setIsRecording(false);
    setIsPaused(false);
    setMediaRecorder(null);
    setAudioChunks([]);
    setDuration(0);
  }, [mediaRecorder]);

  return {
    isRecording,
    isPaused,
    duration,
    error,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    cancelRecording,
  };
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
