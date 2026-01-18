import { createContext, useContext, type ReactNode } from 'react';
import { authViewModel } from '@repo/view-models/AuthViewModel';
import { useObservable } from '../hooks/useObservable';

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const isAuthenticated = useObservable(authViewModel.isAuthenticated$, false);
  const isLoading = useObservable(authViewModel.isLoading$, false);

  return <AuthContext.Provider value={{ isAuthenticated, isLoading }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
