'use client';

type Props = {
  page: number;
  limit: number;
  total: number;
  loading?: boolean;
  onClick: () => void;
};

export default function LoadMoreButton({ page, limit, total, loading = false, onClick }: Props) {
  if (!total || total <= page * limit) return null;

  const start = page * limit + 1;
  const end = Math.min((page + 1) * limit, total);

  return (
    <div className="flex justify-center pt-6">
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="btn-secondary px-6 py-3 text-sm font-bold uppercase tracking-widest disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Yuklanmoqda...' : `<${start}/${end}>`}
      </button>
    </div>
  );
}
