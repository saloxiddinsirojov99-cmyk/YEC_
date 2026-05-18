'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { formatPrice, getErrorMessage } from '@/services/api';
import { formatOrderStatus } from '@/utils/format';
import { clearToken, getToken } from '@/services/auth.service';
import { getMyProfile, updateMyProfile } from '@/services/user.service';
import type { UserProfile } from '@/types/user';
import LocationPicker, { LocationValue } from '@/components/LocationPicker';

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Address / Location state
  const [location, setLocation] = useState<LocationValue | null>(null);
  // showMap: true if no saved address (empty) or when user clicks "O'zgartirish"
  const [showMap, setShowMap] = useState(false);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const hasToken = useMemo(() => (mounted ? Boolean(getToken()) : false), [mounted]);

  useEffect(() => {
    if (!hasToken) {
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        setError('');
        const data = await getMyProfile();
        setProfile(data);
        setName(data.name);
        setPhone(data.phone);
        setAvatar(data.avatar || '');
        if (data.address && data.lat && data.lng) {
          setLocation({
            lat: Number(data.lat),
            lng: Number(data.lng),
            address: data.address,
            isInTashkent: true,
          });
          // Address exists → don't show map initially
          setShowMap(false);
        } else {
          // No address → show map so user can select
          setShowMap(true);
        }
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [hasToken]);

  useEffect(() => {
    if (!profile) return;
    const changed =
      name !== (profile.name || '') ||
      phone !== (profile.phone || '') ||
      avatar !== (profile.avatar || '') ||
      location?.address !== (profile.address || undefined);
    setHasChanges(changed);
  }, [name, phone, avatar, location, profile]);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setSaving(true);
      setError('');
      setMessage('');
      await updateMyProfile({
        name,
        phone,
        avatar,
        address: location?.address,
        lat: location?.lat,
        lng: location?.lng,
      });
      setMessage("Profil ma'lumotlari yangilandi.");
      const fresh = await getMyProfile();
      setProfile(fresh);
      // After saving, if we have a location hide the map
      if (location) {
        setShowMap(false);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("Rasm hajmi 2MB dan katta bo'lmasligi kerak.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatar(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const logout = () => {
    clearToken();
    router.push('/login');
  };

  if (!hasToken) {
    return (
      <div className="section-shell py-10">
        <div className="panel max-w-xl p-6">
          <h1 className="font-serif text-3xl">Profil</h1>
          <p className="mt-2 text-sm text-ink/70">Profilni ko&apos;rish uchun avval tizimga kiring.</p>
          <Link href="/login" className="btn-primary mt-4 inline-block">
            Kirish
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute -top-32 left-1/4 h-72 w-72 rounded-full bg-sky-300/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-blue-300/20 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_60%)]" />

      <div className="section-shell space-y-6 py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-sky-200/80 bg-white/70 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.4em] text-sky-700 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.8)]" />
              Profil
            </p>
            <h1 className="mt-3 font-serif text-3xl text-premium md:text-5xl">Mening profilim</h1>
          </div>
          <button
            type="button"
            onClick={logout}
            className="rounded-full border border-red-200 bg-red-50 px-5 py-2 text-sm font-semibold text-red-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-red-100"
          >
            Profildan chiqish
          </button>
        </div>

        {loading ? <div className="h-56 animate-pulse rounded-3xl bg-white/70 shadow-sm" /> : null}

        {!loading && profile ? (
          <div className="grid gap-6 md:grid-cols-2">
            <section className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/80 p-6 shadow-[0_25px_80px_rgba(15,23,42,0.08)] backdrop-blur">
              <div className="pointer-events-none absolute -top-16 right-0 h-40 w-40 rounded-full bg-sky-200/40 blur-3xl" />
              <h2 className="font-serif text-3xl text-ink">Ma&apos;lumotlar</h2>

              <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                <div
                  className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-white bg-sand shadow-sm cursor-pointer transition-transform hover:scale-105 active:scale-95"
                  onClick={() => document.getElementById('avatar-input')?.click()}
                >
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  {avatar ? (
                    <img src={avatar} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0ea5e9&color=fff&size=200`} alt="Avatar" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="space-y-1">
                  <label htmlFor="avatar-input" className="btn-secondary inline-block cursor-pointer">
                    Rasmni o&apos;zgartirish
                  </label>
                  <input id="avatar-input" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  <p className="text-xs text-ink/50">Maks. hajm: 2MB (JPG, PNG)</p>
                </div>
              </div>

              <div className="mt-4 border-t border-black/5 pt-4">
                <p className="text-sm text-ink/70">Email: {profile.email}</p>
                {profile.role !== 'CUSTOMER' ? (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-sm text-ink/70">Rol:</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      profile.role === 'SUPERADMIN'
                        ? 'bg-purple-100 text-purple-700 border border-purple-200'
                        : profile.role === 'ADMIN'
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'bg-sand text-ink/60 border border-black/5'
                    }`}>
                      {profile.role}
                    </span>
                  </div>
                ) : null}

                <form onSubmit={save} className="mt-5 space-y-3">
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="input-field"
                    placeholder="Ism"
                    required
                  />
                  <input
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    className="input-field"
                    placeholder="+998901234567"
                    required
                  />

                  {/* Address section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-ink/50 uppercase tracking-wider">
                        Yetkazib berish manzili
                      </label>
                      {/* Show "O'zgartirish" only when address is saved and map is hidden */}
                      {location?.address && !showMap && (
                        <button
                          type="button"
                          onClick={() => setShowMap(true)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-700 transition hover:bg-sky-100 active:scale-95"
                        >
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          O&apos;zgartirish
                        </button>
                      )}
                    </div>

                    {/* Saved address preview (when map hidden) */}
                    {location?.address && !showMap && (
                      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                        <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">Saqlangan manzil</p>
                        <p className="text-sm text-emerald-900 leading-relaxed">{location.address}</p>
                      </div>
                    )}

                    {/* Map (shown when no address or when O'zgartirish clicked) */}
                    {showMap && (
                      <div className="animate-in fade-in duration-300">
                        <LocationPicker
                          value={location}
                          onChange={(next) => {
                            setLocation(next);
                            setMessage('');
                          }}
                          showWarning={!message}
                          showActionButton={true}
                        />
                      </div>
                    )}
                  </div>

                  {hasChanges && (
                    <button type="submit" disabled={saving} className="btn-primary w-full shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 sm:w-auto">
                      {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                    </button>
                  )}
                </form>
              </div>
            </section>

            <section className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/80 p-6 shadow-[0_25px_80px_rgba(15,23,42,0.08)] backdrop-blur">
              <div className="pointer-events-none absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-emerald-200/40 blur-3xl" />
              <h2 className="font-serif text-3xl text-ink">So&apos;nggi buyurtmalar</h2>
              <div className="mt-4 space-y-3">
                {profile.orders.length === 0 ? (
                  <p className="text-sm text-ink/70">Buyurtmalar hali mavjud emas.</p>
                ) : (
                  profile.orders.slice(0, 4).map((order) => (
                    <article key={order.id} className="rounded-2xl border border-black/10 bg-white/70 p-3 shadow-sm">
                      <p className="text-xs text-ink/65" suppressHydrationWarning>
                        {mounted ? new Date(order.createdAt).toLocaleString('uz-UZ') : '--'}
                      </p>
                      <p className="text-sm font-semibold">
                        Holati: <span className="text-terracotta">{formatOrderStatus(order.status)}</span>
                      </p>
                      <p className="text-xs text-ink/75">Mahsulotlar: {order.items.length} ta</p>
                      <p className="text-xs text-ink/75">
                        Jami: {formatPrice(order.items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0))}
                      </p>
                    </article>
                  ))
                )}
              </div>
              <Link
                href="/orders"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#D35400]/20 bg-[#D35400]/5 px-6 py-3 text-sm font-bold text-[#D35400] transition hover:bg-[#D35400]/10 hover:-translate-y-0.5 active:scale-95"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Barcha buyurtmalarni ko&apos;rish
              </Link>
            </section>
          </div>
        ) : null}

        {message ? (
          <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{message}</p>
        ) : null}

        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        ) : null}
      </div>
    </div>
  );
}
