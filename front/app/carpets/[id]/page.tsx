'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { formatPrice, getErrorMessage } from '@/services/api';
import { getToken } from '@/services/auth.service';
import CarpetList from '@/components/CarpetList';
import { getCarpetById, getCarpets } from '@/services/carpet.service';
import { addToCart } from '@/services/cart.service';
import { isCarpetLiked, likeCarpet } from '@/services/like.service';
import { getPricePerM2 } from '@/utils/size';
import { clampDiscountPercent, getDiscountedPrice } from '@/utils/price';
import type { Carpet } from '@/types/carpet';

const placeholder =
  'https://images.unsplash.com/photo-1600166898405-da9535204843?auto=format&fit=crop&w=1200&q=80';

export default function CarpetDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [carpet, setCarpet] = useState<Carpet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [zoomOrigin, setZoomOrigin] = useState('50% 50%');
  const [isTouch, setIsTouch] = useState(false);
  const [showZoomCta, setShowZoomCta] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [similarCarpets, setSimilarCarpets] = useState<Carpet[]>([]);
  const [discoverCarpets, setDiscoverCarpets] = useState<Carpet[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await getCarpetById(id);
        setCarpet(data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [id]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(hover: none), (pointer: coarse)');
    const update = () => {
      setIsTouch(mq.matches || navigator.maxTouchPoints > 0);
    };
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);

  useEffect(() => {
    if (!isZoomOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsZoomOpen(false);
        setZoomLevel(1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isZoomOpen]);

  useEffect(() => {
    if (!carpet) return;

    const syncLikeState = () => {
      setLikeCount(typeof carpet.likes === 'number' ? carpet.likes : 0);
      if (!getToken()) {
        setIsLiked(false);
        return;
      }
      if (typeof carpet.isLiked === 'boolean') {
        setIsLiked(carpet.isLiked);
        return;
      }
      setIsLiked(isCarpetLiked(carpet.id));
    };

    syncLikeState();
    const handleLikeChange = (event: Event) => {
      const detail = (
        event as CustomEvent<{ id?: string; liked?: boolean; count?: number }>
      ).detail;
      if (!detail?.id || detail.id === carpet.id) {
        if (typeof detail?.liked === 'boolean') {
          setIsLiked(detail.liked);
        } else {
          setIsLiked(isCarpetLiked(carpet.id));
        }
        if (typeof detail?.count === 'number') {
          setLikeCount(detail.count);
        }
      }
    };

    window.addEventListener('yec-like-changed', handleLikeChange);
    return () => window.removeEventListener('yec-like-changed', handleLikeChange);
  }, [carpet]);

  useEffect(() => {
    if (!carpet?.categoryId) return;

    const loadSimilar = async () => {
      try {
        setLoadingSimilar(true);
        const response = await getCarpets({
          page: 1,
          limit: 40,
          categoryId: carpet.categoryId,
        });
        const currentName = carpet.name.toLowerCase().trim();
        const firstToken = currentName.split(/\s+/)[0] ?? '';

        const items = response.items ?? [];
        
        // Similar: Carpets from the same collection (matching first token of name)
        const similar = items
          .filter((item) => item.id !== carpet.id)
          .filter((item) => {
            if (!firstToken) return false;
            return item.name.toLowerCase().includes(firstToken);
          })
          .slice(0, 16);

        // Discover: Other carpets from the same category
        const similarIds = new Set(similar.map(s => s.id));
        const discover = items
          .filter((item) => item.id !== carpet.id && !similarIds.has(item.id))
          .sort(() => Math.random() - 0.5)
          .slice(0, 12);

        setSimilarCarpets(similar);
        setDiscoverCarpets(discover);
      } catch {
        setSimilarCarpets([]);
        setDiscoverCarpets([]);
      } finally {
        setLoadingSimilar(false);
      }
    };

    void loadSimilar();
  }, [carpet?.id, carpet?.categoryId, carpet?.name]);

  if (loading) {
    return (
      <div className="section-shell py-10">
        <div className="h-96 animate-pulse rounded-2xl bg-sand" />
      </div>
    );
  }

  if (!carpet) {
    return (
      <div className="section-shell py-10">
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error || "Gilam ma'lumoti topilmadi."}
        </p>
      </div>
    );
  }

  const images = carpet.images?.length > 0 ? carpet.images : [placeholder];
  const discountPercent = clampDiscountPercent(carpet.discountPercent);
  const discountedPrice = getDiscountedPrice(carpet.price, discountPercent);
  const pricePerM2 = getPricePerM2(discountedPrice, carpet.size);
  const zoomImage = images[activeImage];
  const openZoom = () => {
    setIsZoomOpen(true);
    setZoomLevel(1);
    setZoomOrigin('50% 50%');
    setShowZoomCta(false);
  };
  const zoomCtaVisible = isTouch ? showZoomCta : isHovering;
  const handleLike = async () => {
    if (!getToken()) {
      router.push('/login');
      return;
    }

    const nextLikedState = !isLiked;
    setIsLiked(nextLikedState);
    setLikeCount((prev) => (nextLikedState ? prev + 1 : Math.max(0, prev - 1)));

    const result = await likeCarpet(carpet.id);
    setIsLiked(result.liked);
    if (typeof result.count === 'number') {
      setLikeCount(result.count);
    }
  };

  return (
    <div className="section-shell py-8">
      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <div
            className="group relative w-full overflow-hidden rounded-2xl border border-black/10 bg-white shadow-soft"
            onClick={() => {
              if (isTouch) setShowZoomCta(true);
            }}
            onMouseEnter={() => {
              if (!isTouch) setIsHovering(true);
            }}
            onMouseLeave={() => {
              if (!isTouch) setIsHovering(false);
            }}
          >
            <img
              src={zoomImage}
              alt={carpet.name}
              className="w-full h-auto max-h-[80vh] object-contain bg-white transition-opacity duration-500"
            />
            <button
              type="button"
              className={`absolute bottom-3 right-3 rounded-full bg-black/75 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white shadow transition-opacity duration-300 ${
                zoomCtaVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
              }`}
              onClick={(event) => {
                event.stopPropagation();
                openZoom();
              }}
            >
              Yaqinlashtirish
            </button>
          </div>

          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                    activeImage === idx ? 'border-primary ring-2 ring-primary/20 scale-95' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} className="h-full w-full object-cover" alt={`Thumb ${idx}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="panel p-6">
          <div className="flex items-start justify-between gap-4">
            <p className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold tracking-wide text-primary">
              {carpet.category?.name || 'Turi'}
            </p>
            <button
              type="button"
              onClick={handleLike}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest shadow transition ${
                isLiked
                  ? 'border-rose-500 bg-rose-600 text-white'
                  : 'border-rose-200 bg-white text-rose-600 hover:-translate-y-0.5 hover:bg-rose-50'
          }`}
              aria-label="Like"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill={isLiked ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
              </svg>
              <span>{likeCount}</span>
            </button>
          </div>
          <h1 className="mt-3 font-serif text-4xl text-ink">
            {carpet.name}
            {discountPercent > 0 ? (
              <span className="ml-3 align-middle rounded-full bg-amber-50 px-3 py-1 text-xs font-extrabold uppercase tracking-widest text-amber-700 ring-1 ring-amber-200">
                -{discountPercent}% skidka
              </span>
            ) : null}
          </h1>
          {carpet.stock <= 0 ? (
            <p className="mt-4 text-3xl font-semibold text-primary line-through decoration-red-500 decoration-2">
              {formatPrice(carpet.price)}
            </p>
          ) : discountPercent > 0 ? (
            <div className="mt-4">
              <p className="text-lg font-bold text-ink/45 line-through decoration-red-500 decoration-2">
                {formatPrice(carpet.price)}
              </p>
              <p className="mt-1 text-3xl font-semibold text-amber-500">
                {formatPrice(discountedPrice)}
              </p>
            </div>
          ) : (
            <p className="mt-4 text-3xl font-semibold text-primary">{formatPrice(carpet.price)}</p>
          )}
          {carpet.stock > 0 && !(carpet.category?.name ?? '').toLowerCase().includes('joynamoz') && pricePerM2 ? (
            <p className="mt-1 text-sm font-semibold text-ink/60">
              1 m2: {formatPrice(Math.round(pricePerM2))}
            </p>
          ) : null}

          <div className="mt-5 space-y-2 text-sm text-ink/75">
            <p>
              <span className="font-semibold text-ink">Material:</span> {carpet.material}
            </p>
            <p>
              <span className="font-semibold text-ink">O'lcham:</span> {carpet.size}
            </p>
            <div className="pt-2">
              <span className="font-semibold text-ink">Holati: </span>
              {carpet.stock <= 0 ? (
                <span className="font-bold text-red-600">Sotilgan</span>
              ) : carpet.stock === 1 ? (
                <span className="font-bold text-amber-500">Faqat 1 ta qoldi</span>
              ) : (
                <span className="font-bold text-emerald-600">Sotuvda bor ({carpet.stock} ta)</span>
              )}
            </div>
          </div>

          <p className="mt-5 text-sm leading-7 text-ink/75">
            {carpet.description || "Ushbu gilam uchun tavsif hali qo'shilmagan."}
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <button
              type="button"
              className={`inline-flex items-center justify-center rounded-xl px-8 py-3 text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 active:scale-95 ${
                carpet.stock <= 0 ? 'bg-slate-400 cursor-not-allowed grayscale' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
              }`}
              disabled={carpet.stock <= 0}
              onClick={() => {
                if (!getToken()) {
                  router.push('/login');
                  return;
                }
                if (carpet.stock <= 0) return;
                addToCart(
                  {
                    carpetId: carpet.id,
                    name: carpet.name,
                    price: discountedPrice,
                    originalPrice: Number(carpet.price),
                    productDiscountPercent: discountPercent,
                    image: images[0],
                    size: carpet.size,
                    material: carpet.material,
                  },
                  1,
                );
                setMessage("Gilam savatga qo'shildi.");
              }}
            >
              {carpet.stock <= 0 ? "Sotib bo'lingan" : "Savatga qo'shish"}
            </button>
            <Link
              href="/cart"
              onClick={(event) => {
                if (!getToken()) {
                  event.preventDefault();
                  router.push('/login');
                }
              }}
              className="inline-flex items-center justify-center rounded-xl border-2 border-amber-500/20 bg-amber-500/10 px-8 py-3 text-sm font-bold text-amber-600 transition-all hover:bg-amber-500 hover:text-white"
            >
              Savatga o'tish
            </Link>
            <Link href="/carpets" className="inline-flex items-center justify-center rounded-xl border-2 border-slate-200 bg-slate-50 px-8 py-3 text-sm font-bold text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900">
              Marketga qaytish
            </Link>
          </div>
          {message ? (
            <p className="mt-3 text-sm text-primary font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              {message}
            </p>
          ) : null}
        </div>
      </div>

      <section className="mt-14">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary/60">
              Kolleksiya
            </p>
            <h2 className="font-serif text-3xl text-ink">O&apos;xshash gilamlar</h2>
          </div>
          <Link href={`/turlar/${carpet.categoryId}`} className="btn-secondary px-6 py-2.5 text-sm font-bold border-primary/20 text-primary hover:bg-primary hover:text-white transition-all">
            Barchasini ko&apos;rish
          </Link>
        </div>
        
        <div className="relative">
          <CarpetList
            carpets={similarCarpets}
            loading={loadingSimilar}
            emptyText="Hozircha o'xshash gilam topilmadi."
          />
        </div>
      </section>

      {discoverCarpets.length > 0 && (
        <section className="mt-20">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-t border-black/5 pt-12">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-600">
                Kashf qiling
              </p>
              <h2 className="font-serif text-3xl text-ink">Yana boshqa gilamlar</h2>
            </div>
          </div>
          <CarpetList
            carpets={discoverCarpets}
            loading={loadingSimilar}
          />
        </section>
      )}

      {isZoomOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 transition-all duration-300"
          onClick={() => {
            setIsZoomOpen(false);
            setZoomLevel(1);
          }}
        >
          <div
            className="relative flex h-full w-full flex-col items-center justify-center p-2 sm:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-3 text-white backdrop-blur-xl transition-all hover:bg-white/20 active:scale-90"
              onClick={() => {
                setIsZoomOpen(false);
                setZoomLevel(1);
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>

            <div
              className="relative flex h-full w-full items-center justify-center overflow-hidden"
              onMouseMove={(event) => {
                if (zoomLevel === 1 || isTouch) return;
                const rect = event.currentTarget.getBoundingClientRect();
                const x = ((event.clientX - rect.left) / rect.width) * 100;
                const y = ((event.clientY - rect.top) / rect.height) * 100;
                setZoomOrigin(`${x}% ${y}%`);
              }}
              onMouseLeave={() => setZoomOrigin('50% 50%')}
            >
              <img
                src={zoomImage}
                alt={`${carpet.name} zoom`}
                className={`max-h-full max-w-full bg-white object-contain transition-transform duration-300 ${
                  zoomLevel > 1 ? 'cursor-zoom-out' : 'cursor-zoom-in'
                }`}
                style={{
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: zoomOrigin,
                }}
                onClick={() => setZoomLevel((prev) => (prev === 1 ? 2.5 : 1))}
              />
            </div>
            
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
               <p className="rounded-full bg-black/40 px-4 py-1.5 text-xs font-bold text-white backdrop-blur-md">
                 {zoomLevel > 1 ? 'Kichraytirish uchun bosing' : 'Yaqinlashtirish uchun bosing'}
               </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
