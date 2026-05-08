'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Circle, Filter, Search, Sparkles, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import CarpetList from '@/components/CarpetList';
import FilterPanel, { type CarpetFiltersState } from '@/components/FilterPanel';
import Pagination from '@/components/Pagination';
import { getCarpets, getCategories } from '@/services/carpet.service';
import { getErrorMessage } from '@/services/api';
import type { Carpet, Category } from '@/types/carpet';
import { SectionReveal } from '@/components/ui/animation-wrapper';

const isPrayerMatCategory = (name?: string) =>
  (name ?? '').toLowerCase().includes('joynamoz');
const isOvalCategory = (name?: string) =>
  (name ?? '').toLowerCase().includes('oval');

const sanitizeNameSearch = (value: string) =>
  value.replace(/[^\p{L}\p{N}\s-]+/gu, '');

const DESKTOP_LIMIT = 30;
const MOBILE_LIMIT = 10;
const MOBILE_MEDIA_QUERY = '(max-width: 767px)';

function CarpetsContent() {
  const searchParams = useSearchParams();
  const getParam = (key: string) => searchParams?.get(key) || '';
  const initialCatId = getParam('categoryId');
  const rawSearch = getParam('search') || getParam('q');
  const initialSearch = rawSearch.toLowerCase() === 'eron' ? 'Eron' : rawSearch;
  const sanitizedSearch = sanitizeNameSearch(initialSearch);
  const rawKind = getParam('kind');
  const initialKind: CarpetFiltersState['kind'] =
    rawKind === 'oval' ? 'oval' : rawKind === 'prayer' ? 'prayer' : 'carpet';

  const initialFilters: CarpetFiltersState = {
    kind: initialKind,
    search: sanitizedSearch,
    categoryId: initialCatId,
    minPrice: '',
    maxPrice: '',
    size: '',
    material: '',
  };

  const [filters, setFilters] = useState<CarpetFiltersState>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<CarpetFiltersState>(initialFilters);
  const [carpets, setCarpets] = useState<Carpet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [limit, setLimit] = useState(DESKTOP_LIMIT);
  const [limitReady, setLimitReady] = useState(false);
  const suppressAutoSearchRef = useRef(true);

  const visibleCategories = useMemo(() => {
    if (filters.kind === 'oval') {
      return categories.filter((category) => isOvalCategory(category.name));
    }
    if (filters.kind === 'prayer') {
      return categories.filter((category) => isPrayerMatCategory(category.name));
    }
    if (filters.kind === 'carpet') {
      return categories.filter(
        (category) =>
          !isPrayerMatCategory(category.name) && !isOvalCategory(category.name),
      );
    }
    return categories;
  }, [categories, filters.kind]);

  const loadCarpets = async (state: CarpetFiltersState, targetPage: number, append = false) => {
    try {
      append ? setLoadingMore(true) : setLoading(true);
      setError('');

      const res = await getCarpets({
        page: targetPage,
        limit,
        search: state.search || undefined,
        categoryId: state.categoryId || undefined,
        minPrice: state.minPrice ? Number(state.minPrice) : undefined,
        maxPrice: state.maxPrice ? Number(state.maxPrice) : undefined,
        size: state.size || undefined,
        material: state.material || undefined,
        kind: state.kind,
      });
      const nextItems = res.items ?? [];
      setCarpets((prev) => (append ? [...prev, ...nextItems] : nextItems));
      setTotal(res.meta?.total ?? nextItems.length);
      setPage(targetPage);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      append ? setLoadingMore(false) : setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      setLimitReady(true);
      return;
    }
    const mq = window.matchMedia(MOBILE_MEDIA_QUERY);
    const apply = () => setLimit(mq.matches ? MOBILE_LIMIT : DESKTOP_LIMIT);
    apply();
    setLimitReady(true);
    const onChange = () => apply();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!limitReady) return;

    const init = async () => {
      try {
        setLoading(true);
        const categoryRes = await getCategories();
        setCategories(categoryRes);

        const nextFilters: CarpetFiltersState = {
          kind: initialKind,
          search: sanitizedSearch,
          categoryId: initialCatId,
          minPrice: '',
          maxPrice: '',
          size: '',
          material: '',
        };

        setFilters(nextFilters);
        setAppliedFilters(nextFilters);
        
        await loadCarpets(nextFilters, 1);
        
        window.setTimeout(() => {
          suppressAutoSearchRef.current = false;
        }, 100);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    void init();
  }, [initialCatId, limit, limitReady, initialKind, sanitizedSearch]);

  useEffect(() => {
    if (!limitReady || suppressAutoSearchRef.current) return;

    const timer = window.setTimeout(() => {
      setAppliedFilters(filters);
      void loadCarpets(filters, 1, false);
    }, 600);

    return () => window.clearTimeout(timer);
  }, [filters, limitReady]);

  const heroTheme = useMemo(() => {
    if (filters.kind === 'oval') return { bg: 'from-fuchsia-600 to-purple-800', accent: 'text-fuchsia-200' };
    if (filters.kind === 'prayer') return { bg: 'from-emerald-600 to-teal-800', accent: 'text-emerald-200' };
    return { bg: 'from-sky-600 to-blue-800', accent: 'text-sky-200' };
  }, [filters.kind]);

  return (
    <div className="space-y-10 pb-20">
      {/* Dynamic Thematic Hero */}
      <section className={`relative overflow-hidden bg-gradient-to-br ${heroTheme.bg} py-16 md:py-24`}>
        <div className="pointer-events-none absolute inset-0 opacity-20">
           <div className="absolute top-0 left-0 h-full w-full bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_70%)]" />
           <div className="absolute top-[10%] right-[10%] animate-pulse">
              <Sparkles className="h-12 w-12 text-white" />
           </div>
        </div>

        <div className="section-shell relative z-10">
          <SectionReveal animation="slide-right" className="space-y-8">
            <div className={`inline-flex items-center gap-3 rounded-full border border-white/20 bg-black/10 px-6 py-2 text-xs font-black uppercase tracking-[0.3em] ${heroTheme.accent} backdrop-blur-xl`}>
               <Search className="h-4 w-4" />
               Aqlli qidiruv tizimi
            </div>
            
            <h1 className="font-serif text-5xl font-bold text-white md:text-7xl lg:text-8xl">
              {filters.kind === 'oval' ? 'Oval Gilamlar' : filters.kind === 'prayer' ? 'Joynamozlar' : 'Gilamlar'}
            </h1>
            
            <p className="max-w-2xl text-lg text-white/80 md:text-xl">
              Uyingiz uchun eng mos dizaynni toping. Bizning keng qamrovli 
              katalogimizda har qanday ta'bga mos mahsulot mavjud.
            </p>

            <div className="flex flex-wrap gap-4">
               <div className="flex h-16 items-center gap-4 rounded-3xl bg-white/10 px-8 border border-white/20 backdrop-blur-md">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-blue-600">
                     <SlidersHorizontal className="h-4 w-4" />
                  </div>
                  <span className="text-xl font-bold text-white">{loading ? '...' : total} ta mahsulot</span>
               </div>
            </div>
          </SectionReveal>
        </div>
      </section>

      <div className="section-shell -mt-12 relative z-20 space-y-12">
        <SectionReveal animation="fade-up">
           <div className="rounded-[2.5rem] bg-white p-6 shadow-[0_32px_64px_rgba(0,0,0,0.08)] md:p-10 border border-slate-100">
              <FilterPanel
                categories={visibleCategories}
                filters={filters}
                onChange={setFilters}
                onReset={() => {
                  setFilters(initialFilters);
                  setAppliedFilters(initialFilters);
                }}
              />
           </div>
        </SectionReveal>

        <div className="space-y-8">
           <div className="flex items-center justify-between border-b border-slate-100 pb-8">
              <div className="flex items-center gap-4">
                 <h2 className="font-serif text-4xl font-bold text-slate-900">
                   {filters.search ? `'${filters.search}' natijalari` : 'Barcha mahsulotlar'}
                 </h2>
                 {!loading && <span className="rounded-full bg-slate-100 px-4 py-1.5 text-sm font-bold text-slate-500">{total} ta</span>}
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                 <ArrowUpDown className="h-5 w-5" />
                 <span className="text-sm font-medium">Saralangan</span>
              </div>
           </div>

           <CarpetList carpets={carpets} loading={loading} emptyText="Afsuski, ushbu filtrlar bo'yicha mahsulot topilmadi." />

           <div className="flex justify-center pt-10">
              <Pagination
                page={page}
                limit={limit}
                total={total}
                loading={loadingMore}
                onPageChange={(newPage) => void loadCarpets(appliedFilters, newPage, false)}
              />
           </div>
        </div>
      </div>
    </div>
  );
}

export default function CarpetsPage() {
  return (
    <Suspense fallback={
      <div className="section-shell flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    }>
      <CarpetsContent />
    </Suspense>
  );
}
