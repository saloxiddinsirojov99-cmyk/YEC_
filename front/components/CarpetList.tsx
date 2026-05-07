'use client';

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

export default function CarpetList({ carpets, loading = false, emptyText }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <SkeletonCard key={index} />
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
    <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
      {carpets.map((carpet) => (
        <CarpetCard key={carpet.id} carpet={carpet} />
      ))}
    </div>
  );
}
