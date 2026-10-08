import { MIN_LETRAS } from '../utils/busqueda'

type SearchBarProps = {
  query: string
  minimaAlcanzada: boolean
  onQueryChange: (query: string) => void
  onClear: () => void
}

export function SearchBar({
  query,
  minimaAlcanzada,
  onQueryChange,
  onClear,
}: SearchBarProps) {
  const letras = query.trim().length
  const faltan = Math.max(0, MIN_LETRAS - letras)

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm shadow-slate-900/5 transition focus-within:border-sky-500 focus-within:ring-4 focus-within:ring-sky-500/10 dark:border-slate-700 dark:bg-slate-900 dark:shadow-slate-950/40 dark:focus-within:border-sky-400 dark:focus-within:ring-sky-500/20">
        <label className="sr-only" htmlFor="medication-search">
          Buscar por principio activo o nombre comercial
        </label>
        <svg
          aria-hidden="true"
          className="ml-3 size-5 shrink-0 text-slate-400"
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
          className="h-12 min-w-0 flex-1 bg-transparent px-1 text-base text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus-visible:outline-sky-300"
          id="medication-search"
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Ej. ibuprofeno, paracetamol, Actron"
          type="search"
          value={query}
        />
        <button
          aria-label="Limpiar búsqueda"
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100 dark:focus-visible:outline-sky-300"
          disabled={query === ''}
          onClick={onClear}
          type="button"
        >
          <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
          <span className="hidden sm:inline">Limpiar</span>
        </button>
      </div>
      <p className="mt-2.5 text-sm text-slate-500 dark:text-slate-400" id="search-hint" aria-live="polite">
        {faltan > 0
          ? `Escribí ${faltan} ${faltan === 1 ? 'letra más' : 'letras más'} para buscar.`
          : minimaAlcanzada
            ? 'El precio se compara entre laboratorios de una misma presentación.'
            : 'Escribí al menos 3 letras para buscar.'}
      </p>
    </div>
  )
}