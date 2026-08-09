import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import * as authApi from './api';
import { getRefreshToken, setAccessToken, setRefreshToken } from '@/lib/tokenStore';
import { connectNotificationSocket, disconnectNotificationSocket } from '@/lib/notificationSocket';
import { notificationKeys } from '@/features/notifications/hooks';
import { useToast } from '@/components/ui';
import type { User } from '@/types';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  useEffect(() => {
    if (!user) {
      disconnectNotificationSocket();
      return;
    }

    connectNotificationSocket((payload) => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount });
      if (payload.notificationType !== 'LOW_STOCK') {
        showToast({ type: payload.notificationType, title: payload.title, message: payload.message });
      }
    });

    return () => disconnectNotificationSocket();
  }, [user, queryClient, showToast]);

  useEffect(() => {
    const storedRefreshToken = getRefreshToken();
    if (!storedRefreshToken) {
      setIsInitializing(false);
      return;
    }

    authApi
      .refreshSession(storedRefreshToken)
      .then(({ user: refreshedUser, accessToken, refreshToken }) => {
        setAccessToken(accessToken);
        setRefreshToken(refreshToken);
        setUser(refreshedUser);
      })
      .catch(() => {
        setAccessToken(null);
        setRefreshToken(null);
        setUser(null);
      })
      .finally(() => setIsInitializing(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { user: loggedInUser, accessToken, refreshToken } = await authApi.login({ email, password });
    setAccessToken(accessToken);
    setRefreshToken(refreshToken);
    setUser(loggedInUser);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setAccessToken(null);
      setRefreshToken(null);
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isInitializing, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
