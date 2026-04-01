'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { api, formatPrice, getErrorMessage } from '@/services/api';
import type { Carpet, CarpetListResponse } from '@/types/carpet';

export default function AdminRestockCarpetsPage() {
  const [items, setItems] = useState<Carpet[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState('');

  const load = async (value: string) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      const { data } = await api.get<CarpetListResponse>('/carpets', {
        params: {
          page: 1,
          limit: 100,
          showAll: true,
          search: value ? value.trim() : undefined,
        },
      });
      setItems(data.items ?? []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load('');
  }, []);

  const handleAddStock = async (carpet: Carpet) => {
    const raw = quantities[carpet.id] ?? '';
    const qty = Number(raw);
    if (!Number.isFinite(qty) || qty <= 0) {
      setError("Qo'shiladigan miqdorni to'g'ri kiriting.");
      return;
    }

    try {
      setLoading(true);
      setError('');
      await api.patch(`/carpets/${carpet.id}`, {
        stock: carpet.stock + qty,
      });
      setItems((prev) =>
        prev.map((item) =>
          item.id === carpet.id ? { ...item, stock: item.stock + qty } : item,
        ),
      );
      setQuantities((prev) => ({ ...prev, [carpet.id]: '' }));
      setSuccess(`"${carpet.name}" uchun ${qty} ta qo'shildi.`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const buildEditUrl = (carpet: Carpet) => {
    const params = new URLSearchParams();
    params.set('name', carpet.name);
    params.set('size', carpet.size);
    params.set('material', carpet.material);
    params.set('categoryId', carpet.categoryId);
    if (carpet.description) params.set('description', carpet.description);
    return `/admin/carpets/create?${params.toString()}`;
  };

  const resultText = useMemo(() => {
    if (loading) return 'Yuklanmoqda...';
    return `${items.length} ta gilam topildi`;
  }, [items.length, loading]);

  return (
    <div className="section-shell py-8">
      <div className="flex flex-col gap-4">
        <h1 className="font-serif text-4xl text-ink">Avval qo&apos;shilgan gilamni qo&apos;shish</h1>
        <p className="text-sm text-ink/70">
          Gilam nomi bo&apos;yicha qidiring. Sotilgan va sotuvdagi gilamlar ham ko&apos;rsatiladi.
        </p>
      </div>

      <form
        className="panel mt-6 grid grid-cols-1 gap-4 p-4 md:grid-cols-6"
        onSubmit={(event) => {
          event.preventDefault();
          void load(search);
        }}
      >
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          type="text"
          placeholder="Gilam nomi"
          className="input-field md:col-span-4"
        />
        <button type="submit" className="btn-primary py-3 text-xs uppercase tracking-widest md:col-span-1">
          Qidirish
        </button>
        <button
          type="button"
          className="btn-secondary py-3 text-xs uppercase tracking-widest md:col-span-1"
          onClick={() => {
            setSearch('');
            void load('');
          }}
        >
          Tozalash
        </button>
      </form>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-ink/70">{resultText}</p>
      </div>

      {error ? (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </p>
      ) : null}

      <div className="mt-6 grid gap-3">
        {items.length === 0 && !loading ? (
          <p className="panel p-6 text-center text-ink/60">Gilam topilmadi.</p>
        ) : (
          items.map((carpet) => {
            return (
              <article key={carpet.id} className="panel flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-lg font-bold text-ink">{carpet.name}</p>
                  <p className="mt-1 text-sm text-ink/65">
                    <span className="rounded bg-sand px-1.5 py-0.5 font-mono">{carpet.size}</span>
                    <span className="mx-2 text-primary">|</span>
                    <span className="font-semibold text-primary">{formatPrice(carpet.price)}</span>
                    {carpet.category?.name ? (
                      <>
                        <span className="mx-2 text-ink/20">|</span>
                        <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-sky-700">
                          {carpet.category.name}
                        </span>
                      </>
                    ) : null}
                    <span className="mx-2 text-ink/20">|</span>
                    <span>
                      Qoldiq:{' '}
                      <span className={carpet.stock <= 0 ? 'font-bold text-red-500' : 'font-medium'}>
                        {carpet.stock} ta
                      </span>
                    </span>
                  </p>
                </div>

                <div className="flex flex-1 flex-col gap-3 md:max-w-sm">
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={1}
                      placeholder="Nechta qo'shilsin?"
                      value={quantities[carpet.id] ?? ''}
                      onChange={(event) =>
                        setQuantities((prev) => ({ ...prev, [carpet.id]: event.target.value }))
                      }
                      className="input-field flex-1"
                    />
                    <button
                      type="button"
                      className="btn-primary px-5 py-3 text-xs uppercase tracking-widest"
                      onClick={() => void handleAddStock(carpet)}
                      disabled={loading}
                    >
                      Qo&apos;shish
                    </button>
                  </div>
                  <Link
                    href={buildEditUrl(carpet)}
                    className="btn-secondary px-5 py-3 text-center text-xs uppercase tracking-widest"
                  >
                    Tahrirlab qo&apos;shish
                  </Link>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
