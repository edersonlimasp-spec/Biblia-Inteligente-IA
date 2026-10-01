import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Capacitor } from "@capacitor/core";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import {
  melPushEnabledForUser,
  publishMelPushAction,
  publishMelPushMessage,
} from "@/lib/mel-push";

type PushSyncState = "idle" | "registering" | "enabled" | "error";

type MelPushValue = {
  isNative: boolean;
  isEnabled: boolean;
  isRegistering: boolean;
  isRegistered: boolean;
  pushError: string | null;
  enablePush: () => Promise<boolean>;
  retry: () => Promise<boolean>;
};

const MelPushContext = createContext<MelPushValue | null>(null);

type PushSession = { userId: string; authToken: string | null; generation: number };

function snapshotPushSession(
  current: { userId: string | undefined; authToken: string | null; generation: number },
): PushSession | null {
  if (!current.userId) return null;
  return { ...current, userId: current.userId };
}

function useMelPushController(): MelPushValue {
  const { user, token: authToken, isLoading: authLoading } = useAuth();
  const isNative = Capacitor.isNativePlatform();
  const userId = user?.id;
  const sessionRef = useRef({ userId, authToken, generation: 0 });
  const registrationPromisesRef = useRef(new Map<string, Promise<boolean>>());

  if (sessionRef.current.userId !== userId || sessionRef.current.authToken !== authToken) {
    sessionRef.current = {
      userId,
      authToken,
      generation: sessionRef.current.generation + 1,
    };
  }

  const [syncState, setSyncState] = useState<PushSyncState>("idle");
  const [pushError, setPushError] = useState<string | null>(null);
  const enabled = isNative && !!userId && melPushEnabledForUser(userId);

  const registerToken = useCallback((
    tokenValue: string,
    session: PushSession,
  ): Promise<boolean> => {
    if (
      !session.userId ||
      sessionRef.current.generation !== session.generation ||
      !melPushEnabledForUser(session.userId)
    ) return Promise.resolve(false);

    const key = `${session.generation}:${tokenValue}`;
    const existingRequest = registrationPromisesRef.current.get(key);
    if (existingRequest) return existingRequest;

    const request = (async () => {
      try {
        await apiRequest("POST", "/api/push/tokens", {
          token: tokenValue,
          platform: Capacitor.getPlatform(),
        });
        if (sessionRef.current.generation !== session.generation) return false;
        setSyncState("enabled");
        setPushError(null);
        return true;
      } catch {
        if (sessionRef.current.generation === session.generation) {
          setSyncState("error");
          setPushError("Não foi possível registrar este aparelho. Tente novamente.");
        }
        return false;
      }
    })().finally(() => registrationPromisesRef.current.delete(key));
    registrationPromisesRef.current.set(key, request);
    return request;
  }, []);

  useEffect(() => {
    if (!isNative) return;

    let cancelled = false;
    let listeners: Array<{ remove: () => Promise<void> }> = [];

    const listen = async () => {
      try {
        const { FirebaseMessaging } = await import("@capacitor-firebase/messaging");
        if (cancelled) return;

        if (Capacitor.getPlatform() === "android") {
          await FirebaseMessaging.createChannel({
            id: "mel-reminders",
            name: "Lembretes da Mel",
            description: "Recados e lembretes bíblicos da Mel",
            importance: 3,
            sound: "default",
            vibration: true,
          }).catch(() => undefined);
        }

        const [actionHandle, receivedHandle, tokenHandle] = await Promise.all([
          FirebaseMessaging.addListener("notificationActionPerformed", (event) => {
            const currentUserId = sessionRef.current.userId;
            if (!currentUserId) return;
            publishMelPushAction(currentUserId, event.notification.data);
          }),
          FirebaseMessaging.addListener("notificationReceived", (event) => {
            const currentUserId = sessionRef.current.userId;
            if (!currentUserId) return;
            publishMelPushMessage(currentUserId, event.notification);
          }),
          FirebaseMessaging.addListener("tokenReceived", (event) => {
            const session = snapshotPushSession(sessionRef.current);
            if (!session || !melPushEnabledForUser(session.userId)) return;
            void registerToken(event.token, session);
          }),
        ]);
        if (cancelled) {
          await Promise.all([actionHandle.remove(), receivedHandle.remove(), tokenHandle.remove()]);
          return;
        }
        listeners = [actionHandle, receivedHandle, tokenHandle];
      } catch {
        // A missing native Firebase config, plugin registration or service does
        // not prevent sign-in, reading or any of the app's other features.
      }
    };

    void listen();
    return () => {
      cancelled = true;
      for (const listener of listeners) void listener.remove().catch(() => undefined);
    };
  }, [registerToken]);

  useEffect(() => {
    setSyncState("idle");
    setPushError(null);
  }, [userId]);

  useEffect(() => {
    if (!isNative || authLoading || !userId || !enabled) return;
    const session = snapshotPushSession(sessionRef.current);
    if (!session) return;
    let cancelled = false;

    const syncSavedConsent = async () => {
      setSyncState("registering");
      try {
        const { FirebaseMessaging } = await import("@capacitor-firebase/messaging");
        const permission = await FirebaseMessaging.checkPermissions();
        if (cancelled || sessionRef.current.generation !== session.generation) return;
        if (permission.receive !== "granted") {
          setSyncState("idle");
          return;
        }
        const result = await FirebaseMessaging.getToken();
        if (!cancelled) await registerToken(result.token, session);
      } catch {
        if (!cancelled && sessionRef.current.generation === session.generation) {
          setSyncState("error");
          setPushError("Não foi possível atualizar este aparelho. Tente novamente.");
        }
      }
    };

    void syncSavedConsent();
    return () => {
      cancelled = true;
    };
  }, [authLoading, enabled, registerToken, userId]);

  const enablePush = useCallback(async () => {
    if (!isNative || !userId || authLoading) {
      throw new Error("Entre na sua conta em um aparelho Android ou iOS para ativar os lembretes.");
    }
    const session = snapshotPushSession(sessionRef.current);
    if (!session) return false;
    setSyncState("registering");
    setPushError(null);

    try {
      const { FirebaseMessaging } = await import("@capacitor-firebase/messaging");
      if (sessionRef.current.generation !== session.generation) return false;

      const currentPermission = await FirebaseMessaging.checkPermissions();
      const permission = currentPermission.receive === "granted"
        ? currentPermission
        : await FirebaseMessaging.requestPermissions();
      if (permission.receive !== "granted") {
        setSyncState("error");
        setPushError("A permissão não foi concedida. Você pode ativá-la nas configurações do aparelho.");
        return false;
      }

      if (Capacitor.getPlatform() === "android") {
        await FirebaseMessaging.createChannel({
          id: "mel-reminders",
          name: "Lembretes da Mel",
          description: "Recados e lembretes bíblicos da Mel",
          importance: 3,
          sound: "default",
          vibration: true,
        });
      }
      if (sessionRef.current.generation !== session.generation) return false;

      try {
        localStorage.setItem(`mel-push-opt-in:${session.userId}`, "true");
      } catch {
        // Continue with the explicitly requested activation for this session.
      }

      const tokenResult = await FirebaseMessaging.getToken();
      if (sessionRef.current.generation !== session.generation) return false;
      const registered = await registerToken(tokenResult.token, session);
      if (!registered && sessionRef.current.generation === session.generation) {
        setPushError("A permissão foi concedida, mas não foi possível registrar o aparelho. Tente novamente.");
      }
      return registered;
    } catch {
      if (sessionRef.current.generation === session.generation) {
        setSyncState("error");
        setPushError("Não foi possível ativar os lembretes neste aparelho.");
      }
      return false;
    }
  }, [authLoading, registerToken, userId]);

  const retry = useCallback(async () => {
    if (!isNative || !userId) return false;
    const session = snapshotPushSession(sessionRef.current);
    if (!session) return false;
    try {
      const { FirebaseMessaging } = await import("@capacitor-firebase/messaging");
      const permission = await FirebaseMessaging.checkPermissions();
      if (permission.receive !== "granted") {
        setSyncState("error");
        setPushError("Ative as notificações da Mel nas configurações do aparelho e tente novamente.");
        return false;
      }
      const result = await FirebaseMessaging.getToken();
      return registerToken(result.token, session);
    } catch {
      setSyncState("error");
      setPushError("Não foi possível atualizar este aparelho. Tente novamente.");
      return false;
    }
  }, [registerToken, userId]);

  return {
    isNative,
    isEnabled: enabled,
    isRegistering: syncState === "registering",
    isRegistered: syncState === "enabled" && enabled,
    pushError,
    enablePush,
    retry,
  };
}

export function MelPushProvider({ children }: { children: ReactNode }) {
  const value = useMelPushController();
  return createElement(MelPushContext.Provider, { value }, children);
}

export function useMelPush() {
  const context = useContext(MelPushContext);
  if (!context) throw new Error("useMelPush must be used within MelPushProvider");
  return context;
}