// src/context/AuthContext.tsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { AuthState, User } from '../types/auth';
import { authService } from '../services/auth.service';
import axios from "axios";
import api from '../utils/api';
import { toast } from 'react-toastify';


interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
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
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload,
        loading: false,
        error: null,
      };
    case 'LOGIN_FAIL':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        loading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: true,
      };
    default:
      return state;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // ✅ Always fetch fresh user from backend
          const user = await authService.getMe();
          dispatch({ type: 'LOGIN_SUCCESS', payload: user });
        } catch (error) {
          localStorage.removeItem('token');
          dispatch({ type: 'LOGIN_FAIL', payload: 'Session expired' });
        }
      } else {
        dispatch({ type: 'LOGIN_FAIL', payload: '' });
      }
    };
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const data = await authService.login(email, password);
      localStorage.setItem('token', data.token);

      // ✅ Re-fetch latest user to ensure kycStatus is up-to-date
      const freshUser = await authService.getMe();
      dispatch({ type: 'LOGIN_SUCCESS', payload: freshUser });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed';
      dispatch({ type: 'LOGIN_FAIL', payload: message });
      throw message;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const data = await authService.register(name, email, password);

      // ✅ Ensure newly registered user state is fresh
      const freshUser = await authService.getMe();
      dispatch({ type: 'LOGIN_SUCCESS', payload: freshUser });

      return data;
    } catch (error: any) {
  const message = error.response?.data?.message || 'Registration failed';
  dispatch({ type: 'LOGIN_FAIL', payload: message });
  // Throw an Error object so callers can read `.message`
  throw new Error(message);
}

  };

  const googleLogin = async (credential: string) => {
    try {
      const data = await authService.googleLogin(credential);
      localStorage.setItem('token', data.token);

      // ✅ Refresh after Google login as well
      const freshUser = await authService.getMe();
      dispatch({ type: 'LOGIN_SUCCESS', payload: freshUser });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Google login failed';
      dispatch({ type: 'LOGIN_FAIL', payload: message });
      throw message;
    }
  };

  const logout = async () => {
    const token = localStorage.getItem("fcm_token");
    if (token) {
      await api.delete("/users/remove-token", { data: { fcmToken: token }} as any);
      localStorage.removeItem("fcm_token");
    }
    localStorage.removeItem('token');
    dispatch({ type: 'LOGOUT' });
  };

  // ✅ Manual setter to immediately store a new user object in state (used after edits/KYC)
  const setUser = (user: User | null) => {
    if (user) {
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
    } else {
      dispatch({ type: 'LOGOUT' });
    }
  };

  // ✅ Refresh user from server (used after KYC submission/approval)
  const refreshUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        dispatch({ type: 'LOGOUT' });
        return;
      }
      const user = await authService.getMe();
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
    } catch (error) {
      console.error("refreshUser failed", error);
      localStorage.removeItem('token');
      dispatch({ type: 'LOGOUT' });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        googleLogin,
        refreshUser,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
