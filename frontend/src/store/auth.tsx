'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

// ─── Types ────────────────────────────────────────────────
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'PM' | 'VIEWER';
  avatarUrl: string | null;
  microsoftId: string | null;
  procoreId: string | null;
  lastLoginAt: string | null;
}

export interface UserProject {
  id: string;
  name: string;
  code: string;
  status: string;
  procoreId: string | null;
  description: string | null;
  _count: { rfis: number; submittals: number };
}

export interface Integrations {
  microsoft: { provider: string; expiresAt: string; updatedAt: string } | null;
  procore:   { provider: string; expiresAt: string; updatedAt: string } | null;
}

interface AuthState {
  user: AuthUser | null;
  projects: UserProject[];
  integrations: Integrations;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  loginWithMicrosoft:  () => Promise<void>;
  loginWithProcore:    () => Promise<void>;
  loginWithEmail:      (email: string, password: string) => Promise<void>;
  registerWithEmail:   (email: string, name: string, password: string) => Promise<void>;
  logout:              () => void;
  refreshUser:         () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────
const AuthContext = createContext<AuthContextType>({
  user: null,
  projects: [],
  integrations: { microsoft: null, procore: null },
  accessToken: null,
  isLoading: true,
  isAuthenticated: false,
  loginWithMicrosoft:  async () => {},
  loginWithProcore:    async () => {},
  loginWithEmail:      async () => {},
  registerWithEmail:   async () => {},
  logout: () => {},
  refreshUser: async () => {},
});

// ─── Provider ─────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    projects: [],
    integrations: { microsoft: null, procore: null },
    accessToken: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('jaxi_token');
    if (stored) {
      fetchMe(stored);
    } else {
      setState(s => ({ ...s, isLoading: false }));
    }
  }, []);

  const fetchMe = useCallback(async (token: string) => {
    try {
      const res = await fetch(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        // Token invalid — clear it
        localStorage.removeItem('jaxi_token');
        setState(s => ({ ...s, isLoading: false, isAuthenticated: false, accessToken: null }));
        return;
      }

      const data = await res.json();
      setState({
        user:            data.user,
        projects:        data.projects,
        integrations:    data.integrations,
        accessToken:     token,
        isLoading:       false,
        isAuthenticated: true,
      });
    } catch {
      localStorage.removeItem('jaxi_token');
      setState(s => ({ ...s, isLoading: false, isAuthenticated: false }));
    }
  }, []);

  /** Redirect to Microsoft OAuth */
  const loginWithMicrosoft = useCallback(async () => {
    window.location.href = `${API}/auth/microsoft/connect`;
  }, []);

  /** Redirect to Procore OAuth */
  const loginWithProcore = useCallback(async () => {
    window.location.href = `${API}/auth/procore/connect`;
  }, []);

  /** Login with email + password */
  const loginWithEmail = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login fallido');
    localStorage.setItem('jaxi_token', data.token);
    await fetchMe(data.token);
    window.location.href = '/dashboard';
  }, [fetchMe]);

  /** Register with email + password */
  const registerWithEmail = useCallback(async (email: string, name: string, password: string) => {
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registro fallido');
    localStorage.setItem('jaxi_token', data.token);
    await fetchMe(data.token);
    window.location.href = '/dashboard';
  }, [fetchMe]);

  /** Handle token received from OAuth callback */
  const handleToken = useCallback((token: string) => {
    localStorage.setItem('jaxi_token', token);
    fetchMe(token);
  }, [fetchMe]);

  const logout = useCallback(() => {
    localStorage.removeItem('jaxi_token');
    localStorage.removeItem('jaxi_refresh');
    setState({
      user: null, projects: [], integrations: { microsoft: null, procore: null },
      accessToken: null, isLoading: false, isAuthenticated: false,
    });
    window.location.href = '/login';
  }, []);

  const refreshUser = useCallback(async () => {
    if (state.accessToken) await fetchMe(state.accessToken);
  }, [state.accessToken, fetchMe]);

  return (
    <AuthContext.Provider value={{ ...state, loginWithMicrosoft, loginWithProcore, loginWithEmail, registerWithEmail, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────
export function useAuth() {
  return useContext(AuthContext);
}

// ─── HOC for protected pages ──────────────────────────────
export function useRequireAuth() {
  const auth = useAuth();
  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      window.location.href = '/login';
    }
  }, [auth.isLoading, auth.isAuthenticated]);
  return auth;
}
