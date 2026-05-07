'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

export type LocationValue = {
  lat: number;
  lng: number;
  address: string;
  isInTashkent: boolean;
  isInUzbekistan: boolean;
};

const TASHKENT_CENTER = { lat: 41.311081, lng: 69.279723 };

// Expanded bounds for Tashkent
const isInBounds = (lat: number, lng: number) =>
  lat >= 41.1 && lat <= 41.45 && lng >= 69.1 && lng <= 69.45;

const isInUzbekistanBounds = (lat: number, lng: number) =>
  lat >= 37.17 && lat <= 45.59 && lng >= 55.99 && lng <= 73.15;

const isAddressTashkent = (address: Record<string, unknown>) => {
  const pick = (key: string) => {
    const value = address[key];
    return typeof value === 'string' ? value.toLowerCase() : '';
  };

  const fields = [
    pick('city'),
    pick('town'),
    pick('municipality'),
    pick('city_district'),
    pick('county'),
    pick('state'),
    pick('state_district'),
  ]
    .filter(Boolean)
    .join(' ');

  return fields.includes('tashkent') || fields.includes('toshkent');
};

const isAddressUzbekistan = (address: Record<string, unknown>) => {
  const pick = (key: string) => {
    const value = address[key];
    return typeof value === 'string' ? value.toLowerCase() : '';
  };

  const countryCode = pick('country_code');
  const country = pick('country');
  const state = pick('state');

  if (countryCode) return countryCode === 'uz';

  const joined = [country, state].filter(Boolean).join(' ');
  return joined.includes('uzbekistan') || joined.includes("o'zbekiston");
};

type Props = {
  value: LocationValue | null;
  onChange: (value: LocationValue | null) => void;
  showWarning?: boolean;
  showActionButton?: boolean;
};

