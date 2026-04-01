'use client';

import { useState } from 'react';
import { OrderStatus } from '@/types/order';
import { formatOrderNumber, formatOrderStatus } from '@/utils/format';

interface OrderStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { status: OrderStatus; deliveryDate?: string; explanation?: string; cancelReason?: string }) => void;
  currentStatus: OrderStatus;
  targetStatus: OrderStatus;
  orderId: string;
  orderCreatedAt?: string | null;
}

export default function OrderStatusModal({
  isOpen,
  onClose,
  onConfirm,
  currentStatus,
  targetStatus,
  orderId,
  orderCreatedAt,
}: OrderStatusModalProps) {
  const [deliveryDate, setDeliveryDate] = useState('');
  const [explanation, setExplanation] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetStatus === 'CANCELLED' && !cancelReason.trim()) {
      alert('Iltimos, bekor qilish sababini kiriting.');
      return;
    }
    onConfirm({
      status: targetStatus,
      deliveryDate: deliveryDate || undefined,
      explanation: explanation || undefined,
      cancelReason: cancelReason || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md animate-in fade-in zoom-in duration-300 rounded-[2rem] border border-white/20 bg-white p-8 shadow-2xl">
        <h2 className="font-serif text-2xl text-ink">Statasni o&apos;zgartirish</h2>
        <p className="mt-2 text-sm text-ink/60">
          #<span className="font-mono">{formatOrderNumber(orderId, orderCreatedAt)}</span> buyurtma holatini 
          <span className="mx-1 font-bold text-primary">{formatOrderStatus(targetStatus)}</span> 
          ga o&apos;zgartirmoqdamisiz?
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {targetStatus === 'ACCEPTED' && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-ink/40">Yetkazib berish sanasini tanlang</label>
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

          {targetStatus === 'CANCELLED' && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-ink/40">Bekor qilish sababi</label>
              <textarea
                required
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Nima sababdan bekor qilinmoqda?"
                className="input-field w-full min-h-[100px]"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-ink/40">Qo&apos;shimcha tushuntirish (Mijozga email orqali yuboriladi)</label>
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
