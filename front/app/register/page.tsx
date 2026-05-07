'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getErrorMessage } from '@/services/api';
import {
  getGoogleLoginUrl,
  requestPhoneOtp,
  requestRegisterOtp,
  saveTokens,
  verifyPhoneOtp,
  verifyRegisterOtp,
} from '@/services/auth.service';
import { formatPhoneNumber, normalizePhoneNumber } from '@/utils/format';

type EmailStep = 'register' | 'verify' | 'done';
type SmsStep = 'request' | 'verify';
type AuthMode = 'sms' | 'email';

export default function RegisterPage() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<AuthMode>('sms');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('+998');

  const [emailStep, setEmailStep] = useState<EmailStep>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');
  const [emailDevOtpCode, setEmailDevOtpCode] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailResending, setEmailResending] = useState(false);

  const [smsStep, setSmsStep] = useState<SmsStep>('request');
  const [smsOtp, setSmsOtp] = useState('');
  const [smsPassword, setSmsPassword] = useState('');
  const [showSmsPassword, setShowSmsPassword] = useState(false);
  const [smsDevOtpCode, setSmsDevOtpCode] = useState('');
  const [smsMessage, setSmsMessage] = useState('');
  const [smsLoading, setSmsLoading] = useState(false);
  const [smsResending, setSmsResending] = useState(false);

  const [error, setError] = useState('');
  const googleLoginUrl = getGoogleLoginUrl();

  const handlePhoneChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhoneNumber(event.target.value));
  };

  const requestEmailOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setEmailLoading(true);
      setError('');
      setEmailMessage('');
      const response = await requestRegisterOtp({
        firstName,
        lastName,
        email,
        phone: normalizePhoneNumber(phone),
        password,
      });
      setEmailDevOtpCode(response.devOtpCode ?? '');
      setEmailMessage(response.message);
      setEmailStep('verify');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setEmailLoading(false);
    }
  };

  const verifyEmailRegistration = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setEmailLoading(true);
      setError('');
      setEmailMessage('');
      const response = await verifyRegisterOtp({ email, otp: emailOtp });
      setEmailMessage(response.message);
      setEmailStep('done');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setEmailLoading(false);
    }
  };

  const resendEmailOtp = async () => {
    if (!email) {
      setError('Email manzili kiritilmagan.');
      return;
    }
    try {
      setEmailResending(true);
      setError('');
      setEmailMessage('');
      const response = await requestRegisterOtp({
        firstName,
        lastName,
        email,
        phone: normalizePhoneNumber(phone),
        password,
      });
      setEmailDevOtpCode(response.devOtpCode ?? '');
      setEmailMessage(response.message || "Tasdiqlash kodi qayta yuborildi.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setEmailResending(false);
    }
  };

  const requestSmsOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setSmsLoading(true);
      setError('');
      setSmsMessage('');
      const response = await requestPhoneOtp({
        phone: normalizePhoneNumber(phone),
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
      });
      setSmsDevOtpCode(response.devOtpCode ?? '');
      setSmsMessage(response.message);
      setSmsStep('verify');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSmsLoading(false);
    }
  };

  const verifySmsRegistration = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setSmsLoading(true);
      setError('');
      const response = await verifyPhoneOtp({
        phone: normalizePhoneNumber(phone),
        otp: smsOtp,
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        password: smsPassword,
      });
      saveTokens(response.accessToken, response.refreshToken);
      router.push('/profile');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSmsLoading(false);
    }
  };

  const resendSmsOtp = async () => {
    try {
      setSmsResending(true);
      setError('');
      setSmsMessage('');
      const response = await requestPhoneOtp({
        phone: normalizePhoneNumber(phone),
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
      });
      setSmsDevOtpCode(response.devOtpCode ?? '');
      setSmsMessage(response.message || 'Tasdiqlash kodi qayta yuborildi.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSmsResending(false);
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
            SMS yoki email orqali ro&apos;yxatdan o&apos;ting. Telefon raqami default +998 bilan boshlanadi.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl border border-sky-100 bg-sky-50/60 p-2">
            <button
              type="button"
              onClick={() => {
                setAuthMode('sms');
                setError('');
              }}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                authMode === 'sms'
                  ? 'bg-white text-sky-700 shadow-sm'
                  : 'text-ink/60 hover:bg-white/60'
              }`}
            >
              SMS orqali
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('email');
                setError('');
              }}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                authMode === 'email'
                  ? 'bg-white text-sky-700 shadow-sm'
                  : 'text-ink/60 hover:bg-white/60'
              }`}
            >
              Email orqali
            </button>
          </div>

          {authMode === 'sms' ? (
            <div className="mt-8 space-y-4">
              {smsStep === 'request' ? (
                <form onSubmit={requestSmsOtp} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <input
                      type="text"
                      placeholder="Ism"
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                      className="input-field"
                    />
                    <input
                      type="text"
                      placeholder="Familiya"
                      value={lastName}
                      onChange={(event) => setLastName(event.target.value)}
                      className="input-field"
                    />
                  </div>
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
                  <button type="submit" disabled={smsLoading} className="btn-primary w-full">
                    {smsLoading ? 'Yuborilmoqda...' : "SMS kodini yuborish"}
                  </button>
                </form>
              ) : (
                <form onSubmit={verifySmsRegistration} className="space-y-4">
                  <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    {smsMessage || 'Tasdiqlash kodi telefon raqamingizga yuborildi.'}
                  </p>
                  {smsDevOtpCode ? (
                    <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      Test kodi: <strong>{smsDevOtpCode}</strong>
                    </p>
                  ) : null}
                  <input
                    type="text"
                    placeholder="6 xonali SMS kodi"
                    value={smsOtp}
                    onChange={(event) => setSmsOtp(event.target.value)}
                    className="input-field"
                    required
                  />
                  <div className="relative">
                    <input
                      type={showSmsPassword ? 'text' : 'password'}
                      placeholder="Parol o'rnating (kamida 6 ta belgi)"
                      value={smsPassword}
                      onChange={(event) => setSmsPassword(event.target.value)}
                      className="input-field pr-12"
                      minLength={6}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowSmsPassword((prev) => !prev)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-ink/40 transition-colors hover:text-primary focus:outline-none"
                      aria-label={showSmsPassword ? 'Parolni yashirish' : "Parolni ko'rsatish"}
                    >
                      {showSmsPassword ? 'Yashir' : "Ko'rsat"}
                    </button>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={resendSmsOtp}
                      disabled={smsResending}
                      className="btn-secondary w-full sm:w-auto"
                    >
                      {smsResending ? 'Yuborilmoqda...' : 'Kodni qayta yuborish'}
                    </button>
                    <button type="submit" disabled={smsLoading} className="btn-primary w-full">
                      {smsLoading
                        ? 'Tekshirilmoqda...'
                        : "Tasdiqlash, parol o'rnatish va kirish"}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSmsStep('request');
                      setSmsOtp('');
                      setSmsPassword('');
                      setSmsMessage('');
                      setSmsDevOtpCode('');
                    }}
                    className="w-full text-xs font-bold uppercase tracking-widest text-sky-700 hover:underline"
                  >
                    Raqamni o&apos;zgartirish
                  </button>
                </form>
              )}
            </div>
          ) : null}

          {authMode === 'email' ? (
            <>
              {emailStep === 'register' ? (
                <>
                  <form onSubmit={requestEmailOtp} className="mt-8 space-y-5">
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
                        aria-label={showPassword ? 'Parolni yashirish' : "Parolni ko'rsatish"}
                      >
                        {showPassword ? 'Yashir' : "Ko'rsat"}
                      </button>
                    </div>
                    <button type="submit" disabled={emailLoading} className="btn-primary mt-4 w-full">
                      {emailLoading ? 'Yuborilmoqda...' : "Tasdiqlash kodini so'rash"}
                    </button>
                  </form>
                </>
              ) : null}

              {emailStep === 'verify' ? (
                <form onSubmit={verifyEmailRegistration} className="mt-6 space-y-4">
                  <p className="rounded-xl border border-olive/20 bg-olive/5 px-4 py-3 text-sm text-olive">
                    {emailMessage || 'Tasdiqlash kodi emailingizga yuborildi.'}
                  </p>
                  {emailDevOtpCode ? (
                    <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      Test tasdiqlash kodi: <strong>{emailDevOtpCode}</strong>
                    </p>
                  ) : null}
                  <input
                    type="text"
                    placeholder="6 xonali tasdiqlash kodi"
                    value={emailOtp}
                    onChange={(event) => setEmailOtp(event.target.value)}
                    className="input-field"
                    required
                  />
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={resendEmailOtp}
                      disabled={emailResending}
                      className="btn-secondary w-full sm:w-auto"
                    >
                      {emailResending ? 'Yuborilmoqda...' : 'Kodni qayta yuborish'}
                    </button>
                    <button type="submit" disabled={emailLoading} className="btn-primary w-full">
                      {emailLoading ? 'Tekshirilmoqda...' : 'Tasdiqlash'}
                    </button>
                  </div>
                </form>
              ) : null}

              {emailStep === 'done' ? (
                <div className="mt-6 space-y-4">
                  <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                    {emailMessage || "Ro'yxatdan o'tish yakunlandi."}
                  </p>
                  <Link href="/login" className="btn-primary inline-block">
                    Login sahifasiga o&apos;tish
                  </Link>
                </div>
              ) : null}
            </>
          ) : null}

          <div className="mt-8">
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

          {error ? (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <p className="mt-6 text-center text-sm text-ink/70">
            Akkauntingiz bormi?{' '}
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="font-bold text-primary hover:underline"
            >
              Kirish
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