export default function LocationPicker({ 
  value, 
  onChange, 
  showWarning = true,
  showActionButton = false 
}: Props) {
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const fullScreenMapContainerRef = useRef<HTMLDivElement>(null);

  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('Manzilni xaritadan tanlang.');
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Stability Refs to avoid stale closures in Leaflet events
  const onChangeRef = useRef(onChange);
  const loadingRef = useRef(loading);
  const readyRef = useRef(ready);

  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
  useEffect(() => { loadingRef.current = loading; }, [loading]);
  useEffect(() => { readyRef.current = ready; }, [ready]);

  const applyMarker = (lat: number, lng: number, map: any) => {
    const L = (window as any).L;
    if (!L || !map) return null;

    const customIcon = L.divIcon({
      className: 'custom-yandex-marker',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-10 h-10 bg-white rounded-full shadow-lg border border-white/50 flex items-center justify-center">
             <div class="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
             </div>
          </div>
          <div class="absolute -bottom-1 w-2 h-2 bg-red-500 rotate-45 transform"></div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    if (markerRef.current) {
      if (markerRef.current._map !== map) {
        markerRef.current.remove();
        markerRef.current = L.marker([lat, lng], { icon: customIcon }).addTo(map);
      } else {
        markerRef.current.setLatLng([lat, lng]);
      }
    } else {
      markerRef.current = L.marker([lat, lng], { icon: customIcon }).addTo(map);
    }

    // Refresh tooltip on every move
    markerRef.current.unbindTooltip();
    markerRef.current.bindTooltip(`
      <div class="flex items-center gap-2 p-1">
        <span class="font-bold text-[11px] whitespace-nowrap">Sizning manzilingiz</span>
      </div>
    `, {
      permanent: true,
      direction: 'right',
      className: 'yandex-label-tooltip',
      offset: [24, 0]
    });

    return markerRef.current;
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));
    if (!response.ok) {
      throw new Error('Geocoding failed');
    }
    return response.json();
  };

  const selectLocation = async (lat: number, lng: number, targetMap: any, silent = false) => {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    if (!silent) {
      setLoading(true);
      setMessage('Manzil tekshirilmoqda...');
    }

    try {
      if (targetMap) {
        applyMarker(lat, lng, targetMap);
        targetMap.setView([lat, lng], 17);
      }

      let addressText = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      let inUzbekistan = isInUzbekistanBounds(lat, lng);
      let inTashkent = isInBounds(lat, lng);

      try {
        const data = await reverseGeocode(lat, lng);
        if (data?.display_name) addressText = data.display_name;
        if (data?.address) {
          inUzbekistan = isAddressUzbekistan(data.address);
          inTashkent = inUzbekistan && inTashkent && isAddressTashkent(data.address);
        } else {
          inTashkent = inUzbekistan && inTashkent;
        }
      } catch {
        inTashkent = inUzbekistan && inTashkent;
      }

      if (onChangeRef.current) {
        onChangeRef.current({
          lat,
          lng,
          address: addressText,
          isInTashkent: inTashkent,
          isInUzbekistan: inUzbekistan,
        });
      }

      if (!silent) {
        setMessage(
          !inUzbekistan
            ? "Tanlangan manzil O'zbekiston hududidan tashqarida."
            : inTashkent
              ? "Toshkent shahri ichida. Manzil qabul qilindi."
              : "Toshkent shahri tashqarisida. Yuk tashish kelishiladi.",
        );
      }
    } catch {
      if (!silent) setMessage("Manzilni aniqlab bo'lmadi. Qayta urinib ko'ring.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setMessage("Brauzer lokatsiyani qo'llab-quvvatlamaydi.");
      return;
    }
    if (loadingRef.current) return;
    
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        void selectLocation(pos.coords.latitude, pos.coords.longitude, mapRef.current);
      },
      () => {
        setLoading(false);
        setMessage("Lokatsiyani olishda xatolik yuz berdi.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  useEffect(() => {
    if (!ready || !mapContainerRef.current) return;

    const L = (window as any).L;
    if (!L) return;

    // Destroy existing map if any
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const targetContainer = isFullScreen ? fullScreenMapContainerRef.current : mapContainerRef.current;
    if (!targetContainer) return;

    const map = L.map(targetContainer, {
      zoomControl: false,
      attributionControl: false,
      tap: false, // Prevents lag on mobile touch
      touchZoom: true,
      bounceAtZoomLimits: false,
      zoomAnimation: true,
      markerZoomAnimation: true,
      inertia: true,
      inertiaResistance: 4000,
    }).setView(
      value ? [value.lat, value.lng] : [TASHKENT_CENTER.lat, TASHKENT_CENTER.lng],
      value ? 17 : 12,
    );

    const voyagerLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 20
    });
    voyagerLayer.addTo(map);

    const googleStreets = L.tileLayer('http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    });

    const googleHybrid = L.tileLayer('http://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    });

    L.control.layers(
      {
        "Toza xarita (Yandex look)": voyagerLayer,
        "Google Xarita": googleStreets,
        "Google Yo'ldosh": googleHybrid,
      },
      undefined,
      { position: 'topleft' }
    ).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    map.on('click', (event: any) => {
      const { lat, lng } = event.latlng;
      void selectLocation(lat, lng, map);
    });

    if (value) {
      applyMarker(value.lat, value.lng, map);
    }

    mapRef.current = map;

    // Small delay to ensure container is fully rendered
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      clearTimeout(timer);
      if (mapRef.current === map) {
        map.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [ready, isFullScreen]);

  useEffect(() => {
    if (!ready || !mapRef.current || !value) return;

    applyMarker(value.lat, value.lng, mapRef.current);
    mapRef.current.setView([value.lat, value.lng], 17);
  }, [ready, value?.lat, value?.lng]);

  return (
    <div className="space-y-4">
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />
      <style>{`
        .yandex-label-tooltip {
          background: white !important;
          border: none !important;
          box-shadow: 0 4px 15px rgba(0,0,0,0.15) !important;
          border-radius: 8px !important;
          padding: 4px 8px !important;
          color: #333 !important;
          font-family: inherit !important;
        }
        .yandex-label-tooltip:before {
          border-right-color: white !important;
        }
        .leaflet-tooltip-right:before {
          left: -10px !important;
          border-right-color: white !important;
        }
        .custom-yandex-marker {
          background: none !important;
          border: none !important;
        }
        .leaflet-container {
          cursor: crosshair !important;
          touch-action: none !important; /* Prevents browser intercepting touch */
        }
      `}</style>
      <Script
        src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        onLoad={() => setReady(true)}
        strategy="afterInteractive"
      />

      <div className="group relative overflow-hidden rounded-3xl border border-black/5 bg-sand/20 shadow-[0_15px_40px_rgba(0,0,0,0.05)] transition-all hover:border-black/10">
        <div ref={mapContainerRef} className="h-64 w-full md:h-80" />
        
        <div className="absolute inset-x-0 bottom-0 p-4 pointer-events-none z-[1000]">
          <div className="flex justify-between items-end gap-3">
            <div className="max-w-[70%] pointer-events-auto rounded-2xl bg-white/95 p-3 shadow-2xl backdrop-blur-md border border-white/20">
              <p className="text-[10px] font-bold uppercase tracking-widest text-ink/40 mb-1">Manzil</p>
              <p className="text-[11px] font-bold text-ink line-clamp-2 leading-relaxed">
                {loading ? 'Aniqlanmoqda...' : value?.address || 'Manzil tanlanmagan'}
              </p>
            </div>

            <div className="flex flex-col gap-2 pointer-events-auto">
              {/* My Location Button */}
              <button
                type="button"
                onClick={handleUseMyLocation}
                className="flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500 text-white shadow-xl shadow-emerald-500/40 transition-all hover:bg-emerald-600 hover:scale-110 active:scale-95 shadow-[0_10px_25px_rgba(16,185,129,0.4)]"
                title="Mening lokatsiyam"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              
              {/* Maximize Button */}
              <button
                type="button"
                onClick={() => setIsFullScreen(true)}
                className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary text-white shadow-xl shadow-primary/30 transition-all hover:bg-primary/90 hover:scale-110 active:scale-95 shadow-[0_10px_25px_rgba(56,189,248,0.4)]"
                title="Kattalashtirish"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {showActionButton && (
        <button
          type="button"
          onClick={handleUseMyLocation}
          className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-emerald-200 bg-emerald-50 py-4 text-sm font-bold text-emerald-700 transition-all hover:bg-emerald-100 hover:border-emerald-300 active:scale-95 shadow-sm"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Mening joriy joylashuvimni aniqlash
        </button>
      )}

      {showWarning && value && value.isInUzbekistan === false && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300 rounded-2xl bg-red-50 border border-red-200 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-100 rounded-lg text-red-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-7.938 4h15.876c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L2.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-red-900">Xatolik</p>
              <p className="text-xs text-red-800/85 mt-0.5 leading-relaxed">
                Tanlangan manzil O&apos;zbekiston hududidan tashqarida. Buyurtma berish uchun O&apos;zbekiston ichidagi manzilni tanlang.
              </p>
            </div>
          </div>
        </div>
      )}

      {showWarning && value && value.isInUzbekistan !== false && !value.isInTashkent && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300 rounded-2xl bg-amber-50 border border-amber-200 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-amber-900">Diqqat!</p>
              <p className="text-xs text-amber-800/80 mt-0.5 leading-relaxed">
                Tanlangan manzil Toshkent shahri tashqarisida. Bu xududga tekin dastavkamiz hozircha yo&apos;q.
                Adminlarimiz siz bilan bog&apos;lanib yetkazib berish narxini kelishishadi.
              </p>
            </div>
          </div>
        </div>
      )}

      {isFullScreen && (
        <div className="fixed inset-0 z-[3000] flex flex-col bg-white animate-in fade-in duration-300">
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <div>
              <h3 className="text-lg font-serif font-bold text-ink">Manzilni tanlang</h3>
              <p className="text-xs text-ink/60">Xarita ustiga bosing</p>
            </div>
            <button
              onClick={() => setIsFullScreen(false)}
              className="p-2 rounded-full hover:bg-black/5 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="relative flex-1 bg-sand/10">
            <div ref={fullScreenMapContainerRef} className="absolute inset-0" />
            
            <div className="absolute top-4 left-4 right-4 md:left-auto md:w-80 z-[1000] space-y-3">
              <div className="rounded-2xl bg-white/95 p-4 shadow-2xl backdrop-blur-md border border-white/20">
                <p className="text-[10px] font-bold uppercase tracking-widest text-ink/40 mb-2">Hozirgi manzil</p>
                <p className="text-sm font-medium text-ink line-clamp-2">
                  {loading ? 'Aniqlanmoqda...' : value?.address || 'Manzil tanlanmagan'}
                </p>
              </div>

              {value && value.isInUzbekistan === false && (
                <div className="animate-in slide-in-from-top-4 duration-500 rounded-2xl bg-red-500 p-4 shadow-2xl border border-red-400 text-white">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-7.938 4h15.876c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L2.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p className="text-sm font-bold">Xatolik</p>
                      <p className="text-[11px] opacity-95 leading-tight mt-1">
                        Tanlangan manzil O&apos;zbekiston hududidan tashqarida. Buyurtma berib bo&apos;lmaydi.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {value && value.isInUzbekistan !== false && !value.isInTashkent && (
                <div className="animate-in slide-in-from-top-4 duration-500 rounded-2xl bg-amber-500 p-4 shadow-2xl border border-amber-400 text-white">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p className="text-sm font-bold">Toshkentdan tashqari hudud</p>
                      <p className="text-[11px] opacity-90 leading-tight mt-1">
                        Bu manzilda tekin dastavka mavjud emas. Kelishilgan holda chiqiladi.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleUseMyLocation}
              className="absolute bottom-8 right-8 z-[1000] flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500 text-white shadow-2xl shadow-emerald-500/40 transition hover:bg-emerald-600 hover:scale-110 active:scale-90"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
          
          <div className="p-6 border-t bg-white">
            <button
              onClick={() => setIsFullScreen(false)}
              className="btn-primary w-full py-4 text-base shadow-xl shadow-primary/20"
            >
              Tanlangan manzilni saqlash
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
