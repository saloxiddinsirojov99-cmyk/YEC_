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

const PRAYER_MAT_PREVIEW_LIMIT = 4;
const OVAL_CARPET_PREVIEW_LIMIT = 4;
const POPULAR_MOBILE_LIMIT = 4;
const POPULAR_DESKTOP_LIMIT = 4;
const MOBILE_MEDIA_QUERY = '(max-width: 767px)';

export default function HomePage() {
  const [latestCarpets, setLatestCarpets] = useState<Carpet[]>([]);
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
        // Fallback or silently fail
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
      // Very basic fallback
      alert("Nusxalandi: " + text);
      setCopied(text);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const getPopularByLikes = (items: Carpet[]) => {
    let list = items.filter((item) => (item.likes ?? 0) > 0);
    if (list.length === 0) {
      const iranSoft = items.filter(i => i.name.toLowerCase().includes('iran-soft') || i.name.toLowerCase().includes('eron'));
      list = iranSoft.length > 0 ? iranSoft : items;
    }
    const sorted = [...list].sort((a, b) => {
      const diff = (b.likes ?? 0) - (a.likes ?? 0);
      if (diff !== 0) return diff;
      return a.name.localeCompare(b.name);
    });
    return sorted.slice(0, 4);
  };

  useEffect(() => {
    setMounted(true);
    const load = async () => {
      try {
        setLoading(true);

        const [latestRes, popularRes, prayerRes, ovalRes, categoriesRes] =
          await Promise.allSettled([
            getCarpets({ page: 1, limit: 8, kind: 'carpet' }),
            getCarpets({ page: 1, limit: POPULAR_DESKTOP_LIMIT, sortBy: 'popular', kind: 'carpet' }),
            getCarpets({ page: 1, limit: PRAYER_MAT_PREVIEW_LIMIT, kind: 'prayer' }),
            getCarpets({ page: 1, limit: OVAL_CARPET_PREVIEW_LIMIT, kind: 'oval' }),
            getCategories(),
          ]);

        const latest = latestRes.status === 'fulfilled' ? (latestRes.value.items ?? []) : [];
        const popular = popularRes.status === 'fulfilled' ? (popularRes.value.items ?? []) : [];
        const prayer = prayerRes.status === 'fulfilled' ? (prayerRes.value.items ?? []) : [];
        const oval = ovalRes.status === 'fulfilled' ? (ovalRes.value.items ?? []) : [];
        const rawCategories = categoriesRes.status === 'fulfilled' ? categoriesRes.value : [];

        const filteredCategories = rawCategories.filter(
          (category) =>
            !isPrayerMatCategory(category.name) && !isOvalCategory(category.name),
        );

        setLatestCarpets(latest);
        setPopularCarpets(popular);
        setPrayerMats(prayer);
        setOvalCarpets(oval);
        setCarpetCatalog(latest); // Using latest as a base catalog for this page
        setCategories(filteredCategories);

        if (
          latestRes.status === 'rejected' ||
          popularRes.status === 'rejected' ||
          prayerRes.status === 'rejected' ||
          ovalRes.status === 'rejected' ||
          categoriesRes.status === 'rejected'
        ) {
          console.error('Home load errors:', {
            latest: latestRes.status === 'rejected' ? latestRes.reason : null,
            popular: popularRes.status === 'rejected' ? popularRes.reason : null,
            prayer: prayerRes.status === 'rejected' ? prayerRes.reason : null,
            oval: ovalRes.status === 'rejected' ? ovalRes.reason : null,
            categories: categoriesRes.status === 'rejected' ? categoriesRes.reason : null,
          });
          toast.error("Ba'zi ma'lumotlarni yuklashda xatolik yuz berdi. Qolgan bo'limlar ishlashda davom etadi.");
        }

        const grouped = latest.reduce((acc, carpet) => {
          const key = carpet.categoryId;
          if (!acc[key]) acc[key] = [];
          acc[key].push(carpet);
          return acc;
        }, {} as Record<string, Carpet[]>);

        const pickPreview = (list: Carpet[]) =>
          list.find((item) => item.images && item.images.length > 0 && item.images[0]) ?? list[0];

        const previewTargets = filteredCategories.slice(0, 8);
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

    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    }

    (mq as unknown as { addListener?: (cb: () => void) => void }).addListener?.(onChange);
    return () => {
      (mq as unknown as { removeListener?: (cb: () => void) => void }).removeListener?.(onChange);
    };
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
      categories.slice(0, 6).map((category) => ({
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
    const sortedCategories = [...categories].sort((a, b) => {
       const aName = a.name.toLowerCase();
       const bName = b.name.toLowerCase();
       const getOrder = (n: string) => {
         if (n.includes('iran soft') || n.includes('eron')) return 1;
         if (n.includes('steffani') || n.includes('stefani')) return 2;
         if (n.includes('verona')) return 3;
         return 99;
       };
       return getOrder(aName) - getOrder(bName);
    });

    const slides: Carpet[] = [];
    for (const cat of sortedCategories) {
       const carpet = categoryCarpets[cat.id];
       if (carpet && carpet.images && carpet.images.length > 0) {
         if (!slides.some(s => s.id === carpet.id)) {
           slides.push({ ...carpet, category: cat });
         }
       }
    }
    
    return slides.length > 0 ? slides.slice(0, 6) : latestCarpets.slice(0, 5);
  }, [categories, categoryCarpets, latestCarpets]);

  return (
    <div className="space-y-7 pb-16" suppressHydrationWarning>
      {/* 1. Hero Section */}
      <section className="hero-premium group relative min-h-[380px] overflow-hidden md:min-h-[460px]">
        <div className="aurora-motion" />
        <div className="hero-glow float-orb -top-20 -left-20 opacity-40" />
        <div className="hero-glow float-orb float-orb-delay -bottom-20 -right-20 opacity-30" style={{ animationDelay: '2s' }} />
        <div className="pointer-events-none absolute inset-0 z-[1]">
          <span className="hero-carpet-rosette hero-carpet-rosette-left" />
          <span className="hero-carpet-rosette hero-carpet-rosette-right" />
          <span className="hero-carpet-rosette hero-carpet-rosette-small hero-carpet-rosette-small-1" />
          <span className="hero-carpet-rosette hero-carpet-rosette-small hero-carpet-rosette-small-2" />
          <span className="hero-carpet-rosette hero-carpet-rosette-small hero-carpet-rosette-small-3" />
        </div>

        {/* Marquee effect in background, visually passing behind hero image */}
        <div className="pointer-events-none absolute inset-x-0 top-[24%] z-[2] flex overflow-hidden opacity-30 select-none md:top-[20%] md:opacity-25">
          <div className="whitespace-nowrap text-[clamp(0.95rem,5vw,4.5rem)] font-black uppercase tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-r from-white/10 via-white/35 to-white/10 motion-safe:animate-marquee motion-reduce:animate-none md:text-[clamp(1.2rem,7vw,4.5rem)] md:tracking-[0.35em]">
            <span className="text-[#D4AF37]">YEC</span> PREMIYUM GILAMLAR - HAR BIR XONADON UCHUN SHARQONA SIFAT <span className="mx-16 inline-block">*</span>
            <span className="text-[#D4AF37]">YEC</span> PREMIYUM GILAMLAR - HAR BIR XONADON UCHUN SHARQONA SIFAT <span className="mx-16 inline-block">*</span>
            <span className="text-[#D4AF37]">YEC</span> PREMIYUM GILAMLAR - HAR BIR XONADON UCHUN SHARQONA SIFAT <span className="mx-16 inline-block">*</span>
          </div>
        </div>

        <div className="section-shell relative z-10 grid min-h-[380px] items-center gap-8 py-8 md:min-h-[460px] md:gap-10 md:py-12 md:grid-cols-2">
          <div className="z-40">
            <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-1.5 text-xs font-bold uppercase tracking-[0.3em] text-white/90 backdrop-blur-md">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
              <span className="text-[#D4AF37]">YEC</span> Market
            </p>
            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl leading-[1.1] drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
              <span className="text-[#D4AF37] block mb-2">YEC</span>
              <span className="text-[#00B4FF] block">gilamlari sharqona sifat belgisi</span>
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-white/80">
              Toshkent bo'ylab sifatli va premium gilamlar markazi. Bizning zamonaviy gilamlarimiz bilan
              tanishing va uyingizga nafislik olib kiring.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/carpets" className="btn-premium px-8 py-4 text-base">
                Kolleksiyani ko'rish
              </Link>
              <Link href="/about" className="btn-secondary-premium border-none bg-white/20 px-8 py-4 text-base text-white backdrop-blur-lg hover:bg-white/30">
                Biz haqimizda
              </Link>
            </div>
          </div>
          <div className="flex justify-center">
            <div className="relative w-full max-w-lg float-orb">
              <div className="absolute -inset-1 rounded-[2.5rem] bg-gradient-to-tr from-accent/40 to-white/10 blur-2xl opacity-50" />
              <div className="relative overflow-hidden rounded-[2rem] border border-white/20 shadow-2xl">
                <img
                  src="/images/hero-carpet-green.png"
                  alt="Premium carpet preview"
                  className="h-[400px] w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* 2. Yangi gilamlar - fade-up animatsiya */}
      <SectionReveal animation="fade-up" className="section-shell">
        <SectionHeading className="relative z-10 mb-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.4em] text-sky-600">Yangi</p>
            <h2 className="text-premium font-serif text-3xl md:text-5xl">Yangi gilamlar</h2>
            <p className="mt-3 max-w-xl text-sm text-ink-muted">
              Bizning eng so&apos;nggi kolleksiyamiz bilan tanishing.
            </p>
          </div>
          <Link
            href="/yangi-gilamlar"
            className="group scale-in inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-white/60 px-6 py-2.5 text-sm font-bold text-sky-700 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:border-sky-400/50 hover:shadow-lg hover:shadow-sky-500/20"
          >
            Barchasini ko&apos;rish <span className="text-lg transition-transform group-hover:translate-x-1">-&gt;</span>
          </Link>
        </SectionHeading>
        <CarpetList carpets={latestCarpets} loading={loading} emptyText="Yangi gilamlar topilmadi." />
      </SectionReveal>

      {/* 3. Mashhur gilamlar - slide-right (chapdan) animatsiya */}
      <SectionReveal animation="slide-right" className="section-shell">
        <div className="section-breathe relative overflow-hidden rounded-[2.75rem] border border-blue-400/30 bg-[radial-gradient(circle_at_top,hsla(var(--popular-glow),0.15),_transparent_55%),radial-gradient(circle_at_bottom,hsla(var(--popular-glow),0.05),_transparent_55%)] p-8 shadow-[0_40px_100px_rgba(37,99,235,0.12)] md:p-12 transition-all duration-700 hover:shadow-[0_50px_120px_rgba(37,99,235,0.2)]">
          <div className="absolute float-orb -top-16 -right-10 h-52 w-52 rounded-full bg-blue-400/20 blur-3xl" />
          <div className="absolute float-orb float-orb-delay -bottom-24 left-0 h-72 w-72 rounded-full bg-blue-600/10 blur-3xl" />

          <SectionHeading className="relative z-10 mb-10 flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.4em] text-blue-600">Top sotuvlar</p>
              <h2 className="text-premium font-serif text-3xl md:text-5xl">Mashhur gilamlar</h2>
              <p className="mt-3 max-w-xl text-sm text-ink-muted">
                Xaridorlar eng ko&apos;p tanlayotgan gilamlar. Eng yaxshi dizayn va sifat jamlanmasi.
              </p>
            </div>
            <Link
              href="/mashhur-gilamlar"
              className="group scale-in inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-white/60 px-6 py-2.5 text-sm font-bold text-blue-700 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:border-blue-400/50 hover:shadow-lg hover:shadow-blue-500/20"
            >
              Barchasini ko&apos;rish <span className="text-lg transition-transform group-hover:translate-x-1">-&gt;</span>
            </Link>
          </SectionHeading>

          <div className="relative z-10">
            <CarpetList carpets={popularDisplay} loading={loading} emptyText="Mashhur gilamlar hali yo'q." />
          </div>
        </div>
      </SectionReveal>

      {/* Nike yulduzlari animatsion slideri - Gilam turlari uchun maxsus guruh */}
      <SectionReveal animation="fade-up" className="w-full">
        <NikeStyleSlider carpets={heroCarpets} />
      </SectionReveal>

      {/* 4. Joynamozlar - slide-left (o'ngdan) animatsiya */}
      <SectionReveal animation="slide-left" className="section-shell">
        <div className="section-breathe relative overflow-hidden rounded-[2.5rem] border border-emerald-400/30 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.1),_transparent_55%)] p-4 sm:p-8 shadow-[0_40px_100px_rgba(16,185,129,0.08)] md:p-12">
          <SectionHeading className="relative z-10 mb-10 flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.4em] text-emerald-600">Premium</p>
              <h2 className="text-premium font-serif text-3xl md:text-5xl">Joynamozlar</h2>
              <p className="mt-3 max-w-xl text-sm text-ink-muted">
                Diniy marosimlar uchun maxsus tayyorlangan, yuqori sifatli va chiroyli joynamozlar.
              </p>
            </div>
            <Link
              href="/joynamozlar"
              className="group scale-in inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-white/60 px-6 py-2.5 text-sm font-bold text-emerald-700 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:border-emerald-400/50 hover:shadow-lg hover:shadow-emerald-500/20"
            >
              Barchasini ko&apos;rish <span className="text-lg transition-transform group-hover:translate-x-1">-&gt;</span>
            </Link>
          </SectionHeading>
          <div className="md:hidden -mx-2 px-2">
            <CarpetCarousel carpets={prayerMats} loading={loading} emptyText="Joynamozlar topilmadi." />
          </div>
          <div className="hidden md:block">
            <CarpetList carpets={prayerMats} loading={loading} emptyText="Joynamozlar topilmadi." />
          </div>
        </div>
      </SectionReveal>

      {/* 6. Ovalni gilamlar - zoom-in animatsiya */}
      <SectionReveal animation="zoom-in" className="section-shell">
        <div className="section-breathe relative overflow-hidden rounded-[2.5rem] border border-fuchsia-300/30 bg-[radial-gradient(circle_at_top,rgba(217,70,239,0.12),_transparent_55%)] p-4 sm:p-8 shadow-[0_40px_100px_rgba(217,70,239,0.08)] md:p-12">
          <SectionHeading className="relative z-10 mb-10 flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.4em] text-fuchsia-600">Maxsus</p>
              <h2 className="text-premium font-serif text-3xl md:text-5xl">Ovalni gilamlar</h2>
              <p className="mt-3 max-w-xl text-sm text-ink-muted">
                Oval shakldagi maxsus kolleksiya. Mehmonxona va yotoqxona uchun nafis tanlov.
              </p>
            </div>
            <Link
              href="/ovalni-gilamlar"
              className="group scale-in inline-flex items-center gap-2 rounded-full border border-fuchsia-400/30 bg-white/60 px-6 py-2.5 text-sm font-bold text-fuchsia-700 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:border-fuchsia-400/50 hover:shadow-lg hover:shadow-fuchsia-500/20"
            >
              Barchasini ko&apos;rish <span className="text-lg transition-transform group-hover:translate-x-1">-&gt;</span>
            </Link>
          </SectionHeading>
          <div className="md:hidden -mx-2 px-2">
            <CarpetCarousel carpets={ovalCarpets} loading={loading} emptyText="Oval gilamlar topilmadi." />
          </div>
          <div className="hidden md:block">
            <CarpetList carpets={ovalCarpets} loading={loading} emptyText="Oval gilamlar topilmadi." />
          </div>
        </div>
      </SectionReveal>

      {/* 5. Gilam turlari - flip-up (3D aylanib) animatsiya */}
      <SectionReveal animation="flip-up" className="section-shell">
        <SectionHeading className="mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.4em] text-amber-600">Katalog</p>
          <h2 className="text-premium font-serif text-3xl md:text-5xl">Gilam turlari</h2>
        </SectionHeading>
        <CardStagger className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:gap-6">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-[4/5] animate-pulse rounded-3xl bg-slate-100" />
              ))
            : categoryPreview.map(({ category, preview }) => (
                <CardItem key={category.id}>
                  <Link
                    href={`/turlar/${category.id}`}
                    className="group relative block aspect-[4/5] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
                  >
                    <img
                      src={getImageUrl(preview?.images?.[0]) || fallbackCategoryImage}
                      alt={category.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                    <div className="absolute right-0 bottom-0 left-0 p-4 text-center">
                      <p className="text-sm font-bold text-white md:text-base">{category.name}</p>
                    </div>
                  </Link>
                </CardItem>
              ))}
        </CardStagger>
      </SectionReveal>

      {/* About & Contact - rise (pastdan ko'tarilish) animatsiya */}
      <SectionReveal animation="rise" duration={0.8} className="section-shell pb-10">
        <div className="section-breathe relative overflow-hidden rounded-[2.9rem] border border-sky-300/20 shadow-[0_50px_140px_rgba(15,23,42,0.35)]">
          <div className="pointer-events-none absolute inset-y-0 left-1/2 z-10 hidden w-24 -translate-x-1/2 bg-gradient-to-r from-sky-900/40 via-blue-900/20 to-slate-950/45 blur-2xl md:block" />
          <div className="pointer-events-none absolute inset-y-0 left-1/2 z-20 hidden w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-white/20 to-transparent md:block" />
          <div className="grid gap-0 md:grid-cols-2">
        <article className="relative overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(14,116,144,0.35),_transparent_55%),linear-gradient(135deg,#0b1e3a,#0a2342,#0b1529)] p-10 text-white md:p-12">
          <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(255,255,255,0.05),rgba(15,23,42,0.2))]" />
          <div className="relative z-10">
            <h3 className="font-serif text-4xl md:text-5xl">Biz haqimizda</h3>
            <div className="mt-6 space-y-4 text-lg leading-relaxed text-white/90">
              <p>
                <span className="text-[#D4AF37] font-bold">YEC</span> Market - <span className="text-[#D4AF37] font-bold">YEC</span> zavodining Toshkentdagi rasmiy filiallar tarmog&apos;i. 
                Bizning gilamlarimiz Eron texnologiyasi asosida, yuqori zichlikda va sifatli materiallardan to&apos;qiladi.
              </p>
              <p>
                Mahsulotlarimiz bevosita zavoddan keladi, shuning uchun narxlar doimo 
                <span className="text-sky-100 font-bold"> zavod narxida</span> bo&apos;ladi. 
                Sifat va go&apos;zallikda biz bilan hamqadam bo&apos;ling.
              </p>
            </div>
            <Link href="/about" className="group mt-10 inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/30 px-10 py-4 text-base font-bold text-white transition-all hover:bg-white/20">
              Batafsil <span className="transition-transform group-hover:translate-x-1">-&gt;</span>
            </Link>
          </div>
        </article>

        <article className="relative overflow-hidden border-t border-white/10 bg-[#020617] p-10 text-white md:border-t-0 md:border-l md:border-white/10 md:p-12">
          <div className="pointer-events-none absolute -top-10 left-0 right-0 h-20 bg-gradient-to-b from-sky-900/35 via-slate-900/20 to-transparent md:hidden" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.1),_transparent_60%)]" />
          <div className="relative z-10">
            <h3 className="font-serif text-4xl md:text-5xl">Aloqa</h3>
            
            <div className="mt-8 space-y-6">
              <div className="flex flex-col gap-4">
                <button
                  onClick={() => copyToClipboard('+998997999922')}
                  className="group flex items-center gap-4 text-xl font-bold transition-colors hover:text-blue-400"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 border border-white/10 shadow-lg group-hover:bg-blue-500/20 group-hover:border-blue-500/30">
                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                  </div>
                  +998 99 799 99 22
                </button>
                <button
                  onClick={() => copyToClipboard('+998991079922')}
                  className="group flex items-center gap-4 text-xl font-bold transition-colors hover:text-blue-400"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 border border-white/10 shadow-lg group-hover:bg-blue-500/20 group-hover:border-blue-500/30">
                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                  </div>
                  +998 99 107 99 22
                </button>
              </div>
 
              <div className="h-px bg-white/10 w-full my-6" />
 
              <div className="space-y-4">
                <a
                  href="https://www.google.com/maps/place/YEC,+Tashkent+Ring+Automobile+Road,+%D0%A2%D0%BE%D1%88%D0%BA%D0%B5%D0%BD%D1%82,+Tashkent,+Uzbekistan/@41.2294433,69.1730268,18z/data=!4m6!3m5!1s0x38ae631b59b6c191:0x470d9bab83508b45!8m2!3d41.2294433!4d69.1730268!16s%2Fg%2F11nmt3b09p?g_ep=Eg1tbF8yMDI2MDMwNF8wIOC7DCoASAJQAg%3D%3D"
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-start gap-4 p-3 rounded-2xl transition-all hover:bg-white/5 border border-transparent hover:border-white/10"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-blue-300 uppercase tracking-widest flex items-center gap-2">
                       Olim Polvon filiali
                       <svg className="w-4 h-4 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                    </h4>
                    <p className="text-sm text-slate-400 mt-1">Toshkent halqa avtomobil yo&apos;li</p>
                  </div>
                </a>
                <a
                  href="https://maps.app.goo.gl/4KcLqHxEzdk5U5gD8"
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-start gap-4 p-3 rounded-2xl transition-all hover:bg-white/5 border border-transparent hover:border-white/10"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-blue-300 uppercase tracking-widest flex items-center gap-2">
                      Algoritim filiali
                      <svg className="w-4 h-4 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                    </h4>
                    <p className="text-sm text-slate-400 mt-1">Algoritim dahasi, Toshkent</p>
                  </div>
                </a>
              </div>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-6">
              <Link href="/contact" className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:bg-blue-500 hover:-translate-y-0.5">
                 Bog&apos;lanish
              </Link>
              <div className="flex gap-4">
                <a href="https://t.me/yecgilamuz" target="_blank" rel="noreferrer" className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-[#26A5E4] transition-all hover:bg-[#26A5E4] hover:text-white">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M21.9 4.6c.2-1-0.7-1.8-1.6-1.4L2.9 11.1c-1 .5-.9 2 .2 2.3l4.9 1.5 1.8 5.4c.4 1.1 1.8 1.3 2.5.4l2.7-3.2 5.2 3.8c.9.6 2.1.1 2.3-1l2.4-16.7ZM8.7 13.9l9.6-6-7.7 7.2-.3 3.6-1.6-4.8Z" /></svg>
                </a>
                <a href="https://instagram.com/yec_toshkent" target="_blank" rel="noreferrer" className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-[#E1306C] transition-all hover:bg-[#E1306C] hover:text-white">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm0 2a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H7Zm5 3.5A5.5 5.5 0 1 1 6.5 14 5.5 5.5 0 0 1 12 8.5Zm0 2A3.5 3.5 0 1 0 15.5 14 3.5 3.5 0 0 0 12 10.5Zm5.25-3.75a1 1 0 1 1-1 1 1 1 0 0 1 1-1Z" /></svg>
                </a>
              </div>
            </div>
          </div>
        </article>
          </div>
        </div>
      </SectionReveal>


      <Link
        href="/cart"
        className="group fixed bottom-6 right-6 z-50 inline-flex h-16 w-[110px] items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 text-white shadow-[0_24px_55px_rgba(5,150,105,0.48)] ring-1 ring-white/15 transition hover:-translate-y-0.5 hover:shadow-[0_34px_85px_rgba(5,150,105,0.58)] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
        aria-label="Savat"
      >
        <span className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.38),transparent_55%)] opacity-80" />
        <svg
          className="relative h-8 w-9"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 10l2 10h8l2-10H6z" />
          <path d="M9 10V8a3 3 0 0 1 6 0v2" />
          <path d="M9 14h6" />
          <path d="M10 17h4" />
        </svg>
        {cartCount > 0 ? (
          <span className="absolute -top-1.5 -right-1.5 inline-flex min-w-[24px] items-center justify-center rounded-full bg-white px-1.5 text-[11px] font-black text-emerald-700 shadow">
            {cartCount}
          </span>
        ) : null}
      </Link>
    </div>
  );
}
