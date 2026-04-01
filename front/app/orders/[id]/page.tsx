'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, formatPrice, getErrorMessage } from '@/services/api';
import { formatOrderStatus } from '@/utils/format';
import { getToken } from '@/services/auth.service';
import { getOrderById, confirmOrderDelivery } from '@/services/order.service';
import type { Order } from '@/types/order';

const statusColor: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    ACCEPTED: 'bg-blue-100 text-blue-800',
    ON_WAY: 'bg-purple-100 text-purple-800',
    DELIVERED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
};

export default function SingleOrderPage() {
    const params = useParams();
    const router = useRouter();
    const rawId = params?.id;
    const id = Array.isArray(rawId) ? (rawId[0] ?? '') : (rawId ?? '');

    const [mounted, setMounted] = useState(false);
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => setMounted(true), []);
    const hasToken = useMemo(() => (mounted ? Boolean(getToken()) : false), [mounted]);

    useEffect(() => {
        if (!id) {
            setError("Buyurtma identifikatori topilmadi.");
            setLoading(false);
            return;
        }

        if (!hasToken) {
            if (mounted) router.push('/login');
            return;
        }

        const fetchOrder = async () => {
            try {
                setLoading(true);
                const data = await getOrderById(id);
                setOrder(data);
            } catch (err) {
                setError(getErrorMessage(err));
            } finally {
                setLoading(false);
            }
        };

        void fetchOrder();
    }, [id, hasToken, mounted, router]);

    const handleConfirm = async () => {
        if (!id) return;
        if (!confirm("Haqiqatdan ham buyurtmani qabul qilib oldingizmi?")) return;
        try {
            await confirmOrderDelivery(id);
            // Refresh order
            const data = await getOrderById(id);
            setOrder(data);
        } catch (err) {
            alert(getErrorMessage(err));
        }
    };

    if (!mounted) return null;

    if (loading) {
        return (
            <div className="section-shell py-8">
                <div className="h-64 animate-pulse rounded-xl bg-sand" />
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="section-shell py-8">
                <div className="rounded-xl border border-red-200 bg-red-50 p-6">
                    <h1 className="text-xl font-bold text-red-800">Xatolik yuz berdi</h1>
                    <p className="mt-2 text-red-600">{error || 'Buyurtma topilmadi.'}</p>
                    <Link href="/orders" className="btn-primary mt-6 inline-block">
                        Buyurtmalarga qaytish
                    </Link>
                </div>
            </div>
        );
    }

    const total = order.items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

    return (
        <div className="section-shell space-y-6 py-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h1 className="font-serif text-3xl text-ink md:text-4xl">Buyurtma tafsilotlari</h1>
                <Link href="/orders" className="btn-outline h-10 px-4">
                    Orqaga
                </Link>
            </div>

            <section className="panel p-6 md:p-8">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-sand pb-6 relative z-10 transition-colors duration-300">
                    <div>
                        <p className="text-sm font-medium text-ink/60 uppercase tracking-widest">Buyurtma sanasi</p>
                        <p className="mt-1 font-bold text-ink text-lg" suppressHydrationWarning>
                            {new Date(order.createdAt).toLocaleString('uz-UZ')}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-medium text-ink/60 uppercase tracking-widest mb-1">Holati</p>
                        <span className={`inline-block rounded-full px-4 py-1.5 text-sm font-bold shadow-sm ${statusColor[order.status] || 'bg-gray-100 text-gray-800'}`}>
                            {formatOrderStatus(order.status)}
                        </span>
                        {order.status === 'ON_WAY' && (
                            <div className="mt-3">
                                <button
                                    onClick={handleConfirm}
                                    className="btn-primary flex w-full items-center justify-center py-2 text-xs font-semibold shadow-sm transition-all hover:shadow-md active:scale-95"
                                >
                                    Qabul qildim
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid gap-8 border-b border-sand py-6 md:grid-cols-2">
                    <div>
                        <h3 className="font-serif text-xl text-ink">Mijoz ma'lumotlari</h3>
                        <ul className="mt-4 space-y-3 text-sm text-ink/80">
                            <li><strong className="text-ink">Ism:</strong> {order.customerName}</li>
                            <li><strong className="text-ink">Telefon 1:</strong> {order.phone}</li>
                            {order.phone2 && (
                                <li><strong className="text-ink">Telefon 2:</strong> {order.phone2}</li>
                            )}
                            {order.comment && (
                                <li className="rounded-lg bg-sand/30 p-3 mt-2"><strong className="text-ink">Izoh:</strong> {order.comment}</li>
                            )}
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-serif text-xl text-ink">Yetkazib berish o'rni</h3>
                        <ul className="mt-4 space-y-3 text-sm text-ink/80">
                            <li><strong className="text-ink">Manzil:</strong> {order.address}</li>
                            {order.locationText && (
                                <li><strong className="text-ink">Lokatsiya izohi:</strong> {order.locationText}</li>
                            )}
                            <li>
                                <strong className="text-ink">To'lov turi:</strong> {order.paymentMethod === 'CARD' ? 'Karta orqali' : 'Naqd pul'}
                            </li>
                        </ul>
                    </div>
                </div>

                {order.status === 'CANCELLED' && order.cancelReason && (
                    <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
                        <h3 className="font-bold text-red-800">Bekor qilinish sababi:</h3>
                        <p className="mt-1 text-red-600">{order.cancelReason}</p>
                    </div>
                )}

                <div className="mt-8">
                    <h3 className="font-serif text-2xl text-ink mb-6">Xarid qilingan gilamlar</h3>
                    <div className="space-y-4">
                        {order.items.map((item) => (
                            <div key={item.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-sand bg-white p-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-16 w-16 overflow-hidden rounded-lg bg-sand flex-shrink-0">
                                        {item.carpet?.images?.[0] ? (
                                            <img src={item.carpet.images[0]} alt={item.carpet.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center text-xs text-ink/40">Rasm yo'q</div>
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-ink hover:text-primary transition-colors">
                                                {item.carpet?.name || item.carpetId}
                                            </span>
                                            <Link 
                                              href={`/carpets/${item.carpetId}`}
                                              className="inline-flex items-center justify-center rounded-full bg-sky-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-600 transition hover:bg-sky-100 hover:scale-105 active:scale-95 border border-sky-100"
                                            >
                                              Ko&apos;rish
                                            </Link>
                                        </div>
                                        <p className="text-xs text-ink/60 mt-1">
                                            {item.carpet?.size} {item.carpet?.material ? `| ${item.carpet.material}` : ''}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium text-ink"><span className="text-ink/50 text-xs">Narxi:</span> {formatPrice(Number(item.price))}</p>
                                    <p className="font-medium text-ink"><span className="text-ink/50 text-xs">Soni:</span> {item.quantity} ta</p>
                                    <p className="font-bold text-primary mt-1"><span className="text-ink/50 text-xs font-medium">Jami:</span> {formatPrice(Number(item.price) * item.quantity)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-8 flex justify-end">
                    <div className="rounded-2xl bg-sand/30 p-6 text-right md:min-w-[300px]">
                        <p className="text-sm font-medium text-ink/60">Umumiy hisob:</p>
                        <p className="mt-1 font-serif text-4xl text-terracotta">{formatPrice(total)}</p>
                    </div>
                </div>

            </section>
        </div>
    );
}
