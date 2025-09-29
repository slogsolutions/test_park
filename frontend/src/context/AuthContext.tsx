// src/context/AuthContext.tsx
import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import { AuthState, User } from '../types/auth';
import { authService } from '../services/auth.service';
import api from '../utils/api';

// small debug flag - set false in production
const DEBUG = true;

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<{ user?: User }>;
  logout: () => Promise<void>;
  googleLogin: (credential: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,
};

type AuthAction =
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_FAIL'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING' };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return { ...state, isAuthenticated: true, user: action.payload, loading: false, error: null };
    case 'LOGIN_FAIL':
      return { ...state, isAuthenticated: false, user: null, loading: false, error: action.payload };
    case 'LOGOUT':
      return { ...state, isAuthenticated: false, user: null, loading: false, error: null };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'SET_LOADING':
      return { ...state, loading: true };
    default:
      return state;
  }
}

/* ---------- RN bridge helpers (unchanged but slightly cleaner) ---------- */

function normalizeUserForRN(raw: any) {
  if (!raw || typeof raw !== 'object') return null;
  const id = raw.id ?? raw._id ?? raw.userId ?? raw.uid ?? null;
  if (!id) return null;
  return { id: String(id), email: raw.email ?? raw.mail ?? null, name: raw.name ?? raw.fullName ?? null };
}

function sendUserToRN(user: any, tries = 8, delay = 250) {
  if (typeof window === 'undefined') return;

  if (!user) {
    try {
      if ((window as any).ReactNativeWebView?.postMessage) {
        (window as any).ReactNativeWebView.postMessage(JSON.stringify({ type: 'USER_INFO', user: null }));
        if (DEBUG) console.log('[WEB DEBUG] Sent USER_INFO (null) to RN');
      }
    } catch (e) {
      if (DEBUG) console.warn('[WEB DEBUG] Error sending null USER_INFO', e);
    }
    return;
  }

  const normalized = normalizeUserForRN(user);
  if (DEBUG) console.log('[WEB DEBUG] sendUserToRN normalized:', normalized);
  if (!normalized) {
    if (DEBUG) console.log('[WEB DEBUG] No usable id in user object; not sending to RN.');
    return;
  }

  const payload = JSON.stringify({ type: 'USER_INFO', user: normalized });
  const bridgeReady = !!(window as any).ReactNativeWebView?.postMessage;
  const rnFlag = !!(window as any).__IS_RN_WEBVIEW;
  const ua = (navigator as any)?.userAgent ?? '';
  const looksLikeWebView = /wv|Android.*WebView|ReactNative/i.test(ua);

  if (!bridgeReady && !rnFlag && !looksLikeWebView) {
    if (DEBUG) console.log('[WEB DEBUG] Looks like a regular browser -> skipping sendUserToRN');
    return;
  }

  let attempts = tries;
  const attempt = () => {
    try {
      if ((window as any).ReactNativeWebView?.postMessage) {
        (window as any).ReactNativeWebView.postMessage(payload);
        if (DEBUG) console.log('[WEB DEBUG] postMessage -> payload sent to RN');
        return;
      } else {
        if (DEBUG) console.log('[WEB DEBUG] ReactNativeWebView.postMessage not ready. attempts left=', attempts - 1);
      }
    } catch (e) {
      if (DEBUG) console.warn('[WEB DEBUG] postMessage threw', e);
    }
    attempts--;
    if (attempts > 0) setTimeout(attempt, delay);
    else if (DEBUG) console.log('[WEB DEBUG] Could not send USER_INFO to RN after retries.');
  };
  attempt();
}

function setGlobalUserForRN(user: any | null) {
  try {
    if (typeof window === 'undefined') return;
    if (!user) {
      (window as any).__CURRENT_USER_FOR_RN = null;
      (window as any).sendUserToRN = (u?: any) => sendUserToRN(u ?? null);
      if (DEBUG) console.log('[WEB DEBUG] Cleared __CURRENT_USER_FOR_RN');
      return;
    }
    const normalized = normalizeUserForRN(user);
    (window as any).__CURRENT_USER_FOR_RN = normalized;
    (window as any).sendUserToRN = (u?: any) => sendUserToRN(u ?? (window as any).__CURRENT_USER_FOR_RN);
    if (DEBUG) console.log('[WEB DEBUG] set __CURRENT_USER_FOR_RN', normalized);
  } catch (e) {
    if (DEBUG) console.warn('[WEB DEBUG] setGlobalUserForRN error', e);
  }
}

