'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

export type LocationValue = {
  lat: number;
  lng: number;
  address: string;
  isInTashkent: boolean;
};

const TASHKENT_CENTER = { lat: 41.311081, lng: 69.279723 };

// Expanded bounds for Tashkent
const isInBounds = (lat: number, lng: number) =>
  lat >= 41.1 && lat <= 41.45 && lng >= 69.1 && lng <= 69.45;

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

  const applyMarker = (lat: number, lng: number, map: any) => {
    const L = (window as any).L;
    if (!L || !map) return null;

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      markerRef.current = L.marker([lat, lng]).addTo(map);
    }
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

  const selectLocation = async (lat: number, lng: number, silent = false) => {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    if (!silent) {
      setLoading(true);
      setMessage('Manzil tekshirilmoqda...');
    }

    try {
      // 1. Immediately update UI and map view
      if (mapRef.current) {
        applyMarker(lat, lng, mapRef.current);
        mapRef.current.setView([lat, lng], 17);
      }

      // 2. Default address if geocoding fails
      let addressText = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      let inTashkent = isInBounds(lat, lng);

      // 3. Try to get real address
      try {
        const data = await reverseGeocode(lat, lng);
        if (data?.display_name) addressText = data.display_name;
        if (data?.address) inTashkent = inTashkent && isAddressTashkent(data.address);
      } catch {
        // use defaults
      }

      onChange({
        lat,
        lng,
        address: addressText,
        isInTashkent: inTashkent,
      });

      // mapRef.current.setView([lat, lng], 17); was already added above.
      
      if (!silent) {
        setMessage(
          inTashkent
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
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        void selectLocation(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        setLoading(false);
        setMessage("Lokatsiyani olishda xatolik yuz berdi.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const initLeafletMap = (container: HTMLDivElement, initialValue: LocationValue | null) => {
    const L = (window as any).L;
    if (!L) return null;

    const map = L.map(container, {
      zoomControl: false,
    }).setView(
      initialValue ? [initialValue.lat, initialValue.lng] : [TASHKENT_CENTER.lat, TASHKENT_CENTER.lng],
      initialValue ? 15 : 12,
    );

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 20
    });
    
    const satelliteLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: 'Tiles &copy; Esri',
        maxZoom: 20,
      },
    );

    streetLayer.addTo(map);

    const googleStreets = L.tileLayer('http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    });

    const googleHybrid = L.tileLayer('http://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    });

    googleStreets.addTo(map);

    L.control
      .layers(
        {
          "Google Xarita": googleStreets,
          "Google Sun'iy yo'ldosh": googleHybrid,
          "Oddiy xarita": streetLayer,
        },
        undefined,
        { position: 'topright' },
      )
      .addTo(map);

    map.on('click', (event: any) => {
      const { lat, lng } = event.latlng;
      void selectLocation(lat, lng);
    });

    if (initialValue) {
      L.marker([initialValue.lat, initialValue.lng]).addTo(map);
    }

    return map;
  };

  useEffect(() => {
    if (!ready || isFullScreen || !mapContainerRef.current) return;

    const map = initLeafletMap(mapContainerRef.current, value);
    mapRef.current = map;

    // Fix white map issue by invalidating size after a short delay
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [ready, isFullScreen]);

  useEffect(() => {
    if (!ready || !isFullScreen || !fullScreenMapContainerRef.current) return;

    const map = initLeafletMap(fullScreenMapContainerRef.current, value);
    mapRef.current = map;

    // Fix white map issue
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [ready, isFullScreen]);

  return (
    <div className="space-y-4">
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />
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

      {showWarning && value && !value.isInTashkent && (
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
        <div className="fixed inset-0 z-[100] flex flex-col bg-white animate-in fade-in duration-300">
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
            
            <div className="absolute top-4 left-4 right-4 md:left-auto md:w-80 z-[1000]">
              <div className="rounded-2xl bg-white/95 p-4 shadow-2xl backdrop-blur-md border border-white/20">
                <p className="text-[10px] font-bold uppercase tracking-widest text-ink/40 mb-2">Hozirgi manzil</p>
                <p className="text-sm font-medium text-ink line-clamp-2">
                  {loading ? 'Aniqlanmoqda...' : value?.address || 'Manzil tanlanmagan'}
                </p>
                {value && !value.isInTashkent && (
                   <p className="mt-2 text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded inline-block">
                     Tashkentdan tashqari hudud
                   </p>
                )}
              </div>
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

