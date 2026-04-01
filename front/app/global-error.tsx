'use client';

import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <html lang="uz">
      <body className="bg-white text-ink">
        <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="relative">
            <div className="absolute -inset-3 rounded-full bg-primary/20 blur-lg" />
            <div className="relative inline-flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-white ring-4 ring-primary/20 shadow-[0_0_40px_rgba(0,180,255,0.18)]">
              <img
                src="/logo.png"
                alt="YEC Market"
                className="h-24 w-24 object-contain animate-logo-3d-rtl motion-reduce:animate-none"
              />
            </div>
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-rose-500">Xatolik</p>
          <h1 className="text-3xl font-semibold">Ilova yuklanmadi</h1>
          <p className="text-sm text-ink/70">
            Kutilmagan xatolik sabab ilova ochilmadi. Sahifani qayta yuklab ko'ring.
          </p>
          <p className="text-xs text-rose-600/80">{error.message}</p>
          <button
            type="button"
            onClick={reset}
            className="btn-classic px-6 py-3 text-sm"
          >
            Qayta yuklash
          </button>
        </div>
      </body>
    </html>
  );
}
