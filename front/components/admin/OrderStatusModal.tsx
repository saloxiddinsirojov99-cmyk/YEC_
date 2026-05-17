'use client';

import { useState } from 'react';
import { OrderStatus } from '@/types/order';
import { formatOrderNumber, formatOrderStatus } from '@/utils/format';

export type CourierOption = {
  id: string;
  name: string;
  phone: string;
  telegramChatId: string | null;
};

interface OrderStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    status: OrderStatus;
    deliveryDate?: string;
    explanation?: string;
    cancelReason?: string;
    courierId?: string;
  }) => void;
  currentStatus: OrderStatus;
  targetStatus: OrderStatus;
  orderId: string;
  orderCreatedAt?: string | null;
  couriers?: CourierOption[];
}

export default function OrderStatusModal({
  isOpen,
  onClose,
  onConfirm,
  currentStatus,
  targetStatus,
  orderId,
  orderCreatedAt,
  couriers = [],
}: OrderStatusModalProps) {
  const [deliveryDate, setDeliveryDate] = useState('');
  const [explanation, setExplanation] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [courierId, setCourierId] = useState('');

  if (!isOpen) return null;

  const isOnWay = targetStatus === 'ON_WAY';
  const isAccepted = targetStatus === 'ACCEPTED';
  const isCancelled = targetStatus === 'CANCELLED';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isCancelled && !cancelReason.trim()) {
      alert('Iltimos, bekor qilish sababini kiriting.');
      return;
    }
    if (isOnWay && !courierId) {
      alert('Iltimos, kuryer tanlang.');
      return;
    }
    onConfirm({
      status: targetStatus,
      deliveryDate: deliveryDate || undefined,
      explanation: explanation || undefined,
      cancelReason: cancelReason || undefined,
      courierId: courierId || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md animate-in fade-in zoom-in duration-300 rounded-[2rem] border border-white/20 bg-white p-8 shadow-2xl">
        <h2 className="font-serif text-2xl text-ink">Holatni o&apos;zgartirish</h2>
        <p className="mt-2 text-sm text-ink/60">
          #<span className="font-mono">{formatOrderNumber(orderId, orderCreatedAt)}</span> buyurtma holatini{' '}
          <span className="mx-1 font-bold text-primary">{formatOrderStatus(targetStatus)}</span>
          ga o&apos;zgartirmoqdamisiz?
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Courier picker — only for ON_WAY */}
          {isOnWay && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-ink/40">
                Kuryer tanlang <span className="text-red-500">*</span>
              </label>
              {couriers.length === 0 ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-700">
                  ⚠️ Hozircha faol kuryer yo&apos;q. Avval kuryerlarni Telegram botda ro&apos;yxatdan o&apos;tkazing.
                </div>
              ) : (
                <select
                  required
                  value={courierId}
                  onChange={(e) => setCourierId(e.target.value)}
                  className="input-field w-full"
                >
                  <option value="" disabled>— Kuryer tanlang —</option>
                  {couriers.map((c) => (
                    <option key={c.id} value={c.id} disabled={!c.telegramChatId}>
                      {c.name} {c.phone ? `(${c.phone})` : ''}{!c.telegramChatId ? ' — ❌ Telegram yo\'q' : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Delivery date — for ACCEPTED */}
          {isAccepted && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-ink/40">
                Yetkazib berish sanasini tanlang <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="input-field w-full"
              />
            </div>
          )}

          {/* Cancel reason */}
          {isCancelled && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-ink/40">
                Bekor qilish sababi <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Nima sababdan bekor qilinmoqda?"
                className="input-field w-full min-h-[100px]"
              />
            </div>
          )}

          {/* Extra explanation — always shown */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-ink/40">
              Qo&apos;shimcha tushuntirish <span className="text-ink/25">(Mijozga Telegram + email orqali yuboriladi)</span>
            </label>
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Masalan: Kechga qarab yetib boramiz..."
              className="input-field w-full min-h-[80px]"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border border-sand py-3 text-sm font-bold text-ink transition hover:bg-sand/50"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary rounded-2xl py-3 text-sm font-bold shadow-lg shadow-primary/20"
            >
              Tasdiqlash
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
