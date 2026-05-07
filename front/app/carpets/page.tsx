'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Circle, Filter, Search, Sparkles } from 'lucide-react';
import CarpetList from '@/components/CarpetList';
import FilterPanel, { type CarpetFiltersState } from '@/components/FilterPanel';
import Pagination from '@/components/Pagination';
import { getCarpets, getCategories } from '@/services/carpet.service';
import { getErrorMessage } from '@/services/api';
import type { Carpet, Category } from '@/types/carpet';

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
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    }

    (mq as unknown as { addListener?: (cb: () => void) => void }).addListener?.(onChange);
    return () => {
      (mq as unknown as { removeListener?: (cb: () => void) => void }).removeListener?.(onChange);
    };
  }, []);

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

      const searchValue = state.search || undefined;

      const res = await getCarpets({
        page: targetPage,
        limit,
        search: searchValue,
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
    if (!limitReady) return;

    suppressAutoSearchRef.current = true;
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const nextFilters: CarpetFiltersState = {
          kind: initialKind,
          search: sanitizedSearch,
          categoryId: initialCatId,
          minPrice: '',
          maxPrice: '',
          size: '',
          material: '',
        };
        const categoryRes = await getCategories();
        const selectedCategory = categoryRes.find(
          (category) => category.id === nextFilters.categoryId,
        );
        if (
          selectedCategory &&
          isOvalCategory(selectedCategory.name) &&
          nextFilters.kind !== 'oval'
        ) {
          nextFilters.kind = 'oval';
        }

        const carpetRes = await getCarpets({ 
          page: 1,
          limit,
          search: nextFilters.search || undefined,
          categoryId: nextFilters.categoryId || undefined,
          kind: nextFilters.kind,
        });
        const nextItems = carpetRes.items ?? [];
        setFilters(nextFilters);
        setAppliedFilters(nextFilters);
        setCarpets(nextItems);
        setCategories(categoryRes);
        setTotal(carpetRes.meta?.total ?? nextItems.length);
        setPage(1);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
        suppressAutoSearchRef.current = false;
      }
    };

    void load();
  }, [initialCatId, limit, limitReady, initialKind, sanitizedSearch]);

  useEffect(() => {
    if (!limitReady || suppressAutoSearchRef.current) return;

    const timer = window.setTimeout(() => {
      setAppliedFilters(filters);
      void loadCarpets(filters, 1, false);
    }, 450);

    return () => {
      window.clearTimeout(timer);
    };
  }, [filters, limitReady]);

  const resultText = useMemo(() => {
    const kindLabel =
      filters.kind === 'oval'
        ? 'oval gilam'
        : filters.kind === 'prayer'
          ? 'joynamoz'
          : 'gilam';
    if (carpets.length === 0) return `${kindLabel.charAt(0).toUpperCase() + kindLabel.slice(1)} topilmadi`;
    const totalCount = total > 0 ? total : carpets.length;
    return `${totalCount} ta ${kindLabel} topildi`;
  }, [carpets.length, filters.kind, total]);
  const totalCount = total > 0 ? total : carpets.length;

  const heroContent = useMemo(() => {
    if (filters.kind === 'oval') {
      return {
        variant: 'catalog-hero--oval',
        badge: 'Oval tanlov',
        title: 'Oval gilam qidiruvi',
        description: "Oval shakldagi gilamlarni tur, narx va o'lcham bo'yicha tez filtrlab toping.",
        countLabel: 'ta oval gilam',
      };
    }

    if (filters.kind === 'prayer') {
      return {
        variant: 'catalog-hero--joy',
        badge: 'Joynamoz qidiruvi',
        title: 'Joynamoz qidiruvi',
        description:
          "Joynamozlarni nomi, turkumi va o'lchami bo'yicha saralab, kerakli variantni darhol toping.",
        countLabel: 'ta joynamoz',
      };
    }

    return {
      variant: 'catalog-hero--search',
      badge: 'Katalog qidiruvi',
      title: 'Gilam qidiruvi',
      description:
        "Tur, narx, material va o'lcham bo'yicha filtr qo'yib, kerakli gilamni bir joyda tanlang.",
      countLabel: 'ta gilam',
    };
  }, [filters.kind]);

  return (
    <div className="section-shell space-y-6 py-8">
      <section className={`catalog-hero ${heroContent.variant} fade-up px-6 py-8 md:px-10 md:py-11`}>
        <div className="pointer-events-none absolute inset-0">
          <div className="catalog-hero-float absolute left-[10%] top-[80%] text-sky-200/75 [animation-delay:0ms]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="catalog-hero-float absolute left-[50%] top-[72%] text-cyan-200/80 [animation-delay:700ms]">
            <Search className="h-4 w-4" />
          </div>
          <div className="catalog-hero-float absolute left-[79%] top-[76%] text-blue-100/80 [animation-delay:1200ms]">
            <Circle className="h-5 w-5 fill-current" />
          </div>
        </div>

        <div className="relative z-10 grid items-center gap-7 md:grid-cols-[1fr_auto]">
          <div className="space-y-4">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-white/90 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-sky-200" />
              {heroContent.badge}
            </p>
            <h1 className="font-serif text-4xl text-white md:text-6xl">{heroContent.title}</h1>
            <p className="max-w-2xl text-sm leading-relaxed text-white/85 md:text-base">
              {heroContent.description}
            </p>
            <div className="flex flex-wrap gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-100/35 bg-sky-500/20 px-4 py-2 text-sm font-bold text-white backdrop-blur-md">
                <Filter className="h-4 w-4 text-sky-200" />
                {loading ? 'Yuklanmoqda...' : `${totalCount} ${heroContent.countLabel}`}
              </div>
              <a
                href="#carpet-filter-panel"
                className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-4 py-2 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-white/25"
              >
                Filtrlashga o&apos;tish
              </a>
            </div>
          </div>

          <div className="hidden items-center md:flex">
            <div className="relative h-44 w-44 rounded-full border border-white/25 bg-white/10 backdrop-blur-xl">
              <div className="absolute inset-5 animate-spin rounded-full border border-white/20 border-t-sky-200/80 [animation-duration:6.4s]" />
              <div className="absolute inset-9 animate-spin rounded-full border border-cyan-100/20 border-b-blue-200/80 [animation-duration:4.8s] [animation-direction:reverse]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Search className="h-12 w-12 text-sky-100" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div id="carpet-filter-panel" className="fade-up">
        <FilterPanel
          categories={visibleCategories}
          filters={filters}
          onChange={setFilters}
          onReset={() => {
            const resetFilters: CarpetFiltersState = {
              kind: 'carpet',
              search: '',
              categoryId: '',
              minPrice: '',
              maxPrice: '',
              size: '',
              material: '',
            };
            setFilters(resetFilters);
            setAppliedFilters(resetFilters);
          }}
        />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-ink/70">{loading ? 'Yuklanmoqda...' : resultText}</p>
      </div>

      <CarpetList
        carpets={carpets}
        loading={loading}
        emptyText={filters.kind === 'oval' ? 'Oval gilam topilmadi.' : 'Gilam topilmadi.'}
      />

      <Pagination
        page={page}
        limit={limit}
        total={total}
        loading={loadingMore}
        onPageChange={(newPage) => void loadCarpets(appliedFilters, newPage, false)}
      />

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}
    </div>
  );
}

export default function CarpetsPage() {
  return (
    <Suspense fallback={
      <div className="section-shell flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    }>
      <CarpetsContent />
    </Suspense>
  );
}


