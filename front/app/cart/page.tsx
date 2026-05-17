'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { formatPrice } from '@/services/api';
import { getToken } from '@/services/auth.service';
import {
  getCartItems,
  getCartTotal,
  removeFromCart,
  updateCartQuantity,
} from '@/services/cart.service';
import { getCarpetById } from '@/services/carpet.service';
import { getPricePerM2 } from '@/utils/size';
import type { CartItem } from '@/types/cart';
import type { Carpet } from '@/types/carpet';

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [latestCarpets, setLatestCarpets] = useState<Record<string, Carpet>>({});
  const [loadingStock, setLoadingStock] = useState(true);

  const refreshItems = () => setItems(getCartItems());

  const fetchLatestStock = async (cartItems: CartItem[]) => {
    try {
      setLoadingStock(true);
      const carpetPromises = cartItems.map((item) => getCarpetById(item.carpetId));
      const carpets = await Promise.all(carpetPromises);
      const carpetMap = carpets.reduce((acc, carpet) => {
        acc[carpet.id] = carpet;
        return acc;
      }, {} as Record<string, Carpet>);
      setLatestCarpets(carpetMap);
      const adjusted = cartItems.map((item) => {
        const stock = carpetMap[item.carpetId]?.stock;
        if (typeof stock === 'number' && stock > 0 && item.quantity > stock) {
          updateCartQuantity(item.carpetId, stock);
          return { ...item, quantity: stock };
        }
        return item;
      });
      setItems(adjusted);
    } catch (err) {
      console.error('Error fetching latest stock:', err);
    } finally {
      setLoadingStock(false);
    }
  };

  useEffect(() => {
    if (!getToken()) {
      setItems([]);
      setLoadingStock(false);
      return;
    }
    const cartItems = getCartItems();
    setItems(cartItems);
    if (cartItems.length > 0) {
      void fetchLatestStock(cartItems);
    } else {
      setLoadingStock(false);
    }
  }, []);

  const total = getCartTotal(items);
  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );
  const hasOutOfStock = items.some((item) => latestCarpets[item.carpetId]?.stock === 0);
  const canPlanOrder = items.length > 0 && !loadingStock && !hasOutOfStock;

  if (!getToken()) {
    return (
      <div className="section-shell py-10">
        <div className="panel p-6">
          <p className="text-sm text-ink/70">Savatdan foydalanish uchun avval tizimga kiring.</p>
          <Link href="/login" className="btn-primary mt-3 inline-block">
            Kirish
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="section-shell relative overflow-hidden py-12">
      {/* Decorative Background Elements */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-96 w-96 rounded-full bg-primary/5 blur-[100px]" />
      <div className="pointer-events-none absolute -right-20 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-blue-400/5 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-64 w-[600px] -translate-x-1/2 rounded-full bg-primary/5 blur-[80px]" />

      <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="fade-up stagger-1">
          <h1 className="font-serif text-4xl font-medium tracking-tight text-ink text-premium md:text-5xl">
            Savat
          </h1>
          <p className="mt-3 flex items-center gap-2 text-ink/60">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {itemCount}
            </span>
            <span>tanlangan mahsulotlar</span>
          </p>
        </div>
        <Link 
          href="/carpets" 
          className="btn-secondary group px-6 py-3 text-sm fade-up stagger-2"
        >
          <svg className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Xaridni davom ettirish
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="panel mt-12 flex flex-col items-center justify-center py-20 text-center fade-up stagger-3">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-sand text-primary/40">
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-ink">Savatingiz bo&apos;sh</h2>
          <p className="mt-3 max-w-sm text-ink/60">
            Hozircha savatga hech narsa qo&apos;shilmagan. Bizning gilamlar kolleksiyasini ko&apos;rib chiqing.
          </p>
          <Link href="/carpets" className="btn-primary mt-8 px-8 py-3 px-10">
            Kolleksiyani ko&apos;rish
          </Link>
        </div>
      ) : (
        <div className="mt-12 grid gap-10 lg:grid-cols-[1fr,380px]">
          <section className="space-y-6 fade-up stagger-3">
            {items.map((item) => {
              const carpet = latestCarpets[item.carpetId];
              const isOutOfStock = carpet && carpet.stock === 0;
              const pricePerM2 = item.size ? getPricePerM2(item.price, item.size) : null;
              const maxQty = carpet?.stock || 99;

              return (
                <article
                  key={item.carpetId}
                  className={`group relative overflow-hidden rounded-2xl border bg-white/50 p-5 transition-all duration-300 hover:border-primary/20 hover:bg-white hover:shadow-xl ${
                    isOutOfStock ? 'border-red-100 bg-red-50/30' : 'border-ink/5'
                  }`}
                >
                  <div className="flex gap-4 sm:gap-6">
                    {/* Image Section */}
                    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-sand group-hover:shadow-md sm:h-32 sm:w-44">
                      <img
                        src={(item.image || '/placeholder-carpet.jpg') as string}
                        alt={item.name}
                        className={`h-full w-full object-contain transition-transform duration-500 group-hover:scale-110 ${
                          isOutOfStock ? 'grayscale opacity-60' : ''
                        }`}
                      />
                      {isOutOfStock && (
                        <div className="absolute inset-0 flex items-center justify-center bg-red-900/10 backdrop-blur-[2px]">
                          <span className="rounded-full bg-red-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                            Tugagan
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Info Section */}
                    <div className="flex flex-1 flex-col justify-between py-1">
                      <div>
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <Link 
                                href={`/carpets/${item.carpetId}`}
                                className={`text-xl font-bold text-ink transition-colors hover:text-primary ${isOutOfStock ? 'text-ink/40' : ''}`}
                            >
                              {item.name}
                            </Link>
                            <div className="mt-1 flex flex-wrap gap-2 text-xs font-medium text-ink/50">
                              <span className="rounded-md bg-ink/5 px-2 py-1">{item.material || 'Material'}</span>
                              <span className="rounded-md bg-ink/5 px-2 py-1">{item.size || 'O\'lcham'}</span>
                            </div>
                          </div>
                          
                          <button
                            type="button"
                            className="rounded-full p-2 text-ink/20 transition-all hover:bg-red-50 hover:text-red-500"
                            onClick={() => {
                              removeFromCart(item.carpetId);
                              refreshItems();
                            }}
                            title="O'chirish"
                          >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>

                        <div className="mt-4 flex items-baseline gap-3">
                          <span className={`text-2xl font-black ${isOutOfStock ? 'text-ink/20 line-through' : 'text-primary'}`}>
                            {formatPrice(item.price)}
                          </span>
                          {pricePerM2 && !isOutOfStock && (
                            <span className="text-xs font-semibold text-ink/40">
                              (1 m²: {formatPrice(Math.round(pricePerM2))})
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-6 flex items-center justify-between">
                        {!isOutOfStock ? (
                          <div className="flex items-center gap-1 rounded-xl bg-ink/5 p-1">
                            <button
                              type="button"
                              className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-white hover:text-primary disabled:opacity-30"
                              disabled={item.quantity <= 1}
                              onClick={() => {
                                updateCartQuantity(item.carpetId, item.quantity - 1);
                                refreshItems();
                              }}
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
                              </svg>
                            </button>
                            <span className="w-10 text-center text-sm font-bold text-ink">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-white hover:text-primary disabled:opacity-30"
                              disabled={item.quantity >= maxQty}
                              onClick={() => {
                                updateCartQuantity(item.carpetId, item.quantity + 1);
                                refreshItems();
                              }}
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-bold text-red-700">
                             <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Zaxirada mavjud emas
                          </div>
                        )}
                        
                        <div className={`text-right ${isOutOfStock ? 'hidden' : ''}`}>
                             <p className="text-[10px] uppercase tracking-wider text-ink/40 font-bold">Jami</p>
                             <p className="text-lg font-bold text-ink">{formatPrice(item.price * item.quantity)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>

          <aside className="fade-up stagger-4 lg:sticky lg:top-24 h-fit">
            <div className="panel overflow-hidden p-8 shadow-2xl shadow-primary/5">
              <h2 className="font-serif text-3xl font-medium text-ink">Xulosa</h2>
              
              <div className="mt-8 space-y-4 border-b border-ink/5 pb-8">
                <div className="flex justify-between text-sm">
                  <span className="text-ink/60">Mahsulotlar soni:</span>
                  <span className="font-bold text-ink">{itemCount} ta</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-ink/60">Yetkazib berish:</span>
                  <span className={`font-bold ${total >= 5000000 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {total >= 5000000 ? 'Bepul' : 'Pullik'}
                  </span>
                </div>
              </div>

              {total < 5000000 && (
                <div className="mt-4 rounded-xl bg-amber-50 p-3 text-[10px] font-medium leading-relaxed text-amber-700">
                  <span className="font-bold underline">Eslatma:</span> Buyurtmangiz 5 000 000 so&apos;mdan oshsa, Toshkent shahri ichida yetkazib berish <span className="font-black italic">BEPUL</span> bo&apos;ladi.
                </div>
              )}

              <div className="mt-8">
                <p className="text-xs font-bold uppercase tracking-widest text-ink/30">To&apos;lash uchun:</p>
                <p className="mt-2 text-4xl font-black tracking-tight text-primary">
                  {formatPrice(total)}
                </p>
              </div>

              {hasOutOfStock && (
                <div className="mt-6 flex items-start gap-3 rounded-2xl bg-red-50 p-4 text-xs font-medium text-red-700">
                  <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p>Savatda tugagan mahsulotlar bor. Ularni bekor qilib keyin davom eting.</p>
                </div>
              )}

              {loadingStock && (
                <div className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-primary/5 p-4 text-xs font-bold text-primary">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Tekshirilmoqda...
                </div>
              )}

              <Link
                href="/checkout"
                className={`btn-primary mt-10 w-full py-5 text-lg ${
                  canPlanOrder ? '' : 'pointer-events-none opacity-40 grayscale'
                }`}
              >
                Buyurtmani yakunlash
                <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
              
              <p className="mt-6 text-center text-[10px] leading-relaxed text-ink/30 italic">
                * Toshkent shahri ichida yetkazib berish bepul. Viloyatlar uchun tariflar kelishiladi.
              </p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
