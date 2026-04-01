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
      <div className="flex flex-col items-center gap-6">
        {/* True CSS 3D logo */}
        <div style={{ perspective: '500px', perspectiveOrigin: '50% 50%' }}>
          <div
            className="animate-logo-3d-rtl"
            style={{ transformStyle: 'preserve-3d', display: 'inline-flex', alignItems: 'center', gap: '16px' }}
          >
            {/* Logo image — also 3D */}
            <div style={{ position: 'relative', width: '64px', height: '64px' }}>
              {Array.from({ length: 20 }, (_, i) => (
                <img
                  key={i}
                  src="/logo.png"
                  alt=""
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    transform: `translateZ(${(19 - i) * 1.2}px)`,
                    opacity: i === 0 ? 1 : 0.6 - i * 0.01,
                    mixBlendMode: i === 0 ? 'normal' : 'multiply',
                  }}
                />
              ))}
            </div>

            {/* YEC + Market text — true 3D stack */}
            <div style={{ position: 'relative' }}>
              {/* 20 layers stacked in Z space */}
              {Array.from({ length: 20 }, (_, i) => {
                const isFront = i === 0;
                const lightness = isFront ? 42 : Math.max(22, 42 - i * 1.5);
                return (
                  <div
                    key={i}
                    style={{
                      position: i === 0 ? 'relative' : 'absolute',
                      inset: 0,
                      transform: `translateZ(${(19 - i) * 1.2}px)`,
                      lineHeight: 1,
                      userSelect: 'none',
                      pointerEvents: 'none',
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: '3.5rem',
                        fontWeight: 900,
                        letterSpacing: '0.04em',
                        color: `hsl(220, 75%, ${lightness}%)`,
                        lineHeight: 1,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      YEC
                    </div>
                    <div
                      style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: '1rem',
                        fontWeight: 700,
                        letterSpacing: '0.3em',
                        color: `hsl(220, 65%, ${lightness}%)`,
                        textTransform: 'uppercase',
                        marginTop: '2px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Market
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <p className="text-sm font-semibold text-ink/60 tracking-widest uppercase">Yuklanmoqda...</p>
      </div>
    </div>
  );
}
