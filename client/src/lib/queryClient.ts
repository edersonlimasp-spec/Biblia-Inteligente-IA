import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getDeviceId } from "@/hooks/use-device-id";
import { Capacitor } from "@capacitor/core";

// API Base URL
// - Web: empty string (same origin as the page)
// - Capacitor native (Android/iOS): production URL, since the WebView serves
//   bundled HTML from a local origin that has no API server.
// - Override via VITE_API_BASE_URL if needed (e.g. staging).
const PRODUCTION_API_URL = 'https://bibliainteligente.replit.app';
const isNative =
  typeof Capacitor !== 'undefined' &&
  typeof Capacitor.getPlatform === 'function' &&
  (Capacitor.getPlatform() === 'android' || Capacitor.getPlatform() === 'ios');
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || (isNative ? PRODUCTION_API_URL : '');

// Get full API URL
export function getApiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

// localStorage.setItem is synchronous. Read the persisted source for every
// request so React state or an in-memory mirror can never race or drift.
export function getAuthToken(): string | null {
  return localStorage.getItem('authToken');
}

// Set token in localStorage
export function setAuthToken(token: string) {
  localStorage.setItem('authToken', token);
  lastFailedRevalidationToken = null;
}

// Remove token from localStorage
export function clearAuthToken() {
  localStorage.removeItem('authToken');
}

// Authorization headers for plain fetch() calls (auth is via Bearer token, not cookie)
export function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const platform = Capacitor.getPlatform();
  if (isNative && (platform === 'android' || platform === 'ios')) {
    headers['x-client-platform'] = platform;
  }
  const token = getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

// Custom error class to preserve response data
export class ApiError extends Error {
  status: number;
  data: any;
  
  constructor(status: number, data: any) {
    super(`API Error: ${status}`);
    this.status = status;
    this.data = data;
    this.name = 'ApiError';
  }
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let data;
    try {
      data = await res.json();
    } catch {
      data = { error: res.statusText };
    }
    throw new ApiError(res.status, data);
  }
}

// Sends X-Client-Platform header so the server can enforce platform-specific
// subscription source rules (Google Play Policy compliance).
function addPlatformHeader(headers: Record<string, string>) {
  const platform = Capacitor.getPlatform();
  if (platform === 'android' || platform === 'ios') {
    headers['x-client-platform'] = platform;
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const token = getAuthToken();
  const deviceId = getDeviceId();
  const headers: Record<string, string> = data ? { "Content-Type": "application/json" } : {};
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  if (deviceId) {
    headers['x-device-id'] = deviceId;
  }

  addPlatformHeader(headers);

  const fullUrl = getApiUrl(url);
  const res = await fetch(fullUrl, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
    // Authenticated API responses must never be satisfied with a bodyless 304.
    // Native startup parses /api/auth/me as JSON; a cached 304 would otherwise
    // be mistaken for an invalid session and clear the valid JWT.
    cache: "no-store",
  });

  await throwIfResNotOk(res);
  return res;
}

let authRevalidationPromise: Promise<boolean> | null = null;
let lastFailedRevalidationToken: string | null = null;

async function revalidatePersistedAuthToken(): Promise<boolean> {
  const currentToken = getAuthToken();
  if (!currentToken || lastFailedRevalidationToken === currentToken) return false;
  if (authRevalidationPromise) return authRevalidationPromise;

  authRevalidationPromise = (async () => {
    const headers = getAuthHeaders();
    const deviceId = getDeviceId();
    if (deviceId) headers['x-device-id'] = deviceId;

    try {
      const response = await fetch(getApiUrl('/api/auth/me'), {
        method: 'GET',
        headers,
        credentials: 'include',
        cache: 'no-store',
      });
      if (!response.ok) {
        lastFailedRevalidationToken = currentToken;
        return false;
      }
      // A logout or different login may have happened while the session check
      // was in flight. Do not replay the failed request under another identity.
      if (getAuthToken() !== currentToken) return false;
      lastFailedRevalidationToken = null;
      return true;
    } catch {
      lastFailedRevalidationToken = currentToken;
      return false;
    }
  })().finally(() => {
    authRevalidationPromise = null;
  });

  return authRevalidationPromise;
}

/**
 * Authenticated request with exactly one silent session check after a 401.
 * Intended for user-triggered reads such as Strong; it never retries twice.
 */
export async function apiRequestWithAuthRetry(
  method: string,
  url: string,
  data?: unknown,
): Promise<Response> {
  try {
    return await apiRequest(method, url, data);
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) throw error;
    if (!await revalidatePersistedAuthToken()) throw error;
    return apiRequest(method, url, data);
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
  const token = getAuthToken();
    const deviceId = getDeviceId();
    const headers: Record<string, string> = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (deviceId) {
      headers['x-device-id'] = deviceId;
    }

    addPlatformHeader(headers);

    const path = queryKey.join("/") as string;
    const fullUrl = getApiUrl(path);
    const res = await fetch(fullUrl, {
      credentials: "include",
      headers,
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // Default 5 minutes - faster Bible loading with cache
      gcTime: 1000 * 60 * 30, // 30 minute garbage collection
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
