'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, formatPrice, getErrorMessage } from '@/services/api';
import { getCategories, getCollectionM2Price } from '@/services/carpet.service';
import type { Category } from '@/types/carpet';
import { parseAreaFromSize } from '@/utils/size';

const normalizeCollection = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const PRAYER_MAT_CATEGORY_NAME = 'Joynamoz';
const OVAL_CARPET_CATEGORY_NAME = 'Ovalni gilamlar';
const PRAYER_MAT_SIZES = [
  { label: '0.5 x 1.25 m', value: '0.5x1.25' },
  { label: '0.75 x 1.25 m', value: '0.75x1.25' },
];

type MaterialRule = {
  material: string;
  keywords: string[];
};

const AUTO_MATERIAL_RULES: MaterialRule[] = [
  {
    material: 'Micro-polyester',
    keywords: ['luna', 'orlando', 'trio', 'verona', 'mardin', 'micro', 'mikro', 'polyester', 'polister'],
  },
  {
    material: 'Acrylic',
    keywords: ['touch', 'steffano', 'fendi', 'etalon', 'antique', 'akril', 'acrylic'],
  },
  {
    material: 'Acrylic + Polyester',
    keywords: ['terra', 'zenit', 'zeugma', 'eron', 'iran'],
  },
];

const PRAYER_MAT_MATERIAL_RULES: MaterialRule[] = [
  { material: 'Baxmal (Velvet)', keywords: ['baxmal', 'velvet'] },
  { material: 'Ipak', keywords: ['ipak', 'silk', 'shoyi'] },
  { material: 'Cotton', keywords: ['paxta', 'cotton'] },
];

const AUTO_MANAGED_MATERIALS = [
  'Micro-polyester',
  'Acrylic',
  'Acrylic + Polyester',
  'Baxmal (Velvet)',
  'Ipak',
  'Cotton',
];

const resolveAutoMaterialByName = (rawName: string, isPrayerMat: boolean) => {
  const normalizedName = rawName.toLowerCase().trim();
  if (!normalizedName) return isPrayerMat ? 'Baxmal (Velvet)' : '';

  const fromCommonRules = AUTO_MATERIAL_RULES.find((rule) =>
    rule.keywords.some((keyword) => normalizedName.includes(keyword)),
  );
  if (fromCommonRules) return fromCommonRules.material;

  if (!isPrayerMat) return '';

  const fromPrayerRules = PRAYER_MAT_MATERIAL_RULES.find((rule) =>
    rule.keywords.some((keyword) => normalizedName.includes(keyword)),
  );
  return fromPrayerRules?.material ?? 'Baxmal (Velvet)';
};

const normalizeNonNegativeNumberInput = (rawValue: string) => {
  if (rawValue === '') return '';
  const normalized = rawValue.replace(',', '.');
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return '';
  return String(Math.max(0, parsed));
};

