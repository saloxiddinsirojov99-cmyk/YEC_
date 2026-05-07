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
    showTimerRef.current = setTimeout(() => setLoading(true), 150);
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

    const onPopState = () => startLoading();

    document.addEventListener('click', onClick, true);
    window.addEventListener('popstate', onPopState);
    return () => {
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('popstate', onPopState);
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
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/65 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-label="Yuklanmoqda"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="relative inline-flex h-32 w-32 items-center justify-center bg-transparent">
          <img
            src="/logo.png"
            alt="YEC Market"
            className="h-full w-full object-contain animate-logo-3d-rtl"
          />
        </div>
        <p className="text-sm font-semibold text-ink/70">Yuklanmoqda...</p>
      </div>
    </div>
  );
}
