import type { Category } from '@/types/carpet';

export type CarpetFiltersState = {
  kind: 'carpet' | 'oval' | 'prayer';
  search: string;
  categoryId: string;
  minPrice: string;
  maxPrice: string;
  size: string;
  material: string;
  sortBy: string;
};

type Props = {
  categories: Category[];
  filters: CarpetFiltersState;
  onChange: (next: CarpetFiltersState) => void;
  onReset: () => void;
};

export default function FilterPanel({
  categories,
  filters,
  onChange,
  onReset,
}: Props) {
  const sanitizeNameSearch = (value: string) =>
    value.replace(/[^\p{L}\p{N}\s-]+/gu, '');

  const sanitizeDigits = (value: string) => value.replace(/[^\d]+/g, '');

  const namePlaceholder =
    filters.kind === 'oval'
      ? 'Oval gilam nomi'
      : 'Gilam nomi';

  return (
    <section className="panel p-3 sm:p-4 md:p-6 shadow-2xl">
      <form
        onSubmit={(event) => {
          event.preventDefault();
        }}
      >
        <div className="mb-3 flex items-center justify-between md:mb-6">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary/70">Qidirish parametrlari</p>
          <div className="ml-4 h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent md:ml-6" />
        </div>
        
        {/* Main Grid for Filter Inputs - 3 columns on desktop for perfect reflow */}
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3 md:gap-4">
          <select
            value={filters.kind}
            onChange={(event) =>
              onChange({
                ...filters,
                kind: event.target.value as CarpetFiltersState['kind'],
                categoryId: '',
              })
            }
            className="input-field md:col-span-1"
          >
            <option value="carpet">Gilamlar</option>
            <option value="oval">Oval gilamlar</option>
            <option value="prayer">Joynamozlar</option>
          </select>

          <select
            value={filters.sortBy || 'standard'}
            onChange={(event) => onChange({ ...filters, sortBy: event.target.value })}
            className="input-field md:col-span-1 font-bold text-slate-700 bg-white cursor-pointer"
          >
            <option value="standard">Standart / Oxirgilari</option>
            <option value="popular">Mashhurlar (Saralangan)</option>
            <option value="price_desc">Qimmatdan arzonga</option>
            <option value="price_asc">Arzondan qimmatga</option>
          </select>

          {filters.kind === 'carpet' ? (
            <select
              value={filters.categoryId || ''}
              onChange={(event) => onChange({ ...filters, categoryId: event.target.value })}
              className="input-field md:col-span-1"
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
          ) : null}

          <input
            value={filters.search || ''}
            onChange={(event) =>
              onChange({ ...filters, search: sanitizeNameSearch(event.target.value) })
            }
            type="text"
            placeholder={namePlaceholder}
            className="input-field hidden md:block md:col-span-1"
          />

          <input
            value={filters.material || ''}
            onChange={(event) => onChange({ ...filters, material: event.target.value })}
            type="text"
            placeholder="Material (masalan: Paxta)"
            className="input-field hidden md:block md:col-span-1"
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
            className="input-field hidden md:block md:col-span-1"
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
            className="input-field hidden md:block md:col-span-1"
          />

          <input
            value={filters.size || ''}
            onChange={(event) => onChange({ ...filters, size: event.target.value })}
            type="text"
            placeholder="O'lcham (masalan: 2x3)"
            className="input-field hidden md:block md:col-span-1"
          />

          <button
            type="button"
            onClick={onReset}
            className="btn-secondary py-2.5 text-sm md:col-span-1 md:py-3 md:text-base"
          >
            Tozalash
          </button>
        </div>

        <details className="mt-2 rounded-xl border border-black/10 bg-white/60 p-3 md:hidden">
          <summary className="cursor-pointer list-none text-[11px] font-bold uppercase tracking-[0.2em] text-ink/70">
            Qo&apos;shimcha filtrlar
          </summary>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <input
              value={filters.search || ''}
              onChange={(event) =>
                onChange({ ...filters, search: sanitizeNameSearch(event.target.value) })
              }
              type="text"
              placeholder={namePlaceholder}
              className="input-field col-span-2"
            />

            <input
              value={filters.material || ''}
              onChange={(event) => onChange({ ...filters, material: event.target.value })}
              type="text"
              placeholder="Material"
              className="input-field col-span-2"
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
              className="input-field"
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
              className="input-field"
            />
            <input
              value={filters.size || ''}
              onChange={(event) => onChange({ ...filters, size: event.target.value })}
              type="text"
              placeholder="O'lcham (masalan: 2x3)"
              className="input-field col-span-2"
            />
          </div>
        </details>
      </form>
    </section>
  );
}
