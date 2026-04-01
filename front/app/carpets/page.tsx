'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
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

const sanitizeNameSearch = (value: string) => value.replace(/[^\p{L}\s]+/gu, '');

const DESKTOP_LIMIT = 30;
const MOBILE_LIMIT = 5;
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
      }
    };

    void load();
  }, [initialCatId, limit, limitReady, initialKind, sanitizedSearch]);

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

  return (
    <div className="section-shell space-y-6 py-8">
      <header className="fade-up">
        <h1 className="font-serif text-4xl text-ink md:text-5xl">Gilamlar marketi</h1>
        <p className="mt-2 text-sm text-ink/70">
          Tur, narx, material va o&apos;lcham bo&apos;yicha kerakli gilamni tez toping.
        </p>
      </header>

      <div className="fade-up">
        <FilterPanel
          categories={visibleCategories}
          filters={filters}
          onChange={setFilters}
          onApply={() => {
            setAppliedFilters(filters);
            void loadCarpets(filters, 1, false);
          }}
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
            void loadCarpets(resetFilters, 1, false);
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


