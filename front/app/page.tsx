'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import CarpetList from '@/components/CarpetList';
import CarpetCarousel from '@/components/CarpetCarousel';
import NikeStyleSlider from '@/components/NikeStyleSlider';
import { getCarpets, getCategories } from '@/services/carpet.service';
import type { Carpet, Category } from '@/types/carpet';
import { getErrorMessage, getImageUrl } from '@/services/api';
import { getCartItems } from '@/services/cart.service';
import { toast } from '@/components/ui/Toast';
import {
  FadeInStagger,
  FadeInItem,
  SectionReveal,
  SectionHeading,
  CardStagger,
  CardItem,
} from '@/components/ui/animation-wrapper';

const fallbackCategoryImage =
  'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=900&q=80';

const PRAYER_MAT_PREVIEW_LIMIT = 12;
const OVAL_CARPET_PREVIEW_LIMIT = 12;
const POPULAR_MOBILE_LIMIT = 4;
const POPULAR_DESKTOP_LIMIT = 4;
const MOBILE_MEDIA_QUERY = '(max-width: 767px)';

export default function HomePage() {
  const [latestCarpets, setLatestCarpets] = useState<Carpet[]>([]);
  const [heroPool, setHeroPool] = useState<Carpet[]>([]);
  const [popularCarpets, setPopularCarpets] = useState<Carpet[]>([]);
  const [carpetCatalog, setCarpetCatalog] = useState<Carpet[]>([]);
  const [prayerMats, setPrayerMats] = useState<Carpet[]>([]);
  const [ovalCarpets, setOvalCarpets] = useState<Carpet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryCarpets, setCategoryCarpets] = useState<Record<string, Carpet | undefined>>({});
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [popularPreviewLimit, setPopularPreviewLimit] = useState(POPULAR_DESKTOP_LIMIT);

  const isPrayerMatCategory = (name?: string) =>
    (name ?? '').toLowerCase().includes('joynamoz');
  const isOvalCategory = (name?: string) =>
    (name ?? '').toLowerCase().includes('oval');

  const copyToClipboard = (text: string) => {
    if (typeof window !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(text);
        setTimeout(() => setCopied(null), 2000);
      }).catch(() => {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
          setCopied(text);
          setTimeout(() => setCopied(null), 2000);
        } catch (err) {}
        document.body.removeChild(textArea);
      });
    } else {
      alert("Nusxalandi: " + text);
      setCopied(text);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  useEffect(() => {
    setMounted(true);
    const load = async () => {
      try {
        setLoading(true);

        const [latestRes, popularRes, prayerRes, ovalRes, categoriesRes, heroVarietyRes] =
          await Promise.allSettled([
            getCarpets({ page: 1, limit: 12, kind: 'carpet' }),
            getCarpets({ page: 1, limit: POPULAR_DESKTOP_LIMIT, sortBy: 'popular', kind: 'carpet' }),
            getCarpets({ page: 1, limit: PRAYER_MAT_PREVIEW_LIMIT, kind: 'prayer' }),
            getCarpets({ page: 1, limit: OVAL_CARPET_PREVIEW_LIMIT, kind: 'oval' }),
            getCategories(),
            getCarpets({ page: 1, limit: 1000, showAll: true }), // Fetch more for hero variety
          ]);

        const latest = latestRes.status === 'fulfilled' ? (latestRes.value.items ?? []) : [];
        const poolForHero = heroVarietyRes.status === 'fulfilled' ? (heroVarietyRes.value.items ?? []) : latest;
        const popular = popularRes.status === 'fulfilled' ? (popularRes.value.items ?? []) : [];
        const prayer = prayerRes.status === 'fulfilled' ? (prayerRes.value.items ?? []) : [];
        const oval = ovalRes.status === 'fulfilled' ? (ovalRes.value.items ?? []) : [];
        const rawCategories = categoriesRes.status === 'fulfilled' ? categoriesRes.value : [];

        const filteredCategories = rawCategories.filter(
          (category) =>
            !isPrayerMatCategory(category.name) && !isOvalCategory(category.name),
        );

        setLatestCarpets(latest);
        setHeroPool(poolForHero);
        setPopularCarpets(popular);
        setPrayerMats(prayer);
        setOvalCarpets(oval);
        setCarpetCatalog(latest); 
        setCategories(filteredCategories);

        const grouped = latest.reduce((acc, carpet) => {
          const key = carpet.categoryId;
          if (!acc[key]) acc[key] = [];
          acc[key].push(carpet);
          return acc;
        }, {} as Record<string, Carpet[]>);

        const pickPreview = (list: Carpet[]) =>
          list.find((item) => item.images && item.images.length > 0 && item.images[0]) ?? list[0];

        const previewTargets = filteredCategories.slice(0, 12);
        const previewMap: Record<string, Carpet> = {};

        previewTargets.forEach((category) => {
          const list = grouped[category.id] ?? [];
          const preview = list.length ? pickPreview(list) : undefined;
          if (preview) previewMap[category.id] = preview;
        });

        const missing = previewTargets.filter((category) => !previewMap[category.id]);
        if (missing.length > 0) {
          const missingRes = await Promise.allSettled(
            missing.map((category) => getCarpets({ page: 1, limit: 6, categoryId: category.id })),
          );

          missingRes.forEach((res, index) => {
            if (res.status !== 'fulfilled') return;
            const candidate = pickPreview(res.value.items ?? []);
            if (candidate) previewMap[missing[index].id] = candidate;
          });
        }

        setCategoryCarpets(previewMap);
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia(MOBILE_MEDIA_QUERY);
    const apply = () =>
      setPopularPreviewLimit(mq.matches ? POPULAR_MOBILE_LIMIT : POPULAR_DESKTOP_LIMIT);
    apply();
    const onChange = () => apply();
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const updatePopular = async () => {
      try {
        const res = await getCarpets({
          page: 1,
          limit: POPULAR_MOBILE_LIMIT,
          sortBy: 'popular',
          kind: 'carpet',
        });
        if (res.items) setPopularCarpets(res.items);
      } catch (err) {
        console.error('Failed to update popular carpets:', err);
      }
    };
    window.addEventListener('yec-like-changed', updatePopular);
    return () => window.removeEventListener('yec-like-changed', updatePopular);
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    const syncCartCount = () => {
      const count = getCartItems().reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(count);
    };
    syncCartCount();
    window.addEventListener('yec-cart-changed', syncCartCount);
    return () => window.removeEventListener('yec-cart-changed', syncCartCount);
  }, [mounted]);

  const categoryPreview = useMemo(
    () =>
      categories.slice(0, 12).map((category) => ({
        category,
        preview: categoryCarpets[category.id],
      })),
    [categories, categoryCarpets],
  );

  const popularDisplay = useMemo(
    () => popularCarpets.slice(0, popularPreviewLimit),
    [popularCarpets, popularPreviewLimit],
  );

  const heroCarpets = useMemo(() => {
    const poolToUse = heroPool.length > 0 ? heroPool : latestCarpets;
    
    // 1. Prioritize explicit admin-selected carpets marked with '[HERO]' in description
    const explicitHeroCarpets = poolToUse.filter(
      (c) => c.description && c.description.includes('[HERO]'),
    );

    if (explicitHeroCarpets.length > 0) {
      return explicitHeroCarpets.slice(0, 12);
    }

    // 2. Dynamic collection auto-rotation fallback
    const groupedByCollection: Record<string, Carpet[]> = {};
    
    poolToUse.forEach(c => {
      const collection = c.name.split(/\s+/)[0]?.toLowerCase() || 'other';
      if (!groupedByCollection[collection]) groupedByCollection[collection] = [];
      groupedByCollection[collection].push(c);
    });

    const slides: Carpet[] = [];
    const collections = Object.keys(groupedByCollection);
    
    // Pick 2 from each collection for variety
    collections.forEach(col => {
      const items = groupedByCollection[col];
      slides.push(...items.slice(0, 2));
    });

    // Fill up to 12 slides if we have more variety available
    if (slides.length < 12 && poolToUse.length > slides.length) {
      const usedIds = new Set(slides.map(s => s.id));
      const remaining = poolToUse.filter(c => !usedIds.has(c.id));
      slides.push(...remaining.slice(0, 12 - slides.length));
    }

    return slides.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      const getPriority = (n: string) => {
        if (n.includes('iran') || n.includes('eron')) return 1;
        if (n.includes('stefani') || n.includes('steffano')) return 2;
        if (n.includes('verona')) return 3;
        if (n.includes('touch')) return 4;
        if (n.includes('luna')) return 5;
        if (n.includes('zenit')) return 6;
        if (n.includes('zegna')) return 7;
        return 99;
      };
      return getPriority(aName) - getPriority(bName);
    }).slice(0, 12);
  }, [heroPool, latestCarpets]);

  return (
    <div className="space-y-7 pb-16" suppressHydrationWarning>
      {/* 1. Dynamic Hero Section (NikeStyleSlider) */}
      <section className="w-full">
        <SectionReveal animation="fade-up" className="w-full">
          <NikeStyleSlider carpets={heroCarpets} />
        </SectionReveal>
      </section>

      {/* 2. Yangi gilamlar */}
      <section className="relative overflow-hidden py-16">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-sky-50/50 to-white pointer-events-none" />
        <SectionReveal animation="fade-up" className="section-shell relative z-10">
          <SectionHeading className="mb-10 flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.4em] text-sky-600">Yangi kolleksiya</p>
              <h2 className="text-premium font-serif text-3xl md:text-5xl">Yangi gilamlar</h2>
            </div>
            <Link href="/yangi-gilamlar" className="group scale-in inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-white/60 px-6 py-2.5 text-sm font-bold text-sky-700 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1">
              Barchasini ko'rish <span>-&gt;</span>
            </Link>
          </SectionHeading>
          <CarpetList carpets={latestCarpets} loading={loading} emptyText="Yangi gilamlar topilmadi." />
        </SectionReveal>
      </section>

      {/* 3. Mashhur gilamlar */}
      <section className="relative overflow-hidden py-16">
        <div className="absolute top-0 left-0 w-full h-full bg-[#0b1e3a] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
        <SectionReveal animation="slide-right" className="section-shell relative z-10">
          <div className="section-breathe relative overflow-hidden rounded-[2.75rem] border border-white/10 bg-white/5 p-8 shadow-2xl md:p-12 backdrop-blur-sm">
            <SectionHeading className="relative z-10 mb-10 flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.4em] text-blue-300">Top sotuvlar</p>
                <h2 className="font-serif text-3xl md:text-5xl text-white">Mashhur gilamlar</h2>
              </div>
              <Link href="/mashhur-gilamlar" className="group scale-in inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-2.5 text-sm font-bold text-white shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1">
                Barchasini ko'rish <span className="text-blue-300">-&gt;</span>
              </Link>
            </SectionHeading>
            <div className="relative z-10">
              <CarpetList carpets={popularDisplay} loading={loading} emptyText="Mashhur gilamlar hali yo'q." />
            </div>
          </div>
        </SectionReveal>
      </section>



      {/* 4. Joynamozlar */}
      <section className="relative overflow-hidden py-16">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-emerald-50 via-white to-emerald-50/30 pointer-events-none" />
        <SectionReveal animation="slide-left" className="section-shell relative z-10">
          <div className="section-breathe relative overflow-hidden rounded-[2.5rem] border border-emerald-400/20 bg-white/40 p-4 sm:p-8 shadow-xl md:p-12 backdrop-blur-md">
            <SectionHeading className="relative z-10 mb-10 flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.4em] text-emerald-600">Premium</p>
                <h2 className="text-premium font-serif text-3xl md:text-5xl">Joynamozlar</h2>
              </div>
              <Link href="/joynamozlar" className="group scale-in inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-white px-6 py-2.5 text-sm font-bold text-emerald-700 shadow-sm transition-all duration-300 hover:-translate-y-1">
                Barchasini ko'rish <span>-&gt;</span>
              </Link>
            </SectionHeading>
            <div>
              <CarpetCarousel carpets={prayerMats} loading={loading} />
            </div>
          </div>
        </SectionReveal>
      </section>

      {/* 5. Gilam turlari */}
      <section className="relative overflow-hidden py-16 bg-[#FFFBF0]">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-amber-200/20 rounded-full blur-[100px] pointer-events-none" />
        <SectionReveal animation="flip-up" className="w-full relative z-10">
          <SectionHeading className="section-shell mb-10">
            <p className="text-xs font-bold uppercase tracking-[0.4em] text-amber-600">Katalog</p>
            <h2 className="text-premium font-serif text-3xl md:text-5xl">Gilam turlari</h2>
          </SectionHeading>
          <div className="relative w-full max-w-[1600px] mx-auto px-4 md:px-8">
            <CardStagger className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 lg:gap-4">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="aspect-[4/5] animate-pulse rounded-3xl bg-amber-100/50" />
                  ))
                : categoryPreview.map(({ category, preview }) => (
                    <CardItem key={category.id}>
                      <Link
                        href={`/turlar/${category.id}`}
                        className="group relative block aspect-[4/5] overflow-hidden rounded-2xl border border-amber-200/50 bg-white shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-xl sm:rounded-3xl"
                      >
                        <img
                          src={getImageUrl(preview?.images?.[0]) || fallbackCategoryImage}
                          alt={category.name}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-115"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-amber-950/80 via-transparent to-transparent opacity-80" />
                        <div className="absolute right-0 bottom-0 left-0 p-3 text-center md:p-5">
                          <p className="text-[10px] font-black uppercase tracking-widest text-white sm:text-xs md:text-sm lg:text-[0.65rem] xl:text-xs">
                            {category.name}
                          </p>
                        </div>
                      </Link>
                    </CardItem>
                  ))}
            </CardStagger>
          </div>
        </SectionReveal>
      </section>

      {/* 6. Ovalni gilamlar */}
      <section className="relative overflow-hidden py-16 bg-[#020617]">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-fuchsia-600/5 rounded-full blur-[120px] pointer-events-none" />
        <SectionReveal animation="zoom-in" className="section-shell relative z-10">
          <div className="section-breathe relative overflow-hidden rounded-[2.5rem] border border-fuchsia-500/20 bg-white/5 p-4 sm:p-8 shadow-xl md:p-12 backdrop-blur-md">
            <SectionHeading className="relative z-10 mb-10 flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.4em] text-fuchsia-400">Maxsus</p>
                <h2 className="font-serif text-3xl md:text-5xl text-white">Ovalni gilamlar</h2>
              </div>
              <Link href="/ovalni-gilamlar" className="group scale-in inline-flex items-center gap-2 rounded-full border border-fuchsia-400/30 bg-white/10 px-6 py-2.5 text-sm font-bold text-white shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1">
                Barchasini ko'rish <span>-&gt;</span>
              </Link>
            </SectionHeading>
            <div>
              <CarpetCarousel carpets={ovalCarpets} loading={loading} />
            </div>
          </div>
        </SectionReveal>
      </section>

      {/* About & Contact */}
      <SectionReveal animation="rise" duration={0.8} className="section-shell pb-10">
        <div className="section-breathe relative overflow-hidden rounded-[2.9rem] border border-sky-300/20 shadow-2xl bg-[#0b1e3a] text-white">
          <div className="grid gap-0 md:grid-cols-2">
            <article className="relative overflow-hidden p-10 text-white md:p-12">
              <div className="absolute -top-10 -right-10 h-40 w-40 bg-white/5 rounded-full blur-3xl" />
              <h3 className="font-serif text-4xl md:text-5xl">Biz haqimizda</h3>
              <p className="mt-6 text-lg leading-relaxed text-white/90">
                <span className="text-[#D4AF37] font-bold">YEC</span> Market - Toshkentdagi eng yirik gilamlar majmuasi va zavodning rasmiy vakili. 
                Bizning asosiy afzalligimiz - mahsulotlarning bevosita zavoddan kelishi, bu esa sizga o'rtadagi qo'shimcha xarajatlarsiz <span className="text-[#D4AF37] font-bold">zavod narxida</span> xarid qilish imkonini beradi.
              </p>
              <p className="mt-4 text-sm text-white/70 leading-relaxed">
                Bizda 500 dan ortiq dizayn va o'lchamdagi gilamlar mavjud. Sifatga 100% kafolat beramiz va uyingizgacha bepul yetkazib berish xizmatini taklif etamiz.
              </p>
              <Link href="/about" className="group mt-8 inline-flex items-center gap-2 rounded-xl bg-white/10 border border-white/30 px-8 py-4 text-sm font-bold text-white transition-all hover:bg-white/20 hover:-translate-y-1">
                Batafsil ma&apos;lumot <span>-&gt;</span>
              </Link>
            </article>

            <article className="relative overflow-hidden bg-[#020617] p-10 text-white md:p-12">
              <div className="absolute -bottom-10 -left-10 h-40 w-40 bg-blue-500/10 rounded-full blur-3xl" />
              <h3 className="font-serif text-4xl md:text-5xl">Aloqa</h3>
              <div className="mt-8 space-y-6">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Telefon raqamlarimiz</p>
                  <div className="flex flex-col gap-3">
                    <button onClick={() => copyToClipboard('+998997999922')} className="flex items-center gap-3 text-xl font-bold hover:text-blue-400 transition-colors">
                      <span className="h-2 w-2 rounded-full bg-blue-500" /> +998 99 799 99 22
                    </button>
                    <button onClick={() => copyToClipboard('+998991079922')} className="flex items-center gap-3 text-xl font-bold hover:text-blue-400 transition-colors">
                      <span className="h-2 w-2 rounded-full bg-blue-500" /> +998 99 107 99 22
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-6">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Ish vaqti</p>
                    <p className="text-sm font-medium">Har kuni: 08:00 - 21:00</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Manzillarimiz</p>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Olim Polvon va Algoritim filiallari
                    </p>
                  </div>
                </div>
                
                <Link href="/contact" className="group inline-flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-widest hover:underline">
                  Xaritada ko&apos;rish <span className="transition-transform group-hover:translate-x-1">→</span>
                </Link>
              </div>
            </article>
          </div>
        </div>
      </SectionReveal>

      <Link
        href="/cart"
        className="group fixed bottom-6 right-6 z-50 inline-flex h-16 w-[110px] items-center justify-center rounded-full bg-emerald-600 text-white shadow-2xl transition hover:-translate-y-0.5"
      >
        <svg className="h-8 w-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 10l2 10h8l2-10H6zM9 10V8a3 3 0 0 1 6 0v2M9 14h6M10 17h4" /></svg>
        {cartCount > 0 ? (
          <span className="absolute -top-1.5 -right-1.5 inline-flex min-w-[24px] items-center justify-center rounded-full bg-white px-1.5 text-[11px] font-black text-emerald-700 shadow">
            {cartCount}
          </span>
        ) : null}
      </Link>
    </div>
  );
}
