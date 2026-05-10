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
    <div className="relative min-h-screen bg-[#020617] overflow-hidden sm:py-12 py-6">
      {/* Background ambient glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-fuchsia-600/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-pink-600/5 rounded-full blur-[150px] mix-blend-screen pointer-events-none" />

      <div className="section-shell relative z-10 space-y-12">
        <section className="catalog-hero catalog-hero--oval fade-up px-8 py-10 md:px-14 md:py-16">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="catalog-hero-float absolute left-[5%] top-[15%] text-fuchsia-400/30 [animation-duration:3s]">
              <Circle className="h-24 w-24" />
            </div>
            <div className="catalog-hero-float absolute right-[10%] bottom-[10%] text-pink-400/20 [animation-duration:4s]">
              <Circle className="h-40 w-40" />
            </div>
            <div className="catalog-hero-float absolute left-[40%] top-[60%] text-purple-400/20 [animation-duration:5s]">
              <Sparkles className="h-8 w-8" />
            </div>
          </div>

          <div className="relative z-10 grid items-center gap-10 md:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <p className="inline-flex items-center gap-2 rounded-full border border-pink-400/30 bg-pink-500/10 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.4em] text-pink-200 backdrop-blur-md shadow-[0_0_20px_rgba(244,114,182,0.2)]">
                <span className="h-1.5 w-1.5 rounded-full bg-pink-400 animate-pulse" />
                Royal Collection
              </p>
              <h1 className="font-serif text-5xl text-white md:text-7xl leading-tight">
                Ovalni <span className="text-pink-300">gilamlar</span>
              </h1>
              <p className="max-w-xl text-lg leading-relaxed text-pink-100/80">
                Sizning uyingiz uchun maxsus ishlab chiqarilgan, nafislik va qulaylik uyg&apos;unligi. Oval shakldagi gilamlar xonangizga o&apos;zgacha fayz bag&apos;ishlaydi.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <div className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold text-white backdrop-blur-md">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-pink-500/20 text-pink-300">
                    <Filter className="h-3.5 w-3.5" />
                  </span>
                  {loading ? 'Yuklanmoqda...' : `${totalCount} ta eksklyuziv model`}
                </div>
                <a
                  href="#oval-filter-panel"
                  className="group inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-bold text-purple-900 transition-all hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(255,255,255,0.2)]"
                >
                  Filtrlashga o&apos;tish
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </a>
              </div>
            </div>

            <div className="hidden justify-end md:flex">
              <div className="relative h-64 w-64 rounded-full border border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl">
                <div className="absolute inset-4 animate-spin rounded-full border border-pink-500/10 border-t-pink-400/60 [animation-duration:8s]" />
                <div className="absolute inset-8 animate-spin rounded-full border border-purple-500/10 border-b-purple-400/60 [animation-duration:6s] [animation-direction:reverse]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative h-32 w-32 animate-logo-bounce">
                    <Circle className="h-full w-full text-white/10 fill-white/5" />
                    <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-12 w-12 text-pink-200/80" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="oval-filter-panel" className="oval-filter-card p-8 sm:p-10">
          <header className="mb-8 flex items-center gap-4">
            <div className="h-10 w-10 grid place-items-center rounded-xl bg-pink-500/20 text-pink-300">
              <Filter className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Filtrlash</h2>
              <p className="text-sm text-slate-400">Kerakli gilamni tezroq toping</p>
            </div>
          </header>

          <form
            onSubmit={(event) => {
              event.preventDefault();
            }}
            className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-6"
          >
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Nomi</label>
              <input
                value={filters.name}
                onChange={(event) => setFilters((prev) => ({ ...prev, name: event.target.value }))}
                type="text"
                placeholder="Masalan: Luna"
                className="input-field !bg-white/5 !border-white/10 !text-white focus:!border-pink-500/50"
              />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">O&apos;lcham</label>
              <input
                value={filters.size}
                onChange={(event) => setFilters((prev) => ({ ...prev, size: event.target.value }))}
                type="text"
                placeholder="Masalan: 2x3"
                className="input-field !bg-white/5 !border-white/10 !text-white focus:!border-pink-500/50"
              />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Tur</label>
              <select
                value={filters.categoryId}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, categoryId: event.target.value }))
                }
                className="input-field !bg-white/5 !border-white/10 !text-white focus:!border-pink-500/50"
              >
                <option value="">Barcha oval turlar</option>
                {ovalCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Min narx</label>
              <input
                value={filters.minPrice}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, minPrice: sanitizeDigits(event.target.value) }))
                }
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="0"
                className="input-field !bg-white/5 !border-white/10 !text-white focus:!border-pink-500/50"
              />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Max narx</label>
              <input
                value={filters.maxPrice}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, maxPrice: sanitizeDigits(event.target.value) }))
                }
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="10 000 000"
                className="input-field !bg-white/5 !border-white/10 !text-white focus:!border-pink-500/50"
              />
            </div>
            <div className="md:col-span-2 flex items-end">
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
                className="btn-secondary w-full py-4 !bg-white/5 !border-white/10 !text-white hover:!bg-white/10"
              >
                Tozalash
              </button>
            </div>
          </form>
        </section>

        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <p className="text-lg font-serif text-white/90">{resultText}</p>
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
    </div>
  );
}
