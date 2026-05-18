'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  LogOut,
  MoonStar,
  Phone,
  Shield,
  ShoppingCart,
  User,
  UserPlus,
  Menu,
  X,
} from 'lucide-react';

const guestLinks = [
  { href: '/', label: 'Bosh sahifa' },
  { href: '/carpets', label: 'Qidiruv' },
  { href: '/joynamozlar', label: 'Joynamozlar' },
  { href: '/about', label: 'Biz haqimizda' },
  { href: '/contact', label: 'Aloqa uchun' },
  { href: '/login', label: 'Kirish' },
  { href: '/register', label: "Ro'yxatdan o'tish" },
];

const userLinks = [
  { href: '/', label: 'Bosh sahifa' },
  { href: '/carpets', label: 'Qidiruv' },
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [indicator, setIndicator] = useState({ left: 0, width: 0, visible: false });
  const navRef = useRef<HTMLDivElement | null>(null);
  const mobileNavRef = useRef<HTMLDivElement | null>(null);
  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [mobileCanScrollLeft, setMobileCanScrollLeft] = useState(false);
  const [mobileCanScrollRight, setMobileCanScrollRight] = useState(false);

  const handleLogout = () => {
    clearToken();
    setIsMenuOpen(false);
    // Notify custom cart storage to sync
    window.dispatchEvent(new Event('yec-cart-changed'));
    router.push('/login');
  };

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
      setIsMenuOpen(false);
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
    let rafId: number;
    let timeoutId: NodeJS.Timeout;

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
      if (linkRect.width === 0) {
        setIndicator((prev) => ({ ...prev, visible: false }));
        return;
      }
      const left = linkRect.left - navRect.left + navEl.scrollLeft;
      const width = linkRect.width;
      setIndicator({ left, width, visible: true });
    };

    // Run after paint to guarantee links exist and fonts are loaded
    const scheduleUpdate = () => {
      timeoutId = setTimeout(() => {
        rafId = requestAnimationFrame(updateIndicator);
      }, 100);
    };

    scheduleUpdate();
    window.addEventListener('resize', updateIndicator);

    // Snap again once Google Fonts have fully loaded and layout shift is complete
    if (typeof document !== 'undefined' && 'fonts' in document) {
      document.fonts.ready.then(updateIndicator).catch(() => {});
    }

    return () => {
      clearTimeout(timeoutId);
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', updateIndicator);
    };
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
    <header className="glass-nav sticky top-0 z-50 w-full">
      <div className="section-shell flex items-center gap-4 py-3 md:py-4">
        {/* Brand Logo (Left Side - ml-0 on mobile to prevent cut-off, negative margins only on xl/2xl) */}
        <Link href="/" className="group ml-0 xl:-ml-16 2xl:-ml-28 flex shrink-0 items-center gap-2.5 sm:gap-3">
          <div className="relative">
            <div className="absolute -inset-1 rounded-full bg-primary/20 blur opacity-0 transition group-hover:opacity-100" />
            <div className="relative inline-flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center overflow-hidden rounded-full bg-white ring-3 sm:ring-4 ring-primary shadow-[0_0_40px_rgba(0,180,255,0.3)] transition duration-500 hover:scale-110">
              <img src="/logo.png" alt="YEC Logo" className="h-full w-full object-contain logo-sticker" />
            </div>
          </div>
          <div className="flex flex-col leading-none">
            <p className="font-serif text-base sm:text-xl md:text-2xl font-black tracking-tight text-ink">YEC Market</p>
            <p className="text-[8px] sm:text-[10px] font-bold uppercase tracking-[0.25em] text-primary/80">Premium gilamlar</p>
          </div>
        </Link>

        {/* Mobile controls group (Right Side) */}
        <div className="flex items-center gap-2.5 ml-auto xl:hidden animate-in fade-in duration-300">
          {/* Quick Cart Shortcut */}
          {links.find((l) => l.href === '/cart') && (
            <Link
              href="/cart"
              className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-ink/10 bg-white/80 text-ink shadow-sm transition-all active:scale-95"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 z-20 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white shadow ring-2 ring-white">
                  {cartCount}
                </span>
              )}
            </Link>
          )}

          {/* Quick Logout Button for mobile */}
          {isLoggedIn && (
            <button
              onClick={handleLogout}
              className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-red-500/10 bg-red-50/80 text-red-600 shadow-sm transition-all active:scale-95 hover:bg-red-50"
              title="Chiqish"
              aria-label="Chiqish"
            >
              <LogOut className="h-5 w-5" />
            </button>
          )}

          {/* Hamburger Menu Button - Right Side */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-ink/10 bg-white/80 text-ink shadow-sm transition-all active:scale-95"
            aria-label="Menyuni ochish"
          >
            {isMenuOpen ? (
              <X className="h-5 w-5 animate-in spin-in-90 duration-300" />
            ) : (
              <Menu className="h-5 w-5 animate-in fade-in duration-300" />
            )}
          </button>
        </div>



        {/* Desktop nav */}
        <nav
          ref={navRef}
          className="relative hidden min-w-0 flex-1 items-center justify-center gap-3 xl:gap-5 overflow-visible pt-1 pb-3 pr-1 xl:flex"
        >
          {links.map((link) => {
            const isFavorites = link.href === '/sevimlilar';
            const isStaticLink = link.href === '/about' || link.href === '/contact';
            const isActive = getActiveHref() === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                ref={(el) => {
                  linkRefs.current[link.href] = el;
                }}
                className={`group relative text-xs xl:text-sm font-bold tracking-tight transition-all duration-300 whitespace-nowrap ${
                  isActive ? 'text-primary' : 'text-ink/80 hover:text-primary'
                } ${
                  isStaticLink ? 'hidden 2xl:inline-flex' : 'inline-flex'
                }`}
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

        {/* Desktop Logout Button - Positioned outside of nav for perfect far-right alignment on a single row */}
        {isLoggedIn && (
          <button
            onClick={handleLogout}
            className="ml-6 xl:ml-10 group relative hidden h-10 shrink-0 items-center gap-1.5 rounded-xl border border-red-500/10 bg-red-50/50 px-4 text-xs font-bold uppercase tracking-wider text-red-600 transition-all hover:bg-red-50 active:scale-95 xl:flex"
            title="Chiqish"
          >
            <LogOut className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            <span>Chiqish</span>
          </button>
        )}
      </div>

      {/* Mobile Menu Dropdown Overlay (Direct child of header, perfectly positioned at absolute top-full) */}
      {isMenuOpen && (
        <div className="absolute top-full left-0 right-0 z-[999] h-[calc(100vh-100%)] bg-gradient-to-b from-white/95 to-slate-50/98 backdrop-blur-lg animate-in fade-in slide-in-from-top-5 duration-300 xl:hidden overflow-y-auto border-t border-ink/5 shadow-2xl">
          <div className="section-shell py-6 flex flex-col gap-3">
            {links.map((link) => {
              const Icon = getLinkIcon(link.href);
              const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
              const isFavorites = link.href === '/sevimlilar';

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center gap-4 px-5 py-4 rounded-2xl border font-bold text-base transition-all active:scale-[0.98] ${
                    isActive
                      ? 'border-primary/30 bg-primary/10 text-primary shadow-sm shadow-primary/5'
                      : 'border-ink/5 bg-white/50 hover:bg-white text-ink/80 hover:text-ink'
                  }`}
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 ${isActive ? 'bg-primary/20 text-primary' : 'text-ink/60'}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="flex-1">{link.label}</span>
                  
                  {/* Badge support inside mobile drawer */}
                  {link.href === '/cart' && cartCount > 0 ? (
                    <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-red-600 px-1.5 text-xs font-black text-white shadow">
                      {cartCount}
                    </span>
                  ) : null}
                  {link.href === '/admin' && ordersAlertCount > 0 ? (
                    <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-red-600 px-1.5 text-xs font-black text-white shadow">
                      {ordersAlertCount}
                    </span>
                  ) : null}
                </Link>
              );
            })}

            {/* Mobile Drawer Logout Button */}
            {isLoggedIn && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-4 px-5 py-4 rounded-2xl border border-red-500/10 bg-red-50/50 text-red-600 font-bold text-base transition-all active:scale-[0.98] mt-2"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
                  <LogOut className="h-5 w-5" />
                </div>
                <span className="flex-1 text-left">Tizimdan chiqish</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
