'use client';

import { useEffect, useMemo, useState } from 'react';
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
      }
    };

    void load();
  }, []);

  const resultText = loading
    ? 'Yuklanmoqda...'
    : carpets.length === 0
      ? 'Oval gilam topilmadi'
      : `${total > 0 ? total : carpets.length} ta oval gilam topildi`;

  return (
    <div className="section-shell space-y-6 py-8">
      <header className="fade-up">
        <p className="text-xs font-bold uppercase tracking-[0.4em] text-fuchsia-600">Maxsus</p>
        <h1 className="text-premium font-serif text-3xl md:text-5xl">Ovalni gilamlar</h1>
        <p className="mt-3 text-sm text-ink/70">
          Oval gilamlarni nomi, turi, o&apos;lchami va narxi bo&apos;yicha tez toping.
        </p>
      </header>

      <section className="panel p-6 shadow-2xl">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setAppliedFilters(filters);
            void loadCarpets(filters, 1, false);
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
          <button type="submit" className="btn-primary py-3">
            Qidirish
          </button>
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
              void loadCarpets(resetFilters, 1, false);
            }}
            className="btn-secondary py-3"
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
