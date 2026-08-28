import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useAuth as useClerkAuth, useClerk, useUser } from "@clerk/react";
import { clearAuthToken, setAuthToken, apiRequest, queryClient, ApiError } from "@/lib/queryClient";
import { signInWithGoogle, isFirebaseConfigured } from "@/lib/firebase";
import { signInWithApple, isAppleSignInAvailable } from "@/lib/appleSignIn";
import { isIOS, isNative } from "@/lib/capacitor";
import { syncLocalCompletionsToServer, migrateDeviceStudyProgressToAccount } from "@/lib/completions";
import type { User } from "@shared/schema";

interface AuthContextType {
  user: User | null; token: string | null; isLoading: boolean; accessDenied: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>; loginWithApple: () => Promise<void>;
  register: (name: string, email: string, password: string, deviceId?: string) => Promise<void>;
  logout: () => Promise<void>; trialActive: boolean; trialDaysRemaining: number;
  isAdmin: boolean; isSuperAdmin: boolean; isGoogleLoginAvailable: boolean; isAppleLoginAvailable: boolean;
}
const AuthContext = createContext<AuthContextType | null>(null);
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function authValue(user: User | null, token: string | null, isLoading: boolean, accessDenied: boolean, trialActive: boolean, trialDaysRemaining: number, actions: Pick<AuthContextType, "login" | "loginWithGoogle" | "loginWithApple" | "register" | "logout">): AuthContextType {
  return {
    user, token, isLoading, accessDenied, trialActive, trialDaysRemaining, ...actions,
    isAdmin: user?.role === "admin" || user?.role === "super_admin",
    isSuperAdmin: user?.role === "super_admin",
    isGoogleLoginAvailable: isFirebaseConfigured() && !isIOS,
    isAppleLoginAvailable: isAppleSignInAvailable(),
  };
}

/** Native remains on the existing JWT transport and deliberately has no Clerk hooks. */
function NativeAuthProviderContent({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("authToken"));
  const [isLoading, setIsLoading] = useState(true);
  const [trialActive, setTrialActive] = useState(false);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState(0);
  const apply = (data: any) => {
    setUser(data.user); setTrialActive(Boolean(data.trial?.active)); setTrialDaysRemaining(data.trial?.daysRemaining ?? 0);
    syncLocalCompletionsToServer(); migrateDeviceStudyProgressToAccount();
    queryClient.invalidateQueries({ predicate: q => String(q.queryKey[0]).startsWith("/api/library") });
  };
  useEffect(() => {
    const check = async () => {
      const stored = localStorage.getItem("authToken");
      if (!stored) { setIsLoading(false); return; }
      setAuthToken(stored); setToken(stored);
      try { apply(await (await apiRequest("GET", "/api/auth/me")).json()); }
      catch (error) { console.error("Auth check failed:", error); clearAuthToken(); setToken(null); setUser(null); }
      finally { setIsLoading(false); }
    };
    check();
  }, []);
  useEffect(() => {
    const onOnline = () => {
      if (localStorage.getItem("authToken")) { syncLocalCompletionsToServer(); migrateDeviceStudyProgressToAccount(); }
    };
    window.addEventListener("online", onOnline); return () => window.removeEventListener("online", onOnline);
  }, []);
  const login = async (email: string, password: string) => {
    const data = await (await apiRequest("POST", "/api/auth/login", { email, password })).json();
    setAuthToken(data.token); setToken(data.token); apply(data);
  };
  const register = async (name: string, email: string, password: string, deviceId?: string) => {
    const data = await (await apiRequest("POST", "/api/auth/register", { name, email, password, deviceId })).json();
    setAuthToken(data.token); setToken(data.token); apply(data);
  };
  const loginWithGoogle = async () => {
    const result = await signInWithGoogle(); if (!result) return;
    const data = await (await apiRequest("POST", "/api/auth/google", { idToken: result.idToken, deviceId: localStorage.getItem("deviceId") || undefined })).json();
    setAuthToken(data.token); setToken(data.token); apply(data);
  };
  const loginWithApple = async () => {
    const result = await signInWithApple();
    const data = await (await apiRequest("POST", "/api/auth/apple", { ...result, deviceId: localStorage.getItem("deviceId") || undefined })).json();
    setAuthToken(data.token); setToken(data.token); apply(data);
  };
  const logout = async () => {
    clearAuthToken(); setToken(null); setUser(null); setTrialActive(false); setTrialDaysRemaining(0); queryClient.clear();
  };
  return <AuthContext.Provider value={authValue(user, token, isLoading, false, trialActive, trialDaysRemaining, { login, register, loginWithGoogle, loginWithApple, logout })}>{children}</AuthContext.Provider>;
}

/** Web overlays Clerk identity on the local application's authorization row. */
function WebAuthProviderContent({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useClerkAuth();
  const { user: clerkUser, isLoaded: isUserLoaded } = useUser();
  const { signOut, redirectToSignIn, redirectToSignUp } = useClerk();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [trialActive, setTrialActive] = useState(false);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState(0);
  const apply = (data: any) => {
    setUser({ ...data.user, name: [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") || clerkUser?.username || data.user?.name, email: clerkUser?.primaryEmailAddress?.emailAddress ?? data.user?.email, firstName: clerkUser?.firstName ?? data.user?.firstName, lastName: clerkUser?.lastName ?? data.user?.lastName, profileImageUrl: clerkUser?.imageUrl ?? data.user?.profileImageUrl });
    setTrialActive(Boolean(data.trial?.active)); setTrialDaysRemaining(data.trial?.daysRemaining ?? 0);
    syncLocalCompletionsToServer(); migrateDeviceStudyProgressToAccount();
    queryClient.invalidateQueries({ predicate: q => String(q.queryKey[0]).startsWith("/api/library") });
  };
  useEffect(() => {
    const check = async () => {
      clearAuthToken();
      if (!isLoaded || !isUserLoaded) return;
      if (!isSignedIn) { setUser(null); setAccessDenied(false); setIsLoading(false); return; }
      try { apply(await (await apiRequest("GET", "/api/auth/me")).json()); setAccessDenied(false); }
      catch (error) {
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) { setAccessDenied(true); setUser(null); }
        else console.error("Falha ao carregar a conta:", error);
      } finally { setIsLoading(false); }
    };
    check();
  }, [isLoaded, isSignedIn, isUserLoaded, clerkUser]);
  useEffect(() => {
    const onOnline = () => { if (user) { syncLocalCompletionsToServer(); migrateDeviceStudyProgressToAccount(); } };
    window.addEventListener("online", onOnline); return () => window.removeEventListener("online", onOnline);
  }, [user]);
  const login = async () => { await redirectToSignIn({ redirectUrl: basePath || "/" }); };
  const register = async () => { await redirectToSignUp({ redirectUrl: basePath || "/" }); };
  const loginWithGoogle = login;
  const loginWithApple = login;
  const logout = async () => {
    clearAuthToken(); setUser(null); setAccessDenied(false); setTrialActive(false); setTrialDaysRemaining(0); queryClient.clear();
    await signOut({ redirectUrl: basePath || "/" });
  };
  return <AuthContext.Provider value={authValue(user, null, isLoading, accessDenied, trialActive, trialDaysRemaining, { login, register, loginWithGoogle, loginWithApple, logout })}>{children}</AuthContext.Provider>;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return isNative ? <NativeAuthProviderContent>{children}</NativeAuthProviderContent> : <WebAuthProviderContent>{children}</WebAuthProviderContent>;
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}