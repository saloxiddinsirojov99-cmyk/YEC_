'use client';

import React from 'react';

type Props = {
  children: React.ReactNode;
  fallbackTitle?: string;
  fallbackDescription?: string;
};

type State = {
  hasError: boolean;
  message: string;
};

export default class ClientErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: unknown): State {
    const message = error instanceof Error ? error.message : "Noma'lum xatolik";
    return { hasError: true, message };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error('Client render xatosi:', error, info);
  }

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-rose-500">Xatolik</p>
          <h1 className="text-3xl font-semibold text-slate-900">
            {this.props.fallbackTitle ?? "Sahifada xatolik yuz berdi"}
          </h1>
          <p className="text-sm text-slate-600">
            {this.props.fallbackDescription ??
              "Kutilmagan xatolik sabab sahifa vaqtincha ochilmadi. Qayta yuklab ko'ring yoki keyinroq urinib ko'ring."}
          </p>
          <p className="text-xs text-rose-600/80">{this.state.message}</p>
          <button
            type="button"
            onClick={this.handleReload}
            className="rounded-full bg-rose-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-rose-600"
          >
            Qayta yuklash
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
