'use client';

import { useState } from 'react';
import { copyText } from '@/utils/clipboard';

export default function ContactPage() {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = async (text: string) => {
    const ok = await copyText(text);
    if (ok) {
      setCopied(text);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020617]">
      {/* Background ambient glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[150px] mix-blend-screen pointer-events-none" />

      <div className="section-shell relative z-10 space-y-12 py-14">
        <header className="max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.4em] text-blue-200 shadow-[0_10px_30px_rgba(56,189,248,0.1)]">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400 shadow-[0_0_12px_rgba(56,189,248,0.9)]" />
            YEC Tashkent
          </p>
          <h1 className="mt-4 font-serif text-4xl text-white md:text-6xl">
            Aloqa uchun
          </h1>
          <p className="mt-4 text-base text-slate-400">
            Savollaringiz bormi? Biz bilan tez va qulay bog&apos;laning. Telefon raqamlarini bir bosishda nusxalab
            olishingiz yoki ijtimoiy tarmoqlar orqali yozishingiz mumkin.
          </p>
        </header>

        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#0B1120]/80 p-7 shadow-[0_35px_90px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
            <div className="pointer-events-none absolute -top-16 left-0 h-40 w-40 rounded-full bg-blue-600/10 blur-[90px]" />
            <div className="pointer-events-none absolute bottom-0 right-0 h-56 w-56 rounded-full bg-indigo-600/10 blur-[110px]" />

            <div className="relative space-y-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.35em] text-slate-500">Bog&apos;lanish</p>
                <h2 className="mt-2 font-serif text-3xl text-white">Biz bilan bog&apos;laning</h2>
                <p className="mt-2 text-sm text-slate-400">
                  Har bir murojaat tez ko&apos;rib chiqiladi. Telefon, Telegram yoki Instagram orqali yozing.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  { label: 'Tel 1', phone: '+998997999922', display: '+998 99 799 99 22' },
                  { label: 'Tel 2', phone: '+998991079922', display: '+998 99 107 99 22' },
                ].map((item) => (
                  <div key={item.phone} className="group relative">
                    <button
                      onClick={() => copyToClipboard(item.phone)}
                      className="flex w-full items-center justify-between gap-4 rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-left shadow-lg transition hover:-translate-y-0.5 hover:border-blue-500/30 hover:bg-white/10"
                    >
                      <span className="flex items-center gap-3">
                        <span className="grid h-11 w-11 place-items-center rounded-full bg-blue-500/10 text-blue-400">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6.6 2.9c.3-.3.7-.4 1.1-.3l3 1c.5.2.8.6.8 1.1v3.1c0 .4-.2.8-.6 1.1l-1.4 1.1a13.5 13.5 0 0 0 4.6 4.6l1.1-1.4c.3-.4.7-.6 1.1-.6h3.1c.5 0 .9.3 1.1.8l1 3c.1.4 0 .8-.3 1.1l-1.6 1.6c-.5.5-1.2.7-1.9.6-5.2-.9-10.4-6.1-11.3-11.3-.1-.7.1-1.4.6-1.9l1.6-1.6Z" />
                          </svg>
                        </span>
                        <span>
                          <span className="block text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
                            {item.label}
                          </span>
                          <span className="text-base font-semibold text-white">{item.display}</span>
                        </span>
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-blue-400 opacity-0 transition group-hover:opacity-80">
                        Nusxa
                      </span>
                    </button>
                    {copied === item.phone && (
                      <span className="absolute right-4 -top-7 rounded-full bg-blue-600 px-3 py-1 text-xs text-white shadow-lg fade-up">
                        Nusxalandi!
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-white/5 bg-white/5 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">Ijtimoiy tarmoqlar</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <a
                    href="https://t.me/yecgilamuz"
                    className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#26A5E4]/20 hover:border-[#26A5E4]/30"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-[#26A5E4]/10 text-[#26A5E4]">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M21.9 4.6c.2-1-0.7-1.8-1.6-1.4L2.9 11.1c-1 .5-.9 2 .2 2.3l4.9 1.5 1.8 5.4c.4 1.1 1.8 1.3 2.5.4l2.7-3.2 5.2 3.8c.9.6 2.1.1 2.3-1l2.4-16.7ZM8.7 13.9l9.6-6-7.7 7.2-.3 3.6-1.6-4.8Z" />
                      </svg>
                    </span>
                    Telegram
                  </a>
                  <a
                    href="https://www.instagram.com/yec_toshkent"
                    className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#E1306C]/20 hover:border-[#E1306C]/30"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-[#E1306C]/10 text-[#E1306C]">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm0 2a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H7Zm5 3.5A5.5 5.5 0 1 1 6.5 14 5.5 5.5 0 0 1 12 8.5Zm0 2A3.5 3.5 0 1 0 15.5 14 3.5 3.5 0 0 0 12 10.5Zm5.25-3.75a1 1 0 1 1-1 1 1 1 0 0 1 1-1Z" />
                      </svg>
                    </span>
                    Instagram
                  </a>
                </div>
              </div>

              <div className="rounded-2xl border border-white/5 bg-white/5 p-5 text-white">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">Manzillar</p>
                <div className="mt-4 space-y-3">
                  {[
                    { name: '1. Olim Polvon filiali', url: 'https://www.google.com/maps/place/YEC,+Tashkent+Ring+Automobile+Road,+%D0%A2%D0%BE%D1%88%D0%BA%D0%B5%D0%BD%D1%82,+Tashkent,+Uzbekistan/@41.2294433,69.1730268,18z/data=!4m6!3m5!1s0x38ae631b59b6c191:0x470d9bab83508b45!8m2!3d41.2294433!4d69.1730268!16s%2Fg%2F11nmt3b09p?g_ep=Eg1tbF8yMDI2MDMwNF8wIOC7DCoASAJQAg%3D%3D' },
                    { name: '2. Algoritim filiali', url: 'https://maps.app.goo.gl/4KcLqHxEzdk5U5gD8' }
                  ].map((branch) => (
                    <a
                      key={branch.name}
                      href={branch.url}
                      className="group flex items-center justify-between rounded-2xl border border-white/5 bg-[#020617]/50 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:-translate-y-0.5 hover:border-blue-500/30 hover:text-white"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {branch.name}
                      <span className="opacity-0 transition-opacity group-hover:opacity-100">-&gt;</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            {[
              { title: '1. Olim Polvon filiali', src: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1500.518605553556!2d69.1730268!3d41.2294433!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x38ae631b59b6c191%3A0x470d9bab83508b45!2sYEC!5e0!3m2!1sen!2s!4v1709110000000!5m2!1sen!2s' },
              { title: '2. Algoritim filiali', src: 'https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d95972.64158576117!2d68.9952327!3d41.2621776!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x38ae89003d2e57ef%3A0x3ffc414b25c1ff79!2sSamarqand%20Yec%20Gilamlari!5e0!3m2!1sen!2s!4v1773081776670!5m2!1sen!2s' }
            ].map((map) => (
              <div key={map.title} className="rounded-[2.25rem] border border-white/10 bg-[#0B1120]/80 p-5 shadow-2xl backdrop-blur-md">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <h2 className="font-serif text-2xl text-white">{map.title}</h2>
                  <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.3em] text-blue-300">
                    Toshkent
                  </span>
                </div>
                <div className="overflow-hidden rounded-2xl border border-white/5 shadow-inner">
                  <iframe
                    title={map.title}
                    src={map.src}
                    className="h-[300px] w-full border-0 shadow-lg"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}
