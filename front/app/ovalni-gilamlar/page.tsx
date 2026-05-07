'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Circle, Filter, Search, Sparkles } from 'lucide-react';
import CarpetList from '@/components/CarpetList';
import Pagination from '@/components/Pagination';
import { getCarpets, getCategories } from '@/services/carpet.service';
import { getErrorMessage } from '@/services/api';
import type { Carpet, Category } from '@/types/carpet';

const LIMIT = 30;

const isOvalCategory = (name?: string) =>
  (name ?? '').toLowerCase().includes('oval');

const sanitizeDigits = (value: string) => value.replace(/[^\d]+/g, '');

type OvalFilters = {
  name: string;
  size: string;
  minPrice: string;
  maxPrice: string;
  categoryId: string;
};

export default function OvalCarpetsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [filters, setFilters] = useState<OvalFilters>({
    name: '',
    size: '',
    minPrice: '',
    maxPrice: '',
    categoryId: '',
  });
  const [appliedFilters, setAppliedFilters] = useState<OvalFilters>({
    name: '',
    size: '',
    minPrice: '',
    maxPrice: '',
    categoryId: '',
  });
  const [carpets, setCarpets] = useState<Carpet[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const suppressAutoSearchRef = useRef(true);

  const ovalCategories = useMemo(
    () => categories.filter((category) => isOvalCategory(category.name)),
    [categories],
  );

  const loadCarpets = async (
    state: OvalFilters,
    targetPage: number,
    append = false,
  ) => {
    try {
      append ? setLoadingMore(true) : setLoading(true);
      setError('');

      const res = await getCarpets({
        page: targetPage,
        limit: LIMIT,
        kind: 'oval',
        search: state.name || undefined,
        size: state.size || undefined,
        categoryId: state.categoryId || undefined,
        minPrice: state.minPrice ? Number(state.minPrice) : undefined,
        maxPrice: state.maxPrice ? Number(state.maxPrice) : undefined,
      });

      const items = res.items ?? [];
      setCarpets((prev) => (append ? [...prev, ...items] : items));
      setTotal(res.meta?.total ?? items.length);
      setPage(targetPage);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      append ? setLoadingMore(false) : setLoading(false);
    }
  };

  useEffect(() => {
    suppressAutoSearchRef.current = true;
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const categoryRes = await getCategories();
        setCategories(categoryRes);
        const defaultCategory = categoryRes.find((category) => isOvalCategory(category.name));
        const nextFilters: OvalFilters = {
          name: '',
          size: '',
          minPrice: '',
          maxPrice: '',
          categoryId: defaultCategory?.id ?? '',
        };
        setFilters(nextFilters);
        setAppliedFilters(nextFilters);
        await loadCarpets(nextFilters, 1, false);
      } catch (err) {
        setError(getErrorMessage(err));
        setLoading(false);
      } finally {
        suppressAutoSearchRef.current = false;
      }
    };

    void load();
  }, []);

  useEffect(() => {
    if (suppressAutoSearchRef.current) return;

    const timer = window.setTimeout(() => {
      const nextFilters = { ...filters };
      setAppliedFilters(nextFilters);
      void loadCarpets(nextFilters, 1, false);
    }, 450);

    return () => {
      window.clearTimeout(timer);
    };
  }, [filters]);

  const resultText = loading
    ? 'Yuklanmoqda...'
    : carpets.length === 0
      ? 'Oval gilam topilmadi'
      : `${total > 0 ? total : carpets.length} ta oval gilam topildi`;
  const totalCount = total > 0 ? total : carpets.length;

  return (
    <div className="section-shell space-y-6 py-8">
      <section className="catalog-hero catalog-hero--oval fade-up px-6 py-8 md:px-10 md:py-11">
        <div className="pointer-events-none absolute inset-0">
          <div className="catalog-hero-float absolute left-[10%] top-[79%] text-fuchsia-200/75 [animation-delay:0ms]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="catalog-hero-float absolute left-[50%] top-[71%] text-pink-200/80 [animation-delay:700ms]">
            <Circle className="h-4 w-4 fill-current" />
          </div>
          <div className="catalog-hero-float absolute left-[79%] top-[77%] text-purple-100/75 [animation-delay:1200ms]">
            <Search className="h-5 w-5" />
          </div>
        </div>

        <div className="relative z-10 grid items-center gap-7 md:grid-cols-[1fr_auto]">
          <div className="space-y-4">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-white/90 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-pink-200" />
              Maxsus oval kolleksiya
            </p>
            <h1 className="font-serif text-4xl text-white md:text-6xl">Ovalni gilamlar</h1>
            <p className="max-w-2xl text-sm leading-relaxed text-white/85 md:text-base">
              Oval gilamlarni nomi, turi, o&apos;lchami va narxi bo&apos;yicha filtrlab, aynan
              xonangizga mos variantni tanlang.
            </p>
            <div className="flex flex-wrap gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-pink-100/35 bg-pink-500/20 px-4 py-2 text-sm font-bold text-white backdrop-blur-md">
                <Filter className="h-4 w-4 text-pink-200" />
                {loading ? 'Yuklanmoqda...' : `${totalCount} ta oval gilam`}
              </div>
              <a
                href="#oval-filter-panel"
                className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-4 py-2 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-white/25"
              >
                Filtrlashga o&apos;tish
              </a>
            </div>
          </div>

          <div className="hidden items-center md:flex">
            <div className="relative h-44 w-44 rounded-full border border-white/25 bg-white/10 backdrop-blur-xl">
              <div className="absolute inset-5 animate-spin rounded-full border border-white/20 border-t-pink-200/80 [animation-duration:6.4s]" />
              <div className="absolute inset-9 animate-spin rounded-full border border-fuchsia-100/20 border-b-purple-200/80 [animation-duration:4.8s] [animation-direction:reverse]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Circle className="h-12 w-12 fill-fuchsia-200/25 text-pink-100" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="oval-filter-panel" className="panel p-6 shadow-2xl">
        <form
          onSubmit={(event) => {
            event.preventDefault();
          }}
          className="grid grid-cols-1 gap-4 md:grid-cols-6"
        >
          <input
            value={filters.name}
            onChange={(event) => setFilters((prev) => ({ ...prev, name: event.target.value }))}
            type="text"
            placeholder="Oval gilam nomi"
            className="input-field md:col-span-2"
          />
          <input
            value={filters.size}
            onChange={(event) => setFilters((prev) => ({ ...prev, size: event.target.value }))}
            type="text"
            placeholder="O'lcham (masalan: 2x3)"
            className="input-field md:col-span-2"
          />
          <select
            value={filters.categoryId}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, categoryId: event.target.value }))
            }
            className="input-field md:col-span-2"
          >
            <option value="">Barcha oval turlar</option>
            {ovalCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <input
            value={filters.minPrice}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, minPrice: sanitizeDigits(event.target.value) }))
            }
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Min narx"
            className="input-field md:col-span-2"
          />
          <input
            value={filters.maxPrice}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, maxPrice: sanitizeDigits(event.target.value) }))
            }
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Max narx"
            className="input-field md:col-span-2"
          />
          <button
            type="button"
            onClick={() => {
              const resetFilters: OvalFilters = {
                name: '',
                size: '',
                minPrice: '',
                maxPrice: '',
                categoryId: '',
              };
              setFilters(resetFilters);
              setAppliedFilters(resetFilters);
            }}
            className="btn-secondary py-3 md:col-span-2"
          >
            Tozalash
          </button>
        </form>
      </section>

      <div className="flex items-center justify-between">
        <p className="text-sm text-ink/70">{resultText}</p>
      </div>

      <CarpetList carpets={carpets} loading={loading} emptyText="Oval gilamlar topilmadi." />

      <Pagination
        page={page}
        limit={LIMIT}
        total={total}
        loading={loadingMore}
        onPageChange={(newPage) => void loadCarpets(appliedFilters, newPage, false)}
      />

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