export default function CreateAdminCarpetPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const getParam = (key: string) => searchParams?.get(key) ?? '';
  const forcedPrayerMat = getParam('type') === 'joynamoz';
  const forcedOvalCarpet = getParam('type') === 'oval';
  const initialType =
    forcedPrayerMat ? 'joynamoz' : forcedOvalCarpet ? 'oval' : 'carpet';
  const initialName = getParam('name');
  const initialSize = getParam('size');
  const initialMaterial = getParam('material');
  const initialCategoryId = getParam('categoryId');
  const initialDescription = getParam('description');
  const initialStock = getParam('stock') || '10';
  const [categories, setCategories] = useState<Category[]>([]);
  const [productType, setProductType] = useState<'carpet' | 'joynamoz' | 'oval'>(
    initialType,
  );
  const [name, setName] = useState(initialName);
  const [pricePerM2, setPricePerM2] = useState('');
  const [stock, setStock] = useState(initialStock);
  const [size, setSize] = useState(initialSize);
  const [material, setMaterial] = useState(initialMaterial);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [description, setDescription] = useState(initialDescription);
  const [designCode, setDesignCode] = useState(''); // Gul kodi
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [m2LookupLoading, setM2LookupLoading] = useState(false);
  const [m2LookupDone, setM2LookupDone] = useState(false);
  const [m2AutoLocked, setM2AutoLocked] = useState(false);
  const [m2LookupNameKey, setM2LookupNameKey] = useState('');
  const [m2LookupMessage, setM2LookupMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [creatingForcedCategory, setCreatingForcedCategory] = useState(false);
  const isPrayerMat = productType === 'joynamoz';
  const isOvalCarpet = productType === 'oval';
  const forcedCategoryName = isPrayerMat
    ? PRAYER_MAT_CATEGORY_NAME
    : isOvalCarpet
      ? OVAL_CARPET_CATEGORY_NAME
      : '';

  useEffect(() => {
    if (forcedPrayerMat && productType !== 'joynamoz') {
      setProductType('joynamoz');
    }
    if (forcedOvalCarpet && productType !== 'oval') {
      setProductType('oval');
    }
  }, [forcedPrayerMat, forcedOvalCarpet, productType]);
  useEffect(() => {
    const load = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (err) {
        setError(getErrorMessage(err));
      }
    };
    void load();
  }, []);

  useEffect(() => {
    if (!isPrayerMat) return;
    if (!PRAYER_MAT_SIZES.some((option) => option.value === size)) {
      setSize(PRAYER_MAT_SIZES[0].value);
    }
  }, [isPrayerMat]);

  useEffect(() => {
    if (!forcedCategoryName) return;
    if (categories.length === 0) return;

    const existing = categories.find(
      (category) => category.name.toLowerCase() === forcedCategoryName.toLowerCase(),
    );

    if (existing) {
      if (categoryId !== existing.id) setCategoryId(existing.id);
      return;
    }

    if (creatingForcedCategory) return;

    const createCategory = async () => {
      try {
        setCreatingForcedCategory(true);
        const { data } = await api.post<Category>('/categories', {
          name: forcedCategoryName,
        });
        setCategories((prev) => [...prev, data]);
        setCategoryId(data.id);
      } catch (err) {
        const message = getErrorMessage(err);
        if (message.includes('Kategoriya allaqachon mavjud')) {
          const data = await getCategories();
          setCategories(data);
          const found = data.find(
            (category) =>
              category.name.toLowerCase() === forcedCategoryName.toLowerCase(),
          );
          if (found) setCategoryId(found.id);
        } else {
          setError(message);
        }
      } finally {
        setCreatingForcedCategory(false);
      }
    };

    void createCategory();
  }, [forcedCategoryName, categories, creatingForcedCategory, categoryId]);

  useEffect(() => {
    if (isPrayerMat || isOvalCarpet) return;

    const selectedCategory = categories.find((category) => category.id === categoryId);
    if (!selectedCategory) return;

    const normalizedName = selectedCategory.name.toLowerCase();
    if (normalizedName.includes(PRAYER_MAT_CATEGORY_NAME.toLowerCase()) || normalizedName.includes('oval')) {
      setCategoryId('');
    }
  }, [isPrayerMat, isOvalCarpet, categories, categoryId]);

  const area = useMemo(() => parseAreaFromSize(size), [size]);
  const totalPrice = useMemo(() => {
    if (isPrayerMat) {
      const p = Number(pricePerM2.replace(',', '.'));
      return Number.isFinite(p) && p > 0 ? Math.round(p) : null;
    }
    const per = Number(pricePerM2.replace(',', '.'));
    if (!area || !Number.isFinite(per) || per <= 0) return null;
    return Math.round(area * per);
  }, [area, pricePerM2, isPrayerMat]);

  const lookupM2ByName = async (): Promise<{
    ok: boolean;
    autoLocked: boolean;
    resolvedM2Price: number | null;
  }> => {
    if (isPrayerMat) {
      setM2LookupDone(false);
      setM2AutoLocked(false);
      setM2LookupNameKey('');
      setM2LookupMessage('');
      return { ok: true, autoLocked: false, resolvedM2Price: null };
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      setM2LookupDone(false);
      setM2AutoLocked(false);
      setM2LookupNameKey('');
      setM2LookupMessage("Avval gilam nomini to'liq kiriting.");
      return { ok: false, autoLocked: false, resolvedM2Price: null };
    }

    const lookupKey = normalizeCollection(trimmedName);
    if (lookupKey && lookupKey === m2LookupNameKey && m2LookupDone) {
      return {
        ok: true,
        autoLocked: m2AutoLocked,
        resolvedM2Price: m2AutoLocked ? Number(pricePerM2.replace(',', '.')) : null,
      };
    }

    try {
      setM2LookupLoading(true);
      setError('');
      const result = await getCollectionM2Price(trimmedName);
      setM2LookupDone(true);
      setM2LookupNameKey(lookupKey);

      if (result.found && Number(result.m2Price) > 0) {
        const autoM2 = Math.round(Number(result.m2Price) * 100) / 100;
        setPricePerM2(String(autoM2));
        setM2AutoLocked(true);
        setM2LookupMessage(
          `"${result.collectionName}" topildi. m2 narxi avtomatik qo'yildi: ${autoM2}.`,
        );
        return { ok: true, autoLocked: true, resolvedM2Price: autoM2 };
      } else {
        setPricePerM2('');
        setM2AutoLocked(false);
        setM2LookupMessage(
          `Bunday nomdagi gilam topilmadi. m2 narxini qo'lda kiriting (majburiy).`,
        );
        return { ok: true, autoLocked: false, resolvedM2Price: null };
      }
    } catch (err) {
      setM2LookupDone(false);
      setM2AutoLocked(false);
      setM2LookupNameKey('');
      setM2LookupMessage("Nom bo'yicha m2 narxini tekshirib bo'lmadi.");
      setError(getErrorMessage(err));
      return { ok: false, autoLocked: false, resolvedM2Price: null };
    } finally {
      setM2LookupLoading(false);
    }
  };

  useEffect(() => {
    if (isPrayerMat || isOvalCarpet) {
      setM2LookupDone(false);
      setM2AutoLocked(false);
      setM2LookupNameKey('');
      setM2LookupMessage('');
    }
  }, [isPrayerMat, isOvalCarpet]);

  // Auto-fill material based on name (including joynamoz)
  useEffect(() => {
    if (!name && !isPrayerMat) return;

    const autoMaterial = resolveAutoMaterialByName(name, isPrayerMat);
    if (!autoMaterial) return;

    if (
      !material ||
      AUTO_MANAGED_MATERIALS.includes(material.trim())
    ) {
      setMaterial(autoMaterial);
    }
  }, [name, isPrayerMat, material]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      let effectiveTotalPrice = totalPrice;
      let isAutoLockedNow = m2AutoLocked;

      if (!isPrayerMat) {
        const currentLookupKey = normalizeCollection(name.trim());
        const needsLookup =
          !m2LookupDone || !currentLookupKey || currentLookupKey !== m2LookupNameKey;

        if (needsLookup) {
          const lookupResult = await lookupM2ByName();
          if (!lookupResult.ok) {
            return;
          }
          isAutoLockedNow = lookupResult.autoLocked;
          if (lookupResult.autoLocked && area && lookupResult.resolvedM2Price) {
            effectiveTotalPrice = Math.round(area * lookupResult.resolvedM2Price);
          }
        }

        if (!isAutoLockedNow && !pricePerM2.trim()) {
          setError("Bu nom bazada topilmadi. m2 narxini qo'lda kiriting.");
          return;
        }
      }
      
      const imageUrls: string[] = [];

      if (imageFiles.length === 0) {
        setError(
          isPrayerMat
            ? "Joynamoz uchun rasm yuklang."
            : isOvalCarpet
              ? "Oval gilam uchun rasmni qo'lda yuklang."
              : "Gilam uchun rasm yuklang.",
        );
        return;
      }
      for (const file of imageFiles) {
        const formData = new FormData();
        formData.append('file', file);
        const { data } = await api.post('/upload/image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        imageUrls.push(data.url);
      }

      if (!Number.isFinite(Number(effectiveTotalPrice)) || Number(effectiveTotalPrice) <= 0) {
        setError("Narx va o'lchamni to'g'ri kiriting.");
        return;
      }

      const parsedStock = Number(stock);
      if (!Number.isFinite(parsedStock) || parsedStock <= 0) {
        setError("Miqdor 0 dan katta bo'lishi kerak.");
        return;
      }

      if (!categoryId) {
        setError("Kategoriya topilmadi. Sahifani yangilang.");
        return;
      }

      if (!isOvalCarpet) {
        const selectedCategory = categories.find((category) => category.id === categoryId);
        if (selectedCategory?.name.toLowerCase().includes('oval')) {
          setError("Oval turiga faqat 'Oval gilam' mahsulot turi orqali qo'shing.");
          return;
        }
      }

      const finalName = name.trim();
      const finalDesignCode = designCode.trim();
      if (isOvalCarpet && !finalDesignCode) {
        setError("Oval gilam uchun gul kodi majburiy.");
        return;
      }

      const finalDescription = description.trim();

        await api.post('/carpets', {
          name: finalName,
          price: Number(effectiveTotalPrice),
          stock: Math.round(parsedStock),
          size,
          material,
          description: finalDescription || undefined,
          designCode: finalDesignCode || undefined,
          categoryId,
          images: imageUrls,
        });

      setSuccess(
        isPrayerMat
          ? "Joynamoz muvaffaqiyatli qo'shildi!"
          : isOvalCarpet
            ? "Oval gilam muvaffaqiyatli qo'shildi!"
            : "Gilam muvaffaqiyatli qo'shildi!",
      );
      setTimeout(() => {
        router.push('/admin/carpets');
      }, 1500);
    } catch (err: any) {
      console.error('Carpet creation error:', err);
      // If backend provided a specific message in the standard Nest error response, use it.
      const backendMessage = err.response?.data?.message;
      if (backendMessage) {
        setError(Array.isArray(backendMessage) ? backendMessage[0] : backendMessage);
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading && categories.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="section-shell py-8 relative">
      <div className="flex items-center justify-between">
         <h1 className="font-serif text-4xl text-ink">
           {isPrayerMat
             ? "Joynamoz qo'shish"
             : isOvalCarpet
               ? "Oval gilam qo'shish"
               : "Gilam qo'shish"}
         </h1>
      </div>

      <form className="panel mt-6 grid gap-3 p-6 md:grid-cols-2" onSubmit={submit}>
        <div className="md:col-span-2">
          <label className="block text-sm text-ink/70 mb-1">Mahsulot turi</label>
          {forcedPrayerMat || forcedOvalCarpet ? (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-sm font-semibold text-emerald-700">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              {forcedPrayerMat ? 'Joynamoz (avtomatik)' : 'Oval gilam (avtomatik)'}
            </div>
          ) : (
            <select
              className="input-field"
              value={productType}
              onChange={(event) =>
                setProductType(
                  event.target.value === 'joynamoz'
                    ? 'joynamoz'
                    : event.target.value === 'oval'
                      ? 'oval'
                      : 'carpet',
                )
              }
            >
              <option value="carpet">Tayyor gilam</option>
              <option value="joynamoz">Joynamoz</option>
              <option value="oval">Oval gilam</option>
            </select>
          )}
        </div>

        <input
          className="input-field"
          placeholder={isPrayerMat ? "Joynamoz nomi" : isOvalCarpet ? "Oval gilam nomi" : "Gilam nomi"}
          value={name}
          onChange={(e) => {
            const val = e.target.value;
            const normalizedVal = val.charAt(0).toUpperCase() + val.slice(1);
            setName(normalizedVal);

            if (!isPrayerMat) {
              const nextKey = normalizeCollection(normalizedVal);
              if (nextKey !== m2LookupNameKey) {
                setM2LookupDone(false);
                setM2AutoLocked(false);
                setM2LookupNameKey('');
                setM2LookupMessage('');
                setPricePerM2('');
              }
            }
          }}
          onBlur={() => {
            if (!isPrayerMat) {
              void lookupM2ByName();
            }
          }}
          required
        />
        <input
          className="input-field"
          placeholder={
            isOvalCarpet
              ? "Gul kodi (majburiy, masalan: DC-001)"
              : "Gul kodi (masalan: DC-001)"
          }
          value={designCode}
          onChange={(e) => setDesignCode(e.target.value)}
          required={isOvalCarpet}
        />
        <input
          className={`input-field ${!isPrayerMat && m2AutoLocked ? 'bg-sand/40' : ''}`}
          type="number"
          min="0.01"
          step="0.01"
          onKeyDown={(e) => {
            if (e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault();
          }}
          placeholder={
            isPrayerMat
              ? "Toliq narxi (so'm)"
              : !name.trim()
                ? "Avval gilam nomini kiriting"
                : m2LookupLoading
                  ? "Nom bo'yicha tekshirilmoqda..."
                  : !m2LookupDone
                    ? "Nomni yozib boshqa maydonga o'ting"
                    : m2AutoLocked
                      ? 'Avtomatik m2 narx'
                      : "1 m2 narxi (so'm)"
          }
          value={pricePerM2}
          onChange={(e) => {
            setPricePerM2(normalizeNonNegativeNumberInput(e.target.value));
          }}
          readOnly={!isPrayerMat && m2AutoLocked}
          disabled={!isPrayerMat && (m2LookupLoading || !m2LookupDone)}
          required={isPrayerMat || (!isPrayerMat && !m2AutoLocked)}
        />
        {!isPrayerMat && !isOvalCarpet && (
          <input
            className="input-field bg-sand/40"
            type="text"
            placeholder="Toliq narx (avtomatik)"
            value={totalPrice ? formatPrice(totalPrice) : ''}
            readOnly
          />
        )}
        <input
          className="input-field"
          type="number"
          min="1"
          step="1"
          onKeyDown={(e) => {
            if (e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault();
          }}
          placeholder="Soni"
          value={stock}
          onChange={(e) => setStock(normalizeNonNegativeNumberInput(e.target.value))}
          required
        />
        {isPrayerMat ? (
          <div>
            <label className="block text-sm text-ink/70 mb-1">Standart o&apos;lcham</label>
            <select
              className="input-field"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              required
            >
              {PRAYER_MAT_SIZES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="space-y-1">
            <input
              className="input-field"
              placeholder="O'lcham (masalan: 2x3)"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              required
            />
          </div>
        )}
        <div className="flex items-center text-xs text-ink/60 md:col-span-2">
          {area ? `Hisoblangan maydon: ${area.toFixed(2)} m2` : "O'lchamdan maydon avtomatik hisoblanadi."}
        </div>
        {!isPrayerMat ? (
          <div
            className={`text-xs md:col-span-2 ${
              m2LookupLoading
                ? 'text-primary'
                : m2AutoLocked
                  ? 'text-emerald-700'
                  : m2LookupDone
                    ? 'text-amber-700'
                    : 'text-ink/45'
            }`}
          >
            {m2LookupLoading
              ? "Nom bo'yicha m2 narx tekshirilmoqda..."
              : m2LookupMessage ||
                "Gilam nomini yozib bo'lgach, keyingi maydonga o'ting — m2 narx avtomatik tekshiriladi."}
          </div>
        ) : null}
        <input
          className="input-field"
          placeholder="Material (masalan: ipak, akril)"
          value={material}
          onChange={(e) => setMaterial(e.target.value)}
          required
        />
        {(isPrayerMat || isOvalCarpet) && (
          <div className="md:col-span-2 text-sm text-ink/60">
            {isPrayerMat
              ? "Joynamoz uchun rasmni qo'lda yuklang."
              : "Oval gilam rasmini qo'lda yuklang."}
          </div>
        )}

        <div className="md:col-span-2">
          <label className="block text-sm text-ink/70 mb-1">Rasm yuklash (bir nechta tanlash mumkin)</label>
          <div className="flex flex-wrap gap-4 mb-4">
            {previews.map((url, idx) => (
              <div key={url} className="relative group w-24 h-24 rounded-lg overflow-hidden border border-black/10">
                <img src={url} className="w-full h-full object-cover" alt="Preview" />
                <button
                  type="button"
                  onClick={() => {
                    const newFiles = [...imageFiles];
                    newFiles.splice(idx, 1);
                    setImageFiles(newFiles);
                    const newPreviews = [...previews];
                    newPreviews.splice(idx, 1);
                    setPreviews(newPreviews);
                  }}
                  className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                >
                  x
                </button>
              </div>
            ))}
            <label className="w-24 h-24 rounded-lg border-2 border-dashed border-ink/20 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors bg-white/50">
              <span className="text-2xl text-ink/40">+</span>
              <span className="text-[10px] text-ink/40">Rasm</span>
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length > 0) {
                    setImageFiles((prev) => [...prev, ...files]);
                    const newPreviews = files.map((f) => URL.createObjectURL(f));
                    setPreviews((prev) => [...prev, ...newPreviews]);
                  }
                }}
              />
            </label>
          </div>
        </div>
        <textarea
          className="input-field md:col-span-2"
          placeholder="Tavsif"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
        />
        {isPrayerMat ? (
          <div className="md:col-span-2">
            <label className="block text-sm text-ink/70 mb-1">Kategoriya</label>
            <div className="flex flex-col gap-2">
              <input
                className="input-field bg-sand/40"
                value={forcedCategoryName}
                readOnly
              />
              {creatingForcedCategory ? (
                <p className="text-xs text-ink/50">Kategoriya yaratilmoqda...</p>
              ) : null}
            </div>
          </div>
        ) : isOvalCarpet ? null : (
          <select
            className="input-field md:col-span-2"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
          >
            <option value="">Turni tanlang</option>
            {categories
              .filter((category) => {
                const normalizedName = category.name.toLowerCase();
                return (
                  !normalizedName.includes(PRAYER_MAT_CATEGORY_NAME.toLowerCase()) &&
                  !normalizedName.includes('oval')
                );
              })
              .map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
              ))}
          </select>
        )}

        <button type="submit" className="btn-primary md:col-span-2" disabled={loading}>
          {loading ? 'Saqlanmoqda...' : 'Qo\'shish'}
        </button>
      </form>

      {/* Floating success toast */}
      {success ? (
         <div className="fixed top-20 right-4 z-50 rounded-xl border border-green-200 bg-green-50 px-6 py-4 shadow-lg fade-up">
            <p className="font-semibold text-green-800">{success}</p>
         </div>
      ) : null}

      {/* Floating error toast */}
      {error ? (
         <div className="fixed top-20 right-4 z-50 rounded-xl border border-red-200 bg-red-50 px-6 py-4 shadow-lg fade-up">
            <p className="font-semibold text-red-800">{error}</p>
         </div>
      ) : null}
    </div>
  );
}



