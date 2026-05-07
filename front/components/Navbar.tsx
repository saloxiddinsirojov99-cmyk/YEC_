'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { clearToken, getToken, getUserFromToken } from '@/services/auth.service';
import { getCartItems } from '@/services/cart.service';
import { getAdminStats } from '@/services/user.service';
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Home,
  Heart,
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
  { href: '/', label: 'Bosh sahifa' },
  { href: '/carpets', label: 'Gilamlar' },
  { href: '/joynamozlar', label: 'Joynamozlar' },
  { href: '/sevimlilar', label: 'Sevimlilar' },
  { href: '/about', label: 'Biz haqimizda' },
  { href: '/contact', label: 'Aloqa uchun' },
  { href: '/login', label: 'Kirish' },
  { href: '/register', label: "Ro'yxatdan o'tish" },
];

const userLinks = [
  { href: '/', label: 'Bosh sahifa' },
  { href: '/carpets', label: 'Gilamlar' },
  { href: '/joynamozlar', label: 'Joynamozlar' },
  { href: '/sevimlilar', label: 'Sevimlilar' },
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
  const [ordersAlertCount, setOrdersAlertCount] = useState(0);
  const [indicator, setIndicator] = useState({ left: 0, width: 0, visible: false });
  const navRef = useRef<HTMLDivElement | null>(null);
  const mobileNavRef = useRef<HTMLDivElement | null>(null);
  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const pathname = usePathname() ?? '';
  const [mounted, setMounted] = useState(false);
  const [mobileCanScrollLeft, setMobileCanScrollLeft] = useState(false);
  const [mobileCanScrollRight, setMobileCanScrollRight] = useState(false);

  useEffect(() => {
    setMounted(true);
    syncAuth();
    syncCart();
  }, []);

  const links = isLoggedIn
    ? userLinks.filter((link) => link.href !== '/admin' || isAdmin)
    : guestLinks;

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
      setOrdersAlertCount(0);
    }
  };

  const fetchAdminStats = async () => {
    try {
      const stats = await getAdminStats();
      const pendingCount = Number(stats?.orders?.pending ?? 0);
      const acceptedCount = Number(stats?.orders?.accepted ?? 0);
      const onWayCount = Number(stats?.orders?.onWay ?? 0);
      setOrdersAlertCount(pendingCount + acceptedCount + onWayCount);
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

  const updateMobileScrollState = () => {
    const navEl = mobileNavRef.current;
    if (!navEl) return;

    const maxScrollLeft = Math.max(0, navEl.scrollWidth - navEl.clientWidth);
    const nextCanScrollLeft = navEl.scrollLeft > 4;
    const nextCanScrollRight = navEl.scrollLeft < maxScrollLeft - 4;

    setMobileCanScrollLeft((prev) =>
      prev === nextCanScrollLeft ? prev : nextCanScrollLeft,
    );
    setMobileCanScrollRight((prev) =>
      prev === nextCanScrollRight ? prev : nextCanScrollRight,
    );
  };

  const scrollMobileToEdge = (direction: 'left' | 'right') => {
    const navEl = mobileNavRef.current;
    if (!navEl) return;

    const targetLeft = direction === 'right' ? navEl.scrollWidth : 0;
    navEl.scrollTo({ left: targetLeft, behavior: 'smooth' });
  };

  useEffect(() => {
    const navEl = mobileNavRef.current;
    if (!navEl) return;

    const raf = window.requestAnimationFrame(updateMobileScrollState);
    const delayed = window.setTimeout(updateMobileScrollState, 120);
    const onScroll = () => updateMobileScrollState();
    const onResize = () => updateMobileScrollState();
    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => updateMobileScrollState())
        : null;

    navEl.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    resizeObserver?.observe(navEl);

    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(delayed);
      navEl.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      resizeObserver?.disconnect();
    };
  }, [links.length, pathname, mounted, cartCount, ordersAlertCount]);

  const getLinkIcon = (href: string) => {
    switch (href) {
      case '/':
        return Home;
      case '/carpets':
        return LayoutGrid;
      case '/joynamozlar':
        return MoonStar;
      case '/sevimlilar':
        return Heart;
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
    <header className="glass-nav fixed top-0 left-0 right-0 z-50">
      <div className="section-shell flex items-center gap-4 py-3 md:py-4">
        <a href="/" className="group -ml-1 flex items-center gap-3 sm:-ml-2 md:-ml-3">
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

        {/* Mobile nav */}
        <div className="relative min-w-0 flex-1 md:hidden">
          <nav
            ref={mobileNavRef}
            className="flex w-full min-w-0 items-center justify-end gap-2.5 overflow-x-auto overflow-y-visible px-1 pt-1 pb-1 scrollbar-hide"
          >
            {links.map((link) => {
              const Icon = getLinkIcon(link.href);
              const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
              const isFavorites = link.href === '/sevimlilar';

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
                  } ${isFavorites ? 'fav-nav-pill' : ''}`}
                >
                  <Icon className="h-5 w-5" />
                  {link.href === '/cart' && cartCount > 0 ? (
                    <span className="absolute right-0 top-0 z-20 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white shadow ring-2 ring-white">
                      {cartCount}
                    </span>
                  ) : null}
                  {link.href === '/admin' && ordersAlertCount > 0 ? (
                    <span className="absolute right-0 top-0 z-20 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white shadow ring-2 ring-white">
                      {ordersAlertCount}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>

        </div>

        {/* Desktop nav */}
        <nav
          ref={navRef}
          className="relative hidden min-w-0 flex-1 items-center justify-end gap-8 overflow-x-auto overflow-y-visible pt-1 pb-3 pr-1 scrollbar-premium md:flex"
        >
          {links.map((link) => {
            const isFavorites = link.href === '/sevimlilar';
            return (
              <Link
                key={link.href}
                href={link.href}
                ref={(el) => {
                  linkRefs.current[link.href] = el;
                }}
                className="group relative text-sm font-bold tracking-tight text-ink/80 transition-all hover:text-primary"
              >
                <span className="relative inline-flex items-center gap-1.5">
                  {isFavorites ? (
                    <Heart className="h-3.5 w-3.5 text-rose-500/90" />
                  ) : null}
                  {link.label}
                  {link.href === '/cart' && cartCount > 0 ? (
                    <span className="absolute -right-3 top-0.5 z-20 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white shadow ring-2 ring-white">
                      {cartCount}
                    </span>
                  ) : null}
                  {link.href === '/admin' && ordersAlertCount > 0 ? (
                    <span className="absolute -right-3 top-0.5 z-20 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white shadow ring-2 ring-white">
                      {ordersAlertCount}
                    </span>
                  ) : null}
                </span>
              </Link>
            );
          })}
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
