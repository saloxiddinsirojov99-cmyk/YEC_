'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { formatPrice, getErrorMessage } from '@/services/api';
import { formatOrderNumber, formatOrderStatus } from '@/utils/format';
import { getToken } from '@/services/auth.service';
import { getMyOrders, cancelOrder } from '@/services/order.service';
import type { Order } from '@/types/order';

function OrdersPageContent() {
  const [mounted, setMounted] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => setMounted(true), []);

  const hasToken = useMemo(() => (mounted ? Boolean(getToken()) : false), [mounted]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const orderRes = await getMyOrders({ page: 1, limit: 20 });
      setOrders(orderRes.items);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasToken) {
      setLoading(false);
      return;
    }
    void fetchData();
  }, [hasToken]);

  if (!hasToken) {
    return (
      <div className="section-shell py-10">
        <div className="panel max-w-xl p-6">
          <h1 className="font-serif text-3xl">Buyurtmalar</h1>
          <p className="mt-2 text-sm text-ink/70">Buyurtma berish uchun avval login qiling.</p>
          <Link href="/login" className="btn-primary mt-4 inline-block">
            Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="section-shell space-y-6 py-8">
      <h1 className="font-serif text-4xl text-ink">Buyurtmalar</h1>

      <section className="panel p-6">
        <h2 className="font-serif text-3xl">Mening buyurtmalarim</h2>
        {loading ? (
          <div className="mt-4 h-36 animate-pulse rounded-xl bg-sand" />
        ) : orders.length === 0 ? (
          <p className="mt-3 text-sm text-ink/70">Buyurtmalar hali mavjud emas.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {orders.map((order) => {
              const total = order.items.reduce(
                (sum, item) => sum + Number(item.price) * item.quantity,
                0,
              );

              const statusColor: Record<string, string> = {
                PENDING: 'bg-yellow-100 text-yellow-800',
                ACCEPTED: 'bg-blue-100 text-blue-800',
                ON_WAY: 'bg-purple-100 text-purple-800',
                DELIVERED: 'bg-green-100 text-green-800',
                CANCELLED: 'bg-red-100 text-red-800',
              };

              return (
                <article key={order.id} className="rounded-xl border border-black/10 p-4 relative overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm text-ink/70">
                      {mounted ? new Date(order.createdAt).toLocaleString('uz-UZ') : ''}
                    </p>
                    <p className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor[order.status] || 'bg-gray-100 text-gray-800'}`}>
                      {formatOrderStatus(order.status)}
                    </p>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between border-b border-black/5 pb-3 gap-3">
                    <span className="text-sm font-semibold text-ink">
                      #{formatOrderNumber(order.id, order.createdAt)}
                    </span>
                    <div className="flex gap-2">
                       {order.status === 'PENDING' && (
                        <button
                          onClick={() => setOrderToCancel(order.id)}
                          className="flex h-8 items-center justify-center rounded-md bg-red-50 px-4 text-xs font-medium text-red-600 shadow-sm transition-colors hover:bg-red-100"
                        >
                          Bekor qilish
                        </button>
                      )}
                      <Link href={`/orders/${order.id}`} className="flex h-8 items-center justify-center rounded-md bg-blue-900 px-4 text-xs font-medium text-white shadow-sm transition-colors hover:bg-blue-800">
                        Ko'rish
                      </Link>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-ink/80">
                    <strong>Manzil:</strong> {order.address}
                  </p>
                  {order.locationText && (
                    <p className="text-xs text-ink/60">Lokatsiya: {order.locationText}</p>
                  )}
                  {order.paymentMethod && (
                    <p className="text-xs text-ink/60">
                      To&apos;lov: {order.paymentMethod === 'CARD' ? 'Karta' : 'Naqd'}
                    </p>
                  )}
                  {order.status === 'CANCELLED' && order.cancelReason && (
                    <p className="mt-2 rounded-lg bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                      Sabab: {order.cancelReason}
                    </p>
                  )}
                  <div className="mt-3 space-y-2 text-sm border-t border-black/5 pt-3">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between">
                        <span className="text-ink/70">
                          {item.carpet?.name || item.carpetId} <span className="text-[10px] bg-sand px-1.5 py-0.5 rounded ml-1">x{item.quantity}</span>
                        </span>
                        <span className="font-medium">{formatPrice(Number(item.price) * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-right text-sm font-bold text-ink">
                    Jami: <span className="text-terracotta text-lg ml-1">{formatPrice(total)}</span>
                  </p>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {message ? (
        <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 animate-in fade-in slide-in-from-top-2">{message}</p>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 animate-in fade-in slide-in-from-top-2">{error}</p>
      ) : null}

      {/* Cancellation Modal */}
      {orderToCancel && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="w-full max-w-sm overflow-hidden rounded-[3rem] bg-white border border-white/60 shadow-[0_45px_110px_rgba(0,0,0,0.35)] animate-in zoom-in-95 duration-300">
              <div className="h-2 w-full bg-red-500" />
              <div className="p-8 text-center">
                 <div className="mx-auto w-16 h-16 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mb-6">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                 </div>
                 <h4 className="font-serif text-2xl text-ink">Bekor qilish</h4>
                 <p className="mt-3 text-ink/60 leading-relaxed text-sm">
                    Haqiqatan ham ushbu buyurtmani bekor qilmoqchimisiz? Bu amalni ortga qaytarib bo&apos;lmaydi.
                 </p>
                 
                 <div className="mt-8 flex flex-col gap-2">
                    <button 
                      onClick={async () => {
                        try {
                          setLoading(true);
                          await cancelOrder(orderToCancel);
                          setOrderToCancel(null);
                          setMessage('Buyurtma muvaffaqiyatli bekor qilindi.');
                          void fetchData();
                        } catch (err) {
                          setError(getErrorMessage(err));
                        } finally {
                          setLoading(false);
                        }
                      }}
                      className="w-full py-4 rounded-2xl bg-red-600 text-white font-bold transition hover:bg-red-700 active:scale-95"
                    >
                      Ha, bekor qilish
                    </button>
                    <button 
                      onClick={() => setOrderToCancel(null)}
                      className="w-full py-4 rounded-2xl bg-slate-100 text-slate-600 font-bold transition hover:bg-slate-200"
                    >
                      Yo&apos;q, qolsin
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return <OrdersPageContent />;
}
