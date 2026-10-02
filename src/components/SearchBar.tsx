import { MIN_LETRAS } from '../utils/busqueda'

type SearchBarProps = {
  query: string
  resultCount: number
  minimaAlcanzada: boolean
  onQueryChange: (query: string) => void
  onClear: () => void
}

export function SearchBar({
  query,
  resultCount,
  minimaAlcanzada,
  onQueryChange,
  onClear,
}: SearchBarProps) {
  const letras = query.trim().length
  const faltan = Math.max(0, MIN_LETRAS - letras)

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-900/5 sm:p-5 dark:border-slate-800 dark:bg-slate-950/40 dark:shadow-slate-950/60">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Buscá un medicamento</p>
          <p className="mt-1 text-xs text-slate-500">
            Por principio activo o por nombre comercial.
          </p>
        </div>
        {minimaAlcanzada && (
          <span className="shrink-0 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-950/40 dark:text-sky-100">
            {resultCount} {resultCount === 1 ? 'resultado' : 'resultados'}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor="medication-search">
          Buscar medicamento
        </label>
        <div className="relative min-w-0 flex-1">
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35m2.1-5.4a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z" />
          </svg>
          <input
            aria-describedby="search-hint"
            autoComplete="off"
            className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-sky-400 dark:focus:bg-slate-950/80 dark:focus:ring-sky-500/20"
            id="medication-search"
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Ej. ibuprofeno, paracetamol, Actron"
            type="search"
            value={query}
          />
        </div>

        <button
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={query === ''}
          onClick={onClear}
          type="button"
        >
          <svg
            aria-hidden="true"
            className="size-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
          Limpiar
        </button>
      </div>

      <p className="mt-3 text-xs text-slate-400" id="search-hint">
        {faltan > 0
          ? `Escribí ${faltan} ${faltan === 1 ? 'letra más' : 'letras más'} para buscar.`
          : 'El precio se compara entre laboratorios de una misma presentación.'}
      </p>
    </div>
  )
}
