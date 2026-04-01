'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { resetPassword } from '@/services/auth.service';
import Link from 'next/link';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const emailParam = searchParams?.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await resetPassword({ email, otp, newPassword });
      setMessage(res.message);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Xatolik yuz berdi. Qayta urinib ko\'ring.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-20 bg-gradient-to-br from-white to-sand/20">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-ink/5 bg-white/70 p-8 shadow-2xl backdrop-blur-2xl">
        <div className="text-center">
          <h1 className="font-serif text-3xl font-bold text-ink">Yangi parol o'rnatish</h1>
          <p className="mt-2 text-sm text-ink/60">
            Emailingizga yuborilgan kodni va yangi parolni kiriting.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-ink/40">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                readOnly
                value={email}
                className="w-full rounded-2xl border-none bg-ink/[0.03] px-5 py-4 text-sm font-medium text-ink/50 outline-none"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="otp" className="text-xs font-bold uppercase tracking-widest text-ink/40">
                Tasdiqlash kodi
              </label>
              <input
                id="otp"
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full rounded-2xl border-none bg-ink/[0.03] px-5 py-4 text-sm font-medium text-ink placeholder:text-ink/20 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                placeholder="000000"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="newPassword" className="text-xs font-bold uppercase tracking-widest text-ink/40">
                Yangi parol
              </label>
              <input
                id="newPassword"
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-2xl border-none bg-ink/[0.03] px-5 py-4 text-sm font-medium text-ink placeholder:text-ink/20 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 p-4 text-sm font-medium text-red-600 border border-red-100 italic">
              {error}
            </div>
          )}

          {message && (
            <div className="rounded-xl bg-green-50 p-4 text-sm font-medium text-green-600 border border-green-100 italic">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-ink py-4 text-sm font-bold text-white shadow-xl shadow-ink/10 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'Parol yangilanmoqda...' : 'Parolni yangilash'}
          </button>
        </form>

        <div className="text-center">
          <Link href="/login" className="text-sm font-bold text-primary hover:underline">
            Orqaga qaytish
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[80vh] items-center justify-center">Yuklanmoqda...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
