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

        const [latestRes, popularRes, prayerRes, ovalRes, categoriesRes] =
          await Promise.allSettled([
            getCarpets({ page: 1, limit: 12, kind: 'carpet' }),
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
       const catCarpets = latestCarpets.filter(c => c.categoryId === cat.id);
       if (catCarpets.length > 0) {
         catCarpets.forEach(c => {
           slides.push({ ...c, category: cat });
         });
       } else {
         const preview = categoryCarpets[cat.id];
         if (preview) slides.push({ ...preview, category: cat });
       }
    }
    
    return slides.length > 0 ? slides : latestCarpets.slice(0, 10);
  }, [categories, categoryCarpets, latestCarpets]);

  return (
    <div className="space-y-7 pb-16" suppressHydrationWarning>
      {/* 1. Hero Section */}
      <section className="hero-premium group relative min-h-[380px] overflow-hidden md:min-h-[460px]">
        <div className="aurora-motion" />
        <div className="hero-glow float-orb -top-20 -left-20 opacity-40" />
        <div className="hero-glow float-orb float-orb-delay -bottom-20 -right-20 opacity-30" style={{ animationDelay: '2s' }} />
        
        <div className="pointer-events-none absolute inset-x-0 top-[20%] z-[2] flex overflow-hidden opacity-30 select-none">
          <div className="whitespace-nowrap text-[clamp(0.95rem,5vw,4.5rem)] font-black uppercase tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-r from-white/10 via-white/35 to-white/10 motion-safe:animate-marquee">
            <span className="text-[#D4AF37]">YEC</span> PREMIYUM GILAMLAR - HAR BIR XONADON UCHUN SHARQONA SIFAT <span className="mx-16 inline-block">*</span>
            <span className="text-[#D4AF37]">YEC</span> PREMIYUM GILAMLAR - HAR BIR XONADON UCHUN SHARQONA SIFAT <span className="mx-16 inline-block">*</span>
          </div>
        </div>

        <div className="relative z-10 grid w-full min-h-[380px] items-center gap-8 py-8 pl-4 md:min-h-[460px] md:gap-12 md:py-12 md:grid-cols-[0.6fr,1.4fr] lg:pl-8 xl:pl-12">
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
          <div className="flex justify-center md:pl-16">
            <div className="relative w-full max-w-2xl origin-center">
              <div className="absolute -inset-2 rounded-[3rem] bg-gradient-to-tr from-accent/50 to-white/10 blur-3xl opacity-60" />
              <div className="relative overflow-hidden rounded-[2rem] border border-white/25 shadow-[0_40px_100px_rgba(0,0,0,0.5)] sm:rounded-[2.5rem] animate-weave">
                <img
                  src="/images/hero-carpet-green.png"
                  alt="Premium Iran Soft carpet weaving"
                  className="h-[300px] w-full object-cover sm:h-[380px] md:h-[460px]"
                />
                {/* Visual overlay to symbolize weaving texture progress */}
                <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent mix-blend-overlay opacity-30 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Yangi gilamlar */}
      <SectionReveal animation="fade-up" className="section-shell">
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

      {/* 3. Mashhur gilamlar */}
      <SectionReveal animation="slide-right" className="section-shell">
        <div className="section-breathe relative overflow-hidden rounded-[2.75rem] border border-blue-400/30 bg-white/5 p-8 shadow-xl md:p-12">
          <SectionHeading className="relative z-10 mb-10 flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.4em] text-blue-600">Top sotuvlar</p>
              <h2 className="text-premium font-serif text-3xl md:text-5xl">Mashhur gilamlar</h2>
            </div>
            <Link href="/mashhur-gilamlar" className="group scale-in inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-white/60 px-6 py-2.5 text-sm font-bold text-blue-700 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1">
              Barchasini ko'rish <span>-&gt;</span>
            </Link>
          </SectionHeading>
          <div className="relative z-10">
            <CarpetList carpets={popularDisplay} loading={loading} emptyText="Mashhur gilamlar hali yo'q." />
          </div>
        </div>
      </SectionReveal>

      <SectionReveal animation="fade-up" className="w-full">
        <NikeStyleSlider carpets={heroCarpets} />
      </SectionReveal>

      {/* 4. Joynamozlar */}
      <SectionReveal animation="slide-left" className="section-shell">
        <div className="section-breathe relative overflow-hidden rounded-[2.5rem] border border-emerald-400/30 bg-white/5 p-4 sm:p-8 shadow-xl md:p-12">
          <SectionHeading className="relative z-10 mb-10 flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.4em] text-emerald-600">Premium</p>
              <h2 className="text-premium font-serif text-3xl md:text-5xl">Joynamozlar</h2>
            </div>
            <Link href="/joynamozlar" className="group scale-in inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-white/60 px-6 py-2.5 text-sm font-bold text-emerald-700 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1">
              Barchasini ko'rish <span>-&gt;</span>
            </Link>
          </SectionHeading>
          <div className="md:hidden">
            <CarpetCarousel carpets={prayerMats} loading={loading} />
          </div>
          <div className="hidden md:block">
            <CarpetList carpets={prayerMats} loading={loading} />
          </div>
        </div>
      </SectionReveal>

      {/* 5. Gilam turlari - 6 columns layout */}
      <SectionReveal animation="flip-up" className="w-full">
        <SectionHeading className="section-shell mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.4em] text-amber-600">Katalog</p>
          <h2 className="text-premium font-serif text-3xl md:text-5xl">Gilam turlari</h2>
        </SectionHeading>
        <div className="relative w-full max-w-[1600px] mx-auto px-4 md:px-8">
          <CardStagger className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 lg:gap-4">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="aspect-[4/5] animate-pulse rounded-3xl bg-slate-100" />
                ))
              : categoryPreview.map(({ category, preview }) => (
                  <CardItem key={category.id}>
                    <Link
                      href={`/turlar/${category.id}`}
                      className="group relative block aspect-[4/5] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-xl sm:rounded-3xl"
                    >
                      <img
                        src={getImageUrl(preview?.images?.[0]) || fallbackCategoryImage}
                        alt={category.name}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-115"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent opacity-80" />
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

      {/* 6. Ovalni gilamlar */}
      <SectionReveal animation="zoom-in" className="section-shell">
        <div className="section-breathe relative overflow-hidden rounded-[2.5rem] border border-fuchsia-300/30 bg-white/5 p-4 sm:p-8 shadow-xl md:p-12">
          <SectionHeading className="relative z-10 mb-10 flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.4em] text-fuchsia-600">Maxsus</p>
              <h2 className="text-premium font-serif text-3xl md:text-5xl">Ovalni gilamlar</h2>
            </div>
            <Link href="/ovalni-gilamlar" className="group scale-in inline-flex items-center gap-2 rounded-full border border-fuchsia-400/30 bg-white/60 px-6 py-2.5 text-sm font-bold text-fuchsia-700 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1">
              Barchasini ko'rish <span>-&gt;</span>
            </Link>
          </SectionHeading>
          <div className="md:hidden">
            <CarpetCarousel carpets={ovalCarpets} loading={loading} />
          </div>
          <div className="hidden md:block">
            <CarpetList carpets={ovalCarpets} loading={loading} />
          </div>
        </div>
      </SectionReveal>

      {/* About & Contact */}
      <SectionReveal animation="rise" duration={0.8} className="section-shell pb-10">
        <div className="section-breathe relative overflow-hidden rounded-[2.9rem] border border-sky-300/20 shadow-2xl">
          <div className="grid gap-0 md:grid-cols-2">
            <article className="relative overflow-hidden bg-[#0b1e3a] p-10 text-white md:p-12">
              <h3 className="font-serif text-4xl md:text-5xl">Biz haqimizda</h3>
              <p className="mt-6 text-lg leading-relaxed text-white/90">
                <span className="text-[#D4AF37] font-bold">YEC</span> Market - zavodning Toshkentdagi rasmiy filiallar tarmog'i. 
                Mahsulotlarimiz bevosita zavoddan keladi, shuning uchun narxlar doimo zavod narxida bo'ladi.
              </p>
              <Link href="/about" className="group mt-10 inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/30 px-10 py-4 text-base font-bold text-white transition-all hover:bg-white/20">
                Batafsil <span>-&gt;</span>
              </Link>
            </article>

            <article className="relative overflow-hidden bg-[#020617] p-10 text-white md:p-12">
              <h3 className="font-serif text-4xl md:text-5xl">Aloqa</h3>
              <div className="mt-8 space-y-4">
                <button onClick={() => copyToClipboard('+998997999922')} className="flex items-center gap-4 text-xl font-bold hover:text-blue-400">
                   +998 99 799 99 22
                </button>
                <button onClick={() => copyToClipboard('+998991079922')} className="flex items-center gap-4 text-xl font-bold hover:text-blue-400">
                   +998 99 107 99 22
                </button>
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
