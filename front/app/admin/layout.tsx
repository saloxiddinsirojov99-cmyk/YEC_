'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUserFromToken } from '@/services/auth.service';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const user = getUserFromToken();
    
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
      // Not an admin, redirect to profile or login
      router.replace('/profile');
      return;
    }

    setAuthorized(true);
  }, [router]);

  // Show nothing until we confirm the user is an admin
  if (!authorized) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return <>{children}</>;
}
