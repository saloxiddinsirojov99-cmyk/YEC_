'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { api, getErrorMessage } from '@/services/api';

type Category = {
  id: string;
  name: string;
  image?: string | null;
  soldCount: number;
  _count?: { carpets: number };
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/api/v1';
const BASE_URL = API_BASE.replace('/api/v1', '');

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Edit modal
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [editName, setEditName] = useState('');
  const [editImage, setEditImage] = useState('');
  const [editUploading, setEditUploading] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const editFileRef = useRef<HTMLInputElement>(null);

  // Delete confirm modal
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3500);
  };

  const load = async () => {
    try {
      setLoading(true);
      const { data } = await api.get<Category[]>('/categories');
      setCategories(data);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      setSubmitting(true);
      setError('');
      await api.post('/categories', { name: name.trim() });
      showSuccess("Tur muvaffaqiyatli qo'shildi!");
      setName('');
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (cat: Category) => {
    setEditTarget(cat);
    setEditName(cat.name);
    setEditImage(cat.image ?? '');
  };

  const handleEditImageUpload = async (file: File) => {
    try {
      setEditUploading(true);
      const form = new FormData();
      form.append('file', file);
      const { data } = await api.post<{ url: string }>('/upload/image', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setEditImage(data.url);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setEditUploading(false);
    }
  };

  const saveEdit = async () => {
    if (!editTarget || !editName.trim()) return;
    try {
      setEditSaving(true);
      setError('');
      await api.patch(`/categories/${editTarget.id}`, {
        name: editName.trim(),
        image: editImage || undefined,
      });
      showSuccess('Kategoriya yangilandi!');
      setEditTarget(null);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setEditSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      setError('');
      await api.delete(`/categories/${deleteTarget.id}`);
      showSuccess("Kategoriya o'chirildi!");
      setDeleteTarget(null);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const carpetCount = (cat: Category) => cat._count?.carpets ?? 0;

  return (
    <div className="section-shell py-8">
      <h1 className="font-serif text-4xl text-ink">Kategoriyalar boshqaruvi</h1>

      <div className="mt-8 grid gap-8 md:grid-cols-[1fr,320px]">
        {/* List */}
        <section className="space-y-4 rounded-3xl border border-sky-100/70 bg-gradient-to-br from-white via-amber-50/50 to-sky-50/50 p-4 shadow-sm">
          <h2 className="font-serif text-2xl text-ink">Mavjud kategoriyalar</h2>
          {loading ? (
            <div className="h-[200px] animate-pulse rounded-2xl bg-sand" />
          ) : categories.length === 0 ? (
            <p className="rounded-2xl border border-sky-100 bg-white/70 p-6 text-center text-ink/60">Kategoriyalar hali mavjud emas</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {categories.map((cat) => {
                const count = carpetCount(cat);
                return (
                  <article key={cat.id} className="group relative overflow-hidden rounded-2xl border border-sky-100/80 bg-gradient-to-br from-white to-sky-50/50 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
                    {/* Image strip */}
                    <div className="h-28 w-full overflow-hidden bg-gradient-to-r from-sand/40 to-sky-100/50">
                      {cat.image ? (
                        <img src={`${BASE_URL}${cat.image}`} alt={cat.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <svg className="h-10 w-10 text-ink/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <p className="font-bold text-ink">{cat.name}</p>
                      <p className="mt-1 text-xs">
                        {count > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-sky-100 bg-sky-50 px-2 py-0.5 font-semibold text-sky-700">
                            {count} ta gilam
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-100 bg-amber-50 px-2 py-0.5 text-amber-700/80">
                            Gilam yo&apos;q
                          </span>
                        )}
                      </p>

                      <div className="mt-3 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(cat)}
                          className="flex-1 rounded-xl border border-sky-200 bg-sky-50 py-2 text-xs font-bold text-sky-700 transition hover:bg-sky-100 active:scale-95"
                        >
                          ✏️ Tahrirlash
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(cat)}
                          className="flex-1 rounded-xl border border-red-100 bg-red-50 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100 active:scale-95"
                        >
                          🗑️ O&apos;chirish
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Add form */}
        <section className="panel h-fit p-6">
          <h2 className="font-serif text-2xl text-ink">Yangi kategoriya</h2>
          <form className="mt-4 flex flex-col gap-3" onSubmit={submit}>
            <input
              type="text"
              placeholder="Tur nomi (Masalan: Eron gilamlari)"
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <button type="submit" className="btn-primary w-full" disabled={submitting}>
              {submitting ? 'Saqlanmoqda...' : "Qo'shish"}
            </button>
          </form>
        </section>
      </div>

      {/* ── Edit Modal ── */}
      {editTarget && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md overflow-hidden rounded-[2.5rem] bg-white shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="h-2 w-full bg-gradient-to-r from-sky-400 to-emerald-400" />
            <div className="p-8">
              <h3 className="font-serif text-2xl text-ink">Kategoriyani tahrirlash</h3>
              <p className="text-sm text-ink/50 mt-1">{editTarget.name}</p>

              {/* Image upload */}
              <div className="mt-6">
                <p className="text-xs font-bold uppercase tracking-widest text-ink/40 mb-2">Kategoriya rasmi</p>
                <div
                  onClick={() => editFileRef.current?.click()}
                  className="relative group h-36 w-full cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-sky-200 bg-sky-50 transition hover:border-sky-400 hover:bg-sky-100"
                >
                  {editUploading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
                    </div>
                  ) : editImage ? (
                    <img src={`${BASE_URL}${editImage}`} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sky-500">
                      <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                      </svg>
                      <p className="text-xs font-bold">Rasm yuklash (bosing)</p>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition" />
                </div>
                {editImage && (
                  <button
                    type="button"
                    onClick={() => setEditImage('')}
                    className="mt-1 text-xs text-red-500 hover:underline"
                  >
                    Rasmni olib tashlash
                  </button>
                )}
                <input
                  ref={editFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleEditImageUpload(file);
                  }}
                />
              </div>

              {/* Name */}
              <div className="mt-4">
                <p className="text-xs font-bold uppercase tracking-widest text-ink/40 mb-2">Kategoriya nomi</p>
                <input
                  className="input-field w-full"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Kategoriya nomi"
                />
              </div>

              <div className="mt-6 flex flex-col gap-2">
                <button
                  onClick={() => void saveEdit()}
                  disabled={editSaving || editUploading}
                  className="w-full py-3 rounded-2xl bg-emerald-500 text-white font-bold transition hover:bg-emerald-600 disabled:opacity-60 active:scale-95"
                >
                  {editSaving ? 'Saqlanmoqda...' : '✅ Saqlash'}
                </button>
                <button
                  onClick={() => setEditTarget(null)}
                  className="w-full py-3 rounded-2xl bg-slate-100 text-slate-600 font-bold transition hover:bg-slate-200"
                >
                  Bekor qilish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm overflow-hidden rounded-[2.5rem] bg-white shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="h-2 w-full bg-red-500" />
            <div className="p-8 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h4 className="font-serif text-2xl text-ink">O&apos;chirishni tasdiqlang</h4>
              <p className="mt-3 text-sm text-ink/60">
                <strong>&ldquo;{deleteTarget.name}&rdquo;</strong> kategoriyasini o&apos;chirmoqchimisiz?
              </p>

              {carpetCount(deleteTarget) > 0 && (
                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-700 text-left">
                  ⚠️ Bu kategoriyada <strong>{carpetCount(deleteTarget)} ta gilam</strong> bor!
                  Avval gilamlarni boshqa kategoriyaga o&apos;tkazing yoki o&apos;chiring.
                </div>
              )}

              <div className="mt-6 flex flex-col gap-2">
                {carpetCount(deleteTarget) === 0 ? (
                  <button
                    onClick={() => void confirmDelete()}
                    disabled={deleting}
                    className="w-full py-3 rounded-2xl bg-red-600 text-white font-bold transition hover:bg-red-700 disabled:opacity-60 active:scale-95"
                  >
                    {deleting ? "O'chirilmoqda..." : "Ha, o'chirish"}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      const target = deleteTarget;
                      setDeleteTarget(null);
                      openEdit(target);
                    }}
                    className="w-full py-3 rounded-2xl bg-sky-500 text-white font-bold transition hover:bg-sky-600 active:scale-95"
                  >
                    ✏️ Nomini / rasmini o&apos;zgartirish
                  </button>
                )}
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="w-full py-3 rounded-2xl bg-slate-100 text-slate-600 font-bold transition hover:bg-slate-200"
                >
                  Bekor qilish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Toasts ── */}
      {success && (
        <div className="fixed bottom-6 right-6 z-[20000] rounded-2xl border border-green-200 bg-green-50 px-6 py-4 shadow-xl animate-in slide-in-from-bottom-4">
          <p className="font-bold text-green-800">✅ {success}</p>
        </div>
      )}
      {error && (
        <div className="fixed bottom-6 right-6 z-[20000] rounded-2xl border border-red-200 bg-red-50 px-6 py-4 shadow-xl animate-in slide-in-from-bottom-4">
          <p className="font-bold text-red-800">❌ {error}</p>
          <button onClick={() => setError('')} className="text-xs text-red-500 mt-1 hover:underline">Yopish</button>
        </div>
      )}
    </div>
  );
}
