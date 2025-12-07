import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { setAuthToken, clearAuthToken, apiRequest } from '@/lib/queryClient';
import type { User } from '@shared/schema';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, deviceId?: string) => Promise<void>;
  logout: () => void;
  trialActive: boolean;
  trialDaysRemaining: number;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('authToken'));
  const [isLoading, setIsLoading] = useState(true);
  const [trialActive, setTrialActive] = useState(false);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState(0);

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('authToken');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      // CRITICAL: Set token in both state AND localStorage so apiRequest can use it
      setAuthToken(storedToken);
      setToken(storedToken);

      try {
        const res = await apiRequest('GET', '/api/auth/me');
        const data = await res.json();
        setUser(data.user);
        setTrialActive(data.trial.active);
        setTrialDaysRemaining(data.trial.daysRemaining);
      } catch (error) {
        console.error('Auth check failed:', error);
        clearAuthToken();
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiRequest('POST', '/api/auth/login', { email, password });
    const data = await res.json();
    
    setAuthToken(data.token);
    setToken(data.token);
    setUser(data.user);
    setTrialActive(data.trial.active);
    setTrialDaysRemaining(data.trial.daysRemaining);
  };

  const register = async (name: string, email: string, password: string, deviceId?: string) => {
    const res = await apiRequest('POST', '/api/auth/register', { name, email, password, deviceId });
    const data = await res.json();
    
    setAuthToken(data.token);
    setToken(data.token);
    setUser(data.user);
    setTrialActive(data.trial.active);
    setTrialDaysRemaining(data.trial.daysRemaining);
  };

  const logout = () => {
    clearAuthToken();
    setToken(null);
    setUser(null);
    setTrialActive(false);
    setTrialDaysRemaining(0);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      isLoading, 
      login, 
      register, 
      logout, 
      trialActive, 
      trialDaysRemaining,
      isAdmin: user?.role === 'admin' || user?.role === 'super_admin',
      isSuperAdmin: user?.role === 'super_admin',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
