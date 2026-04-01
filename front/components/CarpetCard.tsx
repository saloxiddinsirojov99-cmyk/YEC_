'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Carpet } from '@/types/carpet';
import { formatPrice, getImageUrl } from '@/services/api';
import { getPricePerM2 } from '@/utils/size';
import { clampDiscountPercent, getDiscountedPrice } from '@/utils/price';
import { addToCart, getCartItems } from '@/services/cart.service';
import { getToken } from '@/services/auth.service';
import { isCarpetLiked, likeCarpet } from '@/services/like.service';

type Props = {
  carpet: Carpet & { likes?: number }; // Fallback optional likes just in case
};

const placeholder =
  'https://images.unsplash.com/photo-1600166898405-da9535204843?auto=format&fit=crop&w=1200&q=80';

export default function CarpetCard({ carpet }: Props) {
  const router = useRouter();
  const [showToast, setShowToast] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  
  // Use DB likes as initial source of truth
  const initialLikes = typeof carpet.likes === 'number' ? carpet.likes : 0;
  const [likeCount, setLikeCount] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(
    typeof carpet.isLiked === 'boolean' ? carpet.isLiked : false,
  );
  
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const discountPercent = clampDiscountPercent(carpet.discountPercent);
  const discountedPrice = getDiscountedPrice(carpet.price, discountPercent);
  const pricePerM2 = getPricePerM2(discountedPrice, carpet.size);
  const imageSrc = getImageUrl(carpet.images?.[0]) || placeholder;
  
  const openDetail = () => {
    router.push(`/carpets/${carpet.id}`);
  };

  useEffect(() => {
    const syncAddedState = () => {
      const items = getCartItems();
      setIsAdded(items.some((item) => item.carpetId === carpet.id));
    };

    syncAddedState();
    window.addEventListener('yec-cart-changed', syncAddedState);
    return () => window.removeEventListener('yec-cart-changed', syncAddedState);
  }, [carpet.id]);

  useEffect(() => {
    const syncLikeState = () => {
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
      const detail = (event as CustomEvent<{ id?: string; liked?: boolean; count?: number }>).detail;
      if (!detail?.id || detail.id === carpet.id) {
        if (typeof detail?.liked === 'boolean') {
          setIsLiked(detail.liked);
        } else {
          syncLikeState();
        }
        if (typeof detail?.count === 'number') {
          setLikeCount(detail.count);
        }
      }
    };

    window.addEventListener('yec-like-changed', handleLikeChange);
    return () => window.removeEventListener('yec-like-changed', handleLikeChange);
  }, [carpet.id, carpet.isLiked]);

  const handleAddToCart = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!getToken()) {
      router.push('/login');
      return;
    }
    if (carpet.stock <= 0 || isAdded) return;

    addToCart(
      {
        carpetId: carpet.id,
        name: carpet.name,
        price: discountedPrice,
        originalPrice: Number(carpet.price),
        productDiscountPercent: discountPercent,
        image: imageSrc,
        size: carpet.size,
        material: carpet.material,
      },
      1,
    );

    setIsAdded(true);
    setShowToast(true);
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }
    toastTimer.current = setTimeout(() => setShowToast(false), 2000);
  };

  const handleLike = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!getToken()) {
      router.push('/login');
      return;
    }
    
    // Optimistic UI updates
    const nextLikedState = !isLiked;
    setIsLiked(nextLikedState);
    setLikeCount((prev) => nextLikedState ? prev + 1 : Math.max(0, prev - 1));

    // Send to backend
    const result = await likeCarpet(carpet.id);
    
    // In case of any desync or rollback, we can trust the result here
    setIsLiked(result.liked);
    if (typeof result.count === 'number') {
      setLikeCount(result.count);
    }
  };

  const isPrayer = (carpet.category?.name ?? '').toLowerCase().includes('joynamoz');

  return (
    <article
      className="classic-carpet-card relative overflow-hidden group cursor-pointer min-w-0"
      onClick={openDetail}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openDetail();
        }
      }}
      role="link"
      tabIndex={0}
    >
      {showToast ? (
        <div className="fixed top-20 right-4 z-50 rounded-xl border border-emerald-100 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700 shadow-xl fade-up">
          Buyurtmangiz savatingizga qo&apos;shildi
        </div>
      ) : null}
      <div className="relative aspect-[3/4] overflow-hidden sm:aspect-[4/5]">
        <img
          src={imageSrc}
          alt={carpet.name}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-700 ease-premium-in-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {discountPercent > 0 ? (
          <span className="absolute left-3 top-14 z-10 rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest text-white shadow-lg sm:hidden">
            -{discountPercent}%
          </span>
        ) : null}

        <button
          type="button"
          onClick={handleLike}
          className={`absolute left-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest shadow-lg transition-colors duration-300 sm:left-4 sm:top-4 sm:gap-2 sm:px-3 sm:py-1.5 sm:text-[10px] ${
            isLiked
              ? 'border-primary bg-primary text-white'
              : 'border-white/10 bg-black/40 text-white backdrop-blur-md hover:bg-white hover:text-background'
          }`}
          aria-label="Like"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill={isLiked ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
          </svg>
          <span className="tabular-nums font-black">{likeCount}</span>
        </button>
        
        {/* Stock Badge */}
        {carpet.stock <= 0 ? (
          <div className="absolute top-3 right-3 z-10 rounded-full bg-slate-900/90 backdrop-blur-md px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white shadow-lg">
            Sotilgan
          </div>
        ) : !isPrayer && carpet.stock === 1 ? (
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1 rounded-full bg-orange-500 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white shadow-lg animate-pulse">
            <span>Faqat 1 ta!</span>
          </div>
        ) : null}

        <div className="absolute bottom-4 left-4 right-4 z-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70 line-clamp-1 mb-1">
            {carpet.category?.name || 'YEC MARKET'}
          </p>
          <h3 className="line-clamp-1 font-serif text-2xl font-bold text-white transition-colors duration-500 sm:text-3xl">
            {carpet.name}
          </h3>
        </div>
      </div>

      <div className="p-5 sm:p-8">
        <div className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between gap-2">
            <div>
              {carpet.stock <= 0 ? (
                <p className="text-2xl font-bold tracking-tight text-ink/20 line-through">
                  {formatPrice(carpet.price)}
                </p>
              ) : (
                <div className="flex flex-col gap-0.5">
                   <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-2">
                      {discountPercent > 0 ? (
                        <>
                          <p className="order-1 whitespace-nowrap text-sm font-bold text-ink/30 line-through decoration-red-500 decoration-s sm:order-2 sm:text-lg">
                            {formatPrice(carpet.price)}
                          </p>
                          <p className="order-2 whitespace-nowrap text-3xl font-black tracking-tight text-ink sm:order-1 sm:text-4xl">
                            {formatPrice(discountedPrice)}
                          </p>
                        </>
                      ) : (
                        <p className="whitespace-nowrap text-3xl font-black tracking-tight text-ink sm:text-4xl">
                          {formatPrice(discountedPrice)}
                        </p>
                      )}
                   </div>
                   {carpet.stock > 0 && !isPrayer && pricePerM2 ? (
                     <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary sm:text-xs">
                        {formatPrice(Math.round(pricePerM2))} / m²
                     </p>
                   ) : null}
                </div>
              )}
            </div>
          </div>

          {/* Detailed Info - Hidden on mobile, shown on desktop or in details page */}
          <div className="hidden sm:block space-y-1">
             <p className="text-xs font-semibold tracking-widest uppercase text-ink/40">
                 {carpet.material} • {carpet.size}
             </p>
          </div>

          <div className="flex flex-col gap-2 sm:grid sm:grid-cols-2 sm:gap-4">
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                openDetail();
              }}
              className="btn-premium w-full py-3.5 text-xs font-bold uppercase tracking-[0.15em] sm:py-4"
            >
              Batafsil
            </button>
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={carpet.stock <= 0 || isAdded}
              className={`hidden sm:flex items-center justify-center w-full rounded-xl py-3.5 text-xs font-bold uppercase tracking-[0.15em] transition-all ${
                carpet.stock <= 0
                  ? 'cursor-not-allowed bg-slate-100 text-ink/30'
                  : isAdded
                    ? 'cursor-not-allowed bg-emerald-100 text-emerald-700'
                    : 'bg-emerald-500 text-white hover:bg-emerald-600'
              }`}
            >
              {carpet.stock <= 0 ? 'Mavjud emas' : isAdded ? "Savatda" : "Savatga"}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
