'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import SingleBranchMap from '@/components/SingleBranchMap';

const carouselImages = [
  {
    src: '/images/about/family.png',
    alt: 'YEC Eron premium gilami - Oilaviy qulaylik',
  },
  {
    src: '/images/collections/iran-soft/PR20K.jpg',
    alt: 'YEC Eron premium gilami - Keng va yorug\' mehmonxona',
  },
  {
    src: '/images/collections/iran-soft/PR20H.jpg',
    alt: 'YEC Eron premium gilami - PR20H',
  },
];

export default function AboutPage() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % carouselImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#020617] overflow-hidden sm:py-16 py-8">
      {/* Background ambient glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[150px] mix-blend-screen pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <section className="bg-[#0B1120]/80 backdrop-blur-2xl border border-blue-500/20 shadow-[0_0_50px_rgba(29,78,216,0.15)] rounded-3xl overflow-hidden ring-1 ring-white/10">
          <div className="grid gap-0 md:grid-cols-2">

            {/* Image Carousel Panel */}
            <div className="relative h-[400px] md:h-full md:min-h-[600px] w-full overflow-hidden bg-slate-900 group">
              {carouselImages.map((image, index) => (
                <img
                  key={index}
                  src={image.src}
                  alt={image.alt}
                  className={`absolute inset-0 h-full w-full object-cover transition-all duration-1000 ease-in-out transform ${index === currentIndex ? 'opacity-100 scale-105' : 'opacity-0 scale-100'
                    }`}
                />
              ))}

              {/* Blur overlay for depth and premium feel */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/40 to-transparent opacity-90 transition-opacity duration-500 group-hover:opacity-75" />
              <div className="absolute inset-0 bg-blue-900/20 mix-blend-overlay" />

              {/* Navigation Dots */}
              <div className="absolute bottom-8 left-0 right-0 z-10 flex justify-center gap-3">
                {carouselImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`h-1.5 rounded-full transition-all duration-500 ease-out ${index === currentIndex
                      ? 'bg-blue-400 w-8 shadow-[0_0_15px_rgba(96,165,250,0.8)]'
                      : 'bg-white/30 w-2 hover:bg-blue-300/70 hover:w-4'
                      }`}
                    aria-label={`Slide ${index + 1}`}
                  />
                ))}
              </div>

              {/* Carousel Badge */}
              <div className="absolute top-8 left-8 z-10">
                <span className="flex items-center gap-2 rounded-full bg-[#020617]/60 px-5 py-2 text-xs font-bold uppercase tracking-[0.25em] text-blue-200 backdrop-blur-md border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shadow-[0_0_8px_rgba(96,165,250,1)]"></span>
                  Premium Galereya
                </span>
              </div>
            </div>

            {/* Content Panel */}
            <div className="relative flex flex-col justify-center p-8 sm:p-12 lg:p-16">
              {/* Decorative line */}
              <div className="absolute top-0 right-0 w-32 h-[1px] bg-gradient-to-l from-transparent to-blue-500/50" />
              <div className="absolute bottom-0 left-0 w-32 h-[1px] bg-gradient-to-r from-transparent to-indigo-500/50" />

              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-blue-100 to-blue-400 tracking-tight leading-tight">
                Biz haqimizda
              </h1>

              <div className="mt-6 flex items-center gap-4">
                <div className="h-1 w-24 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.6)]" />
                <div className="h-1 w-4 bg-blue-400 rounded-full opacity-60" />
                <div className="h-1 w-2 bg-indigo-400 rounded-full opacity-40" />
              </div>

              <div className="mt-10 space-y-6 text-[15px] sm:text-base leading-[1.8] text-slate-300 font-light">
                <p className="text-slate-200 text-lg sm:text-xl font-medium leading-relaxed">
                  YEC Tashkent - YEC zavodining Toshkentdagi rasmiy do&apos;konlar tarmog&apos;idir.
                </p>
                <div className="p-5 rounded-2xl bg-blue-950/30 border border-blue-500/10 backdrop-blur-sm relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <p className="relative z-10 text-slate-300">
                    Bizning asosiy afzalligimiz - mahsulotlarni bevosita zavoddan, hech qanday vositachilarsiz yetkazib berishimizdir. Shu sababli, do&apos;konlarimizda narxlar zavod tomonidan belgilangan rasmiy qiymatda sotiladi. Bizning maqsadimiz - xalqimizga sifatli, zamonaviy va hamyonbop gilamlarni to&apos;g&apos;ridan-to&apos;g&apos;ri ishlab chiqaruvchidan taqdim etishdir.
                  </p>
                </div>
                <p>
                  <span className="text-blue-400 font-bold tracking-wide drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]">YEC</span> korxonasida O&apos;zbekistonda noyob bo&apos;lgan Eron texnologiyali to&apos;quv liniyalari mavjud. Ushbu texnologiyalar asosida{' '}
                  <span className="text-white font-medium bg-blue-900/40 px-2 py-0.5 rounded border border-blue-500/20">1200 taroqda</span> va{' '}
                  <span className="text-white font-medium bg-indigo-900/40 px-2 py-0.5 rounded border border-indigo-500/20">3 000 000 zichlikdagi</span>{' '}
                  <Link
                    href="/carpets?search=Eron"
                    className="relative inline-block text-blue-300 font-bold hover:text-blue-100 transition-colors duration-300 group/link"
                  >
                    Eron premium
                    <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-gradient-to-r from-blue-400 to-indigo-400 origin-left scale-x-100 group-hover/link:scale-x-0 transition-transform duration-300" />
                  </Link>{' '}
                  gilamlari ishlab chiqariladi.
                </p>
                <p className="flex items-center gap-3 text-sm text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                  Zavod mahsulotlari nafaqat O&apos;zbekistonga, balki AQSHgacha bo&apos;lgan mamlakatlarga eksport qilinadi.
                </p>
              </div>

              <div className="mt-8 relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0B1120]/90 via-[#0B1120]/70 to-[#0B1120]/40 p-6 sm:p-7 shadow-[0_0_30px_rgba(37,99,235,0.18)] ring-1 ring-white/5 transition hover:shadow-[0_0_45px_rgba(56,189,248,0.25)]">
                <div className="pointer-events-none absolute -top-24 -left-10 h-40 w-40 rounded-full bg-sky-500/20 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-20 right-0 h-48 w-48 rounded-full bg-rose-500/20 blur-3xl" />
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_60%)]" />

                <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <span className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.4em] text-sky-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-sky-300 shadow-[0_0_8px_rgba(125,211,252,1)]" />
                      Bizni kuzating
                    </span>
                    <p className="mt-3 text-sm sm:text-base text-slate-200 leading-relaxed">
                      Yangiliklar, chegirmalar va yangi kolleksiyalarni birinchi bo&apos;lib bilish uchun Telegram va Instagram sahifalarimizga qo&apos;shiling.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <a
                      href="https://t.me/yecgilamuz"
                      target="_blank"
                      rel="noreferrer"
                      className="group inline-flex items-center justify-center gap-2 rounded-full border border-sky-400/40 bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-100 transition-all duration-300 hover:-translate-y-0.5 hover:border-sky-300 hover:bg-sky-500/25 hover:text-white hover:shadow-[0_0_18px_rgba(56,189,248,0.35)]"
                    >
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-sky-500/20 text-sky-200 group-hover:bg-sky-500/30">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M21.9 4.6c.2-1-0.7-1.8-1.6-1.4L2.9 11.1c-1 .5-.9 2 .2 2.3l4.9 1.5 1.8 5.4c.4 1.1 1.8 1.3 2.5.4l2.7-3.2 5.2 3.8c.9.6 2.1.1 2.3-1l2.4-16.7ZM8.7 13.9l9.6-6-7.7 7.2-.3 3.6-1.6-4.8Z" />
                        </svg>
                      </span>
                      Telegram
                    </a>
                    <a
                      href="https://www.instagram.com/yec_toshkent?igsh=MTR3ZmRxZjgycHpjZA=="
                      target="_blank"
                      rel="noreferrer"
                      className="group inline-flex items-center justify-center gap-2 rounded-full border border-rose-400/40 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-100 transition-all duration-300 hover:-translate-y-0.5 hover:border-rose-300 hover:bg-rose-500/25 hover:text-white hover:shadow-[0_0_18px_rgba(244,63,94,0.35)]"
                    >
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-rose-500/20 text-rose-200 group-hover:bg-rose-500/30">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm0 2a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H7Zm5 3.5A5.5 5.5 0 1 1 6.5 14 5.5 5.5 0 0 1 12 8.5Zm0 2A3.5 3.5 0 1 0 15.5 14 3.5 3.5 0 0 0 12 10.5Zm5.25-3.75a1 1 0 1 1-1 1 1 1 0 0 1 1-1Z" />
                        </svg>
                      </span>
                      Instagram
                    </a>
                  </div>
                </div>
              </div>

              <div className="mt-12 grid grid-cols-2 gap-6 pt-10 relative">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />

                <div className="group/stat relative p-6 rounded-2xl bg-[#0F172A] border border-blue-500/10 hover:border-blue-400/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.1)]">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent opacity-0 group-hover/stat:opacity-100 transition-opacity rounded-2xl" />
                  <p className="relative text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-blue-300">
                    100<span className="text-blue-500">%</span>
                  </p>
                  <p className="relative mt-2 text-xs font-bold uppercase tracking-[0.2em] text-blue-400/80 group-hover/stat:text-blue-300 transition-colors">
                    Zavod Narxi
                  </p>
                </div>

                <div className="group/stat relative p-6 rounded-2xl bg-[#0F172A] border border-indigo-500/10 hover:border-indigo-400/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(99,102,241,0.1)]">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 to-transparent opacity-0 group-hover/stat:opacity-100 transition-opacity rounded-2xl" />
                  <p className="relative text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-indigo-300">
                    Sifat
                  </p>
                  <p className="relative mt-2 text-xs font-bold uppercase tracking-[0.2em] text-indigo-400/80 group-hover/stat:text-indigo-300 transition-colors">
                    Kafolatlangan
                  </p>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Filiallar Section */}
        <section className="mt-16 space-y-10">
          <header className="text-center max-w-2xl mx-auto">
            <h2 className="font-serif text-3xl sm:text-4xl text-white">Bizning filiallarimiz</h2>
            <p className="mt-4 text-slate-400">
              Sizga yaqin bo&apos;lgan filialimizga tashrif buyuring va gilamlarni o&apos;z ko&apos;zingiz bilan ko&apos;ring.
            </p>
          </header>

          <div className="grid gap-8 md:grid-cols-2">
            {[
              {
                name: 'Olim Polvon filiali',
                lat: 41.2294433,
                lng: 69.1730268,
                address: 'Toshkent halqa yoʻli, Olim Polvon bozori roʻparasida',
                phone: '+998 99 799 99 22',
              },
              {
                name: 'Algoritim filiali',
                lat: 41.2621776,
                lng: 69.147668,
                address: 'Samarqand Darvoza koʻchasi, Algoritim daxasi',
                phone: '+998 99 107 99 22',
              },
            ].map((branch) => (
              <div key={branch.name} className="flex flex-col bg-[#0B1120]/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl transition-all hover:border-blue-500/30">
                <div className="h-[350px] w-full">
                  <SingleBranchMap 
                    lat={branch.lat} 
                    lng={branch.lng} 
                    name={branch.name} 
                    address={branch.address} 
                  />
                </div>
                <div className="p-8 space-y-6">
                  <div>
                    <h3 className="font-serif text-2xl text-white">{branch.name}</h3>
                    <p className="mt-2 text-slate-400 text-sm leading-relaxed">{branch.address}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Ish vaqti</p>
                      <p className="text-sm font-semibold text-white">Har kuni</p>
                      <p className="text-xs text-blue-400 mt-0.5">08:00 - 21:00</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Aloqa</p>
                      <p className="text-sm font-semibold text-white">{branch.phone}</p>
                    </div>
                  </div>

                  <a 
                    href={`https://www.google.com/maps/dir/?api=1&destination=${branch.lat},${branch.lng}`}
                    target="_blank"
                    className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-blue-600/10 border border-blue-500/30 text-blue-400 font-bold text-sm transition hover:bg-blue-600 hover:text-white"
                  >
                    Xaritada ko&apos;rish ->
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
