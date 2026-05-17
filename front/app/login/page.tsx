'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useRef, useState } from 'react';
import { getErrorMessage } from '@/services/api';
import { login, saveTokens, getGoogleLoginUrl } from '@/services/auth.service';
import { formatPhoneNumber, normalizePhoneNumber } from '@/utils/format';
import { toast } from '@/components/ui/Toast';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'phone' | 'email'>('phone');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+998');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const googleLoginUrl = getGoogleLoginUrl();

  const handlePhoneChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhoneNumber(event.target.value));
  };

  const submitEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setLoading(true);

      const response = await login({ email: email.trim().toLowerCase(), password });
      saveTokens(response.accessToken, response.refreshToken);
      window.location.href = '/profile';
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const submitPhone = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setLoading(true);

      const response = await login({
        email: normalizePhoneNumber(phone),
        password,
      });
      saveTokens(response.accessToken, response.refreshToken);
      window.location.href = '/profile';
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section-shell py-10">
      <div className="mx-auto max-w-md rounded-2xl border border-black/5 bg-white p-6 shadow-soft">
        <h1 className="font-serif text-4xl text-ink">Kirish</h1>
        <p className="mt-2 text-sm text-ink/70">
          {mode === 'phone'
            ? "Telefon raqam va parol bilan tizimga kiring."
            : 'Email va parol bilan tizimga kiring.'}
        </p>

        {mode === 'phone' ? (
          <form onSubmit={submitPhone} className="mt-8 space-y-5">
            <input
              type="text"
              inputMode="numeric"
              autoComplete="tel-national"
              pattern="[0-9+\\- ]*"
              placeholder="+998 90 123 45 67"
              value={phone}
              onChange={handlePhoneChange}
              maxLength={17}
              className="input-field font-mono tracking-wider"
              required
            />
            <div className="relative">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-ink/40">Parol</span>
                <Link
                  href="/forgot-password?mode=phone"
                  className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline"
                >
                  Parolni unutdingizmi?
                </Link>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Parol"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="input-field pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-ink/40 transition-colors hover:text-primary focus:outline-none"
                aria-label={showPassword ? 'Parolni yashirish' : "Parolni ko'rsatish"}
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
              {loading ? 'Kirish...' : 'Kirish'}
            </button>
          </form>
        ) : (
          <form onSubmit={submitEmail} className="mt-8 space-y-5">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="input-field"
              required
            />
            <div className="relative">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-ink/40">Parol</span>
                <Link
                  href="/forgot-password?mode=email"
                  className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline"
                >
                  Parolni unutdingizmi?
                </Link>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Parol"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="input-field pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-ink/40 transition-colors hover:text-primary focus:outline-none"
                aria-label={showPassword ? 'Parolni yashirish' : "Parolni ko'rsatish"}
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
              {loading ? 'Kirish...' : 'Kirish'}
            </button>
          </form>
        )}

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
          <button
            type="button"
            onClick={() => {
              setError('');
              setMode((prev) => (prev === 'phone' ? 'email' : 'phone'));
            }}
            className="btn-secondary mt-3 flex w-full items-center justify-center gap-2"
          >
            {mode === 'phone' ? (
              <>
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-current text-xs font-bold">
                  @
                </span>
                Email orqali kirish
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.18 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.72c.12.9.34 1.79.63 2.64a2 2 0 0 1-.45 2.11L8 9.73a16 16 0 0 0 6.27 6.27l1.26-1.28a2 2 0 0 1 2.11-.45c.85.29 1.74.51 2.64.63A2 2 0 0 1 22 16.92z" />
                </svg>
                Telefon orqali kirish
              </>
            )}
          </button>
        </div>



        <p className="mt-5 text-sm text-ink/70">
          Akkauntingiz yo&apos;qmi?{' '}
          <Link href="/register" className="font-semibold text-terracotta hover:underline">
            Ro&apos;yxatdan o&apos;tish
          </Link>
        </p>
      </div>
    </div>
  );
}
