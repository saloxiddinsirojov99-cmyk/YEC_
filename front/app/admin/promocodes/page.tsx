'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api, formatPrice, getErrorMessage, getImageUrl } from '@/services/api';

type PromoCodeType = 'DISCOUNT' | 'GIFT';

type PromoCode = {
  id: string;
  code: string;
  discountPercent: number;
  type?: PromoCodeType | null;
  minOrderAmount?: number | null;
  startsAt?: string | null;
  expiresAt?: string | null;
  giftName?: string | null;
  giftImage?: string | null;
  giftPrice?: number | null;
  isActive: boolean;
  createdAt: string;
  _count?: {
    usages: number;
  };
};

const parseDateUTC = (value: string, endOfDay: boolean) => {
  if (!value) return undefined;
  const [year, month, day] = value.split('-').map((v) => Number(v));
  if (!year || !month || !day) return undefined;
  const date = endOfDay
    ? new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999))
    : new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  return date.toISOString();
};

const formatDate = (value?: string | null) => {
  if (!value) return 'Cheklanmagan';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Cheklanmagan';
  return date.toLocaleDateString('uz-UZ');
};

export default function AdminPromoCodesPage() {
  const [items, setItems] = useState<PromoCode[]>([]);
  const [code, setCode] = useState('');
  const [promoType, setPromoType] = useState<PromoCodeType>('DISCOUNT');
  const [discountPercent, setDiscountPercent] = useState('10');
  const [minOrderAmount, setMinOrderAmount] = useState('0');
  const [startsAt, setStartsAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [giftPrice, setGiftPrice] = useState('');
  const [giftImage, setGiftImage] = useState('');
  const [giftUploading, setGiftUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const { data } = await api.get<PromoCode[]>('/promo-codes');
      setItems(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const typeLabel = (type?: PromoCodeType | null) =>
    type === 'GIFT' ? 'Gilamcha' : 'Skidka';

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setSubmitting(true);
      setError('');
      setStatus('');

      const parsedMinOrderAmount = Number(minOrderAmount);
      if (!Number.isFinite(parsedMinOrderAmount) || parsedMinOrderAmount < 0) {
        setError("Minimal summa manfiy bo'lishi mumkin emas.");
        return;
      }

      if (promoType === 'GIFT') {
        if (!giftImage) {
          setError('Gilamcha rasmini yuklang.');
          return;
        }
        if (!giftPrice.trim()) {
          setError('Gilamcha narxini kiriting.');
          return;
        }

        const parsedGiftPrice = Number(giftPrice);
        if (!Number.isFinite(parsedGiftPrice) || parsedGiftPrice < 0) {
          setError("Gilamcha narxi manfiy bo'lishi mumkin emas.");
          return;
        }
      }

      const payload: Record<string, unknown> = {
        code: code.trim().toUpperCase(),
        promoType,
        minOrderAmount: parsedMinOrderAmount || 0,
        startsAt: startsAt ? parseDateUTC(startsAt, false) : undefined,
        expiresAt: expiresAt ? parseDateUTC(expiresAt, true) : undefined,
      };

      if (promoType === 'DISCOUNT') {
        const parsedDiscountPercent = Number(discountPercent);
        if (
          !Number.isFinite(parsedDiscountPercent) ||
          parsedDiscountPercent <= 0 ||
          parsedDiscountPercent > 99
        ) {
          setError("Skidka foizi 1 dan 99 gacha bo'lishi kerak.");
          return;
        }
        payload.discountPercent = Math.round(parsedDiscountPercent);
      } else {
        payload.giftImage = giftImage;
        payload.giftPrice = Number(giftPrice) || 0;
        payload.giftName = 'Gilamcha';
      }

      await api.post('/promo-codes', payload);

      setStatus('Promokod muvaffaqiyatli qo\'shildi.');
      setCode('');
      setDiscountPercent('10');
      setMinOrderAmount('0');
      setStartsAt('');
      setExpiresAt('');
      setGiftPrice('');
      setGiftImage('');
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (item: PromoCode) => {
    try {
      setError('');
      await api.patch(`/promo-codes/${item.id}`, {
        isActive: !item.isActive,
      });
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleGiftUpload = async (file: File) => {
    try {
      setGiftUploading(true);
      const form = new FormData();
      form.append('file', file);
      const { data } = await api.post<{ url: string }>('/upload/image', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setGiftImage(data.url);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setGiftUploading(false);
    }
  };

  const promoInfo = useMemo(
    () =>
      items.map((item) => {
        const startLabel = formatDate(item.startsAt);
        const endLabel = formatDate(item.expiresAt);
        const minAmount = item.minOrderAmount ?? 0;
        const minLabel = minAmount > 0 ? formatPrice(minAmount) : 'Barchasi uchun';
        return { startLabel, endLabel, minLabel };
      }),
    [items],
  );

  return (
    <div className="section-shell py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-4xl text-ink">Promokodlar</h1>
          <p className="mt-2 text-sm text-ink/60">
            Har bir foydalanuvchi bir promokoddan faqat 1 marta foydalanadi.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/orders"
            className="rounded-xl border border-sand bg-white px-4 py-2 text-sm font-semibold text-ink/80 hover:bg-sand/40"
          >
            Buyurtmalar
          </Link>
          <Link
            href="/admin"
            className="rounded-xl border border-sand bg-white px-4 py-2 text-sm font-semibold text-ink/80 hover:bg-sand/40"
          >
            Admin panel
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

      <form onSubmit={submit} className="panel mt-6 grid gap-3 p-6 md:grid-cols-6">
        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-semibold text-ink/60">Promokod</label>
          <input
            className="input-field"
            placeholder="Promokod (masalan: YECUZ)"
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-ink/60">Turi</label>
          <select
            className="input-field"
            value={promoType}
            onChange={(event) => setPromoType(event.target.value as PromoCodeType)}
          >
            <option value="DISCOUNT">Skidka</option>
            <option value="GIFT">Gilamcha</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-ink/60">Min summa</label>
          <input
            className="input-field"
            type="number"
            min={0}
            placeholder="0 = barcha"
            value={minOrderAmount}
            onKeyDown={(event) => {
              if (event.key === '-' || event.key === 'e' || event.key === 'E') {
                event.preventDefault();
              }
            }}
            onChange={(event) => {
              const value = event.target.value;
              if (value === '') {
                setMinOrderAmount('');
                return;
              }
              const parsed = Number(value);
              if (!Number.isFinite(parsed)) return;
              setMinOrderAmount(String(Math.max(0, Math.round(parsed))));
            }}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-ink/60">Boshlanish</label>
          <input
            className="input-field"
            type="date"
            value={startsAt}
            onChange={(event) => setStartsAt(event.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-ink/60">Tugash</label>
          <input
            className="input-field"
            type="date"
            value={expiresAt}
            onChange={(event) => setExpiresAt(event.target.value)}
          />
        </div>

        {promoType === 'DISCOUNT' ? (
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-ink/60">Skidka foizi</label>
            <input
              className="input-field"
              type="number"
              min={1}
              max={99}
              placeholder="Skidka foizi"
              value={discountPercent}
              onKeyDown={(event) => {
                if (event.key === '-' || event.key === 'e' || event.key === 'E') {
                  event.preventDefault();
                }
              }}
              onChange={(event) => {
                const value = event.target.value;
                if (value === '') {
                  setDiscountPercent('');
                  return;
                }
                const parsed = Number(value);
                if (!Number.isFinite(parsed)) return;
                const clamped = Math.min(99, Math.max(1, parsed));
                setDiscountPercent(String(Math.round(clamped)));
              }}
              required
            />
          </div>
        ) : (
          <>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-ink/60">Gilamcha narxi</label>
              <input
                className="input-field"
                type="number"
                min={0}
                placeholder="Narxi (so'm)"
                value={giftPrice}
                onKeyDown={(event) => {
                  if (event.key === '-' || event.key === 'e' || event.key === 'E') {
                    event.preventDefault();
                  }
                }}
                onChange={(event) => {
                  const value = event.target.value;
                  if (value === '') {
                    setGiftPrice('');
                    return;
                  }
                  const parsed = Number(value);
                  if (!Number.isFinite(parsed)) return;
                  setGiftPrice(String(Math.max(0, Math.round(parsed))));
                }}
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-ink/60">Gilamcha rasmi</label>
              <div className="flex items-center gap-3">
                <label className="flex h-12 flex-1 cursor-pointer items-center justify-center rounded-xl border border-dashed border-ink/20 bg-white/70 text-xs font-semibold text-ink/60 transition hover:border-primary">
                  {giftUploading ? 'Yuklanmoqda...' : 'Rasm yuklash'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void handleGiftUpload(file);
                    }}
                  />
                </label>
                {giftImage ? (
                  <div className="relative h-12 w-16 overflow-hidden rounded-lg border border-sand">
                    <img
                      src={getImageUrl(giftImage) || giftImage}
                      alt="Gilamcha"
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </>
        )}

        <button type="submit" className="btn-primary md:col-span-2" disabled={submitting || giftUploading}>
          {submitting ? 'Saqlanmoqda...' : "Promokod qo'shish"}
        </button>
      </form>

      <div className="mt-6 space-y-3">
        {loading ? (
          <p className="py-8 text-center text-ink/40">Yuklanmoqda...</p>
        ) : items.length === 0 ? (
          <p className="py-8 text-center text-ink/40">Promokodlar yo&apos;q.</p>
        ) : (
          items.map((item, index) => {
            const info = promoInfo[index];
            return (
              <article
                key={item.id}
                className="panel flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-bold text-ink">{item.code}</p>
                    <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold uppercase text-sky-700">
                      {typeLabel(item.type)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-ink/65">
                    {item.type === 'GIFT' ? (
                      <>Gilamcha: {formatPrice(item.giftPrice ?? 0)}</>
                    ) : (
                      <>-{item.discountPercent}%</>
                    )}
                    {' '}| Foydalanilgan: {item._count?.usages ?? 0} marta
                  </p>
                  <p className="mt-1 text-xs text-ink/50">
                    Amal qilish: {info.startLabel} - {info.endLabel}
                  </p>
                  <p className="mt-1 text-xs text-ink/50">
                    Min summa: {info.minLabel}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {item.type === 'GIFT' && item.giftImage ? (
                    <div className="h-12 w-16 overflow-hidden rounded-lg border border-sand">
                      <img
                        src={getImageUrl(item.giftImage) || item.giftImage}
                        alt={item.giftName || 'Gilamcha'}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : null}
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      item.isActive
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {item.isActive ? 'Faol' : 'Faol emas'}
                  </span>
                  <button
                    type="button"
                    onClick={() => void toggleActive(item)}
                    className="rounded-xl border border-sand bg-white px-4 py-2 text-sm font-semibold text-ink/80 hover:bg-sand/40"
                  >
                    {item.isActive ? 'O\'chirish' : 'Faollashtirish'}
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
