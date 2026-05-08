'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

// Simple event-based toast system to avoid complex context if not needed, 
// but we'll export a hook for convenience.
let toastListeners: ((message: ToastMessage) => void)[] = [];

export const toast = {
  show: (message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    const toastMsg = { id, message, type };
    toastListeners.forEach((listener) => listener(toastMsg));
  },
  success: (message: string) => toast.show(message, 'success'),
  error: (message: string) => toast.show(message, 'error'),
  info: (message: string) => toast.show(message, 'info'),
  warning: (message: string) => toast.show(message, 'warning'),
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const addToast = (message: ToastMessage) => {
      setToasts((prev) => [...prev, message]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== message.id));
      }, 5000); // 5 seconds as requested in history
    };

    toastListeners.push(addToast);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== addToast);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="fixed top-24 right-6 z-[9999] flex flex-col gap-3 pointer-events-none w-full max-w-[400px]">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            className={`pointer-events-auto flex items-center justify-between rounded-2xl border p-4 shadow-2xl backdrop-blur-xl transition-all ${
              t.type === 'error'
                ? 'border-red-500/20 bg-[#fdeded] text-[#5f2120]'
                : t.type === 'success'
                ? 'border-emerald-500/20 bg-[#edf7ed] text-[#1e4620]'
                : 'border-blue-500/20 bg-[#e5f6fd] text-[#014361]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                t.type === 'error' ? 'bg-red-500/10' : t.type === 'success' ? 'bg-emerald-500/10' : 'bg-blue-500/10'
              }`}>
                {t.type === 'error' && (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                )}
                {t.type === 'success' && (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                )}
                {(t.type === 'info' || t.type === 'warning') && (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                )}
              </div>
              <p className="text-sm font-medium">{t.message}</p>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="ml-4 rounded-full p-1 transition-colors hover:bg-white/10"
            >
              <svg className="h-4 w-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
