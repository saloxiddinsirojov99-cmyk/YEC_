'use client';

import { useEffect, useState } from 'react';
import { api, formatPrice, getErrorMessage } from '@/services/api';
import { formatOrderNumber, formatOrderStatus } from '@/utils/format';
import type { OrderStatus } from '@/types/order';
import OrderStatusModal from '@/components/admin/OrderStatusModal';

type OrderItem = {
  id: string;
  quantity: number;
  price: number;
  carpet: {
    name: string;
    size: string;
    material: string;
  };
};

type Order = {
  id: string;
  customerName: string;
  phone: string;
  phone2?: string | null;
  address: string;
  locationText?: string | null;
  locationLat?: number | null;
  locationLng?: number | null;
  paymentMethod?: 'CASH' | 'CARD' | null;
  comment?: string;
  cancelReason?: string | null;
  status: OrderStatus;
  deliveryDate?: string | null;
  explanation?: string | null;
  createdAt: string;
  items: OrderItem[];
  appliedPromoCode?: string | null;
  appliedPromoPercent?: number | null;
  appliedPromoType?: 'DISCOUNT' | 'GIFT' | null;
  appliedPromoGiftName?: string | null;
  appliedPromoGiftImage?: string | null;
  appliedPromoGiftPrice?: number | null;
};

