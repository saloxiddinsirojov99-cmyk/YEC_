'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { API_BASE_URL } from '@/services/api';
import {
  clearToken,
  getLastActive,
  getRefreshToken,
  getToken,
  getTokenExpiryMs,
  saveAccessToken,
  setLastActive,
} from '@/services/auth.service';

const IDLE_LIMIT_MS = 60 * 60 * 1000;
const CHECK_INTERVAL_MS = 60 * 1000;

const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

export default function AuthSessionGuard() {
  const router = useRouter();
  const refreshing = useRef(false);

  useEffect(() => {
    const updateActivity = () => {
      if (!getToken()) return;
      setLastActive(Date.now());
    };

    updateActivity();
    events.forEach((event) => window.addEventListener(event, updateActivity, { passive: true }));
    return () => {
      events.forEach((event) => window.removeEventListener(event, updateActivity));
    };
  }, []);

  useEffect(() => {
    const logout = (dest = '/login') => {
      clearToken();
      window.location.href = dest;
    };

    const tick = async () => {
      const pathname = window.location.pathname;
      const isProtectedRoute = pathname.startsWith('/admin') || 
                               pathname.startsWith('/profile') || 
                               pathname.startsWith('/orders') || 
                               pathname.startsWith('/cart');
      
      const accessToken = getToken();
      
      // If no token but on protected route -> redirect
      if (!accessToken) {
        if (isProtectedRoute) {
          logout();
        }
        return;
      }

      const now = Date.now();
      
      // 1. Check Idle time
      const lastActive = getLastActive();
      if (now - lastActive > IDLE_LIMIT_MS) {
        logout();
        return;
      }

      // 2. Check Access Token persistence
      const accessExp = getTokenExpiryMs(accessToken);
      if (accessExp && now >= accessExp) {
        // Try Refresh
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
          logout();
          return;
        }

        if (refreshing.current) return;
        refreshing.current = true;
        try {
          const { data } = await axios.post(
            `${API_BASE_URL}/auth/refresh`,
            { refreshToken },
            { timeout: 15000, headers: { 'x-skip-refresh': '1' } },
          );
          const nextAccess = data?.accessToken;
          if (nextAccess) {
            saveAccessToken(nextAccess);
            setLastActive(Date.now());
          } else {
            logout();
          }
        } catch {
          logout();
        } finally {
          refreshing.current = false;
        }
      }
    };

    const interval = window.setInterval(tick, 5000);
    void tick();

    return () => window.clearInterval(interval);
  }, [router]);

  return null;
}
