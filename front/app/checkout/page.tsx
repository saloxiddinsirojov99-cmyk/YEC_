'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { formatPrice, getErrorMessage, getImageUrl } from '@/services/api';
import { getToken } from '@/services/auth.service';
import { clearCart, getCartItems } from '@/services/cart.service';
import { createOrder, previewPromoCode, type PromoPreviewResponse } from '@/services/order.service';
import { getMyProfile } from '@/services/user.service';
import LocationPicker, { type LocationValue } from '@/components/LocationPicker';
import { formatPhoneNumber, normalizePhoneNumber } from '@/utils/format';
import type { CartItem } from '@/types/cart';

const placeholder = 'https://via.placeholder.com/120x90?text=Carpet';
const UZ_PHONE_REGEX = /^\+998\d{9}$/;
const isInTashkentBounds = (lat: number, lng: number) =>
  lat >= 41.1 && lat <= 41.45 && lng >= 69.1 && lng <= 69.45;
const isInUzbekistanBounds = (lat: number, lng: number) =>
  lat >= 37.17 && lat <= 45.59 && lng >= 55.99 && lng <= 73.15;
const TELEGRAM_BOT_BASE_URL =
  process.env.NEXT_PUBLIC_TELEGRAM_BOT_URL?.trim() ||
  'https://t.me/YEC_Toshkent_bot';

type NominatimAddress = Record<string, unknown>;
type NominatimSearchResult = {
  place_id: number;
  display_name?: string;
  lat?: string;
  lon?: string;
  name?: string;
  class?: string;
  type?: string;
  importance?: number;
  address?: NominatimAddress;
  namedetails?: Record<string, string>;
  extratags?: Record<string, string>;
};
type AddressSuggestion = {
  id: string;
  label: string;
  lat: number;
  lng: number;
  isInTashkent: boolean;
  isInUzbekistan: boolean;
  distanceKm: number | null;
  matchScore: number;
};
type LatLng = {
  lat: number;
  lng: number;
};

const getAddressField = (address: NominatimAddress | undefined, key: string) => {
  if (!address) return '';
  const value = address[key];
  return typeof value === 'string' ? value.toLowerCase() : '';
};

const isAddressInUzbekistan = (address: NominatimAddress | undefined) => {
  if (!address) return false;
  const countryCode = getAddressField(address, 'country_code');
  const country = getAddressField(address, 'country');
  const state = getAddressField(address, 'state');

  if (countryCode) return countryCode === 'uz';

  const joined = [country, state].filter(Boolean).join(' ');
  return joined.includes('uzbekistan') || joined.includes("o'zbekiston");
};

const isAddressInTashkent = (address: NominatimAddress | undefined) => {
  if (!address) return false;

  const fields = [
    getAddressField(address, 'city'),
    getAddressField(address, 'town'),
    getAddressField(address, 'municipality'),
    getAddressField(address, 'city_district'),
    getAddressField(address, 'county'),
    getAddressField(address, 'state'),
    getAddressField(address, 'state_district'),
  ]
    .filter(Boolean)
    .join(' ');

  return fields.includes('tashkent') || fields.includes('toshkent');
};

const distanceInKm = (from: LatLng, to: LatLng) => {
  const earthRadiusKm = 6371;
  const toRadians = (deg: number) => (deg * Math.PI) / 180;
  const latDiff = toRadians(to.lat - from.lat);
  const lngDiff = toRadians(to.lng - from.lng);
  const fromLat = toRadians(from.lat);
  const toLat = toRadians(to.lat);

  const value =
    Math.sin(latDiff / 2) * Math.sin(latDiff / 2) +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(lngDiff / 2) * Math.sin(lngDiff / 2);

  const arc = 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
  return earthRadiusKm * arc;
};

