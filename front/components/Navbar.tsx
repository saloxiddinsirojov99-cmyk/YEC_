'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { clearToken, getToken, getUserFromToken } from '@/services/auth.service';
import { getCartItems } from '@/services/cart.service';
import { getAdminStats } from '@/services/user.service';
import {
  ClipboardList,
  Info,
  LayoutGrid,
  LogIn,
  MoonStar,
  Phone,
  Shield,
  ShoppingCart,
  User,
  UserPlus,
} from 'lucide-react';

const guestLinks = [
  { href: '/carpets', label: 'Gilamlar' },
  { href: '/joynamozlar', label: 'Joynamozlar' },
  { href: '/about', label: 'Biz haqimizda' },
  { href: '/contact', label: 'Aloqa uchun' },
  { href: '/login', label: 'Kirish' },
  { href: '/register', label: "Ro'yxatdan o'tish" },
];

const userLinks = [
  { href: '/carpets', label: 'Gilamlar' },
  { href: '/joynamozlar', label: 'Joynamozlar' },
  { href: '/cart', label: 'Savat' },
  { href: '/orders', label: 'Buyurtmalarim' },
  { href: '/profile', label: 'Profil' },
  { href: '/admin', label: 'Admin' },
  { href: '/about', label: 'Biz haqimizda' },
  { href: '/contact', label: 'Aloqa uchun' },
];

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [indicator, setIndicator] = useState({ left: 0, width: 0, visible: false });
  const navRef = useRef<HTMLDivElement | null>(null);
  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const pathname = usePathname() ?? '';
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    syncAuth();
    syncCart();
  }, []);

  const links = mounted && isLoggedIn
    ? userLinks.filter((link) => link.href !== '/admin' || isAdmin)
    : mounted ? guestLinks : [];

  const syncCart = () => {
    const items = getCartItems();
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    setCartCount(count);
  };

  const syncAuth = () => {
    const token = getToken();
    setIsLoggedIn(Boolean(token));
    if (token) {
      const user = getUserFromToken();
      const adminStatus = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';
      setIsAdmin(adminStatus);
      if (adminStatus) {
        void fetchAdminStats();
      }
    } else {
      setIsAdmin(false);
      setPendingOrdersCount(0);
    }
  };

  const fetchAdminStats = async () => {
    try {
      const stats = await getAdminStats();
      setPendingOrdersCount(stats.orders.pending || 0);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    if (mounted) {
      syncAuth();
      syncCart();
    }
  }, [pathname, mounted]);

  // Periodic admin stats sync
  useEffect(() => {
    if (!isAdmin) return;
    const timer = setInterval(() => {
      void fetchAdminStats();
    }, 30000); // 30s
    return () => clearInterval(timer);
  }, [isAdmin]);


  useEffect(() => {
    const handleAuthChange = () => syncAuth();
    window.addEventListener('yec-auth-changed', handleAuthChange);
    return () => window.removeEventListener('yec-auth-changed', handleAuthChange);
  }, []);

  useEffect(() => {
    const handleCartChange = () => syncCart();
    const handleStorage = () => syncCart();
    window.addEventListener('yec-cart-changed', handleCartChange);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('yec-cart-changed', handleCartChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const getActiveHref = () => {
    const active = links.find((link) =>
      pathname === link.href || pathname.startsWith(`${link.href}/`),
    );
    return active?.href ?? '';
  };

  useEffect(() => {
    const updateIndicator = () => {
      const activeHref = getActiveHref();
      const activeEl = activeHref ? linkRefs.current[activeHref] : null;
      const navEl = navRef.current;
      if (!activeEl || !navEl) {
        setIndicator((prev) => ({ ...prev, visible: false }));
        return;
      }
      const navRect = navEl.getBoundingClientRect();
      const linkRect = activeEl.getBoundingClientRect();
      const left = linkRect.left - navRect.left + navEl.scrollLeft;
      const width = linkRect.width;
      setIndicator({ left, width, visible: true });
    };

    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [pathname, links.length]);

  const getLinkIcon = (href: string) => {
    switch (href) {
      case '/carpets':
        return LayoutGrid;
      case '/joynamozlar':
        return MoonStar;
      case '/cart':
        return ShoppingCart;
      case '/orders':
        return ClipboardList;
      case '/profile':
        return User;
      case '/admin':
        return Shield;
      case '/about':
        return Info;
      case '/contact':
        return Phone;
      case '/login':
        return LogIn;
      case '/register':
        return UserPlus;
      default:
        return LayoutGrid;
    }
  };

  return (
    <header className="glass-nav sticky top-0 z-40">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-8">
        <a href="/" className="group flex items-center gap-3">
          <div className="relative">
            <div className="absolute -inset-1 rounded-full bg-primary/20 blur opacity-0 transition group-hover:opacity-100" />
            <div className="relative inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-white ring-4 ring-primary shadow-[0_0_40px_rgba(0,180,255,0.3)] transition duration-500 hover:scale-110">
              <img src="/logo.png" alt="YEC Logo" className="h-full w-full object-contain logo-sticker" />
            </div>
          </div>
          <div className="hidden flex-col leading-none sm:flex">
            <p className="font-serif text-2xl font-black tracking-tight text-ink">YEC Market</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary/80">Premium gilamlar</p>
          </div>
        </a>

        <nav className="nav-scroll-smooth flex min-w-0 items-center justify-end gap-2.5 overflow-x-auto px-1 pb-1 md:hidden">
          {links.map((link) => {
            const Icon = getLinkIcon(link.href);
            const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);

            return (
              <Link
                key={link.href}
                href={link.href}
                title={link.label}
                aria-label={link.label}
                className={`relative inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border text-ink transition-all active:scale-95 ${
                  isActive
                    ? 'border-primary/30 bg-primary/10 text-primary'
                    : 'border-ink/10 bg-white/80 hover:bg-white'
                }`}
              >
                <Icon className="h-5 w-5" />
                {link.href === '/cart' && cartCount > 0 ? (
                  <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white shadow ring-2 ring-white">
                    {cartCount}
                  </span>
                ) : null}
                {link.href === '/admin' && pendingOrdersCount > 0 ? (
                  <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white shadow ring-2 ring-white">
                    {pendingOrdersCount}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <nav
          ref={navRef}
          className="relative hidden min-w-0 flex-1 items-center justify-end gap-8 overflow-x-auto pb-3 pr-1 scrollbar-premium md:flex"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              ref={(el) => {
                linkRefs.current[link.href] = el;
              }}
              className="group relative text-sm font-bold tracking-tight text-ink/80 transition-all hover:text-primary"
            >
              <span className="relative inline-flex items-center">
                {link.label}
                {link.href === '/cart' && cartCount > 0 ? (
                  <span className="absolute -top-2 -right-3 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white shadow ring-2 ring-white">
                    {cartCount}
                  </span>
                ) : null}
                {link.href === '/admin' && pendingOrdersCount > 0 ? (
                  <span className="absolute -top-2 -right-3 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white shadow ring-2 ring-white">
                    {pendingOrdersCount}
                  </span>
                ) : null}
              </span>
            </Link>
          ))}
          <span
            className="pointer-events-none absolute bottom-0 h-[3px] rounded-full transition-all duration-600 ease-premium-in-out"
            style={{
              left: indicator.left,
              width: indicator.width,
              opacity: indicator.visible ? 1 : 0,
              background: 'linear-gradient(90deg, transparent, hsl(var(--primary)), transparent)',
              boxShadow: '0 0 25px hsl(var(--primary))',
            }}
          />
        </nav>
      </div>
    </header>
  );
}
