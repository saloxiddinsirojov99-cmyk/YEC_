'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Heart, Home, ArrowLeft, Sparkles, Trash2 } from 'lucide-react';
import CarpetList from '@/components/CarpetList';
import { getLikedCarpets } from '@/services/carpet.service';
import { getErrorMessage } from '@/services/api';
import type { Carpet } from '@/types/carpet';
import { SectionReveal, SectionHeading } from '@/components/ui/animation-wrapper';
import { toast } from '@/components/ui/Toast';
import { getToken } from '@/services/auth.service';

export default function FavoritesPage() {
  const [carpets, setCarpets] = useState<Carpet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const hasToken = useMemo(() => (mounted ? Boolean(getToken()) : false), [mounted]);

  const loadFavorites = async () => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError('');
      const data = await getLikedCarpets();
      setCarpets(data);
    } catch (err) {
      const msg = getErrorMessage(err);
      if (msg.toLowerCase().includes('401') || msg.toLowerCase().includes('unauthorized')) {
          setError('Iltimos, sevimlilaringizni ko\'rish uchun tizimga kiring.');
      } else {
          setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasToken) {
      loadFavorites();
    }
    
    // Listen for like changes to refresh the list
    const handleLikeChanged = () => {
      if (getToken()) {
        loadFavorites();
      }
    };
    
    window.addEventListener('yec-like-changed', handleLikeChanged);
    return () => window.removeEventListener('yec-like-changed', handleLikeChanged);
  }, [hasToken]);

  if (!hasToken) {
    return (
      <div className="min-h-screen bg-slate-50/50 py-20">
        <div className="section-shell">
          <div className="mx-auto max-w-xl rounded-[2.5rem] bg-gradient-to-br from-pink-50 to-rose-50/70 p-8 shadow-[0_32px_64px_rgba(244,63,94,0.06)] border border-pink-100/50 text-center space-y-6">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-rose-50 text-rose-500">
               <Heart className="h-10 w-10 animate-pulse text-rose-500 fill-rose-500/10" />
            </div>
            <h1 className="font-serif text-3xl font-bold text-slate-800">Sevimlilar</h1>
            <p className="text-slate-600 leading-relaxed">
              Sevimlilaringizni ko&apos;rish va saqlash uchun avval tizimga kiring.
            </p>
            <Link href="/login" className="btn-premium inline-block px-10 py-4 shadow-lg shadow-rose-500/20 hover:scale-105 active:scale-95 transition-all">
              Tizimga kirish
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Premium Red/Rose Hero */}
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(244,63,94,0.15),transparent_60%),linear-gradient(135deg,#4c0519,#881337,#9f1239)] py-16 md:py-24">
        <div className="pointer-events-none absolute inset-0">
           <div className="absolute top-[20%] left-[15%] animate-pulse">
              <Heart className="h-6 w-6 text-rose-300 opacity-40 fill-current" />
           </div>
           <div className="absolute bottom-[20%] right-[20%] animate-bounce [animation-duration:5s]">
              <Heart className="h-8 w-8 text-rose-200 opacity-30 fill-current" />
           </div>
        </div>

        <div className="section-shell relative z-10">
          <SectionReveal animation="slide-right" className="space-y-6">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-rose-200/80 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest"
            >
              <ArrowLeft className="h-4 w-4" />
              Asosiyga qaytish
            </Link>
            
            <h1 className="font-serif text-5xl font-bold text-white md:text-7xl">
              Sevimlilar
            </h1>
            
            <p className="max-w-xl text-lg text-rose-50/80">
              Sizga yoqqan va keyinchalik sotib olish uchun saqlab qo'ygan 
              gilamlar jamlanmasi. Barcha saralangan mahsulotlar shu yerda.
            </p>

            <div className="inline-flex h-14 items-center gap-3 rounded-2xl bg-white/10 px-6 backdrop-blur-md border border-white/20">
               <Heart className="h-5 w-5 text-rose-400 fill-current" />
               <span className="text-lg font-bold text-white">
                 {loading ? '...' : `${carpets.length} ta saralangan`}
               </span>
            </div>
          </SectionReveal>
        </div>
      </section>

      <div className="section-shell -mt-10 relative z-20">
        <div className="rounded-[2.5rem] bg-gradient-to-br from-pink-50 to-rose-50/70 p-8 shadow-[0_32px_64px_rgba(244,63,94,0.06)] md:p-12 border border-pink-100/50">
          {error ? (
            <div className="py-20 text-center space-y-6">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-rose-50 text-rose-500">
                 <Heart className="h-10 w-10" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">{error}</h2>
              {error.includes('kiring') && (
                <Link href="/login" className="btn-premium inline-block px-10 py-4">
                  Kirish
                </Link>
              )}
            </div>
          ) : loading ? (
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
               {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="aspect-[4/5] animate-pulse rounded-3xl bg-slate-100" />
               ))}
            </div>
          ) : carpets.length === 0 ? (
            <div className="py-20 text-center space-y-6">
               <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-slate-50 text-slate-300">
                  <Heart className="h-12 w-12" />
               </div>
               <h2 className="text-2xl font-bold text-slate-900">Hozircha sevimlilar yo'q</h2>
               <p className="text-slate-500">O'zingizga yoqqan gilamlarni yurakcha tugmasini bosish orqali shu yerda saqlab qo'ying.</p>
               <Link href="/carpets" className="btn-premium inline-block px-10 py-4">
                  Katalogga o'tish
               </Link>
            </div>
          ) : (
            <div className="space-y-10">
               <SectionHeading>
                  <h2 className="text-3xl font-bold text-slate-900">Siz tanlagan gilamlar</h2>
               </SectionHeading>
               
               <CarpetList carpets={carpets} loading={loading} emptyText="Sevimlilar topilmadi." />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