const normalizeSearchText = (value: string) =>
  value
    .toLowerCase()
    .replace(/[’'`"]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const getQueryTokens = (query: string) =>
  normalizeSearchText(query)
    .split(' ')
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);

const hasContextKeyword = (query: string) => {
  const normalized = normalizeSearchText(query);
  return /(mahalla|kvartal|mavze|mavzesi|dokon|dokoni|shop|market|choyxona|choyhona)/.test(
    normalized,
  );
};

const getSearchVariants = (query: string) => {
  const base = query.trim();
  if (!base) return [];

  const variants = [base];
  const tokens = getQueryTokens(base);

  if (!hasContextKeyword(base) && tokens.length <= 2) {
    variants.push(`${base} mahalla`);
    variants.push(`${base} kvartal`);
    variants.push(`${base} do'kon`);
  }

  return variants.slice(0, 4);
};

const buildSearchParams = (query: string, userCoords: LatLng | null, bounded: boolean) => {
  const params = new URLSearchParams({
    format: 'jsonv2',
    addressdetails: '1',
    namedetails: '1',
    extratags: '1',
    dedupe: '0',
    countrycodes: 'uz',
    limit: '10',
    q: query,
    'accept-language': 'uz',
  });

  if (userCoords) {
    const latPad = 0.35;
    const lngPad = 0.45;
    const left = (userCoords.lng - lngPad).toFixed(6);
    const right = (userCoords.lng + lngPad).toFixed(6);
    const top = (userCoords.lat + latPad).toFixed(6);
    const bottom = (userCoords.lat - latPad).toFixed(6);

    params.set('viewbox', `${left},${top},${right},${bottom}`);
    if (bounded) {
      params.set('bounded', '1');
    }
  }

  return params;
};

function buildTelegramJoinUrl(baseUrl: string, token?: string): string {
  const trimmed = (baseUrl || '').trim();
  const cleanBase = (trimmed.includes('?') ? trimmed.split('?')[0] : trimmed) || 'https://t.me/YEC_Toshkent_bot';
  const safeToken = (token || '').trim();
  return safeToken
    ? `${cleanBase}?start=user_join_${safeToken}`
    : `${cleanBase}?start=user_join`;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('+998');
  const [phone2, setPhone2] = useState('+998');
  const [address, setAddress] = useState('');
  const [comment, setComment] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [payment, setPayment] = useState<'' | 'CASH' | 'CARD'>('');
  const [location, setLocation] = useState<LocationValue | null>(null);
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [addressSearching, setAddressSearching] = useState(false);
  const [addressHint, setAddressHint] = useState('');
  const [userCoords, setUserCoords] = useState<LatLng | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [promoWarning, setPromoWarning] = useState('');
  const [promoPreview, setPromoPreview] = useState<PromoPreviewResponse | null>(null);
  const [promoChecking, setPromoChecking] = useState(false);
  const [telegramChecking, setTelegramChecking] = useState(false);

  const [profile, setProfile] = useState<any>(null);

  const hasToken = !!getToken();

  useEffect(() => {
    if (!error && !promoWarning) return;
    const timer = window.setTimeout(() => {
      setError('');
      setPromoWarning('');
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [error, promoWarning]);

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        setUserCoords(null);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 120000 },
    );
  }, []);

  useEffect(() => {
    setItems(getCartItems()); // Keep this here as it's independent of auth/profile

    if (!hasToken) {
      setLoading(false);
      // Try to load from localStorage for guests
      const saved = localStorage.getItem('yec_checkout_draft');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.location) {
            setLocation(parsed.location);
            if (parsed.location.address) setAddress(parsed.location.address);
          }
        } catch {
          // silent
        }
      }
      return;
    }

    const loadProfile = async () => {
      try {
        setError('');
        const data = await getMyProfile();
        setProfile(data);
        setCustomerName(data.name); // Assuming setName should be setCustomerName
        setPhone(formatPhoneNumber(data.phone || '+998'));
        
        // If profile has address, use it. Otherwise try localStorage
        if (data.address) {
          if (data.lat && data.lng) {
            setLocation({
              lat: Number(data.lat),
              lng: Number(data.lng),
              address: data.address,
              isInTashkent: isInTashkentBounds(Number(data.lat), Number(data.lng)),
              isInUzbekistan: isInUzbekistanBounds(
                Number(data.lat),
                Number(data.lng),
              ),
            });
            setAddress(data.address);
          }
        } else {
             const saved = localStorage.getItem('yec_checkout_draft');
             if (saved) {
               try {
                 const parsed = JSON.parse(saved);
                 if (parsed.location) {
                   setLocation(parsed.location);
                   if (parsed.location.address) setAddress(parsed.location.address);
                 }
               } catch {
                 // silent
               }
             }
        }
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, [hasToken]);

  // Persist to localStorage
  useEffect(() => {
    if (!loading) {
      localStorage.setItem(
        'yec_checkout_draft',
        JSON.stringify({ location }),
      );
    }
  }, [location, loading]);

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const fallbackPricing = useMemo(() => {
    const pricingItems = items.map((item) => {
      const originalUnitPrice = Math.round(Number(item.originalPrice ?? item.price));
      const unitPriceAfterCarpetDiscount = Math.round(Number(item.price));
      const unitPriceAfterPromo = unitPriceAfterCarpetDiscount;
      const lineOriginalTotal = originalUnitPrice * item.quantity;
      const lineAfterCarpetDiscountTotal = unitPriceAfterCarpetDiscount * item.quantity;
      const lineTotal = unitPriceAfterPromo * item.quantity;

      return {
        carpetId: item.carpetId,
        carpetName: item.name,
        quantity: item.quantity,
        originalUnitPrice,
        carpetDiscountPercent: Math.round(Number(item.productDiscountPercent ?? 0)),
        unitPriceAfterCarpetDiscount,
        promoDiscountPercent: 0,
        unitPriceAfterPromo,
        lineOriginalTotal,
        lineAfterCarpetDiscountTotal,
        lineTotal,
        lineProductDiscountAmount: lineOriginalTotal - lineAfterCarpetDiscountTotal,
        linePromoDiscountAmount: 0,
        lineTotalDiscountAmount: lineOriginalTotal - lineTotal,
      };
    });

    const totalOriginalAmount = pricingItems.reduce(
      (sum, item) => sum + item.lineOriginalTotal,
      0,
    );
    const subtotalAfterCarpetDiscount = pricingItems.reduce(
      (sum, item) => sum + item.lineAfterCarpetDiscountTotal,
      0,
    );
    const totalAfterPromo = pricingItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const productDiscountAmount = totalOriginalAmount - subtotalAfterCarpetDiscount;
    const promoDiscountAmount = subtotalAfterCarpetDiscount - totalAfterPromo;
    const totalDiscountAmount = totalOriginalAmount - totalAfterPromo;
    const totalDiscountPercent =
      totalOriginalAmount > 0
        ? Math.round((totalDiscountAmount / totalOriginalAmount) * 10000) / 100
        : 0;

    return {
      items: pricingItems,
      totalOriginalAmount,
      subtotalAfterCarpetDiscount,
      totalAfterPromo,
      productDiscountAmount,
      promoDiscountAmount,
      totalDiscountAmount,
      totalDiscountPercent,
    };
  }, [items]);
  const pricing = promoPreview?.pricing ?? fallbackPricing;
  const total = useMemo(() => pricing.totalAfterPromo, [pricing]);
  const isDeliveryFree = total >= 5000000;
  const isInUzbekistan =
    location?.isInUzbekistan ??
    (location
      ? isInUzbekistanBounds(Number(location.lat), Number(location.lng))
      : true);
  const isTashkent =
    location?.isInTashkent ??
    (location ? isInTashkentBounds(Number(location.lat), Number(location.lng)) : true);

  useEffect(() => {
    if (items.length === 0) {
      setPromoPreview(null);
      setPromoWarning('');
      setPromoChecking(false);
      return;
    }

    const normalizedPromo = promoCode.trim().toUpperCase();
    if (!normalizedPromo) {
      setPromoPreview(null);
      setPromoWarning('');
      setPromoChecking(false);
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        setPromoChecking(true);
        const preview = await previewPromoCode({
          promoCode: normalizedPromo,
          items: items.map((item) => ({
            carpetId: item.carpetId,
            quantity: item.quantity,
          })),
        });
        setPromoPreview(preview);
        setPromoWarning('');
      } catch (err) {
        setPromoPreview(null);
        setPromoWarning('');
      } finally {
        setPromoChecking(false);
      }
    }, 400);

    return () => {
      window.clearTimeout(timer);
    };
  }, [promoCode, items]);

  useEffect(() => {
    const query = address.trim();
    const selectedAddress = (location?.address || '').trim();
    const queryTokens = getQueryTokens(query);

    if (!query || queryTokens.length === 0 || query.length < 2) {
      setAddressSuggestions([]);
      setAddressSearching(false);
      setAddressHint('');
      return;
    }

    if (selectedAddress && selectedAddress.toLowerCase() === query.toLowerCase()) {
      setAddressSuggestions([]);
      setAddressSearching(false);
      setAddressHint('');
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        setAddressSearching(true);
        setAddressHint('');

        const runSearch = async (searchQuery: string, bounded: boolean) => {
          const params = buildSearchParams(searchQuery, userCoords, bounded);
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?${params.toString()}`,
            {
              headers: { Accept: 'application/json' },
              signal: controller.signal,
            },
          );

          if (!response.ok) {
            throw new Error('Address search failed');
          }

          const payload = await response.json();
          return Array.isArray(payload) ? (payload as NominatimSearchResult[]) : [];
        };

        const variants = getSearchVariants(query);
        const nonBaseVariants = userCoords ? variants.slice(1) : variants;
        const requests: Array<Promise<NominatimSearchResult[]>> = nonBaseVariants.map((variant) =>
          runSearch(variant, false),
        );

        if (userCoords) {
          requests.unshift(runSearch(query, true));
        }

        const results = await Promise.all(requests);
        const flattened = results.flat();
        const normalizedQuery = normalizeSearchText(query);
        const deduped = new Map<string, AddressSuggestion>();

        flattened.forEach((item) => {
          const id = String(item.place_id || '');
          if (!id) return;

          const label = (item.display_name || '').trim();
          if (!label) return;

          const names = [
            label,
            item.name || '',
            ...Object.values(item.namedetails || {}),
            item.type || '',
            item.class || '',
          ];
          const searchableText = normalizeSearchText(names.join(' '));
          const matchedTokenCount = queryTokens.filter((token) =>
            searchableText.includes(token),
          ).length;
          const includesFullQuery = searchableText.includes(normalizedQuery);
          if (!includesFullQuery && matchedTokenCount === 0) return;

          const matchScore =
            (includesFullQuery ? 60 : 0) +
            matchedTokenCount * 20 +
            ((item.importance || 0) * 10) +
            (/(neighbourhood|suburb|quarter|residential|district)/.test(
              `${item.class || ''} ${item.type || ''}`.toLowerCase(),
            )
              ? 12
              : 0) +
            (/(shop|amenity|market|restaurant|cafe|supermarket)/.test(
              `${item.class || ''} ${item.type || ''}`.toLowerCase(),
            )
              ? 10
              : 0);

          const lat = Number(item.lat);
          const lng = Number(item.lon);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

          const inBoundsUz = isInUzbekistanBounds(lat, lng);
          const inAddressUz = isAddressInUzbekistan(item.address);
          const isInUzbekistan = inAddressUz || inBoundsUz;
          if (!isInUzbekistan) return;

          const isInTashkent =
            isInTashkentBounds(lat, lng) &&
            (item.address ? isAddressInTashkent(item.address) : true);
          const distanceKm = userCoords ? distanceInKm(userCoords, { lat, lng }) : null;

          const suggestion: AddressSuggestion = {
            id,
            label,
            lat,
            lng,
            isInTashkent,
            isInUzbekistan,
            distanceKm,
            matchScore,
          };

          const current = deduped.get(id);
          if (!current) {
            deduped.set(id, suggestion);
            return;
          }

          const currentDistance = current.distanceKm ?? Number.POSITIVE_INFINITY;
          const nextDistance = suggestion.distanceKm ?? Number.POSITIVE_INFINITY;
          if (
            nextDistance < currentDistance ||
            (Math.abs(nextDistance - currentDistance) < 0.05 &&
              suggestion.matchScore > current.matchScore)
          ) {
            deduped.set(id, suggestion);
          }
        });

        const suggestions = Array.from(deduped.values())
          .sort((a, b) => {
            const aDistance = a.distanceKm ?? Number.POSITIVE_INFINITY;
            const bDistance = b.distanceKm ?? Number.POSITIVE_INFINITY;
            if (aDistance !== bDistance) return aDistance - bDistance;
            if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
            return a.label.localeCompare(b.label, 'uz');
          })
          .slice(0, 10);

        setAddressSuggestions(suggestions);
        if (suggestions.length === 0) {
          setAddressHint(
            "Mos manzil topilmadi. Mahalla, kvartal, ko'cha yoki do'kon nomini aniqroq yozib ko'ring.",
          );
        }
      } catch {
        if (controller.signal.aborted) return;
        setAddressSuggestions([]);
        setAddressHint(
          "Manzilni qidirishda xatolik bo'ldi. Qayta yozib ko'ring yoki xaritadan tanlang.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setAddressSearching(false);
        }
      }
    }, 350);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [address, location?.address, userCoords]);

  const handleAddressInputChange = (value: string) => {
    setAddress(value);
    setError('');
    setAddressHint('');

    if (location && value.trim() !== (location.address || '').trim()) {
      setLocation(null);
    }
  };

  const handleAddressSuggestionSelect = (suggestion: AddressSuggestion) => {
    const nextLocation: LocationValue = {
      lat: suggestion.lat,
      lng: suggestion.lng,
      address: suggestion.label,
      isInTashkent: suggestion.isInTashkent,
      isInUzbekistan: suggestion.isInUzbekistan,
    };

    setLocation(nextLocation);
    setAddress(suggestion.label);
    setAddressSuggestions([]);
    setAddressHint('');
    setError('');
  };

  const handleUseProfileAddress = () => {
    if (profile?.address && profile?.lat && profile?.lng) {
      setLocation({
        lat: Number(profile.lat),
        lng: Number(profile.lng),
        address: profile.address,
        isInTashkent: isInTashkentBounds(
          Number(profile.lat),
          Number(profile.lng),
        ),
        isInUzbekistan: isInUzbekistanBounds(
          Number(profile.lat),
          Number(profile.lng),
        ),
      });
      setAddress(profile.address);
      setAddressSuggestions([]);
      setAddressHint('');
      setError('');
      return;
    }

    setError("Profil manzilingiz xarita lokatsiyasi bilan saqlanmagan.");
  };

  const submit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    
    if (items.length === 0) {
      setError("Savat bo'sh.");
      return;
    }
    if (!customerName.trim()) {
      setError('Ismni kiriting.');
      return;
    }
    if (!payment) {
      setError("To'lov turini tanlang.");
      return;
    }
    if (!location || !Number.isFinite(location.lat) || !Number.isFinite(location.lng)) {
      setError("Manzilni yozib ro'yxatdan tanlang yoki xaritada belgilang.");
      return;
    }
    const selectedAddress = (location.address || '').trim();
    if (!selectedAddress) {
      setError('Xaritadan manzilni tanlang.');
      return;
    }
    if (!isInUzbekistan) {
      setError(
        "Tanlangan manzil O'zbekiston hududidan tashqarida. Buyurtma berib bo'lmaydi.",
      );
      return;
    }
    if (!profile?.isTelegramLinked) {
      setError(
        "Buyurtma berishdan oldin Telegram botga kirib hisobingizni tasdiqlang.",
      );
      return;
    }
    const normalizedPhone = normalizePhoneNumber(phone);
    if (!UZ_PHONE_REGEX.test(normalizedPhone)) {
      setError("Asosiy telefon raqamni to'liq kiriting.");
      return;
    }
    const normalizedPhone2 = normalizePhoneNumber(phone2);
    if (!UZ_PHONE_REGEX.test(normalizedPhone2)) {
      setError("Qo'shimcha telefon raqamni to'liq kiriting.");
      return;
    }

    if (normalizedPhone === normalizedPhone2) {
      setError("Ikkinchi telefon raqami birinchisi bilan bir xil bo'lmasligi kerak.");
      return;
    }

    // Validation for special delivery conditions
    if (!showConfirmModal && (!isTashkent || !isDeliveryFree)) {
      setShowConfirmModal(true);
      return;
    }

    setError('');
    setPromoWarning('');

    try {
      setLoading(true);
      const normalizedPromo = promoCode.trim().toUpperCase();
      if (normalizedPromo) {
        setPromoChecking(true);
        const preview = await previewPromoCode({
          promoCode: normalizedPromo,
          items: items.map((item) => ({
            carpetId: item.carpetId,
            quantity: item.quantity,
          })),
        });
        setPromoPreview(preview);
        setPromoChecking(false);
        if (preview.state === 'invalid') {
          setError(preview.message);
          return;
        }
      }

      await createOrder({
        customerName,
        phone: normalizedPhone,
        phone2: normalizedPhone2,
        address: selectedAddress,
        locationLat: location.lat,
        locationLng: location.lng,
        locationText: selectedAddress,
        paymentMethod: payment,
        comment,
        promoCode: normalizedPromo || undefined,
        items: items.map((item) => ({
          carpetId: item.carpetId,
          quantity: item.quantity,
        })),
      });
      try {
        const { clearCarpetsCache } = await import('@/services/carpet.service');
        clearCarpetsCache();
      } catch {
        // ignore cache clear errors
      }
      clearCart();
      try {
        const { subscribeUserToPush } = await import('@/services/notification.service');
        await subscribeUserToPush();
      } catch (e) {
        console.warn('Failed to subscribe to notifications', e);
      }
      router.push('/orders');
    } catch (err) {
      setPromoWarning('');
      setError(getErrorMessage(err));
    } finally {
      setPromoChecking(false);
      setLoading(false);
      setShowConfirmModal(false);
    }
  };

  const hasProfileAddress = Boolean(profile?.address);
  const isTelegramLinked = Boolean(profile?.isTelegramLinked);
  const canSubmitOrder =
    isTelegramLinked &&
    Boolean(location) &&
    !loading &&
    !promoChecking &&
    !telegramChecking;
  const telegramBotUrl = useMemo(
    () => buildTelegramJoinUrl(TELEGRAM_BOT_BASE_URL, profile?.telegramJoinToken),
    [profile?.telegramJoinToken],
  );

  const refreshTelegramStatus = async () => {
    try {
      setTelegramChecking(true);
      const data = await getMyProfile();
      setProfile(data);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setTelegramChecking(false);
    }
  };
  const pricingItemMap = useMemo(
    () => new Map(pricing.items.map((item) => [item.carpetId, item])),
    [pricing.items],
  );
  const promoGiftImage =
    promoPreview?.state === 'valid' && promoPreview.promo?.type === 'GIFT'
      ? getImageUrl(promoPreview.promo.giftImage ?? undefined) ??
        promoPreview.promo.giftImage ??
        ''
      : '';

  if (!hasToken) {
    return (
      <div className="section-shell py-8">
        <div className="panel p-6">
          <p className="text-sm text-ink/70">Rasmiylashtirish uchun tizimga kiring.</p>
          <Link href="/login" className="btn-primary mt-3 inline-block">
            Kirish
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="section-shell py-8">
        <div className="panel p-6">
          <p className="text-sm text-ink/70">Savat bo&apos;sh. Avval gilam tanlang.</p>
          <Link href="/carpets" className="btn-primary mt-3 inline-block">
            Gilamlarni ko&apos;rish
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="section-shell py-10">
      <div className="relative overflow-hidden rounded-[2.5rem] border border-sky-200/70 bg-[radial-gradient(circle_at_top,_rgba(125,211,252,0.32),_transparent_60%),linear-gradient(120deg,#0f172a,#0b1e3a)] px-8 py-10 text-white shadow-[0_40px_140px_rgba(15,23,42,0.45)]">
        <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-cyan-400/25 blur-3xl" />
        <div className="absolute -bottom-28 left-0 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
        <p className="text-xs font-bold uppercase tracking-[0.4em] text-sky-200">Buyurtma</p>
        <h1 className="mt-3 font-serif text-4xl md:text-5xl">Buyurtmani rejalashtirish</h1>
        <p className="mt-4 max-w-2xl text-sm text-sky-100/80">
          Buyurtma tafsilotlarini kiriting va buyurtmangizni tasdiqlang.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-wider text-sky-100/80">
          <span className="rounded-full border border-sky-200/40 bg-white/10 px-4 py-1">{itemCount} ta mahsulot</span>
          <span className="rounded-full border border-sky-200/40 bg-white/10 px-4 py-1">Ishonchli yetkazib berish</span>
        </div>
      </div>

      <form noValidate onSubmit={(e) => submit(e)} className="mt-8 grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
        <section className="relative overflow-hidden rounded-[2rem] border border-sky-200/80 bg-[radial-gradient(circle_at_top,_rgba(186,230,253,0.45),_transparent_55%),linear-gradient(135deg,#f8fbff,#e0f2fe,#eff6ff)] p-6 shadow-[0_35px_90px_rgba(14,116,144,0.22)]">
          <div className="absolute -top-16 -right-10 h-40 w-40 rounded-full bg-sky-300/40 blur-3xl" />
          <div className="absolute -bottom-20 left-0 h-48 w-48 rounded-full bg-blue-500/25 blur-3xl" />
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-sky-600">Buyurtma</p>
                <h2 className="mt-2 font-serif text-2xl text-ink">Buyurtma ma&apos;lumotlari</h2>
              </div>
              <Link
                href="/cart"
                className="group inline-flex items-center gap-2 rounded-xl bg-sky-100/80 px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.15em] text-sky-700 shadow-sm transition-all hover:bg-sky-200 hover:text-sky-900 active:scale-95"
              >
                <motion.span 
                  animate={{ x: [0, -4, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                  className="inline-block"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </motion.span>
                Savatga qaytish
              </Link>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <input
                className="input-field"
                placeholder="Ism"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
              <input
                type="text"
                inputMode="numeric"
                autoComplete="tel-national"
                pattern="[0-9+\\- ]*"
                className="input-field"
                placeholder="Telefon"
                value={phone}
                onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                maxLength={17}
                required
              />
               <input
                type="text"
                inputMode="numeric"
                autoComplete="tel-national"
                pattern="[0-9+\\- ]*"
                className="input-field"
                placeholder="Qo&apos;shimcha telefon"
                value={phone2}
                onChange={(e) => setPhone2(formatPhoneNumber(e.target.value))}
                maxLength={17}
                required
              />
            </div>

            {/* Address section */}
            <div className="rounded-2xl border border-sky-100/80 bg-white/80 p-5 shadow-[0_18px_45px_rgba(14,116,144,0.15)] space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-serif text-xl text-ink">Yetkazib berish manzili</h3>
                {hasProfileAddress && (
                  <button
                    type="button"
                    onClick={handleUseProfileAddress}
                    className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 transition hover:bg-emerald-100 active:scale-95"
                  >
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile manzili
                  </button>
                )}
              </div>

              {/* Text address */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    className="input-field flex-1"
                    placeholder="Manzilni yozing yoki xaritadan tanlang"
                    value={address}
                    onChange={(e) => handleAddressInputChange(e.target.value)}
                    autoComplete="street-address"
                  />
                </div>
                {addressSearching ? (
                  <p className="text-[11px] font-semibold text-sky-700">Manzil qidirilmoqda...</p>
                ) : null}
                {addressSuggestions.length > 0 ? (
                  <div className="max-h-56 overflow-auto rounded-xl border border-sky-100 bg-white shadow-sm">
                    {addressSuggestions.map((suggestion, index) => (
                      <button
                        key={suggestion.id}
                        type="button"
                        onClick={() => handleAddressSuggestionSelect(suggestion)}
                        className="flex w-full items-start justify-between gap-2 border-b border-sky-50 px-3 py-2 text-left last:border-b-0 hover:bg-sky-50"
                      >
                        <span className="text-xs text-ink/90">{suggestion.label}</span>
                        <div className="shrink-0 text-right">
                          {index === 0 && suggestion.distanceKm !== null ? (
                            <p className="text-[10px] font-bold text-emerald-700">Eng yaqin</p>
                          ) : null}
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                              suggestion.isInTashkent
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {suggestion.isInTashkent ? 'Toshkent' : "O'zbekiston"}
                          </span>
                          <p className="mt-1 text-[10px] font-semibold text-sky-700">
                            {suggestion.distanceKm === null
                              ? "Masofa yo'q"
                              : `${suggestion.distanceKm.toFixed(1)} km`}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : null}
                {!addressSearching && addressHint ? (
                  <p className="text-[11px] font-semibold text-red-600">{addressHint}</p>
                ) : null}
                {address.trim().length > 0 && !location ? (
                  <p className="text-[11px] font-semibold text-amber-700">
                    Kiritilgan manzil hali tasdiqlanmagan. Ro&apos;yxatdan birini tanlang yoki xaritadan belgilang.
                  </p>
                ) : null}
              </div>

              {/* Delivery Warnings */}
              {!isInUzbekistan && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 flex items-start gap-2 animate-in fade-in slide-in-from-left-2 transition-all">
                   <svg className="h-4 w-4 text-red-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-7.938 4h15.876c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L2.34 16c-.77 1.333.192 3 1.732 3z" />
                   </svg>
                   <p className="text-xs font-bold text-red-700">Tanlangan manzil O&apos;zbekiston hududidan tashqarida. Buyurtma berib bo&apos;lmaydi.</p>
                </div>
              )}

              {isInUzbekistan && !isTashkent && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 flex items-start gap-2 animate-in fade-in slide-in-from-left-2 transition-all">
                   <svg className="h-4 w-4 text-red-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                   </svg>
                   <p className="text-xs font-bold text-red-700">Dastavka xizmati faqat Toshkent shahri ichida mavjud.</p>
                </div>
              )}

              {!isDeliveryFree && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 flex items-start gap-2 animate-in fade-in slide-in-from-left-2 transition-all">
                   <svg className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                   </svg>
                   <p className="text-xs font-bold text-amber-700">Dastavka faqat 5 000 000 so&apos;mdan oshsa bepul mavjud.</p>
                </div>
              )}

              {/* Map picker */}
              <div className="animate-in fade-in duration-500 space-y-3">
                <p className="text-sm font-semibold text-ink">Xaritadan tanlang</p>
                <LocationPicker
                  value={location?.lat ? location : null}
                  onChange={(next) => {
                    setLocation(next);
                    if (next?.address) {
                      setAddress(next.address);
                    }
                    setAddressSuggestions([]);
                    setAddressHint('');
                  }}
                  showWarning={true}
                  showActionButton={true}
                />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <select
                className="input-field md:col-span-1 !h-11 !py-2 !px-3 !text-sm"
                value={payment}
                onChange={(e) => setPayment(e.target.value as '' | 'CASH' | 'CARD')}
              >
                <option value="" disabled hidden>
                  To&apos;lov turini tanlang
                </option>
                <option value="CASH">Naqd</option>
                <option value="CARD">Karta</option>
              </select>
              <div className="md:col-span-1">
                <input
                  className="input-field"
                  placeholder="Promokod (ixtiyoriy)"
                  value={promoCode}
                  onChange={(e) => {
                    setPromoCode(e.target.value.toUpperCase());
                  }}
                  maxLength={30}
                />
                <p className="mt-1 text-[11px] text-ink/60">
                  Har bir promokoddan faqat 1 marta foydalanish mumkin.
                </p>
                {promoChecking ? (
                  <p className="mt-1 text-[11px] font-semibold text-sky-700">
                    Promokod tekshirilmoqda...
                  </p>
                ) : null}
                {promoPreview?.state === 'valid' ? (
                  <p className="mt-1 text-[11px] font-semibold text-emerald-700">
                    {promoPreview.message}
                  </p>
                ) : null}
              </div>
              <textarea
                className="input-field md:col-span-1"
                placeholder="Izoh (ixtiyoriy)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
              />
            </div>

          </div>
        </section>

        <aside className="space-y-4">
          <div className="relative overflow-hidden rounded-[2rem] border border-sky-200/80 bg-[radial-gradient(circle_at_top,_rgba(147,197,253,0.35),_transparent_60%),linear-gradient(140deg,#f8fafc,#e0f2fe)] p-5 shadow-[0_35px_90px_rgba(14,116,144,0.2)]">
            <div className="absolute -top-14 -left-8 h-36 w-36 rounded-full bg-sky-200/50 blur-3xl" />
            <div className="absolute -bottom-20 right-0 h-44 w-44 rounded-full bg-blue-400/25 blur-3xl" />
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-sky-600">Savat</p>
                  <h3 className="mt-2 font-serif text-xl text-ink">Tanlangan gilamlar</h3>
                </div>
                <span className="rounded-full bg-sky-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-700">
                  {itemCount} ta
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {items.map((item) => {
                  const pricingItem = pricingItemMap.get(item.carpetId);
                  const originalLine = pricingItem?.lineOriginalTotal ?? item.price * item.quantity;
                  const productDiscountLine =
                    pricingItem?.lineAfterCarpetDiscountTotal ??
                    item.price * item.quantity;
                  const finalLine = pricingItem?.lineTotal ?? item.price * item.quantity;
                  const hasProductDiscount = originalLine > productDiscountLine;
                  const hasPromoDiscount = productDiscountLine > finalLine;

                  return (
                    <div key={item.carpetId} className="flex items-center gap-3">
                      <div className="h-14 w-16 overflow-hidden rounded-xl border border-black/5 bg-white shadow-sm">
                        <img
                          src={item.image || placeholder}
                          alt={item.name}
                          className="h-full w-full object-contain"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-ink">{item.name}</p>
                        <p className="text-xs text-ink/60">{item.material || '-'} | {item.size || '-'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-ink/60">x{item.quantity}</p>
                        {hasProductDiscount || hasPromoDiscount ? (
                          <div className="space-y-0.5">
                            <p className="text-[11px] font-semibold text-ink/40 line-through decoration-red-400">
                              {formatPrice(originalLine)}
                            </p>
                            {hasPromoDiscount ? (
                              <p className="text-[11px] font-semibold text-ink/45 line-through decoration-red-400">
                                {formatPrice(productDiscountLine)}
                              </p>
                            ) : null}
                            <p className="text-sm font-bold text-amber-600">
                              {formatPrice(finalLine)}
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm font-semibold text-ink">
                            {formatPrice(finalLine)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {promoPreview?.state === 'valid' &&
              promoPreview.promo?.type === 'GIFT' ? (
                <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-amber-700">
                    Sovg&apos;a gilamcha
                  </p>
                  <p className="mt-1 text-sm font-semibold text-amber-900">
                    {promoPreview.promo.giftName || 'Gilamcha'}
                  </p>
                  <p className="text-xs text-amber-800/80">
                    Narxi: {formatPrice(promoPreview.promo.giftPrice ?? 0)}
                  </p>
                  {promoGiftImage ? (
                    <div className="mt-3 overflow-hidden rounded-xl border border-amber-200 bg-white">
                      <img
                        src={promoGiftImage}
                        alt={promoPreview.promo.giftName || 'Sovg&apos;a gilamcha'}
                        className="h-44 w-full object-contain"
                      />
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-[2rem] border border-sky-200/80 bg-white/90 p-5 shadow-[0_30px_80px_rgba(14,116,144,0.2)]">
            <div className="flex items-center justify-between text-sm text-ink/70">
              <span>Mahsulotlar:</span>
              <span>{itemCount} ta</span>
            </div>
            {pricing.totalDiscountAmount > 0 ? (
              <>
                <div className="mt-3 flex items-center justify-between text-sm text-ink/70">
                  <span>Asl summa:</span>
                  <span className="line-through decoration-red-500">
                    {formatPrice(pricing.totalOriginalAmount)}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm text-ink/70">
                  <span>Skidka:</span>
                  <span className="font-semibold text-emerald-700">
                    -{formatPrice(pricing.totalDiscountAmount)}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm text-ink/70">
                  <span>Umumiy foiz:</span>
                  <span className="font-semibold text-amber-600">
                    {pricing.totalDiscountPercent.toFixed(2)}%
                  </span>
                </div>
              </>
            ) : null}
            <div className="mt-3 flex items-end justify-between border-t border-black/5 pt-3">
              <span className="text-sm font-medium">Jami:</span>
              <span className={`text-3xl font-bold ${pricing.totalDiscountAmount > 0 ? 'text-amber-500' : 'text-terracotta'}`}>
                {formatPrice(total)}
              </span>
            </div>
          </div>

          <div
            className={`rounded-[2rem] border p-5 shadow-[0_20px_55px_rgba(14,116,144,0.15)] ${
              isTelegramLinked
                ? 'border-emerald-200 bg-emerald-50/80'
                : 'border-red-200 bg-red-50/85'
            }`}
          >
            <p
              className={`text-[11px] font-bold uppercase tracking-[0.25em] ${
                isTelegramLinked ? 'text-emerald-700' : 'text-red-700'
              }`}
            >
              Telegram tekshiruvi
            </p>
            <p className="mt-2 text-sm font-semibold text-ink">
              {isTelegramLinked
                ? "Hisobingiz botga ulangan. Buyurtma berishingiz mumkin."
                : "Buyurtma uchun botga kirib hisobingizni tasdiqlang."}
            </p>
            {!isTelegramLinked ? (
              <p className="mt-1 text-xs text-ink/70">
                Botga kirish tugmasini bosing va ochilgan botda `/start` ni yuboring.
              </p>
            ) : null}
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <a
                href={telegramBotUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#229ED9] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[#1c8cc2] active:scale-95"
              >
                Botga kirish
              </a>
              <button
                type="button"
                onClick={() => void refreshTelegramStatus()}
                disabled={telegramChecking}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-ink/75 transition hover:bg-ink/5 disabled:opacity-60"
              >
                {telegramChecking ? 'Tekshirilmoqda...' : 'Holatni yangilash'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary w-full py-5 text-lg shadow-[0_20px_50px_rgba(56,189,248,0.35)] hover:shadow-[0_25px_60px_rgba(56,189,248,0.45)] transition-all hover:-translate-y-1 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={!canSubmitOrder}
          >
            {!isTelegramLinked
              ? "Avval botga ulaning"
              : loading || promoChecking || telegramChecking
                ? 'Yuborilmoqda...'
                : 'Buyurtmani tasdiqlash'}
          </button>
        </aside>
      </form>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="w-full max-w-lg overflow-hidden rounded-[3rem] bg-white border border-white/60 shadow-[0_40px_100px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-300">
              <div className="relative h-3 w-full bg-gradient-to-r from-amber-400 via-sky-400 to-emerald-400" />
              <div className="p-8">
                 <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mb-6">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                 </div>
                 <h4 className="font-serif text-3xl text-ink">Maxsus shartlar</h4>
                 <p className="mt-4 text-ink/70 leading-relaxed text-lg">
                    Bizning yetkazib berish xizmatimiz faqat **Toshkent shahri ichida** va **5 000 000 so&apos;mdan yuqori** buyurtmalar uchun bepul amalga oshiriladi.
                 </p>
                 <div className="mt-4 p-4 rounded-2xl bg-sky-50 border border-sky-100 italic text-sky-800 text-sm">
                    Agar baribir buyurtma qilmoqchi bo&apos;lsangiz, administratorlarimiz siz bilan bog&apos;lanadi va yetkazib berish narxini alohida kelishishingiz mumkin bo&apos;ladi.
                 </div>
                 
                 <div className="mt-8 flex flex-col gap-3">
                    <button 
                      onClick={() => submit()}
                      disabled={loading || promoChecking}
                      className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-bold text-lg shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-600 hover:-translate-y-1 active:scale-95"
                    >
                      {loading || promoChecking ? 'Yuborilmoqda...' : 'Roziman'}
                    </button>
                    <button 
                      onClick={() => setShowConfirmModal(false)}
                      className="w-full py-4 rounded-2xl bg-red-50 text-red-600 font-bold transition hover:bg-red-100"
                    >
                      Bekor qilish
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {(error || promoWarning) ? (
        <div className="pointer-events-none fixed right-4 top-4 z-[11000]">
          <div
            role="alert"
            aria-live="polite"
            className="max-w-sm rounded-xl border border-red-200 bg-red-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_45px_rgba(239,68,68,0.45)] animate-in fade-in slide-in-from-top-3 duration-300"
          >
            {error || promoWarning}
          </div>
        </div>
      ) : null}
    </div>
  );
}
