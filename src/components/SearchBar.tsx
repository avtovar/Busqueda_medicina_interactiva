import { MIN_LETRAS } from '../utils/busqueda'
// ↑ Constante mínima de letras para buscar (3, coincide con requisito de la API CNPM)

type SearchBarProps = {
  query: string
  // ↑ Valor actual del input (controlado por padre via useState)
  minimaAlcanzada: boolean
  // ↑ true si query normalizada tiene ≥3 letras
  onQueryChange: (query: string) => void
  // ↑ Callback: padre actualiza su estado con lo que escribe el usuario
  onClear: () => void
  // ↑ Callback: padre limpia la búsqueda (setea query a '')
}

export function SearchBar({
  query,
  minimaAlcanzada,
  onQueryChange,
  onClear,
}: SearchBarProps) {
  const letras = query.trim().length
  // ↑ Longitud real del texto (sin espacios al inicio/fin)
  const faltan = Math.max(0, MIN_LETRAS - letras)
  // ↑ Cuántas letras faltan para llegar al mínimo (0 si ya alcanzó)

  return (
    <div className="mt-6">
      {/* ↑ Margin-top 1.5rem para separar del título anterior */}
      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm shadow-slate-900/5 transition focus-within:border-sky-500 focus-within:ring-4 focus-within:ring-sky-500/10 dark:border-slate-700 dark:bg-slate-900 dark:shadow-slate-950/40 dark:focus-within:border-sky-400 dark:focus-within:ring-sky-500/20">
        {/* ↑ Contenedor del input: flex para alinear icono + input + botón */}
        {/* ↑ focus-within: aplica estilos cuando CUALQUIER hijo tiene foco (input o botón) */}
        {/* ↑ Estados dark: bordes/fondos adaptados al tema oscuro */}
        <label className="sr-only" htmlFor="medication-search">
          {/* ↑ sr-only: solo visible para screen readers (accesibilidad) */}
          {/* ↑ htmlFor vincula label con input#medication-search */}
          Buscar por principio activo o nombre comercial
        </label>
        <svg
          aria-hidden="true"
          // ↑ Oculta el icono decorativo de tecnologías asistivas
          className="ml-3 size-5 shrink-0 text-slate-400"
          // ↑ ml-3: margen izquierdo 0.75rem, size-5: 20x20, shrink-0: no se encoje
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35m2.1-5.4a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z" />
          {/* ↑ Path SVG: lupa (círculo + mango) */}
        </svg>
        <input
          aria-describedby="search-hint"
          // ↑ Vincula el input con el hint (p#search-hint) para screen readers
          autoComplete="off"
          // ↑ Desactiva autocompletado del navegador (evita sugerencias no deseadas)
          className="h-12 min-w-0 flex-1 bg-transparent px-1 text-base text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
          // ↑ h-12: altura 48px (touch target), flex-1: ocupa espacio restante, min-w-0: permite encojer
          id="medication-search"
          // ↑ ID referenciado por label[htmlFor] y aria-describedby
          onChange={(event) => onQueryChange(event.target.value)}
          // ↑ En cada keystroke, notifica al padre el nuevo valor
          placeholder="Ej. ibuprofeno, paracetamol, Actron"
          type="search"
          // ↑ type="search" da semántica de búsqueda (teclado móvil optimizado, etc.)
          value={query}
          // ↑ Input controlado: React es la fuente de verdad del valor
        />
        <button
          aria-label="Limpiar búsqueda"
          // ↑ Etiqueta accesible para el botón (no hay texto visible en mobile)
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-4 focus:ring-sky-500/10 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100 dark:focus:ring-sky-500/20"
          // ↑ min-h-11: 44px touch target, shrink-0: no se encoje, estados hover/focus/disabled/dark
          disabled={query === ''}
          // ↑ Deshabilitado si no hay nada que limpiar (evita click inútil)
          onClick={onClear}
          type="button"
          // ↑ type="button" evita que envíe formulario si estuviera en uno
        >
          <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            {/* ↑ Icono X (dos líneas cruzadas) */}
          </svg>
          <span className="hidden sm:inline">Limpiar</span>
          {/* ↑ Texto "Limpiar" solo en desktop (≥640px), oculto en mobile */}
        </button>
      </div>
      <p className="mt-2.5 text-sm text-slate-500 dark:text-slate-400" id="search-hint" aria-live="polite">
        {/* ↑ Hint dinámico: id referenciado por aria-describedby del input */}
        {/* ↑ aria-live="polite": screen readers anuncian cambios cuando el usuario no está ocupado */}
        {faltan > 0
          ? `Escribí ${faltan} ${faltan === 1 ? 'letra más' : 'letras más'} para buscar.`
          : minimaAlcanzada
            ? 'El precio se compara entre laboratorios de una misma presentación.'
            : 'Escribí al menos 3 letras para buscar.'}
        {/* ↑ 3 estados del hint:
             1. Faltan letras: cuenta cuántas (pluralización correcta)
             2. Alcanzó mínimo: explica qué compara la app
             3. Por defecto: recuerda el mínimo */}
      </p>
    </div>
  )
}
