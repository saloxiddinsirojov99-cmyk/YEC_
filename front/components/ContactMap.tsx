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
    lng: 68.9952327, // Corrected from the google maps link in contact page
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
      const marker = L.marker([branch.lat, branch.lng]).addTo(map);
      marker.bindPopup(`
        <div class="p-2">
          <strong class="text-ink font-serif">${branch.name}</strong>
          <p class="text-xs text-ink/70 mt-1">${branch.description}</p>
        </div>
      `);
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
    <div className="relative h-[400px] w-full overflow-hidden rounded-[2rem] border border-white/10 shadow-2xl backdrop-blur-md">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
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
