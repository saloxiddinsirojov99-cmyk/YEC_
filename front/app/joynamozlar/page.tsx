'use client';

import { useEffect, useRef, useState } from 'react';
import { Circle, Filter, MoonStar, Sparkles } from 'lucide-react';
import CarpetList from '@/components/CarpetList';
import Pagination from '@/components/Pagination';
import { getCarpets } from '@/services/carpet.service';
import { getErrorMessage } from '@/services/api';
import type { Carpet } from '@/types/carpet';

type SizeFilter = 'all' | '0.75x1.25' | '0.5x1.25';

type Filters = {
  name: string;
};

const SIZE_OPTIONS: { label: string; value: SizeFilter }[] = [
  { label: "Barchasini ko'rish", value: 'all' },
  { label: '0.75x1.25', value: '0.75x1.25' },
  { label: '0.5x1.25', value: '0.5x1.25' },
];

const LIMIT = 30;

export default function JoynamozlarPage() {
  const [carpets, setCarpets] = useState<Carpet[]>([]);
  const [activeSize, setActiveSize] = useState<SizeFilter>('all');
  const [filters, setFilters] = useState<Filters>({ name: '' });
  const [appliedFilters, setAppliedFilters] = useState<Filters>({ name: '' });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const suppressAutoSearchRef = useRef(true);

  const loadCarpets = async (
    state: Filters,
    sizeFilter: SizeFilter,
    targetPage: number,
  ) => {
    try {
      setLoading(true);
      setError('');

      const res = await getCarpets({
        page: targetPage,
        limit: LIMIT,
        kind: 'prayer',
        search: state.name.trim() || undefined,
        size: sizeFilter !== 'all' ? sizeFilter : undefined,
      });

      const items = res.items ?? [];
      setCarpets(items);
      setTotal(res.meta?.total ?? items.length);
      setPage(targetPage);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    suppressAutoSearchRef.current = true;
    const init = async () => {
      await loadCarpets(appliedFilters, activeSize, 1);
      suppressAutoSearchRef.current = false;
    };
    void init();
  }, []);

  useEffect(() => {
    if (suppressAutoSearchRef.current) return;

    const timer = window.setTimeout(() => {
      const nextFilters = { ...filters };
      setAppliedFilters(nextFilters);
      void loadCarpets(nextFilters, activeSize, 1);
    }, 450);

    return () => {
      window.clearTimeout(timer);
    };
  }, [filters, activeSize]);

  const resultText = loading
    ? 'Yuklanmoqda...'
    : carpets.length === 0
      ? 'Joynamoz topilmadi'
      : `${total > 0 ? total : carpets.length} ta joynamoz topildi`;
  const totalCount = total > 0 ? total : carpets.length;

  return (
    <div className="section-shell space-y-6 py-8">
      <section className="catalog-hero catalog-hero--joy fade-up px-6 py-8 md:px-10 md:py-11">
        <div className="pointer-events-none absolute inset-0">
          <div className="catalog-hero-float absolute left-[10%] top-[80%] text-emerald-200/75 [animation-delay:0ms]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="catalog-hero-float absolute left-[50%] top-[73%] text-lime-200/80 [animation-delay:700ms]">
            <MoonStar className="h-4 w-4" />
          </div>
          <div className="catalog-hero-float absolute left-[79%] top-[77%] text-teal-100/80 [animation-delay:1200ms]">
            <Circle className="h-5 w-5 fill-current" />
          </div>
        </div>

        <div className="relative z-10 grid items-center gap-7 md:grid-cols-[1fr_auto]">
          <div className="space-y-4">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-white/90 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-emerald-200" />
              Tinch va nafis tanlov
            </p>
            <h1 className="font-serif text-4xl text-white md:text-6xl">Joynamozlar</h1>
            <p className="max-w-2xl text-sm leading-relaxed text-white/85 md:text-base">
              Joynamoz nomi yoki o&apos;lchami bo&apos;yicha keraklisini toping va bir necha soniyada
              mos variantga o&apos;ting.
            </p>
            <div className="flex flex-wrap gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100/35 bg-emerald-500/20 px-4 py-2 text-sm font-bold text-white backdrop-blur-md">
                <Filter className="h-4 w-4 text-emerald-200" />
                {loading ? 'Yuklanmoqda...' : `${totalCount} ta joynamoz`}
              </div>
              <a
                href="#joynamoz-filter-panel"
                className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-4 py-2 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-white/25"
              >
                Filtrlashga o&apos;tish
              </a>
            </div>
          </div>

          <div className="hidden items-center md:flex">
            <div className="relative h-44 w-44 rounded-full border border-white/25 bg-white/10 backdrop-blur-xl">
              <div className="absolute inset-5 animate-spin rounded-full border border-white/20 border-t-emerald-200/80 [animation-duration:6.4s]" />
              <div className="absolute inset-9 animate-spin rounded-full border border-teal-100/20 border-b-lime-200/80 [animation-duration:4.8s] [animation-direction:reverse]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <MoonStar className="h-12 w-12 text-emerald-100" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div id="joynamoz-filter-panel" className="fade-up">
        <form
          className="panel mb-4 grid grid-cols-1 gap-4 p-4 md:grid-cols-6"
          onSubmit={(event) => {
            event.preventDefault();
          }}
        >
          <input
            value={filters.name}
            onChange={(event) => setFilters((prev) => ({ ...prev, name: event.target.value }))}
            type="text"
            placeholder="Joynamoz nomi"
            className="input-field md:col-span-5"
          />
          <div className="flex gap-3 md:col-span-1">
            <button
              type="button"
              onClick={() => {
                const cleared: Filters = { name: '' };
                setFilters(cleared);
                setAppliedFilters(cleared);
                setActiveSize('all');
              }}
              className="btn-secondary flex-1 py-3 text-xs uppercase tracking-widest"
            >
              Tozalash
            </button>
          </div>
        </form>
        <div className="panel flex flex-wrap items-center gap-3 p-4">
          {SIZE_OPTIONS.map((option) => {
            const isActive = activeSize === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setActiveSize(option.value);
                }}
                className={isActive ? 'btn-primary px-5 py-3 text-sm' : 'btn-secondary px-5 py-3 text-sm'}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-ink/70">{resultText}</p>
      </div>

      <CarpetList carpets={carpets} loading={loading} emptyText="Joynamozlar topilmadi." />

      <Pagination
        page={page}
        limit={LIMIT}
        total={total}
        loading={loading}
        onPageChange={(newPage) => void loadCarpets(appliedFilters, activeSize, newPage)}
      />

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}
    </div>
  );
}
