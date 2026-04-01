import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">404</p>
      <h1 className="text-3xl font-semibold text-slate-900">Sahifa topilmadi</h1>
      <p className="text-sm text-slate-600">
        Siz izlayotgan sahifa mavjud emas yoki o'chirilgan bo'lishi mumkin.
      </p>
      <Link
        href="/"
        className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        Bosh sahifaga qaytish
      </Link>
    </div>
  );
}
