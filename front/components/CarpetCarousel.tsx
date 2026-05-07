'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { Carpet } from '@/types/carpet';
import CarpetCard from './CarpetCard';

type Props = {
  carpets: Carpet[];
  loading?: boolean;
  emptyText?: string;
};

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
      <div className="h-48 animate-pulse bg-primary/5 sm:h-64" />
      <div className="space-y-3 p-4 sm:space-y-4 sm:p-6">
        <div className="h-5 w-2/3 animate-pulse rounded-lg bg-primary/5 sm:h-6" />
        <div className="h-3 w-1/2 animate-pulse rounded-lg bg-primary/5 sm:h-4" />
        <div className="mt-4 flex justify-between">
          <div className="h-7 w-1/3 animate-pulse rounded-lg bg-primary/5 sm:h-8" />
          <div className="h-7 w-1/4 animate-pulse rounded-lg bg-primary/5 sm:h-8" />
        </div>
      </div>
    </div>
  );
}

export default function CarpetCarousel({ carpets, loading = false, emptyText }: Props) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const currentIndexRef = useRef(0);
  const pauseUntilRef = useRef(0);

  const getStepWidth = useCallback(() => {
    const track = trackRef.current;
    if (!track) return 0;

    const firstItem = track.querySelector<HTMLElement>('[data-carousel-item="true"]');
    if (!firstItem) return 0;

    const style = window.getComputedStyle(track);
    const gapValue = Number.parseFloat(style.columnGap || style.gap || '0');
    const gap = Number.isFinite(gapValue) ? gapValue : 0;
    return firstItem.offsetWidth + gap;
  }, []);

  const syncIndexFromScroll = useCallback(() => {
    const track = trackRef.current;
    if (!track || carpets.length === 0) return;
    const step = getStepWidth();
    if (step <= 0) return;

    const index = Math.round(track.scrollLeft / step);
    const bounded = Math.max(0, Math.min(carpets.length - 1, index));
    currentIndexRef.current = bounded;
  }, [carpets.length, getStepWidth]);

  const moveToIndex = useCallback(
    (index: number, smooth = true) => {
      const track = trackRef.current;
      if (!track || carpets.length === 0) return;
      const step = getStepWidth();
      if (step <= 0) return;

      const bounded = ((index % carpets.length) + carpets.length) % carpets.length;
      currentIndexRef.current = bounded;
      track.scrollTo({
        left: bounded * step,
        behavior: smooth ? 'smooth' : 'auto',
      });
    },
    [carpets.length, getStepWidth],
  );

  const handleUserInteract = useCallback(() => {
    pauseUntilRef.current = Date.now() + 6000;
    syncIndexFromScroll();
  }, [syncIndexFromScroll]);

  useEffect(() => {
    currentIndexRef.current = 0;
    const track = trackRef.current;
    if (track) {
      track.scrollTo({ left: 0, behavior: 'auto' });
    }
  }, [carpets.length]);

  useEffect(() => {
    if (loading || carpets.length <= 1) return;

    const timer = setInterval(() => {
      if (Date.now() < pauseUntilRef.current) return;
      moveToIndex(currentIndexRef.current + 1, true);
    }, 3000);

    return () => clearInterval(timer);
  }, [carpets.length, loading, moveToIndex]);

  const trackClassName =
    '-mx-1 flex gap-4 overflow-x-auto px-1 pb-2 snap-x snap-mandatory scroll-smooth scrollbar-hide md:scrollbar-premium';

  if (loading) {
    return (
      <div className={trackClassName}>
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} data-carousel-item="true" className="w-[260px] sm:w-[280px] md:w-[320px] flex-shrink-0 snap-start">
            <SkeletonCard />
          </div>
        ))}
      </div>
    );
  }

  if (carpets.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-terracotta/40 bg-terracotta/5 p-6 text-center text-ink/70 sm:p-8">
        {emptyText ?? 'Hozircha gilamlar topilmadi.'}
      </div>
    );
  }

  return (
    <div
      ref={trackRef}
      className={trackClassName}
      onTouchStart={handleUserInteract}
      onTouchEnd={syncIndexFromScroll}
      onMouseDown={handleUserInteract}
      onWheel={handleUserInteract}
      onScroll={syncIndexFromScroll}
    >
      {carpets.map((carpet) => (
        <div key={carpet.id} data-carousel-item="true" className="w-[260px] sm:w-[280px] md:w-[320px] flex-shrink-0 snap-start">
          <CarpetCard carpet={carpet} />
        </div>
      ))}
    </div>
  );
}
