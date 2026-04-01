import type { Category } from '@/types/carpet';

export type CarpetFiltersState = {
  kind: 'carpet' | 'oval' | 'prayer';
  search: string;
  categoryId: string;
  minPrice: string;
  maxPrice: string;
  size: string;
  material: string;
};

type Props = {
  categories: Category[];
  filters: CarpetFiltersState;
  onChange: (next: CarpetFiltersState) => void;
  onApply: () => void;
  onReset: () => void;
};

export default function FilterPanel({
  categories,
  filters,
  onChange,
  onApply,
  onReset,
}: Props) {
  const sanitizeNameSearch = (value: string) =>
    value.replace(/[^\p{L}\s]+/gu, '');

  const sanitizeDigits = (value: string) => value.replace(/[^\d]+/g, '');

  const namePlaceholder =
    filters.kind === 'oval'
      ? 'Oval gilam nomi'
      : 'Gilam nomi';

  return (
    <section className="panel p-6 shadow-2xl">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onApply();
        }}
      >
        <div className="mb-6 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary/70">Qidirish parametrlari</p>
          <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent ml-6" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
          <select
            value={filters.kind}
            onChange={(event) =>
              onChange({
                ...filters,
                kind: event.target.value as CarpetFiltersState['kind'],
                categoryId: '',
              })
            }
            className="input-field md:col-span-2"
          >
            <option value="carpet">Gilamlar</option>
            <option value="oval">Oval gilamlar</option>
            <option value="prayer">Joynamozlar</option>
          </select>

          <input
            value={filters.search || ''}
            onChange={(event) =>
              onChange({ ...filters, search: sanitizeNameSearch(event.target.value) })
            }
            type="text"
            placeholder={namePlaceholder}
            className="input-field md:col-span-2"
          />

          <select
            value={filters.categoryId || ''}
            onChange={(event) => onChange({ ...filters, categoryId: event.target.value })}
            className="input-field md:col-span-2"
          >
            <option value="">Barcha turlar</option>
            {categories
              .filter(c => c.name.toLowerCase() !== 'categoryname')
              .map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
          </select>

          <input
            value={filters.material || ''}
            onChange={(event) => onChange({ ...filters, material: event.target.value })}
            type="text"
            placeholder="Material (masalan: Paxta)"
            className="input-field md:col-span-2"
          />

          <input
            value={filters.minPrice || ''}
            onChange={(event) =>
              onChange({ ...filters, minPrice: sanitizeDigits(event.target.value) })
            }
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Min narx"
            className="input-field md:col-span-2"
          />

          <input
            value={filters.maxPrice || ''}
            onChange={(event) =>
              onChange({ ...filters, maxPrice: sanitizeDigits(event.target.value) })
            }
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Max narx"
            className="input-field md:col-span-2"
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-6">
          <input
            value={filters.size || ''}
            onChange={(event) => onChange({ ...filters, size: event.target.value })}
            type="text"
            placeholder="O'lcham (masalan: 2x3)"
            className="input-field md:col-span-2"
          />
          <div className="md:col-span-2" />
          <button type="submit" className="btn-primary py-3">
            Qidirish
          </button>
          <button type="button" onClick={onReset} className="btn-secondary py-3">
            Tozalash
          </button>
        </div>
      </form>
    </section>
  );
}
