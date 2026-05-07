'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { api, formatPrice, getErrorMessage } from '@/services/api';
import type { CarpetListResponse } from '@/types/carpet';
import { clampDiscountPercent, getDiscountedPrice } from '@/utils/price';

export default function AdminCarpetsPage() {
  const [items, setItems] = useState<CarpetListResponse['items']>([]);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sizeInput, setSizeInput] = useState('');
  const [kindFilter, setKindFilter] = useState('');
  const [debouncedSearchInput, setDebouncedSearchInput] = useState('');
  const [debouncedSizeInput, setDebouncedSizeInput] = useState('');
  const [debouncedKindFilter, setDebouncedKindFilter] = useState('');
  const limit = 30;

  const load = useCallback(async (p: number, q: string, s: string, k: string) => {
    try {
      setLoading(true);
      const params: Record<string, any> = { page: p, limit, showAll: true };
      if (q.trim()) params.search = q.trim();
      if (s.trim()) params.size = s.trim();
      if (k) params.kind = k;
      const { data } = await api.get<CarpetListResponse>('/carpets', { params });
      setItems(data.items ?? []);
      setTotalPages(data.meta?.totalPages ?? 1);
      setTotal(data.meta?.total ?? 0);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearchInput(searchInput);
      setDebouncedSizeInput(sizeInput);
      setDebouncedKindFilter(kindFilter);
      setPage(1);
    }, 450);

    return () => {
      window.clearTimeout(timer);
    };
  }, [searchInput, sizeInput, kindFilter]);

  useEffect(() => {
    void load(page, debouncedSearchInput, debouncedSizeInput, debouncedKindFilter);
  }, [page, debouncedSearchInput, debouncedSizeInput, debouncedKindFilter, load]);

  const handleClearSearch = () => {
    setSearchInput('');
    setSizeInput('');
    setKindFilter('');
    setDebouncedSearchInput('');
    setDebouncedSizeInput('');
    setDebouncedKindFilter('');
    setPage(1);
  };

  const remove = async (id: string) => {
    try {
      await api.delete(`/carpets/${id}`);
      await load(page, debouncedSearchInput, debouncedSizeInput, debouncedKindFilter);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="section-shell py-8">
      <div className="flex flex-col gap-6">
        <h1 className="font-serif text-4xl text-ink">Gilamlar, joynamozlar va oval gilamlar</h1>
        <div className="grid gap-3 md:grid-cols-6">
          <Link
            href="/admin/carpets/create"
            className="btn-primary flex items-center justify-center gap-2 rounded-2xl py-5 text-xl shadow-lg ring-4 ring-primary/10 transition-all hover:scale-[1.02] active:scale-95"
          >
            <span className="text-3xl">+</span>
            Yangi gilam qo&apos;shish
          </Link>
          <Link
            href="/admin/carpets/create?type=joynamoz"
            className="btn-secondary flex items-center justify-center gap-2 rounded-2xl border-emerald-200 bg-emerald-50/70 py-5 text-xl font-semibold text-emerald-700 shadow-lg ring-4 ring-emerald-200/40 transition-all hover:scale-[1.02] active:scale-95"
          >
            <span className="text-3xl">+</span>
            Yangi joynamoz qo&apos;shish
          </Link>
          <Link
            href="/admin/carpets/create?type=oval"
            className="btn-secondary flex items-center justify-center gap-2 rounded-2xl border-fuchsia-200 bg-fuchsia-50/70 py-5 text-xl font-semibold text-fuchsia-700 shadow-lg ring-4 ring-fuchsia-200/40 transition-all hover:scale-[1.02] active:scale-95"
          >
            <span className="text-3xl">+</span>
            Yangi oval gilam
          </Link>
          <Link
            href="/admin/carpets/restock"
            className="btn-secondary flex items-center justify-center gap-2 rounded-2xl border-sky-200 bg-sky-50/70 py-5 text-xl font-semibold text-sky-700 shadow-lg ring-4 ring-sky-200/40 transition-all hover:scale-[1.02] active:scale-95"
          >
            Avval qo&apos;shilgan gilamni qo&apos;shish
          </Link>
          <Link
            href="/admin/discounts"
            className="btn-secondary flex items-center justify-center gap-2 rounded-2xl border-amber-200 bg-amber-50/70 py-5 text-xl font-semibold text-amber-700 shadow-lg ring-4 ring-amber-200/40 transition-all hover:scale-[1.02] active:scale-95"
          >
            Skidka boshqaruvi
          </Link>
          <Link
            href="/admin/prices"
            className="btn-secondary flex items-center justify-center gap-2 rounded-2xl border-indigo-200 bg-indigo-50/70 py-5 text-xl font-semibold text-indigo-700 shadow-lg ring-4 ring-indigo-200/40 transition-all hover:scale-[1.02] active:scale-95"
          >
            m2 narx boshqaruvi
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Nomi bo'yicha..."
          className="rounded-xl border border-sand bg-white px-4 py-2.5 text-sm text-ink outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
        />
        <input
          type="text"
          value={sizeInput}
          onChange={(e) => setSizeInput(e.target.value)}
          placeholder="O'lchami bo'yicha..."
          className="rounded-xl border border-sand bg-white px-4 py-2.5 text-sm text-ink outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
        />
        <select
          value={kindFilter}
          onChange={(e) => setKindFilter(e.target.value)}
          className="rounded-xl border border-sand bg-white px-4 py-2.5 text-sm text-ink outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
        >
          <option value="">Barchasi</option>
          <option value="carpet">Faqat gilamlar</option>
          <option value="prayer">Faqat joynamozlar</option>
        </select>
        <div className="flex gap-2">
          {(searchInput || sizeInput || kindFilter) && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="btn-secondary w-full px-4 py-2.5 text-sm font-medium md:w-auto"
            >
              Tozalash
            </button>
          )}
        </div>
      </div>

      {error ? (
        <p className="mt-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="mt-6 space-y-4">
        <div className="flex items-end gap-3 border-b border-sand pb-4">
          <h2 className="font-serif text-2xl text-ink">Mavjud mahsulotlar</h2>
          <span className="text-sm font-medium text-ink/40">
            Jami: {total} ta {debouncedSearchInput && `("${debouncedSearchInput}" bo'yicha)`}
          </span>
        </div>

        {loading ? (
          <p className="py-12 text-center text-ink/40">Yuklanmoqda...</p>
        ) : (
          <div className="grid gap-3">
            {items.length === 0 ? (
              <p className="py-12 text-center text-ink/40">Hozircha mahsulotlar yo&apos;q.</p>
            ) : (
              items.map((carpet) => {
                const discountPercent = clampDiscountPercent(carpet.discountPercent);
                const discountedPrice = getDiscountedPrice(carpet.price, discountPercent);

                return (
                  <article key={carpet.id} className="panel flex items-center justify-between p-5 transition-transform hover:-translate-y-0.5">
                    <div>
                      <p className="text-lg font-bold text-ink">
                        {carpet.name}
                        {carpet.designCode ? (
                          <span className="ml-2 font-mono text-xs text-sky-600 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                             #{carpet.designCode}
                          </span>
                        ) : null}
                        {discountPercent > 0 ? (
                          <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-amber-700 ring-1 ring-amber-200">
                            -{discountPercent}% skidka
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-1 text-sm text-ink/65">
                        <span className="rounded bg-sand px-1.5 py-0.5 font-mono">{carpet.size}</span>
                        <span className="mx-2 text-primary">|</span>
                        {discountPercent > 0 ? (
                          <>
                            <span className="font-semibold text-primary line-through decoration-red-500 decoration-2">
                              {formatPrice(carpet.price)}
                            </span>
                            <span className="mx-2 text-ink/20">|</span>
                            <span className="font-semibold text-amber-600">
                              {formatPrice(discountedPrice)}
                            </span>
                          </>
                        ) : (
                          <span className="font-semibold text-primary">{formatPrice(carpet.price)}</span>
                        )}
                      {carpet.category?.name ? (
                        <>
                          <span className="mx-2 text-ink/20">|</span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${carpet.category.name.toLowerCase().includes('joynamoz')
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-sky-100 text-sky-700'
                            }`}>
                            {carpet.category.name}
                          </span>
                        </>
                      ) : null}
                        <span className="mx-2 text-ink/20">|</span>
                        <span>Qoldiq: <span className={carpet.stock <= 3 ? 'font-bold text-red-500' : 'font-medium'}>{carpet.stock} ta</span></span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-500 transition-colors hover:bg-red-50"
                        onClick={() => {
                          if (window.confirm("Rostdan ham bu gilamni o'chirmoqchimisiz?")) void remove(carpet.id);
                        }}
                      >
                        O&apos;chirish
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (() => {
          const from = (page - 1) * limit + 1;
          const to = Math.min(page * limit, total);
          return (
            <div className="flex items-center justify-center gap-3 py-8">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-xl border border-sand bg-white px-4 py-3 text-lg font-bold text-ink transition-colors hover:bg-sand/50 disabled:cursor-not-allowed disabled:opacity-30"
              >
                ←
              </button>
              <span className="rounded-xl border border-primary/20 bg-primary/5 px-5 py-3 text-lg font-bold text-primary">
                {from}–{to} / {total}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-xl border border-sand bg-white px-4 py-3 text-lg font-bold text-ink transition-colors hover:bg-sand/50 disabled:cursor-not-allowed disabled:opacity-30"
              >
                →
              </button>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
