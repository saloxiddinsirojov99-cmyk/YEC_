'use client';

import { useEffect, useRef, useState } from 'react';
import { Circle, Filter, MoonStar, Sparkles, Star } from 'lucide-react';
import CarpetList from '@/components/CarpetList';
import Pagination from '@/components/Pagination';
import { getCarpets } from '@/services/carpet.service';
import { getErrorMessage } from '@/services/api';
import type { Carpet } from '@/types/carpet';
import { SectionReveal } from '@/components/ui/animation-wrapper';

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
    <div className="space-y-10 pb-20">
      {/* Premium Emerald/Gold Hero */}
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.2),transparent_60%),linear-gradient(135deg,#064e3b,#065f46,#047857)] py-16 md:py-24">
        {/* Animated Background Ornaments */}
        <div className="pointer-events-none absolute inset-0 opacity-20">
          <div className="absolute top-[10%] left-[5%] animate-pulse">
            <Star className="h-8 w-8 text-amber-300" />
          </div>
          <div className="absolute bottom-[15%] right-[10%] animate-bounce [animation-duration:4s]">
            <MoonStar className="h-10 w-10 text-emerald-100" />
          </div>
          <div className="absolute top-[60%] left-[20%] h-32 w-32 rounded-full border border-amber-400/30 blur-2xl" />
        </div>

        <div className="section-shell relative z-10 grid gap-12 md:grid-cols-[1fr,auto] items-center">
          <SectionReveal animation="slide-right" className="space-y-8">
            <div className="inline-flex items-center gap-3 rounded-full border border-amber-400/30 bg-black/20 px-5 py-2 text-xs font-black uppercase tracking-[0.3em] text-amber-400 backdrop-blur-xl">
               <Sparkles className="h-4 w-4" />
               Ibodat uchun nafislik
            </div>
            
            <h1 className="font-serif text-5xl font-bold text-white md:text-7xl lg:text-8xl leading-tight">
              Premium <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-100 via-amber-200 to-emerald-50">Joynamozlar</span>
            </h1>
            
            <p className="max-w-2xl text-lg md:text-xl leading-relaxed text-emerald-50/80">
              Eng yuqori sifatli matolardan tayyorlangan, nafis naqshli va 
              shinamlik bag'ishlovchi joynamozlar kolleksiyasi.
            </p>

            <div className="flex flex-wrap gap-5">
              <div className="flex h-16 items-center gap-4 rounded-3xl border border-emerald-400/30 bg-white/10 px-8 backdrop-blur-md">
                 <div className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                 <span className="text-xl font-bold text-white">{loading ? '...' : totalCount} ta tanlov</span>
              </div>
              <button
                 onClick={() => document.getElementById('filter-joynamoz')?.scrollIntoView({ behavior: 'smooth' })}
                 className="group h-16 rounded-3xl bg-amber-400 px-10 text-lg font-black text-emerald-950 shadow-xl shadow-amber-400/20 transition-all hover:scale-105 active:scale-95"
              >
                 Tanlashni boshlash
              </button>
            </div>
          </SectionReveal>

          <SectionReveal animation="zoom-in" className="hidden md:block">
             <div className="relative flex h-64 w-64 items-center justify-center rounded-[3rem] border border-amber-400/30 bg-emerald-900/50 p-4 shadow-2xl backdrop-blur-xl">
                <div className="absolute -inset-4 animate-spin-slow rounded-[3.5rem] border border-amber-400/10" />
                <MoonStar className="h-24 w-24 text-amber-200 drop-shadow-[0_0_20px_rgba(251,191,36,0.4)]" />
             </div>
          </SectionReveal>
        </div>
      </section>

      <div className="section-shell space-y-12">
        {/* Modern Filter Interface */}
        <SectionReveal animation="fade-up" id="filter-joynamoz" className="relative -mt-16 z-20">
          <div className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-[0_32px_64px_rgba(0,0,0,0.08)] md:p-10">
            <div className="flex flex-col items-center justify-center gap-8 md:flex-row">
              <div className="space-y-4 text-center md:text-left">
                <label className="text-xs font-black uppercase tracking-widest text-emerald-800 opacity-60">O'lcham boyicha saralash</label>
                <div className="flex flex-wrap justify-center gap-3 md:justify-start">
                  {SIZE_OPTIONS.map((option) => {
                    const isActive = activeSize === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setActiveSize(option.value)}
                        className={`h-14 min-w-[150px] rounded-2xl px-8 text-sm font-bold transition-all ${
                          isActive 
                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' 
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </SectionReveal>

        <div className="space-y-8">
           <div className="flex items-center justify-between border-b border-slate-100 pb-6">
              <h3 className="font-serif text-3xl font-bold text-slate-900">{resultText}</h3>
              {loading && <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />}
           </div>

           <CarpetList carpets={carpets} loading={loading} emptyText="Afsuski, ushbu filtrlar bo'yicha joynamoz topilmadi." />

           <SectionReveal animation="fade-up" className="flex justify-center pt-10">
              <Pagination
                page={page}
                limit={LIMIT}
                total={total}
                loading={loading}
                onPageChange={(newPage) => void loadCarpets(appliedFilters, activeSize, newPage)}
              />
           </SectionReveal>
        </div>
      </div>

      {error ? (
        <div className="section-shell mt-10">
          <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center text-red-700">
            <p className="font-bold">{error}</p>
            <button onClick={() => window.location.reload()} className="mt-4 text-sm font-bold underline">Sahifani yangilash</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
