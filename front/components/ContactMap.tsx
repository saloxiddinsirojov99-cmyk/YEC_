'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

type Branch = {
  name: string;
  lat: number;
  lng: number;
  description: string;
};

const BRANCHES: Branch[] = [
  {
    name: '1. Olim Polvon filiali',
    lat: 41.2294433,
    lng: 69.1730268,
    description: 'Toshkent halqa yoʻli, Olim Polvon bozori roʻparasida',
  },
  {
    name: '2. Algoritim filiali',
    lat: 41.2621776,
    lng: 69.147668,
    description: 'Samarqand Darvoza koʻchasi, Algoritim daxasi',
  },
];

export default function ContactMap() {
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
    }).setView([41.26, 69.15], 11);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const googleStreets = L.tileLayer('http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    });
    googleStreets.addTo(map);

    BRANCHES.forEach((branch) => {
      const showroomIcon = L.divIcon({
        className: 'custom-showroom-marker',
        html: `
          <div class="relative group">
            <div class="flex items-center justify-center w-10 h-10 bg-white rounded-full shadow-lg border-2 border-primary overflow-hidden transition-transform group-hover:scale-110">
              <img src="/logo.png" alt="YEC" class="w-8 h-8 object-contain" />
            </div>
            <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rotate-45 transform"></div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
      });

      const marker = L.marker([branch.lat, branch.lng], { icon: showroomIcon }).addTo(map);
      marker.bindPopup(`
        <div class="p-2 min-w-[150px]">
          <strong class="text-primary font-serif text-base block">${branch.name}</strong>
          <p class="text-[11px] text-ink/70 mt-1 leading-relaxed">${branch.description}</p>
          <a href="https://www.google.com/maps/dir/?api=1&destination=${branch.lat},${branch.lng}" 
             target="_blank" 
             class="mt-3 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-primary hover:underline">
            Yo'nalish olish ->
          </a>
        </div>
      `, {
        className: 'custom-popup',
      });
    });

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [ready]);

  return (
    <div className="relative h-[450px] w-full overflow-hidden rounded-[2.5rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.15)] backdrop-blur-md">
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
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .custom-popup .leaflet-popup-tip {
          box-shadow: none;
        }
      `}</style>
      <Script
        src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        onLoad={() => setReady(true)}
        strategy="afterInteractive"
      />
      <div ref={mapContainerRef} className="h-full w-full" />
      <div className="absolute top-4 left-4 z-[1000] hidden md:block">
        <div className="rounded-2xl bg-white/90 p-4 shadow-xl backdrop-blur-md border border-white/20 max-w-xs">
          <p className="text-[10px] font-bold uppercase tracking-widest text-ink/40 mb-2">Filiallarimiz</p>
          <div className="space-y-3">
            {BRANCHES.map(b => (
              <div key={b.name} className="flex flex-col">
                <span className="text-sm font-bold text-ink">{b.name}</span>
                <span className="text-xs text-ink/60">{b.description}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
