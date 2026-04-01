'use client';

import { useEffect, useState } from 'react';
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
        showAll: true,
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
    void loadCarpets(appliedFilters, activeSize, 1);
  }, []);

  const resultText = loading
    ? 'Yuklanmoqda...'
    : carpets.length === 0
      ? 'Joynamoz topilmadi'
      : `${total > 0 ? total : carpets.length} ta joynamoz topildi`;

  return (
    <div className="section-shell space-y-6 py-8">
      <header className="fade-up">
        <p className="text-xs font-bold uppercase tracking-[0.4em] text-emerald-600">Joynamozlar</p>
        <h1 className="text-premium font-serif text-3xl md:text-5xl">Joynamozlar</h1>
        <p className="mt-3 text-sm text-ink/70">
          Joynamoz nomi yoki o&apos;lchami bo&apos;yicha keraklisini toping.
        </p>
      </header>

      <div className="fade-up">
        <form
          className="panel mb-4 grid grid-cols-1 gap-4 p-4 md:grid-cols-6"
          onSubmit={(event) => {
            event.preventDefault();
            const nextFilters = { ...filters };
            setAppliedFilters(nextFilters);
            void loadCarpets(nextFilters, activeSize, 1);
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
            <button type="submit" className="btn-primary flex-1 py-3 text-xs uppercase tracking-widest">
              Qidirish
            </button>
            <button
              type="button"
              onClick={() => {
                const cleared: Filters = { name: '' };
                setFilters(cleared);
                setAppliedFilters(cleared);
                setActiveSize('all');
                void loadCarpets(cleared, 'all', 1);
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
                  void loadCarpets(appliedFilters, option.value, 1);
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
