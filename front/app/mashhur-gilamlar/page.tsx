'use client';

import { useEffect, useState } from 'react';
import CarpetList from '@/components/CarpetList';
import { getCarpets } from '@/services/carpet.service';
import { getErrorMessage } from '@/services/api';
import type { Carpet } from '@/types/carpet';

const LIMIT = 10;

export default function MashhurGilamlarPage() {
  const [carpets, setCarpets] = useState<Carpet[]>([]);
  const [filters, setFilters] = useState({ name: '', size: '' });
  const [appliedFilters, setAppliedFilters] = useState({ name: '', size: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadCarpets = async (state: typeof appliedFilters) => {
    try {
      setLoading(true);
      setError('');

      const res = await getCarpets({
        page: 1,
        limit: 10,
        showAll: true,
        search: state.name.trim() || undefined,
        size: state.size.trim() || undefined,
        sortBy: 'popular',
        kind: 'carpet',
      });

      setCarpets(res.items ?? []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCarpets(appliedFilters);
  }, []);

  useEffect(() => {
    const handleLikeChange = () => {
      void loadCarpets(appliedFilters);
    };

    window.addEventListener('yec-like-changed', handleLikeChange);
    return () => window.removeEventListener('yec-like-changed', handleLikeChange);
  }, [appliedFilters]);

  const resultCount = carpets.length;
  const resultText = loading
    ? 'Yuklanmoqda...'
    : `Mashhur gilamlar: ${resultCount} ta`;

  return (
    <div className="section-shell space-y-6 py-8">
      <header className="fade-up">
        <p className="text-xs font-bold uppercase tracking-[0.4em] text-blue-600">Top sotuvlar</p>
        <h1 className="text-premium font-serif text-3xl md:text-5xl">Mashhur gilamlar</h1>
        <p className="mt-3 text-sm text-ink/70">
          Gilam nomi yoki o&apos;lchamiga qarab qidiring.
        </p>
      </header>

      <form
        className="panel grid grid-cols-1 gap-4 p-4 md:grid-cols-6"
        onSubmit={(event) => {
          event.preventDefault();
          const nextFilters = { ...filters };
          setAppliedFilters(nextFilters);
          void loadCarpets(nextFilters);
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
          <button type="submit" className="btn-primary flex-1 py-3 text-xs uppercase tracking-widest">
            Qidirish
          </button>
          <button
            type="button"
            onClick={() => {
              const cleared = { name: '', size: '' };
              setFilters(cleared);
              setAppliedFilters(cleared);
              void loadCarpets(cleared);
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

      <CarpetList carpets={carpets} loading={loading} emptyText="Mashhur gilamlar topilmadi." />

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}
    </div>
  );
}
