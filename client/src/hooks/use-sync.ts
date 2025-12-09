import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import type { Highlight, Bookmark, Annotation, ReadingHistory } from "@shared/schema";

interface SyncData {
  bookmarks: Bookmark[];
  annotations: Annotation[];
  highlights: Highlight[];
  readingHistory: ReadingHistory[];
  lastSyncAt: string | null;
}

interface SyncState {
  lastSyncAt: string | null;
  syncVersion: number;
  deviceId: string;
}

const DEVICE_ID_KEY = 'bible-device-id';
const HIGHLIGHTS_KEY = 'bible-highlights';
const LAST_SYNC_KEY = 'bible-last-sync';
const READING_HISTORY_KEY = 'bible-reading-history';
const LAST_READING_KEY = 'bible-last-reading';

function getDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

function getStoredHighlights(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(HIGHLIGHTS_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveHighlightsLocal(highlights: Record<string, string>) {
  try {
    localStorage.setItem(HIGHLIGHTS_KEY, JSON.stringify(highlights));
  } catch {}
}

export function useSyncManager() {
  const { user, token } = useAuth();
  const queryClient = useQueryClient();
  const deviceId = useRef(getDeviceId()).current;
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const { data: serverHighlights, refetch: refetchHighlights } = useQuery<Highlight[]>({
    queryKey: ['/api/highlights'],
    enabled: !!user && !!token,
  });

  const createHighlightMutation = useMutation({
    mutationFn: async (data: { book: string; chapter: number; verse: number; color: string }) => {
      return apiRequest('POST', '/api/highlights', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/highlights'] });
    },
  });

  const deleteHighlightMutation = useMutation({
    mutationFn: async (data: { book: string; chapter: number; verse: number }) => {
      return apiRequest('DELETE', `/api/highlights/verse/${data.book}/${data.chapter}/${data.verse}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/highlights'] });
    },
  });

  const convertServerHighlightsToLocal = useCallback((highlights: Highlight[]): Record<string, string> => {
    const result: Record<string, string> = {};
    highlights.forEach((h) => {
      const key = `${h.book}-${h.chapter}-${h.verse}`;
      result[key] = h.color;
    });
    return result;
  }, []);

  const syncFromServer = useCallback(async () => {
    if (!user || !token) return;

    setIsSyncing(true);
    setSyncError(null);

    try {
      await refetchHighlights();
      setLastSyncAt(new Date());
      localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
    } catch (error) {
      console.error("Sync error:", error);
      setSyncError("Erro ao sincronizar");
    } finally {
      setIsSyncing(false);
    }
  }, [user, token, refetchHighlights]);

  const addHighlight = useCallback(async (
    book: string,
    chapter: number,
    verse: number,
    color: string
  ) => {
    const key = `${book}-${chapter}-${verse}`;
    const localHighlights = getStoredHighlights();
    localHighlights[key] = color;
    saveHighlightsLocal(localHighlights);

    if (user && token) {
      try {
        await createHighlightMutation.mutateAsync({ book, chapter, verse, color });
      } catch (error) {
        console.error("Error syncing highlight to server:", error);
      }
    }

    return localHighlights;
  }, [user, token, createHighlightMutation]);

  const removeHighlight = useCallback(async (
    book: string,
    chapter: number,
    verse: number
  ) => {
    const key = `${book}-${chapter}-${verse}`;
    const localHighlights = getStoredHighlights();
    delete localHighlights[key];
    saveHighlightsLocal(localHighlights);

    if (user && token) {
      try {
        await deleteHighlightMutation.mutateAsync({ book, chapter, verse });
      } catch (error) {
        console.error("Error removing highlight from server:", error);
      }
    }

    return localHighlights;
  }, [user, token, deleteHighlightMutation]);

  const getHighlights = useCallback((): Record<string, string> => {
    if (serverHighlights && serverHighlights.length > 0) {
      const converted = convertServerHighlightsToLocal(serverHighlights);
      const local = getStoredHighlights();
      return { ...local, ...converted };
    }
    return getStoredHighlights();
  }, [serverHighlights, convertServerHighlightsToLocal]);

  const getHighlightColor = useCallback((book: string, chapter: number, verse: number): string | null => {
    const highlights = getHighlights();
    const key = `${book}-${chapter}-${verse}`;
    return highlights[key] || null;
  }, [getHighlights]);

  useEffect(() => {
    if (user && token) {
      syncFromServer();
    }
  }, [user, token]);

  return {
    isSyncing,
    lastSyncAt,
    syncError,
    highlights: getHighlights(),
    addHighlight,
    removeHighlight,
    getHighlightColor,
    syncFromServer,
    isAuthenticated: !!user && !!token,
    deviceId,
  };
}

export function useReadingHistory() {
  const { user, token } = useAuth();
  const queryClient = useQueryClient();

  const { data: history, isLoading } = useQuery<ReadingHistory[]>({
    queryKey: ['/api/reading-history'],
    enabled: !!user && !!token,
  });

  const addReadingMutation = useMutation({
    mutationFn: async (data: { book: string; chapter: number; versionCode?: string }) => {
      return apiRequest('POST', '/api/reading-history', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reading-history'] });
    },
  });

  const saveReadingLocal = useCallback((book: string, chapter: number, versionCode?: string) => {
    try {
      const entry = {
        book,
        chapter,
        versionCode: versionCode || 'ACF',
        readAt: new Date().toISOString(),
      };
      localStorage.setItem(LAST_READING_KEY, JSON.stringify(entry));
    } catch (error) {
      console.warn('Erro ao salvar leitura em localStorage:', error);
    }
  }, []);

  const trackReading = useCallback(async (book: string, chapter: number, versionCode?: string) => {
    // Para usuários logados: salvar no servidor
    if (user && token) {
      try {
        await addReadingMutation.mutateAsync({ book, chapter, versionCode });
      } catch (error) {
        console.error("Error tracking reading:", error);
      }
    } else {
      // Para guests: salvar apenas em localStorage
      saveReadingLocal(book, chapter, versionCode);
    }
  }, [user, token, addReadingMutation, saveReadingLocal]);

  const getLastReading = useCallback(() => {
    try {
      const stored = localStorage.getItem(LAST_READING_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }, []);

  return {
    history: history || [],
    isLoading,
    trackReading,
    getLastReading,
  };
}