type OrdersResponse = {
  items: Order[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

type Stats = {
  usersCount: number;
  carpetsCount: number;
  orders: {
    total: number;
    pending: number;
    accepted: number;
    delivered: number;
    cancelled: number;
  };
};

const statusMap: Record<OrderStatus, { label: string; color: string }> = {
  PENDING: { label: formatOrderStatus('PENDING'), color: 'bg-amber-100 text-amber-700 border-amber-200' },
  ACCEPTED: { label: formatOrderStatus('ACCEPTED'), color: 'bg-blue-100 text-blue-700 border-blue-200' },
  ON_WAY: { label: formatOrderStatus('ON_WAY'), color: 'bg-purple-100 text-purple-700 border-purple-200' },
  DELIVERED: { label: formatOrderStatus('DELIVERED'), color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  CANCELLED: { label: formatOrderStatus('CANCELLED'), color: 'bg-red-100 text-red-700 border-red-200' },
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);


  const [updatingOrder, setUpdatingOrder] = useState<{ id: string; targetStatus: OrderStatus; currentStatus: OrderStatus } | null>(null);

  useEffect(() => {
    setMounted(true);
    void loadStats();

    // Subscribe admin to push notifications
    const subscribe = async () => {
      try {
        const { subscribeUserToPush } = await import('@/services/notification.service');
        await subscribeUserToPush();
      } catch (e) {
        console.warn('Admin push subscription failed', e);
      }
    };
    void subscribe();
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [statusFilter]);

  const loadStats = async () => {
    try {
      setStatsLoading(true);
      const { data } = await api.get<Stats>('/users/stats');
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setStatsLoading(false);
    }
  };


  const loadOrders = async () => {
    try {
      setLoading(true);
      const { data } = await api.get<OrdersResponse>('/orders', {
        params: {
          page: 1,
          limit: 50,
          status: statusFilter || undefined
        },
      });
      setOrders(data.items);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (data: { status: OrderStatus; deliveryDate?: string; explanation?: string; cancelReason?: string }) => {
    if (!updatingOrder) return;
    try {
      await api.patch(`/orders/${updatingOrder.id}/status`, data);
      void loadOrders();
      void loadStats();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  if (loading && orders.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="section-shell py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="font-serif text-4xl text-ink">Buyurtmalar boshqaruvi</h1>

        <div className="flex items-center gap-3">
          <span className="text-sm text-ink/60 whitespace-nowrap">Holati:</span>
          <select
            className="input-field py-2"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Barchasi</option>
            <option value="PENDING">{formatOrderStatus('PENDING')}</option>
            <option value="ACCEPTED">{formatOrderStatus('ACCEPTED')}</option>
            <option value="ON_WAY">{formatOrderStatus('ON_WAY')}</option>
            <option value="DELIVERED">{formatOrderStatus('DELIVERED')}</option>
            <option value="CANCELLED">{formatOrderStatus('CANCELLED')}</option>
          </select>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className={`panel border-amber-200 bg-amber-50/30 p-4 transition-all duration-300 ${statusFilter === 'PENDING' ? 'ring-2 ring-amber-500' : 'cursor-pointer hover:ring-1 hover:ring-amber-300'}`} onClick={() => setStatusFilter(statusFilter === 'PENDING' ? '' : 'PENDING')}>
          <p className="text-xs font-bold uppercase tracking-wider text-amber-600">Kutilmoqda</p>
          <p className={`mt-1 text-2xl font-bold text-ink ${statsLoading ? 'animate-pulse' : ''}`}>
            {statsLoading ? '...' : stats?.orders.pending ?? '-'}
          </p>
        </div>
        <div className={`panel border-blue-200 bg-blue-50/30 p-4 transition-all duration-300 ${statusFilter === 'ACCEPTED' ? 'ring-2 ring-blue-500' : 'cursor-pointer hover:ring-1 hover:ring-blue-300'}`} onClick={() => setStatusFilter(statusFilter === 'ACCEPTED' ? '' : 'ACCEPTED')}>
          <p className="text-xs font-bold uppercase tracking-wider text-blue-600">Qabul qilindi</p>
          <p className={`mt-1 text-2xl font-bold text-ink ${statsLoading ? 'animate-pulse' : ''}`}>
            {statsLoading ? '...' : stats?.orders.accepted ?? '-'}
          </p>
        </div>
        <div className={`panel border-emerald-200 bg-emerald-50/30 p-4 transition-all duration-300 ${statusFilter === 'DELIVERED' ? 'ring-2 ring-emerald-500' : 'cursor-pointer hover:ring-1 hover:ring-emerald-300'}`} onClick={() => setStatusFilter(statusFilter === 'DELIVERED' ? '' : 'DELIVERED')}>
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Yetkazildi</p>
          <p className={`mt-1 text-2xl font-bold text-ink ${statsLoading ? 'animate-pulse' : ''}`}>
            {statsLoading ? '...' : stats?.orders.delivered ?? '-'}
          </p>
        </div>
        <div className={`panel border-red-200 bg-red-50/30 p-4 transition-all duration-300 ${statusFilter === 'CANCELLED' ? 'ring-2 ring-red-500' : 'cursor-pointer hover:ring-1 hover:ring-red-300'}`} onClick={() => setStatusFilter(statusFilter === 'CANCELLED' ? '' : 'CANCELLED')}>
          <p className="text-xs font-bold uppercase tracking-wider text-red-600">Bekor qilindi</p>
          <p className={`mt-1 text-2xl font-bold text-ink ${statsLoading ? 'animate-pulse' : ''}`}>
            {statsLoading ? '...' : stats?.orders.cancelled ?? '-'}
          </p>
        </div>
      </div>



      {error ? (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="mt-6 space-y-6">
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : orders.length === 0 ? (
          <p className="py-12 text-center text-ink/40">Hozircha buyurtmalar yo&apos;q.</p>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="panel group overflow-hidden border-sand-dark/10 border-l-[8px] border-l-black shadow-[rgba(37,99,235,0.14)_20px_0_60px_-15px] transition-all hover:shadow-[rgba(37,99,235,0.2)_25px_0_70px_-10px]">
              {/* Order Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-sand bg-sand/30 p-5 group-hover:bg-sand/40 transition-colors">
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/30">ID</p>
                    <p className="text-sm font-mono font-bold text-ink">
                      #{formatOrderNumber(order.id, order.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/30">Sana</p>
                    <p className="text-sm font-medium text-ink" suppressHydrationWarning>
                      {mounted ? new Date(order.createdAt).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '--'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setUpdatingOrder({ id: order.id, targetStatus: order.status, currentStatus: order.status })}
                    className="rounded-lg bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-primary border border-primary/20 hover:bg-primary/5 transition"
                  >
                    Xabar / Sana
                  </button>
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusMap[order.status].color}`}>
                    {statusMap[order.status].label}
                  </span>

                  <select
                    className="input-field py-1 text-xs disabled:opacity-50 disabled:bg-gray-50"
                    value={order.status}
                    disabled={
                      order.status === 'DELIVERED' ||
                      order.status === 'CANCELLED' ||
                      order.status === 'ON_WAY'
                    }
                    onChange={(e) => {
                      const nextStatus = e.target.value as OrderStatus;
                      if (nextStatus === order.status) return;
                      setUpdatingOrder({ id: order.id, targetStatus: nextStatus, currentStatus: order.status });
                    }}
                  >
                    <option value={order.status} disabled>
                      {formatOrderStatus(order.status)}
                    </option>
                    {order.status === 'PENDING' && (
                      <option value="ACCEPTED">Qabul qilish</option>
                    )}
                    {order.status === 'PENDING' && (
                      <option value="CANCELLED">Bekor qilish</option>
                    )}
                    {order.status === 'ACCEPTED' && (
                      <option value="ON_WAY">Yetkazib berish</option>
                    )}
                    {order.status === 'ACCEPTED' && (
                      <option value="CANCELLED">Bekor qilish</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Order Content */}
              <div className="grid gap-6 p-4 md:grid-cols-2">
                {/* Customer Info */}
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-ink/40">Mijoz ma&apos;lumotlari</h3>
                  <div className="mt-2 space-y-1">
                    <p className="font-semibold text-ink">{order.customerName}</p>
                    <p className="text-sm text-ink/75">Tel 1: {order.phone}</p>
                    {order.phone2 ? (
                      <p className="text-sm text-ink/75">Tel 2: {order.phone2}</p>
                    ) : null}
                    {order.deliveryDate && (
                      <p className="text-sm font-bold text-primary">
                        Yetkazib berish sanasi: {new Date(order.deliveryDate).toLocaleDateString('uz-UZ')}
                      </p>
                    )}
                    <p className="text-sm text-ink/75">{order.address}</p>
                    {order.locationText && (
                      <p className="text-xs text-ink/60">Lokatsiya: {order.locationText}</p>
                    )}
                    {order.paymentMethod && (
                      <p className="text-xs text-ink/60">
                        To&apos;lov: {order.paymentMethod === 'CARD' ? 'Karta' : 'Naqd'}
                      </p>
                    )}
                    {order.comment && (
                      <p className="mt-2 rounded-lg bg-sand/30 p-2 text-xs italic text-ink/60">
                        &quot;{order.comment}&quot;
                      </p>
                    )}
                    {order.appliedPromoCode && (
                      <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs font-semibold text-amber-800">
                        Promokod: {order.appliedPromoCode}
                        {order.appliedPromoType === 'DISCOUNT' && order.appliedPromoPercent
                          ? ` (-${order.appliedPromoPercent}%)`
                          : ''}
                        {order.appliedPromoType === 'GIFT' && order.appliedPromoGiftName
                          ? ` | Sovg'a: ${order.appliedPromoGiftName} (${formatPrice(order.appliedPromoGiftPrice ?? 0)})`
                          : ''}
                      </div>
                    )}
                    {order.status === 'CANCELLED' && order.cancelReason && (
                      <p className="mt-2 rounded-lg bg-red-50 p-2 text-xs font-semibold text-red-700">
                        Sabab: {order.cancelReason}
                      </p>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-ink/40">Mahsulotlar</h3>
                  <div className="mt-2 divide-y divide-sand">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-2">
                        <div>
                          <p className="text-sm font-medium text-ink">{item.carpet ? item.carpet.name : 'O\'chirilgan mahsulot'}</p>
                          <p className="text-xs text-ink/60">{item.carpet ? `${item.carpet.size} | ${item.carpet.material}` : 'Ma\'lumotlar yo\'q'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-primary">{formatPrice(item.price)}</p>
                          <p className="text-xs text-ink/40">{item.quantity} dona</p>
                        </div>
                      </div>
                    ))}
                    <div className="mt-2 pt-2 flex items-center justify-between border-t border-sand">
                      <p className="font-bold text-ink">Jami:</p>
                      <p className="text-lg font-bold text-primary">
                        {formatPrice(order.items.reduce((acc, item) => acc + item.price * item.quantity, 0))}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <OrderStatusModal
        isOpen={!!updatingOrder}
        onClose={() => setUpdatingOrder(null)}
        onConfirm={handleUpdateStatus}
        orderId={updatingOrder?.id ?? ''}
        orderCreatedAt={orders.find((order) => order.id === updatingOrder?.id)?.createdAt ?? null}
        currentStatus={updatingOrder?.currentStatus ?? 'PENDING'}
        targetStatus={updatingOrder?.targetStatus ?? 'PENDING'}
      />
    </div>
  );
}
