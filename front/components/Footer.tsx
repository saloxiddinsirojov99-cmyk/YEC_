'use client';

import Link from 'next/link';
import { useState } from 'react';
import { copyText } from '@/utils/clipboard';

export default function Footer() {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = async (text: string) => {
    const ok = await copyText(text);
    if (ok) {
      setCopied(text);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  return (
    <footer className="relative mt-16 overflow-hidden border-t border-white/10 bg-[#050b1a] text-white">
      <div className="absolute -left-24 -top-28 h-64 w-64 rounded-full bg-accent/20 blur-3xl opacity-50" />
      <div className="absolute -bottom-32 right-0 h-72 w-72 rounded-full bg-primary/25 blur-3xl opacity-50" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_hsl(var(--accent)_/_0.12),_transparent_60%)]" />

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-12 md:grid-cols-3 md:px-6 relative z-10">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 overflow-hidden rounded-full bg-white p-1 ring-1 ring-white/40 shadow-sm">
              <img src="/logo.png" alt="YEC Logo" className="h-full w-full rounded-full object-contain logo-sticker" />
            </div>
            <div>
              <h3 className="font-serif text-2xl text-white">YEC Market</h3>
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-accent/90">Premium gilamlar</p>
            </div>
          </div>
          <p className="text-sm text-white/70 leading-relaxed">
            YEC Market - YEC zavodining rasmiy do&apos;konlar tarmog&apos;i. Eron texnologiyali premium gilamlar zavod narxida,
            O&apos;zbekistondan AQSHgacha eksport sifatida taqdim etiladi.
          </p>
          <div className="h-1 w-16 rounded-full bg-accent/60 shadow-[0_0_10px_hsla(var(--accent),0.4)]" />
        </div>

        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-accent drop-shadow-[0_0_8px_hsla(var(--accent),0.3)]">Yo&apos;nalishlar</h4>
          <div className="mt-4 flex flex-col gap-3 text-sm">
            <Link href="/carpets" className="text-white/90 transition-all hover:translate-x-1 hover:text-accent">
              Barcha gilamlar
            </Link>
            <Link href="/joynamozlar" className="text-white/90 transition-all hover:translate-x-1 hover:text-accent">
              Joynamozlar
            </Link>
            <Link href="/ovalni-gilamlar" className="text-white/90 transition-all hover:translate-x-1 hover:text-accent">
              Ovalni gilamlar
            </Link>
            <Link href="/mashhur-gilamlar" className="text-white/90 transition-all hover:translate-x-1 hover:text-accent">
              Mashhur gilamlar
            </Link>
            <Link href="/yangi-gilamlar" className="text-white/90 transition-all hover:translate-x-1 hover:text-accent">
              Yangi gilamlar
            </Link>
            <Link href="/about" className="text-white/90 transition-all hover:translate-x-1 hover:text-accent">
              Biz haqimizda
            </Link>
            <Link href="/contact" className="text-white/90 transition-all hover:translate-x-1 hover:text-accent">
              Aloqa uchun
            </Link>
            <Link href="/sevimlilar" className="text-white/90 transition-all hover:translate-x-1 hover:text-accent">
              Sevimlilar
            </Link>
            <Link href="/cart" className="text-white/90 transition-all hover:translate-x-1 hover:text-accent">
              Savat
            </Link>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-accent drop-shadow-[0_0_8px_hsla(var(--accent),0.3)]">Aloqa uchun</h4>
          <div className="mt-4 space-y-4 text-sm text-white/90">
            <div className="space-y-2">
              <div className="group relative">
                <button 
                  onClick={() => copyToClipboard('+998997999922')}
                  className="flex w-full items-center gap-2 text-left transition-all hover:text-accent"
                >
                  Tel 1: +998 99 799 99 22
                  <span className="text-[10px] opacity-0 transition-opacity group-hover:opacity-60">Nusxa olish</span>
                </button>
                {copied === '+998997999922' && (
                  <span className="absolute left-0 -top-6 rounded bg-accent/20 px-2 py-1 text-[10px] text-accent backdrop-blur-md fade-up">Nusxalandi!</span>
                )}
              </div>

              <div className="group relative">
                <button 
                  onClick={() => copyToClipboard('+998991079922')}
                  className="flex w-full items-center gap-2 text-left transition-all hover:text-accent"
                >
                  Tel 2: +998 99 107 99 22
                  <span className="text-[10px] opacity-0 transition-opacity group-hover:opacity-60">Nusxa olish</span>
                </button>
                {copied === '+998991079922' && (
                  <span className="absolute left-0 -top-6 rounded bg-accent/20 px-2 py-1 text-[10px] text-accent backdrop-blur-md fade-up">Nusxalandi!</span>
                )}
              </div>
            </div>
            
            <div className="flex gap-3 pt-1">
              <a href="https://t.me/yecgilamuz" className="rounded-full bg-accent/10 px-4 py-1 text-xs font-bold text-accent transition-all hover:bg-accent/20" target="_blank" rel="noreferrer">
                Telegram
              </a>
              <a href="https://www.instagram.com/yec_toshkent?igsh=MTR3ZmRxZjgycHpjZA==" className="rounded-full bg-rose-500/10 px-4 py-1 text-xs font-bold text-rose-300 transition-all hover:bg-rose-500/20" target="_blank" rel="noreferrer">
                Instagram
              </a>
            </div>

            <div className="space-y-3 pt-2">
              <p className="font-bold text-accent/90">Manzillar:</p>
              <div className="space-y-2">
                <a href="https://www.google.com/maps/place/YEC,+Tashkent+Ring+Automobile+Road,+%D0%A2%D0%BE%D1%88%D0%BA%D0%B5%D0%BD%D1%82,+Tashkent,+Uzbekistan/@41.2294433,69.1730268,18z/data=!4m6!3m5!1s0x38ae631b59b6c191:0x470d9bab83508b45!8m2!3d41.2294433!4d69.1730268!16s%2Fg%2F11nmt3b09p?g_ep=Eg1tbF8yMDI2MDMwNF8wIOC7DCoASAJQAg%3D%3D" className="group flex items-center gap-2 transition-all hover:text-accent" target="_blank" rel="noreferrer">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent/40 transition-all group-hover:bg-accent group-hover:scale-125" />
                  1. Olim Polvon filiali
                </a>
                <a href="https://maps.app.goo.gl/4KcLqHxEzdk5U5gD8" className="group flex items-center gap-2 transition-all hover:text-accent" target="_blank" rel="noreferrer">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent/40 transition-all group-hover:bg-accent group-hover:scale-125" />
                  2. Algoritim filiali
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 px-4 py-6 text-center text-[10px] uppercase tracking-widest text-white/40 md:px-6">
        &copy; {new Date().getFullYear()} YEC Market. Barcha huquqlar himoyalangan.
      </div>
    </footer>
  );
}
