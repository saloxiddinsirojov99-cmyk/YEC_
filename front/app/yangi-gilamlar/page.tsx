'use client';

import { useEffect, useRef, useState } from 'react';
import CarpetList from '@/components/CarpetList';
import Pagination from '@/components/Pagination';
import { getCarpets } from '@/services/carpet.service';
import { getErrorMessage } from '@/services/api';
import type { Carpet } from '@/types/carpet';

const LIMIT = 30;

export default function YangiGilamlarPage() {
  const [carpets, setCarpets] = useState<Carpet[]>([]);
  const [filters, setFilters] = useState({ name: '', size: '' });
  const [appliedFilters, setAppliedFilters] = useState({ name: '', size: '' });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const suppressAutoSearchRef = useRef(true);

  const loadCarpets = async (state: typeof appliedFilters, targetPage: number) => {
    try {
      setLoading(true);
      setError('');

      const res = await getCarpets({
        page: targetPage,
        limit: LIMIT,
        search: state.name.trim() || undefined,
        size: state.size.trim() || undefined,
        kind: 'carpet',
      });

      setCarpets(res.items ?? []);
      setTotal(res.meta?.total ?? res.items.length);
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
      await loadCarpets(appliedFilters, 1);
      suppressAutoSearchRef.current = false;
    };
    void init();
  }, []);

  useEffect(() => {
    if (suppressAutoSearchRef.current) return;

    const timer = window.setTimeout(() => {
      const nextFilters = { ...filters };
      setAppliedFilters(nextFilters);
      void loadCarpets(nextFilters, 1);
    }, 450);

    return () => {
      window.clearTimeout(timer);
    };
  }, [filters]);

  const resultText = loading
    ? 'Yuklanmoqda...'
    : `${total} ta yangi gilam topildi`;

  return (
    <div className="section-shell space-y-6 py-8">
      <header className="fade-up">
        <p className="text-xs font-bold uppercase tracking-[0.4em] text-sky-600">Yangi</p>
        <h1 className="text-premium font-serif text-3xl md:text-5xl">Yangi gilamlar</h1>
        <p className="mt-3 text-sm text-ink/70">
          Gilam nomi yoki o&apos;lchamiga qarab qidiring.
        </p>
      </header>

      <form
        className="panel grid grid-cols-1 gap-4 p-4 md:grid-cols-6"
        onSubmit={(event) => {
          event.preventDefault();
        }}
      >
        <input
          value={filters.name}
          onChange={(event) => setFilters((prev) => ({ ...prev, name: event.target.value }))}
          type="text"
          placeholder="Gilam nomi"
          className="input-field md:col-span-3"
        />
        <input
          value={filters.size}
          onChange={(event) => setFilters((prev) => ({ ...prev, size: event.target.value }))}
          type="text"
          placeholder="O'lcham (masalan: 2x3)"
          className="input-field md:col-span-2"
        />
        <div className="flex gap-3 md:col-span-1">
          <button
            type="button"
            onClick={() => {
              const cleared = { name: '', size: '' };
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

      <CarpetList carpets={carpets} loading={loading} emptyText="Yangi gilamlar topilmadi." />

      <Pagination
        page={page}
        limit={LIMIT}
        total={total}
        onPageChange={(newPage) => void loadCarpets(appliedFilters, newPage)}
      />

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}
    </div>
  );
}
