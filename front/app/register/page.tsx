'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getErrorMessage } from '@/services/api';
import {
  getGoogleLoginUrl,
  requestRegisterOtp,
  verifyRegisterOtp,
} from '@/services/auth.service';
import { formatPhoneNumber, normalizePhoneNumber } from '@/utils/format';

type Step = 'register' | 'verify' | 'done';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('register');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+998');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [devOtpCode, setDevOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const googleLoginUrl = getGoogleLoginUrl();

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  const requestOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setLoading(true);
      setError('');
      setMessage('');

      const response = await requestRegisterOtp({
        firstName,
        lastName,
        email,
        phone: normalizePhoneNumber(phone),
        password,
      });

      setDevOtpCode(response.devOtpCode ?? '');
      setMessage(response.message);
      setStep('verify');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setLoading(true);
      setError('');
      setMessage('');
      const response = await verifyRegisterOtp({ email, otp });
      setMessage(response.message);
      setStep('done');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (!email) {
      setError('Email manzili kiritilmagan.');
      return;
    }
    try {
      setResending(true);
      setError('');
      setMessage('');
      const response = await requestRegisterOtp({
        firstName,
        lastName,
        email,
        phone: normalizePhoneNumber(phone),
        password,
      });
      setDevOtpCode(response.devOtpCode ?? '');
      setMessage(response.message || "Tasdiqlash kodi qayta yuborildi.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="relative overflow-hidden py-12">
      <div className="pointer-events-none absolute -top-32 left-1/4 h-72 w-72 rounded-full bg-sky-200/40 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-32 right-1/4 h-80 w-80 rounded-full bg-blue-200/40 blur-[140px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_60%)]" />

      <div className="section-shell relative z-10">
        <div className="mx-auto max-w-xl rounded-[2rem] border border-white/70 bg-white/80 p-8 shadow-[0_35px_90px_rgba(56,189,248,0.18)] backdrop-blur">
          <p className="inline-flex items-center gap-2 rounded-full border border-sky-200/70 bg-white/70 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.4em] text-sky-700">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.8)]" />
            Yangi akkaunt
          </p>
          <h1 className="mt-4 font-serif text-3xl text-premium md:text-5xl">
            Ro&apos;yxatdan o&apos;tish
          </h1>
          <p className="mt-3 text-sm text-ink/70">
            Tasdiqlash kodi faqat emailga yuboriladi. Telefon raqami profilda saqlanadi.
          </p>

        {step === 'register' ? (
          <>
            <form onSubmit={requestOtp} className="mt-8 space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <input
                  type="text"
                  placeholder="Ism"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  className="input-field"
                  required
                />
                <input
                  type="text"
                  placeholder="Familiya"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  className="input-field"
                  required
                />
              </div>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="input-field"
                required
              />
              <input
                type="text"
                placeholder="+998 88 614 13 30"
                value={phone}
                onChange={handlePhoneChange}
                maxLength={17}
                className="input-field font-mono tracking-wider"
                required
              />
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Parol"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="input-field pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-ink/40 transition-colors hover:text-primary focus:outline-none"
                  aria-label={showPassword ? 'Parolni yashirish' : 'Parolni ko\'rsatish'}
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                      <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                      <line x1="2" y1="2" x2="22" y2="22" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              <button type="submit" disabled={loading} className="btn-primary mt-4 w-full">
                {loading ? 'Yuborilmoqda...' : "Tasdiqlash kodini so'rash"}
              </button>
            </form>

            <div className="mt-8 flex items-center gap-4 text-sm text-ink/40 before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">
              YOKI
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.location.href = googleLoginUrl;
                  }
                }}
                className="group flex w-full items-center justify-center gap-3 rounded-full border border-[#dadce0] bg-white px-5 py-3 text-sm font-semibold text-[#3c4043] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#f8f9fa]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#dadce0] bg-white shadow-sm">
                  <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.25 1.54 7.68 2.83l5.6-5.6C33.9 3.6 29.3 1.5 24 1.5 14.8 1.5 7 6.8 3.5 14.3l6.92 5.37C12.1 13 17.6 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.5 24.5c0-1.57-.14-3.09-.4-4.55H24v8.63h12.7c-.55 2.98-2.18 5.5-4.64 7.2l7.07 5.47c4.13-3.8 6.37-9.4 6.37-16.75z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.42 28.83a14.45 14.45 0 0 1 0-9.16l-6.92-5.37a23.9 23.9 0 0 0 0 19.9l6.92-5.37z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 46.5c6.48 0 11.92-2.13 15.9-5.77l-7.07-5.47c-1.95 1.31-4.46 2.1-8.83 2.1-6.4 0-11.9-3.5-13.58-8.55l-6.92 5.37C7 41.2 14.8 46.5 24 46.5z"
                    />
                  </svg>
                </span>
                Google orqali kirish
              </button>
            </div>

            <div className="mt-8 text-center text-sm text-ink/60">
              Hisobingiz bormi?{' '}
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="font-bold text-primary hover:underline"
              >
                Kirish
              </button>
            </div>
          </>
        ) : null}

        {step === 'verify' ? (
          <form onSubmit={verifyOtp} className="mt-6 space-y-4">
            <p className="rounded-xl border border-olive/20 bg-olive/5 px-4 py-3 text-sm text-olive">
              {message || "Tasdiqlash kodi emailingizga yuborildi. Kiritib tasdiqlang."}
            </p>

            {devOtpCode ? (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Test tasdiqlash kodi: <strong>{devOtpCode}</strong>
              </p>
            ) : null}

            <input
              type="text"
              placeholder="6 xonali tasdiqlash kodi"
              value={otp}
              onChange={(event) => setOtp(event.target.value)}
              className="input-field"
              required
            />
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={resendOtp}
                disabled={resending}
                className="btn-secondary w-full sm:w-auto"
              >
                {resending ? 'Yuborilmoqda...' : 'Kodni qayta yuborish'}
              </button>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Tekshirilmoqda...' : 'Tasdiqlash'}
              </button>
            </div>
          </form>
        ) : null}

        {step === 'done' ? (
          <div className="mt-6 space-y-4">
            <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              {message || "Ro'yxatdan o'tish yakunlandi."}
            </p>
            <Link href="/login" className="btn-primary inline-block">
              Login sahifasiga o&apos;tish
            </Link>
          </div>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}
      </div>
    </div>
    </div>
  );
}
