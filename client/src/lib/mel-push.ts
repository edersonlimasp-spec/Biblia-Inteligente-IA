import { Capacitor } from "@capacitor/core";
import { pushDestinationSchema, type PushDestination } from "@shared/push";
import { apiRequest, getAuthToken } from "@/lib/queryClient";

export type MelPushDestination = PushDestination;

export type MelPushMessage = {
  userId: string;
  title: string;
  body: string;
  destination: MelPushDestination | null;
};

type PushDestinationListener = (destination: MelPushDestination) => void;
type PushMessageListener = (message: MelPushMessage) => void;

const optInKey = (userId: string) => `mel-push-opt-in:${userId}`;
const destinationListeners = new Map<PushDestinationListener, string>();
const messageListeners = new Map<PushMessageListener, string>();
const pendingDestinations: Array<{ userId: string; destination: MelPushDestination }> = [];
let firebaseMessagingPromise: Promise<typeof import("@capacitor-firebase/messaging").FirebaseMessaging> | null = null;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseDestination(value: unknown): MelPushDestination | null {
  if (typeof value === "string") {
    try {
      return parseDestination(JSON.parse(value));
    } catch {
      return null;
    }
  }
  const parsed = pushDestinationSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

function readNotificationData(data: unknown) {
  if (!isRecord(data)) return null;
  const userId = typeof data.userId === "string" ? data.userId : null;
  const destination = parseDestination(data.destination);
  return userId ? { userId, destination } : null;
}

export function melPushEnabledForUser(userId: string): boolean {
  try {
    return localStorage.getItem(optInKey(userId)) === "true";
  } catch {
    return false;
  }
}

export function subscribeToMelPushDestination(
  userId: string,
  listener: PushDestinationListener,
): () => void {
  destinationListeners.set(listener, userId);

  for (let index = pendingDestinations.length - 1; index >= 0; index -= 1) {
    if (pendingDestinations[index].userId !== userId) continue;
    const [{ destination }] = pendingDestinations.splice(index, 1);
    listener(destination);
  }

  return () => destinationListeners.delete(listener);
}

export function subscribeToMelPushMessage(userId: string, listener: PushMessageListener): () => void {
  messageListeners.set(listener, userId);
  return () => messageListeners.delete(listener);
}

export function publishMelPushAction(userId: string, data: unknown) {
  if (!userId) return;
  const payload = readNotificationData(data);
  if (!payload || payload.userId !== userId || !payload.destination) return;

  const listeners = Array.from(destinationListeners.entries())
    .filter(([, listenerUserId]) => listenerUserId === userId);
  if (listeners.length === 0) {
    pendingDestinations.push({ userId, destination: payload.destination });
    if (pendingDestinations.length > 4) pendingDestinations.shift();
    return;
  }
  for (const [listener] of listeners) listener(payload.destination);
}

export function publishMelPushMessage(userId: string, notification: unknown) {
  if (!userId || !isRecord(notification)) return;
  const data = readNotificationData(notification.data);
  const title = typeof notification.title === "string" ? notification.title.trim() : "";
  const body = typeof notification.body === "string" ? notification.body.trim() : "";
  if (!data || data.userId !== userId || (!title && !body)) return;

  const message: MelPushMessage = {
    userId,
    title: title || "Um recado da Mel",
    body,
    destination: data.destination,
  };
  for (const [listener, listenerUserId] of Array.from(messageListeners.entries())) {
    if (listenerUserId === userId) listener(message);
  }
}

async function loadFirebaseMessaging() {
  if (!Capacitor.isNativePlatform()) return null;
  firebaseMessagingPromise ??= import("@capacitor-firebase/messaging").then(
    ({ FirebaseMessaging }) => FirebaseMessaging,
  );
  try {
    return await firebaseMessagingPromise;
  } catch {
    firebaseMessagingPromise = null;
    return null;
  }
}

export async function unregisterMelPushForLogout(userId?: string): Promise<void> {
  if (!Capacitor.isNativePlatform() || !userId || !melPushEnabledForUser(userId)) return;

  const authTokenBeforeTokenLookup = getAuthToken();
  const messaging = await loadFirebaseMessaging();
  const token = await messaging?.getToken().catch(() => null);
  const sessionIsStillTheSame = getAuthToken() === authTokenBeforeTokenLookup;
  const removalRequest = token?.token && sessionIsStillTheSame
    ? apiRequest("DELETE", "/api/push/tokens", { token: token.token }).catch(() => undefined)
    : Promise.resolve(undefined);

  try {
    localStorage.removeItem(optInKey(userId));
  } catch {
    // Push consent is device-local and must never prevent sign-out.
  }

  // A slow/offline endpoint must never block sign-out or leave the device
  // subscribed locally. If the server removal cannot be delivered, FCM drops
  // this now-invalid registration token on the next send attempt.
  await Promise.race([
    messaging?.deleteToken().catch(() => undefined) ?? Promise.resolve(),
    new Promise((resolve) => setTimeout(resolve, 750)),
  ]);
  await Promise.race([
    removalRequest,
    new Promise((resolve) => setTimeout(resolve, 750)),
  ]);
}