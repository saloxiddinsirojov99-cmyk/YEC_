'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function PageLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearShowTimer = () => {
    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
  };

  const startLoading = () => {
    clearShowTimer();
    // Small delay prevents flicker on ultra-fast navigations
    showTimerRef.current = setTimeout(() => {
      setLoading(true);
      // Safety auto-hide if navigation hangs
      setTimeout(() => setLoading(false), 5000);
    }, 50);
  };

  const stopLoading = () => {
    clearShowTimer();
    setLoading(false);
  };

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      const anchor = (target?.closest?.('a') as HTMLAnchorElement | null) ?? null;
      if (!anchor) return;

      if (anchor.target === '_blank') return;
      if (anchor.hasAttribute('download')) return;
      const rawHref = anchor.getAttribute('href');
      if (!rawHref) return;
      if (
        rawHref.startsWith('#') ||
        rawHref.startsWith('mailto:') ||
        rawHref.startsWith('tel:')
      ) {
        return;
      }

      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }

      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) {
        return;
      }

      startLoading();
    };

    document.addEventListener('click', onClick, true);
    return () => {
      document.removeEventListener('click', onClick, true);
      clearShowTimer();
    };
  }, []);

  useEffect(() => {
    // Navigation completed
    stopLoading();
  }, [pathname, searchParams]);

  if (!loading) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/70 backdrop-blur-md"
      role="status"
      aria-live="polite"
      aria-label="Yuklanmoqda"
    >
      <div className="flex flex-col items-center gap-6">
        <div className="relative h-28 w-28 drop-shadow-2xl">
          <img
            src="/logo.png"
            alt="YEC Market"
            className="h-full w-full object-contain animate-logo-bounce"
          />
        </div>
        <div className="flex flex-col items-center gap-2">
          <p className="text-lg font-bold tracking-tight text-ink">
            Yuklanmoqda
            <span className="inline-flex ml-1">
              <span className="animate-dot-flash [animation-delay:0s]">.</span>
              <span className="animate-dot-flash [animation-delay:0.2s]">.</span>
              <span className="animate-dot-flash [animation-delay:0.4s]">.</span>
            </span>
          </p>
          <div className="h-1 w-32 overflow-hidden rounded-full bg-black/5">
            <div className="h-full w-full origin-left animate-progress-loading bg-primary" />
          </div>
        </div>
      </div>
    </div>
  );
}