/* ---------------------- AuthProvider implementation --------------------- */

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(authReducer, initialState);

  // check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      dispatch({ type: 'SET_LOADING' });
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const user = (await authService.getMe()) as any;
          dispatch({ type: 'LOGIN_SUCCESS', payload: user });
          setGlobalUserForRN(user);
          sendUserToRN(user);
        } catch (error) {
          if (DEBUG) console.warn('[WEB DEBUG] getMe failed:', error);
          localStorage.removeItem('token');
          dispatch({ type: 'LOGIN_FAIL', payload: 'Session expired' });
          setGlobalUserForRN(null);
        }
      } else {
        dispatch({ type: 'LOGOUT' });
        setGlobalUserForRN(null);
      }
    };
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    dispatch({ type: 'SET_LOADING' });
    try {
      const data = (await authService.login(email, password)) as { token: string; user: any };
      // don't log tokens in production
      if (!data?.token || !data?.user) throw new Error('Invalid login response from server');
      localStorage.setItem('token', data.token);
      dispatch({ type: 'LOGIN_SUCCESS', payload: data.user });
      setGlobalUserForRN(data.user);
      sendUserToRN(data.user);
    } catch (error: any) {
      if (DEBUG) console.warn('[WEB DEBUG] login failed:', error);
      const message = error?.response?.data?.message || error?.message || 'Login failed';
      dispatch({ type: 'LOGIN_FAIL', payload: message });
      setGlobalUserForRN(null);
      throw new Error(message);
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    dispatch({ type: 'SET_LOADING' });
    try {
      const data = (await authService.register(name, email, password)) as { user?: any };
      if (data?.user) {
        dispatch({ type: 'LOGIN_SUCCESS', payload: data.user });
        setGlobalUserForRN(data.user);
        sendUserToRN(data.user);
      } else {
        dispatch({ type: 'LOGIN_FAIL', payload: 'Registration returned no user' });
        setGlobalUserForRN(null);
      }
      return data;
    } catch (error: any) {
      if (DEBUG) console.warn('[WEB DEBUG] register failed:', error);
      const message = error?.response?.data?.message || error?.message || 'Registration failed';
      dispatch({ type: 'LOGIN_FAIL', payload: message });
      setGlobalUserForRN(null);
      throw new Error(message);
    }
  }, []);

  const googleLogin = useCallback(async (credential: string) => {
    dispatch({ type: 'SET_LOADING' });
    try {
      const data = (await authService.googleLogin(credential)) as { token: string; user: any };
      if (!data?.token || !data?.user) throw new Error('Invalid google login response');
      localStorage.setItem('token', data.token);
      dispatch({ type: 'LOGIN_SUCCESS', payload: data.user });
      setGlobalUserForRN(data.user);
      sendUserToRN(data.user);
    } catch (error: any) {
      if (DEBUG) console.warn('[WEB DEBUG] googleLogin failed:', error);
      const message = error?.response?.data?.message || error?.message || 'Google login failed';
      dispatch({ type: 'LOGIN_FAIL', payload: message });
      setGlobalUserForRN(null);
      throw new Error(message);
    }
  }, []);

  const logout = useCallback(async () => {
    // gracefully attempt to remove fcm token on backend (if present)
    try {
      const token = localStorage.getItem('fcm_token');
      if (token) {
        await api.delete('/users/remove-token', { data: { fcmToken: token } } as any);
        localStorage.removeItem('fcm_token');
      }
    } catch (err) {
      if (DEBUG) console.warn('[WEB DEBUG] remove fcm token failed on logout', err);
    }

    localStorage.removeItem('token');
    dispatch({ type: 'LOGOUT' });
    setGlobalUserForRN(null);

    try {
      if ((window as any).ReactNativeWebView?.postMessage) {
        (window as any).ReactNativeWebView.postMessage(JSON.stringify({ type: 'USER_INFO', user: null }));
        if (DEBUG) console.log('[WEB DEBUG] Sent USER_INFO(null) on logout to RN');
      } else {
        if (DEBUG) console.log('[WEB DEBUG] ReactNativeWebView not available at logout time');
      }
    } catch (e) {
      if (DEBUG) console.warn('[WEB DEBUG] error sending logout USER_INFO to RN', e);
    }
  }, []);

  const setUser = useCallback((user: User | null) => {
    if (user) {
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
      setGlobalUserForRN(user);
      sendUserToRN(user);
    } else {
      dispatch({ type: 'LOGOUT' });
      setGlobalUserForRN(null);
      sendUserToRN(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    dispatch({ type: 'SET_LOADING' });
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        dispatch({ type: 'LOGOUT' });
        setGlobalUserForRN(null);
        return;
      }
      const user = (await authService.getMe()) as any;
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
      setGlobalUserForRN(user);
      sendUserToRN(user);
    } catch (error) {
      if (DEBUG) console.error('[WEB DEBUG] refreshUser failed', error);
      localStorage.removeItem('token');
      dispatch({ type: 'LOGOUT' });
      setGlobalUserForRN(null);
      sendUserToRN(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      login,
      register,
      logout,
      googleLogin,
      refreshUser,
      setUser,
    }),
    [state, login, register, logout, googleLogin, refreshUser, setUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
