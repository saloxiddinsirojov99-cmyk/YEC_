'use client';

type Props = {
  page: number;
  limit: number;
  total: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
};

export default function Pagination({ page, limit, total, loading = false, onPageChange }: Props) {
  if (!total || total <= limit) return null;

  const totalPages = Math.ceil(total / limit);
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-center gap-3 py-8 fade-up">
      <button
        type="button"
        disabled={page <= 1 || loading}
        onClick={() => {
          onPageChange(page - 1);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        className="rounded-xl border border-sand bg-white px-4 py-3 text-lg font-bold text-ink transition-colors hover:bg-sand/50 disabled:cursor-not-allowed disabled:opacity-30"
      >
        &larr;
      </button>
      <span className="rounded-xl border border-primary/20 bg-primary/5 px-5 py-3 text-sm font-bold text-primary tracking-widest uppercase">
        {loading ? 'Yuklanmoqda...' : `${from}–${to} / ${total}`}
      </span>
      <button
        type="button"
        disabled={page >= totalPages || loading}
        onClick={() => {
          onPageChange(page + 1);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        className="rounded-xl border border-sand bg-white px-4 py-3 text-lg font-bold text-ink transition-colors hover:bg-sand/50 disabled:cursor-not-allowed disabled:opacity-30"
      >
        &rarr;
      </button>
    </div>
  );
}
