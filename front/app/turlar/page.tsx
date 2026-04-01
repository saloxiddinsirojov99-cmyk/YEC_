'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getCarpets, getCategories } from '@/services/carpet.service';
import { getErrorMessage, getImageUrl } from '@/services/api';
import type { Category } from '@/types/carpet';

const isPrayerMatCategory = (name?: string) =>
  (name ?? '').toLowerCase().includes('joynamoz');
const isOvalCategory = (name?: string) =>
  (name ?? '').toLowerCase().includes('oval');

const fallbackImage =
  'https://images.unsplash.com/photo-1600166898405-da9535204843?auto=format&fit=crop&w=1200&q=80';

export default function TurlarPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [previewMap, setPreviewMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await getCategories();
        const filtered = (data ?? []).filter(
          (category) =>
            !isPrayerMatCategory(category.name) && !isOvalCategory(category.name),
        );
        setCategories(filtered);

        const previews = await Promise.all(
          filtered.map(async (category) => {
            try {
              const res = await getCarpets({ page: 1, limit: 1, categoryId: category.id });
              const image = res.items?.[0]?.images?.[0];
              return [category.id, getImageUrl(image) || ''] as const;
            } catch {
              return [category.id, ''] as const;
            }
          }),
        );

        const nextMap: Record<string, string> = {};
        previews.forEach(([id, image]) => {
          if (image) nextMap[id] = image;
        });
        setPreviewMap(nextMap);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <div className="section-shell space-y-6 py-8">
      <header className="fade-up">
        <p className="text-xs font-bold uppercase tracking-[0.4em] text-sky-600">Turlar</p>
        <h1 className="text-premium font-serif text-3xl md:text-5xl">Turlar</h1>
        <p className="mt-3 text-sm text-ink/70">
          Kerakli turini tanlang.
        </p>
      </header>

      {loading ? (
        <div className="panel p-6 text-sm text-ink/70">Yuklanmoqda...</div>
      ) : categories.length === 0 ? (
        <div className="panel p-6 text-sm text-ink/70">Turlar topilmadi.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/turlar/${category.id}`}
              className="panel relative overflow-hidden flex items-center justify-between gap-4 p-5 transition-transform hover:-translate-y-1"
            >
              <div
                className="absolute inset-0 opacity-30 blur-2xl"
                style={{
                  backgroundImage: `url(${previewMap[category.id] || fallbackImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  transform: 'scale(1.08)',
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-br from-white/90 via-white/75 to-white/90" />
              <span className="relative z-10 font-serif text-2xl text-ink">{category.name}</span>
              <span className="relative z-10 btn-secondary px-4 py-2 text-xs uppercase tracking-widest">Ko&apos;rish</span>
            </Link>
          ))}
        </div>
      )}

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}
    </div>
  );
}
