import type { Metadata } from 'next';
import { Suspense } from 'react';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import AuthSessionGuard from '@/components/AuthSessionGuard';
import ClientErrorBoundary from '@/components/ClientErrorBoundary';
import PageLoader from '@/components/PageLoader';
import PageTransitionWrapper from '@/components/PageTransitionWrapper';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'YEC Market',
  description: 'Toshkentdagi gilamlar uchun online katalog va buyurtma tizimi.',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Outfit:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <Suspense fallback={null}>
          <PageLoader />
        </Suspense>
        <AuthSessionGuard />
        <ClientErrorBoundary>
          <Navbar />
          <main className="min-h-[calc(100vh-180px)] overflow-x-hidden">
            <PageTransitionWrapper>{children}</PageTransitionWrapper>
          </main>
          <Footer />
        </ClientErrorBoundary>
      </body>
    </html>
  );
}
