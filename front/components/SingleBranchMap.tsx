'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

type Props = {
  lat: number;
  lng: number;
  name: string;
  address: string;
};

export default function SingleBranchMap({ lat, lng, name, address }: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (!ready || !mapContainerRef.current) return;

    const L = (window as any).L;
    if (!L) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      scrollWheelZoom: false,
      dragging: !L.Browser.mobile,
      touchZoom: L.Browser.mobile,
    }).setView([lat, lng], 16);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const googleStreets = L.tileLayer('http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    });
    googleStreets.addTo(map);

    const showroomIcon = L.divIcon({
      className: 'custom-showroom-marker',
      html: `
        <div class="relative group">
          <div class="flex items-center justify-center w-12 h-12 bg-white rounded-full shadow-2xl border-2 border-primary overflow-hidden transition-transform group-hover:scale-110">
            <img src="/logo.png" alt="YEC" class="w-10 h-10 object-contain" />
          </div>
          <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rotate-45 transform"></div>
        </div>
      `,
      iconSize: [48, 48],
      iconAnchor: [24, 48],
    });

    const marker = L.marker([lat, lng], { icon: showroomIcon }).addTo(map);
    marker.bindPopup(`
      <div class="p-2 min-w-[150px]">
        <strong class="text-primary font-serif text-base block">${name}</strong>
        <p class="text-[11px] text-ink/70 mt-1 leading-relaxed">${address}</p>
        <a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}" 
           target="_blank" 
           class="mt-3 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-primary hover:underline font-bold">
          Yo'nalish olish ->
        </a>
      </div>
    `, {
      className: 'custom-popup',
    });

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [ready, lat, lng, name, address]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[2rem] border border-white/10 shadow-2xl backdrop-blur-md">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <style>{`
        .custom-showroom-marker {
          background: none !important;
          border: none !important;
        }
        .leaflet-container {
          cursor: grab !important;
        }
        .leaflet-container:active {
          cursor: grabbing !important;
        }
        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 1.5rem;
          padding: 8px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.15);
        }
      `}</style>
      <Script
        src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        onLoad={() => setReady(true)}
        strategy="afterInteractive"
      />
      <div ref={mapContainerRef} className="h-full w-full" />
    </div>
  );
}
