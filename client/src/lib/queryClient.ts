import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getDeviceId } from "@/hooks/use-device-id";

// API Base URL - uses environment variable in production, empty string for development (same origin)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Get full API URL
export function getApiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

// Get token from localStorage
function getAuthToken(): string | null {
  return localStorage.getItem('authToken');
}

// Set token in localStorage
export function setAuthToken(token: string) {
  localStorage.setItem('authToken', token);
}

// Remove token from localStorage
export function clearAuthToken() {
  localStorage.removeItem('authToken');
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

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const token = getAuthToken();
  const deviceId = getDeviceId();
  const headers: HeadersInit = data ? { "Content-Type": "application/json" } : {};
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  if (deviceId) {
    headers['x-device-id'] = deviceId;
  }

  const fullUrl = getApiUrl(url);
  const res = await fetch(fullUrl, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const token = getAuthToken();
    const deviceId = getDeviceId();
    const headers: HeadersInit = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (deviceId) {
      headers['x-device-id'] = deviceId;
    }

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
