'use client';

import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import CarpetList from '@/components/CarpetList';
import Pagination from '@/components/Pagination';
import { getCarpets, getCategories } from '@/services/carpet.service';
import { getErrorMessage } from '@/services/api';
import type { Carpet, Category } from '@/types/carpet';

const DESKTOP_LIMIT = 30;
const MOBILE_LIMIT = 10;
const MOBILE_MEDIA_QUERY = '(max-width: 767px)';

export default function TurDetailPage() {
  const params = useParams<{ id: string }>();
  const categoryId = params?.id;

  const [categoryName, setCategoryName] = useState('');
  const [carpets, setCarpets] = useState<Carpet[]>([]);
  const [filters, setFilters] = useState({ size: '' });
  const [appliedFilters, setAppliedFilters] = useState({ size: '' });
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

  const loadCarpets = async (
    state: { size: string },
    targetPage: number,
    append = false,
  ) => {
    if (!categoryId) return;
    try {
      append ? setLoadingMore(true) : setLoading(true);
      setError('');

      const sizeValue = state.size.trim();
      const res = await getCarpets({
        page: targetPage,
        limit,
        categoryId,
        size: sizeValue ? sizeValue : undefined,
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
    if (!categoryId || !limitReady) return;

    suppressAutoSearchRef.current = true;
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        setFilters({ size: '' });
        setAppliedFilters({ size: '' });
        const [carpetRes, categoriesRes] = await Promise.all([
          getCarpets({ page: 1, limit, categoryId }),
          getCategories(),
        ]);

        const category = (categoriesRes as Category[]).find((item) => item.id === categoryId);
        setCategoryName(category?.name ?? 'Tur');
        setCarpets(carpetRes.items ?? []);
        setTotal(carpetRes.meta?.total ?? (carpetRes.items ?? []).length);
        setPage(1);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
        suppressAutoSearchRef.current = false;
      }
    };

    void load();
  }, [categoryId, limit, limitReady]);

  useEffect(() => {
    if (!categoryId || !limitReady || suppressAutoSearchRef.current) return;

    const timer = window.setTimeout(() => {
      const nextFilters = { ...filters };
      setAppliedFilters(nextFilters);
      void loadCarpets(nextFilters, 1, false);
    }, 450);

    return () => {
      window.clearTimeout(timer);
    };
  }, [filters, categoryId, limitReady]);

  const resultText = loading
    ? 'Yuklanmoqda...'
    : carpets.length === 0
      ? 'Gilam topilmadi'
      : `${total > 0 ? total : carpets.length} ta gilam topildi`;

  return (
    <div className="section-shell space-y-6 py-8">
      <header className="fade-up">
        <p className="text-xs font-bold uppercase tracking-[0.4em] text-sky-600">Tur</p>
        <h1 className="text-premium font-serif text-3xl md:text-5xl">{categoryName}</h1>
        <p className="mt-3 text-sm text-ink/70">
          Faqat o&apos;lcham bo&apos;yicha qidiring.
        </p>
      </header>

      <form
        className="panel grid grid-cols-1 gap-4 p-4 md:grid-cols-6"
        onSubmit={(event) => {
          event.preventDefault();
        }}
      >
        <input
          value={filters.size}
          onChange={(event) => setFilters({ size: event.target.value })}
          type="text"
          placeholder="O'lcham (masalan: 2x3)"
          className="input-field md:col-span-5"
        />
        <div className="flex gap-3 md:col-span-1">
          <button
            type="button"
            onClick={() => {
              const cleared = { size: '' };
              setFilters(cleared);
              setAppliedFilters(cleared);
            }}
            className="btn-secondary flex-1 py-3 text-xs uppercase tracking-widest"
          >
            Tozalash
          </button>
        </div>
      </form>

      <div className="flex items-center justify-between">
        <p className="text-sm text-ink/70">{resultText}</p>
      </div>

      <CarpetList carpets={carpets} loading={loading} emptyText="Gilam topilmadi." />

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
