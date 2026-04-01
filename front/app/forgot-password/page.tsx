'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getErrorMessage } from '@/services/api';
import {
  requestForgotPassword,
  resetPassword as resetPasswordRequest,
} from '@/services/auth.service';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1); // 1: Request OTP, 2: Reset Password
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const requestOtp = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setMessage('');

      const data = await requestForgotPassword(email);
      setMessage(data.message);
      if (data.devOtpCode) {
        console.log('Dev OTP:', data.devOtpCode);
        setMessage((prev) => prev + ` (Dev OTP: ${data.devOtpCode})`);
      }
      setStep(2);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');

      await resetPasswordRequest({ email, otp, newPassword });

      setMessage("Parol muvaffaqiyatli o'zgartirildi. Endi tizimga kirishingiz mumkin.");
      setTimeout(() => router.push('/login'), 3000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section-shell py-10">
      <div className="mx-auto max-w-md rounded-2xl border border-black/5 bg-white p-6 shadow-soft">
        <h1 className="font-serif text-3xl text-ink">
          {step === 1 ? 'Parolni tiklash' : 'Yangi parol o\'rnatish'}
        </h1>
        <p className="mt-2 text-sm text-ink/70">
          {step === 1 
            ? 'Emailingizni kiriting, biz sizga tasdiqlash kodini yuboramiz.' 
            : 'Emailingizga yuborilgan kodni va yangi parolni kiriting.'
          }
        </p>

        {step === 1 ? (
          <form onSubmit={requestOtp} className="mt-8 space-y-5">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              required
            />
            <button type="submit" disabled={loading} className="btn-primary w-full shadow-lg shadow-primary/20">
              {loading ? 'Yuborilmoqda...' : 'Kod yuborish'}
            </button>
          </form>
        ) : (
          <form onSubmit={resetPassword} className="mt-8 space-y-5">
            <p className="text-xs font-bold text-primary">Email: {email}</p>
            <input
              type="text"
              placeholder="Tasdiqlash kodi"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="input-field text-center tracking-[0.5em] font-bold"
              maxLength={6}
              required
            />
            <input
              type="password"
              placeholder="Yangi parol"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input-field"
              minLength={6}
              required
            />
            <button type="submit" disabled={loading} className="btn-primary w-full shadow-lg shadow-primary/20">
              {loading ? 'Saqlanmoqda...' : 'Parolni yangilash'}
            </button>
            <button 
              type="button" 
              onClick={() => setStep(1)} 
              className="w-full text-center text-xs font-bold uppercase tracking-widest text-ink/40 hover:text-primary"
            >
              Emailni o'zgartirish
            </button>
          </form>
        )}

        {message && (
          <p className="mt-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
            {message}
          </p>
        )}

        {error && (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-6 border-t border-black/5 pt-4">
          <Link href="/login" className="text-sm font-semibold text-primary hover:underline">
            Kirish sahifasiga qaytish
          </Link>
        </div>
      </div>
    </div>
  );
}
