'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { saveTokens } from '@/services/auth.service';

function GoogleCallback() {
  const router = useRouter();
  const params = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const searchParams =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search)
        : params;
    const accessToken = searchParams?.get?.('accessToken');
    const refreshToken = searchParams?.get?.('refreshToken');
    const oauthError =
      searchParams?.get?.('oauthError') ??
      searchParams?.get?.('error_description') ??
      searchParams?.get?.('error');
    let decodedError = '';
    if (oauthError) {
      try {
        decodedError = decodeURIComponent(oauthError);
      } catch {
        decodedError = oauthError;
      }
    }

    if (accessToken) {
      saveTokens(accessToken, refreshToken ?? undefined);
      router.replace('/profile');
      return;
    }

    setStatus('error');
    setErrorMessage(
      decodedError || "Google login ma'lumotlari topilmadi.",
    );
    const timer = setTimeout(() => {
      router.replace('/login');
    }, 1500);

    return () => clearTimeout(timer);
  }, [params, router]);

  return (
    <div className="section-shell py-16">
      <div className="mx-auto max-w-md rounded-2xl border border-black/5 bg-white p-6 text-center shadow-soft">
        {status === 'loading' ? (
          <p className="text-sm text-ink/70">Google orqali kirilmoqda...</p>
        ) : (
          <p className="text-sm text-ink/70">
            {errorMessage || "Google login ma'lumotlari topilmadi."} Login sahifasiga
            yo&apos;naltirilmoqda...
          </p>
        )}
      </div>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={
      <div className="section-shell py-16">
        <div className="mx-auto max-w-md rounded-2xl border border-black/5 bg-white p-6 text-center shadow-soft">
          <p className="text-sm text-ink/70">Yuklanmoqda...</p>
        </div>
      </div>
    }>
      <GoogleCallback />
    </Suspense>
  );
}
