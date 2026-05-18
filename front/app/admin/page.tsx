'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getErrorMessage } from '@/services/api';
import { getUserFromToken } from '@/services/auth.service';

type Stats = {
  usersCount: number;
  carpetsCount: number;
  orders: {
    total: number;
    pending: number;
    accepted: number;
    delivered: number;
    cancelled: number;
    onWay: number;
  };
};

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get<Stats>('/users/stats');
        setStats(data);
      } catch (err) {
        setError(getErrorMessage(err));
      }
    };
    void load();
  }, []);

  return (
    <div className="section-shell py-12 relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sky-100/30 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-amber-100/30 rounded-full blur-[100px] -z-10" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-sky-300/30 bg-sky-50 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.4em] text-sky-600 shadow-sm mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.8)]" />
            Boshqaruv markazi
          </p>
          <h1 className="font-serif text-5xl text-ink md:text-6xl">Admin panel</h1>
          <p className="mt-4 text-ink/60 max-w-xl text-lg">
            Sayt statistikasi va mahsulotlar boshqaruvi. Buyurtmalarni nazorat qiling va yangi gilamlar qo&apos;shing.
          </p>
        </div>
        <div className="hidden lg:block">
           <div className="group relative w-56 h-56 bg-white/60 backdrop-blur-[20px] rounded-[3.5rem] border border-white/80 shadow-2xl flex items-center justify-center p-10 rotate-3 transition-transform hover:rotate-0 duration-700">
              <div className="absolute inset-0 bg-gradient-to-br from-sky-400/10 to-amber-400/10 rounded-[3.5rem] -z-10" />
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="w-full h-full object-contain drop-shadow-[0_10px_30px_rgba(14,165,233,0.3)] opacity-90 transition-all group-hover:scale-110" 
              />
           </div>
        </div>
      </div>

      {error ? (
        <p className="mt-8 rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700 shadow-sm animate-in fade-in slide-in-from-top-4">
          {error}
        </p>
      ) : null}

      {/* Removed stats cards (graphs) as requested */}

      <div className="mt-12">
        <h2 className="font-serif text-3xl text-ink mb-8">Tezkor amallar</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Link 
            href="/admin/orders" 
            className="group relative flex flex-col items-start p-8 rounded-[2.5rem] bg-slate-900 text-white transition hover:-translate-y-1 hover:shadow-2xl overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors" />
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-6">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="flex items-center gap-2">
               <span className="text-xl font-bold">Buyurtmalar</span>
               {stats?.orders.pending ? (
                 <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold anima-pulse">{stats.orders.pending} ta yangi</span>
               ) : null}
            </div>
            <p className="mt-2 text-sm text-white/50">Mijozlardan kelgan barcha buyurtmalarni ko&apos;rish va holatini o&apos;zgartirish.</p>
          </Link>

          <Link 
            href="/admin/carpets" 
            className="group relative flex flex-col items-start p-8 rounded-[2.5rem] bg-sky-600 text-white transition hover:-translate-y-1 hover:shadow-2xl overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors" />
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-6">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </div>
            <span className="text-xl font-bold">Gilamlar</span>
            <p className="mt-2 text-sm text-white/50">Gilamlar bazasini boshqarish, narxlarni tahrirlash va sonini o&apos;zgartirish.</p>
          </Link>

          <Link 
            href="/admin/hero" 
            className="group relative flex flex-col items-start p-8 rounded-[2.5rem] bg-rose-600 text-white transition hover:-translate-y-1 hover:shadow-2xl overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors" />
            <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center mb-6">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
            </div>
            <span className="text-xl font-bold">Kirish animatsiyasi</span>
            <p className="mt-2 text-sm text-white/60">Saytga kirilganda ko&apos;rinadigan bosh sahifa animatsiyasidagi gilamlarni qo&apos;lda tahrirlash.</p>
          </Link>

          <Link 
            href="/admin/discounts" 
            className="group relative flex flex-col items-start p-8 rounded-[2.5rem] bg-amber-500 text-white transition hover:-translate-y-1 hover:shadow-2xl overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors" />
            <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center mb-6">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.12-3 2.5S10.343 13 12 13s3 1.12 3 2.5S13.657 18 12 18m0-10v10m0-10V6m0 12v2m6-10h1m-14 0H4m2.636-4.95l.707-.707m9.9 9.9l.707.707m-11.314 0l-.707.707m9.9-9.9l.707-.707" />
              </svg>
            </div>
            <span className="text-xl font-bold">Skidkalar</span>
            <p className="mt-2 text-sm text-white/60">Kolleksiya bo&apos;yicha bir xil m² narxni tekislash va ommaviy skidka berish.</p>
          </Link>

          <Link 
            href="/admin/prices" 
            className="group relative flex flex-col items-start p-8 rounded-[2.5rem] bg-indigo-600 text-white transition hover:-translate-y-1 hover:shadow-2xl overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors" />
            <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center mb-6">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v18m9-9H3m15.5-5.5a4.95 4.95 0 01-7 0 4.95 4.95 0 01-7 0m14 11a4.95 4.95 0 01-7 0 4.95 4.95 0 01-7 0" />
              </svg>
            </div>
            <span className="text-xl font-bold">m2 narxlar</span>
            <p className="mt-2 text-sm text-white/60">Tanlangan kolleksiyadagi barcha mahsulotlar m2 narxini bir xil qiymatga yangilash.</p>
          </Link>

          <Link 
            href="/admin/promocodes" 
            className="group relative flex flex-col items-start p-8 rounded-[2.5rem] bg-teal-600 text-white transition hover:-translate-y-1 hover:shadow-2xl overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors" />
            <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center mb-6">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5-1h6v6m-7 8l-5-5a2 2 0 010-2.828l9.172-9.172A2 2 0 0114.586 3H20a1 1 0 011 1v5.414a2 2 0 01-.586 1.414l-9.172 9.172a2 2 0 01-2.828 0z" />
              </svg>
            </div>
            <span className="text-xl font-bold">Promokodlar</span>
            <p className="mt-2 text-sm text-white/60">Skidka yoki gilamcha promokodlarini boshqarish, har bir foydalanuvchi har bir koddan 1 marta foydalanadi.</p>
          </Link>

          <Link 
            href="/admin/carpets/create?type=joynamoz" 
            className="group relative flex flex-col items-start p-8 rounded-[2.5rem] bg-emerald-600 text-white transition hover:-translate-y-1 hover:shadow-2xl overflow-hidden"
          >
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors" />
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-6">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xl font-bold">Joynamoz qo&apos;shish</span>
            <p className="mt-2 text-sm text-white/50">Yangi toifadagi joynamozlarni va kichik o&apos;lchamdagi mahsulotlarni kiritish.</p>
          </Link>

          <Link 
            href="/admin/carpets/create?type=oval" 
            className="group relative flex flex-col items-start p-8 rounded-[2.5rem] bg-fuchsia-600 text-white transition hover:-translate-y-1 hover:shadow-2xl overflow-hidden"
          >
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors" />
            <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center mb-6">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3c4.97 0 9 3.582 9 8s-4.03 8-9 8-9-3.582-9-8 4.03-8 9-8z" />
              </svg>
            </div>
            <span className="text-xl font-bold">Oval gilam qo&apos;shish</span>
            <p className="mt-2 text-sm text-white/60">Yangi turga faqat oval shakldagi gilamlarni alohida qo&apos;shish.</p>
          </Link>

          <Link 
            href="/admin/users" 
            className="group relative flex flex-col items-start p-8 rounded-[2.5rem] bg-white border border-black/5 text-ink transition hover:-translate-y-1 hover:shadow-2xl overflow-hidden"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-6">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <span className="text-xl font-bold">Foydalanuvchilar</span>
            <p className="mt-2 text-sm text-ink/40">Sayt foydalanuvchilari ro&apos;yxati va ularning faolligi.</p>
          </Link>

          <Link 
            href="/admin/categories" 
            className="group relative flex flex-col items-start p-8 rounded-[2.5rem] bg-white border border-black/5 text-ink transition hover:-translate-y-1 hover:shadow-2xl overflow-hidden"
          >
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 11h.01M7 15h.01M13 7h.01M13 11h.01M13 15h.01M17 7h.01M17 11h.01M17 15h.01" />
              </svg>
            </div>
            <span className="text-xl font-bold">Kategoriyalar</span>
            <p className="mt-2 text-sm text-ink/40">Mahsulot toifalari (turlar) boshqaruvi va yangi turlar qo&apos;shish.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
