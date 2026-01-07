import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import type { Highlight, Bookmark, Annotation, ReadingHistory, ChatMessage } from "@shared/schema";

// Chat session types for cloud sync
export interface LocalChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const CHAT_SESSIONS_KEY = "bible-ai-chat-sessions";
const CHAT_SYNC_KEY = "bible-chat-last-sync";

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
    // SEMPRE salvar em localStorage primeiro (para restauração rápida ao reabrir)
    saveReadingLocal(book, chapter, versionCode);
    
    // Para usuários logados: também salvar no servidor (backup/sync)
    if (user && token) {
      try {
        await addReadingMutation.mutateAsync({ book, chapter, versionCode });
      } catch (error) {
        console.error("Error tracking reading:", error);
      }
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

// ===================================
// CHAT SESSIONS CLOUD SYNC
// ===================================

function getStoredChatSessions(): LocalChatSession[] {
  try {
    const stored = localStorage.getItem(CHAT_SESSIONS_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return parsed.map((s: any) => ({
      ...s,
      createdAt: new Date(s.createdAt),
      updatedAt: new Date(s.updatedAt),
    }));
  } catch {
    return [];
  }
}

function saveChatSessionsLocal(sessions: LocalChatSession[]) {
  try {
    localStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.warn('[ChatSync] Error saving to localStorage:', error);
  }
}

function getLastChatSyncTime(): Date | null {
  try {
    const stored = localStorage.getItem(CHAT_SYNC_KEY);
    return stored ? new Date(stored) : null;
  } catch {
    return null;
  }
}

function setLastChatSyncTime(date: Date) {
  try {
    localStorage.setItem(CHAT_SYNC_KEY, date.toISOString());
  } catch {}
}

export function useChatSessionsSync() {
  const { user, token } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(getLastChatSyncTime());
  const [syncError, setSyncError] = useState<string | null>(null);
  const syncInProgress = useRef(false);
  const deviceId = useRef(getDeviceId()).current;

  // Fetch sessions from cloud
  const fetchCloudSessions = useCallback(async (): Promise<LocalChatSession[]> => {
    if (!user || !token) return [];
    
    try {
      const response = await apiRequest('GET', '/api/sync/chat-sessions');
      const data = await response.json();
      
      if (data.success && data.sessions) {
        return data.sessions.map((s: any) => ({
          id: s.id,
          title: s.title,
          messages: s.messages,
          createdAt: new Date(s.createdAt),
          updatedAt: new Date(s.updatedAt),
        }));
      }
      return [];
    } catch (error) {
      console.error('[ChatSync] Error fetching cloud sessions:', error);
      return [];
    }
  }, [user, token]);

  // Push local sessions to cloud
  const pushToCloud = useCallback(async (sessions: LocalChatSession[], deletedIds: string[] = []) => {
    if (!user || !token) return;
    
    try {
      const response = await apiRequest('POST', '/api/sync/chat-sessions', {
        sessions: sessions.map(s => ({
          id: s.id,
          title: s.title,
          messages: s.messages,
          createdAt: s.createdAt.toISOString(),
          updatedAt: s.updatedAt.toISOString(),
        })),
        deletedIds,
      });
      const data = await response.json();
      console.log(`[ChatSync] Pushed ${data.syncedCount} sessions, deleted ${data.deletedCount}`);
      return data;
    } catch (error) {
      console.error('[ChatSync] Error pushing to cloud:', error);
      throw error;
    }
  }, [user, token]);

  // Merge local and cloud sessions (cloud wins for conflicts based on updatedAt)
  const mergeSessions = useCallback((local: LocalChatSession[], cloud: LocalChatSession[]): LocalChatSession[] => {
    const merged = new Map<string, LocalChatSession>();
    
    // Add all cloud sessions first (they have priority)
    for (const session of cloud) {
      merged.set(session.id, session);
    }
    
    // Add local sessions that are newer or don't exist in cloud
    for (const session of local) {
      const existing = merged.get(session.id);
      if (!existing || session.updatedAt > existing.updatedAt) {
        merged.set(session.id, session);
      }
    }
    
    return Array.from(merged.values()).sort((a, b) => 
      b.updatedAt.getTime() - a.updatedAt.getTime()
    );
  }, []);

  // Full sync: download from cloud, merge with local, push back
  const syncChatSessions = useCallback(async (): Promise<LocalChatSession[]> => {
    if (!user || !token || syncInProgress.current) {
      return getStoredChatSessions();
    }

    syncInProgress.current = true;
    setIsSyncing(true);
    setSyncError(null);

    try {
      console.log('[ChatSync] Starting sync...');
      
      // Get local and cloud sessions
      const localSessions = getStoredChatSessions();
      const cloudSessions = await fetchCloudSessions();
      
      console.log(`[ChatSync] Local: ${localSessions.length}, Cloud: ${cloudSessions.length}`);
      
      // Merge (cloud takes priority for conflicts)
      const merged = mergeSessions(localSessions, cloudSessions);
      
      // Find sessions that need to be pushed to cloud
      const needsPush = merged.filter(session => {
        const cloudVersion = cloudSessions.find(c => c.id === session.id);
        return !cloudVersion || session.updatedAt > cloudVersion.updatedAt;
      });
      
      // Push updates to cloud
      if (needsPush.length > 0) {
        await pushToCloud(needsPush);
      }
      
      // Save merged result locally
      saveChatSessionsLocal(merged);
      
      const now = new Date();
      setLastSyncAt(now);
      setLastChatSyncTime(now);
      
      console.log(`[ChatSync] Sync complete. Total sessions: ${merged.length}`);
      return merged;
    } catch (error) {
      console.error('[ChatSync] Sync error:', error);
      setSyncError('Erro ao sincronizar conversas');
      return getStoredChatSessions();
    } finally {
      setIsSyncing(false);
      syncInProgress.current = false;
    }
  }, [user, token, fetchCloudSessions, mergeSessions, pushToCloud]);

  // Save a session (local + cloud if authenticated)
  const saveSession = useCallback(async (session: LocalChatSession) => {
    const sessions = getStoredChatSessions();
    const existingIndex = sessions.findIndex(s => s.id === session.id);
    
    if (existingIndex >= 0) {
      sessions[existingIndex] = session;
    } else {
      sessions.unshift(session);
    }
    
    saveChatSessionsLocal(sessions);
    
    // Push to cloud if authenticated
    if (user && token) {
      try {
        await pushToCloud([session]);
      } catch (error) {
        console.warn('[ChatSync] Error pushing session to cloud:', error);
      }
    }
    
    return sessions;
  }, [user, token, pushToCloud]);

  // Delete a session (local + cloud if authenticated)
  const deleteSession = useCallback(async (sessionId: string) => {
    const sessions = getStoredChatSessions().filter(s => s.id !== sessionId);
    saveChatSessionsLocal(sessions);
    
    // Delete from cloud if authenticated
    if (user && token) {
      try {
        await apiRequest('DELETE', `/api/sync/chat-sessions/${sessionId}`);
      } catch (error) {
        console.warn('[ChatSync] Error deleting session from cloud:', error);
      }
    }
    
    return sessions;
  }, [user, token]);

  // Get sessions (returns local, triggers sync if authenticated)
  const getSessions = useCallback((): LocalChatSession[] => {
    return getStoredChatSessions();
  }, []);

  // Auto-sync when user logs in
  useEffect(() => {
    if (user && token) {
      syncChatSessions();
    }
  }, [user, token]);

  return {
    isSyncing,
    lastSyncAt,
    syncError,
    syncChatSessions,
    saveSession,
    deleteSession,
    getSessions,
    isAuthenticated: !!user && !!token,
    deviceId,
  };
}
