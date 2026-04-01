'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { api, getErrorMessage } from '@/services/api';

type UpdateM2PriceResponse = {
  updatedCount?: number;
  m2Price?: number;
};

export default function AdminPricesPage() {
  const [nameOptions, setNameOptions] = useState<string[]>([]);
  const [selectedNames, setSelectedNames] = useState<string[]>([]);
  const [nameSearch, setNameSearch] = useState('');
  const [m2PriceInput, setM2PriceInput] = useState('');
  const [loadingNames, setLoadingNames] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    const loadNames = async () => {
      try {
        setLoadingNames(true);
        const { data } = await api.get<string[]>('/carpets/names', {
          params: { kind: 'carpet' },
        });
        setNameOptions(Array.isArray(data) ? data : []);
        setError('');
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoadingNames(false);
      }
    };

    void loadNames();
  }, []);

  const visibleNames = useMemo(() => {
    const query = nameSearch.trim().toLowerCase();
    const filtered = query
      ? nameOptions.filter((name) => name.toLowerCase().includes(query))
      : nameOptions;
    return filtered.slice(0, 200);
  }, [nameOptions, nameSearch]);

  const toggleSelectedName = (name: string) => {
    setSelectedNames((prev) =>
      prev.includes(name) ? prev.filter((value) => value !== name) : [...prev, name],
    );
  };

  const clearForm = () => {
    setSelectedNames([]);
    setNameSearch('');
    setM2PriceInput('');
    setError('');
    setStatus('');
  };

  const applyM2Price = async () => {
    const parsed = Number(m2PriceInput);
    const m2Price = Math.round(parsed * 100) / 100;

    if (selectedNames.length === 0) {
      setError("Kamida bitta kolleksiya nomini tanlang.");
      return;
    }

    if (!Number.isFinite(m2Price) || m2Price <= 0) {
      setError("m2 narxini to'g'ri kiriting.");
      return;
    }

    try {
      setSaving(true);
      setError('');
      setStatus('');

      const { data } = await api.patch<UpdateM2PriceResponse>('/carpets/m2-price', {
        names: selectedNames,
        m2Price,
      });

      const updatedCount = Number(data?.updatedCount ?? 0);
      setStatus(
        `Bajarildi. ${updatedCount} ta mahsulot narxi yangilandi. Yangi m2 narxi: ${m2Price}.`,
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="section-shell py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-4xl text-ink">m2 narxni boshqarish</h1>
          <p className="mt-2 text-sm text-ink/60">
            Kolleksiya nomini tanlang (masalan: Etalon). Kiritilgan bitta m2 narx shu
            kolleksiyadagi barcha o&apos;lchamlarga qo&apos;llanadi.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/discounts"
            className="rounded-xl border border-sand bg-white px-4 py-2 text-sm font-semibold text-ink/80 hover:bg-sand/40"
          >
            Skidkalar
          </Link>
          <Link
            href="/admin/carpets"
            className="rounded-xl border border-sand bg-white px-4 py-2 text-sm font-semibold text-ink/80 hover:bg-sand/40"
          >
            Gilamlar ro&apos;yxati
          </Link>
        </div>
      </div>

      {error ? (
        <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {status ? (
        <p className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {status}
        </p>
      ) : null}

      <div className="panel mt-6 p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <input
              type="text"
              value={nameSearch}
              onChange={(event) => setNameSearch(event.target.value)}
              placeholder="Kolleksiya nomi bo'yicha qidirish..."
              className="w-full rounded-xl border border-sand bg-white px-4 py-2.5 text-sm text-ink outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
            />
            <div className="mt-3 max-h-72 overflow-auto rounded-xl border border-sand bg-white p-2">
              {loadingNames ? (
                <p className="p-3 text-sm text-ink/50">Yuklanmoqda...</p>
              ) : visibleNames.length === 0 ? (
                <p className="p-3 text-sm text-ink/50">Nomi topilmadi.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {visibleNames.map((name) => {
                    const selected = selectedNames.includes(name);
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => toggleSelectedName(name)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                          selected
                            ? 'bg-primary text-white'
                            : 'border border-sand bg-white text-ink/80 hover:bg-sand/50'
                        }`}
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <p className="mt-2 text-xs text-ink/45">
              Tanlangan kolleksiya: <span className="font-semibold">{selectedNames.length}</span> ta
            </p>
          </div>

          <div className="space-y-3">
            <input
              type="number"
              min={0.01}
              step="0.01"
              value={m2PriceInput}
              onKeyDown={(event) => {
                if (event.key === '-' || event.key === 'e' || event.key === 'E') {
                  event.preventDefault();
                }
              }}
              onChange={(event) => {
                const value = event.target.value;
                if (value === '') {
                  setM2PriceInput('');
                  return;
                }
                const parsed = Number(value);
                if (!Number.isFinite(parsed)) return;
                setM2PriceInput(String(Math.max(0, parsed)));
              }}
              placeholder="m2 narxi"
              className="w-full rounded-xl border border-sand bg-white px-4 py-2.5 text-sm text-ink outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
            />
            <button
              type="button"
              disabled={saving}
              onClick={() => void applyM2Price()}
              className="w-full rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Narxni yangilash
            </button>
            <button
              type="button"
              onClick={clearForm}
              className="w-full rounded-xl border border-sand px-4 py-2.5 text-sm font-medium text-ink/60 transition-colors hover:bg-sand/50"
            >
              Tozalash
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
